import React, { useState, useMemo } from 'react';
import {
  Match,
  Player,
  Tournament,
  TournamentRegistration,
} from '../types/tournament';
import { aggregatePlayerLeaderboard } from '../utils/bracketEngine';
import { Award, BarChart3, Edit3, Search, Swords } from 'lucide-react';

interface PlayerStatsLeaderboardViewProps {
  tournaments: Tournament[];
  selectedTournamentId: string;
  players: Player[];
  matches: Match[];
  registrations: TournamentRegistration[];
  canManage: boolean;
  onSelectMatch: (match: Match) => void;
}

export const PlayerStatsLeaderboardView: React.FC<
  PlayerStatsLeaderboardViewProps
> = ({
  tournaments,
  selectedTournamentId,
  players,
  matches,
  registrations,
  canManage,
  onSelectMatch,
}) => {
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'mvp' | 'rating' | 'kda' | 'gold'>('mvp');

  const leaderboard = useMemo(() => {
    const raw = aggregatePlayerLeaderboard(
      players,
      matches,
      registrations,
      scope === 'current' ? selectedTournamentId : undefined
    );

    return raw
      .filter((row) => {
        const matchRole = roleFilter === 'all' || row.primaryRole === roleFilter;
        const matchSearch =
          !searchQuery.trim() ||
          row.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.teamTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.heroesUsed.some((h) =>
            h.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return matchRole && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'mvp') {
          if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
          return b.avgRating - a.avgRating;
        }
        if (sortBy === 'rating') return b.avgRating - a.avgRating;
        if (sortBy === 'kda') return b.kdaRatio - a.kdaRatio;
        return b.avgGold - a.avgGold;
      });
  }, [players, matches, registrations, scope, selectedTournamentId, roleFilter, searchQuery, sortBy]);

  const relevantMatches = useMemo(() => {
    return matches.filter((m) =>
      scope === 'current' ? m.tournamentId === selectedTournamentId : true
    );
  }, [matches, scope, selectedTournamentId]);

  const topMvpPlayer = leaderboard[0];

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Sistem Pelaporan Statistik Performa Individu Pemain
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Rekapitulasi Hero, Role, Kill/Death/Assist (KDA), gelar MVP, rata-rata Gold, dan Match Rating dari setiap laga
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setScope('current')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === 'current'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Turnamen Aktif Ini
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Akumulasi Semua Turnamen
            </button>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="all">Semua Role MLBB</option>
            <option value="Jungler">Jungler</option>
            <option value="Gold Lane">Gold Lane</option>
            <option value="Mid Lane">Mid Lane</option>
            <option value="EXP Lane">EXP Lane</option>
            <option value="Roamer">Roamer</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'mvp' | 'rating' | 'kda' | 'gold')
            }
            className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="mvp">Urutkan: Total MVP</option>
            <option value="rating">Urutkan: Rata-rata Rating</option>
            <option value="kda">Urutkan: Rasio KDA</option>
            <option value="gold">Urutkan: Rata-rata Gold</option>
          </select>
        </div>
      </div>

      {/* Top MVP Spotlight Strip */}
      {topMvpPlayer && (
        <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-semibold">
                Pemuncak Klasemen MVP & Performa Individu
              </div>
              <div className="text-base font-bold text-slate-100">
                {topMvpPlayer.nickname}{' '}
                <span className="text-xs font-mono text-slate-400 font-normal">
                  ([{topMvpPlayer.teamTag}] {topMvpPlayer.teamName} ·{' '}
                  {topMvpPlayer.primaryRole})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Gelar MVP</span>
              <span className="text-sm font-bold text-amber-400">
                {topMvpPlayer.mvpCount}x MVP
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Rasio KDA</span>
              <span className="text-sm font-bold text-emerald-400">
                {topMvpPlayer.kdaRatio} ({topMvpPlayer.kills}/{topMvpPlayer.deaths}/
                {topMvpPlayer.assists})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Rata-rata Gold</span>
              <span className="text-sm font-bold text-slate-100">
                {topMvpPlayer.avgGold.toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Match Rating</span>
              <span className="text-sm font-bold text-amber-300">
                {topMvpPlayer.avgRating} / 10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Leaderboard Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-100">
            Leaderboard Performa Individu Pemain ({leaderboard.length} Pemain Tercatat)
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nickname, Tim, atau Hero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B0F17] text-xs font-medium text-slate-400">
                <th className="py-2.5 px-4 w-10">#</th>
                <th className="py-2.5 px-4">Nickname & ID MLBB</th>
                <th className="py-2.5 px-4">Tim</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Hero Digunakan</th>
                <th className="py-2.5 px-3 text-right font-mono">Laga</th>
                <th className="py-2.5 px-3 text-right font-mono">K / D / A</th>
                <th className="py-2.5 px-3 text-right font-mono">KDA Ratio</th>
                <th className="py-2.5 px-4 text-right font-mono">Avg Gold</th>
                <th className="py-2.5 px-3 text-right font-mono">Rating</th>
                <th className="py-2.5 px-4 text-right font-mono text-amber-400">
                  MVP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Belum ada catatan statistik pemain pada filter ini. Klik salah satu pertandingan di bawah untuk menginput statistik laga.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row, idx) => (
                  <tr
                    key={row.playerId}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">
                        {row.nickname}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        ID: {row.mlbbId}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                      [{row.teamTag}]
                    </td>
                    <td className="py-3 px-4 text-slate-300">{row.primaryRole}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {row.heroesUsed.join(' · ') || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {row.matchesPlayed}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      <span className="text-emerald-400">{row.kills}</span> /{' '}
                      <span className="text-rose-400">{row.deaths}</span> /{' '}
                      <span className="text-sky-400">{row.assists}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {row.kdaRatio}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300">
                      {row.avgGold.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                      {row.avgRating}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                      {row.mvpCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match-by-Match Report Cards to Input / Inspect Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            Daftar Laporan Performa per Pertandingan
          </h4>
          <span className="text-xs text-slate-400">
            Klik pertandingan untuk {canManage ? 'menginput/mengedit' : 'melihat'} statistik 10 pemain
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {relevantMatches.map((m) => {
            const regA = registrations.find((r) => r.id === m.teamARegistrationId);
            const regB = registrations.find((r) => r.id === m.teamBRegistrationId);
            const mvpRow = m.playerStats.find((ps) => ps.isMvp);
            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="p-4 bg-[#111827] border border-slate-800 hover:border-amber-500/60 rounded-xl cursor-pointer transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>
                    {m.roundName} (M#{m.matchOrder})
                  </span>
                  <span>
                    {m.scoreA} - {m.scoreB}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {regA ? regA.teamName : 'TBD'} vs {regB ? regB.teamName : 'TBD'}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>
                    {mvpRow ? (
                      <>
                        MVP:{' '}
                        <strong className="text-amber-400">
                          {mvpRow.playerNickname} ({mvpRow.heroName})
                        </strong>
                      </>
                    ) : (
                      'Belum ada data MVP'
                    )}
                  </span>
                  <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    {canManage ? 'Input Stats' : 'Lihat Stats'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
