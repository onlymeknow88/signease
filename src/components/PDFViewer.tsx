"use client";

import { useEffect, useRef, useCallback } from "react";
import { useESignStore } from "@/lib/store";
import { AnnotationLayer } from "./AnnotationLayer";

// This component renders all PDF pages stacked vertically
export function PDFViewer() {
  const { pdfBytes, setTotalPages, totalPages, pdfScale } = useESignStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const pageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const renderTasksRef = useRef<(import("pdfjs-dist").RenderTask | null)[]>([]);
  const hasRendered = useRef(false);

  const renderPage = useCallback(
    async (pageNum: number, pdfDoc: import("pdfjs-dist").PDFDocumentProxy) => {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRefs.current[pageNum - 1];
      if (!canvas) return;

      const viewport = page.getViewport({ scale: pdfScale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Cancel previous render task for this page if any
      const existingTask = renderTasksRef.current[pageNum - 1];
      if (existingTask) {
        try { await existingTask.cancel(); } catch { /* ignore */ }
      }

      const renderTask = page.render({ canvas, canvasContext: ctx, viewport });
      renderTasksRef.current[pageNum - 1] = renderTask;
      await renderTask.promise;
    },
    [pdfScale]
  );

  // Reset loading flag when pdfBytes changes
  useEffect(() => {
    hasRendered.current = false;
    pdfDocRef.current = null;
  }, [pdfBytes]);

  useEffect(() => {
    if (!pdfBytes || hasRendered.current) return;

    const loadPDF = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      hasRendered.current = true;
    };

    loadPDF();
  }, [pdfBytes, setTotalPages]);

  // Render all pages when totalPages or pdfScale changes
  useEffect(() => {
    if (!pdfDocRef.current || totalPages === 0) return;

    const pdf = pdfDocRef.current;
    const renderAll = async () => {
      for (let i = 1; i <= totalPages; i++) {
        await renderPage(i, pdf);
      }
    };
    const timer = setTimeout(renderAll, 100);
    return () => clearTimeout(timer);
  }, [totalPages, pdfScale, renderPage]);

  if (!pdfBytes) return null;

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-8 py-8 px-4">
      {Array.from({ length: totalPages }).map((_, i) => (
        <PageWrapper
          key={i}
          pageIndex={i}
          canvasRef={(el) => (canvasRefs.current[i] = el)}
          pageContainerRef={(el) => (pageContainerRefs.current[i] = el)}
        />
      ))}
    </div>
  );
}

function PageWrapper({
  pageIndex,
  canvasRef,
  pageContainerRef,
}: {
  pageIndex: number;
  canvasRef: (el: HTMLCanvasElement | null) => void;
  pageContainerRef: (el: HTMLDivElement | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const setRef = (el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    pageContainerRef(el);
  };

  return (
    <div className="relative group pdf-page-container rounded-sm">
      {/* Page number badge */}
      <div className="absolute -top-6 left-0 text-xs text-muted-foreground font-medium px-2">
        Halaman {pageIndex + 1}
      </div>

      <div 
        ref={setRef} 
        className="relative p-0 bg-white shadow-xl border border-outline-variant/60 rounded-sm"
        onClick={() => useESignStore.getState().setSelectedAnnotationId(null)}
      >
        <canvas
          ref={canvasRef}
          className="block rounded-sm"
          style={{ display: "block" }}
        />
        <AnnotationLayer
          pageIndex={pageIndex}
          containerRef={containerRef}
          pageWidth={0}
          pageHeight={0}
        />
      </div>
    </div>
  );
}
