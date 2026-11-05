import React, { useState } from 'react';
import { Check, Eraser, Loader2, MessageCircle, Send, Upload, X } from 'lucide-react';
import { DbSubmission, MLBBHeroRole, Player, Team } from '../types/tournament';
import { compressPhoto, removeBackground, toWebp } from '../utils/image';
import { PlayerCard, TeamClanCard, defaultAvatar, defaultLogo } from './DatabaseCards';

const ROLES: MLBBHeroRole[] = ['EXP Lane', 'Jungler', 'Mid Lane', 'Gold Lane', 'Roamer'];
const TIERS: Player['tierRank'][] = ['Mythical Immortal', 'Mythical Glory', 'Mythical Honor', 'Mythic', 'Legend', 'Epic'];
const CORE = 5;
const MAX_ROSTER = 7;

interface Row {
  nickname: string;
  fullName: string; // data pribadi, hanya dilihat staf
  mlbbId: string;
  serverId: string;
  role: MLBBHeroRole;
  tier: Player['tierRank'];
  photo: string;
  existingId?: string; // dipilih dari database: tidak membuat player baru
}
const emptyRow = (): Row => ({ nickname: '', fullName: '', mlbbId: '', serverId: '', role: 'Jungler', tier: 'Mythical Glory', photo: '' });

const field = 'w-full bg-[#0B0F17] border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none disabled:opacity-60';
const lbl = 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1';
const idKey = (id: string, server: string) => `${id.trim()}|${server.trim()}`;
const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, '').replace(/^0/, '62')}`;

// shortcut: batas 1 MB dokumen Firestore dicek di klien; upgrade ke upload Storage langsung bila foto makin besar.
const MAX_SUBMISSION_BYTES = 900_000;

interface Props {
  teams: Team[];
  players: Player[];
  submissions: DbSubmission[]; // antrean; kosong untuk pengunjung
  isStaff: boolean;
  onSubmit: (s: DbSubmission) => Promise<void>;
  onApprove: (s: DbSubmission) => void;
  onReject: (s: DbSubmission) => void;
}

function PhotoPicker({ value, name, onPick, autoRemoveBg }: { value: string; name: string; onPick: (d: string) => void; autoRemoveBg: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const small = await compressPhoto(file, 320, 352, 0.86);
      // gagal hapus latar: pakai foto asli
      onPick(await toWebp(autoRemoveBg ? await removeBackground(small).catch(() => small) : small));
    } catch {
      setErr('Foto tidak bisa dibaca.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="w-20 shrink-0">
      <div className="aspect-[4/4.4] rounded-lg border border-slate-700 overflow-hidden bg-slate-900 relative">
        <img src={value || defaultAvatar(name || 'PLAYER')} alt="" className="w-full h-full object-cover object-top" />
        {busy && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-300" aria-hidden="true" /></div>}
      </div>
      <label className="mt-1 block text-center px-1 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold cursor-pointer">
        <Upload className="w-3 h-3 inline -mt-0.5 mr-0.5" aria-hidden="true" />
        {value ? 'Ganti' : 'Foto'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      {err && <p className="text-[10px] text-rose-400 mt-0.5">{err}</p>}
    </div>
  );
}

export const TeamPlayerRegistrationView: React.FC<Props> = ({ teams, players, submissions, isStaff, onSubmit, onApprove, onReject }) => {
  const [kind, setKind] = useState<'team' | 'player'>('team');
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // identitas tim
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [city, setCity] = useState('');
  const [captain, setCaptain] = useState('');
  const [wa, setWa] = useState('');
  const [logo, setLogo] = useState('');
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: CORE }, emptyRow));
  // player solo
  const [solo, setSolo] = useState<Row>(emptyRow);

  const setRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const fillFromDb = (i: number, id: string) => {
    const p = players.find((x) => x.id === id);
    if (!p) return setRow(i, { ...emptyRow() });
    setRow(i, { nickname: p.nickname, mlbbId: p.mlbbId, serverId: p.serverId, role: p.primaryRole, tier: p.tierRank, photo: p.photo || '', existingId: p.id });
  };

  const pickLogo = async (file?: File) => {
    if (!file) return;
    try {
      setLogo(await toWebp(await compressPhoto(file, 256, 256, 0.9)));
    } catch {
      setError('Logo tidak bisa dibaca.');
    }
  };

  const finish = async (sub: DbSubmission, label: string) => {
    if (JSON.stringify(sub).length > MAX_SUBMISSION_BYTES) return setError('Foto terlalu besar. Gunakan foto yang lebih kecil atau hapus beberapa foto.');
    setBusy(true);
    try {
      await onSubmit(sub);
      setDone(label);
    } catch (e) {
      setError((e as Error).message || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const submitTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !tag.trim() || !captain.trim()) return setError('Nama tim, tag, dan nama kapten wajib diisi.');
    if (wa.replace(/\D/g, '').length < 10) return setError('Nomor WhatsApp kapten tidak valid.');
    const filled = rows.filter((r) => r.nickname.trim() || r.mlbbId.trim());
    if (filled.length < CORE || rows.slice(0, CORE).some((r) => !r.nickname.trim() || !r.mlbbId.trim() || !r.serverId.trim())) {
      return setError(`Isi lengkap ${CORE} pemain inti (nickname, ID, server).`);
    }
    if (filled.some((r) => !r.mlbbId.trim() || !r.serverId.trim() || !r.nickname.trim())) return setError('Data cadangan belum lengkap. Lengkapi atau kosongkan barisnya.');
    if (filled.some((r) => !r.existingId && r.fullName.trim().length < 3)) return setError('Nama lengkap wajib diisi (minimal 3 huruf) untuk setiap pemain baru.');
    const keys = filled.map((r) => idKey(r.mlbbId, r.serverId));
    if (new Set(keys).size !== keys.length) return setError('Ada ID MLBB ganda di dalam tim ini.');
    const taken = filled.find((r) => !r.existingId && players.some((p) => idKey(p.mlbbId, p.serverId) === idKey(r.mlbbId, r.serverId)));
    if (taken) return setError(`ID ${taken.mlbbId} (${taken.serverId}) sudah ada di Database Player. Pilih dari daftar "Ambil dari database".`);

    const stamp = Date.now();
    const teamId = `tm-${stamp}`;
    const newPlayers: Player[] = [];
    const memberPlayerIds: string[] = [];
    filled.forEach((r, i) => {
      if (r.existingId) return void memberPlayerIds.push(r.existingId);
      const id = `pl-${stamp}-${i}`;
      newPlayers.push({ id, nickname: r.nickname.trim(), fullName: r.fullName.trim().replace(/\s+/g, ' '), mlbbId: r.mlbbId.trim(), serverId: r.serverId.trim(), primaryRole: r.role, tierRank: r.tier, teamId, signatureHeroes: [], ...(r.photo ? { photo: r.photo } : {}) });
      memberPlayerIds.push(id);
    });
    const team: Team = { id: teamId, name: name.trim(), tag: tag.trim().toUpperCase(), captainName: captain.trim(), whatsapp: wa.trim(), city: city.trim() || 'Indonesia', memberPlayerIds, createdAt: new Date().toISOString().slice(0, 10), ...(logo ? { logo } : {}) };
    finish({ id: `sub-${stamp}`, kind: 'team', team, players: newPlayers, whatsapp: wa.trim(), submittedAt: new Date().toISOString() }, `Tim [${team.tag}] ${team.name}`).then(() => {
      setName(''); setTag(''); setCity(''); setCaptain(''); setWa(''); setLogo('');
      setRows(Array.from({ length: CORE }, emptyRow));
    });
  };

  const submitSolo = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!solo.nickname.trim() || !solo.mlbbId.trim() || !solo.serverId.trim()) return setError('Nickname, ID MLBB, dan server wajib diisi.');
    if (solo.fullName.trim().length < 3) return setError('Nama lengkap wajib diisi (minimal 3 huruf).');
    if (wa.replace(/\D/g, '').length < 10) return setError('Nomor WhatsApp tidak valid.');
    if (players.some((p) => idKey(p.mlbbId, p.serverId) === idKey(solo.mlbbId, solo.serverId))) return setError('ID MLBB ini sudah ada di Database Player.');
    const stamp = Date.now();
    const p: Player = { id: `pl-${stamp}`, nickname: solo.nickname.trim(), fullName: solo.fullName.trim().replace(/\s+/g, ' '), mlbbId: solo.mlbbId.trim(), serverId: solo.serverId.trim(), primaryRole: solo.role, tierRank: solo.tier, signatureHeroes: [], ...(solo.photo ? { photo: solo.photo } : {}) };
    finish({ id: `sub-${stamp}`, kind: 'player', players: [p], whatsapp: wa.trim(), submittedAt: new Date().toISOString() }, `Player ${p.nickname}`).then(() => {
      setSolo(emptyRow());
      setWa('');
    });
  };

  const tabBtn = (on: boolean) => `px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer ${on ? 'bg-amber-500 text-slate-950' : 'bg-[#111827] text-slate-300 border border-slate-800 hover:bg-slate-800'}`;
  const playersOf = (s: DbSubmission) => (s.team ? s.team.memberPlayerIds.map((id) => s.players.find((p) => p.id === id) || players.find((p) => p.id === id)).filter(Boolean) as Player[] : s.players);

  return (
    <div className="space-y-6">
      {isStaff && (
        <section className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-3" aria-label="Antrean persetujuan">
          <h2 className="text-sm font-bold text-slate-100">Antrean Persetujuan ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <p className="text-xs text-slate-500">Tidak ada pendaftaran menunggu.</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[...submissions].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)).map((s) => (
                <div key={s.id} className="space-y-2">
                  {s.team ? <TeamClanCard team={s.team} players={playersOf(s)} /> : <div className="w-40"><PlayerCard player={s.players[0]} /></div>}
                  {playersOf(s).some((pl) => pl.fullName) && (
                    <details className="rounded-lg border border-slate-800 bg-[#0B0F17]/60 px-3 py-2 text-xs">
                      <summary className="cursor-pointer text-slate-300">Nama lengkap pemain (khusus panitia)</summary>
                      <ul className="mt-1.5 space-y-0.5 text-slate-300">
                        {playersOf(s).map((pl) => (
                          <li key={pl.id}><span className="text-slate-500">{pl.nickname}:</span> {pl.fullName || '-'}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200"><MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />{s.whatsapp}</a>
                    <span className="ml-auto" />
                    <button type="button" onClick={() => onReject(s)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-400/40 text-rose-200 hover:bg-rose-500/10 cursor-pointer"><X className="w-3.5 h-3.5" aria-hidden="true" />Tolak</button>
                    <button type="button" onClick={() => onApprove(s)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"><Check className="w-3.5 h-3.5" aria-hidden="true" />Setujui</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={kind === 'team'} onClick={() => { setKind('team'); setError(''); setDone(''); }} className={tabBtn(kind === 'team')}>Daftar Tim</button>
          <button type="button" aria-pressed={kind === 'player'} onClick={() => { setKind('player'); setError(''); setDone(''); }} className={tabBtn(kind === 'player')}>Daftar Player (tanpa tim)</button>
        </div>

        {done && <div role="status" className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-200">{done} terkirim dan menunggu persetujuan panitia.</div>}
        {error && <div role="alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200">{error}</div>}

        {kind === 'team' ? (
          <form onSubmit={submitTeam} className="space-y-5">
            <div className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-sky-600 text-white text-xs flex items-center justify-center font-mono">1</span>Identitas Tim dan Kontak Kapten</h3>
              <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
                <div className="text-center">
                  <img src={logo || defaultLogo(tag || 'TIM')} alt="Logo tim" className="w-24 h-24 object-contain mx-auto rounded-xl bg-slate-900 border border-slate-700 p-1" />
                  <label className="mt-2 inline-block px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-300 cursor-pointer">
                    <Upload className="w-3 h-3 inline -mt-0.5 mr-1" aria-hidden="true" />Logo Tim
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label><span className={lbl}>Nama Tim *</span><input className={field} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></label>
                  <label><span className={lbl}>Tag (maks 6) *</span><input className={`${field} font-mono uppercase`} value={tag} maxLength={6} onChange={(e) => setTag(e.target.value)} /></label>
                  <label><span className={lbl}>Kota</span><input className={field} value={city} maxLength={30} onChange={(e) => setCity(e.target.value)} /></label>
                  <label><span className={lbl}>Nama Kapten *</span><input className={field} value={captain} maxLength={30} onChange={(e) => setCaptain(e.target.value)} /></label>
                  <label className="sm:col-span-2"><span className={lbl}>WhatsApp Kapten *</span><input className={`${field} font-mono`} type="tel" value={wa} maxLength={20} onChange={(e) => setWa(e.target.value)} placeholder="0812-xxxx-xxxx" /><span className="text-[10px] text-slate-500">Hanya dilihat panitia untuk koordinasi.</span></label>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-sky-600 text-white text-xs flex items-center justify-center font-mono">2</span>Roster: {CORE} Pemain Inti + maks {MAX_ROSTER - CORE} Cadangan</h3>
                <button type="button" aria-pressed={autoRemoveBg} onClick={() => setAutoRemoveBg((v) => !v)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${autoRemoveBg ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                  <Eraser className="w-3.5 h-3.5" aria-hidden="true" />Hapus latar foto: {autoRemoveBg ? 'AKTIF' : 'MATI'}
                </button>
              </div>
              {rows.map((r, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${i >= CORE ? 'border-emerald-400/30' : 'border-slate-800'} bg-[#0B0F17]/60`}>
                  <PhotoPicker value={r.photo} name={r.nickname} autoRemoveBg={autoRemoveBg} onPick={(d) => setRow(i, { photo: d })} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-bold text-amber-300">{i >= CORE ? `Cadangan ${i - CORE + 1}` : `Inti ${i + 1}`}</span>
                      {players.length > 0 && (
                        <select aria-label={`Ambil pemain ${i + 1} dari database`} value={r.existingId || ''} onChange={(e) => fillFromDb(i, e.target.value)} className="ml-auto max-w-[14rem] bg-[#0B0F17] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200">
                          <option value="">Ambil dari database…</option>
                          {players.map((p) => <option key={p.id} value={p.id}>{p.nickname} ({p.mlbbId})</option>)}
                        </select>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <input aria-label="Nickname" placeholder="Nickname" className={field} disabled={!!r.existingId} maxLength={24} value={r.nickname} onChange={(e) => setRow(i, { nickname: e.target.value })} />
                      <input aria-label="ID MLBB" placeholder="ID MLBB" inputMode="numeric" className={`${field} font-mono`} disabled={!!r.existingId} maxLength={12} value={r.mlbbId} onChange={(e) => setRow(i, { mlbbId: e.target.value })} />
                      <input aria-label="Server" placeholder="Server" inputMode="numeric" className={`${field} font-mono`} disabled={!!r.existingId} maxLength={6} value={r.serverId} onChange={(e) => setRow(i, { serverId: e.target.value })} />
                      <select aria-label="Role" className={field} disabled={!!r.existingId} value={r.role} onChange={(e) => setRow(i, { role: e.target.value as MLBBHeroRole })}>{ROLES.map((x) => <option key={x}>{x}</option>)}</select>
                      <select aria-label="Tier" className={field} disabled={!!r.existingId} value={r.tier} onChange={(e) => setRow(i, { tier: e.target.value as Player['tierRank'] })}>{TIERS.map((x) => <option key={x}>{x}</option>)}</select>
                    </div>
                    {!r.existingId && (
                      <label className="block">
                        <input aria-label="Nama lengkap" placeholder="Nama lengkap (sesuai KTP / kartu pelajar)" autoComplete="off" className={field} maxLength={60} value={r.fullName} onChange={(e) => setRow(i, { fullName: e.target.value })} />
                        <span className="text-[10px] text-slate-500">Hanya dilihat panitia, tidak ditampilkan ke publik.</span>
                      </label>
                    )}
                    {r.existingId && <button type="button" onClick={() => setRow(i, emptyRow())} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">Lepas dari database</button>}
                  </div>
                </div>
              ))}
              {rows.length < MAX_ROSTER && (
                <button type="button" onClick={() => setRows((r) => [...r, emptyRow()])} className="px-3 py-2 rounded-lg border border-dashed border-emerald-400/40 text-emerald-200 text-xs font-bold hover:bg-emerald-500/10 cursor-pointer">+ Tambah Cadangan ({rows.length - CORE}/{MAX_ROSTER - CORE})</button>
              )}
            </div>

            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-sm disabled:opacity-60 cursor-pointer">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}Kirim Pendaftaran Tim
            </button>
          </form>
        ) : (
          <form onSubmit={submitSolo} className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-100">Daftar Player (tanpa tim)</h3>
            <p className="text-xs text-slate-400">Masuk antrean persetujuan, lalu tampil di Database Player sebagai "Tanpa tim".</p>
            <div className="flex gap-4">
              <PhotoPicker value={solo.photo} name={solo.nickname} autoRemoveBg={autoRemoveBg} onPick={(d) => setSolo((s) => ({ ...s, photo: d }))} />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <label className="col-span-2"><span className={lbl}>Nickname *</span><input className={field} maxLength={24} value={solo.nickname} onChange={(e) => setSolo({ ...solo, nickname: e.target.value })} /></label>
                <label className="col-span-2"><span className={lbl}>Nama Lengkap *</span><input className={field} maxLength={60} autoComplete="off" value={solo.fullName} onChange={(e) => setSolo({ ...solo, fullName: e.target.value })} placeholder="Sesuai KTP / kartu pelajar" /><span className="text-[10px] text-slate-500">Hanya dilihat panitia, tidak ditampilkan ke publik.</span></label>
                <label><span className={lbl}>ID MLBB *</span><input className={`${field} font-mono`} inputMode="numeric" maxLength={12} value={solo.mlbbId} onChange={(e) => setSolo({ ...solo, mlbbId: e.target.value })} /></label>
                <label><span className={lbl}>Server *</span><input className={`${field} font-mono`} inputMode="numeric" maxLength={6} value={solo.serverId} onChange={(e) => setSolo({ ...solo, serverId: e.target.value })} /></label>
                <label><span className={lbl}>Role</span><select className={field} value={solo.role} onChange={(e) => setSolo({ ...solo, role: e.target.value as MLBBHeroRole })}>{ROLES.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label><span className={lbl}>Tier</span><select className={field} value={solo.tier} onChange={(e) => setSolo({ ...solo, tier: e.target.value as Player['tierRank'] })}>{TIERS.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className="col-span-2"><span className={lbl}>WhatsApp *</span><input className={`${field} font-mono`} type="tel" maxLength={20} value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0812-xxxx-xxxx" /></label>
              </div>
            </div>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-sm disabled:opacity-60 cursor-pointer">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}Kirim Pendaftaran Player
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
