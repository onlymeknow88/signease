"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowRight, Loader2, Sparkles, CheckCircle2, Download, Edit3, Trash2, ArrowLeft, Plus } from "lucide-react";
import { useMergeStore } from "@/lib/merge-store";
import { useESignStore } from "@/lib/store";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MergeDropZone } from "@/components/merge/MergeDropZone";
import { MergePDFCard } from "@/components/merge/MergePDFCard";
import { toast } from "sonner";

export default function MergePDFPage() {
  const router = useRouter();
  const {
    items,
    isMerging,
    mergedBytes,
    mergedPageCount,
    error,
    addFiles,
    removeItem,
    reorderItems,
    rotateItem,
    clearAll,
    mergePDFs,
    openInEditor,
  } = useMergeStore();

  const user = useESignStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      // Keep state intact while working, or optionally clear on unmount
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleFilesSelected = async (files: File[]) => {
    await addFiles(files);
  };

  const handleDownload = () => {
    if (!mergedBytes) return;
    const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merged_${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File PDF berhasil digabungkan dan diunduh!");
  };

  const handleOpenInEditor = () => {
    openInEditor(router.push);
    toast.success("Membuka file gabungan di workspace editor...");
  };

  if (!mounted) return null;

  // Determine current active step: 1 (Upload/Empty), 2 (Arrange), 3 (Completed)
  let step = 1;
  if (mergedBytes) {
    step = 3;
  } else if (items.length > 0) {
    step = 2;
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-6 py-12 min-h-[80vh]">
        {/* Header Title */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Fitur Baru
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight">
            Gabungkan PDF
          </h1>
          <p className="text-on-surface-variant font-medium text-sm md:text-base max-w-lg mx-auto">
            Urutkan dan gabungkan beberapa file PDF menjadi satu dokumen secara instan di browser Anda.
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 mb-8 text-sm font-bold max-w-md mx-auto">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-on-surface-variant/40"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-primary text-on-primary" : "bg-outline-variant"}`}>1</span>
            <span>Unggah</span>
          </div>
          <div className="h-0.5 w-8 bg-outline-variant" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-on-surface-variant/40"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-primary text-on-primary" : "bg-outline-variant"}`}>2</span>
            <span>Atur Urutan</span>
          </div>
          <div className="h-0.5 w-8 bg-outline-variant" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-on-surface-variant/40"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-primary text-on-primary" : "bg-outline-variant"}`}>3</span>
            <span>Selesai</span>
          </div>
        </div>

        {/* main step flow */}
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            <MergeDropZone
              onFilesSelected={handleFilesSelected}
              maxFilesText={user.plan === "free" ? "Plan Gratis: Maksimal 2 PDF" : undefined}
            />
          </div>
        )}

        {step === 2 && (
          <div className="relative">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
                <h2 className="font-bold text-lg text-on-surface">
                  Daftar File PDF ({items.length})
                </h2>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95">
                    <Plus className="w-3.5 h-3.5" />
                    Tambah PDF
                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
                    />
                  </label>
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* List with drag instructions */}
              <p className="text-xs text-on-surface-variant font-medium">
                * Tarik dan letakkan kartu file untuk mengatur ulang urutan penggabungan.
              </p>

              {/* Grid Layout - Cards on the left */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - PDF Cards */}
                <div className="lg:col-span-2 space-y-3">
                  {items.map((item, index) => (
                    <MergePDFCard
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={removeItem}
                      onMove={reorderItems}
                      onRotate={rotateItem}
                    />
                  ))}
                </div>

                {/* Right Side - Merge Summary (Sticky) */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant shadow-sm">
                      <h3 className="text-sm font-bold text-on-surface mb-4">Ringkasan</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-on-surface-variant">Total File</span>
                          <span className="text-sm font-bold text-on-surface">{items.length} PDF</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-on-surface-variant">Total Halaman</span>
                          <span className="text-sm font-bold text-on-surface">
                            {items.reduce((acc, curr) => acc + curr.pageCount, 0)} Halaman
                          </span>
                        </div>
                        <div className="border-t border-outline-variant pt-3 mt-3">
                          <button
                            onClick={mergePDFs}
                            disabled={items.length < 2 || isMerging}
                            className="w-full px-6 py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isMerging ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Menggabungkan...
                              </>
                            ) : (
                              <>
                                Gabungkan PDF
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto bg-surface-container-low border border-outline-variant p-8 rounded-3xl text-center space-y-6 shadow-md">
            <div className="w-16 h-16 bg-success-container/10 text-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-on-surface">Penggabungan Selesai!</h2>
              <p className="text-sm text-on-surface-variant font-medium">
                Berhasil menggabungkan file menjadi satu PDF utuh ({mergedPageCount} Halaman).
              </p>
            </div>

            {user.plan === "free" && (
              <div className="bg-primary/5 text-primary p-3 rounded-2xl border border-primary/10 text-xs text-left leading-relaxed">
                ℹ️ **Catatan Plan Gratis**: Halaman hasil merge berisi watermark *PDFinaja Free*. Upgrade ke Pro untuk unduhan bebas watermark.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Unduh PDF Gabungan
              </button>
              
              <button
                onClick={handleOpenInEditor}
                className="w-full py-4 border-2 border-primary text-primary hover:bg-primary/5 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                Edit & Tanda Tangani
              </button>

              <button
                onClick={clearAll}
                className="w-full py-3 text-on-surface-variant hover:text-error text-xs font-bold transition-colors cursor-pointer"
              >
                Gabungkan File Lainnya
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
