"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldX,
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Copy,
  ArrowLeft,
  Loader2,
  Hash,
} from "lucide-react";
import { verifyPDF, VerificationResult } from "@/lib/verify";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSigningTime(timeStr: string | null) {
  if (!timeStr) return "-";
  try {
    const clean = timeStr.trim();
    if (clean.length >= 13 && clean.endsWith("Z") && !clean.includes("-") && !clean.includes("T")) {
      let year: number, month: number, day: number, hour: number, min: number, sec: number;
      if (clean.length === 13) {
        year = 2000 + parseInt(clean.substring(0, 2));
        month = parseInt(clean.substring(2, 4)) - 1;
        day = parseInt(clean.substring(4, 6));
        hour = parseInt(clean.substring(6, 8));
        min = parseInt(clean.substring(8, 10));
        sec = parseInt(clean.substring(10, 12));
      } else {
        year = parseInt(clean.substring(0, 4));
        month = parseInt(clean.substring(4, 6)) - 1;
        day = parseInt(clean.substring(6, 8));
        hour = parseInt(clean.substring(8, 10));
        min = parseInt(clean.substring(10, 12));
        sec = parseInt(clean.substring(12, 14));
      }
      const d = new Date(Date.UTC(year, month, day, hour, min, sec));
      return (
        d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    }
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return (
        d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    }
  } catch {
    // fallback
  }
  return timeStr;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), 2000);
      }}
      className="ml-2 p-1 rounded hover:bg-surface-raised text-outline hover:text-foreground transition-colors"
      title="Salin"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ result }: { result: VerificationResult }) {
  if (result.status === "no_signature") {
    return (
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-800">Tidak Ada Tanda Tangan Digital</p>
          <p className="text-xs text-slate-500 mt-0.5">
            File ini tidak mengandung tanda tangan digital PKI. Mungkin hanya tanda tangan visual.
          </p>
        </div>
      </div>
    );
  }

  if (result.status === "valid") {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="font-bold text-sm text-emerald-800">Tanda Tangan Valid</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Tanda tangan digital ditemukan dan terverifikasi. Dokumen tidak dimodifikasi sejak ditandatangani.
          </p>
        </div>
      </div>
    );
  }

  if (result.status === "invalid") {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <ShieldX className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="font-bold text-sm text-red-800">Tanda Tangan Tidak Valid</p>
          <p className="text-xs text-red-600 mt-0.5">
            Verifikasi gagal. Dokumen kemungkinan telah dimodifikasi setelah ditandatangani.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
      </div>
      <div>
        <p className="font-bold text-sm text-amber-800">Gagal Memproses</p>
        <p className="text-xs text-amber-600 mt-0.5">{result.errorMessage ?? "Terjadi kesalahan saat memproses tanda tangan."}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function VerifyPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const processFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".pdf") && f.type !== "application/pdf") {
      alert("Hanya file PDF yang didukung.");
      return;
    }
    if (!isMountedRef.current) return;
    setFile(f);
    setResult(null);
    setLoading(true);
    try {
      const res = await verifyPDF(f);
      if (isMountedRef.current) {
        setResult(res);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setResult({
          fileHash: "",
          hasDigitalSignature: false,
          signers: [],
          signatureValid: null,
          status: "parse_error",
          errorMessage: err instanceof Error ? err.message : "Terjadi kesalahan",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-outline-variant bg-surface-container-low">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="SignEase" className="h-8 w-auto" />
          </Link>
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke App
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verifikasi Tanda Tangan Digital
          </div>
          <h1 className="text-3xl font-black text-on-surface">
            Verifikasi Dokumen PDF
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Upload dokumen PDF untuk memeriksa keaslian tanda tangan digital, integritas dokumen, dan informasi penandatangan. Proses 100% di browser — file tidak dikirim ke server.
          </p>
        </div>

        {/* Drop Zone */}
        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileInput}
            />

            {loading ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                <p className="text-sm font-semibold text-on-surface">Memverifikasi {file?.name}...</p>
                <p className="text-xs text-on-surface-variant">Memproses tanda tangan digital dan menghitung hash</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {isDragging ? "Lepaskan file di sini" : "Drop file PDF di sini"}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">atau klik untuk memilih file</p>
                </div>
                <p className="text-[11px] text-on-surface-variant/60">Hanya file PDF · Maks. 50MB</p>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-5">
            {/* File info bar */}
            <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{file?.name}</p>
                <p className="text-[11px] text-on-surface-variant">
                  {file ? (file.size / 1024).toFixed(1) + " KB" : ""}
                </p>
              </div>
              <button
                onClick={reset}
                className="text-xs text-primary hover:underline shrink-0 font-medium"
              >
                Ganti File
              </button>
            </div>

            {/* Status badge */}
            <StatusBadge result={result} />

            {/* TTE disclaimer */}
            {result.hasDigitalSignature && result.signers.some((s) => s.isSelfSigned) && (
              <div className="flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-700 leading-relaxed space-y-1">
                  <p className="font-semibold">Tanda Tangan Digital Sah Secara Hukum (ISO/IEC 9594 · UU ITE)</p>
                  <p>
                    Dokumen ini ditandatangani menggunakan sertifikat <strong>PKCS#12 / X.509 self-signed</strong> berstandar internasional.
                    Berdasarkan <strong>UU ITE No. 11/2008</strong>, tanda tangan digital berbasis sertifikat elektronik <strong>tetap memiliki kekuatan hukum</strong> dan dapat digunakan untuk kontrak bisnis, dokumen internal, serta keperluan komersial.
                    Integritas dokumen dapat diverifikasi di Adobe Acrobat Reader.
                  </p>
                  <p className="text-blue-500/80">
                    Catatan: Sertifikat ini tidak berinduk ke PSrE Induk Komdigi, sehingga <strong>tidak berlaku</strong> untuk dokumen yang secara khusus mensyaratkan TTE Tersertifikasi (seperti e-Faktur, dokumen ASN, atau layanan pemerintah). Untuk kebutuhan tersebut, gunakan PSrE terakreditasi: Privy, VIDA, atau BSrE.
                  </p>
                </div>
              </div>
            )}

            {/* Audit Details Card */}
            {result.auditDetails && (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3">
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Detail Hasil Audit Integritas &amp; Kriptografi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {result.auditDetails.byteRangeText && (
                    <div className="bg-white p-3 rounded-lg border border-outline-variant/60">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Jangkauan Byte (ByteRange)</p>
                      <p className="text-[10px] text-on-surface-variant/70 mb-1.5">Standar internal format dokumen PDF (ISO 32000-1)</p>
                      <p className="font-mono text-foreground font-medium">{result.auditDetails.byteRangeText}</p>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-lg border border-outline-variant/60">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Status Enkripsi Digest</p>
                    <p className={`font-semibold ${result.signatureValid ? "text-emerald-700" : "text-red-700"}`}>
                      {result.signatureValid ? "Valid (Hash Cocok)" : "Tidak Valid (Hash Mismatch)"}
                    </p>
                  </div>
                  {result.auditDetails.reason && (
                    <div className="col-span-1 md:col-span-2 bg-white p-3 rounded-lg border border-outline-variant/60">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Keterangan Verifikasi</p>
                      <p className="text-on-surface-variant leading-relaxed">{result.auditDetails.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signer info */}
            {result.signers.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Informasi Penandatangan &amp; Sertifikat Digital
                </h2>
                {result.signers.map((signer, i) => (
                  <div key={i} className="bg-white border border-outline-variant rounded-xl p-4 space-y-3 shadow-sm">
                    {/* Valid / expired badge */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-on-surface">{signer.commonName}</p>
                      <div className="flex gap-2">
                        {signer.isSelfSigned && (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                            Self-signed
                          </span>
                        )}
                        {signer.isExpired ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-2.5 h-2.5" />
                            Kedaluwarsa
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                      <InfoRow label="Organisasi" value={signer.organization} />
                      <InfoRow label="Email" value={signer.email} />
                      <InfoRow
                        label="Masa Berlaku Sertifikat"
                        value={`${formatDate(signer.validFrom)} s/d ${formatDate(signer.validTo)}`}
                        fullWidth
                      />
                      {signer.signingTime && (
                        <InfoRow
                          label="Waktu Ditandatangani"
                          value={formatSigningTime(signer.signingTime)}
                          fullWidth
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : result.hasDigitalSignature ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-1">
                <p className="font-bold text-amber-800">Sertifikat Digital Rusak / Tidak Dapat Dibaca</p>
                <p className="text-amber-700 leading-relaxed">
                  Blok /ByteRange tanda tangan ditemukan pada dokumen, namun struktur sertifikat PKCS#7 di dalamnya tidak dapat diekstrak karena dokumen telah mengalami modifikasi byte atau terkorupsi setelah penandatanganan.
                </p>
              </div>
            ) : null}

            {/* Info note */}
            <div className="flex gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Verifikasi ini memeriksa integritas kriptografis dokumen secara lokal di browser Anda. Untuk validasi hukum resmi, gunakan portal verifikasi PSrE terakreditasi Komdigi.
              </p>
            </div>

            {/* Verify another */}
            <button
              onClick={reset}
              className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              + Verifikasi Dokumen Lain
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoRow({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-foreground font-medium break-all">{value}</p>
    </div>
  );
}
