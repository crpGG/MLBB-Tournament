import type { Match, MLBBHeroRole, Player, Team, Tournament, TournamentRegistration } from '../types/tournament';
import { slotSources } from './bracketEngine';
import { esc, href, type Imgs, type PosterTheme } from './posterSvg';

/** Template poster bergaya siaran esports: semua 1080x1350 (4:5) kecuali bracket 1600x1000. */
export const TPL_W = 1080;
export const TPL_H = 1350;
export const BRACKET_W = 1600;
export const BRACKET_H = 1000;

export interface Ctx {
  th: PosterTheme;
  imgs: Imgs; // gambar remote yang sudah di-inline (saat export)
  t: Tournament;
  regs: TournamentRegistration[];
  teams: Team[];
  players: Player[];
  a: string; b: string; c: string; d: string; // teks yang bisa diedit
  p1: string; p2: string; // foto unggahan
  logo: string; // logo turnamen unggahan
  bgImg: string; // background unggahan
  bgOpacity: number; // 0..1
  sponsors: string[];
  showTags: boolean;
  showTrophy: boolean;
}

const ROLE: Record<MLBBHeroRole, string> = { 'EXP Lane': 'EXP', Jungler: 'JG', 'Mid Lane': 'MID', 'Gold Lane': 'GOLD', Roamer: 'ROAM' };
const U = (s: string) => esc(s.toUpperCase());
const fit = (txt: string, size: number, maxw: number) => Math.min(size, maxw / (Math.max(1, txt.length) * 0.5));
const fitR = (txt: string, size: number, maxw: number) => Math.min(size, maxw / (Math.max(1, txt.length) * 0.62));
const skew = (x: number, y: number, size: number, fill: string, txt: string, anchor = 'start') =>
  `<g transform="translate(${x} ${y}) skewX(-9)"><text text-anchor="${anchor}" font-family="Anton, Impact, sans-serif" font-size="${size}" fill="${fill}">${esc(txt)}</text></g>`;
const rj = (x: number, y: number, size: number, fill: string, txt: string, anchor = 'start', extra = '') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Rajdhani, 'Arial Narrow', sans-serif" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>${esc(txt)}</text>`;

const regOf = (c: Ctx, id: string | null) => c.regs.find((r) => r.id === id);
const teamOf = (c: Ctx, r?: TournamentRegistration) => c.teams.find((t) => t.id === r?.teamId);
export const playersOf = (c: Ctx, r?: TournamentRegistration): Player[] =>
  r ? ([...r.corePlayerIds, ...r.subPlayerIds].map((id) => c.players.find((p) => p.id === id)).filter(Boolean) as Player[]) : [];

function logoBox(c: Ctx, x: number, y: number, s: number, r?: TournamentRegistration, fallback = '?') {
  const t = c.th;
  const src = href(teamOf(c, r)?.logo, c.imgs);
  const id = `lg${Math.round(x)}_${Math.round(y)}`;
  let o = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.16}" fill="${t.dark}"/>`;
  if (src) o += `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.16}"/></clipPath><image href="${esc(src)}" x="${x + s * 0.06}" y="${y + s * 0.06}" width="${s * 0.88}" height="${s * 0.88}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${id})"/>`;
  else o += `<text x="${x + s / 2}" y="${y + s * 0.62}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="${s * (r ? 0.34 : 0.4)}" fill="${t.accent}">${esc((r?.teamTag || fallback).slice(0, 4))}</text>`;
  return o + `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.16}" fill="none" stroke="${t.accent}" stroke-width="4"/>`;
}

function sil(t: PosterTheme, cx: number, by: number, s: number) {
  return `<g opacity=".95"><path d="M${cx - 120 * s} ${by} Q${cx - 120 * s} ${by - 118 * s} ${cx} ${by - 124 * s} Q${cx + 120 * s} ${by - 118 * s} ${cx + 120 * s} ${by}Z" fill="${t.panel}" stroke="${t.accent}" stroke-width="3"/><circle cx="${cx}" cy="${by - 190 * s}" r="${50 * s}" fill="${t.panel2}" stroke="${t.accent}" stroke-width="3"/></g>`;
}
/** Foto pemain bila ada (ditempel dari bawah), kalau tidak siluet. */
let uid = 0;
function face(c: Ctx, p: Player | undefined, cx: number, by: number, s: number) {
  const src = href(p?.photo, c.imgs);
  if (!src) return sil(c.th, cx, by, s);
  const w = 270 * s, h = 340 * s, id = `fc${uid++}`;
  return `<clipPath id="${id}"><rect x="${cx - w / 2}" y="${by - h}" width="${w}" height="${h}"/></clipPath><image href="${esc(src)}" x="${cx - w / 2}" y="${by - h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${id})"/>`;
}
function photoBox(src: string, x: number, y: number, w: number, h: number) {
  const id = `pb${uid++}`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><image href="${esc(src)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${id})"/>`;
}
const clipRect = (id: string, x: number, y: number, w: number, h: number) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`;

function head(c: Ctx, w = TPL_W) {
  const t = c.th;
  const logo = href(c.logo, c.imgs);
  const ini = (c.t.organizer || c.t.name).replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'AD';
  const mark = logo
    ? `<clipPath id="hl"><circle cx="100" cy="92" r="42"/></clipPath><image href="${esc(logo)}" x="58" y="50" width="84" height="84" preserveAspectRatio="xMidYMid slice" clip-path="url(#hl)"/><circle cx="100" cy="92" r="42" fill="none" stroke="${t.accent}" stroke-width="4"/>`
    : `<circle cx="100" cy="92" r="42" fill="${t.dark}" stroke="${t.accent}" stroke-width="4"/><text x="100" y="105" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="34" fill="${t.accent}">${esc(ini)}</text>`;
  return mark + rj(w - 60, 104, 32, t.text, (c.t.organizer || '').toUpperCase().slice(0, 24), 'end', 'letter-spacing="4"');
}

function sponsors(c: Ctx, y: number, h: number) {
  if (!c.sponsors.length) return '';
  const t = c.th, n = c.sponsors.length, slot = 900 / n;
  let o = `<rect x="0" y="${y}" width="${TPL_W}" height="${h}" fill="${t.bar}"/>` + rj(540, y + 28, 15, t.barText, 'POWERED BY · SUPPORTED BY · OFFICIAL PARTNER', 'middle', 'letter-spacing="3" opacity=".6"');
  c.sponsors.forEach((s, i) => {
    o += `<image href="${esc(href(s, c.imgs))}" x="${90 + i * slot + 10}" y="${y + 40}" width="${slot - 20}" height="${h - 56}" preserveAspectRatio="xMidYMid meet"/>`;
  });
  return o;
}

const LINEUP: [number, number, number][] = [[200, 600, 1.12], [430, 580, 1.12], [650, 580, 1.12], [880, 600, 1.12], [250, 790, 1.5], [540, 810, 1.55], [830, 790, 1.5]];

function wrap(c: Ctx, inner: string, w = TPL_W, h = TPL_H) {
  const t = c.th;
  const bg = href(c.bgImg, c.imgs);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" font-family="Rajdhani, Arial, sans-serif">
<defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg2}"/><stop offset="1" stop-color="${t.bg1}"/></linearGradient><radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${t.glow}" stop-opacity=".5"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient></defs>
<rect width="${w}" height="${h}" fill="url(#bgg)"/><circle cx="${w * 0.52}" cy="${h * 0.27}" r="${w * 0.45}" fill="url(#gl)"/>
${bg ? `<image href="${esc(bg)}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${c.bgOpacity}"/>` : ''}
${inner}</svg>`;
}

// ---------------------------------------------------------------- Lolos playoff
export function securedPoster(c: Ctx, reg?: TournamentRegistration): string {
  const t = c.th, pl = playersOf(c, reg);
  let o = head(c);
  if (c.p1) o += photoBox(c.p1, 0, 130, TPL_W, 670);
  else o += clipRect('sc', 0, 130, TPL_W, 670) + `<g clip-path="url(#sc)">` + LINEUP.map((p, i) => face(c, pl[i], p[0], p[1] + (p[1] < 700 ? 0 : -40), p[2])).join('') + `</g>`;
  o += `<rect x="0" y="800" width="${TPL_W}" height="340" fill="${t.panel}"/><polygon points="0,800 50,800 0,840" fill="${t.accent}"/><polygon points="1080,800 1030,800 1080,840" fill="${t.accent}"/>`;
  o += logoBox(c, 70, 870, 220, reg);
  o += skew(330, 975, fit(c.a, 142, 690), t.accent, c.a.toUpperCase()) + skew(330, 1105, fit(c.b, 142, 690), t.ptext, c.b.toUpperCase());
  o += `<rect x="0" y="1140" width="${TPL_W}" height="84" fill="${t.accent}"/>` + rj(540, 1198, fitR(c.c, 48, 960) , t.dark, c.c.toUpperCase(), 'middle', 'letter-spacing="5"');
  return wrap(c, o + sponsors(c, 1230, 120));
}

// ---------------------------------------------------------------- Jadwal beberapa laga
export function jadwalPoster(c: Ctx, ms: Match[]): string {
  const t = c.th;
  let o = head(c).replace(/<text[^>]*text-anchor="end"[\s\S]*?<\/text>/, '');
  const first = ms[0], pa = playersOf(c, regOf(c, first?.teamARegistrationId ?? null)), pb = playersOf(c, regOf(c, first?.teamBRegistrationId ?? null));
  if (c.p1) o += photoBox(c.p1, 540, 0, 540, 870);
  else o += clipRect('cj', 540, 0, 540, 870) + `<g clip-path="url(#cj)">` + face(c, pa[0], 790, 520, 1.15) + face(c, pb[0], 960, 560, 1.1) + face(c, pa[1], 700, 860, 1.5) + face(c, pb[1], 960, 870, 1.55) + `</g>`;
  ms.slice(0, 2).forEach((m, i) => {
    const y = 190 + i * 330, A = regOf(c, m.teamARegistrationId), B = regOf(c, m.teamBRegistrationId);
    o += `<rect x="0" y="${y}" width="560" height="56" fill="${t.bar}"/>` + rj(30, y + 38, 27, t.barText, `MATCH ${m.matchOrder} · BO${m.bestOf} | ${m.scheduledTime}`.toUpperCase());
    o += `<rect x="0" y="${y + 56}" width="560" height="244" fill="${t.panel2}" opacity=".95"/>`;
    o += logoBox(c, 50, y + 82, 150, A, 'TBD') + logoBox(c, 360, y + 82, 150, B, 'TBD') + skew(280, y + 190, 70, t.accent, 'VS', 'middle');
    o += rj(125, y + 270, 22, t.ptext, (A?.teamName || 'TBD').toUpperCase().slice(0, 22), 'middle') + rj(435, y + 270, 22, t.ptext, (B?.teamName || 'TBD').toUpperCase().slice(0, 22), 'middle');
  });
  o += `<rect x="0" y="880" width="${TPL_W}" height="350" fill="${t.bg1}" opacity=".85"/><rect x="0" y="878" width="${TPL_W}" height="5" fill="${t.accent}"/>`;
  o += skew(580, 1010, fit(c.a, 118, 900), t.accent, c.a.toUpperCase(), 'middle') + skew(580, 1125, fit(c.b, 118, 940), t.accent, c.b.toUpperCase(), 'middle');
  o += `<rect x="90" y="1150" width="900" height="62" fill="${t.bar}"/>` + rj(540, 1193, fitR(c.c, 30, 860), t.barText, c.c.toUpperCase(), 'middle', 'letter-spacing="2"');
  return wrap(c, o + sponsors(c, 1230, 120));
}

// ---------------------------------------------------------------- Roster tim
export function rosterPoster(c: Ctx, reg?: TournamentRegistration): string {
  const t = c.th, pl = playersOf(c, reg).slice(0, 7);
  let o = head(c);
  if (c.p1) o += photoBox(c.p1, 0, 130, TPL_W, 760);
  else o += clipRect('cr', 0, 130, TPL_W, 760) + `<g clip-path="url(#cr)">` + LINEUP.slice(0, Math.max(pl.length, 1)).map((p, i) => face(c, pl[i], p[0], p[1] + (p[1] < 700 ? 40 : 10), p[2])).join('') + `</g>`;
  if (c.showTags) pl.forEach((p, i) => {
    const [cx, by] = LINEUP[i], x = cx, y = by + (by < 700 ? -40 : -90);
    o += `<g><polygon points="${x - 100},${y} ${x + 100},${y} ${x + 88},${y + 38} ${x - 112},${y + 38}" fill="${t.panel}" stroke="${t.accent}" stroke-width="2"/><rect x="${x - 100}" y="${y}" width="52" height="38" fill="${t.accent}"/>` +
      rj(x - 74, y + 26, 16, t.dark, ROLE[p.primaryRole] || '', 'middle') + rj(x - 38, y + 27, fitR(p.nickname, 24, 120), t.ptext, p.nickname.slice(0, 12)) + `</g>`;
  });
  o += `<rect x="0" y="890" width="${TPL_W}" height="460" fill="${t.bg1}"/><rect x="0" y="888" width="${TPL_W}" height="6" fill="${t.accent}"/>`;
  o += skew(70, 1070, fit(c.a, 150, 590), t.accent, c.a.toUpperCase()) + skew(70, 1205, fit(c.b, 150, 590), t.text, c.b.toUpperCase());
  o += logoBox(c, 720, 960, 290, reg);
  return wrap(c, o + sponsors(c, 1250, 100));
}

// ---------------------------------------------------------------- Jadwal 1 laga (VS)
export function versusPoster(c: Ctx, m?: Match): string {
  const t = c.th;
  const A = regOf(c, m?.teamARegistrationId ?? null), B = regOf(c, m?.teamBRegistrationId ?? null);
  const pa = playersOf(c, A), pb = playersOf(c, B);
  let o = head(c).replace(/<text[^>]*text-anchor="end"[\s\S]*?<\/text>/, '');
  o += skew(300, 170, 104, t.accent, c.a.toUpperCase()) + skew(300, 275, fit(c.b, 104, 760), t.accent, c.b.toUpperCase());
  o += `<rect x="700" y="60" width="320" height="56" fill="${t.bar}"/>` + rj(860, 98, fitR(c.d, 26, 300), t.barText, c.d.toUpperCase(), 'middle');
  o += `<polygon points="110,310 1010,310 990,376 90,376" fill="${t.bar}"/>` + rj(550, 352, fitR(c.c, 27, 840), t.barText, c.c.toUpperCase(), 'middle', 'letter-spacing="2"');
  o += `<rect x="0" y="430" width="${TPL_W}" height="460" fill="${t.bg1}" opacity=".75"/>`;
  o += c.p1 ? photoBox(c.p1, 0, 430, 470, 460) : clipRect('va', 0, 430, 470, 460) + `<g clip-path="url(#va)">` + face(c, pa[0], 120, 890, 1.35) + face(c, pa[1], 330, 890, 1.2) + `</g>`;
  o += c.p2 ? photoBox(c.p2, 610, 430, 470, 460) : clipRect('vb', 610, 430, 470, 460) + `<g clip-path="url(#vb)">` + face(c, pb[1], 780, 890, 1.2) + face(c, pb[0], 970, 890, 1.35) + `</g>`;
  o += `<rect x="320" y="450" width="440" height="52" fill="${t.accent}"/>` + rj(540, 486, 26, t.dark, m ? `M${m.matchOrder} · BO${m.bestOf} | ${m.scheduledTime}`.toUpperCase() : 'MATCH', 'middle');
  o += logoBox(c, 300, 580, 170, A, 'TBD') + logoBox(c, 610, 580, 170, B, 'TBD') + skew(540, 690, 74, t.text, 'VS', 'middle');
  o += rj(385, 790, 24, t.ptext, (A?.teamName || 'TBD').toUpperCase().slice(0, 18), 'middle') + rj(695, 790, 24, t.ptext, (B?.teamName || 'TBD').toUpperCase().slice(0, 18), 'middle');
  [0, 1, 2].forEach((i) => { o += `<ellipse cx="540" cy="${1080 + i * 14}" rx="${430 - i * 70}" ry="${95 - i * 15}" fill="none" stroke="${t.accent}" stroke-width="${6 - i}" opacity="${0.6 - i * 0.15}"/>`; });
  o += rj(540, 1295, 30, t.text, `PRESENTED BY ${(c.t.organizer || c.t.name).toUpperCase().slice(0, 28)}`, 'middle', 'letter-spacing="4"');
  return wrap(c, o);
}

// ---------------------------------------------------------------- Hasil laga
export function hasilPoster(c: Ctx, m?: Match): string {
  const t = c.th;
  const A = regOf(c, m?.teamARegistrationId ?? null), B = regOf(c, m?.teamBRegistrationId ?? null);
  const done = !!m && m.status === 'completed';
  const aWin = done && m!.winnerRegistrationId === A?.id, bWin = done && m!.winnerRegistrationId === B?.id;
  const pw = playersOf(c, bWin ? B : A);
  let o = head(c).replace(/<text[^>]*text-anchor="end"[\s\S]*?<\/text>/, '');
  o += `<rect x="300" y="64" width="480" height="48" rx="6" fill="${t.panel}"/>` + rj(540, 98, fitR(c.d, 26, 460), t.ptext, c.d.toUpperCase(), 'middle', 'letter-spacing="2"');
  o += skew(540, 245, fit(c.a, 120, 900), t.text, c.a.toUpperCase(), 'middle') + skew(540, 350, fit(c.b, 120, 900), t.text, c.b.toUpperCase(), 'middle');
  o += `<polygon points="270,384 810,384 790,444 250,444" fill="${t.accent}"/>` + rj(530, 425, fitR(c.c, 28, 500), t.dark, c.c.toUpperCase(), 'middle', 'letter-spacing="2"');
  [0, 1, 2].forEach((i) => { o += `<path d="M-20 ${700 + i * 50} C200 ${520 + i * 40} 360 ${700 + i * 60} 420 ${960 + i * 30}" fill="none" stroke="${t.accent}" stroke-width="${14 - i * 4}" opacity="${0.7 - i * 0.2}" stroke-linecap="round"/>`; });
  o += c.p1 ? photoBox(c.p1, 400, 470, 680, 700) : clipRect('ha', 400, 470, 680, 700) + `<g clip-path="url(#ha)">` + face(c, pw[0], 640, 1170, 2.0) + face(c, pw[1], 900, 1170, 2.0) + `</g>`;
  const row = (y: number, r: TournamentRegistration | undefined, score: number, win: boolean, first: boolean) =>
    `<rect x="30" y="${y}" width="500" height="100" fill="${first ? t.panel : t.bar}"/>` + rj(55, y + 60, fitR(r?.teamName || 'TBD', 30, 200), first ? t.ptext : t.barText, (r?.teamName || 'TBD').toUpperCase()) +
    logoBox(c, 270, y + 10, 80, r, 'TBD') + `<rect x="380" y="${y}" width="150" height="100" fill="${win ? t.accent : first ? t.panel2 : t.bar}"/>` +
    `<text x="455" y="${y + 78}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="80" fill="${win ? t.dark : first ? t.ptext : t.barText}" opacity="${win || !done ? 1 : 0.7}">${done ? score : 0}</text>`;
  o += `<rect x="30" y="1000" width="500" height="52" fill="${t.panel2}"/>` + rj(55, 1036, 26, t.ptext, m ? `MATCH ${m.matchOrder} | BO ${m.bestOf}` : 'MATCH');
  o += row(1052, A, m?.scoreA ?? 0, aWin, true) + row(1152, B, m?.scoreB ?? 0, bWin, false);
  o += rj(540, 1312, 30, t.text, `PRESENTED BY ${(c.t.organizer || c.t.name).toUpperCase().slice(0, 28)}`, 'middle', 'letter-spacing="4"');
  return wrap(c, o);
}

// ---------------------------------------------------------------- Bracket (generik dari laga turnamen)
const CW = 260, GX = 72, RH = 44, MH = RH * 2 + 3, CH = 120, TAG = 28;

export function bracketPoster(c: Ctx, matches: Match[]): string {
  const t = c.th, src = slotSources(matches);
  const by = (s: Match['stage']) => matches.filter((m) => m.stage === s && !m.skipped);
  const upper = by('upper'), lower = by('lower'), gf = by('grand_final').sort((x, y) => x.matchOrder - y.matchOrder), third = by('third_place');
  const roundsOf = (l: Match[]) => Array.from(new Set(l.map((m) => m.roundNumber))).sort((x, y) => x - y);
  interface Node { m: Match; x: number; cy: number }
  const nodes: Node[] = [], links: [Node, Node][] = [];
  const place = (list: Match[], y0: number, extraCols: Match[][] = []) => {
    const rounds = roundsOf(list);
    const cols: Match[][] = rounds.map((rn) => list.filter((m) => m.roundNumber === rn).sort((x, y) => (x.pos ?? x.matchOrder) - (y.pos ?? y.matchOrder))).concat(extraCols);
    const height = Math.max(1, ...cols.map((cl) => cl.length)) * CH;
    const placed = cols.map((cl, ci) => cl.map((m, i) => ({ m, x: TAG + ci * (CW + GX), cy: y0 + (i + 0.5) * (height / cl.length) })));
    placed.forEach((cl, ci) => {
      nodes.push(...cl);
      if (ci === 0) return;
      const prev = placed[ci - 1];
      if (prev.length === cl.length * 2) prev.forEach((n, i) => links.push([n, cl[Math.floor(i / 2)]]));
      else if (prev.length === cl.length) prev.forEach((n, i) => links.push([n, cl[i]]));
    });
    return { height, cols: placed };
  };
  let totalH = 0;
  if (lower.length) {
    const up = place(upper, 0);
    const lo = place(lower, up.height + 50, gf.map((g) => [g]));
    totalH = up.height + 50 + lo.height;
  } else {
    const up = place(upper, 0, gf.map((g) => [g]));
    totalH = up.height;
    if (third.length) {
      const last = up.cols[up.cols.length - 1][0];
      nodes.push({ m: third[0], x: last.x, cy: totalH + 70 });
      totalH += 140;
    }
  }
  const maxX = Math.max(...nodes.map((n) => n.x)) + CW + 30;
  const ax = 70, ay = 300, aw = 1460, ah = c.sponsors.length ? 580 : 650;
  const s = Math.min(1.8, aw / maxX, ah / Math.max(totalH, 1));
  const ox = ax + (aw - maxX * s) / 2, oy = ay + (ah - totalH * s) / 2;

  let g = '';
  links.forEach(([a, b]) => {
    const x1 = a.x + CW, x2 = b.x - TAG, xe = (x1 + x2) / 2;
    g += `<path d="M${x1} ${a.cy} H${xe} V${b.cy} H${x2}" fill="none" stroke="${t.accent}" stroke-opacity=".55" stroke-width="2"/>`;
  });
  nodes.forEach(({ m, x, cy }) => {
    const y = cy - MH / 2, done = m.status === 'completed';
    g += rj(x, y - 10, 17, t.text, `M${m.matchOrder} · BO${m.bestOf}`) + rj(x + CW, y - 10, 16, t.text, m.scheduledTime.replace(' WIB', ''), 'end', 'opacity=".65"');
    g += `<rect x="${x - TAG}" y="${y}" width="22" height="${MH}" rx="2" fill="${t.accent}"/><text transform="translate(${x - 12} ${cy}) rotate(-90)" text-anchor="middle" dominant-baseline="central" font-family="Rajdhani, sans-serif" font-weight="700" font-size="14" fill="${t.dark}">${esc(m.scheduledTime.replace(' WIB', ''))}</text>`;
    (['A', 'B'] as const).forEach((slot, k) => {
      const r = regOf(c, slot === 'A' ? m.teamARegistrationId : m.teamBRegistrationId), yy = y + k * (RH + 3);
      const score = slot === 'A' ? m.scoreA : m.scoreB, win = done && !!r && m.winnerRegistrationId === r.id;
      g += `<rect x="${x}" y="${yy}" width="${CW}" height="${RH}" rx="3" fill="${t.panel2}" opacity=".92"/>`;
      if (r) g += logoBox(c, x + 5, yy + 5, RH - 10, r) + rj(x + RH + 6, yy + RH * 0.7, fitR(r.teamTag, 30, 130), done && !win ? t.text : t.ptext, r.teamTag.toUpperCase(), 'start', done && !win ? 'opacity=".55"' : '');
      else g += rj(x + 12, yy + RH * 0.66, 17, t.ptext, src.get(`${m.id}:${slot}`) || '—', 'start', 'opacity=".55"');
      if (r || done) g += `<text x="${x + CW - 14}" y="${yy + RH * 0.74}" text-anchor="end" font-family="Anton, Impact, sans-serif" font-size="32" fill="${win ? t.accent : t.ptext}" opacity="${done && !win ? 0.55 : 1}">${score}</text>`;
    });
  });
  const title = (c.a + ' ' + c.b).trim();
  const size = Math.min(116, 1050 / (Math.max(1, title.length) * 0.5));
  let o = head(c, BRACKET_W);
  o += `<g transform="skewX(-9)"><text x="140" y="${150 + size * 0.72}" font-family="Anton, Impact, sans-serif" font-size="${size}" fill="${t.text}">${esc(c.a.toUpperCase())} <tspan fill="${t.accent}">${esc(c.b.toUpperCase())}</tspan></text></g>`;
  o += rj(66, 186 + size * 0.72, 20, t.text, c.c.toUpperCase(), 'start', 'letter-spacing="4" opacity=".7"');
  if (c.showTrophy) o += `<g transform="translate(1480 235) scale(.55)" opacity=".9"><path d="M-62 -110 H62 C62 -20 30 24 0 34 C-30 24 -62 -20 -62 -110Z" fill="${t.accent}"/><path d="M-62 -92 C-100 -92 -100 -34 -48 -22 M62 -92 C100 -92 100 -34 48 -22" fill="none" stroke="${t.accent}" stroke-width="9" stroke-linecap="round"/><rect x="-9" y="32" width="18" height="40" fill="${t.accent}"/><rect x="-44" y="72" width="88" height="14" rx="3" fill="${t.accent}"/></g>`;
  o += `<g transform="translate(${ox} ${oy}) scale(${s})">${g}</g>`;
  if (c.sponsors.length) {
    const n = c.sponsors.length, slot = 1400 / n;
    o += `<rect x="0" y="905" width="${BRACKET_W}" height="95" fill="${t.bar}"/>`;
    c.sponsors.forEach((sp, i) => { o += `<image href="${esc(href(sp, c.imgs))}" x="${100 + i * slot + 10}" y="915" width="${slot - 20}" height="75" preserveAspectRatio="xMidYMid meet"/>`; });
  }
  return wrap(c, o, BRACKET_W, BRACKET_H);
}
