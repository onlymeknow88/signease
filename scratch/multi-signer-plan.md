# Plan: Multi-Signer Certificate Request

> Fitur untuk mengirim permintaan tanda tangan ke beberapa orang secara berurutan, masing-masing dengan sertifikat digital mereka sendiri.

---

## Konsep Utama

Pengirim (sender) upload PDF, tentukan field tanda tangan untuk masing-masing penerima (recipient), kirim link unik ke setiap orang. Setiap penerima buka link, tanda tangan dengan sertifikat mereka sendiri, dan PDF ditandatangani secara berurutan.

---

## 1. Database Schema (Prisma)

Tambah 3 model baru ke `prisma/schema.prisma`:

```prisma
model SignatureRequest {
  id          String    @id @default(cuid())
  title       String
  message     String?
  pdfUrl      String    // stored di server/Vercel Blob/S3
  pdfHash     String    // SHA-256 original PDF
  status      RequestStatus @default(PENDING)
  createdAt   DateTime  @default(now())
  expiresAt   DateTime
  senderId    String
  sender      User      @relation(fields: [senderId], references: [id])
  recipients  SignatureRequestRecipient[]
  auditLogs   AuditLog[]
}

model SignatureRequestRecipient {
  id           String    @id @default(cuid())
  requestId    String
  request      SignatureRequest @relation(fields: [requestId], references: [id])
  email        String
  name         String
  order        Int       // urutan signing: 1, 2, 3...
  status       RecipientStatus @default(PENDING)
  token        String    @unique  // token unik untuk link signing
  signedAt     DateTime?
  fieldConfig  Json      // posisi & konfigurasi field signature di PDF
  signedPdfUrl String?   // URL PDF setelah ditandatangani recipient ini
}

model AuditLog {
  id          String    @id @default(cuid())
  requestId   String
  request     SignatureRequest @relation(fields: [requestId], references: [id])
  action      String    // "created" | "viewed" | "signed" | "declined" | "expired"
  actorEmail  String
  ipAddress   String?
  timestamp   DateTime  @default(now())
}

enum RequestStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  EXPIRED
  CANCELLED
}

enum RecipientStatus {
  PENDING
  VIEWED
  SIGNED
  DECLINED
}
```

---

## 2. API Routes Baru

Semua di `src/app/api/`:

```
POST   /api/requests                    → buat signature request + kirim email ke recipient pertama
GET    /api/requests                    → list semua request milik sender (authenticated)
GET    /api/requests/[id]               → detail request + status setiap recipient
DELETE /api/requests/[id]               → cancel request

GET    /api/sign/[token]                → ambil PDF & field config untuk recipient (public)
POST   /api/sign/[token]                → submit PDF yang sudah ditandatangani
POST   /api/sign/[token]/decline        → tolak permintaan

GET    /api/requests/[id]/audit         → audit trail lengkap
GET    /api/requests/[id]/download      → download final PDF (semua sudah sign)
```

---

## 3. Halaman & Komponen Baru

### Halaman (Pages)

| Route | Deskripsi | Auth |
|-------|-----------|------|
| `/requests` | Dashboard list semua request yang dikirim | Required |
| `/requests/new` | Buat request baru: upload PDF + atur recipients + tempatkan field | Required |
| `/requests/[id]` | Detail & tracking status per recipient | Required |
| `/sign/[token]` | Halaman signing untuk recipient | Public (token-based) |

### Komponen Baru

```
src/components/requests/
  RequestBuilder.tsx      → UI untuk drag & drop field signature per recipient ke PDF
  RecipientList.tsx       → tambah / urut / hapus recipients + assign field
  RecipientCard.tsx       → card status individual recipient
  RequestStatusBoard.tsx  → overview status semua recipients dengan timeline

src/components/sign/
  SigningViewer.tsx        → PDF viewer untuk recipient dengan field yang sudah ditentukan
  SigningPanel.tsx         → panel pilih sertifikat + tanda tangan + submit
  DeclineModal.tsx         → modal konfirmasi tolak permintaan
```

---

## 4. Alur Kerja (Flow)

```
Sender                        System                          Recipient
  │                              │                                │
  ├─ Upload PDF                  │                                │
  ├─ Tambah recipients + order   │                                │
  ├─ Tempatkan field signature   │                                │
  │  per recipient               │                                │
  ├─ Set expiry date             │                                │
  ├─ Klik "Kirim"                │                                │
  │                              ├─ Simpan PDF ke storage         │
  │                              ├─ Buat token unik per recipient │
  │                              ├─ Log audit: "created"          │
  │                              ├─ Kirim email ke recipient #1 ─►│
  │                              │                                ├─ Buka link /sign/[token]
  │                              │◄─ GET /api/sign/[token] ───────┤
  │                              ├─ Log audit: "viewed"           │
  │                              │                                ├─ Review PDF
  │                              │                                ├─ Pilih sertifikat
  │                              │                                ├─ Tanda tangan (client-side)
  │                              │◄─ POST /api/sign/[token] ──────┤
  │                              ├─ Verifikasi & simpan PDF       │
  │                              ├─ Update status recipient → SIGNED
  │                              ├─ Log audit: "signed"           │
  │                              ├─ Kirim email ke recipient #2 ─►│ (next in order)
  │                              │  ... (repeat untuk setiap recipient)
  │                              ├─ Semua signed → status COMPLETED
  │◄─ Notif email: selesai ──────┤                                │
  ├─ Download final PDF          │                                │
```

---

## 5. Signing Mode

Karena private key **tidak boleh meninggalkan browser**, signing tetap dilakukan di sisi client:

| Mode | Cara Kerja | Kapan Digunakan |
|------|-----------|-----------------|
| **Visual only** | Gambar tanda tangan ditempel ke PDF, tanpa PKI | MVP / phase 1 |
| **PKI client-side** | Recipient sign di browser dengan cert mereka, upload hasil PDF | Phase 2 |
| **Server-side** | Private key dikirim ke server — **tidak direkomendasikan** | Tidak dipakai |

**Rekomendasi:** Mulai dengan visual signature (konsisten dengan `SavedSignature` yang sudah ada), lalu tambahkan PKI client-side di fase berikutnya.

---

## 6. Penyimpanan File PDF

Gunakan **Vercel Blob** (sudah di ekosistem Next.js) atau **AWS S3**:

```
/uploads/requests/[requestId]/original.pdf          → PDF asli dari sender
/uploads/requests/[requestId]/signed-1.pdf          → setelah recipient #1 sign
/uploads/requests/[requestId]/signed-2.pdf          → setelah recipient #2 sign
/uploads/requests/[requestId]/final.pdf             → semua sudah sign
```

Setiap tahap simpan PDF baru (tidak overwrite) untuk keperluan audit trail.

---

## 7. Email Notifications

Gunakan provider email yang sudah ada di project (Resend/Nodemailer):

| Trigger | Penerima | Isi |
|---------|---------|-----|
| Request dibuat | Recipient #1 | Link signing + deadline |
| Recipient N selesai sign | Recipient N+1 | Link signing + deadline |
| Semua selesai | Sender | Notif selesai + link download |
| Request akan expired | Semua pending recipients | Reminder |
| Request di-cancel | Semua pending recipients | Pemberitahuan |

---

## 8. Urutan Implementasi

### Fase 1 — Backend Foundation
- [ ] Tambah model `SignatureRequest`, `SignatureRequestRecipient`, `AuditLog` ke schema Prisma
- [ ] Jalankan migration
- [ ] Setup Vercel Blob / S3 untuk penyimpanan PDF
- [ ] Buat API routes: `POST /api/requests`, `GET /api/requests`, `GET/DELETE /api/requests/[id]`

### Fase 2 — Signing Public Page
- [ ] Buat API routes: `GET/POST /api/sign/[token]`, `POST /api/sign/[token]/decline`
- [ ] Buat halaman `/sign/[token]` dengan `SigningViewer` + `SigningPanel`
- [ ] Integrasi dengan `CertificateManager` yang sudah ada untuk pilih sertifikat

### Fase 3 — Request Builder UI
- [ ] Buat halaman `/requests/new` dengan `RequestBuilder`
- [ ] Buat `RecipientList` untuk atur recipients dan order
- [ ] Tambah fitur drag & drop field per recipient (extend `AnnotationLayer` yang sudah ada)

### Fase 4 — Dashboard & Tracking
- [ ] Buat halaman `/requests` (list semua request)
- [ ] Buat halaman `/requests/[id]` dengan `RequestStatusBoard`
- [ ] Implementasi `GET /api/requests/[id]/audit` dan `/download`
- [ ] Tambah link di sidebar navigasi

### Fase 5 — PKI Client-Side (Opsional)
- [ ] Recipient bisa sign dengan sertifikat digital mereka sendiri di browser
- [ ] Verifikasi multi-signature di server

---

## 9. Komponen Existing yang Bisa Di-reuse

| Komponen | Dipakai untuk |
|----------|--------------|
| `CertificateManager` | Pilih sertifikat saat signing di `/sign/[token]` |
| `AnnotationLayer` | Render field signature di `RequestBuilder` |
| `PDFViewer` | Preview PDF di semua halaman |
| `SignaturePad` | Buat tanda tangan di `SigningPanel` |
| `useESignStore` | Bisa di-extend atau buat store baru `useRequestStore` |

---

## 10. Estimasi Kompleksitas

| Fase | Estimasi | Dependensi |
|------|----------|-----------|
| Fase 1 | Medium | Prisma schema, storage setup |
| Fase 2 | Medium | Fase 1, existing SignaturePad |
| Fase 3 | High | Fase 1, existing AnnotationLayer |
| Fase 4 | Low-Medium | Fase 1, 2, 3 |
| Fase 5 | High | Fase 2, crypto/PKI knowledge |
