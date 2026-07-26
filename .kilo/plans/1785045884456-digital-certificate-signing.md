# Digital Certificate Signing Implementation Plan

## Overview
Implement PKI-based digital certificate signing for SignEase PDF documents with self-signed certificate generation capability. Maintains the "100% client-side" architecture while adding enterprise-grade digital signatures.

## Architecture Decision Summary

**Certificate Storage**: Hybrid approach
- Certificate metadata (name, issuer, serial, expiry, validity) → MySQL database
- Encrypted .p12 file → browser localStorage
- Private key never leaves browser, never sent to server

**Integration Point**: RightPanel certificate tab
- Add certificate upload/generation UI above existing SHA-256 hash display
- Certificate signing optional (backward compatible with current visual-only signing)

**Feature Scope**: Self-signed generation + Basic PKI signing
- Generate .p12 certificates in-browser (no external CA needed)
- Upload existing .p12/.pfx certificates
- Password-protected signing operations
- Embed PKCS#7 signature in PDF
- No CA validation, timestamp servers, or revocation checking (Phase 2)

---

## Database Schema Changes

### New Table: `certificates`

```prisma
model Certificate {
  id                Int       @id @default(autoincrement())
  userId            Int
  name              String    @db.VarChar(255)        // User-friendly name
  commonName        String    @db.VarChar(255)        // CN from certificate
  issuer            String    @db.VarChar(255)        // Issuer DN
  serialNumber      String    @db.VarChar(100)        // Hex serial
  algorithm         String    @db.VarChar(50)         // e.g., "SHA256withRSA"
  validFrom         DateTime                          // NotBefore
  validTo           DateTime                          // NotAfter
  isValid           Boolean   @default(true)          // Expiry check
  isSelfSigned      Boolean   @default(false)         // Generated in-app
  localStorageKey   String    @db.VarChar(100)        // Key for localStorage lookup
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([validTo])
  @@map("certificates")
}

model User {
  // ... existing fields ...
  certificates Certificate[]
}
```

**Migration**: `prisma/migrations/YYYYMMDDHHMMSS_add_certificates/migration.sql`

---

## Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "node-forge": "^1.3.1",           // PKI operations (PKCS#12, X.509, RSA/ECDSA)
    "@peculiar/webcrypto": "^1.5.0"   // Web Crypto API polyfill for older browsers
  },
  "devDependencies": {
    "@types/node-forge": "^1.3.11"
  }
}
```

---

## Type Definitions

**`src/lib/types.ts`** - Add:

```typescript
export interface DigitalCertificate {
  id: number;                    // DB ID
  name: string;                  // User-friendly name
  commonName: string;            // CN from certificate
  issuer: string;                // Issuer DN
  serialNumber: string;          // Hex serial
  algorithm: string;             // Signing algorithm
  validFrom: Date;
  validTo: Date;
  isValid: boolean;              // Computed from validTo
  isSelfSigned: boolean;
  localStorageKey: string;       // Key to retrieve .p12 from localStorage
}

export interface CertificateFormData {
  name: string;                  // Friendly name for cert
  commonName: string;            // CN (e.g., "John Doe")
  organization?: string;         // O
  organizationalUnit?: string;   // OU
  country?: string;              // C (2-letter code)
  email?: string;                // Email in subject
  password: string;              // Protect private key
  validityDays: number;          // Default 365
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
  documentHash: string;          // SHA-256 of signed PDF
  error?: string;
}
```

---

## State Management

**`src/lib/store.ts`** - Extend `ESignStore`:

```typescript
interface ESignStore {
  // ... existing fields ...
  
  // Certificate state
  certificates: DigitalCertificate[];
  selectedCertificateId: number | null;
  isCertificateLoading: boolean;
  
  // Certificate actions
  loadCertificates: () => Promise<void>;
  addCertificate: (cert: DigitalCertificate, p12Data: ArrayBuffer) => Promise<void>;
  removeCertificate: (id: number) => Promise<void>;
  selectCertificate: (id: number | null) => void;
  validateCertificatePassword: (id: number, password: string) => Promise<boolean>;
}
```

**Implementation notes**:
- `loadCertificates()`: Fetch from `/api/certificates` on app mount
- `addCertificate()`: Store .p12 in localStorage with key `signease_cert_${id}`, save metadata via API
- `removeCertificate()`: Delete from localStorage + DB via API
- Certificate validation happens in client-side crypto utilities

---

## Client-Side Crypto Utilities

**`src/lib/crypto.ts`** (new file):

```typescript
import forge from 'node-forge';

/**
 * Generate self-signed certificate in-browser
 * Returns .p12 ArrayBuffer and parsed certificate info
 */
export async function generateSelfSignedCertificate(
  formData: CertificateFormData
): Promise<{ p12Buffer: ArrayBuffer; certInfo: Partial<DigitalCertificate> }> {
  // 1. Generate RSA key pair (2048-bit)
  // 2. Create X.509 certificate
  // 3. Set subject attributes (CN, O, OU, C, Email)
  // 4. Self-sign with SHA256withRSA
  // 5. Package into PKCS#12 with password
  // 6. Return ArrayBuffer + metadata
}

/**
 * Parse existing .p12/.pfx file
 * Validate password and extract certificate info
 */
export async function parsePKCS12Certificate(
  p12Buffer: ArrayBuffer,
  password: string
): Promise<{
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.PrivateKey;
  certInfo: Partial<DigitalCertificate>;
}> {
  // 1. Load .p12 with node-forge
  // 2. Decrypt with password
  // 3. Extract certificate and private key
  // 4. Parse certificate fields (CN, issuer, serial, dates, algorithm)
  // 5. Validate dates (check expiry)
  // 6. Return parsed data
}

/**
 * Sign PDF with certificate
 * Embeds PKCS#7 signature into PDF
 */
export async function signPDFWithCertificate(
  pdfBytes: Uint8Array,
  p12Buffer: ArrayBuffer,
  password: string
): Promise<SigningResult> {
  // 1. Parse certificate and private key
  // 2. Calculate SHA-256 hash of PDF content
  // 3. Create PKCS#7 detached signature
  // 4. Sign hash with private key
  // 5. Embed signature dictionary in PDF using pdf-lib
  // 6. Return signed PDF bytes + metadata
}

/**
 * Verify certificate password without signing
 */
export async function validateCertificatePassword(
  p12Buffer: ArrayBuffer,
  password: string
): Promise<boolean> {
  try {
    await parsePKCS12Certificate(p12Buffer, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if certificate is expired
 */
export function isCertificateExpired(validTo: Date): boolean {
  return new Date() > validTo;
}

/**
 * Clear sensitive data from memory (best-effort)
 */
export function clearSensitiveData(obj: any): void {
  // Overwrite private key bytes in memory
  // Note: JavaScript doesn't guarantee memory clearing, but we try
}
```

**Security considerations**:
- Private keys only exist in function scope, cleared after signing
- Passwords never stored, only used for immediate decryption
- .p12 files stored encrypted in localStorage (password-protected by design)
- Use `crypto.subtle.digest` for SHA-256 hashing (same as existing implementation)

---

## API Endpoints

### `src/app/api/certificates/route.ts`

**GET** `/api/certificates` - List user's certificates
```typescript
// Fetch all certificates for authenticated user
// Return metadata only (no .p12 data)
// Calculate isValid based on validTo vs current date
```

**POST** `/api/certificates` - Save new certificate metadata
```typescript
// Body: certificate metadata (from client after parsing .p12)
// Save to DB, return created certificate with ID
// Client uses returned ID as localStorage key
```

**DELETE** `/api/certificates/[id]` - Remove certificate
```typescript
// Delete from DB
// Client responsible for removing from localStorage
```

---

## UI Components

### `src/components/CertificateManager.tsx` (new)

**Purpose**: Manage certificates in RightPanel certificate tab

**Features**:
- List all user certificates with metadata cards
- Show validity status (green = valid, red = expired, yellow = expiring soon <30 days)
- "Generate Certificate" button → opens modal
- "Upload .p12/.pfx" file input
- Delete certificate (with confirmation)
- Select certificate for signing (radio buttons or highlight selected)

**Layout**:
```
┌─────────────────────────────────────┐
│  Certificates                       │
│  [+ Generate] [📁 Upload .p12]      │
├─────────────────────────────────────┤
│  ○ Personal Cert                    │
│     CN: John Doe                    │
│     Valid: 2025-01-01 to 2026-01-01│
│     [🗑️ Delete]                     │
├─────────────────────────────────────┤
│  ● Work Certificate (Selected)      │
│     CN: Jane Smith (Acme Corp)     │
│     Valid: 2024-06-01 to 2025-06-01│
│     ⚠️ Expires in 15 days           │
│     [🗑️ Delete]                     │
└─────────────────────────────────────┘
```

### `src/components/CertificateGeneratorModal.tsx` (new)

**Purpose**: Generate self-signed certificate in-browser

**Form fields**:
- Certificate Name (friendly label)
- Common Name (CN) - required
- Organization (O)
- Organizational Unit (OU)
- Country (C) - 2-letter dropdown
- Email
- Password - required, with strength indicator
- Confirm Password
- Validity Period (days) - default 365

**Workflow**:
1. User fills form and clicks "Generate"
2. Show loading spinner
3. Call `generateSelfSignedCertificate()` from crypto.ts
4. Save .p12 to localStorage
5. POST metadata to API
6. Add to store
7. Show success toast with download option (optional: let user save .p12 file)
8. Close modal

### `src/components/CertificateUploadModal.tsx` (new)

**Purpose**: Upload existing .p12/.pfx certificate

**Workflow**:
1. File input (accept .p12, .pfx)
2. Password input
3. "Friendly Name" input (optional, default to CN)
4. Click "Upload"
5. Parse with `parsePKCS12Certificate()`
6. If password wrong, show error
7. If expired, show warning (allow proceeding)
8. Save to localStorage + POST metadata to API
9. Show success toast
10. Close modal

### `src/components/SigningPasswordDialog.tsx` (new)

**Purpose**: Prompt for certificate password during signing

**Triggered**: When user clicks Download with certificate selected

**UI**:
```
┌─────────────────────────────────────┐
│  Sign with Certificate              │
├─────────────────────────────────────┤
│  Certificate: Work Certificate      │
│  CN: Jane Smith                     │
│                                     │
│  Password: [__________________]     │
│                                     │
│  [Cancel]  [Sign & Download]        │
└─────────────────────────────────────┘
```

**Workflow**:
1. User enters password
2. Validate password with `validateCertificatePassword()`
3. If invalid, show error inline
4. If valid, proceed with signing
5. Call `signPDFWithCertificate()` in store
6. Download signed PDF
7. Update certificate tab with signature metadata
8. Close dialog

---

## Modified Components

### `src/components/RightPanel.tsx`

**Changes**:
- Import and render `<CertificateManager />` at top of certificate tab
- Show certificate manager when no PDF loaded (instead of "upload document" message)
- When PDF loaded + signed, show existing hash display BELOW certificate manager
- Add visual indicator if PDF was signed with certificate (e.g., badge "Signed with: Work Certificate")

**Updated structure**:
```tsx
{rightPanelTab === "certificate" && (
  <div className="space-y-6">
    {/* Always show certificate manager */}
    <CertificateManager />
    
    {/* Separator */}
    {pdfFile && <Separator />}
    
    {/* Existing certificate/hash display after signing */}
    {pdfFile && pdfHash && (
      <div className="space-y-5">
        {/* ... existing verification badge and hash display ... */}
        
        {/* NEW: Show certificate used for signing if applicable */}
        {certificateUsedId && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-xs font-semibold">Signed with Certificate</p>
            <p className="text-xs text-blue-600">{getCertificateById(certificateUsedId)?.name}</p>
          </div>
        )}
      </div>
    )}
  </div>
)}
```

### `src/lib/store.ts` - `downloadPDF()` method

**Changes**:
```typescript
downloadPDF: async () => {
  const { 
    pdfFile, pdfBytes, annotations, user, 
    selectedCertificateId, certificates 
  } = get();
  
  if (!pdfFile || !pdfBytes) return;
  
  // 1. Apply annotations to PDF (existing logic)
  const pdfDoc = await PDFDocument.load(pdfBytes);
  // ... embed annotations, watermarks ...
  
  let finalBytes: Uint8Array;
  let certificateInfo: any = null;
  
  // 2. Check if certificate signing requested
  if (selectedCertificateId) {
    // Show password dialog
    const password = await showPasswordDialog(); // TODO: implement
    if (!password) return; // User cancelled
    
    // Get .p12 from localStorage
    const p12Data = localStorage.getItem(`signease_cert_${selectedCertificateId}`);
    if (!p12Data) {
      toast.error("Certificate data not found");
      return;
    }
    
    // Sign PDF with certificate
    const p12Buffer = base64ToArrayBuffer(p12Data);
    const signingResult = await signPDFWithCertificate(
      await pdfDoc.save(), 
      p12Buffer, 
      password
    );
    
    if (!signingResult.success) {
      toast.error(signingResult.error || "Signing failed");
      return;
    }
    
    finalBytes = signingResult.signedPdfBytes!;
    certificateInfo = signingResult.certificateInfo;
    
    // Clear password from memory
    password = null;
  } else {
    // No certificate - use existing behavior
    finalBytes = await pdfDoc.save();
  }
  
  // 3. Calculate SHA-256 (existing logic)
  const hashBuffer = await crypto.subtle.digest("SHA-256", finalBytes.buffer);
  const hashHex = arrayBufferToHex(hashBuffer);
  
  // 4. Update state
  set({ 
    pdfHash: hashHex, 
    signedAt: new Date().toISOString(),
    certificateUsedId: selectedCertificateId,
    certificateInfo: certificateInfo
  });
  
  // 5. Download (existing logic)
  const blob = new Blob([finalBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFile ? `signed_${pdfFile.name}` : "signed_document.pdf";
  a.click();
  URL.revokeObjectURL(url);
  
  if (certificateInfo) {
    toast.success(`PDF signed with certificate: ${certificateInfo.commonName}`);
  }
}
```

---

## Implementation Tasks

### Phase 1: Database & API Setup
1. Add `Certificate` model to Prisma schema
2. Add `certificates` relation to `User` model
3. Run `npx prisma migrate dev --name add_certificates`
4. Create API routes:
   - `GET /api/certificates`
   - `POST /api/certificates`
   - `DELETE /api/certificates/[id]`
5. Test API with Postman/Thunder Client

### Phase 2: Crypto Utilities
1. Install dependencies: `npm install node-forge @peculiar/webcrypto`
2. Create `src/lib/crypto.ts`
3. Implement `generateSelfSignedCertificate()`
4. Implement `parsePKCS12Certificate()`
5. Implement `signPDFWithCertificate()`
   - Research pdf-lib signature embedding (may need additional libraries)
   - Note: pdf-lib doesn't natively support PKCS#7 signatures - may need workaround or additional library
6. Implement validation helpers
7. Write unit tests for crypto functions (optional but recommended)

### Phase 3: Type Definitions & Store
1. Add types to `src/lib/types.ts`
2. Extend `ESignStore` interface in `src/lib/store.ts`
3. Implement certificate store actions:
   - `loadCertificates()`
   - `addCertificate()`
   - `removeCertificate()`
   - `selectCertificate()`
4. Add localStorage helpers for .p12 storage
5. Call `loadCertificates()` in app initialization

### Phase 4: UI Components
1. Create `CertificateManager.tsx`
   - Certificate list with metadata cards
   - Action buttons (generate, upload, delete)
   - Selection UI (radio buttons)
2. Create `CertificateGeneratorModal.tsx`
   - Form with validation
   - Integration with crypto.ts
   - Success/error handling
3. Create `CertificateUploadModal.tsx`
   - File input + password
   - Parse and validate certificate
   - Handle expired certificates
4. Create `SigningPasswordDialog.tsx`
   - Password input with validation
   - Cancel/proceed actions

### Phase 5: Integration
1. Modify `RightPanel.tsx` to include `<CertificateManager />`
2. Update `downloadPDF()` in store to check for selected certificate
3. Implement password dialog flow
4. Add certificate metadata display after signing
5. Update UI to show "Signed with Certificate" badge
6. Test end-to-end flow:
   - Generate certificate
   - Sign PDF
   - Verify signature embedded
   - Check hash calculation

### Phase 6: Testing & Polish
1. Test certificate expiry validation
2. Test password validation (wrong password handling)
3. Test localStorage persistence across sessions
4. Test multi-device scenario (metadata syncs, .p12 local-only)
5. Add loading states and error handling
6. Add tooltips and help text
7. Update README.md with certificate instructions
8. Update pricing page if certificate signing is Pro-only feature

---

## Security Considerations

1. **Private Key Protection**:
   - Private keys never stored unencrypted
   - Only exist in memory during signing operation
   - Cleared immediately after use

2. **Password Handling**:
   - Passwords never stored (not in localStorage, DB, or state)
   - Only used for immediate .p12 decryption
   - Use secure input fields (type="password")

3. **localStorage Security**:
   - .p12 files already encrypted with user's password
   - localStorage accessible only to same origin
   - Document security limitation: localStorage cleared if user clears browser data

4. **Multi-Device Limitation**:
   - Certificate metadata syncs via DB
   - .p12 files do NOT sync (localStorage is per-device)
   - User must re-upload certificate on each device
   - Document this clearly in UI

5. **Session Security**:
   - Require user authentication to access certificates
   - Check session on all API routes
   - Associate certificates with userId to prevent unauthorized access

---

## Known Limitations

1. **Adobe Reader Validation**:
   - Self-signed certificates NOT trusted by Adobe Reader by default
   - User must manually trust the certificate
   - For CA-validated signatures, user needs CA-issued .p12 file

2. **No Timestamp Server**:
   - Signatures don't include trusted timestamps
   - Signature validity tied to certificate expiry
   - RFC 3161 timestamp support deferred to Phase 2

3. **No Revocation Checking**:
   - No OCSP or CRL validation
   - Expired certificates detected, but not revoked ones
   - Enterprise users should use CA-managed certificates

4. **Browser Compatibility**:
   - Relies on Web Crypto API (supported in modern browsers)
   - `@peculiar/webcrypto` polyfill for older browsers
   - Test on Safari, Firefox, Chrome, Edge

5. **Client-Side Processing Limits**:
   - Large PDFs may cause performance issues during signing
   - RSA operations in browser slower than server-side
   - Consider adding size limit or warning for files >10MB

---

## Future Enhancements (Phase 2)

1. **Certificate Chain Validation**:
   - Validate certificate against CA root certificates
   - Show trust status in UI

2. **Timestamp Server Integration**:
   - RFC 3161 compliant timestamps
   - Preserves signature validity after certificate expiry

3. **Batch Signing**:
   - Sign multiple PDFs with one password entry
   - Useful for bulk document processing

4. **Certificate Import/Export**:
   - Export .p12 for backup
   - Import from other devices

5. **Revocation Checking**:
   - OCSP responder integration
   - CRL download and validation

6. **Pro Plan Features**:
   - Limit free users to self-signed certificates
   - Pro users can use CA-issued certificates
   - Advanced signature verification tools

---

## Validation Plan

### Unit Tests
- Crypto utilities (certificate generation, parsing, signing)
- Store actions (add, remove, select certificates)
- Password validation logic

### Integration Tests
- API routes with authentication
- Certificate metadata CRUD operations
- localStorage persistence

### Manual Testing Scenarios

1. **Generate Self-Signed Certificate**:
   - Fill form with valid data
   - Generate certificate
   - Verify saved to localStorage + DB
   - Check certificate appears in list

2. **Upload Existing Certificate**:
   - Upload valid .p12 file
   - Enter correct password
   - Verify parsing and metadata extraction
   - Test wrong password handling

3. **Sign PDF with Certificate**:
   - Select certificate
   - Add annotations to PDF
   - Click Download
   - Enter certificate password
   - Verify PDF downloads
   - Check hash calculation
   - Verify signature metadata displayed

4. **Certificate Expiry**:
   - Upload expired certificate
   - Verify warning shown
   - Attempt to sign with expired cert
   - Check validation behavior

5. **Multi-Session Persistence**:
   - Sign PDF with certificate
   - Refresh page
   - Verify certificate list loads from DB
   - Verify .p12 still in localStorage
   - Sign another PDF without re-upload

6. **Cross-Device**:
   - Sign PDF on Device A
   - Login on Device B
   - Verify certificate metadata appears
   - Verify .p12 NOT available (must re-upload)
   - Upload same certificate on Device B
   - Verify signing works

7. **Delete Certificate**:
   - Delete certificate from list
   - Verify removed from DB
   - Verify removed from localStorage
   - Verify cannot sign with deleted cert

---

## Open Questions

1. **pdf-lib Signature Support**: pdf-lib doesn't natively support PKCS#7 signature embedding. Need to research:
   - Can we manually add signature dictionary to PDF?
   - Do we need additional library like `node-signpdf`?
   - Will signatures be valid in Adobe Reader?

2. **Pro Plan Gating**: Should certificate signing be:
   - Available to all users (Free + Pro)?
   - Pro-only feature?
   - Free users: self-signed only, Pro users: CA-issued certs?

3. **Certificate Sharing**: Should users be able to:
   - Share certificates between team members?
   - Assign certificates to specific documents?

4. **Audit Trail**: Should we track:
   - Each signing operation in database?
   - Document hash + certificate used?
   - For compliance/audit purposes?

---

## Success Criteria

1. User can generate self-signed certificate in-browser
2. User can upload existing .p12/.pfx certificate
3. User can select certificate for signing
4. PDF signing embeds digital signature (PKCS#7)
5. Certificate metadata persists in database
6. Encrypted .p12 persists in localStorage
7. Password validation works correctly
8. Expired certificate detection works
9. Multi-device: metadata syncs, .p12 requires re-upload
10. SHA-256 hash calculation still works
11. Backward compatible: signing without certificate uses existing flow
12. No regression in existing visual signature functionality

---

## Rollout Plan

1. **Development**: Implement in feature branch `feature/digital-certificates`
2. **Testing**: Manual QA + automated tests
3. **Staging**: Deploy to staging environment, test with real .p12 files
4. **Documentation**: Update README, add certificate guide
5. **Beta**: Release to Pro users first (if Pro-only feature)
6. **Production**: Full rollout with monitoring
7. **Monitoring**: Track certificate creation, signing operations, errors
8. **Support**: Prepare help docs for common issues (wrong password, expired certs, Adobe validation)

