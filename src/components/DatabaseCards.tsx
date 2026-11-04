import React from 'react';
import { Player, Team } from '../types/tournament';

const PALETTES = [
  ['#2563EB', '#38BDF8'],
  ['#D97706', '#FDE047'],
  ['#7C3AED', '#C084FC'],
  ['#059669', '#6EE7B7'],
  ['#DC2626', '#FCA5A5'],
];
const hash = (s: string) => Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Logo perisai bawaan bila tim belum mengunggah logo. */
export const defaultLogo = (tag: string) => {
  const [c1, c2] = PALETTES[hash(tag) % PALETTES.length];
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><path d="M40 6 70 18 64 52 40 74 16 52 10 18Z" fill="#0B1325" stroke="${c1}" stroke-width="5"/><path d="M40 12 63 22 58 49 40 67 22 49 17 22Z" fill="${c1}" opacity=".85"/><text x="40" y="46" text-anchor="middle" fill="${c2}" font-family="Arial" font-weight="900" font-size="18">${tag.slice(0, 4).toUpperCase()}</text></svg>`);
};

/** Avatar inisial bila player belum punya foto. */
export const defaultAvatar = (name: string) => {
  const [c1, c2] = PALETTES[hash(name) % PALETTES.length];
  const initials = name.trim().slice(0, 2).toUpperCase() || '?';
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 264"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="#0B1325"/></linearGradient></defs><rect width="240" height="264" fill="url(#g)"/><circle cx="120" cy="104" r="42" fill="#0B1325" opacity=".55"/><path d="M30 264C36 190 78 168 120 168s84 22 90 96Z" fill="#0B1325" opacity=".55"/><text x="120" y="118" text-anchor="middle" fill="${c2}" font-family="Arial" font-weight="900" font-size="40">${initials}</text></svg>`);
};

const roleShort = (r: string) => r.replace(' Lane', '');

/** Kartu tim ala panel klan: kiri logo + papan nama, kanan grid foto anggota (5 inti + cadangan). */
export function TeamClanCard({
  team,
  players,
  actions,
}: {
  team: Team;
  players: Player[]; // anggota tim sudah diurutkan sesuai memberPlayerIds
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#16213A]/90 via-[#111C33]/80 to-[#0B1325]/90 backdrop-blur-xl shadow-xl hover:border-amber-400/50 transition-colors flex flex-col sm:flex-row">
      <div className="sm:w-[34%] shrink-0 p-4 flex flex-col items-center justify-center gap-3 relative bg-black/25 border-b sm:border-b-0 sm:border-r border-white/10">
        <img
          src={team.logo?.trim() ? team.logo : defaultLogo(team.tag)}
          alt={`Logo ${team.name}`}
          className="w-24 h-24 object-contain drop-shadow-[0_4px_12px_rgba(245,166,35,0.35)]"
        />
        <div className="w-full rounded-xl border border-amber-400/40 bg-black/60 px-2.5 py-1.5 text-center">
          <div className="font-display font-extrabold text-sm tracking-wide text-amber-200 uppercase break-words">{team.name}</div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{team.city}</div>
        </div>
        {actions && <div className="absolute top-2 right-2 flex gap-1.5">{actions}</div>}
      </div>
      <div className="flex-1 p-3 sm:p-4 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2.5 flex items-center justify-between">
          <span>Anggota Tim ({players.length})</span>
          <span className="font-mono text-slate-400">TAG: {team.tag}</span>
        </div>
        {players.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada anggota.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {players.map((p, i) => (
              <div key={p.id} className={`rounded-xl overflow-hidden border bg-black/40 ${i >= 5 ? 'border-emerald-400/40' : 'border-white/10'}`}>
                <div className="aspect-[4/4.4] bg-slate-900 overflow-hidden">
                  <img src={p.photo?.trim() ? p.photo : defaultAvatar(p.nickname)} alt={p.nickname} className="w-full h-full object-cover object-top" />
                </div>
                <div className="px-1.5 py-1.5 text-center">
                  <p className="font-bold text-[11px] text-white truncate" title={p.nickname}>{p.nickname}</p>
                  <p className="text-[9px] uppercase tracking-wide text-amber-300 font-semibold truncate">{i >= 5 ? 'Cadangan' : roleShort(p.primaryRole)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Kartu player berfoto: badge role di kanan atas, tag tim di kiri atas. */
export function PlayerCard({ player, team, actions }: { player: Player; team?: Team; actions?: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#16213A]/90 to-[#0B1325]/95 shadow-lg hover:border-amber-400/50 transition-colors flex flex-col">
      <div className="aspect-[4/4.4] bg-slate-900 overflow-hidden relative">
        <img src={player.photo?.trim() ? player.photo : defaultAvatar(player.nickname)} alt={player.nickname} className="w-full h-full object-cover object-top" />
        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-sky-600 text-white font-display font-bold text-[10px] uppercase shadow">{roleShort(player.primaryRole)}</span>
        {team && <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 border border-white/20 font-mono font-bold text-[10px] text-amber-300">{team.tag}</span>}
        {actions && <div className="absolute bottom-1.5 right-1.5">{actions}</div>}
      </div>
      <div className="p-2.5 space-y-1 bg-black/20">
        <p className="font-bold text-xs text-white truncate" title={player.nickname}>{player.nickname}</p>
        <p className="text-[10px] text-slate-300 truncate">{team ? team.name : <span className="italic text-slate-500">Tanpa tim</span>}</p>
        <p className="text-[9px] font-mono text-slate-400 truncate">ID: {player.mlbbId} ({player.serverId})</p>
        <p className="text-[9px] text-amber-300/80 truncate">{player.tierRank}</p>
      </div>
    </div>
  );
}
