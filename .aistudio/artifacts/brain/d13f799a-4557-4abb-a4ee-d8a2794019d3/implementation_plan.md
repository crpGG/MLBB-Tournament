# ArenaDawn v2 — Login Sinematik, Loading Screen Epik MLBB & Rombakan UI/UX Tema Glassy

Pembaruan menyeluruh antarmuka dan pengalaman pengguna (**UI/UX Overhaul**) yang menghadirkan **Login Page** berdasarkan gambar referensi Layla (`/assets/aistudio/login_page_0c3603ff.png`), **Loading Screen** autentik Mobile Legends berdasarkan gambar Alucard & Layla (`/assets/aistudio/loading_3d66433e.jpg`), serta perombakan tata letak utama menjadi **Portal Esport & Lobby In-Game Mobile Legends** bertema **Glassy (Glassmorphism)** elegan dengan animasi transisi yang halus.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan desain dan alur interaksi berikut telah dikonfirmasi dan terintegrasi penuh tanpa menghilangkan fitur turnamen, bracket, pembayaran manual, syarat gratis bersyarat, maupun statistik pemain yang sudah ada:

- **Urutan Alur Masuk (Login $\rightarrow$ Loading Screen MLBB $\rightarrow$ Dashboard Utama)**:
  1. Saat membuka aplikasi, pengguna disambut **Login Page bergaya "Create Character / Enter Land of Dawn"** dengan latar visual `/assets/aistudio/login_page_0c3603ff.png`.
  2. Setelah menekan tombol **Masuk / Okay**, layar bertransisi ke **Loading Screen Mobile Legends** (`/assets/aistudio/loading_3d66433e.jpg`) dengan animasi *progress bar* `"Game Loading... 0% - 100%"` dan efek pendaran energi sebelum masuk ke Halaman Utama.
- **Desain Panel Kanan Login Page**:
  - Menampilkan **Form Email & Password khusus Admin / Panitia** (dilengkapi tombol *Quick-Fill* akun demo Admin & Panitia dalam 1 klik untuk kemudahan pengujian) serta **Tombol Masuk Cepat sebagai Pengunjung** dengan bingkai miring (*chamfered frame*) dan tombol logam emas **"Okay / Masuk Arena"** persis seperti referensi gambar.
- **Struktur UI/UX Gabungan (Portal Esport + Lobby In-Game MLBB + Tema Glassy Elegan)**:
  - Menggabungkan *Hero Banner* turnamen unggulan, katalog kartu turnamen interaktif, visual *bracket* yang rapi, tabel klasemen & *leaderboard* MVP, serta bilah navigasi bergaya **Lobby Mobile Legends** dengan material **Frosted Glass (Glassmorphism)** dan animasi transisi halaman yang mulus menggunakan `motion/react`.

---

## 1. Overview & Core Concept

- **What It Does**: Mengubah pengalaman pengguna dari sekadar aplikasi tabel menjadi serasa masuk ke dalam klien game **Mobile Legends: Bang Bang** yang dipadukan dengan portal turnamen esport modern (seperti struktur portal esport Sulawesi Utara / MPL ID), namun tetap mempertahankan kemudahan operasional bagi Admin, Panitia, dan Pengunjung.
- **Target Audience / Persona**:
  - **Pengunjung / Kapten Tim**: Masuk cepat lewat tombol *Masuk Pengunjung*, menikmati sensasi *loading screen* MLBB, melihat daftar turnamen dalam tampilan kartu kaca (*glassy cards*), memantau jadwal & *bracket*, serta mendaftarkan 5 pemain inti + 2 cadangan dengan langkah yang jelas.
  - **Admin & Panitia**: Login menggunakan Email & Password pada layar Layla untuk membuka akses manajemen turnamen, verifikasi bukti transfer/QRIS/syarat sosmed, pembaruan skor *real-time*, pencatatan statistik KDA/MVP pemain, serta manajemen user (khusus Admin).

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Layar 1 — Login Page Bergaya "Create Character" (`/assets/aistudio/login_page_0c3603ff.png`)**:
   - **Visual & Motion Graphic**: Menampilkan karakter Layla dari `/assets/aistudio/login_page_0c3603ff.png` dengan efek *ambient floating*, kilauan bintang emas di sekitar jari, serta lapisan kaca transparan (*backdrop-blur*) di sisi kanan.
   - **Kontrol Login di Sisi Kanan**:
     - Mode **Masuk Pengunjung (Publik)**: Input Nickname/Nama Pengunjung (lengkap dengan ikon dadu acak & bendera Indonesia/Region) dan tombol emas **"Okay — Masuk sebagai Pengunjung"**.
     - Mode **Login Admin / Panitia**: Input Email dan Password berbingkai heksagonal/miring khas MLBB, pilihan cepat pengisi akun (*1-Click Demo Admin* & *1-Click Demo Panitia*), serta tombol emas **"Okay — Login Panel Panitia/Admin"**.
2. **Layar 2 — Loading Screen Sinematik Mobile Legends (`/assets/aistudio/loading_3d66433e.jpg`)**:
   - **Visual & Motion Graphic**: Menggunakan gambar `/assets/aistudio/loading_3d66433e.jpg` secara penuh (*full-bleed*), dilengkapi pendaran cahaya biru lembut (*cyan energy pulse*) pada meriam Layla dan pedang Alucard, teks versi `Current Version: 2.1.86.2026.1` di kiri atas, dan *loading bar* autentik di bagian bawah.
   - **Progress Bar Interaktif**: Berjalan mulus dari `0%` hingga `100%` (~2.4 detik) dengan teks status dinamis (`"Game Loading... Menyambungkan ke Land of Dawn"`, `"Memuat Jadwal & Bracket Turnamen..."`, `"Menyiapkan Arena Kompetisi... 100%"`) serta tombol *Skip* jika ingin langsung melompat.
3. **Layar 3 — Portal Utama & Lobby Esport Bertema Glassy**:
   - **Tata Letak Intuitif & Tidak Membingungkan**:
     - **Bagian Atas (Top Bar Lobby)**: Identitas *ArenaDawn MLBB*, 5 menu utama yang jelas (*Beranda & Turnamen*, *Bracket & Klasemen*, *Pendaftaran Tim*, *Statistik MVP*, *Database Master*, serta *Manajemen User* khusus Admin), dan tombol aksi utama.
     - **Sub-Bar Status Akun & Role Switcher Glassy**: Menampilkan profil yang sedang login, indikator peran (*Admin / Panitia / Pengunjung*), pemilih turnamen aktif dengan tampilan kartu pill kaca, serta tombol **Kembali ke Layar Login / Ganti Akun**.
     - **Tampilan Beranda Portal & Detail Turnamen**: Menyajikan *Hero Showcase* turnamen aktif lengkap dengan 4 kartu *glassy* untuk tanggal penting (**Match Day: 14 Oktober 2026**, **Penutupan Pendaftaran: 14 Oktober 2026**, **TM: 14 Oktober 2026**, dan **Status Biaya/Hadiah**), diikuti tab visual yang terstruktur rapi.

### Visual Identity & Theme (Glassy MLBB Edition)

- **Aesthetic Direction**: *Celestial Glassy Esports Lobby* — memadukan warna biru malam berbintang dan emas kerajaan khas Mobile Legends dengan lapisan kaca buram (*frosted glassmorphism*) yang jernih dan modern.
- **Color Palette & Glass Tokens**:
  - **Canvas**: Deep Twilight Navy (`#060B19`) dengan gradien radial biru langit (`rgba(14, 165, 233, 0.14)`) dan aksen cahaya emas (`rgba(245, 158, 11, 0.12)`).
  - **Glassy Surfaces**: `bg-slate-900/45 backdrop-blur-xl border border-white/15 shadow-2xl` untuk kartu utama, modal, dan bilah navigasi.
  - **Chamfered & Metallic Gold Accents**: Gradien emas `#FDE68A` ke `#D97706` untuk tombol utama, mahkota MVP, dan bingkai aktif.
- **Typography & Hierarchy**:
  - **Display & Title**: `Cinzel` / `Outfit` untuk nuansa megah pada judul layar Login & Header Turnamen.
  - **UI & Body**: `Plus Jakarta Sans` untuk kejelasan navigasi dan formulir.
  - **Data & Skor**: `JetBrains Mono` (`tabular-nums`) untuk skor pertandingan, rasio KDA, Gold, Rating, dan tanggal.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Penggabungan Form Email/Password Admin-Panitia & Akses Cepat Pengunjung pada Layar Layla**
  - *Chosen Approach*: Menyediakan tab pemilih halus di dalam panel kanan gambar Layla (`Masuk Pengunjung` vs `Login Admin / Panitia`) dengan tetap mempertahankan proporsi visual gambar referensi (input berbingkai miring, pemilih bendera/peran, dan tombol emas *Okay*).
  - *Why*: Memenuhi kebutuhan keamanan login Email & Password bagi Admin/Panitia sekaligus memastikan pengunjung biasa tidak terhambat pembuatan akun saat hanya ingin melihat jadwal atau mendaftarkan tim.
- **Decision 2: Penyederhanaan Hierarki Visual Dashboard dengan Step-by-Step Card Flow**
  - *Chosen Approach*: Mengelompokkan informasi turnamen ke dalam kartu *glassy* berstruktur jelas: (1) *Banner Turnamen & Regulasi MLBB*, (2) *Alur Cepat 3 Langkah (Daftar Tim $\rightarrow$ Verifikasi Panitia $\rightarrow$ Pantau Bracket & Statistik)*, dan (3) *Workspace Utama* dengan transisi halaman halus.
  - *Why*: Menjawab kebingungan UI/UX sebelumnya dengan membuat setiap bagian memiliki fokus visual yang tegas seperti portal esport profesional.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION SESSION & FLOW STATE                      │
│   [1. MLBBLaylaLoginPage] ──(Submit)──► [2. MLBBAlucardLoadingScreen]        │
│   (/assets/aistudio/login_page_0c3603ff.png)  (/assets/aistudio/loading_3d66433e.jpg)
└───────────────────────────────────────────────┬──────────────────────────────┘
                                                │ (100% Loaded)
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 3. GLASSY ESPORT PORTAL & MLBB LOBBY WORKSPACE               │
│   • Top Glassy Navigation Bar (3-Zone Contract)                              │
│   • Interactive Hero Portal & Quick-Switch Tournament Cards                  │
│   • Smooth Page Transitions (motion/react AnimatePresence)                   │
└───────────────┬───────────────────────────────┬──────────────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────┐   ┌──────────────────────────────────────────┐
│  OPERATIONAL TOURNAMENT VIEWS │   │  DATABASE, STATS & ADMIN MODULES         │
├───────────────────────────────┤   ├──────────────────────────────────────────┤
│ • BracketAndStandingsView     │   │ • PlayerStatsLeaderboardView             │
│   (Single/Double Elim & RR)   │   │   (Hero, Role, KDA, MVP, Gold, Rating)   │
│ • RegistrationVerificationView│   │ • DatabaseMasterView (5 Inti + 2 Sub)    │
│   (Bank/E-Wallet/QRIS &       │   │ • UserManagementView (Khusus Admin)      │
│    Link Gratis Bersyarat)     │   │ • Modals (Buat/Edit Turnamen, Skor, Reg) │
└───────────────────────────────┘   └──────────────────────────────────────────┘
```

### Interactive Component & State Mapping

- **`MLBBLaylaLoginPage`**: Merender latar `/assets/aistudio/login_page_0c3603ff.png` dengan overlay partikel bintang emas dan kartu kaca *glassmorphism* di sisi kanan; memvalidasi kredensial Email/Password untuk Admin (`sacty.geraldy@gmail.com`) dan Panitia (`rizky.panitia@arenadawn.id`) atau mengizinkan akses langsung sebagai Pengunjung, lalu memicu state `isTransitioningToLoading = true`.
- **`MLBBAlucardLoadingScreen`**: Merender latar `/assets/aistudio/loading_3d66433e.jpg` dengan animasi cahaya meriam/pedang dan *progress bar* `0%` $\rightarrow$ `100%`, lalu membuka dashboard utama dengan peran pengguna yang sesuai.
- **Glassy Portal Layout**: Seluruh komponen tampilan (*Bracket*, *Registrasi*, *Statistik*, *Database*, *Manajemen User*, dan *Modal*) diperbarui menggunakan kelas *glassmorphism* konsisten dan animasi transisi `motion.div` yang elegan.
