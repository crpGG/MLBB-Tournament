# Revisi Navigasi Pengunjung, Kartu Turnamen Berposter, & Fitur Bagikan / Kontak Panitia

Pembaruan ini menyempurnakan pengalaman portal turnamen ArenaDawn MLBB agar lebih fokus bagi pengunjung, memperkuat tampilan kartu turnamen dengan poster rasio 2:3 yang dapat diperbesar, menghadirkan pemilih turnamen berbentuk kartu di halaman Live Bracket, serta memperbarui cara kerja tombol Bagikan dan Hubungi Panitia.

## User Review & Critical Decisions

> [!IMPORTANT]
> Seluruh preferensi dari hasil tanya-jawab telah dikunci sebagai spesifikasi utama pada rencana ini:

- **Confirmed Decision 1 (Menu Pengunjung)**: Menyembunyikan menu **Database Tim & Player**, **Poster Turnamen**, dan **Peserta Turnamen** bagi pengunjung, namun **tetap menampilkan menu Daftar Tim & Player** bersama **Dashboard Utama**, **Live Bracket & Klasemen**, **Daftar Turnamen**, dan **Statistik Pemain**.
- **Confirmed Decision 2 (Tombol Hubungi Panitia)**: Tombol **Hubungi Panitia** selalu aktif (menggunakan nomor WhatsApp turnamen atau nomor default panitia utama bila kosong) dan langsung membuka WhatsApp dengan pesan otomatis berisi nama turnamen yang sedang dipilih.
- **Confirmed Decision 3 (Tombol Bagikan)**: Mengklik tombol **Bagikan** akan membuka popup ringkas berisi pratinjau teks undangan turnamen (nama event, prizepool, jadwal, format, dan link) dengan tombol **Salin Link & Undangan** serta **Bagikan ke WhatsApp**.
- **Confirmed Decision 4 (Kartu Turnamen Berposter 2:3)**: Kartu turnamen pada **Daftar Turnamen** dan **Dashboard Utama** menampilkan gambar poster rasio 2:3 di bagian atas (dengan poster SVG otomatis bertema MLBB bila panitia belum mengunggah poster manual) serta fitur klik untuk memperbesar poster (*lightbox*).
- **Confirmed Decision 5 (Kartu Pemilih Turnamen di Live Bracket)**: Mengganti *dropdown select* turnamen pada halaman **Live Bracket & Klasemen** dengan deretan kartu turnamen interaktif bergambar poster dan ringkasan slot tim terverifikasi.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. Menyederhanakan bilah navigasi bagi pengunjung agar hanya melihat menu publik yang relevan tanpa mengekspos menu manajemen/database internal.
  2. Memastikan tombol **Hubungi Panitia** selalu tampil dan langsung membuka chat WhatsApp dengan format pesan siap kirim, serta menyediakan modal **Bagikan Turnamen** yang informatif.
  3. Menampilkan poster turnamen rasio 2:3 pada setiap kartu turnamen di halaman **Daftar Turnamen**, **Dashboard Utama**, dan pemilih turnamen di **Live Bracket & Klasemen**, lengkap dengan fitur perbesar gambar (*poster lightbox*).
- **Target Audience / Persona**:
  - **Pengunjung & Kapten Tim**: Ingin melihat daftar turnamen melalui visual poster yang jelas, mengecek semua turnamen langsung dari Dashboard Utama, berpindah antar-bracket dengan cepat, membagikan info turnamen ke timnya, atau menghubungi panitia via WhatsApp.
  - **Admin & Panitia**: Tetap memiliki akses penuh ke seluruh menu manajemen, verifikasi, poster studio, dan database.
- **Key Value**: Tampilan portal lebih rapi dan profesional seperti portal turnamen esports modern, tanpa tombol yang mati atau tersembunyi ketika nomor kontak belum diatur.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Akses Pengunjung**: Saat masuk sebagai Pengunjung, sidebar dan navigasi bawah hanya menampilkan 5 menu: *Dashboard Utama*, *Live Bracket & Klasemen*, *Daftar Turnamen*, *Statistik Pemain*, dan *Daftar Tim & Player*. Jika tab aktif berada pada menu yang disembunyikan, sistem otomatis mengarahkan ke *Dashboard Utama*.
  2. **Dashboard Utama (Semua Kartu Turnamen)**: Selain menampilkan banner turnamen yang sedang dipilih, bagian bawah menampilkan *grid* seluruh kartu turnamen yang tersedia lengkap dengan poster 2:3, badge status pendaftaran, prizepool, kuota slot, tombol *Pilih / Lihat Bracket*, dan tombol *Perbesar Poster*.
  3. **Daftar Turnamen dengan Poster 2:3 & Lightbox**: Setiap kartu turnamen di halaman *Daftar Turnamen* menampilkan poster 2:3 di bagian atas. Mengklik ikon/gambar poster akan membuka modal *Lightbox* ukuran penuh; mengklik kartu akan memilih turnamen tersebut.
  4. **Pemilih Kartu Turnamen di Live Bracket & Klasemen**: Di bagian atas halaman *Live Bracket & Klasemen*, pengguna melihat deretan kartu turnamen bergambar thumbnail poster 2:3, nama turnamen, sistem seri, dan indikator slot (`X/Y Slot Terverifikasi`) untuk berpindah turnamen dengan sekali klik.
  5. **Bagikan & Hubungi Panitia**:
     - Klik **Bagikan** -> Membuka popup *Bagikan Turnamen* dengan teks undangan lengkap, tombol **Salin Teks & Link**, dan tombol **Kirim ke WhatsApp**.
     - Klik **Hubungi Panitia** -> Membuka `wa.me` ke nomor panitia turnamen (atau nomor default panitia ArenaDawn jika turnamen belum memiliki nomor khusus) dengan pesan otomatis: *"Halo Panitia ArenaDawn, saya ingin bertanya mengenai turnamen [Nama Turnamen]..."*.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Atmospheric Minimalism & High-Craft Dark UI bertema esports Mobile Legends.
  - *Color Palette & Mood*: Obsidian navy canvas (`#070D19`), glass-panel surface (`#0E1830` / `#111827`), aksen Championship Gold (`#F59E0B`), Emerald (`#10B981`) untuk tombol WhatsApp dan status buka pendaftaran, serta Sky Cyan (`#38BDF8`) untuk highlight informasi.
  - *Typography & Hierarchy*: Judul menggunakan display font tegas, nominal hadiah dan kuota slot menggunakan `tabular-nums` monospace.
- **Interactive Feedback & Motion**:
  - Efek *hover* pada poster kartu turnamen menampilkan indikator *Perbesar Poster*.
  - Popup *Bagikan* dan *Lightbox Poster* dilengkapi animasi transisi halus serta notifikasi *toast* saat tautan berhasil disalin.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Poster Otomatis (Fallback SVG) untuk Turnamen Tanpa Poster Unggahan**
  - *Chosen Approach*: Membuat generator poster SVG rasio 2:3 otomatis yang menampilkan nama turnamen, penyelenggara, jadwal Match Day, format, dan total hadiah apabila turnamen belum memiliki `posterUrl` unggahan manual.
  - *Why*: Menjamin seluruh kartu turnamen di *Dashboard Utama*, *Daftar Turnamen*, dan *Live Bracket* selalu tampak visual dan konsisten tanpa kotak kosong.
- **Decision 2: Nomor Kontak Default & Pesan WhatsApp Otomatis**
  - *Chosen Approach*: Menyediakan nomor WhatsApp panitia default apabila `contactWhatsapp` pada turnamen belum diisi, serta menyertakan parameter `?text=...` otomatis.
  - *Why*: Sebelumnya tombol *Hubungi Panitia* hilang jika `contactWhatsapp` belum diisi pada data awal turnamen, sehingga pengguna merasa tombol tidak tersedia atau tidak berfungsi.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         Portal Turnamen ArenaDawn                         │
│             (State Utama: Turnamen, Tim, Pendaftaran, Match)              │
└───────┬───────────────────────────┬───────────────────────────┬───────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐     ┌───────────────────────┐   ┌─────────────────────┐
│ Navigasi Berbasis │     │ Komponen Kartu Poster │   │ Modal Interaktif    │
│ Peran (Role Guard)│     │ Turnamen & Lightbox   │   │ Bagikan & Kontak WA │
├───────────────────┤     ├───────────────────────┤   ├─────────────────────┤
│ • Staf: 8-9 Menu  │     │ • Dashboard Utama:    │   │ • Popup Bagikan:    │
│ • Pengunjung:     │     │   Semua Kartu + Hero  │   │   Salin Undangan &  │
│   5 Menu Publik   │     │ • Daftar Turnamen:    │   │   Share ke WhatsApp │
│   (Tanpa Database,│     │   Grid Kartu Poster   │   │ • Hubungi Panitia:  │
│    Poster, Peserta│     │   2:3 + Zoom Poster   │   │   Tautan WA + Pesan │
│    Turnamen)      │     │ • Live Bracket:       │   │   Otomatis + Nomor  │
│                   │     │   Pemilih Kartu Aktif │   │   Default Fallback  │
└───────────────────┘     └───────────────────────┘   └─────────────────────┘
```

- **Data Model & State**:
  - Menambahkan state UI untuk modal **Bagikan Turnamen** (`shareTournament`) dan modal **Perbesar Poster / Lightbox** (`previewPoster`).
  - Menyediakan helper poster otomatis (`getTournamentPosterUrl`) agar setiap objek turnamen selalu memiliki representasi gambar rasio 2:3 yang siap ditampilkan di kartu maupun *lightbox*.
- **Interactive Component & State Mapping**:
  - **Filter Menu Pengunjung**: Saat pengguna tidak login sebagai staf (`!staff`), daftar navigasi disaring agar tidak menyertakan tab `registrations`, `poster`, dan `database`, serta efek penjaga rute mengarahkan tab terlarang kembali ke `dashboard`.
  - **Interaksi Kartu Turnamen**: Mengklik kartu di *Dashboard Utama*, *Daftar Turnamen*, atau *Live Bracket* memperbarui `selectedTournamentId`; mengklik area poster atau tombol *Perbesar* membuka *Lightbox* poster; mengklik *Bagikan* membuka modal bagikan untuk turnamen terkait.
