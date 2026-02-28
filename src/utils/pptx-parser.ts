import JSZip from 'jszip';

export interface PPTXSlide {
  slideNumber: number;
  title?: string;
  content: string[];
  images: Array<{
    id: string;
    dataUrl: string;
    type: string;
  }>;
  backgroundColor?: string;
  notes?: string;
  rawXml?: string;
  thumbnail?: string;
}

export interface PPTXTheme {
  colorScheme: {
    background1?: string;
    background2?: string;
    text1?: string;
    text2?: string;
    accent1?: string;
    accent2?: string;
    accent3?: string;
    accent4?: string;
    accent5?: string;
    accent6?: string;
  };
  fontScheme: {
    majorFont?: string;
    minorFont?: string;
  };
}

export interface PPTXAnalysis {
  totalSlides: number;
  slides: PPTXSlide[];
  theme: PPTXTheme;
  metadata: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
  };
  structure: {
    hasIntroSlides: boolean;
    hasContentSlides: boolean;
    hasSummarySlides: boolean;
    estimatedSections: string[];
  };
  extractedContent: {
    discussionQuestions: string[];
    storyPages: Array<{
      pageNumber: number;
      text: string;
      hasImage: boolean;
    }>;
  };
}

/**
 * Convert Google Drive/Dropbox/OneDrive sharing URLs to direct download links
 */
function convertToDirectDownloadUrl(url: string): string {
  // Google Drive: convert sharing link to direct download
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
  }
  
  // Dropbox: add dl=1 parameter
  if (url.includes('dropbox.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('dl', '1');
    return urlObj.toString();
  }
  
  // OneDrive: convert sharing link to direct download
  if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
    // For OneDrive, we need to append ?download=1
    return url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
  }
  
  return url;
}

/**
 * Fetch file from URL with CORS proxy fallback
 */
export async function fetchPPTXFromURL(url: string): Promise<Blob> {
  // Convert sharing URLs to direct download URLs
  const directUrl = convertToDirectDownloadUrl(url);
  
  let directFetchError: Error | null = null;
  const proxyErrors: { proxy: string; error: string }[] = [];
  
  try {
    // Try direct fetch first
    const response = await fetch(directUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Validate that we got a valid file (not HTML)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Received HTML instead of PowerPoint file. The URL might be a sharing page instead of a direct download link.');
    }
    
    // Check if the blob is actually a zip file (PPTX files are zip files)
    const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
    const header = new Uint8Array(arrayBuffer);
    const isZip = header[0] === 0x50 && header[1] === 0x4B; // PK signature
    
    if (!isZip) {
      throw new Error('File does not appear to be a valid PowerPoint file (missing ZIP signature)');
    }
    
    return blob;
  } catch (error) {
    directFetchError = error instanceof Error ? error : new Error('Unknown error');
    
    // Try multiple CORS proxies in order of reliability
    const corsProxies = [
      { name: 'corsproxy.io', url: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}` },
      { name: 'api.allorigins.win', url: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
      { name: 'corsproxy.org', url: (url: string) => `https://corsproxy.org/?${encodeURIComponent(url)}` }
    ];
    
    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy.url(directUrl);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`Proxy returned HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Validate blob
        if (blob.size < 100) {
          throw new Error('File too small to be a valid PowerPoint file');
        }
        
        const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
        const header = new Uint8Array(arrayBuffer);
        const isZip = header[0] === 0x50 && header[1] === 0x4B;
        
        if (!isZip) {
          throw new Error('File does not appear to be a valid PowerPoint file');
        }
        
        return blob;
      } catch (proxyError) {
        const errorMsg = proxyError instanceof Error ? proxyError.message : 'Unknown error';
        proxyErrors.push({ proxy: proxy.name, error: errorMsg });
      }
    }
    
    // All methods failed - throw a simple error
    throw new Error('Unable to download file from URL. Please download the file to your computer and upload it directly instead.');
  }
}

/**
 * Parse XML string using browser's DOMParser
 */
function parseXML(xmlString: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, 'text/xml');
}

/**
 * Get text content from an XML element
 */
function getTextContent(element: Element | null, tagName: string): string {
  if (!element) return '';
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent || '';
}

/**
 * Get attribute value from an XML element
 */
function getAttributeValue(element: Element | null, tagName: string, attrName: string): string {
  if (!element) return '';
  const el = element.getElementsByTagName(tagName)[0];
  return el?.getAttribute(attrName) || '';
}

/**
 * Parse a PowerPoint file and extract structure, content, and styling
 */
export async function parsePPTX(file: File | Blob): Promise<PPTXAnalysis> {
  try {
    const zip = await JSZip.loadAsync(file);
    
    // Extract metadata
    const metadata = await extractMetadata(zip);
    
    // Extract theme (colors and fonts)
    const theme = await extractTheme(zip);
    
    // Extract slides
    const slides = await extractSlides(zip);
    
    // Analyze structure
    const structure = analyzeStructure(slides);
    
    // Extract content
    const extractedContent = extractContent(slides);
    
    return {
      totalSlides: slides.length,
      slides,
      theme,
      metadata,
      structure,
      extractedContent
    };
  } catch (error) {
    console.error('Error parsing PPTX:', error);
    throw new Error('Failed to parse PowerPoint file');
  }
}

/**
 * Extract metadata from core.xml
 */
async function extractMetadata(zip: JSZip): Promise<PPTXAnalysis['metadata']> {
  try {
    const coreXml = await zip.file('docProps/core.xml')?.async('text');
    if (!coreXml) return {};
    
    const doc = parseXML(coreXml);
    
    return {
      title: getTextContent(doc.documentElement, 'dc:title'),
      author: getTextContent(doc.documentElement, 'dc:creator'),
      created: getTextContent(doc.documentElement, 'dcterms:created'),
      modified: getTextContent(doc.documentElement, 'dcterms:modified')
    };
  } catch (error) {
    console.warn('Could not extract metadata:', error);
    return {};
  }
}

/**
 * Extract theme colors and fonts from theme1.xml
 */
async function extractTheme(zip: JSZip): Promise<PPTXTheme> {
  try {
    const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('text');
    if (!themeXml) return { colorScheme: {}, fontScheme: {} };
    
    const doc = parseXML(themeXml);
    const colorScheme: PPTXTheme['colorScheme'] = {};
    const fontScheme: PPTXTheme['fontScheme'] = {};
    
    // Extract color scheme
    const clrScheme = doc.getElementsByTagName('a:clrScheme')[0];
    if (clrScheme) {
      const colorMap: { [key: string]: keyof PPTXTheme['colorScheme'] } = {
        'a:dk1': 'background1',
        'a:lt1': 'background2',
        'a:dk2': 'text1',
        'a:lt2': 'text2',
        'a:accent1': 'accent1',
        'a:accent2': 'accent2',
        'a:accent3': 'accent3',
        'a:accent4': 'accent4',
        'a:accent5': 'accent5',
        'a:accent6': 'accent6'
      };
      
      for (const [xmlKey, colorKey] of Object.entries(colorMap)) {
        const colorEl = clrScheme.getElementsByTagName(xmlKey)[0];
        if (colorEl) {
          // Try srgbClr first
          const srgbClr = colorEl.getElementsByTagName('a:srgbClr')[0];
          if (srgbClr?.getAttribute('val')) {
            colorScheme[colorKey] = `#${srgbClr.getAttribute('val')}`;
          } else {
            // Try sysClr
            const sysClr = colorEl.getElementsByTagName('a:sysClr')[0];
            if (sysClr?.getAttribute('lastClr')) {
              colorScheme[colorKey] = `#${sysClr.getAttribute('lastClr')}`;
            }
          }
        }
      }
    }
    
    // Extract font scheme
    const fontSchemeEl = doc.getElementsByTagName('a:fontScheme')[0];
    if (fontSchemeEl) {
      const majorFontEl = fontSchemeEl.getElementsByTagName('a:majorFont')[0];
      if (majorFontEl) {
        const latinEl = majorFontEl.getElementsByTagName('a:latin')[0];
        if (latinEl?.getAttribute('typeface')) {
          fontScheme.majorFont = latinEl.getAttribute('typeface') || undefined;
        }
      }
      
      const minorFontEl = fontSchemeEl.getElementsByTagName('a:minorFont')[0];
      if (minorFontEl) {
        const latinEl = minorFontEl.getElementsByTagName('a:latin')[0];
        if (latinEl?.getAttribute('typeface')) {
          fontScheme.minorFont = latinEl.getAttribute('typeface') || undefined;
        }
      }
    }
    
    return { colorScheme, fontScheme };
  } catch (error) {
    console.warn('Could not extract theme:', error);
    return { colorScheme: {}, fontScheme: {} };
  }
}

/**
 * Extract all slides and their content
 */
async function extractSlides(zip: JSZip): Promise<PPTXSlide[]> {
  try {
    const slides: PPTXSlide[] = [];
    
    // Find all slide files
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.match(/ppt\/slides\/slide\d+\.xml$/)
    );
    
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
      return numA - numB;
    });
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideXml = await zip.file(slideFile)?.async('text');
      
      if (slideXml) {
        const doc = parseXML(slideXml);
        const slide = await parseSlide(doc, i + 1, zip, slideFile);
        slides.push(slide);
      }
    }
    
    return slides;
  } catch (error) {
    console.warn('Could not extract slides:', error);
    return [];
  }
}

/**
 * Parse individual slide content
 */
async function parseSlide(doc: Document, slideNumber: number, zip: JSZip, slideFile: string): Promise<PPTXSlide> {
  const slide: PPTXSlide = {
    slideNumber,
    content: [],
    images: []
  };
  
  try {
    // Extract text content from shapes
    const shapes = doc.getElementsByTagName('p:sp');
    
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const textElements = shape.getElementsByTagName('a:t');
      
      let shapeText = '';
      for (let j = 0; j < textElements.length; j++) {
        const text = textElements[j].textContent?.trim() || '';
        if (text) {
          shapeText += text + ' ';
        }
      }
      
      shapeText = shapeText.trim();
      
      if (shapeText) {
        // First substantial text becomes the title
        if (!slide.title && shapeText.length > 5) {
          slide.title = shapeText;
        } else {
          slide.content.push(shapeText);
        }
      }
    }
    
    // Get slide relationships to find images
    const slideNum = slideFile.match(/slide(\d+)\.xml$/)?.[1];
    const relsFile = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const relsXml = await zip.file(relsFile)?.async('text');
    
    const imageRels: { [key: string]: string } = {};
    if (relsXml) {
      const relsDoc = parseXML(relsXml);
      const relationships = relsDoc.getElementsByTagName('Relationship');
      for (let i = 0; i < relationships.length; i++) {
        const rel = relationships[i];
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        const type = rel.getAttribute('Type');
        if (id && target && type?.includes('image')) {
          imageRels[id] = target.replace('../', 'ppt/');
        }
      }
    }
    
    // Extract images
    const pics = doc.getElementsByTagName('p:pic');
    for (let i = 0; i < pics.length; i++) {
      const blip = pics[i].getElementsByTagName('a:blip')[0];
      const embedId = blip?.getAttribute('r:embed');
      if (embedId && imageRels[embedId]) {
        const imagePath = imageRels[embedId];
        const imageFile = zip.file(imagePath);
        if (imageFile) {
          const imageData = await imageFile.async('base64');
          const imageExt = imagePath.split('.').pop()?.toLowerCase() || 'png';
          const mimeType = imageExt === 'jpg' || imageExt === 'jpeg' ? 'jpeg' : imageExt;
          slide.images.push({
            id: embedId,
            dataUrl: `data:image/${mimeType};base64,${imageData}`,
            type: imageExt
          });
        }
      }
    }
    
    // Try to extract background color
    const solidFills = doc.getElementsByTagName('a:solidFill');
    for (let i = 0; i < solidFills.length; i++) {
      const srgbClr = solidFills[i].getElementsByTagName('a:srgbClr')[0];
      if (srgbClr?.getAttribute('val')) {
        slide.backgroundColor = `#${srgbClr.getAttribute('val')}`;
        break;
      }
    }
    
    // Store raw XML for potential reconstruction
    slide.rawXml = new XMLSerializer().serializeToString(doc);
    
  } catch (error) {
    console.warn(`Could not parse slide ${slideNumber}:`, error);
  }
  
  return slide;
}

/**
 * Analyze the structure to identify sections
 */
function analyzeStructure(slides: PPTXSlide[]): PPTXAnalysis['structure'] {
  const sections: string[] = [];
  let hasIntroSlides = false;
  let hasContentSlides = false;
  let hasSummarySlides = false;
  
  for (const slide of slides) {
    const titleLower = slide.title?.toLowerCase() || '';
    const contentLower = slide.content.join(' ').toLowerCase();
    const allText = (titleLower + ' ' + contentLower).toLowerCase();
    
    // Detect intro slides
    if (allText.match(/welcome|introduction|agenda|objectives|learning goals|today we will/i)) {
      hasIntroSlides = true;
      if (!sections.includes('Introduction')) sections.push('Introduction');
    }
    
    // Detect UFLI/Phonics slides
    if (allText.match(/ufli|phonics|phonemic awareness|visual drill|auditory drill|blending|sound/i)) {
      hasContentSlides = true;
      if (!sections.includes('UFLI Phonics')) sections.push('UFLI Phonics');
    }
    
    // Detect sight words
    if (allText.match(/sight word|high frequency|tricky word/i)) {
      hasContentSlides = true;
      if (!sections.includes('Sight Words')) sections.push('Sight Words');
    }
    
    // Detect reading/Savvas
    if (allText.match(/savvas|reading|story|vocabulary|comprehension|book/i)) {
      hasContentSlides = true;
      if (!sections.includes('Reading')) sections.push('Reading');
    }
    
    // Detect summary/celebration
    if (allText.match(/celebration|summary|review|great job|you did it|wonderful work/i)) {
      hasSummarySlides = true;
      if (!sections.includes('Celebration')) sections.push('Celebration');
    }
  }
  
  return {
    hasIntroSlides,
    hasContentSlides,
    hasSummarySlides,
    estimatedSections: sections
  };
}

/**
 * Extract content from slides
 */
function extractContent(slides: PPTXSlide[]): PPTXAnalysis['extractedContent'] {
  const discussionQuestions: string[] = [];
  const storyPages: Array<{
    pageNumber: number;
    text: string;
    hasImage: boolean;
  }> = [];
  
  for (const slide of slides) {
    const titleLower = slide.title?.toLowerCase() || '';
    const contentLower = slide.content.join(' ').toLowerCase();
    const allText = (titleLower + ' ' + contentLower).toLowerCase();
    
    // Detect discussion questions
    if (allText.match(/question|discuss|think about|what do you think/i)) {
      discussionQuestions.push(...slide.content);
    }
    
    // Detect story pages
    if (allText.match(/story|page|chapter/i)) {
      storyPages.push({
        pageNumber: slide.slideNumber,
        text: slide.content.join(' '),
        hasImage: slide.images.length > 0
      });
    }
  }
  
  return {
    discussionQuestions,
    storyPages
  };
}