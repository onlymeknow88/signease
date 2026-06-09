"use client";

import { useState, useEffect } from "react";
import { useESignStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, user } = useESignStore();
  const { status } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" || user.loggedIn) {
      router.push("/app");
    }
  }, [status, user.loggedIn, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Google SSO Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    signIn("credentials", {
      redirect: false,
      email: email,
      password: password,
    })
      .then((res) => {
        if (res?.error) {
          setError(res.error || "Email atau kata sandi salah, atau akun belum terverifikasi.");
          setLoading(false);
        } else {
          login("User", email, "email");
          router.push("/app");
        }
      })
      .catch((err) => {
        setError("Gagal menghubungi server. Silakan coba lagi.");
        setLoading(false);
      });
  };

  const handleGoogleSSO = (name: string, selectedEmail: string) => {
    setSsoLoading(selectedEmail);
    setTimeout(() => {
      login(name, selectedEmail, "google");
      setShowGoogleModal(false);
      setSsoLoading(null);
      router.push("/app");
    }, 1500);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-between overflow-x-hidden font-sans">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-4 max-w-7xl mx-auto z-50">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[32px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            draw
          </span>
          <span className="text-2xl font-bold tracking-tight text-primary font-heading">SignEase</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">Bantuan</a>
          <a className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">Tentang Kami</a>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-grow flex items-center justify-center w-full px-6 py-10 relative">
        {/* Background Subtle Gradient Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary-container/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-[440px] z-10">
          <div className="bg-white border border-outline-variant/60 rounded-2xl p-8 md:p-10 shadow-xl transition-all duration-300">
            {/* Header Text */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-on-surface mb-2 font-heading">Selamat Datang Kembali</h1>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Lanjutkan proses penandatanganan dokumen Anda dengan aman.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block px-1" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <input
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 text-on-surface"
                    id="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block px-1" htmlFor="password">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 text-on-surface"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-on-surface-variant group-hover:text-on-surface transition-colors">Ingat Saya</span>
                </label>
                <Link className="font-bold text-primary hover:underline" href="/forgot-password">
                  Lupa Kata Sandi?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-75 disabled:pointer-events-none cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] flex-grow bg-outline-variant/60"></div>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Atau masuk dengan</span>
              <div className="h-[1px] flex-grow bg-outline-variant/60"></div>
            </div>

            {/* SSO Button */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/app" })}
              className="w-full flex items-center justify-center gap-3 border border-outline-variant/80 py-3 rounded-xl text-sm font-semibold text-on-surface hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 cursor-pointer bg-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Masuk dengan Google</span>
            </button>

            {/* Signup Link */}
            <div className="mt-6 text-center text-xs">
              <p className="text-on-surface-variant">
                Belum punya akun?{" "}
                <Link className="text-primary font-bold hover:underline" href="/register">
                  Daftar Sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 border-t border-outline-variant/30 bg-slate-50/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-on-surface-variant">© 2026 SignEase Inc. Legal Weight & Frictionless Efficiency.</p>
          <div className="flex gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Kebijakan Privasi</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Ketentuan Layanan</a>
          </div>
        </div>
      </footer>

      {/* Google SSO Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/60 flex flex-col items-center text-center">
              <img
                alt="Google"
                className="w-12 h-12 mb-3"
                src="https://lh3.googleusercontent.com/aida/AP1WRLsZrIXPZHnsf9rhMqiYEbf2TGOR4RUtH5pqWJaf2y9tOWVEV7Ujd0hXxNoKaXlZTvxh4d2vHw1V6bc3wGLbhFlG1E0YZuBHtsL_w1igLPOJt-yZlvah9moG3Xwg2dH0ZwRnMihvv_aGsZjTQvqn6sdB5f8toEjFAMt2OCUsBM7Xd87yWCN6IgWPCQnsAW0ExPXg2XA4AUvLVVBINO7i7WpMA8MGxnOmkV0G0x9hD_9wUMplmVxZws08Mcf8"
              />
              <h3 className="font-bold text-base text-on-surface">Pilih Akun Google</h3>
              <p className="text-xs text-on-surface-variant mt-1">untuk melanjutkan ke SignEase</p>
            </div>

            <div className="p-4 space-y-2 bg-slate-50/50 max-h-[300px] overflow-y-auto">
              {[
                { name: "Felix Ardiansyah", email: "felix.ardiansyah@corporate.com" },
                { name: "Budi Santoso", email: "budi.santoso@gmail.com" },
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleGoogleSSO(acc.name, acc.email)}
                  disabled={ssoLoading !== null}
                  className="w-full flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-outline-variant/60 rounded-xl transition-all cursor-pointer text-left disabled:opacity-60"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {acc.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{acc.name}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{acc.email}</p>
                  </div>
                  {ssoLoading === acc.email && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                </button>
              ))}

              <button
                onClick={() => {
                  const customName = prompt("Masukkan nama lengkap Google Anda:");
                  const customEmail = prompt("Masukkan alamat email Google Anda:");
                  if (customName && customEmail) {
                    handleGoogleSSO(customName, customEmail);
                  }
                }}
                disabled={ssoLoading !== null}
                className="w-full flex items-center justify-center p-3 bg-white hover:bg-slate-50 border border-dashed border-outline-variant rounded-xl transition-all cursor-pointer text-xs font-semibold text-primary disabled:opacity-60"
              >
                <span>Gunakan akun lain</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-t border-outline-variant/60 flex justify-end">
              <button
                onClick={() => setShowGoogleModal(false)}
                disabled={ssoLoading !== null}
                className="px-4 py-2 border border-outline-variant/85 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-white transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
