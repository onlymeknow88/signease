"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useESignStore } from "@/lib/store";

interface ThumbnailItem {
  pageIndex: number;
  dataUrl: string;
}

function ThumbnailPage({
  pageIndex,
  pdfBytes,
  isActive,
  onClick,
}: {
  pageIndex: number;
  pdfBytes: Uint8Array;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

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

        const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
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

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`
        mx-2 mb-2 cursor-pointer rounded-lg overflow-hidden border-2 transition-all
        ${isActive
          ? "border-primary shadow-md"
          : "border-transparent hover:border-outline-variant"
        }
      `}
      title={`Halaman ${pageIndex + 1}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full block bg-white"
        style={{ minHeight: 90 }}
      />
      <div
        className={`
          text-center py-1 text-[10px] font-semibold
          ${isActive ? "text-primary" : "text-on-surface-variant"}
        `}
      >
        {pageIndex + 1}
      </div>
    </div>
  );
}

export function ThumbnailPanel() {
  const { pdfBytes, totalPages, currentPage, setCurrentPage, thumbnailPanelOpen } =
    useESignStore();

  const navigateToPage = useCallback(
    (pageIndex: number) => {
      const pageNum = pageIndex + 1;
      const pageEl = document.querySelectorAll(".pdf-page-container")[pageIndex];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(pageNum);
      }
    },
    [setCurrentPage]
  );

  if (!pdfBytes || !thumbnailPanelOpen) return null;

  return (
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
          <ThumbnailPage
            key={i}
            pageIndex={i}
            pdfBytes={pdfBytes}
            isActive={currentPage === i + 1}
            onClick={() => navigateToPage(i)}
          />
        ))}
      </div>
    </div>
  );
}
