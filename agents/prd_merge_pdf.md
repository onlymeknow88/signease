# PRD: Fitur Merge PDF untuk PDFinaja

## 📋 Overview

Dokumen ini menjelaskan spesifikasi lengkap untuk fitur **Merge PDF** di PDFinaja — kemampuan untuk menggabungkan beberapa file PDF menjadi satu dokumen PDF tunggal dengan kontrol urutan halaman dan preview interaktif.

**Prinsip Inti**: Fitur ini mengikuti filosofi PDFinaja yaitu **100% client-side processing** menggunakan `pdf-lib`. Tidak ada file yang diunggah ke server.

---

## 🎯 Goals & Objectives

### Business Goals
- Menambah value proposition PDFinaja sebagai all-in-one PDF tool
- Meningkatkan retention dengan fitur yang sering digunakan (merge PDF sangat umum)
- Memberikan alternatif privacy-first untuk online PDF merge tools

### User Goals
- Menggabungkan beberapa PDF dengan cepat dan aman
- Mengatur urutan halaman dengan drag-and-drop intuitif
- Preview sebelum merge untuk memastikan hasil sesuai ekspektasi
- Melanjutkan ke edit/sign setelah merge (workflow terintegrasi)

---

## 👥 Target Users

- **Professional**: Menggabungkan invoice, kontrak, atau laporan multi-bagian
- **Students**: Merge assignment files, lecture notes, atau research papers
- **Personal Use**: Gabungkan scan dokumen, travel documents, atau receipts

---

## ✨ Features & Requirements

### 1. Multi-File Upload Interface

**Deskripsi**: Landing page `/merge` dengan drag-and-drop area untuk upload multiple PDFs.

**User Stories**:
- Sebagai user, saya ingin upload multiple PDF sekaligus (drag-drop atau click to browse)
- Sebagai user, saya ingin melihat nama file dan jumlah halaman setiap PDF yang diupload
- Sebagai user, saya ingin bisa hapus PDF yang salah upload sebelum merge

**Acceptance Criteria**:
- ✅ Drag-drop area support multiple files (accept `.pdf` only)
- ✅ Click-to-browse dengan multi-select enabled
- ✅ Tampilkan list uploaded files dengan info:
  - Nama file
  - Ukuran file (KB/MB)
  - Jumlah halaman
  - Tombol "Remove" untuk hapus dari list
- ✅ Disable merge button jika < 2 PDFs
- ✅ Max file size: 50MB per file (client-side validation)
- ✅ Loading indicator saat PDF sedang di-parse untuk hitung total pages

**Technical Notes**:
- Gunakan `PDFDocument.load()` dari `pdf-lib` untuk parse dan count pages
- Store uploaded files di Zustand state sebagai `File[]` dengan metadata

---

### 2. Page Preview & Reordering

**Deskripsi**: Thumbnail preview semua halaman dari semua PDF dengan drag-and-drop untuk reorder.

**User Stories**:
- Sebagai user, saya ingin melihat thumbnail preview dari setiap halaman
- Sebagai user, saya ingin drag halaman untuk ubah urutan
- Sebagai user, saya ingin hapus halaman tertentu yang tidak perlu (optional enhancement)

**Acceptance Criteria**:
- ✅ Render thumbnail untuk semua pages menggunakan `pdfjs-dist`
- ✅ Thumbnail size: 120x160px dengan aspect ratio preserved
- ✅ Label setiap thumbnail dengan: "PDF name - Page X"
- ✅ Drag-and-drop reordering menggunakan `@dnd-kit/core` atau native HTML5 drag API
- ✅ Visual feedback saat dragging (opacity, border highlight)
- ✅ Auto-scroll saat drag mendekati edge container
- ✅ Display total pages count: "Total: X pages"

**Phase 2 Enhancement** (tidak untuk MVP):
- Checkbox per-page untuk selective merge
- Multi-select pages dengan Shift+Click
- Duplicate page functionality

**Technical Notes**:
- Gunakan `pdfjs-dist` `getPage()` + `getViewport()` + `render()` untuk generate thumbnails
- Store page order di Zustand state sebagai array of `{ fileIndex: number, pageNumber: number }`
- Debounce thumbnail rendering untuk large PDFs (>50 pages)

---

### 3. Merge Operation

**Deskripsi**: Button "Merge PDFs" yang menggabungkan semua PDF sesuai urutan yang dipilih.

**User Stories**:
- Sebagai user, saya ingin merge PDFs dengan sekali klik
- Sebagai user, saya ingin melihat progress indicator selama proses merge
- Sebagai user, saya ingin error handling jika merge gagal

**Acceptance Criteria**:
- ✅ Button "Merge PDFs" prominent di bottom toolbar
- ✅ Progress indicator dengan percentage dan estimated time
- ✅ Merge algorithm:
  1. Create new `PDFDocument`
  2. Loop through page order array
  3. Copy pages from source PDFs using `copyPages()`
  4. Return merged `Uint8Array`
- ✅ Error handling untuk:
  - Corrupted PDF files
  - Insufficient memory (very large files)
  - Permission-protected PDFs
- ✅ Success notification: "PDFs merged successfully!"

**Performance Considerations**:
- Process in chunks untuk large PDFs (>100 pages)
- Use Web Worker jika total size > 20MB (optional enhancement)

**Technical Notes**:
```typescript
async function mergePDFs(files: File[], pageOrder: PageOrder[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const { fileIndex, pageNumber } of pageOrder) {
    const pdfDoc = await PDFDocument.load(await files[fileIndex].arrayBuffer());
    const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [pageNumber - 1]);
    mergedPdf.addPage(copiedPage);
  }
  
  return mergedPdf.save();
}
```

---

### 4. Post-Merge Actions

**Deskripsi**: Setelah merge berhasil, user diberikan 2 opsi: Download langsung atau Edit/Sign.

**User Stories**:
- Sebagai user, saya ingin download hasil merge langsung tanpa edit
- Sebagai user, saya ingin edit/sign merged PDF sebelum download
- Sebagai user, saya ingin preview hasil merge sebelum memutuskan

**Acceptance Criteria**:
- ✅ Preview merged PDF di modal/dialog
- ✅ 2 action buttons:
  - **"Download"**: Download merged PDF langsung (`merged_document.pdf`)
  - **"Edit & Sign"**: Redirect ke `/app` workspace dengan merged PDF loaded
- ✅ Button "Merge Another" untuk kembali ke upload page
- ✅ Preserve merged PDF di memory untukEdit & Sign workflow

**Technical Notes**:
- Store merged PDF bytes di Zustand state (`mergedPdfBytes`)
- Saat click "Edit & Sign", set `pdfBytes` di store dan navigate to `/app`

---

### 5. UI/UX Design

**Layout Structure**:

```
┌─────────────────────────────────────────────────────────┐
│  PDFinaja Logo        Merge PDFs           [User Menu]  │ <- Top Nav
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Drag & Drop PDFs Here                          │    │ <- Upload Area
│  │  or click to browse                             │    │
│  │                                                  │    │
│  │  Supported: PDF files up to 50MB each           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  Uploaded Files (3):                                     │
│  ┌──────────────────────────────────────────────┐       │
│  │ 📄 Invoice_Q1.pdf    2 pages   1.2 MB   [x] │       │ <- File List
│  │ 📄 Report_Final.pdf  15 pages  3.4 MB   [x] │       │
│  │ 📄 Contract.pdf      5 pages   0.8 MB   [x] │       │
│  └──────────────────────────────────────────────┘       │
│                                                           │
│  Page Preview (Total: 22 pages)          [Grid] [List]  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │ ...                │ <- Thumbnails
│  │□□□ │ │□□□ │ │□□□ │ │□□□ │ │□□□ │                    │   (draggable)
│  └────┘ └────┘ └────┘ └────┘ └────┘                    │
│  Invoice_Q1.pdf - Page 1                                │
│                                                           │
├─────────────────────────────────────────────────────────┤
│  [Reset]                          [Merge PDFs (22 pgs)] │ <- Action Bar
└─────────────────────────────────────────────────────────┘
```

**Design System**:
- Colors: Gunakan palette yang sama dengan `/app` workspace
- Typography: Poppins (consistent dengan branding PDFinaja)
- Spacing: 16px grid system
- Shadows: Material Design elevation levels
- Animations: Smooth transitions (200ms ease-in-out)

**Responsive Behavior**:
- Desktop (>1024px): 4-5 thumbnails per row
- Tablet (768-1024px): 3 thumbnails per row
- Mobile (<768px): 2 thumbnails per row, stack upload area

---

## 🔐 Security & Privacy

- ✅ All processing happens in browser (no server upload)
- ✅ Files cleared from memory after download/navigate away
- ✅ No analytics on file names or content
- ✅ Add privacy statement: "Your PDFs never leave your device"

---

## 📊 Success Metrics

**Primary Metrics**:
- Merge feature adoption rate: % of users who use merge vs. sign
- Average files per merge session
- Conversion rate: Merge → Edit & Sign workflow

**Secondary Metrics**:
- Time to complete merge (UX metric)
- Error rate (technical reliability)
- Repeat usage rate (retention indicator)

---

## 🚀 Implementation Plan

### Phase 1: MVP (Week 1-2)

**Scope**:
- Upload interface with file list
- Basic thumbnail preview (no reorder)
- Merge function with download
- Success/error notifications

**Deliverables**:
- Route `/merge` dengan basic UI
- Zustand store extension untuk merge state
- Merge utility function (`mergePDFs()`)
- Download functionality

### Phase 2: Drag & Drop Reordering (Week 3)

**Scope**:
- Implement drag-and-drop untuk reorder pages
- Visual feedback dan animations
- Auto-scroll saat drag edge

**Deliverables**:
- DnD library integration (@dnd-kit/core)
- Page reorder state management
- UX polish (loading states, transitions)

### Phase 3: Edit & Sign Integration (Week 4)

**Scope**:
- Post-merge modal dengan preview
- "Edit & Sign" workflow ke `/app`
- Preserve merged PDF di store untuk editing

**Deliverables**:
- Modal component untuk post-merge actions
- Navigation integration dengan workspace
- E2E testing untuk full workflow

### Phase 4: Enhancements (Future)

**Scope** (not MVP):
- Page selection (checkbox per page)
- Page rotation before merge
- Page deletion from preview
- Batch merge multiple sets
- Export settings (compression, format)

---

## 🛠️ Technical Stack

**Libraries Required**:
- `pdf-lib` (sudah ada) — for merge operation
- `pdfjs-dist` (sudah ada) — for thumbnail rendering
- `@dnd-kit/core` (NEW) — for drag-and-drop reordering
- `zustand` (sudah ada) — for state management

**New Dependencies**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

**File Structure**:
```
src/
├── app/
│   └── merge/
│       ├── page.tsx              # Main merge page
│       └── layout.tsx            # Layout wrapper
├── components/
│   ├── merge/
│   │   ├── UploadArea.tsx        # Drag-drop upload zone
│   │   ├── FileList.tsx          # List uploaded PDFs
│   │   ├── PageThumbnails.tsx    # Draggable thumbnails
│   │   ├── MergeToolbar.tsx      # Action buttons
│   │   └── PostMergeModal.tsx    # Download/Edit options
│   └── ...
├── lib/
│   ├── merge.ts                  # Merge utility functions
│   └── store.ts                  # Extend with merge state
└── ...
```

---

## 🧪 Testing Strategy

**Unit Tests**:
- `mergePDFs()` function dengan various inputs
- Page reorder logic
- File validation (size, type)

**Integration Tests**:
- Upload → Preview → Merge → Download flow
- Upload → Preview → Merge → Edit & Sign flow
- Error handling untuk corrupted PDFs

**Manual Testing Checklist**:
- [ ] Upload 2-10 PDFs dengan berbagai ukuran
- [ ] Reorder pages via drag-and-drop
- [ ] Merge dan verify output di PDF viewer
- [ ] Test dengan protected/encrypted PDFs (should fail gracefully)
- [ ] Test di Chrome, Firefox, Safari
- [ ] Test di mobile devices (responsive)

---

## 🎨 Design Mockups

**Figma Link**: [To be created]

**Key Screens**:
1. Upload Page (empty state)
2. Upload Page (with files loaded)
3. Thumbnail Preview (grid view)
4. Merge in Progress (loading state)
5. Post-Merge Modal (preview + actions)

---

## 📝 User Documentation

**Help Text** (tampilkan di upload area):
> **How to merge PDFs:**
> 1. Upload 2 or more PDF files
> 2. Arrange pages in desired order by dragging thumbnails
> 3. Click "Merge PDFs" to combine them
> 4. Download or continue to edit/sign

**FAQ Section** (di page `/merge`):

**Q: Is my PDF uploaded to a server?**  
A: No. PDFinaja processes everything in your browser. Your files never leave your device.

**Q: What's the maximum file size?**  
A: Each PDF can be up to 50MB. Total size is limited by your browser's memory.

**Q: Can I merge password-protected PDFs?**  
A: Currently, password-protected PDFs are not supported. Please remove protection first.

**Q: Can I select specific pages to merge?**  
A: In the current version, all pages are merged. Page selection is coming in a future update.

---

## 🚧 Known Limitations & Future Improvements

**Current Limitations**:
- Cannot handle password-protected PDFs
- No page-level selection (merge all pages from each PDF)
- No page rotation before merge
- Limited to ~50MB per file due to browser memory

**Future Enhancements**:
- Add page selection checkboxes
- Add page rotation controls (90°, 180°, 270°)
- Support for split PDF (reverse of merge)
- Export options (compression level, page size)
- Save merge template for recurring workflows
- Batch merge (multiple merge operations in queue)

---

## 📄 Appendix

### A. Similar Tools Analysis

**Competitor Features** (for reference):
- **Adobe Acrobat Online**: Drag-drop reorder, page preview, download
- **Smallpdf**: Simple upload + merge, no reorder
- **PDFtk**: CLI-based, powerful but not user-friendly
- **iLovePDF**: Upload + reorder + merge, but requires server upload

**PDFinaja Differentiator**: 100% client-side + seamless integration dengan sign/edit workflow.

### B. API Reference

**Zustand Store Extension**:

```typescript
interface MergeStore {
  // Uploaded PDFs
  uploadedPDFs: Array<{
    file: File;
    pageCount: number;
    thumbnails: string[]; // base64 data URLs
  }>;
  
  // Page order configuration
  pageOrder: Array<{
    fileIndex: number;
    pageNumber: number;
  }>;
  
  // Merged result
  mergedPdfBytes: Uint8Array | null;
  
  // Actions
  addPDF: (file: File) => Promise<void>;
  removePDF: (fileIndex: number) => void;
  reorderPages: (from: number, to: number) => void;
  mergePDFs: () => Promise<Uint8Array>;
  resetMerge: () => void;
}
```

### C. Glossary

- **Merge**: Combining multiple PDF documents into one
- **Reorder**: Changing the sequence of pages
- **Thumbnail**: Small preview image of a page
- **DnD**: Drag-and-Drop interaction pattern
- **Client-side**: Processing that happens in the user's browser, not on a server

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-03  
**Author**: PDFinaja Product Team  
**Status**: Ready for Development

