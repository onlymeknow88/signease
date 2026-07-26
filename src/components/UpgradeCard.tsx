"use client";

import { Crown, Check } from "lucide-react";
import Link from "next/link";

export function UpgradeCard() {
  const features = [
    "Tanda tangan tak terbatas",
    "Template premium",
    "Hapus watermark",
    "Enkripsi dokumen",
  ];

  return (
    <div className="mx-3 mb-3 rounded-2xl overflow-hidden border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-3.5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-xs font-bold text-on-surface">Tingkatkan ke Pro</p>
      </div>

      <ul className="space-y-1.5 mb-3.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-emerald-600" />
            </div>
            <span className="text-[11px] text-on-surface-variant">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/pricing"
        className="block w-full text-center text-[11px] font-bold bg-emerald-600 text-white rounded-xl py-2 hover:bg-emerald-700 active:scale-95 transition-all"
      >
        Upgrade ke Pro
      </Link>
    </div>
  );
}
