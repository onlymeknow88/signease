"use client";

import { ChevronDown, PenLine, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { CertificateManager } from "./CertificateManager";
import { generateTextImage } from "@/lib/utils";
import { useESignStore } from "@/lib/store";

export function RightPanel() {
  const {
    annotations,
    selectedAnnotationId,
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
        <div className="flex-1 py-3 text-center text-[10px] font-bold tracking-wider border-b-2 border-primary text-primary bg-white">
          SERTIFIKAT DIGITAL & INTEGRITAS
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* CERTIFICATE TAB - ALWAYS SHOWN */}
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
