"use client";

import { useState, useRef, useEffect } from "react";
import { useESignStore } from "@/lib/store";
import { generateTextImage } from "@/lib/utils";
import { MousePointer2, Type, PenLine, Fingerprint, Calendar, Square, CheckSquare, MoreHorizontal } from "lucide-react";

interface ToolbarProps {
  onOpenSignaturePad: () => void;
}

// ── ToolTab pill component ────────────────────────────────────────────────────
function ToolTab({
  icon: Icon,
  label,
  isActive,
  onClick,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${label} (Segera Hadir)` : label}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-150 active:scale-95 whitespace-nowrap
        ${isActive
          ? "bg-primary text-on-primary shadow-sm"
          : "text-on-surface-variant hover:bg-slate-100 hover:text-on-surface"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
export function Toolbar({ onOpenSignaturePad }: ToolbarProps) {
  const {
    savedSignatures,
    selectedSignatureUrl,
    selectedSignatureType,
    selectedTextDetails,
    isPlacingMode,
    user,
    setSelectedSignature,
    removeSavedSignature,
    setPlacingMode,
    reset,
    setPdfFile,
    setPdfBytes,
    setRightPanelTab,
  } = useESignStore();

  const [activeMenu, setActiveMenu] = useState<"signature" | "text" | "cert" | null>("signature");
  const [openPopup, setOpenPopup] = useState<"signature" | "text" | "cert" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenPopup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Hanya file PDF yang didukung.");
        return;
      }
      reset();
      setPdfFile(file);
      const buffer = await file.arrayBuffer();
      setPdfBytes(new Uint8Array(buffer));
    }
    e.target.value = "";
  };

  const handleSignatureClick = () => {
    setActiveMenu("signature");
    setRightPanelTab("properties");
    setOpenPopup(openPopup === "signature" ? null : "signature");
    if (savedSignatures.length > 0) {
      setSelectedSignature(savedSignatures[0].dataUrl, "signature");
      setPlacingMode(true);
    }
  };

  const handleTextClick = () => {
    setActiveMenu("text");
    setRightPanelTab("properties");

    // Use empty string as default — user will type directly on canvas (Adobe-style)
    const details = {
      text: "",
      color: "#004782",
      size: 24,
      fontFamily: "Poppins",
      isBold: false,
      isItalic: false,
      isUnderline: false,
    };

    // Generate a transparent placeholder image (1x1 transparent PNG)
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 200, 40);
    }
    const placeholderUrl = canvas.toDataURL("image/png");

    setSelectedSignature(placeholderUrl, "text", details);
    setPlacingMode(true);
  };

  const handleCertClick = () => {
    setActiveMenu("cert");
    setRightPanelTab("certificate");
    setPlacingMode(false);
    setOpenPopup(openPopup === "cert" ? null : "cert");
  };

  // Shared icon button style
  const iconBtn = (isActive: boolean) =>
    `relative flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95 group cursor-pointer ${
      isActive
        ? `bg-primary text-white shadow-md`
        : `text-on-surface-variant hover:bg-slate-100 hover:text-on-surface`
    }`;

  return (
    <div ref={toolbarRef} className="relative overflow-visible">
      {/* Hidden PDF file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Horizontal Icon Toolbar */}
      <div className="flex items-center gap-1 h-full">

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/60 mx-1" />

        {/* Upload PDF */}
        <div className="relative overflow-visible">
          <button
            onClick={handleUploadClick}
            className={iconBtn(false)}
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span className="pointer-events-none absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] shadow-lg">
              Upload PDF
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
            </span>
          </button>
        </div>

        {/* Pilih (Select) */}
        <ToolTab
          icon={MousePointer2}
          label="Pilih"
          isActive={!isPlacingMode && activeMenu === null}
          onClick={() => {
            setPlacingMode(false);
            setSelectedSignature(null, undefined, null);
            setActiveMenu(null);
          }}
        />

        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
        <ToolTab
          icon={Type}
          label="Teks"
          isActive={activeMenu === "text" && isPlacingMode}
          onClick={handleTextClick}
        />

        {/* Tanda Tangan */}
        <div className="relative overflow-visible">
          <ToolTab
            icon={PenLine}
            label="Tanda Tangan"
            isActive={activeMenu === "signature" && isPlacingMode}
            onClick={handleSignatureClick}
          />

          {/* Signature Popup */}
          {openPopup === "signature" && (
            <div className="absolute top-full mt-2 left-0 w-56 bg-white border border-outline-variant rounded-xl shadow-xl z-50 p-3 space-y-2 animate-in slide-in-from-top-1 duration-150">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider px-1 mb-1">Tanda Tangan</p>
              <button
                onClick={() => { onOpenSignaturePad(); setOpenPopup(null); }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-outline-variant hover:border-primary/50 hover:bg-primary/5 rounded-lg text-xs font-semibold text-on-surface transition-all bg-surface"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Buat Baru
              </button>

              {savedSignatures.length > 0 && (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                  {savedSignatures.map((sig) => (
                    <div
                      key={sig.id}
                      className={`relative group/sig flex items-center justify-between gap-2 p-2 rounded-lg border cursor-pointer transition-all bg-surface ${
                        selectedSignatureUrl === sig.dataUrl && selectedSignatureType === "signature" && isPlacingMode
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant hover:border-primary/45"
                      }`}
                      onClick={() => {
                        setSelectedSignature(sig.dataUrl, "signature");
                        setPlacingMode(true);
                        setOpenPopup(null);
                      }}
                    >
                      <img
                        src={sig.dataUrl}
                        alt={sig.name || "Tanda Tangan"}
                        className="h-8 w-auto max-w-[120px] object-contain shrink-0"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        {selectedSignatureUrl === sig.dataUrl && selectedSignatureType === "signature" && isPlacingMode && (
                          <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                        <button
                          type="button"
                          title="Hapus tanda tangan"
                          className="p-1 rounded-md text-outline hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedSignature(sig.id);
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inisial */}
        <ToolTab icon={Fingerprint} label="Inisial"   isActive={false} onClick={() => {}} disabled />
        {/* Tanggal */}
        <ToolTab icon={Calendar}    label="Tanggal"   isActive={false} onClick={() => {}} disabled />
        {/* Kotak */}
        <ToolTab icon={Square}      label="Kotak"     isActive={false} onClick={() => {}} disabled />
        {/* Checklist */}
        <ToolTab icon={CheckSquare} label="Checklist" isActive={false} onClick={() => {}} disabled />

        <div className="w-px h-5 bg-outline-variant/50 mx-1" />

        {/* Sertifikat */}
        <div className="relative overflow-visible">
          <ToolTab
            icon={({ className }: { className?: string }) => (
              <span
                className="material-symbols-outlined text-[16px] leading-none"
                style={{ fontVariationSettings: activeMenu === "cert" ? "'FILL' 1" : "'FILL' 0" }}
              >
                verified_user
              </span>
            )}
            label="Sertifikat"
            isActive={activeMenu === "cert"}
            onClick={handleCertClick}
          />

          {/* Cert Popup */}
          {openPopup === "cert" && (
            <div className="absolute top-full mt-2 left-0 w-60 bg-white border border-outline-variant rounded-xl shadow-xl z-50 p-3 space-y-3 animate-in slide-in-from-top-1 duration-150 text-xs">
              <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/60">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                  <div>
                    <h4 className="font-bold text-on-surface text-xs">Sertifikat Valid</h4>
                    <p className="text-[10px] text-outline font-semibold">Tanda Tangan Terkunci</p>
                  </div>
                </div>
                <div className="space-y-2 text-[10px] leading-tight">
                  <div className="flex justify-between">
                    <span className="text-outline">Pemilik:</span>
                    <span className="font-semibold text-on-surface text-right">{user.name || "Ahmad Sulaiman"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Penerbit:</span>
                    <span className="font-semibold text-on-surface text-right">PDFinaja CA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Serial:</span>
                    <span className="font-mono text-on-surface text-right">SF-{user.plan === "pro" ? "PRO" : "FREE"}-2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Algoritma:</span>
                    <span className="font-semibold text-on-surface text-right">SHA256withRSA</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
      </div>
    </div>
  );
}
