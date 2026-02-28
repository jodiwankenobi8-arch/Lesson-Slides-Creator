// PPTX Extractor - extracts slide text, notes, and hyperlinks

import JSZip from 'jszip';
import { xml2js } from 'xml-js';
import type { ReferenceChunk } from '../types/extraction';

interface SlideData {
  slideNumber: number;
  text: string;
  notes: string;
  hyperlinks: string[];
}

/**
 * Extract text content from PPTX file
 * 
 * Creates chunks:
 * - 1 chunk for slide text (if present)
 * - 1 chunk for speaker notes (if present)
 * - 1 chunk for hyperlinks (if present)
 */
export async function extractPPTX(
  file: File,
  fileId: string
): Promise<ReferenceChunk[]> {
  try {
    const zip = await JSZip.loadAsync(file);
    const slides = await extractSlides(zip);
    
    const chunks: ReferenceChunk[] = [];

    for (const slide of slides) {
      const slideLabel = `Slide ${slide.slideNumber}`;

      // Chunk 1: Slide text content
      if (slide.text.trim().length > 0) {
        chunks.push({
          chunkId: crypto.randomUUID(),
          fileId,
          pageOrSlide: slide.slideNumber,
          source: 'pptx',
          text: slide.text.trim(),
          metadata: {
            section: 'slide_text',
            slideLabel,
          },
        });
      }

      // Chunk 2: Speaker notes
      if (slide.notes.trim().length > 0) {
        chunks.push({
          chunkId: crypto.randomUUID(),
          fileId,
          pageOrSlide: slide.slideNumber,
          source: 'pptx',
          text: `[Speaker Notes]\n${slide.notes.trim()}`,
          metadata: {
            section: 'speaker_notes',
            slideLabel,
          },
        });
      }

      // Chunk 3: Hyperlinks
      if (slide.hyperlinks.length > 0) {
        chunks.push({
          chunkId: crypto.randomUUID(),
          fileId,
          pageOrSlide: slide.slideNumber,
          source: 'pptx',
          text: `[Links]\n${slide.hyperlinks.join('\n')}`,
          metadata: {
            section: 'hyperlinks',
            slideLabel,
          },
        });
      }
    }

    return chunks;
  } catch (error) {
    console.error('PPTX extraction error:', error);
    throw new Error(`Failed to extract PPTX: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract all slides from PPTX zip
 */
async function extractSlides(zip: JSZip): Promise<SlideData[]> {
  const slides: SlideData[] = [];

  // Get slide files (ppt/slides/slide1.xml, slide2.xml, etc.)
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
      return numA - numB;
    });

  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i];
    const slideNumber = i + 1; // 1-based

    // Extract slide text
    const slideText = await extractSlideText(zip, slidePath);

    // Extract speaker notes
    const notesPath = slidePath.replace('/slides/', '/notesSlides/').replace('slide', 'notesSlide');
    const notes = await extractNotesText(zip, notesPath);

    // Extract hyperlinks
    const hyperlinks = await extractHyperlinks(zip, slidePath);

    slides.push({
      slideNumber,
      text: slideText,
      notes,
      hyperlinks,
    });
  }

  return slides;
}

/**
 * Extract text from slide XML
 */
async function extractSlideText(zip: JSZip, slidePath: string): Promise<string> {
  try {
    const slideFile = zip.file(slidePath);
    if (!slideFile) return '';

    const xml = await slideFile.async('text');
    const parsed = xml2js(xml, { compact: true }) as any;

    const textElements: string[] = [];
    extractTextRecursive(parsed, textElements);

    return textElements.join('\n');
  } catch (error) {
    console.error(`Error extracting text from ${slidePath}:`, error);
    return '';
  }
}

/**
 * Extract speaker notes from notes XML
 */
async function extractNotesText(zip: JSZip, notesPath: string): Promise<string> {
  try {
    const notesFile = zip.file(notesPath);
    if (!notesFile) return '';

    const xml = await notesFile.async('text');
    const parsed = xml2js(xml, { compact: true }) as any;

    const textElements: string[] = [];
    extractTextRecursive(parsed, textElements);

    return textElements.join('\n');
  } catch (error) {
    // Notes may not exist for all slides
    return '';
  }
}

/**
 * Extract hyperlinks from slide XML
 */
async function extractHyperlinks(zip: JSZip, slidePath: string): Promise<string[]> {
  try {
    const slideFile = zip.file(slidePath);
    if (!slideFile) return [];

    const xml = await slideFile.async('text');
    
    // Extract relationship IDs from hyperlinks
    const hlinkClickMatches = xml.matchAll(/r:id=\"(rId\d+)\"/g);
    const relIds = Array.from(hlinkClickMatches).map(m => m[1]);

    if (relIds.length === 0) return [];

    // Get relationships file
    const relsPath = slidePath.replace('/slides/', '/slides/_rels/') + '.rels';
    const relsFile = zip.file(relsPath);
    if (!relsFile) return [];

    const relsXml = await relsFile.async('text');
    const relsParsed = xml2js(relsXml, { compact: true }) as any;

    // Extract URLs from relationships
    const hyperlinks: string[] = [];
    const relationships = Array.isArray(relsParsed?.Relationships?.Relationship)
      ? relsParsed.Relationships.Relationship
      : [relsParsed?.Relationships?.Relationship].filter(Boolean);

    for (const rel of relationships) {
      if (relIds.includes(rel?._attributes?.Id)) {
        const target = rel?._attributes?.Target;
        if (target && (target.startsWith('http://') || target.startsWith('https://'))) {
          hyperlinks.push(target);
        }
      }
    }

    return hyperlinks;
  } catch (error) {
    console.error(`Error extracting hyperlinks from ${slidePath}:`, error);
    return [];
  }
}

/**
 * Recursively extract text elements from parsed XML
 * PowerPoint uses <a:t> tags for text content
 */
function extractTextRecursive(obj: any, textElements: string[]): void {
  if (!obj || typeof obj !== 'object') return;

  // Check if this is a text element
  if (obj['a:t']?._text) {
    textElements.push(String(obj['a:t']._text));
  }

  // Recurse into child elements
  for (const key in obj) {
    if (key !== '_attributes' && key !== '_text') {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach(item => extractTextRecursive(item, textElements));
      } else if (typeof value === 'object') {
        extractTextRecursive(value, textElements);
      }
    }
  }
}