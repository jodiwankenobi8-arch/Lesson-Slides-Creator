/**
 * Image Optimizer
 * 
 * Converts uploaded images to WebP for faster loading.
 * Reduces file size by 30-80% vs PNG/JPEG.
 * 
 * FEATURES:
 * - PNG → WebP conversion
 * - JPEG → WebP conversion
 * - Maintains quality
 * - Automatic fallback if conversion fails
 * - Client-side conversion (no server needed)
 * - Skips small files (<200KB) to avoid overhead
 */

interface OptimizeImageOptions {
  quality?: number; // 0-1, default 0.85
  maxWidth?: number; // Max width in pixels, default no limit
  maxHeight?: number; // Max height in pixels, default no limit
}

const SKIP_THRESHOLD = 200 * 1024; // 200KB - skip optimization for smaller files

/**
 * Convert image file to WebP format
 * Returns optimized WebP blob or original if conversion fails
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<{ blob: Blob; isOptimized: boolean; originalSize: number; optimizedSize: number }> {
  const { quality = 0.85, maxWidth, maxHeight } = options;
  
  // Skip optimization for small files (<200KB) - not worth the overhead
  if (file.size < SKIP_THRESHOLD) {
    console.log('ℹ️ Skipping optimization for small file (<200KB)');
    return {
      blob: file,
      isOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }
  
  // Check if browser supports WebP
  if (!supportsWebP()) {
    console.warn('⚠️ WebP not supported, using original image');
    return {
      blob: file,
      isOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }
  
  // Only optimize PNG and JPEG
  if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg')) {
    console.log('ℹ️ Skipping optimization for', file.type);
    return {
      blob: file,
      isOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }
  
  try {
    // Load image
    const img = await loadImage(file);
    
    // Calculate dimensions (with optional resize)
    let width = img.width;
    let height = img.height;
    
    if (maxWidth && width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (maxHeight && height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Draw image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to WebP
    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert to WebP'));
          }
        },
        'image/webp',
        quality
      );
    });
    
    const originalSize = file.size;
    const optimizedSize = webpBlob.size;
    const savings = ((originalSize - optimizedSize) / originalSize) * 100;
    
    console.log('✅ Image optimized:', {
      original: `${(originalSize / 1024).toFixed(1)}KB`,
      optimized: `${(optimizedSize / 1024).toFixed(1)}KB`,
      savings: `${savings.toFixed(1)}%`,
      dimensions: `${width}x${height}`,
    });
    
    return {
      blob: webpBlob,
      isOptimized: true,
      originalSize,
      optimizedSize,
    };
  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    return {
      blob: file,
      isOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Check if browser supports WebP
 */
let webpSupport: boolean | null = null;

export function supportsWebP(): boolean {
  if (webpSupport !== null) {
    return webpSupport;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/webp');
    webpSupport = dataUrl.indexOf('data:image/webp') === 0;
    return webpSupport;
  } catch {
    webpSupport = false;
    return false;
  }
}

/**
 * Optimize multiple images in batch
 * Returns array of optimized blobs
 */
export async function optimizeImages(
  files: File[],
  options?: OptimizeImageOptions,
  onProgress?: (index: number, total: number) => void
): Promise<Array<{ file: File; blob: Blob; isOptimized: boolean }>> {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length);
    
    const result = await optimizeImage(file, options);
    results.push({
      file,
      ...result,
    });
  }
  
  return results;
}

/**
 * Get recommended optimization settings based on use case
 */
export function getOptimizationPreset(preset: 'slide' | 'thumbnail' | 'icon'): OptimizeImageOptions {
  switch (preset) {
    case 'slide':
      // Full quality for lesson slides
      return {
        quality: 0.9,
        maxWidth: 1920,
        maxHeight: 1080,
      };
    
    case 'thumbnail':
      // Medium quality for thumbnails
      return {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 300,
      };
    
    case 'icon':
      // Lower quality for small icons
      return {
        quality: 0.7,
        maxWidth: 128,
        maxHeight: 128,
      };
    
    default:
      return { quality: 0.85 };
  }
}