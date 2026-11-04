# Deploy ke Firebase

Hosting + Firestore + Auth + Cloud Functions (region `asia-southeast2`). Pola sama dengan PUBGM-CRP.

## Sekali saja, di Firebase Console
1. Buat project baru. **Upgrade ke Blaze** (wajib untuk Functions) dan pasang *budget alert*.
2. **Authentication → Sign-in method → Email/Password → Enable.**
3. **Firestore Database → Create database** (production mode, lokasi `asia-southeast2`).
4. **Project settings → Your apps → Web app**, salin konfigurasi ke `.env.local` (lihat `.env.example`).
5. Samakan project ID di `.firebaserc` (sudah `arenadawn-mlbb`).

## Storage (logo tim dan foto player)
Buka **Build → Storage → Get started** (lokasi `asia-southeast2`), lalu deploy aturannya. Saat CLI menanyakan izin lintas-layanan untuk membaca peran dari Firestore, jawab **Y**.
```bash
firebase deploy --only firestore:rules,storage
```
Tanpa Storage, penyimpanan data yang memuat foto/logo baru gagal dengan pesan "Gagal menyimpan ke server".

## Deploy
```bash
npm install -g firebase-tools && firebase login
npm install --legacy-peer-deps
npm --prefix functions install
npm run build && firebase deploy
```

## Akun awal
```bash
gcloud auth application-default login
GCLOUD_PROJECT=<project-id> node scripts/seed-users.mjs
```
Login memakai username (`admin`, `panitia1`…`panitia4`). Password acak tercetak sekali; ganti lewat tombol Ganti Password.

## Peran
- **Pengunjung**: tombol "Masuk Pengunjung", tanpa login. Hanya membaca; boleh mengirim pendaftaran ke turnamen dan pendaftaran tim/player ke Database (masuk antrean).
- **Panitia**: semua fitur operasional (turnamen, verifikasi, skor, database).
- **Admin**: sama seperti panitia + Manajemen User.

## Catatan
- Data publik ada di dokumen `app/state` (ditulis staf, satu dokumen, batas 1 MB). Dua staf yang mengedit bersamaan: yang terakhir menyimpan menang.
- Nomor WhatsApp kapten dan bukti pembayaran hanya terbaca staf (`app/private`, koleksi `registrations`).
- Pendaftaran publik ditulis langsung ke Firestore (dijaga `firestore.rules`). Pertimbangkan **App Check** bila ada spam.
