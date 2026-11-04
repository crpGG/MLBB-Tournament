import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FastForward, Sparkles } from 'lucide-react';

interface MLBBAlucardLoadingScreenProps {
  userName: string;
  userRoleLabel: string;
  onComplete: () => void;
}

const LOADING_STAGES = [
  { threshold: 0, text: 'Game Loading... Connecting to Land of Dawn Server' },
  { threshold: 24, text: 'Verifying Account & Tournament Access Permissions...' },
  { threshold: 52, text: 'Synchronizing Bracket Engine (Single/Double Elim & Round-Robin)...' },
  { threshold: 78, text: 'Loading Master Database Tim, Player & Real-Time KDA Stats...' },
  { threshold: 95, text: 'Entering ArenaDawn MLBB Tournament Lobby...' },
];

export const MLBBAlucardLoadingScreen: React.FC<MLBBAlucardLoadingScreenProps> = ({
  userName,
  userRoleLabel,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const durationMs = 3100;
    const intervalMs = 35;
    const increment = 100 / (durationMs / intervalMs);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 280);
          return 100;
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [onComplete]);

  const currentStageText =
    [...LOADING_STAGES]
      .reverse()
      .find((s) => progress >= s.threshold)?.text || 'Game Loading...';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-50 w-full h-full overflow-hidden bg-[#060B16] select-none flex flex-col justify-between"
    >
      {/* Fullscreen Uploaded MLBB Loading Artwork with Slow Cinematic Zoom */}
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3.4, ease: 'easeOut' }}
        className="absolute inset-0 z-0"
      >
        <img
          src="/assets/aistudio/loading_3d66433e.jpg"
          alt="Mobile Legends Alucard and Layla Loading Screen"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle bottom gradient so the progress bar and status text pop crisply */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050914]/95 via-[#050914]/55 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050914]/70 to-transparent" />
      </motion.div>

      {/* Epic Motion Graphics Overlays: Cannon Energy Pulse, Sword Rune Glow & Floating Sparks */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* Layla Malefic Gun Barrel Cyan Energy Pulse (Bottom-Left area) */}
        <motion.div
          animate={{
            scale: [0.9, 1.35, 0.9],
            opacity: [0.35, 0.85, 0.35],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[8%] bottom-[22%] w-52 h-52 rounded-full bg-cyan-400/35 blur-3xl"
        />

        {/* Alucard Sword Gem Cyan Energy Pulse (Bottom-Right area) */}
        <motion.div
          animate={{
            scale: [0.85, 1.3, 0.85],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: 0.4,
            ease: 'easeInOut',
          }}
          className="absolute right-[6%] bottom-[10%] w-48 h-48 rounded-full bg-sky-400/40 blur-3xl"
        />

        {/* Mobile Legends Logo Crest Shimmer (Top-Left area) */}
        <motion.div
          animate={{
            opacity: [0.2, 0.65, 0.2],
            scale: [0.95, 1.1, 0.95],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[11%] top-[10%] w-44 h-28 rounded-full bg-amber-300/25 blur-2xl"
        />

        {/* Diagonal Energy Light Sweep */}
        <motion.div
          animate={{ x: ['-100%', '220%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent -skew-x-12"
        />

        {/* Rising Cyan & Gold Battle Sparks */}
        {[
          { left: '16%', bottom: '28%', delay: 0, color: 'bg-cyan-300' },
          { left: '24%', bottom: '18%', delay: 0.4, color: 'bg-sky-400' },
          { left: '48%', bottom: '25%', delay: 0.8, color: 'bg-amber-300' },
          { left: '72%', bottom: '30%', delay: 0.2, color: 'bg-cyan-300' },
          { left: '86%', bottom: '20%', delay: 0.6, color: 'bg-sky-300' },
          { left: '62%', bottom: '14%', delay: 1.1, color: 'bg-amber-200' },
        ].map((spark, index) => (
          <motion.div
            key={index}
            animate={{
              y: [0, -90],
              x: [0, index % 2 === 0 ? 20 : -20],
              opacity: [0, 0.95, 0],
              scale: [0.6, 1.3, 0.5],
            }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
              delay: spark.delay,
              ease: 'easeOut',
            }}
            style={{ left: spark.left, bottom: spark.bottom }}
            className={`absolute w-2 h-2 rounded-full ${spark.color} shadow-[0_0_12px_#38BDF8]`}
          />
        ))}
      </div>

      {/* Top Bar: Version Info & Skip Button */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded glass-card text-[11px] font-mono text-slate-200 border border-white/15">
            Current Version: 1.1.86.163.1 · ArenaDawn Esports Engine
          </span>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg glass-card text-xs font-semibold text-slate-200 hover:text-amber-300 hover:border-amber-400/40 transition-colors cursor-pointer"
        >
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
          Lewati Loading
        </button>
      </div>

      {/* Bottom MLBB Authentic Loading Bar Overlay */}
      <div className="relative z-20 w-full max-w-5xl mx-auto px-6 pb-7 space-y-2.5">
        {/* Welcome Player / Role Pill */}
        <div className="flex items-center justify-between text-xs font-medium px-1">
          <div className="flex items-center gap-2 text-amber-200 drop-shadow">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Selamat Datang, <strong className="text-white">{userName}</strong> ({userRoleLabel})
            </span>
          </div>
          <span className="font-mono font-bold text-sm text-cyan-300 tabular-nums drop-shadow">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Metallic Beveled Progress Bar Track (Positioned over the original image bar) */}
        <div className="relative h-4 w-full rounded-full bg-[#091326]/95 border border-amber-300/45 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.35)] overflow-hidden">
          <motion.div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-300 to-amber-300 relative"
          >
            {/* Glowing Leading Edge Spark */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white blur-xs shadow-[0_0_16px_#38BDF8]" />
          </motion.div>
        </div>

        {/* Authentic Centered "Game Loading..." Status Text */}
        <div className="text-center pt-0.5">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            {currentStageText}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
