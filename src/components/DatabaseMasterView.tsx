import React, { useState } from 'react';
import { MLBBHeroRole, Player, Team } from '../types/tournament';
import { MLBB_HEROES } from '../utils/bracketEngine';
import { Database, Plus, Search, Shield, Trash2, UserPlus, Users } from 'lucide-react';

interface DatabaseMasterViewProps {
  teams: Team[];
  players: Player[];
  canManage: boolean; // Admin or Panitia can add/edit/delete; Visitors can view or register new players/teams
  onAddPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onAddTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
}

export const DatabaseMasterView: React.FC<DatabaseMasterViewProps> = ({
  teams,
  players,
  canManage,
  onAddPlayer,
  onDeletePlayer,
  onAddTeam,
  onDeleteTeam,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teams' | 'players'>('teams');
  const [searchQuery, setSearchQuery] = useState('');

  // New Player Form State
  const [nickname, setNickname] = useState('');
  const [mlbbId, setMlbbId] = useState('');
  const [serverId, setServerId] = useState('');
  const [primaryRole, setPrimaryRole] = useState<MLBBHeroRole>('Jungler');
  const [tierRank, setTierRank] = useState<Player['tierRank']>('Mythical Glory');
  const [assignedTeamId, setAssignedTeamId] = useState<string>(teams[0]?.id || '');
  const [favHero1, setFavHero1] = useState('Hayabusa');
  const [favHero2, setFavHero2] = useState('Chou');

  // New Team Form State
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('Jakarta');
  const [selectedRosterIds, setSelectedRosterIds] = useState<string[]>([]);

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !mlbbId.trim() || !serverId.trim()) return;
    const created: Player = {
      id: `pl-${Date.now()}`,
      nickname: nickname.trim(),
      mlbbId: mlbbId.trim(),
      serverId: serverId.trim(),
      primaryRole,
      tierRank,
      teamId: assignedTeamId || undefined,
      signatureHeroes: [favHero1, favHero2],
    };
    onAddPlayer(created);
    setNickname('');
    setMlbbId('');
    setServerId('');
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamTag.trim()) return;
    const created: Team = {
      id: `tm-${Date.now()}`,
      name: teamName.trim(),
      tag: teamTag.trim().toUpperCase(),
      captainName: captainName.trim() || 'Kapten Tim',
      whatsapp: whatsapp.trim() || '0812-0000-0000',
      city: city.trim() || 'Indonesia',
      memberPlayerIds: selectedRosterIds,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAddTeam(created);
    setTeamName('');
    setTeamTag('');
    setCaptainName('');
    setWhatsapp('');
    setSelectedRosterIds([]);
  };

  const toggleRosterSelection = (pid: string) => {
    if (selectedRosterIds.includes(pid)) {
      setSelectedRosterIds(selectedRosterIds.filter((x) => x !== pid));
    } else if (selectedRosterIds.length < 7) {
      setSelectedRosterIds([...selectedRosterIds, pid]);
    }
  };

  const filteredPlayers = players.filter(
    (p) =>
      !searchQuery.trim() ||
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mlbbId.includes(searchQuery) ||
      p.primaryRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(
    (t) =>
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            Database Master Tim & Pemain Terdaftar
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Saat registrasi turnamen, kapten tim dapat langsung memilih 5 pemain inti + maksimal 2 cadangan dari daftar ini
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Tim atau Pemain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSubTab('teams')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'teams'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Database Tim ({teams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('players')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'players'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Database Pemain ({players.length})
            </button>
          </div>
        </div>
      </div>

      {/* 1. TEAMS DATABASE */}
      {activeSubTab === 'teams' && (
        <div className="space-y-6">
          {/* Add New Team Form */}
          <form
            onSubmit={handleCreateTeam}
            className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4"
          >
            <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Tambah Tim Baru ke Database Master (Beserta 5 Pemain Inti + Maks 2 Cadangan)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                required
                placeholder="Nama Tim (mis: Rebellion Zion)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="md:col-span-2 px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              />
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Tag (mis: RBL)"
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono uppercase text-slate-100"
              />
              <input
                type="text"
                required
                placeholder="Nama Kapten"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              />
              <input
                type="text"
                required
                placeholder="No. WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-400">
                Pilih Anggota Roster Tim dari Database Pemain ({selectedRosterIds.length}/7 terpilih):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-[#0B0F17] border border-slate-800 rounded-lg">
                {players.map((p) => {
                  const chosen = selectedRosterIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleRosterSelection(p.id)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        chosen
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {p.nickname} ({p.primaryRole})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Simpan Tim ke Database
              </button>
            </div>
          </form>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeams.map((team) => {
              const teamPlayers = team.memberPlayerIds
                .map((pid) => players.find((p) => p.id === pid))
                .filter(Boolean) as Player[];

              return (
                <div
                  key={team.id}
                  className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div>
                      <div className="text-base font-bold text-slate-100">
                        <span className="text-amber-400 font-mono mr-1.5">
                          [{team.tag}]
                        </span>
                        {team.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Kapten: {team.captainName} · WA: {team.whatsapp} · {team.city}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onDeleteTeam(team.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Hapus Tim"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-slate-400">
                      Roster Terdaftar ({teamPlayers.length} Pemain — 5 Inti +{' '}
                      {Math.max(0, teamPlayers.length - 5)} Cadangan):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {teamPlayers.map((tp, idx) => (
                        <div
                          key={tp.id}
                          className="px-2.5 py-1.5 bg-[#0B0F17] border border-slate-800/80 rounded flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-200 truncate">
                            {tp.nickname}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                            {tp.primaryRole} · {idx < 5 ? 'Inti' : 'Sub'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. PLAYERS DATABASE */}
      {activeSubTab === 'players' && (
        <div className="space-y-6">
          {/* Add New Player Form */}
          <form
            onSubmit={handleCreatePlayer}
            className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4"
          >
            <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Registrasi Pemain Baru ke Database Master
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <input
                type="text"
                required
                placeholder="Nickname In-Game"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              />
              <input
                type="text"
                required
                placeholder="ID MLBB (9 digit)"
                value={mlbbId}
                onChange={(e) => setMlbbId(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
              />
              <input
                type="text"
                required
                placeholder="Server (4 digit)"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
              />
              <select
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value as MLBBHeroRole)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              >
                <option value="Jungler">Jungler</option>
                <option value="Gold Lane">Gold Lane</option>
                <option value="Mid Lane">Mid Lane</option>
                <option value="EXP Lane">EXP Lane</option>
                <option value="Roamer">Roamer</option>
              </select>
              <select
                value={tierRank}
                onChange={(e) =>
                  setTierRank(e.target.value as Player['tierRank'])
                }
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              >
                <option value="Mythical Immortal">Mythical Immortal</option>
                <option value="Mythical Glory">Mythical Glory</option>
                <option value="Mythical Honor">Mythical Honor</option>
                <option value="Mythic">Mythic</option>
                <option value="Legend">Legend</option>
                <option value="Epic">Epic</option>
              </select>
              <select
                value={assignedTeamId}
                onChange={(e) => setAssignedTeamId(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
              >
                <option value="">Tanpa Tim (Free Agent)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.tag}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Hero Andalan:</span>
                <select
                  value={favHero1}
                  onChange={(e) => setFavHero1(e.target.value)}
                  className="px-2.5 py-1 bg-[#0B0F17] border border-slate-700 rounded text-xs text-slate-200"
                >
                  {MLBB_HEROES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  value={favHero2}
                  onChange={(e) => setFavHero2(e.target.value)}
                  className="px-2.5 py-1 bg-[#0B0F17] border border-slate-700 rounded text-xs text-slate-200"
                >
                  {MLBB_HEROES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Pemain ke Database
              </button>
            </div>
          </form>

          {/* Players Table */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0B0F17] text-xs font-medium text-slate-400">
                    <th className="py-2.5 px-4">Nickname In-Game</th>
                    <th className="py-2.5 px-4 font-mono">ID MLBB (Server)</th>
                    <th className="py-2.5 px-4">Role Utama</th>
                    <th className="py-2.5 px-4">Tier / Rank</th>
                    <th className="py-2.5 px-4">Tim Afiliasi</th>
                    <th className="py-2.5 px-4">Hero Signature</th>
                    {canManage && <th className="py-2.5 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {filteredPlayers.map((pl) => {
                    const affTeam = teams.find((t) => t.id === pl.teamId);
                    return (
                      <tr key={pl.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-100">
                          {pl.nickname}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          {pl.mlbbId} ({pl.serverId})
                        </td>
                        <td className="py-2.5 px-4 text-amber-400 font-medium">
                          {pl.primaryRole}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{pl.tierRank}</td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {affTeam ? `[${affTeam.tag}] ${affTeam.name}` : 'Free Agent'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {pl.signatureHeroes.join(' · ')}
                        </td>
                        {canManage && (
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onDeletePlayer(pl.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Hapus Pemain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
