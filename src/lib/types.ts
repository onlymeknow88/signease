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
  type?: "signature" | "text" | "extracted-text";
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
  /** Optional background color (for text box background fills) */
  bgColor?: string;
  /** Text opacity / scale transparency: 0..1 */
  opacity?: number;
  /** Paragraph alignment: 'left' | 'center' | 'right' */
  textAlign?: "left" | "center" | "right";
}

export interface PDFPageInfo {
  pageIndex: number;
  width: number;
  height: number;
}

export interface DigitalCertificate {
  id: number;
  name: string;
  commonName: string;
  issuer: string;
  serialNumber: string;
  algorithm: string;
  validFrom: Date;
  validTo: Date;
  isValid: boolean;
  isSelfSigned: boolean;
  organization?: string;
  organizationalUnit?: string;
  localStorageKey: string;
}

export interface CertificateFormData {
  name: string;
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  email?: string;
  password: string;
  validityDays: number;
}

export interface SigningResult {
  success: boolean;
  signedPdfBytes?: Uint8Array;
  certificateInfo?: {
    commonName: string;
    serialNumber: string;
    algorithm: string;
    timestamp: string;
  };
  documentHash: string;
  error?: string;
}
