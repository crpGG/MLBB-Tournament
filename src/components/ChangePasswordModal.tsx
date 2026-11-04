import React, { useState } from 'react';
import { X } from 'lucide-react';
import { authErrorMessage, changeOwnPassword } from '../cloud';

interface Props {
  onClose: () => void;
  onDone: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ onClose, onDone }) => {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) return setError('Password baru minimal 8 karakter.');
    if (newPw !== confirmPw) return setError('Konfirmasi password baru tidak cocok.');
    setBusy(true);
    setError(null);
    try {
      await changeOwnPassword(oldPw, newPw);
      onDone();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(code === 'auth/invalid-credential' || code === 'auth/wrong-password' ? 'Password lama tidak sesuai.' : authErrorMessage(err));
      setBusy(false);
    }
  };

  const input =
    'w-full bg-[#0B0F17] border border-slate-700 focus:border-amber-400 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Ganti password">
      <form onSubmit={submit} className="w-full max-w-sm bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Ganti Password</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && <div role="alert" className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200">{error}</div>}
        <input type="password" autoComplete="current-password" autoFocus required placeholder="Password lama" aria-label="Password lama" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className={input} />
        <input type="password" autoComplete="new-password" required placeholder="Password baru (min. 8)" aria-label="Password baru" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={input} />
        <input type="password" autoComplete="new-password" required placeholder="Ulangi password baru" aria-label="Ulangi password baru" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={input} />
        <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-sm cursor-pointer">
          {busy ? 'Menyimpan...' : 'Simpan Password'}
        </button>
      </form>
    </div>
  );
};
