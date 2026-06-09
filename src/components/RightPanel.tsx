"use client";

import { useESignStore } from "@/lib/store";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { generateTextImage } from "@/lib/utils";

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
  } = useESignStore();

  const selectedAnnotation = annotations.find(
    (a) => a.id === selectedAnnotationId
  );

  const [signerRole, setSignerRole] = useState("Wajib Tanda Tangan");
  const [sizePercent, setSizePercent] = useState(100);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          PROPERTI ELEMEN
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
            <h3 className="text-sm font-bold text-on-surface">Properti Elemen</h3>
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

                    {/* Font Size Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-outline">
                          Ukuran Font
                        </label>
                        <span className="font-bold text-on-surface">
                          {selectedAnnotation.textSize || 24}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={64}
                        value={selectedAnnotation.textSize || 24}
                        onChange={(e) => handleTextSizeChange(parseInt(e.target.value))}
                        className="w-full accent-primary cursor-ew-resize h-1 bg-outline-variant rounded-lg appearance-none"
                      />
                    </div>
                  </>
                ) : (
                  /* SIGNATURE ANNOTATION PROPERTIES */
                  <>
                    {/* Signer Info */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">
                        Nama Penanda Tangan
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={user.name || "Felix Ardiansyah"}
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-slate-50 text-sm text-foreground focus:outline-none"
                      />
                    </div>

                    {/* Role Settings */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-outline">
                        Peran
                      </label>
                      <select
                        value={signerRole}
                        onChange={(e) => setSignerRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option>Wajib Tanda Tangan</option>
                        <option>Opsional</option>
                        <option>Hanya Baca</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Shared: Element Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-outline">
                      Skala Elemen
                    </label>
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

                <div className="pt-2">
                  <button
                    onClick={() => removeAnnotation(selectedAnnotation.id)}
                    className="w-full py-2.5 border border-error text-error font-semibold text-sm rounded-xl hover:bg-error-container/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Elemen
                  </button>
                </div>
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Sertifikat Digital (SHA-256)</h3>
            </div>

            {!pdfFile ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-outline-variant rounded-xl bg-surface p-5 text-center">
                <span className="material-symbols-outlined text-outline/50 text-[32px] mb-2">verified_user</span>
                <p className="text-xs font-semibold text-outline">Tidak Ada Dokumen</p>
                <p className="text-[11px] text-outline/85 mt-1 leading-normal">
                  Silakan upload dokumen PDF terlebih dahulu.
                </p>
              </div>
            ) : !pdfHash || annotations.length === 0 ? (
              <div className="flex flex-col items-center text-center p-5 border border-dashed border-outline-variant rounded-xl bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <span className="material-symbols-outlined text-[28px] animate-pulse">lock_open</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Menunggu Tanda Tangan</p>
                  <p className="text-[11px] text-outline mt-1 leading-relaxed">
                    Tempatkan tanda tangan pada dokumen, lalu klik tombol **Download** di baris menu atas untuk mengunci integritas dan membubuhkan sertifikat digital lokal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Verification Badge */}
                <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <span className="material-symbols-outlined text-[24px]">verified_user</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Dokumen Terverifikasi</p>
                    <p className="text-[10px] text-emerald-600/90 font-medium">Integritas Terjamin (Lokal)</p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="bg-white rounded-xl border border-outline-variant p-3.5 space-y-3.5 shadow-sm text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">Penanda Tangan</span>
                    <span className="font-semibold text-foreground">{user.name || "Felix Ardiansyah"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">Email</span>
                    <span className="font-semibold text-foreground truncate block">{user.email || "felix.ardiansyah@corporate.com"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">Metode</span>
                    <span className="font-semibold text-foreground">Kriptografi Klien (Client-Side)</span>
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

                {/* SHA-256 Hash Display */}
                <div className="bg-slate-950 text-slate-100 rounded-xl p-3.5 space-y-2 relative overflow-hidden font-mono shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SHA-256 HASH</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pdfHash || "");
                        alert("Hash berhasil disalin ke papan klip!");
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
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest font-bold">OFFICIAL SEAL</p>
                  <p className="text-sm font-bold text-secondary mt-1">{user.name?.toUpperCase() || "FELIX ARDIANSYAH"}</p>
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
                        Official Seal watermark ditambahkan secara otomatis pada sertifikat PDF jika Anda berlangganan paket **Pro**.
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
          </div>
        )}
      </div>

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
