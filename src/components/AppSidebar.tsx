import React from 'react';
import { MessageCircle } from 'lucide-react';

export type MainTab =
  | 'dashboard'
  | 'bracket'
  | 'tournaments'
  | 'registrations'
  | 'stats'
  | 'register'
  | 'database'
  | 'users';

export interface NavItem {
  id: MainTab;
  label: string;
  badge?: number;
}

export const BrandMark: React.FC<{ size?: number }> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" role="img" aria-label="Logo ArenaDawn">
    <path d="M26 3 46 11 43 33 26 49 9 33 6 11Z" fill="#0B1325" stroke="#F5B93A" strokeWidth="3" />
    <path d="M26 10 39 16 37 31 26 41 15 31 13 16Z" fill="#F5B93A" opacity="0.9" />
    <path d="M19 32 26 15 33 32M21.5 27h9" stroke="#0B1325" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Props {
  items: NavItem[];
  active: MainTab;
  onSelect: (t: MainTab) => void;
  isStaff: boolean;
  contactUrl: string;
  bestOf: number;
}

/** Sidebar tetap di desktop; di mobile: bar atas (logo + WhatsApp) dan tab bawah yang bisa digeser. */
export const AppSidebar: React.FC<Props> = ({ items, active, onSelect, isStaff, contactUrl, bestOf }) => (
  <>
    {/* Desktop */}
    <aside className="hidden lg:flex flex-col gap-5 w-72 shrink-0 sticky top-0 h-screen overflow-y-auto px-3 py-6 bg-[#0A1224] border-r border-[#1B2744]">
      <div className="px-2 pb-4 border-b border-[#1B2744] space-y-3">
        <BrandMark />
        <div>
          <div className="font-display font-extrabold text-[13px] tracking-[0.12em] text-slate-100">TOURNAMENT SCORING SYSTEM</div>
          <div className="mt-1 text-[11px] font-bold tracking-[0.1em] text-amber-400">
            {isStaff ? 'PANEL STAF · MOBILE LEGENDS' : 'LIVE VIEW · MOBILE LEGENDS'}
          </div>
        </div>
      </div>

      <nav aria-label="Menu utama" className="flex flex-col gap-1">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-[0.1em] text-slate-400">
          {isStaff ? 'MENU MANAJEMEN' : 'MENU PENGUNJUNG'}
        </div>
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            aria-current={active === it.id ? 'page' : undefined}
            className={`flex items-center justify-between text-left rounded-xl border px-4 py-3 text-[15px] cursor-pointer transition-colors ${
              active === it.id
                ? 'border-[#C98A12] bg-amber-400/10 text-amber-300 font-bold'
                : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>{it.label}</span>
            {it.badge ? (
              <span className="min-w-[22px] px-1.5 rounded-full bg-amber-400 text-[#0B1325] text-xs font-extrabold text-center">{it.badge}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {contactUrl && (
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-3 text-[15px] font-bold text-white"
        >
          <MessageCircle className="w-[18px] h-[18px]" aria-hidden="true" />
          Hubungi Panitia
        </a>
      )}

      <section aria-label="Aturan poin resmi" className="rounded-2xl border border-[#1B2744] bg-[#0E1830] p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold tracking-wider text-amber-400">ATURAN POIN RESMI</span>
          <button type="button" onClick={() => onSelect('bracket')} className="text-xs font-semibold text-amber-300 hover:text-amber-200 cursor-pointer">
            Klasemen
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
          <div className="rounded-lg border border-[#24304D] px-2 py-2 whitespace-nowrap">Menang: <b className="text-emerald-400">3 Pts</b></div>
          <div className="rounded-lg border border-[#24304D] px-2 py-2 whitespace-nowrap">Seri: <b className="text-amber-200">1 Pt</b></div>
          <div className="rounded-lg border border-[#24304D] px-2 py-2 whitespace-nowrap">Kalah: <b className="text-red-400">0 Pt</b></div>
          <div className="rounded-lg border border-[#24304D] px-2 py-2 whitespace-nowrap">Format: <b>BO{bestOf}</b></div>
        </div>
      </section>
    </aside>

    {/* Mobile: bar atas */}
    <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-[#0A1224] border-b border-[#1B2744]">
      <div className="flex items-center gap-2.5 min-w-0">
        <BrandMark size={34} />
        <div className="min-w-0">
          <div className="font-display font-extrabold text-xs tracking-[0.1em] truncate">TOURNAMENT SCORING</div>
          <div className="text-[10px] font-bold tracking-[0.1em] text-amber-400">{isStaff ? 'PANEL STAF · MLBB' : 'LIVE VIEW · MLBB'}</div>
        </div>
      </div>
      {contactUrl && (
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hubungi panitia lewat WhatsApp"
          className="w-11 h-11 shrink-0 rounded-xl bg-green-600 flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5 text-white" aria-hidden="true" />
        </a>
      )}
    </div>

    {/* Mobile: tab bawah */}
    <nav aria-label="Menu bawah" className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex overflow-x-auto bg-[#0A1224]/95 backdrop-blur border-t border-[#1B2744]">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onSelect(it.id)}
          aria-current={active === it.id ? 'page' : undefined}
          className={`relative shrink-0 min-w-[84px] min-h-[56px] px-2 text-center text-[11px] leading-tight cursor-pointer border-t-2 ${
            active === it.id ? 'border-amber-400 text-amber-300 font-bold' : 'border-transparent text-slate-300'
          }`}
        >
          {it.label}
          {it.badge ? <span className="absolute top-1.5 right-2 min-w-[16px] px-1 rounded-full bg-amber-400 text-[#0B1325] text-[10px] font-extrabold">{it.badge}</span> : null}
        </button>
      ))}
    </nav>
  </>
);
