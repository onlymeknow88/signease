"use client";

/**
 * Extract text from a PDF page and return as positioned items.
 * For digital PDFs: uses pdfjs-dist getTextContent()
 * For scanned PDFs: uses tesseract.js OCR on rendered canvas
 */

export interface ExtractedTextItem {
  text: string;
  /** X ratio (0..1) relative to page width */
  xRatio: number;
  /** Y ratio (0..1) relative to page height */
  yRatio: number;
  /** Width ratio (0..1) relative to page width */
  widthRatio: number;
  /** Height ratio (0..1) relative to page height */
  heightRatio: number;
  /** Font size in PDF points */
  fontSize: number;
  /** Whether this came from OCR (vs text layer) */
  isOcrResult: boolean;
}

/**
 * Extract text from a PDF page using pdfjs-dist text layer.
 * Returns empty array if no text layer found.
 */
export async function extractTextFromPdfLayer(
  pdfBytes: Uint8Array,
  pageIndex: number,
  viewportWidth: number,
  viewportHeight: number
): Promise<ExtractedTextItem[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjsLib.getDocument({
    data: pdfBytes.slice(),
    useSystemFonts: false,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
  }).promise;
  const page = await pdf.getPage(pageIndex + 1);
  // Use rotation so viewport matches actual rendered orientation
  const rotation = page.rotate ?? 0;
  const viewport = page.getViewport({ scale: 1.0, rotation });
  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  const textContent = await page.getTextContent();
  console.log(`extractTextFromPdfLayer: pageIndex=${pageIndex}, items=${textContent.items.length}, pageWidth=${pageWidth}, pageHeight=${pageHeight}, rotation=${page.rotate}`);

  const items: ExtractedTextItem[] = [];

  for (const item of textContent.items) {
    const i = item as any;
    if (!i.str || i.str.trim() === "") continue;

    // transform = [sx, shx, shy, sy, tx, ty]
    const transform = i.transform;
    const fontSize = Math.abs(transform[3]); // sy = font size in PDF pts
    const tx = transform[4]; // x in PDF coords (origin bottom-left)
    const ty = transform[5]; // y in PDF coords

    // Convert PDF coords (bottom-left origin) to viewport coords (top-left origin)
    const vx = tx;
    const vy = pageHeight - ty - fontSize;

    // Estimate width from string length + font size
    const estimatedWidth = i.width ?? (i.str.length * fontSize * 0.6);
    const estimatedHeight = fontSize * 1.2;

    // Clamp and normalize to 0..1 ratios
    const xRatio = Math.max(0, vx / pageWidth);
    const yRatio = Math.max(0, vy / pageHeight);
    const widthRatio = Math.min(1 - xRatio, estimatedWidth / pageWidth);
    const heightRatio = Math.min(1 - yRatio, estimatedHeight / pageHeight);

    if (widthRatio <= 0 || heightRatio <= 0) continue;

    items.push({
      text: i.str,
      xRatio,
      yRatio,
      widthRatio,
      heightRatio,
      fontSize: Math.max(8, Math.round(fontSize)),
      isOcrResult: false,
    });
  }

  return items;
}

/**
 * Render a PDF page to canvas and run OCR via tesseract.js.
 * Used when no text layer is found.
 */
export async function extractTextViaOcr(
  pdfBytes: Uint8Array,
  pageIndex: number,
  onProgress?: (progress: number) => void
): Promise<ExtractedTextItem[]> {
  // Render PDF page to canvas
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjsLib.getDocument({
    data: pdfBytes.slice(),
    useSystemFonts: false,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
  }).promise;
  const page = await pdf.getPage(pageIndex + 1);
  const rotation = page.rotate ?? 0;
  const viewport = page.getViewport({ scale: 2.0, rotation });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  // Run OCR
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(canvas, "ind+eng", {
    logger: (m: any) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const items: ExtractedTextItem[] = [];
  const data = result.data as any;

  for (const word of data.words) {
    if (!word.text.trim()) continue;

    const { bbox } = word;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const xRatio = bbox.x0 / canvasWidth;
    const yRatio = bbox.y0 / canvasHeight;
    const widthRatio = (bbox.x1 - bbox.x0) / canvasWidth;
    const heightRatio = (bbox.y1 - bbox.y0) / canvasHeight;

    // Estimate font size from bbox height
    const fontSize = Math.max(8, Math.round((bbox.y1 - bbox.y0) * 0.75));

    items.push({
      text: word.text,
      xRatio: Math.max(0, xRatio),
      yRatio: Math.max(0, yRatio),
      widthRatio: Math.max(0.01, widthRatio),
      heightRatio: Math.max(0.005, heightRatio),
      fontSize,
      isOcrResult: true,
    });
  }

  return items;
}

/**
 * Check if a PDF page has a text layer.
 */
export async function hasTextLayer(
  pdfBytes: Uint8Array,
  pageIndex: number
): Promise<boolean> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjsLib.getDocument({
    data: pdfBytes.slice(),
    useSystemFonts: false,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
  }).promise;
  const numPages = pdf.numPages;

  // Guard against out-of-range pageIndex
  if (pageIndex < 0 || pageIndex >= numPages) {
    console.warn(`hasTextLayer: pageIndex ${pageIndex} out of range (numPages=${numPages})`);
    return false;
  }

  const page = await pdf.getPage(pageIndex + 1);
  const textContent = await page.getTextContent();

  return textContent.items.some((item: any) => item.str?.trim().length > 0);
}
