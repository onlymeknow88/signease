"use client";

import { TopNavBar } from "@/components/TopNavBar";
import Link from "next/link";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopNavBar />

      <main className="flex-grow">{children}</main>

      {/* Unified Footer */}
      <footer className="bg-surface border-t border-outline-variant/60">
        <div className="w-full py-10 px-6 flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto text-xs text-on-surface-variant font-medium">
          <div className="font-bold text-lg text-primary">PDFinaja</div>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link className="hover:text-primary transition-colors" href="#">
              Privacy Policy
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              Terms of Service
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              Security Assurance
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              Contact Us
            </Link>
          </div>
          <div>
            © 2026 PDFinaja Digital Assurance. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
