# SignEase — UI Improvement Plan (Phase 2)

> Plan ini ditulis berdasarkan analisis `agents/ui.png` (target desain) vs kondisi aktual codebase,
> dan melanjutkan dari `agents/DESIGN.md` (Phase 1 sudah selesai diimplementasi).

---

## Status Phase 1 (Sudah Selesai ✅)

Semua komponen Phase 1 dari DESIGN.md telah berhasil diimplementasi:

| Komponen | Status |
|---|---|
| `TopNavBarWorkspace.tsx` | ✅ Done |
| `WorkspaceSidebar.tsx` | ✅ Done |
| `ThumbnailPanel.tsx` | ✅ Done |
| `BottomNavBar.tsx` | ✅ Done |
| `SecurityBadge.tsx` | ✅ Done |
| `UpgradeCard.tsx` | ✅ Done |
| `Toolbar.tsx` (extended tools) | ✅ Done |
| `RightPanel.tsx` (Properti Bidang) | ✅ Done |
| `app/app/page.tsx` (new layout) | ✅ Done |

---

## Gap Analysis: ui.png vs Codebase Saat Ini

Setelah membandingkan `ui.png` dengan implementasi aktual, berikut gap yang masih ada:

### 🔴 Gap Kritis (Berdampak besar pada kesan visual)

| # | Area | ui.png | Kondisi Aktual |
|---|---|---|---|
| G1 | **TopNavBar — Logo** | Logo SVG lengkap + tagline "Tanda Tangani PDF Tanpa Ribet" | Hanya box biru kecil + icon FileText |
| G2 | **TopNavBar — Badge "Disimpan"** | Badge hijau "✓ Disimpan" di sebelah nama file | Tidak ada |
| G3 | **TopNavBar — Tombol Bagikan** | Tombol "Bagikan" aktif (biru outline solid) | Disabled, opacity-50 |
| G4 | **TopNavBar — Tombol Unduh** | Button "Unduh ▾" dengan dropdown 2 opsi | Button langsung, tidak ada dropdown |
| G5 | **Sidebar — Nav Items** | 6 nav items: Dashboard, Dokumen Saya, Tanda Tangan, Template, Riwayat, Sampah | Hanya 2 nav items |
| G6 | **Sidebar — Storage Indicator** | "Penyimpanan 2.4 GB / 10 GB" dengan progress bar | Tidak ada |
| G7 | **Sidebar — UpgradeCard Style** | Crown kuning, checklist hijau, CTA emerald | Zap icon, gradient tipis, CTA biru |
| G8 | **Toolbar — Tab Style** | Tab pill dengan icon + label, tab aktif rounded-full solid | Icon-only square buttons |
| G9 | **RightPanel — Jenis Bidang** | Dropdown "Jenis Bidang: Tanda Tangan" di bagian atas | Tidak ada dropdown Jenis Bidang |
| G10 | **RightPanel — Dari** | Section "Dari: [preview] Tanda Tangan Saya ▾ + Buat Baru" | Tidak ada |
| G11 | **RightPanel — Color Picker** | 6 color swatches untuk signature (biru, hijau, hitam, merah, ungu, rainbow) | Tidak ada untuk signature |
| G12 | **RightPanel — Size S/M/L** | 3 tombol pill S / M / L | Slider percentage yang kurang intuitif |
| G13 | **RightPanel — Posisi X/Y** | Input field numerik X dan Y | Tidak ada |
| G14 | **RightPanel — Wajib Diisi toggle** | Toggle premium hijau + deskripsi | Toggle ada tapi kurang premium |
| G15 | **RightPanel — Hapus Bidang** | Full-width tombol merah outline di bawah panel | Ada tapi bukan full-width prominent |
| G16 | **SecurityBadge style** | ShieldCheck hijau + "Aman" bold + teks sub 2 baris | Lock icon, 1 baris |
| G17 | **Toast/Notification** | Badge floating verifikasi dokumen | Tidak ada |

### 🟡 Gap Minor

| # | Area | Catatan |
|---|---|---|
| G18 | **ThumbnailPanel Header** | Tidak ada label "HALAMAN" di atas panel thumbnail |
| G19 | **BottomNavBar View Mode** | Tidak ada toggle Grid/Single di ujung kanan |
| G20 | **Hover animations** | Beberapa button kurang smooth micro-animation |

---

## Rencana Implementasi — Phase 2: UI Polish

### Urutan Eksekusi

```
Step 1 → src/app/globals.css            Animasi, scrollbar polish
Step 2 → TopNavBarWorkspace.tsx         Logo, badge, dropdown Unduh, Bagikan aktif
Step 3 → WorkspaceSidebar.tsx           Nav items lengkap, storage indicator
Step 4 → UpgradeCard.tsx                Redesign crown + emerald CTA
Step 5 → Toolbar.tsx                    Tab pill style redesign
Step 6 → RightPanel.tsx                 Jenis Bidang, Dari, swatches, S/M/L, X/Y, toggle premium, Hapus Bidang
Step 7 → ThumbnailPanel.tsx             Tambah header label "HALAMAN"
Step 8 → BottomNavBar.tsx               Tambah view mode toggle
Step 9 → SecurityBadge.tsx              ShieldCheck icon, layout 2-baris
Step 10 → lib/store.ts + layout.tsx     viewMode state + Sonner Toaster
```

---

## Detail Perubahan Per File

---

### Step 1: `src/app/globals.css`

Tambah CSS untuk micro-animations dan scrollbar yang lebih halus:

```css
/* Scrollbar lebih minimal */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--outline-variant); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--outline); }

/* Micro-animation utilities */
@keyframes slide-in-right {
  from { transform: translateX(8px); opacity: 0; }
  to   { transform: translateX(0);   opacity: 1; }
}
.animate-slide-in { animation: slide-in-right 0.15s ease-out; }
```

---

### Step 2: `src/components/TopNavBarWorkspace.tsx`

**Perubahan:**

#### 2a. Logo — ganti box placeholder → SVG logo + tagline

```tsx
// SEBELUM
<div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
  <FileText className="w-3.5 h-3.5 text-on-primary" />
</div>
<span className="text-sm font-bold text-primary hidden sm:block">SignEase</span>

// SESUDAH
<svg width="26" height="26" viewBox="0 0 26 26" fill="none">
  <rect width="26" height="26" rx="6" fill="#004782"/>
  <path d="M8 8h10M8 12h10M8 16h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
  <path d="M16 14l2.5 2.5L22 12" stroke="#86f8c9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
<div className="flex flex-col">
  <span className="text-sm font-bold text-primary leading-tight">SignEase</span>
  <span className="text-[9px] text-on-surface-variant leading-tight hidden md:block">
    Tanda Tangani PDF Tanpa Ribet
  </span>
</div>
```

#### 2b. Badge "Disimpan" — tampilkan saat pdfFile ada

```tsx
// Tambah di sebelah kanan nama file
{pdfFile && (
  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
    <CheckCircle className="w-3 h-3" />
    Disimpan
  </span>
)}
```

#### 2c. Unduh → Dropdown (2 opsi)

Ganti single button → button dengan dropdown:
- **Unduh PDF Bertanda Tangan** → `downloadSignedPdf()` + cert modal
- **Unduh Sertifikat (.json)** → `handleDownloadCertificateJson()` (pindahkan dari page.tsx)

```tsx
// State baru:
const [downloadOpen, setDownloadOpen] = useState(false);
const dropRef = useRef<HTMLDivElement>(null);

// UI:
<div className="relative" ref={dropRef}>
  <button
    onClick={() => setDownloadOpen(!downloadOpen)}
    disabled={!pdfFile || annotations.length === 0}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
  >
    <Download className="w-3.5 h-3.5" />
    <span className="hidden sm:block">Unduh</span>
    <ChevronDown className="w-3 h-3" />
  </button>
  {downloadOpen && (
    <div className="absolute right-0 top-full mt-1.5 bg-white border border-outline-variant rounded-xl shadow-xl overflow-hidden w-56 z-50 animate-slide-in">
      <button onClick={handleDownloadPdf} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-on-surface hover:bg-surface-container transition-colors">
        <FileDown className="w-3.5 h-3.5 text-primary" />
        Unduh PDF Bertanda Tangan
      </button>
      <div className="h-px bg-outline-variant/50" />
      <button onClick={handleDownloadCert} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-on-surface hover:bg-surface-container transition-colors">
        <FileBadge2 className="w-3.5 h-3.5 text-outline" />
        Unduh Sertifikat (.json)
      </button>
    </div>
  )}
</div>
```

#### 2d. Bagikan → Aktif UI (modal "Segera Hadir")

```tsx
// Aktifkan tombol, tampilkan modal info coming soon
<button
  onClick={() => setShareModalOpen(true)}
  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-outline-variant text-on-surface-variant rounded-lg hover:border-primary hover:text-primary transition-colors"
>
  <Share2 className="w-3.5 h-3.5" />
  <span className="hidden sm:block">Bagikan</span>
</button>

{/* Share Coming Soon Modal */}
{shareModalOpen && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
       onClick={() => setShareModalOpen(false)}>
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
      <h3 className="font-bold text-sm text-on-surface mb-2">Fitur Berbagi (Segera Hadir)</h3>
      <p className="text-xs text-on-surface-variant leading-relaxed">
        Fitur berbagi dokumen untuk penandatanganan multi-pihak akan tersedia di pembaruan mendatang.
      </p>
      <button onClick={() => setShareModalOpen(false)}
              className="mt-4 w-full py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110">
        Oke, Mengerti
      </button>
    </div>
  </div>
)}
```

---

### Step 3: `src/components/WorkspaceSidebar.tsx`

#### 3a. Nav items lengkap (dengan comingSoon state)

```tsx
const navItems = [
  { href: "/",          label: "Dashboard",    icon: LayoutDashboard, comingSoon: false },
  { href: "/documents", label: "Dokumen Saya", icon: FileText,        comingSoon: true  },
  { href: "/app",       label: "Tanda Tangan", icon: PenLine,         comingSoon: false, badge: savedSignatures.length || undefined },
  { href: "/templates", label: "Template",     icon: LayoutGrid,      comingSoon: true  },
  { href: "/history",   label: "Riwayat",      icon: History,         comingSoon: true  },
  { href: "/trash",     label: "Sampah",       icon: Trash2,          comingSoon: true  },
];

// Render comingSoon items dengan tooltip:
{comingSoon ? (
  <span title="Segera Hadir" className={baseClass + " opacity-50 cursor-not-allowed"}>
    <Icon className="w-4 h-4 shrink-0" />
    {!sidebarCollapsed && <span className="truncate flex-1">{label}</span>}
    {!sidebarCollapsed && <span className="text-[9px] text-outline ml-auto">Segera</span>}
  </span>
) : (
  <Link href={href} className={baseClass + (isActive ? " bg-primary/10 text-primary" : "")}>
    ...
  </Link>
)}
```

#### 3b. Storage Indicator

Tambahkan di antara nav dan UpgradeCard:

```tsx
{!sidebarCollapsed && (
  <div className="px-3 py-3 border-t border-outline-variant/40">
    <div className="flex items-center justify-between mb-1.5">
      <p className="text-[10px] font-semibold text-on-surface-variant">Penyimpanan</p>
      <p className="text-[10px] text-outline">2.4 GB / 10 GB</p>
    </div>
    <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: "24%" }}
      />
    </div>
  </div>
)}
```

---

### Step 4: `src/components/UpgradeCard.tsx`

Redesign total: crown kuning, fitur match ui.png, CTA emerald:

```tsx
import { Crown, Check } from "lucide-react";
import Link from "next/link";

export function UpgradeCard() {
  const features = [
    "Tanda tangan tak terbatas",
    "Template premium",
    "Hapus watermark",
    "Enkripsi dokumen",
  ];

  return (
    <div className="mx-3 mb-3 rounded-2xl overflow-hidden border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-3.5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-xs font-bold text-on-surface">Tingkatkan ke Pro</p>
      </div>

      <ul className="space-y-1.5 mb-3.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-emerald-600" />
            </div>
            <span className="text-[11px] text-on-surface-variant">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/pricing"
        className="block w-full text-center text-[11px] font-bold bg-emerald-600 text-white rounded-xl py-2 hover:bg-emerald-700 active:scale-95 transition-all"
      >
        Upgrade ke Pro
      </Link>
    </div>
  );
}
```

---

### Step 5: `src/components/Toolbar.tsx`

**Tujuan:** Ganti icon-only square buttons → tab pill dengan icon + label

Buat internal component `ToolTab`:

```tsx
function ToolTab({
  icon: Icon,
  label,
  isActive,
  onClick,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Segera Hadir" : label}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-150 active:scale-95 whitespace-nowrap
        ${isActive
          ? "bg-primary text-on-primary shadow-sm"
          : "text-on-surface-variant hover:bg-slate-100 hover:text-on-surface"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
```

Ganti render toolbar utama:

```tsx
// Normal toolbar (non-text mode):
return (
  <div ref={toolbarRef} className="flex items-center gap-1 h-full px-3 select-none">
    <ToolTab icon={MousePointer2} label="Pilih"        isActive={!isPlacingMode && !isTextModeActive} onClick={handleSelectClick} />
    <div className="w-px h-5 bg-outline-variant/50 mx-1" />
    <ToolTab icon={Type}          label="Teks"         isActive={isTextModeActive}  onClick={handleTextClick} />
    <ToolTab icon={PenLine}       label="Tanda Tangan" isActive={activeMenu === "signature" && isPlacingMode} onClick={handleSignatureClick} />
    <ToolTab icon={Fingerprint}   label="Inisial"      isActive={false} onClick={() => {}} disabled />
    <ToolTab icon={Calendar}      label="Tanggal"      isActive={false} onClick={() => {}} disabled />
    <ToolTab icon={Square}        label="Kotak"        isActive={false} onClick={() => {}} disabled />
    <ToolTab icon={CheckSquare}   label="Checklist"    isActive={false} onClick={() => {}} disabled />
    <div className="w-px h-5 bg-outline-variant/50 mx-1" />
    <ToolTab icon={MoreHorizontal} label="Lainnya"     isActive={false} onClick={() => {}} />
  </div>
);
```

> **Catatan:** Text mode bar (font, bold, italic, dll) tetap dipertahankan sebagai conditional render saat `isTextModeActive === true`.

---

### Step 6: `src/components/RightPanel.tsx`

Ini adalah perubahan terbesar — tambah 6 sub-fitur baru ke panel properti:

#### 6a. Jenis Bidang Dropdown

```tsx
// Tambah di bagian atas Properties tab, sebelum konten annotation:
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-outline">Jenis Bidang</label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <PenLine className="w-3.5 h-3.5 text-on-surface-variant" />
    </span>
    <select
      value={selectedAnnotation?.type === "text" ? "text" : "signature"}
      onChange={(e) => { /* future: change annotation type */ }}
      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-xs font-medium focus:border-primary focus:outline-none appearance-none cursor-pointer"
    >
      <option value="signature">Tanda Tangan</option>
      <option value="text">Teks</option>
      <option value="initial">Inisial</option>
      <option value="date">Tanggal</option>
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
  </div>
</div>
```

#### 6b. Section "Dari"

```tsx
// Tampilkan hanya untuk signature annotations:
{selectedAnnotation?.type !== "text" && (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-outline">Dari</label>
    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-outline-variant bg-surface hover:border-primary cursor-pointer transition-colors">
      <div className="w-14 h-7 bg-surface-container rounded-lg overflow-hidden flex items-center justify-center border border-outline-variant/50 shrink-0">
        <img
          src={selectedAnnotation?.imageDataUrl}
          className="w-full h-full object-contain"
          alt="Tanda Tangan"
        />
      </div>
      <span className="text-xs font-medium text-on-surface flex-1 truncate">Tanda Tangan Saya</span>
      <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
    </div>
    <button
      onClick={openSignaturePad}
      className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
    >
      <Plus className="w-3 h-3" />
      Buat Baru
    </button>
  </div>
)}
```

> **Catatan:** `openSignaturePad` perlu di-prop dari page.tsx atau dibuka via store callback.

#### 6c. Color Swatches untuk Signature

```tsx
{selectedAnnotation?.type !== "text" && (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-outline">Warna</label>
    <div className="flex items-center gap-2">
      {["#004782", "#006c4e", "#000000", "#ba1a1a", "#5c4d9b"].map((color) => (
        <button
          key={color}
          onClick={() => console.log("color:", color)} // TODO: apply tint via CSS filter
          style={{ backgroundColor: color }}
          className="w-7 h-7 rounded-full border-2 border-transparent hover:scale-110 transition-transform hover:border-on-surface/30"
        />
      ))}
      <label
        className="w-7 h-7 rounded-full border-2 border-outline-variant cursor-pointer hover:scale-110 transition-transform flex items-center justify-center bg-gradient-to-br from-red-400 via-blue-400 to-green-400"
        title="Warna Kustom"
      >
        <input type="color" className="sr-only" onChange={(e) => console.log(e.target.value)} />
      </label>
    </div>
  </div>
)}
```

#### 6d. Size S/M/L Selector (ganti slider)

```tsx
// Ganti slider yang ada dengan 3 tombol pill:
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-outline">Ukuran</label>
  <div className="grid grid-cols-3 gap-1 bg-surface-container rounded-xl p-1">
    {[
      { label: "S", pct: 70 },
      { label: "M", pct: 100 },
      { label: "L", pct: 140 },
    ].map(({ label, pct }) => {
      const isSelected = Math.abs(sizePercent - pct) < 20;
      return (
        <button
          key={label}
          onClick={() => handleSizeChange(pct)}
          className={`
            py-2 rounded-lg text-xs font-bold transition-all
            ${isSelected
              ? "bg-white text-primary shadow-sm border border-outline-variant"
              : "text-on-surface-variant hover:text-on-surface"
            }
          `}
        >
          {label}
        </button>
      );
    })}
  </div>
</div>
```

#### 6e. Posisi X/Y

```tsx
// Konstanta ukuran A4 (pt):
const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;

const handlePositionChange = (axis: "x" | "y", ptValue: number) => {
  if (!selectedAnnotation) return;
  const ratio = axis === "x"
    ? Math.max(0, Math.min(1, ptValue / A4_WIDTH_PT))
    : Math.max(0, Math.min(1, ptValue / A4_HEIGHT_PT));
  updateAnnotation(selectedAnnotation.id, {
    [axis === "x" ? "xRatio" : "yRatio"]: ratio,
  });
};

// UI:
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-outline">
    Posisi (Halaman {(selectedAnnotation?.pageIndex ?? 0) + 1})
  </label>
  <div className="grid grid-cols-2 gap-2">
    {[
      { axis: "x", label: "X", ratio: selectedAnnotation?.xRatio ?? 0, multiplier: A4_WIDTH_PT },
      { axis: "y", label: "Y", ratio: selectedAnnotation?.yRatio ?? 0, multiplier: A4_HEIGHT_PT },
    ].map(({ axis, label, ratio, multiplier }) => (
      <div key={axis} className="space-y-0.5">
        <span className="text-[10px] text-outline font-medium">{label}</span>
        <input
          type="number"
          value={Math.round(ratio * multiplier)}
          onChange={(e) => handlePositionChange(axis as "x" | "y", parseInt(e.target.value))}
          className="w-full px-3 py-1.5 rounded-lg border border-outline-variant text-xs bg-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </div>
    ))}
  </div>
</div>
```

#### 6f. Wajib Diisi Toggle — Premium

```tsx
// Ganti toggle sederhana dengan versi premium:
<div className="flex items-start justify-between gap-3 py-0.5">
  <div className="flex-1 min-w-0">
    <p className="text-xs font-semibold text-on-surface">Wajib Diisi</p>
    <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
      Pengisi wajib mengisi bidang ini
    </p>
  </div>
  <button
    onClick={() => setIsRequired(!isRequired)}
    role="switch"
    aria-checked={isRequired}
    className={`
      relative shrink-0 w-10 h-[22px] rounded-full border transition-all duration-200
      ${isRequired
        ? "bg-primary border-primary"
        : "bg-outline-variant/40 border-outline-variant"
      }
    `}
  >
    <span
      className={`
        absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm
        transition-transform duration-200
        ${isRequired ? "translate-x-[18px]" : "translate-x-0"}
      `}
    />
  </button>
</div>
```

#### 6g. Hapus Bidang — Full-width di bawah panel

```tsx
// Di bagian paling bawah aside, setelah overflow-y-auto content:
<div className="px-4 py-3 border-t border-outline-variant shrink-0">
  <button
    onClick={() => { if (selectedAnnotation) { removeAnnotation(selectedAnnotation.id); } }}
    disabled={!selectedAnnotation}
    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/60 text-destructive text-xs font-semibold hover:bg-destructive/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  >
    <Trash2 className="w-3.5 h-3.5" />
    Hapus Bidang
  </button>
</div>
```

---

### Step 7: `src/components/ThumbnailPanel.tsx`

Tambah header "HALAMAN":

```tsx
// Wrap existing content dengan flex-col container:
<div className="w-[180px] shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col">
  {/* Header */}
  <div className="px-3 py-2 border-b border-outline-variant/50 shrink-0">
    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
      Halaman
    </p>
  </div>
  {/* Thumbnail list */}
  <div className="flex-1 overflow-y-auto py-2">
    {Array.from({ length: totalPages }, (_, i) => (
      <ThumbnailPage key={i} ... />
    ))}
  </div>
</div>
```

---

### Step 8: `src/components/BottomNavBar.tsx`

Tambah view mode toggle di kanan:

```tsx
// Import dari store (state baru):
const { viewMode, setViewMode } = useESignStore();

// Container jadi relative, tambah absolute right section:
<div className="h-10 border-t border-outline-variant bg-surface-container-low flex items-center justify-center gap-2 shrink-0 relative">
  {/* Page navigation — center (existing) */}
  <button ...>◀</button>
  <div className="flex items-center gap-1.5 text-xs ...">...</div>
  <button ...>▶</button>

  {/* View mode toggle — absolute right */}
  <div className="absolute right-3 flex items-center gap-0.5">
    <button
      onClick={() => setViewMode("single")}
      title="Satu halaman"
      className={`p-1.5 rounded-lg transition-colors ${
        viewMode === "single"
          ? "bg-primary/10 text-primary"
          : "text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      <LayoutList className="w-3.5 h-3.5" />
    </button>
    <button
      onClick={() => setViewMode("grid")}
      title="Tampilan grid"
      className={`p-1.5 rounded-lg transition-colors ${
        viewMode === "grid"
          ? "bg-primary/10 text-primary"
          : "text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      <LayoutGrid className="w-3.5 h-3.5" />
    </button>
  </div>
</div>
```

---

### Step 9: `src/components/SecurityBadge.tsx`

Upgrade ke ShieldCheck + 2-baris layout:

```tsx
import { ShieldCheck } from "lucide-react";

export function SecurityBadge() {
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2.5 bg-white/95 backdrop-blur-sm border border-outline-variant/60 rounded-xl px-3 py-2 shadow-lg pointer-events-none">
      <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface leading-tight">Aman</p>
        <p className="text-[10px] text-on-surface-variant whitespace-nowrap leading-tight mt-0.5">
          Dokumen terenkripsi di perangkat Anda
        </p>
      </div>
    </div>
  );
}
```

---

### Step 10: Store + Layout (Toast System)

#### 10a. Tambah `viewMode` ke `src/lib/store.ts`

```typescript
// Interface addition:
viewMode: "single" | "grid";
setViewMode: (mode: "single" | "grid") => void;

// Implementation:
viewMode: "single",
setViewMode: (mode) => set({ viewMode: mode }),
```

#### 10b. Install Sonner

```bash
npm install sonner
```

#### 10c. Tambah Toaster ke `src/app/layout.tsx`

```tsx
import { Toaster } from "sonner";

// Di dalam body:
<Toaster
  position="bottom-right"
  richColors
  toastOptions={{
    classNames: {
      toast: "font-sans text-xs",
    },
  }}
/>
```

#### 10d. Toast saat download berhasil (di TopNavBarWorkspace)

```tsx
import { toast } from "sonner";

// Setelah downloadSignedPdf() berhasil:
toast.success("Tanda tangan digital", {
  description: "Verifikasi keaslian dokumen Anda",
  action: {
    label: "Pelajari lebih lanjut →",
    onClick: () => window.open("/verify", "_blank"),
  },
  duration: 6000,
  icon: "🛡️",
});
```

---

## Files yang Dimodifikasi

| File | Perubahan |
|---|---|
| `src/app/globals.css` | Scrollbar, micro-animation keyframes |
| `src/app/layout.tsx` | Tambah Toaster |
| `src/lib/store.ts` | Tambah `viewMode` state |
| `src/components/TopNavBarWorkspace.tsx` | Logo SVG, badge "Disimpan", dropdown Unduh, Bagikan aktif |
| `src/components/WorkspaceSidebar.tsx` | 6 nav items, storage indicator |
| `src/components/UpgradeCard.tsx` | Crown icon, emerald CTA (total redesign) |
| `src/components/Toolbar.tsx` | ToolTab pill style |
| `src/components/RightPanel.tsx` | Jenis Bidang, Dari, swatches, S/M/L, X/Y, toggle premium, Hapus Bidang |
| `src/components/ThumbnailPanel.tsx` | Header "HALAMAN" |
| `src/components/BottomNavBar.tsx` | View mode toggle |
| `src/components/SecurityBadge.tsx` | ShieldCheck, 2-baris |

## Files yang TIDAK Diubah

```
src/components/PDFViewer.tsx
src/components/AnnotationLayer.tsx
src/components/SignaturePad.tsx
src/components/DropZone.tsx
src/components/TopNavBar.tsx
src/components/layouts/MainLayout.tsx
src/lib/types.ts
src/app/app/page.tsx
```

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| X/Y position ratio vs real PDF size tidak presisi | Gunakan page.getViewport() yang aktual dari pdfjs, bukan hardcode A4 |
| Warna signature memerlukan reprocess image | Phase 2: CSS filter tint saja; Phase 7: regenerate signature dengan tint aktual |
| Toolbar text bar bentrok dengan tab style baru | Pertahankan conditional render; text mode = full bar, normal = tab |
| Sonner tidak kompatibel App Router SSR | Wrap dalam "use client" provider component |
| Sidebar nav comingSoon items membingungkan user | Tambahkan tooltip yang jelas + badge "Segera" |

---

## Verification Plan

1. Upload PDF → bandingkan visual dengan `ui.png` side-by-side
2. Klik tiap tool di Toolbar → verifikasi tab aktif berubah (pill style)
3. Klik annotation → verifikasi RightPanel menampilkan semua 6 property baru
4. Klik S/M/L → verifikasi ukuran annotation berubah
5. Edit X/Y → verifikasi annotation bergerak
6. Klik Unduh → verifikasi dropdown muncul dengan 2 opsi
7. Download PDF → verifikasi toast muncul
8. Klik Bagikan → verifikasi modal "Segera Hadir" muncul
9. Verifikasi Storage indicator terlihat di sidebar
10. Resize ke 768px → verifikasi layout tidak broken

---

## Timeline Estimasi

| Step | File | Estimasi | Prioritas |
|---|---|---|---|
| 1 | globals.css | 15 mnt | Medium |
| 2 | TopNavBarWorkspace | 50 mnt | Tinggi 🔴 |
| 3 | WorkspaceSidebar | 35 mnt | Tinggi 🔴 |
| 4 | UpgradeCard | 20 mnt | Tinggi 🔴 |
| 5 | Toolbar | 30 mnt | Tinggi 🔴 |
| 6 | RightPanel | 90 mnt | Tinggi 🔴 |
| 7 | ThumbnailPanel | 10 mnt | Medium |
| 8 | BottomNavBar | 20 mnt | Medium |
| 9 | SecurityBadge | 10 mnt | Medium |
| 10 | store.ts + layout.tsx + sonner | 20 mnt | Medium |
| **Total** | | **~5 jam** | |

---

*Dokumen ini diupdate terakhir: 2026-07-25*  
*Disiapkan oleh: Antigravity AI berdasarkan analisis ui.png vs codebase aktual*
