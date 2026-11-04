/** Membaca gambar lalu mengecilkannya (sisi terpanjang 900px, JPEG) agar dokumen Firestore (maks. 1 MB) aman. */
export function readImageCompressed(file: File, maxDim = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Bukan gambar'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });
}

/** Kompres foto/logo (rasio dijaga) agar kecil di dokumen Firestore. PNG tetap PNG supaya transparansi tidak hilang. */
export function compressPhoto(file: File, maxWidth = 380, maxHeight = 420, quality = 0.86): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Bukan gambar'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });
}

/** Hapus latar potret otomatis (flood-fill dari tepi, dari PUBGM-CRP). Hasil PNG transparan. */
interface RemoveBgOptions {
  /** Color tolerance (10 - 90). Default: 36 */
  tolerance?: number;
  /** Optional normalized (0..1) coordinates clicked by user to erase specific background regions */
  samplePoints?: { x: number; y: number }[];
  /** Feather edge softness (1 - 6). Default: 2 */
  feather?: number;
}

/**
 * Smart client-side portrait background remover using border-seeded flood-fill,
 * perceptual RGB color distance, portrait-core silhouette protection, and soft edge alpha feathering.
 * Outputs a transparent PNG data URL ready for the PMWC #1 Spotlight Banner.
 */
export function removeBackground(
  sourceDataUrl: string,
  options: RemoveBgOptions = {}
): Promise<string> {
  const tolerance = options.tolerance ?? 36;
  const samplePoints = options.samplePoints ?? [];
  const feather = options.feather ?? 2;

  return new Promise((resolve, reject) => {
    if (!sourceDataUrl) {
      reject(new Error('Tidak ada foto untuk dihapus background-nya'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Gagal memuat gambar untuk hapus background'));
    img.onload = () => {
      const maxW = 420;
      const maxH = 480;
      let w = img.width || 320;
      let h = img.height || 360;
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.max(1, Math.round(w * ratio));
        h = Math.max(1, Math.round(h * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Perceptual color distance helper
      const colorDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        const rmean = (r1 + r2) * 0.5;
        const dr = r1 - r2;
        const dg = g1 - g2;
        const db = b1 - b2;
        return Math.sqrt(
          (2 + rmean / 256) * dr * dr +
            4 * dg * dg +
            (2 + (255 - rmean) / 256) * db * db
        ) * 0.52;
      };

      // 1. Collect seed background palette from outer edges (top, upper-left, upper-right) + user sample points
      interface RgbSample {
        r: number;
        g: number;
        b: number;
        isUserPoint?: boolean;
      }
      const bgPalette: RgbSample[] = [];

      const addSampleAt = (px: number, py: number, isUserPoint = false) => {
        const cx = Math.max(0, Math.min(w - 1, Math.round(px)));
        const cy = Math.max(0, Math.min(h - 1, Math.round(py)));
        const idx = (cy * w + cx) * 4;
        if (data[idx + 3] < 25) return; // already transparent
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Avoid adding duplicate colors
        const exists = bgPalette.some(
          (s) => colorDist(r, g, b, s.r, s.g, s.b) < (isUserPoint ? 6 : 12)
        );
        if (!exists || isUserPoint) {
          bgPalette.push({ r, g, b, isUserPoint });
        }
      };

      // Top edge samples
      const stepX = Math.max(2, Math.floor(w / 24));
      for (let x = 0; x < w; x += stepX) {
        addSampleAt(x, 1);
        addSampleAt(x, 4);
      }
      // Left & Right edge samples (down to 80% height so shoulders at bottom aren't sampled as BG)
      const maxEdgeY = Math.floor(h * 0.8);
      const stepY = Math.max(2, Math.floor(h / 24));
      for (let y = 0; y < maxEdgeY; y += stepY) {
        addSampleAt(1, y);
        addSampleAt(4, y);
        addSampleAt(w - 2, y);
        addSampleAt(w - 5, y);
      }

      // User-clicked Magic Wand sample points
      for (const pt of samplePoints) {
        addSampleAt(pt.x * (w - 1), pt.y * (h - 1), true);
      }

      if (bgPalette.length === 0) {
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // 2. Flood-fill from borders and user sample points
      const totalPixels = w * h;
      const visited = new Uint8Array(totalPixels);
      const isBg = new Uint8Array(totalPixels);
      const queue = new Int32Array(totalPixels);
      let qHead = 0;
      let qTail = 0;

      const enqueue = (px: number, py: number) => {
        if (px < 0 || px >= w || py < 0 || py >= h) return;
        const pIdx = py * w + px;
        if (visited[pIdx]) return;
        visited[pIdx] = 1;
        queue[qTail++] = pIdx;
      };

      // Seed top border
      for (let x = 0; x < w; x++) {
        enqueue(x, 0);
      }
      // Seed left and right borders down to 88% height
      const seedMaxY = Math.floor(h * 0.88);
      for (let y = 0; y < seedMaxY; y++) {
        enqueue(0, y);
        enqueue(w - 1, y);
      }
      // Seed user-clicked sample points
      for (const pt of samplePoints) {
        const ux = Math.max(0, Math.min(w - 1, Math.round(pt.x * (w - 1))));
        const uy = Math.max(0, Math.min(h - 1, Math.round(pt.y * (h - 1))));
        const pIdx = uy * w + ux;
        visited[pIdx] = 0;
        enqueue(ux, uy);
      }

      const minPaletteDist = (r: number, g: number, b: number): { dist: number; userMatch: boolean } => {
        let best = 9999;
        let userMatch = false;
        for (let i = 0; i < bgPalette.length; i++) {
          const s = bgPalette[i];
          const d = colorDist(r, g, b, s.r, s.g, s.b);
          if (d < best) {
            best = d;
            userMatch = !!s.isUserPoint;
          }
        }
        return { dist: best, userMatch };
      };

      // Center portrait silhouette protection ellipse (head + torso core)
      const coreCx = w * 0.5;
      const coreCy = h * 0.62;
      const coreRx = w * 0.25;
      const coreRy = h * 0.35;

      while (qHead < qTail) {
        const curr = queue[qHead++];
        const cx = curr % w;
        const cy = (curr - cx) / w;
        const dIdx = curr * 4;

        if (data[dIdx + 3] < 20) {
          isBg[curr] = 1;
        } else {
          const r = data[dIdx];
          const g = data[dIdx + 1];
          const b = data[dIdx + 2];

          const { dist, userMatch } = minPaletteDist(r, g, b);

          // Check if inside portrait core protection zone
          const normX = (cx - coreCx) / coreRx;
          const normY = (cy - coreCy) / coreRy;
          const inCore = normX * normX + normY * normY < 1.0;

          const effectiveTol = userMatch
            ? tolerance * 1.45
            : inCore
              ? tolerance * 0.72
              : tolerance * 1.25;

          if (dist <= effectiveTol) {
            isBg[curr] = 1;
          }
        }

        if (isBg[curr]) {
          if (cx > 0) enqueue(cx - 1, cy);
          if (cx + 1 < w) enqueue(cx + 1, cy);
          if (cy > 0) enqueue(cx, cy - 1);
          if (cy + 1 < h) enqueue(cx, cy + 1);
        }
      }

      // 3. Compute smooth alpha mask with soft edge feathering
      const alphaMap = new Uint8ClampedArray(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const dIdx = i * 4;
        const origA = data[dIdx + 3];
        if (origA === 0 || isBg[i]) {
          alphaMap[i] = 0;
        } else {
          // Check if neighbor is background for soft anti-aliased edge ramp
          const cx = i % w;
          const cy = (i - cx) / w;
          const touchesBg =
            (cx > 0 && isBg[i - 1]) ||
            (cx + 1 < w && isBg[i + 1]) ||
            (cy > 0 && isBg[i - w]) ||
            (cy + 1 < h && isBg[i + w]);

          if (touchesBg) {
            const { dist } = minPaletteDist(data[dIdx], data[dIdx + 1], data[dIdx + 2]);
            const ramp = Math.min(1, Math.max(0.15, (dist - tolerance * 0.85) / (tolerance * 0.65 + 8)));
            alphaMap[i] = Math.round(origA * ramp);
          } else {
            alphaMap[i] = origA;
          }
        }
      }

      // Optional 3x3 feather pass along boundary pixels
      const passes = Math.max(1, Math.min(4, feather));
      let currentAlpha = alphaMap;
      for (let p = 0; p < passes; p++) {
        const nextAlpha = new Uint8ClampedArray(currentAlpha);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const a = currentAlpha[idx];
            // Only smooth boundary region
            const hasZeroNeighbor =
              currentAlpha[idx - 1] === 0 ||
              currentAlpha[idx + 1] === 0 ||
              currentAlpha[idx - w] === 0 ||
              currentAlpha[idx + w] === 0;
            if (a > 0 && hasZeroNeighbor) {
              const sum =
                currentAlpha[idx - w - 1] +
                currentAlpha[idx - w] * 2 +
                currentAlpha[idx - w + 1] +
                currentAlpha[idx - 1] * 2 +
                currentAlpha[idx] * 4 +
                currentAlpha[idx + 1] * 2 +
                currentAlpha[idx + w - 1] +
                currentAlpha[idx + w] * 2 +
                currentAlpha[idx + w + 1];
              nextAlpha[idx] = Math.round(sum / 16);
            }
          }
        }
        currentAlpha = nextAlpha;
      }

      for (let i = 0; i < totalPixels; i++) {
        data[i * 4 + 3] = currentAlpha[i];
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = sourceDataUrl;
  });
}

/** Ubah gambar ke WebP (transparansi tetap) agar foto hasil hapus-latar kecil; browser tanpa WebP otomatis jatuh ke PNG. */
export function toWebp(dataUrl: string, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d')!.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/webp', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
