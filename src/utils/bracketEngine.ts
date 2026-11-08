import {
  Match,
  Player,
  StandingRow,
  Tournament,
  TournamentRegistration,
} from '../types/tournament';

export const MLBB_HEROES = [
  'Fanny', 'Ling', 'Hayabusa', 'Joy', 'Nolan', 'Suyou', 'Fredrinn', 'Baxia',
  'Arlott', 'Yu Zhong', 'Terizla', 'Edith', 'Paquito', 'Phoveus', 'Chou', 'Ruby',
  'Valentina', 'Yve', 'Pharsa', 'Novaria', 'Faramis', 'Lylia', 'Zhuxin', 'Aurora',
  'Claude', 'Karrie', 'Beatrix', 'Harith', 'Roger', 'Moskov', 'Brody', 'Wanwan',
  'Mathilda', 'Minotaur', 'Tigreal', 'Khufra', 'Angela', 'Chip', 'Hylos', 'Gatotkaca',
];

export function formatIndonesianDate(isoDate: string): string {
  if (!isoDate) return '-';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return isoDate;
  return `${day} ${months[monthIdx]} ${year}`;
}

export function getDisplayTeamName(
  reg: TournamentRegistration | undefined,
  allRegsForTournament?: TournamentRegistration[]
): string {
  if (!reg) return 'TBD';
  if (!allRegsForTournament) {
    return reg.slotIndex > 1 ? `${reg.teamName} #${reg.slotIndex}` : reg.teamName;
  }
  const sameTeamCount = allRegsForTournament.filter(
    (r) => r.teamId === reg.teamId && r.status === 'approved'
  ).length;
  if (sameTeamCount > 1 || reg.slotIndex > 1) {
    return `${reg.teamName} #${reg.slotIndex}`;
  }
  return reg.teamName;
}

// ===========================================================================
// Mesin bracket (mengikuti cara kerja Challonge)
//  - Single/Double Elimination untuk jumlah tim berapa pun: bracket dibuat untuk ukuran pangkat dua,
//    lalu laga yang lawannya "bye" dihapus dan pemenangnya langsung maju (setara putaran kualifikasi Challonge).
//  - Seeding: seed 1 melawan seed terakhir; bye jatuh ke seed teratas.
//  - Round Robin: semua bertemu semua, 1x/2x/3x.
// ===========================================================================

/** Batas jumlah tim per format (struktur laga tersimpan di satu dokumen Firestore). */
export function bracketCapacity(format: Tournament['bracketFormat']): number {
  if (format === 'single_elimination') return 64;
  if (format === 'double_elimination') return 32;
  return 32;
}

/** Urutan seed: seed eksplisit lebih dulu, lalu waktu daftar; tim baru otomatis di urutan paling bawah. */
export function seedOrder(regs: TournamentRegistration[]): TournamentRegistration[] {
  return [...regs].sort(
    (a, b) =>
      (a.seed ?? Infinity) - (b.seed ?? Infinity) ||
      a.registeredAt.localeCompare(b.registeredAt) ||
      a.id.localeCompare(b.id)
  );
}

/** Ringkasan format untuk ditampilkan (menggantikan teks bebas). */
export function describeSeries(t: Pick<Tournament, 'bracketFormat' | 'defaultBestOf' | 'thirdPlaceMatch' | 'grandFinalReset' | 'roundRobinCycles'>): string {
  const bo = t.defaultBestOf;
  if (t.bracketFormat === 'single_elimination') {
    return `Single Elimination | BO${bo} | Final BO${bo >= 5 ? bo : 5}${t.thirdPlaceMatch ? ' | Juara 3' : ''}`;
  }
  if (t.bracketFormat === 'double_elimination') {
    return `Double Elimination | BO${bo} | Grand Final BO${bo >= 5 ? bo : 5}${t.grandFinalReset ? ' (2 laga)' : ''}`;
  }
  return `Round Robin ${roundRobinCycles(t)}x | BO${bo}`;
}

export const roundRobinCycles = (t: Pick<Tournament, 'bracketFormat' | 'roundRobinCycles'>): 1 | 2 | 3 =>
  t.roundRobinCycles ?? (t.bracketFormat === 'double_round_robin' ? 2 : 1);

// Posisi slot untuk ukuran pangkat dua: seed 1 vs seed terakhir, dst. (indeks 0-based)
function seedSlots(size: number): number[] {
  let s = [0];
  while (s.length < size) {
    const m = s.length * 2;
    s = s.flatMap((x) => [x, m - 1 - x]);
  }
  return s;
}

type Src = { t: 'team'; id: string } | { t: 'bye' } | { t: 'w'; n: string } | { t: 'l'; n: string };
interface Node {
  id: string;
  stage: Match['stage'];
  round: number;
  pos: number;
  a: Src;
  b: Src;
}

function generateElimination(
  tournament: Tournament,
  regs: TournamentRegistration[],
  doubleElim: boolean
): Match[] {
  const n = regs.length;
  const k = Math.max(1, Math.ceil(Math.log2(n)));
  const S = 2 ** k;
  const prefix = `m-${tournament.id}`;
  const slots: Src[] = seedSlots(S).map((idx) => (idx < n ? { t: 'team', id: regs[idx].id } : { t: 'bye' }));
  const de = doubleElim && k >= 2;
  const nodes: Node[] = [];
  const wbId = (r: number, i: number) => `${prefix}-wb${r}m${i + 1}`;
  const lbId = (r: number, i: number) => `${prefix}-lb${r}m${i + 1}`;
  const wbCount = (r: number) => S / 2 ** r;
  const lbCount = (r: number) => S / 2 ** (Math.floor((r + 1) / 2) + 1);
  const finalStage: Match['stage'] = de ? 'upper' : 'grand_final';

  const pushWB = (r: number) => {
    for (let i = 0; i < wbCount(r); i++) {
      nodes.push({
        id: wbId(r, i),
        stage: r === k ? finalStage : 'upper',
        round: r,
        pos: i,
        a: r === 1 ? slots[2 * i] : { t: 'w', n: wbId(r - 1, 2 * i) },
        b: r === 1 ? slots[2 * i + 1] : { t: 'w', n: wbId(r - 1, 2 * i + 1) },
      });
    }
  };
  const pushLB = (r: number) => {
    for (let i = 0; i < lbCount(r); i++) {
      let a: Src;
      let b: Src;
      if (r === 1) {
        a = { t: 'l', n: wbId(1, 2 * i) };
        b = { t: 'l', n: wbId(1, 2 * i + 1) };
      } else if (r % 2 === 1) {
        a = { t: 'w', n: lbId(r - 1, 2 * i) };
        b = { t: 'w', n: lbId(r - 1, 2 * i + 1) };
      } else {
        // ronde genap: pemenang ronde sebelumnya vs yang baru kalah dari Upper (urutan dibalik agar tidak langsung bertemu ulang)
        a = { t: 'w', n: lbId(r - 1, i) };
        b = { t: 'l', n: wbId(r / 2 + 1, lbCount(r) - 1 - i) };
      }
      nodes.push({ id: lbId(r, i), stage: 'lower', round: r, pos: i, a, b });
    }
  };

  if (de) {
    for (let r = 1; r <= k; r++) {
      pushWB(r);
      if (r === 1) pushLB(1);
      else {
        pushLB(2 * r - 2);
        if (2 * r - 1 <= 2 * k - 2) pushLB(2 * r - 1);
      }
    }
    nodes.push({
      id: `${prefix}-gf`,
      stage: 'grand_final',
      round: k + 1,
      pos: 0,
      a: { t: 'w', n: wbId(k, 0) },
      b: { t: 'w', n: lbId(2 * k - 2, 0) },
    });
  } else {
    for (let r = 1; r <= k; r++) pushWB(r);
    if (tournament.thirdPlaceMatch && k >= 2) {
      nodes.push({
        id: `${prefix}-tp`,
        stage: 'third_place',
        round: k,
        pos: 0,
        a: { t: 'l', n: wbId(k - 1, 0) },
        b: { t: 'l', n: wbId(k - 1, 1) },
      });
    }
  }

  // Hapus laga yang lawannya bye: pemenangnya langsung maju, yang kalah juga "bye".
  const info = new Map<string, { pass: boolean; ra: Src; rb: Src }>();
  const resolve = (s: Src): Src => {
    if (s.t === 'team' || s.t === 'bye') return s;
    const x = info.get(s.n)!;
    if (s.t === 'w') return x.pass ? (x.ra.t === 'bye' ? x.rb : x.ra) : s;
    return x.pass ? { t: 'bye' } : s;
  };
  for (const nd of nodes) {
    const ra = resolve(nd.a);
    const rb = resolve(nd.b);
    info.set(nd.id, { pass: ra.t === 'bye' || rb.t === 'bye', ra, rb });
  }
  const real = nodes.filter((nd) => !info.get(nd.id)!.pass);

  const defBo = tournament.defaultBestOf;
  const finalBo = (defBo >= 5 ? defBo : 5) as Match['bestOf'];
  const semiBo = (defBo === 1 ? 3 : defBo) as Match['bestOf'];
  const countIn = (stage: Match['stage'], round: number) => real.filter((x) => x.stage === stage && x.round === round).length;
  const nameOf = (nd: Node): string => {
    let base: string;
    if (nd.stage === 'grand_final') base = de ? 'Grand Final' : 'Grand Final';
    else if (nd.stage === 'third_place') base = 'Perebutan Juara 3';
    else if (nd.stage === 'lower') {
      base = nd.round === 2 * k - 2 ? 'Lower Final' : nd.round === 2 * k - 3 ? 'Lower Semifinal' : `Lower Ronde ${nd.round}`;
    } else {
      const fromEnd = k - nd.round;
      const w = fromEnd === 0 ? 'Final' : fromEnd === 1 ? 'Semifinal' : fromEnd === 2 ? 'Perempat Final' : `Babak ${S / 2 ** (nd.round - 1)} Besar`;
      base = de ? `Upper ${w}` : w;
    }
    return countIn(nd.stage, nd.round) > 1 ? `${base} ${real.filter((x) => x.stage === nd.stage && x.round === nd.round && x.pos <= nd.pos).length}` : base;
  };
  const boOf = (nd: Node): Match['bestOf'] => {
    if (nd.stage === 'grand_final') return finalBo;
    if (nd.stage === 'third_place') return semiBo;
    if (nd.stage === 'upper' && nd.round >= k - 1) return nd.round === k && !de ? finalBo : semiBo;
    if (nd.stage === 'lower' && nd.round >= 2 * k - 3) return semiBo;
    return defBo;
  };

  const out = new Map<string, Match>();
  real.forEach((nd, idx) => {
    const x = info.get(nd.id)!;
    out.set(nd.id, {
      id: nd.id,
      tournamentId: tournament.id,
      stage: nd.stage,
      roundNumber: nd.round,
      roundName: nameOf(nd),
      matchOrder: idx + 1,
      teamARegistrationId: x.ra.t === 'team' ? x.ra.id : null,
      teamBRegistrationId: x.rb.t === 'team' ? x.rb.id : null,
      scoreA: 0,
      scoreB: 0,
      bestOf: boOf(nd),
      scheduledDate: tournament.matchDayDate,
      scheduledTime: `${String(12 + (idx % 10)).padStart(2, '0')}:00 WIB`,
      roomName: nd.stage === 'grand_final' ? 'Main Stage Stream' : `Room Custom #${idx + 1}`,
      status: 'scheduled',
      winnerRegistrationId: null,
      pos: nd.pos,
      playerStats: [],
    });
  });
  // Penunjuk "pemenang/yang kalah menuju laga mana"
  for (const nd of real) {
    const x = info.get(nd.id)!;
    (['a', 'b'] as const).forEach((key) => {
      const src = key === 'a' ? x.ra : x.rb;
      if (src.t !== 'w' && src.t !== 'l') return;
      const from = out.get(src.n)!;
      const slot = key === 'a' ? 'A' : 'B';
      if (src.t === 'w') {
        from.nextWinnerMatchId = nd.id;
        from.nextWinnerSlot = slot;
      } else {
        from.nextLoserMatchId = nd.id;
        from.nextLoserSlot = slot;
      }
    });
  }
  const list = Array.from(out.values());

  // Double Elimination dengan Grand Final 2 laga: laga ke-2 hanya dimainkan bila juara Lower menang.
  const gf1 = out.get(`${prefix}-gf`);
  if (de && tournament.grandFinalReset && gf1) {
    const gf2: Match = {
      ...gf1,
      id: `${prefix}-gf2`,
      roundNumber: k + 2,
      roundName: 'Grand Final (Reset)',
      matchOrder: list.length + 1,
      teamARegistrationId: null,
      teamBRegistrationId: null,
      nextWinnerMatchId: undefined,
      nextWinnerSlot: undefined,
      scheduledTime: `${String(12 + (list.length % 10)).padStart(2, '0')}:00 WIB`,
      roomName: 'Main Stage Stream',
      optional: true,
      playerStats: [],
    };
    gf1.resetMatchId = gf2.id;
    list.push(gf2);
  }
  return list;
}

function generateRoundRobin(tournament: Tournament, regs: TournamentRegistration[], cycles: number): Match[] {
  const list: (TournamentRegistration | null)[] = [...regs];
  if (list.length % 2 !== 0) list.push(null); // bye
  const numTeams = list.length;
  const baseRounds = numTeams - 1;
  const half = numTeams / 2;
  const matches: Match[] = [];
  let matchOrder = 1;
  const circle = [...list];

  for (let r = 0; r < baseRounds * cycles; r++) {
    const leg = Math.floor(r / baseRounds);
    const swap = leg % 2 === 1; // putaran genap: kandang/tandang ditukar
    const roundNumber = r + 1;
    for (let i = 0; i < half; i++) {
      const first = circle[i];
      const second = circle[numTeams - 1 - i];
      if (!first || !second) continue;
      const hour = 13 + ((matchOrder - 1) % 7);
      matches.push({
        id: `m-${tournament.id}-rr-r${roundNumber}-m${i + 1}`,
        tournamentId: tournament.id,
        stage: 'round_robin',
        roundNumber,
        roundName: `Babak ${roundNumber}${cycles > 1 ? ` (Putaran ${leg + 1})` : ''}`,
        matchOrder,
        teamARegistrationId: (swap ? second : first).id,
        teamBRegistrationId: (swap ? first : second).id,
        scoreA: 0,
        scoreB: 0,
        bestOf: tournament.defaultBestOf,
        scheduledDate: tournament.matchDayDate,
        scheduledTime: `${hour.toString().padStart(2, '0')}:00 WIB`,
        roomName: `Lobby Liga #${(i % 3) + 1}`,
        status: 'scheduled',
        winnerRegistrationId: null,
        playerStats: [],
      });
      matchOrder++;
    }
    const last = circle.pop()!;
    circle.splice(1, 0, last); // putar, indeks 0 tetap
  }
  return matches;
}

/** Membuat seluruh laga turnamen dari tim terverifikasi (urutan seed dihormati). */
export function generateTournamentMatches(
  tournament: Tournament,
  approvedRegistrations: TournamentRegistration[]
): Match[] {
  const regs = seedOrder(approvedRegistrations).slice(0, bracketCapacity(tournament.bracketFormat));
  if (regs.length < 2) return [];
  if (tournament.bracketFormat === 'single_elimination') return generateElimination(tournament, regs, false);
  if (tournament.bracketFormat === 'double_elimination') return generateElimination(tournament, regs, true);
  return generateRoundRobin(tournament, regs, roundRobinCycles(tournament));
}

const hasProgress = (m: Match) =>
  m.status !== 'scheduled' || m.scoreA > 0 || m.scoreB > 0 || m.playerStats.length > 0;

/** Apakah ada laga yang sudah berjalan (skor/status/statistik)? Setelah itu bracket "terkunci". */
export const bracketStarted = (matches: Match[]) => matches.some(hasProgress);

/**
 * Menyimpan hasil satu laga lalu meneruskan pemenang (dan yang kalah, untuk Double Elimination/juara 3)
 * ke laga berikutnya. Bila hasil diubah dan laga lanjutan sudah berisi hasil lama, laga itu direset
 * (seperti Challonge: skor baru harus diisi untuk slot yang terbuka kembali).
 */
export function propagateMatchOutcome(allMatches: Match[], updatedMatch: Match): Match[] {
  const byId = new Map(allMatches.map((m) => [m.id, { ...m }]));
  const outcome = (m: Match) =>
    m.status === 'completed' && m.teamARegistrationId && m.teamBRegistrationId && m.scoreA !== m.scoreB
      ? m.scoreA > m.scoreB
        ? { winner: m.teamARegistrationId, loser: m.teamBRegistrationId }
        : { winner: m.teamBRegistrationId, loser: m.teamARegistrationId }
      : null;

  const assign = (t: Match, key: 'teamARegistrationId' | 'teamBRegistrationId', value: string | null) => {
    if (t[key] === value) return;
    const had = hasProgress(t);
    t[key] = value;
    if (had) {
      t.scoreA = 0;
      t.scoreB = 0;
      t.status = 'scheduled';
      t.winnerRegistrationId = null;
      t.playerStats = [];
    }
    push(t);
  };
  const slotKey = (s?: 'A' | 'B') => (s === 'A' ? 'teamARegistrationId' : 'teamBRegistrationId');
  function push(m: Match) {
    const o = outcome(m);
    m.winnerRegistrationId = o ? o.winner : null;
    const w = m.nextWinnerMatchId && byId.get(m.nextWinnerMatchId);
    if (w) assign(w, slotKey(m.nextWinnerSlot), o ? o.winner : null);
    const l = m.nextLoserMatchId && byId.get(m.nextLoserMatchId);
    if (l) assign(l, slotKey(m.nextLoserSlot), o ? o.loser : null);
    const g2 = m.resetMatchId && byId.get(m.resetMatchId);
    if (g2) {
      // juara Lower menang Grand Final -> bracket reset (laga ke-2); juara Upper menang -> tidak perlu
      const need = !!o && o.winner === m.teamBRegistrationId;
      g2.skipped = !!o && !need;
      assign(g2, 'teamARegistrationId', need ? m.teamARegistrationId : null);
      assign(g2, 'teamBRegistrationId', need ? m.teamBRegistrationId : null);
    }
  }

  const target = { ...updatedMatch };
  byId.set(target.id, target);
  push(target);
  return allMatches.map((m) => byId.get(m.id)!);
}

/** Juara turnamen (id pendaftaran) bila sudah ditentukan. */
export function getChampion(
  tournament: Tournament,
  matches: Match[],
  registrations: TournamentRegistration[]
): string | null {
  if (matches.length === 0) return null;
  if (tournament.bracketFormat.includes('round_robin')) {
    return matches.every((m) => m.status === 'completed')
      ? calculateStandings(registrations, matches)[0]?.registrationId ?? null
      : null;
  }
  const finals = matches.filter((m) => m.stage === 'grand_final').sort((a, b) => a.matchOrder - b.matchOrder);
  const g1 = finals[0];
  if (!g1 || g1.status !== 'completed' || !g1.winnerRegistrationId) return null;
  const g2 = finals.find((m) => m.optional);
  if (!g2 || g1.winnerRegistrationId === g1.teamARegistrationId) return g1.winnerRegistrationId;
  return g2.status === 'completed' ? g2.winnerRegistrationId : null;
}

export function calculateStandings(
  registrations: TournamentRegistration[],
  matches: Match[]
): StandingRow[] {
  const approved = registrations.filter((r) => r.status === 'approved');
  const map = new Map<string, StandingRow>();

  approved.forEach((reg) => {
    map.set(reg.id, {
      registrationId: reg.id,
      teamName: reg.teamName,
      teamTag: reg.teamTag,
      slotIndex: reg.slotIndex,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gameWins: 0,
      gameLosses: 0,
      gameDiff: 0,
      points: 0,
    });
  });

  matches.forEach((m) => {
    if (m.status !== 'completed' || !m.teamARegistrationId || !m.teamBRegistrationId) return;
    const rowA = map.get(m.teamARegistrationId);
    const rowB = map.get(m.teamBRegistrationId);
    if (!rowA || !rowB) return;

    rowA.played += 1;
    rowB.played += 1;
    rowA.gameWins += m.scoreA;
    rowA.gameLosses += m.scoreB;
    rowB.gameWins += m.scoreB;
    rowB.gameLosses += m.scoreA;
    rowA.gameDiff = rowA.gameWins - rowA.gameLosses;
    rowB.gameDiff = rowB.gameWins - rowB.gameLosses;

    if (m.scoreA > m.scoreB) {
      rowA.wins += 1;
      rowB.losses += 1;
      rowA.points += 3;
    } else if (m.scoreB > m.scoreA) {
      rowB.wins += 1;
      rowA.losses += 1;
      rowB.points += 3;
    } else {
      rowA.draws += 1;
      rowB.draws += 1;
      rowA.points += 1;
      rowB.points += 1;
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    return b.gameWins - a.gameWins;
  });
}

export interface AggregatedPlayerStat {
  playerId: string;
  nickname: string;
  mlbbId: string;
  primaryRole: string;
  teamName: string;
  teamTag: string;
  matchesPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  kdaRatio: number;
  mvpCount: number;
  avgGold: number;
  avgRating: number;
  heroesUsed: string[];
}

export function aggregatePlayerLeaderboard(
  players: Player[],
  matches: Match[],
  registrations: TournamentRegistration[],
  tournamentIdFilter?: string
): AggregatedPlayerStat[] {
  const relevantMatches = tournamentIdFilter
    ? matches.filter((m) => m.tournamentId === tournamentIdFilter)
    : matches;

  const accum = new Map<
    string,
    {
      playerId: string;
      nickname: string;
      teamTag: string;
      matchesPlayed: number;
      kills: number;
      deaths: number;
      assists: number;
      mvpCount: number;
      totalGold: number;
      totalRating: number;
      heroes: Set<string>;
    }
  >();

  relevantMatches.forEach((m) => {
    m.playerStats.forEach((ps) => {
      const existing = accum.get(ps.playerId) || {
        playerId: ps.playerId,
        nickname: ps.playerNickname,
        teamTag: ps.teamTag,
        matchesPlayed: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        mvpCount: 0,
        totalGold: 0,
        totalRating: 0,
        heroes: new Set<string>(),
      };

      existing.matchesPlayed += 1;
      existing.kills += ps.kills;
      existing.deaths += ps.deaths;
      existing.assists += ps.assists;
      if (ps.isMvp) existing.mvpCount += 1;
      existing.totalGold += ps.gold;
      existing.totalRating += ps.rating;
      if (ps.heroName) existing.heroes.add(ps.heroName);
      accum.set(ps.playerId, existing);
    });
  });

  const rows: AggregatedPlayerStat[] = [];
  accum.forEach((val) => {
    const pObj = players.find((p) => p.id === val.playerId);
    const regObj = registrations.find(
      (r) => r.corePlayerIds.includes(val.playerId) || r.subPlayerIds.includes(val.playerId)
    );
    const kda = (val.kills + val.assists) / Math.max(1, val.deaths);
    rows.push({
      playerId: val.playerId,
      nickname: pObj?.nickname || val.nickname,
      mlbbId: pObj ? `${pObj.mlbbId} (${pObj.serverId})` : '-',
      primaryRole: pObj?.primaryRole || 'Flex',
      teamName: regObj?.teamName || val.teamTag,
      teamTag: val.teamTag,
      matchesPlayed: val.matchesPlayed,
      kills: val.kills,
      deaths: val.deaths,
      assists: val.assists,
      kdaRatio: Number(kda.toFixed(2)),
      mvpCount: val.mvpCount,
      avgGold: Math.round(val.totalGold / Math.max(1, val.matchesPlayed)),
      avgRating: Number((val.totalRating / Math.max(1, val.matchesPlayed)).toFixed(2)),
      heroesUsed: Array.from(val.heroes),
    });
  });

  return rows.sort((a, b) => {
    if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.kdaRatio - a.kdaRatio;
  });
}

/** Asal slot kosong: kunci `${matchId}:A|B` -> "Pemenang M5" / "Kalah M3" (nomor = matchOrder). */
export function slotSources(matches: Match[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of matches) {
    if (m.nextWinnerMatchId && m.nextWinnerSlot) out.set(`${m.nextWinnerMatchId}:${m.nextWinnerSlot}`, `Pemenang M${m.matchOrder}`);
    if (m.nextLoserMatchId && m.nextLoserSlot) out.set(`${m.nextLoserMatchId}:${m.nextLoserSlot}`, `Kalah M${m.matchOrder}`);
  }
  return out;
}
