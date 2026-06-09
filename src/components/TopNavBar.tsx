"use client";

import { useESignStore } from "@/lib/store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

export function TopNavBar() {
  const { user, logout } = useESignStore();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Workspace", href: "/app" },
    { label: "Pricing", href: "/pricing" },
    { label: "Account", href: "/account" },
  ];

  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-50 shadow-sm">
      <div className="flex justify-between items-center w-full px-6 h-20 max-w-7xl mx-auto">
        {/* Left side: Brand Logo */}
        <div className="flex items-center gap-12">
          <Link href="/" className="font-sans text-2xl font-bold text-primary tracking-tight">
            SignEase
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-sans font-semibold text-sm transition-all pb-1 ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-1.5 rounded-lg"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-4">
          {!mounted ? (
            <div className="w-20 h-9 bg-slate-100 rounded-lg animate-pulse" />
          ) : user.loggedIn ? (
            <div className="flex items-center gap-3">
              {/* Premium/Pro Badge */}
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  user.plan === "pro"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {user.plan === "pro" ? "workspace_premium" : "lock"}
                </span>
                <span>{user.plan === "pro" ? "PRO MEMBER" : "FREE TIER"}</span>
              </div>

              {/* Notification button */}
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                {user.plan === "free" && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full animate-ping"></span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant object-cover hover:ring-2 hover:ring-primary/40 transition-all flex items-center justify-center bg-primary/10 text-primary font-bold text-sm"
                >
                  {user.name ? (
                    user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                  ) : (
                    "U"
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-outline-variant rounded-xl shadow-xl py-2 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-outline-variant">
                      <p className="font-semibold text-sm text-on-surface">{user.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                        Pengaturan Akun
                      </Link>
                      <Link
                        href="/pricing"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">credit_card</span>
                        Paket Langganan
                      </Link>
                    </div>
                    <div className="border-t border-outline-variant py-1">
                      <button
                        onClick={handleLogout}
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
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-low rounded-lg transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="bg-primary text-on-primary px-5 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                Coba Gratis
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav indicator bar */}
      <div className="md:hidden flex border-t border-outline-variant bg-surface">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 text-center py-2.5 font-sans font-bold text-[11px] transition-all ${
                isActive ? "text-primary bg-primary/5 border-t-2 border-primary" : "text-on-surface-variant"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
