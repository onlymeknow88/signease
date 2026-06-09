"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useESignStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export function DropZone() {
  const { setPdfFile, setPdfBytes, reset } = useESignStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleFile = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      alert("Hanya file PDF yang didukung.");
      return;
    }
    setUploadingFile(file);
    setProgress(0);
  }, []);

  // Handle simulated upload progress
  useEffect(() => {
    if (!uploadingFile) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 100;
        }
        const step = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + step, 100);
      });
    }, 150);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [uploadingFile]);

  // Handle completion
  useEffect(() => {
    if (progress === 100 && uploadingFile) {
      const finishUpload = async () => {
        reset();
        setPdfFile(uploadingFile);
        const buffer = await uploadingFile.arrayBuffer();
        setPdfBytes(new Uint8Array(buffer));
        setUploadingFile(null);
        setProgress(0);
        router.push("/app");
      };
      const timeout = setTimeout(finishUpload, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, uploadingFile, reset, setPdfFile, setPdfBytes, router]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearInterval(timerRef.current);
    setUploadingFile(null);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {!uploadingFile ? (
        <div
          className={`w-full border-2 border-dashed rounded-2xl h-64 md:h-80 flex flex-col items-center justify-center group cursor-pointer transition-all relative overflow-hidden ${
            isDragging
              ? "border-primary bg-primary/10 scale-[0.99]"
              : "border-primary/60 bg-slate-50 hover:bg-slate-100 hover:border-primary/80"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {/* Mockup document illustration in background */}
          <img
            alt="Document Interface"
            className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-multiply pointer-events-none select-none"
            src="https://lh3.googleusercontent.com/aida/AP1WRLur8CwDpIFTeE0i5kp63_IrKnoVV0FgB8dWN0Cb3wK6s4HxxzCVbUjLFM8uh76F0fpTuj47vvUV6r0gGUb2YxjsSpjnQHsSh0c5-4o06W1y9KDxOOm0PPhT2A9lGx30gMCYHZwvqTCsZMJe1076sDp7H6k1CaRWe9pN_vSclZq5RuAT71ow9LD2ZqKbLrpbIehOliSZ_GNiNIiqgymxfokQOuMcle7QYTkYCysRFMUwG-vwn2bb-rDGXsc"
          />

          {/* Interactive Bouncy Sign Badge */}
          <div className="bg-secondary text-white px-4 py-1.5 rounded-full text-xs font-bold animate-bounce shadow-md mb-3 z-10 select-none">
            Sign Here
          </div>

          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform z-10 shadow-sm">
            <span className="material-symbols-outlined text-[26px] font-bold">draw</span>
          </div>

          <h3 className="text-sm font-bold text-on-surface mb-0.5 text-center z-10">
            Tarik & Lepas PDF di sini
          </h3>
          <p className="text-[11px] text-on-surface-variant font-medium mb-3 text-center z-10">
            atau Klik untuk Memilih File
          </p>
          <p className="text-[9px] text-outline/80 text-center z-10">Maksimum ukuran file: 25MB</p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-primary">
            <span>Mengunggah Progres</span>
            <span>Mengunggah {progress}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[24px]">description</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate font-medium">
                {uploadingFile.name}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {formatSize(uploadingFile.size)}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="material-symbols-outlined text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors text-[20px]"
              title="Batalkan"
            >
              close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
