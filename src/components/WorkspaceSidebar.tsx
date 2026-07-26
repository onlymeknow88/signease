"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useESignStore } from "@/lib/store";
import { UpgradeCard } from "@/components/UpgradeCard";
import { signOut } from "next-auth/react";
import {
  Upload,
  LayoutDashboard,
  FileText,
  LayoutGrid,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  comingSoon?: boolean;
};

export function WorkspaceSidebar() {
  const { user, sidebarCollapsed, setSidebarCollapsed, setPdfFile, setPdfBytes, savedSignatures } =
    useESignStore();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    setPdfFile(file);
    setPdfBytes(bytes);
    if (pathname !== "/app") router.push("/app");
    e.target.value = "";
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const initials = user.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  const navItems: NavItem[] = [
    { href: "/",          label: "Dashboard",    icon: LayoutDashboard, comingSoon: false },
    { href: "/app",       label: "Dokumen Saya", icon: FileText,        comingSoon: false },
    { href: "/templates", label: "Template",     icon: LayoutGrid,      comingSoon: true  },
    { href: "/history",   label: "Riwayat",      icon: History,         comingSoon: true  },
    { href: "/trash",     label: "Sampah",       icon: Trash2,          comingSoon: true  },
  ];

  const baseClass = (isActive: boolean, collapsed: boolean) => `
    flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors relative w-full
    ${isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}
    ${collapsed ? "justify-center" : ""}
  `;

  return (
    <aside
      className={`
        flex flex-col shrink-0 border-r border-outline-variant bg-surface-container-low
        transition-all duration-200 overflow-hidden
        ${sidebarCollapsed ? "w-14" : "w-52"}
      `}
    >
      {/* Toggle button */}
      <div className="flex items-center justify-end px-2 py-2 border-b border-outline-variant/50">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
          aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Upload button */}
      <div className={`px-2 py-3 border-b border-outline-variant/50 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex items-center gap-2 bg-primary text-on-primary font-semibold rounded-lg
            hover:brightness-110 transition-all text-xs
            ${sidebarCollapsed ? "w-9 h-9 justify-center" : "w-full px-3 py-2"}
          `}
          title="Unggah PDF Baru"
        >
          <Upload className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span>+ Unggah PDF Baru</span>}
        </button>
        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge, comingSoon }) => {
          const isActive = pathname === href;

          if (comingSoon) {
            return (
              <span
                key={label}
                title={sidebarCollapsed ? `${label} (Segera Hadir)` : "Segera Hadir"}
                className={baseClass(false, sidebarCollapsed) + " opacity-50 cursor-not-allowed"}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate flex-1">{label}</span>
                    <span className="text-[9px] text-outline ml-auto shrink-0">Segera</span>
                  </>
                )}
              </span>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className={baseClass(isActive, sidebarCollapsed)}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate flex-1">{label}</span>}
              {!sidebarCollapsed && badge !== undefined && (
                <span className="ml-auto text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Storage indicator */}
      {!sidebarCollapsed && (
        <div className="px-3 py-3 border-t border-outline-variant/40">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-semibold text-on-surface-variant">Penyimpanan</p>
            <p className="text-[10px] text-outline">2.4 GB / 10 GB</p>
          </div>
          <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: "24%" }} />
          </div>
        </div>
      )}

      {/* Upgrade card */}
      {!sidebarCollapsed && user.plan === "free" && <UpgradeCard />}

      {/* User profile */}
      <div className="border-t border-outline-variant/50 p-2 relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={`
            w-full flex items-center gap-2 rounded-lg px-2 py-2
            hover:bg-surface-container transition-colors text-left
            ${sidebarCollapsed ? "justify-center" : ""}
          `}
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate">{user.name || "Pengguna"}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
            </>
          )}
        </button>

        {profileOpen && (
          <div className={`absolute bottom-full ${sidebarCollapsed ? "left-14" : "left-2 right-2"} mb-1 bg-surface border border-outline-variant rounded-xl shadow-xl overflow-hidden z-50 animate-slide-in-up`}>
            <Link
              href="/account"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-on-surface hover:bg-surface-container transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Pengaturan Akun
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
