import type { Match, Player, Team, Tournament, TournamentRegistration } from '../types/tournament';
import { calculateStandings, getChampion } from './bracketEngine';

export const POSTER_W = 1080;
export const POSTER_H = 1350;

export interface PosterTheme {
  id: string; label: string; bg1: string; bg2: string; accent: string; text: string;
  panel: string; panel2: string; ptext: string; dark: string; bar: string; barText: string; glow: string;
}
const T = (id: string, label: string, bg1: string, bg2: string, accent: string, panel: string, panel2: string, dark: string, text = '#FFFFFF'): PosterTheme =>
  ({ id, label, bg1, bg2, accent, text, panel, panel2, ptext: '#FFFFFF', dark, bar: '#FFFFFF', barText: dark, glow: accent });
export const POSTER_THEMES: PosterTheme[] = [
  T('violet', 'Ungu Galaxy', '#12062E', '#3A1596', '#FF5FA8', '#5B2BC4', '#3B1E8C', '#1A0B3D'),
  T('gold', 'Gelap ArenaDawn', '#0B1120', '#1B2A4E', '#F5B93A', '#243763', '#16213A', '#0B1120'),
  T('crimson', 'Crimson Night', '#14060A', '#4A0D18', '#FF3B57', '#7A1A2E', '#4A0D18', '#14060A'),
  T('cyan', 'Cyan Neon', '#021A22', '#06404F', '#22D3EE', '#0E6A80', '#08414F', '#021A22'),
  T('terang', 'Terang Esports', '#F1F4F9', '#D5DDEB', '#E63946', '#1F2430', '#2F3646', '#0F1115', '#0F1115'),
];

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Peringkat 1-3 (id pendaftaran): final/Lower Final/juara 3 untuk gugur, klasemen untuk liga. */
export function getPodium(t: Tournament, matches: Match[], regs: TournamentRegistration[]): (string | null)[] {
  if (t.bracketFormat.includes('round_robin')) {
    const done = matches.length > 0 && matches.every((m) => m.status === 'completed');
    const s = done ? calculateStandings(regs, matches) : [];
    return [0, 1, 2].map((i) => s[i]?.registrationId ?? null);
  }
  const champ = getChampion(t, matches, regs);
  const loserOf = (m?: Match) =>
    m && m.status === 'completed' && m.winnerRegistrationId
      ? [m.teamARegistrationId, m.teamBRegistrationId].find((id) => id && id !== m.winnerRegistrationId) ?? null
      : null;
  const gfs = matches.filter((m) => m.stage === 'grand_final' && !m.skipped).sort((a, b) => a.matchOrder - b.matchOrder);
  const last = gfs[gfs.length - 1];
  const second = champ ? (last?.status === 'completed' ? loserOf(last) : null) : null;
  const tp = matches.find((m) => m.stage === 'third_place');
  const lowerFinal = matches.filter((m) => m.stage === 'lower').sort((a, b) => b.roundNumber - a.roundNumber)[0];
  const third = tp ? (tp.status === 'completed' ? tp.winnerRegistrationId : null) : loserOf(lowerFinal);
  return [champ, second, third];
}

export type Imgs = Record<string, string>; // url asli -> data URL (kosong = pakai url asli)
export const href = (src: string | undefined, imgs: Imgs) => (src ? imgs[src] ?? src : '');

const frame = (th: PosterTheme, t: Tournament, kicker: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${POSTER_W} ${POSTER_H}" font-family="Arial, Helvetica, sans-serif">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${th.bg2}"/><stop offset="1" stop-color="${th.bg1}"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.accent}"/><stop offset="1" stop-color="#ffffff" stop-opacity=".85"/></linearGradient>
</defs>
<rect width="${POSTER_W}" height="${POSTER_H}" fill="url(#bg)"/>
<circle cx="900" cy="150" r="380" fill="${th.accent}" opacity=".07"/>
<circle cx="120" cy="1250" r="320" fill="${th.accent}" opacity=".07"/>
<rect x="30" y="30" width="${POSTER_W - 60}" height="${POSTER_H - 60}" rx="28" fill="none" stroke="${th.accent}" stroke-width="3" opacity=".7"/>
<text x="540" y="110" text-anchor="middle" font-size="34" font-weight="700" letter-spacing="8" fill="${th.accent}">${esc(kicker)}</text>
<text x="540" y="170" text-anchor="middle" font-size="${t.name.length > 28 ? 36 : 46}" font-weight="900" fill="${th.text}">${esc(t.name.toUpperCase())}</text>
${body}
<text x="540" y="1290" text-anchor="middle" font-size="26" fill="${th.text}" opacity=".7">${esc(t.organizer || '')}${t.prizePool ? ' · Hadiah ' + esc(t.prizePool) : ''}</text>
</svg>`;

const circleImg = (src: string, cx: number, cy: number, r: number, id: string, th: PosterTheme, fallback: string) =>
  src
    ? `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><image href="${esc(src)}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${th.accent}" stroke-width="5"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${th.bg1}" stroke="${th.accent}" stroke-width="5"/><text x="${cx}" y="${cy + r * 0.28}" text-anchor="middle" font-size="${r * 0.8}" font-weight="900" fill="${th.accent}">${esc(fallback.slice(0, 3).toUpperCase())}</text>`;

const PLACE = [
  { label: 'CHAMPIONS', icon: '🏆', color: '#F5C542' },
  { label: 'RUNNER UP', icon: '🥈', color: '#D5DBE5' },
  { label: 'THIRD PLACE', icon: '🥉', color: '#D98B4F' },
];

export function podiumPoster(
  th: PosterTheme, t: Tournament, place: 1 | 2 | 3, reg: TournamentRegistration | undefined,
  team: Team | undefined, players: Player[], imgs: Imgs
): string {
  const P = PLACE[place - 1];
  const name = reg ? reg.teamName : 'Belum ditentukan';
  const roster = players.slice(0, 7);
  const n = Math.max(roster.length, 1);
  const r = n > 5 ? 78 : 92;
  const gap = (POSTER_W - 160) / n;
  const faces = roster
    .map((p, i) => {
      const cx = 80 + gap * i + gap / 2;
      return circleImg(href(p.photo, imgs), cx, 1030, r, `pf${i}`, th, p.nickname) +
        `<text x="${cx}" y="${1030 + r + 40}" text-anchor="middle" font-size="26" font-weight="800" fill="${th.text}">${esc(p.nickname.slice(0, 12))}</text>`;
    })
    .join('');
  const body = `
<text x="540" y="330" text-anchor="middle" font-size="${P.label.length > 9 ? 110 : 140}" font-weight="900" fill="${P.color}">${P.label}</text>
<text x="540" y="400" text-anchor="middle" font-size="64">${P.icon}</text>
${circleImg(href(team?.logo, imgs), 540, 600, 150, 'tl', th, reg?.teamTag || '?')}
<text x="540" y="840" text-anchor="middle" font-size="${name.length > 18 ? 56 : 76}" font-weight="900" fill="${th.text}">${esc(name.toUpperCase())}</text>
${reg ? `<text x="540" y="890" text-anchor="middle" font-size="30" fill="${th.accent}" letter-spacing="6">[${esc(reg.teamTag)}]</text>` : ''}
${faces}`;
  return frame(th, t, 'MOBILE LEGENDS: BANG BANG', body);
}

export interface MvpData { player?: Player; team?: Team; teamName: string; mvpCount: number; kda: string; rating: string; matches: number }

export function mvpPoster(th: PosterTheme, t: Tournament, d: MvpData, imgs: Imgs): string {
  const nick = d.player ? d.player.nickname : 'Belum ada data';
  const stat = (x: number, label: string, v: string) =>
    `<rect x="${x}" y="1010" width="280" height="150" rx="20" fill="${th.bg1}" stroke="${th.accent}" stroke-width="2"/><text x="${x + 140}" y="1090" text-anchor="middle" font-size="56" font-weight="900" fill="${th.accent}">${esc(v)}</text><text x="${x + 140}" y="1135" text-anchor="middle" font-size="24" fill="${th.text}" opacity=".8">${label}</text>`;
  const body = `
<text x="540" y="320" text-anchor="middle" font-size="150" font-weight="900" fill="url(#gold)">MVP</text>
${circleImg(href(d.player?.photo, imgs), 540, 600, 230, 'mv', th, nick)}
<text x="540" y="920" text-anchor="middle" font-size="${nick.length > 12 ? 70 : 96}" font-weight="900" fill="${th.text}">${esc(nick.toUpperCase())}</text>
<text x="540" y="965" text-anchor="middle" font-size="30" fill="${th.accent}" letter-spacing="4">${esc(d.teamName.toUpperCase())}</text>
${stat(80, 'KDA', d.kda)}${stat(400, 'RATING', d.rating)}${stat(720, 'MVP GAME', String(d.mvpCount))}`;
  return frame(th, t, 'MOST VALUABLE PLAYER', body);
}

export function schedulePoster(
  th: PosterTheme, t: Tournament, matches: Match[], regs: TournamentRegistration[], title: string
): string {
  const nm = (id: string | null) => regs.find((r) => r.id === id)?.teamTag || 'TBD';
  const list = matches.filter((m) => !m.skipped).sort((a, b) => (a.scheduledDate + a.scheduledTime).localeCompare(b.scheduledDate + b.scheduledTime) || a.matchOrder - b.matchOrder);
  const perPage = 11;
  const shown = list.slice(0, perPage);
  const rowH = 90;
  const rows = shown
    .map((m, i) => {
      const y = 250 + i * rowH;
      const d = m.scheduledDate ? m.scheduledDate.slice(5).split('-').reverse().join('/') : '';
      return `<rect x="70" y="${y}" width="940" height="${rowH - 12}" rx="14" fill="${th.bg1}" opacity=".85" stroke="${th.accent}" stroke-opacity=".35"/>
<text x="100" y="${y + 36}" font-size="24" font-weight="800" fill="${th.accent}">${esc(d)} · ${esc(m.scheduledTime)}</text>
<text x="100" y="${y + 64}" font-size="20" fill="${th.text}" opacity=".7">${esc(m.roundName)} · BO${m.bestOf}</text>
<text x="650" y="${y + 52}" text-anchor="end" font-size="34" font-weight="900" fill="${th.text}">${esc(nm(m.teamARegistrationId))}</text>
<text x="705" y="${y + 52}" text-anchor="middle" font-size="24" font-weight="900" fill="${th.accent}">VS</text>
<text x="760" y="${y + 52}" font-size="34" font-weight="900" fill="${th.text}">${esc(nm(m.teamBRegistrationId))}</text>`;
    })
    .join('');
  const more = list.length > perPage ? `<text x="540" y="${250 + perPage * rowH + 20}" text-anchor="middle" font-size="24" fill="${th.text}" opacity=".7">+${list.length - perPage} laga lainnya</text>` : '';
  const empty = list.length === 0 ? `<text x="540" y="500" text-anchor="middle" font-size="32" fill="${th.text}" opacity=".7">Belum ada jadwal</text>` : '';
  return frame(th, t, title, rows + more + empty);
}

/** Ubah gambar remote jadi data URL agar bisa dirender ke canvas; gagal = gambar dilewati. */
export async function inlineImages(urls: (string | undefined)[]): Promise<Imgs> {
  const out: Imgs = {};
  await Promise.all(
    urls.filter((u): u is string => !!u && !u.startsWith('data:')).map(async (u) => {
      try {
        const blob = await (await fetch(u)).blob();
        out[u] = await new Promise<string>((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result as string);
          fr.onerror = rej;
          fr.readAsDataURL(blob);
        });
      } catch {
        out[u] = '';
      }
    })
  );
  return out;
}

let fontCss: Promise<string> | null = null;
/** Huruf poster ditanam ke SVG (data URI) karena gambar SVG tidak bisa memakai huruf halaman. Gagal = pakai huruf cadangan. */
function embeddedFonts(): Promise<string> {
  fontCss ||= (async () => {
    try {
      const css = await (await fetch('https://fonts.googleapis.com/css2?family=Anton&family=Rajdhani:wght@500;600;700&display=swap')).text();
      const blocks = css.split('/* ').filter((b) => b.startsWith('latin */'));
      const out = await Promise.all(blocks.map(async (b) => {
        const m = /url\((https:[^)]+)\)/.exec(b);
        if (!m) return '';
        const blob = await (await fetch(m[1])).blob();
        const data = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.onerror = rej; fr.readAsDataURL(blob); });
        return b.slice(b.indexOf('@font-face')).replace(m[0], `url(${data})`);
      }));
      return out.join('\n');
    } catch {
      return '';
    }
  })();
  return fontCss;
}

export async function exportJpeg(svg: string, filename: string, w = POSTER_W, h = POSTER_H) {
  const fonts = await embeddedFonts();
  if (fonts) svg = svg.replace(/(<svg[^>]*>)/, `$1<style>${fonts}</style>`);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('poster gagal dirender'));
      img.src = url;
    });
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.92));
    if (!blob) throw new Error('export gagal');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
