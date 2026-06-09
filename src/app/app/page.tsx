"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useESignStore } from "@/lib/store";
import { Toolbar } from "@/components/Toolbar";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/button";
import { TopNavBar } from "@/components/TopNavBar";
import { RightPanel } from "@/components/RightPanel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  FileText,
  ShieldCheck,
  CheckCircle,
  Copy,
  Info,
  Lock,
  ArrowLeft,
} from "lucide-react";

// Dynamically import heavy components — avoids SSR issues with pdfjs + canvas
const PDFViewer = dynamic(
  () => import("@/components/PDFViewer").then((m) => m.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Memuat dokumen...</p>
      </div>
    ),
  }
);

const SignaturePad = dynamic(
  () => import("@/components/SignaturePad").then((m) => m.SignaturePad),
  { ssr: false }
);

export default function AppWorkspace() {
  const {
    pdfFile,
    pdfBytes,
    pdfScale,
    totalPages,
    currentPage,
    annotations,
    user,
    pdfHash,
    signedAt,
    setPdfScale,
    setCurrentPage,
    downloadSignedPdf,
    reset,
  } = useESignStore();

  const [sigPadOpen, setSigPadOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNudgeVisible, setIsNudgeVisible] = useState(true);

  const [zoomInput, setZoomInput] = useState("");
  const [pageInput, setPageInput] = useState("");

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard routing - redirect to login if not logged in
  // Wait for NextAuth session to finish loading to avoid race conditions
  useEffect(() => {
    if (mounted && status !== "loading") {
      if (status === "unauthenticated" && !user.loggedIn) {
        router.push("/login");
      }
    }
  }, [mounted, status, user.loggedIn, router]);

  // Sync inputs with store state
  useEffect(() => {
    setZoomInput(`${Math.round(pdfScale * 100)}`);
  }, [pdfScale]);

  useEffect(() => {
    setPageInput(`${currentPage}`);
  }, [currentPage]);

  // Handle zooming
  const zoomIn = () => setPdfScale(Math.min(2.0, pdfScale + 0.1));
  const zoomOut = () => setPdfScale(Math.max(0.5, pdfScale - 0.1));

  const handleZoomSubmit = () => {
    const cleanValue = zoomInput.replace("%", "").trim();
    const parsed = parseInt(cleanValue);
    if (!isNaN(parsed)) {
      const scale = Math.max(0.5, Math.min(2.0, parsed / 100));
      setPdfScale(scale);
    } else {
      setZoomInput(`${Math.round(pdfScale * 100)}`);
    }
  };

  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput.trim());
    if (!isNaN(parsed)) {
      const targetPage = Math.max(1, Math.min(totalPages, parsed));
      const pageEl = document.querySelectorAll(".pdf-page-container")[
        targetPage - 1
      ];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(targetPage);
      } else {
        setPageInput(`${currentPage}`);
      }
    } else {
      setPageInput(`${currentPage}`);
    }
  };

  // Navigation between pages
  const navigatePage = useCallback(
    (direction: "prev" | "next") => {
      const targetPage =
        direction === "prev"
          ? Math.max(1, currentPage - 1)
          : Math.min(totalPages, currentPage + 1);

      const pageEl = document.querySelectorAll(".pdf-page-container")[
        targetPage - 1
      ];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(targetPage);
      }
    },
    [currentPage, totalPages, setCurrentPage]
  );

  // Monitor scroll in PDF viewer to update active page number
  useEffect(() => {
    if (!pdfBytes) return;

    const mainElement = document.querySelector("#pdf-scroll-container");
    if (!mainElement) return;

    const handleScroll = () => {
      const pageContainers = document.querySelectorAll(".pdf-page-container");
      let activeIndex = 0;
      let minDistance = Infinity;

      const mainRect = mainElement.getBoundingClientRect();
      const centerY = mainRect.top + mainRect.height / 2;

      pageContainers.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - centerY);
        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = index;
        }
      });

      setCurrentPage(activeIndex + 1);
    };

    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [pdfBytes, setCurrentPage]);

  // Handle mouse wheel zoom (Ctrl + Scroll / Trackpad Pinch)
  useEffect(() => {
    if (!pdfBytes) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const currentScale = useESignStore.getState().pdfScale;
        if (e.deltaY < 0) {
          // Zoom In
          setPdfScale(Math.min(2.0, currentScale + 0.15));
        } else {
          // Zoom Out
          setPdfScale(Math.max(0.5, currentScale - 0.15));
        }
      }
    };

    window.addEventListener("wheel", handleWheel as any, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel as any);
    };
  }, [pdfBytes, setPdfScale]);

  const handleDownload = async () => {
    const res = await downloadSignedPdf();
    if (res) {
      setCertModalOpen(true);
    }
  };

  const handleCopyHash = () => {
    if (pdfHash) {
      navigator.clipboard.writeText(pdfHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCertificateJson = () => {
    if (!pdfHash || !signedAt) return;
    const certData = {
      signerName: user.name,
      signerEmail: user.email,
      documentName: pdfFile?.name || "signed_document.pdf",
      signedAt: signedAt,
      sha256Hash: pdfHash,
      verificationUrl: "https://signease.app/verify",
      disclaimer: "Sertifikat integritas ini dibuat secara lokal oleh SignEase client-side PDF signer. Integritas berkas PDF dapat diverifikasi dengan menghitung SHA-256 berkas PDF yang ditandatangani dan membandingkannya dengan hash di atas.",
    };

    const blob = new Blob([JSON.stringify(certData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate_${pdfFile?.name ? pdfFile.name.replace(".pdf", "") : "doc"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {!pdfBytes && <TopNavBar />}

      {!pdfBytes ? (
        <div className="flex-1 flex overflow-hidden">
          {/* SideNavBar */}
          <aside className="hidden md:flex flex-col h-full py-4 px-2 border-r border-outline-variant bg-slate-50 w-[240px] shrink-0 select-none">
            <div className="px-2 mb-6">
              <div className="flex items-center gap-2 p-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">SignEase Pro</p>
                  <p className="text-[9px] text-on-surface-variant">Digital Assurance</p>
                </div>
              </div>
              <button
                className="w-full mt-4 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                onClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (input) input.click();
                }}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New Request
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              <Link href="/" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 rounded-lg text-on-surface-variant text-xs font-medium transition-colors">
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg text-xs">
                <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 opacity-50 cursor-not-allowed text-on-surface-variant text-xs font-medium">
                <span className="material-symbols-outlined text-[20px]">draw</span>
                <span>Signed</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 opacity-50 cursor-not-allowed text-on-surface-variant text-xs font-medium">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span>Certificates</span>
              </div>
            </nav>
            <div className="mt-auto space-y-1 border-t border-outline-variant pt-4">
              <div className="flex items-center gap-3 px-4 py-2 opacity-50 cursor-not-allowed text-on-surface-variant text-xs font-medium">
                <span className="material-symbols-outlined text-[20px]">help</span>
                <span>Help</span>
              </div>
              <button
                onClick={() => { reset(); signOut({ callbackUrl: "/" }); }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 rounded-lg text-on-surface-variant text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center bg-slate-50">
            <div className="w-full max-w-3xl space-y-6">
              {/* Back Action */}
              <Link href="/" className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline transition-all w-fit">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali ke Dashboard
              </Link>

              {/* Document Upload Section */}
              <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col items-center p-8 md:p-10 relative">
                {/* Progress Overlay (Subtle) */}
                <div className="w-full text-center mb-6">
                  <h1 className="text-2xl font-bold text-on-surface mb-2">Unggah Dokumen</h1>
                  <p className="text-on-surface-variant text-xs max-w-md mx-auto">
                    Persiapkan kontrak atau dokumen legal Anda untuk tanda tangan digital aman.
                  </p>
                </div>

                {/* Dropzone container */}
                <div className="w-full relative z-10">
                  <DropZone />
                </div>

                {/* Visual Accents */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
              </div>

              {/* Guidance Footer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-4 bg-white border border-outline-variant/60 rounded-xl flex gap-3 items-start shadow-sm">
                  <span className="material-symbols-outlined text-emerald-600 text-[24px]">verified</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Legalitas Terjamin</p>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
                      E-signature kami memenuhi standar hukum eIDAS dan UU ITE.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white border border-outline-variant/60 rounded-xl flex gap-3 items-start shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">shield_lock</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Enkripsi AES-256</p>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
                      Dokumen Anda dilindungi enkripsi tingkat perbankan.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white border border-outline-variant/60 rounded-xl flex gap-3 items-start shadow-sm">
                  <span className="material-symbols-outlined text-on-surface text-[24px]">history_edu</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Audit Trail</p>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
                      Setiap aksi tercatat lengkap dalam log aktivitas dokumen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* ── Sub-Header ── */}
          <section className="bg-white h-14 border-b border-outline-variant flex items-center px-4 justify-between z-20 shrink-0 select-none gap-3">
            {/* Left: back + filename */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={reset}
                className="p-2 border border-outline-variant rounded-lg cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
              </button>
              <div className="flex flex-col min-w-0">
                <h1 className="font-semibold text-sm text-on-surface truncate max-w-[160px] sm:max-w-[240px]">
                  {pdfFile?.name || "Untitled Document.pdf"}
                </h1>
                <span className="text-[10px] text-outline">
                  Terakhir disimpan baru saja
                </span>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Tautan workspace berhasil disalin!");
                }}
                className="flex items-center gap-1.5 px-3 h-9 border border-outline-variant text-on-surface hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span className="hidden sm:inline">Bagikan</span>
              </button>
              <Button
                onClick={handleDownload}
                disabled={annotations.length === 0}
                className="bg-primary text-on-primary hover:brightness-115 transition-all active:scale-95 flex items-center gap-2 h-9 text-xs font-bold px-4 rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh PDF</span>
              </Button>
            </div>
          </section>


          {/* ── Nudge Banner for Free Users ── */}
          {user.plan === "free" && isNudgeVisible && (
            <div className="bg-primary-container text-on-primary-container px-6 py-2.5 flex items-center justify-between shadow-sm z-30 shrink-0 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs sm:text-sm font-medium">
                  Dokumen hasil unduhan Anda akan memiliki watermark.{" "}
                  <Link href="/pricing" className="underline font-bold hover:text-primary">
                    Upgrade ke Pro
                  </Link>{" "}
                  untuk hasil bersih tanpa watermark.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/pricing"
                  className="hidden sm:block text-xs bg-primary text-on-primary px-3 py-1 rounded-lg hover:brightness-110 font-bold"
                >
                  Lihat Paket Pro →
                </Link>
                <button
                  className="p-1 hover:bg-on-primary-container/10 rounded-full transition-colors"
                  onClick={() => setIsNudgeVisible(false)}
                >
                  <span className="material-symbols-outlined text-[16px] block">close</span>
                </button>
              </div>
            </div>
          )}


          {/* ── Main App Body ── */}
          <div className="flex-1 flex overflow-hidden">
            {/* Document Canvas */}
            <div className="flex-1 bg-surface-dim relative flex flex-col">

              {/* ── Horizontal Tool Strip (canvas width only) ── */}
              <div className="bg-white border-b border-outline-variant px-3 py-1 flex items-center justify-center shrink-0 select-none z-50 relative">
                <Toolbar onOpenSignaturePad={() => setSigPadOpen(true)} />
              </div>

              <div
                id="pdf-scroll-container"
                className="flex-1 overflow-auto min-h-0 p-8 flex justify-center items-start"
              >
                <div className="relative">
                  <PDFViewer />
                </div>
              </div>

              {/* Floating Controls for Zoom/Pages */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-outline-variant px-4 py-2 rounded-full flex items-center gap-4 shadow-lg z-30">
                <button
                  onClick={zoomOut}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                 <div className="flex items-center text-xs font-bold border-x border-outline-variant px-2 text-on-surface">
                  <input
                    type="text"
                    value={zoomInput}
                    onChange={(e) => setZoomInput(e.target.value)}
                    onBlur={handleZoomSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleZoomSubmit();
                      }
                    }}
                    className="w-10 text-center bg-transparent border-none outline-none font-bold text-xs p-0 focus:ring-0"
                  />
                  <span className="text-xs font-bold">%</span>
                </div>
                <button
                  onClick={zoomIn}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-outline-variant"></div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigatePage("prev")}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 text-xs font-semibold text-on-surface">
                    <span className="text-outline">Hal</span>
                    <input
                      type="text"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={handlePageSubmit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handlePageSubmit();
                        }
                      }}
                      className="w-8 py-0.5 text-center bg-slate-50 border border-outline-variant rounded font-semibold text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-outline">/ {totalPages}</span>
                  </div>
                  <button
                    onClick={() => navigatePage("next")}
                    disabled={currentPage >= totalPages}
                    className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <RightPanel />
          </div>
        </div>
      )}

      {/* Signature Pad Dialog */}
      {sigPadOpen && <SignaturePad onClose={() => setSigPadOpen(false)} />}

      {/* ── Document Integrity Certificate Modal ── */}
      {certModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center text-center border-b border-outline-variant bg-surface-container-low">
              <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center mb-3 text-secondary shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="font-bold text-lg text-on-surface">
                Sertifikat Integritas Dokumen
              </h2>
              <p className="text-xs text-secondary mt-1 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 fill-secondary text-white" />
                Digitally Signed (Client-Side)
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Penanda Tangan</p>
                  <p className="font-semibold text-on-surface mt-0.5">{user.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-on-surface mt-0.5 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Nama Dokumen</p>
                  <p className="font-semibold text-on-surface mt-0.5 truncate">{pdfFile?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Tanggal TTD</p>
                  <p className="font-semibold text-on-surface mt-0.5">
                    {signedAt ? new Date(signedAt).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
              </div>

              {/* SHA-256 Hash Copy Block */}
              <div className="bg-surface-container p-3 rounded-xl border border-outline-variant">
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">SHA-256 Hash</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-on-surface-variant break-all select-all">
                    {pdfHash}
                  </code>
                  <button
                    onClick={handleCopyHash}
                    className="shrink-0 p-1.5 bg-white border border-outline-variant hover:bg-surface-container-low rounded-lg text-primary transition-colors flex items-center justify-center"
                    title="Salin Hash"
                  >
                    {copied ? (
                      <span className="text-[10px] font-bold text-secondary">Selesai</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic leading-normal">
                Sertifikat ini dienkripsi secara lokal. Integritas penuh dapat diverifikasi ulang dengan melakukan hash SHA-256 pada file PDF.
              </p>

              {/* Official Seal / Gembok Gating */}
              <div className="relative border-2 border-secondary/20 bg-secondary/5 p-4 rounded-xl flex flex-col items-center overflow-hidden min-h-[90px] justify-center">
                {user.plan === "free" && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 group/tooltip cursor-help">
                    <Lock className="w-6 h-6 text-primary" />
                    <p className="text-[11px] font-bold text-primary mt-1 uppercase tracking-wider">Pro Only</p>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mb-8 w-52 p-2 bg-inverse-surface text-inverse-on-surface text-[10px] rounded-lg shadow-xl hidden group-hover/tooltip:block text-center z-20">
                      Fitur Segel Resmi (Official Seal) hanya tersedia bagi pengguna Pro.
                    </div>
                  </div>
                )}
                <div className="absolute -right-4 -bottom-4 opacity-[0.08] text-secondary">
                  <ShieldCheck className="w-24 h-24" />
                </div>
                <p className="text-[10px] text-secondary uppercase tracking-widest font-extrabold">Official Seal</p>
                <p className="font-bold text-sm text-secondary mt-0.5">{user.name.toUpperCase()}</p>
                <p className="text-[10px] text-secondary/80">
                  {signedAt ? new Date(signedAt).toLocaleDateString("id-ID") : "-"}
                </p>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex gap-3">
              <Button
                className="flex-1 bg-primary text-on-primary hover:brightness-110 font-bold h-10 text-xs"
                onClick={handleDownloadCertificateJson}
              >
                Unduh Sertifikat (.json)
              </Button>
              <Button
                variant="outline"
                className="px-4 border-outline-variant text-on-surface-variant hover:bg-surface-container-high h-10 text-xs"
                onClick={() => setCertModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
