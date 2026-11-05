import React, { useMemo } from 'react';
import { AlertTriangle, ImageIcon, MessageCircle } from 'lucide-react';
import { Match, Player, Tournament, TournamentRegistration } from '../types/tournament';
import { aggregatePlayerLeaderboard, calculateStandings } from '../utils/bracketEngine';
import { defaultAvatar } from './DatabaseCards';
import { MainTab } from './AppSidebar';

interface Props {
  tournaments: Tournament[];
  tournament?: Tournament;
  registrations: TournamentRegistration[]; // milik turnamen aktif
  matches: Match[]; // milik turnamen aktif
  players: Player[];
  isStaff: boolean;
  pendingCount: number;
  queueCount: number;
  contactUrl: string;
  onSelectTournament: (id: string) => void;
  onRegister: () => void;
  onShare: () => void;
  onGo: (tab: MainTab) => void;
  onEdit: () => void;
  onNew: () => void;
  onRegenerate: () => void;
  onInputScore: (m: Match) => void;
}

const card = 'rounded-[18px] border border-[#24304D] bg-[#0E1830]';
const label = 'text-xs font-bold tracking-[0.08em] text-slate-400';
const btnGhost = 'min-h-[44px] px-5 rounded-xl border border-[#24304D] bg-[#111C36] text-sm font-semibold text-slate-100 hover:border-amber-400/50 cursor-pointer';
const btnGold = 'min-h-[48px] rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 text-[#0B1325] font-extrabold text-[15px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

const longDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '-';
const shortDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '-';

const feeText = (t: Tournament) =>
  t.feeType === 'paid' ? `Rp ${t.feeAmount.toLocaleString('id-ID')} / slot` : t.feeType === 'conditional_free' ? 'Gratis Bersyarat' : 'Gratis';

export const DashboardView: React.FC<Props> = ({
  tournaments, tournament: t, registrations, matches, players, isStaff, pendingCount, queueCount, contactUrl,
  onSelectTournament, onRegister, onShare, onGo, onEdit, onNew, onRegenerate, onInputScore,
}) => {
  const approved = registrations.filter((r) => r.status === 'approved');
  const tagOf = (id: string | null) => registrations.find((r) => r.id === id)?.teamTag || 'TBD';

  const standings = useMemo(() => calculateStandings(registrations, matches).slice(0, 3), [registrations, matches]);
  const topPlayers = useMemo(() => aggregatePlayerLeaderboard(players, matches, registrations).slice(0, 3), [players, matches, registrations]);

  const rows = useMemo(() => {
    const live = matches.filter((m) => m.status === 'live');
    const done = matches.filter((m) => m.status === 'completed').sort((a, b) => b.matchOrder - a.matchOrder);
    const next = isStaff ? matches.find((m) => m.status === 'scheduled' && m.teamARegistrationId && m.teamBRegistrationId) : undefined;
    return [...live, ...(next ? [next] : []), ...done].slice(0, 4);
  }, [matches, isStaff]);

  if (!t) {
    return (
      <section className={`${card} p-10 text-center space-y-3`}>
        <h2 className="font-display text-xl font-extrabold">Belum ada turnamen</h2>
        <p className="text-sm text-slate-300">
          {isStaff ? 'Buat turnamen pertama untuk mulai menerima pendaftaran.' : 'Panitia belum mempublikasikan turnamen. Silakan kembali lagi nanti.'}
        </p>
        {isStaff && <button type="button" onClick={onNew} className={`${btnGold} px-6`}>+ Buat Turnamen Baru</button>}
      </section>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const completed = t.status === 'completed';
  const closed = completed || (t.registrationCloseDate !== '' && today > t.registrationCloseDate);
  const canRegister = isStaff || !closed;
  const slotPct = Math.min(100, Math.round((approved.length / Math.max(1, t.maxTeams)) * 100));
  const done = matches.filter((m) => m.status === 'completed').length;
  const liveCount = matches.filter((m) => m.status === 'live').length;

  const info: [string, string][] = [
    ['Jadwal', longDate(t.matchDayDate)],
    ['Prizepool', t.prizePool],
    ['Biaya daftar', feeText(t)],
    ['Format', t.seriesSystem],
    ['Aturan', `${t.multiSlot} · ${t.skinRule} · ${t.gameMode}`],
    ['Technical meeting', `${shortDate(t.technicalMeetingDate)} · ${t.technicalMeetingTime}`],
  ];

  return (
    <div className="space-y-6">
      {tournaments.length > 1 && (
        <label className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className={label}>TURNAMEN</span>
          <select value={t.id} onChange={(e) => onSelectTournament(e.target.value)} className="min-h-[44px] max-w-full rounded-xl border border-[#24304D] bg-[#0A1224] px-3 text-sm text-slate-100">
            {tournaments.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
      )}

      {isStaff && pendingCount + queueCount > 0 && (
        <section aria-label="Perlu tindakan" className="rounded-2xl border border-[#C98A12] bg-amber-400/10 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
            <div className="text-sm">
              {pendingCount > 0 && <div><b>{pendingCount} pendaftaran tim</b> menunggu verifikasi</div>}
              {queueCount > 0 && <div><b>{queueCount} pendaftaran tim/player</b> menunggu masuk database</div>}
            </div>
          </div>
          <button type="button" onClick={() => onGo(pendingCount > 0 ? 'registrations' : 'register')} className="min-h-[44px] px-5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 text-[#0B1325] font-extrabold text-sm cursor-pointer">
            Verifikasi Sekarang
          </button>
        </section>
      )}

      {/* Hero turnamen */}
      <section aria-label="Turnamen utama" className={`${card} p-4 sm:p-5 flex flex-wrap gap-6`}>
        <div className="w-full sm:w-52 h-72 sm:h-[312px] shrink-0 rounded-xl border border-[#C98A12] overflow-hidden bg-gradient-to-br from-blue-900 to-[#0B1325]">
          {t.posterUrl ? (
            <img src={t.posterUrl} alt={`Poster ${t.name}`} className="w-full h-full object-cover" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
              <ImageIcon className="w-10 h-10 text-amber-400" aria-hidden="true" />
              <span className="font-display font-bold text-sm tracking-[0.08em] text-amber-400">POSTER TURNAMEN</span>
              {isStaff && <span className="text-xs text-slate-300">Unggah lewat Edit Turnamen</span>}
            </div>
          )}
        </div>

        <div className="flex-1 basis-[420px] min-w-0 space-y-3.5">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-md border text-[11px] font-bold tracking-wider ${
              completed ? 'border-slate-500 bg-slate-500/15 text-slate-200' : closed ? 'border-red-400 bg-red-500/10 text-red-300' : 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
            }`}>
              {completed ? 'TURNAMEN SELESAI' : closed ? 'PENDAFTARAN DITUTUP' : 'PENDAFTARAN DIBUKA'}
            </span>
            <span className="px-3 py-1 rounded-md bg-[#1B2744] text-[11px] font-bold tracking-wider text-slate-200">{t.venueType.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{t.name}</h2>
            <p className="mt-1.5 text-sm text-slate-400">{t.organizer}{t.venueDetail ? ` · ${t.venueDetail}` : ''}</p>
          </div>
          <dl className="grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm sm:text-[15px]">
            {info.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-slate-400">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
          <div>
            <div className="flex justify-between text-[13px] text-slate-400 mb-1.5">
              <span>Slot tim terverifikasi</span>
              <b className="font-mono text-slate-100">{approved.length} / {t.maxTeams}</b>
            </div>
            <div className="h-2 rounded-full bg-[#1B2744] overflow-hidden" role="progressbar" aria-valuenow={approved.length} aria-valuemin={0} aria-valuemax={t.maxTeams} aria-label="Slot terisi">
              <div className="h-full bg-gradient-to-r from-amber-400 to-[#C98A12]" style={{ width: `${slotPct}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {isStaff ? (
              <>
                <button type="button" onClick={onEdit} className={`${btnGold} flex-[2_1_170px]`}>Edit Turnamen</button>
                <button type="button" onClick={onRegenerate} className={`${btnGhost} flex-[2_1_170px] min-h-[48px]`}>Susun Ulang Bracket</button>
                <button type="button" onClick={onShare} className={`${btnGhost} flex-[1_1_100px] min-h-[48px]`}>Bagikan</button>
                <button type="button" onClick={onNew} className="flex-[1_1_100px] min-h-[48px] rounded-xl border border-dashed border-[#C98A12] text-amber-300 font-bold text-[15px] cursor-pointer">+ Turnamen</button>
              </>
            ) : (
              <>
                <button type="button" onClick={onRegister} disabled={!canRegister} className={`${btnGold} flex-[2_1_200px]`}>
                  {canRegister ? 'Daftar Sekarang' : 'Pendaftaran Ditutup'}
                </button>
                <button type="button" onClick={onShare} className={`${btnGhost} flex-[0_1_120px] min-h-[48px]`}>Bagikan</button>
                {contactUrl && (
                  <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="flex-[2_1_200px] min-h-[48px] rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-[15px] flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />Hubungi Panitia
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Turnamen aktif + match */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section aria-label="Turnamen aktif" className="rounded-[18px] border border-[#1E4F7A] bg-gradient-to-br from-sky-400/10 to-[#0E1830] to-60% p-4 sm:p-6 space-y-4">
          <div>
            <div className={label}>TURNAMEN AKTIF</div>
            <div className="mt-1.5 font-display text-xl sm:text-2xl font-extrabold leading-tight">{t.name}</div>
          </div>
          <div className={`grid gap-3 ${isStaff ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {([
              ['TIM', <>{approved.length}<span className="text-sm text-slate-400">/{t.maxTeams}</span></>, ''],
              ['MATCH', <>{done}<span className="text-sm text-slate-400">/{matches.length}</span></>, ''],
              ['LIVE', liveCount, 'text-red-400'],
              ...(isStaff ? [['ANTREAN', pendingCount, 'text-amber-300']] : []),
            ] as [string, React.ReactNode, string][]).map(([k, v, c]) => (
              <div key={k} className="rounded-xl border border-[#24304D] bg-[#0A1224] p-3.5">
                <div className="text-[11px] font-bold tracking-wider text-slate-400">{k}</div>
                <div className={`mt-1.5 font-mono text-2xl font-bold ${c}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => onGo('bracket')} className={btnGhost}>Bracket &amp; Klasemen Lengkap</button>
            <button type="button" onClick={() => onGo('tournaments')} className={btnGhost}>Daftar Turnamen</button>
          </div>
        </section>

        <section aria-label="Match terakhir" className={`${card} p-4 sm:p-6 space-y-3`}>
          <div className={label}>{isStaff ? 'MATCH TERAKHIR & BERIKUTNYA' : 'MATCH TERAKHIR'}</div>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada match yang dimainkan.</p>
          ) : (
            rows.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[#24304D] bg-[#0A1224] px-3.5 py-3">
                <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-extrabold tracking-wider ${
                  m.status === 'live' ? 'bg-red-600 text-white' : m.status === 'completed' ? 'bg-[#1B2744] text-slate-300' : 'bg-sky-500/20 text-sky-200'
                }`}>
                  {m.status === 'live' ? 'LIVE' : m.status === 'completed' ? 'SELESAI' : 'NEXT'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] truncate">{tagOf(m.teamARegistrationId)} vs {tagOf(m.teamBRegistrationId)}</div>
                  <div className="text-xs text-slate-400">{m.roundName} · {m.scheduledTime}</div>
                </div>
                {isStaff && m.status !== 'completed' ? (
                  <button type="button" onClick={() => onInputScore(m)} className="min-h-[40px] px-4 rounded-lg bg-amber-400 text-[#0B1325] font-extrabold text-[13px] cursor-pointer">Input Skor</button>
                ) : (
                  <div className="font-mono font-bold text-lg">{m.status === 'completed' ? `${m.scoreA} – ${m.scoreB}` : 'vs'}</div>
                )}
              </div>
            ))
          )}
        </section>
      </div>

      {/* Klasemen + MVP */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section aria-label="Top 3 klasemen" className={`${card} p-4 sm:p-6 space-y-3.5`}>
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-extrabold tracking-wide">TOP 3 KLASEMEN</h3>
            <button type="button" onClick={() => onGo('bracket')} className="text-[13px] font-semibold text-amber-300 hover:text-amber-200 cursor-pointer">Lihat Klasemen Lengkap</button>
          </div>
          {standings.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada tim terverifikasi di turnamen ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] tracking-wider text-slate-400">
                    <th scope="col" className="px-2 py-1.5">#</th>
                    <th scope="col" className="px-2 py-1.5">TIM</th>
                    <th scope="col" className="px-2 py-1.5 text-center">M</th>
                    <th scope="col" className="px-2 py-1.5 text-center">W</th>
                    <th scope="col" className="px-2 py-1.5 text-center">L</th>
                    <th scope="col" className="px-2 py-1.5 text-right">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.registrationId} className="border-t border-[#1B2744]">
                      <td className="px-2 py-3 font-mono font-bold text-amber-300">{i + 1}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 shrink-0 rounded-lg bg-[#1B2744] border border-[#C98A12] flex items-center justify-center font-mono text-[10px] font-bold text-amber-300">{s.teamTag}</span>
                          <span className="font-semibold">{s.teamName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center font-mono">{s.played}</td>
                      <td className="px-2 py-3 text-center font-mono">{s.wins}</td>
                      <td className="px-2 py-3 text-center font-mono">{s.losses}</td>
                      <td className="px-2 py-3 text-right font-mono font-bold text-base">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label="Top player MVP" className={`${card} p-4 sm:p-6 space-y-3.5`}>
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-extrabold tracking-wide">TOP PLAYER MVP</h3>
            <button type="button" onClick={() => onGo('stats')} className="text-[13px] font-semibold text-amber-300 hover:text-amber-200 cursor-pointer">Leaderboard Lengkap</button>
          </div>
          {topPlayers.length === 0 ? (
            <p className="text-sm text-slate-400">Statistik pemain muncul setelah skor laga diinput.</p>
          ) : (
            topPlayers.map((p) => {
              const photo = players.find((x) => x.id === p.playerId)?.photo;
              return (
                <div key={p.playerId} className="flex items-center gap-3.5 rounded-xl border border-[#24304D] bg-[#0A1224] px-3 py-2.5">
                  <img src={photo?.trim() ? photo : defaultAvatar(p.nickname)} alt="" className="w-[52px] h-[57px] shrink-0 rounded-[10px] object-cover object-top" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] truncate">{p.nickname}</div>
                    <div className="text-xs text-slate-400 truncate">{p.teamTag} · {p.primaryRole} · {p.mvpCount} MVP</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg text-amber-300">{p.avgRating}</div>
                    <div className="text-[11px] text-slate-400">KDA {p.kdaRatio}</div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};
