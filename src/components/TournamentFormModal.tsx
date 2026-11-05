import React, { useState } from 'react';
import {
  BracketFormat,
  ConditionalRequirement,
  FeeType,
  PaymentMethodConfig,
  Tournament,
} from '../types/tournament';
import { SAMPLE_QRIS_SVG_DATA_URI } from '../data/initialData';
import { readImageCompressed } from '../utils/image';
import { Plus, Trash2, Upload, X, ExternalLink, QrCode, CreditCard, CheckCircle2 } from 'lucide-react';

interface TournamentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tournament: Tournament, regenerateBracket: boolean) => void;
  editingTournament?: Tournament | null;
}

export const TournamentFormModal: React.FC<TournamentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTournament,
}) => {
  const [name, setName] = useState(
    editingTournament?.name || 'Turnamen Esport Mobile Legends — Oktober Series'
  );
  const [organizer, setOrganizer] = useState(
    editingTournament?.organizer || 'Panitia Resmi ArenaDawn'
  );
  const [posterUrl, setPosterUrl] = useState(editingTournament?.posterUrl || '');
  const [contactWhatsapp, setContactWhatsapp] = useState(editingTournament?.contactWhatsapp || '');
  const [description, setDescription] = useState(
    editingTournament?.description ||
      'Turnamen komunitas & kompetitif Mobile Legends dengan sistem bracket otomatis dan pelaporan statistik individu pemain.'
  );
  const [status, setStatus] = useState<'registration' | 'ongoing' | 'completed'>(
    editingTournament?.status || 'registration'
  );

  // Dates - Default 14 Oktober 2026 as requested
  const [matchDayDate, setMatchDayDate] = useState(
    editingTournament?.matchDayDate || '2026-10-14'
  );
  const [registrationCloseDate, setRegistrationCloseDate] = useState(
    editingTournament?.registrationCloseDate || '2026-10-14'
  );
  const [technicalMeetingDate, setTechnicalMeetingDate] = useState(
    editingTournament?.technicalMeetingDate || '2026-10-14'
  );
  const [technicalMeetingTime, setTechnicalMeetingTime] = useState(
    editingTournament?.technicalMeetingTime || '13:00 WIB'
  );

  // Format & MLBB Specific Options
  const [bracketFormat, setBracketFormat] = useState<BracketFormat>(
    editingTournament?.bracketFormat || 'single_round_robin'
  );
  const [seriesSystem, setSeriesSystem] = useState(
    editingTournament?.seriesSystem || 'Sistem Liga BO1 | Total 5 Babak'
  );
  const [defaultBestOf, setDefaultBestOf] = useState<1 | 3 | 5 | 7>(
    editingTournament?.defaultBestOf || 1
  );
  const [totalRounds, setTotalRounds] = useState<number>(
    editingTournament?.totalRounds || 5
  );
  const [venueType, setVenueType] = useState<'Online' | 'Offline' | 'Hybrid'>(
    editingTournament?.venueType || 'Online'
  );
  const [venueDetail, setVenueDetail] = useState(
    editingTournament?.venueDetail || 'Custom Lobby MLBB & Discord Server Panitia'
  );
  const [multiSlot, setMultiSlot] = useState<'Multi Slot On' | 'Multi Slot Off'>(
    editingTournament?.multiSlot || 'Multi Slot On'
  );
  const [maxSlotPerTeam, setMaxSlotPerTeam] = useState<number>(
    editingTournament?.maxSlotPerTeam || 2
  );
  const [skinRule, setSkinRule] = useState<'Skin Bebas' | 'Skin On' | 'Skin Off (No Skin)'>(
    editingTournament?.skinRule || 'Skin Bebas'
  );
  const [tierRule, setTierRule] = useState<
    'All Tier/Rank' | 'Mythic+ Only' | 'Legend - Mythic' | 'Maksimal Legend'
  >(editingTournament?.tierRule || 'All Tier/Rank');
  const [gameMode, setGameMode] = useState<
    'Custom Draft Pick Mode' | 'Tournament Mode (10 Ban)' | 'Custom Classic' | 'Brawl Mode'
  >(editingTournament?.gameMode || 'Custom Draft Pick Mode');
  const [maxTeams, setMaxTeams] = useState<number>(editingTournament?.maxTeams || 16);
  const [prizePool, setPrizePool] = useState(
    editingTournament?.prizePool || 'Rp 5.000.000 + E-Sertifikat'
  );

  // Fee & Payment / Conditional Requirements
  const [feeType, setFeeType] = useState<FeeType>(editingTournament?.feeType || 'paid');
  const [feeAmount, setFeeAmount] = useState<number>(editingTournament?.feeAmount ?? 75000);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(
    editingTournament?.paymentMethods && editingTournament.paymentMethods.length > 0
      ? editingTournament.paymentMethods
      : [
          {
            id: 'pm-default-bca',
            type: 'bank',
            providerName: 'Bank BCA',
            accountNumber: '8720194821',
            accountHolder: 'Panitia ArenaDawn Esport',
            instructions: 'Cantumkan berita transfer: REG-[NAMA TIM]',
          },
          {
            id: 'pm-default-dana',
            type: 'ewallet',
            providerName: 'DANA / GoPay',
            accountNumber: '081288990011',
            accountHolder: 'Bendahara ArenaDawn',
            instructions: 'Kirim bukti screenshot transfer berhasil',
          },
          {
            id: 'pm-default-qris',
            type: 'qris',
            providerName: 'QRIS Statis Panitia',
            accountHolder: 'ARENADAWN ESPORT',
            qrisImageUrl: SAMPLE_QRIS_SVG_DATA_URI,
            instructions: 'Scan QRIS dan unggah screenshot bukti bayar',
          },
        ]
  );

  const [conditionalRequirements, setConditionalRequirements] = useState<
    ConditionalRequirement[]
  >(
    editingTournament?.conditionalRequirements &&
      editingTournament.conditionalRequirements.length > 0
      ? editingTournament.conditionalRequirements
      : [
          {
            id: 'req-default-1',
            label: 'Follow Instagram Resmi Panitia & Like Postingan Turnamen',
            category: 'social_follow',
            externalUrl: 'https://www.instagram.com/',
            mandatory: true,
            description: 'Klik link Instagram di atas, follow, dan unggah screenshot bukti.',
          },
          {
            id: 'req-default-2',
            label: 'Share Poster Turnamen ke Grup Komunitas / Story WA',
            category: 'social_share',
            externalUrl: 'https://chat.whatsapp.com/',
            mandatory: true,
            description: 'Bagikan ke minimal 1 grup MLBB dan unggah screenshot.',
          },
        ]
  );

  // New Payment Method inputs
  const [newPmType, setNewPmType] = useState<'bank' | 'ewallet' | 'qris'>('bank');
  const [newPmProvider, setNewPmProvider] = useState('');
  const [newPmNumber, setNewPmNumber] = useState('');
  const [newPmHolder, setNewPmHolder] = useState('');
  const [newPmInstructions, setNewPmInstructions] = useState('');
  const [newPmQrisUrl, setNewPmQrisUrl] = useState(SAMPLE_QRIS_SVG_DATA_URI);

  // New Conditional Requirement inputs
  const [newReqLabel, setNewReqLabel] = useState('');
  const [newReqCategory, setNewReqCategory] = useState<
    'social_follow' | 'social_share' | 'identity' | 'custom'
  >('social_follow');
  const [newReqUrl, setNewReqUrl] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');

  const [regenerateBracket, setRegenerateBracket] = useState(!editingTournament);

  if (!isOpen) return null;

  const handleQrisFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImageCompressed(file).then(setNewPmQrisUrl, () => undefined);
  };

  const handleAddPaymentMethod = () => {
    if (!newPmProvider.trim() || !newPmHolder.trim()) return;
    const added: PaymentMethodConfig = {
      id: `pm-${Date.now()}`,
      type: newPmType,
      providerName: newPmProvider.trim(),
      accountNumber: newPmType === 'qris' ? undefined : newPmNumber.trim(),
      accountHolder: newPmHolder.trim(),
      qrisImageUrl: newPmType === 'qris' ? newPmQrisUrl : undefined,
      instructions: newPmInstructions.trim() || undefined,
    };
    setPaymentMethods([...paymentMethods, added]);
    setNewPmProvider('');
    setNewPmNumber('');
    setNewPmHolder('');
    setNewPmInstructions('');
  };

  const handleAddRequirement = () => {
    if (!newReqLabel.trim()) return;
    let formattedUrl = newReqUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    const added: ConditionalRequirement = {
      id: `req-${Date.now()}`,
      label: newReqLabel.trim(),
      category: newReqCategory,
      externalUrl: formattedUrl || undefined,
      mandatory: true,
      description: newReqDesc.trim() || undefined,
    };
    setConditionalRequirements([...conditionalRequirements, added]);
    setNewReqLabel('');
    setNewReqUrl('');
    setNewReqDesc('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved: Tournament = {
      id: editingTournament?.id || `trn-${Date.now()}`,
      name: name.trim(),
      organizer: organizer.trim(),
      description: description.trim(),
      status,
      matchDayDate,
      registrationCloseDate,
      technicalMeetingDate,
      technicalMeetingTime,
      feeType,
      feeAmount: feeType === 'paid' ? Number(feeAmount) : 0,
      paymentMethods: feeType === 'paid' ? paymentMethods : [],
      conditionalRequirements:
        feeType === 'conditional_free' ? conditionalRequirements : [],
      venueType,
      venueDetail: venueDetail.trim(),
      multiSlot,
      maxSlotPerTeam: multiSlot === 'Multi Slot On' ? maxSlotPerTeam : 1,
      skinRule,
      tierRule,
      gameMode,
      seriesSystem,
      defaultBestOf,
      totalRounds,
      bracketFormat,
      maxTeams,
      prizePool: prizePool.trim(),
      ...(posterUrl ? { posterUrl } : {}),
      ...(contactWhatsapp.trim() ? { contactWhatsapp: contactWhatsapp.trim() } : {}),
      createdAt: editingTournament?.createdAt || new Date().toISOString().slice(0, 10),
    };
    onSave(saved, regenerateBracket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111827] border border-slate-800 rounded-xl shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {editingTournament ? 'Edit Konfigurasi Turnamen' : 'Buat Turnamen Mobile Legends Baru'}
            </h2>
            <p className="text-xs text-slate-400">
              Atur jadwal 14 Oktober 2026, format bracket, aturan MLBB, dan sistem pembayaran / syarat dokumen
            </p>
          </div>
          <button aria-label="Tutup"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* 1. Identitas & Status Turnamen */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-amber-400">
              01. Identitas & Format Kompetisi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Turnamen
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Penyelenggara / Komunitas
                </label>
                <input
                  type="text"
                  required
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 items-start">
              <div>
                <span className="block text-xs font-medium text-slate-300 mb-1.5">Poster Turnamen (2:3)</span>
                <div className="aspect-[2/3] rounded-lg border border-slate-700 bg-[#0B0F17] overflow-hidden flex items-center justify-center text-[11px] text-slate-500 text-center p-2">
                  {posterUrl ? (
                    <img src={posterUrl} alt="Pratinjau poster" className="w-full h-full object-cover" />
                  ) : (
                    'Belum ada poster'
                  )}
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <label className="flex-1 text-center px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 cursor-pointer">
                    {posterUrl ? 'Ganti' : 'Unggah'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) readImageCompressed(f, 720, 0.82).then(setPosterUrl, () => undefined);
                      }}
                    />
                  </label>
                  {posterUrl && (
                    <button type="button" onClick={() => setPosterUrl('')} className="px-2 py-1.5 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-rose-300 cursor-pointer">
                      Hapus
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  WhatsApp Panitia (tombol "Hubungi Panitia")
                </label>
                <input
                  type="tel"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">Tampil untuk publik. Kosongkan untuk menyembunyikan tombol.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Format Bracket Otomatis
                </label>
                <select
                  value={bracketFormat}
                  onChange={(e) => setBracketFormat(e.target.value as BracketFormat)}
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="single_elimination">Single Elimination (Gugur Tunggal)</option>
                  <option value="double_elimination">Double Elimination (Upper & Lower Bracket)</option>
                  <option value="single_round_robin">Single Round-Robin (Klasemen Liga 1 Putaran)</option>
                  <option value="double_round_robin">Double Round-Robin (Klasemen Liga 2 Putaran)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Status Turnamen
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'registration' | 'ongoing' | 'completed')
                  }
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="registration">Buka Pendaftaran</option>
                  <option value="ongoing">Sedang Berlangsung (Live Match)</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Total Hadiah (Prize Pool)
                </label>
                <input
                  type="text"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </section>

          {/* 2. Tanggal Penting (Match Day, Penutupan Pendaftaran, Technical Meeting) */}
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-amber-400">
                02. Jadwal Penting Turnamen (Pilihan Cepat 14 Oktober 2026)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMatchDayDate('2026-10-14');
                  setRegistrationCloseDate('2026-10-14');
                  setTechnicalMeetingDate('2026-10-14');
                }}
                className="px-3 py-1 text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md hover:bg-amber-500/25 transition-colors"
              >
                Set Semua ke 14 Oktober 2026
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Match Day */}
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Match Day (Hari Pertandingan)
                </label>
                <input
                  type="date"
                  value={matchDayDate}
                  onChange={(e) => setMatchDayDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-sm font-mono text-slate-100"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '14 Okt 2026', val: '2026-10-14' },
                    { label: '17 Okt 2026', val: '2026-10-17' },
                    { label: '24 Okt 2026', val: '2026-10-24' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setMatchDayDate(preset.val)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        matchDayDate === preset.val
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Registration Close Date */}
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Pendaftaran Ditutup Tanggal
                </label>
                <input
                  type="date"
                  value={registrationCloseDate}
                  onChange={(e) => setRegistrationCloseDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-sm font-mono text-slate-100"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '14 Okt 2026', val: '2026-10-14' },
                    { label: '13 Okt 2026', val: '2026-10-13' },
                    { label: '16 Okt 2026', val: '2026-10-16' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setRegistrationCloseDate(preset.val)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        registrationCloseDate === preset.val
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Meeting Date */}
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Technical Meeting (TM) Tanggal & Jam
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={technicalMeetingDate}
                    onChange={(e) => setTechnicalMeetingDate(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#111827] border border-slate-700 rounded text-sm font-mono text-slate-100"
                  />
                  <input
                    type="text"
                    value={technicalMeetingTime}
                    onChange={(e) => setTechnicalMeetingTime(e.target.value)}
                    placeholder="11:00 WIB"
                    className="w-24 px-2.5 py-1.5 bg-[#111827] border border-slate-700 rounded text-xs font-mono text-slate-100"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '14 Okt 2026', val: '2026-10-14' },
                    { label: '13 Okt 2026', val: '2026-10-13' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setTechnicalMeetingDate(preset.val)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        technicalMeetingDate === preset.val
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Detail Regulasi & Pengaturan In-Game Mobile Legends */}
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-amber-400">
              03. Pengaturan Regulasi Mobile Legends (Venue, Multi Slot, Skin, Tier, Draft Pick, Liga BO1)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Venue */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Venue Pertandingan
                </label>
                <select
                  value={venueType}
                  onChange={(e) =>
                    setVenueType(e.target.value as 'Online' | 'Offline' | 'Hybrid')
                  }
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid (Penyisihan Online, Final Offline)</option>
                </select>
              </div>

              {/* Detail Lokasi / Room */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Detail Lokasi Venue / Discord Room
                </label>
                <input
                  type="text"
                  value={venueDetail}
                  onChange={(e) => setVenueDetail(e.target.value)}
                  placeholder="Contoh: Custom Lobby MLBB / Atrium Mall..."
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                />
              </div>

              {/* Multi Slot */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Pengaturan Multi Slot
                </label>
                <div className="flex gap-2">
                  <select
                    value={multiSlot}
                    onChange={(e) =>
                      setMultiSlot(e.target.value as 'Multi Slot On' | 'Multi Slot Off')
                    }
                    className="flex-1 px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                  >
                    <option value="Multi Slot On">Multi Slot On</option>
                    <option value="Multi Slot Off">Multi Slot Off (Single Slot)</option>
                  </select>
                  {multiSlot === 'Multi Slot On' && (
                    <select
                      value={maxSlotPerTeam}
                      onChange={(e) => setMaxSlotPerTeam(Number(e.target.value))}
                      className="w-28 px-2.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
                    >
                      <option value={2}>Maks 2 Slot</option>
                      <option value={3}>Maks 3 Slot</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Aturan Skin */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Aturan Penggunaan Skin
                </label>
                <select
                  value={skinRule}
                  onChange={(e) =>
                    setSkinRule(
                      e.target.value as 'Skin Bebas' | 'Skin On' | 'Skin Off (No Skin)'
                    )
                  }
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="Skin Bebas">Skin Bebas</option>
                  <option value="Skin On">Skin On (Stat Aktif)</option>
                  <option value="Skin Off (No Skin)">Skin Off (No Skin)</option>
                </select>
              </div>

              {/* Batas Tier/Rank */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kualifikasi Tier / Rank Pemain
                </label>
                <select
                  value={tierRule}
                  onChange={(e) =>
                    setTierRule(
                      e.target.value as
                        | 'All Tier/Rank'
                        | 'Mythic+ Only'
                        | 'Legend - Mythic'
                        | 'Maksimal Legend'
                    )
                  }
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="All Tier/Rank">All Tier/Rank</option>
                  <option value="Mythic+ Only">Mythic+ Only</option>
                  <option value="Legend - Mythic">Legend - Mythic</option>
                  <option value="Maksimal Legend">Komunitas (Maksimal Legend)</option>
                </select>
              </div>

              {/* Mode Pertandingan */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mode Lobby Pertandingan
                </label>
                <select
                  value={gameMode}
                  onChange={(e) =>
                    setGameMode(
                      e.target.value as
                        | 'Custom Draft Pick Mode'
                        | 'Tournament Mode (10 Ban)'
                        | 'Custom Classic'
                        | 'Brawl Mode'
                    )
                  }
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="Custom Draft Pick Mode">Custom Draft Pick Mode</option>
                  <option value="Tournament Mode (10 Ban)">Tournament Mode (10 Ban)</option>
                  <option value="Custom Classic">Custom Classic</option>
                  <option value="Brawl Mode">Brawl Mode</option>
                </select>
              </div>

              {/* Sistem Liga & Babak */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Sistem Liga & Format Babak
                </label>
                <select
                  value={seriesSystem}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSeriesSystem(val);
                    if (val.includes('BO1')) setDefaultBestOf(1);
                    else if (val.includes('BO3')) setDefaultBestOf(3);
                    else if (val.includes('BO5')) setDefaultBestOf(5);
                    if (val.includes('5 Babak')) setTotalRounds(5);
                  }}
                  className="w-full px-3.5 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="Sistem Liga BO1 | Total 5 Babak">
                    Sistem Liga BO1 | Total 5 Babak
                  </option>
                  <option value="Sistem Liga BO3 | Total 5 Babak">
                    Sistem Liga BO3 | Total 5 Babak
                  </option>
                  <option value="Penyisihan BO1 | Semifinal BO3 | Grand Final BO5">
                    Penyisihan BO1 | Semifinal BO3 | Grand Final BO5
                  </option>
                  <option value="Double Elimination BO3 | Grand Final BO5">
                    Double Elimination BO3 | Grand Final BO5
                  </option>
                  <option value="Full Series BO3">Full Series BO3</option>
                </select>
              </div>

              {/* Total Babak & Kuota Slot */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Total Babak
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Kuota Tim
                  </label>
                  <select
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-sm font-mono text-slate-100"
                  >
                    <option value={4}>4 Tim</option>
                    <option value={8}>8 Tim</option>
                    <option value={16}>16 Tim</option>
                    <option value={32}>32 Tim</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Skema Biaya Pendaftaran, Pembayaran Manual & Syarat Gratis Bersyarat */}
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-amber-400">
              04. Skema Biaya Pendaftaran & Persyaratan Peserta
            </h3>

            {/* 3 Mode Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'paid' as FeeType,
                  title: 'Bayar Pendaftaran (Manual)',
                  desc: 'Transfer Rekening Bank, E-Wallet, atau Scan QRIS Statis Panitia (Tanpa Payment Gateway)',
                },
                {
                  id: 'conditional_free' as FeeType,
                  title: 'Gratis Bersyarat (Upload Bukti)',
                  desc: 'Gratis biaya uang, wajib unggah screenshot syarat (Follow/Share Sosmed dengan link aktif)',
                },
                {
                  id: 'free' as FeeType,
                  title: 'Gratis Murni (Tanpa Syarat)',
                  desc: 'Pendaftaran terbuka tanpa biaya dan tanpa kewajiban unggah dokumen syarat',
                },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFeeType(option.id)}
                  className={`p-3.5 rounded-lg border text-left transition-colors ${
                    feeType === option.id
                      ? 'bg-amber-500/10 border-amber-500 text-slate-100'
                      : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100">{option.title}</span>
                    {feeType === option.id && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{option.desc}</p>
                </button>
              ))}
            </div>

            {/* A. PAID CONFIGURATION */}
            {feeType === 'paid' && (
              <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      Pengaturan Pembayaran Manual Panitia (Bank, E-Wallet & QRIS Upload)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Informasi rekening dan QRIS ini akan ditampilkan kepada peserta saat mendaftarkan tim
                    </p>
                  </div>
                  <div className="w-full sm:w-56">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Biaya Registrasi per Slot (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700 rounded-lg text-sm font-mono text-amber-400 font-semibold"
                    />
                  </div>
                </div>

                {/* Existing Payment Methods List */}
                <div className="space-y-2">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between gap-4 p-3 bg-[#111827] border border-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {pm.type === 'qris' && pm.qrisImageUrl ? (
                          <img
                            src={pm.qrisImageUrl}
                            alt="QRIS"
                            className="w-11 h-11 rounded object-cover bg-white p-0.5 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                            {pm.type === 'bank' ? 'BANK' : 'WALLET'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 truncate">
                            {pm.providerName}{' '}
                            {pm.accountNumber && (
                              <span className="font-mono text-amber-400 ml-1">
                                • {pm.accountNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            a.n. {pm.accountHolder}
                            {pm.instructions ? ` · ${pm.instructions}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethods(paymentMethods.filter((x) => x.id !== pm.id))
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Hapus metode pembayaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Payment Method Form */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="text-xs font-medium text-slate-300">
                    Tambah Kanal Pembayaran Baru (Rekening Bank / E-Wallet / Upload QRIS)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <select
                      value={newPmType}
                      onChange={(e) =>
                        setNewPmType(e.target.value as 'bank' | 'ewallet' | 'qris')
                      }
                      className="px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                    >
                      <option value="bank">Transfer Rekening Bank</option>
                      <option value="ewallet">E-Wallet (DANA/GoPay/OVO)</option>
                      <option value="qris">Upload QRIS Statis</option>
                    </select>
                    <input
                      type="text"
                      value={newPmProvider}
                      onChange={(e) => setNewPmProvider(e.target.value)}
                      placeholder={
                        newPmType === 'bank'
                          ? 'Nama Bank (mis: BCA / BRI)'
                          : newPmType === 'ewallet'
                          ? 'Nama E-Wallet (mis: DANA)'
                          : 'Label QRIS (mis: QRIS Panitia)'
                      }
                      className="px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                    />
                    {newPmType !== 'qris' ? (
                      <input
                        type="text"
                        value={newPmNumber}
                        onChange={(e) => setNewPmNumber(e.target.value)}
                        placeholder="Nomor Rekening / No. HP"
                        className="px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
                      />
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pilih Gambar QRIS</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrisFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                    <input
                      type="text"
                      value={newPmHolder}
                      onChange={(e) => setNewPmHolder(e.target.value)}
                      placeholder="Atas Nama Pemilik"
                      className="px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPmInstructions}
                      onChange={(e) => setNewPmInstructions(e.target.value)}
                      placeholder="Instruksi tambahan (opsional, misal: Cantumkan nama tim di berita transfer)"
                      className="flex-1 px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddPaymentMethod}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Pembayaran
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* B. CONDITIONAL FREE CONFIGURATION */}
            {feeType === 'conditional_free' && (
              <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    Pengaturan Syarat Dokumen & Link Media Sosial (Gratis Bersyarat)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Tautan/link yang Anda tempel di bawah ini akan otomatis aktif dan bisa langsung diklik oleh peserta saat registrasi.
                  </p>
                </div>

                {/* Existing Requirements List */}
                <div className="space-y-2">
                  {conditionalRequirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-4 p-3 bg-[#111827] border border-slate-800 rounded-lg"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-semibold text-slate-100">
                          {req.label}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {req.externalUrl && (
                            <a
                              href={req.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-mono"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {req.externalUrl}
                            </a>
                          )}
                          {req.description && <span>· {req.description}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConditionalRequirements(
                            conditionalRequirements.filter((x) => x.id !== req.id)
                          )
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Conditional Requirement */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="text-xs font-medium text-slate-300">
                    Tambah Syarat Gratis Bersyarat + Link yang Bisa Diklik Peserta
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select
                      value={newReqCategory}
                      onChange={(e) =>
                        setNewReqCategory(
                          e.target.value as
                            | 'social_follow'
                            | 'social_share'
                            | 'identity'
                            | 'custom'
                        )
                      }
                      className="px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                    >
                      <option value="social_follow">Follow / Subscribe Sosmed</option>
                      <option value="social_share">Share Poster / Join Grup</option>
                      <option value="identity">Kartu Identitas (Kartu Pelajar/KTP)</option>
                      <option value="custom">Syarat Dokumen Kustom Lainnya</option>
                    </select>
                    <input
                      type="text"
                      value={newReqLabel}
                      onChange={(e) => setNewReqLabel(e.target.value)}
                      placeholder="Judul Syarat (mis: Follow TikTok @arenadawn)"
                      className="px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                    />
                    <input
                      type="text"
                      value={newReqUrl}
                      onChange={(e) => setNewReqUrl(e.target.value)}
                      placeholder="Tempel Link URL (mis: https://instagram.com/...)"
                      className="px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs font-mono text-amber-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newReqDesc}
                      onChange={(e) => setNewReqDesc(e.target.value)}
                      placeholder="Petunjuk bukti screenshot untuk peserta (opsional)"
                      className="flex-1 px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Syarat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Opsi Regenerate Bracket */}
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Susun Ulang / Generate Otomatis Jadwal & Bracket
              </div>
              <div className="text-xs text-slate-400">
                Jika dicentang, sistem akan langsung menyusun bagan pertandingan sesuai format bracket yang dipilih di atas
              </div>
            </div>
            <input
              type="checkbox"
              checked={regenerateBracket}
              onChange={(e) => setRegenerateBracket(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
            >
              {editingTournament ? 'Simpan Perubahan Turnamen' : 'Buat & Publikasikan Turnamen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
