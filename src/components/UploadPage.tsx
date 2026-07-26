"use client";

import { useRef, useState, useEffect } from "react";
import { useESignStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Upload,
  FileText,
  ShieldCheck,
  Lightbulb,
  Lock,
  X,
  ChevronRight,
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

// ─── UploadDropZone ─────────────────────────────────────────────────────────────

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
      onClick={() => inputRef.current?.click()}
      className={`
        w-full rounded-2xl border-2 border-dashed transition-all duration-200
        flex flex-col items-center justify-center py-12 px-6 cursor-pointer
        ${isDragging
          ? "border-primary bg-primary/5 scale-[0.995]"
          : "border-primary/40 bg-white hover:border-primary/70 hover:bg-primary/[0.02]"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      {/* Cloud Upload SVG Icon */}
      <div className={`mb-5 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M32 44V24M32 24L24 32M32 24L40 32" stroke="#004782" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 48C10.477 48 6 43.523 6 38C6 33.054 9.565 28.922 14.268 28.107C14.092 27.263 14 26.392 14 25.5C14 18.596 19.596 13 26.5 13C30.533 13 34.13 14.934 36.44 17.937C37.571 17.647 38.768 17.5 40 17.5C47.732 17.5 54 23.768 54 31.5C54 31.667 53.997 31.834 53.99 32H54C57.866 32 61 35.134 61 39C61 42.866 57.866 46 54 46" stroke="#004782" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h3 className="text-base font-bold text-on-surface mb-1 text-center">
        Seret &amp; lepas file PDF di sini
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

// ─── PDF Mock Generator ───────────────────────────────────────────────────────

async function generateMockPdf(fileName: string): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const Helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const HelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title
  page.drawText(fileName, {
    x: 50,
    y: height - 80,
    size: 20,
    font: HelveticaBold,
    color: rgb(0, 0.28, 0.51),
  });

  page.drawText("DOKUMEN SIMULASI - RIWAYAT UNGGAHAN", {
    x: 50,
    y: height - 105,
    size: 9,
    font: Helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Divider
  page.drawLine({
    start: { x: 50, y: height - 120 },
    end: { x: width - 50, y: height - 120 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Content Text
  const paragraphs = [
    "Dokumen ini dipulihkan dari daftar unggahan terbaru Anda.",
    "Ini adalah simulasi dokumen PDF untuk pengujian tanda tangan digital.",
    "Semua fitur pengeditan seperti menambahkan tanda tangan, teks, dan tanggal dapat",
    "digunakan sepenuhnya pada dokumen ini.",
    "",
    "Petunjuk Penggunaan:",
    "1. Tarik tanda tangan dari panel samping kiri ke halaman dokumen ini.",
    "2. Gunakan Toolbar untuk mengganti alat tanda tangan atau teks.",
    "3. Unduh hasil akhir setelah selesai menandatangani dokumen.",
  ];

  let currentY = height - 160;
  for (const text of paragraphs) {
    if (text === "") {
      currentY -= 10;
      continue;
    }
    const isHeader = text.startsWith("Petunjuk");
    page.drawText(text, {
      x: 50,
      y: currentY,
      size: isHeader ? 11 : 10,
      font: isHeader ? HelveticaBold : Helvetica,
      color: rgb(0.15, 0.15, 0.15),
    });
    currentY -= 18;
  }

  // Second Page for signatures
  const page2 = pdfDoc.addPage([595, 842]);
  page2.drawText("Halaman Persetujuan", {
    x: 50,
    y: height - 80,
    size: 16,
    font: HelveticaBold,
    color: rgb(0, 0.28, 0.51),
  });

  page2.drawLine({
    start: { x: 50, y: height - 100 },
    end: { x: width - 50, y: height - 100 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  page2.drawText("Dengan menandatangani dokumen ini, para pihak menyetujui seluruh ketentuan.", {
    x: 50,
    y: height - 130,
    size: 10,
    font: Helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Draw signature boxes
  page2.drawText("Pihak Pertama,", {
    x: 80,
    y: height - 200,
    size: 10,
    font: HelveticaBold,
  });
  page2.drawText("Pihak Kedua,", {
    x: 380,
    y: height - 200,
    size: 10,
    font: HelveticaBold,
  });

  // Box 1
  page2.drawRectangle({
    x: 80,
    y: height - 320,
    width: 140,
    height: 100,
    borderWidth: 1,
    borderColor: rgb(0.7, 0.7, 0.7),
  });
  page2.drawText("Area Tanda Tangan", {
    x: 110,
    y: height - 270,
    size: 8,
    font: Helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Box 2
  page2.drawRectangle({
    x: 380,
    y: height - 320,
    width: 140,
    height: 100,
    borderWidth: 1,
    borderColor: rgb(0.7, 0.7, 0.7),
  });
  page2.drawText("Area Tanda Tangan", {
    x: 410,
    y: height - 270,
    size: 8,
    font: Helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes.buffer as ArrayBuffer], fileName, { type: "application/pdf" });
}

// ─── Recent Files ───────────────────────────────────────────────────────────────

function RecentFiles({
  files,
  onRemove,
  onSelectFile,
}: {
  files: RecentFile[];
  onRemove: (id: string) => void;
  onSelectFile: (name: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-on-surface">Terbaru diunggah</h3>
        <button className="text-xs text-primary font-semibold hover:underline transition-colors">
          Lihat semua
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelectFile(file.name)}
            className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-outline-variant/60 hover:border-primary/30 transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-red-600">PDF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">{file.name}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                {file.size} • {file.time}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
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

function RightInfoPanel({ canContinue, onContinue }: { canContinue: boolean; onContinue: () => void }) {
  const { user } = useESignStore();

  return (
    <div className="hidden lg:flex w-[280px] shrink-0 flex-col gap-4">
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
      {user.plan !== "pro" && (
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
      )}

      {/* Footer action buttons */}
      <div className="flex gap-3 mt-auto pt-2">
        <Link
          href="/"
          className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant text-center hover:bg-surface-container transition-colors"
        >
          Batal
        </Link>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`
            flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all
            ${canContinue
              ? "bg-primary text-on-primary hover:brightness-110 active:scale-95"
              : "bg-surface-container text-on-surface-variant cursor-not-allowed"
            }
          `}
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
  const { setPdfFile, setPdfBytes, reset } = useESignStore();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("signease_recent_files");
      if (saved) {
        try {
          setRecentFiles(JSON.parse(saved));
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate processing progress
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

  const handleRecentFileSelect = async (fileName: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = await generateMockPdf(fileName);
      setSelectedFile(file);

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return Math.min(prev + Math.floor(Math.random() * 20) + 10, 100);
        });
      }, 80);
    } catch (err) {
      console.error("Gagal memuat file riwayat:", err);
      setIsUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedFile || uploadProgress < 100) return;

    // Add to recent files
    const formatSize = (bytes: number) => {
      if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
      return (bytes / 1024).toFixed(0) + " KB";
    };
    const formatTime = () => {
      const now = new Date();
      return now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    };
    const newFile: RecentFile = {
      id: Date.now().toString(),
      name: selectedFile.name,
      size: formatSize(selectedFile.size),
      time: formatTime(),
    };

    const updated = [newFile, ...recentFiles.filter((f) => f.name !== selectedFile.name)].slice(0, 5);
    setRecentFiles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("signease_recent_files", JSON.stringify(updated));
    }

    reset();
    setPdfFile(selectedFile);
    const buffer = await selectedFile.arrayBuffer();
    setPdfBytes(new Uint8Array(buffer));
    // router.push stays on /app — workspace state activates automatically
  };

  const handleRemoveRecentFile = (id: string) => {
    const updated = recentFiles.filter((f) => f.id !== id);
    setRecentFiles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("signease_recent_files", JSON.stringify(updated));
    }
  };

  const canContinue = selectedFile !== null && uploadProgress === 100;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f7ff]">
      <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">Unggah Dokumen</h1>
          <p className="text-sm text-on-surface-variant">
            Unggah file PDF untuk mulai menambahkan tanda tangan.
          </p>
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-6 items-start">
          {/* Left column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* 4-Step Stepper */}
            <Stepper currentStep={1} />

            {/* Dropzone or upload progress */}
            {!selectedFile ? (
              <UploadDropZone onFileSelected={handleFileSelected} />
            ) : (
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

            {/* Recent Files */}
            <RecentFiles
              files={recentFiles}
              onRemove={handleRemoveRecentFile}
              onSelectFile={handleRecentFileSelect}
            />

            {/* Mobile footer buttons (hidden on lg) */}
            <div className="flex gap-3 lg:hidden">
              <Link
                href="/"
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant text-center hover:bg-surface-container transition-colors"
              >
                Batal
              </Link>
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                  ${canContinue
                    ? "bg-primary text-on-primary hover:brightness-110 active:scale-95"
                    : "bg-surface-container text-on-surface-variant cursor-not-allowed"
                  }
                `}
              >
                Lanjutkan
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Info Panel */}
          <RightInfoPanel canContinue={canContinue} onContinue={handleContinue} />
        </div>
      </div>
    </div>
  );
}
