import React, { useEffect, useMemo, useState } from 'react';
import type { Match, Player, Team, Tournament, TournamentRegistration } from '../types/tournament';
import { aggregatePlayerLeaderboard } from '../utils/bracketEngine';
import {
  POSTER_THEMES, exportJpeg, getPodium, inlineImages, mvpPoster, podiumPoster, schedulePoster,
} from '../utils/posterSvg';

interface Props {
  tournament: Tournament;
  registrations: TournamentRegistration[]; // semua pendaftaran turnamen ini
  matches: Match[]; // laga turnamen ini
  teams: Team[];
  players: Player[];
}

type Kind = 'podium' | 'mvp' | 'schedule';
const chip = (on: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${on ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-[#091122] text-slate-300 border-white/10 hover:border-amber-400/50'}`;
const lbl = 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

export const PosterStudioView: React.FC<Props> = ({ tournament, registrations, matches, teams, players }) => {
  const [kind, setKind] = useState<Kind>('podium');
  const [place, setPlace] = useState<1 | 2 | 3>(1);
  const [themeId, setThemeId] = useState(POSTER_THEMES[0].id);
  const [mvpId, setMvpId] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const th = POSTER_THEMES.find((x) => x.id === themeId)!;
  const approved = registrations.filter((r) => r.status === 'approved');
  const podium = useMemo(() => getPodium(tournament, matches, registrations), [tournament, matches, registrations]);
  const board = useMemo(
    () => aggregatePlayerLeaderboard(players, matches, registrations, tournament.id)
      .sort((a, b) => b.mvpCount - a.mvpCount || b.avgRating - a.avgRating),
    [players, matches, registrations, tournament.id]
  );
  useEffect(() => setMvpId(''), [tournament.id]);

  const dates = Array.from(new Set(matches.map((m) => m.scheduledDate).filter(Boolean))).sort();

  /** Bangun SVG; `imgs` dipakai saat export agar gambar remote ikut ter-render. */
  const build = (imgs: Record<string, string> = {}) => {
    if (kind === 'podium') {
      const reg = approved.find((r) => r.id === podium[place - 1]);
      const team = teams.find((t) => t.id === reg?.teamId);
      const roster = reg ? [...reg.corePlayerIds, ...reg.subPlayerIds].map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[] : [];
      return { svg: podiumPoster(th, tournament, place, reg, team, roster, imgs), srcs: [team?.logo, ...roster.map((p) => p.photo)], name: `Poster_${['Juara', 'RunnerUp', 'Juara3'][place - 1]}`, ok: !!reg };
    }
    if (kind === 'mvp') {
      const row = board.find((b) => b.playerId === (mvpId || board[0]?.playerId));
      const player = players.find((p) => p.id === row?.playerId);
      const team = teams.find((t) => t.id === player?.teamId);
      return {
        svg: mvpPoster(th, tournament, {
          player, team, teamName: row ? `${row.teamTag} · ${row.teamName}` : '', mvpCount: row?.mvpCount ?? 0,
          kda: row ? (row.deaths === 0 ? 'Perfect' : row.kdaRatio.toFixed(2)) : '-', rating: row ? row.avgRating.toFixed(1) : '-', matches: row?.matchesPlayed ?? 0,
        }, imgs),
        srcs: [player?.photo], name: 'Poster_MVP', ok: !!row,
      };
    }
    const list = dateFilter === 'all' ? matches : matches.filter((m) => m.scheduledDate === dateFilter);
    return { svg: schedulePoster(th, tournament, list, registrations, 'JADWAL PERTANDINGAN'), srcs: [], name: 'Poster_Jadwal', ok: list.length > 0 };
  };

  const view = build();
  const download = async () => {
    setBusy(true);
    setErr('');
    try {
      const imgs = await inlineImages(view.srcs);
      await exportJpeg(build(imgs).svg, `${view.name}_${tournament.name}`.replace(/[^\w-]+/g, '_').slice(0, 80) + '.jpg');
    } catch (e) {
      setErr('Export gagal: ' + ((e as Error).message || 'coba lagi'));
    } finally {
      setBusy(false);
    }
  };

  const notice =
    !view.ok &&
    (kind === 'podium'
      ? 'Peringkat ini belum ditentukan. Poster tersedia setelah pertandingan penentu selesai.'
      : kind === 'mvp'
      ? 'Belum ada statistik pemain. Isi statistik laga (tandai MVP) untuk membuat poster MVP.'
      : 'Belum ada jadwal laga untuk tanggal ini.');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <div className="glass-panel rounded-xl p-4 space-y-4 text-sm">
        <div>
          <span className={lbl}>Template</span>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={chip(kind === 'podium')} onClick={() => setKind('podium')}>Juara</button>
            <button type="button" className={chip(kind === 'mvp')} onClick={() => setKind('mvp')}>MVP</button>
            <button type="button" className={chip(kind === 'schedule')} onClick={() => setKind('schedule')}>Jadwal</button>
          </div>
        </div>
        {kind === 'podium' && (
          <div>
            <span className={lbl}>Peringkat</span>
            <div className="flex flex-wrap gap-1.5">
              {([[1, 'Champions'], [2, 'Runner Up'], [3, 'Third Place']] as const).map(([p, l]) => (
                <button key={p} type="button" className={chip(place === p)} onClick={() => setPlace(p)}>{l}</button>
              ))}
            </div>
          </div>
        )}
        {kind === 'mvp' && (
          <div>
            <label htmlFor="mvp-sel" className={lbl}>Pemain</label>
            <select id="mvp-sel" value={mvpId || board[0]?.playerId || ''} onChange={(e) => setMvpId(e.target.value)} className="w-full bg-[#091122] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100">
              {board.map((b) => (
                <option key={b.playerId} value={b.playerId}>{b.nickname} [{b.teamTag}] · {b.mvpCount} MVP</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">Default: pemain dengan MVP game terbanyak, lalu rating tertinggi.</p>
          </div>
        )}
        {kind === 'schedule' && (
          <div>
            <label htmlFor="date-sel" className={lbl}>Tanggal</label>
            <select id="date-sel" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-[#091122] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100">
              <option value="all">Semua tanggal</option>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">Satu poster memuat maksimal 11 laga; pilih tanggal untuk jadwal yang lebih panjang.</p>
          </div>
        )}
        <div>
          <span className={lbl}>Tema</span>
          <div className="flex flex-wrap gap-1.5">
            {POSTER_THEMES.map((x) => (
              <button key={x.id} type="button" className={chip(themeId === x.id)} onClick={() => setThemeId(x.id)}>{x.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-3 sm:p-4 space-y-3 min-w-0">
        <div className="flex justify-end">
          <button type="button" disabled={busy || !view.ok} onClick={download} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase disabled:opacity-50 cursor-pointer">
            {busy ? 'Merender...' : 'Unduh JPEG (1080×1350)'}
          </button>
        </div>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        {notice ? (
          <div className="rounded-xl border border-dashed border-white/20 p-10 text-center text-sm text-slate-400">{notice}</div>
        ) : (
          <div className="max-w-xl mx-auto w-full [&>svg]:w-full [&>svg]:h-auto rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: view.svg }} />
        )}
      </div>
    </div>
  );
};
