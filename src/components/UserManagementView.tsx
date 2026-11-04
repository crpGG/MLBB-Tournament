import React, { useEffect, useState } from 'react';
import { KeyRound, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
  ManagedUser,
  createUser,
  deleteUser,
  setUserPassword,
  subscribeUsers,
} from '../cloud';

interface Props {
  currentUsername: string;
}

const field =
  'px-3.5 py-2 bg-[#0B0F17] border border-slate-700 focus:border-amber-400 rounded-lg text-xs text-slate-100 outline-none';

export const UserManagementView: React.FC<Props> = ({ currentUsername }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'panitia' | 'admin'>('panitia');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => subscribeUsers((list) => setUsers(list.sort((a, b) => a.username.localeCompare(b.username)))), []);

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: okText });
      return true;
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const done = await run(
      () => createUser({ username: username.trim().toLowerCase(), name: name.trim(), password, role }),
      `Akun "${username.trim().toLowerCase()}" dibuat.`
    );
    if (done) {
      setUsername('');
      setName('');
      setPassword('');
    }
  };

  const handleResetPassword = (u: ManagedUser) => {
    const next = window.prompt(`Password baru untuk "${u.username}" (minimal 8 karakter):`);
    if (next) run(() => setUserPassword(u.username, next), `Password "${u.username}" diganti.`);
  };

  const handleDelete = (u: ManagedUser) => {
    if (window.confirm(`Hapus akun "${u.username}"? Akses langsung dicabut.`)) {
      run(() => deleteUser(u.username), `Akun "${u.username}" dihapus.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" aria-hidden="true" />
            Manajemen User (khusus Admin)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin: semua fitur + user. Panitia: semua fitur operasional tanpa manajemen user. Pengunjung tidak
            memerlukan akun.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono shrink-0">
          Akun: <strong className="text-slate-100">{users.length}</strong>
        </div>
      </div>

      {msg && (
        <div
          role={msg.ok ? 'status' : 'alert'}
          className={`p-3 rounded-lg text-xs border ${
            msg.ok
              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-400/30 text-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleCreate} className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-3">
        <div className="text-xs font-bold text-amber-400">Tambah Akun</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            required
            placeholder="Username (huruf kecil/angka/_)"
            aria-label="Username"
            autoCapitalize="none"
            pattern="[a-z0-9_]{3,20}"
            title="3-20 karakter: huruf kecil, angka, atau _"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={field}
          />
          <input
            required
            placeholder="Nama"
            aria-label="Nama"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Password (min. 8)"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          <select
            aria-label="Peran"
            value={role}
            onChange={(e) => setRole(e.target.value as 'panitia' | 'admin')}
            className={field}
          >
            <option value="panitia">Panitia</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
            Tambah
          </button>
        </div>
      </form>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0B0F17] text-xs font-medium text-slate-400">
              <th className="py-2.5 px-4">Username</th>
              <th className="py-2.5 px-4">Nama</th>
              <th className="py-2.5 px-4">Peran</th>
              <th className="py-2.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-mono text-slate-100">{u.username}</td>
                <td className="py-3 px-4 text-slate-300">{u.name}</td>
                <td className="py-3 px-4 font-semibold text-amber-400">{u.role === 'admin' ? 'Admin' : 'Panitia'}</td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleResetPassword(u)}
                    aria-label={`Ganti password ${u.username}`}
                    title="Ganti password"
                    className="p-1.5 text-slate-400 hover:text-amber-300 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  {u.username !== currentUsername && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      aria-label={`Hapus ${u.username}`}
                      title="Hapus akun"
                      className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                  Belum ada data akun.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
