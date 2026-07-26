# SignEase — UI Redesign Design Document

> Blueprint implementasi Phase 1 berdasarkan UI baru (agents/ui.png) dan analisis codebase existing.
> Dokumen ini menjadi acuan agar implementasi tidak menyimpang dari codebase yang sudah ada.

---

## 1. Kondisi Codebase Saat Ini

### State Management (Zustand — src/lib/store.ts)

Store sudah memiliki:
- `pdfFile`, `pdfBytes`, `totalPages`, `currentPage`, `pdfScale`
- `annotations: SignatureAnnotation[]`
- `selectedAnnotationId`
- `history: SignatureAnnotation[][]` + `historyIndex` + `undo()` + `redo()`
- `activeTool: "select" | "text" | "cross" | "check" | "circle" | "line" | "dot" | "signature"`
- `savedSignatures: string[]` (base64 PNG, disimpan di localStorage via login)
- `user: { name, email, plan, loggedIn, provider }`
- `pdfHash`, `signedAt`
- `downloadSignedPdf()` — proses client-side sepenuhnya

### Types (src/lib/types.ts)

```typescript
interface SignatureAnnotation {
  id: string;
  xRatio: number;        // 0..1 relative to page width
  yRatio: number;        // 0..1 relative to page height
  widthRatio: number;
  heightRatio: number;
  pageIndex: number;     // 0-based
  imageDataUrl: string;  // base64 PNG
  type?: "signature" | "text";
  text?: string;
  textColor?: string;
  textSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
}
```

### Komponen Existing

| Komponen | File | Status |
|---|---|---|
| TopNavBar | src/components/TopNavBar.tsx | Dipakai di landing/auth pages |
| MainLayout | src/components/layouts/MainLayout.tsx | Wrapper landing page |
| Toolbar | src/components/Toolbar.tsx | Horizontal strip di workspace |
| RightPanel | src/components/RightPanel.tsx | Panel properti + sertifikat |
| PDFViewer | src/components/PDFViewer.tsx | Render PDF canvas |
| AnnotationLayer | src/components/AnnotationLayer.tsx | Overlay annotations |
| SignaturePad | src/components/SignaturePad.tsx | Modal gambar tanda tangan |
| DropZone | src/components/DropZone.tsx | Upload PDF |

### Halaman Existing

| Route | File | Keterangan |
|---|---|---|
| `/` | src/app/page.tsx | Landing page |
| `/app` | src/app/app/page.tsx | Workspace editor |
| `/login` | src/app/login/page.tsx | Login page |
| `/register` | src/app/register/page.tsx | Register page |
| `/verify-otp` | src/app/verify-otp/page.tsx | OTP verification |
| `/forgot-password` | src/app/forgot-password/page.tsx | Reset password |
| `/pricing` | src/app/pricing/page.tsx | Pricing page |
| `/account` | src/app/account/page.tsx | Account settings |
| `/welcome` | src/app/welcome/page.tsx | Onboarding |

---

## 2. Target UI Baru (Berdasarkan agents/ui.png)

### Layout Workspace Baru

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR WORKSPACE (TopNavBarWorkspace)                          │
│  [Logo] [Nama File]          [Undo][Redo][Zoom%] [Unduh][Share]│
├──────────┬──────────┬────────────────────────────┬─────────────┤
│          │          │  TOOLBAR (horizontal strip) │             │
│ SIDEBAR  │ THUMBNAIL│────────────────────────────│ RIGHT PANEL │
│          │  PANEL   │                             │  "Properti  │
│ - Upload │          │    PDF CANVAS               │   Bidang"   │
│ - Nav    │ [Page 1] │    (PDFViewer +             │             │
│ - Pro    │ [Page 2] │     AnnotationLayer)        │             │
│   Card   │ [Page 3] │                             │             │
│ - User   │          │    [Security Badge]         │             │
│          │ [+]      │                             │             │
├──────────┴──────────┴────────────────────────────┴─────────────┤
│  BOTTOM BAR: ◀ Page 1/3 ▶                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Perubahan Utama dari UI Lama ke UI Baru

| Area | UI Lama | UI Baru |
|---|---|---|
| Sidebar | Minimal, slate-50, nav sederhana | Full sidebar dengan nav, Pro card, user profile |
| Top bar workspace | Sub-header sederhana | TopNavBarWorkspace dengan undo/redo/zoom |
| Toolbar | Signature + Text + Cert icon | Tab-style: Pilih, Teks, Tanda Tangan, Inisial, Tanggal, Kotak, Checklist |
| Right Panel | "Properti Elemen" + "Sertifikat Digital" | "Properti Bidang" redesign |
| Canvas area | PDF + floating zoom controls | PDF + Security Badge overlay |
| Bottom | Floating zoom + page control | Dedicated Bottom Bar |
| Thumbnail | Tidak ada | Panel thumbnail halaman |

---

## 3. Phase 1 — Implementation Plan

### 3.1 File Baru yang Akan Dibuat

```
src/
├── components/
│   ├── TopNavBarWorkspace.tsx    (NEW) — Navbar khusus workspace
│   ├── WorkspaceSidebar.tsx      (NEW) — Sidebar workspace
│   ├── ThumbnailPanel.tsx        (NEW) — Panel thumbnail halaman
│   ├── BottomNavBar.tsx          (NEW) — Bottom page navigation
│   ├── SecurityBadge.tsx         (NEW) — Badge enkripsi di canvas
│   └── UpgradeCard.tsx           (NEW) — Pro upgrade card di sidebar
```

### 3.2 File yang Akan Dimodifikasi

```
src/
├── app/
│   └── app/
│       └── page.tsx              (MODIFY) — Integrasikan komponen baru
├── components/
│   ├── Toolbar.tsx               (MODIFY) — Tambah tools baru
│   └── RightPanel.tsx            (MODIFY) — Redesign jadi "Properti Bidang"
└── lib/
    ├── store.ts                  (MODIFY) — Tambah state baru
    └── types.ts                  (MODIFY) — Tambah types baru
```

### 3.3 File yang TIDAK Diubah di Phase 1

```
src/components/PDFViewer.tsx       — Tidak perlu diubah
src/components/AnnotationLayer.tsx — Tidak perlu diubah di Phase 1
src/components/SignaturePad.tsx    — Tidak perlu diubah
src/components/DropZone.tsx        — Tidak perlu diubah
src/components/TopNavBar.tsx       — Tetap untuk landing/auth pages
src/components/layouts/MainLayout.tsx — Tetap untuk landing page
```

---

## 4. Store Changes (src/lib/store.ts)

### Tambahan State yang Dibutuhkan

```typescript
// Tambahan di ESignStore interface:
interface ESignStore {
  // ... semua state existing tetap

  // NEW: Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;

  // NEW: Thumbnail panel state
  thumbnailPanelOpen: boolean;
  setThumbnailPanelOpen: (val: boolean) => void;
}
```

### State yang SUDAH ADA dan Bisa Langsung Dipakai

- `history` + `historyIndex` + `undo()` + `redo()` → sudah ada, tinggal pakai di TopNavBarWorkspace
- `pdfScale` + `setPdfScale()` → sudah ada, tinggal pakai di zoom control
- `pdfFile` → nama file untuk top bar
- `user.plan` → untuk Upgrade Card kondisi
- `savedSignatures` → untuk sidebar "Tanda Tangan Saya"

---

## 5. Types Changes (src/lib/types.ts)

### Tidak ada perubahan breaking di Phase 1

`SignatureAnnotation` tidak perlu diubah untuk Phase 1. Perubahan types (multi-party, party color, dll) masuk Phase 4.

---

## 6. Komponen Detail

### 6.1 TopNavBarWorkspace (NEW)

**File:** `src/components/TopNavBarWorkspace.tsx`

**Props:** tidak ada (semua dari Zustand store)

**Yang diambil dari store:**
- `pdfFile.name` → nama file di tengah
- `history`, `historyIndex` → enable/disable undo/redo
- `undo()`, `redo()` → action buttons
- `pdfScale`, `setPdfScale()` → zoom control
- `annotations`, `downloadSignedPdf()` → download button
- `user.plan` → nudge banner

**UI Elements:**
1. Kiri: Logo "SignEase" + tagline kecil
2. Tengah: Nama file (truncate jika panjang) — TANPA badge "Disimpan"
3. Tengah kanan: [Undo] [Redo] | [Zoom% dropdown]
4. Kanan: [Bagikan] [Unduh PDF] [⋮]

**Zoom dropdown options:** 50%, 75%, 100%, 125%, 150%, 200%

**Catatan:** Tidak ada badge "Disimpan" — keputusan privacy-first, tapi storage cloud opsional di fase lanjut.

---

### 6.2 WorkspaceSidebar (NEW)

**File:** `src/components/WorkspaceSidebar.tsx`

**Width:** 240px (collapsed: 0px dengan transition)

**Yang diambil dari store:**
- `user` → nama, email, plan untuk profile section
- `user.plan` → show/hide upgrade card
- `reset()` → untuk tombol upload PDF baru
- `savedSignatures` → badge count di nav "Tanda Tangan"

**Sections:**

```
1. Upload Button
   - "+ Unggah PDF Baru" → primary button, trigger file input
   - Reuse file input logic yang sudah ada di Toolbar

2. Navigation
   - Dashboard → Link ke "/"
   - Editor Aktif → Link ke "/app" (active jika di /app)
   - Tanda Tangan Saya → Link ke "/app/signatures" (FUTURE)
   
3. Upgrade Card (hanya jika user.plan === "free")
   - Component: <UpgradeCard />
   
4. User Profile (bottom)
   - Avatar: initials dari user.name
   - Nama + email (truncate)
   - Dropdown: Pengaturan Akun → /account, Logout
```

**Nav items yang DIHAPUS dari mockup karena belum ada backend:**
- ❌ Dokumen Saya (perlu storage)
- ❌ Template (future feature)
- ❌ Riwayat (perlu storage)
- ❌ Sampah (perlu storage)
- ❌ Storage indicator (perlu storage)

**Catatan:** Nav items storage akan ditambahkan di Phase 2 (setelah storage service selesai).

---

### 6.3 ThumbnailPanel (NEW)

**File:** `src/components/ThumbnailPanel.tsx`

**Width:** 180px, scrollable vertikal

**Yang diambil dari store:**
- `pdfBytes` → generate thumbnails
- `totalPages` → jumlah halaman
- `currentPage` → active page highlight
- `setCurrentPage()` → navigasi saat click

**Behavior:**
- Generate thumbnail menggunakan pdfjs-dist (sama yang sudah dipakai di PDFViewer)
- Scale render: 0.2 dari ukuran asli (untuk performa)
- Lazy load: hanya render thumbnail yang visible di viewport
- Active page: border-2 border-primary rounded
- Click thumbnail → scroll ke halaman tersebut

**TIDAK ada tombol "+ Tambah Halaman"** — PDF structure adalah read-only.

---

### 6.4 BottomNavBar (NEW)

**File:** `src/components/BottomNavBar.tsx`

**Yang diambil dari store:**
- `currentPage`, `totalPages` → display
- `setCurrentPage()` → navigasi

**UI:** `◀ [input halaman] / [total] ▶`

**Logic:** Sama dengan floating controls yang sudah ada di `/app/page.tsx` — dipindahkan ke komponen ini.

---

### 6.5 SecurityBadge (NEW)

**File:** `src/components/SecurityBadge.tsx`

**Position:** Absolute, top-right corner di dalam PDF canvas container

**Content:** 🔒 "Aman — Dokumen terenkripsi di perangkat Anda"

**Style:** bg-white/95 backdrop-blur-sm, border border-outline-variant, shadow-lg, text-xs

---

### 6.6 UpgradeCard (NEW)

**File:** `src/components/UpgradeCard.tsx`

**Props:** tidak ada (standalone card)

**Content:**
- Title: "Tingkatkan ke Pro"
- Checklist: Tanpa watermark, Custom branding, Priority support 24/7
- CTA: Link ke "/pricing"

---

### 6.7 Toolbar (MODIFY)

**File:** `src/components/Toolbar.tsx`

**Perubahan:**
- Tambah tools baru ke `activeTool` type di store: `"initial"`, `"date"`, `"box"`, `"checkbox"`
- Tambah tombol baru di toolbar strip: [Pilih] [Teks] [Tanda Tangan] [Inisial] [Tanggal] [Kotak] [Checklist] [⋮]
- Tool "Pilih" (select mode) sudah ada, tinggal tambahkan button UI-nya
- Undo/Redo dipindahkan ke TopNavBarWorkspace (dihapus dari toolbar text mode)

**Tools yang sudah ada:**
- Tanda Tangan (signature) ✅
- Teks (text) ✅
- Pilih (select) ✅ di store, belum ada button eksplisit

**Tools baru (Phase 1 — UI only, logic di Phase 7):**
- Inisial → mirip signature tapi size S
- Tanggal → auto-fill current date
- Kotak → rectangle annotation
- Checklist → checkbox field

---

### 6.8 RightPanel (MODIFY)

**File:** `src/components/RightPanel.tsx`

**Perubahan minimal di Phase 1:**
- Rename tab "PROPERTI ELEMEN" → "PROPERTI BIDANG"
- Tambah section "Warna" untuk signature annotations (color picker circles)
- Tambah toggle "Wajib Diisi" (visual only di Phase 1)
- Tombol hapus sudah ada, sudah benar

**Yang TIDAK berubah di Phase 1:**
- Logic updateAnnotation tetap sama
- Certificate tab tetap sama
- Audit trail tetap sama

---

## 7. app/app/page.tsx Changes

### Layout Baru

```tsx
// SEBELUM:
<div className="flex flex-col h-screen">
  {!pdfBytes && <TopNavBar />}
  {!pdfBytes ? (
    <div className="flex-1 flex overflow-hidden">
      <aside> /* sidebar lama */ </aside>
      <main> /* dropzone */ </main>
    </div>
  ) : (
    <div>
      {/* sub-header lama */}
      {/* nudge banner */}
      {/* toolbar */}
      {/* pdf canvas */}
      {/* right panel */}
    </div>
  )}
</div>

// SESUDAH:
<div className="flex flex-col h-screen">
  <TopNavBarWorkspace /> {/* selalu visible saat ada pdfBytes */}
  {!pdfBytes && <TopNavBar />} {/* hanya saat belum ada PDF */}
  
  {!pdfBytes ? (
    <div className="flex-1 flex overflow-hidden">
      <WorkspaceSidebar />
      <main> /* dropzone */ </main>
    </div>
  ) : (
    <>
      {/* Nudge banner tetap */}
      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar />
        <ThumbnailPanel />
        <div className="flex-1 flex flex-col">
          <Toolbar />
          <div id="pdf-scroll-container" className="flex-1 overflow-auto relative">
            <SecurityBadge />
            <PDFViewer />
          </div>
        </div>
        <RightPanel />
      </div>
      <BottomNavBar />
    </>
  )}
</div>
```

### State yang Dipindahkan

- Floating zoom controls (ZoomIn, ZoomOut, page navigation) → pindah ke `TopNavBarWorkspace` dan `BottomNavBar`
- Tidak dihapus dari page.tsx dulu, direfactor secara bertahap

---

## 8. Design Tokens (Tidak Berubah)

Semua implementasi baru HARUS menggunakan CSS variables yang sudah ada di `globals.css`:

```
Warna utama:
--primary: #004782
--secondary: #006c4e
--background: #f8f9ff
--surface-container-low: #eff4ff
--on-surface: #0d1c2e
--on-surface-variant: #424751
--outline-variant: #c2c6d2

Border radius:
- Tombol: rounded-xl
- Card: rounded-2xl hingga rounded-[32px]
- Badge: rounded-full

Font:
- Semua teks: font-sans (var(--font-sans))
- Label/badge: font-bold uppercase tracking-wider text-xs
```

---

## 9. Dependencies yang Dibutuhkan

### Phase 1 — Tidak ada dependency baru

Semua komponen Phase 1 menggunakan:
- React + Next.js (sudah ada)
- Tailwind CSS v4 (sudah ada)
- Zustand (sudah ada)
- Lucide React (sudah ada)
- Material Symbols Outlined via CDN (sudah ada)
- pdfjs-dist (sudah ada, untuk ThumbnailPanel)

### Phase 2+ (Storage, Notifications)

```bash
npm install sonner                    # Toast notifications
npm install @tanstack/react-virtual   # Virtual scrolling thumbnails
npm install prisma @prisma/client     # ORM untuk MySQL
npm install @auth/prisma-adapter      # NextAuth MySQL adapter
```

---

## 10. Urutan Implementasi Phase 1

Implementasi dilakukan dalam urutan ini untuk menghindari breaking changes:

```
Step 1: Update src/lib/store.ts
        → Tambah sidebarCollapsed, thumbnailPanelOpen state

Step 2: Update src/lib/types.ts
        → Tidak ada perubahan di Phase 1

Step 3: Buat src/components/UpgradeCard.tsx
        → Komponen paling independen, tidak ada dependency

Step 4: Buat src/components/SecurityBadge.tsx
        → Komponen sederhana, tidak ada dependency

Step 5: Buat src/components/BottomNavBar.tsx
        → Ambil logic dari app/page.tsx floating controls

Step 6: Buat src/components/WorkspaceSidebar.tsx
        → Butuh UpgradeCard, user state dari store

Step 7: Buat src/components/ThumbnailPanel.tsx
        → Butuh pdfBytes dari store + pdfjs-dist

Step 8: Buat src/components/TopNavBarWorkspace.tsx
        → Butuh semua state: undo/redo, zoom, filename, download

Step 9: Modifikasi src/components/Toolbar.tsx
        → Tambah tool buttons baru

Step 10: Modifikasi src/components/RightPanel.tsx
         → Rename tab, tambah warna picker, toggle wajib

Step 11: Modifikasi src/app/app/page.tsx
         → Integrasikan semua komponen baru, hapus UI lama
```

---

## 11. Apa yang TIDAK Dilakukan di Phase 1

Hal-hal berikut ditunda ke phase selanjutnya:

- ❌ Storage / database integration (Phase 2)
- ❌ Multi-party signing logic (Phase 4)
- ❌ New annotation types logic/PDF embed (Phase 7) — hanya UI buttons
- ❌ Toast notifications (Phase 8)
- ❌ Document library page (Phase 2)
- ❌ Signatures library page (Phase 5)
- ❌ Docker setup (terpisah dari UI work)
- ❌ MySQL / Prisma (Phase 2)
- ❌ Share document feature (Phase 3)

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| ThumbnailPanel lambat untuk PDF besar | Lazy render dengan IntersectionObserver, max 5 thumbnails visible |
| TopNavBarWorkspace overlap dengan existing TopNavBar | Gunakan conditional rendering, tidak hapus TopNavBar lama |
| Sidebar collapse merusak layout | Gunakan CSS transition width dengan overflow-hidden |
| pdfjs-dist SSR issues di ThumbnailPanel | Gunakan dynamic import dengan ssr: false sama seperti PDFViewer |
| Toolbar breaking karena tambah tools baru | Tambah ke union type activeTool, default handler di AnnotationLayer |