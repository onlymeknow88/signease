"use client";

import { create } from "zustand";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { nanoid } from "nanoid";
import { useESignStore } from "./store";

export interface MergePDFItem {
  id: string;
  file: File;
  bytes: Uint8Array;
  pageCount: number;
  name: string;
}

interface MergeStore {
  items: MergePDFItem[];
  isMerging: boolean;
  mergedBytes: Uint8Array | null;
  mergedPageCount: number;
  error: string | null;

  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removeItem: (id: string) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  clearAll: () => void;
  mergePDFs: () => Promise<void>;
  openInEditor: (routerPush: (path: string) => void) => void;
}

export const useMergeStore = create<MergeStore>((set, get) => ({
  items: [],
  isMerging: false,
  mergedBytes: null,
  mergedPageCount: 0,
  error: null,

  addFiles: async (files: File[]) => {
    set({ error: null });
    const newItems: MergePDFItem[] = [];

    // Filter only PDFs
    const pdfFiles = files.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      set({ error: "Hanya file PDF yang didukung." });
      return;
    }

    // Get current plan constraints if any
    const userPlan = useESignStore.getState().user.plan;
    const currentTotal = get().items.length + pdfFiles.length;

    if (userPlan === "free" && currentTotal > 2) {
      set({ error: "Pengguna Gratis hanya dapat menggabungkan maksimal 2 file PDF. Silakan upgrade ke Pro untuk menggabungkan lebih banyak file." });
      return;
    }

    for (const file of pdfFiles) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        // Load with pdf-lib to check page count & validate PDF
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();

        newItems.push({
          id: nanoid(),
          file,
          bytes,
          pageCount,
          name: file.name,
        });
      } catch (err) {
        console.error("Gagal membaca file PDF:", file.name, err);
        set({ error: `Gagal membaca file PDF: ${file.name}. File mungkin terenkripsi atau rusak.` });
      }
    }

    if (newItems.length > 0) {
      set((state) => ({
        items: [...state.items, ...newItems],
      }));
    }
  },

  removeItem: (id: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      mergedBytes: null,
      mergedPageCount: 0,
    }));
  },

  reorderItems: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const items = [...state.items];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return {
        items,
        mergedBytes: null,
        mergedPageCount: 0,
      };
    });
  },

  clearAll: () => {
    set({
      items: [],
      mergedBytes: null,
      mergedPageCount: 0,
      isMerging: false,
      error: null,
    });
  },

  mergePDFs: async () => {
    const { items } = get();
    if (items.length < 2) {
      set({ error: "Paling tidak pilih minimal 2 file PDF untuk digabungkan." });
      return;
    }

    set({ isMerging: true, error: null });

    try {
      const mergedDoc = await PDFDocument.create();

      for (const item of items) {
        const srcDoc = await PDFDocument.load(item.bytes);
        const copiedPages = await mergedDoc.copyPages(
          srcDoc,
          Array.from({ length: item.pageCount }, (_, i) => i)
        );
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      // Add watermark if user plan is free
      const userPlan = useESignStore.getState().user.plan;
      if (userPlan === "free") {
        const pages = mergedDoc.getPages();
        const helveticaFont = await mergedDoc.embedFont(StandardFonts.Helvetica);
        
        for (const page of pages) {
          const { width, height } = page.getSize();
          const watermarkText = "Merged with PDFinaja Free — signease.app";
          const fontSize = 24;
          const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = helveticaFont.heightAtSize(fontSize);
          const x = (width - textWidth) / 2;
          const y = (height - textHeight) / 2;

          page.drawText(watermarkText, {
            x,
            y: y + 50,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.18,
            rotate: degrees(30),
          });
        }
      }

      const mergedBytes = await mergedDoc.save();
      set({
        mergedBytes,
        mergedPageCount: mergedDoc.getPageCount(),
        isMerging: false,
      });
    } catch (err) {
      console.error("Gagal melakukan merging PDF:", err);
      set({
        error: "Gagal menggabungkan file-file PDF. Pastikan file Anda tidak diproteksi password.",
        isMerging: false,
      });
    }
  },

  openInEditor: (routerPush: (path: string) => void) => {
    const { mergedBytes, items } = get();
    if (!mergedBytes) return;

    // Create a virtual file to pass to signease store
    const fileNames = items.map((i) => i.name.replace(".pdf", "")).join("_and_");
    const newFileName = `merged_${fileNames.substring(0, 30)}.pdf`;
    const file = new File([mergedBytes.buffer as ArrayBuffer], newFileName, { type: "application/pdf" });

    // Populate the main e-sign store
    const eSignStore = useESignStore.getState();
    eSignStore.reset();
    eSignStore.setPdfFile(file);
    eSignStore.setPdfBytes(mergedBytes);
    eSignStore.setTotalPages(get().mergedPageCount);
    eSignStore.setCurrentPage(1);

    routerPush("/app");
  },
}));
