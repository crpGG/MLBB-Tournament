import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BracketFormat,
  Match,
  Player,
  Team,
  Tournament,
  TournamentRegistration,
  UserAccount,
  UserRole,
} from './types/tournament';
import {
  INITIAL_MATCHES,
  INITIAL_PLAYERS,
  INITIAL_REGISTRATIONS,
  INITIAL_TEAMS,
  INITIAL_TOURNAMENTS,
  INITIAL_USERS,
} from './data/initialData';
import {
  formatIndonesianDate,
  generateTournamentMatches,
  propagateMatchOutcome,
} from './utils/bracketEngine';
import { MLBBLaylaLoginPage } from './components/MLBBLaylaLoginPage';
import { MLBBAlucardLoadingScreen } from './components/MLBBAlucardLoadingScreen';
import { TournamentFormModal } from './components/TournamentFormModal';
import { TeamRegistrationModal } from './components/TeamRegistrationModal';
import { MatchScoreStatsModal } from './components/MatchScoreStatsModal';
import { BracketAndStandingsView } from './components/BracketAndStandingsView';
import { RegistrationVerificationView } from './components/RegistrationVerificationView';
import { PlayerStatsLeaderboardView } from './components/PlayerStatsLeaderboardView';
import { DatabaseMasterView } from './components/DatabaseMasterView';
import { UserManagementView } from './components/UserManagementView';
import {
  Award,
  CheckCircle2,
  CreditCard,
  Edit3,
  ExternalLink,
  LogOut,
  Play,
  Plus,
  Sparkles,
  Swords,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

type MainTab =
  | 'bracket'
  | 'registrations'
  | 'stats'
  | 'database'
  | 'users';

type ScreenStage = 'login' | 'loading' | 'lobby';

const STORAGE_KEY = 'arenadawn_mlbb_state_v1';

export default function App() {
  // Load or initialize state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).users || INITIAL_USERS;
    } catch {}
    return INITIAL_USERS;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).players || INITIAL_PLAYERS;
    } catch {}
    return INITIAL_PLAYERS;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).teams || INITIAL_TEAMS;
    } catch {}
    return INITIAL_TEAMS;
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).tournaments || INITIAL_TOURNAMENTS;
    } catch {}
    return INITIAL_TOURNAMENTS;
  });

  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).registrations || INITIAL_REGISTRATIONS;
    } catch {}
    return INITIAL_REGISTRATIONS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).matches || INITIAL_MATCHES;
    } catch {}
    return INITIAL_MATCHES;
  });

  // 3-Stage Screen Flow: Layla Login -> Alucard/Layla Loading -> Main Glassy Portal Lobby
  const [screenStage, setScreenStage] = useState<ScreenStage>('login');
  const [sessionProfile, setSessionProfile] = useState<{
    name: string;
    email: string;
    region: string;
  }>({
    name: 'Geraldy Sacty',
    email: 'sacty.geraldy@gmail.com',
    region: 'Sulawesi Utara (ID)',
  });

  // Active Role & Navigation State
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<MainTab>('bracket');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments[0]?.id || 'trn-1'
  );
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(true);

  // Modals State
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null
  );
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedMatchForModal, setSelectedMatchForModal] =
    useState<Match | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users,
          players,
          teams,
          tournaments,
          registrations,
          matches,
        })
      );
    } catch {}
  }, [users, players, teams, tournaments, registrations, matches]);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  const activeTournament = useMemo(
    () =>
      tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0],
    [tournaments, selectedTournamentId]
  );

  const activeRegistrations = useMemo(
    () =>
      registrations.filter((r) => r.tournamentId === activeTournament?.id),
    [registrations, activeTournament?.id]
  );

  const activeMatches = useMemo(
    () => matches.filter((m) => m.tournamentId === activeTournament?.id),
    [matches, activeTournament?.id]
  );

  const canManageTournament =
    currentRole === 'admin' || currentRole === 'panitia';

  // Login Handler: Transition from Layla Login -> Alucard/Layla Loading -> Lobby
  const handleLoginSuccess = (session: {
    name: string;
    email: string;
    role: UserRole;
    region: string;
  }) => {
    setSessionProfile({
      name: session.name,
      email: session.email,
      region: session.region,
    });
    setCurrentRole(session.role);
    if (session.role !== 'admin' && activeTab === 'users') {
      setActiveTab('bracket');
    }
    setScreenStage('loading');
  };

  // Handlers for Tournament Create / Edit
  const handleSaveTournament = (
    savedTournament: Tournament,
    shouldRegenerateBracket: boolean
  ) => {
    const exists = tournaments.some((t) => t.id === savedTournament.id);
    if (exists) {
      setTournaments((prev) =>
        prev.map((t) => (t.id === savedTournament.id ? savedTournament : t))
      );
    } else {
      setTournaments((prev) => [savedTournament, ...prev]);
      setSelectedTournamentId(savedTournament.id);
    }

    if (shouldRegenerateBracket) {
      let currentRegs = registrations.filter(
        (r) => r.tournamentId === savedTournament.id && r.status === 'approved'
      );

      // If brand new tournament, seed first 4 teams from Master Database so bracket is immediately visible
      if (!exists && currentRegs.length === 0 && teams.length >= 4) {
        const seededRegs: TournamentRegistration[] = teams
          .slice(0, 4)
          .map((tm) => ({
            id: `reg-seed-${savedTournament.id}-${tm.id}`,
            tournamentId: savedTournament.id,
            teamId: tm.id,
            teamName: tm.name,
            teamTag: tm.tag,
            slotIndex: 1,
            captainName: tm.captainName,
            whatsapp: tm.whatsapp,
            corePlayerIds: tm.memberPlayerIds.slice(0, 5),
            subPlayerIds: tm.memberPlayerIds.slice(5, 7),
            feeTypeSnapshot: savedTournament.feeType,
            requirementSubmissions: [],
            status: 'approved',
            verifiedBy: 'Auto-Seed Panitia',
            registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          }));
        setRegistrations((prev) => [...prev, ...seededRegs]);
        currentRegs = seededRegs;
      }

      const generated = generateTournamentMatches(savedTournament, currentRegs);
      setMatches((prev) => [
        ...prev.filter((m) => m.tournamentId !== savedTournament.id),
        ...generated,
      ]);
    }

    setIsTournamentModalOpen(false);
    setEditingTournament(null);
    showToast(
      exists
        ? `Konfigurasi turnamen "${savedTournament.name}" berhasil diperbarui.`
        : `Turnamen baru "${savedTournament.name}" berhasil dipublikasikan.`
    );
  };

  // Handler for Changing Bracket Format on the fly
  const handleChangeBracketFormat = (newFormat: BracketFormat) => {
    if (!activeTournament) return;
    const updated: Tournament = {
      ...activeTournament,
      bracketFormat: newFormat,
      seriesSystem:
        newFormat === 'single_round_robin'
          ? 'Sistem Liga BO1 | Total 5 Babak'
          : newFormat === 'double_round_robin'
          ? 'Liga 2 Putaran (Home/Away) BO1'
          : newFormat === 'double_elimination'
          ? 'Double Elimination BO3 | Grand Final BO5'
          : 'Single Elimination BO3 | Grand Final BO5',
    };

    setTournaments((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );

    const approved = activeRegistrations.filter((r) => r.status === 'approved');
    const generated = generateTournamentMatches(updated, approved);
    setMatches((prev) => [
      ...prev.filter((m) => m.tournamentId !== updated.id),
      ...generated,
    ]);
    showToast(`Format bracket diubah ke ${newFormat.replace(/_/g, ' ').toUpperCase()}.`);
  };

  const handleRegenerateCurrentBracket = () => {
    if (!activeTournament) return;
    const approved = activeRegistrations.filter((r) => r.status === 'approved');
    const generated = generateTournamentMatches(activeTournament, approved);
    setMatches((prev) => [
      ...prev.filter((m) => m.tournamentId !== activeTournament.id),
      ...generated,
    ]);
    showToast(
      `Bracket & jadwal "${activeTournament.name}" berhasil disusun ulang (${approved.length} tim).`
    );
  };

  // Handler for Team Registration
  const handleRegisterTeam = (
    newReg: TournamentRegistration,
    newTeam?: Team,
    newPlayers?: Player[]
  ) => {
    if (newPlayers && newPlayers.length > 0) {
      setPlayers((prev) => [...prev, ...newPlayers]);
    }
    if (newTeam) {
      setTeams((prev) => [...prev, newTeam]);
    }
    setRegistrations((prev) => [newReg, ...prev]);
    setIsRegistrationModalOpen(false);
    setActiveTab('registrations');
    showToast(
      `Tim [${newReg.teamTag}] ${newReg.teamName} berhasil didaftarkan dan menunggu verifikasi panitia.`
    );
  };

  // Handlers for Registration Approval / Rejection
  const handleApproveRegistration = (regId: string) => {
    const verifierName =
      currentRole === 'admin'
        ? `${sessionProfile.name} (Admin)`
        : `${sessionProfile.name} (Panitia)`;

    const updatedRegs = registrations.map((r) =>
      r.id === regId
        ? {
            ...r,
            status: 'approved' as const,
            verifiedBy: verifierName,
            verifiedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          }
        : r
    );
    setRegistrations(updatedRegs);

    if (activeTournament) {
      const approvedForTourney = updatedRegs.filter(
        (r) => r.tournamentId === activeTournament.id && r.status === 'approved'
      );
      const regenerated = generateTournamentMatches(
        activeTournament,
        approvedForTourney
      );
      setMatches((prev) => [
        ...prev.filter((m) => m.tournamentId !== activeTournament.id),
        ...regenerated,
      ]);
    }
    showToast('Pendaftaran tim disetujui & otomatis dimasukkan ke jadwal bracket.');
  };

  const handleRejectRegistration = (regId: string, reason: string) => {
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? {
              ...r,
              status: 'rejected' as const,
              committeeNote: reason,
            }
          : r
      )
    );
    showToast('Pendaftaran tim ditolak.');
  };

  // Handler for Saving Match Score & Player Stats
  const handleSaveMatch = (updatedMatch: Match) => {
    setMatches((prev) => propagateMatchOutcome(prev, updatedMatch));
    showToast(
      `Skor & statistik pertandingan ${updatedMatch.roundName} berhasil diperbarui.`
    );
  };

  const pendingRegistrationsCount = activeRegistrations.filter(
    (r) => r.status === 'pending'
  ).length;

  const roleBadgeLabel =
    currentRole === 'admin'
      ? 'Admin Utama'
      : currentRole === 'panitia'
      ? 'Panitia Turnamen'
      : 'Pengunjung / Kapten Tim';

  // STAGE 1: LAYLA LOGIN PAGE
  if (screenStage === 'login') {
    return (
      <MLBBLaylaLoginPage
        users={users}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // STAGE 2: ALUCARD & LAYLA MLBB LOADING SCREEN
  if (screenStage === 'loading') {
    return (
      <MLBBAlucardLoadingScreen
        userName={sessionProfile.name}
        userRoleLabel={roleBadgeLabel}
        onComplete={() => {
          setScreenStage('lobby');
          showToast(`Selamat datang di Lobby ArenaDawn, ${sessionProfile.name}!`);
        }}
      />
    );
  }

  // STAGE 3: MAIN GLASSY ESPORTS PORTAL & MLBB LOBBY
  return (
    <div className="relative min-h-screen bg-[#070D19] text-slate-100 flex flex-col overflow-x-hidden">
      {/* Ambient Glassy Celestial Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/assets/aistudio/loading_3d66433e.jpg"
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-[0.08] blur-sm scale-105"
        />
        <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-sky-500/15 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] rounded-full bg-amber-500/12 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[28rem] rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      {/* STRICT 3-ZONE TOP BAR CONTRACT (Glassy Edition) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-white/10 bg-[#0A1224]/80 sticky top-0 z-40 backdrop-blur-xl">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('bracket');
          }}
          className="text-lg font-bold tracking-tight text-amber-400 font-display whitespace-nowrap shrink-0"
        >
          ArenaDawn MLBB
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('bracket')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'bracket'
                ? 'text-amber-300 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            Lobby & Bracket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('registrations')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'registrations'
                ? 'text-amber-300 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            Registrasi Tim ({activeRegistrations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'stats'
                ? 'text-amber-300 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            Statistik Pemain
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'database'
                ? 'text-amber-300 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            Database Tim & Player
          </button>
          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'text-amber-300 border-b-2 border-amber-400 font-semibold'
                  : ''
              }`}
            >
              Manajemen User
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsRegistrationModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Daftar Turnamen
          </button>
        </div>
      </header>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Glassy Session Command Bar: User Profile, Role Switcher, Replay Loading & Return to Login */}
        <section className="p-4 glass-panel rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Left: Logged-in Commander Info & Role Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 pr-3 border-r border-white/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center shadow">
                {sessionProfile.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{sessionProfile.name}</span>
                  <span className="text-[10px] font-mono text-amber-300">
                    ({sessionProfile.region})
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Mode Akses: <strong className="text-amber-300">{roleBadgeLabel}</strong>
                </div>
              </div>
            </div>

            {/* Instant Role Switcher */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#081020]/90 border border-white/10 rounded-xl">
              {(
                [
                  {
                    role: 'admin',
                    label: 'Admin (Semua Fitur + User)',
                  },
                  {
                    role: 'panitia',
                    label: 'Panitia (Tanpa User)',
                  },
                  {
                    role: 'pengunjung',
                    label: 'Pengunjung (Lihat & Daftar)',
                  },
                ] as { role: UserRole; label: string }[]
              ).map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => {
                    setCurrentRole(item.role);
                    if (item.role !== 'admin' && activeTab === 'users') {
                      setActiveTab('bracket');
                    }
                    showToast(`Beralih ke mode akses: ${item.label}`);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    currentRole === item.role
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Login & Loading Screen Quick Actions + Guide Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWorkflowGuide((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium glass-card hover:border-amber-400/50 text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {showWorkflowGuide ? 'Sembunyikan Panduan Alur' : 'Tampilkan Panduan Alur'}
            </button>

            <button
              type="button"
              onClick={() => setScreenStage('loading')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium glass-card hover:border-cyan-400/50 text-cyan-200 rounded-lg transition-colors cursor-pointer"
              title="Putar ulang animasi Loading Screen Mobile Legends"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              Replay Loading MLBB
            </button>

            <button
              type="button"
              onClick={() => setScreenStage('login')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-400/30 rounded-lg transition-colors cursor-pointer"
              title="Kembali ke halaman Login Layla"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              Halaman Login Layla
            </button>
          </div>
        </section>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto gap-1.5 p-1.5 glass-panel rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('bracket')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300'
            }`}
          >
            Lobby & Bracket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('registrations')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
              activeTab === 'registrations'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300'
            }`}
          >
            Registrasi ({activeRegistrations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300'
            }`}
          >
            Statistik Pemain
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300'
            }`}
          >
            Database Tim
          </button>
          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300'
              }`}
            >
              User
            </button>
          )}
        </div>

        {/* Esports Portal 3-Step Visual Workflow Guide (Clear, Intuitive UI/UX like esportssulut.ai.studio) */}
        <AnimatePresence>
          {showWorkflowGuide && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden"
            >
              {/* Step 1 */}
              <div className="p-4 glass-card rounded-xl flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-amber-300">
                    <span>LANGKAH 01 · TURNAMEN & REGULASI</span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Pilih atau Buat Turnamen MLBB
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Atur Match Day (14 Oktober 2026), Multi Slot, Skin Bebas, Custom Draft Pick, serta skema Gratis, Gratis Bersyarat (link sosmed aktif), atau Bayar (Bank/E-Wallet/QRIS).
                  </p>
                </div>
                {canManageTournament ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTournament(null);
                      setIsTournamentModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Buat Turnamen Baru
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Klik salah satu kartu turnamen di bawah untuk melihat detail
                  </span>
                )}
              </div>

              {/* Step 2 */}
              <div className="p-4 glass-card rounded-xl flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                    <span>LANGKAH 02 · SKUAD 5 INTI + 2 CADANGAN</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Daftar Tim dari Database & Verifikasi
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Kapten memilih 5 pemain inti & maks. 2 cadangan dari Database Master, lalu unggah bukti transfer atau screenshot syarat sosmed untuk diverifikasi panitia.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRegistrationModalOpen(true)}
                    className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Form Daftar Tim
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('registrations')}
                    className="py-2 px-3 rounded-lg glass-card text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cek Status ({activeRegistrations.length})
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 glass-card rounded-xl flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
                    <span>LANGKAH 03 · BRACKET & STATISTIK KDA</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Jadwal Real-Time & Laporan Performa
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bagan otomatis mendukung Single/Double Elimination & Single/Double Round-Robin. Klik kartu laga untuk input skor & performa Hero, Role, KDA, Gold, MVP, dan Rating.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('bracket')}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Buka Bracket
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stats')}
                    className="py-2 px-3 rounded-lg glass-card text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Leaderboard MVP
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Esports Portal Tournament Showcase Selector Cards */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                Daftar Turnamen Aktif ({tournaments.length} Event)
              </h2>
              <p className="text-xs text-slate-300">
                Pilih turnamen di bawah untuk melihat bagan bracket, jadwal laga, pendaftar, dan statistik pemain
              </p>
            </div>

            {canManageTournament && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTournament(activeTournament);
                    setIsTournamentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium glass-card hover:border-amber-400/50 text-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Edit Turnamen Aktif
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTournament(null);
                    setIsTournamentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Turnamen Baru
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tournaments.map((trn) => {
              const isSelected = trn.id === activeTournament?.id;
              const trnRegs = registrations.filter(
                (r) => r.tournamentId === trn.id && r.status === 'approved'
              );
              return (
                <div
                  key={trn.id}
                  onClick={() => setSelectedTournamentId(trn.id)}
                  className={`p-4 rounded-xl transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'glass-panel border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                      : 'glass-card hover:border-white/25 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
                      <span>{trn.venueType}</span>
                      <span>
                        {trnRegs.length}/{trn.maxTeams} Slot Terverifikasi
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {trn.name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {trn.seriesSystem}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">
                      Match: {formatIndonesianDate(trn.matchDayDate)}
                    </span>
                    <span className="font-bold text-amber-400">
                      {trn.feeType === 'paid'
                        ? `Rp ${trn.feeAmount.toLocaleString('id-ID')}`
                        : trn.feeType === 'conditional_free'
                        ? 'Gratis Bersyarat'
                        : 'Gratis'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active Tournament Specification Banner (Following Zero-Pill Metadata Discipline & Glassy Surface) */}
        {activeTournament && (
          <section className="p-6 glass-panel rounded-2xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                {/* Unboxed inline kicker metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300 font-medium">
                  <span>{activeTournament.organizer}</span>
                  <span aria-hidden="true">·</span>
                  <span>Venue: {activeTournament.venueType}</span>
                  <span aria-hidden="true">·</span>
                  <span>Hadiah: {activeTournament.prizePool}</span>
                </div>

                <h1
                  className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display"
                  style={{ textWrap: 'balance' }}
                >
                  {activeTournament.name}
                </h1>

                <p className="text-sm text-slate-200 leading-relaxed">
                  {activeTournament.description}
                </p>

                {/* Clean unboxed MLBB Regulation Metadata */}
                <div className="pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300">
                  <strong className="text-white">
                    {activeTournament.multiSlot}
                  </strong>
                  <span aria-hidden="true">·</span>
                  <strong className="text-white">
                    {activeTournament.skinRule}
                  </strong>
                  <span aria-hidden="true">·</span>
                  <strong className="text-white">
                    {activeTournament.tierRule}
                  </strong>
                  <span aria-hidden="true">·</span>
                  <strong className="text-white">
                    {activeTournament.gameMode}
                  </strong>
                  <span aria-hidden="true">·</span>
                  <strong className="text-amber-300">
                    {activeTournament.seriesSystem}
                  </strong>
                </div>
              </div>

              {/* Action & Payment Status Summary */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegistrationModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Daftarkan Tim ke Turnamen Ini
                </button>
                {canManageTournament && pendingRegistrationsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('registrations')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Verifikasi {pendingRegistrationsCount} Pendaftaran Baru
                  </button>
                )}
              </div>
            </div>

            {/* 4-Column Key Tournament Dates & Fee Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div>
                <div className="text-xs text-slate-300">Match Day Pertandingan</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5 tabular-nums">
                  {formatIndonesianDate(activeTournament.matchDayDate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-300">Pendaftaran Ditutup</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5 tabular-nums">
                  {formatIndonesianDate(activeTournament.registrationCloseDate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-300">Technical Meeting (TM)</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5 tabular-nums">
                  {formatIndonesianDate(activeTournament.technicalMeetingDate)} ·{' '}
                  {activeTournament.technicalMeetingTime}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-300">Biaya Pendaftaran</div>
                <div className="text-sm font-mono font-bold text-amber-300 mt-0.5 tabular-nums">
                  {activeTournament.feeType === 'paid'
                    ? `Rp ${activeTournament.feeAmount.toLocaleString('id-ID')} / Slot`
                    : activeTournament.feeType === 'conditional_free'
                    ? 'Gratis Bersyarat (Upload Bukti)'
                    : 'Gratis (Free Entry)'}
                </div>
              </div>
            </div>

            {/* Conditional Free Clickable Links Preview or Payment Info Strip */}
            {activeTournament.feeType === 'conditional_free' &&
              activeTournament.conditionalRequirements.length > 0 && (
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-slate-300 font-medium">
                    Tautan Syarat Gratis Bersyarat (Klik langsung):
                  </span>
                  {activeTournament.conditionalRequirements.map((req) =>
                    req.externalUrl ? (
                      <a
                        key={req.id}
                        href={req.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 underline font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {req.label}
                      </a>
                    ) : (
                      <span key={req.id} className="text-slate-200">
                        {req.label}
                      </span>
                    )
                  )}
                </div>
              )}

            {activeTournament.feeType === 'paid' &&
              activeTournament.paymentMethods.length > 0 && (
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="font-medium text-white inline-flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    Metode Pembayaran Resmi Panitia:
                  </span>
                  {activeTournament.paymentMethods.map((pm, idx) => (
                    <span key={pm.id} className="font-mono text-slate-200">
                      {pm.providerName}
                      {pm.accountNumber ? ` (${pm.accountNumber})` : ' (Scan Gambar QRIS)'}
                      {idx < activeTournament.paymentMethods.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </div>
              )}
          </section>
        )}

        {/* Active View Content with Smooth Motion Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeTournament?.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {activeTab === 'bracket' && activeTournament && (
              <BracketAndStandingsView
                tournament={activeTournament}
                registrations={activeRegistrations}
                matches={activeMatches}
                canManage={canManageTournament}
                onSelectMatch={(m) => setSelectedMatchForModal(m)}
                onChangeBracketFormat={handleChangeBracketFormat}
                onRegenerateBracket={handleRegenerateCurrentBracket}
              />
            )}

            {activeTab === 'registrations' && activeTournament && (
              <RegistrationVerificationView
                tournament={activeTournament}
                registrations={activeRegistrations}
                players={players}
                canVerify={canManageTournament}
                onApproveRegistration={handleApproveRegistration}
                onRejectRegistration={handleRejectRegistration}
                onOpenRegistrationModal={() => setIsRegistrationModalOpen(true)}
              />
            )}

            {activeTab === 'stats' && activeTournament && (
              <PlayerStatsLeaderboardView
                tournaments={tournaments}
                selectedTournamentId={activeTournament.id}
                players={players}
                matches={matches}
                registrations={registrations}
                canManage={canManageTournament}
                onSelectMatch={(m) => setSelectedMatchForModal(m)}
              />
            )}

            {activeTab === 'database' && (
              <DatabaseMasterView
                teams={teams}
                players={players}
                canManage={canManageTournament}
                onAddPlayer={(newP) => {
                  setPlayers((prev) => [newP, ...prev]);
                  if (newP.teamId) {
                    setTeams((prev) =>
                      prev.map((t) =>
                        t.id === newP.teamId && !t.memberPlayerIds.includes(newP.id)
                          ? { ...t, memberPlayerIds: [...t.memberPlayerIds, newP.id] }
                          : t
                      )
                    );
                  }
                  showToast(`Pemain "${newP.nickname}" ditambahkan ke Database Master.`);
                }}
                onDeletePlayer={(pid) => {
                  setPlayers((prev) => prev.filter((p) => p.id !== pid));
                  showToast('Data pemain dihapus dari database.');
                }}
                onAddTeam={(newT) => {
                  setTeams((prev) => [newT, ...prev]);
                  showToast(`Tim "[${newT.tag}] ${newT.name}" ditambahkan ke Database Master.`);
                }}
                onDeleteTeam={(tid) => {
                  setTeams((prev) => prev.filter((t) => t.id !== tid));
                  showToast('Data tim dihapus dari database.');
                }}
              />
            )}

            {activeTab === 'users' && (
              <UserManagementView
                currentUserRole={currentRole}
                users={users}
                onAddUser={(u) => {
                  setUsers((prev) => [...prev, u]);
                  showToast(`Akun "${u.name}" (${u.role}) berhasil ditambahkan.`);
                }}
                onUpdateUserRole={(uid, newRole) => {
                  setUsers((prev) =>
                    prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u))
                  );
                  showToast('Role pengguna berhasil diperbarui.');
                }}
                onToggleUserActive={(uid) => {
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === uid ? { ...u, active: !u.active } : u
                    )
                  );
                }}
                onDeleteUser={(uid) => {
                  setUsers((prev) => prev.filter((u) => u.id !== uid));
                  showToast('Akun pengguna berhasil dihapus.');
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quiet Glassy Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#070D19]/80 backdrop-blur-md py-5 px-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          ArenaDawn — Portal Turnamen & Manajemen Statistik Esport Mobile Legends: Bang Bang
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setScreenStage('login')}
            className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            Layar Login Layla
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
            className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            Reset Data Simulasi Default
          </button>
        </div>
      </footer>

      {/* Modals */}
      <TournamentFormModal
        isOpen={isTournamentModalOpen}
        onClose={() => {
          setIsTournamentModalOpen(false);
          setEditingTournament(null);
        }}
        onSave={handleSaveTournament}
        editingTournament={editingTournament}
      />

      {activeTournament && (
        <TeamRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          tournament={activeTournament}
          teams={teams}
          players={players}
          existingRegistrations={registrations}
          onRegisterTeam={handleRegisterTeam}
        />
      )}

      <MatchScoreStatsModal
        isOpen={Boolean(selectedMatchForModal)}
        onClose={() => setSelectedMatchForModal(null)}
        match={selectedMatchForModal}
        registrations={activeRegistrations}
        players={players}
        canEdit={canManageTournament}
        onSaveMatch={handleSaveMatch}
      />
    </div>
  );
}
