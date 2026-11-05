// Uji cepat generator bracket: jalankan dengan `npm run check`.
import assert from 'node:assert/strict';
import { bracketCapacity, generateTournamentMatches, propagateMatchOutcome } from '../src/utils/bracketEngine.ts';
import { INITIAL_TOURNAMENTS } from '../src/data/initialData.ts';
import { registrationState, shiftDate, todayLocal } from '../src/utils/tournamentStatus.ts';

const base = INITIAL_TOURNAMENTS[0];
const regs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i}`, tournamentId: base.id, teamId: `t${i}`, teamName: `T${i}`, teamTag: `T${i}`, slotIndex: 1, captainName: '', whatsapp: '', corePlayerIds: [], subPlayerIds: [], feeTypeSnapshot: 'free', requirementSubmissions: [], status: 'approved', registeredAt: '' }) as any);

for (const n of [2, 3, 4, 5, 8, 9, 16, 17, 32]) {
  let ms = generateTournamentMatches({ ...base, bracketFormat: 'single_elimination' }, regs(n));
  const size = Math.max(4, 2 ** Math.ceil(Math.log2(n)));
  assert.equal(ms.length, size - 1, `SE ${n}`);
  for (const m of [...ms]) {
    const cur = ms.find((x) => x.id === m.id)!;
    if (cur.teamARegistrationId && cur.teamBRegistrationId) ms = propagateMatchOutcome(ms, { ...cur, status: 'completed', scoreA: 2, scoreB: 0 });
  }
  assert.ok(ms.every((m) => m.status === 'completed'), `SE ${n} semua laga bisa dimainkan`);
}
for (const n of [3, 4, 5, 9]) {
  const ms = generateTournamentMatches({ ...base, bracketFormat: 'single_round_robin', totalRounds: 99 }, regs(n));
  const pairs = new Set(ms.map((m) => [m.teamARegistrationId, m.teamBRegistrationId].sort().join('|')));
  assert.equal(pairs.size, ms.length, `RR ${n}: tidak ada pasangan berulang`);
  assert.equal(ms.length, (n * (n - 1)) / 2, `RR ${n}`);
}
assert.equal(generateTournamentMatches({ ...base, bracketFormat: 'double_elimination' }, regs(3)).length, 0);
assert.equal(generateTournamentMatches({ ...base, bracketFormat: 'double_elimination' }, regs(4)).length, 6);
assert.equal(bracketCapacity('double_elimination'), 4);
const t0 = { ...base, status: 'registration' as const };
assert.equal(registrationState({ ...t0, registrationCloseDate: shiftDate(todayLocal(), 1) }), 'open');
assert.equal(registrationState({ ...t0, registrationCloseDate: todayLocal() }), 'open', 'hari penutupan masih dibuka');
assert.equal(registrationState({ ...t0, registrationCloseDate: shiftDate(todayLocal(), -1) }), 'closed');
assert.equal(registrationState({ ...t0, status: 'completed', registrationCloseDate: shiftDate(todayLocal(), 9) }), 'done');
console.log('engine-check OK');
