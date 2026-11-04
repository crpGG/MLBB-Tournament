import React, { useState, useEffect } from 'react';
import {
  Match,
  MLBBHeroRole,
  Player,
  PlayerMatchStat,
  TournamentRegistration,
} from '../types/tournament';
import { MLBB_HEROES } from '../utils/bracketEngine';
import { Award, Check, Sparkles, Trophy, X } from 'lucide-react';

interface MatchScoreStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  registrations: TournamentRegistration[];
  players: Player[];
  canEdit: boolean; // true for admin & panitia, false for pengunjung
  onSaveMatch: (updatedMatch: Match) => void;
}

export const MatchScoreStatsModal: React.FC<MatchScoreStatsModalProps> = ({
  isOpen,
  onClose,
  match,
  registrations,
  players,
  canEdit,
  onSaveMatch,
}) => {
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<'scheduled' | 'live' | 'completed'>('scheduled');
  const [scheduledDate, setScheduledDate] = useState<string>('2026-10-14');
  const [scheduledTime, setScheduledTime] = useState<string>('13:00 WIB');
  const [roomName, setRoomName] = useState<string>('');
  const [playerStats, setPlayerStats] = useState<PlayerMatchStat[]>([]);

  const regA = registrations.find((r) => r.id === match?.teamARegistrationId);
  const regB = registrations.find((r) => r.id === match?.teamBRegistrationId);

  useEffect(() => {
    if (!match) return;
    setScoreA(match.scoreA);
    setScoreB(match.scoreB);
    setStatus(match.status);
    setScheduledDate(match.scheduledDate);
    setScheduledTime(match.scheduledTime);
    setRoomName(match.roomName || '');

    if (match.playerStats && match.playerStats.length > 0) {
      setPlayerStats(match.playerStats);
    } else {
      // Build default 10-player stat rows from Team A and Team B core rosters
      const initialRows: PlayerMatchStat[] = [];
      const defaultHeroesA = ['Hayabusa', 'Valentina', 'Claude', 'Arlott', 'Tigreal'];
      const defaultHeroesB = ['Suyou', 'Zhuxin', 'Karrie', 'Terizla', 'Minotaur'];

      if (regA) {
        regA.corePlayerIds.forEach((pid, idx) => {
          const p = players.find((x) => x.id === pid);
          initialRows.push({
            playerId: pid,
            playerNickname: p?.nickname || `Player A${idx + 1}`,
            teamRegistrationId: regA.id,
            teamTag: regA.teamTag,
            heroName: p?.signatureHeroes?.[0] || defaultHeroesA[idx % 5],
            role: p?.primaryRole || 'Jungler',
            kills: 0,
            deaths: 0,
            assists: 0,
            gold: 10500,
            rating: 7.5,
            isMvp: false,
          });
        });
      }

      if (regB) {
        regB.corePlayerIds.forEach((pid, idx) => {
          const p = players.find((x) => x.id === pid);
          initialRows.push({
            playerId: pid,
            playerNickname: p?.nickname || `Player B${idx + 1}`,
            teamRegistrationId: regB.id,
            teamTag: regB.teamTag,
            heroName: p?.signatureHeroes?.[0] || defaultHeroesB[idx % 5],
            role: p?.primaryRole || 'Jungler',
            kills: 0,
            deaths: 0,
            assists: 0,
            gold: 10200,
            rating: 7.2,
            isMvp: false,
          });
        });
      }

      setPlayerStats(initialRows);
    }
  }, [match, regA?.id, regB?.id]);

  if (!isOpen || !match) return null;

  const handleUpdateStat = (
    playerId: string,
    field: keyof PlayerMatchStat,
    value: string | number | boolean
  ) => {
    setPlayerStats((prev) =>
      prev.map((row) => {
        if (field === 'isMvp' && value === true) {
          // Only one overall match MVP
          return { ...row, isMvp: row.playerId === playerId };
        }
        if (row.playerId !== playerId) return row;
        return { ...row, [field]: value };
      })
    );
  };

  const handleSwapPlayerInLineup = (
    oldPlayerId: string,
    newPlayerId: string,
    reg: TournamentRegistration
  ) => {
    const newPl = players.find((p) => p.id === newPlayerId);
    if (!newPl) return;
    setPlayerStats((prev) =>
      prev.map((row) =>
        row.playerId === oldPlayerId
          ? {
              ...row,
              playerId: newPl.id,
              playerNickname: newPl.nickname,
              role: newPl.primaryRole,
              heroName: newPl.signatureHeroes[0] || row.heroName,
              teamRegistrationId: reg.id,
              teamTag: reg.teamTag,
            }
          : row
      )
    );
  };

  const handleAutoGenerateRealisticStats = () => {
    const aWins = scoreA >= scoreB;
    setPlayerStats((prev) => {
      let highestRatingIdx = 0;
      let highestRatingVal = 0;

      const generated = prev.map((row, index) => {
        const isWinnerTeam =
          (aWins && row.teamRegistrationId === regA?.id) ||
          (!aWins && row.teamRegistrationId === regB?.id);
        const kills = isWinnerTeam
          ? Math.floor(Math.random() * 8) + 3
          : Math.floor(Math.random() * 5) + 1;
        const deaths = isWinnerTeam
          ? Math.floor(Math.random() * 3) + 1
          : Math.floor(Math.random() * 5) + 3;
        const assists = isWinnerTeam
          ? Math.floor(Math.random() * 10) + 5
          : Math.floor(Math.random() * 6) + 2;
        const gold = isWinnerTeam
          ? 11500 + Math.floor(Math.random() * 4500)
          : 8900 + Math.floor(Math.random() * 3500);
        const rawRating = Math.min(
          10,
          Math.max(
            5.2,
            6.5 + (kills * 0.35 + assists * 0.15 - deaths * 0.25) + (isWinnerTeam ? 1.1 : 0)
          )
        );
        const rating = Number(rawRating.toFixed(1));
        if (isWinnerTeam && rating > highestRatingVal) {
          highestRatingVal = rating;
          highestRatingIdx = index;
        }
        return {
          ...row,
          kills,
          deaths,
          assists,
          gold,
          rating,
          isMvp: false,
        };
      });

      if (generated[highestRatingIdx]) {
        generated[highestRatingIdx].isMvp = true;
      }
      return generated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const winnerId =
      status === 'completed' && scoreA !== scoreB
        ? scoreA > scoreB
          ? match.teamARegistrationId
          : match.teamBRegistrationId
        : null;

    onSaveMatch({
      ...match,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      status,
      scheduledDate,
      scheduledTime,
      roomName,
      winnerRegistrationId: winnerId,
      playerStats,
    });
    onClose();
  };

  const renderTeamStatsTable = (reg: TournamentRegistration | undefined, label: string) => {
    if (!reg) {
      return (
        <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-400">
          Tim untuk slot {label} belum ditentukan (Menunggu hasil pertandingan sebelumnya).
        </div>
      );
    }

    const teamRows = playerStats.filter((r) => r.teamRegistrationId === reg.id);
    const allRosterIds = [...reg.corePlayerIds, ...reg.subPlayerIds];
    const rosterPlayers = allRosterIds
      .map((id) => players.find((p) => p.id === id))
      .filter(Boolean) as Player[];

    return (
      <div className="bg-[#0B0F17] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-100">
            [{reg.teamTag}] {reg.teamName} — Statistik Individu Pemain
          </div>
          <div className="text-xs text-slate-400 font-mono">
            5 Pemain Bertanding {reg.subPlayerIds.length > 0 ? `(+${reg.subPlayerIds.length} Cadangan Tersedia)` : ''}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2 px-3">Pemain (Inti / Sub)</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Hero MLBB</th>
                <th className="py-2 px-2 text-right font-mono">Kill</th>
                <th className="py-2 px-2 text-right font-mono">Death</th>
                <th className="py-2 px-2 text-right font-mono">Assist</th>
                <th className="py-2 px-3 text-right font-mono">Gold</th>
                <th className="py-2 px-3 text-right font-mono">Rating</th>
                <th className="py-2 px-3 text-center">MVP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {teamRows.map((row) => (
                <tr key={row.playerId} className="hover:bg-slate-900/40">
                  <td className="py-2 px-3">
                    {canEdit && rosterPlayers.length > 5 ? (
                      <select
                        value={row.playerId}
                        onChange={(e) =>
                          handleSwapPlayerInLineup(row.playerId, e.target.value, reg)
                        }
                        className="px-2 py-1 bg-[#111827] border border-slate-700 rounded text-xs text-slate-100 font-medium"
                      >
                        {rosterPlayers.map((rp) => (
                          <option key={rp.id} value={rp.id}>
                            {rp.nickname}{' '}
                            {reg.subPlayerIds.includes(rp.id) ? '(Cadangan)' : '(Inti)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-slate-100">
                        {row.playerNickname}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {canEdit ? (
                      <select
                        value={row.role}
                        onChange={(e) =>
                          handleUpdateStat(
                            row.playerId,
                            'role',
                            e.target.value as MLBBHeroRole
                          )
                        }
                        className="px-2 py-1 bg-[#111827] border border-slate-700 rounded text-xs text-slate-200"
                      >
                        <option value="Jungler">Jungler</option>
                        <option value="Gold Lane">Gold Lane</option>
                        <option value="Mid Lane">Mid Lane</option>
                        <option value="EXP Lane">EXP Lane</option>
                        <option value="Roamer">Roamer</option>
                      </select>
                    ) : (
                      <span className="text-slate-300">{row.role}</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {canEdit ? (
                      <select
                        value={row.heroName}
                        onChange={(e) =>
                          handleUpdateStat(row.playerId, 'heroName', e.target.value)
                        }
                        className="px-2 py-1 bg-[#111827] border border-slate-700 rounded text-xs text-amber-300"
                      >
                        {MLBB_HEROES.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-amber-300 font-medium">{row.heroName}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {canEdit ? (
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={row.kills}
                        onChange={(e) =>
                          handleUpdateStat(row.playerId, 'kills', Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 bg-[#111827] border border-slate-700 rounded text-right font-mono text-emerald-400"
                      />
                    ) : (
                      <span className="text-emerald-400">{row.kills}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {canEdit ? (
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={row.deaths}
                        onChange={(e) =>
                          handleUpdateStat(row.playerId, 'deaths', Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 bg-[#111827] border border-slate-700 rounded text-right font-mono text-rose-400"
                      />
                    ) : (
                      <span className="text-rose-400">{row.deaths}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {canEdit ? (
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={row.assists}
                        onChange={(e) =>
                          handleUpdateStat(
                            row.playerId,
                            'assists',
                            Number(e.target.value)
                          )
                        }
                        className="w-14 px-1.5 py-1 bg-[#111827] border border-slate-700 rounded text-right font-mono text-sky-400"
                      />
                    ) : (
                      <span className="text-sky-400">{row.assists}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {canEdit ? (
                      <input
                        type="number"
                        step={100}
                        value={row.gold}
                        onChange={(e) =>
                          handleUpdateStat(row.playerId, 'gold', Number(e.target.value))
                        }
                        className="w-20 px-2 py-1 bg-[#111827] border border-slate-700 rounded text-right font-mono text-amber-300"
                      />
                    ) : (
                      <span className="text-amber-300">
                        {row.gold.toLocaleString('id-ID')}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {canEdit ? (
                      <input
                        type="number"
                        step={0.1}
                        min={1}
                        max={10}
                        value={row.rating}
                        onChange={(e) =>
                          handleUpdateStat(row.playerId, 'rating', Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 bg-[#111827] border border-slate-700 rounded text-right font-mono text-slate-100"
                      />
                    ) : (
                      <span className="font-bold text-slate-100">{row.rating}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStat(row.playerId, 'isMvp', !row.isMvp)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                          row.isMvp
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Award className="w-3 h-3" />
                        MVP
                      </button>
                    ) : row.isMvp ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                        <Award className="w-3.5 h-3.5" /> MVP
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#111827] border border-slate-800 rounded-xl shadow-2xl my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {canEdit
                ? `Manajemen Skor, Jadwal & Statistik Pemain — ${match.roundName}`
                : `Rapor Hasil & Statistik Pertandingan — ${match.roundName}`}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Match #{match.matchOrder} · Format BO{match.bestOf} · {match.scheduledDate} (
              {match.scheduledTime})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Scoreboard & Schedule Controls */}
          <div className="p-5 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
              {/* Team A */}
              <div className="flex items-center justify-between md:justify-end gap-4">
                <div className="text-left md:text-right">
                  <div className="text-base font-bold text-slate-100">
                    {regA ? regA.teamName : 'TBD'}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {regA ? `[${regA.teamTag}] Slot #${regA.slotIndex}` : 'Menunggu Tim'}
                  </div>
                </div>
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-16 h-14 text-center text-2xl font-mono font-bold bg-[#111827] border border-slate-700 rounded-xl text-amber-400"
                  />
                ) : (
                  <div className="w-14 h-14 flex items-center justify-center text-2xl font-mono font-bold bg-[#111827] border border-slate-800 rounded-xl text-amber-400">
                    {scoreA}
                  </div>
                )}
              </div>

              {/* Center Status */}
              <div className="text-center space-y-2">
                <div className="text-xs font-mono text-slate-400">
                  BEST OF {match.bestOf}
                </div>
                {canEdit ? (
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as 'scheduled' | 'live' | 'completed'
                      )
                    }
                    className="px-3 py-1.5 bg-[#111827] border border-slate-700 rounded-lg text-xs font-semibold text-slate-100"
                  >
                    <option value="scheduled">Terjadwal (Scheduled)</option>
                    <option value="live">Sedang Bertanding (LIVE)</option>
                    <option value="completed">Selesai (Completed & Advance)</option>
                  </select>
                ) : (
                  <div className="text-xs font-semibold text-amber-400 uppercase">
                    {status === 'completed'
                      ? 'Pertandingan Selesai'
                      : status === 'live'
                      ? 'Sedang Berlangsung'
                      : 'Terjadwal'}
                  </div>
                )}
              </div>

              {/* Team B */}
              <div className="flex items-center justify-between md:justify-start gap-4">
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-16 h-14 text-center text-2xl font-mono font-bold bg-[#111827] border border-slate-700 rounded-xl text-amber-400"
                  />
                ) : (
                  <div className="w-14 h-14 flex items-center justify-center text-2xl font-mono font-bold bg-[#111827] border border-slate-800 rounded-xl text-amber-400">
                    {scoreB}
                  </div>
                )}
                <div>
                  <div className="text-base font-bold text-slate-100">
                    {regB ? regB.teamName : 'TBD'}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {regB ? `[${regB.teamTag}] Slot #${regB.slotIndex}` : 'Menunggu Tim'}
                  </div>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Tanggal Pertandingan
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Jam Pertandingan
                  </label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    ID Room / Nama Lobby Stream
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Contoh: Room Custom #1"
                    className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Individual Player Match Stats Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-amber-400">
                  Laporan Statistik Performa Individu Pemain (Hero, Role, KDA, MVP, Gold, Rating)
                </h3>
                <p className="text-xs text-slate-400">
                  Data yang diinput di sini otomatis terakumulasi ke Leaderboard Statistik Pemain Turnamen
                </p>
              </div>
              {canEdit && regA && regB && (
                <button
                  type="button"
                  onClick={handleAutoGenerateRealisticStats}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Isi Cepat Statistik Simulasi Hasil Laga
                </button>
              )}
            </div>

            {renderTeamStatsTable(regA, 'Tim A')}
            {renderTeamStatsTable(regB, 'Tim B')}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Tutup
            </button>
            {canEdit && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Simpan Skor & Statistik Pertandingan
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
