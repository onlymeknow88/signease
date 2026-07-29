"use client";

import { useState } from "react";
import { Shield, Plus, Upload, Trash2, CheckCircle2, AlertTriangle, Clock, AlertCircle } from "lucide-react";
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(null);
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
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-[10px] text-blue-700 leading-relaxed space-y-1">
        <p className="font-semibold">Tanda Tangan Digital Standar ISO — Tetap Sah Secara Hukum</p>
        <p>
          Sertifikat ini menggunakan enkripsi <strong>PKCS#12 / X.509</strong> sesuai standar internasional <strong>ISO/IEC 9594</strong> dan dapat diverifikasi di Adobe Acrobat.
          Berdasarkan <strong>UU ITE No. 11/2008</strong> dan <strong>PP 71/2019</strong>, tanda tangan digital berbasis sertifikat elektronik tetap <strong>memiliki kekuatan hukum</strong> untuk keperluan bisnis, kontrak internal, dan dokumen komersial.
        </p>
        <p className="text-blue-600">
          Catatan: Untuk dokumen resmi pemerintah yang mensyaratkan TTE Tersertifikasi Komdigi (seperti e-Faktur, dokumen ASN, dll), diperlukan layanan PSrE terakreditasi seperti Privy, VIDA, atau BSrE.
        </p>
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
                      setConfirmDeleteId(cert.id);
                    }}
                    disabled={deletingId === cert.id}
                    className="p-0.5 rounded hover:bg-red-50 text-outline hover:text-red-500 transition-colors shrink-0"
                    title="Hapus sertifikat"
                  >
                    {deletingId === cert.id ? (
                      <span className="w-3 h-3 block rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {showGenerator && <CertificateGeneratorModal onClose={() => setShowGenerator(false)} />}
      {showUpload && <CertificateUploadModal onClose={() => setShowUpload(false)} />}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (() => {
        const cert = certificates.find((c) => c.id === confirmDeleteId);
        if (!cert) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          >
            <div
              className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Hapus Sertifikat?</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              {/* Cert info */}
              <div className="bg-surface-container rounded-xl px-3 py-2.5 space-y-0.5">
                <p className="text-xs font-semibold text-foreground truncate">{cert.name}</p>
                <p className="text-[10px] text-on-surface-variant">CN: {cert.commonName}</p>
                {cert.isSelfSigned && (
                  <span className="text-[9px] bg-surface-raised text-outline px-1.5 py-0.5 rounded inline-block mt-0.5">
                    Self-signed
                  </span>
                )}
              </div>

              {/* Warning */}
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Sertifikat ini akan dihapus secara permanen dari akun Anda. File <strong>.p12</strong> yang sudah diunduh tidak akan terpengaruh.
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
