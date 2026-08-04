"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useESignStore } from "@/lib/store";

function ThumbnailPage({
  pageIndex,
  pdfBytes,
  isActive,
  onClick,
  onDelete,
  onRotate,
  onDuplicate,
  totalPages,
}: {
  pageIndex: number;
  pdfBytes: Uint8Array;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  totalPages: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !rendered) {
          setRendered(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [rendered]);

  useEffect(() => {
    if (!rendered || !canvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({
          data: pdfBytes.slice(),
          useSystemFonts: false,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(pageIndex + 1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvas: canvasRef.current!, canvasContext: ctx, viewport }).promise;
      } catch {
        // silently ignore render errors
      }
    };

    render();
    return () => { cancelled = true; };
  }, [rendered, pdfBytes, pageIndex]);

  const handleAction = async (action: () => Promise<void> | void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
      setShowActions(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="mx-2 mb-1 relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <div
        onClick={onClick}
        className={`
          cursor-pointer rounded-lg overflow-hidden border-2 transition-all
          ${isActive
            ? "border-primary shadow-md"
            : "border-transparent hover:border-outline-variant"
          }
        `}
        title={`Halaman ${pageIndex + 1}`}
      >
        <canvas ref={canvasRef} className="w-full block" />
        <div className="text-center text-[9px] text-on-surface-variant py-1 font-medium">
          {pageIndex + 1}
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      {showActions && !isLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/90 rounded-lg px-1 py-0.5 z-20 shadow-lg">
          {/* Rotate */}
          <button
            title="Putar 90°"
            className="p-1 text-white hover:text-yellow-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleAction(onRotate); }}
          >
            <span className="material-symbols-outlined text-[14px]">rotate_right</span>
          </button>

          {/* Duplicate */}
          <button
            title="Duplikat"
            className="p-1 text-white hover:text-blue-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleAction(onDuplicate); }}
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </button>

          {/* Delete — disabled if only 1 page */}
          <button
            title={totalPages <= 1 ? "Tidak bisa hapus halaman terakhir" : "Hapus Halaman"}
            disabled={totalPages <= 1}
            className="p-1 text-white hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={(e) => { e.stopPropagation(); if (totalPages > 1) handleAction(onDelete); }}
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center z-30">
          <span className="material-symbols-outlined text-primary text-[18px] animate-spin">progress_activity</span>
        </div>
      )}
    </div>
  );
}

export function ThumbnailPanel() {
  const {
    pdfBytes,
    totalPages,
    currentPage,
    setCurrentPage,
    thumbnailPanelOpen,
    deletePage,
    rotatePage,
    duplicatePage,
    insertBlankPage,
  } = useESignStore();

  const navigateToPage = useCallback(
    (pageNum: number) => {
      const el = document.querySelector(`[data-page-index="${pageNum}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(pageNum + 1);
      }
    },
    [setCurrentPage]
  );

  if (!pdfBytes || !thumbnailPanelOpen) return null;

  return (
    <div className="w-[180px] shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-outline-variant/50 shrink-0 flex items-center justify-between">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Halaman
        </p>
        {/* Insert blank page at end */}
        <button
          title="Sisipkan Halaman Kosong di Akhir"
          className="p-0.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
          onClick={() => insertBlankPage(totalPages - 1)}
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
        </button>
      </div>

      {/* Thumbnail list */}
      <div className="flex-1 overflow-y-auto py-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <ThumbnailPage
            key={`${i}-${totalPages}`}
            pageIndex={i}
            pdfBytes={pdfBytes}
            isActive={currentPage === i + 1}
            totalPages={totalPages}
            onClick={() => navigateToPage(i)}
            onDelete={() => deletePage(i)}
            onRotate={() => rotatePage(i, 90)}
            onDuplicate={() => duplicatePage(i)}
          />
        ))}
      </div>
    </div>
  );
}
