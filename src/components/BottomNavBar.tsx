"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, LayoutList, LayoutGrid } from "lucide-react";
import { useESignStore } from "@/lib/store";

export function BottomNavBar() {
  const { currentPage, totalPages, setCurrentPage, viewMode, setViewMode } = useESignStore();
  const [pageInput, setPageInput] = useState(`${currentPage}`);

  useEffect(() => {
    setPageInput(`${currentPage}`);
  }, [currentPage]);

  const navigatePage = useCallback(
    (direction: "prev" | "next") => {
      const targetPage =
        direction === "prev"
          ? Math.max(1, currentPage - 1)
          : Math.min(totalPages, currentPage + 1);

      const pageEl = document.querySelectorAll(".pdf-page-container")[targetPage - 1];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(targetPage);
      }
    },
    [currentPage, totalPages, setCurrentPage]
  );

  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput.trim());
    if (!isNaN(parsed)) {
      const targetPage = Math.max(1, Math.min(totalPages, parsed));
      const pageEl = document.querySelectorAll(".pdf-page-container")[targetPage - 1];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(targetPage);
      } else {
        setPageInput(`${currentPage}`);
      }
    } else {
      setPageInput(`${currentPage}`);
    }
  };

  if (!totalPages) return null;

  return (
    <div className="h-10 border-t border-outline-variant bg-surface-container-low flex items-center justify-center gap-2 shrink-0 relative">
      {/* Page navigation — center */}
      <button
        onClick={() => navigatePage("prev")}
        disabled={currentPage <= 1}
        className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span>Halaman</span>
        <input
          type="text"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={handlePageSubmit}
          onKeyDown={(e) => { if (e.key === "Enter") handlePageSubmit(); }}
          className="w-8 py-0.5 text-center bg-surface border border-outline-variant rounded font-semibold text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          aria-label="Nomor halaman"
        />
        <span>/ {totalPages}</span>
      </div>

      <button
        onClick={() => navigatePage("next")}
        disabled={currentPage >= totalPages}
        className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* View mode toggle — absolute right */}
      <div className="absolute right-3 flex items-center gap-0.5">
        <button
          onClick={() => setViewMode("single")}
          title="Satu halaman"
          className={`p-1.5 rounded-lg transition-colors ${
            viewMode === "single"
              ? "bg-primary/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <LayoutList className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setViewMode("grid")}
          title="Tampilan grid"
          className={`p-1.5 rounded-lg transition-colors ${
            viewMode === "grid"
              ? "bg-primary/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
