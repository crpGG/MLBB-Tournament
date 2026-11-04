import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/tournament';
import { Lock, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';

interface UserManagementViewProps {
  currentUserRole: UserRole;
  users: UserAccount[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onToggleUserActive: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUserRole,
  users,
  onAddUser,
  onUpdateUserRole,
  onToggleUserActive,
  onDeleteUser,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('panitia');

  if (currentUserRole !== 'admin') {
    return (
      <div className="p-8 bg-[#111827] border border-slate-800 rounded-xl text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-100">
          Akses Dibatasi — Khusus Role Admin
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Sesuai kebijakan hak akses sistem: <strong>Panitia</strong> memiliki akses ke seluruh fitur operasional turnamen kecuali Manajemen User, sedangkan <strong>Pengunjung</strong> hanya melihat jadwal dan hasil. Silakan ubah mode ke <strong>Admin</strong> pada bilah kontrol peran di atas untuk mengelola akun.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onAddUser({
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '0812-0000-0000',
      role,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Manajemen User & Hak Akses (Eksklusif Admin)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola akun Admin, Panitia Turnamen, dan Pengunjung/Kapten Tim
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Akun Terdaftar: <strong className="text-slate-100">{users.length}</strong>
        </div>
      </div>

      {/* Add User Form */}
      <form
        onSubmit={handleSubmit}
        className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4"
      >
        <div className="text-xs font-bold text-amber-400">
          Tambah Akun Panitia / Admin Baru
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            required
            placeholder="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
          />
          <input
            type="email"
            required
            placeholder="Alamat Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
          />
          <input
            type="text"
            placeholder="Nomor WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100"
          >
            <option value="panitia">Role: Panitia (Tanpa Manajemen User)</option>
            <option value="admin">Role: Admin (Semua Fitur)</option>
            <option value="pengunjung">Role: Pengunjung / Kapten Tim</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah User
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B0F17] text-xs font-medium text-slate-400">
                <th className="py-2.5 px-4">Nama Pengguna</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4 font-mono">No. Telepon</th>
                <th className="py-2.5 px-4">Role Akses</th>
                <th className="py-2.5 px-4">Status Akun</th>
                <th className="py-2.5 px-4 font-mono">Terdaftar</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-100">{u.name}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{u.email}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{u.phone}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        onUpdateUserRole(u.id, e.target.value as UserRole)
                      }
                      className="px-2.5 py-1 bg-[#0B0F17] border border-slate-700 rounded text-xs font-semibold text-amber-400"
                    >
                      <option value="admin">Admin (Penuh)</option>
                      <option value="panitia">Panitia</option>
                      <option value="pengunjung">Pengunjung</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onToggleUserActive(u.id)}
                      className={`text-xs font-medium ${
                        u.active ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {u.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {u.createdAt}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteUser(u.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Hapus User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
