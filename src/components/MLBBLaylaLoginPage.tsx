import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, KeyRound, Loader2, Play, User } from 'lucide-react';
import { StaffProfile, authErrorMessage, cloudEnabled, loginWithUsername } from '../cloud';

interface MLBBLaylaLoginPageProps {
  onStaffLogin: (profile: StaffProfile) => void;
  onVisitor: () => void;
}

export const MLBBLaylaLoginPage: React.FC<MLBBLaylaLoginPageProps> = ({
  onStaffLogin,
  onVisitor,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Isi username dan password.');
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      onStaffLogin(await loginWithUsername(username, password));
    } catch (err) {
      setErrorMsg(authErrorMessage(err));
      setBusy(false);
    }
  };

  const inputWrap =
    'flex items-center gap-3 px-4 py-3 rounded-xl bg-[#233554]/90 border border-sky-400/30 focus-within:border-amber-400 transition-colors';
  const input =
    'w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1D2B44] flex items-center justify-center">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="/assets/aistudio/login_page_0c3603ff.png"
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-left lg:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1325]/70 via-[#1E2E4A]/85 to-[#182640] lg:bg-[linear-gradient(to_right,rgba(11,19,37,0.1)_0%,rgba(24,38,64,0.97)_52%)]" />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 items-center">
        <div className="hidden lg:block lg:col-span-6" />
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-200/20 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs font-mono tracking-widest text-amber-300">ARENADAWN MLBB</p>
              <h1 className="font-game-serif text-3xl font-bold text-[#F6E3BA]">Login Panitia</h1>
              <p className="text-xs text-slate-300">Khusus admin dan panitia turnamen</p>
            </div>

            {!cloudEnabled && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs text-amber-100 text-center" role="status">
                Mode demo: Firebase belum dikonfigurasi, login panitia belum aktif. Anda tetap bisa
                masuk sebagai pengunjung.
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200 text-center" role="alert">
                {errorMsg}
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <label className={inputWrap}>
                <User className="w-4 h-4 text-sky-300/80 shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  aria-label="Username"
                  disabled={!cloudEnabled || busy}
                  className={input}
                />
              </label>
              <label className={inputWrap}>
                <KeyRound className="w-4 h-4 text-sky-300/80 shrink-0" aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  disabled={!cloudEnabled || busy}
                  className={input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="text-sky-300 hover:text-amber-300 shrink-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </label>
              <button
                type="submit"
                disabled={!cloudEnabled || busy}
                className="w-full py-3 rounded-lg mlbb-gold-button font-game-serif text-lg font-bold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {busy ? 'Memeriksa...' : 'Masuk'}
              </button>
            </form>

            <div className="flex items-center gap-3 text-[11px] text-slate-400" aria-hidden="true">
              <span className="h-px flex-1 bg-white/15" />
              atau
              <span className="h-px flex-1 bg-white/15" />
            </div>

            <button
              type="button"
              onClick={onVisitor}
              className="w-full py-3 rounded-lg glass-card hover:border-amber-400/60 text-sm font-semibold text-sky-100 hover:text-amber-200 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-amber-400" aria-hidden="true" />
              Masuk Pengunjung (tanpa login)
            </button>
          </div>
        </motion.main>
      </div>
    </div>
  );
};
