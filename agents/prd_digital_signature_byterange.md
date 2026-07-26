# Implementation Plan — Perbaikan Alur Tanda Tangan & Sertifikat

## Latar Belakang Masalah

### Masalah 1: Tanda Tangan Tidak Tersimpan
Tanda tangan visual yang dibuat pengguna (gambar/coretan) hanya disimpan di **memori zustand** dan hilang setiap kali halaman di-refresh atau sesi berakhir. Pengguna harus membuat ulang tanda tangan setiap kali membuka SignEase.

**Kondisi saat ini:** `savedSignatures: string[]` di `store.ts` — hanya dalam memori, tidak ada persistensi.

### Masalah 2: Dialog Sertifikat Muncul Saat Download
Alur saat ini:
```
[Gunakan Tanda Tangan] → Tanda tangan ditempatkan → [Unduh] → Dialog password sertifikat
```

**Yang diinginkan pengguna:**
```
[Gunakan Tanda Tangan] → Dialog: Pilih Sertifikat + Input Password → Tanda tangan ditempatkan → [Unduh] langsung tanpa dialog tambahan
```

---

## Perubahan yang Direncanakan

### Komponen 1: Database Schema

#### [MODIFY] [schema.prisma](file:///Users/user/Documents/Framework/react/signease/prisma/schema.prisma)
Tambahkan model `SavedSignature` baru:
```prisma
model SavedSignature {
  id        Int      @id @default(autoincrement())
  userId    Int
  name      String?  @db.VarChar(100)   // Nama tampilan, mis. "Tanda Tangan 1"
  dataUrl   String   @db.LongText       // Base64 PNG data URL tanda tangan
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("saved_signatures")
}
```

Tambahkan relasi di model `User`:
```prisma
savedSignatures SavedSignature[]
```

---

### Komponen 2: API Routes

#### [NEW] `src/app/api/signatures/route.ts`
- `GET /api/signatures` → Ambil semua tanda tangan milik user yang login
- `POST /api/signatures` → Simpan tanda tangan baru ke database
- `DELETE /api/signatures?id=<id>` → Hapus tanda tangan

---

### Komponen 3: Store State

#### [MODIFY] [src/lib/store.ts](file:///Users/user/Documents/Framework/react/signease/src/lib/store.ts)

Tambah tipe untuk tanda tangan tersimpan:
```typescript
// Sebelum: savedSignatures: string[]
// Sesudah:
interface SavedSignatureRecord {
  id: number;
  name: string | null;
  dataUrl: string;
  createdAt: string;
}
savedSignatures: SavedSignatureRecord[];
```

Tambah action baru:
```typescript
loadSavedSignatures: () => Promise<void>;  // Fetch dari DB
addSavedSignature: (dataUrl: string, name?: string) => Promise<void>;  // POST ke DB lalu update state
removeSavedSignature: (id: number) => Promise<void>;  // DELETE ke DB lalu update state
```

Tambah state untuk menyimpan sertifikat yang sudah dipilih **sebelum** download:
```typescript
// Sertifikat & password sudah diisi saat "Gunakan Tanda Tangan" — langsung digunakan saat unduh
pendingCertId: number | null;
pendingCertPassword: string | null;
setPendingCert: (id: number | null, password: string | null) => void;
```

---

### Komponen 4: SignaturePad.tsx

#### [MODIFY] [src/components/SignaturePad.tsx](file:///Users/user/Documents/Framework/react/signease/src/components/SignaturePad.tsx)

**Perubahan alur `handleApply`:**
- Setelah gambar/coretan selesai dibuat, **jangan langsung tutup dialog**
- Setelah tanda tangan dibuat, tampilkan **langkah ke-2** di dalam dialog yang sama (atau dialog baru):
  - Dropdown/selector **Pilih Sertifikat** (dari daftar sertifikat di store)
  - Input **Password Sertifikat**
  - Opsi "Lanjutkan Tanpa Sertifikat" (tombol sekunder)
- Setelah sertifikat & password dikonfirmasi → simpan ke `pendingCertId` & `pendingCertPassword` di store
- Simpan tanda tangan ke database (POST `/api/signatures`)
- Aktifkan mode placing di PDF

**Perubahan tampilan library tanda tangan:**
- Toolbar tanda tangan akan menampilkan tanda tangan yang sudah ada dari DB (bukan hanya session ini)
- Setiap item di library punya tombol ✕ untuk hapus dari DB

---

### Komponen 5: Toolbar.tsx

#### [MODIFY] [src/components/Toolbar.tsx](file:///Users/user/Documents/Framework/react/signease/src/components/Toolbar.tsx)

- Panggil `loadSavedSignatures()` saat komponen mount
- Tampilkan tanda tangan tersimpan dari DB di panel dropdown signature
- Tambah tombol hapus (✕) pada setiap tanda tangan

---

### Komponen 6: TopNavBarWorkspace.tsx

#### [MODIFY] [src/components/TopNavBarWorkspace.tsx](file:///Users/user/Documents/Framework/react/signease/src/components/TopNavBarWorkspace.tsx)

**Ubah alur unduh:**
- Karena sertifikat sudah dipilih & password sudah dimasukkan saat `handleApply`, tombol Unduh **tidak perlu lagi menampilkan dialog password**
- `handleDownloadPdf` cukup memanggil `downloadSignedPdf(pendingCertPassword ?? undefined)` langsung
- Hapus state `showPasswordDialog` yang sudah tidak diperlukan

---

### Komponen 7: downloadSignedPdf di store.ts

#### [MODIFY] [src/lib/store.ts](file:///Users/user/Documents/Framework/react/signease/src/lib/store.ts)

Update `downloadSignedPdf` untuk menggunakan `pendingCertId` dan `pendingCertPassword` yang sudah tersimpan di store, sehingga tidak perlu parameter dari luar.

---

## Alur Baru (Setelah Perbaikan)

```
┌─────────────────────────────────────────────────────────────┐
│                    ALUR BARU PENANDATANGANAN                │
└─────────────────────────────────────────────────────────────┘

1. Buka Panel "Tanda Tangan"
   ├── Library tanda tangan dari DB muncul otomatis
   ├── Pilih tanda tangan yang sudah ada → LANGSUNG ke langkah 4
   └── Klik "Buat Baru" → Buka modal SignaturePad

2. Di Modal SignaturePad: Buat Tanda Tangan
   └── Gambar / Ketik / Upload → Klik "Gunakan Tanda Tangan"

3. Langkah 2 di Modal yang sama: Pilih Sertifikat (Opsional)
   ├── Dropdown: Pilih sertifikat (atau "Tanpa Sertifikat")
   ├── Input: Password sertifikat (jika pilih sertifikat)
   └── Klik "Konfirmasi" → Tanda tangan + cert info tersimpan di state

4. Tanda tangan ditempatkan di PDF (mode placing aktif)

5. Klik "Unduh" → PDF langsung diproses & diunduh (tanpa dialog tambahan)
   ├── Jika pendingCertId ada → sign dengan sertifikat + TSA timestamp
   └── Jika tidak → sign visual saja
```

---

## Perbandingan Alur Lama vs Baru

| | Alur Lama | Alur Baru |
|---|---|---|
| **Library tanda tangan** | Hilang setelah refresh | ✅ Tersimpan di database |
| **Membuat tanda tangan baru** | Buat setiap sesi | ✅ Sekali buat, pakai berulang |
| **Pemilihan sertifikat** | Saat klik Unduh | ✅ Saat klik "Gunakan Tanda Tangan" |
| **Dialog saat Unduh** | Ada (password dialog) | ✅ Langsung unduh, no dialog |
| **Jumlah langkah keseluruhan** | 5 langkah | ✅ 3 langkah efektif |

---

## Rencana Migrasi Database

```bash
# 1. Update prisma/schema.prisma (tambah model SavedSignature)
# 2. Buat migrasi
npx prisma migrate dev --name add_saved_signatures

# 3. Generate Prisma Client
npx prisma generate
```

---

## Verification Plan

### Skenario Test
1. **Buat tanda tangan baru** → Refresh halaman → Tanda tangan masih ada di library ✅
2. **Pilih tanda tangan dari library** → Sertifikat sudah dipilih → Klik Unduh → PDF langsung terunduh ✅
3. **Hapus tanda tangan dari library** → Hilang dari DB dan UI ✅
4. **Unduh tanpa sertifikat** → Visual signing saja, langsung tanpa dialog ✅
5. **TypeScript compile**: `npx tsc --noEmit` bersih ✅

> [!IMPORTANT]
> **Keputusan desain yang perlu dikonfirmasi:**
> Apakah ketika pengguna memilih tanda tangan dari library (yang sudah ada di DB), dialog pemilihan sertifikat juga harus muncul lagi? Atau langsung menggunakan sertifikat yang terakhir dipakai?

> [!NOTE]
> **Base64 PNG di database:** Data URL tanda tangan bisa berukuran 20-100KB per gambar. Ini wajar untuk database MySQL dengan tipe `LongText`. Jika di masa depan skalanya besar, bisa dipertimbangkan pindah ke file storage (S3 / Cloudinary), namun untuk sekarang DB cukup.
