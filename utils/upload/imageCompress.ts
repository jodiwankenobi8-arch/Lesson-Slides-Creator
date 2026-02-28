/**
 * Image Compression - Automatic Safe Compression
 * 
 * ✅ Automatically compresses images only (safe)
 * ❌ Does NOT try to rewrite PPTX/PDF (unsafe + slow)
 * 
 * Converts large images to optimized JPEGs while maintaining quality
 */

export async function compressImageFile(
  file: File,
  opts: { maxSide?: number; quality?: number } = {}
): Promise<File> {
  const maxSide = opts.maxSide ?? 1920;
  const quality = opts.quality ?? 0.82;

  const img = await loadImage(file);
  const { width, height } = img;

  const scale = Math.min(1, maxSide / Math.max(width, height));
  if (scale >= 1) return file; // already small enough

  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality)
  );

  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}
