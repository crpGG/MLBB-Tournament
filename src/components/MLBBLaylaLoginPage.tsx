import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, User } from 'lucide-react';
import { StaffProfile, authErrorMessage, cloudEnabled, loginWithUsername } from '../cloud';
import { BrandMark } from './AppSidebar';
import { shuffledWallpapers } from '../utils/wallpaper';

interface Props {
  onStaffLogin: (profile: StaffProfile) => void;
  onVisitor: () => void;
}

const HOLD_MS = 9000;

/** Login sederhana: username, password, atau masuk sebagai pengunjung. Latar berganti acak. */
export const MLBBLaylaLoginPage: React.FC<Props> = ({ onStaffLogin, onVisitor }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Dua lapisan gambar bergantian untuk transisi pudar.
  const [layers, setLayers] = useState<[string, string]>(['', '']);
  const [active, setActive] = useState(0);
  const order = useRef<string[]>([]);
  const pos = useRef(0);
  const last = useRef<string | undefined>(undefined);

  useEffect(() => {
    const next = () => {
      if (pos.current >= order.current.length) {
        order.current = shuffledWallpapers(last.current);
        pos.current = 0;
      }
      const src = order.current[pos.current++];
      last.current = src;
      setActive((a) => {
        const n = 1 - a;
        setLayers((l) => (n === 0 ? [src, l[1]] : [l[0], src]));
        return n;
      });
      // Muat gambar berikutnya lebih dulu agar tidak berkedip.
      const peek = order.current[pos.current];
      if (peek) new Image().src = peek;
    };
    next();
    const t = setInterval(next, HOLD_MS);
    return () => clearInterval(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError('Isi username dan password.');
    if (!cloudEnabled) return setError('Login staf tidak tersedia di mode demo. Gunakan Masuk sebagai Pengunjung.');
    setBusy(true);
    setError('');
    try {
      onStaffLogin(await loginWithUsername(username, password));
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const field = 'flex items-center gap-2 h-[46px] rounded-xl border border-white/20 bg-[#050A16]/50 px-3 focus-within:border-amber-400';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070D19] text-slate-100 flex items-center justify-center lg:justify-end px-4 py-8 lg:pr-[6%]">
      {layers.map((src, i) =>
        src ? (
          <div
            key={i}
            aria-hidden="true"
            className={`login-bg absolute inset-0 bg-cover bg-center ${active === i ? 'on' : ''}`}
            style={{ backgroundImage: `url(${src})`, ['--hold' as string]: `${(HOLD_MS * 1.4) / 1000}s` }}
          />
        ) : null
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050A16]/70 via-[#050A16]/35 to-[#050A16]/60" aria-hidden="true" />

      <form onSubmit={submit} className="glass-bar relative z-10 w-full max-w-[380px] rounded-[20px] p-6 space-y-3.5">
        <div className="flex items-center gap-3">
          <BrandMark size={44} />
          <div>
            <div className="font-display font-extrabold text-[13px] tracking-[0.14em]">ARENADAWN</div>
            <div className="text-[11px] font-bold tracking-[0.12em] text-amber-400">PORTAL TURNAMEN MLBB</div>
          </div>
        </div>
        <h1 className="font-display text-3xl font-extrabold pt-1">Masuk</h1>

        <label className={field}>
          <User className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            aria-label="Username"
            autoComplete="username"
            autoCapitalize="none"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>
        <label className={field}>
          <KeyRound className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} className="text-slate-400 hover:text-slate-100 cursor-pointer">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </label>

        {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-[46px] rounded-xl font-bold text-sm text-[#1a1305] bg-gradient-to-b from-[#F8C95B] to-[#E5A21F] disabled:opacity-70 cursor-pointer inline-flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Masuk
        </button>

        <div className="flex items-center gap-2.5 text-xs text-slate-400" aria-hidden="true">
          <span className="flex-1 h-px bg-white/15" />atau<span className="flex-1 h-px bg-white/15" />
        </div>

        <button
          type="button"
          onClick={onVisitor}
          className="w-full h-[46px] rounded-xl font-bold text-sm bg-white/10 border border-white/20 hover:bg-white/15 cursor-pointer"
        >
          Masuk sebagai Pengunjung
        </button>
        <p className="text-[11.5px] text-slate-400 text-center">Pengunjung bisa melihat bracket, statistik, dan mendaftarkan tim tanpa login.</p>
      </form>
    </div>
  );
};
