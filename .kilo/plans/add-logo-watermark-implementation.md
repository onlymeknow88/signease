# Implementasi Logo Watermark pada Signature

## Status: Ready for Implementation

Fitur ini menambahkan logo watermark dari `/public/logo.png` ke dalam signature yang ditempelkan di PDF certificate. Logo akan muncul semi-transparan di pojok kanan bawah signature.

---

## File 1: `src/lib/utils.ts`

Tambahkan dua fungsi baru **DI AKHIR FILE** (setelah fungsi `generateTextImage`):

```typescript
/**
 * Converts an image URL to a data URL (base64).
 * Used for loading logo from public folder.
 */
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

/**
 * Adds a logo watermark to an existing signature image.
 * Logo is placed in the bottom-right corner with semi-transparency.
 */
export function addLogoWatermark(
  signatureDataUrl: string,
  logoDataUrl: string,
  logoSize: number = 0.25, // Logo size as percentage of signature size (0.25 = 25%)
  opacity: number = 0.3 // Logo opacity (0.3 = 30%)
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

      // Calculate logo dimensions (proportional to signature)
      const maxLogoSize = Math.min(canvas.width, canvas.height) * logoSize;
      const logoAspect = logoImg.width / logoImg.height;
      let logoW = maxLogoSize;
      let logoH = maxLogoSize / logoAspect;
      
      if (logoH > maxLogoSize) {
        logoH = maxLogoSize;
        logoW = maxLogoSize * logoAspect;
      }

      // Position logo in bottom-right corner with padding
      const padding = 10;
      const logoX = canvas.width - logoW - padding;
      const logoY = canvas.height - logoH - padding;

      // Draw logo with transparency
      ctx.globalAlpha = opacity;
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL("image/png"));
    });
  });
}
```

---

## File 2: `src/lib/store.ts`

### A. Tambahkan di interface `ESignStore` (sekitar baris 89-108):

Cari bagian interface dan tambahkan dua property baru:

```typescript
interface ESignStore {
  // ... existing properties
  
  // Logo watermark
  logoWatermarkEnabled: boolean;
  logoDataUrl: string | null;
  
  // ... existing methods
  
  setLogoWatermarkEnabled: (enabled: boolean) => void;
  loadLogo: () => Promise<void>;
}
```

### B. Tambahkan initial state (sekitar baris 150-180):

Di dalam `create<ESignStore>()`, tambahkan:

```typescript
// Logo watermark
logoWatermarkEnabled: false,
logoDataUrl: null,
```

### C. Tambahkan methods (sebelum closing bracket terakhir):

```typescript
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

---

## File 3: `src/components/SignaturePad.tsx`

### A. Import (baris 37-45):

Tambahkan `logoWatermarkEnabled`, `logoDataUrl`, `setLogoWatermarkEnabled`, `loadLogo` ke destructuring:

```typescript
const {
  addSavedSignature,
  setPlacingMode,
  setPendingCert,
  certificates,
  loadCertificates,
  validateCertificatePassword,
  user,
  logoWatermarkEnabled,      // ← TAMBAHKAN
  logoDataUrl,                // ← TAMBAHKAN
  setLogoWatermarkEnabled,    // ← TAMBAHKAN
  loadLogo,                   // ← TAMBAHKAN
} = useESignStore();
```

### B. Load logo on mount (tambahkan useEffect baru setelah baris 69):

```typescript
// Load logo on mount
useEffect(() => {
  if (!logoDataUrl) {
    loadLogo();
  }
}, [logoDataUrl, loadLogo]);
```

### C. Modifikasi `handleApply` function (sekitar baris 206-228):

Ganti bagian yang ada dengan:

```typescript
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
    
    // Add watermark if enabled
    if (logoWatermarkEnabled && logoDataUrl) {
      const { addLogoWatermark } = await import("@/lib/utils");
      dataUrl = await addLogoWatermark(dataUrl, logoDataUrl);
    }
    
    // Go to step 2 — cert selector
    setPendingDataUrl(dataUrl);
    setStep("cert");
  }
};
```

### D. Tambahkan UI checkbox (sekitar baris 475-490, setelah Adobe-style checkbox):

Cari bagian di mana ada checkbox "Adobe-style signature" dan tambahkan checkbox baru di bawahnya:

```typescript
{/* Adobe-style signature checkbox - YANG SUDAH ADA */}
<label className="flex items-center gap-2 cursor-pointer select-none">
  <input
    type="checkbox"
    checked={useAdobeStyle}
    onChange={(e) => setUseAdobeStyle(e.target.checked)}
    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
  />
  <span className="text-xs text-on-surface">
    Gaya tanda tangan Adobe (termasuk nama & stempel waktu)
  </span>
</label>

{/* Logo watermark checkbox - TAMBAHKAN INI */}
<label className="flex items-center gap-2 cursor-pointer select-none mt-2">
  <input
    type="checkbox"
    checked={logoWatermarkEnabled}
    onChange={(e) => setLogoWatermarkEnabled(e.target.checked)}
    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
    disabled={!logoDataUrl}
  />
  <span className="text-xs text-on-surface">
    Tambahkan logo watermark {!logoDataUrl && "(loading...)"}
  </span>
</label>
```

---

## Cara Testing

1. Pastikan file `/public/logo.png` ada
2. Buka aplikasi dan buat signature baru
3. Centang checkbox "Tambahkan logo watermark"
4. Klik "Lanjutkan" untuk melihat preview
5. Verify logo muncul di pojok kanan bawah dengan transparansi 30%
6. Apply ke PDF dan verify watermark tetap ada

---

## Konfigurasi Watermark

Default settings:
- **Size**: 25% dari ukuran signature
- **Opacity**: 30%
- **Position**: Bottom-right dengan padding 10px

Untuk mengubah, edit parameter di `addLogoWatermark()` call di `handleApply`:

```typescript
dataUrl = await addLogoWatermark(
  dataUrl, 
  logoDataUrl,
  0.20,  // size: 20% instead of 25%
  0.5    // opacity: 50% instead of 30%
);
```

---

## Notes

- Logo harus tersedia di `/public/logo.png`
- Format yang didukung: PNG, JPG, SVG
- Watermark diterapkan SETELAH Adobe-style signature (jika diaktifkan)
- Logo di-cache di store setelah pertama kali dimuat
- Error loading logo akan di-log ke console tanpa menghentikan flow
