# SignEase Certificate-Based Digital Signature Implementation Plan

## Overview
Implementasi Adobe-style certificate signing menggunakan PKI (Public Key Infrastructure) untuk memberikan legally-binding digital signatures dengan cryptographic verification.

---

## Phase 1: Research & Foundation (Week 1)

### 1.1 Library Evaluation
- [ ] Evaluate `node-forge` untuk certificate generation & PKCS#7 signing
- [ ] Evaluate `@peculiar/x509` sebagai alternatif modern
- [ ] Test `pdf-lib` compatibility dengan embedded signatures
- [ ] Research PKCS#7/CMS signature embedding dalam PDF structure
- [ ] Prototype certificate generation + PDF signing workflow

### 1.2 Architecture Design
- [ ] Design certificate storage strategy (client vs server)
- [ ] Design private key encryption scheme (AES-256-GCM with user password)
- [ ] Design certificate lifecycle (generation, renewal, revocation)
- [ ] Plan self-signed vs CA-integrated approach
- [ ] Define free vs pro tier feature split

**Deliverable:** Technical design document dengan architecture diagrams

---

## Phase 2: Database Schema & Backend Setup (Week 1-2)

### 2.1 Prisma Schema Extension

```prisma
model Certificate {
  id              Int       @id @default(autoincrement())
  userId          Int
  serialNumber    String    @unique
  commonName      String
  email           String
  organization    String?
  publicKeyPem    String    @db.Text
  issuer          String
  notBefore       DateTime
  notAfter        DateTime
  status          String
  createdAt       DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  signatures      SignatureHistory[]
  
  @@index([userId])
  @@index([status])
  @@map("certificates")
}

model SignatureHistory {
  id              Int       @id @default(autoincrement())
  certificateId   Int
  documentName    String
  documentHash    String    @db.VarChar(64)
  signedAt        DateTime
  ipAddress       String?
  userAgent       String?
  
  certificate     Certificate @relation(fields: [certificateId], references: [id])
  
  @@index([certificateId])
  @@index([documentHash])
  @@map("signature_history")
}
```

### 2.2 Backend API Endpoints

- [ ] `POST /api/certificate/generate` — Generate self-signed certificate
- [ ] `GET /api/certificate/list` — List user certificates
- [ ] `POST /api/certificate/revoke/:id` — Revoke certificate
- [ ] `GET /api/certificate/:id` — Get certificate details
- [ ] `POST /api/certificate/verify` — Verify signature in uploaded PDF

---

## Phase 3: Core Certificate & Signing Logic (Week 2-3)

### 3.1 Certificate Generation (`src/lib/certificate.ts`)

**Key Functions:**
- `generateSelfSignedCertificate()` — RSA 2048-bit key pair + X.509 cert
- `exportCertificatePEM()` — Export to PEM format
- `validateCertificate()` — Check validity dates & status

### 3.2 Private Key Encryption (`src/lib/crypto.ts`)

**Client-side encryption:**
- AES-256-GCM encryption dengan user password
- PBKDF2 100,000+ iterations untuk key derivation
- Store encrypted private key di localStorage only

### 3.3 PDF Signing (`src/lib/pdfSigner.ts`)

**PKCS#7 Signature Process:**
1. Compute SHA-256 hash dari PDF content
2. Sign hash dengan private key
3. Create PKCS#7 CMS structure
4. Embed signature + certificate ke PDF

---

## Phase 4: UI Implementation (Week 3-4)

### 4.1 Certificate Management Page

**Route:** `/account/certificates`

**Features:**
- List certificates (active/expired/revoked)
- Generate new certificate button
- View certificate details modal
- Revoke certificate action
- Download certificate backup

### 4.2 Certificate Generation Modal

**Component:** `src/components/CertificateGenerateModal.tsx`

**Flow:**
1. User enters password untuk encrypt private key
2. Generate certificate client-side
3. Encrypt private key dengan password
4. Store encrypted key di localStorage
5. Send public cert + metadata ke backend
6. Show success + download backup

### 4.3 Signing Options in RightPanel

**Update:** `src/components/RightPanel.tsx`

```tsx
<select value={signingMethod}>
  <option value="visual">Visual Signature Only</option>
  <option value="certificate">Digital Certificate (Verified)</option>
</select>

{signingMethod === 'certificate' && (
  <select value={selectedCertId}>
    <option>Select Certificate...</option>
    {certificates.map(cert => ...)}
  </select>
)}
```

### 4.4 Password Prompt for Signing

**Modal sebelum download:**
- Input password
- Decrypt private key dari localStorage
- Sign PDF dengan certificate
- Download signed PDF

---

## Phase 5: Verification System (Week 4)

### 5.1 Verification Endpoint

**Endpoint:** `POST /api/certificate/verify`

**Process:**
1. Extract PKCS#7 signature dari PDF
2. Extract certificate dari signature
3. Verify certificate chain
4. Decrypt signature dengan public key
5. Compute current document hash
6. Compare hashes

**Response:**
```json
{
  "valid": true,
  "signer": "John Doe",
  "email": "john@example.com",
  "signedAt": "2026-07-25T12:00:00Z",
  "certificateValid": true,
  "documentIntact": true
}
```

### 5.2 Public Verification Page

**Route:** `/verify`

**Features:**
- Drag & drop PDF upload
- Show verification result
- Display signer details
- Show certificate chain
- Download verification report

---

## Phase 6: Testing & QA (Week 5)

### 6.1 Unit Tests
- [ ] Certificate generation tests
- [ ] Encryption/decryption tests
- [ ] PKCS#7 signature creation tests
- [ ] PDF embedding tests

### 6.2 Integration Tests
- [ ] Full signing workflow
- [ ] Certificate revocation flow
- [ ] Multi-user scenarios

### 6.3 Compatibility Tests
- [ ] Adobe Reader verification
- [ ] Foxit Reader verification
- [ ] Preview (macOS) verification
- [ ] Chrome PDF viewer behavior

---

## Phase 7: CA Integration (Optional - Week 6+)

### 7.1 Research CA Providers
- DigiCert
- GlobalSign
- IdenTrust
- Sectigo

### 7.2 Integration Points
- API untuk purchase certificates
- Webhook untuk certificate issuance
- CSR generation workflow
- Certificate installation flow

---

## Security Considerations

### Critical Security Measures
1. Private key NEVER sent to server
2. Password never transmitted
3. Strong password requirements (min 12 chars)
4. Certificate revocation list (CRL)
5. Audit logging untuk semua certificate operations
6. Rate limiting untuk prevent abuse

### Encryption Standards
- RSA 2048-bit minimum
- AES-256-GCM untuk private key encryption
- PBKDF2 100,000+ iterations
- SHA-256 untuk document hashing

---

## Tier Feature Split

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Visual signatures | ✓ | ✓ | ✓ |
| SHA-256 integrity | ✓ | ✓ | ✓ |
| Self-signed certificates | ✗ | ✓ | ✓ |
| Certificate validity | — | 1 year | 2 years |
| Max certificates | — | 3 | Unlimited |
| CA-issued certificates | ✗ | ✗ | ✓ |

---

## Implementation Order

1. Core certificate generation logic
2. Private key encryption
3. Database schema + API endpoints
4. PDF signing dengan PKCS#7
5. Certificate management UI
6. Signing flow integration
7. Verification system
8. Testing & QA
9. CA integration (future)

---

## Timeline Summary

- **Week 1:** Research, design, schema setup
- **Week 2:** Core certificate logic implementation
- **Week 3:** PDF signing + UI
- **Week 4:** Verification system
- **Week 5:** Testing & QA
- **Week 6+:** CA integration (optional)

**Total:** 5-6 weeks untuk MVP dengan self-signed certificates

---

## Next Steps

1. Review & approve this plan
2. Set up development branch `feature/certificate-signing`
3. Install dependencies: `npm install node-forge @types/node-forge`
4. Begin Phase 1: Research & prototyping
5. Weekly progress reviews

---

*Last updated: 2026-07-25*
