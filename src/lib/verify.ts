/**
 * PDF Verification utilities — 100% client-side.
 * Extracts digital signature info and computes SHA-256 hash from a PDF file.
 */
import forge from "node-forge";

export interface SignerInfo {
  commonName: string;
  organization: string;
  email: string;
  issuer: string;
  serialNumber: string;
  algorithm: string;
  signingTime: string | null;
  validFrom: string;
  validTo: string;
  isExpired: boolean;
  isSelfSigned: boolean;
}

export interface VerificationResult {
  /** SHA-256 hash of the entire uploaded file */
  fileHash: string;
  /** True if /ByteRange + /Contents signature block was found */
  hasDigitalSignature: boolean;
  /** Parsed signer info from the embedded PKCS#7, if present */
  signers: SignerInfo[];
  /** True if the PKCS#7 signature digest matches the PDF bytes covered by ByteRange */
  signatureValid: boolean | null; // null = not checked (no sig found)
  /** Human-readable status */
  status: "no_signature" | "valid" | "invalid" | "parse_error";
  errorMessage?: string;
  /** Technical audit details */
  auditDetails?: {
    byteRange?: [number, number, number, number];
    byteRangeText?: string;
    reason?: string;
  };
}

// ---------------------------------------------------------------------------
// SHA-256 of the whole file
// ---------------------------------------------------------------------------
async function computeSHA256(bytes: Uint8Array): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Find /ByteRange and /Contents in raw PDF bytes
// ---------------------------------------------------------------------------
interface ByteRangeInfo {
  byteRange: [number, number, number, number];
  contentsHex: string;
}

function extractByteRangeAndContents(bytes: Uint8Array): ByteRangeInfo | null {
  const text = new TextDecoder("latin1").decode(bytes);

  // Find /ByteRange [ ... ]
  const byteRangeMatch = text.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/);
  if (!byteRangeMatch) return null;

  const byteRange: [number, number, number, number] = [
    parseInt(byteRangeMatch[1]),
    parseInt(byteRangeMatch[2]),
    parseInt(byteRangeMatch[3]),
    parseInt(byteRangeMatch[4]),
  ];

  // Find /Contents <hex...>
  const contentsMatch = text.match(/\/Contents\s*<([0-9a-fA-F\s]+)>/);
  if (!contentsMatch) return null;

  const contentsHex = contentsMatch[1].replace(/\s/g, "");
  return { byteRange, contentsHex };
}

// Helper to cut off trailing zeros and extract exact ASN.1 DER length
function getExactDerHex(hex: string): string {
  const cleanHex = hex.replace(/(00)+$/, "");
  if (cleanHex.length < 4) return cleanHex;
  try {
    const b0 = parseInt(cleanHex.substring(0, 2), 16);
    const b1 = parseInt(cleanHex.substring(2, 4), 16);
    if (b0 !== 0x30) return cleanHex;
    let headerLen = 2;
    let contentLen = 0;
    if (b1 < 0x80) {
      contentLen = b1;
    } else if (b1 === 0x81) {
      headerLen = 3;
      contentLen = parseInt(cleanHex.substring(4, 6), 16);
    } else if (b1 === 0x82) {
      headerLen = 4;
      contentLen = parseInt(cleanHex.substring(4, 8), 16);
    } else if (b1 === 0x83) {
      headerLen = 5;
      contentLen = parseInt(cleanHex.substring(4, 10), 16);
    } else if (b1 === 0x84) {
      headerLen = 6;
      contentLen = parseInt(cleanHex.substring(4, 12), 16);
    }
    const totalHexLen = (headerLen + contentLen) * 2;
    if (totalHexLen > 0 && totalHexLen <= cleanHex.length) {
      return cleanHex.substring(0, totalHexLen);
    }
  } catch {
    // fallback
  }
  return cleanHex;
}

// ---------------------------------------------------------------------------
// Parse PKCS#7 DER and extract signer info
// ---------------------------------------------------------------------------
function parseSigners(derHex: string): SignerInfo[] {
  const hexToParse = getExactDerHex(derHex);
  try {
    const derBytes = forge.util.hexToBytes(hexToParse);
    const asn1 = forge.asn1.fromDer(derBytes);
    const p7 = forge.pkcs7.messageFromAsn1(asn1);

    const signers: SignerInfo[] = [];
    const certList = (p7 as forge.pkcs7.PkcsSignedData).certificates ?? [];

    for (const cert of certList) {
      const findAttr = (keys: string[]) => {
        for (const k of keys) {
          const val = (cert.subject.getField(k) as { value: string } | null)?.value;
          if (val) return val;
        }
        for (const attr of (cert.subject.attributes as forge.pki.CertificateField[])) {
          if (
            keys.includes(attr.name ?? "") ||
            keys.includes(attr.shortName ?? "") ||
            (!!attr.type && keys.includes(attr.type))
          ) {
            if (attr.value) return attr.value as string;
          }
        }
        return "";
      };

      const issuerAttrs = (cert.issuer.attributes as forge.pki.CertificateField[])
        .map((a) => `${a.shortName ?? a.name}=${a.value}`)
        .join(", ");

      const selfSigned = cert.isIssuer(cert);
      const now = new Date();

      // Try to get signingTime from authenticatedAttributes via ASN.1 traversal
      let signingTime: string | null = null;
      try {
        // Access raw ASN.1 via type assertion — forge doesn't expose signerInfos publicly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sd = p7 as any;
        const si = sd.rawCapture?.signerInfos?.[0];
        if (si) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const attrs = (si as any).value?.[3]?.value as forge.asn1.Asn1[] | undefined;
          if (Array.isArray(attrs)) {
            for (const attr of attrs) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const oidVal = (attr as any).value?.[0]?.value;
                if (typeof oidVal === "string") {
                  const oid = forge.asn1.derToOid(oidVal);
                  if (oid === forge.pki.oids.signingTime) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    signingTime = (attr as any).value?.[1]?.value?.[0]?.value ?? null;
                  }
                }
              } catch {
                // ignore individual attr parse failures
              }
            }
          }
        }
      } catch {
        // ignore — signingTime is optional
      }

      signers.push({
        commonName: findAttr(["CN", "commonName"]) || "Unknown",
        organization: findAttr(["O", "organizationName"]) || "-",
        email: findAttr(["E", "emailAddress", "1.2.840.113549.1.9.1"]) || "-",
        issuer: issuerAttrs,
        serialNumber: cert.serialNumber,
        algorithm: "SHA256withRSA",
        signingTime,
        validFrom: cert.validity.notBefore.toISOString(),
        validTo: cert.validity.notAfter.toISOString(),
        isExpired: cert.validity.notAfter < now,
        isSelfSigned: selfSigned,
      });
    }

    return signers;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Verify PKCS#7 signature against ByteRange bytes
// ---------------------------------------------------------------------------
async function verifySignatureIntegrity(
  pdfBytes: Uint8Array,
  byteRange: [number, number, number, number],
  contentsHex: string
): Promise<boolean> {
  try {
    // 1. Reconstruct the signed data bytes from ByteRange
    const part1 = pdfBytes.slice(byteRange[0], byteRange[0] + byteRange[1]);
    const part2 = pdfBytes.slice(byteRange[2], byteRange[2] + byteRange[3]);

    const signedData = new Uint8Array(part1.length + part2.length);
    signedData.set(part1, 0);
    signedData.set(part2, part1.length);

    // 2. Parse PKCS#7 DER
    const hexToParse = getExactDerHex(contentsHex);
    const derBytes = forge.util.hexToBytes(hexToParse);
    const asn1 = forge.asn1.fromDer(derBytes);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p7 = forge.pkcs7.messageFromAsn1(asn1) as any;

    const cert = p7.certificates?.[0];
    if (!cert) return false;

    // 3. Compute SHA-256 digest of signedData
    const md = forge.md.sha256.create();
    let binaryStr = "";
    for (let i = 0; i < signedData.length; i++) {
      binaryStr += String.fromCharCode(signedData[i]);
    }
    md.update(binaryStr);
    const actualDocDigestHex = md.digest().toHex();

    // 4. Extract authenticatedAttributes from raw ASN.1 structure
    const rawCapture = p7.rawCapture;
    const signerInfoAsn1 = rawCapture?.signerInfos?.[0];
    if (!signerInfoAsn1) return false;

    const signerInfoValue = signerInfoAsn1.value as forge.asn1.Asn1[];
    let authAttrsAsn1: forge.asn1.Asn1 | null = null;
    let encryptedDigestHex = "";

    for (const item of signerInfoValue) {
      if (item.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && item.type === 0) {
        authAttrsAsn1 = item;
      }
      if (item.tagClass === forge.asn1.Class.UNIVERSAL && item.type === forge.asn1.Type.OCTETSTRING) {
        encryptedDigestHex = forge.util.bytesToHex(item.value as string);
      }
    }

    if (!authAttrsAsn1) return false;

    // 5. Extract messageDigest attribute (OID 1.2.840.113549.1.9.4)
    let embeddedDigestHex = "";
    const attrs = authAttrsAsn1.value as forge.asn1.Asn1[];
    for (const attr of attrs) {
      const attrVal = attr.value as forge.asn1.Asn1[];
      const oid = forge.asn1.derToOid(attrVal[0].value as string);
      if (oid === forge.pki.oids.messageDigest) {
        const digestSeq = attrVal[1].value as forge.asn1.Asn1[];
        embeddedDigestHex = forge.util.bytesToHex(digestSeq[0].value as string);
        break;
      }
    }

    // Compare computed document hash with hash embedded at signing time
    if (actualDocDigestHex !== embeddedDigestHex) {
      return false;
    }

    // 6. Verify RSA signature of authenticatedAttributes (encoded as SET OF 0x31)
    const setAsn1 = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SET,
      true,
      authAttrsAsn1.value as forge.asn1.Asn1[]
    );
    const setDer = forge.asn1.toDer(setAsn1).getBytes();

    const verifyMd = forge.md.sha256.create();
    verifyMd.update(setDer);
    const sigBytes = forge.util.hexToBytes(encryptedDigestHex);

    return cert.publicKey.verify(verifyMd.digest().getBytes(), sigBytes);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export async function verifyPDF(file: File): Promise<VerificationResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  // 1. Always compute SHA-256
  const fileHash = await computeSHA256(pdfBytes);

  // 2. Look for ByteRange signature
  const sigInfo = extractByteRangeAndContents(pdfBytes);
  if (!sigInfo) {
    return {
      fileHash,
      hasDigitalSignature: false,
      signers: [],
      signatureValid: null,
      status: "no_signature",
      auditDetails: {
        reason: "File tidak memiliki tanda tangan digital PKI.",
      },
    };
  }

  // 3. Parse signers from PKCS#7
  const signers = parseSigners(sigInfo.contentsHex);

  // 4. Verify signature integrity
  let signatureValid = false;
  try {
    signatureValid = await verifySignatureIntegrity(
      pdfBytes,
      sigInfo.byteRange,
      sigInfo.contentsHex
    );
  } catch {
    return {
      fileHash,
      hasDigitalSignature: true,
      signers,
      signatureValid: false,
      status: "parse_error",
      errorMessage: "Gagal memverifikasi tanda tangan digital",
      auditDetails: {
        byteRange: sigInfo.byteRange,
        byteRangeText: `[${sigInfo.byteRange.join(", ")}]`,
        reason: "Struktur PKCS#7 tidak dapat didekripsi atau byte dokumen rusak.",
      },
    };
  }

  const reasonText = signatureValid
    ? "Dokumen terverifikasi asli dan tidak pernah mengalami perubahan sejak ditandatangani."
    : "Konten dokumen telah berubah atau dimodifikasi setelah tanda tangan dibuat (Hash Digest mismatch).";

  return {
    fileHash,
    hasDigitalSignature: true,
    signers,
    signatureValid,
    status: signatureValid ? "valid" : "invalid",
    auditDetails: {
      byteRange: sigInfo.byteRange,
      byteRangeText: `[${sigInfo.byteRange.join(", ")}]`,
      reason: reasonText,
    },
  };
}
