"use client";

import { ShieldCheck } from "lucide-react";

export function SecurityBadge() {
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2.5 bg-white/95 backdrop-blur-sm border border-outline-variant/60 rounded-xl px-3 py-2 shadow-lg pointer-events-none">
      <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface leading-tight">Aman</p>
        <p className="text-[10px] text-on-surface-variant whitespace-nowrap leading-tight mt-0.5">
          Dokumen terenkripsi di perangkat Anda
        </p>
      </div>
    </div>
  );
}
