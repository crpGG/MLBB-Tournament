import React, { useEffect, useMemo, useState } from 'react';
import type { Match, Player, Team, Tournament, TournamentRegistration } from '../types/tournament';
import { aggregatePlayerLeaderboard, formatIndonesianDate } from '../utils/bracketEngine';
import {
  POSTER_THEMES, exportJpeg, getPodium, inlineImages, mvpPoster, podiumPoster, schedulePoster,
} from '../utils/posterSvg';
import {
  BRACKET_H, BRACKET_W, TPL_H, TPL_W, bracketPoster, hasilPoster, jadwalPoster, playersOf, rosterPoster, securedPoster, versusPoster,
  type Ctx,
} from '../utils/posterTemplates';
import { readImageCompressed } from '../utils/image';

interface Props {
  tournament: Tournament;
  registrations: TournamentRegistration[]; // semua pendaftaran turnamen ini
  matches: Match[]; // laga turnamen ini
  teams: Team[];
  players: Player[];
}

type Kind = 'podium' | 'mvp' | 'schedule' | 'bracket' | 'secured' | 'jadwal' | 'roster' | 'versus' | 'hasil';
const KINDS: [Kind, string][] = [
  ['podium', 'Juara'], ['mvp', 'MVP'], ['schedule', 'Jadwal (daftar)'], ['bracket', 'Bracket'],
  ['secured', 'Lolos Playoff'], ['jadwal', 'Jadwal + foto'], ['roster', 'Roster tim'], ['versus', 'Jadwal 1 laga'], ['hasil', 'Hasil laga'],
];
const chip = (on: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${on ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-[#091122] text-slate-300 border-white/10 hover:border-amber-400/50'}`;
const lbl = 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';
const field = 'w-full bg-[#091122] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100';

const TEXTS: Partial<Record<Kind, [string, string][]>> = {
  bracket: [['a', 'Judul baris 1'], ['b', 'Judul baris 2 (aksen)'], ['c', 'Subjudul']],
  secured: [['a', 'Judul baris 1 (aksen)'], ['b', 'Judul baris 2'], ['c', 'Nama tim']],
  jadwal: [['a', 'Judul baris 1'], ['b', 'Judul baris 2'], ['c', 'Keterangan']],
  roster: [['a', 'Nama tim baris 1'], ['b', 'Nama tim baris 2']],
  versus: [['a', 'Judul baris 1'], ['b', 'Judul baris 2'], ['c', 'Keterangan ronde dan tanggal'], ['d', 'Badge pekan / ronde']],
  hasil: [['a', 'Judul baris 1'], ['b', 'Judul baris 2'], ['c', 'Keterangan ronde'], ['d', 'Tanggal']],
};

export const PosterStudioView: React.FC<Props> = ({ tournament, registrations, matches, teams, players }) => {
  const [kind, setKind] = useState<Kind>('podium');
  const [place, setPlace] = useState<1 | 2 | 3>(1);
  const [themeId, setThemeId] = useState(POSTER_THEMES[0].id);
  const [mvpId, setMvpId] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [regId, setRegId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [logo, setLogo] = useState('');
  const [bgImg, setBgImg] = useState('');
  const [bgOp, setBgOp] = useState(35);
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(true);
  const [showTrophy, setShowTrophy] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const th = POSTER_THEMES.find((x) => x.id === themeId)!;
  const approved = registrations.filter((r) => r.status === 'approved');
  const podium = useMemo(() => getPodium(tournament, matches, registrations), [tournament, matches, registrations]);
  const board = useMemo(
    () => aggregatePlayerLeaderboard(players, matches, registrations, tournament.id).sort((a, b) => b.mvpCount - a.mvpCount || b.avgRating - a.avgRating),
    [players, matches, registrations, tournament.id]
  );
  useEffect(() => { setMvpId(''); setRegId(''); setMatchId(''); setVals({}); setPage(0); }, [tournament.id]);
  useEffect(() => { setVals({}); }, [kind, regId, matchId, dateFilter, page]);

  const dates = Array.from(new Set(matches.map((m) => m.scheduledDate).filter(Boolean))).sort();
  const sorted = (l: Match[]) => [...l].sort((a, b) => (a.scheduledDate + a.scheduledTime).localeCompare(b.scheduledDate + b.scheduledTime) || a.matchOrder - b.matchOrder);
  const playable = sorted(matches.filter((m) => !m.skipped && m.teamARegistrationId && m.teamBRegistrationId));
  const dayMatches = playable.filter((m) => dateFilter === 'all' || m.scheduledDate === dateFilter);
  const pages = Math.max(1, Math.ceil(dayMatches.length / 2));
  const curPage = Math.min(page, pages - 1);
  const selReg = approved.find((r) => r.id === regId) || approved.find((r) => r.id === podium[0]) || approved[0];
  const selMatch = playable.find((m) => m.id === matchId) || (kind === 'hasil' ? playable.filter((m) => m.status === 'completed').pop() : playable.find((m) => m.status !== 'completed')) || playable[0];

  /** Teks bawaan dari data turnamen; isian panitia menimpanya. */
  const dflt = (k: string): string => {
    const t = tournament;
    const date = (m?: Match) => (m?.scheduledDate ? formatIndonesianDate(m.scheduledDate) : '');
    const name = selReg?.teamName || '';
    const sp = name.indexOf(' ');
    const D: Record<Kind, Record<string, string>> = {
      podium: {}, mvp: {}, schedule: {},
      bracket: { a: 'TOURNAMENT', b: 'BRACKET', c: t.name },
      secured: { a: 'PLAYOFFS', b: 'SECURED', c: name },
      jadwal: { a: 'JADWAL', b: 'PERTANDINGAN', c: `${t.name}${dayMatches[0] ? ' · ' + date(dayMatches[0]) : ''}` },
      roster: { a: sp > 0 ? name.slice(0, sp) : name, b: sp > 0 ? name.slice(sp + 1) : '' },
      versus: { a: 'JADWAL', b: 'PERTANDINGAN', c: `${selMatch?.roundName || ''} | ${date(selMatch)}`, d: selMatch ? `RONDE ${selMatch.roundNumber}` : '' },
      hasil: { a: 'MATCH RESULT', b: t.name, c: selMatch?.roundName || '', d: date(selMatch) },
    };
    return D[kind][k] ?? '';
  };
  const txt = (k: string) => vals[kind + k] ?? dflt(k);

  const ctx = (imgs: Record<string, string>): Ctx => ({
    th, imgs, t: tournament, regs: registrations, teams, players,
    a: txt('a'), b: txt('b'), c: txt('c'), d: txt('d'), p1, p2, logo, bgImg, bgOpacity: bgOp / 100, sponsors, showTags, showTrophy,
  });

  /** Bangun SVG; `imgs` dipakai saat export agar gambar remote ikut ter-render. */
  const build = (imgs: Record<string, string> = {}) => {
    const rosterSrc = (rs: (TournamentRegistration | undefined)[]) => rs.flatMap((r) => [teams.find((t) => t.id === r?.teamId)?.logo, ...playersOf(ctx({}), r).map((p) => p.photo)]);
    const common = [logo, bgImg, p1, p2, ...sponsors];
    const regOf = (id: string | null) => registrations.find((r) => r.id === id);
    if (kind === 'podium') {
      const reg = approved.find((r) => r.id === podium[place - 1]);
      const team = teams.find((t) => t.id === reg?.teamId);
      const roster = reg ? ([...reg.corePlayerIds, ...reg.subPlayerIds].map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[]) : [];
      return { svg: podiumPoster(th, tournament, place, reg, team, roster, imgs), srcs: [team?.logo, ...roster.map((p) => p.photo)], name: `Poster_${['Juara', 'RunnerUp', 'Juara3'][place - 1]}`, ok: !!reg, w: TPL_W, h: TPL_H };
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
        srcs: [player?.photo], name: 'Poster_MVP', ok: !!row, w: TPL_W, h: TPL_H,
      };
    }
    if (kind === 'schedule') {
      const list = dateFilter === 'all' ? matches : matches.filter((m) => m.scheduledDate === dateFilter);
      return { svg: schedulePoster(th, tournament, list, registrations, 'JADWAL PERTANDINGAN'), srcs: [], name: 'Poster_Jadwal', ok: list.length > 0, w: TPL_W, h: TPL_H };
    }
    const c = ctx(imgs);
    if (kind === 'bracket') return { svg: bracketPoster(c, matches), srcs: [...common, ...approved.flatMap((r) => rosterSrc([r]))], name: 'Poster_Bracket', ok: matches.some((m) => m.stage === 'upper'), w: BRACKET_W, h: BRACKET_H };
    if (kind === 'secured') return { svg: securedPoster(c, selReg), srcs: [...common, ...rosterSrc([selReg])], name: 'Poster_Lolos', ok: !!selReg, w: TPL_W, h: TPL_H };
    if (kind === 'roster') return { svg: rosterPoster(c, selReg), srcs: [...common, ...rosterSrc([selReg])], name: 'Poster_Roster', ok: !!selReg, w: TPL_W, h: TPL_H };
    if (kind === 'jadwal') {
      const ms = dayMatches.slice(curPage * 2, curPage * 2 + 2);
      return { svg: jadwalPoster(c, ms), srcs: [...common, ...rosterSrc(ms.flatMap((m) => [regOf(m.teamARegistrationId), regOf(m.teamBRegistrationId)]))], name: `Poster_Jadwal_${curPage + 1}`, ok: ms.length > 0, w: TPL_W, h: TPL_H };
    }
    const rs = [regOf(selMatch?.teamARegistrationId ?? null), regOf(selMatch?.teamBRegistrationId ?? null)];
    if (kind === 'versus') return { svg: versusPoster(c, selMatch), srcs: [...common, ...rosterSrc(rs)], name: 'Poster_VS', ok: !!selMatch, w: TPL_W, h: TPL_H };
    return { svg: hasilPoster(c, selMatch), srcs: [...common, ...rosterSrc(rs)], name: 'Poster_Hasil', ok: !!selMatch && selMatch.status === 'completed', w: TPL_W, h: TPL_H };
  };

  const view = build();
  const download = async () => {
    setBusy(true);
    setErr('');
    try {
      const imgs = await inlineImages(view.srcs);
      await exportJpeg(build(imgs).svg, `${view.name}_${tournament.name}`.replace(/[^\w-]+/g, '_').slice(0, 80) + '.jpg', view.w, view.h);
    } catch (e) {
      setErr('Export gagal: ' + ((e as Error).message || 'coba lagi'));
    } finally {
      setBusy(false);
    }
  };

  const upload = (set: (v: string) => void, maxDim = 1400) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) set(await readImageCompressed(f, maxDim, 0.85));
  };

  const notice =
    !view.ok &&
    ({
      podium: 'Peringkat ini belum ditentukan. Poster tersedia setelah pertandingan penentu selesai.',
      mvp: 'Belum ada statistik pemain. Isi statistik laga (tandai MVP) untuk membuat poster MVP.',
      schedule: 'Belum ada jadwal laga untuk tanggal ini.',
      bracket: 'Poster bracket hanya untuk format gugur (Single atau Double Elimination) yang sudah punya bagan. Untuk liga, pakai poster Jadwal.',
      secured: 'Belum ada tim terverifikasi.',
      roster: 'Belum ada tim terverifikasi.',
      jadwal: 'Belum ada laga dengan kedua tim terisi untuk tanggal ini.',
      versus: 'Belum ada laga dengan kedua tim terisi.',
      hasil: 'Laga ini belum selesai. Isi skornya dulu di Live Bracket.',
    } as Record<Kind, string>)[kind];

  const needsTeam = kind === 'secured' || kind === 'roster';
  const needsMatch = kind === 'versus' || kind === 'hasil';
  const matchLabel = (m: Match) => {
    const n = (id: string | null) => registrations.find((r) => r.id === id)?.teamTag || 'TBD';
    return `M${m.matchOrder} ${n(m.teamARegistrationId)} vs ${n(m.teamBRegistrationId)}${m.status === 'completed' ? ` (${m.scoreA}-${m.scoreB})` : ''}`;
  };
  const upBtn = (id: string, text: string, onChange: React.ChangeEventHandler<HTMLInputElement>) => (
    <label htmlFor={id} className={`${chip(false)} inline-flex items-center`}>{text}<input id={id} type="file" accept="image/*" className="sr-only" onChange={onChange} /></label>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
      <div className="glass-panel rounded-xl p-4 space-y-4 text-sm min-w-0">
        <div>
          <span className={lbl}>Template</span>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map(([k, l]) => <button key={k} type="button" aria-pressed={kind === k} className={chip(kind === k)} onClick={() => setKind(k)}>{l}</button>)}
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
            <select id="mvp-sel" value={mvpId || board[0]?.playerId || ''} onChange={(e) => setMvpId(e.target.value)} className={field}>
              {board.map((b) => <option key={b.playerId} value={b.playerId}>{b.nickname} [{b.teamTag}] · {b.mvpCount} MVP</option>)}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">Default: pemain dengan MVP game terbanyak, lalu rating tertinggi.</p>
          </div>
        )}
        {(kind === 'schedule' || kind === 'jadwal') && (
          <div className="space-y-2">
            <label htmlFor="date-sel" className={lbl}>Tanggal</label>
            <select id="date-sel" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(0); }} className={field}>
              <option value="all">Semua tanggal</option>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {kind === 'jadwal' && (
              <>
                <label htmlFor="page-sel" className={lbl}>Halaman poster (2 laga per poster)</label>
                <select id="page-sel" value={curPage} onChange={(e) => setPage(Number(e.target.value))} className={field}>
                  {Array.from({ length: pages }, (_, i) => <option key={i} value={i}>Poster {i + 1} dari {pages}</option>)}
                </select>
              </>
            )}
          </div>
        )}
        {needsTeam && (
          <div>
            <label htmlFor="team-sel" className={lbl}>Tim</label>
            <select id="team-sel" value={selReg?.id || ''} onChange={(e) => setRegId(e.target.value)} className={field}>
              {approved.map((r) => <option key={r.id} value={r.id}>[{r.teamTag}] {r.teamName}</option>)}
            </select>
          </div>
        )}
        {needsMatch && (
          <div>
            <label htmlFor="match-sel" className={lbl}>Laga</label>
            <select id="match-sel" value={selMatch?.id || ''} onChange={(e) => setMatchId(e.target.value)} className={field}>
              {playable.map((m) => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
            </select>
          </div>
        )}
        {TEXTS[kind] && (
          <div className="space-y-2">
            <span className={lbl}>Teks</span>
            {TEXTS[kind]!.map(([k, l]) => (
              <label key={k} className="block text-[11px] text-slate-400">
                {l}
                <input type="text" maxLength={60} value={txt(k)} onChange={(e) => setVals((v) => ({ ...v, [kind + k]: e.target.value }))} className={`${field} mt-1`} />
              </label>
            ))}
          </div>
        )}
        <div>
          <span className={lbl}>Tema</span>
          <div className="flex flex-wrap gap-1.5">
            {POSTER_THEMES.map((x) => <button key={x.id} type="button" className={chip(themeId === x.id)} onClick={() => setThemeId(x.id)}>{x.label}</button>)}
          </div>
        </div>
        {(['secured', 'jadwal', 'roster', 'versus', 'hasil'] as Kind[]).includes(kind) && (
          <div>
            <span className={lbl}>Foto</span>
            <div className="flex flex-wrap gap-1.5">
              {upBtn('up-p1', kind === 'versus' ? 'Foto tim A' : 'Upload foto', upload(setP1))}
              {kind === 'versus' && upBtn('up-p2', 'Foto tim B', upload(setP2))}
              {(p1 || p2) && <button type="button" className={chip(false)} onClick={() => { setP1(''); setP2(''); }}>Hapus foto</button>}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Tanpa unggahan, dipakai foto pemain dari Database; bila belum ada, tampil siluet.</p>
          </div>
        )}
        <div>
          <span className={lbl}>Identitas dan background</span>
          <div className="flex flex-wrap gap-1.5">
            {upBtn('up-logo', logo ? 'Ganti logo turnamen' : 'Logo turnamen', upload(setLogo, 400))}
            {upBtn('up-bg', bgImg ? 'Ganti background' : 'Background', upload(setBgImg, 1600))}
            {bgImg && <button type="button" className={chip(false)} onClick={() => setBgImg('')}>Hapus background</button>}
            {sponsors.length < 4 && upBtn('up-spon', 'Tambah sponsor', async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const d = await readImageCompressed(f, 500, 0.85); setSponsors((s) => [...s, d]); } })}
            {sponsors.length > 0 && <button type="button" className={chip(false)} onClick={() => setSponsors([])}>Hapus sponsor ({sponsors.length})</button>}
          </div>
          {bgImg && (
            <label className="block mt-2 text-[11px] text-slate-300">
              Transparansi background <b className="text-amber-400">{bgOp}%</b>
              <input type="range" className="w-full accent-amber-500" min={0} max={100} value={bgOp} onChange={(e) => setBgOp(Number(e.target.value))} />
            </label>
          )}
          <p className="mt-1 text-[11px] text-slate-500">Logo, background, dan sponsor berlaku untuk template baru dan tersimpan sementara selama halaman terbuka.</p>
        </div>
        {kind === 'roster' && <label className="flex items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={showTags} onChange={(e) => setShowTags(e.target.checked)} /> Label nama pemain</label>}
        {kind === 'bracket' && <label className="flex items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={showTrophy} onChange={(e) => setShowTrophy(e.target.checked)} /> Piala</label>}
      </div>

      <div className="glass-panel rounded-xl p-3 sm:p-4 space-y-3 min-w-0 order-first lg:order-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">{view.w}×{view.h}</span>
          <button type="button" disabled={busy || !view.ok} onClick={download} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase disabled:opacity-50 cursor-pointer">
            {busy ? 'Merender...' : `Unduh JPEG (${view.w}×${view.h})`}
          </button>
        </div>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        {notice ? (
          <div className="rounded-xl border border-dashed border-white/20 p-10 text-center text-sm text-slate-400">{notice}</div>
        ) : (
          <div className={`${view.w > view.h ? 'max-w-3xl' : 'max-w-xl'} mx-auto w-full [&>svg]:w-full [&>svg]:h-auto rounded-lg overflow-hidden`} dangerouslySetInnerHTML={{ __html: view.svg }} />
        )}
      </div>
    </div>
  );
};
