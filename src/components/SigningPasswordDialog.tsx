"use client";

import { useState } from "react";
import { X, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useESignStore } from "@/lib/store";
import { DigitalCertificate } from "@/lib/types";

interface Props {
  certificate: DigitalCertificate;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SigningPasswordDialog({ certificate, onConfirm, onCancel, loading }: Props) {
  const { validateCertificatePassword } = useESignStore();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  // Step 1: Validate password (does NOT trigger download)
  const handleValidate = () => {
    if (!password) {
      setError("Password diperlukan");
      return;
    }
    const valid = validateCertificatePassword(certificate.id, password);
    if (!valid) {
      setError("Password salah. Pastikan password sesuai dengan file .p12 Anda.");
      setValidated(false);
      return;
    }
    setError("");
    setValidated(true);
  };

  // Step 2: User explicitly clicks "Tanda Tangan & Unduh" after validation
  const handleConfirm = () => {
    if (!validated) return;
    onConfirm(password);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setError("");
    setValidated(false); // reset validation if password changes
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tanda Tangani dengan Sertifikat</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-surface-raised text-outline hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Certificate info */}
          <div className="rounded-lg bg-surface-raised p-3 space-y-1 text-[11px]">
            <p>
              <span className="text-outline">Sertifikat:</span>{" "}
              <span className="text-foreground font-semibold">{certificate.name}</span>
            </p>
            <p>
              <span className="text-outline">CN:</span>{" "}
              <span className="text-foreground">{certificate.commonName}</span>
            </p>
            <p>
              <span className="text-outline">Algoritma:</span>{" "}
              <span className="text-foreground">{certificate.algorithm}</span>
            </p>
            <p>
              <span className="text-outline">Berlaku s/d:</span>{" "}
              <span className="text-foreground">{formatDate(certificate.validTo)}</span>
            </p>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Password Sertifikat *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password .p12"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                autoFocus
                className="input-field pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {error && <p className="text-[10px] text-red-500">{error}</p>}
            {validated && (
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Password valid — klik tombol di bawah untuk menandatangani
              </p>
            )}
          </div>

          {/* Verify button — separate from sign */}
          {!validated && (
            <button
              onClick={handleValidate}
              disabled={!password || loading}
              className="w-full py-2 rounded-lg border border-border text-xs text-foreground hover:bg-surface-raised disabled:opacity-50 transition-colors"
            >
              Verifikasi Password
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg border border-border text-xs text-foreground hover:bg-surface-raised transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !validated}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menandatangani...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                Tanda Tangan &amp; Unduh
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

