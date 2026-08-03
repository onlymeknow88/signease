"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface MergeDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFilesText?: string;
}

export function MergeDropZone({ onFilesSelected, maxFilesText }: MergeDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filesArray = Array.from(e.dataTransfer.files);
        onFilesSelected(filesArray);
      }
    },
    [onFilesSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const filesArray = Array.from(e.target.files);
        onFilesSelected(filesArray);
      }
    },
    [onFilesSelected]
  );

  const triggerBrowse = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerBrowse}
      className={`
        border-3 border-dashed rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group relative
        ${isDragging 
          ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
          : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className={`
        w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
        ${isDragging 
          ? "bg-primary text-on-primary scale-110 rotate-3" 
          : "bg-primary/10 text-primary group-hover:scale-105 group-hover:rotate-1"
        }
      `}>
        <Upload className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-on-surface mb-2">
        Pilih atau Tarik File PDF ke Sini
      </h3>
      <p className="text-sm text-on-surface-variant font-medium max-w-sm leading-relaxed mb-1">
        Unggah beberapa file PDF untuk digabungkan secara instan dan 100% lokal.
      </p>
      {maxFilesText && (
        <div className="flex items-center gap-1.5 justify-center text-xs text-primary font-semibold mt-2 bg-primary/10 px-3 py-1 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{maxFilesText}</span>
        </div>
      )}
    </div>
  );
}
