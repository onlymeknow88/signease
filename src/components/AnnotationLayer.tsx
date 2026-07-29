"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SignatureAnnotation } from "@/lib/types";
import { generateTextImage } from "@/lib/utils";
import { useESignStore } from "@/lib/store";

// Annotation overlay on a single PDF page
export function AnnotationLayer({
  pageIndex,
  containerRef,
  pageWidth,
  pageHeight,
}: {
  pageIndex: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageWidth: number;
  pageHeight: number;
}) {
  const {
    annotations,
    isPlacingMode,
    selectedSignatureUrl,
    selectedSignatureType,
    activeTool,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    setPlacingMode,
  } = useESignStore();

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  // Handle click to place signature
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPlacingMode) {
        useESignStore.getState().setSelectedAnnotationId(null);
        return;
      }
      if (!selectedSignatureUrl) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const img = new Image();
      img.src = selectedSignatureUrl;
      img.onload = () => {
        let sigW = 220;
        let sigH = 220 * (img.height / img.width);

        // Adjust dimensions for square symbols like check/cross marks
        if (Math.abs(img.width - img.height) < 5) {
          sigW = 50;
          sigH = 50;
        } else if (img.width > 400) {
          // Larger blocks (like Adobe Digitally Signed block)
          sigW = 260;
          sigH = 260 * (img.height / img.width);
        }

        const storeState = useESignStore.getState();
        const type = storeState.selectedSignatureType || "signature";
        const details = storeState.selectedTextDetails;

        // For text type, use fixed size (like Adobe PDF text field)
        if (type === "text") {
          sigW = 180;
          sigH = 40;
        }

        // Text annotations: place top-left at cursor (I-beam behaviour).
        // Signature annotations: center on cursor (crosshair behaviour).
        const xOffset = type === "text" ? 0 : sigW / 2;
        const yOffset = type === "text" ? 0 : sigH / 2;

        addAnnotation({
          pageIndex,
          xRatio: Math.max(0, Math.min(1 - sigW / rect.width, (x - xOffset) / rect.width)),
          yRatio: Math.max(0, Math.min(1 - sigH / rect.height, (y - yOffset) / rect.height)),
          widthRatio: sigW / rect.width,
          heightRatio: sigH / rect.height,
          imageDataUrl: selectedSignatureUrl,
          type,
          ...(type === "text" ? {
            text: details?.text ?? "",
            textColor: details?.color ?? "#004782",
            textSize: details?.size ?? 24,
            fontFamily: details?.fontFamily ?? "Poppins",
            isBold: details?.isBold ?? false,
            isItalic: details?.isItalic ?? false,
            isUnderline: details?.isUnderline ?? false,
          } : {})
        });

        // If placing empty text, auto-trigger editing mode after annotation is added
        if (type === "text" && (!details?.text || details.text === "")) {
          // Small delay to let annotation render first
          setTimeout(() => {
            const latestAnnotations = useESignStore.getState().annotations;
            const newAnn = latestAnnotations[latestAnnotations.length - 1];
            if (newAnn) {
              useESignStore.getState().setSelectedAnnotationId(newAnn.id);
            }
          }, 50);
        }
      };
    },
    [isPlacingMode, selectedSignatureUrl, activeTool, pageIndex, addAnnotation]
  );

  return (
    <div
      className={`absolute inset-0 z-10 ${
        isPlacingMode
          ? selectedSignatureType === "text"
            ? "cursor-text"
            : "cursor-crosshair"
          : "pointer-events-none"
      }`}
      onClick={handleContainerClick}
    >
      {pageAnnotations.map((ann) => (
        <DraggableAnnotation
          key={ann.id}
          annotation={ann}
          containerRef={containerRef}
          onUpdate={(updates) => updateAnnotation(ann.id, updates)}
          onRemove={() => removeAnnotation(ann.id)}
          isPlacingMode={isPlacingMode}
        />
      ))}

      {/* Placing mode overlay hint */}
      {isPlacingMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none animate-bounce z-20">
          {useESignStore.getState().selectedSignatureType === "text"
            ? "Klik untuk menempatkan kolom teks"
            : "Klik untuk menempatkan tanda tangan"}
        </div>
      )}
    </div>
  );
}

function DraggableAnnotation({
  annotation,
  containerRef,
  onUpdate,
  onRemove,
  isPlacingMode,
}: {
  annotation: SignatureAnnotation;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (updates: Partial<SignatureAnnotation>) => void;
  onRemove: () => void;
  isPlacingMode: boolean;
}) {
  const { selectedAnnotationId, setSelectedAnnotationId, addAnnotation } = useESignStore();
  const elRef = useRef<HTMLDivElement>(null);
  const pageHeight = containerRef.current?.getBoundingClientRect().height || 800;
  const dragStart = useRef<{ mx: number; my: number; xR: number; yR: number } | null>(null);
  const resizeStart = useRef<{ mx: number; my: number; wR: number; hR: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(
    annotation.type === "text" && (!annotation.text || annotation.text === "")
  );
  const [editValue, setEditValue] = useState(annotation.text || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (annotation.type === "text") {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(annotation.text || "");
    }
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    if (!editValue.trim()) {
      // Remove empty text annotation — same as Adobe PDF behavior
      onRemove();
      return;
    }
    const size = annotation.textSize || 24;
    const color = annotation.textColor || "#1a1a2e";
    const fontFamily = annotation.fontFamily || "Poppins";
    const isBold = annotation.isBold === true;
    const isItalic = annotation.isItalic || false;
    const isUnderline = annotation.isUnderline || false;
    const { dataUrl, aspectRatio } = generateTextImage(editValue, size, color, fontFamily, isBold, isItalic, isUnderline);
    
    // Maintain font height (size on screen) and expand/shrink width horizontally
    const newWidthRatio = Math.min(1 - annotation.xRatio, annotation.heightRatio / aspectRatio);
    const newHeightRatio = newWidthRatio * aspectRatio;
    
    onUpdate({
      text: editValue,
      imageDataUrl: dataUrl,
      widthRatio: newWidthRatio,
      heightRatio: newHeightRatio,
    });
  };

  // Drag handlers
  const handleDragStart = (e: React.PointerEvent) => {
    if (isPlacingMode) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedAnnotationId(annotation.id);
    const container = containerRef.current;
    if (!container) return;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      xR: annotation.xRatio,
      yR: annotation.yRatio,
    };
    setIsDragging(true);
    document.body.classList.add("sig-dragging");
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      if (!dragStart.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = (e.clientX - dragStart.current.mx) / rect.width;
      const dy = (e.clientY - dragStart.current.my) / rect.height;
      onUpdate({
        xRatio: Math.max(0, Math.min(1 - annotation.widthRatio, dragStart.current.xR + dx)),
        yRatio: Math.max(0, Math.min(1 - annotation.heightRatio, dragStart.current.yR + dy)),
      });
    };
    const onUp = () => {
      setIsDragging(false);
      dragStart.current = null;
      document.body.classList.remove("sig-dragging");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, annotation.widthRatio, annotation.heightRatio, containerRef, onUpdate]);

  // Resize handler
  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    resizeStart.current = {
      mx: e.clientX,
      my: e.clientY,
      wR: annotation.widthRatio,
      hR: annotation.heightRatio,
    };
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: PointerEvent) => {
      if (!resizeStart.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dw = (e.clientX - resizeStart.current.mx) / rect.width;
      
      const newWidthRatio = Math.max(0.05, resizeStart.current.wR + dw);
      let newHeightRatio = Math.max(0.02, resizeStart.current.hR + ((e.clientY - resizeStart.current.my) / rect.height));
      
      if (annotation.type === "text") {
        // Lock aspect ratio for text annotations to prevent distortion
        const aspect = resizeStart.current.hR / resizeStart.current.wR;
        newHeightRatio = newWidthRatio * aspect;
      }
      
      onUpdate({
        widthRatio: newWidthRatio,
        heightRatio: newHeightRatio,
      });
    };
    const onUp = () => {
      setIsResizing(false);
      if (resizeStart.current && annotation.type === "text") {
        const scaleFactor = annotation.widthRatio / resizeStart.current.wR;
        const currentSize = annotation.textSize || 24;
        const newSize = Math.max(10, Math.min(72, Math.round(currentSize * scaleFactor)));
        
        // Regenerate image at new size for maximum sharpness (crisp rendering)
        const { dataUrl, aspectRatio } = generateTextImage(
          annotation.text || "Nama Terang",
          newSize,
          annotation.textColor || "#004782",
          annotation.fontFamily || "Poppins",
          annotation.isBold !== false,
          annotation.isItalic || false,
          annotation.isUnderline || false
        );
        
        onUpdate({
          textSize: newSize,
          imageDataUrl: dataUrl,
          heightRatio: annotation.widthRatio * aspectRatio,
        });
      }
      resizeStart.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isResizing, annotation.widthRatio, annotation.heightRatio, annotation.type, annotation.text, annotation.textColor, annotation.fontFamily, annotation.isBold, annotation.isItalic, annotation.isUnderline, containerRef, onUpdate]);

  if (isPlacingMode) return null;

  return (
    <div
      ref={elRef}
      className={`absolute group/ann select-none pointer-events-auto transition-all duration-75 ${
        isDragging || isResizing
          ? `opacity-95 z-50 scale-[1.01] ${annotation.type !== "text" ? "shadow-2xl" : ""}`
          : `z-20 ${annotation.type !== "text" ? "shadow-md hover:shadow-lg" : ""}`
      }`}
      style={{
        left: `${annotation.xRatio * 100}%`,
        top: `${annotation.yRatio * 100}%`,
        width: `${annotation.widthRatio * 100}%`,
        height: `${annotation.heightRatio * 100}%`,
      }}
      onPointerDown={handleDragStart}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAnnotationId(annotation.id);
      }}
    >
      {selectedAnnotationId === annotation.id && (
        <>
          {/* Focus Ring and Resize Handles matching code.html / Gambar 1 */}
          <div className="absolute -inset-3 border-2 border-primary border-dashed rounded bg-primary/5 pointer-events-none z-10" />
          
          {/* Corner Handles */}
          <div className="absolute -top-3 -left-3 w-3 h-3 bg-white border-2 border-primary rounded-full z-30 pointer-events-none shadow-sm" />
          <div className="absolute -top-3 -right-3 w-3 h-3 bg-white border-2 border-primary rounded-full z-30 pointer-events-none shadow-sm" />
          <div className="absolute -bottom-3 -left-3 w-3 h-3 bg-white border-2 border-primary rounded-full z-30 pointer-events-none shadow-sm" />
          <div
            className="absolute -bottom-3 -right-3 w-3 h-3 bg-white border-2 border-primary rounded-full z-30 cursor-se-resize shadow-md hover:scale-125 transition-transform pointer-events-auto"
            onPointerDown={handleResizeStart}
            title="Ubah Ukuran"
          />

          {/* Floating Badge Tag */}
          {!isDragging && !isResizing && (
            <div
              className={`absolute -top-9 left-0 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md z-30 select-none ${
                annotation.type === "text" ? "bg-secondary" : "bg-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[12px] font-bold">
                {annotation.type === "text" ? "edit" : "draw"}
              </span>
              <span>{annotation.type === "text" ? "TAMBAH TEKS" : "TANDA TANGAN"}</span>
            </div>
          )}
        </>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFinishEdit();
            } else if (e.key === "Escape") {
              setIsEditing(false);
              onRemove(); // Cancel = remove empty annotation
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Ketik teks di sini..."
          className="w-full h-full bg-white/95 border-2 border-primary border-dashed outline-none rounded px-2 text-sm text-foreground"
          style={{
            color: annotation.textColor || "#004782",
            fontFamily: annotation.fontFamily || "Poppins",
            fontWeight: annotation.isBold === true ? "bold" : "normal",
            fontStyle: annotation.isItalic ? "italic" : "normal",
            textDecoration: annotation.isUnderline ? "underline" : "none",
            fontSize: `${(annotation.heightRatio * pageHeight) * 0.55}px`,
            lineHeight: 1,
          }}
        />
      ) : annotation.type === "text" && (!annotation.text || annotation.text === "") ? (
        /* Empty text placeholder — dashed border like Adobe PDF */
        <div
          className="w-full h-full border-2 border-dashed border-primary/60 bg-primary/5 rounded flex items-center justify-center cursor-text"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <span className="text-primary/40 text-xs font-medium select-none pointer-events-none">
            Klik untuk mengetik teks...
          </span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={annotation.imageDataUrl}
          alt="signature"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      )}

      {/* Quick Action Floating Menu (Bottom) */}
      {selectedAnnotationId === annotation.id && !isDragging && !isResizing && (
        <div 
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg shadow-xl px-2 py-1 flex items-center gap-1.5 whitespace-nowrap z-30 text-xs pointer-events-auto select-none border border-slate-700 animate-in fade-in duration-100"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Duplicate Button */}
          <button
            className="p-1 hover:bg-white/10 rounded transition-colors text-white flex items-center justify-center cursor-pointer"
            title="Duplikat"
            onClick={(e) => {
              e.stopPropagation();
              const newAnn = {
                pageIndex: annotation.pageIndex,
                xRatio: Math.min(0.9, annotation.xRatio + 0.04),
                yRatio: Math.min(0.9, annotation.yRatio + 0.04),
                widthRatio: annotation.widthRatio,
                heightRatio: annotation.heightRatio,
                imageDataUrl: annotation.imageDataUrl,
                type: annotation.type,
              };
              addAnnotation(newAnn);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
          </button>

          {/* Delete Button */}
          <button
            className="p-1 hover:bg-white/10 rounded transition-colors text-red-400 flex items-center justify-center cursor-pointer"
            title="Hapus"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

          {/* Drag Handle representation */}
          <div className="p-1 cursor-grab flex items-center justify-center text-white/60" title="Geser (Klik & Seret)">
            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
          </div>
        </div>
      )}
    </div>
  );
}
