"use client";

import { create } from "zustand";
import { SignatureAnnotation } from "./types";
import { nanoid } from "nanoid";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: "Paid" | "Failed";
}

export interface UserState {
  name: string;
  email: string;
  plan: "free" | "pro";
  loggedIn: boolean;
  provider: "google" | "email" | null;
}

const getInitialUser = (): UserState => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("signease_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
  }
  return {
    name: "",
    email: "",
    plan: "free",
    loggedIn: false,
    provider: null,
  };
};

const getInitialBilling = (): BillingRecord[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("signease_billing");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
  }
  return [
    {
      id: "INV-8371",
      date: "20 Nov 2024",
      amount: 149000,
      method: "Visa ending in 4242",
      status: "Paid",
    },
    {
      id: "INV-7294",
      date: "20 Oct 2024",
      amount: 149000,
      method: "GoPay Wallet",
      status: "Paid",
    },
  ];
};

interface ESignStore {
  // PDF state
  pdfFile: File | null;
  pdfBytes: Uint8Array | null;
  totalPages: number;
  currentPage: number;

  // Signature library (saved signatures)
  savedSignatures: string[]; // base64 PNG data URLs
  selectedSignatureUrl: string | null;
  selectedSignatureType: "signature" | "text" | null;
  selectedTextDetails: {
    text: string;
    color: string;
    size: number;
    fontFamily: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
  } | null;

  // Annotations placed on the PDF
  annotations: SignatureAnnotation[];
  selectedAnnotationId: string | null;

  // History stack for Undo/Redo
  history: SignatureAnnotation[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;

  // UI state
  isPlacingMode: boolean; // true = next click on PDF places the signature
  pdfScale: number; // Zoom level
  activeTool: "select" | "text" | "cross" | "check" | "circle" | "line" | "dot" | "signature";
  activeColor: string; // Hex color for drawing/text
  rightPanelTab: "properties" | "certificate";

  // User/Auth/Subscription State
  user: UserState;
  billingHistory: BillingRecord[];

  // Digital certificate
  pdfHash: string | null;
  signedAt: string | null;

  // Actions
  setPdfFile: (file: File | null) => void;
  setPdfBytes: (bytes: Uint8Array | null) => void;
  setTotalPages: (n: number) => void;
  setCurrentPage: (n: number) => void;
  setPdfScale: (scale: number) => void;
  setActiveTool: (tool: "select" | "text" | "cross" | "check" | "circle" | "line" | "dot" | "signature") => void;
  setActiveColor: (color: string) => void;
  setRightPanelTab: (tab: "properties" | "certificate") => void;

  addSavedSignature: (dataUrl: string) => void;
  removeSavedSignature: (dataUrl: string) => void;
  setSelectedSignature: (
    dataUrl: string | null,
    type?: "signature" | "text",
    textDetails?: {
      text: string;
      color: string;
      size: number;
      fontFamily: string;
      isBold: boolean;
      isItalic: boolean;
      isUnderline: boolean;
    } | null
  ) => void;

  addAnnotation: (ann: Omit<SignatureAnnotation, "id">) => void;
  updateAnnotation: (id: string, updates: Partial<SignatureAnnotation>) => void;
  removeAnnotation: (id: string) => void;
  setSelectedAnnotationId: (id: string | null) => void;

  setPlacingMode: (val: boolean) => void;
  reset: () => void;

  // User Actions
  login: (name: string, email: string, provider: "google" | "email") => void;
  logout: () => void;
  setPlan: (plan: "free" | "pro") => void;
  addBillingRecord: (amount: number, method: string, status?: "Paid" | "Failed") => void;
  setPdfHash: (hash: string | null) => void;

  // Main signing execution
  downloadSignedPdf: () => Promise<{ hash: string; bytes: Uint8Array } | null>;
}

export const useESignStore = create<ESignStore>((set) => ({
  pdfFile: null,
  pdfBytes: null,
  totalPages: 0,
  currentPage: 0,
  savedSignatures: [],
  selectedSignatureUrl: null,
  selectedSignatureType: "signature",
  selectedTextDetails: null,
  annotations: [],
  selectedAnnotationId: null,
  pdfScale: 1.2,
  isPlacingMode: false,
  activeTool: "select",
  activeColor: "#1a1a2e",
  rightPanelTab: "properties",
  history: [[]],
  historyIndex: 0,

  user: getInitialUser(),
  billingHistory: getInitialBilling(),
  pdfHash: null,
  signedAt: null,

  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfBytes: (bytes) => set({ pdfBytes: bytes }),
  setTotalPages: (n) => set({ totalPages: n }),
  setCurrentPage: (n) => set({ currentPage: n }),
  setPdfScale: (scale) => set({ pdfScale: scale }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  undo: () =>
    set((s) => {
      if (s.historyIndex > 0) {
        const nextIndex = s.historyIndex - 1;
        return {
          historyIndex: nextIndex,
          annotations: s.history[nextIndex],
          selectedAnnotationId: null,
        };
      }
      return {};
    }),

  redo: () =>
    set((s) => {
      if (s.historyIndex < s.history.length - 1) {
        const nextIndex = s.historyIndex + 1;
        return {
          historyIndex: nextIndex,
          annotations: s.history[nextIndex],
          selectedAnnotationId: null,
        };
      }
      return {};
    }),

  addSavedSignature: (dataUrl) =>
    set((s) => ({
      savedSignatures: s.savedSignatures.includes(dataUrl)
        ? s.savedSignatures
        : [...s.savedSignatures, dataUrl],
      selectedSignatureUrl: dataUrl,
    })),

  removeSavedSignature: (dataUrl) =>
    set((s) => ({
      savedSignatures: s.savedSignatures.filter((u) => u !== dataUrl),
      selectedSignatureUrl:
        s.selectedSignatureUrl === dataUrl ? null : s.selectedSignatureUrl,
    })),

  setSelectedSignature: (dataUrl, type = "signature", textDetails = null) =>
    set({
      selectedSignatureUrl: dataUrl,
      selectedSignatureType: type,
      selectedTextDetails: textDetails,
    }),

  addAnnotation: (ann) =>
    set((s) => {
      const newAnn = { ...ann, id: nanoid() };
      const nextAnnotations = [...s.annotations, newAnn];
      const nextHistory = s.history.slice(0, s.historyIndex + 1);
      return {
        annotations: nextAnnotations,
        history: [...nextHistory, nextAnnotations],
        historyIndex: nextHistory.length,
        isPlacingMode: false,
      };
    }),

  updateAnnotation: (id, updates) =>
    set((s) => {
      const nextAnnotations = s.annotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      const nextHistory = s.history.slice(0, s.historyIndex + 1);
      return {
        annotations: nextAnnotations,
        history: [...nextHistory, nextAnnotations],
        historyIndex: nextHistory.length,
      };
    }),

  removeAnnotation: (id) =>
    set((s) => {
      const isSelected = s.selectedAnnotationId === id;
      const nextAnnotations = s.annotations.filter((a) => a.id !== id);
      const nextHistory = s.history.slice(0, s.historyIndex + 1);
      return {
        annotations: nextAnnotations,
        history: [...nextHistory, nextAnnotations],
        historyIndex: nextHistory.length,
        selectedAnnotationId: isSelected ? null : s.selectedAnnotationId,
      };
    }),

  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),

  setPlacingMode: (val) => set({ isPlacingMode: val }),

  reset: () =>
    set({
      pdfFile: null,
      pdfBytes: null,
      totalPages: 0,
      currentPage: 0,
      annotations: [],
      history: [[]],
      historyIndex: 0,
      selectedAnnotationId: null,
      selectedSignatureType: null,
      selectedTextDetails: null,
      isPlacingMode: false,
      pdfScale: 1.2,
      activeTool: "select",
      activeColor: "#1a1a2e",
      rightPanelTab: "properties",
      pdfHash: null,
      signedAt: null,
    }),

  login: (name, email, provider) => {
    const newUser: UserState = {
      name,
      email,
      plan: "free",
      loggedIn: true,
      provider,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("signease_user", JSON.stringify(newUser));
    }
    set({ user: newUser });
  },

  logout: () => {
    const guestUser: UserState = {
      name: "Guest",
      email: "",
      plan: "free",
      loggedIn: false,
      provider: null,
    };
    if (typeof window !== "undefined") {
      localStorage.removeItem("signease_user");
    }
    set({ user: guestUser });
  },

  setPlan: (plan) => {
    set((s) => {
      const newUser = { ...s.user, plan };
      if (typeof window !== "undefined") {
        localStorage.setItem("signease_user", JSON.stringify(newUser));
      }
      return { user: newUser };
    });
  },

  addBillingRecord: (amount, method, status = "Paid") => {
    set((s) => {
      const newRecord: BillingRecord = {
        id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        amount,
        method,
        status,
      };
      const updatedHistory = [newRecord, ...s.billingHistory];
      if (typeof window !== "undefined") {
        localStorage.setItem("signease_billing", JSON.stringify(updatedHistory));
      }
      return { billingHistory: updatedHistory };
    });
  },

  setPdfHash: (hash) => set({ pdfHash: hash }),

  downloadSignedPdf: async () => {
    const { pdfBytes, annotations, pdfFile, user } = useESignStore.getState();
    if (!pdfBytes) return null;

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // 1. Embed Signatures/Annotations
    for (const ann of annotations) {
      const page = pages[ann.pageIndex];
      if (!page) continue;

      const { width: pW, height: pH } = page.getSize();
      const base64 = ann.imageDataUrl.split(",")[1];
      const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const img = await pdfDoc.embedPng(imgBytes);

      const x = ann.xRatio * pW;
      const h = ann.heightRatio * pH;
      const y = pH - ann.yRatio * pH - h;
      const w = ann.widthRatio * pW;

      page.drawImage(img, { x, y, width: w, height: h });
    }

    // 2. Add Watermark if Free tier user
    if (user.plan === "free") {
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      for (const page of pages) {
        const { width, height } = page.getSize();

        // Diagonal Watermark text
        const watermarkText = "Signed with SignEase Free — signease.app";
        const fontSize = 26;
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        // Center coordinates
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(watermarkText, {
          x,
          y: y + 50, // slightly offset up
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.18,
          rotate: degrees(30),
        });

        // Bottom Footer Watermark
        const footerText = "Get watermark-free downloads at signease.app/pricing";
        const footerFontSize = 9;
        const footerWidth = helveticaFont.widthOfTextAtSize(footerText, footerFontSize);
        const footerX = (width - footerWidth) / 2;
        const footerY = 20;

        page.drawText(footerText, {
          x: footerX,
          y: footerY,
          size: footerFontSize,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.7,
        });
      }
    }

    // 3. Save modified PDF bytes
    const finalBytes = await pdfDoc.save();

    // 4. Calculate SHA-256 digest
    const hashBuffer = await crypto.subtle.digest("SHA-256", finalBytes.buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const timestamp = new Date().toISOString();
    set({ pdfHash: hashHex, signedAt: timestamp });

    // 5. Trigger download
    const blob = new Blob([finalBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFile ? `signed_${pdfFile.name}` : "signed_document.pdf";
    a.click();
    URL.revokeObjectURL(url);

    return { hash: hashHex, bytes: finalBytes };
  },
}));
