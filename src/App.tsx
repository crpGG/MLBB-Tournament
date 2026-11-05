import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BracketFormat,
  DbSubmission,
  Match,
  Player,
  Team,
  Tournament,
  TournamentRegistration,
  UserRole,
} from './types/tournament';
import {
  INITIAL_MATCHES,
  INITIAL_PLAYERS,
  INITIAL_REGISTRATIONS,
  INITIAL_TEAMS,
  INITIAL_TOURNAMENTS,
} from './data/initialData';
import {
  StaffProfile,
  cloudEnabled,
  deleteSubmission,
  logout,
  onSession,
  savePrivate,
  saveRegistration,
  saveState,
  saveSubmission,
  subscribePrivate,
  subscribeRegistrations,
  subscribeState,
  subscribeSubmissions,
} from './cloud';
import {
  bracketCapacity,
  formatIndonesianDate,
  generateTournamentMatches,
  propagateMatchOutcome,
} from './utils/bracketEngine';
import { ChangePasswordModal } from './components/ChangePasswordModal';
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
import { TeamPlayerRegistrationView } from './components/TeamPlayerRegistrationView';
import { AppSidebar, MainTab, NavItem } from './components/AppSidebar';
import { DashboardView } from './components/DashboardView';
import {
  CheckCircle2,
  CreditCard,
  Edit3,
  ExternalLink,
  KeyRound,
  LogOut,
  Plus,
  Swords,
  UserCheck,
  UserPlus,
} from 'lucide-react';

type ScreenStage = 'login' | 'loading' | 'lobby';

// Tanpa Firebase (mode demo) data contoh dipakai di memori; dengan Firebase data berasal dari Firestore.
const SEED = !cloudEnabled;

/** Kunci objek diurutkan agar perbandingan tidak terpengaruh urutan field dari Firestore. */
const stable = (v: unknown) =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([x], [y]) => (x < y ? -1 : 1)))
      : val
  );

/** Proyeksi publik: hanya tim yang disetujui, tanpa kontak dan bukti pembayaran. */
const toPublicRegs = (regs: TournamentRegistration[]): TournamentRegistration[] =>
  regs
    .filter((r) => r.status === 'approved')
    .map((r) => ({
      id: r.id,
      tournamentId: r.tournamentId,
      teamId: r.teamId,
      teamName: r.teamName,
      teamTag: r.teamTag,
      slotIndex: r.slotIndex,
      captainName: r.captainName,
      whatsapp: '',
      corePlayerIds: r.corePlayerIds,
      subPlayerIds: r.subPlayerIds,
      feeTypeSnapshot: r.feeTypeSnapshot,
      requirementSubmissions: [],
      status: r.status,
      verifiedBy: r.verifiedBy,
      verifiedAt: r.verifiedAt,
      registeredAt: r.registeredAt,
    }));

const waLink = (n?: string) => {
  const d = (n || '').replace(/\D/g, '');
  return d.length >= 10 ? `https://wa.me/${d.replace(/^0/, '62')}` : '';
};

export default function App() {
  const [players, setPlayers] = useState<Player[]>(SEED ? INITIAL_PLAYERS : []);
  const [teams, setTeams] = useState<Team[]>(SEED ? INITIAL_TEAMS : []);
  const [tournaments, setTournaments] = useState<Tournament[]>(SEED ? INITIAL_TOURNAMENTS : []);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(
    SEED ? INITIAL_REGISTRATIONS : []
  );
  const [matches, setMatches] = useState<Match[]>(SEED ? INITIAL_MATCHES : []);
  const [submissions, setSubmissions] = useState<DbSubmission[]>([]); // antrean pendaftaran ke Database

  // Alur layar: login -> loading -> lobby. Staf = akun Firebase; selain itu pengunjung.
  const [screenStage, setScreenStage] = useState<ScreenStage>('login');
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const currentRole: UserRole = staff ? staff.role : 'pengunjung';
  const isAdmin = staff?.role === 'admin';
  const sessionName = staff?.name || 'Pengunjung';
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Modals State
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null
  );
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedMatchForModal, setSelectedMatchForModal] =
    useState<Match | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // ---- Sinkron Firebase ----
  const [stateLoaded, setStateLoaded] = useState(SEED);
  const [regsLoaded, setRegsLoaded] = useState(false);
  const lastState = useRef('');
  const lastContacts = useRef('');
  const privateRef = useRef<{ teamContacts: Record<string, string>; playerNames: Record<string, string> }>({ teamContacts: {}, playerNames: {} });
  const regRemote = useRef(new Map<string, string>());
  const publicRegs = useRef<TournamentRegistration[]>([]);
  const wasStaff = useRef(false);

  // Sesi staf (dipulihkan per tab). Kembali ke login bila sesi staf berakhir.
  useEffect(
    () =>
      onSession((profile) => {
        setStaff(profile);
        if (profile) {
          wasStaff.current = true;
          setScreenStage((st) => (st === 'login' ? 'lobby' : st));
        } else if (wasStaff.current) {
          wasStaff.current = false;
          setScreenStage('login');
        }
      }),
    []
  );

  // Data publik (semua orang membaca).
  useEffect(() => {
    if (!cloudEnabled) return;
    return subscribeState(
      (st) => {
        const core = {
          tournaments: (st?.tournaments || []) as Tournament[],
          teams: st?.teams || [],
          players: (st?.players || []) as Player[],
          matches: (st?.matches || []) as Match[],
          registrations: st?.registrations || [],
        };
        lastState.current = stable(core);
        publicRegs.current = core.registrations;
        setTournaments(core.tournaments);
        setTeams(core.teams.map((t) => ({ ...t, whatsapp: privateRef.current.teamContacts[t.id] ?? '' })));
        setPlayers(core.players.map((p) => ({ ...p, fullName: privateRef.current.playerNames[p.id] })));
        setMatches(core.matches);
        setStaff((cur) => {
          if (!cur) setRegistrations(core.registrations); // pengunjung memakai proyeksi publik
          return cur;
        });
        setStateLoaded(true);
      },
      () => showToast('Gagal memuat data dari server. Muat ulang halaman.')
    );
  }, []);

  // Data khusus staf: pendaftaran lengkap dan nomor WhatsApp kapten.
  useEffect(() => {
    if (!cloudEnabled) return;
    if (!staff) {
      setRegsLoaded(false);
      setSubmissions([]);
      setRegistrations(publicRegs.current);
      return;
    }
    const unsubRegs = subscribeRegistrations((list) => {
      regRemote.current = new Map(list.map((r) => [r.id, stable(r)]));
      setRegistrations([...list].sort((a, b) => (a.registeredAt < b.registeredAt ? 1 : -1)));
      setRegsLoaded(true);
    });
    const unsubSubs = subscribeSubmissions(setSubmissions);
    const unsubContacts = subscribePrivate((d) => {
      privateRef.current = d;
      lastContacts.current = stable(d);
      setTeams((prev) => prev.map((t) => ({ ...t, whatsapp: d.teamContacts[t.id] ?? t.whatsapp })));
      setPlayers((prev) => prev.map((p) => ({ ...p, fullName: d.playerNames[p.id] ?? p.fullName })));
    });
    return () => {
      unsubRegs();
      unsubSubs();
      unsubContacts();
    };
  }, [!!staff]);

  // Simpan perubahan staf ke server (debounce). Pengunjung tidak pernah menulis ke data publik.
  useEffect(() => {
    if (!cloudEnabled || !staff || !stateLoaded || !regsLoaded) return;
    const pub = {
      tournaments,
      teams: teams.map((t) => ({ ...t, whatsapp: '' })),
      players: players.map(({ fullName: _private, ...p }) => p), // nama lengkap tidak boleh masuk data publik
      matches,
      registrations: toPublicRegs(registrations),
    };
    const priv = {
      teamContacts: Object.fromEntries(teams.filter((t) => t.whatsapp).map((t) => [t.id, t.whatsapp])),
      playerNames: Object.fromEntries(players.filter((p) => p.fullName).map((p) => [p.id, p.fullName as string])),
    };
    const key = stable(pub);
    const keyWa = stable(priv);
    if (key === lastState.current && keyWa === lastContacts.current) return;
    const timer = setTimeout(async () => {
      try {
        if (key !== lastState.current) {
          lastState.current = key;
          await saveState(pub);
        }
        if (keyWa !== lastContacts.current) {
          lastContacts.current = keyWa;
          await savePrivate(priv);
        }
      } catch {
        lastState.current = '';
        showToast('Gagal menyimpan ke server. Periksa koneksi lalu ulangi perubahan.');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [tournaments, teams, players, matches, registrations, staff, stateLoaded, regsLoaded]);

  useEffect(() => {
    if (!cloudEnabled || !staff || !regsLoaded) return;
    registrations.forEach((r) => {
      const key = stable(r);
      if (regRemote.current.get(r.id) === key) return;
      regRemote.current.set(r.id, key);
      saveRegistration(r).catch(() => {
        regRemote.current.delete(r.id);
        showToast('Gagal menyimpan pendaftaran ke server.');
      });
    });
  }, [registrations, staff, regsLoaded]);

  // Pengunjung hanya melihat tab publik; staf non-admin tidak punya tab Manajemen User.
  useEffect(() => {
    if (activeTab === 'users' && !isAdmin) setActiveTab('bracket');
  }, [activeTab, isAdmin]);

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

  const canManageTournament = Boolean(staff);

  const enterLobby = (profile: StaffProfile | null) => {
    setStaff(profile);
    setScreenStage('loading');
  };

  const handleLogout = async () => {
    wasStaff.current = false;
    await logout();
    setStaff(null);
    setScreenStage('login');
  };

  // Bracket baru menghapus hasil laga; minta konfirmasi bila sudah ada skor/statistik.
  const confirmDiscardResults = () => {
    const started = activeMatches.some(
      (m) => m.status !== 'scheduled' || m.playerStats.length > 0 || m.scoreA > 0 || m.scoreB > 0
    );
    return (
      !started ||
      window.confirm('Sudah ada hasil laga. Menyusun ulang bracket akan MENGHAPUS semua skor dan statistik turnamen ini. Lanjutkan?')
    );
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
    if (!activeTournament || !confirmDiscardResults()) return;
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
    if (!activeTournament || !confirmDiscardResults()) return;
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
  const handleRegisterTeam = async (
    newReg: TournamentRegistration,
    newTeam?: Team,
    newPlayers?: Player[]
  ) => {
    // Pengunjung: kirim ke antrean staf (dokumen baru status pending). Tim/pemain baru ikut dikirim
    // dan baru masuk database saat panitia menyetujui.
    if (cloudEnabled && !staff) {
      try {
        await saveRegistration({
          ...newReg,
          status: 'pending',
          ...(newTeam ? { newTeam } : {}),
          ...(newPlayers ? { newPlayers } : {}),
        });
        setIsRegistrationModalOpen(false);
        showToast(`Pendaftaran tim [${newReg.teamTag}] ${newReg.teamName} terkirim. Panitia akan memverifikasi.`);
      } catch {
        showToast('Gagal mengirim pendaftaran. Periksa koneksi lalu coba lagi.');
      }
      return;
    }
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
    const verifierName = `${sessionName} (${isAdmin ? 'Admin' : 'Panitia'})`;
    const target = registrations.find((r) => r.id === regId);
    if (target?.newPlayers?.length) {
      setPlayers((prev) => [
        ...prev,
        ...target.newPlayers!.filter((np) => !prev.some((p) => p.id === np.id)),
      ]);
    }
    if (target?.newTeam) {
      setTeams((prev) => (prev.some((t) => t.id === target.newTeam!.id) ? prev : [...prev, target.newTeam!]));
    }

    const updatedRegs = registrations.map((r) =>
      r.id === regId
        ? {
            ...r,
            newTeam: undefined,
            newPlayers: undefined,
            status: 'approved' as const,
            verifiedBy: verifierName,
            verifiedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          }
        : r
    );
    setRegistrations(updatedRegs);

    // Jangan menyusun ulang bracket otomatis bila laga sudah berjalan: hasil akan hilang.
    const started = activeMatches.some(
      (m) => m.status !== 'scheduled' || m.playerStats.length > 0 || m.scoreA > 0 || m.scoreB > 0
    );
    if (activeTournament && !started) {
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
      showToast('Pendaftaran tim disetujui & otomatis dimasukkan ke jadwal bracket.');
    } else {
      showToast('Pendaftaran tim disetujui. Laga sudah berjalan, jadi bracket tidak disusun ulang otomatis.');
    }
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

  // Pendaftaran tim/player ke Database. Dengan Firebase masuk koleksi submissions (pengunjung hanya membuat);
  // mode demo: antrean lokal.
  const handleSubmitSubmission = async (sub: DbSubmission) => {
    if (cloudEnabled) await saveSubmission(sub);
    else setSubmissions((prev) => [sub, ...prev]);
  };

  const removeSubmission = async (sub: DbSubmission) => {
    try {
      if (cloudEnabled) await deleteSubmission(sub.id);
      setSubmissions((prev) => prev.filter((x) => x.id !== sub.id));
    } catch {
      showToast('Gagal memperbarui antrean. Periksa koneksi.');
      return false;
    }
    return true;
  };

  const handleApproveSubmission = async (sub: DbSubmission) => {
    // Pengunjung tidak bisa melihat antrean, jadi ID MLBB ganda baru ketahuan di sini.
    const dup = sub.players.find((np) =>
      players.some((p) => p.id !== np.id && p.mlbbId.trim() === np.mlbbId.trim() && p.serverId.trim() === np.serverId.trim())
    );
    if (dup) {
      showToast(`ID MLBB ${dup.mlbbId} (${dup.serverId}) sudah ada di Database. Tolak pendaftaran ini atau hapus data lama dulu.`);
      return;
    }
    if (sub.players.length) {
      setPlayers((prev) => [...prev, ...sub.players.filter((np) => !prev.some((p) => p.id === np.id))]);
    }
    if (sub.team) {
      setTeams((prev) => (prev.some((t) => t.id === sub.team!.id) ? prev : [...prev, sub.team!]));
    }
    if (await removeSubmission(sub)) showToast('Pendaftaran disetujui dan masuk ke Database.');
  };

  const handleRejectSubmission = async (sub: DbSubmission) => {
    if (window.confirm('Tolak dan hapus pendaftaran ini?') && (await removeSubmission(sub))) showToast('Pendaftaran ditolak.');
  };

  const pendingRegistrationsCount = activeRegistrations.filter(
    (r) => r.status === 'pending'
  ).length;

  const roleBadgeLabel = isAdmin
    ? 'Admin'
    : staff
    ? 'Panitia Turnamen'
    : 'Pengunjung';

  // Turnamen aktif bisa hilang (dihapus staf lain): pilih ulang otomatis lewat activeTournament.
  const playersForView = useMemo(() => {
    const extra = registrations.flatMap((r) => r.newPlayers || []);
    return extra.length ? [...players, ...extra.filter((e) => !players.some((p) => p.id === e.id))] : players;
  }, [players, registrations]);

  // STAGE 1: LOGIN
  if (screenStage === 'login') {
    return (
      <MLBBLaylaLoginPage
        onStaffLogin={(profile) => enterLobby(profile)}
        onVisitor={() => enterLobby(null)}
        tournaments={tournaments}
        loading={cloudEnabled && !stateLoaded}
      />
    );
  }

  // STAGE 2: LOADING
  if (screenStage === 'loading') {
    return (
      <MLBBAlucardLoadingScreen
        userName={sessionName}
        userRoleLabel={roleBadgeLabel}
        ready={!cloudEnabled || stateLoaded}
        onComplete={() => {
          setScreenStage('lobby');
          showToast(`Selamat datang di Lobby ArenaDawn, ${sessionName}!`);
        }}
      />
    );
  }

  const capacityWarning = (() => {
    if (!activeTournament) return null; // belum ada turnamen (mis. database baru): tidak ada yang diperingatkan
    const approved = activeRegistrations.filter((r) => r.status === 'approved').length;
    const cap = bracketCapacity(activeTournament.bracketFormat);
    return approved > cap ? (
      <div role="alert" className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-100">
        Format bracket ini menampung maksimal {cap} tim. {approved - cap} tim terverifikasi tidak masuk
        bracket. Ganti format (mis. Single Elimination atau Round Robin).
      </div>
    ) : null;
  })();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard Utama' },
    { id: 'bracket', label: 'Live Bracket & Klasemen' },
    { id: 'tournaments', label: 'Daftar Turnamen' },
    { id: 'registrations', label: staff ? 'Verifikasi Pendaftaran' : 'Peserta Turnamen', badge: staff ? pendingRegistrationsCount : undefined },
    { id: 'stats', label: 'Statistik Pemain' },
    { id: 'register', label: 'Daftar Tim & Player', badge: staff ? submissions.length : undefined },
    { id: 'database', label: 'Database Tim & Player' },
    ...(isAdmin ? [{ id: 'users' as MainTab, label: 'Manajemen User' }] : []),
  ];
  const pageTitle = (navItems.find((i) => i.id === activeTab)?.label || '').toUpperCase();
  const contactUrl = waLink(activeTournament?.contactWhatsapp);

  const handleShare = async () => {
    const url = window.location.href.split('#')[0];
    try {
      if (navigator.share) return void (await navigator.share({ title: activeTournament?.name || 'ArenaDawn MLBB', url }));
      await navigator.clipboard.writeText(url);
      showToast('Tautan disalin.');
    } catch {
      /* dibatalkan pengguna */
    }
  };

  // STAGE 3: DASHBOARD ALA PUBGM-CRP (sidebar + konten)
  return (
    <div className="relative min-h-screen bg-[#070D19] text-slate-100 lg:flex overflow-x-hidden">
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

      <AppSidebar
        items={navItems}
        active={activeTab}
        onSelect={setActiveTab}
        isStaff={Boolean(staff)}
        contactUrl={contactUrl}
        bestOf={activeTournament?.defaultBestOf ?? 1}
      />

      <div className="relative z-10 flex-1 min-w-0 flex flex-col pb-20 lg:pb-0">
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 px-4 py-3 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-8 py-6 space-y-6 flex-1">
        <header className="rounded-[18px] border border-[#24304D] bg-[#0E1830] px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span
              className={`inline-block pl-2.5 pr-3.5 py-1 text-xs font-extrabold tracking-wider text-[#0B1325] ${staff ? 'bg-sky-400' : 'bg-amber-400'}`}
              style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}
            >
              {roleBadgeLabel.toUpperCase()}
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-wide">{pageTitle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {staff && (
              <span className="min-h-[44px] px-3.5 inline-flex items-center rounded-xl border border-[#24304D] bg-[#0A1224] font-mono text-[13px] text-slate-200">
                {staff.username}
              </span>
            )}
            {staff && (
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                aria-label="Ganti password"
                title="Ganti password"
                className="w-11 h-11 rounded-xl border border-[#24304D] bg-[#111C36] text-slate-200 hover:text-amber-300 flex items-center justify-center cursor-pointer"
              >
                <KeyRound className="w-[18px] h-[18px]" />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] px-5 rounded-xl border border-[#24304D] bg-[#111C36] text-sm font-semibold text-red-300 hover:bg-red-500/10 cursor-pointer inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {staff ? 'Keluar' : 'Ke Login'}
            </button>
          </div>
        </header>

        {(activeTab === 'bracket' || activeTab === 'registrations' || activeTab === 'stats') && activeTournament && (
          <div className="space-y-3">
            <label className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold tracking-[0.08em] text-slate-400">TURNAMEN</span>
              <select
                value={activeTournament.id}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="min-h-[44px] max-w-full rounded-xl border border-[#24304D] bg-[#0A1224] px-3 text-sm text-slate-100"
              >
                {tournaments.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </label>
            {capacityWarning}
          </div>
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
            {activeTab === 'dashboard' && (
              <DashboardView
                tournaments={tournaments}
                tournament={activeTournament}
                registrations={activeRegistrations}
                matches={activeMatches}
                players={players}
                isStaff={Boolean(staff)}
                pendingCount={pendingRegistrationsCount}
                queueCount={submissions.length}
                contactUrl={contactUrl}
                onSelectTournament={setSelectedTournamentId}
                onRegister={() => setIsRegistrationModalOpen(true)}
                onShare={handleShare}
                onGo={setActiveTab}
                onEdit={() => {
                  setEditingTournament(activeTournament);
                  setIsTournamentModalOpen(true);
                }}
                onNew={() => {
                  setEditingTournament(null);
                  setIsTournamentModalOpen(true);
                }}
                onRegenerate={handleRegenerateCurrentBracket}
                onInputScore={(m) => setSelectedMatchForModal(m)}
              />
            )}

            {activeTab === 'tournaments' && (
              <div className="space-y-6">
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

        {!activeTournament && (
          <section className="p-8 glass-panel rounded-2xl text-center space-y-2">
            <h2 className="text-lg font-bold text-white">Belum ada turnamen</h2>
            <p className="text-sm text-slate-300">
              {canManageTournament
                ? 'Klik "Buat Turnamen Baru" untuk memulai.'
                : 'Panitia belum mempublikasikan turnamen. Silakan kembali lagi nanti.'}
            </p>
          </section>
        )}

        {capacityWarning}

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
              </div>
            )}

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
                players={playersForView}
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

            {activeTab === 'register' && (
              <TeamPlayerRegistrationView
                teams={teams}
                players={players}
                submissions={submissions}
                isStaff={Boolean(staff)}
                onSubmit={handleSubmitSubmission}
                onApprove={handleApproveSubmission}
                onReject={handleRejectSubmission}
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
                  setTeams((prev) =>
                    prev.map((t) =>
                      t.memberPlayerIds.includes(pid)
                        ? { ...t, memberPlayerIds: t.memberPlayerIds.filter((x) => x !== pid) }
                        : t
                    )
                  );
                  showToast('Data pemain dihapus dari database.');
                }}
                onAddTeam={(newT) => {
                  setTeams((prev) => [newT, ...prev]);
                  showToast(`Tim "[${newT.tag}] ${newT.name}" ditambahkan ke Database Master.`);
                }}
                onDeleteTeam={(tid) => {
                  setTeams((prev) => prev.filter((t) => t.id !== tid));
                  // anggota jadi "tanpa tim", bukan menunjuk ke tim yang sudah tidak ada
                  setPlayers((prev) => prev.map((p) => (p.teamId === tid ? { ...p, teamId: undefined } : p)));
                  showToast('Data tim dihapus dari database.');
                }}
              />
            )}

            {activeTab === 'users' && isAdmin && <UserManagementView currentUsername={staff?.username || ''} />}
          </motion.div>
        </AnimatePresence>
      </main>
      </div>

      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
          onDone={() => {
            setIsPasswordModalOpen(false);
            showToast('Password berhasil diperbarui.');
          }}
        />
      )}

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
