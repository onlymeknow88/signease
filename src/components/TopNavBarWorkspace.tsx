"use client";

import {
  CheckCircle,
  ChevronDown,
  Download,
  FileBadge2,
  FileDown,
  FileText,
  Loader2,
  Redo2,
  ShieldCheck,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useESignStore } from "@/lib/store";
import { DigitalCertificate } from "@/lib/types";
import { SigningPasswordDialog } from "@/components/SigningPasswordDialog";

export function TopNavBarWorkspace() {
  const {
    pdfFile,
    pdfScale,
    setPdfScale,
    history,
    historyIndex,
    undo,
    redo,
    downloadSignedPdf,
    setPendingCert,
    annotations,
    pdfHash,
    signedAt,
    user,
  } = useESignStore();

  const [zoomInput, setZoomInput] = useState(`${Math.round(pdfScale * 100)}`);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setZoomInput(`${Math.round(pdfScale * 100)}`);
  }, [pdfScale]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const zoomIn = () => setPdfScale(Math.min(2.0, pdfScale + 0.1));
  const zoomOut = () => setPdfScale(Math.max(0.5, pdfScale - 0.1));

  const handleZoomSubmit = () => {
    const clean = zoomInput.replace("%", "").trim();
    const parsed = parseInt(clean);
    if (!isNaN(parsed)) {
      setPdfScale(Math.max(0.5, Math.min(2.0, parsed / 100)));
    } else {
      setZoomInput(`${Math.round(pdfScale * 100)}`);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfFile || isDownloading) return;
    setDownloadOpen(false);
    setIsDownloading(true);
    try {
      await downloadSignedPdf();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCert = useCallback(() => {
    if (!pdfHash || !signedAt) return;
    setDownloadOpen(false);
    const certData = {
      signerName: user.name,
      signerEmail: user.email,
      documentName: pdfFile?.name || "signed_document.pdf",
      signedAt,
      sha256Hash: pdfHash,
      verificationUrl: "https://signease.app/verify",
      disclaimer:
        "Sertifikat integritas ini dibuat secara lokal oleh SignEase client-side PDF signer.",
    };
    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate_${pdfFile?.name ? pdfFile.name.replace(".pdf", "") : "doc"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfHash, signedAt, user, pdfFile]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const fileName = pdfFile?.name ?? "Dokumen tanpa judul";
  const canDownload = !isDownloading && !!pdfFile && annotations.length > 0;

  return (
    <header className="h-12 border-b border-outline-variant bg-surface-container-low flex items-center px-4 gap-3 shrink-0 z-20">
      {/* Logo — SVG + tagline */}
      <Link href="/" className="flex items-center shrink-0">
        <img src="/logo.png" alt="SignEase Logo" className="h-10 w-auto object-contain" />
      </Link>

      {/* Divider */}
      <div className="w-px h-5 bg-outline-variant" />

      {/* File name + badge Disimpan */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileText className="w-4 h-4 text-on-surface-variant shrink-0" />
        <span className="text-sm font-medium text-on-surface truncate max-w-xs" title={fileName}>
          {fileName}
        </span>
        {pdfFile && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            <CheckCircle className="w-3 h-3" />
            Disimpan
          </span>
        )}
      </div>

      {/* Center controls: Undo / Redo / Zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <button
          onClick={zoomOut}
          disabled={pdfScale <= 0.5}
          title="Perkecil"
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={zoomInput}
          onChange={(e) => setZoomInput(e.target.value)}
          onBlur={handleZoomSubmit}
          onKeyDown={(e) => { if (e.key === "Enter") handleZoomSubmit(); }}
          className="w-14 text-center text-xs font-semibold bg-surface border border-outline-variant rounded-lg py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          aria-label="Level zoom"
        />
        <span className="text-xs text-on-surface-variant">%</span>
        <button
          onClick={zoomIn}
          disabled={pdfScale >= 2.0}
          title="Perbesar"
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Verifikasi PDF */}
        {/* <Link
          href="/verify"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-outline-variant text-on-surface-variant rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors"
          title="Verifikasi tanda tangan digital PDF"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Verifikasi PDF</span>
        </Link> */}

        {/* Unduh — dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDownloadOpen(!downloadOpen)}
            disabled={!canDownload}
            title={annotations.length === 0 ? "Tambahkan tanda tangan terlebih dahulu" : "Unduh dokumen"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:block">Unduh</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {downloadOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-outline-variant rounded-xl shadow-xl overflow-hidden w-56 z-50 animate-slide-in">
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-on-surface hover:bg-surface-container transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-primary" />
                Unduh PDF Bertanda Tangan
              </button>
              <div className="h-px bg-outline-variant/50" />
              <button
                onClick={handleDownloadCert}
                disabled={!pdfHash}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FileBadge2 className="w-3.5 h-3.5 text-outline" />
                Unduh Sertifikat (.json)
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}