import { Tournament } from '../types/tournament';

/** Tanggal lokal perangkat (YYYY-MM-DD), bukan UTC, supaya penutupan pendaftaran tepat tengah malam WIB. */
export const todayLocal = () => new Date().toLocaleDateString('en-CA');

export const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
};

export type RegState = 'open' | 'closed' | 'done';

/** Satu sumber kebenaran status pendaftaran untuk dashboard dan halaman login. */
export function registrationState(t: Tournament): RegState {
  if (t.status === 'completed') return 'done';
  return t.registrationCloseDate && todayLocal() > t.registrationCloseDate ? 'closed' : 'open';
}

export const REG_LABEL: Record<RegState, string> = {
  open: 'PENDAFTARAN DIBUKA',
  closed: 'PENDAFTARAN DITUTUP',
  done: 'TURNAMEN SELESAI',
};
