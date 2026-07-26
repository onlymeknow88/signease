# SignEase — PLAN2: Halaman "Dokumen Saya" (Upload Flow)

> Plan ini dibuat berdasarkan analisis `agents/ui page dokumen saya.png` (target desain).
> Fokus: Redesign total halaman upload/pilih dokumen di route `/app` (state saat belum ada PDF loaded)
> agar pixel-perfect dengan mockup.

---

## Analisis Visual: `ui page dokumen saya.png`

### Layout Keseluruhan

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (sama seperti workspace — sudah ada)                            │
├─────────────────────────────────────────┬────────────────────────────────┤
│  MAIN CONTENT (kiri, flex-1)            │  RIGHT INFO PANEL (kanan, ~280px)│
│                                         │                                │
│  [H1] Unggah Dokumen                   │  ┌─ Format yang didukung ────┐  │
│  [subtitle] Unggah file PDF...          │  │ .pdf  Maks. 50 MB        │  │
│                                         │  └──────────────────────────┘  │
│  ┌─ STEPPER (4 steps) ───────────────┐  │                                │
│  │ ①Unggah → ②Atur → ③Tanda Tangan → ④Selesai │  │  ┌─ Tips ─────────────────┐  │
│  └────────────────────────────────────┘  │  │ ✅ Pastikan file PDF...  │  │
│                                         │  │ ✅ Ukuran file maks 50MB │  │
│  ┌─ DROPZONE ─────────────────────────┐  │  │ ✅ Periksa isi dokumen   │  │
│  │   ☁️ (cloud upload icon)           │  │  │ ✅ Simpan pekerjaan Anda │  │
│  │                                    │  │  └──────────────────────────┘  │
│  │  Seret & lepas file PDF di sini   │  │                                │
│  │           atau                     │  │  ┌─ Butuh lebih banyak? ───┐  │
│  │   [⬆ Pilih File PDF] (btn biru)   │  │  │ 🔒 Butuh lebih banyak   │  │
│  │   Maksimal ukuran file 50 MB      │  │  │    fitur?               │  │
│  └────────────────────────────────────┘  │  │ Dapatkan akses premium  │  │
│                                         │  │ [Upgrade ke Pro →]      │  │
│  ┌─ Security Notice ─────────────────┐  │  └──────────────────────────┘  │
│  │ 🛡 Dokumen Anda aman              │  │                                │
│  │ File PDF dienkripsi di perangkat  │  ├────────────────────────────────┤
│  └────────────────────────────────────┘  │  [Batal]   [Lanjutkan →]      │
│                                         │  (footer buttons)              │
│  Terbaru diunggah              Lihat semua│                              │
│  ┌─────────────────────────────────────┐  │                              │
│  │ 📄 Perjanjian Kerja Sama.pdf  ╳    │  │                              │
│  │    1.2 MB • 10:30                  │  │                              │
│  │ 📄 Formulir Pendaftaran.pdf   ╳    │  │                              │
│  │    850 KB • 09:15                  │  │                              │
│  │ 📄 Kontrak Vendor.pdf         ╳    │  │                              │
│  │    1.1 MB • Kemarin                │  │                              │
│  └─────────────────────────────────────┘  │                              │
└─────────────────────────────────────────┴────────────────────────────────┘
```

### Elemen Baru vs Kondisi Aktual

| # | Elemen | ui.png | Kondisi Aktual |
|---|---|---|---|
| E1 | **Page Header** | H1 "Unggah Dokumen" + subtitle kecil + badge Pro + notif di kanan atas | H1 ada, tapi tidak ada badge Pro / notif topbar |
| E2 | **Stepper 4-step** | Progress step: Unggah → Atur → Tanda Tangan → Selesai | Tidak ada |
| E3 | **Dropzone Cloud Icon** | Icon ☁️ (cloud upload) besar, biru outline | Icon `draw` Material Symbol + "Sign Here" badge bouncing |
| E4 | **Dropzone CTA Button** | Tombol solid biru "⬆ Pilih File PDF" terpusat | Tombol tidak ada (area klik seluruh dropzone) |
| E5 | **Dropzone size text** | "Maksimal ukuran file 50 MB" | "Maksimum ukuran file: 25MB" |
| E6 | **Security Notice** | Banner rounded-xl: 🛡 "Dokumen Anda aman — File PDF dienkripsi..." | Tidak ada |
| E7 | **Section "Terbaru diunggah"** | List 3 file recent dengan icon PDF merah, nama, size, waktu, tombol ✕ | Tidak ada |
| E8 | **"Lihat semua" link** | Link teks biru di kanan header section "Terbaru diunggah" | Tidak ada |
| E9 | **Right Info Panel** | Panel kanan 280px dengan 3 card: Format, Tips, Upgrade | Tidak ada right panel |
| E10 | **Format yang didukung card** | Card putih: icon PDF merah, ".pdf", "Maks. 50 MB" | Tidak ada |
| E11 | **Tips card** | 4 tips dengan ✅ hijau icon | Tidak ada |
| E12 | **Upgrade card (right panel)** | Card biru tua: lock icon, "Butuh lebih banyak fitur?", tombol "Upgrade ke Pro →" | Tidak ada |
| E13 | **Footer buttons** | Tombol "Batal" (outline) + "Lanjutkan →" (disabled, abu-abu) | Tidak ada |
| E14 | **Sidebar nav aktif** | "Dokumen Saya" highlighted biru sebagai active state | Nav item bertanda `comingSoon: true`, tidak aktif |

---

## Rencana Implementasi

### Scope Perubahan

Ini adalah redesign total dari **state upload** di `/app/page.tsx` (saat `!pdfBytes`).
Komponen baru akan dibuat sebagai dedicated component untuk kemudahan maintenance.

### Files yang Dibuat / Dimodifikasi

| File | Jenis |
|---|---|
| `src/components/UploadPage.tsx` | **[NEW]** — Dedicated component untuk halaman upload |
| `src/app/app/page.tsx` | **[MODIFY]** — Ganti inline upload UI dengan `<UploadPage />` |
| `src/components/WorkspaceSidebar.tsx` | **[MODIFY]** — Set Dokumen Saya sebagai active route (tidak comingSoon) |

### Files yang TIDAK Diubah

```
src/components/DropZone.tsx         — Akan direuse dengan modifikasi kecil props
src/components/UpgradeCard.tsx      — Tidak dipakai di right panel (buat card baru inline)
src/lib/store.ts                    — Tidak ada perubahan state
```

---

## Detail Implementasi

---

### Step 1: Modifikasi `src/components/WorkspaceSidebar.tsx`

Ubah "Dokumen Saya" dari `comingSoon: true` → `comingSoon: false` dan update href ke `/app`:

```tsx
// SEBELUM:
{ href: "/documents", label: "Dokumen Saya", icon: FileText, comingSoon: true },

// SESUDAH:
{ href: "/app", label: "Dokumen Saya", icon: FileText, comingSoon: false },
```

> **Rationale:** Di ui.png, "Dokumen Saya" adalah halaman aktif yang menampilkan upload + daftar file.
> Route-nya adalah `/app` saat tidak ada PDF loaded — bukan route terpisah.

---

### Step 2: Buat `src/components/UploadPage.tsx`

Komponen baru yang menggantikan inline upload UI di `page.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { useESignStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  ShieldCheck,
  Lightbulb,
  Lock,
  X,
  ChevronRight,
  CloudUpload,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecentFile {
  id: string;
  name: string;
  size: string;
  time: string;
}

// ─── Stepper ────────────────────────────────────────────────────────────────────

function Stepper({ currentStep = 1 }: { currentStep?: number }) {
  const steps = [
    { num: 1, label: "Unggah",       sub: "Pilih file PDF" },
    { num: 2, label: "Atur",         sub: "Atur halaman & nama" },
    { num: 3, label: "Tanda Tangan", sub: "Tambahkan tanda tangan" },
    { num: 4, label: "Selesai",      sub: "Simpan dokumen" },
  ];

  return (
    <div className="flex items-start gap-0 w-full mb-6">
      {steps.map((step, idx) => {
        const isActive = step.num === currentStep;
        const isDone   = step.num < currentStep;
        const isLast   = idx === steps.length - 1;

        return (
          <div key={step.num} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center min-w-0 flex-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 mb-1.5
                ${isActive
                  ? "bg-primary border-primary text-on-primary"
                  : isDone
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white border-outline-variant text-on-surface-variant"
                }
              `}>
                {step.num}
              </div>
              <p className={`text-[11px] font-bold text-center leading-tight ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                {step.label}
              </p>
              <p className="text-[9px] text-outline text-center leading-tight mt-0.5 hidden sm:block">
                {step.sub}
              </p>
            </div>
            {!isLast && (
              <div className={`
                h-0.5 flex-1 mx-1 mt-[-14px] self-start
                ${isDone || isActive ? "bg-primary/40" : "bg-outline-variant/40"}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── DropZone (redesign sesuai ui.png) ─────────────────────────────────────────

function UploadDropZone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") onFileSelected(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        w-full rounded-2xl border-2 border-dashed transition-all duration-200
        flex flex-col items-center justify-center py-12 px-6 cursor-pointer
        ${isDragging
          ? "border-primary bg-primary/5 scale-[0.995]"
          : "border-primary/40 bg-white hover:border-primary/70 hover:bg-primary/[0.02]"
        }
      `}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      {/* Cloud Upload Icon */}
      <div className={`mb-5 transition-transform duration-300 ${isDragging ? "scale-110" : "group-hover:scale-105"}`}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M32 44V24M32 24L24 32M32 24L40 32" stroke="#004782" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 48C10.477 48 6 43.523 6 38C6 33.054 9.565 28.922 14.268 28.107C14.092 27.263 14 26.392 14 25.5C14 18.596 19.596 13 26.5 13C30.533 13 34.13 14.934 36.44 17.937C37.571 17.647 38.768 17.5 40 17.5C47.732 17.5 54 23.768 54 31.5C54 31.667 53.997 31.834 53.99 32H54C57.866 32 61 35.134 61 39C61 42.866 57.866 46 54 46" stroke="#004782" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h3 className="text-base font-bold text-on-surface mb-1 text-center">
        Seret & lepas file PDF di sini
      </h3>
      <p className="text-sm text-on-surface-variant mb-5 text-center">atau</p>

      {/* CTA Button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm mb-4"
      >
        <Upload className="w-4 h-4" />
        Pilih File PDF
      </button>

      <p className="text-xs text-outline">Maksimal ukuran file 50 MB</p>
    </div>
  );
}

// ─── Security Notice ────────────────────────────────────────────────────────────

function SecurityNotice() {
  return (
    <div className="flex items-start gap-3 bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3.5">
      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-primary">Dokumen Anda aman</p>
        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
          File PDF dienkripsi di perangkat Anda dan tidak akan diunggah ke server kami.
        </p>
      </div>
    </div>
  );
}

// ─── Recent Files List ──────────────────────────────────────────────────────────

function RecentFiles() {
  // Dummy data — akan connect ke storage API di Phase 3
  const [files, setFiles] = useState<RecentFile[]>([
    { id: "1", name: "Perjanjian Kerja Sama.pdf", size: "1.2 MB",  time: "10:30"  },
    { id: "2", name: "Formulir Pendaftaran.pdf",  size: "850 KB", time: "09:15"  },
    { id: "3", name: "Kontrak Vendor.pdf",         size: "1.1 MB",  time: "Kemarin" },
  ]);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  if (files.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-on-surface">Terbaru diunggah</h3>
        <button className="text-xs text-primary font-semibold hover:underline">
          Lihat semua
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-outline-variant/60 hover:border-primary/30 transition-colors group cursor-pointer"
          >
            {/* PDF Icon */}
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-red-600">PDF</span>
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">{file.name}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                {file.size} • {file.time}
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
              className="p-1.5 rounded-lg text-outline hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all"
              title="Hapus dari riwayat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Right Info Panel ───────────────────────────────────────────────────────────

function RightInfoPanel({ canContinue }: { canContinue: boolean }) {
  return (
    <div className="w-[280px] shrink-0 flex flex-col gap-4">
      {/* Format card */}
      <div className="bg-white border border-outline-variant/60 rounded-2xl p-4">
        <h4 className="text-xs font-bold text-on-surface mb-3">Format yang didukung</h4>
        <p className="text-[11px] text-on-surface-variant mb-3">
          Hanya file PDF yang dapat diunggah.
        </p>
        <div className="flex items-center gap-3 bg-surface-container rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-red-600">PDF</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface">.pdf</p>
            <p className="text-[10px] text-on-surface-variant">Maks. 50 MB</p>
          </div>
        </div>
      </div>

      {/* Tips card */}
      <div className="bg-white border border-outline-variant/60 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold text-on-surface">Tips</h4>
        </div>
        <ul className="space-y-2.5">
          {[
            { title: "Pastikan file PDF tidak diproteksi",  desc: "File yang diproteksi tidak dapat diproses." },
            { title: "Ukuran file maksimal 50 MB",          desc: "Untuk performa terbaik." },
            { title: "Periksa isi dokumen",                 desc: "Pastikan semua halaman terbaca dengan jelas." },
            { title: "Simpan pekerjaan Anda",               desc: "Dokumen akan otomatis tersimpan." },
          ].map(({ title, desc }) => (
            <li key={title} className="flex items-start gap-2">
              <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-2.5 h-2.5 text-emerald-600" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-on-surface leading-tight">{title}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade card */}
      <div className="bg-white border border-outline-variant/60 rounded-2xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface">Butuh lebih banyak fitur?</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Dapatkan akses ke semua fitur premium
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container hover:border-primary/30 transition-colors"
        >
          Upgrade ke Pro
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Footer action buttons */}
      <div className="flex gap-3 mt-auto pt-2">
        <Link
          href="/"
          className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant text-center hover:bg-surface-container transition-colors"
        >
          Batal
        </Link>
        <button
          disabled={!canContinue}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all
            disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed
            enabled:bg-primary enabled:text-on-primary enabled:hover:brightness-110"
        >
          Lanjutkan
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function UploadPage() {
  const { user, setPdfFile, setPdfBytes, reset } = useESignStore();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + Math.floor(Math.random() * 15) + 5, 100);
      });
    }, 150);
  };

  // When progress reaches 100, load PDF and navigate
  const handleContinue = async () => {
    if (!selectedFile) return;
    reset();
    setPdfFile(selectedFile);
    const buffer = await selectedFile.arrayBuffer();
    setPdfBytes(new Uint8Array(buffer));
    router.push("/app");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f7ff]">
      <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col gap-6 h-full">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">Unggah Dokumen</h1>
          <p className="text-sm text-on-surface-variant">
            Unggah file PDF untuk mulai menambahkan tanda tangan.
          </p>
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-6 items-start">
          {/* Left: Stepper + DropZone + Security + Recent */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* 4-Step Progress */}
            <Stepper currentStep={1} />

            {/* Dropzone */}
            {!selectedFile ? (
              <UploadDropZone onFileSelected={handleFileSelected} />
            ) : (
              /* Upload progress state */
              <div className="bg-white rounded-2xl border border-outline-variant p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-red-600">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{selectedFile.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedFile(null); setIsUploading(false); setUploadProgress(0); }}
                    className="p-1.5 rounded-lg text-outline hover:text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isUploading && uploadProgress < 100 && (
                  <div>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
                      <span>Memproses...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadProgress === 100 && (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                    <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    File siap — klik Lanjutkan untuk mulai menandatangani
                  </div>
                )}
              </div>
            )}

            {/* Security Notice */}
            <SecurityNotice />

            {/* Recent files */}
            <RecentFiles />
          </div>

          {/* Right Info Panel */}
          <RightInfoPanel canContinue={selectedFile !== null && uploadProgress === 100} />
        </div>
      </div>
    </div>
  );
}
```

---

### Step 3: Modifikasi `src/app/app/page.tsx`

Ganti blok inline upload UI dengan komponen `<UploadPage />`:

```tsx
// Tambah import:
import { UploadPage } from "@/components/UploadPage";

// SEBELUM (baris ~160-224):
{!pdfBytes ? (
  <div className="flex-1 flex overflow-hidden">
    <WorkspaceSidebar />
    <main className="flex-1 overflow-y-auto p-6 md:p-10 ...">
      <div className="w-full max-w-3xl space-y-6">
        <Link href="/">Kembali ke Dashboard</Link>
        <div className="bg-white ...">
          <h1>Unggah Dokumen</h1>
          <DropZone />
        </div>
        <div className="grid grid-cols-3 ...">
          {/* 3 feature cards */}
        </div>
      </div>
    </main>
  </div>
) : (...)}

// SESUDAH:
{!pdfBytes ? (
  <div className="flex-1 flex overflow-hidden">
    <WorkspaceSidebar />
    <UploadPage />
  </div>
) : (...)}
```

> **Efek:** `UploadPage` mengelola state internal (selectedFile, progress) sendiri.
> Saat user klik "Lanjutkan", ia set pdfFile+pdfBytes ke store dan navigate ke `/app`.

---

## Design Tokens yang Digunakan

Semua komponen baru menggunakan CSS variables yang sudah ada:

```
--background: #f8f9ff         → bg halaman
--surface: #ffffff            → card bg
--surface-container-low: #eff4ff → sidebar bg, notices
--primary: #004782            → active state, CTA buttons
--on-primary: #ffffff         → text di atas primary
--on-surface: #0d1c2e         → judul, teks utama
--on-surface-variant: #424751 → teks sekunder
--outline-variant: #c2c6d2    → border card
--secondary: #006c4e          → tidak dipakai di halaman ini
```

---

## Catatan Teknis

### State Management

`UploadPage` bersifat self-contained:
- `selectedFile` — state lokal komponen
- `uploadProgress` — state lokal (simulasi progress)
- Saat selesai → set store (`setPdfFile`, `setPdfBytes`) → navigate `/app`

> **Tidak ada perubahan store** — semua state yang dibutuhkan sudah ada.

### Recent Files

Di `ui.png`, section "Terbaru diunggah" berisi file nyata dari storage backend.
Untuk Phase 2 ini, data **hardcode** sebagai dummy data.
Akan diganti dengan API call ke storage service di Phase 3.

```tsx
// Placeholder untuk future API:
// const { data: recentFiles } = useQuery({ queryKey: ["recent-files"], queryFn: fetchRecentFiles });
```

### Responsive Behavior

- **> 1024px:** Layout 2 kolom (main + right panel)
- **768px - 1024px:** Right panel menyempit atau collapse
- **< 768px:** Right panel hidden, semua konten full-width

```tsx
// Right panel responsive:
<div className="hidden lg:flex w-[280px] ...">
  <RightInfoPanel />
</div>
```

### Upload Progress

Progress saat ini disimulasikan (sama seperti `DropZone.tsx` existing).
Di Phase 3 dengan backend, progress bisa diganti dengan `XMLHttpRequest.upload.onprogress`.

---

## Verification Plan

1. Navigasi ke `/app` tanpa PDF → verifikasi tampilan halaman upload baru
2. Verifikasi stepper Step 1 aktif (biru), step 2-4 abu-abu
3. Drag & drop file PDF → verifikasi progress bar muncul
4. Klik "Pilih File PDF" → verifikasi file picker terbuka
5. Pilih file PDF → verifikasi nama file, size tampil + progress berjalan
6. Progress 100% → verifikasi pesan "File siap" + tombol "Lanjutkan" aktif
7. Klik "Lanjutkan" → verifikasi navigasi ke workspace editor `/app`
8. Klik "Batal" → verifikasi kembali ke halaman `/` (dashboard)
9. Verifikasi right panel: Format card, Tips card, Upgrade card muncul
10. Verifikasi sidebar "Dokumen Saya" aktif (highlighted biru)
11. Hover file di "Terbaru diunggah" → verifikasi tombol ✕ muncul
12. Klik ✕ → verifikasi file dihapus dari list
13. Resize ke 768px → verifikasi right panel hidden, layout single column

---

## Timeline Estimasi

| Step | Task | Estimasi |
|---|---|---|
| 1 | Modifikasi `WorkspaceSidebar.tsx` | 5 menit |
| 2 | Buat `UploadPage.tsx` (semua sub-components) | 90 menit |
| 3 | Modifikasi `app/app/page.tsx` | 10 menit |
| **Total** | | **~1.75 jam** |

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Upload progress 100% tapi state tidak sync | Gunakan `useEffect` watch `uploadProgress === 100` untuk enable CTA |
| Right panel overflow di layar kecil | Sembunyikan dengan `hidden lg:block` |
| "Terbaru diunggah" dengan dummy data membingungkan | Tambahkan badge "(Demo)" atau note kecil "Data sampel" |
| Route `/app` overlap antara upload state dan workspace state | Kondisi sudah ada: `!pdfBytes` → upload, `pdfBytes` → workspace |
| DropZone.tsx lama jadi tidak terpakai | Tetap pertahankan, mungkin masih dipakai di context lain |

---

*Dokumen ini dibuat: 2026-07-25*
*Referensi: `agents/ui page dokumen saya.png`*
*Penulis: Antigravity AI*
