"use client";

import { useState, useRef, useEffect } from "react";
import { useESignStore } from "@/lib/store";
import { generateTextImage } from "@/lib/utils";

interface ToolbarProps {
  onOpenSignaturePad: () => void;
}

export function Toolbar({ onOpenSignaturePad }: ToolbarProps) {
  const {
    pdfBytes,
    savedSignatures,
    selectedSignatureUrl,
    selectedSignatureType,
    selectedTextDetails,
    annotations,
    selectedAnnotationId,
    isPlacingMode,
    history,
    historyIndex,
    user,
    setSelectedSignature,
    removeSavedSignature,
    setPlacingMode,
    reset,
    setPdfFile,
    setPdfBytes,
    setRightPanelTab,
    updateAnnotation,
    setSelectedAnnotationId,
    undo,
    redo,
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

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId);
  const isEditingText = selectedAnnotation?.type === "text";
  const isPlacingText = isPlacingMode && selectedSignatureType === "text";
  const isTextModeActive = isEditingText || isPlacingText || activeMenu === "text";

  const updateTextProperty = (updates: {
    text?: string;
    fontFamily?: string;
    size?: number;
    color?: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
  }) => {
    const activeText = updates.text !== undefined ? updates.text : (selectedAnnotation ? selectedAnnotation.text || "" : (selectedTextDetails?.text || "Nama Terang"));
    const activeFontFamily = updates.fontFamily !== undefined ? updates.fontFamily : (selectedAnnotation ? selectedAnnotation.fontFamily || "Poppins" : (selectedTextDetails?.fontFamily || "Poppins"));
    const activeSize = updates.size !== undefined ? updates.size : (selectedAnnotation ? selectedAnnotation.textSize || 24 : (selectedTextDetails?.size || 24));
    const activeColor = updates.color !== undefined ? updates.color : (selectedAnnotation ? selectedAnnotation.textColor || "#004782" : (selectedTextDetails?.color || "#004782"));
    const activeBold = updates.isBold !== undefined ? updates.isBold : (selectedAnnotation ? selectedAnnotation.isBold === true : (selectedTextDetails?.isBold === true));
    const activeItalic = updates.isItalic !== undefined ? updates.isItalic : (selectedAnnotation ? selectedAnnotation.isItalic || false : (selectedTextDetails?.isItalic || false));
    const activeUnderline = updates.isUnderline !== undefined ? updates.isUnderline : (selectedAnnotation ? selectedAnnotation.isUnderline || false : (selectedTextDetails?.isUnderline || false));

    const { dataUrl, aspectRatio } = generateTextImage(
      activeText,
      activeSize,
      activeColor,
      activeFontFamily,
      activeBold,
      activeItalic,
      activeUnderline
    );

    if (selectedAnnotation) {
      const oldSize = selectedAnnotation.textSize || 24;
      const scaleMultiplier = activeSize / oldSize;
      const newWidthRatio = Math.min(1 - selectedAnnotation.xRatio, selectedAnnotation.widthRatio * scaleMultiplier);
      const newHeightRatio = newWidthRatio * aspectRatio;

      updateAnnotation(selectedAnnotation.id, {
        text: activeText,
        textSize: activeSize,
        textColor: activeColor,
        fontFamily: activeFontFamily,
        isBold: activeBold,
        isItalic: activeItalic,
        isUnderline: activeUnderline,
        imageDataUrl: dataUrl,
        widthRatio: newWidthRatio,
        heightRatio: newHeightRatio,
      });
    } else {
      const newDetails = {
        text: activeText,
        color: activeColor,
        size: activeSize,
        fontFamily: activeFontFamily,
        isBold: activeBold,
        isItalic: activeItalic,
        isUnderline: activeUnderline,
      };
      setSelectedSignature(dataUrl, "text", newDetails);
    }
  };

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
      setSelectedSignature(savedSignatures[0], "signature");
      setPlacingMode(true);
    }
  };

  const handleTextClick = () => {
    setActiveMenu("text");
    setRightPanelTab("properties");
    
    // Initialize default text details if not set
    const details = selectedTextDetails || {
      text: "Nama Terang",
      color: "#004782",
      size: 24,
      fontFamily: "Poppins",
      isBold: false,
      isItalic: false,
      isUnderline: false,
    };
    
    const { dataUrl } = generateTextImage(
      details.text,
      details.size,
      details.color,
      details.fontFamily,
      details.isBold,
      details.isItalic,
      details.isUnderline
    );
    
    setSelectedSignature(dataUrl, "text", details);
    setPlacingMode(true);
  };

  const handleFinishTextMode = () => {
    setActiveMenu(null);
    setPlacingMode(false);
    setSelectedSignature(null, undefined, null);
    setSelectedAnnotationId(null);
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

  // If in text annotation mode or editing a text, show the text formatting bar
  if (isTextModeActive) {
    const colorVal = selectedAnnotation ? selectedAnnotation.textColor || "#004782" : (selectedTextDetails?.color || "#004782");
    const sizeVal = selectedAnnotation ? selectedAnnotation.textSize || 24 : (selectedTextDetails?.size || 24);
    const fontFamilyVal = selectedAnnotation ? selectedAnnotation.fontFamily || "Poppins" : (selectedTextDetails?.fontFamily || "Poppins");
    const boldVal = selectedAnnotation ? selectedAnnotation.isBold === true : (selectedTextDetails?.isBold === true);
    const italicVal = selectedAnnotation ? selectedAnnotation.isItalic || false : (selectedTextDetails?.isItalic || false);
    const underlineVal = selectedAnnotation ? selectedAnnotation.isUnderline || false : (selectedTextDetails?.isUnderline || false);

    return (
      <div ref={toolbarRef} className="flex items-center gap-3 h-full select-none">
        {/* Undo / Redo controls */}
        <div className="flex items-center bg-slate-50 border border-outline-variant/60 rounded-lg p-1 shadow-sm gap-0.5">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded text-on-surface-variant flex items-center justify-center cursor-pointer transition-colors"
            title="Undo"
          >
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded text-on-surface-variant flex items-center justify-center cursor-pointer transition-colors"
            title="Redo"
          >
            <span className="material-symbols-outlined text-[18px]">redo</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-outline-variant/60"></div>

        {/* Font Family Dropdown */}
        <div className="relative">
          <select
            value={fontFamilyVal}
            onChange={(e) => updateTextProperty({ fontFamily: e.target.value })}
            className="bg-white pl-3 pr-8 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold hover:border-primary transition-colors focus:outline-none appearance-none cursor-pointer"
            style={{
              fontFamily: fontFamilyVal === "JetBrains Mono" ? "var(--font-mono)" : fontFamilyVal === "Inter" ? "var(--font-inter)" : "var(--font-sans)",
            }}
          >
            <option value="Poppins">Poppins</option>
            <option value="Inter">Inter</option>
            <option value="JetBrains Mono">JetBrains Mono</option>
          </select>
          <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
            expand_more
          </span>
        </div>

        {/* Font Size controls */}
        <div className="flex items-center bg-white rounded-lg border border-outline-variant px-1 shadow-sm">
          <button
            onClick={() => updateTextProperty({ size: Math.max(10, sizeVal - 2) })}
            className="p-1 text-on-surface-variant hover:text-primary hover:bg-slate-50 rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <input
            type="text"
            value={sizeVal}
            onChange={(e) => updateTextProperty({ size: parseInt(e.target.value) || 12 })}
            className="w-8 text-center bg-transparent border-none focus:ring-0 text-xs font-bold focus:outline-none p-0"
          />
          <button
            onClick={() => updateTextProperty({ size: Math.min(72, sizeVal + 2) })}
            className="p-1 text-on-surface-variant hover:text-primary hover:bg-slate-50 rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        </div>

        {/* Formatting toggle group */}
        <div className="flex items-center bg-white rounded-lg border border-outline-variant p-1 shadow-sm gap-0.5">
          <button
            onClick={() => updateTextProperty({ isBold: !boldVal })}
            className={`p-1.5 rounded font-bold cursor-pointer transition-colors flex items-center justify-center ${
              boldVal
                ? "bg-primary/10 text-primary"
                : "hover:bg-slate-100 text-on-surface-variant"
            }`}
            title="Bold"
          >
            <span className="material-symbols-outlined text-[18px]">format_bold</span>
          </button>
          <button
            onClick={() => updateTextProperty({ isItalic: !italicVal })}
            className={`p-1.5 rounded cursor-pointer transition-colors flex items-center justify-center ${
              italicVal
                ? "bg-primary/10 text-primary"
                : "hover:bg-slate-100 text-on-surface-variant"
            }`}
            title="Italic"
          >
            <span className="material-symbols-outlined text-[18px]">format_italic</span>
          </button>
          <button
            onClick={() => updateTextProperty({ isUnderline: !underlineVal })}
            className={`p-1.5 rounded cursor-pointer transition-colors flex items-center justify-center ${
              underlineVal
                ? "bg-primary/10 text-primary"
                : "hover:bg-slate-100 text-on-surface-variant"
            }`}
            title="Underline"
          >
            <span className="material-symbols-outlined text-[18px]">format_underlined</span>
          </button>
        </div>

        {/* Color picker */}
        <div className="relative flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-full border border-outline-variant shadow-sm cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: colorVal }}
            onClick={() => setOpenPopup(openPopup === "text" ? null : "text")}
          />
          <button
            onClick={() => setOpenPopup(openPopup === "text" ? null : "text")}
            className="p-1 hover:bg-slate-100 rounded text-on-surface-variant flex flex-col items-center justify-center cursor-pointer transition-colors w-8 h-8"
            title="Ubah Warna"
          >
            <span className="text-sm font-bold leading-none select-none">A</span>
            <div className="w-5 h-1 mt-0.5 rounded" style={{ backgroundColor: colorVal }} />
          </button>
          {openPopup === "text" && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-outline-variant rounded-xl shadow-xl z-50 p-2 flex gap-1.5 animate-in slide-in-from-top-1 duration-150">
              {["#1a1a2e", "#004782", "#006c4e", "#ba1a1a", "#d97706"].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    updateTextProperty({ color: c });
                    setOpenPopup(null);
                  }}
                  className={`w-6 h-6 rounded-full border border-outline-variant transition-all hover:scale-110 ${
                    colorVal === c ? "scale-115 ring-2 ring-primary ring-offset-1" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-outline-variant/60"></div>

        {/* Mode badge */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm select-none">
          <span className="material-symbols-outlined text-[16px]">text_fields</span>
          <span>Mode: Tambah Teks</span>
        </div>

        {/* Selesai button */}
        <button
          onClick={handleFinishTextMode}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ml-4"
        >
          Selesai
        </button>
      </div>
    );
  }

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

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/60 mx-1" />

        {/* Tanda Tangan */}
        <div className="relative overflow-visible">
          <button
            onClick={handleSignatureClick}
            className={iconBtn(activeMenu === "signature")}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: activeMenu === "signature" ? "'FILL' 1" : "'FILL' 0" }}
            >
              draw
            </span>
            <span className="pointer-events-none absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] shadow-lg">
              Tanda Tangan
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
            </span>
          </button>

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
                  {savedSignatures.map((url, idx) => (
                    <div
                      key={idx}
                      className={`relative group/sig flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all bg-surface ${
                        selectedSignatureUrl === url && selectedSignatureType === "signature" && isPlacingMode
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant hover:border-primary/45"
                      }`}
                      onClick={() => {
                        setSelectedSignature(url, "signature");
                        setPlacingMode(true);
                        setOpenPopup(null);
                      }}
                    >
                      <img
                        src={url}
                        alt={`Signature ${idx + 1}`}
                        className="h-8 w-auto max-w-[140px] object-contain"
                      />
                      {selectedSignatureUrl === url && selectedSignatureType === "signature" && isPlacingMode && (
                        <span className="ml-auto text-[9px] font-bold text-primary shrink-0">Aktif</span>
                      )}
                      <button
                        className="absolute top-1 right-1 opacity-0 group-hover/sig:opacity-100 w-4 h-4 rounded-full bg-destructive/10 hover:bg-destructive text-destructive hover:text-white flex items-center justify-center transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedSignature(url);
                        }}
                      >
                        <span className="material-symbols-outlined text-[11px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tambah Teks */}
        <div className="relative overflow-visible">
          <button
            onClick={handleTextClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95 group cursor-pointer border ${
              (activeMenu as string) === "text"
                ? "bg-primary text-white shadow-md font-bold border-primary"
                : "text-on-surface-variant hover:bg-slate-100 hover:text-on-surface font-semibold border-transparent"
            }`}
          >
            <span
              className="text-lg font-bold select-none leading-none w-5 h-5 flex items-center justify-center"
              style={{ fontFamily: "sans-serif" }}
            >
              T
            </span>
            <span className="text-xs">Add Text</span>
          </button>
        </div>

        {/* Sertifikat */}
        <div className="relative overflow-visible">
          <button
            onClick={handleCertClick}
            className={iconBtn(activeMenu === "cert")}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: activeMenu === "cert" ? "'FILL' 1" : "'FILL' 0" }}
            >
              verified_user
            </span>
            <span className="pointer-events-none absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] shadow-lg">
              Sertifikat Digital
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
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
                    <span className="font-semibold text-on-surface text-right">SignEase CA</span>
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

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/60 mx-1" />
      </div>
    </div>
  );
}
