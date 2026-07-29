# Plan: Menambahkan Logo Watermark ke Signature

## Tujuan
Menambahkan logo watermark (dari `/public/logo.png`) ke dalam signature yang ditempelkan di PDF certificate.

## Analisis
- Logo akan ditambahkan sebagai watermark semi-transparan di pojok kanan bawah signature
- Logo harus dimuat sebagai data URL dari `/public/logo.png`
- Watermark akan diterapkan saat signature dibuat di `SignaturePad.tsx`
- Perlu menambahkan opsi toggle untuk mengaktifkan/nonaktifkan watermark

## File yang Perlu Dimodifikasi

### 1. `src/lib/utils.ts`
**Fungsi baru yang ditambahkan:**
- `imageToDataUrl(imagePath: string): Promise<string>` - Convert image file ke data URL
- `addLogoWatermark(signatureDataUrl, logoDataUrl, logoSize?, opacity?): Promise<string>` - Tambahkan logo watermark ke signature

### 2. `src/lib/store.ts`
**State baru:**
- `logoWatermarkEnabled: boolean` - Toggle untuk watermark
- `logoDataUrl: string | null` - Cache logo yang sudah di-load

**Methods baru:**
- `setLogoWatermarkEnabled(enabled: boolean)` - Toggle watermark
- `loadLogo(): Promise<void>` - Load logo dari `/public/logo.png`

### 3. `src/components/SignaturePad.tsx`
**Modifikasi:**
- Tambahkan checkbox "Tambahkan Logo Watermark" di bawah "Adobe-style signature"
- Saat `handleApply()` dipanggil, jika watermark enabled, panggil `addLogoWatermark()` sebelum menyimpan
- Load logo saat component mount

### 4. `src/lib/types.ts` (opsional)
Jika perlu tambahkan type untuk watermark config.

## Implementasi Detail

### Utils Functions (utils.ts)
```typescript
export function imageToDataUrl(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
    img.src = imagePath;
  });
}

export function addLogoWatermark(
  signatureDataUrl: string,
  logoDataUrl: string,
  logoSize: number = 0.25,
  opacity: number = 0.3
): Promise<string> {
  return new Promise((resolve) => {
    const sigImg = new Image();
    const logoImg = new Image();

    sigImg.src = signatureDataUrl;
    logoImg.src = logoDataUrl;

    Promise.all([
      new Promise((r) => { sigImg.onload = r; }),
      new Promise((r) => { logoImg.onload = r; })
    ]).then(() => {
      const canvas = document.createElement("canvas");
      canvas.width = sigImg.width;
      canvas.height = sigImg.height;
      const ctx = canvas.getContext("2d")!;

      // Draw original signature
      ctx.drawImage(sigImg, 0, 0);

      // Calculate logo dimensions
      const maxLogoSize = Math.min(canvas.width, canvas.height) * logoSize;
      const logoAspect = logoImg.width / logoImg.height;
      let logoW = maxLogoSize;
      let logoH = maxLogoSize / logoAspect;
      
      if (logoH > maxLogoSize) {
        logoH = maxLogoSize;
        logoW = maxLogoSize * logoAspect;
      }

      // Position in bottom-right with padding
      const padding = 10;
      const logoX = canvas.width - logoW - padding;
      const logoY = canvas.height - logoH - padding;

      // Draw with transparency
      ctx.globalAlpha = opacity;
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL("image/png"));
    });
  });
}
```

### Store Modifications (store.ts)
```typescript
interface ESignStore {
  // ... existing state
  logoWatermarkEnabled: boolean;
  logoDataUrl: string | null;
  
  // ... existing methods
  setLogoWatermarkEnabled: (enabled: boolean) => void;
  loadLogo: () => Promise<void>;
}

// In implementation:
logoWatermarkEnabled: false,
logoDataUrl: null,

setLogoWatermarkEnabled: (enabled) => set({ logoWatermarkEnabled: enabled }),

loadLogo: async () => {
  try {
    const { imageToDataUrl } = await import("./utils");
    const dataUrl = await imageToDataUrl("/logo.png");
    set({ logoDataUrl: dataUrl });
  } catch (error) {
    console.error("Failed to load logo:", error);
  }
},
```

### SignaturePad UI Modifications (SignaturePad.tsx)
```typescript
// Add state
const { logoWatermarkEnabled, logoDataUrl, setLogoWatermarkEnabled, loadLogo } = useESignStore();

// Load logo on mount
useEffect(() => {
  if (!logoDataUrl) {
    loadLogo();
  }
}, [logoDataUrl, loadLogo]);

// Modify handleApply
const handleApply = async () => {
  let dataUrl: string | null = null;

  // ... existing code to get dataUrl

  if (dataUrl) {
    if (useAdobeStyle) {
      dataUrl = await generateAdobeStyleSignature(dataUrl);
    }
    
    // Add watermark if enabled
    if (logoWatermarkEnabled && logoDataUrl) {
      const { addLogoWatermark } = await import("@/lib/utils");
      dataUrl = await addLogoWatermark(dataUrl, logoDataUrl);
    }
    
    setPendingDataUrl(dataUrl);
    setStep("cert");
  }
};

// Add checkbox in UI (below Adobe-style checkbox)
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={logoWatermarkEnabled}
    onChange={(e) => setLogoWatermarkEnabled(e.target.checked)}
    className="w-4 h-4 rounded border-gray-300"
  />
  <span className="text-xs text-on-surface">
    Tambahkan Logo Watermark
  </span>
</label>
```

## Testing Steps
1. Buka SignaturePad
2. Buat signature (draw/type/upload)
3. Centang checkbox "Tambahkan Logo Watermark"
4. Apply signature
5. Verify logo muncul di pojok kanan bawah signature dengan transparansi
6. Tempelkan ke PDF dan verify watermark tetap ada

## Notes
- Logo harus ada di `/public/logo.png`
- Default size: 25% dari signature
- Default opacity: 30%
- Position: bottom-right dengan padding 10px
