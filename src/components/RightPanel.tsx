"use client";

import { ChevronDown, PenLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CertificateManager } from "./CertificateManager";
import { generateTextImage } from "@/lib/utils";
import { useESignStore } from "@/lib/store";

export function RightPanel() {
  const {
    annotations,
    selectedAnnotationId,
    removeAnnotation,
    updateAnnotation,
    user,
    pdfFile,
    rightPanelTab,
    setRightPanelTab,
    pdfHash,
    signedAt,
    certificates,
    selectedCertificateId,
    certificateUsedId,
  } = useESignStore();

  const selectedAnnotation = annotations.find(
    (a) => a.id === selectedAnnotationId
  );

  const [signerRole, setSignerRole] = useState("Wajib Tanda Tangan");
  const [sizePercent, setSizePercent] = useState(100);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRequired, setIsRequired] = useState(false);

  // Synchronize size slider when selected element changes
  useEffect(() => {
    if (selectedAnnotation) {
      const baseRatio = 0.22;
      const percent = Math.round((selectedAnnotation.widthRatio / baseRatio) * 100);
      setSizePercent(percent);
    }
  }, [selectedAnnotationId, selectedAnnotation]);

  const handleSizeChange = (val: number) => {
    if (!selectedAnnotation) return;
    const baseRatio = 0.22;
    const newWidthRatio = (val / 100) * baseRatio;

    // Maintain aspect ratio
    const currentAspect =
      selectedAnnotation.heightRatio / selectedAnnotation.widthRatio;
    const newHeightRatio = newWidthRatio * currentAspect;

    updateAnnotation(selectedAnnotation.id, {
      widthRatio: newWidthRatio,
      heightRatio: newHeightRatio,
    });
    setSizePercent(val);
  };

  const handleTextChange = (newText: string) => {
    if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
    const size = selectedAnnotation.textSize || 24;
    const color = selectedAnnotation.textColor || "#1a1a2e";
    const fontFamily = selectedAnnotation.fontFamily || "Poppins";
    const isBold = selectedAnnotation.isBold !== false;
    const isItalic = selectedAnnotation.isItalic || false;
    const isUnderline = selectedAnnotation.isUnderline || false;
    const { dataUrl, aspectRatio } = generateTextImage(newText, size, color, fontFamily, isBold, isItalic, isUnderline);
    
    // Maintain font height (size on screen) and expand/shrink width horizontally
    const newWidthRatio = Math.min(1 - selectedAnnotation.xRatio, selectedAnnotation.heightRatio / aspectRatio);
    const newHeightRatio = newWidthRatio * aspectRatio;

    updateAnnotation(selectedAnnotation.id, {
      text: newText,
      imageDataUrl: dataUrl,
      widthRatio: newWidthRatio,
      heightRatio: newHeightRatio,
    });
  };

  const handleColorChange = (newColor: string) => {
    if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
    const text = selectedAnnotation.text || "";
    const size = selectedAnnotation.textSize || 24;
    const fontFamily = selectedAnnotation.fontFamily || "Poppins";
    const isBold = selectedAnnotation.isBold === true;
    const isItalic = selectedAnnotation.isItalic || false;
    const isUnderline = selectedAnnotation.isUnderline || false;
    const { dataUrl, aspectRatio } = generateTextImage(text, size, newColor, fontFamily, isBold, isItalic, isUnderline);
    const newHeightRatio = selectedAnnotation.widthRatio * aspectRatio;
    
    updateAnnotation(selectedAnnotation.id, {
      textColor: newColor,
      imageDataUrl: dataUrl,
      heightRatio: newHeightRatio,
    });
  };

  const handleTextSizeChange = (newSize: number) => {
    if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
    const text = selectedAnnotation.text || "";
    const color = selectedAnnotation.textColor || "#1a1a2e";
    const fontFamily = selectedAnnotation.fontFamily || "Poppins";
    const isBold = selectedAnnotation.isBold === true;
    const isItalic = selectedAnnotation.isItalic || false;
    const isUnderline = selectedAnnotation.isUnderline || false;
    const { dataUrl, aspectRatio } = generateTextImage(text, newSize, color, fontFamily, isBold, isItalic, isUnderline);
    
    const oldSize = selectedAnnotation.textSize || 24;
    const scaleMultiplier = newSize / oldSize;
    const newWidthRatio = Math.min(1 - selectedAnnotation.xRatio, selectedAnnotation.widthRatio * scaleMultiplier);
    const newHeightRatio = newWidthRatio * aspectRatio;
    
    updateAnnotation(selectedAnnotation.id, {
      textSize: newSize,
      imageDataUrl: dataUrl,
      widthRatio: newWidthRatio,
      heightRatio: newHeightRatio,
    });
  };

  const handleFontFamilyChange = (newFontFamily: string) => {
    if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
    const text = selectedAnnotation.text || "";
    const size = selectedAnnotation.textSize || 24;
    const color = selectedAnnotation.textColor || "#1a1a2e";
    const isBold = selectedAnnotation.isBold === true;
    const isItalic = selectedAnnotation.isItalic || false;
    const isUnderline = selectedAnnotation.isUnderline || false;
    const { dataUrl, aspectRatio } = generateTextImage(text, size, color, newFontFamily, isBold, isItalic, isUnderline);
    const newHeightRatio = selectedAnnotation.widthRatio * aspectRatio;

    updateAnnotation(selectedAnnotation.id, {
      fontFamily: newFontFamily,
      imageDataUrl: dataUrl,
      heightRatio: newHeightRatio,
    });
  };

  const handleStyleToggle = (styleType: "bold" | "italic" | "underline") => {
    if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
    const text = selectedAnnotation.text || "";
    const size = selectedAnnotation.textSize || 24;
    const color = selectedAnnotation.textColor || "#1a1a2e";
    const fontFamily = selectedAnnotation.fontFamily || "Poppins";
    let isBold = selectedAnnotation.isBold === true;
    let isItalic = selectedAnnotation.isItalic || false;
    let isUnderline = selectedAnnotation.isUnderline || false;

    if (styleType === "bold") isBold = !isBold;
    if (styleType === "italic") isItalic = !isItalic;
    if (styleType === "underline") isUnderline = !isUnderline;

    const { dataUrl, aspectRatio } = generateTextImage(text, size, color, fontFamily, isBold, isItalic, isUnderline);
    const newHeightRatio = selectedAnnotation.widthRatio * aspectRatio;

    updateAnnotation(selectedAnnotation.id, {
      isBold,
      isItalic,
      isUnderline,
      imageDataUrl: dataUrl,
      heightRatio: newHeightRatio,
    });
  };

  const getSizeLabel = (percent: number) => {
    if (percent < 80) return "Kecil";
    if (percent <= 130) return "Medium";
    return "Besar";
  };

  return (
    <div className="relative flex h-full shrink-0">
      {/* Toggle Button — full-height strip matching scrollbar */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Tampilkan Panel" : "Sembunyikan Panel"}
        className="h-full w-[14px] bg-slate-100 border-l border-r border-outline-variant/60 flex items-center justify-center text-outline hover:text-primary hover:bg-primary/10 transition-all cursor-pointer group shrink-0 z-20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-2.5 h-2.5 transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : ""
          }`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <aside
        className={`border-l border-outline-variant bg-surface flex flex-col h-full overflow-hidden select-none transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-[300px] opacity-100"
        }`}
      >
      {/* Panel Header Tabs */}
      <div className="flex border-b border-outline-variant bg-slate-50/60 shrink-0">
        <button
          onClick={() => setRightPanelTab("properties")}
          className={`flex-1 py-3 text-center text-[10px] font-bold tracking-wider transition-all border-b-2 ${
            rightPanelTab === "properties"
              ? "border-primary text-primary bg-white"
              : "border-transparent text-outline hover:text-foreground hover:bg-slate-100"
          }`}
        >
          PROPERTI BIDANG
        </button>
        <button
          onClick={() => setRightPanelTab("certificate")}
          className={`flex-1 py-3 text-center text-[10px] font-bold tracking-wider transition-all border-b-2 ${
            rightPanelTab === "certificate"
              ? "border-primary text-primary bg-white"
              : "border-transparent text-outline hover:text-foreground hover:bg-slate-100"
          }`}
        >
          SERTIFIKAT DIGITAL
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {rightPanelTab === "properties" ? (
          /* PROPERTIES TAB */
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-on-surface">Properti Bidang</h3>
            {selectedAnnotation ? (
              <div className="space-y-5">
                {selectedAnnotation.type === "text" ? (
                  /* TEXT ANNOTATION PROPERTIES */
                  <>
                    {/* Text Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">
                        Isi Teks
                      </label>
                      <input
                        type="text"
                        value={selectedAnnotation.text || ""}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder="Ketik teks di sini..."
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    {/* Font Family Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">
                        Gaya Font
                      </label>
                      <select
                        value={selectedAnnotation.fontFamily || "Poppins"}
                        onChange={(e) => handleFontFamilyChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="Poppins">Poppins</option>
                        <option value="Inter">Inter</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                      </select>
                    </div>

                    {/* Font Styles (Bold, Italic, Underline buttons) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">
                        Format Teks
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStyleToggle("bold")}
                          className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                            selectedAnnotation.isBold !== false
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-outline-variant text-on-surface hover:bg-slate-50"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">format_bold</span>
                          Tebal
                        </button>
                        <button
                          onClick={() => handleStyleToggle("italic")}
                          className={`flex-1 py-1.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1 ${
                            selectedAnnotation.isItalic
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-outline-variant text-on-surface hover:bg-slate-50"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">format_italic</span>
                          Miring
                        </button>
                        <button
                          onClick={() => handleStyleToggle("underline")}
                          className={`flex-1 py-1.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1 ${
                            selectedAnnotation.isUnderline
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-outline-variant text-on-surface hover:bg-slate-50"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">format_underlined</span>
                          Garis Bawah
                        </button>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline block">
                        Warna Teks
                      </label>
                      <div className="flex gap-2 items-center">
                        {["#1a1a2e", "#004782", "#006c4e", "#ba1a1a", "#d97706"].map((c) => (
                          <button
                            key={c}
                            onClick={() => handleColorChange(c)}
                            className={`w-6 h-6 rounded-full border border-outline-variant transition-transform hover:scale-110 active:scale-95 ${
                              selectedAnnotation.textColor === c ? "scale-110 ring-2 ring-primary ring-offset-1" : ""
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Font Size Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline block">
                        Ukuran Font
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTextSizeChange(Math.max(8, (selectedAnnotation.textSize || 24) - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-slate-100 transition-colors text-base font-bold shrink-0"
                          title="Perkecil"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={8}
                          max={96}
                          value={selectedAnnotation.textSize || 24}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v >= 8 && v <= 96) handleTextSizeChange(v);
                          }}
                          className="flex-1 text-center px-2 py-1.5 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-xs text-outline shrink-0">px</span>
                        <button
                          onClick={() => handleTextSizeChange(Math.min(96, (selectedAnnotation.textSize || 24) + 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-slate-100 transition-colors text-base font-bold shrink-0"
                          title="Perbesar"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* SIGNATURE ANNOTATION PROPERTIES */
                  <>
                    {/* Jenis Bidang dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">Jenis Bidang</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <PenLine className="w-3.5 h-3.5 text-on-surface-variant" />
                        </span>
                        <select
                          defaultValue="signature"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-xs font-medium focus:border-primary focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="signature">Tanda Tangan</option>
                          <option value="text">Teks</option>
                          <option value="initial">Inisial</option>
                          <option value="date">Tanggal</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
                      </div>
                    </div>

                    {/* Dari — signature preview */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">Dari</label>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-outline-variant bg-surface hover:border-primary cursor-pointer transition-colors">
                        <div className="w-14 h-7 bg-surface-container rounded-lg overflow-hidden flex items-center justify-center border border-outline-variant/50 shrink-0">
                          <img
                            src={selectedAnnotation?.imageDataUrl}
                            className="w-full h-full object-contain"
                            alt="Tanda Tangan"
                          />
                        </div>
                        <span className="text-xs font-medium text-on-surface flex-1 truncate">Tanda Tangan Saya</span>
                        <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                      </div>
                      <button className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
                        <Plus className="w-3 h-3" />
                        Buat Baru
                      </button>
                    </div>

                    {/* Warna swatches */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline block">Warna</label>
                      <div className="flex items-center gap-2">
                        {["#004782", "#006c4e", "#000000", "#ba1a1a", "#5c4d9b"].map((c) => (
                          <button
                            key={c}
                            style={{ backgroundColor: c }}
                            className="w-7 h-7 rounded-full border-2 border-transparent hover:scale-110 transition-transform hover:border-on-surface/30"
                            title={c}
                            aria-label={`Warna ${c}`}
                          />
                        ))}
                        <label
                          className="w-7 h-7 rounded-full border-2 border-outline-variant cursor-pointer hover:scale-110 transition-transform flex items-center justify-center bg-gradient-to-br from-red-400 via-blue-400 to-green-400"
                          title="Warna Kustom"
                        >
                          <input type="color" className="sr-only" />
                        </label>
                      </div>
                    </div>

                    {/* Ukuran S/M/L */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">Ukuran</label>
                      <div className="grid grid-cols-3 gap-1 bg-surface-container rounded-xl p-1">
                        {[
                          { label: "S", pct: 70 },
                          { label: "M", pct: 100 },
                          { label: "L", pct: 140 },
                        ].map(({ label, pct }) => {
                          const isSelected = Math.abs(sizePercent - pct) < 20;
                          return (
                            <button
                              key={label}
                              onClick={() => handleSizeChange(pct)}
                              className={`
                                py-2 rounded-lg text-xs font-bold transition-all
                                ${isSelected
                                  ? "bg-white text-primary shadow-sm border border-outline-variant"
                                  : "text-on-surface-variant hover:text-on-surface"
                                }
                              `}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Posisi X/Y */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">
                        Posisi (Halaman {(selectedAnnotation?.pageIndex ?? 0) + 1})
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { axis: "x" as const, label: "X", ratio: selectedAnnotation?.xRatio ?? 0, multiplier: 595 },
                          { axis: "y" as const, label: "Y", ratio: selectedAnnotation?.yRatio ?? 0, multiplier: 842 },
                        ].map(({ axis, label, ratio, multiplier }) => (
                          <div key={axis} className="space-y-0.5">
                            <span className="text-[10px] text-outline font-medium">{label}</span>
                            <input
                              type="number"
                              value={Math.round(ratio * multiplier)}
                              onChange={(e) => {
                                const pt = parseInt(e.target.value);
                                if (!isNaN(pt) && selectedAnnotation) {
                                  const r = Math.max(0, Math.min(1, pt / multiplier));
                                  updateAnnotation(selectedAnnotation.id, {
                                    [axis === "x" ? "xRatio" : "yRatio"]: r,
                                  });
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-outline-variant text-xs bg-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Wajib Diisi toggle premium */}
                    <div className="flex items-start justify-between gap-3 py-0.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-on-surface">Wajib Diisi</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                          Pengisi wajib mengisi bidang ini
                        </p>
                      </div>
                      <button
                        onClick={() => setIsRequired(!isRequired)}
                        role="switch"
                        aria-checked={isRequired}
                        className={`
                          relative shrink-0 w-10 h-[22px] rounded-full border transition-all duration-200
                          ${isRequired ? "bg-primary border-primary" : "bg-outline-variant/40 border-outline-variant"}
                        `}
                      >
                        <span
                          className={`
                            absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm
                            transition-transform duration-200
                            ${isRequired ? "translate-x-[18px]" : "translate-x-0"}
                          `}
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* Shared: Size slider only for text (hidden for signature since we have S/M/L) */}
                {selectedAnnotation?.type === "text" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-outline">Skala Elemen</label>
                      <span className="font-bold text-on-surface">
                        {getSizeLabel(sizePercent)} ({sizePercent}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={200}
                      value={sizePercent}
                      onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                      className="w-full accent-primary cursor-ew-resize h-1 bg-outline-variant rounded-lg appearance-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-outline-variant rounded-xl bg-surface p-5 text-center">
                <span className="material-symbols-outlined text-outline/50 text-[32px] mb-2">sliders</span>
                <p className="text-xs font-semibold text-outline">Tidak Ada Elemen Terpilih</p>
                <p className="text-[11px] text-outline/85 mt-1 leading-normal">
                  Pilih tanda tangan atau teks di halaman PDF untuk mengubah properti.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* CERTIFICATE TAB */
          <div className="space-y-5">
            {/* Certificate Manager — always visible */}
            <CertificateManager />

            {/* Divider when PDF is loaded */}
            {pdfFile && <div className="border-t border-outline-variant" />}

            {/* Sertifikat aktif — info untuk user bahwa download dilakukan via toolbar */}
            {pdfFile && selectedCertificateId !== null && !pdfHash && (() => {
              const activeCert = certificates.find((c) => c.id === selectedCertificateId);
              return activeCert ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                    Sertifikat Aktif
                  </p>
                  <p className="text-[11px] text-foreground font-medium">{activeCert.name}</p>
                  <p className="text-[10px] text-outline">CN: {activeCert.commonName}</p>
                  <p className="text-[10px] text-outline/80 mt-1 leading-relaxed">
                    Klik tombol <strong>Download</strong> di toolbar atas untuk menandatangani dokumen dengan sertifikat ini.
                  </p>
                </div>
              ) : null;
            })()}

            {/* Post-signing state */}
            {pdfFile && pdfHash && (
              <div className="space-y-5">
                {/* Verification Badge */}
                <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <span className="material-symbols-outlined text-[24px]">verified_user</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">SecurityBadgeverifikasi</p>
                    <p className="text-[10px] text-emerald-600/90 font-medium">
                      {certificateUsedId !== null ? "TTE Tidak Tersertifikasi (ByteRange / Adobe)" : "Integritas Terjamin (Lokal)"}
                    </p>
                  </div>
                </div>

                {/* Certificate used for signing badge */}
                {certificateUsedId !== null && (() => {
                  const usedCert = certificates.find((c) => c.id === certificateUsedId);
                  return usedCert ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-[11px] space-y-0.5">
                        <p className="font-semibold text-blue-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          Ditandatangani dengan Sertifikat
                        </p>
                        <p className="text-blue-600">{usedCert.name}</p>
                        <p className="text-blue-500/80">CN: {usedCert.commonName}</p>
                      </div>
                      {/* TTE status disclaimer */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[10px] text-blue-700 leading-relaxed space-y-1">
                        <p className="font-semibold">Sah Secara Hukum (ISO/IEC 9594 · UU ITE)</p>
                        <p>Tanda tangan ini menggunakan sertifikat <strong>PKCS#12 / X.509</strong> berstandar internasional dan dapat diverifikasi di Adobe Acrobat. Berlaku untuk kontrak bisnis, dokumen internal, dan keperluan komersial sesuai <strong>UU ITE No. 11/2008</strong>.</p>
                        <p className="text-blue-500/80">Tidak berlaku untuk dokumen yang mensyaratkan TTE Tersertifikasi Komdigi (e-Faktur, dokumen ASN, dll). Untuk itu gunakan PSrE terakreditasi: Privy, VIDA, atau BSrE.</p>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Signer details */}
                <div className="bg-white rounded-xl border border-outline-variant p-3.5 space-y-3.5 shadow-sm text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">Penanda Tangan</span>
                    <span className="font-semibold text-foreground">{user.name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">Email</span>
                    <span className="font-semibold text-foreground truncate block">{user.email || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">Metode</span>
                    <span className="font-semibold text-foreground">
                      {certificateUsedId !== null ? "PKI (PKCS#7)" : "Kriptografi Klien (Client-Side)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">Ditandatangani Pada</span>
                    <span className="font-semibold text-foreground">
                      {signedAt
                        ? new Date(signedAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }) + " WIB"
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* SHA-256 Hash */}
                <div className="bg-slate-950 text-slate-100 rounded-xl p-3.5 space-y-2 relative overflow-hidden font-mono shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SHA-256 HASH</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pdfHash || "");
                      }}
                      className="text-[10px] font-semibold text-primary hover:text-white transition-colors"
                    >
                      SALIN
                    </button>
                  </div>
                  <p className="text-[11px] break-all leading-normal text-slate-300 font-medium">
                    {pdfHash}
                  </p>
                </div>

                {/* Official Seal Feature Gate */}
                <div className="border-2 border-secondary/20 bg-secondary/5 p-4 rounded-xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 text-secondary">
                    <span className="material-symbols-outlined text-[80px]">verified</span>
                  </div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">OFFICIAL SEAL</p>
                  <p className="text-sm font-bold text-secondary mt-1">{user.name?.toUpperCase() || "-"}</p>
                  <p className="text-[10px] text-secondary/80 mt-0.5">
                    {signedAt
                      ? new Date(signedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                  {user.plan === "free" ? (
                    <div className="mt-3 bg-slate-900/90 text-white rounded-lg p-2.5 text-left text-[10px] space-y-1.5 z-10 border border-slate-700">
                      <p className="font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-amber-400">workspace_premium</span>
                        Fitur Premium Gated
                      </p>
                      <p className="text-white/80 leading-normal">
                        Official Seal watermark ditambahkan secara otomatis pada sertifikat PDF jika Anda berlangganan paket Pro.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded font-bold">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Sertifikat Valid &amp; Aktif
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Waiting state — PDF loaded, no cert selected, not yet signed */}
            {pdfFile && !pdfHash && selectedCertificateId === null && (
              <div className="flex flex-col items-center text-center p-5 border border-dashed border-outline-variant rounded-xl bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <span className="material-symbols-outlined text-[28px] animate-pulse">lock_open</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Menunggu Tanda Tangan</p>
                  <p className="text-[11px] text-outline mt-1 leading-relaxed">
                    Pilih sertifikat di atas lalu klik <strong>Download</strong> di toolbar atas untuk menandatangani dengan PKI, atau langsung klik Download untuk tanda tangan visual biasa.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hapus Bidang — full width, visible only when annotation selected */}
      {selectedAnnotation && (
        <div className="px-4 py-3 border-t border-outline-variant shrink-0">
          <button
            onClick={() => removeAnnotation(selectedAnnotation.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/60 text-destructive text-xs font-semibold hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
      )}

      {/* Audit Trail Panel */}
      <div className="mt-auto p-4 bg-surface-container-lowest border-t border-outline-variant space-y-4 shrink-0">
        <p className="text-xs font-bold text-outline uppercase tracking-wider">Audit Trail</p>
        <div className="space-y-4">
          {pdfFile ? (
            <div className="flex gap-3">
              <div className="w-1.5 bg-secondary rounded-full self-stretch my-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Dokumen diunggah</p>
                <p className="text-[10px] text-outline mt-0.5">10:45 AM</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-outline italic">Belum ada aktivitas dokumen</p>
          )}

          {annotations.length > 0 && (
            <div className="flex gap-3">
              <div className="w-1.5 bg-primary rounded-full self-stretch my-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Elemen ditambahkan</p>
                <p className="text-[10px] text-outline mt-0.5">10:52 AM</p>
              </div>
            </div>
          )}

          {pdfHash && (
            <div className="flex gap-3">
              <div className="w-1.5 bg-emerald-500 rounded-full self-stretch my-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Integritas Dikunci (SHA-256)</p>
                <p className="text-[10px] text-outline mt-0.5">Baru saja</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
    </div>
  );
}
