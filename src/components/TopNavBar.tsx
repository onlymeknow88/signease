"use client";

import { useESignStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  UserCircle,
  Bell,
  Settings,
  LogOut,
  Crown,
  ChevronDown,
} from "lucide-react";

export function TopNavBar() {
  const { user, logout } = useESignStore();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const navLinks = [
    { label: "Beranda",    href: "/",        icon: LayoutDashboard },
    { label: "Workspace",  href: "/app",     icon: FileText        },
    { label: "Harga",      href: "/pricing", icon: CreditCard      },
    { label: "Akun",       href: "/account", icon: UserCircle      },
  ];

  const initials = user.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <header className="bg-surface/95 backdrop-blur-sm border-b border-outline-variant sticky top-0 z-50">
      <div className="flex items-center justify-between w-full px-5 h-14 max-w-7xl mx-auto gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="6" fill="#004782"/>
            <path d="M8 8h10M8 12h10M8 16h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M16 14l2.5 2.5L22 12" stroke="#86f8c9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-sm font-bold text-primary leading-tight">SignEase</span>
            <span className="text-[9px] text-on-surface-variant leading-tight hidden md:block">
              Tanda Tangani PDF Tanpa Ribet
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all
                  ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!mounted ? (
            <div className="w-20 h-8 bg-slate-100 rounded-lg animate-pulse" />
          ) : user.loggedIn ? (
            <>
              {/* Plan badge */}
              <div className={`
                hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0
                ${user.plan === "pro"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
                }
              `}>
                <Crown className="w-3 h-3" />
                {user.plan === "pro" ? "PRO" : "FREE"}
              </div>

              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                  aria-label="Notifikasi"
                >
                  <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                  {user.plan === "free" && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-1.5 w-72 bg-white border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden animate-slide-in-up">
                    <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                      <p className="text-xs font-bold text-on-surface">Notifikasi</p>
                      <span className="text-[10px] text-primary font-semibold cursor-pointer hover:underline">
                        Tandai semua dibaca
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      {user.plan === "free" ? (
                        <div className="flex items-start gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Crown className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-on-surface">Tingkatkan ke Pro</p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                              Hapus watermark dan dapatkan akses fitur premium.
                            </p>
                            <Link
                              href="/pricing"
                              onClick={() => setNotifOpen(false)}
                              className="text-[10px] text-primary font-bold hover:underline mt-1 block"
                            >
                              Lihat paket →
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant text-center py-4">
                          Tidak ada notifikasi baru
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-container transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="text-xs font-semibold text-on-surface hidden sm:block max-w-[80px] truncate">
                    {user.name?.split(" ")[0] || "Pengguna"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-on-surface-variant transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white border border-outline-variant rounded-xl shadow-xl py-1.5 z-50 animate-slide-in-up">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-outline-variant mb-1">
                      <p className="font-bold text-sm text-on-surface truncate">{user.name}</p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">{user.email}</p>
                      <div className={`
                        inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${user.plan === "pro"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                        }
                      `}>
                        <Crown className="w-2.5 h-2.5" />
                        {user.plan === "pro" ? "Pro Member" : "Free Tier"}
                      </div>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Pengaturan Akun
                    </Link>
                    <Link
                      href="/pricing"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Paket Langganan
                    </Link>

                    <div className="border-t border-outline-variant mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-destructive hover:bg-destructive/5 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar Akun
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-semibold text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm"
              >
                Coba Gratis
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar — icons + labels */}
      <div className="md:hidden flex border-t border-outline-variant bg-surface">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors
                ${isActive
                  ? "text-primary border-t-2 border-primary bg-primary/5"
                  : "text-on-surface-variant hover:text-on-surface"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
