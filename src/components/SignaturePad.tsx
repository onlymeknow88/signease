"use client";

import { useRef, useState, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Eraser, Pen, Upload, Check } from "lucide-react";
import { useESignStore } from "@/lib/store";

interface SignaturePadProps {
  onClose: () => void;
}

const TYPED_FONTS = [
  { label: "Cursive", family: "'Dancing Script', cursive" },
  { label: "Signature", family: "'Pacifico', cursive" },
  { label: "Elegant", family: "'Great Vibes', cursive" },
];

// Load Google Fonts for typed signatures
const FONT_IMPORT =
  "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&family=Great+Vibes&display=swap";

export function SignaturePad({ onClose }: SignaturePadProps) {
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addSavedSignature, setPlacingMode, user } = useESignStore();

  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(TYPED_FONTS[0]);
  const [penColor, setPenColor] = useState("#1a1a2e");
  const [penWidth, setPenWidth] = useState(2.5);
  const [tab, setTab] = useState("draw");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // Adobe Digitally Signed metadata states
  const [signerName, setSignerName] = useState(user.name || "Felix Ardiansyah");
  const [useAdobeStyle, setUseAdobeStyle] = useState(true);

  // Helper to generate combined Adobe-style signature card
  const generateAdobeStyleSignature = useCallback((sigDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = sigDataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 650;
        canvas.height = 200;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw vertical separator line
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(270, 20);
        ctx.lineTo(270, 180);
        ctx.stroke();

        // Draw hand-drawn signature on the left
        const boxW = 240;
        const boxH = 160;
        const boxX = 15;
        const boxY = 20;

        let drawW = img.width;
        let drawH = img.height;
        const scale = Math.min(boxW / drawW, boxH / drawH);
        drawW *= scale;
        drawH *= scale;
        const drawX = boxX + (boxW - drawW) / 2;
        const drawY = boxY + (boxH - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Draw texts on the right
        const textX = 290;
        ctx.fillStyle = "#1a1a2e";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // Line 1: Digitally signed
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("Digitally signed", textX, 25);

        // Line 2: by [Name]
        ctx.font = "bold 26px sans-serif";
        ctx.fillText(`by ${signerName || "User"}`, textX, 60);

        // Date generation
        const now = new Date();
        const pad = (num: number) => String(num).padStart(2, '0');
        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());

        const offsetMinutes = now.getTimezoneOffset();
        const offsetSign = offsetMinutes <= 0 ? '+' : '-';
        const absOffsetMinutes = Math.abs(offsetMinutes);
        const offsetHours = pad(Math.floor(absOffsetMinutes / 60));
        const offsetMins = pad(absOffsetMinutes % 60);
        const timezoneStr = `${offsetSign}${offsetHours}'${offsetMins}'`;

        // Line 3: Date: YYYY.MM.DD
        ctx.font = "22px sans-serif";
        ctx.fillText(`Date: ${year}.${month}.${day}`, textX, 105);

        // Line 4: HH:MM:SS Offset
        ctx.fillText(`${hours}:${minutes}:${seconds} ${timezoneStr}`, textX, 140);

        resolve(canvas.toDataURL("image/png"));
      };
    });
  }, [signerName]);

  const clearCanvas = () => sigCanvasRef.current?.clear();

  const getTypedSignatureDataUrl = useCallback((): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 150;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `60px ${selectedFont.family}`;
    ctx.fillStyle = penColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, 250, 75);
    return canvas.toDataURL("image/png");
  }, [typedName, selectedFont, penColor]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    let dataUrl: string | null = null;

    if (tab === "draw") {
      if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return;
      dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png");
    } else if (tab === "type") {
      if (!typedName.trim()) return;
      dataUrl = getTypedSignatureDataUrl();
    } else if (tab === "upload") {
      if (!uploadPreview) return;
      dataUrl = uploadPreview;
    }

    if (dataUrl) {
      if (useAdobeStyle) {
        dataUrl = await generateAdobeStyleSignature(dataUrl);
      }
      addSavedSignature(dataUrl);
      setPlacingMode(true);
      onClose();
    }
  };

  return (
    <>
      {/* Load Google Fonts for typed signatures */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONT_IMPORT} />

      <Dialog open={true} onOpenChange={(val) => { if (!val) onClose(); }}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Pen className="w-5 h-5 text-primary" />
              Buat Tanda Tangan
            </DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab} className="px-6 pt-4">
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-muted/60">
              <TabsTrigger value="draw" className="gap-1.5">
                <Pen className="w-3.5 h-3.5" /> Gambar
              </TabsTrigger>
              <TabsTrigger value="type" className="gap-1.5">
                <span className="text-sm font-semibold italic">A</span> Ketik
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload
              </TabsTrigger>
            </TabsList>

            {/* ── DRAW TAB ── */}
            <TabsContent value="draw" className="mt-0">
              <div className="rounded-xl overflow-hidden border-2 border-dashed border-border bg-white relative group">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor={penColor}
                  minWidth={penWidth * 0.5}
                  maxWidth={penWidth}
                  canvasProps={{
                    width: 512,
                    height: 180,
                    className: "signature-canvas w-full",
                  }}
                />
                <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground/50 pointer-events-none group-[.has-sig]:opacity-0 transition-opacity">
                  Gambar tanda tangan Anda di sini
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground">Warna</label>
                  <div className="flex gap-1.5">
                    {["#1a1a2e", "#1e40af", "#064e3b", "#7c2d12"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          penColor === c
                            ? "border-primary scale-110"
                            : "border-transparent"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="w-6 h-6 rounded-full border-2 border-transparent cursor-pointer p-0 overflow-hidden"
                      title="Pilih warna kustom"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Tebal</label>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={0.5}
                    value={penWidth}
                    onChange={(e) => setPenWidth(parseFloat(e.target.value))}
                    className="w-20 accent-primary"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={clearCanvas} className="gap-1.5 text-muted-foreground">
                  <Eraser className="w-3.5 h-3.5" /> Hapus
                </Button>
              </div>
            </TabsContent>

            {/* ── TYPE TAB ── */}
            <TabsContent value="type" className="mt-0 space-y-3">
              <input
                type="text"
                placeholder="Ketik nama Anda..."
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              <div className="grid grid-cols-3 gap-2">
                {TYPED_FONTS.map((f) => (
                  <button
                    key={f.family}
                    onClick={() => setSelectedFont(f)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedFont.family === f.family
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/40 hover:border-primary/40"
                    }`}
                    style={{ fontFamily: f.family }}
                  >
                    <span className="text-2xl text-foreground">
                      {typedName || "Anda"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">
                      {f.label}
                    </p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border-2 border-dashed border-border bg-white h-[80px] flex items-center justify-center">
                {typedName ? (
                  <span
                    style={{
                      fontFamily: selectedFont.family,
                      fontSize: "48px",
                      color: penColor,
                    }}
                  >
                    {typedName}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground/50">
                    Preview tanda tangan
                  </span>
                )}
              </div>
            </TabsContent>

            {/* ── UPLOAD TAB ── */}
            <TabsContent value="upload" className="mt-0">
              <div
                className="rounded-xl border-2 border-dashed border-border bg-muted/30 h-[180px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadPreview}
                    alt="Signature preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Klik untuk upload gambar tanda tangan
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      PNG, JPG, atau SVG. Background transparan direkomendasikan.
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              {uploadPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={() => {
                    setUploadPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <Eraser className="w-3.5 h-3.5 mr-1" /> Ganti gambar
                </Button>
              )}
            </TabsContent>
          </Tabs>

          <div className="px-6 py-4 bg-muted/20 border-t border-border/40 space-y-4">
            <div className="flex items-center">
              <label className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useAdobeStyle}
                  onChange={(e) => setUseAdobeStyle(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/40 w-4 h-4 cursor-pointer"
                />
                Tampilkan metadata ala Adobe PDF (Digitally Signed)
              </label>
            </div>

            {useAdobeStyle && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nama Penandatangan
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Masukkan nama Anda..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="px-6 pb-6 pt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleApply}
              className="rounded-xl gap-2 glow-primary"
            >
              <Check className="w-4 h-4" />
              Gunakan Tanda Tangan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
