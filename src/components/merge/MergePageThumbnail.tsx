"use client";

import { useEffect, useRef, useState } from "react";

export function MergePageThumbnail({
  pdfBytes,
}: {
  pdfBytes: Uint8Array;
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

        // Render first page only for the preview thumbnail
        const page = await pdf.getPage(1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvas: canvasRef.current!, canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.error("Gagal merender thumbnail:", err);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [rendered, pdfBytes]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border border-outline-variant bg-white shadow-sm flex items-center justify-center"
      style={{ width: 70, height: 95 }}
    >
      {rendered ? (
        <canvas ref={canvasRef} className="w-full h-full object-contain block" />
      ) : (
        <div className="w-full h-full bg-surface-container flex items-center justify-center">
          <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
