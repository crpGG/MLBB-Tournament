export const WALLPAPERS = Array.from({ length: 10 }, (_, i) => `/assets/login/bg${i + 1}.jpg`);
const KEY = 'wallpaper';

/** Satu wallpaper per sesi tab: dipakai sebagai latar aplikasi. */
export function sessionWallpaper(): string {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && WALLPAPERS.includes(saved)) return saved;
    const pick = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
    sessionStorage.setItem(KEY, pick);
    return pick;
  } catch {
    return WALLPAPERS[0];
  }
}

/** Urutan acak; elemen pertama tidak sama dengan `last` supaya tidak berulang berurutan. */
export function shuffledWallpapers(last?: string): string[] {
  const a = [...WALLPAPERS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a[0] === last) [a[0], a[1]] = [a[1], a[0]];
  return a;
}
