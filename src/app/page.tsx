"use client";

import { useESignStore } from "@/lib/store";
import { DropZone } from "@/components/DropZone";
import { MainLayout } from "@/components/layouts/MainLayout";
import Link from "next/link";
import {
  ChevronRight,
  Play,
  Shield,
  Zap,
  Gift,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useESignStore();

  return (
    <MainLayout>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-24 md:pb-32 bg-background">
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              100% Client-Side PDF Signer
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-on-surface leading-[1.1] tracking-tight font-sans">
              Tanda Tangani PDF <br />
              <span className="text-primary bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                Tanpa Ribet
              </span>
            </h1>
            
            <p className="text-on-surface-variant font-normal text-base md:text-lg max-w-xl leading-relaxed">
              100% Client-Side. File Anda tidak pernah meninggalkan browser. Aman, Cepat, dan Gratis. Digital assurance for the modern world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/app"
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 group text-center"
              >
                Coba Gratis (Sign)
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/merge"
                className="border-2 border-outline-variant text-on-surface px-8 py-4 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 text-center"
              >
                Gabungkan PDF
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-outline-variant/60 max-w-md">
              <div>
                <p className="text-xl font-black text-primary">0%</p>
                <p className="text-xs text-outline font-semibold">Data Leakage</p>
              </div>
              <div>
                <p className="text-xl font-black text-primary">100%</p>
                <p className="text-xs text-outline font-semibold">Client-Side</p>
              </div>
              <div>
                <p className="text-xl font-black text-primary">SHA-256</p>
                <p className="text-xs text-outline font-semibold">Integrity Hash</p>
              </div>
            </div>
          </div>

          {/* Right Column: DropZone Widget with Mockup Frame & Overlay */}
          <div className="lg:col-span-5 relative group">
            {/* Glow decoration */}
            <div className="absolute -inset-4 bg-primary/5 rounded-[40px] blur-2xl group-hover:bg-primary/10 transition-all duration-300 pointer-events-none"></div>
            
            {/* Frame mockup */}
            <div className="relative bg-white p-6 rounded-[32px] shadow-2xl border border-outline-variant transition-transform duration-500 hover:translate-y-[-4px]">
              <DropZone />

              {/* Floating UI Badge Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-outline-variant flex items-center gap-3 z-20 select-none">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-[20px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Client-Side Verified</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">AES-256 Encryption Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Trust Bar ── */}
      <section className="bg-surface-container-low py-8 border-y border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">picture_as_pdf</span>
            <span className="font-sans text-lg font-black tracking-tighter">PDF Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">lock</span>
            <span className="font-sans text-lg font-black tracking-tighter">SecureLock</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">gavel</span>
            <span className="font-sans text-lg font-black tracking-tighter">LegalGuard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">cloud_off</span>
            <span className="font-sans text-lg font-black tracking-tighter">OfflineFirst</span>
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-black text-on-surface tracking-tight font-sans">
              Keamanan Tanpa Kompromi
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Solusi tanda tangan digital yang memprioritaskan kedaulatan data Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-[24px] bg-surface-container-low border border-outline-variant hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">visibility_off</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Privasi Total</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                File Anda tidak pernah dikirim ke server kami. Semua pemrosesan dilakukan secara lokal di browser Anda untuk privasi maksimal.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-[24px] bg-white border border-outline-variant shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">bolt</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Super Cepat</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Tanpa antrian upload, tanpa delay download. Sign dan download kembali dokumen Anda dalam hitungan detik.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-[24px] bg-surface-container-low border border-outline-variant hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">card_giftcard</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Gratis Selamanya</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Nikmati fitur dasar tanda tangan PDF tanpa biaya apapun. Kami percaya keamanan dokumen adalah hak setiap orang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section className="py-24 bg-surface-bright relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-black text-on-surface tracking-tight font-sans">
              Pilih Paket Sesuai Kebutuhan
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Skalabel dari penggunaan pribadi hingga tim profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-10 rounded-[32px] border border-outline-variant shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <span className="text-secondary font-bold text-xs uppercase tracking-widest block">Personal</span>
                  <h3 className="text-4xl font-black text-on-surface mt-2">Gratis</h3>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-on-surface-variant font-medium">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <span>1 Tanda Tangan per bulan</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <span>E-Signature Standar</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <span>100% Pemrosesan Lokal</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/app"
                className="w-full py-4 rounded-xl border-2 border-primary text-primary font-bold text-sm text-center hover:bg-surface-container-low transition-colors"
              >
                Mulai Sekarang
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-on-background p-10 rounded-[32px] border border-outline text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
                Best Value
              </div>
              <div>
                <div className="mb-6">
                  <span className="text-secondary-fixed font-bold text-xs uppercase tracking-widest block">Enterprise Ready</span>
                  <h3 className="text-4xl font-black text-white mt-2">
                    Rp 149.000<span className="text-xs font-semibold text-surface-variant">/bln</span>
                  </h3>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-surface-variant font-medium">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-fixed shrink-0" />
                    <span>Unlimited Signatures</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-fixed shrink-0" />
                    <span>Custom Digital Certificate (SHA-256)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary-fixed shrink-0" />
                    <span>Priority Support 24/7</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="w-full py-4 rounded-xl bg-primary-container text-white font-bold text-sm text-center hover:brightness-110 shadow-lg group-hover:scale-[1.01] transition-transform"
              >
                Daftar Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary-container rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
            <div
              className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            ></div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
                Siap Tanda Tangan Secara Aman?
              </h2>
              <p className="text-sm md:text-base opacity-90 leading-relaxed">
                Bergabunglah dengan ribuan pengguna yang telah beralih ke cara menandatangani dokumen yang lebih privat dan efisien.
              </p>
              <div className="pt-2">
                <Link
                  href="/app"
                  className="inline-block bg-white text-primary px-8 py-4 rounded-full font-bold text-sm hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Mulai Sekarang - Gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
