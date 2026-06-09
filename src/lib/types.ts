// Types for the e-sign PDF application

export interface SignatureAnnotation {
  id: string;
  /** Normalized position: 0..1 relative to the PDF page width */
  xRatio: number;
  /** Normalized position: 0..1 relative to the PDF page height */
  yRatio: number;
  /** Normalized width: 0..1 relative to the PDF page width */
  widthRatio: number;
  /** Normalized height: 0..1 relative to the PDF page height */
  heightRatio: number;
  /** Page index (0-based) */
  pageIndex: number;
  /** Base64 PNG of the signature image */
  imageDataUrl: string;
  /** Type of annotation */
  type?: "signature" | "text";
  /** Optional text content for text annotations */
  text?: string;
  /** Optional text color */
  textColor?: string;
  /** Optional text size */
  textSize?: number;
  /** Font family for text annotations */
  fontFamily?: string;
  /** Bold style for text annotations */
  isBold?: boolean;
  /** Italic style for text annotations */
  isItalic?: boolean;
  /** Underline style for text annotations */
  isUnderline?: boolean;
}

export interface PDFPageInfo {
  pageIndex: number;
  width: number;
  height: number;
}
