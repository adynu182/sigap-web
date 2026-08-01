# SIGAP — Gap Assessment SPPG

Self-assessment kepatuhan HACCP/GMP untuk Satuan Pelayanan Pemenuhan Gizi
(SPPG). Dibangun dengan Next.js 16 (TypeScript) + Tailwind CSS v4 di frontend,
dan Firebase (Auth + Firestore + Storage) di backend — semuanya bisa berjalan
di tingkat gratis (Firebase Spark + Vercel Hobby).

## Fitur

- Registrasi SPPG mandiri, diverifikasi admin sebelum bisa login
- Assessment 141 klausul (data asli dari sistem lama), satu klausul per layar
- Kategori Conformity / Minor / Major + catatan temuan (pola PLOR) + foto bukti
- Peta gap (grid mosaic) untuk melihat progres sekilas
- Ekspor hasil ke Excel per SPPG, maupun backup seluruh data sekaligus (admin)
- Panel admin: approve/reject SPPG, kelola daftar pertanyaan, lihat detail tiap SPPG
- Firestore Security Rules: setiap SPPG hanya bisa membaca/menulis datanya sendiri

## 1. Buat project Firebase

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (gratis, tidak perlu kartu kredit untuk paket Spark).
2. **Build → Authentication → Get started** → aktifkan sign-in method **Email/Password**.
3. **Build → Firestore Database → Create database** → pilih **Production mode** → pilih region (mis. `asia-southeast2` / Jakarta).
4. **Build → Storage → Get started** → pilih region yang sama.
5. Di **Project settings → General → Your apps**, klik ikon web (`</>`) untuk mendaftarkan web app baru, lalu salin nilai `firebaseConfig` yang muncul.

## 2. Konfigurasi lokal

```bash
npm install
cp .env.local.example .env.local
```

Isi `.env.local` dengan nilai dari `firebaseConfig` tadi (semua variabel `NEXT_PUBLIC_FIREBASE_*`).

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## 3. Deploy Security Rules

Ini **wajib** — tanpa rules ini, database akan memakai rules default yang menolak semua akses (atau, kalau salah pilih mode saat membuat database, mengizinkan semua akses ke siapa saja). Gunakan Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pilih project Firebase yang tadi dibuat
firebase deploy --only firestore:rules,storage
```

Atau, kalau tidak mau install CLI: buka **Firestore Database → Rules** di console, tempel isi file `firestore.rules`, klik **Publish** — ulangi hal yang sama untuk **Storage → Rules** dengan isi `storage.rules`.

## 4. Buat akun pertama & isi pertanyaan

1. Jalankan app-nya, klik **Daftarkan SPPG**, daftar dengan email Anda sendiri.
2. Akun baru selalu berstatus "menunggu verifikasi" (SPPG biasa) — ini untuk keamanan, supaya tidak ada yang bisa langsung memberi diri sendiri akses admin.
3. Untuk menjadikan akun ini **admin**: buka Firebase Console → **Firestore Database** → koleksi `sppgProfiles` → cari dokumen dengan email Anda → ubah field `role` menjadi `admin` dan `status` menjadi `approved`.
4. Login ulang. Anda akan masuk ke panel Admin.
5. Buka **Admin → Pertanyaan** → klik **Isi 141 klausul contoh** untuk mengisi daftar pertanyaan asli dari sistem lama (sekali klik, sekali jalan).
6. SPPG lain yang mendaftar setelah ini bisa Anda **setujui** dari **Admin → SPPG**.

## 5. Push ke GitHub & deploy ke Vercel

```bash
git init
git add .
git commit -m "Initial commit: SIGAP"
gh repo create sigap --private --source=. --push
# atau buat repo manual di github.com lalu:
# git remote add origin <url-repo-anda>
# git push -u origin main
```

Di [vercel.com](https://vercel.com):

1. **Add New → Project** → import repo GitHub tadi.
2. Di langkah **Environment Variables**, masukkan semua variabel yang sama seperti di `.env.local`.
3. **Deploy**.

Setelah deploy, tambahkan domain Vercel Anda (mis. `sigap.vercel.app`) ke **Firebase Console → Authentication → Settings → Authorized domains**, atau login akan ditolak oleh Firebase.

## Struktur data (Firestore)

```
sppgProfiles/{uid}          -- profil SPPG atau admin
  answers/{questionId}      -- subkoleksi: jawaban SPPG tsb per klausul
questions/{questionId}      -- daftar master 141 klausul (dikelola admin)
```

## Batasan versi uji coba ini

- Backup otomatis terjadwal belum ada — gunakan tombol **Ekspor** (per SPPG) atau **Backup semua data** (admin) secara manual. Untuk backup terjadwal, opsi berikutnya: Cloud Function + Cloud Scheduler, atau upgrade ke Firebase Blaze plan.
- Foto lama tidak otomatis terhapus dari Storage saat diganti — cukup ringan untuk skala uji coba, tapi perlu dibersihkan berkala kalau volume foto besar.
- Belum ada rate limiting / App Check di sisi Firebase — pertimbangkan mengaktifkan **App Check** sebelum dipakai lebih luas.
