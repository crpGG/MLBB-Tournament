import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Crown,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Loader2,
  Radio,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  User,
} from 'lucide-react';
import { StaffProfile, authErrorMessage, cloudEnabled, loginWithUsername } from '../cloud';
import { Tournament } from '../types/tournament';
import { formatIndonesianDate } from '../utils/bracketEngine';
import { REG_LABEL, registrationState } from '../utils/tournamentStatus';

interface MLBBLaylaLoginPageProps {
  onStaffLogin: (profile: StaffProfile) => void;
  onVisitor: () => void;
  tournaments?: Tournament[];
  loading?: boolean; // data turnamen belum sampai dari server
}

interface SparkPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

interface BoltSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
}

interface FloatingCrystal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  alpha: number;
}

export const MLBBLaylaLoginPage: React.FC<MLBBLaylaLoginPageProps> = ({
  onStaffLogin,
  onVisitor,
  tournaments = [],
  loading = false,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  // 3D Tilt & 2.5D Parallax Mouse Tracking
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 30, normX: 0, normY: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Pengumuman hanya dari data turnamen sungguhan; tanpa data tampil keterangan netral (tidak ada promosi tertanam).
  const tickerItems =
    tournaments.length > 0
      ? tournaments.slice(0, 5).map((t) => ({
          id: t.id,
          badge: REG_LABEL[registrationState(t)],
          title: `${t.name} — Match Day ${formatIndonesianDate(t.matchDayDate)}`,
          meta: `Hadiah ${t.prizePool || '-'} · ${t.seriesSystem} · ${t.venueType}`,
        }))
      : [
          {
            id: 'none',
            badge: loading ? 'MEMUAT DATA' : 'BELUM ADA TURNAMEN',
            title: loading ? 'Memuat data turnamen...' : 'Belum ada turnamen yang dipublikasikan',
            meta: 'Panitia akan mengumumkan jadwal dan pendaftaran di portal ini.',
          },
        ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  // Interactive Canvas: Floating Crystals + Cursor Lightning Bolts & Sparks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // tanpa animasi partikel

    let animationFrameId: number;
    const sparks: SparkPoint[] = [];
    const bolts: BoltSegment[] = [];
    const crystals: FloatingCrystal[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed floating diamond crystals
    const crystalColors = ['#FDE68A', '#38BDF8', '#F59E0B', '#67E8F9'];
    for (let i = 0; i < 28; i++) {
      crystals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 3 + Math.random() * 6,
        speedY: 0.35 + Math.random() * 0.75,
        speedX: (Math.random() - 0.5) * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        color: crystalColors[i % crystalColors.length],
        alpha: 0.25 + Math.random() * 0.55,
      });
    }

    const spawnLightningAt = (x: number, y: number, prevX: number, prevY: number) => {
      const dist = Math.hypot(x - prevX, y - prevY);
      if (dist < 4) return;

      // Create jagged lightning arc between previous cursor point and current point
      const steps = 3;
      let cx = prevX;
      let cy = prevY;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const nx = prevX + (x - prevX) * t + (i < steps ? (Math.random() - 0.5) * 22 : 0);
        const ny = prevY + (y - prevY) * t + (i < steps ? (Math.random() - 0.5) * 22 : 0);
        bolts.push({
          x1: cx,
          y1: cy,
          x2: nx,
          y2: ny,
          alpha: 0.95,
          color: Math.random() > 0.45 ? '#38BDF8' : '#FDE68A',
        });
        cx = nx;
        cy = ny;
      }

      // Secondary mini branch lightning
      if (Math.random() > 0.45) {
        const bx = x + (Math.random() - 0.5) * 48;
        const by = y + (Math.random() - 0.5) * 48;
        bolts.push({
          x1: x,
          y1: y,
          x2: bx,
          y2: by,
          alpha: 0.75,
          color: '#67E8F9',
        });
      }

      // Spawn glowing crystal sparks
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.6;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          alpha: 1,
          size: 1.8 + Math.random() * 2.5,
          color: Math.random() > 0.5 ? '#FDE68A' : '#38BDF8',
        });
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      if (lastMouseRef.current) {
        spawnLightningAt(clientX, clientY, lastMouseRef.current.x, lastMouseRef.current.y);
      }
      lastMouseRef.current = { x: clientX, y: clientY };

      // Update 3D Tilt & 2.5D Parallax coordinates
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const normX = (clientX / w - 0.5) * 2; // -1 to 1
      const normY = (clientY / h - 0.5) * 2; // -1 to 1
      setTilt({
        rotateX: -normY * 6.5,
        rotateY: normX * 7.5,
        glareX: 50 + normX * 35,
        glareY: 40 + normY * 35,
        normX,
        normY,
      });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Floating Celestial Diamond Crystals
      for (const c of crystals) {
        c.y -= c.speedY;
        c.x += c.speedX;
        c.rotation += c.rotSpeed;
        if (c.y < -20) {
          c.y = canvas.height + 20;
          c.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = c.color;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -c.size);
        ctx.lineTo(c.size * 0.65, 0);
        ctx.lineTo(0, c.size);
        ctx.lineTo(-c.size * 0.65, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw Electric Cursor Lightning Bolts
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.alpha -= 0.055;
        if (b.alpha <= 0) {
          bolts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Cursor Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.032;
        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);

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

  const activeTicker = tickerItems[tickerIndex % tickerItems.length];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0E182B] flex items-center justify-center select-none">
      {/* =====================================================================
          LAYER 1: 2.5D MULTI-LAYER PARALLAX & BREATHING LAYLA CHARACTER RIG
         ===================================================================== */}
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        style={{ perspective: '1200px' }}
        aria-hidden="true"
      >
        {/* Breathing + Mouse-Reactive 2.5D Character Layer */}
        <motion.div
          animate={{
            scale: [1.03, 1.065, 1.03],
            y: [0, -9, 0],
          }}
          transition={{
            duration: 5.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transform: `translate3d(${-tilt.normX * 16}px, ${-tilt.normY * 12}px, 0) rotateX(${
              tilt.rotateX * 0.35
            }deg) rotateY(${tilt.rotateY * 0.35}deg)`,
          }}
          className="w-full h-full relative transition-transform duration-200 ease-out"
        >
          <img
            src="/assets/aistudio/login_page_0c3603ff.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-left lg:object-center filter saturate-110 contrast-105"
          />

          {/* Golden Star Sparkle Pulse on Layla's Peace Sign Fingers */}
          <motion.div
            animate={{
              scale: [0.8, 1.35, 0.8],
              rotate: [0, 20, -10, 0],
              opacity: [0.65, 1, 0.65],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden lg:flex absolute left-[41%] top-[15.5%] text-amber-200 drop-shadow-[0_0_20px_rgba(253,230,138,1)]"
          >
            <Sparkles className="w-10 h-10" />
          </motion.div>
        </motion.div>

        {/* Cinematic Right-Side Scrim so the 3D Hologram Panel pops with high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070E1E]/75 via-[#101D35]/88 to-[#0B1426] lg:bg-[linear-gradient(to_right,rgba(7,14,30,0.05)_0%,rgba(12,22,42,0.52)_42%,rgba(10,18,36,0.96)_56%)]" />
        {/* Top & Bottom Mythic Vignette Bars */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#050A15]/90 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#050A15]/95 to-transparent" />
      </div>

      {/* =====================================================================
          LAYER 2: INTERACTIVE CRYSTAL PARTICLES & CURSOR LIGHTNING CANVAS
         ===================================================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top-Left Floating Portal Header */}
      <div className="absolute top-4 left-4 sm:left-8 z-20 flex items-center pointer-events-none">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-card border border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-amber-300">
            ARENADAWN MLBB · PORTAL TURNAMEN
          </span>
        </div>
      </div>

      {/* =====================================================================
          LAYER 3: RIGHT-SIDE 3D HOLOGRAM TILT LOGIN & HEROIC PORTAL PANEL
         ===================================================================== */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-12 items-center">
        {/* Left 6 columns keep Layla 2.5D artwork unobstructed on desktop */}
        <div className="hidden lg:block lg:col-span-6 pointer-events-none" />

        {/* Right 6 columns: 3D Tilt Hologram Container */}
        <div
          className="lg:col-span-6 w-full max-w-lg mx-auto"
          style={{ perspective: '1200px' }}
        >
          <motion.main
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
              transformStyle: 'preserve-3d',
            }}
            className="relative rounded-3xl p-[2px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.75),0_0_50px_rgba(245,158,11,0.22)] transition-transform duration-150 ease-out"
          >
            {/* Rotating Golden & Cyan Conic Energy Border (Neon Light Runner) */}
            <div
              className="absolute -inset-[100%] animate-spin-slow pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0%, #F59E0B 18%, #FDE68A 28%, #38BDF8 45%, transparent 60%, #38BDF8 78%, #FDE68A 92%, transparent 100%)',
              }}
              aria-hidden="true"
            />

            {/* Inner Glassy Hologram Surface */}
            <div className="relative rounded-[22px] bg-[#0B1528]/92 backdrop-blur-2xl p-6 sm:p-7 space-y-5 overflow-hidden border border-white/10">
              {/* Mouse-Reactive Holographic Specular Glare Overlay */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                style={{
                  background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(253, 230, 138, 0.16) 0%, rgba(56, 189, 248, 0.09) 35%, transparent 70%)`,
                }}
                aria-hidden="true"
              />

              {/* 4 Decorative Mythic Gold Corner Brackets */}
              <span className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-amber-400/70 rounded-tl pointer-events-none" />
              <span className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-amber-400/70 rounded-tr pointer-events-none" />
              <span className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-amber-400/70 rounded-bl pointer-events-none" />
              <span className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-amber-400/70 rounded-br pointer-events-none" />

              {/* ---------------------------------------------------------------
                  SECTION 1: ANIMATED MYTHIC GLORY CREST & SHIMMERING TROPHY
                 --------------------------------------------------------------- */}
              <div className="relative text-center space-y-2 pt-1">
                {/* Mythic Glory Winged Trophy Emblem */}
                <div className="relative inline-flex items-center justify-center mx-auto mb-1">
                  {/* Left Wing Ornament */}
                  <motion.div
                    animate={{ rotate: [-4, 4, -4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="hidden sm:flex items-center mr-2 text-amber-300/80"
                  >
                    <span className="w-8 h-[2px] bg-gradient-to-l from-amber-300 to-transparent" />
                  </motion.div>

                  {/* Center Trophy & Mythic Crown */}
                  <div className="relative px-4 py-2 rounded-2xl bg-gradient-to-b from-amber-400/25 via-amber-500/15 to-sky-500/15 border border-amber-300/50 shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center gap-2.5">
                    <Crown className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(253,230,138,0.9)]" />
                    <Trophy className="w-6 h-6 text-amber-200 drop-shadow-[0_0_12px_rgba(245,158,11,1)]" />
                    <div className="text-left">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 leading-none">
                        MYTHIC GLORY ARENA
                      </div>
                      <div className="text-xs font-bold text-white leading-tight mt-0.5">
                        Portal Turnamen Komunitas
                      </div>
                    </div>
                  </div>

                  {/* Right Wing Ornament */}
                  <motion.div
                    animate={{ rotate: [4, -4, 4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="hidden sm:flex items-center ml-2 text-amber-300/80"
                  >
                    <span className="w-8 h-[2px] bg-gradient-to-r from-amber-300 to-transparent" />
                  </motion.div>
                </div>

                <h1 className="font-game-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#FDE68A] drop-shadow-[0_2px_12px_rgba(245,158,11,0.45)]">
                  GERBANG ARENA TURNAMEN
                </h1>
              </div>

              {/* ---------------------------------------------------------------
                  SECTION 2: LIVE TOURNAMENT ANNOUNCEMENT TICKER
                 --------------------------------------------------------------- */}
              <div className="relative rounded-xl bg-[#101F3A]/90 border border-sky-400/30 p-3 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    {activeTicker.badge}
                  </span>
                  <div className="flex items-center gap-1">
                    {tickerItems.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTickerIndex(idx)}
                        aria-label={`Pengumuman ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === tickerIndex % tickerItems.length
                            ? 'w-5 bg-amber-400'
                            : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTicker.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-0.5"
                  >
                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                      {activeTicker.title}
                    </p>
                    <p className="text-[11px] text-sky-200/85 truncate font-mono">
                      {activeTicker.meta}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ---------------------------------------------------------------
                  SECTION 3: TOP HEROIC VISITOR PORTAL BUTTON (PRIMARY CTA)
                 --------------------------------------------------------------- */}
              <div className="space-y-2 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onVisitor}
                  className="group relative w-full py-4 px-5 rounded-xl mlbb-gold-button overflow-hidden cursor-pointer shadow-[0_8px_30px_rgba(245,158,11,0.45)]"
                >
                  {/* Animated Diagonal Shimmer Sweep */}
                  <div
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-shimmer-sweep pointer-events-none"
                    aria-hidden="true"
                  />

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-[#1A1205]/35 border border-amber-100/50 flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5 text-amber-100 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="font-game-serif text-base sm:text-lg font-bold tracking-wider text-white leading-tight">
                          MASUK ARENA TURNAMEN
                        </div>
                        <div className="text-[11px] font-sans font-semibold text-amber-950/90 bg-amber-100/75 px-2 py-0.5 rounded mt-0.5 inline-block">
                          Akses Pengunjung & Kapten Tim · Tanpa Login
                        </div>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#1A1205]/30 border border-amber-100/50 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                      <Swords className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </motion.button>

                <p className="text-center text-[11px] text-slate-300/90">
                  Klik tombol di atas untuk langsung melihat <strong className="text-amber-300">Live Bracket</strong>, <strong className="text-cyan-300">Statistik KDA/MVP</strong>, atau <strong className="text-emerald-300">Mendaftarkan Tim</strong>.
                </p>
              </div>

              {/* Ornamental Land of Dawn Divider */}
              <div className="flex items-center gap-3 py-1" aria-hidden="true">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300/40 to-amber-300/60" />
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300/90">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Portal Khusus Staf & Panitia
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-300/40 to-amber-300/60" />
              </div>

              {/* ---------------------------------------------------------------
                  SECTION 4: STAFF LOGIN FORM (ADMIN & PANITIA) AT THE BOTTOM
                 --------------------------------------------------------------- */}
              {!cloudEnabled && (
                <div
                  className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-100 text-center"
                  role="status"
                >
                  Mode demo: Firebase belum dikonfigurasi, login panitia belum aktif. Gunakan tombol
                  <strong className="text-amber-300"> Masuk Arena Turnamen </strong> di atas.
                </div>
              )}

              {errorMsg && (
                <div
                  className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200 text-center"
                  role="alert"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={submit} className="space-y-3">
                {/* Username Input */}
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#16243E]/95 border border-sky-400/35 focus-within:border-amber-400/80 focus-within:bg-[#1C2E4F] transition-colors shadow-inner">
                  <User className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username Admin / Panitia"
                    aria-label="Username"
                    disabled={!cloudEnabled || busy}
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                  />
                </label>

                {/* Password Input */}
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#16243E]/95 border border-sky-400/35 focus-within:border-amber-400/80 focus-within:bg-[#1C2E4F] transition-colors shadow-inner">
                  <KeyRound className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password Panitia"
                    aria-label="Password"
                    disabled={!cloudEnabled || busy}
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="text-sky-300 hover:text-amber-300 shrink-0 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </label>

                <button
                  type="submit"
                  disabled={!cloudEnabled || busy}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500/25 via-cyan-500/25 to-amber-500/25 hover:from-sky-500/35 hover:to-amber-500/35 border border-sky-300/40 hover:border-amber-300/60 text-xs sm:text-sm font-bold text-sky-100 hover:text-amber-200 tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-amber-300" aria-hidden="true" />
                  )}
                  <span>{busy ? 'Memeriksa Kredensial...' : 'Masuk sebagai Admin / Panitia'}</span>
                </button>
              </form>
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
};
