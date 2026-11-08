import React, { useState } from 'react';
import { BracketFormat, Match, Tournament, TournamentRegistration } from '../types/tournament';
import {
  bracketCapacity,
  bracketStarted,
  calculateStandings,
  getChampion,
  getDisplayTeamName,
  roundRobinCycles,
  seedOrder,
} from '../utils/bracketEngine';
import { Calendar, Crown, Edit3, Eye, Info, RefreshCw, Trophy } from 'lucide-react';

interface Props {
  tournament: Tournament;
  registrations: TournamentRegistration[];
  matches: Match[];
  canManage: boolean; // Admin atau Panitia
  onSelectMatch: (match: Match) => void;
  onUpdateSettings: (patch: Partial<Tournament>) => void;
  onSetSeed: (regId: string, seed: number | undefined) => void;
  onRegenerateBracket: () => void;
}

const FORMATS: { id: BracketFormat; label: string; hint: string }[] = [
  { id: 'single_elimination', label: 'Single Elimination', hint: 'Kalah 1x langsung gugur. Tim sisa langsung melaju (bye) lewat babak kualifikasi.' },
  { id: 'double_elimination', label: 'Double Elimination', hint: 'Gugur setelah kalah 2x. Kalah di Upper turun ke Lower; juara Upper vs juara Lower di Grand Final.' },
  { id: 'single_round_robin', label: 'Round Robin (Liga)', hint: 'Semua tim saling bertemu; juara = poin tertinggi (menang 3, seri 1, kalah 0).' },
];

const chip = (on: boolean) =>
  `px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${on ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`;

export const BracketAndStandingsView: React.FC<Props> = ({
  tournament,
  registrations,
  matches,
  canManage,
  onSelectMatch,
  onUpdateSettings,
  onSetSeed,
  onRegenerateBracket,
}) => {
  const [roundFilter, setRoundFilter] = useState<number | 'all'>('all');
  const [showSeeding, setShowSeeding] = useState(false);

  const fmt = tournament.bracketFormat === 'double_round_robin' ? 'single_round_robin' : tournament.bracketFormat;
  const isRR = fmt === 'single_round_robin';
  const isDE = fmt === 'double_elimination';
  const approved = registrations.filter((r) => r.status === 'approved');
  const capacity = bracketCapacity(tournament.bracketFormat);
  const started = bracketStarted(matches);
  const findReg = (id: string | null) => registrations.find((r) => r.id === id);
  const championId = getChampion(tournament, matches, registrations);
  const champion = findReg(championId);
  const done = matches.filter((m) => m.status === 'completed').length;
  const total = matches.filter((m) => !m.skipped).length;
  const status = started ? (championId ? 'Selesai' : 'Berlangsung') : approved.length < 2 ? 'Menunggu peserta' : 'Belum mulai';
  const cycles = roundRobinCycles(tournament);

  const card = (m: Match) => {
    const a = findReg(m.teamARegistrationId);
    const b = findReg(m.teamBRegistrationId);
    const complete = m.status === 'completed';
    const aWon = complete && !!a && m.winnerRegistrationId === a.id;
    const bWon = complete && !!b && m.winnerRegistrationId === b.id;
    const row = (reg: TournamentRegistration | undefined, score: number, won: boolean, last: boolean) => (
      <div className={`px-3 py-2 flex items-center justify-between ${last ? '' : 'border-b border-slate-800/60'} ${won ? 'bg-emerald-500/10' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono font-bold text-amber-400 w-9 truncate shrink-0">{reg ? reg.teamTag : '—'}</span>
          <span className={`text-xs truncate ${won ? 'font-bold text-slate-100' : reg ? 'text-slate-300' : 'text-slate-500 italic'}`}>
            {reg ? getDisplayTeamName(reg, registrations) : 'Menunggu pemenang'}
          </span>
        </div>
        <span className={`text-sm font-mono font-bold ml-2 ${won ? 'text-emerald-400' : 'text-slate-300'}`}>{reg || complete ? score : ''}</span>
      </div>
    );
    return (
      <div
        key={m.id}
        onClick={() => onSelectMatch(m)}
        className={`glass-card hover:border-amber-400/60 rounded-xl transition-all cursor-pointer overflow-hidden w-60 shrink-0 ${m.skipped ? 'opacity-40' : ''}`}
      >
        <div className="px-3 py-1.5 bg-[#091122]/85 border-b border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono">
          <span>M#{m.matchOrder} · BO{m.bestOf}{m.optional ? ' · cadangan' : ''}</span>
          {m.status === 'live' ? <span className="text-amber-400 font-bold">LIVE</span> : complete ? <span className="text-emerald-400">SELESAI</span> : m.skipped ? <span>TIDAK DIPERLUKAN</span> : <span>{m.scheduledTime}</span>}
        </div>
        {row(a, m.scoreA, aWon, false)}
        {row(b, m.scoreB, bWon, true)}
        <div className="px-3 py-1 bg-[#0B0F17]/60 border-t border-slate-800/60 flex items-center justify-end text-[10px] text-amber-400 font-medium gap-1">
          {canManage ? <><Edit3 className="w-3 h-3" /> Skor & Stats</> : <><Eye className="w-3 h-3" /> Detail ({m.playerStats.length})</>}
        </div>
      </div>
    );
  };

  /** Satu kolom per ronde; justify-around menjaga laga tiap ronde sejajar di tengah dua laga sumbernya. */
  const tree = (title: string, list: Match[], tone = 'text-amber-300') => {
    if (list.length === 0) return null;
    const rounds = Array.from(new Set(list.map((m) => m.roundNumber))).sort((x, y) => x - y);
    return (
      <div className="p-5 glass-panel rounded-xl space-y-4">
        <h3 className={`text-sm font-bold flex items-center gap-2 ${tone}`}>{title}</h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-8 min-w-max items-stretch">
            {rounds.map((rn, ri) => {
              const ms = list.filter((m) => m.roundNumber === rn).sort((x, y) => (x.pos ?? x.matchOrder) - (y.pos ?? y.matchOrder));
              const nextCount = list.filter((m) => m.roundNumber === rounds[ri + 1]).length;
              const hasNext = ri < rounds.length - 1;
              const pairs = hasNext && ms.length === nextCount * 2; // dua laga bergabung ke satu laga ronde berikutnya
              return (
                <div key={rn} className="flex flex-col">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-3">{ms[0].roundName}</div>
                  <div className="flex flex-col flex-1">
                    {ms.map((m, i) => (
                      <div key={m.id} className="relative flex items-center flex-1 py-2">
                        {card(m)}
                        {hasNext && <span className="absolute left-full top-1/2 w-4 border-t border-slate-600" />}
                        {ri > 0 && <span className="absolute right-full top-1/2 w-4 border-t border-slate-600" />}
                        {pairs && (
                          <span
                            className={`absolute left-[calc(100%+1rem)] border-l border-slate-600 ${i % 2 === 0 ? 'top-1/2 bottom-0' : 'top-0 bottom-1/2'}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const by = (stage: Match['stage']) => matches.filter((m) => m.stage === stage);
  const rrRounds = Array.from(new Set(matches.map((m) => m.roundNumber))).sort((x, y) => x - y);
  const standings = calculateStandings(registrations, matches);
  const seedList = seedOrder(approved);

  return (
    <div className="space-y-6">
      {/* Ringkasan + pengaturan */}
      <div className="p-4 glass-panel rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-100">{tournament.seriesSystem}</div>
            <p className="text-xs text-slate-300 mt-0.5">
              <span className="font-mono text-amber-300 font-bold">{approved.length}</span> tim terverifikasi (maks {capacity}) · Status:{' '}
              <span className="font-semibold text-slate-100">{status}</span> · Laga selesai{' '}
              <span className="font-mono text-amber-300">{done}/{total}</span>
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {!isRR && (
                <button type="button" onClick={() => setShowSeeding((v) => !v)} className="px-3 py-2 text-xs font-semibold glass-card hover:border-amber-400/50 text-slate-100 rounded-lg">
                  Atur Seeding
                </button>
              )}
              <button type="button" onClick={onRegenerateBracket} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold glass-card hover:border-amber-400/50 text-slate-100 rounded-lg">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Susun Ulang
              </button>
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1 p-1 bg-[#091122]/90 border border-white/10 rounded-lg">
              {FORMATS.map((f) => (
                <button key={f.id} type="button" onClick={() => fmt !== f.id && onUpdateSettings({ bracketFormat: f.id })} className={chip(fmt === f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 p-1 bg-[#091122]/90 border border-white/10 rounded-lg">
              {[1, 3, 5, 7].map((n) => (
                <button key={n} type="button" onClick={() => onUpdateSettings({ defaultBestOf: n as Tournament['defaultBestOf'] })} className={chip(tournament.defaultBestOf === n)}>
                  BO{n}
                </button>
              ))}
            </div>
            {fmt === 'single_elimination' && (
              <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                <input type="checkbox" checked={!!tournament.thirdPlaceMatch} onChange={(e) => onUpdateSettings({ thirdPlaceMatch: e.target.checked })} />
                Perebutan juara 3
              </label>
            )}
            {isDE && (
              <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                <input type="checkbox" checked={!!tournament.grandFinalReset} onChange={(e) => onUpdateSettings({ grandFinalReset: e.target.checked })} />
                Grand Final 2 laga (reset)
              </label>
            )}
            {isRR && (
              <div className="flex gap-1 p-1 bg-[#091122]/90 border border-white/10 rounded-lg">
                {([1, 2, 3] as const).map((n) => (
                  <button key={n} type="button" onClick={() => onUpdateSettings({ roundRobinCycles: n, bracketFormat: 'single_round_robin' })} className={chip(cycles === n)}>
                    {n}x
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 flex gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span>
            {FORMATS.find((f) => f.id === fmt)?.hint}{' '}
            {!isRR && 'Seed 1 bertemu seed terakhir; bila jumlah tim bukan pangkat 2, tim seed teratas mendapat bye. '}
            Mengubah skor laga yang sudah selesai otomatis memperbarui ronde berikutnya (laga setelahnya perlu diisi ulang).
          </span>
        </p>
      </div>

      {canManage && showSeeding && !isRR && (
        <div className="p-4 glass-panel rounded-xl space-y-3">
          <div className="text-sm font-bold text-slate-100">Seeding {started && <span className="text-xs font-normal text-amber-300">(laga sudah berjalan: mengubah seed akan menghapus hasil)</span>}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {seedList.map((r, i) => (
              <label key={r.id} className="flex items-center gap-2 text-xs text-slate-200 bg-[#091122]/70 border border-white/10 rounded-lg px-3 py-2">
                <input
                  type="number"
                  min={1}
                  max={approved.length}
                  defaultValue={r.seed ?? ''}
                  placeholder={String(i + 1)}
                  onBlur={(e) => {
                    const v = e.target.value === '' ? undefined : Math.max(1, Math.floor(Number(e.target.value)));
                    if (v !== r.seed) onSetSeed(r.id, v);
                  }}
                  className="w-14 bg-transparent border border-white/20 rounded px-1.5 py-1 font-mono"
                />
                <span className="font-mono text-amber-400">[{r.teamTag}]</span>
                <span className="truncate">{r.teamName}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">Kosongkan untuk mengikuti urutan waktu daftar. Seed yang diisi didahulukan.</p>
        </div>
      )}

      {approved.length < 2 && (
        <div className="p-6 glass-panel rounded-xl text-sm text-slate-300 text-center">
          Bracket muncul setelah minimal 2 tim disetujui di menu Verifikasi Pendaftaran.
        </div>
      )}
      {approved.length > capacity && (
        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-200">
          Format ini menampung maksimal {capacity} tim; {approved.length - capacity} tim terakhir tidak masuk bracket.
        </div>
      )}

      {champion && (
        <div className="p-4 rounded-xl border border-amber-400/50 bg-amber-500/10 flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-400" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-amber-300">Juara</div>
            <div className="text-base font-bold text-slate-100">[{champion.teamTag}] {champion.teamName}</div>
          </div>
        </div>
      )}

      {!isRR && matches.length > 0 && (
        <div className="space-y-6">
          {tree(isDE ? 'Upper Bracket' : 'Bagan Single Elimination', by('upper'))}
          {isDE && tree('Lower Bracket', by('lower'), 'text-rose-300')}
          {tree('Grand Final', by('grand_final'))}
          {tree('Perebutan Juara 3', by('third_place'), 'text-slate-200')}
        </div>
      )}

      {isRR && matches.length > 0 && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Klasemen — Round Robin {cycles}x</h3>
              <p className="text-xs text-slate-400">Menang seri 3 poin · seri 1 poin · kalah 0. Urutan: poin, selisih game, game menang.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0B0F17] text-xs font-medium text-slate-400">
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4">Tim</th>
                    <th className="py-2.5 px-4 text-right font-mono">Main</th>
                    <th className="py-2.5 px-4 text-right font-mono">M</th>
                    <th className="py-2.5 px-4 text-right font-mono">K</th>
                    <th className="py-2.5 px-4 text-right font-mono">Game</th>
                    <th className="py-2.5 px-4 text-right font-mono">Selisih</th>
                    <th className="py-2.5 px-4 text-right font-mono text-amber-400">Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {standings.map((row, i) => (
                    <tr key={row.registrationId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{i + 1}</td>
                      <td className="py-3 px-4"><span className="font-mono font-bold text-amber-400">[{row.teamTag}]</span> <span className="font-semibold text-slate-100">{row.teamName}{row.slotIndex > 1 ? ` #${row.slotIndex}` : ''}</span></td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">{row.played}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">{row.wins}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400">{row.losses}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{row.gameWins}-{row.gameLosses}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-400">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-400" /> Jadwal & Hasil</h3>
              <div className="flex flex-wrap gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg">
                <button type="button" onClick={() => setRoundFilter('all')} className={chip(roundFilter === 'all')}>Semua ({rrRounds.length})</button>
                {rrRounds.map((rn) => (
                  <button key={rn} type="button" onClick={() => setRoundFilter(rn)} className={chip(roundFilter === rn)}>Babak {rn}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {matches.filter((m) => roundFilter === 'all' || m.roundNumber === roundFilter).map(card)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
