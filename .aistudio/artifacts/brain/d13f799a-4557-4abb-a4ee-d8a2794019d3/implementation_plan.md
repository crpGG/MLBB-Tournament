# ArenaDawn — Upgrade Login Panel Epic 2.5D/3D Hologram & Motion Graphic Mobile Legends

Pembaruan ini menyulap halaman **Login Panel Layla** dari tampilan kotak kaca biasa menjadi gerbang masuk turnamen (*Esports Portal Gate*) yang sangat hidup, interaktif terhadap gerakan kursor (*3D Hologram Tilt & Cursor Lightning*), dan dirancang khusus untuk memikat pengunjung sejak detik pertama membuka aplikasi.

---

## User Review & Keputusan yang Dikonfirmasi

> [!IMPORTANT]
> Seluruh preferensi animasi dan tata letak yang Anda pilih telah dimasukkan ke dalam rancangan di bawah ini, sekaligus menjawab pertanyaan Anda mengenai animasi 3D karakter Layla.

- **Animasi Karakter Layla (2.5D Multi-Layer Depth & Breathing Rig)**: Karena aset referensi Layla adalah ilustrasi 2D, sistem akan menerapkan teknik **2.5D Live-Illusion Rig**—memisahkan lapisan perspektif latar dan fokus karakter dengan gerakan *parallax* 3D saat mouse digerakkan, animasi karakter bernapas (*breathing & floating*), kilau bintang emas berdenyut di ujung jari Layla, serta gelombang cincin energi *Malefic* biru-emas di sekelilingnya.
- **Efek Panel Login Lengkap (4-in-1 Epic Motion)**:
  1. **3D Hologram Tilt**: Panel login miring secara 3D (`rotateX` & `rotateY`) mengikuti posisi kursor dengan pantulan cahaya kaca (*specular glare*) dinamis.
  2. **Bingkai Energi Emas Berputar & Cahaya Neon Berjalan**: Garis tepi panel menggunakan aliran cahaya emas-cyan yang berputar mengelilingi kartu secara kontinu lengkap dengan ornamen sudut *Mythic*.
  3. **Partikel Kristal Melayang & Jejak Kilat Kursor**: Kristal cahaya melayang di udara ditambah percikan energi/kilat interaktif yang muncul mengikuti pergerakan mouse pengguna.
- **Hierarki Portal (Pengunjung di Atas, Panitia di Bawah)**:
  - **Bagian Atas (Fokus Utama Pengunjung)**: Menampilkan **Lencana Animasi Mythic Glory & Trofi Berkilau**, **Ticker Pengumuman Turnamen Aktif (Status Pendaftaran Dibuka)**, dan **Tombol Portal Heroik Besar ("MASUK ARENA TURNAMEN")** agar pengunjung/kapten tim langsung tertarik masuk hanya dengan 1 klik.
  - **Bagian Bawah (Khusus Staf)**: Menampilkan form **Login Admin & Panitia** (Username & Password Firebase) dengan desain input *chamfered* khas MLBB yang tetap ringkas dan elegan.

---

## 1. Gambaran Umum & Konsep Utama

- **Apa yang Dilakukan**: Menghadirkan pengalaman layar pembuka setara *splash lobby* gim AAA *Mobile Legends: Bang Bang* yang memadukan ilustrasi Layla, efek fisika 3D interaktif, pengumuman turnamen *real-time*, dan autentikasi panitia.
- **Target Pengguna**:
  - **Pengunjung & Kapten Tim**: Langsung terpikat oleh visual *Mythic Glory*, informasi turnamen aktif, dan tombol portal masuk yang megah tanpa terhalang form login staf.
  - **Admin & Panitia**: Tetap memiliki akses cepat ke form Username & Password di bagian bawah panel untuk masuk ke mode pengelolaan.
- **Nilai Utama**: Menciptakan kesan pertama (*first impression*) yang megah dan profesional layaknya turnamen resmi MPL/M-Series.

---

## 2. Pengalaman Pengguna (UX) & Desain Visual

### A. Animasi Latar & Karakter Layla (2.5D Live-Illusion)
- **Breathing & Parallax Motion**: Lapisan ilustrasi Layla bergerak halus naik-turun menyerupai efek bernapas (*idle character animation*) dan bergeser secara perspektif 3D berlawanan arah kursor mouse.
- **Gelombang Energi & Kilau Bintang**: Cincin aura *cyan-gold* berdenyut di belakang Layla, disertai kilau cahaya bintang di jari Layla dan partikel kristal *Land of Dawn* yang melayang naik.
- **Jejak Kilat Kursor (Interactive Cursor Sparks)**: Setiap gerakan mouse di layar memicu percikan partikel cahaya elektrik emas-biru yang perlahan memudar.

### B. Panel Hologram 3D & Tata Letak Hirarki Baru
- **Mahkota Panel (Mythic Glory Crest & Shimmering Trophy)**: Di puncak kartu terdapat lambang trofi emas beranimasi *shimmer* dengan sayap *Mythic Glory* yang berpendar.
- **Live Tournament Announcement Ticker**: Baris pengumuman berjalan/berganti otomatis yang menampilkan nama turnamen aktif, total hadiah, tanggal *Match Day*, dan lencana berdenyut **"PENDAFTARAN DIBUKA"**.
- **Tombol Portal Heroik Pengunjung (Posisi Atas)**: Tombol berukuran besar dengan bingkai logam emas *beveled*, kilatan cahaya menyapu (*light sweep*), dan efek gelombang saat disentuh kursor untuk langsung memicu *Loading Screen Alucard & Layla* menuju Lobby.
- **Form Login Panitia (Posisi Bawah)**: Dipisahkan oleh pembatas ornamen *rune* emas, berisi input **Username** dan **Password** berbingkai sudut miring (*chamfered*) yang menyala emas saat diketik.

---

## 3. Keputusan Produk & Rasionalitas

- **Keputusan 1: Teknik 2.5D Parallax & Aura Rig untuk Karakter Layla**
  - *Pendekatan*: Menggabungkan transformasi perspektif 3D berbasis posisi kursor, animasi *breathing scale/translate*, serta lapisan efek cahaya lokal pada titik kunci ilustrasi Layla (ujung jari, tabung energi *Malefic*, dan latar langit).
  - *Alasan*: Menjaga kemiripan 100% dengan gambar referensi Layla yang Anda unggah sekaligus memberikan sensasi hidup dan kedalaman 3D tanpa mengubah wajah/gaya seni asli gambar.
- **Keputusan 2: Penempatan Portal Heroik Pengunjung di Atas Form Panitia**
  - *Pendekatan*: Menjadikan tombol masuk pengunjung sebagai pusat gravitasi visual di paruh atas kartu, sedangkan form login panitia ditempatkan secara rapi di paruh bawah.
  - *Alasan*: Mayoritas pengguna yang membuka website adalah peserta dan penonton; menempatkan portal pengunjung di atas beserta *ticker* turnamen aktif memastikan mereka langsung masuk tanpa bingung melihat kolom *username/password*.

---

## 4. Arsitektur Teknis & Aliran Interaksi

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   GERBANG LOGIN 2.5D / 3D ARENADAWN MLBB                   │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        ▼                                                           ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│   KANVAS LATAR 2.5D & EFEK KURSOR     │   │    PANEL HOLOGRAM 3D (MOUSE TILT)     │
│                                       │   │                                       │
│ • Lapisan Layla Breathing & Parallax  │   │ 1. Lencana Mythic Glory & Trofi Emas  │
│ • Gelombang Energi & Kilau Jari Layla │   │ 2. Ticker Pengumuman Turnamen Aktif   │
│ • Partikel Kristal Melayang           │   │ 3. TOMBOL PORTAL HEROIK PENGUNJUNG    │
│ • Jejak Kilat Interaktif Saat Mouse   │   │ ── Pembatas Ornamen Land of Dawn ──   │
│   Bergerak di Layar                   │   │ 4. Form Username & Password Panitia   │
└───────────────────────────────────────┘   └───────────────────┬───────────────────┘
                                                                │
                                      ┌─────────────────────────┴───────────────────┐
                                      ▼                                             ▼
                      ┌───────────────────────────────┐             ┌───────────────────────────────┐
                      │  Klik Portal Heroik Pengunjung│             │  Submit Login Admin / Panitia │
                      │        (Tanpa Password)       │             │   (Autentikasi Cloud/Firebase)│
                      └───────────────┬───────────────┘             └───────────────┬───────────────┘
                                      └──────────────────────┬──────────────────────┘
                                                             ▼
                                      ┌─────────────────────────────────────────────┐
                                      │   LOADING SCREEN EPIC (ALUCARD & LAYLA)     │
                                      │   Progress 0% -> 100% -> Masuk Lobby Utama  │
                                      └─────────────────────────────────────────────┘
```

### Pemetaan State & Interaksi Komponen
- **Pelacakan Posisi Kursor (`mouseX`, `mouseY`)**: Menghitung kemiringan 3D panel (`rotateX`, `rotateY`), pergeseran *parallax* latar Layla, koordinat pantulan cahaya hologram, serta memunculkan partikel kilat kursor (*cursor spark trail*).
- **Sinkronisasi Ticker Turnamen**: Membaca daftar turnamen aktif dari state utama (atau menampilkan informasi unggulan apabila data sedang dimuat) dan merotasikan pengumuman secara otomatis setiap beberapa detik.
- **Alur Autentikasi Utuh**: Tombol Portal Pengunjung memanggil `onVisitor()`, sedangkan form Login Panitia memvalidasi `username` dan `password` melalui `loginWithUsername()` lalu memanggil `onStaffLogin()`.
