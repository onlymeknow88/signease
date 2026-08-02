# 🖋️ PDFinaja - Client-Side PDF Signer & Annotator

PDFinaja adalah aplikasi penandatanganan dan pengeditan PDF berbasis Next.js yang berjalan **100% di sisi klien (client-side)**. Dokumen PDF yang Anda pilih tidak pernah diunggah atau disimpan ke server mana pun, memberikan tingkat privasi dan keamanan data yang maksimal bagi pengguna.

---

## ✨ Fitur Utama

- **🔒 Keamanan & Privasi Total (100% Client-Side)**
  Pemrosesan dokumen dilakukan sepenuhnya di dalam browser menggunakan `pdf-lib` dan `pdfjs-dist`. Tidak ada file yang keluar dari perangkat Anda.
- **✍️ Kanvas Tanda Tangan Interaktif**
  Tanda tangani berkas menggunakan pad gambar tanda tangan berbasis kanvas (`react-signature-canvas`). Anda juga dapat menyimpan tanda tangan tersebut agar bisa langsung digunakan kembali di masa mendatang.
- **💬 Anotasi Teks Dinamis**
  Tambahkan keterangan teks pada PDF Anda dengan kontrol pemformatan lengkap:
  - Pilihan jenis font (*Font Family*)
  - Ukuran teks (*Font Size*)
  - Pilihan warna kustom (*Hex Color*)
  - Efek teks: Tebal (*Bold*), Miring (*Italic*), dan Garis Bawah (*Underline*)
- **📜 Jaminan Integritas Dokumen (SHA-256)**
  Setiap kali dokumen berhasil ditandatangani dan diunduh, aplikasi akan secara otomatis menghitung nilai *hash* SHA-256 dari PDF tersebut. Riwayat tanda tangan dan integritas berkas dapat dilihat melalui Panel Sertifikat Digital.
- **💼 Skema Keanggotaan & Watermark**
  - **Free Plan**: Tanda tangan gratis tanpa batas dengan penambahan *watermark* diagonal samar dan catatan kaki (*footer*) berlabel "Signed with PDFinaja Free".
  - **Pro Plan**: Unduhan PDF bersih tanpa *watermark*, penambahan logo/branding kustom, dan dukungan prioritas.
- **🔑 Autentikasi Keamanan Ganda**
  Sistem autentikasi didukung oleh **NextAuth** dengan **Supabase Database Adapter**, memungkinkan pengguna masuk via:
  - **Google OAuth (SSO)**
  - **Email OTP (One-Time Password)** menggunakan pengiriman email aman via Nodemailer.

---

## 🛠️ Teknologi (Tech Stack)

Aplikasi dibangun menggunakan teknologi modern:

- **Framework Utama**: Next.js 16 (App Router) & React 19 (TypeScript)
- **Styling**: Tailwind CSS v4 & Vanilla CSS
- **PDF Engine**:
  - `pdf-lib` (untuk penyematan gambar tanda tangan, watermark, dan modifikasi byte PDF)
  - `pdfjs-dist` (untuk rendering lembar PDF ke kanvas web)
- **Manajemen Status**: Zustand (Zustand Store) untuk manajemen sinkronisasi data antar modul editor dan panel
- **Database & Auth**: Supabase (PostgreSQL), NextAuth v4 (Supabase Adapter)
- **Email Service**: Nodemailer (untuk pengiriman kode OTP login)

---

## 🚀 Instalasi dan Langkah Awal

### 1. Prasyarat
Pastikan Anda memiliki hal-hal berikut:
- **Node.js** versi 18 atau yang lebih baru.
- Akun **Supabase** untuk basis data (database).
- Akun **Google Cloud Console** (jika ingin mengaktifkan Google Sign-in).
- Server **SMTP** (seperti Gmail App Password atau layanan pengiriman email lainnya) untuk pengiriman OTP.

### 2. Mengkloning & Mempersiapkan Repositori
Masuk ke direktori proyek utama:
```bash
cd app
```

Pasang semua dependensi yang diperlukan:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin berkas contoh konfigurasi `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Buka `.env.local` dan lengkapi nilai variabel lingkungan berikut:
```env
# NextAuth Configuration
NEXTAUTH_SECRET=masukkan_secret_nextauth_disini
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Credentials (untuk SSO)
GOOGLE_CLIENT_ID=client_id_google_anda
GOOGLE_CLIENT_SECRET=client_secret_google_anda

# Supabase Credentials (untuk Database Adapter)
NEXT_PUBLIC_SUPABASE_URL=url_proyek_supabase_anda
SUPABASE_SERVICE_ROLE_KEY=service_role_key_supabase_anda

# SMTP Email Configuration (Nodemailer untuk login OTP)
SMTP_USER=email_anda@domain.com
SMTP_PASSWORD=password_aplikasi_atau_app_password
```

### 4. Setup Database Schema (Supabase)
Masuk ke dashboard proyek Supabase Anda, buka **SQL Editor**, salin isi dari berkas `supabase_schema.sql` yang ada di root folder `app/`, lalu klik **Run** untuk membuat tabel-tabel berikut:
- `users`: Menyimpan informasi user.
- `accounts`: Menyimpan akun tertaut OAuth.
- `sessions`: Menyimpan sesi aktif NextAuth.
- `verification_tokens`: Menyimpan token verifikasi email OTP.

---

## 🧪 Skrip Utilitas (Testing & Validasi)

Terdapat beberapa skrip utilitas di folder root `app/` untuk mempermudah Anda melakukan uji coba integrasi basis data:

1. **Uji Koneksi Supabase**:
   Verifikasi apakah kredensial database Anda berfungsi dan terhubung dengan benar.
   ```bash
   node test-supabase.js
   ```
2. **Validasi Kunci Utama Pengguna (UUID vs Integer)**:
   Mengecek apakah tabel `users` di Supabase menggunakan tipe data UUID (standar NextAuth) atau tipe data Integer lawas.
   ```bash
   node check-schema.js
   ```
3. **Uji Integrasi Skema Adapter**:
   Melakukan simulasi penyisipan data user & account tiruan untuk memastikan adapter NextAuth dapat menulis ke database Supabase tanpa galat.
   ```bash
   node check-adapter-schema.js
   ```

---

## 💻 Menjalankan Aplikasi

### Mode Pengembangan (Development)
Jalankan server lokal dalam mode pengembangan:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda untuk mengakses aplikasi.

### Produksi (Production Build)
Untuk membangun dan menjalankan aplikasi untuk lingkungan produksi:
```bash
npm run build
npm run start
```

---

## 📁 Struktur Folder Utama

```
app/
├── public/                 # Aset publik (gambar, favicon, logo)
├── src/
│   ├── app/                # Route & Halaman Utama Next.js (App Router)
│   │   ├── app/            # Halaman Workspace Editor PDF (/app)
│   │   ├── login/          # Halaman Masuk
│   │   ├── register/       # Halaman Daftar Akun
│   │   ├── verify-otp/     # Halaman Verifikasi Kode OTP
│   │   ├── pricing/        # Halaman Pilihan Paket Langganan
│   │   ├── account/        # Pengaturan Profil & Riwayat Tagihan
│   │   └── page.tsx        # Halaman Landing Utama
│   ├── components/         # Komponen UI Reusable
│   │   ├── PDFViewer.tsx   # Pembaca & Perender File PDF
│   │   ├── AnnotationLayer.tsx # Mengelola render anotasi (Teks & Tanda Tangan)
│   │   ├── SignaturePad.tsx # Pad gambar untuk membuat Tanda Tangan baru
│   │   ├── Toolbar.tsx     # Bilah alat pemilihan anotasi
│   │   ├── RightPanel.tsx  # Panel properti teks, watermark, & sertifikat
│   │   └── DropZone.tsx    # Area seret-lepas (drag-drop) file PDF
│   └── lib/                # Fungsi logis & Utilitas pendukung
│       ├── store.ts        # Zustand State Store (PDF Bytes, Annotations, Undo/Redo)
│       ├── auth.ts         # Konfigurasi NextAuth (Supabase Adapter, providers)
│       ├── types.ts        # Definisi TypeScript interface
│       └── utils.ts        # Helper helper penunjang
├── supabase_schema.sql     # Skrip inisialisasi tabel basis data PostgreSQL
├── package.json            # Daftar dependensi & perintah NPM
└── README.md               # Dokumentasi proyek (Dokumen ini)
```
