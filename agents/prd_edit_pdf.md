# Plan: Fitur Edit PDF — PDFinaja

**Tanggal**: 2026-08-03  
**Status**: Draft  
**Scope**: Editing halaman PDF yang sedang aktif di workspace `/app`

---

## Apakah Bisa?

**Ya, bisa 100% client-side** menggunakan `pdf-lib` yang sudah ada.

Limitasi utama:
- Tidak bisa edit *teks asli* PDF secara langsung (teks yang sudah di-bake) — tapi bisa di-overlay dengan teks baru di atas posisi yang sama
- Yang bisa dilakukan: operasi halaman (hapus, rotasi, reorder, sisipkan), konten baru (overlay teks, gambar, anotasi), dan extract/edit teks via OCR

---

## PDF Text Extraction & OCR

### Untuk PDF Digital (punya text layer)

`pdfjs-dist` yang sudah ada di project bisa extract teks + koordinat posisinya:

```javascript
const page = await pdf.getPage(1);
const textContent = await page.getTextContent();
// Tiap item: { str, transform: [sx, shx, shy, sy, tx, ty] }
// tx, ty = posisi x,y di halaman
```

Ini cukup untuk PDF digital — teks bisa di-extract lalu ditampilkan sebagai editable text overlay di AnnotationLayer.

### Untuk PDF Scan (berisi gambar)

Perlu OCR engine. Opsi yang tersedia:

| Package | Deskripsi | Size | Akurasi |
|---|---|---|---|
| **`tesseract.js`** | Tesseract OCR via WebAssembly, 100% client-side | ~10MB WASM | Bagus untuk teks cetak |
| **`@paddle-ocr/paddleocr`** | PaddleOCR, lebih akurat untuk bahasa Asia | Besar | Sangat bagus |
| **Google Vision API** | Cloud OCR, server-side | - | Terbaik |

**Rekomendasi untuk PDFinaja**: `tesseract.js` — client-side, support bahasa Indonesia (`ind`), tidak perlu server.

```bash
npm install tesseract.js
```

### Flow Edit Teks PDF

```
Upload PDF
  ↓
Cek: ada text layer? (pdfjs-dist getTextContent)
  ├─ Ada text layer → extract teks + posisi langsung
  └─ Tidak ada (scan) → render page ke canvas → tesseract.js OCR
                         → hasilkan teks + bounding box
  ↓
Tampilkan teks sebagai editable annotation overlay di AnnotationLayer
  ↓
User edit → simpan sebagai text annotation
  ↓
Download: teks overlay di-bake ke PDF via pdf-lib
```

### Catatan Penting

- "Edit teks asli" di PDF = overlay teks baru di atas posisi teks lama — ini pendekatan yang dipakai Adobe Acrobat, Smallpdf, dan semua PDF editor populer
- `pdf-lib` tidak bisa modify existing text stream langsung di PDF — hanya bisa menambah konten baru di atas
- Untuk menyembunyikan teks asli sebelum overlay: bisa tambah white rectangle di atas teks lama via `pdf-lib` sebelum taruh teks baru

### Phase 4 — OCR & Text Edit (Week 4, Optional)

```
Toolbar → tombol "Edit Teks" 
→ masuk mode OCR/text-extract
→ pdfjs-dist: getTextContent() untuk PDF digital
→ tesseract.js: OCR untuk PDF scan
→ render hasil sebagai editable text boxes di AnnotationLayer
→ user edit teks
→ saat download: white rect overlay + teks baru via pdf-lib
```

**New dependency**:
```bash
npm install tesseract.js  # ~500KB gzip, WASM di-load lazy
```

---

## Fitur yang Bisa Diimplementasi

### Tier 1 — Operasi Halaman (Mudah, High Value)

| Fitur | Deskripsi | Library |
|---|---|---|
| **Hapus Halaman** | Hapus satu atau beberapa halaman dari PDF aktif | `pdf-lib` |
| **Rotasi Halaman** | Putar halaman 90°/180°/270° | `pdf-lib` |
| **Reorder Halaman** | Drag-and-drop urutan halaman via ThumbnailPanel | `pdf-lib` |
| **Duplicate Halaman** | Duplikat halaman tertentu | `pdf-lib` |
| **Sisipkan Halaman Kosong** | Tambah halaman blank di posisi tertentu | `pdf-lib` |

### Tier 2 — Konten Overlay (Sudah Sebagian Ada)

| Fitur | Deskripsi | Status |
|---|---|---|
| **Teks** | Tambah text box ke halaman | ✅ Sudah ada |
| **Tanda Tangan** | Tambah gambar tanda tangan | ✅ Sudah ada |
| **Simbol** | Check, cross, circle, box | ✅ Sudah ada |
| **Gambar/Foto** | Upload gambar (PNG/JPG) dan taruh di halaman | 🆕 Baru |
| **Garis & Shape** | Draw garis, rectangle, oval | 🆕 Baru (partial) |

### Tier 3 — Fitur Lanjutan (Complex)

| Fitur | Deskripsi | Feasibility |
|---|---|---|
| **Crop Halaman** | Potong area halaman | Medium |
| **Compress PDF** | Kurangi ukuran file | Medium |
| **Extract Halaman** | Ekstrak halaman tertentu jadi PDF baru | Easy |
| **Split PDF** | Pecah PDF menjadi beberapa file | Easy |
| **Watermark** | Tambah watermark teks/gambar | ✅ Sebagian ada |

---

## Implementasi Plan

### Phase 1 — Page Operations (Week 1)

**Target**: Operasi halaman via ThumbnailPanel yang sudah ada

#### 1.1 Hapus Halaman
```
ThumbnailPanel → tombol delete per halaman
→ store.deletePage(pageIndex)
→ pdf-lib: load pdfBytes, removePage(index), save()
→ update pdfBytes + totalPages di store
→ PDFViewer re-render otomatis
```

#### 1.2 Rotasi Halaman
```
ThumbnailPanel → tombol rotate per halaman
→ store.rotatePage(pageIndex, degrees)
→ pdf-lib: load pdfBytes, getPage(index).setRotation(degrees(deg)), save()
→ update pdfBytes di store
```

#### 1.3 Reorder Halaman
```
ThumbnailPanel → drag-and-drop thumbnail
→ store.reorderPages(fromIndex, toIndex)
→ pdf-lib: load pdfBytes, copyPages sesuai urutan baru, save()
→ annotations yang sudah ada perlu di-remap pageIndex
```

#### 1.4 Extract/Split Halaman
```
ThumbnailPanel → tombol extract per halaman
→ buat PDFDocument baru, copy halaman terpilih
→ trigger download langsung
```

---

### Phase 2 — Insert Content (Week 2)

#### 2.1 Upload Gambar ke Halaman
```
Toolbar → tombol insert image
→ file picker (PNG/JPG)
→ tambah ke AnnotationLayer sebagai annotation type "image"
→ saat download: embed image ke PDF via pdf-lib
```

#### 2.2 Shape Tools
```
Toolbar → rectangle, oval, line tools
→ draw on canvas sebagai annotation
→ saat download: embed shape ke PDF
```

---

### Phase 3 — Split & Compress (Week 3)

#### 3.1 Split PDF
```
TopNavBarWorkspace → tombol "Split"
→ modal: pilih range halaman per output file
→ buat multiple PDF dari range yang dipilih
→ download sebagai zip atau satu per satu
```

#### 3.2 Compress
```
Download dropdown → opsi "Unduh (Compressed)"
→ pdf-lib save dengan object reuse
→ image quality reduction (re-encode images)
```

---

## Perubahan yang Diperlukan per Phase

### Phase 1 — Store Actions Baru

```typescript
// src/lib/store.ts
deletePage: (pageIndex: number) => Promise<void>
rotatePage: (pageIndex: number, degrees: 0 | 90 | 180 | 270) => Promise<void>
reorderPages: (fromIndex: number, toIndex: number) => Promise<void>
duplicatePage: (pageIndex: number) => Promise<void>
insertBlankPage: (afterPageIndex: number) => Promise<void>
extractPage: (pageIndex: number) => Promise<void>
```

### Phase 1 — UI Changes

**`ThumbnailPanel.tsx`** — Tambah action buttons per thumbnail:
- 🗑 Hapus halaman
- ↻ Rotasi 90° kanan
- ⧉ Duplikat
- ↕ Drag handle untuk reorder

**`TopNavBarWorkspace.tsx`** — Tambah di dropdown Unduh:
- "Ekstrak Halaman Ini" (halaman aktif)

### Phase 2 — Annotation Type Baru

```typescript
// src/lib/types.ts
// Tambah type "image" ke SignatureAnnotation
type: "signature" | "text" | "image"
```

**`Toolbar.tsx`** — Tambah tombol "Upload Gambar"

---

## Prioritas Implementasi

```
1. Hapus Halaman       ← paling sering dibutuhkan
2. Rotasi Halaman      ← sering dibutuhkan untuk scan
3. Reorder Halaman     ← sudah ada thumbnail panel
4. Upload Gambar       ← high value untuk form filling
5. Split PDF           ← complement dari Merge PDF
6. Duplicate/Blank     ← nice to have
7. Compress            ← nice to have
```

---

## Catatan Teknis

### Annotations Remap saat Page Delete/Reorder
Saat halaman dihapus atau di-reorder, semua annotations yang ada perlu di-update `pageIndex`-nya:

```typescript
// Contoh untuk deletePage(deletedIndex):
const updatedAnnotations = annotations
  .filter(a => a.pageIndex !== deletedIndex)
  .map(a => ({
    ...a,
    pageIndex: a.pageIndex > deletedIndex ? a.pageIndex - 1 : a.pageIndex
  }));
```

### Tidak Perlu Library Baru
Semua fitur Phase 1 dan Phase 2 bisa diimplementasikan dengan `pdf-lib` yang sudah ada. Tidak perlu install dependency baru.

### 100% Client-Side
Sama seperti filosofi PDFinaja — tidak ada file yang keluar dari browser.

---

## Estimasi Effort

| Phase | Estimasi | Complexity |
|---|---|---|
| Phase 1: Page Operations | 3-4 hari | Low-Medium |
| Phase 2: Insert Content | 3-4 hari | Medium |
| Phase 3: Split & Compress | 2-3 hari | Medium |
| Phase 4: Edit Teks PDF | 4-5 hari | High |
| **Total** | **~3 minggu** | |

---

## Phase 4 — Edit Teks PDF (Detail)

### Konsep Dasar

"Edit teks PDF" bukan berarti modify text stream di dalam PDF — itu tidak mungkin dengan `pdf-lib`. Yang dilakukan adalah:

1. **Extract** teks + posisi dari PDF (via `pdfjs-dist` atau `tesseract.js`)
2. **Overlay** white rectangle di atas teks asli untuk "menyembunyikan" teks lama
3. **Tambah** teks baru di posisi yang sama via annotation
4. **Bake** saat download via `pdf-lib`

Ini persis pendekatan yang digunakan Adobe Acrobat, Smallpdf, ILovePDF, dan semua PDF editor populer.

---

### 4.1 — PDF Digital (Ada Text Layer)

Untuk PDF yang dibuat dari Word, Google Docs, atau tool digital lainnya — punya text layer yang bisa di-extract langsung.

**Tool**: `pdfjs-dist` (sudah ada di project, tidak perlu install baru)

```typescript
const page = await pdfDoc.getPage(pageIndex + 1);
const textContent = await page.getTextContent();
const viewport = page.getViewport({ scale: 1.0 });

textContent.items.forEach((item: any) => {
  const transform = item.transform;
  // transform = [sx, shx, shy, sy, tx, ty]
  // tx, ty = posisi X,Y di PDF coordinate space
  const x = transform[4];
  const y = transform[5];
  const fontSize = Math.sqrt(transform[0] ** 2 + transform[1] ** 2);
  const text = item.str;

  // Konversi PDF coords ke viewport coords
  const [vx, vy] = viewport.convertToViewportPoint(x, y);
  // → tampilkan sebagai editable text box di AnnotationLayer
});
```

**Koordinat Conversion**:
- PDF coordinate: origin kiri-bawah, Y naik ke atas
- Viewport/screen coordinate: origin kiri-atas, Y turun ke bawah
- `viewport.convertToViewportPoint(x, y)` handles konversi ini

---

### 4.2 — PDF Scan (Berisi Gambar, Tidak Ada Text Layer)

Untuk PDF hasil scan fisik atau foto yang di-convert ke PDF.

**Tool**: `tesseract.js` (perlu install)

```bash
npm install tesseract.js
```

```typescript
import Tesseract from 'tesseract.js';

// Render halaman PDF ke canvas (sudah ada di PDFViewer)
const canvas = ...; // canvas dari pdfjs-dist render

// OCR canvas
const result = await Tesseract.recognize(canvas, 'ind+eng', {
  logger: (m) => console.log(m), // progress callback
});

const { words } = result.data;
words.forEach((word) => {
  const { bbox, text } = word;
  // bbox: { x0, y0, x1, y1 } dalam pixel canvas coords
  // → konversi ke ratio → tampilkan sebagai editable text box
});
```

**Language Support**:
- `ind` = Bahasa Indonesia
- `eng` = English
- Bisa kombinasi: `'ind+eng'`

**Performance**:
- WASM di-load lazy (hanya saat fitur digunakan)
- Estimasi waktu OCR: 2-10 detik per halaman
- Progress indicator diperlukan

---

### 4.3 — Flow Lengkap Edit Teks

```
User klik tombol "Edit Teks" di Toolbar
  ↓
Toolbar masuk "text-edit mode"
  ↓
Cek text layer: pdfjs-dist getTextContent()
  ├─ Ada items → extract teks + posisi → tampilkan sebagai editable boxes
  └─ Kosong (scan) → show dialog "PDF ini adalah scan, jalankan OCR?"
                     → user konfirmasi → tesseract.js OCR
                     → tampilkan hasil sebagai editable boxes
  ↓
Setiap text item ditampilkan sebagai AnnotationLayer item dengan:
  - border dashed biru (seperti text annotation biasa)
  - text content = teks asli dari PDF
  - posisi = koordinat dari PDF/OCR
  - background = white (untuk overlay teks asli)
  ↓
User klik text box → masuk edit mode → ketik teks baru
  ↓
User selesai edit → klik di luar / Enter
  ↓
Saat Download:
  1. pdf-lib: tambah white rectangle di posisi teks asli
  2. pdf-lib: embed teks baru di posisi yang sama
  3. Save PDF
```

---

### 4.4 — Annotation Type Baru: "extracted-text"

Perlu tambah type baru di `SignatureAnnotation`:

```typescript
// src/lib/types.ts
type: "signature" | "text" | "extracted-text"

// "extracted-text" punya field tambahan:
interface ExtractedTextAnnotation extends BaseAnnotation {
  type: "extracted-text";
  text: string;
  originalText: string;    // teks asli dari PDF (untuk referensi)
  fontSize: number;        // font size dalam PDF points
  fontName?: string;       // nama font asli (jika tersedia)
  isOcrResult: boolean;    // dari OCR atau text layer
  // white background by default untuk sembunyikan teks asli
}
```

---

### 4.5 — UI Changes untuk Phase 4

**`Toolbar.tsx`**:
- Tambah tombol `manage_search` ("Edit Teks PDF")
- Saat aktif: masuk mode "text-extract", highlight semua text items

**`AnnotationLayer.tsx`**:
- Handle type `"extracted-text"` dengan rendering khusus
- White background otomatis
- Edit mode sama seperti text annotation biasa

**`store.ts`**:
```typescript
// Actions baru
extractTextFromPage: (pageIndex: number) => Promise<void>
isExtractingText: boolean  // loading state untuk OCR
```

**`src/lib/download.ts` atau `store.ts` downloadSignedPdf**:
- Handle `"extracted-text"` annotations saat baking ke PDF
- Tambah white rectangle → tambah teks baru via `pdf-lib`

---

### 4.6 — Perubahan Files

| File | Perubahan |
|---|---|
| `package.json` | Tambah `tesseract.js` |
| `src/lib/types.ts` | Tambah type `"extracted-text"` |
| `src/lib/store.ts` | Tambah `extractTextFromPage`, `isExtractingText` |
| `src/components/Toolbar.tsx` | Tambah tombol "Edit Teks PDF" |
| `src/components/AnnotationLayer.tsx` | Handle `"extracted-text"` type |
| `src/lib/store.ts` (download) | Bake extracted-text annotations ke PDF |

---

### 4.7 — Limitasi yang Perlu Dikomunikasikan ke User

- Font asli PDF mungkin tidak tersedia di browser → gunakan font terdekat
- Teks dengan rotasi/transformasi kompleks mungkin tidak tepat posisinya
- PDF dengan proteksi/enkripsi tidak bisa di-extract
- OCR tidak 100% akurat — user harus review hasil
- PDF scan dengan kualitas rendah → akurasi OCR menurun
- Proses OCR bisa lambat untuk halaman dengan banyak teks

