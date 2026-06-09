"use client";

import { useState, useEffect } from "react";
import { useESignStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, AlertCircle, ShieldAlert, Check } from "lucide-react";

export default function RegisterPage() {
  const { login, user } = useESignStore();
  const { status } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" || user.loggedIn) {
      router.push("/app");
    }
  }, [status, user.loggedIn, router]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Google SSO Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Kata sandi minimal harus 8 karakter.");
      return;
    }

    if (!acceptTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.");
      return;
    }

    setLoading(true);

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fullName, email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
        } else {
          // Store temporary details in sessionStorage
          const tempUser = {
            name: fullName,
            email: email,
            password: password,
          };
          sessionStorage.setItem("signease_temp_register", JSON.stringify(tempUser));
          
          if (data.devMode) {
            alert(`[DEV MODE] Kode OTP Anda: ${data.otp}`);
          }
          
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
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
      // For SSO, we automatically register them (add to registered users if not present)
      const registeredUsersJson = localStorage.getItem("signease_registered_users");
      const registeredUsers = registeredUsersJson ? JSON.parse(registeredUsersJson) : [];
      const userExists = registeredUsers.some((u: any) => u.email.toLowerCase() === selectedEmail.toLowerCase());
      
      if (!userExists) {
        registeredUsers.push({
          name: name,
          email: selectedEmail,
          password: "", // SSO users don't have passwords
        });
        localStorage.setItem("signease_registered_users", JSON.stringify(registeredUsers));
      }

      login(name, selectedEmail, "google");
      setShowGoogleModal(false);
      setSsoLoading(null);
      // SSO goes straight to welcome onboarding since they verified via Google
      router.push("/welcome");
    }, 1500);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto bg-transparent z-10">
        <Link href="/" className="text-2xl font-bold text-primary tracking-tight font-heading">
          SignEase
        </Link>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span>Butuh bantuan?</span>
          <a className="text-primary font-bold hover:underline" href="#">Hubungi Kami</a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/60">
          {/* Left Side: Brand Panel */}
          <div className="hidden md:flex flex-col justify-center p-10 bg-primary-container relative overflow-hidden text-white">
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-bold font-heading leading-tight max-w-[360px]">
                Keamanan Digital Tanpa Batas.
              </h2>
              <p className="text-sm text-primary-fixed/90 leading-relaxed max-w-[360px]">
                Bergabunglah dengan ribuan profesional yang mempercayai SignEase untuk tanda tangan elektronik yang aman dan berkekuatan hukum.
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary-fixed text-2xl font-bold">verified_user</span>
                  <span className="font-semibold text-sm">Tanda Tangan Terenkripsi</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary-fixed text-2xl font-bold">gavel</span>
                  <span className="font-semibold text-sm">Legal & Mengikat</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary-fixed text-2xl font-bold">speed</span>
                  <span className="font-semibold text-sm">Proses Instan</span>
                </div>
              </div>
            </div>

            {/* Abstract Shapes Decoration */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-secondary-fixed opacity-10 rounded-full blur-3xl"></div>
            
            {/* Background workspace overlay image with blend mode */}
            <img
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
              alt="Workspace"
              src="https://lh3.googleusercontent.com/aida/AP1WRLtTDh5QddZ9w1LO5oB_4esMf3UjpsX4PrOTrlg5ba29q1QXQ4w-x2CVH22CQBJ_yTZEkf1ff1oI3jnWC1zNmjlgQ181rVC9pZWl2nv7mroaMAz9OGUERMxdjjAav-kfWs-QGor2rBmfbSrTsf-ibgL205Bzd7uSfD35U1NkqUky94YKoO3j_nIhjVDPURX0-DmmUDjV-WK76xLWFI_DXN0ChBUBcdRti2VTU2SolwxVSEkdW1pxBp-t4jHd"
            />
          </div>

          {/* Right Side: Form Panel */}
          <div className="p-8 md:p-10 flex flex-col justify-center bg-white">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-on-surface mb-1 font-heading">Daftar Akun Baru</h1>
              <p className="text-xs text-on-surface-variant">Mulai perjalanan efisiensi dokumen Anda hari ini.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="full_name">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 text-on-surface"
                    id="full_name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="email">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 text-on-surface"
                    id="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="password">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 text-on-surface"
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant px-1 mt-0.5">
                  Minimal 8 karakter dengan kombinasi angka.
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 py-2">
                <input
                  className="mt-1 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer w-4 h-4"
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label className="text-xs text-on-surface-variant leading-relaxed cursor-pointer select-none" htmlFor="terms">
                  Saya setuju dengan{" "}
                  <a className="text-primary font-bold hover:underline" href="#">
                    Syarat & Ketentuan
                  </a>{" "}
                  serta{" "}
                  <a className="text-primary font-bold hover:underline" href="#">
                    Kebijakan Privasi
                  </a>{" "}
                  SignEase.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mempersiapkan OTP...</span>
                  </>
                ) : (
                  "Buat Akun"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/60"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-on-surface-variant font-semibold">Atau daftar dengan</span>
              </div>
            </div>

            {/* SSO Button */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/welcome" })}
              className="w-full py-3 bg-white border border-outline-variant/80 text-on-surface rounded-xl font-semibold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Daftar dengan Google</span>
            </button>

            {/* Login Redirect */}
            <div className="mt-6 text-center text-xs">
              <p className="text-on-surface-variant">
                Sudah punya akun?{" "}
                <Link className="text-primary font-bold hover:underline" href="/login">
                  Masuk
                </Link>
              </p>
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
          <a className="text-on-surface-variant hover:text-primary underline transition-all duration-200" href="#">Privacy Policy</a>
          <a className="text-on-surface-variant hover:text-primary underline transition-all duration-200" href="#">Terms of Service</a>
        </div>
      </footer>

      {/* Google SSO Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/60 flex flex-col items-center text-center">
              <svg className="w-12 h-12 mb-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h3 className="font-bold text-base text-on-surface">Daftar Akun Google</h3>
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
