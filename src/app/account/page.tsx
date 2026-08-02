"use client";

import { useESignStore, BillingRecord } from "@/lib/store";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CertificateManager } from "@/components/CertificateManager";
import { Button } from "@/components/ui/button";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  History,
  FileDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function AccountPage() {
  const { user, billingHistory, setPlan, addBillingRecord, setBillingHistory, loadCertificates } = useESignStore();
  const { status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profileName, setProfileName] = useState(user.name || "");
  const [profileEmail, setProfileEmail] = useState(user.email || "");
  const [isSaved, setIsSaved] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status !== "loading") {
      if (status === "unauthenticated" && !user.loggedIn) {
        router.push("/login");
      }
    }
  }, [mounted, status, user.loggedIn, router]);

  useEffect(() => {
    if (user.name) setProfileName(user.name);
    if (user.email) setProfileEmail(user.email);
  }, [user.name, user.email]);

  // Fetch subscription status + billing dari DB saat mount
  useEffect(() => {
    if (!mounted || !user.loggedIn) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/subscription/status?email=${encodeURIComponent(user.email || "guest@example.com")}`);
        if (!res.ok) return;
        const data = await res.json();
        // Sync plan dari DB ke store
        if (data.plan && data.plan !== user.plan) {
          setPlan(data.plan as "free" | "pro");
        }
        // Sync billing dari DB ke store
        if (data.billingHistory) {
          const syncedHistory = data.billingHistory.map((r: any) => ({
            id: r.id || r.invoiceId,
            date: r.date,
            amount: r.amount,
            method: r.method,
            status: r.status,
          }));
          setBillingHistory(syncedHistory);
        }
      } catch {
        // silently ignore — gunakan localStorage fallback
      }
    };
    fetchStatus();
    loadCertificates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user.loggedIn]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const updatedUser = { ...user, name: profileName, email: profileEmail };
      localStorage.setItem("signease_user", JSON.stringify(updatedUser));
      setPlan(user.plan);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan langganan Pro? Semua fitur Pro akan dikunci kembali.")) return;
    setIsCancelling(true);
    try {
      const res = await apiFetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email || "guest@example.com" }),
      });
      if (res.ok) {
        setPlan("free");
      } else {
        const data = await res.json();
        alert(data.error || "Gagal membatalkan langganan. Coba lagi.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Generate and Download PDF Invoice Receipt client-side
  const handleDownloadInvoice = async (record: BillingRecord) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([550, 420]);
      const { height } = page.getSize();

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Title/Header
      page.drawText("KUITANSI PEMBAYARAN RESMI", {
        x: 40,
        y: height - 50,
        size: 16,
        font: helveticaBold,
        color: rgb(0.09, 0.27, 0.45),
      });

      page.drawText("PDFinaja Digital Assurance", {
        x: 40,
        y: height - 68,
        size: 9,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Horizontal line separator
      page.drawLine({
        start: { x: 40, y: height - 85 },
        end: { x: 510, y: height - 85 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Invoice Details
      const details = [
        ["Nomor Transaksi", record.id],
        ["Tanggal Bayar", record.date],
        ["Metode Pembayaran", record.method],
        ["Status", record.status.toUpperCase()],
        ["Nama Pelanggan", user.name],
        ["Email Pelanggan", user.email],
        ["Paket Langganan", "PDFinaja Pro Member (Bulanan)"],
        ["Jumlah Nominal", `Rp ${record.amount.toLocaleString("id-ID")}`],
      ];

      let currentY = height - 120;
      for (const [key, val] of details) {
        page.drawText(key, {
          x: 40,
          y: currentY,
          size: 10,
          font: helveticaBold,
          color: rgb(0.2, 0.2, 0.2),
        });

        page.drawText(val, {
          x: 200,
          y: currentY,
          size: 10,
          font: helveticaFont,
          color: key === "Status" ? rgb(0.1, 0.6, 0.3) : rgb(0.3, 0.3, 0.3),
        });

        currentY -= 24;
      }

      // Horizontal line separator
      page.drawLine({
        start: { x: 40, y: currentY - 10 },
        end: { x: 510, y: currentY - 10 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Disclaimer / Legal note
      page.drawText("Catatan:", {
        x: 40,
        y: currentY - 35,
        size: 9,
        font: helveticaBold,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText("Dokumen kuitansi ini sah dan diterbitkan secara digital oleh sistem penagihan lokal", {
        x: 40,
        y: currentY - 50,
        size: 8.5,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText("PDFinaja. Tidak memerlukan tanda tangan basah fisik.", {
        x: 40,
        y: currentY - 62,
        size: 8.5,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Save and Download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kuitansi_signease_${record.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal mendownload invoice", err);
      alert("Terjadi kesalahan saat membuat file PDF invoice.");
    }
  };

  if (!mounted) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-6 py-12 w-full flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-xs text-outline font-semibold">Memuat akun...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Profile & Subscription settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Profile Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Detail Profil Anda
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface font-semibold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <Button
                  type="submit"
                  className="bg-primary text-on-primary hover:brightness-110 font-bold px-6 py-2 rounded-xl text-xs"
                >
                  Simpan Perubahan
                </Button>
                {isSaved && (
                  <span className="text-xs text-secondary font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 fill-secondary text-white" />
                    Tersimpan!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Subscription Tier Info Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Paket Langganan
            </h2>

            {user.plan === "pro" ? (
              <div className="space-y-6">
                <div className="bg-secondary/5 border-2 border-secondary/20 p-4 rounded-xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">PDFinaja Pro</p>
                    <p className="font-bold text-sm text-on-surface mt-0.5">Paket Aktif & Berjalan</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      Perpanjangan otomatis berikutnya: 20 Des 2026
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                    Anda mendapatkan akses penuh ke tanda tangan tak terbatas, sertifikat integritas digital (.json), dan unduhan bebas watermark.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="w-full text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 py-5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? "Memproses..." : "Batalkan Langganan Pro"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-outline-variant/60 p-4 rounded-xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">PDFinaja Free</p>
                    <p className="font-bold text-sm text-on-surface mt-0.5">Paket Gratis</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      Batasan 1 tanda tangan per bulan
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                    Hasil download dokumen Anda saat ini menyertakan watermark. Upgrade sekarang untuk menghapusnya.
                  </p>
                  <Link
                    href="/pricing"
                    className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-primary/20 transition-all text-center"
                  >
                    Upgrade ke Pro Member
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Certificate Manager Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <CertificateManager />
          </div>
        </div>

        {/* Right Side: Billing Invoice History */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm h-full">
            <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Riwayat Tagihan / Kuitansi
            </h2>

            {billingHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 text-on-surface-variant space-y-2">
                <AlertCircle className="w-10 h-10 text-outline" />
                <p className="text-sm font-semibold">Belum Ada Transaksi</p>
                <p className="text-xs text-outline">Anda belum melakukan pembayaran berlangganan apapun.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-outline font-semibold">
                  Klik ikon download pada kuitansi untuk mengunduh berkas tanda terima digital (.pdf).
                </p>
                <div className="divide-y divide-outline-variant/60">
                  {billingHistory.map((record) => (
                    <div
                      key={record.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-xs text-on-surface">{record.id}</span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider">
                            {record.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">
                          Rp {record.amount.toLocaleString("id-ID")} • {record.method}
                        </p>
                        <p className="text-[10px] text-outline">{record.date}</p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(record)}
                        className="self-start sm:self-center border-outline-variant text-primary hover:bg-primary/5 flex items-center gap-1.5 h-9 font-semibold text-xs rounded-xl"
                      >
                        <FileDown className="w-4 h-4" />
                        Kuitansi PDF
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
