import React, { useState } from 'react';
import {
  BracketFormat,
  Match,
  Tournament,
  TournamentRegistration,
} from '../types/tournament';
import {
  calculateStandings,
  getDisplayTeamName,
} from '../utils/bracketEngine';
import {
  Award,
  Calendar,
  Edit3,
  Eye,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface BracketAndStandingsViewProps {
  tournament: Tournament;
  registrations: TournamentRegistration[];
  matches: Match[];
  canManage: boolean; // Admin or Panitia
  onSelectMatch: (match: Match) => void;
  onChangeBracketFormat: (format: BracketFormat) => void;
  onRegenerateBracket: () => void;
}

export const BracketAndStandingsView: React.FC<BracketAndStandingsViewProps> = ({
  tournament,
  registrations,
  matches,
  canManage,
  onSelectMatch,
  onChangeBracketFormat,
  onRegenerateBracket,
}) => {
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<number | 'all'>('all');

  const approvedRegs = registrations.filter((r) => r.status === 'approved');
  const standings = calculateStandings(registrations, matches);

  const findReg = (regId: string | null) =>
    registrations.find((r) => r.id === regId);

  const renderMatchCard = (m: Match) => {
    const regA = findReg(m.teamARegistrationId);
    const regB = findReg(m.teamBRegistrationId);
    const aWon = m.status === 'completed' && m.winnerRegistrationId === m.teamARegistrationId && m.teamARegistrationId !== null;
    const bWon = m.status === 'completed' && m.winnerRegistrationId === m.teamBRegistrationId && m.teamBRegistrationId !== null;

    return (
      <div
        key={m.id}
        onClick={() => onSelectMatch(m)}
        className="glass-card hover:border-amber-400/60 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer overflow-hidden"
      >
        {/* Top Meta Bar */}
        <div className="px-3.5 py-2 bg-[#091122]/85 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-300 font-mono">
          <span>
            M#{m.matchOrder} · BO{m.bestOf}
          </span>
          <span>
            {m.status === 'live' ? (
              <span className="text-amber-400 font-bold">LIVE SEKARANG</span>
            ) : m.status === 'completed' ? (
              <span className="text-emerald-400">SELESAI</span>
            ) : (
              <span>{m.scheduledTime}</span>
            )}
          </span>
        </div>

        {/* Team A Row */}
        <div
          className={`px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/60 ${
            aWon ? 'bg-emerald-500/10' : ''
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-bold text-amber-400 w-10 truncate shrink-0">
              {regA ? regA.teamTag : 'TBD'}
            </span>
            <span
              className={`text-xs truncate ${
                aWon ? 'font-bold text-slate-100' : 'text-slate-300'
              }`}
            >
              {getDisplayTeamName(regA, registrations)}
            </span>
          </div>
          <span
            className={`text-sm font-mono font-bold ml-2 ${
              aWon ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            {m.scoreA}
          </span>
        </div>

        {/* Team B Row */}
        <div
          className={`px-3.5 py-2.5 flex items-center justify-between ${
            bWon ? 'bg-emerald-500/10' : ''
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-bold text-amber-400 w-10 truncate shrink-0">
              {regB ? regB.teamTag : 'TBD'}
            </span>
            <span
              className={`text-xs truncate ${
                bWon ? 'font-bold text-slate-100' : 'text-slate-300'
              }`}
            >
              {getDisplayTeamName(regB, registrations)}
            </span>
          </div>
          <span
            className={`text-sm font-mono font-bold ml-2 ${
              bWon ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            {m.scoreB}
          </span>
        </div>

        {/* Footer Action Hint */}
        <div className="px-3 py-1.5 bg-[#0B0F17]/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{m.roomName || 'Custom Draft Pick'}</span>
          <span className="inline-flex items-center gap-1 text-amber-400 shrink-0 font-medium">
            {canManage ? (
              <>
                <Edit3 className="w-3 h-3" /> Skor & Stats
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" /> Detail Stats ({m.playerStats.length})
              </>
            )}
          </span>
        </div>
      </div>
    );
  };

  // Group Elimination stages
  const upperMatches = matches.filter((m) => m.stage === 'upper');
  const lowerMatches = matches.filter((m) => m.stage === 'lower');
  const grandFinalMatches = matches.filter((m) => m.stage === 'grand_final');

  const upperRounds = Array.from(new Set(upperMatches.map((m) => m.roundNumber))).sort(
    (a, b) => a - b
  );
  const lowerRounds = Array.from(new Set(lowerMatches.map((m) => m.roundNumber))).sort(
    (a, b) => a - b
  );

  // Round-robin rounds
  const allRoundNumbers = Array.from(new Set(matches.map((m) => m.roundNumber))).sort(
    (a, b) => a - b
  );

  return (
    <div className="space-y-6">
      {/* Format Controls & Bracket Generator Bar */}
      <div className="p-4 glass-panel rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-slate-100">
            Bagan Kompetisi & Jadwal Real-Time — {tournament.seriesSystem}
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Tim Terverifikasi: <span className="font-mono text-amber-300 font-bold">{approvedRegs.length}</span> Tim · Klik kartu pertandingan untuk {canManage ? 'mengubah jadwal, skor real-time, dan statistik individu pemain' : 'melihat detail hasil & statistik pemain'}
          </p>
        </div>

        {/* Interactive Format Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#091122]/90 border border-white/10 rounded-lg">
            {(
              [
                { id: 'single_elimination', label: 'Single Elimination' },
                { id: 'double_elimination', label: 'Double Elimination' },
                { id: 'single_round_robin', label: 'Single Round-Robin' },
                { id: 'double_round_robin', label: 'Double Round-Robin' },
              ] as { id: BracketFormat; label: string }[]
            ).map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onChangeBracketFormat(fmt.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  tournament.bracketFormat === fmt.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={onRegenerateBracket}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold glass-card hover:border-amber-400/50 text-slate-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              Generate Ulang Bracket
            </button>
          )}
        </div>
      </div>

      {/* 1. SINGLE OR DOUBLE ELIMINATION VIEW */}
      {(tournament.bracketFormat === 'single_elimination' ||
        tournament.bracketFormat === 'double_elimination') && (
        <div className="space-y-8">
          {/* Upper Bracket + Grand Final */}
          <div className="p-5 glass-panel rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                {tournament.bracketFormat === 'double_elimination'
                  ? 'Upper Bracket & Grand Final'
                  : 'Bagan Gugur Tunggal (Single Elimination)'}
              </h3>
              <span className="text-xs text-slate-300">
                Pemenang otomatis melaju ke babak berikutnya
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {upperRounds.map((rNum) => {
                const roundMatches = upperMatches.filter((m) => m.roundNumber === rNum);
                return (
                  <div key={`ub-r-${rNum}`} className="space-y-3">
                    <div className="text-xs font-semibold text-amber-300/90 uppercase tracking-wider">
                      {roundMatches[0]?.roundName.replace(/\s\d+$/, '') ||
                        `Babak ${rNum}`}
                    </div>
                    <div className="space-y-4">
                      {roundMatches.map((m) => renderMatchCard(m))}
                    </div>
                  </div>
                );
              })}

              {/* Grand Final Column */}
              {grandFinalMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Grand Final (Penentuan Juara)
                  </div>
                  <div className="space-y-4">
                    {grandFinalMatches.map((m) => renderMatchCard(m))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lower Bracket (Only for Double Elimination) */}
          {tournament.bracketFormat === 'double_elimination' &&
            lowerMatches.length > 0 && (
              <div className="p-5 glass-panel rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-rose-300">
                    Lower Bracket (Kesempatan Kedua Sebelum Gugur)
                  </h3>
                  <span className="text-xs text-slate-300">
                    Tim yang kalah di Upper Bracket otomatis turun ke Lower Bracket
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {lowerRounds.map((rNum) => {
                    const roundMatches = lowerMatches.filter(
                      (m) => m.roundNumber === rNum
                    );
                    return (
                      <div key={`lb-r-${rNum}`} className="space-y-3">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          {roundMatches[0]?.roundName || `Lower Babak ${rNum}`}
                        </div>
                        <div className="space-y-4">
                          {roundMatches.map((m) => renderMatchCard(m))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      )}

      {/* 2. SINGLE ROUND-ROBIN OR DOUBLE ROUND-ROBIN (LIGA) VIEW */}
      {(tournament.bracketFormat === 'single_round_robin' ||
        tournament.bracketFormat === 'double_round_robin') && (
        <div className="space-y-6">
          {/* Standings Table */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Tabel Klasemen Sementara —{' '}
                  {tournament.bracketFormat === 'double_round_robin'
                    ? 'Double Round-Robin (2 Putaran)'
                    : 'Single Round-Robin / Sistem Liga'}
                </h3>
                <p className="text-xs text-slate-400">
                  Menang Seri = 3 Poin · Seri = 1 Poin · Kalah = 0 Poin
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400">
                Total {allRoundNumbers.length} Babak Terjadwal
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0B0F17] text-xs font-medium text-slate-400">
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4">Tim Peserta</th>
                    <th className="py-2.5 px-4 text-right font-mono">Main (P)</th>
                    <th className="py-2.5 px-4 text-right font-mono">Menang (W)</th>
                    <th className="py-2.5 px-4 text-right font-mono">Kalah (L)</th>
                    <th className="py-2.5 px-4 text-right font-mono">Game W-L</th>
                    <th className="py-2.5 px-4 text-right font-mono">Selisih</th>
                    <th className="py-2.5 px-4 text-right font-mono text-amber-400">
                      Poin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {standings.map((row, index) => (
                    <tr
                      key={row.registrationId}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-amber-400">
                            [{row.teamTag}]
                          </span>
                          <span className="font-semibold text-slate-100">
                            {row.teamName}
                            {row.slotIndex > 1 ? ` #${row.slotIndex}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">
                        {row.played}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                        {row.wins}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400">
                        {row.losses}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {row.gameWins} - {row.gameLosses}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-400">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Round Filter & Match Cards per Babak */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Jadwal & Hasil per Babak ({tournament.seriesSystem})
              </h3>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectedRoundFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    selectedRoundFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua Babak ({allRoundNumbers.length})
                </button>
                {allRoundNumbers.map((rn) => (
                  <button
                    key={rn}
                    type="button"
                    onClick={() => setSelectedRoundFilter(rn)}
                    className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${
                      selectedRoundFilter === rn
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Babak {rn}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches
                .filter(
                  (m) =>
                    selectedRoundFilter === 'all' ||
                    m.roundNumber === selectedRoundFilter
                )
                .map((m) => renderMatchCard(m))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
