// Word Document (.docx) Extractor
// Extracts text from .docx files using mammoth.js

import mammoth from 'mammoth';
import type { ReferenceChunk } from '../types/extraction';

/**
 * Extract text from a Word document (.docx or .doc)
 * 
 * Returns:
 * - 1 chunk with all text content
 * 
 * Note: .doc (old format) may have limited support
 * .docx (newer format) fully supported
 */
export async function extractDOCX(
  file: File,
  fileId: string
): Promise<ReferenceChunk[]> {
  // Check if it's an old .doc file (not supported)
  if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
    throw new Error(
      'Old .doc format is not supported. Please convert to .docx format (File → Save As → Word Document (.docx) in Microsoft Word)'
    );
  }

  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });

    // Get extracted text
    const text = result.value.trim();

    // Log warnings if any
    if (result.messages.length > 0) {
      console.warn(`DOCX extraction warnings for ${file.name}:`, result.messages);
    }

    // Return as single chunk
    const chunks: ReferenceChunk[] = [];

    if (text.length > 0) {
      chunks.push({
        chunkId: crypto.randomUUID(),
        fileId,
        chunkType: 'text',
        content: text,
        pageOrSlide: 1,
        extractedAt: new Date().toISOString(),
        metadata: {
          wordCount: text.split(/\s+/).length,
          characterCount: text.length,
          hasFormatting: result.messages.some(m => 
            m.message.includes('style') || m.message.includes('format')
          ),
        },
      });
    } else {
      // Empty document - create placeholder
      console.warn(`No text extracted from ${file.name} - document may be empty or unsupported format`);
      chunks.push({
        chunkId: crypto.randomUUID(),
        fileId,
        chunkType: 'text',
        content: '[No text content extracted - document may be empty or contain only images]',
        pageOrSlide: 1,
        extractedAt: new Date().toISOString(),
        metadata: {
          wordCount: 0,
          characterCount: 0,
          isEmpty: true,
        },
      });
    }

    console.log(`✅ Extracted ${text.length} characters from ${file.name}`);
    return chunks;

  } catch (error) {
    console.error('Error extracting DOCX:', error);
    
    // Check if it's an old .doc file (not supported well)
    if (file.name.endsWith('.doc')) {
      throw new Error(
        'Old .doc format has limited support. Please convert to .docx for best results.'
      );
    }
    
    throw new Error(
      `Failed to extract Word document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a file is a Word document
 */
export function isDOCX(file: File): boolean {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  );
}