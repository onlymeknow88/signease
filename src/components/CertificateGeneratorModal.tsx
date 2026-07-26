"use client";

import { useState } from "react";
import { X, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useESignStore } from "@/lib/store";
import { generateSelfSignedCertificate } from "@/lib/crypto";
import { CertificateFormData, DigitalCertificate } from "@/lib/types";
import { nanoid } from "nanoid";
import { Input } from "@/components/ui/input";

interface Props {
  onClose: () => void;
}

const defaultForm: CertificateFormData = {
  name: "",
  commonName: "",
  organization: "",
  organizationalUnit: "",
  country: "",
  email: "",
  password: "",
  validityDays: 365,
};

export function CertificateGeneratorModal({ onClose }: Props) {
  const { addCertificate, user } = useESignStore();
  const [form, setForm] = useState<CertificateFormData>({
    ...defaultForm,
    commonName: user.name || "",
    email: user.email || "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CertificateFormData | "confirmPassword", string>>>({});

  const set = (field: keyof CertificateFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nama diperlukan";
    if (!form.commonName.trim()) e.commonName = "Common Name diperlukan";
    if (!form.password) e.password = "Password diperlukan";
    else if (form.password.length < 6) e.password = "Password minimal 6 karakter";
    if (form.password !== confirmPassword) e.confirmPassword = "Password tidak cocok";
    if (form.country && form.country.length !== 2) e.country = "Gunakan kode 2 huruf (mis. ID)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await generateSelfSignedCertificate(form);

      // Save metadata to API
      const localStorageKey = `signease_cert_${nanoid(10)}`;
      const payload = {
        name: form.name,
        commonName: result.commonName,
        issuer: result.issuer,
        serialNumber: result.serialNumber,
        algorithm: result.algorithm,
        validFrom: result.validFrom.toISOString(),
        validTo: result.validTo.toISOString(),
        isSelfSigned: true,
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

      addCertificate(cert, result.p12Base64);

      toast.success(`Sertifikat "${form.name}" berhasil dibuat`, {
        action: {
          label: "Download .p12",
          onClick: () => {
            const blob = new Blob([result.p12Bytes.buffer as ArrayBuffer], { type: "application/x-pkcs12" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${form.name.replace(/\s+/g, "_")}.p12`;
            a.click();
            URL.revokeObjectURL(url);
          },
        },
      });

      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Buat Sertifikat Self-Signed</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-raised text-outline hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Field label="Nama Sertifikat *" error={errors.name}>
            <Input
              type="text"
              placeholder="mis. Sertifikat Kerja"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)}
              className="w-full mt-1"
            />
          </Field>

          <Field label="Common Name (CN) *" error={errors.commonName}>
            <Input
              type="text"
              placeholder="mis. John Doe"
              value={form.commonName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("commonName", e.target.value)}
              className="w-full mt-1"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Organisasi">
              <Input
                type="text"
                placeholder="PT. Contoh"
                value={form.organization}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("organization", e.target.value)}
                className="w-full mt-1"
              />
            </Field>
            <Field label="Unit / Divisi">
              <Input
                type="text"
                placeholder="Engineering"
                value={form.organizationalUnit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("organizationalUnit", e.target.value)}
                className="w-full mt-1"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Negara (2 huruf)" error={errors.country}>
              <Input
                type="text"
                placeholder="ID"
                maxLength={2}
                value={form.country}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("country", e.target.value.toUpperCase())}
                className="w-full mt-1"
              />
            </Field>
            <Field label="Masa Berlaku (hari)">
              <Input
                type="number"
                min={1}
                max={3650}
                value={form.validityDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("validityDays", parseInt(e.target.value) || 365)}
                className="w-full mt-1"
              />
            </Field>
          </div>

          <Field label="Email">
            <Input
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("email", e.target.value)}
              className="w-full mt-1"
            />
          </Field>

          <div className="border-t border-border pt-3 space-y-3">
            <Field label="Password .p12 *" error={errors.password}>
              <Input
                type="password"
                placeholder="Min. 6 karakter"
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("password", e.target.value)}
                className="w-full mt-1"
              />
            </Field>

            <Field label="Konfirmasi Password *" error={errors.confirmPassword}>
              <Input
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                className="w-full mt-1"
              />
            </Field>
          </div>

          {/* TTE Disclaimer */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
            <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              ⚠️ Tanda Tangan Elektronik Tidak Tersertifikasi
            </p>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Sertifikat yang dibuat di sini adalah <strong>self-signed</strong> dan tidak berinduk ke PSrE Induk Komdigi. Tanda tangan ini tergolong <strong>TTE Tidak Tersertifikasi</strong> sesuai PP 71/2019 — cocok untuk keperluan internal, namun <strong>tidak memiliki kekuatan hukum</strong> setara TTE Tersertifikasi (Privy, VIDA, BSrE, dll) untuk dokumen resmi/pemerintah.
            </p>
            <p className="text-[10px] text-amber-600">
              Kunci privat hanya tersimpan di browser Anda. Server tidak pernah menerima kunci privat.
            </p>
          </div>
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
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Membuat...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Buat Sertifikat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
