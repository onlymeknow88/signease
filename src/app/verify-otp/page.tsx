"use client";

import { useState, useEffect, useRef } from "react";
import { useESignStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

export default function VerifyOtpPage() {
  const { login } = useESignStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "user@example.com";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setResendDisabled(false);
    }
  }, [resendTimer]);

  const handleChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) return;

    const newOtp = [...otp];
    newOtp[index] = cleanValue.substring(cleanValue.length - 1);
    setOtp(newOtp);

    // Focus next input if not the last one
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      setErrorMessage("");
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").substring(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = () => {
    setResendTimer(60);
    setResendDisabled(true);
    setErrorMessage("");

    const tempUserJson = sessionStorage.getItem("signease_temp_register");
    if (!tempUserJson) {
      setErrorMessage("Data registrasi tidak ditemukan. Silakan daftar kembali.");
      return;
    }

    try {
      const tempUser = JSON.parse(tempUserJson);

      fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tempUser.name, email: tempUser.email, password: tempUser.password }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setErrorMessage(data.error);
          } else {
            if (data.devMode) {
              alert(`[DEV MODE] Kode OTP Baru Anda: ${data.otp}`);
            } else {
              alert("Kode OTP baru telah dikirimkan ke email Anda.");
            }
          }
        })
        .catch((err) => {
          setErrorMessage("Gagal mengirim ulang OTP. Silakan coba lagi.");
        });
    } catch (e) {
      setErrorMessage("Gagal memproses data registrasi.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMessage("Kode OTP harus terdiri dari 6 digit.");
      return;
    }

    setLoading(true);

    fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: fullOtp }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error);
          setLoading(false);
        } else {
          // Clear temp registration session
          sessionStorage.removeItem("signease_temp_register");
          
          // Log user in
          login(data.user.name, data.user.email, "email");
          
          // Redirect to onboarding page
          router.push("/welcome");
        }
      })
      .catch((err) => {
        setErrorMessage("Gagal memverifikasi OTP. Silakan coba lagi.");
        setLoading(false);
      });
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-center items-center">
        <Link href="/" className="text-2xl font-bold text-primary tracking-tight font-heading">
          SignEase
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-10 relative overflow-hidden">
        {/* Background Atmospheric Element */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-fixed/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-secondary-container/20 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Verification Card */}
        <section className="max-w-[480px] w-full bg-white/95 backdrop-blur-md border border-outline-variant/60 rounded-2xl p-8 md:p-10 shadow-2xl relative z-10 animate-fade-in">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary-fixed/30 flex items-center justify-center rounded-full mb-4 text-primary">
              <span className="material-symbols-outlined text-[32px] font-bold">shield_person</span>
            </div>
            <h1 className="text-2xl font-bold text-on-background font-heading mb-2">Verifikasi Kode OTP</h1>
            <p className="text-xs text-on-surface-variant max-w-[340px] leading-relaxed">
              Kami telah mengirimkan kode verifikasi 6-digit ke <strong className="text-on-surface font-semibold break-all">{email}</strong>.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {errorMessage && (
              <p className="text-center text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl font-medium">
                {errorMessage}
              </p>
            )}

            <div className="flex justify-between gap-2.5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-xl font-black bg-slate-50 border border-outline-variant/70 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white rounded-xl transition-all"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:brightness-110 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Verifikasi</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              <div className="text-center text-xs">
                <p className="text-on-surface-variant">
                  Tidak menerima kode?{" "}
                  {resendDisabled ? (
                    <span className="text-outline font-semibold">Kirim Ulang ({resendTimer}s)</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-primary font-bold hover:underline transition-all cursor-pointer bg-transparent border-none p-0"
                    >
                      Kirim Ulang Kode
                    </button>
                  )}
                </p>
              </div>
            </div>
          </form>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-outline-variant/60 flex justify-center items-center gap-6 text-outline font-medium text-[10px] select-none">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-5 flex flex-col md:flex-row justify-between items-center px-6 border-t border-outline-variant/30 bg-slate-50 text-xs">
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
