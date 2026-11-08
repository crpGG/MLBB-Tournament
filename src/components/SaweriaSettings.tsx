import React, { useEffect, useState } from 'react';

interface Props {
  value: string; // alamat tersimpan ('' = disembunyikan)
  onSave: (v: string) => void;
}

/** Hanya alamat saweria.co yang diterima; kosong menyembunyikan tombol Saweria di sidebar dan footer. */
export const SaweriaSettings: React.FC<Props> = ({ value, onSave }) => {
  const [input, setInput] = useState(value);
  const [error, setError] = useState('');
  useEffect(() => setInput(value), [value]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim().replace(/^https?:\/\//i, '');
    if (!v) {
      setError('');
      return onSave('');
    }
    if (!/^saweria\.co\/[A-Za-z0-9._-]+\/?$/.test(v)) return setError('Gunakan alamat seperti https://saweria.co/nama');
    setError('');
    onSave('https://' + v.replace(/\/$/, ''));
  };

  return (
    <form onSubmit={save} className="glass-panel rounded-xl p-4 space-y-2">
      <label htmlFor="saweria-url" className="block text-sm font-bold text-slate-100">Alamat Saweria</label>
      <p className="text-xs text-slate-400">Tampil sebagai tombol di sidebar dan footer. Kosongkan lalu simpan untuk menyembunyikannya.</p>
      <div className="flex flex-wrap gap-2">
        <input
          id="saweria-url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://saweria.co/nama"
          className="flex-1 min-w-[220px] min-h-[44px] rounded-xl border border-[#24304D] bg-[#0A1224] px-3 text-sm text-slate-100"
        />
        <button type="submit" className="min-h-[44px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer">Simpan</button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
    </form>
  );
};
