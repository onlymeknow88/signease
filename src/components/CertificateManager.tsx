"use client";

import { useState } from "react";
import { Shield, Plus, Upload, Trash2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useESignStore } from "@/lib/store";
import { CertificateGeneratorModal } from "./CertificateGeneratorModal";
import { CertificateUploadModal } from "./CertificateUploadModal";

export function CertificateManager() {
  const {
    certificates,
    selectedCertificateId,
    isCertificateLoading,
    selectCertificate,
    removeCertificate,
  } = useESignStore();

  const [showGenerator, setShowGenerator] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await removeCertificate(id);
    setDeletingId(null);
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const isExpired = (cert: { validTo: Date }) => new Date(cert.validTo) < new Date();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Sertifikat Digital</span>
          <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full shrink-0">
            TTE Tidak Tersertifikasi
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowUpload(true)}
            title="Upload .p12/.pfx"
            className="p-1 rounded hover:bg-surface-raised text-outline hover:text-foreground transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowGenerator(true)}
            title="Buat sertifikat baru"
            className="p-1 rounded hover:bg-surface-raised text-outline hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Regulasi info banner */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[10px] text-amber-700 leading-relaxed">
        Sertifikat ini berjenis <strong>TTE Tidak Tersertifikasi</strong> (PP 71/2019). Dapat diverifikasi di Adobe Acrobat, namun <strong>tidak berlaku</strong> untuk dokumen resmi pemerintah. Untuk TTE Tersertifikasi gunakan layanan PSrE terakreditasi Komdigi (Privy, VIDA, BSrE, dll).
      </div>

      {/* Certificate list */}
      {isCertificateLoading ? (
        <div className="text-[11px] text-outline text-center py-3">Memuat sertifikat...</div>
      ) : certificates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
          <Shield className="w-6 h-6 text-outline mx-auto" />
          <p className="text-[11px] text-outline">Belum ada sertifikat</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowGenerator(true)}
              className="text-[11px] text-primary hover:underline"
            >
              Buat baru
            </button>
            <span className="text-[11px] text-outline">atau</span>
            <button
              onClick={() => setShowUpload(true)}
              className="text-[11px] text-primary hover:underline"
            >
              Upload .p12
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* "None" option */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="certificate"
              checked={selectedCertificateId === null}
              onChange={() => selectCertificate(null)}
              className="accent-primary"
            />
            <span className="text-[11px] text-outline group-hover:text-foreground transition-colors">
              Tanpa sertifikat
            </span>
          </label>

          {certificates.map((cert) => {
            const expired = isExpired(cert);
            const selected = selectedCertificateId === cert.id;
            return (
              <div
                key={cert.id}
                className={`rounded-lg border p-2.5 transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                } ${expired ? "opacity-60" : ""}`}
              >
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="certificate"
                    checked={selected}
                    onChange={() => selectCertificate(cert.id)}
                    className="mt-0.5 accent-primary"
                    disabled={expired}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {expired ? (
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      )}
                      <span className="text-[11px] font-semibold text-foreground truncate">
                        {cert.name}
                      </span>
                      {cert.isSelfSigned && (
                        <span className="text-[9px] bg-surface-raised text-outline px-1 rounded shrink-0">
                          Self-signed
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-outline mt-0.5 truncate">CN: {cert.commonName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-outline" />
                      <span className={`text-[10px] ${expired ? "text-amber-500" : "text-outline"}`}>
                        {expired ? "Kedaluwarsa" : "Berlaku s/d"} {formatDate(cert.validTo)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(cert.id);
                    }}
                    disabled={deletingId === cert.id}
                    className="p-0.5 rounded hover:bg-red-50 text-outline hover:text-red-500 transition-colors shrink-0"
                    title="Hapus sertifikat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {showGenerator && <CertificateGeneratorModal onClose={() => setShowGenerator(false)} />}
      {showUpload && <CertificateUploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
