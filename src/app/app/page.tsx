"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useESignStore } from "@/lib/store";
import { Toolbar } from "@/components/Toolbar";
import { Button } from "@/components/ui/button";
import { TopNavBar } from "@/components/TopNavBar";
import { TopNavBarWorkspace } from "@/components/TopNavBarWorkspace";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import { ThumbnailPanel } from "@/components/ThumbnailPanel";
import { BottomNavBar } from "@/components/BottomNavBar";
import { SecurityBadge } from "@/components/SecurityBadge";
import { RightPanel } from "@/components/RightPanel";
import { UploadPage } from "@/components/UploadPage";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Info, CheckCircle, Copy } from "lucide-react";
import Link from "next/link";

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
    setPdfScale,
    totalPages,
    currentPage,
    setCurrentPage,
    annotations,
    user,
    setPlan,
    pdfHash,
    signedAt,
    downloadSignedPdf,
    reset,
    loadCertificates,
    loadSavedSignatures,
  } = useESignStore();

  const [sigPadOpen, setSigPadOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNudgeVisible, setIsNudgeVisible] = useState(true);

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync subscription status with DB on mount, and load certificates + signatures
  useEffect(() => {
    if (!mounted || !user.loggedIn) return;
    const syncStatus = async () => {
      try {
        const res = await fetch(`/api/subscription/status?email=${encodeURIComponent(user.email || "guest@example.com")}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.plan && data.plan !== user.plan) {
          setPlan(data.plan as "free" | "pro");
        }
      } catch {
        // fallback silently
      }
    };
    syncStatus();
    loadCertificates();
    loadSavedSignatures();
  }, [mounted, user.loggedIn, user.email, user.plan, setPlan, loadCertificates, loadSavedSignatures]);

  // Guard routing — redirect to login if not authenticated
  useEffect(() => {
    if (mounted && status !== "loading") {
      if (status === "unauthenticated" && !user.loggedIn) {
        router.push("/login");
      }
    }
  }, [mounted, status, user.loggedIn, router]);

  // Monitor scroll to update active page indicator
  useEffect(() => {
    if (!pdfBytes) return;
    const mainElement = document.querySelector("#pdf-scroll-container");
    if (!mainElement) return;

    const handleScroll = () => {
      const pageContainers = document.querySelectorAll(".pdf-page-container");
      let closestPage = 1;
      let closestDistance = Infinity;
      pageContainers.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const containerRect = mainElement.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerRect.top - containerRect.height / 3);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = idx + 1;
        }
      });
      if (closestPage !== currentPage) setCurrentPage(closestPage);
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [pdfBytes, currentPage, setCurrentPage]);

  // Ctrl+Scroll zoom
  useEffect(() => {
    if (!pdfBytes) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const cur = useESignStore.getState().pdfScale;
        setPdfScale(e.deltaY < 0 ? Math.min(2.0, cur + 0.15) : Math.max(0.5, cur - 0.15));
      }
    };
    window.addEventListener("wheel", handleWheel as EventListener, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel as EventListener);
  }, [pdfBytes, setPdfScale]);

  const handleDownload = async () => {
    const res = await downloadSignedPdf();
    if (res) setCertModalOpen(true);
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
      signedAt,
      sha256Hash: pdfHash,
      verificationUrl: "https://signease.app/verify",
      disclaimer:
        "Sertifikat integritas ini dibuat secara lokal oleh SignEase client-side PDF signer. Integritas berkas PDF dapat diverifikasi dengan menghitung SHA-256 berkas PDF yang ditandatangani dan membandingkannya dengan hash di atas.",
    };
    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate_${pdfFile?.name ? pdfFile.name.replace(".pdf", "") : "doc"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {!pdfBytes ? (
        /* ── Upload / Landing state ── */
        <>
          <WorkspaceSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopNavBar />
            <UploadPage />
          </div>
        </>
      ) : (
        /* ── Workspace editor state ── */
        <>
          <WorkspaceSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopNavBarWorkspace />

            {/* Free plan nudge banner */}
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

            {/* Main workspace row: thumbnails | canvas | right panel */}
            <div className="flex-1 flex overflow-hidden">
              <ThumbnailPanel />

              {/* Center: toolbar + PDF canvas */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-outline-variant px-3 py-1 flex items-center justify-center shrink-0 select-none z-50 relative">
                  <Toolbar onOpenSignaturePad={() => setSigPadOpen(true)} />
                </div>

                <div
                  id="pdf-scroll-container"
                  className="flex-1 overflow-auto min-h-0 p-8 flex justify-center items-start bg-surface-dim relative"
                >
                  <SecurityBadge />
                  <PDFViewer />
                </div>
              </div>

              <RightPanel />
            </div>

            <BottomNavBar />
          </div>
        </>
      )}

      {/* Signature Pad Modal */}
      {sigPadOpen && <SignaturePad onClose={() => setSigPadOpen(false)} />}

      {/* Certificate Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-on-surface">Dokumen Berhasil Ditandatangani</h2>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Unduh sertifikat digital untuk verifikasi
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-outline">Hash SHA-256</p>
                <div className="flex items-center gap-2 bg-surface-container rounded-xl p-3 border border-outline-variant">
                  <p className="text-[10px] font-mono text-on-surface-variant flex-1 break-all leading-relaxed">
                    {pdfHash}
                  </p>
                  <button
                    onClick={handleCopyHash}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-on-surface-variant" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-container rounded-xl p-3 border border-outline-variant">
                  <p className="text-outline mb-1">Penandatangan</p>
                  <p className="font-semibold text-on-surface truncate">{user.name}</p>
                </div>
                <div className="bg-surface-container rounded-xl p-3 border border-outline-variant">
                  <p className="text-outline mb-1">Ditandatangani</p>
                  <p className="font-semibold text-on-surface">
                    {signedAt ? new Date(signedAt).toLocaleDateString("id-ID") : "-"}
                  </p>
                </div>
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
