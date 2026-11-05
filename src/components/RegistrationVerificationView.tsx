import React, { useState } from 'react';
import {
  Player,
  Tournament,
  TournamentRegistration,
} from '../types/tournament';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';

interface RegistrationVerificationViewProps {
  tournament: Tournament;
  registrations: TournamentRegistration[];
  players: Player[];
  canVerify: boolean; // Admin or Panitia
  onApproveRegistration: (regId: string) => void;
  onRejectRegistration: (regId: string, reason: string) => void;
  onOpenRegistrationModal: () => void;
}

export const RegistrationVerificationView: React.FC<
  RegistrationVerificationViewProps
> = ({
  tournament,
  registrations,
  players,
  canVerify,
  onApproveRegistration,
  onRejectRegistration,
  onOpenRegistrationModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');
  const [previewProofImage, setPreviewProofImage] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const filtered = registrations.filter((r) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const pendingCount = registrations.filter((r) => r.status === 'pending').length;
  const approvedCount = registrations.filter((r) => r.status === 'approved').length;

  const findPlayer = (pid: string) => players.find((p) => p.id === pid);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">
            Daftar Tim Peserta & Verifikasi Bukti Registrasi — {tournament.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Slot Terisi:{' '}
            <span className="font-mono text-emerald-400 font-semibold">
              {approvedCount}/{tournament.maxTeams} Tim
            </span>{' '}
            · Menunggu Verifikasi Panitia:{' '}
            <span className="font-mono text-amber-400 font-semibold">
              {pendingCount} Tim
            </span>{' '}
            · Aturan: {tournament.multiSlot} (5 Pemain Inti + Maks 2 Cadangan Opsional)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            {[
              { id: 'all', label: `Semua (${registrations.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'approved', label: `Disetujui (${approvedCount})` },
              {
                id: 'rejected',
                label: `Ditolak (${
                  registrations.filter((r) => r.status === 'rejected').length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    tab.id as 'all' | 'pending' | 'approved' | 'rejected'
                  )
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenRegistrationModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Daftarkan Tim ke Turnamen Ini
          </button>
        </div>
      </div>

      {/* Registration Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-8 bg-[#111827] border border-slate-800 rounded-xl text-center space-y-3">
            <p className="text-sm text-slate-300">
              Belum ada data pendaftaran tim pada kategori filter ini.
            </p>
            <button
              type="button"
              onClick={onOpenRegistrationModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg"
            >
              + Daftarkan Tim Pertama
            </button>
          </div>
        ) : (
          filtered.map((reg) => {
            const pmUsed = tournament.paymentMethods.find(
              (pm) => pm.id === reg.selectedPaymentMethodId
            );
            return (
              <div
                key={reg.id}
                className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-amber-400 font-mono">
                        [{reg.teamTag}]
                      </span>
                      <span className="text-base font-bold text-slate-100">
                        {reg.teamName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        · Slot #{reg.slotIndex} · Kapten: {reg.captainName} ({reg.whatsapp})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Waktu Daftar: {reg.registeredAt}{' '}
                      {reg.verifiedBy ? `· Diverifikasi oleh: ${reg.verifiedBy}` : ''}
                    </div>
                  </div>

                  {/* Status & Committee Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {reg.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                        <Clock className="w-4 h-4" />
                        Menunggu Verifikasi Panitia
                      </span>
                    )}
                    {reg.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Terverifikasi & Masuk Bracket
                      </span>
                    )}
                    {reg.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                        <XCircle className="w-4 h-4" />
                        Ditolak {reg.committeeNote ? `(${reg.committeeNote})` : ''}
                      </span>
                    )}

                    {canVerify && reg.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onApproveRegistration(reg.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verifikasi & Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onRejectRegistration(
                              reg.id,
                              'Bukti transfer / syarat dokumen belum sesuai'
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-medium text-xs rounded-lg transition-colors"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Roster Grid (5 Core + up to 2 Sub) & Payment/Requirement Proof */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Core + Sub Roster */}
                  <div className="lg:col-span-2 space-y-2">
                    <div className="text-xs font-semibold text-slate-300">
                      Susunan Pemain Terdaftar (5 Pemain Inti + {reg.subPlayerIds.length}{' '}
                      Cadangan)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {reg.corePlayerIds.map((pid, idx) => {
                        const p = findPlayer(pid);
                        return (
                          <div
                            key={pid}
                            className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-100">
                                {idx + 1}. {p ? p.nickname : pid}{canVerify && p?.fullName ? <span className="text-emerald-300"> ({p.fullName})</span> : null}
                              </span>
                              <div className="text-[11px] font-mono text-slate-400">
                                ID: {p ? `${p.mlbbId} (${p.serverId})` : '-'} ·{' '}
                                {p?.primaryRole || 'Core'}
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400">
                              Inti
                            </span>
                          </div>
                        );
                      })}
                      {reg.subPlayerIds.map((pid, idx) => {
                        const p = findPlayer(pid);
                        return (
                          <div
                            key={pid}
                            className="p-2.5 bg-[#0B0F17] border border-slate-800/70 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-200">
                                Sub {idx + 1}. {p ? p.nickname : pid}{canVerify && p?.fullName ? <span className="text-emerald-300"> ({p.fullName})</span> : null}
                              </span>
                              <div className="text-[11px] font-mono text-slate-400">
                                ID: {p ? `${p.mlbbId} (${p.serverId})` : '-'} ·{' '}
                                {p?.primaryRole || 'Sub'}
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-amber-400">
                              Cadangan
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Verification Evidence Column */}
                  <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2.5">
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-amber-400" />
                      Bukti Pembayaran / Dokumen Syarat
                    </div>

                    {reg.feeTypeSnapshot === 'paid' && (
                      <div className="space-y-2 text-xs">
                        <div className="text-slate-400">
                          Metode:{' '}
                          <span className="text-slate-200 font-medium">
                            {pmUsed ? pmUsed.providerName : 'Transfer Manual'}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          Pengirim:{' '}
                          <span className="text-slate-200 font-medium">
                            {reg.paymentSenderName || reg.captainName}
                          </span>
                        </div>
                        {reg.paymentProofImageUrl && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewProofImage({
                                  title: `Bukti Transfer — ${reg.teamName}`,
                                  url: reg.paymentProofImageUrl!,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-md text-xs font-medium transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Lihat Gambar Bukti Transfer
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {reg.feeTypeSnapshot === 'conditional_free' && (
                      <div className="space-y-2 text-xs">
                        <div className="text-slate-400">
                          Skema: <span className="text-emerald-400">Gratis Bersyarat</span> (
                          {reg.requirementSubmissions.length} bukti terlampir)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {reg.requirementSubmissions.map((sub, i) => (
                            <button
                              key={sub.requirementId}
                              type="button"
                              onClick={() =>
                                setPreviewProofImage({
                                  title: `Bukti Syarat #${i + 1} — ${reg.teamName}`,
                                  url: sub.proofImageUrl,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-xs"
                            >
                              <Eye className="w-3 h-3" />
                              Bukti Syarat #{i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {reg.feeTypeSnapshot === 'free' && (
                      <div className="text-xs text-slate-400">
                        Pendaftaran Gratis Tanpa Syarat Dokumen.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal for Proof Image */}
      {previewProofImage && (
        <div
          onClick={() => setPreviewProofImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111827] border border-slate-700 rounded-xl p-4 max-w-lg w-full space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-100">
                {previewProofImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewProofImage(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Tutup ✕
              </button>
            </div>
            <img
              src={previewProofImage.url}
              alt={previewProofImage.title}
              className="w-full rounded-lg border border-slate-800 object-contain max-h-96 bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
};
