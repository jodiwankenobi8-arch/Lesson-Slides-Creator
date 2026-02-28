// ZIP file extraction utility
// Extracts supported files from ZIP archives in the browser (fast, private, no server load)

import JSZip from 'jszip';

const SUPPORTED_EXTENSIONS = ['.pptx', '.pdf', '.png', '.jpg', '.jpeg'];
const MAX_EXTRACTED_FILES = 50; // Prevent zip bombs
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB total for all extracted files

interface ExtractionResult {
  files: File[];
  skipped: string[];
  errors: string[];
}

/**
 * Extracts supported files from a ZIP archive
 * 
 * Features:
 * - Unzips in browser (fast, private)
 * - Filters to supported file types only
 * - Ignores system files (__MACOSX, .DS_Store)
 * - Protects against zip bombs
 * - Returns detailed results with skipped files
 */
export async function extractZip(zipFile: File): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    files: [],
    skipped: [],
    errors: [],
  };

  try {
    // Load the ZIP file
    const zip = await JSZip.loadAsync(zipFile);
    let totalSize = 0;

    // Process each file in the ZIP
    for (const filename in zip.files) {
      const entry = zip.files[filename];

      // Skip directories
      if (entry.dir) {
        continue;
      }

      // Skip system files
      if (
        filename.startsWith('__MACOSX') ||
        filename.includes('/.') ||
        filename.startsWith('.DS_Store') ||
        filename.endsWith('.DS_Store')
      ) {
        continue;
      }

      // Check if this is a supported file type
      const lower = filename.toLowerCase();
      const isSupported = SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));

      if (!isSupported) {
        result.skipped.push(filename);
        continue;
      }

      // Protect against too many files (zip bomb protection)
      if (result.files.length >= MAX_EXTRACTED_FILES) {
        result.errors.push(
          `ZIP contains too many files (max ${MAX_EXTRACTED_FILES}). Remaining files skipped.`
        );
        break;
      }

      try {
        // Extract the file as a blob
        const blob = await entry.async('blob');

        // Check total extracted size (zip bomb protection)
        totalSize += blob.size;
        if (totalSize > MAX_TOTAL_SIZE) {
          result.errors.push(
            `ZIP contents exceed ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB limit. Remaining files skipped.`
          );
          break;
        }

        // Get clean filename (remove directory path if present)
        const cleanFilename = filename.split('/').pop() || filename;

        // Create a new File object with proper type
        const mimeType = getMimeType(cleanFilename);
        const newFile = new File([blob], cleanFilename, {
          type: mimeType,
          lastModified: entry.date?.getTime() || Date.now(),
        });

        result.files.push(newFile);
      } catch (err) {
        console.error(`Error extracting ${filename}:`, err);
        result.errors.push(`Failed to extract ${filename}`);
      }
    }

    // Success message if files were extracted
    if (result.files.length > 0) {
      console.log(`✅ Extracted ${result.files.length} files from ${zipFile.name}`);
      if (result.skipped.length > 0) {
        console.log(`⏭️  Skipped ${result.skipped.length} unsupported files`);
      }
    } else {
      result.errors.push('No supported files found in ZIP');
    }
  } catch (err) {
    console.error('Error reading ZIP file:', err);
    result.errors.push(
      err instanceof Error ? err.message : 'Failed to read ZIP file'
    );
  }

  return result;
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();

  const mimeTypes: Record<string, string> = {
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Check if a file is a ZIP file
 */
export function isZipFile(file: File): boolean {
  return (
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.name.toLowerCase().endsWith('.zip')
  );
}