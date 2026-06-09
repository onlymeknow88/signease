"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="bg-background min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="w-full py-6 px-6 flex justify-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[32px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
          <span className="text-2xl font-bold tracking-tight text-primary font-heading">SignEase</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 pb-12">
        <div className="max-w-[440px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white border border-outline-variant rounded-2xl p-8 shadow-xl relative overflow-hidden">
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${success ? "bg-secondary" : "bg-gradient-to-r from-primary to-primary-container"}`}></div>

            {!success ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-primary mb-4 border border-outline-variant/50">
                    <span className="material-symbols-outlined text-[32px]">lock_reset</span>
                  </div>
                  <h1 className="text-2xl font-bold text-on-background font-heading mb-1.5">Lupa Kata Sandi?</h1>
                  <p className="text-xs text-on-surface-variant leading-relaxed px-2">
                    Masukkan email Anda untuk menerima tautan pemulihan kata sandi.
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block px-1" htmlFor="email">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4.5 h-4.5" />
                      <input
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 text-on-surface"
                        id="email"
                        type="email"
                        required
                        placeholder="nama@perusahaan.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    className="w-full py-3 px-6 bg-primary text-white font-bold rounded-xl shadow-md hover:brightness-110 active:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim Tautan</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-outline-variant/60 text-center">
                  <Link
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container transition-colors group"
                    href="/login"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    <span>Kembali ke Login</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-4 animate-in zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary-container/20 text-secondary mb-6 border border-secondary-container/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <h1 className="text-2xl font-bold text-on-background font-heading mb-3">Email Terkirim!</h1>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-8 px-4">
                  Kami telah mengirimkan instruksi pemulihan kata sandi ke <strong>{email}</strong>.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        setSuccess(true);
                      }, 1000);
                    }}
                    className="w-full py-3 px-6 bg-primary text-white font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer text-sm"
                  >
                    Kirim Ulang Email
                  </button>
                  <Link
                    href="/login"
                    className="block py-3 text-xs font-bold text-primary hover:underline transition-all"
                  >
                    Kembali ke Login
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Certs */}
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-[10px] text-outline font-semibold">
              Butuh bantuan teknis? <a className="text-primary hover:underline font-bold" href="#">Hubungi Dukungan</a>
            </p>
            <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
              <img
                className="h-6"
                alt="ISO 27001"
                src="https://lh3.googleusercontent.com/aida/AP1WRLsK0B7_Y6VIOkvcZM_fpvTiSD0tqchA6J9qlx1aqs-n7rkoGs7xMCnsAK7k9hWRP5c2K9yXMUfVu0rIImVh7P9XwWrcb8qYXvev1LCCjA3baxvlzlgluzE4Q1KXg4dGjYE2IbpBV-EmlDOANGv0lqHoOTgAzSpCKPgHmLqM90i1LL4f60AbAqYt1A38CrSKjLOXzvacq5FHArRpEfZJ122THERK-sEy4PNFDRiLuPbZ7ppb6DuFyNNp-Lo"
              />
              <img
                className="h-6"
                alt="AES-256 Encryption"
                src="https://lh3.googleusercontent.com/aida/AP1WRLuuok7uyGJip5IHqRH0vpfYumPtrsiekqvCuEt_ExT5UcnqjoMHb_FUMvRk7f58PEvI0_Iaz00nW5KZE9J84HDXEBliWBylLk15tQD46FoNLCVbEeekpy49FbqxfcsVQ2gWhfQcxJ5fOBGHf20d8B4-bgHvr-PzHaT5qOJWgL_lHQH9mElY7P_uunbmFBbxARrn6vE14KWiDuCZU7uvmyeEw9EeuwIa4jWZVAyFCE2JzKI-sJCClm3znRXQ"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-5 flex flex-col md:flex-row justify-between items-center px-6 border-t border-outline-variant/30 bg-slate-50/50 text-xs">
        <div className="text-on-surface-variant mb-2 md:mb-0">
          © 2026 SignEase Digital Assurance. Secure & Legally Binding.
        </div>
        <div className="flex gap-6">
          <a className="text-on-surface-variant hover:text-primary underline transition-all" href="#">Privacy Policy</a>
          <a className="text-on-surface-variant hover:text-primary underline transition-all" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
