"use client";

import React, { useRef } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { MergePDFItem } from "@/lib/merge-store";
import { MergePageThumbnail } from "./MergePageThumbnail";

interface MergePDFCardProps {
  item: MergePDFItem;
  index: number;
  onRemove: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function MergePDFCard({ item, index, onRemove, onMove }: MergePDFCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    if (cardRef.current) {
      cardRef.current.classList.add("opacity-55");
    }
  };

  const handleDragEnd = () => {
    if (cardRef.current) {
      cardRef.current.classList.remove("opacity-55");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(fromIndex) && fromIndex !== index) {
      onMove(fromIndex, index);
    }
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant rounded-2xl shadow-sm hover:border-primary/50 transition-colors group cursor-grab active:cursor-grabbing"
    >
      {/* Reorder grip indicator */}
      <div className="text-on-surface-variant/40 group-hover:text-primary transition-colors cursor-grab">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Index/Order badge */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
        {index + 1}
      </div>

      {/* PDF Thumbnail */}
      <div className="shrink-0">
        <MergePageThumbnail pdfBytes={item.bytes} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface truncate" title={item.name}>
          {item.name}
        </p>
        <p className="text-xs text-on-surface-variant font-medium mt-1">
          {item.pageCount} Halaman • {((item.file.size || 0) / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all shrink-0 cursor-pointer"
        title="Hapus file"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
