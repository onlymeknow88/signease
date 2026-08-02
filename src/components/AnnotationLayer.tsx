"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SignatureAnnotation } from "@/lib/types";
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

        // For text type, use smaller default size (40% of original)
        if (type === "text") {
          sigW = 72;
          sigH = 16;
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

// Resize handle directions for 8-point selection
type ResizeDirection = "se" | "sw" | "ne" | "nw" | "n" | "s" | "e" | "w";

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
  const { selectedAnnotationId, setSelectedAnnotationId } = useESignStore();
  const elRef = useRef<HTMLDivElement>(null);
  const containerHeight = containerRef.current?.getBoundingClientRect().height || 800;
  const containerWidth = containerRef.current?.getBoundingClientRect().width || 600;
  const dragStart = useRef<{ mx: number; my: number; xR: number; yR: number } | null>(null);
  const resizeStart = useRef<{
    mx: number; my: number;
    xR: number; yR: number;
    wR: number; hR: number;
    dir: ResizeDirection;
  } | null>(null);
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
      onRemove();
      return;
    }
    onUpdate({ text: editValue });
  };

  // Drag handlers
  const handleDragStart = (e: React.PointerEvent) => {
    if (isPlacingMode) return;
    if (isEditing) return;
    // Skip drag if clicking a resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains("ann-resize-handle")) return;
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

  // Resize handler — supports all 8 directions
  const handleResizeStart = (e: React.PointerEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    resizeStart.current = {
      mx: e.clientX,
      my: e.clientY,
      xR: annotation.xRatio,
      yR: annotation.yRatio,
      wR: annotation.widthRatio,
      hR: annotation.heightRatio,
      dir,
    };
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: PointerEvent) => {
      if (!resizeStart.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = (e.clientX - resizeStart.current.mx) / rect.width;
      const dy = (e.clientY - resizeStart.current.my) / rect.height;
      const { dir, xR, yR, wR, hR } = resizeStart.current;

      let newX = xR, newY = yR, newW = wR, newH = hR;

      if (dir.includes("e")) newW = Math.max(0.05, wR + dx);
      if (dir.includes("s")) newH = Math.max(0.02, hR + dy);
      if (dir.includes("w")) {
        const dw = Math.min(wR - 0.05, dx);
        newX = xR + dw;
        newW = wR - dw;
      }
      if (dir.includes("n")) {
        const dh = Math.min(hR - 0.02, dy);
        newY = yR + dh;
        newH = hR - dh;
      }

      onUpdate({
        xRatio: Math.max(0, newX),
        yRatio: Math.max(0, newY),
        widthRatio: Math.min(1 - Math.max(0, newX), newW),
        heightRatio: Math.min(1 - Math.max(0, newY), newH),
      });
    };
    const onUp = () => {
      setIsResizing(false);
      resizeStart.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isResizing, containerRef, onUpdate]);

  if (isPlacingMode) return null;

  const isSelected = selectedAnnotationId === annotation.id;
  const isText = annotation.type === "text";

  // Compute font size in px from ratio
  const fontSizePx = annotation.textSize
    ? annotation.textSize
    : Math.round(annotation.heightRatio * containerHeight * 0.75);

  // 8 resize handles: position, cursor, direction
  const handles: { style: React.CSSProperties; cursor: string; dir: ResizeDirection }[] = [
    { style: { top: -4, left: -4 },             cursor: "nw-resize", dir: "nw" },
    { style: { top: -4, left: "calc(50% - 4px)" }, cursor: "n-resize",  dir: "n"  },
    { style: { top: -4, right: -4 },             cursor: "ne-resize", dir: "ne" },
    { style: { top: "calc(50% - 4px)", right: -4 }, cursor: "e-resize",  dir: "e"  },
    { style: { bottom: -4, right: -4 },          cursor: "se-resize", dir: "se" },
    { style: { bottom: -4, left: "calc(50% - 4px)" }, cursor: "s-resize",  dir: "s"  },
    { style: { bottom: -4, left: -4 },           cursor: "sw-resize", dir: "sw" },
    { style: { top: "calc(50% - 4px)", left: -4 }, cursor: "w-resize",  dir: "w"  },
  ];

  return (
    <div
      ref={elRef}
      className={`absolute select-none pointer-events-auto ${
        isDragging || isResizing ? "z-50 opacity-95" : "z-20"
      } ${!isText ? (isDragging || isResizing ? "shadow-2xl" : "shadow-md hover:shadow-lg") : ""} ${
        isEditing ? "ann-text-edit" : isDragging ? "ann-grabbing" : "ann-grab"
      }`}
      style={{
        left: `${annotation.xRatio * 100}%`,
        top: `${annotation.yRatio * 100}%`,
        width: `${annotation.widthRatio * 100}%`,
        height: `${annotation.heightRatio * 100}%`,
        outline: isSelected ? "1.5px dashed #3b82f6" : "none",
        outlineOffset: "0px",
        background: "transparent",
        overflow: "visible",
      }}
      onPointerDown={handleDragStart}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAnnotationId(annotation.id);
      }}
    >
      {/* 8-point resize handles — only when selected */}
      {isSelected && handles.map((h) => (
        <div
          key={h.dir}
          className="ann-resize-handle absolute w-2 h-2 bg-white border border-blue-500 z-30 pointer-events-auto shadow-sm"
          style={{ ...h.style, cursor: h.cursor }}
          onPointerDown={(e) => handleResizeStart(e, h.dir)}
        />
      ))}

      {/* Signature badge (only for non-text type) */}
      {isSelected && !isText && !isDragging && !isResizing && (
        <div className="absolute -top-7 left-0 bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md z-30 select-none">
          <span className="material-symbols-outlined text-[12px]">draw</span>
          <span>TANDA TANGAN</span>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFinishEdit();
            else if (e.key === "Escape") { setIsEditing(false); onRemove(); }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Ketik teks di sini..."
          className="w-full h-full bg-transparent outline-none border-none px-0.5"
          style={{
            color: annotation.textColor || "#004782",
            fontFamily: annotation.fontFamily || "Poppins",
            fontWeight: annotation.isBold ? "bold" : "normal",
            fontStyle: annotation.isItalic ? "italic" : "normal",
            textDecoration: annotation.isUnderline ? "underline" : "none",
            fontSize: `${fontSizePx}px`,
            lineHeight: 1,
          }}
        />
      ) : isText ? (
        /* Text rendered as HTML — no canvas/image conversion */
        <div
          className={`w-full h-full flex items-center overflow-hidden ${isDragging ? "ann-grabbing" : "ann-grab"}`}
          style={{
            color: annotation.textColor || "#004782",
            fontFamily: annotation.fontFamily || "Poppins",
            fontWeight: annotation.isBold ? "bold" : "normal",
            fontStyle: annotation.isItalic ? "italic" : "normal",
            textDecoration: annotation.isUnderline ? "underline" : "none",
            fontSize: `${fontSizePx}px`,
            lineHeight: 1,
            whiteSpace: "nowrap",
            userSelect: "none",
            pointerEvents: "auto",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleDragStart(e);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
            setEditValue(annotation.text || "");
          }}
        >
          {annotation.text || (
            <span className="text-primary/40 text-xs">Klik untuk mengetik...</span>
          )}
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
    </div>
  );
}
