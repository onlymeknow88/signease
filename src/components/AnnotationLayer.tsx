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

        if (Math.abs(img.width - img.height) < 5) {
          sigW = 50;
          sigH = 50;
        } else if (img.width > 400) {
          sigW = 260;
          sigH = 260 * (img.height / img.width);
        }

        const storeState = useESignStore.getState();
        const type = storeState.selectedSignatureType || "signature";
        const details = storeState.selectedTextDetails;

        if (type === "text") {
          sigW = 120;
          sigH = 24;
        }

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

        if (type === "text") {
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

  // All drag/resize state lives in refs to avoid stale closure issues
  const dragRef = useRef<{ mx: number; my: number; xR: number; yR: number } | null>(null);
  const isDraggingRef = useRef(false);
  const resizeRef = useRef<{ mx: number; my: number; xR: number; yR: number; wR: number; hR: number; dir: ResizeDirection } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(annotation.text || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isSelected = selectedAnnotationId === annotation.id;
  const isText = annotation.type === "text";

  // Auto-select new empty text annotation and enter edit mode
  useEffect(() => {
    if (isText && isSelected && !annotation.text) {
      setIsEditing(true);
      setEditValue("");
    }
  }, [isSelected, isText, annotation.text]);

  // Focus textarea when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const enterEditMode = () => {
    setEditValue(annotation.text || "");
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    if (!editValue.trim()) {
      onRemove();
      return;
    }
    onUpdate({ text: editValue });
  };

  // Drag — attach listeners directly on pointerdown so no stale closures
  const handleDragPointerDown = (e: React.PointerEvent) => {
    if (isPlacingMode || isEditing) return;
    const target = e.target as HTMLElement;
    if (target.classList.contains("ann-resize-handle")) return;
    e.stopPropagation();

    // Do NOT select here — selection happens in onClick after pointer up
    // This prevents the toolbar from appearing while still holding the pointer

    const container = containerRef.current;
    if (!container) return;

    isDraggingRef.current = false;
    dragRef.current = {
      mx: e.clientX,
      my: e.clientY,
      xR: annotation.xRatio,
      yR: annotation.yRatio,
    };

    const THRESHOLD = 5;

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const dx = ev.clientX - dragRef.current.mx;
      const dy = ev.clientY - dragRef.current.my;

      if (!isDraggingRef.current) {
        if (Math.sqrt(dx * dx + dy * dy) < THRESHOLD) return;
        isDraggingRef.current = true;
        setIsDragging(true);
        document.body.classList.add("sig-dragging");
      }

      const rect = containerRef.current.getBoundingClientRect();
      onUpdate({
        xRatio: Math.max(0, Math.min(1 - annotation.widthRatio, dragRef.current.xR + dx / rect.width)),
        yRatio: Math.max(0, Math.min(1 - annotation.heightRatio, dragRef.current.yR + dy / rect.height)),
      });
    };

    const onUp = () => {
      dragRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.classList.remove("sig-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Resize — same pattern, listeners attached inline
  const handleResizePointerDown = (e: React.PointerEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();

    resizeRef.current = {
      mx: e.clientX,
      my: e.clientY,
      xR: annotation.xRatio,
      yR: annotation.yRatio,
      wR: annotation.widthRatio,
      hR: annotation.heightRatio,
      dir,
    };
    setIsResizing(true);

    const onMove = (ev: PointerEvent) => {
      if (!resizeRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = (ev.clientX - resizeRef.current.mx) / rect.width;
      const dy = (ev.clientY - resizeRef.current.my) / rect.height;
      const { dir: d, xR, yR, wR, hR } = resizeRef.current;

      let newX = xR, newY = yR, newW = wR, newH = hR;
      if (d.includes("e")) newW = Math.max(0.05, wR + dx);
      if (d.includes("s")) newH = Math.max(0.02, hR + dy);
      if (d.includes("w")) { const dw = Math.min(wR - 0.05, dx); newX = xR + dw; newW = wR - dw; }
      if (d.includes("n")) { const dh = Math.min(hR - 0.02, dy); newY = yR + dh; newH = hR - dh; }

      onUpdate({
        xRatio: Math.max(0, newX),
        yRatio: Math.max(0, newY),
        widthRatio: Math.min(1 - Math.max(0, newX), newW),
        heightRatio: Math.min(1 - Math.max(0, newY), newH),
      });
    };

    const onUp = () => {
      resizeRef.current = null;
      setIsResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (isPlacingMode) return null;

  const fontSizePx = annotation.textSize
    ? annotation.textSize
    : Math.round(annotation.heightRatio * containerHeight * 0.75);

  const handles: { style: React.CSSProperties; cursor: string; dir: ResizeDirection }[] = [
    { style: { top: -4, left: -4 },                   cursor: "nw-resize", dir: "nw" },
    { style: { top: -4, left: "calc(50% - 4px)" },    cursor: "n-resize",  dir: "n"  },
    { style: { top: -4, right: -4 },                   cursor: "ne-resize", dir: "ne" },
    { style: { top: "calc(50% - 4px)", right: -4 },   cursor: "e-resize",  dir: "e"  },
    { style: { bottom: -4, right: -4 },                cursor: "se-resize", dir: "se" },
    { style: { bottom: -4, left: "calc(50% - 4px)" }, cursor: "s-resize",  dir: "s"  },
    { style: { bottom: -4, left: -4 },                 cursor: "sw-resize", dir: "sw" },
    { style: { top: "calc(50% - 4px)", left: -4 },    cursor: "w-resize",  dir: "w"  },
  ];

  return (
    <div
      ref={elRef}
      className={`absolute select-none pointer-events-auto ${
        isDragging || isResizing ? "z-50 opacity-95" : "z-20"
      } ${!isText ? (isDragging || isResizing ? "shadow-2xl" : "shadow-md hover:shadow-lg") : ""}`}
      style={{
        left: `${annotation.xRatio * 100}%`,
        top: `${annotation.yRatio * 100}%`,
        width: `${annotation.widthRatio * 100}%`,
        height: `${annotation.heightRatio * 100}%`,
        outline: isSelected && !isDragging && !isResizing ? "1.5px dashed #3b82f6" : "none",
        outlineOffset: "0px",
        background: "transparent",
        overflow: "visible",
      }}
      // Wrapper handles drag for signatures; text content handles its own clicks
      onPointerDown={!isText ? handleDragPointerDown : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDraggingRef.current) {
          setSelectedAnnotationId(annotation.id);
        }
      }}
    >
      {/* Resize handles — only when selected and not mid-action */}
      {isSelected && !isDragging && !isResizing && handles.map((h) => (
        <div
          key={h.dir}
          className="ann-resize-handle absolute w-2 h-2 bg-white border border-blue-500 z-30 pointer-events-auto shadow-sm"
          style={{ ...h.style, cursor: h.cursor }}
          onPointerDown={(e) => handleResizePointerDown(e, h.dir)}
        />
      ))}

      {/* Signature badge */}
      {isSelected && !isText && !isDragging && !isResizing && (
        <div className="absolute -top-7 left-0 bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md z-30 select-none">
          <span className="material-symbols-outlined text-[12px]">draw</span>
          <span>TANDA TANGAN</span>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => {
            const val = e.target.value;
            setEditValue(val);
            const size = annotation.textSize || 24;
            const color = annotation.textColor || "#004782";
            const fontFamily = annotation.fontFamily || "Poppins";
            const isBold = annotation.isBold !== false;
            const isItalic = annotation.isItalic || false;
            const isUnderline = annotation.isUnderline || false;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.font = `${isItalic ? "italic" : ""} ${isBold ? "bold" : ""} ${size}px ${fontFamily}`.trim();
              const lines = (val || " ").split("\n");
              let maxW = 0;
              lines.forEach(l => { const m = ctx.measureText(l || " "); if (m.width > maxW) maxW = m.width; });
              const newWidthRatio = Math.min(1 - annotation.xRatio, Math.max(120, maxW + size * 0.4) / (containerWidth || 600));
              const newHeightRatio = ((size * 1.25) * lines.length + size * 0.3) / (containerHeight || 800);
              const { dataUrl } = generateTextImage(
                val || " ", size, color, fontFamily, isBold, isItalic, isUnderline,
                annotation.bgColor || "transparent", annotation.opacity ?? 1, annotation.textAlign || "left"
              );
              onUpdate({ text: val, widthRatio: newWidthRatio, heightRatio: newHeightRatio, imageDataUrl: dataUrl });
            } else {
              onUpdate({ text: val });
            }
          }}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleFinishEdit();
            else if (e.key === "Escape") { setIsEditing(false); onRemove(); }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Ketik teks di sini... (Ctrl+Enter selesai)"
          className="w-full h-full bg-transparent outline-none border-none px-0.5 resize-none overflow-hidden ann-text-edit"
          style={{
            color: annotation.textColor || "#004782",
            fontFamily: annotation.fontFamily || "Poppins",
            fontWeight: annotation.isBold ? "bold" : "normal",
            fontStyle: annotation.isItalic ? "italic" : "normal",
            textDecoration: annotation.isUnderline ? "underline" : "none",
            fontSize: `${fontSizePx}px`,
            lineHeight: 1.25,
            textAlign: (annotation.textAlign as React.CSSProperties["textAlign"]) || "left",
            backgroundColor: annotation.bgColor || "transparent",
            opacity: annotation.opacity ?? 1,
            position: "relative",
            zIndex: 20,
          }}
        />
      ) : isText ? (
        /* Text display — clicking selects, double-click or click-when-selected = edit */
        <div
          className={`w-full h-full flex flex-col justify-start overflow-hidden ${isDragging ? "ann-grabbing" : "ann-grab"}`}
          style={{
            color: annotation.textColor || "#004782",
            fontFamily: annotation.fontFamily || "Poppins",
            fontWeight: annotation.isBold ? "bold" : "normal",
            fontStyle: annotation.isItalic ? "italic" : "normal",
            textDecoration: annotation.isUnderline ? "underline" : "none",
            fontSize: `${fontSizePx}px`,
            lineHeight: 1.25,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: "none",
            textAlign: (annotation.textAlign as React.CSSProperties["textAlign"]) || "left",
            backgroundColor: annotation.bgColor || "transparent",
            opacity: annotation.opacity ?? 1,
            position: "relative",
            zIndex: 15,
            pointerEvents: "auto",
          }}
          onPointerDown={handleDragPointerDown}
          onDoubleClick={(e) => {
            e.stopPropagation();
            enterEditMode();
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isSelected && !isDraggingRef.current) {
              // Second click on already-selected text = enter edit
              enterEditMode();
            } else {
              setSelectedAnnotationId(annotation.id);
            }
          }}
        >
          {annotation.text ? (
            annotation.text.split("\n").map((line, idx) => (
              <div key={idx} className="min-h-[1.25em]">{line || "\u00A0"}</div>
            ))
          ) : (
            <span className="text-primary/40 text-xs pointer-events-none">Klik untuk mengetik...</span>
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
