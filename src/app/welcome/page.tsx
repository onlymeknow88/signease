"use client";

import { useEffect, useState, useRef } from "react";
import { useESignStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Check, Upload, PenTool, Download, Play, LayoutDashboard, Gavel, Award, Cloud } from "lucide-react";

export default function WelcomePage() {
  const { user, logout } = useESignStore();
  const { status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated" && !user.loggedIn) {
        router.push("/login");
      }
    }
  }, [status, user.loggedIn, router]);

  const [activeStep, setActiveStep] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-cycle through step animations for an active experience
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      {/* Header */}
      <nav className="bg-white border-b border-outline-variant/60 py-4 px-6 w-full flex justify-between items-center z-50">
        <Link href="/" className="font-bold text-2xl text-primary tracking-tight font-heading">
          PDFinaja
        </Link>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => alert("Dokumentasi bantuan sedang disiapkan.")}
            className="p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
            title="Bantuan"
          >
            <span className="material-symbols-outlined text-[22px]">help</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-outline-variant/60 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
            >
              {user.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-outline-variant rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-outline-variant">
                  <p className="font-semibold text-sm text-on-surface truncate">{user.name || "User"}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user.email || ""}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/app"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                    Workspace
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    Pengaturan Akun
                  </Link>
                </div>
                <div className="border-t border-outline-variant py-1">
                  <button
                    onClick={() => { logout(); signOut({ callbackUrl: "/" }); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Keluar Akun
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Background Atmospheric Element */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Side: Content & Illustration */}
          <div className="lg:col-span-5 flex flex-col gap-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full w-fit shadow-sm text-xs font-bold uppercase tracking-wider">
              <Check className="w-4.5 h-4.5" />
              <span>Verifikasi Berhasil</span>
            </div>

            <h1 className="text-3xl lg:text-[44px] font-black text-primary leading-[1.1] tracking-tight font-heading">
              Selamat Datang di PDFinaja!
            </h1>
            
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
              Keamanan digital Anda adalah prioritas kami. Mari mulai menandatangani dokumen penting Anda dengan jaminan legalitas penuh dan proses yang sangat mudah.
            </p>

            {/* Illustration Box */}
            <div className="relative mt-4 group">
              <div className="absolute inset-0 bg-primary/5 rounded-2xl rotate-2 transition-transform group-hover:rotate-0"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/30">
                <img
                  alt="Digital Security Illustration"
                  className="w-full h-[280px] object-cover"
                  src="https://lh3.googleusercontent.com/aida/AP1WRLuUx8QKjsnaRiiQ7irmT0iAmnxUncp_dfKnKceXNIQ7MzC6umM9b9CtdnWDzh19kS-1MfZAdklYtyWoTsfm_pLuvs8nLwOhIOXpB6lQANf-JXKuUn5IoWVlwVVn4-JkVxJvXluLbTAGDZ_Z_GWQdLP-KBaXA17qQZN0f7razj2he9Hh2cwKfyncgvdGaKjtfA3yJSlgWmKHcR_aAON6EbaSO8WGTW3h6Vp67Zwp_Y766O9xuPmbqZzVqccD"
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-md border border-outline-variant/60 rounded-xl flex items-center gap-3 shadow-lg">
                  <div className="bg-primary text-white p-2 rounded-full">
                    <span className="material-symbols-outlined text-[20px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                      shield_with_heart
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Terenkripsi AES-256</p>
                    <p className="text-[11px] text-on-surface-variant font-medium">Dokumen Anda aman bersama kami.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Onboarding Steps & CTA */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white p-8 rounded-[24px] shadow-xl border border-outline-variant/50">
              <h2 className="text-base font-bold text-on-surface mb-6 flex items-center gap-2">
                <span>Panduan Singkat: 3 Langkah Mudah</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Step 1 */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-3 ${
                    activeStep === 0
                      ? "bg-primary/5 border-primary shadow-sm scale-[1.02]"
                      : "bg-slate-50 border-outline-variant/40 hover:bg-slate-100/50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${activeStep === 0 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>
                    1
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Unggah berkas PDF yang ingin Anda tanda tangani.
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-3 ${
                    activeStep === 1
                      ? "bg-primary/5 border-primary shadow-sm scale-[1.02]"
                      : "bg-slate-50 border-outline-variant/40 hover:bg-slate-100/50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${activeStep === 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>
                    2
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <PenTool className="w-4 h-4" />
                    <span>Sign</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Bubuhkan tanda tangan elektronik resmi Anda.
                  </p>
                </div>

                {/* Step 3 */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-3 ${
                    activeStep === 2
                      ? "bg-primary/5 border-primary shadow-sm scale-[1.02]"
                      : "bg-slate-50 border-outline-variant/40 hover:bg-slate-100/50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${activeStep === 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>
                    3
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Simpan dokumen hasil tanda tangan yang sah.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3.5">
                <Link
                  href="/app"
                  className="w-full bg-primary hover:brightness-110 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload PDF Pertama Anda</span>
                </Link>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => alert("Video tutorial sedang disiapkan.")}
                    className="flex-1 border border-primary text-primary font-bold py-3.5 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-primary text-primary" />
                    <span>Lihat Tutorial</span>
                  </button>
                  <Link
                    href="/app"
                    className="flex-1 bg-slate-50 text-on-surface-variant hover:text-primary font-bold py-3.5 rounded-xl border border-outline-variant/50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Buka Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Legal Assurance Badge */}
            <div className="flex items-center justify-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
              <div className="flex flex-col items-center gap-1.5 text-center text-on-surface">
                <Gavel className="w-6 h-6 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Legalitas Terjamin</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center text-on-surface">
                <Award className="w-6 h-6 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Sertifikat Root CA</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center text-on-surface">
                <Cloud className="w-6 h-6 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Penyimpanan Cloud</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-5 bg-slate-50 border-t border-outline-variant/60 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="text-on-surface-variant">© 2026 PDFinaja. Digital Assurance.</div>
          <div className="flex gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Keamanan</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Legal</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
