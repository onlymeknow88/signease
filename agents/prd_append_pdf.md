# Plan: Fitur "Tambah Halaman PDF" ke Dokumen Aktif

## Overview

Fitur ini memungkinkan user menambahkan halaman dari PDF lain ke PDF yang sedang aktif di workspace `/app` — langsung di browser, tanpa upload ke server.

**Entry Point**: Tombol "Tambah PDF" di `TopNavBarWorkspace` di sebelah kiri tombol "Unduh".

---

## Cara Kerja (100% Client-Side)

```
User klik "Tambah PDF"
  → File picker terbuka (accept=".pdf")
  → User pilih PDF kedua
  → pdf-lib: load PDF kedua
  → pdf-lib: copy semua halaman PDF kedua ke PDF aktif
  → Update pdfBytes di store → PDFViewer re-render otomatis
  → totalPages update → thumbnail panel update
```

Menggunakan `PDFDocument.load()` + `copyPages()` dari `pdf-lib` yang sudah ada.

---

## Posisi Append

Tiga opsi posisi halaman baru:
1. **Di akhir** (default, paling umum) — append setelah halaman terakhir
2. **Di awal** — prepend sebelum halaman pertama
3. **Setelah halaman aktif** — insert setelah `currentPage`

MVP: hanya "di akhir". Enhancement: modal pilih posisi.

---

## Perubahan yang Diperlukan

### 1. `src/lib/store.ts`
Tambah action baru:
```typescript
appendPdfPages: (newPdfBytes: Uint8Array, position: "end" | "start" | "after-current") => Promise<void>
```
Logic:
- Load `pdfBytes` aktif dengan `PDFDocument.load()`
- Load PDF baru dengan `PDFDocument.load()`
- `copyPages()` dari PDF baru ke PDF aktif sesuai posisi
- `save()` → update `pdfBytes`, `totalPages`, reset `currentPage` jika perlu

### 2. `src/components/TopNavBarWorkspace.tsx`
Tambah tombol "Tambah PDF" di area kanan header:
- Hidden `<input type="file" accept=".pdf">` ref
- Tombol trigger file picker
- `onChange` → baca file sebagai `ArrayBuffer` → call `appendPdfPages()`
- Loading state saat proses berlangsung

### 3. Tidak perlu perubahan lain
- `PDFViewer` sudah reactive ke `pdfBytes` — re-render otomatis
- `ThumbnailPanel` sudah reactive ke `totalPages`
- `annotations` tetap, tidak terganggu (page index existing tetap valid)

---

## UI

```
[Logo] [nama file] [Disimpan]     [Undo] [Redo] | [-] [100%] [+]     [+ Tambah PDF] [Unduh ▾]
```

Tombol "Tambah PDF":
- Icon: `FilePlus` dari lucide-react
- Style: outline button (tidak primary — agar tidak dominan)
- Disabled saat tidak ada PDF aktif atau sedang loading
- Loading spinner saat proses append berlangsung

---

## Error Handling

- PDF terproteksi/password → catch error → toast "PDF ini dilindungi password"
- File bukan PDF valid → catch error → toast "File tidak valid"
- Memory error (file terlalu besar) → catch error → toast "File terlalu besar"

---

## Estimasi Effort

- `store.ts`: ~20 baris
- `TopNavBarWorkspace.tsx`: ~40 baris
- Total: 1-2 jam implementasi

---

## Tidak Termasuk (Future)

- Modal pilih posisi (awal/akhir/setelah halaman aktif)
- Preview halaman PDF yang akan ditambahkan
- Pilih halaman tertentu dari PDF kedua (sudah ada di fitur merge)

---

**Status**: Ready for implementation
**Tanggal**: 2026-08-03
