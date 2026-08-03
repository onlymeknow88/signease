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
  isUnderline: boolean = false,
  bgColor: string = "transparent",
  opacity: number = 1,
  textAlign: "left" | "center" | "right" = "left"
): { dataUrl: string; aspectRatio: number } {
  if (typeof window === "undefined") return { dataUrl: "", aspectRatio: 1 };
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true })!;
  
  // Set up font styling string
  const boldStyle = isBold ? "bold" : "";
  const italicStyle = isItalic ? "italic" : "";
  
  // Map font families to standard CSS names directly
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
  
  const scale = 3;
  const renderSize = size * scale;
  
  ctx.font = `${italicStyle} ${boldStyle} ${renderSize}px ${fontName}`.trim();
  
  // Split lines by newline character for paragraph support
  const lines = text.split("\n");
  const lineHeights = renderSize * 1.25; // 1.25 line height spacing
  
  // Find longest line width
  let maxLineWidth = 0;
  for (const line of lines) {
    const lineMetrics = ctx.measureText(line || " ");
    if (lineMetrics.width > maxLineWidth) {
      maxLineWidth = lineMetrics.width;
    }
  }

  const paddingX = size * 0.2 * scale;
  const paddingY = size * 0.25 * scale;
  const width = Math.max(20 * scale, maxLineWidth + paddingX);
  // height is base renderSize for the first line, plus lineHeights for remaining lines
  const height = renderSize + (lines.length - 1) * lineHeights + paddingY;
  
  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply Background Color if not transparent
  if (bgColor && bgColor !== "transparent") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Re-apply font properties after canvas resize
  ctx.font = `${italicStyle} ${boldStyle} ${renderSize}px ${fontName}`.trim();
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.textBaseline = "top"; // Top-baseline simplifies multi-line alignment
  
  // Draw each line vertically stacked with alignment
  const startY = paddingY / 2;
  
  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeights;
    const lineMetrics = ctx.measureText(line || " ");
    const textWidth = lineMetrics.width;
    
    let lineX = paddingX / 2;
    if (textAlign === "center") {
      lineX = (width - textWidth) / 2;
    } else if (textAlign === "right") {
      lineX = width - textWidth - (paddingX / 2);
    }
    
    ctx.fillText(line, lineX, lineY);
    
    // Draw underline for each individual line if active
    if (isUnderline) {
      const endX = lineX + textWidth;
      const underlineY = lineY + renderSize * 1.05;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2 * scale, renderSize * 0.06);
      ctx.beginPath();
      ctx.moveTo(lineX, underlineY);
      ctx.lineTo(endX, underlineY);
      ctx.stroke();
    }
  });
  
  ctx.globalAlpha = 1.0;

  return {
    dataUrl: canvas.toDataURL("image/png"),
    aspectRatio: height / width,
  };
}

/**
 * Converts an image URL to a data URL (base64).
 * Used for loading logo from public folder.
 */
export function imageToDataUrl(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
    img.src = imagePath;
  });
}

/**
 * Adds a logo watermark overlay to an existing signature image.
 * Logo is centered over the signature with semi-transparency.
 * logoSize = fraction of canvas height (default 0.55 = 55% of height)
 * opacity  = 0..1 (default 0.18 = subtle overlay)
 */
export function addLogoWatermark(
  signatureDataUrl: string,
  logoDataUrl: string,
  logoSize: number = 0.55,
  opacity: number = 0.18
): Promise<string> {
  return new Promise((resolve) => {
    const sigImg = new Image();
    const logoImg = new Image();

    sigImg.src = signatureDataUrl;
    logoImg.src = logoDataUrl;

    Promise.all([
      new Promise((r) => { sigImg.onload = r; }),
      new Promise((r) => { logoImg.onload = r; })
    ]).then(() => {
      const canvas = document.createElement("canvas");
      canvas.width = sigImg.width;
      canvas.height = sigImg.height;
      const ctx = canvas.getContext("2d")!;

      // Draw original signature
      ctx.drawImage(sigImg, 0, 0);

      // Scale logo so its height = logoSize * canvas.height
      const targetH = canvas.height * logoSize;
      const logoAspect = logoImg.width / logoImg.height;
      const logoH = targetH;
      const logoW = targetH * logoAspect;

      // Center logo over the signature
      const logoX = (canvas.width - logoW) / 2;
      const logoY = (canvas.height - logoH) / 2;

      // Draw logo as centered overlay with transparency
      ctx.globalAlpha = opacity;
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL("image/png"));
    });
  });
}
