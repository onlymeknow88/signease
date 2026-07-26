"use client";

import { useState, useRef } from "react";
import { X, Loader2, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useESignStore } from "@/lib/store";
import { parsePKCS12Certificate } from "@/lib/crypto";
import { DigitalCertificate } from "@/lib/types";
import { nanoid } from "nanoid";

interface Props {
  onClose: () => void;
}

export function CertificateUploadModal({ onClose }: Props) {
  const { addCertificate } = useESignStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiredWarning, setExpiredWarning] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<{
    commonName: string;
    issuer: string;
    validTo: Date;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError("");
    setParsedInfo(null);
    setExpiredWarning(false);
    if (f) setFriendlyName(f.name.replace(/\.(p12|pfx)$/i, ""));
  };

  const handlePreview = async () => {
    if (!file || !password) {
      setError("Pilih file dan masukkan password terlebih dahulu");
      return;
    }
    setError("");
    try {
      const buf = await file.arrayBuffer();
      const parsed = parsePKCS12Certificate(buf, password);
      setParsedInfo({
        commonName: parsed.commonName,
        issuer: parsed.issuer,
        validTo: parsed.validTo,
      });
      if (parsed.isExpired) setExpiredWarning(true);
      if (!friendlyName) setFriendlyName(parsed.commonName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca sertifikat");
      setParsedInfo(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !password) {
      setError("Pilih file dan masukkan password terlebih dahulu");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const buf = await file.arrayBuffer();
      const parsed = parsePKCS12Certificate(buf, password);

      const localStorageKey = `signease_cert_${nanoid(10)}`;

      // Encode p12 as base64 for localStorage
      const p12Bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < p12Bytes.byteLength; i++) {
        binary += String.fromCharCode(p12Bytes[i]);
      }
      const p12Base64 = btoa(binary);

      const name = friendlyName.trim() || parsed.commonName;

      const payload = {
        name,
        commonName: parsed.commonName,
        issuer: parsed.issuer,
        serialNumber: parsed.serialNumber,
        algorithm: parsed.algorithm,
        validFrom: parsed.validFrom.toISOString(),
        validTo: parsed.validTo.toISOString(),
        isSelfSigned: false,
        localStorageKey,
      };

      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan sertifikat");
      }

      const saved = await res.json();
      const cert: DigitalCertificate = {
        ...saved,
        validFrom: new Date(saved.validFrom),
        validTo: new Date(saved.validTo),
      };

      addCertificate(cert, p12Base64);
      toast.success(`Sertifikat "${name}" berhasil diunggah`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Upload Sertifikat .p12/.pfx</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-raised text-outline hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* File input */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/60 transition-colors"
          >
            <Upload className="w-5 h-5 text-outline mx-auto mb-1" />
            <p className="text-[11px] text-outline">
              {file ? file.name : "Klik untuk pilih file .p12 atau .pfx"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".p12,.pfx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">Password *</label>
            <input
              type="password"
              placeholder="Password file .p12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Preview button */}
          {file && password && !parsedInfo && (
            <button
              onClick={handlePreview}
              className="w-full py-1.5 rounded-lg border border-border text-[11px] text-foreground hover:bg-surface-raised transition-colors"
            >
              Verifikasi Sertifikat
            </button>
          )}

          {/* Parsed info */}
          {parsedInfo && (
            <div className="rounded-lg bg-surface-raised p-3 space-y-1 text-[11px]">
              <p><span className="text-outline">CN:</span> <span className="text-foreground font-medium">{parsedInfo.commonName}</span></p>
              <p className="text-outline truncate">{parsedInfo.issuer}</p>
              <p><span className="text-outline">Berlaku s/d:</span> <span className={expiredWarning ? "text-amber-500" : "text-foreground"}>{formatDate(parsedInfo.validTo)}</span></p>
            </div>
          )}

          {/* Expired warning */}
          {expiredWarning && (
            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700">
                Sertifikat ini sudah kedaluwarsa. Anda masih dapat mengunggahnya, namun tidak dapat digunakan untuk penandatanganan.
              </p>
            </div>
          )}

          {/* Friendly name */}
          {parsedInfo && (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Nama Tampilan</label>
              <input
                type="text"
                placeholder={parsedInfo.commonName}
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[11px] text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-xs text-foreground hover:bg-surface-raised transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !file || !password}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengunggah...
              </>
            ) : (
              "Upload Sertifikat"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
