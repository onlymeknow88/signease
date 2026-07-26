/**
 * PKI / PKCS#12 operations using node-forge.
 * All crypto is 100% client-side — private keys never leave the browser.
 *
 * Phase 2: PDF /ByteRange signing (ISO 32000-1 §12.8 / adbe.pkcs7.detached)
 * Compatible with Adobe Acrobat Reader verification.
 */
import forge from "node-forge";
import { PDFDocument } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { SignPdf, Signer } from "@signpdf/signpdf";
import { SUBFILTER_ADOBE_PKCS7_DETACHED } from "@signpdf/utils";
import { CertificateFormData, SigningResult } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Encode an ArrayBuffer as a base64 string (browser-safe). */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode a base64 string back to Uint8Array. */
function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Build a forge distinguished-name from parts. */
function buildDN(data: CertificateFormData): forge.pki.CertificateField[] {
  const attrs: forge.pki.CertificateField[] = [
    { name: "commonName", value: data.commonName },
  ];
  if (data.organization) attrs.push({ name: "organizationName", value: data.organization });
  if (data.organizationalUnit) attrs.push({ name: "organizationalUnitName", value: data.organizationalUnit });
  if (data.country) attrs.push({ name: "countryName", value: data.country });
  if (data.email) attrs.push({ name: "emailAddress", value: data.email });
  return attrs;
}

// ---------------------------------------------------------------------------
// Generate a self-signed certificate + PKCS#12 bundle
// ---------------------------------------------------------------------------

export interface GeneratedCertificate {
  /** Encrypted .p12 as base64 — store in localStorage */
  p12Base64: string;
  /** Raw .p12 bytes — offer as file download */
  p12Bytes: Uint8Array;
  commonName: string;
  issuer: string;
  serialNumber: string;
  algorithm: string;
  validFrom: Date;
  validTo: Date;
}

export async function generateSelfSignedCertificate(
  data: CertificateFormData
): Promise<GeneratedCertificate> {
  return new Promise((resolve, reject) => {
    try {
      // 1. Generate RSA key pair (2048-bit)
      forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
        if (err) return reject(err);

        const { privateKey, publicKey } = keypair;

        // 2. Create X.509 certificate
        const cert = forge.pki.createCertificate();
        cert.publicKey = publicKey;

        // Serial number — random 16-byte hex
        const serialBytes = forge.random.getBytesSync(16);
        const serialHex = forge.util.bytesToHex(serialBytes);
        cert.serialNumber = serialHex;

        const now = new Date();
        const validTo = new Date(now);
        validTo.setDate(validTo.getDate() + (data.validityDays ?? 365));

        cert.validity.notBefore = now;
        cert.validity.notAfter = validTo;

        const attrs = buildDN(data);
        cert.setSubject(attrs);
        cert.setIssuer(attrs); // self-signed

        cert.setExtensions([
          { name: "basicConstraints", cA: false },
          {
            name: "keyUsage",
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
          },
          {
            name: "extKeyUsage",
            emailProtection: true,
          },
          {
            name: "subjectKeyIdentifier",
          },
        ]);

        // 3. Sign with SHA-256
        cert.sign(privateKey, forge.md.sha256.create());

        // 4. Package as PKCS#12
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], data.password, {
          algorithm: "3des",
          friendlyName: data.name,
        });
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
        const p12Uint8 = new Uint8Array(p12Der.length);
        for (let i = 0; i < p12Der.length; i++) {
          p12Uint8[i] = p12Der.charCodeAt(i);
        }

        const issuerDN = attrs
          .map((a) => `${a.name}=${a.value}`)
          .join(", ");

        resolve({
          p12Base64: arrayBufferToBase64(p12Uint8.buffer),
          p12Bytes: p12Uint8,
          commonName: data.commonName,
          issuer: issuerDN,
          serialNumber: serialHex,
          algorithm: "SHA256withRSA",
          validFrom: now,
          validTo,
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}

// ---------------------------------------------------------------------------
// Parse an uploaded / stored PKCS#12 bundle
// ---------------------------------------------------------------------------

export interface ParsedCertificate {
  cert: forge.pki.Certificate;
  privateKey: forge.pki.PrivateKey;
  commonName: string;
  issuer: string;
  serialNumber: string;
  algorithm: string;
  validFrom: Date;
  validTo: Date;
  isExpired: boolean;
}

export function parsePKCS12Certificate(
  p12Data: ArrayBuffer | Uint8Array,
  password: string
): ParsedCertificate {
  const bytes = p12Data instanceof ArrayBuffer ? new Uint8Array(p12Data) : p12Data;
  let binaryStr = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }

  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const p12Asn1 = forge.asn1.fromDer(binaryStr);
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  } catch {
    throw new Error("Invalid certificate or wrong password");
  }

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) throw new Error("No certificate found in .p12 file");
  const cert = certBag.cert;

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) throw new Error("No private key found in .p12 file");
  const privateKey = keyBag.key as forge.pki.PrivateKey;

  const getAttr = (name: string) =>
    cert.subject.getField(name)?.value as string | undefined;

  const commonName = getAttr("CN") ?? getAttr("commonName") ?? "Unknown";

  const issuerFields = (cert.issuer.attributes as forge.pki.CertificateField[])
    .map((a) => `${a.shortName ?? a.name}=${a.value}`)
    .join(", ");

  const serialNumber = cert.serialNumber;
  const algorithm = "SHA256withRSA";
  const validFrom = cert.validity.notBefore;
  const validTo = cert.validity.notAfter;
  const isExpired = validTo < new Date();

  return { cert, privateKey, commonName, issuer: issuerFields, serialNumber, algorithm, validFrom, validTo, isExpired };
}

// ---------------------------------------------------------------------------
// Validate certificate password without fully parsing (quick check)
// ---------------------------------------------------------------------------

export function validateP12Password(p12Base64: string, password: string): boolean {
  try {
    const bytes = base64ToUint8Array(p12Base64);
    parsePKCS12Certificate(bytes, password);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
async function fetchTSAToken(signatureHashBytes: Uint8Array): Promise<forge.asn1.Asn1 | null> {
  try {
    const sha256Oid = '2.16.840.1.101.3.4.2.1';
    const algoIdentifier = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SEQUENCE,
      true,
      [
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.OID,
          false,
          forge.asn1.oidToDer(sha256Oid).getBytes()
        ),
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.NULL,
          false,
          ''
        )
      ]
    );

    let binaryStr = "";
    for (let i = 0; i < signatureHashBytes.length; i++) {
      binaryStr += String.fromCharCode(signatureHashBytes[i]);
    }
    const messageImprint = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SEQUENCE,
      true,
      [
        algoIdentifier,
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.OCTETSTRING,
          false,
          binaryStr
        )
      ]
    );

    const version = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.INTEGER,
      false,
      forge.asn1.integerToDer(1).getBytes()
    );

    const nonceBytes = forge.random.getBytesSync(8);
    const nonce = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.INTEGER,
      false,
      nonceBytes
    );

    const timeStampReq = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SEQUENCE,
      true,
      [
        version,
        messageImprint,
        nonce,
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.BOOLEAN,
          false,
          String.fromCharCode(0xFF)
        )
      ]
    );

    const reqDer = forge.asn1.toDer(timeStampReq).getBytes();
    const reqBuffer = new Uint8Array(reqDer.length);
    for (let i = 0; i < reqDer.length; i++) {
      reqBuffer[i] = reqDer.charCodeAt(i);
    }

    const response = await fetch('/api/timestamp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/timestamp-query',
        'Accept': 'application/timestamp-reply'
      },
      body: reqBuffer
    });

    if (!response.ok) return null;

    const resBuffer = await response.arrayBuffer();
    const resBytes = new Uint8Array(resBuffer);
    let resDer = "";
    for (let i = 0; i < resBytes.length; i++) {
      resDer += String.fromCharCode(resBytes[i]);
    }
    const responseAsn1 = forge.asn1.fromDer(resDer);
    const value = responseAsn1.value;
    if (Array.isArray(value)) {
      const timeStampToken = value[1] as forge.asn1.Asn1;
      return timeStampToken || null;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Custom Forge-based Signer for @signpdf
// Implements the Signer interface using node-forge for PKCS#7 creation.
// Runs entirely in-browser — no server calls except TSA proxy.
// ---------------------------------------------------------------------------

class ForgeSigner extends Signer {
  private cert: forge.pki.Certificate;
  private privateKey: forge.pki.PrivateKey;

  constructor(cert: forge.pki.Certificate, privateKey: forge.pki.PrivateKey) {
    super();
    this.cert = cert;
    this.privateKey = privateKey;
  }

  async sign(pdfBuffer: Buffer, signingTime?: Date): Promise<Buffer> {
    const p7 = forge.pkcs7.createSignedData();

    // For detached signature (adbe.pkcs7.detached), the content must be set
    // to the exact bytes being signed (the two ByteRange segments concatenated).
    // Convert Buffer to forge ByteStringBuffer correctly — avoid .toString("binary")
    // which breaks on browser Buffer polyfill.
    const bytes = new Uint8Array(pdfBuffer);
    let binaryStr = "";
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]);
    }
    p7.content = forge.util.createBuffer(binaryStr);

    p7.addCertificate(this.cert);
    p7.addSigner({
      key: this.privateKey as forge.pki.rsa.PrivateKey,
      certificate: this.cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        {
          type: forge.pki.oids.signingTime,
          value: (signingTime ?? new Date()) as any,
        },
      ],
    });

    p7.sign({ detached: true });

    // --- TSA Timestamp Integration ---
    try {
      const p7Asn1 = p7.toAsn1();
      
      // Locate the encryptedDigest (signature value) to request a timestamp for it
      // Root SEQUENCE -> NONE [Tag 128] -> SEQUENCE -> SET [SignerInfo] -> SEQUENCE [SignerInfo]
      const p7Asn1Value = p7Asn1.value as forge.asn1.Asn1[];
      const signedDataContent = p7Asn1Value[1];
      const signedDataContentValue = signedDataContent.value as forge.asn1.Asn1[];
      const signedDataSeq = signedDataContentValue[0];
      const signedDataSeqValue = signedDataSeq.value as forge.asn1.Asn1[];
      const signerInfosSet = signedDataSeqValue[signedDataSeqValue.length - 1];
      const signerInfosSetValue = signerInfosSet.value as forge.asn1.Asn1[];
      const signerInfoSeq = signerInfosSetValue[0];
      const signerInfoSeqValue = signerInfoSeq.value as forge.asn1.Asn1[];
      
      const encryptedDigestOctetString = signerInfoSeqValue[signerInfoSeqValue.length - 1];
      const signatureValueBytes = encryptedDigestOctetString.value as string;

      // Hash the signature value (encryptedDigest)
      const md = forge.md.sha256.create();
      md.update(signatureValueBytes);
      const signatureHash = new Uint8Array(
        md.digest().getBytes().split("").map((c) => c.charCodeAt(0))
      );

      // Fetch the RFC 3161 TimeStampToken
      const timeStampToken = await fetchTSAToken(signatureHash);
      if (timeStampToken) {
        // Build unsignedAttrs containing the signatureTimeStampToken attribute
        const signatureTimeStampTokenOid = '1.2.840.113549.1.9.16.2.14';
        
        const attribute = forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.SEQUENCE,
          true,
          [
            forge.asn1.create(
              forge.asn1.Class.UNIVERSAL,
              forge.asn1.Type.OID,
              false,
              forge.asn1.oidToDer(signatureTimeStampTokenOid).getBytes()
            ),
            forge.asn1.create(
              forge.asn1.Class.UNIVERSAL,
              forge.asn1.Type.SET,
              true,
              [timeStampToken]
            )
          ]
        );

        // Unsigned attributes must have tag [1] IMPLICIT
        const unsignedAttrs = forge.asn1.create(
          forge.asn1.Class.CONTEXT_SPECIFIC,
          1,
          true,
          [attribute]
        );

        // Append unsignedAttrs to SignerInfo
        signerInfoSeqValue.push(unsignedAttrs);
      }
      
      const derStr = forge.asn1.toDer(p7Asn1).getBytes();
      const derBytes = new Uint8Array(derStr.length);
      for (let i = 0; i < derStr.length; i++) {
        derBytes[i] = derStr.charCodeAt(i);
      }
      return Buffer.from(derBytes);
    } catch {
      // Fallback: If TSA fails, serialize original signed PKCS#7 without TSA
      const derStr = forge.asn1.toDer(p7.toAsn1()).getBytes();
      const derBytes = new Uint8Array(derStr.length);
      for (let i = 0; i < derStr.length; i++) {
        derBytes[i] = derStr.charCodeAt(i);
      }
      return Buffer.from(derBytes);
    }
  }
}

// ---------------------------------------------------------------------------
// Sign PDF with /ByteRange (ISO 32000-1 §12.8 — adbe.pkcs7.detached)
// Compatible with Adobe Acrobat Reader verification.
// ---------------------------------------------------------------------------

export async function signPDFWithCertificate(
  pdfBytes: Uint8Array,
  p12Base64: string,
  password: string
): Promise<SigningResult> {
  try {
    // 1. Parse .p12 to get cert + private key
    const p12Bytes = base64ToUint8Array(p12Base64);
    const parsed = parsePKCS12Certificate(p12Bytes, password);

    // 2. Load annotated PDF into pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 3. Inject /ByteRange + /Contents placeholder (ISO 32000-1 §12.8)
    const signingTime = new Date();
    pdflibAddPlaceholder({
      pdfDoc,
      reason: "Signed with SignEase",
      contactInfo: "",
      name: parsed.commonName,
      location: "SignEase Client",
      signingTime,
      subFilter: SUBFILTER_ADOBE_PKCS7_DETACHED,
      // Reserve 16KB for PKCS#7 — sufficient for self-signed RSA-2048 certs
      signatureLength: 16384,
    });

    // 4. Serialize PDF with placeholder (must use non-object-streams for ByteRange)
    const pdfWithPlaceholder = await pdfDoc.save({ useObjectStreams: false });

    // 5. Sign using ForgeSigner — @signpdf handles ByteRange calculation
    const signer = new ForgeSigner(parsed.cert, parsed.privateKey);
    const signpdfInstance = new SignPdf();
    const signedBuffer = await signpdfInstance.sign(
      Buffer.from(pdfWithPlaceholder),
      signer,
      signingTime
    );

    const signedPdfBytes = new Uint8Array(signedBuffer);

    // 6. SHA-256 of the final signed document
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      signedPdfBytes.buffer as ArrayBuffer
    );
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return {
      success: true,
      signedPdfBytes,
      certificateInfo: {
        commonName: parsed.commonName,
        serialNumber: parsed.serialNumber,
        algorithm: parsed.algorithm,
        timestamp: signingTime.toISOString(),
      },
      documentHash: hashHex,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Signing failed",
      documentHash: "",
    };
  }
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

export function saveP12ToLocalStorage(key: string, p12Base64: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, p12Base64);
  }
}

export function loadP12FromLocalStorage(key: string): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
}

export function removeP12FromLocalStorage(key: string): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
}
