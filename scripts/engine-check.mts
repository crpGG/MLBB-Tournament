// Uji mesin bracket: jalankan dengan `npm run check`. Memainkan turnamen penuh secara acak untuk banyak jumlah tim.
import assert from 'node:assert/strict';
import {
  bracketCapacity,
  bracketStarted,
  describeSeries,
  generateTournamentMatches,
  getChampion,
  propagateMatchOutcome,
  seedOrder,
} from '../src/utils/bracketEngine.ts';
import { getPodium } from '../src/utils/posterSvg.ts';
import { INITIAL_TOURNAMENTS } from '../src/data/initialData.ts';
import { registrationState, shiftDate, todayLocal } from '../src/utils/tournamentStatus.ts';
import type { Match, Tournament, TournamentRegistration } from '../src/types/tournament.ts';

const base = INITIAL_TOURNAMENTS[0];
const T = (bracketFormat: Tournament['bracketFormat'], extra: Partial<Tournament> = {}): Tournament => ({ ...base, bracketFormat, defaultBestOf: 3, thirdPlaceMatch: false, grandFinalReset: false, roundRobinCycles: undefined, ...extra });
const regs = (n: number): TournamentRegistration[] =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}`, tournamentId: base.id, teamId: `t${i}`, teamName: `T${i + 1}`, teamTag: `T${i + 1}`, slotIndex: 1, captainName: '', whatsapp: '', corePlayerIds: [], subPlayerIds: [], feeTypeSnapshot: 'free', requirementSubmissions: [], status: 'approved', registeredAt: `2026-01-01T00:${String(i).padStart(2, '0')}` }) as TournamentRegistration);

// pengacak deterministik supaya hasil uji bisa diulang
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const done = (m: Match, aWins: boolean): Match => ({ ...m, status: 'completed', scoreA: aWins ? 2 : 0, scoreB: aWins ? 0 : 2 });
/** Memainkan semua laga yang kedua timnya sudah ada, sampai tidak ada lagi. */
function play(ms: Match[], pick: (m: Match) => boolean = () => rnd() < 0.5): Match[] {
  for (let guard = 0; guard < 10000; guard++) {
    const m = ms.find((x) => x.status !== 'completed' && !x.skipped && x.teamARegistrationId && x.teamBRegistrationId);
    if (!m) return ms;
    ms = propagateMatchOutcome(ms, done(m, pick(m)));
  }
  throw new Error('simulasi tidak selesai');
}
const losses = (ms: Match[]) => {
  const l = new Map<string, number>();
  for (const m of ms) if (m.status === 'completed') { const loser = m.winnerRegistrationId === m.teamARegistrationId ? m.teamBRegistrationId! : m.teamARegistrationId!; l.set(loser, (l.get(loser) ?? 0) + 1); }
  return l;
};
function checkStructure(ms: Match[], n: number, label: string) {
  const ids = new Set(ms.map((m) => m.id));
  assert.equal(ids.size, ms.length, `${label}: id laga unik`);
  for (const m of ms) {
    for (const p of [m.nextWinnerMatchId, m.nextLoserMatchId, m.resetMatchId]) if (p) assert.ok(ids.has(p), `${label}: penunjuk ${p} valid`);
  }
  // tiap tim ditempatkan tepat satu kali di slot awal
  const placed = ms.flatMap((m) => [m.teamARegistrationId, m.teamBRegistrationId]).filter(Boolean) as string[];
  assert.equal(new Set(placed).size, placed.length, `${label}: tim tidak ganda di slot awal`);
  assert.ok(placed.length <= n);
}

// ---------- Single Elimination: n = 2..33 dan 64
for (const n of [...Array.from({ length: 32 }, (_, i) => i + 2), 64]) {
  for (const third of [false, true]) {
    const t = T('single_elimination', { thirdPlaceMatch: third });
    let ms = generateTournamentMatches(t, regs(n));
    const expected = n - 1 + (third && n >= 4 ? 1 : 0);
    assert.equal(ms.length, expected, `SE n=${n} third=${third}: jumlah laga`);
    checkStructure(ms, n, `SE ${n}`);
    assert.ok(!ms.some((m) => m.status !== 'scheduled'), `SE ${n}: tidak ada laga bye yang "selesai"`);
    ms = play(ms);
    assert.ok(ms.every((m) => m.status === 'completed'), `SE ${n}: semua laga selesai`);
    const champ = getChampion(t, ms, regs(n));
    assert.ok(champ, `SE ${n}: ada juara`);
    const l = losses(ms);
    for (let i = 1; i <= n; i++) {
      const id = `r${i}`;
      if (id === champ) assert.ok(!l.has(id), `SE ${n}: juara tidak pernah kalah`);
      else if (third && n >= 4) assert.ok((l.get(id) ?? 0) <= 2 && (l.get(id) ?? 0) >= 1, `SE ${n}: kalah 1x (juara 3 boleh 2x)`);
      else assert.equal(l.get(id), 1, `SE ${n}: ${id} kalah tepat 1x`);
    }
  }
}
// pairing seed standar (8 tim): 1v8, 4v5, 2v7, 3v6; 5 tim: hanya 4v5 di ronde 1, seed 1 langsung ke ronde 2
{
  const ms = generateTournamentMatches(T('single_elimination'), regs(8));
  const pairs = ms.filter((m) => m.roundNumber === 1).map((m) => [m.teamARegistrationId, m.teamBRegistrationId].sort().join('-'));
  assert.deepEqual(pairs.sort(), ['r1-r8', 'r2-r7', 'r3-r6', 'r4-r5']);
  const five = generateTournamentMatches(T('single_elimination'), regs(5));
  const r1 = five.filter((m) => m.roundNumber === 1);
  assert.equal(r1.length, 1, '5 tim: satu laga kualifikasi');
  assert.deepEqual([r1[0].teamARegistrationId, r1[0].teamBRegistrationId].sort(), ['r4', 'r5']);
  const r2 = five.filter((m) => m.roundNumber === 2);
  assert.ok(r2.some((m) => m.teamARegistrationId === 'r1' || m.teamBRegistrationId === 'r1'), 'seed 1 langsung di ronde 2');
}

// ---------- Double Elimination: n = 3..32, Grand Final 1 laga dan 2 laga
for (let n = 3; n <= 32; n++) {
  for (const reset of [false, true]) {
    const t = T('double_elimination', { grandFinalReset: reset });
    let ms = generateTournamentMatches(t, regs(n));
    assert.equal(ms.length, 2 * n - 2 + (reset ? 1 : 0), `DE n=${n} reset=${reset}: jumlah laga`);
    checkStructure(ms, n, `DE ${n}`);
    ms = play(ms);
    const open = ms.filter((m) => m.status !== 'completed' && !m.skipped);
    assert.equal(open.length, 0, `DE ${n}: tidak ada laga tersisa`);
    const champ = getChampion(t, ms, regs(n));
    assert.ok(champ, `DE ${n}: ada juara`);
    const l = losses(ms);
    let oneLoss = 0;
    for (let i = 1; i <= n; i++) {
      const c = l.get(`r${i}`) ?? 0;
      assert.ok(c <= 2, `DE ${n}: tidak ada yang kalah lebih dari 2x`);
      if (`r${i}` === champ) assert.ok(c <= 1, `DE ${n}: juara kalah paling banyak 1x`);
      else if (c === 1) oneLoss++;
      else assert.equal(c, 2, `DE ${n}: yang gugur kalah tepat 2x`);
    }
    assert.ok(oneLoss <= (reset ? 0 : 1), `DE ${n}: hanya runner-up Grand Final 1 laga yang boleh kalah 1x`);
  }
}
// Grand Final 2 laga: juara Lower menang laga 1 -> laga reset dimainkan; juara Upper menang -> laga reset dilewati
{
  const t = T('double_elimination', { grandFinalReset: true });
  const run = (lowerWinsFirst: boolean, upperWinsSecond: boolean) => {
    let ms = play(generateTournamentMatches(t, regs(4)), (m) => (m.stage === 'grand_final' ? !m.optional && !lowerWinsFirst : true));
    return { ms, g1: ms.find((m) => m.stage === 'grand_final' && !m.optional)!, g2: ms.find((m) => m.optional)! };
  };
  const a = run(true, true);
  assert.equal(a.g2.skipped, false);
  assert.ok(a.g2.teamARegistrationId && a.g2.teamBRegistrationId, 'reset: kedua tim masuk laga ke-2');
  assert.equal(getChampion(t, a.ms, regs(4)), a.g2.winnerRegistrationId);
  const b = run(false, false);
  assert.equal(b.g2.skipped, true, 'juara Upper menang: laga ke-2 dilewati');
  assert.equal(getChampion(t, b.ms, regs(4)), b.g1.winnerRegistrationId);
}

// ---------- Round Robin: semua bertemu semua 1x/2x/3x, tidak ada tim main dua kali di satu babak
for (let n = 2; n <= 12; n++) {
  for (const c of [1, 2, 3] as const) {
    const ms = generateTournamentMatches(T('single_round_robin', { roundRobinCycles: c }), regs(n));
    assert.equal(ms.length, (c * n * (n - 1)) / 2, `RR n=${n} ${c}x: jumlah laga`);
    const pairs = new Map<string, number>();
    for (const m of ms) { const k = [m.teamARegistrationId, m.teamBRegistrationId].sort().join('-'); pairs.set(k, (pairs.get(k) ?? 0) + 1); }
    assert.ok([...pairs.values()].every((v) => v === c), `RR n=${n} ${c}x: tiap pasangan tepat ${c}x`);
    const byRound = new Map<number, string[]>();
    for (const m of ms) byRound.set(m.roundNumber, [...(byRound.get(m.roundNumber) ?? []), m.teamARegistrationId!, m.teamBRegistrationId!]);
    for (const teams of byRound.values()) assert.equal(new Set(teams).size, teams.length, `RR n=${n}: tidak ada tim main dua kali dalam satu babak`);
  }
}
assert.equal(generateTournamentMatches(T('double_round_robin'), regs(4)).length, 12, "format lama 'double_round_robin' = 2x");

// ---------- Ubah hasil: laga lanjutan yang sudah berisi hasil lama direset (seperti Challonge)
{
  const t = T('single_elimination');
  let ms = play(generateTournamentMatches(t, regs(8)), () => true); // unggulan atas selalu menang
  assert.equal(getChampion(t, ms, regs(8)), 'r1');
  const qf = ms.find((m) => m.roundNumber === 1 && m.teamARegistrationId === 'r1')!; // r1 v r8
  ms = propagateMatchOutcome(ms, done(qf, false)); // ralat: r8 yang menang
  const sf = ms.find((m) => m.roundNumber === 2 && (m.teamARegistrationId === 'r8' || m.teamBRegistrationId === 'r8'))!;
  assert.equal(sf.status, 'scheduled', 'semifinal terdampak direset');
  assert.equal(sf.scoreA + sf.scoreB, 0);
  const fin = ms.find((m) => m.stage === 'grand_final')!;
  assert.equal(fin.status, 'scheduled', 'final direset');
  assert.equal(getChampion(t, ms, regs(8)), null, 'juara belum ada setelah hasil diralat');
  ms = play(ms, () => true);
  assert.ok(getChampion(t, ms, regs(8)), 'bisa dimainkan lagi sampai selesai');
  // seri di laga gugur tidak memajukan siapa pun
  const t4 = generateTournamentMatches(t, regs(4));
  const m0 = t4.find((m) => m.roundNumber === 1)!;
  const drawn = propagateMatchOutcome(t4, { ...m0, status: 'completed', scoreA: 1, scoreB: 1 });
  assert.equal(drawn.find((m) => m.id === m0.nextWinnerMatchId)!.teamARegistrationId, null);
  assert.equal(bracketStarted(t4), false);
  assert.equal(bracketStarted(drawn), true);
}

// ---------- Seed
{
  const rs = regs(4).map((r, i) => ({ ...r, seed: i === 3 ? 1 : undefined }));
  assert.deepEqual(seedOrder(rs).map((r) => r.id), ['r4', 'r1', 'r2', 'r3'], 'seed eksplisit dulu, sisanya menurut waktu daftar');
  const ms = generateTournamentMatches(T('single_elimination'), rs);
  assert.deepEqual(ms.filter((m) => m.roundNumber === 1).map((m) => [m.teamARegistrationId, m.teamBRegistrationId].sort().join('-')).sort(), ['r1-r2', 'r3-r4']);
}

// ---------- Kapasitas, ringkasan, status pendaftaran
assert.equal(bracketCapacity('double_elimination'), 32);
assert.match(describeSeries(T('single_elimination', { thirdPlaceMatch: true })), /Single Elimination .*Juara 3/);
assert.match(describeSeries(T('double_elimination', { grandFinalReset: true })), /2 laga/);
assert.equal(describeSeries(T('single_round_robin', { roundRobinCycles: 2 })), 'Round Robin 2x | BO3');
const t0 = { ...base, status: 'registration' as const };
assert.equal(registrationState({ ...t0, registrationCloseDate: shiftDate(todayLocal(), 1) }), 'open');
assert.equal(registrationState({ ...t0, registrationCloseDate: todayLocal() }), 'open', 'hari penutupan masih dibuka');
assert.equal(registrationState({ ...t0, registrationCloseDate: shiftDate(todayLocal(), -1) }), 'closed');
assert.equal(registrationState({ ...t0, status: 'completed', registrationCloseDate: shiftDate(todayLocal(), 9) }), 'done');
// ---------- Podium poster: tiga peringkat berbeda dan terisi untuk SE+juara 3, DE, dan liga
for (const [fmt, extra] of [['single_elimination', { thirdPlaceMatch: true }], ['double_elimination', {}], ['single_round_robin', {}]] as const) {
  const t = T(fmt, extra);
  const rs = regs(6);
  const ms = play(generateTournamentMatches(t, rs));
  const pod = getPodium(t, ms, rs);
  assert.ok(pod.every(Boolean) && new Set(pod).size === 3, `${fmt}: podium lengkap dan unik`);
  assert.equal(pod[0], getChampion(t, ms, rs), `${fmt}: juara = podium[0]`);
}

console.log('engine-check OK');
