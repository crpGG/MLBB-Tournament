import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserAccount, UserRole } from '../types/tournament';
import {
  Dices,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';

interface MLBBLaylaLoginPageProps {
  users: UserAccount[];
  onLoginSuccess: (session: {
    name: string;
    email: string;
    role: UserRole;
    region: string;
  }) => void;
}

const RANDOM_MLBB_NAMES = [
  'NoButton',
  'SavageKing.ID',
  'Kairi.Prodigy',
  'Skylar.Cannon',
  'DawnCommander',
  'SulutPride.GG',
  'MythicSlayer99',
];

const REGIONS = [
  { code: 'ID-SULUT', label: 'Sulawesi Utara (ID)' },
  { code: 'ID-JKT', label: 'Jakarta Pusat (ID)' },
  { code: 'ID-SBY', label: 'Surabaya (ID)' },
  { code: 'SEA-ALL', label: 'Southeast Asia (SEA)' },
];

export const MLBBLaylaLoginPage: React.FC<MLBBLaylaLoginPageProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [loginMode, setLoginMode] = useState<'staff' | 'visitor'>('staff');
  const [nickname, setNickname] = useState('NoButton');
  const [email, setEmail] = useState('sacty.geraldy@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [regionIdx, setRegionIdx] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeRegion = REGIONS[regionIdx % REGIONS.length];

  const handleRollNickname = () => {
    const others = RANDOM_MLBB_NAMES.filter((n) => n !== nickname);
    const picked = others[Math.floor(Math.random() * others.length)];
    setNickname(picked);
  };

  const handleFillDemoStaff = (targetRole: 'admin' | 'panitia') => {
    setErrorMsg(null);
    setLoginMode('staff');
    setSelectedRole(targetRole);
    if (targetRole === 'admin') {
      setEmail('sacty.geraldy@gmail.com');
      setPassword('admin123');
    } else {
      setEmail('rizky.panitia@arenadawn.id');
      setPassword('panitia123');
    }
  };

  const handleStaffLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (loginMode === 'visitor') {
      onLoginSuccess({
        name: nickname.trim() || 'NoButton',
        email: 'guest@arenadawn.id',
        role: 'pengunjung',
        region: activeRegion.label,
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.active
    );

    if (!password.trim() || password.length < 4) {
      setErrorMsg('Password minimal 4 karakter.');
      return;
    }

    if (matchedUser) {
      onLoginSuccess({
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        region: activeRegion.label,
      });
    } else {
      // Allow custom staff email with chosen role
      onLoginSuccess({
        name:
          selectedRole === 'admin'
            ? `Admin (${cleanEmail.split('@')[0]})`
            : `Panitia (${cleanEmail.split('@')[0]})`,
        email: cleanEmail,
        role: selectedRole,
        region: activeRegion.label,
      });
    }
  };

  const handleDirectVisitorEnter = () => {
    onLoginSuccess({
      name: nickname.trim() || 'Pengunjung Arena',
      email: 'guest@arenadawn.id',
      role: 'pengunjung',
      region: activeRegion.label,
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1D2B44] flex items-center justify-center select-none">
      {/* Background Reference Image (Layla Create Character) with Subtle Breathing Motion */}
      <motion.div
        initial={{ scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className="absolute inset-0 z-0"
      >
        <img
          src="/assets/aistudio/login_page_0c3603ff.png"
          alt="Mobile Legends Layla Login Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-left lg:object-center"
        />
        {/* Measured scrim over the right half so the static text in the PNG is replaced cleanly by our interactive Glassy Panel */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1325]/25 via-[#1E2E4A]/70 to-[#182640]/95" />
        {/* Top & Bottom cinematic vignette bars matching the reference image */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#091020]/90 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#091020]/90 to-transparent" />
      </motion.div>

      {/* Animated Golden Sparkles & Floating Celestial Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* Sparkle near Layla's fingers */}
        <motion.div
          animate={{
            scale: [0.85, 1.35, 0.85],
            opacity: [0.6, 1, 0.6],
            rotate: [0, 15, 0],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden lg:flex absolute left-[41%] top-[16%] text-amber-200 drop-shadow-[0_0_16px_rgba(253,230,138,0.95)]"
        >
          <Sparkles className="w-9 h-9" />
        </motion.div>

        {/* Ambient floating light orbs */}
        {[
          { left: '14%', top: '24%', size: 6, delay: 0 },
          { left: '34%', top: '72%', size: 8, delay: 0.7 },
          { left: '54%', top: '18%', size: 5, delay: 1.3 },
          { left: '82%', top: '22%', size: 7, delay: 0.4 },
          { left: '68%', top: '80%', size: 6, delay: 1.8 },
          { left: '90%', top: '65%', size: 8, delay: 0.9 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -24, 0],
              opacity: [0.25, 0.85, 0.25],
              scale: [0.9, 1.2, 0.9],
            }}
            transition={{
              duration: 3.5 + (i % 3),
              repeat: Infinity,
              delay: orb.delay,
              ease: 'easeInOut',
            }}
            style={{
              left: orb.left,
              top: orb.top,
              width: orb.size,
              height: orb.size,
            }}
            className="absolute rounded-full bg-amber-300 shadow-[0_0_14px_#FDE68A]"
          />
        ))}
      </div>

      {/* Top Left Game Version & Portal Badge */}
      <div className="absolute top-5 left-6 z-20 flex items-center gap-3 text-xs font-mono text-slate-300/90">
        <span className="px-3 py-1 rounded-md glass-card text-amber-300 font-semibold">
          ARENADAWN MLBB PORTAL
        </span>
        <span className="hidden sm:inline text-slate-300/80">
          Turnamen Esport Mobile Legends · Match Day 14 Oktober 2026
        </span>
      </div>

      {/* Main Content Grid: Left Space for Layla Illustration, Right Side for Interactive Create Character / Login Panel */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
        {/* Left column keeps Layla visible on desktop */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-6 pointer-events-none" />

        {/* Right column: Interactive Glassy MLBB Login Box */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 xl:col-span-6 w-full max-w-xl mx-auto"
        >
          <div className="glass-panel rounded-2xl p-6 sm:p-9 border border-amber-200/20 relative overflow-hidden">
            {/* Subtle top gold light reflection */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-400/15 blur-3xl pointer-events-none" />

            {/* Serif Gold Header matching "Create Character" in reference image */}
            <div className="text-center space-y-2 mb-6">
              <motion.h1
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="font-game-serif text-3xl sm:text-4xl font-bold tracking-wide text-[#F6E3BA] drop-shadow-[0_2px_10px_rgba(245,158,11,0.35)]"
              >
                {loginMode === 'staff' ? 'Portal Login Panitia' : 'Create Character'}
              </motion.h1>
              <p className="text-xs sm:text-sm text-slate-300/90">
                {loginMode === 'staff'
                  ? 'Masuk menggunakan Email & Password untuk Admin / Panitia Turnamen'
                  : 'Masukkan Nickname Kapten / Pengunjung untuk memantau Bracket & Daftar Tim'}
              </p>
            </div>

            {/* Mode Switcher Tabs (Admin/Panitia vs Pengunjung) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#121D33]/90 border border-slate-700/70 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('staff');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === 'staff'
                    ? 'bg-gradient-to-r from-amber-500/25 to-amber-400/15 text-[#F6E3BA] border border-amber-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Login Admin / Panitia
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('visitor');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === 'visitor'
                    ? 'bg-gradient-to-r from-amber-500/25 to-amber-400/15 text-[#F6E3BA] border border-amber-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 text-sky-400" />
                Mode Karakter Pengunjung
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200 text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStaffLoginSubmit} className="space-y-5">
              {loginMode === 'staff' ? (
                <>
                  {/* Quick Demo Account Selector Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <span className="text-[11px] text-slate-300">
                      Isi Cepat Akun Demo:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFillDemoStaff('admin')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          selectedRole === 'admin'
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        Akun Admin (Semua Fitur)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillDemoStaff('panitia')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          selectedRole === 'panitia'
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        Akun Panitia (Tanpa User)
                      </button>
                    </div>
                  </div>

                  {/* Chamfered Email Input Bar (Matches Layla Reference Input Shape) */}
                  <div className="space-y-3">
                    <div className="relative p-[1.5px] bg-gradient-to-r from-sky-400/40 via-slate-400/30 to-sky-400/40 mlbb-chamfer-bar">
                      <div className="bg-[#233554]/95 mlbb-chamfer-bar flex items-center px-6 py-3">
                        <Mail className="w-4 h-4 text-sky-300/80 mr-3 shrink-0" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Admin / Panitia"
                          className="w-full bg-transparent text-center text-sm sm:text-base font-medium text-white placeholder-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleFillDemoStaff(
                              selectedRole === 'admin' ? 'panitia' : 'admin'
                            )
                          }
                          title="Ganti Akun Demo"
                          className="text-sky-300 hover:text-amber-300 transition-colors ml-2 shrink-0"
                        >
                          <Dices className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Chamfered Password Input Bar */}
                    <div className="relative p-[1.5px] bg-gradient-to-r from-sky-400/40 via-slate-400/30 to-sky-400/40 mlbb-chamfer-bar">
                      <div className="bg-[#233554]/95 mlbb-chamfer-bar flex items-center px-6 py-3">
                        <KeyRound className="w-4 h-4 text-sky-300/80 mr-3 shrink-0" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password Akun"
                          className="w-full bg-transparent text-center text-sm sm:text-base font-medium text-white placeholder-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-sky-300 hover:text-amber-300 transition-colors ml-2 shrink-0"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Visitor "Create Character" Nickname Bar (Exact match to Layla image) */
                <div className="space-y-2">
                  <div className="relative p-[1.5px] bg-gradient-to-r from-sky-400/45 via-slate-400/30 to-sky-400/45 mlbb-chamfer-bar">
                    <div className="bg-[#233554]/95 mlbb-chamfer-bar flex items-center px-6 py-3.5">
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={20}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Masukkan Nickname / Nama Kapten"
                        className="w-full bg-transparent text-center text-base sm:text-lg font-medium text-white placeholder-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRollNickname}
                        title="Acak Nickname MLBB"
                        className="text-sky-300 hover:text-amber-300 transition-transform active:rotate-90 ml-2 shrink-0"
                      >
                        <Dices className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-300/80 leading-relaxed px-4">
                    Name can only contain 4-20 characters. Pilih bendera region & role akses di bawah ini.
                  </p>
                </div>
              )}

              {/* Two Chamfered Sub-Bars (Left: Flag/Region, Right: Role Selector) matching the reference image */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Left Chamfered Selector: Region Flag */}
                <div className="p-[1px] bg-sky-400/35 mlbb-chamfer-bar">
                  <button
                    type="button"
                    onClick={() => setRegionIdx((prev) => prev + 1)}
                    className="w-full bg-[#233554]/90 hover:bg-[#2B4066] mlbb-chamfer-bar px-4 py-2.5 flex items-center justify-between transition-colors"
                    title="Klik untuk ganti Region Server"
                  >
                    <span className="flex items-center gap-2 mx-auto">
                      {/* Indonesian Red-White Flag Emblem */}
                      <span className="w-5 h-5 rounded-full overflow-hidden border border-white/40 flex flex-col shrink-0">
                        <span className="h-1/2 w-full bg-red-600 block" />
                        <span className="h-1/2 w-full bg-white block" />
                      </span>
                      <span className="text-xs font-medium text-slate-100 truncate">
                        {activeRegion.code}
                      </span>
                    </span>
                    <Edit3 className="w-3.5 h-3.5 text-sky-300/80 shrink-0" />
                  </button>
                </div>

                {/* Right Chamfered Selector: Role Badge */}
                <div className="p-[1px] bg-sky-400/35 mlbb-chamfer-bar">
                  <button
                    type="button"
                    onClick={() => {
                      if (loginMode === 'staff') {
                        const nextRole =
                          selectedRole === 'admin' ? 'panitia' : 'admin';
                        handleFillDemoStaff(nextRole);
                      } else {
                        setLoginMode('staff');
                      }
                    }}
                    className="w-full bg-[#233554]/90 hover:bg-[#2B4066] mlbb-chamfer-bar px-4 py-2.5 flex items-center justify-between transition-colors"
                    title="Klik untuk mengganti Role"
                  >
                    <span className="flex items-center gap-2 mx-auto">
                      <span className="w-5 h-5 rounded bg-sky-500/30 border border-sky-300/40 flex items-center justify-center text-[11px] font-bold text-amber-300 shrink-0">
                        {loginMode === 'visitor'
                          ? 'P'
                          : selectedRole === 'admin'
                          ? 'A'
                          : 'K'}
                      </span>
                      <span className="text-xs font-semibold text-amber-200 uppercase truncate">
                        {loginMode === 'visitor'
                          ? 'Pengunjung'
                          : selectedRole === 'admin'
                          ? 'Admin'
                          : 'Panitia'}
                      </span>
                    </span>
                    <Edit3 className="w-3.5 h-3.5 text-sky-300/80 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Beveled Gold "Okay" Button matching the reference image */}
              <div className="pt-3 flex flex-col items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-60 py-2.5 rounded-md mlbb-gold-button font-game-serif text-lg font-bold tracking-wider transition-all cursor-pointer"
                >
                  Okay
                </motion.button>

                {/* Direct 1-Click Visitor Entry Button when in Staff Mode */}
                {loginMode === 'staff' && (
                  <button
                    type="button"
                    onClick={handleDirectVisitorEnter}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg glass-card text-xs font-semibold text-sky-200 hover:text-amber-300 hover:border-amber-400/50 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    Masuk Langsung sebagai Pengunjung (Lihat Jadwal & Daftar Tim)
                  </button>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
