"use client";

import { useESignStore } from "@/lib/store";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Building,
  Info,
  Loader2,
  Lock,
} from "lucide-react";

export default function PricingPage() {
  const { user, setPlan, addBillingRecord } = useESignStore();
  const router = useRouter();

  // Dialog State
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"method" | "loading" | "success">("method");
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card");

  const handleSelectFree = () => {
    setPlan("free");
    router.push("/app");
  };

  const handleStartPayment = () => {
    setShowCheckout(true);
    setCheckoutStep("method");
  };

  const handleConfirmPayment = () => {
    setCheckoutStep("loading");
    // Simulate payment processing
    setTimeout(() => {
      setPlan("pro");
      addBillingRecord(149000, paymentMethod);
      setCheckoutStep("success");
    }, 2000);
  };

  const handleCheckoutClose = () => {
    setShowCheckout(false);
    if (checkoutStep === "success") {
      router.push("/account");
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-primary mb-4">
            Pilih Paket yang Sesuai untuk Anda
          </h1>
          <p className="text-on-surface-variant max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Keamanan dokumen digital Anda adalah prioritas utama kami. Hubungkan tanda tangan Anda dengan perlindungan hukum yang valid.
          </p>
        </section>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border border-outline-variant rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group duration-300">
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">Personal</span>
                <h2 className="text-3xl font-extrabold text-on-surface mt-1">Free</h2>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-on-surface">Rp 0</span>
                  <span className="text-on-surface-variant text-xs font-medium">/bulan</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 text-sm text-on-surface-variant font-medium">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] fill-secondary">check_circle</span>
                  <span>5 Dokumen per bulan</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] fill-secondary">check_circle</span>
                  <span>E-Signature Standar</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] fill-secondary">check_circle</span>
                  <span>100% Pemrosesan Lokal</span>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={handleSelectFree}
              className={`w-full py-6 rounded-xl border-primary text-primary font-bold ${
                user.plan === "free" ? "bg-primary/5 cursor-default" : "hover:bg-primary/5"
              }`}
            >
              {user.plan === "free" ? "Paket Aktif Anda" : "Mulai Gratis"}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-white border-2 border-primary-container rounded-2xl p-8 flex flex-col justify-between shadow-xl overflow-hidden hover:scale-[1.01] transition-all duration-300">
            <div className="absolute top-0 right-0 bg-primary-container text-on-primary px-4 py-1.5 rounded-bl-xl font-bold text-[10px] tracking-wider uppercase">
              Paling Populer
            </div>

            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Enterprise Ready</span>
                <h2 className="text-3xl font-extrabold text-on-surface mt-1">Pro</h2>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-on-surface">Rp 149.000</span>
                  <span className="text-on-surface-variant text-xs font-medium">/bulan</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 text-sm text-on-surface-variant font-medium">
                <li className="flex items-center gap-3 font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-secondary text-[20px] fill-secondary">check_circle</span>
                  <span>Unlimited Signatures</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] fill-secondary">check_circle</span>
                  <span>Custom Digital Certificate (SHA-256)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] fill-secondary">check_circle</span>
                  <span>Unduh Bersih (Tanpa Watermark)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] fill-secondary">check_circle</span>
                  <span>Prioritas Bantuan 24/7</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleStartPayment}
              className={`w-full py-6 rounded-xl bg-primary text-on-primary font-bold hover:brightness-110 shadow-lg shadow-primary/20 ${
                user.plan === "pro" ? "bg-secondary hover:brightness-100 cursor-default shadow-none" : ""
              }`}
            >
              {user.plan === "pro" ? "Paket Pro Aktif" : "Berlangganan Sekarang"}
            </Button>
          </div>
        </div>

        {/* Detail Comparison Table */}
        <section className="mt-16 max-w-4xl mx-auto overflow-x-auto">
          <h3 className="text-xl font-bold text-center mb-8">Perbandingan Fitur Detail</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-outline-variant text-left">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-outline">Fitur</th>
                <th className="py-4 px-6 text-center text-xs font-bold uppercase tracking-wider text-outline">Free</th>
                <th className="py-4 px-6 text-center text-xs font-bold uppercase tracking-wider text-primary">Pro</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-6 font-medium text-on-surface">Client-Side PDF Signing</td>
                <td className="py-4 px-6 text-center text-secondary">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-secondary fill-secondary-container" />
                </td>
                <td className="py-4 px-6 text-center text-secondary">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-secondary fill-secondary-container" />
                </td>
              </tr>
              <tr className="border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-6 font-medium text-on-surface">Unlimited signatures</td>
                <td className="py-4 px-6 text-center">
                  <XCircle className="w-5 h-5 mx-auto text-destructive" />
                </td>
                <td className="py-4 px-6 text-center text-secondary">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-secondary fill-secondary-container" />
                </td>
              </tr>
              <tr className="border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-6 font-medium text-on-surface">Unduh Bebas Watermark</td>
                <td className="py-4 px-6 text-center">
                  <XCircle className="w-5 h-5 mx-auto text-destructive" />
                </td>
                <td className="py-4 px-6 text-center text-secondary">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-secondary fill-secondary-container" />
                </td>
              </tr>
              <tr className="border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-6 font-medium text-on-surface">Custom Digital Certificate (.json)</td>
                <td className="py-4 px-6 text-center">
                  <XCircle className="w-5 h-5 mx-auto text-destructive" />
                </td>
                <td className="py-4 px-6 text-center text-secondary">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-secondary fill-secondary-container" />
                </td>
              </tr>
              <tr className="border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-6 font-medium text-on-surface">Official Seal Visual Badge</td>
                <td className="py-4 px-6 text-center">
                  <XCircle className="w-5 h-5 mx-auto text-destructive" />
                </td>
                <td className="py-4 px-6 text-center text-secondary">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-secondary fill-secondary-container" />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Reassurance visual anchor */}
        <section className="mt-20 p-8 md:p-12 border-2 border-dashed border-primary/45 bg-primary/[0.02] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h4 className="text-xl font-bold text-primary mb-2">Jaminan Privasi Penuh</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Kami tidak memproses, menganalisis, atau menyimpan salinan dokumen Anda. Semua hashing kriptografis SHA-256 dan modifikasi visual dilakukan di memory sandbox lokal browser Anda.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-on-surface">Verified GDPR Compliant</span>
          </div>
        </section>
      </div>

      {/* ── Midtrans Payment Gateway Dialog Simulator ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant animate-in zoom-in-95 duration-200">
            {/* Midtrans Simulator Header */}
            <div className="bg-[#1D2B44] text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-[10px] font-bold">
                  SE
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Midtrans Sandbox</h3>
                  <p className="text-[9px] text-[#A0AEC0] font-medium">Secured payment portal</p>
                </div>
              </div>
              <button
                onClick={handleCheckoutClose}
                className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Merchant info */}
            <div className="bg-slate-50 border-b border-outline-variant/60 px-5 py-4 flex justify-between items-center text-xs">
              <div>
                <p className="text-[10px] text-outline font-bold uppercase">Pembayaran ke</p>
                <p className="font-bold text-[#1D2B44] mt-0.5">SignEase Digital Assurance</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-outline font-bold uppercase">Total Tagihan</p>
                <p className="font-extrabold text-primary text-sm mt-0.5">Rp 149.000</p>
              </div>
            </div>

            {/* Steps Rendering */}
            {checkoutStep === "method" && (
              <div className="p-5 flex-grow space-y-4">
                <p className="text-xs font-semibold text-[#1D2B44] mb-1">Pilih Metode Pembayaran</p>

                {/* Credit Card */}
                <button
                  onClick={() => setPaymentMethod("Credit Card")}
                  className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                    paymentMethod === "Credit Card"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-outline-variant/60 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1D2B44]">Kartu Kredit / Debit</p>
                    <p className="text-[10px] text-outline mt-0.5">Visa, Mastercard, JCB</p>
                  </div>
                </button>

                {/* GoPay */}
                <button
                  onClick={() => setPaymentMethod("GoPay Wallet")}
                  className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                    paymentMethod === "GoPay Wallet"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-outline-variant/60 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1D2B44]">GoPay / QRIS</p>
                    <p className="text-[10px] text-outline mt-0.5">Bayar instan via aplikasi dompet digital</p>
                  </div>
                </button>

                {/* Bank Transfer */}
                <button
                  onClick={() => setPaymentMethod("Bank Transfer Virtual Account")}
                  className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                    paymentMethod === "Bank Transfer Virtual Account"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-outline-variant/60 hover:bg-slate-50"
                  }`}
                >
                  <Building className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1D2B44]">Virtual Account (Transfer Bank)</p>
                    <p className="text-[10px] text-outline mt-0.5">Mandiri, BCA, BNI, BRI</p>
                  </div>
                </button>

                <div className="pt-2">
                  <Button
                    onClick={handleConfirmPayment}
                    className="w-full bg-[#185FA5] hover:brightness-110 text-white font-bold py-6 rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    Bayar Sekarang
                  </Button>
                </div>
              </div>
            )}

            {checkoutStep === "loading" && (
              <div className="p-8 flex-grow flex flex-col items-center justify-center text-center space-y-4 min-h-[260px]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div>
                  <p className="font-bold text-sm text-[#1D2B44]">Memproses Transaksi Anda</p>
                  <p className="text-[11px] text-outline mt-1 leading-normal max-w-[220px] mx-auto">
                    Mohon tunggu sebentar, kami sedang melakukan sinkronisasi dengan payment processor.
                  </p>
                </div>
              </div>
            )}

            {checkoutStep === "success" && (
              <div className="p-8 flex-grow flex flex-col items-center justify-center text-center space-y-4 min-h-[260px] animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[40px]">check_circle</span>
                </div>
                <div>
                  <p className="font-bold text-base text-[#1D2B44]">Pembayaran Berhasil!</p>
                  <p className="text-xs text-secondary font-bold uppercase tracking-wider mt-0.5">
                    Pro Plan Diaktifkan
                  </p>
                  <p className="text-[10px] text-outline mt-2 leading-normal max-w-[200px] mx-auto">
                    Akun Anda telah diupgrade ke Pro. Riwayat tagihan dan kuitansi dapat diakses di menu akun Anda.
                  </p>
                </div>
                <div className="pt-2 w-full">
                  <Button
                    onClick={handleCheckoutClose}
                    className="w-full bg-primary hover:brightness-110 text-on-primary font-bold py-5 rounded-xl text-xs"
                  >
                    Masuk Dashboard Akun
                  </Button>
                </div>
              </div>
            )}

            {/* Midtrans Simulator Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-outline-variant/60 flex justify-between items-center text-[9px] text-outline shrink-0">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">lock</span>
                Encrypted Connection
              </span>
              <span>Powered by Midtrans</span>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
