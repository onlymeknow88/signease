"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { SignatureAnnotation, DigitalCertificate } from "./types";
import { nanoid } from "nanoid";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import {
  signPDFWithCertificate,
  saveP12ToLocalStorage,
  loadP12FromLocalStorage,
  removeP12FromLocalStorage,
  validateP12Password,
  saveP12PasswordToLocalStorage,
  loadP12PasswordFromLocalStorage,
} from "./crypto";

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

export interface SavedSignatureRecord {
  id: number;
  name: string | null;
  dataUrl: string;
  createdAt: string;
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

  // Signature library (persisted to DB)
  savedSignatures: SavedSignatureRecord[];
  isSignatureLoading: boolean;
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

  // Pending certificate — set when user applies signature, used at download
  pendingCertId: number | null;
  pendingCertPassword: string | null;
  setPendingCert: (id: number | null, password: string | null) => void;

  // Annotations placed on the PDF
  annotations: SignatureAnnotation[];
  selectedAnnotationId: string | null;

  // History stack for Undo/Redo
  history: SignatureAnnotation[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;

  // UI state
  isPlacingMode: boolean;
  pdfScale: number;
  activeTool: "select" | "text" | "cross" | "check" | "circle" | "line" | "dot" | "signature" | "initial" | "date" | "box" | "checkbox";
  activeColor: string;
  rightPanelTab: "properties" | "certificate";

  // Sidebar & thumbnail panel state
  sidebarCollapsed: boolean;
  thumbnailPanelOpen: boolean;
  viewMode: "single" | "grid";

  // User/Auth/Subscription State
  user: UserState;
  billingHistory: BillingRecord[];

  // Digital certificate (PKI)
  pdfHash: string | null;
  signedAt: string | null;
  certificates: DigitalCertificate[];
  selectedCertificateId: number | null;
  isCertificateLoading: boolean;
  certificateUsedId: number | null;

  // Actions
  setPdfFile: (file: File | null) => void;
  setPdfBytes: (bytes: Uint8Array | null) => void;
  setTotalPages: (n: number) => void;
  setCurrentPage: (n: number) => void;
  setPdfScale: (scale: number) => void;
  setActiveTool: (tool: "select" | "text" | "cross" | "check" | "circle" | "line" | "dot" | "signature" | "initial" | "date" | "box" | "checkbox") => void;
  setActiveColor: (color: string) => void;
  setRightPanelTab: (tab: "properties" | "certificate") => void;
  setSidebarCollapsed: (val: boolean) => void;
  setThumbnailPanelOpen: (val: boolean) => void;
  setViewMode: (mode: "single" | "grid") => void;

  // Signature library actions (DB-backed)
  loadSavedSignatures: () => Promise<void>;
  addSavedSignature: (dataUrl: string, name?: string) => Promise<void>;
  removeSavedSignature: (id: number) => Promise<void>;

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
  login: (name: string, email: string, provider: "google" | "email", plan?: "free" | "pro") => void;
  logout: () => void;
  setPlan: (plan: "free" | "pro") => void;
  addBillingRecord: (amount: number, method: string, status?: "Paid" | "Failed") => void;
  setBillingHistory: (history: BillingRecord[]) => void;
  setPdfHash: (hash: string | null) => void;

  // Certificate actions
  loadCertificates: () => Promise<void>;
  addCertificate: (cert: DigitalCertificate, p12Base64: string, password?: string) => void;
  removeCertificate: (id: number) => Promise<void>;
  selectCertificate: (id: number | null) => void;
  validateCertificatePassword: (id: number, password: string) => boolean;

  // Main signing execution — uses pendingCertPassword from store
  downloadSignedPdf: () => Promise<{ hash: string; bytes: Uint8Array } | null>;

  // Logo watermark
  logoWatermarkEnabled: boolean;
  logoDataUrl: string | null;
  setLogoWatermarkEnabled: (enabled: boolean) => void;
  loadLogo: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helper: pre-rotate a PNG data URL by angleDeg (clockwise) on a canvas.
// Baking rotation into pixels avoids pdf-lib anchor-point rotation issues.
// ---------------------------------------------------------------------------
async function rotateImageDataUrl(dataUrl: string, angleDeg: number): Promise<string> {
  const normalized = ((angleDeg % 360) + 360) % 360;
  if (normalized === 0) return dataUrl;

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image for rotation"));
  });

  const swap = normalized === 90 || normalized === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? img.height : img.width;
  canvas.height = swap ? img.width : img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL("image/png");
}

export const useESignStore = create<ESignStore>((set, get) => ({
  pdfFile: null,
  pdfBytes: null,
  totalPages: 0,
  currentPage: 0,
  savedSignatures: [],
  isSignatureLoading: false,
  selectedSignatureUrl: null,
  selectedSignatureType: "signature",
  selectedTextDetails: null,
  pendingCertId: null,
  pendingCertPassword: null,
  annotations: [],
  selectedAnnotationId: null,
  pdfScale: 1.2,
  isPlacingMode: false,
  activeTool: "select",
  activeColor: "#1a1a2e",
  rightPanelTab: "properties",
  sidebarCollapsed: false,
  thumbnailPanelOpen: true,
  viewMode: "single",
  history: [[]],
  historyIndex: 0,

  user: getInitialUser(),
  billingHistory: getInitialBilling(),
  pdfHash: null,
  signedAt: null,
  certificates: [],
  selectedCertificateId: null,
  isCertificateLoading: false,
  certificateUsedId: null,

  // Logo watermark
  logoWatermarkEnabled: false,
  logoDataUrl: null,

  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfBytes: (bytes) => set({ pdfBytes: bytes }),
  setTotalPages: (n) => set({ totalPages: n }),
  setCurrentPage: (n) => set({ currentPage: n }),
  setPdfScale: (scale) => set({ pdfScale: scale }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  setThumbnailPanelOpen: (val) => set({ thumbnailPanelOpen: val }),
  setViewMode: (mode) => set({ viewMode: mode }),

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

  setPendingCert: (id, password) => set({ pendingCertId: id, pendingCertPassword: password }),

  // Signature library — DB-backed
  loadSavedSignatures: async () => {
    set({ isSignatureLoading: true });
    try {
      const res = await apiFetch("/api/signatures");
      if (!res.ok) return;
      const data: SavedSignatureRecord[] = await res.json();
      set({ savedSignatures: data });
    } catch {
      // silently ignore
    } finally {
      set({ isSignatureLoading: false });
    }
  },

  addSavedSignature: async (dataUrl, name) => {
    try {
      const res = await apiFetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, name: name ?? null }),
      });
      if (!res.ok) return;
      const record: SavedSignatureRecord = await res.json();
      set((s) => ({
        savedSignatures: [record, ...s.savedSignatures],
        selectedSignatureUrl: dataUrl,
        selectedSignatureType: "signature",
      }));
    } catch {
      // silently ignore — still set selectedSignatureUrl so placing works
      set({
        selectedSignatureUrl: dataUrl,
        selectedSignatureType: "signature",
      });
    }
  },

  removeSavedSignature: async (id) => {
    try {
      const res = await fetch(`/api/signatures?id=${id}`, { method: "DELETE" });
      if (!res.ok) return;
      set((s) => ({
        savedSignatures: s.savedSignatures.filter((sig) => sig.id !== id),
        selectedSignatureUrl:
          s.savedSignatures.find((sig) => sig.id === id)?.dataUrl === s.selectedSignatureUrl
            ? null
            : s.selectedSignatureUrl,
      }));
    } catch {
      // silently ignore
    }
  },

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

  login: (name, email, provider, plan = "free") => {
    const newUser: UserState = {
      name,
      email,
      plan,
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

  setBillingHistory: (history) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("signease_billing", JSON.stringify(history));
    }
    set({ billingHistory: history });
  },

  setPdfHash: (hash) => set({ pdfHash: hash }),

  // Certificate actions
  loadCertificates: async () => {
    set({ isCertificateLoading: true });
    try {
      const res = await apiFetch("/api/certificates");
      if (!res.ok) return;
      const data = await res.json();
      const certs: DigitalCertificate[] = data.map(
        (c: DigitalCertificate & { validFrom: string; validTo: string }) => ({
          ...c,
          validFrom: new Date(c.validFrom),
          validTo: new Date(c.validTo),
        })
      );
      set({ certificates: certs });
    } catch {
      // silently ignore — user may not be logged in yet
    } finally {
      set({ isCertificateLoading: false });
    }
  },

  addCertificate: (cert, p12Base64, password) => {
    saveP12ToLocalStorage(cert.localStorageKey, p12Base64);
    if (password) {
      saveP12PasswordToLocalStorage(cert.localStorageKey, password);
    }
    set((s) => ({
      certificates: [cert, ...s.certificates],
      selectedCertificateId: cert.id,
      pendingCertId: cert.id,
      pendingCertPassword: password ?? s.pendingCertPassword,
    }));
  },

  removeCertificate: async (id) => {
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      const { localStorageKey } = await res.json();
      removeP12FromLocalStorage(localStorageKey);
      set((s) => ({
        certificates: s.certificates.filter((c) => c.id !== id),
        selectedCertificateId:
          s.selectedCertificateId === id ? null : s.selectedCertificateId,
        certificateUsedId:
          s.certificateUsedId === id ? null : s.certificateUsedId,
      }));
    } catch {
      // ignore
    }
  },

  selectCertificate: (id) => set({ selectedCertificateId: id }),

  validateCertificatePassword: (id, password) => {
    const { certificates } = useESignStore.getState();
    const cert = certificates.find((c) => c.id === id);
    if (!cert) return false;
    const p12 = loadP12FromLocalStorage(cert.localStorageKey);
    if (!p12) return false;
    const valid = validateP12Password(p12, password);
    if (valid) {
      saveP12PasswordToLocalStorage(cert.localStorageKey, password);
      set({ selectedCertificateId: id, pendingCertId: id, pendingCertPassword: password });
    }
    return valid;
  },

  downloadSignedPdf: async () => {
    const { pdfBytes, annotations, pdfFile, user, selectedCertificateId, pendingCertId, pendingCertPassword, certificates } =
      useESignStore.getState();
    if (!pdfBytes) return null;

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // 1. Embed Signatures/Annotations
    for (const ann of annotations) {
      const page = pages[ann.pageIndex];
      if (!page) continue;

      const { width: pW, height: pH } = page.getSize();
      const rotation = page.getRotation().angle; // 0 | 90 | 180 | 270

      // Pre-rotate image pixels by the counter-rotation so they appear upright
      // on the rotated page. This avoids pdf-lib anchor-point rotation issues
      // (rotating around a corner instead of the box center, which shifts the
      // bounding box in a quadrant-dependent way).
      const counterAngle = (360 - rotation) % 360;
      const rotatedDataUrl = await rotateImageDataUrl(ann.imageDataUrl, counterAngle);

      const base64 = rotatedDataUrl.split(",")[1];
      const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const img = await pdfDoc.embedPng(imgBytes);

      // Box geometry: maps the on-screen (rotated viewport) annotation box
      // into pdf-lib's unrotated page coordinate space, using the same
      // rotation matrix pdf.js applies internally (verified per-case, not
      // ad-hoc). pdf-lib's drawImage x/y is the BOTTOM-LEFT corner, origin
      // bottom-left, y-up.
      //
      // IMPORTANT for 90°/270°: width and height are SWAPPED relative to
      // the ratios' natural pairing (widthRatio -> h, heightRatio -> w).
      // This is because the pre-rotated bitmap's own pixel dimensions are
      // swapped too (any 90°/270° rotation swaps W/H) — using widthRatio
      // directly for the draw width squeezes the image into the wrong
      // aspect ratio, which was causing the "lebar" (width) glitch.
      let x: number, y: number, w: number, h: number;

      switch (rotation) {
        case 90:
          w = ann.heightRatio * pW;
          h = ann.widthRatio * pH;
          x = ann.yRatio * pW;
          y = ann.xRatio * pH;
          break;
        case 180:
          w = ann.widthRatio * pW;
          h = ann.heightRatio * pH;
          x = pW - ann.xRatio * pW - w;
          y = ann.yRatio * pH;
          break;
        case 270:
          w = ann.heightRatio * pW;
          h = ann.widthRatio * pH;
          x = pW - ann.yRatio * pW - w;
          y = pH - ann.xRatio * pH - h;
          break;
        default: // rotation === 0
          w = ann.widthRatio * pW;
          h = ann.heightRatio * pH;
          x = ann.xRatio * pW;
          y = pH - ann.yRatio * pH - h;
      }

      page.drawImage(img, {
        x,
        y,
        width: w,
        height: h,
        rotate: degrees(0),
      });
    }

    // 2. Add Watermark if Free tier user
    if (user.plan === "free") {
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      for (const page of pages) {
        const { width, height } = page.getSize();

        const watermarkText = "Signed with PDFinaja Free — signease.app";
        const fontSize = 26;
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(watermarkText, {
          x, y: y + 50,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.18,
          rotate: degrees(30),
        });

        const footerText = "Get watermark-free downloads at signease.app/pricing";
        const footerFontSize = 9;
        const footerWidth = helveticaFont.widthOfTextAtSize(footerText, footerFontSize);

        page.drawText(footerText, {
          x: (width - footerWidth) / 2,
          y: 20,
          size: footerFontSize,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.7,
        });
      }
    }

    // 3. Save modified PDF bytes (visual annotations baked in)
    const annotatedBytes = await pdfDoc.save();

    // 4. Optionally apply PKCS#7 digital signature
    let outputBytes: Uint8Array = annotatedBytes;
    let certUsedId: number | null = null;

    const activeCerts = certificates.filter((c) => {
      const t = c.validTo instanceof Date ? c.validTo.getTime() : new Date(c.validTo).getTime();
      return !isNaN(t) && t > Date.now();
    });

    const certId = pendingCertId ?? selectedCertificateId ?? activeCerts[0]?.id ?? null;
    let certPassword = pendingCertPassword;

    if (certId !== null) {
      const cert = certificates.find((c) => c.id === certId);
      if (cert) {
        if (!certPassword) {
          certPassword = loadP12PasswordFromLocalStorage(cert.localStorageKey);
        }
        const p12Base64 = loadP12FromLocalStorage(cert.localStorageKey);
        if (p12Base64 && certPassword) {
          const result = await signPDFWithCertificate(annotatedBytes, p12Base64, certPassword);
          if (result.success && result.signedPdfBytes) {
            outputBytes = result.signedPdfBytes;
            certUsedId = certId;
          }
        }
      }
    }

    // 5. Calculate SHA-256 digest of the final bytes
    const hashBuffer = await crypto.subtle.digest("SHA-256", outputBytes.buffer as ArrayBuffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const timestamp = new Date().toISOString();
    set({ pdfHash: hashHex, signedAt: timestamp, certificateUsedId: certUsedId });

    // 6. Trigger download
    const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFile ? `signed_${pdfFile.name}` : "signed_document.pdf";
    a.click();
    URL.revokeObjectURL(url);

    return { hash: hashHex, bytes: outputBytes };
  },

  setLogoWatermarkEnabled: (enabled) => set({ logoWatermarkEnabled: enabled }),

  loadLogo: async () => {
    try {
      const { imageToDataUrl } = await import("./utils");
      const dataUrl = await imageToDataUrl("/logo.png");
      set({ logoDataUrl: dataUrl });
    } catch (error) {
      console.error("Failed to load logo:", error);
    }
  },
}));