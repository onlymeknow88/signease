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
    annotations,
    selectedAnnotationId,
    updateAnnotation,
    removeAnnotation,
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

  const selectedAnnotation = annotations.find(
    (a) => a.id === selectedAnnotationId
  );

  const [activeMenu, setActiveMenu] = useState<"signature" | "text" | "cert" | null>("signature");
  const [openPopup, setOpenPopup] = useState<"signature" | "text" | "cert" | "bgColor" | null>(null);

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

    // Use default text details
    const details = {
      text: "Ketik teks di sini...",
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

  // Helper text styling updates on selected element
  const updateSelectedStyle = (updates: Partial<typeof selectedTextDetails> | null) => {
    if (!updates) return;
    if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
    const text = selectedAnnotation.text || "";
    const size = updates.size !== undefined ? updates.size : (selectedAnnotation.textSize || 24);
    const color = updates.color !== undefined ? updates.color : (selectedAnnotation.textColor || "#004782");
    const fontFamily = updates.fontFamily !== undefined ? updates.fontFamily : (selectedAnnotation.fontFamily || "Poppins");
    const isBold = updates.isBold !== undefined ? updates.isBold : (selectedAnnotation.isBold !== false);
    const isItalic = updates.isItalic !== undefined ? updates.isItalic : (selectedAnnotation.isItalic || false);
    const isUnderline = updates.isUnderline !== undefined ? updates.isUnderline : (selectedAnnotation.isUnderline || false);
    const bgColor = updates.bgColor !== undefined ? updates.bgColor : (selectedAnnotation.bgColor || "transparent");
    const opacity = updates.opacity !== undefined ? updates.opacity : (selectedAnnotation.opacity !== undefined ? selectedAnnotation.opacity : 1);
    const textAlign = updates.textAlign !== undefined ? updates.textAlign : (selectedAnnotation.textAlign || "left");

    const { dataUrl, aspectRatio } = generateTextImage(
      text,
      size,
      color,
      fontFamily,
      isBold,
      isItalic,
      isUnderline,
      bgColor,
      opacity,
      textAlign
    );
    const newHeightRatio = selectedAnnotation.widthRatio * aspectRatio;

    updateAnnotation(selectedAnnotation.id, {
      textSize: size,
      textColor: color,
      fontFamily,
      isBold,
      isItalic,
      isUnderline,
      bgColor,
      opacity,
      textAlign,
      imageDataUrl: dataUrl,
      heightRatio: newHeightRatio,
    });
  };

  // Shared icon button style
  const iconBtn = (isActive: boolean) =>
    `relative flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-95 group cursor-pointer ${
      isActive
        ? `bg-primary/10 text-primary border border-primary/20`
        : `text-on-surface-variant hover:bg-slate-100 hover:text-on-surface`
    }`;

  const textActionBtn = (isActive: boolean, disabled: boolean) =>
    `flex items-center justify-center w-8 h-8 rounded transition-all cursor-pointer ${
      disabled ? "opacity-30 cursor-not-allowed" : ""
    } ${
      isActive
        ? "bg-primary/25 text-primary border border-primary/30"
        : "text-on-surface hover:bg-slate-100"
    }`;

  return (
    <div ref={toolbarRef} className="w-full flex flex-col items-center gap-2 py-2.5">
      {/* Hidden PDF file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Row 1: Primary Toolbar Tools (Left-aligned or Centered) */}
      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          {/* Upload PDF */}
          <button onClick={handleUploadClick} className={iconBtn(false)} title="Upload PDF">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
          </button>

          <div className="w-px h-6 bg-outline-variant/60 mx-1" />

          {/* Pilih (Select) */}
          <button
            onClick={() => {
              setPlacingMode(false);
              setSelectedSignature(null, undefined, null);
              setActiveMenu(null);
            }}
            className={iconBtn(!isPlacingMode && activeMenu === null)}
            title="Pilih Elemen"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          {/* Teks */}
          <button
            onClick={handleTextClick}
            className={iconBtn(activeMenu === "text" && isPlacingMode)}
            title="Tambah Teks"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Tanda Tangan */}
          <div className="relative overflow-visible">
            <button
              onClick={handleSignatureClick}
              className={iconBtn(activeMenu === "signature" && isPlacingMode)}
              title="Tambah Tanda Tangan"
            >
              <PenLine className="w-4 h-4" />
            </button>

            {/* Signature Popup */}
            {openPopup === "signature" && (
              <div className="absolute top-full mt-2 left-0 w-56 bg-white border border-outline-variant rounded-xl shadow-xl z-50 p-3 space-y-2 animate-in slide-in-from-top-1 duration-150">
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider px-1 mb-1">Tanda Tangan</p>
                <button
                  onClick={() => { onOpenSignaturePad(); setOpenPopup(null); }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-outline-variant hover:border-primary/50 hover:bg-primary/5 rounded-lg text-xs font-semibold text-on-surface transition-all bg-surface cursor-pointer"
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

          {/* Certificate */}
          <div className="relative overflow-visible">
            <button
              onClick={handleCertClick}
              className={iconBtn(activeMenu === "cert")}
              title="Sertifikat & Tanda Tangan Digital CA"
            >
              <span className="material-symbols-outlined text-[18px] leading-none" style={{ fontVariationSettings: activeMenu === "cert" ? "'FILL' 1" : "'FILL' 0" }}>
                verified_user
              </span>
            </button>

            {/* Cert Popup */}
            {openPopup === "cert" && (
              <div className="absolute top-full mt-2 left-0 w-60 bg-white border border-outline-variant rounded-xl shadow-xl z-50 p-3 space-y-3 animate-in slide-in-from-top-1 duration-150 text-xs">
                <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/60">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified_user
                    </span>
                    <div>
                      <h4 className="font-bold text-on-surface text-xs">Sertifikat CA</h4>
                      <p className="text-[10px] text-outline font-semibold">Tanda Tangan Kriptografi</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[10px] leading-tight">
                    <div className="flex justify-between">
                      <span className="text-outline">Pemilik:</span>
                      <span className="font-semibold text-on-surface text-right truncate max-w-[120px]">{user.name || "Tamu"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Penerbit:</span>
                      <span className="font-semibold text-on-surface text-right">PDFinaja CA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Serial:</span>
                      <span className="font-mono text-on-surface text-right">SF-{user.plan === "pro" ? "PRO" : "FREE"}-2026</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Rich Text Formatting / Annotation Context Tools (Centered underneath Row 1) */}
      {selectedAnnotation && selectedAnnotation.type === "text" ? (
        <div className="w-full flex justify-center px-2 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 bg-slate-50 border border-outline-variant/75 px-3 py-1 rounded-xl shadow-sm min-h-[42px] max-w-max">
            {/* Font Family Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-outline uppercase tracking-wider">T</span>
              <select
                value={selectedAnnotation.fontFamily || "Poppins"}
                onChange={(e) => updateSelectedStyle({ fontFamily: e.target.value })}
                className="px-2 py-1 border border-outline-variant rounded-md text-xs font-semibold bg-white outline-none cursor-pointer max-w-[120px]"
              >
                <option value="Poppins">Poppins</option>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
              </select>
            </div>

            <div className="w-px h-5 bg-outline-variant/60 mx-1" />

            {/* Font Size Input */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Size</span>
              <select
                value={selectedAnnotation.textSize || 24}
                onChange={(e) => updateSelectedStyle({ size: parseInt(e.target.value, 10) })}
                className="px-2 py-1 border border-outline-variant rounded-md text-xs font-semibold bg-white outline-none cursor-pointer"
              >
                {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64].map((size) => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>

            <div className="w-px h-5 bg-outline-variant/60 mx-1" />

            {/* Format B, I, U Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => updateSelectedStyle({ isBold: !(selectedAnnotation.isBold !== false) })}
                className={textActionBtn(selectedAnnotation.isBold !== false, false)}
                title="Tebal (Bold)"
              >
                <strong className="text-sm font-black font-serif">B</strong>
              </button>
              
              <button
                onClick={() => updateSelectedStyle({ isItalic: !selectedAnnotation.isItalic })}
                className={textActionBtn(!!selectedAnnotation.isItalic, false)}
                title="Miring (Italic)"
              >
                <em className="text-sm font-bold font-serif">I</em>
              </button>
              
              <button
                onClick={() => updateSelectedStyle({ isUnderline: !selectedAnnotation.isUnderline })}
                className={textActionBtn(!!selectedAnnotation.isUnderline, false)}
                title="Garis Bawah (Underline)"
              >
                <span className="text-sm underline font-serif">U</span>
              </button>
            </div>

            <div className="w-px h-5 bg-outline-variant/60 mx-1" />

            {/* Color picker dropdown (Popup with Swatches) */}
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => setOpenPopup(openPopup === "text" ? null : "text")}
                className={`flex items-center gap-1 px-2 py-1 border border-outline-variant rounded-md text-xs font-semibold bg-white transition-all cursor-pointer ${
                  openPopup === "text" ? "border-primary bg-primary/5" : ""
                }`}
                title="Warna Teks"
              >
                <span className="material-symbols-outlined text-[16px]" style={{ color: selectedAnnotation.textColor || "#1a1a2e" }}>
                  format_color_text
                </span>
                <span className="text-[10px] text-outline">▼</span>
              </button>

              {openPopup === "text" && (
                <div className="absolute top-full mt-2 left-0 bg-white border border-outline-variant rounded-xl shadow-xl z-50 p-2.5 space-y-2 animate-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-6 gap-1.5 w-[140px]">
                    {[
                      "#1a1a2e", "#ffffff", "#000000",
                      "#ef4444", "#ec4899", "#a855f7", "#3b82f6", "#06b6d4", "#22c55e",
                      "#eab308", "#f97316", "#78350f", "#e2e8f0", "#a8a29e", "#44403c"
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          updateSelectedStyle({ color });
                          setOpenPopup(null);
                        }}
                        className={`w-4 h-4 rounded transition-transform active:scale-90 hover:scale-110 border ${
                          color === "#ffffff" ? "border-slate-300" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-outline-variant/60 mx-1" />

            {/* Background Color picker (Popup with Swatches) */}
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => setOpenPopup(openPopup === "bgColor" ? null : "bgColor")}
                className={`flex items-center gap-1 px-2 py-1 border border-outline-variant rounded-md text-xs font-semibold bg-white transition-all cursor-pointer ${
                  openPopup === "bgColor" ? "border-primary bg-primary/5" : ""
                }`}
                title="Warna Latar"
              >
                <span className="material-symbols-outlined text-[16px]">
                  format_color_fill
                </span>
                <span className="text-[10px] text-outline">▼</span>
              </button>

              {openPopup === "bgColor" && (
                <div className="absolute top-full mt-2 left-0 bg-white border border-outline-variant rounded-xl shadow-xl z-50 p-2.5 space-y-2 animate-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-6 gap-1.5 w-[140px]">
                    {/* Transparent Option (grid spans first item with checkers) */}
                    <button
                      onClick={() => {
                        updateSelectedStyle({ bgColor: "transparent" });
                        setOpenPopup(null);
                      }}
                      className="w-4 h-4 rounded border border-slate-300 bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 hover:scale-110 transition-transform"
                      title="Transparan"
                    >
                      ✕
                    </button>
                    {[
                      "#ffffff", "#000000",
                      "#ef4444", "#ec4899", "#a855f7", "#3b82f6", "#06b6d4", "#22c55e",
                      "#eab308", "#f97316", "#78350f", "#e2e8f0", "#a8a29e", "#44403c"
                    ].map((bgColor) => (
                      <button
                        key={bgColor}
                        onClick={() => {
                          updateSelectedStyle({ bgColor });
                          setOpenPopup(null);
                        }}
                        className={`w-4 h-4 rounded transition-transform active:scale-90 hover:scale-110 border ${
                          bgColor === "#ffffff" ? "border-slate-300" : "border-transparent"
                        }`}
                        style={{ backgroundColor: bgColor }}
                        title={bgColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-outline-variant/60 mx-1" />

            {/* Paragraph Alignment dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">format_align_left</span>
              <select
                value={selectedAnnotation.textAlign || "left"}
                onChange={(e) => updateSelectedStyle({ textAlign: e.target.value as any })}
                className="px-2 py-1 border border-outline-variant rounded-md text-xs font-semibold bg-white outline-none cursor-pointer"
                title="Perataan Paragraf"
              >
                <option value="left">Rata Kiri</option>
                <option value="center">Rata Tengah</option>
                <option value="right">Rata Kanan</option>
              </select>
            </div>

            <div className="w-px h-5 bg-outline-variant/60 mx-1" />

            {/* Opacity dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">opacity</span>
              <select
                value={selectedAnnotation.opacity !== undefined ? selectedAnnotation.opacity : 1}
                onChange={(e) => updateSelectedStyle({ opacity: parseFloat(e.target.value) })}
                className="px-2 py-1 border border-outline-variant rounded-md text-xs font-semibold bg-white outline-none cursor-pointer"
                title="Transparansi Opacity"
              >
                <option value="1">100%</option>
                <option value="0.85">85%</option>
                <option value="0.7">70%</option>
                <option value="0.5">50%</option>
                <option value="0.3">30%</option>
              </select>
            </div>

            <div className="w-px h-5 bg-outline-variant/60 mx-1" />

            {/* Delete button (Trash icon) */}
            <button
              onClick={() => removeAnnotation(selectedAnnotation.id)}
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer text-on-surface-variant"
              title="Hapus Bidang Terpilih"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      ) : selectedAnnotation ? (
        /* Delete button ONLY for non-text fields (signatures) when selected */
        <div className="w-full flex justify-center px-2 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 bg-slate-50 border border-outline-variant/75 px-3 py-1 rounded-xl shadow-sm min-h-[42px] max-w-max">
            <span className="text-xs font-bold text-outline">TANDA TANGAN</span>
            <div className="w-px h-4 bg-outline-variant/60 mx-1" />
            <button
              onClick={() => removeAnnotation(selectedAnnotation.id)}
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer text-on-surface-variant"
              title="Hapus Tanda Tangan"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
