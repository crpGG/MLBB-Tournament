import React, { useState, useMemo } from 'react';
import {
  MLBBHeroRole,
  Player,
  RequirementSubmission,
  Team,
  Tournament,
  TournamentRegistration,
} from '../types/tournament';
import { SAMPLE_PAYMENT_PROOF_URI } from '../data/initialData';
import { cloudEnabled } from '../cloud';
import { readImageCompressed } from '../utils/image';
import {
  Check,
  Copy,
  ExternalLink,
  Plus,
  QrCode,
  Shield,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface TeamRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  teams: Team[];
  players: Player[];
  existingRegistrations: TournamentRegistration[];
  onRegisterTeam: (
    registration: TournamentRegistration,
    newTeam?: Team,
    newPlayers?: Player[]
  ) => void;
}

export const TeamRegistrationModal: React.FC<TeamRegistrationModalProps> = ({
  isOpen,
  onClose,
  tournament,
  teams,
  players,
  existingRegistrations,
  onRegisterTeam,
}) => {
  const [teamMode, setTeamMode] = useState<'existing' | 'new'>('existing');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');

  // New team fields
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTag, setNewTeamTag] = useState('');
  const [newTeamCity, setNewTeamCity] = useState('Jakarta');
  const [captainName, setCaptainName] = useState(teams[0]?.captainName || '');
  const [whatsapp, setWhatsapp] = useState(teams[0]?.whatsapp || '');

  // Local players list (includes newly added players during this modal session)
  const [sessionNewPlayers, setSessionNewPlayers] = useState<Player[]>([]);
  const allAvailablePlayers = useMemo(
    () => [...players, ...sessionNewPlayers],
    [players, sessionNewPlayers]
  );

  // Selected 5 Core + up to 2 Sub Players
  const initialTeamPlayers = useMemo(() => {
    const t = teams.find((x) => x.id === selectedTeamId);
    return t ? t.memberPlayerIds : [];
  }, [teams, selectedTeamId]);

  const [corePlayerIds, setCorePlayerIds] = useState<string[]>(
    initialTeamPlayers.slice(0, 5)
  );
  const [subPlayerIds, setSubPlayerIds] = useState<string[]>(
    initialTeamPlayers.slice(5, 7)
  );

  // Quick Add New Player Inline
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlNickname, setNewPlNickname] = useState('');
  const [newPlFullName, setNewPlFullName] = useState('');
  const [newPlMlbbId, setNewPlMlbbId] = useState('');
  const [newPlServerId, setNewPlServerId] = useState('');
  const [newPlRole, setNewPlRole] = useState<MLBBHeroRole>('Jungler');
  const [newPlTier, setNewPlTier] = useState<Player['tierRank']>('Mythical Glory');
  const [playerSearch, setPlayerSearch] = useState('');
  const [showAllDatabasePlayers, setShowAllDatabasePlayers] = useState(false);

  // Payment fields
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(
    tournament.paymentMethods[0]?.id || ''
  );
  const [paymentSenderName, setPaymentSenderName] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

  // Conditional free requirement proofs
  const [requirementProofs, setRequirementProofs] = useState<
    Record<string, { url: string; note: string }>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTeam = teams.find((t) => t.id === selectedTeamId);

  // Calculate slot index for this team in this tournament
  const existingTeamSlots = existingRegistrations.filter(
    (r) =>
      r.tournamentId === tournament.id &&
      r.teamId === (teamMode === 'existing' ? selectedTeamId : 'new') &&
      r.status !== 'rejected'
  ).length;
  const nextSlotIndex = existingTeamSlots + 1;

  const handleSelectExistingTeam = (tId: string) => {
    setSelectedTeamId(tId);
    const found = teams.find((t) => t.id === tId);
    if (found) {
      setCaptainName(found.captainName);
      setWhatsapp(found.whatsapp);
      setCorePlayerIds(found.memberPlayerIds.slice(0, 5));
      setSubPlayerIds(found.memberPlayerIds.slice(5, 7));
    }
  };

  const toggleCorePlayer = (playerId: string) => {
    setErrorMessage(null);
    if (corePlayerIds.includes(playerId)) {
      setCorePlayerIds(corePlayerIds.filter((id) => id !== playerId));
      return;
    }
    if (corePlayerIds.length >= 5) {
      setErrorMessage('Pemain Inti maksimal 5 orang. Hapus salah satu untuk mengganti.');
      return;
    }
    setSubPlayerIds(subPlayerIds.filter((id) => id !== playerId));
    setCorePlayerIds([...corePlayerIds, playerId]);
  };

  const toggleSubPlayer = (playerId: string) => {
    setErrorMessage(null);
    if (subPlayerIds.includes(playerId)) {
      setSubPlayerIds(subPlayerIds.filter((id) => id !== playerId));
      return;
    }
    if (subPlayerIds.length >= 2) {
      setErrorMessage('Pemain Cadangan maksimal 2 orang (opsional).');
      return;
    }
    setCorePlayerIds(corePlayerIds.filter((id) => id !== playerId));
    setSubPlayerIds([...subPlayerIds, playerId]);
  };

  const handleQuickCreatePlayer = () => {
    if (!newPlNickname.trim() || !newPlMlbbId.trim() || !newPlServerId.trim()) return;
    if (newPlFullName.trim().length < 3) return setErrorMessage('Nama lengkap pemain wajib diisi (minimal 3 huruf).');
    const created: Player = {
      id: `pl-new-${Date.now()}`,
      nickname: newPlNickname.trim(),
      fullName: newPlFullName.trim().replace(/\s+/g, ' '),
      mlbbId: newPlMlbbId.trim(),
      serverId: newPlServerId.trim(),
      primaryRole: newPlRole,
      tierRank: newPlTier,
      teamId: teamMode === 'existing' ? selectedTeamId : undefined,
      signatureHeroes: ['Chou', 'Claude'],
    };
    setSessionNewPlayers([...sessionNewPlayers, created]);
    if (corePlayerIds.length < 5) {
      setCorePlayerIds([...corePlayerIds, created.id]);
    } else if (subPlayerIds.length < 2) {
      setSubPlayerIds([...subPlayerIds, created.id]);
    }
    setNewPlNickname('');
    setNewPlFullName('');
    setNewPlMlbbId('');
    setNewPlServerId('');
    setShowAddPlayer(false);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImageCompressed(file).then(setPaymentProofUrl, () =>
      setErrorMessage('File harus berupa gambar (JPG/PNG).')
    );
  };

  const handleReqProofFileChange = (
    reqId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImageCompressed(file).then(
      (url) =>
        setRequirementProofs((prev) => ({
          ...prev,
          [reqId]: { url, note: prev[reqId]?.note || 'Bukti dokumen terlampir' },
        })),
      () => setErrorMessage('File harus berupa gambar (JPG/PNG).')
    );
  };

  const handleCopyAccount = (id: string, text?: string) => {
    if (!text) return;
    // Izin clipboard bisa ditolak (HTTP, iframe, pengaturan browser): jangan tampilkan "tersalin" bila gagal.
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopiedAccountId(id);
        setTimeout(() => setCopiedAccountId(null), 1800);
      },
      () => undefined
    );
  };

  const filteredPlayers = allAvailablePlayers.filter((p) => {
    const matchesTeam =
      showAllDatabasePlayers ||
      teamMode === 'new' ||
      p.teamId === selectedTeamId ||
      corePlayerIds.includes(p.id) ||
      subPlayerIds.includes(p.id);
    const matchesQuery =
      !playerSearch.trim() ||
      p.nickname.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.mlbbId.includes(playerSearch) ||
      p.primaryRole.toLowerCase().includes(playerSearch.toLowerCase());
    return matchesTeam && matchesQuery;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (corePlayerIds.length !== 5) {
      setErrorMessage(
        `Tim wajib memilih tepat 5 Pemain Inti dari daftar pemain (saat ini terpilih ${corePlayerIds.length} pemain).`
      );
      return;
    }

    if (subPlayerIds.length > 2) {
      setErrorMessage('Maksimal 2 Pemain Cadangan yang diperbolehkan.');
      return;
    }

    if (
      tournament.multiSlot === 'Multi Slot Off' &&
      existingTeamSlots >= 1 &&
      teamMode === 'existing'
    ) {
      setErrorMessage(
        'Turnamen ini menggunakan aturan Single Slot (Multi Slot Off) dan tim ini sudah terdaftar.'
      );
      return;
    }

    if (
      tournament.multiSlot === 'Multi Slot On' &&
      existingTeamSlots >= tournament.maxSlotPerTeam &&
      teamMode === 'existing'
    ) {
      setErrorMessage(
        `Tim ini sudah mencapai batas maksimal ${tournament.maxSlotPerTeam} slot pada turnamen ini.`
      );
      return;
    }

    let finalTeamId = selectedTeamId;
    let finalTeamName = activeTeam?.name || '';
    let finalTeamTag = activeTeam?.tag || '';
    let createdTeamObj: Team | undefined;

    if (teamMode === 'new') {
      if (!newTeamName.trim() || !newTeamTag.trim()) {
        setErrorMessage('Mohon lengkapi Nama Tim dan Singkatan/Tag Tim.');
        return;
      }
      finalTeamId = `tm-${Date.now()}`;
      finalTeamName = newTeamName.trim();
      finalTeamTag = newTeamTag.trim().toUpperCase();
      createdTeamObj = {
        id: finalTeamId,
        name: finalTeamName,
        tag: finalTeamTag,
        captainName: captainName.trim() || 'Kapten Tim',
        whatsapp: whatsapp.trim() || '0812-0000-0000',
        city: newTeamCity.trim() || 'Indonesia',
        memberPlayerIds: [...corePlayerIds, ...subPlayerIds],
        createdAt: new Date().toISOString().slice(0, 10),
      };
    }

    if (tournament.feeType === 'paid' && !paymentProofUrl) {
      setErrorMessage('Mohon unggah bukti transfer pembayaran terlebih dahulu.');
      return;
    }

    // Hanya syarat yang benar-benar diunggah; jangan menempel bukti palsu pada syarat opsional.
    const reqSubmissions: RequirementSubmission[] =
      tournament.conditionalRequirements
        .filter((req) => requirementProofs[req.id]?.url)
        .map((req) => ({
          requirementId: req.id,
          proofImageUrl: requirementProofs[req.id].url,
          note: requirementProofs[req.id]?.note || 'Memenuhi syarat pendaftaran',
        }));

    if (tournament.feeType === 'conditional_free') {
      const missingMandatory = tournament.conditionalRequirements.some(
        (req) => req.mandatory && !requirementProofs[req.id]?.url
      );
      if (missingMandatory) {
        setErrorMessage(
          'Mohon unggah screenshot bukti untuk seluruh syarat wajib pada bagian Gratis Bersyarat.'
        );
        return;
      }
    }

    const registration: TournamentRegistration = {
      id: `reg-${Date.now()}`,
      tournamentId: tournament.id,
      teamId: finalTeamId,
      teamName: finalTeamName,
      teamTag: finalTeamTag,
      slotIndex: teamMode === 'existing' ? nextSlotIndex : 1,
      captainName: captainName.trim(),
      whatsapp: whatsapp.trim(),
      corePlayerIds,
      subPlayerIds,
      feeTypeSnapshot: tournament.feeType,
      selectedPaymentMethodId:
        tournament.feeType === 'paid' ? selectedPaymentMethodId : undefined,
      paymentSenderName:
        tournament.feeType === 'paid'
          ? paymentSenderName.trim() || captainName.trim()
          : undefined,
      paymentProofImageUrl:
        tournament.feeType === 'paid' ? paymentProofUrl : undefined,
      paymentUniqueCode: `REG-${finalTeamTag}-SLOT${
        teamMode === 'existing' ? nextSlotIndex : 1
      }`,
      requirementSubmissions:
        tournament.feeType === 'conditional_free' ? reqSubmissions : [],
      status: 'pending',
      registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    onRegisterTeam(
      registration,
      createdTeamObj,
      sessionNewPlayers.length > 0 ? sessionNewPlayers : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111827] border border-slate-800 rounded-xl shadow-2xl my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Form Registrasi Tim — {tournament.name}
            </h2>
            <p className="text-xs text-slate-400">
              Pilih Tim & Roster dari Database (Wajib 5 Pemain Inti + Maksimal 2 Cadangan Opsional)
            </p>
          </div>
          <button aria-label="Tutup"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 rounded-lg text-xs text-rose-300 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Step 1: Pilih Tim dari Database atau Buat Tim Baru */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-amber-400">
                01. Pilih Identitas Tim
              </h3>
              <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTeamMode('existing')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    teamMode === 'existing'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pilih Tim Terdaftar ({teams.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeamMode('new');
                    setCorePlayerIds([]);
                    setSubPlayerIds([]);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    teamMode === 'new'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + Daftarkan Tim Baru
                </button>
              </div>
            </div>

            {teamMode === 'existing' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Pilih Tim dari Database Master
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => handleSelectExistingTeam(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.tag}] {t.name} — {t.city}
                      </option>
                    ))}
                  </select>
                  {tournament.multiSlot === 'Multi Slot On' && existingTeamSlots > 0 && (
                    <p className="mt-1.5 text-xs text-amber-400 font-mono">
                      Multi Slot Aktif: Tim ini akan didaftarkan sebagai Slot #{nextSlotIndex}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nama Kapten / Manajer
                  </label>
                  <input
                    type="text"
                    required
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Kontak WhatsApp Aktif (Untuk Grup TM)
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-slate-100"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nama Tim Baru
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Garuda Muda Esports"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tag / Singkatan Tim
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="GME"
                    value={newTeamTag}
                    onChange={(e) => setNewTeamTag(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono uppercase text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Kota / Domisili
                  </label>
                  <input
                    type="text"
                    value={newTeamCity}
                    onChange={(e) => setNewTeamCity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nama Kapten
                  </label>
                  <input
                    type="text"
                    required
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nomor WhatsApp Kapten
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-slate-100"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Pilih Pemain dari Database (5 Pemain Inti + 2 Cadangan Opsional) */}
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-amber-400">
                  02. Susunan Roster Pemain dari Database (5 Inti Wajib + Maks 2 Cadangan Opsional)
                </h3>
                <p className="text-xs text-slate-400">
                  Terpilih:{' '}
                  <span className="font-mono font-bold text-emerald-400">
                    {corePlayerIds.length}/5 Pemain Inti
                  </span>{' '}
                  ·{' '}
                  <span className="font-mono font-bold text-amber-400">
                    {subPlayerIds.length}/2 Pemain Cadangan
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {teamMode === 'existing' && (
                  <button
                    type="button"
                    onClick={() => setShowAllDatabasePlayers(!showAllDatabasePlayers)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    {showAllDatabasePlayers
                      ? 'Tampilkan Roster Tim Ini Saja'
                      : 'Cari dari Seluruh Database Pemain'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/25 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Tambah Pemain Baru
                </button>
              </div>
            </div>

            {/* Quick Add New Player to Database */}
            {showAddPlayer && (
              <div className="p-3.5 bg-[#0B0F17] border border-amber-500/40 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-amber-300">
                  Daftarkan Pemain Baru ke Database & Masukkan ke Roster
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="Nickname In-Game"
                    value={newPlNickname}
                    onChange={(e) => setNewPlNickname(e.target.value)}
                    className="px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="ID MLBB (9 digit)"
                    value={newPlMlbbId}
                    onChange={(e) => setNewPlMlbbId(e.target.value)}
                    className="px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs font-mono text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Server (4 digit)"
                    value={newPlServerId}
                    onChange={(e) => setNewPlServerId(e.target.value)}
                    className="px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs font-mono text-slate-100"
                  />
                  <select
                    value={newPlRole}
                    onChange={(e) => setNewPlRole(e.target.value as MLBBHeroRole)}
                    className="px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs text-slate-100"
                  >
                    <option value="Jungler">Jungler</option>
                    <option value="Gold Lane">Gold Lane</option>
                    <option value="Mid Lane">Mid Lane</option>
                    <option value="EXP Lane">EXP Lane</option>
                    <option value="Roamer">Roamer</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleQuickCreatePlayer}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded transition-colors"
                  >
                    Simpan Pemain
                  </button>
                  <input
                    type="text"
                    placeholder="Nama lengkap (sesuai KTP / kartu pelajar, hanya dilihat panitia)"
                    aria-label="Nama lengkap"
                    autoComplete="off"
                    maxLength={60}
                    value={newPlFullName}
                    onChange={(e) => setNewPlFullName(e.target.value)}
                    className="sm:col-span-5 px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Search Filter */}
            <div>
              <input
                type="text"
                placeholder="Cari pemain berdasarkan Nickname, ID MLBB, atau Role (Jungler, Roamer, Gold Lane...)"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-100"
              />
            </div>

            {/* Player Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {filteredPlayers.map((player) => {
                const isCore = corePlayerIds.includes(player.id);
                const isSub = subPlayerIds.includes(player.id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      isCore
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : isSub
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-[#0B0F17] border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {player.nickname}
                      </div>
                      <div className="text-xs text-slate-400 font-mono truncate">
                        ID: {player.mlbbId} ({player.serverId}) · {player.primaryRole} ·{' '}
                        {player.tierRank}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleCorePlayer(player.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                          isCore
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isCore ? 'Inti ✓' : 'Set Inti'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSubPlayer(player.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                          isSub
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSub ? 'Cadangan ✓' : 'Cadangan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 3: Pembayaran Manual atau Syarat Gratis Bersyarat */}
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-amber-400">
              03.{' '}
              {tournament.feeType === 'paid'
                ? `Pembayaran Registrasi (Rp ${tournament.feeAmount.toLocaleString('id-ID')})`
                : tournament.feeType === 'conditional_free'
                ? 'Pemenuhan Syarat Dokumen & Media Sosial (Gratis Bersyarat)'
                : 'Konfirmasi Pendaftaran Gratis'}
            </h3>

            {/* PAID MODE */}
            {tournament.feeType === 'paid' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tournament.paymentMethods.map((pm) => {
                    const isSelected = selectedPaymentMethodId === pm.id;
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setSelectedPaymentMethodId(pm.id)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500'
                            : 'bg-[#0B0F17] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-100">
                              {pm.providerName}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              a.n. {pm.accountHolder}
                            </div>
                          </div>
                          {pm.accountNumber && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAccount(pm.id, pm.accountNumber);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 rounded"
                            >
                              {copiedAccountId === pm.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  Tersalin
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  {pm.accountNumber}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {pm.type === 'qris' && pm.qrisImageUrl && (
                          <div className="mt-3 flex items-center gap-3 p-2 bg-slate-900/90 rounded-lg">
                            <img
                              src={pm.qrisImageUrl}
                              alt="QRIS Panitia"
                              className="w-24 h-28 object-contain bg-white rounded p-1 shrink-0"
                            />
                            <div className="text-xs text-slate-300 space-y-1">
                              <div className="font-semibold text-amber-400">
                                Scan QRIS Resmi Panitia
                              </div>
                              <p className="text-slate-400 leading-relaxed">
                                Mendukung BCA Mobile, Livin Mandiri, BRImo, DANA, GoPay, OVO, dan ShopeePay.
                              </p>
                            </div>
                          </div>
                        )}
                        {pm.instructions && (
                          <p className="mt-2 text-xs text-slate-400">{pm.instructions}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Upload Bukti Transfer */}
                <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Nama Pengirim di Rekening / E-Wallet
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso / DANA 0812..."
                        value={paymentSenderName}
                        onChange={(e) => setPaymentSenderName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Unggah Foto / Screenshot Bukti Transfer
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 cursor-pointer">
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>
                            {paymentProofUrl ? 'Ganti File Bukti' : 'Pilih Gambar Bukti Transfer'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProofFileChange}
                            className="hidden"
                          />
                        </label>
                        {!cloudEnabled && (<button
                          type="button"
                          onClick={() => setPaymentProofUrl(SAMPLE_PAYMENT_PROOF_URI)}
                          className="px-3 py-2 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg shrink-0"
                        >
                          Gunakan Contoh Bukti
                        </button>)}
                      </div>
                    </div>
                  </div>
                  {paymentProofUrl && (
                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={paymentProofUrl}
                        alt="Preview Bukti Bayar"
                        className="h-20 rounded border border-slate-700 object-cover"
                      />
                      <div className="text-xs text-emerald-400 font-medium">
                        ✓ Bukti pembayaran siap dikirim ke Panitia untuk diverifikasi.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONDITIONAL FREE MODE */}
            {tournament.feeType === 'conditional_free' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Turnamen ini <strong>Gratis Bersyarat</strong>. Silakan klik tautan resmi yang disediakan panitia di bawah ini, lalu unggah bukti tangkapan layar (*screenshot*) Anda:
                </p>
                {tournament.conditionalRequirements.map((req, idx) => {
                  const uploadedUrl = requirementProofs[req.id]?.url;
                  return (
                    <div
                      key={req.id}
                      className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-100">
                          {idx + 1}. {req.label}{' '}
                          {req.mandatory && (
                            <span className="text-amber-400 font-normal">(Wajib)</span>
                          )}
                        </div>
                        {req.description && (
                          <p className="text-xs text-slate-400">{req.description}</p>
                        )}
                        {req.externalUrl && (
                          <div className="pt-0.5">
                            <a
                              href={req.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-md text-xs font-medium transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Buka Tautan Panitia ({req.externalUrl})
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {uploadedUrl && (
                          <img
                            src={uploadedUrl}
                            alt="Bukti Syarat"
                            className="w-12 h-12 rounded object-cover border border-emerald-500/50"
                          />
                        )}
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{uploadedUrl ? 'Ubah Bukti' : 'Upload Screenshot'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReqProofFileChange(req.id, e)}
                            className="hidden"
                          />
                        </label>
                        {!cloudEnabled && !uploadedUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setRequirementProofs((prev) => ({
                                ...prev,
                                [req.id]: {
                                  url: SAMPLE_PAYMENT_PROOF_URI,
                                  note: 'Screenshot syarat lengkap',
                                },
                              }))
                            }
                            className="px-2.5 py-2 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg"
                          >
                            Contoh Bukti
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PURE FREE MODE */}
            {tournament.feeType === 'free' && (
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-300">
                Turnamen ini gratis tanpa biaya pendaftaran dan tanpa syarat dokumen tambahan. Tim Anda akan langsung masuk ke daftar verifikasi panitia.
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
            >
              Kirim Pendaftaran Tim ({corePlayerIds.length}/5 Inti)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
