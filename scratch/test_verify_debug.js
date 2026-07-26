const { PDFDocument } = require('pdf-lib');
const forge = require('node-forge');

function createTestCert() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'Fadjri Wivindi' },
    { name: 'organizationName', value: 'Ayah2Ngoding' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], 'password');
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Base64 = forge.util.encode64(p12Der);
  return { p12Base64, password: 'password', cert, keys };
}

function extractByteRangeAndContents(pdfBytes) {
  const text = new TextDecoder("latin1").decode(pdfBytes);

  const byteRangeMatch = text.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/);
  if (!byteRangeMatch) return null;

  const byteRange = [
    parseInt(byteRangeMatch[1]),
    parseInt(byteRangeMatch[2]),
    parseInt(byteRangeMatch[3]),
    parseInt(byteRangeMatch[4]),
  ];

  const contentsMatch = text.match(/\/Contents\s*<([0-9a-fA-F\s]+?)>/);
  if (!contentsMatch) return null;

  const contentsHex = contentsMatch[1].replace(/\s/g, "");
  return { byteRange, contentsHex };
}

// Implement actual PKCS#7 detached signature verification
function verifyPKCS7Signature(signedBytes, contentsHex) {
  const cleanHex = contentsHex.replace(/(00)+$/, "");
  const derBytes = forge.util.hexToBytes(cleanHex);
  const asn1 = forge.asn1.fromDer(derBytes);
  const p7 = forge.pkcs7.messageFromAsn1(asn1);

  // 1. Calculate actual document hash (SHA-256)
  const md = forge.md.sha256.create();
  let binaryStr = "";
  for (let i = 0; i < signedBytes.length; i++) {
    binaryStr += String.fromCharCode(signedBytes[i]);
  }
  md.update(binaryStr);
  const actualDocDigestHex = md.digest().toHex();

  // 2. Extract authenticatedAttributes & messageDigest from SignerInfo ASN.1
  const rawCapture = p7.rawCapture;
  const cert = p7.certificates[0];
  if (!cert) throw new Error("No certificate found in PKCS#7");

  // Traverse raw ASN.1 structure of PKCS#7 to find authenticatedAttributes (Tag [0] IMPLICIT / EXPLICIT)
  // SignerInfo in SignedData is:
  // version, issuerAndSerialNumber, digestAlgorithm, authenticatedAttributes [0], digestEncryptionAlgorithm, encryptedDigest, unauthenticatedAttributes [1]
  const sd = p7;
  // Access signerInfo ASN.1
  const signerInfoAsn1 = rawCapture.signerInfos[0];
  const signerInfoValue = signerInfoAsn1.value;

  let authAttrsAsn1 = null;
  let encryptedDigestHex = "";

  for (const item of signerInfoValue) {
    // authenticatedAttributes tag is context-specific [0]
    if (item.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && item.type === 0) {
      authAttrsAsn1 = item;
    }
    // encryptedDigest is OCTET STRING (type 4)
    if (item.tagClass === forge.asn1.Class.UNIVERSAL && item.type === forge.asn1.Type.OCTETSTRING) {
      encryptedDigestHex = forge.util.bytesToHex(item.value);
    }
  }

  if (!authAttrsAsn1) throw new Error("No authenticatedAttributes found in SignerInfo");

  // Extract messageDigest attribute (OID 1.2.840.113549.1.9.4)
  let embeddedDigestHex = "";
  const attrs = authAttrsAsn1.value;
  for (const attr of attrs) {
    const oid = forge.asn1.derToOid(attr.value[0].value);
    if (oid === forge.pki.oids.messageDigest) {
      embeddedDigestHex = forge.util.bytesToHex(attr.value[1].value[0].value);
      break;
    }
  }

  console.log("Actual Doc Digest:   ", actualDocDigestHex);
  console.log("Embedded Message Digest:", embeddedDigestHex);

  if (actualDocDigestHex !== embeddedDigestHex) {
    console.error("DIGEST MISMATCH!");
    return false;
  }

  // Verify RSA signature of authenticatedAttributes
  // In PKCS#7, the authenticatedAttributes are converted to SET OF (tag 0x31) when signed!
  const setAsn1 = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SET,
    true,
    authAttrsAsn1.value
  );
  const setDer = forge.asn1.toDer(setAsn1).getBytes();

  const verifyMd = forge.md.sha256.create();
  verifyMd.update(setDer);
  const sigBytes = forge.util.hexToBytes(encryptedDigestHex);

  const verified = cert.publicKey.verify(verifyMd.digest().getBytes(), sigBytes);
  console.log("RSA Signature Verification result:", verified);
  return verified;
}

async function run() {
  const { p12Base64, password, cert, keys } = createTestCert();

  const doc = await PDFDocument.create();
  doc.addPage([600, 400]);
  const pdfBytes = await doc.save();

  const { pdflibAddPlaceholder, SUBFILTER_ADOBE_PKCS7_DETACHED } = require('@signpdf/placeholder-pdf-lib');
  const { SignPdf, Signer } = require('@signpdf/signpdf');

  class ForgeSigner extends Signer {
    async sign(pdfBuffer) {
      const p7 = forge.pkcs7.createSignedData();
      const bytes = new Uint8Array(pdfBuffer);
      let binaryStr = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryStr += String.fromCharCode(bytes[i]);
      }
      p7.content = forge.util.createBuffer(binaryStr);
      p7.addCertificate(cert);
      p7.addSigner({
        key: keys.privateKey,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
          { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
          { type: forge.pki.oids.messageDigest },
          { type: forge.pki.oids.signingTime, value: new Date() },
        ],
      });
      p7.sign({ detached: true });
      const derStr = forge.asn1.toDer(p7.toAsn1()).getBytes();
      return Buffer.from(derStr, 'binary');
    }
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdflibAddPlaceholder({
    pdfDoc,
    reason: "Signed",
    contactInfo: "",
    name: "Test",
    location: "Loc",
    signingTime: new Date(),
    subFilter: SUBFILTER_ADOBE_PKCS7_DETACHED,
    signatureLength: 16384,
  });

  const pdfWithPlaceholder = await pdfDoc.save({ useObjectStreams: false });
  const signer = new ForgeSigner();
  const signpdf = new SignPdf();
  const signedBuffer = await signpdf.sign(Buffer.from(pdfWithPlaceholder), signer);

  const sigInfo = extractByteRangeAndContents(new Uint8Array(signedBuffer));

  const part1 = signedBuffer.subarray(sigInfo.byteRange[0], sigInfo.byteRange[0] + sigInfo.byteRange[1]);
  const part2 = signedBuffer.subarray(sigInfo.byteRange[2], sigInfo.byteRange[2] + sigInfo.byteRange[3]);
  const signedData = new Uint8Array(part1.length + part2.length);
  signedData.set(part1, 0);
  signedData.set(part2, part1.length);

  const isSigValid = verifyPKCS7Signature(signedData, sigInfo.contentsHex);
  console.log("FINAL VERIFICATION RESULT:", isSigValid);
}

run();
