import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Copy,
  Edit3,
  Maximize2,
  MessageCircle,
  Share2,
  Swords,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Tournament, TournamentRegistration } from '../types/tournament';
import { formatIndonesianDate } from '../utils/bracketEngine';
import { REG_LABEL, registrationState } from '../utils/tournamentStatus';

export const DEFAULT_COMMITTEE_WA = '0812-8899-0011';

const xmlEscape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c);

function wrapTitleLines(title: string, maxCharsPerLine = 22): string[] {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
    } else if ((current + ' ' + w).length <= maxCharsPerLine) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export function getFeeLabel(t: Tournament): string {
  if (t.feeType === 'paid') {
    return `Rp ${t.feeAmount.toLocaleString('id-ID')} / Slot`;
  }
  if (t.feeType === 'conditional_free') {
    return 'Gratis Bersyarat';
  }
  return 'Gratis (Free Entry)';
}

/**
 * Menghasilkan URL poster turnamen (2:3). Jika panitia belum mengunggah poster manual,
 * otomatis membuat poster SVG 2:3 bertema esports MLBB lengkap dengan informasi turnamen.
 */
export function getTournamentPosterUrl(t: Tournament): string {
  if (t.posterUrl && t.posterUrl.trim().length > 0) {
    return t.posterUrl;
  }

  const palettes = [
    { bg1: '#070E20', bg2: '#1A2C5B', accent: '#F59E0B', secondary: '#38BDF8', badgeBg: '#1E293B' },
    { bg1: '#120726', bg2: '#35166E', accent: '#F472B6', secondary: '#FBBF24', badgeBg: '#271447' },
    { bg1: '#051923', bg2: '#0A3D52', accent: '#22D3EE', secondary: '#F59E0B', badgeBg: '#0D2B3B' },
  ];
  const hash = t.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const pal = palettes[hash % palettes.length];
  const lines = wrapTitleLines(t.name.toUpperCase(), 20);
  const feeText = getFeeLabel(t);
  const matchDateText = formatIndonesianDate(t.matchDayDate);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" fill="none">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${pal.bg2}"/>
        <stop offset="55%" stop-color="${pal.bg1}"/>
        <stop offset="100%" stop-color="#040812"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${pal.accent}"/>
        <stop offset="100%" stop-color="#FDE68A"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1200" fill="url(#bgGrad)"/>
    <circle cx="680" cy="180" r="280" fill="${pal.accent}" opacity="0.10"/>
    <circle cx="120" cy="980" r="260" fill="${pal.secondary}" opacity="0.10"/>
    <rect x="32" y="32" width="736" height="1136" rx="28" stroke="${pal.accent}" stroke-width="3" stroke-opacity="0.55"/>
    <rect x="48" y="48" width="704" height="1104" rx="20" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.12"/>

    <!-- Top Kicker -->
    <rect x="180" y="86" width="440" height="44" rx="22" fill="${pal.badgeBg}" stroke="${pal.accent}" stroke-width="1.5"/>
    <text x="400" y="114" text-anchor="middle" fill="${pal.accent}" font-family="Arial, sans-serif" font-weight="800" font-size="18" letter-spacing="4">ARENADAWN MLBB ESPORTS</text>

    <!-- Venue & Mode Pill -->
    <text x="400" y="176" text-anchor="middle" fill="${pal.secondary}" font-family="Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="3">${xmlEscape(t.venueType.toUpperCase())} TOURNAMENT · ${xmlEscape(t.maxTeams + ' SLOT')}</text>

    <!-- Main Title -->
    ${lines
      .map(
        (line, idx) =>
          `<text x="400" y="${260 + idx * 66}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-weight="900" font-size="52" letter-spacing="1">${xmlEscape(line)}</text>`
      )
      .join('')}

    <!-- Organizer -->
    <text x="400" y="${275 + lines.length * 66}" text-anchor="middle" fill="#CBD5E1" font-family="Arial, sans-serif" font-weight="600" font-size="22">${xmlEscape(t.organizer)}</text>

    <!-- Prize Pool Box -->
    <rect x="88" y="540" width="624" height="170" rx="24" fill="#0B1325" fill-opacity="0.88" stroke="${pal.accent}" stroke-width="2.5"/>
    <text x="400" y="592" text-anchor="middle" fill="#94A3B8" font-family="Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="5">TOTAL PRIZE POOL</text>
    <text x="400" y="662" text-anchor="middle" fill="url(#goldGrad)" font-family="Arial, sans-serif" font-weight="900" font-size="46">${xmlEscape(t.prizePool || 'Trofi & Hadiah Utama')}</text>

    <!-- Info Grid -->
    <rect x="88" y="746" width="298" height="130" rx="18" fill="#0F1A33" stroke="#334155" stroke-width="1.5"/>
    <text x="237" y="790" text-anchor="middle" fill="#94A3B8" font-family="Arial, sans-serif" font-weight="700" font-size="17" letter-spacing="2">MATCH DAY</text>
    <text x="237" y="838" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-weight="800" font-size="24">${xmlEscape(matchDateText)}</text>

    <rect x="414" y="746" width="298" height="130" rx="18" fill="#0F1A33" stroke="#334155" stroke-width="1.5"/>
    <text x="563" y="790" text-anchor="middle" fill="#94A3B8" font-family="Arial, sans-serif" font-weight="700" font-size="17" letter-spacing="2">BIAYA DAFTAR</text>
    <text x="563" y="838" text-anchor="middle" fill="${pal.accent}" font-family="Arial, sans-serif" font-weight="800" font-size="24">${xmlEscape(feeText)}</text>

    <!-- Format Strip -->
    <rect x="88" y="904" width="624" height="96" rx="18" fill="#0F1A33" stroke="#334155" stroke-width="1.5"/>
    <text x="400" y="944" text-anchor="middle" fill="${pal.secondary}" font-family="Arial, sans-serif" font-weight="800" font-size="22">${xmlEscape(t.seriesSystem)}</text>
    <text x="400" y="978" text-anchor="middle" fill="#CBD5E1" font-family="Arial, sans-serif" font-weight="600" font-size="18">${xmlEscape(`${t.multiSlot} · ${t.skinRule} · ${t.tierRule}`)}</text>

    <!-- Footer -->
    <text x="400" y="1095" text-anchor="middle" fill="#94A3B8" font-family="Arial, sans-serif" font-weight="700" font-size="19" letter-spacing="3">${xmlEscape(t.gameMode.toUpperCase())}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Membuat tautan WhatsApp panitia dengan nomor turnamen atau fallback nomor panitia utama
 * beserta pesan otomatis berisi nama turnamen.
 */
export function buildCommitteeWhatsAppUrl(t?: Tournament): string {
  const rawPhone = t?.contactWhatsapp?.trim() || DEFAULT_COMMITTEE_WA;
  const digits = rawPhone.replace(/\D/g, '');
  const normalizedPhone = (digits.length >= 9 ? digits : '081288990011').replace(/^0/, '62');
  const message = t
    ? `Halo Panitia ArenaDawn, saya ingin bertanya mengenai informasi / pendaftaran turnamen "${t.name}" (${t.seriesSystem}).`
    : 'Halo Panitia ArenaDawn, saya ingin bertanya mengenai informasi turnamen Mobile Legends.';
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Membuat teks undangan turnamen lengkap untuk fitur Bagikan.
 */
export function buildTournamentShareText(t: Tournament, pageUrl?: string): string {
  const cleanUrl = (pageUrl || (typeof window !== 'undefined' ? window.location.href.split('#')[0] : '')).trim();
  return [
    `🏆 *${t.name.toUpperCase()}* 🏆`,
    `Penyelenggara: ${t.organizer}`,
    '',
    `📅 Match Day: ${formatIndonesianDate(t.matchDayDate)}`,
    `⏳ Penutupan Pendaftaran: ${formatIndonesianDate(t.registrationCloseDate)}`,
    `🎮 Format: ${t.seriesSystem} (${t.venueType})`,
    `🛡️ Aturan: ${t.multiSlot} · ${t.skinRule} · ${t.tierRule}`,
    `💰 Total Hadiah: ${t.prizePool}`,
    `🎟️ Biaya Registrasi: ${getFeeLabel(t)}`,
    '',
    `Daftar & pantau Live Bracket sekarang di:`,
    cleanUrl,
  ].join('\n');
}

// ============================================================================
// 1. MODAL LIGHTBOX POSTER TURNAMEN (2:3)
// ============================================================================
interface PosterLightboxModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  onSelectTournament?: (id: string) => void;
  onShareTournament?: (t: Tournament) => void;
}

export const PosterLightboxModal: React.FC<PosterLightboxModalProps> = ({
  tournament,
  onClose,
  onSelectTournament,
  onShareTournament,
}) => {
  if (!tournament) return null;
  const posterSrc = getTournamentPosterUrl(tournament);
  const waUrl = buildCommitteeWhatsAppUrl(tournament);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0E1830] border border-amber-400/40 rounded-2xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
              Poster Resmi Turnamen (2:3)
            </div>
            <h3 className="text-sm font-bold text-white truncate">{tournament.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau poster"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-[#070D19] flex items-center justify-center">
          <img
            src={posterSrc}
            alt={`Poster ${tournament.name}`}
            className="w-full max-h-[70vh] aspect-[2/3] object-contain rounded-xl border border-white/15 shadow-lg"
          />
        </div>

        <div className="px-5 py-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#0E1830]">
          <div className="flex flex-wrap items-center gap-2">
            {onShareTournament && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShareTournament(tournament);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#24304D] bg-[#111C36] hover:border-amber-400/50 text-xs font-semibold text-slate-100 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                Bagikan
              </button>
            )}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Hubungi Panitia
            </a>
          </div>

          {onSelectTournament && (
            <button
              type="button"
              onClick={() => {
                onSelectTournament(tournament.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Pilih Turnamen Ini
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. MODAL BAGIKAN TURNAMEN (SALIN TEKS UNDANGAN & SHARE WHATSAPP)
// ============================================================================
interface ShareTournamentModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  onCopied: (message: string) => void;
}

export const ShareTournamentModal: React.FC<ShareTournamentModalProps> = ({
  tournament,
  onClose,
  onCopied,
}) => {
  const [copiedMode, setCopiedMode] = useState<'full' | 'link' | null>(null);

  if (!tournament) return null;

  const pageUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const shareText = buildTournamentShareText(tournament, pageUrl);
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const posterSrc = getTournamentPosterUrl(tournament);

  const copyToClipboard = async (text: string, mode: 'full' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMode(mode);
      onCopied(
        mode === 'full'
          ? `Teks undangan & tautan "${tournament.name}" berhasil disalin!`
          : 'Tautan portal turnamen berhasil disalin!'
      );
      setTimeout(() => setCopiedMode(null), 2200);
    } catch {
      onCopied('Gagal menyalin otomatis, silakan salin teks dari kotak di bawah.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0E1830] border border-[#24304D] rounded-2xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Bagikan Informasi Turnamen</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog bagikan"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Ringkasan Turnamen + Thumbnail Poster */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#091122] border border-white/10">
            <img
              src={posterSrc}
              alt=""
              className="w-14 h-20 rounded-lg object-cover border border-amber-400/40 shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <div className="text-[11px] font-mono text-amber-300">
                {tournament.venueType} · {tournament.seriesSystem}
              </div>
              <div className="text-sm font-bold text-white leading-snug truncate">
                {tournament.name}
              </div>
              <div className="text-xs text-slate-300">
                Hadiah: <strong className="text-amber-300">{tournament.prizePool}</strong> · Match:{' '}
                {formatIndonesianDate(tournament.matchDayDate)}
              </div>
            </div>
          </div>

          {/* Pratinjau Teks Undangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pratinjau Pesan Undangan & Link Turnamen:
            </label>
            <textarea
              readOnly
              rows={7}
              value={shareText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full p-3 rounded-xl bg-[#070D19] border border-[#24304D] text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => copyToClipboard(shareText, 'full')}
              className="min-h-[44px] px-4 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0B1325] font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedMode === 'full' ? (
                <>
                  <Check className="w-4 h-4" />
                  Teks & Link Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Link & Info Turnamen
                </>
              )}
            </button>

            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Bagikan ke WhatsApp
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => copyToClipboard(pageUrl, 'link')}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedMode === 'link' ? 'Link Saja Tersalin!' : 'Salin Link URL Saja'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. KARTU TURNAMEN DENGAN POSTER 2:3 (UNTUK DAFTAR TURNAMEN & DASHBOARD UTAMA)
// ============================================================================
interface TournamentPosterCardProps {
  tournament: Tournament;
  approvedCount: number;
  isSelected: boolean;
  isStaff: boolean;
  onSelect: () => void;
  onViewPoster: () => void;
  onShare: () => void;
  onRegister?: () => void;
  onViewBracket?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const TournamentPosterCard: React.FC<TournamentPosterCardProps> = ({
  tournament: trn,
  approvedCount,
  isSelected,
  isStaff,
  onSelect,
  onViewPoster,
  onShare,
  onRegister,
  onViewBracket,
  onEdit,
  onDelete,
}) => {
  const posterSrc = getTournamentPosterUrl(trn);
  const regState = registrationState(trn);
  const completed = regState === 'done';
  const closed = regState !== 'open';
  const canRegister = isStaff || !closed;
  const slotPct = Math.min(100, Math.round((approvedCount / Math.max(1, trn.maxTeams)) * 100));
  const waUrl = buildCommitteeWhatsAppUrl(trn);

  return (
    <article
      onClick={onSelect}
      className={`group rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'bg-[#0E1830] border-2 border-amber-400 shadow-[0_0_28px_rgba(245,158,11,0.22)]'
          : 'bg-[#0E1830]/90 border border-[#24304D] hover:border-amber-400/50'
      }`}
    >
      <div>
        {/* Bagian Atas: Poster Rasio 2:3 */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onViewPoster();
          }}
          className="relative aspect-[2/3] w-full bg-[#070D19] overflow-hidden border-b border-[#24304D]"
        >
          <img
            src={posterSrc}
            alt={`Poster ${trn.name}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070D19] via-transparent to-black/35 opacity-80" />

          {/* Status & Venue Badges di Atas Poster */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span
              className={`px-2.5 py-1 rounded-md border text-[10px] font-extrabold tracking-wider backdrop-blur-md ${
                completed
                  ? 'border-slate-400/50 bg-slate-900/80 text-slate-200'
                  : closed
                  ? 'border-rose-400/60 bg-rose-950/80 text-rose-200'
                  : 'border-emerald-400/60 bg-emerald-950/80 text-emerald-300'
              }`}
            >
              {REG_LABEL[regState]}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#0B1325]/85 border border-white/15 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-md">
              {trn.venueType.toUpperCase()}
            </span>
          </div>

          {/* Tombol Perbesar Poster saat Hover / Pojok Kanan Bawah */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewPoster();
            }}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B1325]/90 hover:bg-amber-400 hover:text-slate-950 text-slate-100 border border-white/20 text-[11px] font-semibold transition-colors cursor-pointer shadow-lg"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Perbesar Poster
          </button>

          {isSelected && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-amber-400 text-[#0B1325] text-[10px] font-extrabold uppercase tracking-wider shadow">
              Turnamen Aktif
            </span>
          )}
        </div>

        {/* Bagian Info Turnamen */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
              {trn.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{trn.organizer}</p>
          </div>

          <div className="text-xs text-amber-300 font-medium truncate">
            {trn.seriesSystem}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-lg bg-[#0A1224] border border-[#1E293B]">
              <div className="text-[10px] text-slate-400">Match Day</div>
              <div className="font-mono font-bold text-slate-100 mt-0.5 truncate">
                {formatIndonesianDate(trn.matchDayDate)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[#0A1224] border border-[#1E293B]">
              <div className="text-[10px] text-slate-400">Total Hadiah</div>
              <div className="font-mono font-bold text-amber-400 mt-0.5 truncate">
                {trn.prizePool}
              </div>
            </div>
          </div>

          {/* Progress Slot Tim */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Slot Terverifikasi</span>
              <span className="font-mono font-bold text-slate-100">
                {approvedCount}/{trn.maxTeams} Tim
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1B2744] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                style={{ width: `${slotPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Tombol Aksi */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-xs font-mono pb-1">
          <span className="text-slate-400">Biaya Daftar:</span>
          <span className="font-bold text-amber-300">{getFeeLabel(trn)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!isStaff && onRegister ? (
            <button
              type="button"
              disabled={!canRegister}
              onClick={() => {
                onSelect();
                onRegister();
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-[#0B1325] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {canRegister ? 'Daftar Tim' : 'Tutup'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSelect();
                if (onViewBracket) onViewBracket();
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0B1325] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              Lihat Bracket
            </button>
          )}

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Hubungi Panitia
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            className="flex-1 px-3 py-1.5 rounded-lg border border-[#24304D] bg-[#111C36] hover:border-amber-400/50 text-xs font-semibold text-slate-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            Bagikan
          </button>

          {isStaff && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-2.5 py-1.5 rounded-lg border border-[#24304D] bg-[#111C36] hover:border-amber-400/50 text-xs font-medium text-slate-100 inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              Edit
            </button>
          )}
          {isStaff && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-2.5 py-1.5 rounded-lg border border-[#24304D] bg-[#111C36] hover:border-rose-400/60 text-xs font-medium text-rose-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

// ============================================================================
// 4. PEMILIH KARTU TURNAMEN BERPOSTER (UNTUK LIVE BRACKET & KLASEMEN)
// ============================================================================
interface BracketTournamentSelectorCardsProps {
  tournaments: Tournament[];
  selectedTournamentId: string;
  registrations: TournamentRegistration[];
  onSelectTournament: (id: string) => void;
  onViewPoster: (t: Tournament) => void;
}

export const BracketTournamentSelectorCards: React.FC<BracketTournamentSelectorCardsProps> = ({
  tournaments,
  selectedTournamentId,
  registrations,
  onSelectTournament,
  onViewPoster,
}) => {
  return (
    <section aria-label="Pilih Turnamen" className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold tracking-[0.08em] text-amber-300 uppercase flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-400" />
          Pilih Turnamen ({tournaments.length} Event)
        </div>
        <span className="text-[11px] text-slate-400">
          Klik kartu untuk menampilkan Live Bracket & Klasemen
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {tournaments.map((trn) => {
          const isSelected = trn.id === selectedTournamentId;
          const approvedCount = registrations.filter(
            (r) => r.tournamentId === trn.id && r.status === 'approved'
          ).length;
          const posterSrc = getTournamentPosterUrl(trn);
          const regState = registrationState(trn);

          return (
            <div
              key={trn.id}
              onClick={() => onSelectTournament(trn.id)}
              className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3.5 ${
                isSelected
                  ? 'glass-panel border-2 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                  : 'glass-card hover:border-amber-400/40 opacity-85 hover:opacity-100'
              }`}
            >
              {/* Thumbnail Poster 2:3 */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPoster(trn);
                }}
                title="Klik untuk memperbesar poster"
                className="relative w-16 h-24 shrink-0 rounded-lg overflow-hidden border border-amber-400/40 bg-[#070D19] group"
              >
                <img
                  src={posterSrc}
                  alt={`Poster ${trn.name}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              {/* Detail Ringkas */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                    {trn.venueType} · {REG_LABEL[regState]}
                  </span>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-400 text-[#0B1325] text-[9px] font-extrabold uppercase">
                      Aktif
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                  {trn.name}
                </h3>
                <p className="text-[11px] text-slate-300 truncate">{trn.seriesSystem}</p>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                    <Users className="w-3 h-3" />
                    {approvedCount}/{trn.maxTeams} Tim
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {formatIndonesianDate(trn.matchDayDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
