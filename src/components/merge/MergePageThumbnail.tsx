"use client";

import { useEffect, useRef, useState } from "react";

export function MergePageThumbnail({
  pdfBytes,
  rotation = 0,
}: {
  pdfBytes: Uint8Array;
  rotation?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const pdfBytesRef = useRef(pdfBytes);
  pdfBytesRef.current = pdfBytes;
  const pdfBytesId = pdfBytes.length;

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
    if (!rendered) return;

    let cancelled = false;

    const render = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({
          data: pdfBytesRef.current.slice(),
          useSystemFonts: false,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        // Render at rotation=0 always, apply visual rotation via CSS
        const viewport = page.getViewport({ scale: 0.25, rotation: 0 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.error("Gagal merender thumbnail:", err);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered, pdfBytesId]);

  const isLandscape = rotation === 90 || rotation === 270;

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border border-outline-variant bg-white shadow-sm flex items-center justify-center"
      style={isLandscape ? { width: 95, height: 70 } : { width: 70, height: 95 }}
    >
      {rendered ? (
        <canvas
          ref={canvasRef}
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
            maxWidth: isLandscape ? "70px" : "100%",
            maxHeight: isLandscape ? "100%" : "95px",
            display: "block",
          }}
        />
      ) : (
        <div className="w-full h-full bg-surface-container flex items-center justify-center">
          <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
