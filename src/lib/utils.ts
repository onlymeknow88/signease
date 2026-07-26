import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a high-quality base64 image URL of a text string with specified styles.
 * Returns both the data URL and the aspect ratio of the generated image.
 */
export function generateTextImage(
  text: string,
  size: number,
  color: string,
  fontFamily: string = "Poppins",
  isBold: boolean = false,
  isItalic: boolean = false,
  isUnderline: boolean = false
): { dataUrl: string; aspectRatio: number } {
  if (typeof window === "undefined") return { dataUrl: "", aspectRatio: 1 };
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true })!;
  
  // Set up font styling string
  const boldStyle = isBold ? "bold" : "";
  const italicStyle = isItalic ? "italic" : "";
  
  // Map font families to standard CSS names directly (Canvas cannot parse CSS variables like var(--font-sans))
  const fontFamilyMap: Record<string, string> = {
    "Poppins": "'Poppins', sans-serif",
    "Inter": "'Inter', sans-serif",
    "JetBrains Mono": "'JetBrains Mono', monospace",
    "Georgia": "Georgia, serif",
    "Times New Roman": "'Times New Roman', serif",
    "Courier New": "'Courier New', monospace",
    "Arial": "Arial, sans-serif",
    "Verdana": "Verdana, sans-serif",
    "Trebuchet MS": "'Trebuchet MS', sans-serif",
  };
  const fontName = fontFamilyMap[fontFamily] ?? `'${fontFamily}', sans-serif`;
  
  // Use a scale multiplier for high-DPI/crisp canvas rendering
  const scale = 3;
  const renderSize = size * scale;
  
  ctx.font = `${italicStyle} ${boldStyle} ${renderSize}px ${fontName}`.trim();
  const metrics = ctx.measureText(text);

  // Minimal padding — just enough to avoid glyph clipping at edges
  const paddingX = size * 0.2 * scale;
  const paddingY = size * 0.15 * scale;
  const width = Math.max(20 * scale, metrics.width + paddingX);
  const height = renderSize + paddingY;
  
  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Re-apply font properties after canvas resize
  ctx.font = `${italicStyle} ${boldStyle} ${renderSize}px ${fontName}`.trim();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  
  // Draw text centered
  ctx.fillText(text, width / 2, height / 2);

  // Handle underline if active
  if (isUnderline) {
    const textWidth = metrics.width;
    const startX = (width - textWidth) / 2;
    const endX = startX + textWidth;
    
    // Position underline below baseline (using font size for displacement)
    const underlineY = (height / 2) + (renderSize * 0.45);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2 * scale, renderSize * 0.06);
    ctx.beginPath();
    ctx.moveTo(startX, underlineY);
    ctx.lineTo(endX, underlineY);
    ctx.stroke();
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    aspectRatio: height / width,
  };
}
