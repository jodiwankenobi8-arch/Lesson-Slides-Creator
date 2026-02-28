import { createWorker } from 'tesseract.js';

export interface AnalyzedReference {
  images: AnalyzedImage[];
  documents: AnalyzedDocument[];
  code: AnalyzedCode[];
  slideStructure?: SlideStructure;
  extractedData: {
    songs: { title: string; url?: string }[];
    ufliActivities: { type: string; content: string }[];
    sightWords: string[];
    vocabulary: { word: string; definition?: string }[];
    storyPages: { pageNumber: number; text: string }[];
    discussionQuestions: string[];
  };
}

export interface AnalyzedImage {
  name: string;
  type: 'powerpoint-slide' | 'ufli-screenshot' | 'book-page' | 'slide-picture' | 'other';
  extractedText: string;
  detectedContent: {
    hasSong?: boolean;
    songTitle?: string;
    hasPhonics?: boolean;
    phoneticPattern?: string;
    hasSightWord?: boolean;
    sightWords?: string[];
    hasVocabulary?: boolean;
    vocabularyWords?: string[];
    hasQuestion?: boolean;
    questions?: string[];
    pageNumber?: number;
  };
}

export interface AnalyzedDocument {
  name: string;
  content: string;
  extractedInfo: {
    lessonObjectives?: string[];
    materials?: string[];
    instructions?: string[];
    assessmentCriteria?: string[];
  };
  detectedContent?: {
    vocabularyWords?: string[];
    questions?: string[];
  };
}

export interface AnalyzedCode {
  name: string;
  content: string;
  slideDefinitions?: {
    type: string;
    title?: string;
    content?: string;
    metadata?: any;
  }[];
}

export interface SlideStructure {
  totalSlides: number;
  sections: {
    name: string;
    startSlide: number;
    endSlide: number;
    slideCount: number;
  }[];
}

export async function analyzeAllReferences(
  files: {
    powerpoint: Array<{ name: string; file?: File; type?: string; content?: string }>;
    slidePictures: Array<{ name: string; file?: File; type?: string; content?: string }>;
    code: Array<{ name: string; content?: string; type?: string }>;
    documentation: Array<{ name: string; content?: string; type?: string }>;
    savvasReference: Array<{ name: string; file?: File; type?: string; content?: string }>;
  },
  context?: {
    targetDay?: number;
    targetUnit?: number;
    targetWeek?: number;
  }
): Promise<AnalyzedReference> {
  const targetDay = context?.targetDay || 1;
  const targetUnit = context?.targetUnit || 1;
  const targetWeek = context?.targetWeek || 1;
  
  console.log('🔍 Starting comprehensive reference analysis...');
  console.log('📌 Target context: Unit', targetUnit, 'Week', targetWeek, 'Day', targetDay);
  console.log('📁 Received files:', {
    slidePictures: files.slidePictures.length,
    slidePicturesWithFileObjects: files.slidePictures.filter(f => f.file).length,
    code: files.code.length,
    codeWithContent: files.code.filter(f => f.content).length,
    documentation: files.documentation.length,
    docsWithContent: files.documentation.filter(f => f.content).length,
    savvasReference: files.savvasReference?.length || 0,
    savvasReferenceWithFiles: files.savvasReference?.filter(f => f.file).length || 0,
  });
  
  // Helper function to check if a file is an image
  const isImageFile = (file: { name: string; file?: File; type?: string }) => {
    if (file.type) {
      return file.type.startsWith('image/');
    }
    const ext = file.name.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext || '');
  };
  
  const analyzedImages: AnalyzedImage[] = [];
  const analyzedDocs: AnalyzedDocument[] = [];
  const analyzedCode: AnalyzedCode[] = [];
  
  const extractedData = {
    songs: [] as { title: string; url?: string }[],
    ufliActivities: [] as { type: string; content: string }[],
    sightWords: [] as string[],
    vocabulary: [] as { word: string; definition?: string }[],
    storyPages: [] as { pageNumber: number; text: string }[],
    discussionQuestions: [] as string[],
  };

  // Analyze images with OCR
  const worker = await createWorker('eng');
  
  console.log('🔍 Processing slidePictures for image analysis:');
  console.log(`  Total slidePictures: ${files.slidePictures.length}`);
  files.slidePictures.forEach((pic, i) => {
    console.log(`  [${i}] ${pic.name}:`, {
      hasFile: !!pic.file,
      type: pic.type,
      isImage: isImageFile(pic)
    });
  });
  
  // Process PowerPoint slide pictures (only images)
  for (const pic of files.slidePictures) {
    console.log(`📸 Checking ${pic.name}: hasFile=${!!pic.file}, isImage=${isImageFile(pic)}`);
    if (pic.file && isImageFile(pic)) {
      try {
        const imageUrl = URL.createObjectURL(pic.file);
        const { data: { text } } = await worker.recognize(imageUrl);
        
        const analyzed = analyzeImageContent(pic.name, text, 'slide-picture');
        analyzedImages.push(analyzed);
        
        // Extract data
        if (analyzed.detectedContent.hasSong && analyzed.detectedContent.songTitle) {
          extractedData.songs.push({ title: analyzed.detectedContent.songTitle });
        }
        if (analyzed.detectedContent.sightWords) {
          extractedData.sightWords.push(...analyzed.detectedContent.sightWords);
        }
        if (analyzed.detectedContent.vocabularyWords) {
          analyzed.detectedContent.vocabularyWords.forEach(word => {
            extractedData.vocabulary.push({ word });
          });
        }
        if (analyzed.detectedContent.questions) {
          extractedData.discussionQuestions.push(...analyzed.detectedContent.questions);
        }
        
        URL.revokeObjectURL(imageUrl);
        console.log(`✅ Analyzed: ${pic.name}`);
      } catch (error) {
        console.error(`❌ Error analyzing ${pic.name}:`, error);
      }
    } else if (pic.content) {
      // If it has text content but is not an image, treat as documentation
      const analyzed = analyzeDocument(pic.name, pic.content);
      analyzedDocs.push(analyzed);
      console.log(`✅ Analyzed as text document: ${pic.name}`);
    }
  }
  
  // Helper function to filter day-specific content
  const filterDayContent = (text: string, day: number): string => {
    // Look for day-specific sections in the text
    const dayPattern = new RegExp(`Day\\s*${day}[:\\s]([\\s\\S]*?)(?=Day\\s*\\d+|$)`, 'gi');
    const matches = text.match(dayPattern);
    
    if (matches && matches.length > 0) {
      console.log(`📌 Found Day ${day} specific content`);
      return matches.join('\n\n');
    }
    
    // If no day-specific sections found, return full text
    return text;
  };

  // Process Savvas reference materials
  if (files.savvasReference) {
    console.log(`📚 Processing ${files.savvasReference.length} Savvas reference files for Day ${targetDay}...`);
    
    for (const ref of files.savvasReference) {
      if (ref.file && isImageFile(ref)) {
        // Process images with OCR
        try {
          const imageUrl = URL.createObjectURL(ref.file);
          const { data: { text } } = await worker.recognize(imageUrl);
          
          // Filter to day-specific content
          const dayFilteredText = filterDayContent(text, targetDay);
          
          const analyzed = analyzeImageContent(ref.name, dayFilteredText, 'other');
          analyzedImages.push(analyzed);
          
          // Extract Savvas-specific data (only from day-specific content)
          if (analyzed.detectedContent.sightWords) {
            extractedData.sightWords.push(...analyzed.detectedContent.sightWords);
          }
          if (analyzed.detectedContent.vocabularyWords) {
            analyzed.detectedContent.vocabularyWords.forEach(word => {
              extractedData.vocabulary.push({ word });
            });
          }
          if (analyzed.detectedContent.questions) {
            extractedData.discussionQuestions.push(...analyzed.detectedContent.questions);
          }
          
          URL.revokeObjectURL(imageUrl);
          console.log(`✅ Analyzed Savvas image: ${ref.name} (Day ${targetDay} content)`);
        } catch (error) {
          console.error(`❌ Error analyzing ${ref.name}:`, error);
        }
      } else if (ref.content) {
        // Process text documents
        // Filter to day-specific content
        const dayFilteredContent = filterDayContent(ref.content, targetDay);
        
        const analyzed = analyzeDocument(ref.name, dayFilteredContent);
        analyzedDocs.push(analyzed);
        
        // Extract Savvas-specific data from documents (only from day-specific content)
        if (analyzed.detectedContent) {
          if (analyzed.detectedContent.vocabularyWords) {
            analyzed.detectedContent.vocabularyWords.forEach(word => {
              extractedData.vocabulary.push({ word });
            });
          }
          if (analyzed.detectedContent.questions) {
            extractedData.discussionQuestions.push(...analyzed.detectedContent.questions);
          }
        }
        
        console.log(`✅ Analyzed Savvas document: ${ref.name} (Day ${targetDay} content)`);
      }
    }
  }

  // Process documentation files
  for (const doc of files.documentation) {
    if (doc.content) {
      const analyzed = analyzeDocument(doc.name, doc.content);
      analyzedDocs.push(analyzed);
      console.log(`✅ Analyzed document: ${doc.name}`);
    }
  }

  // Process code files
  for (const codeFile of files.code) {
    if (codeFile.content) {
      const analyzed = analyzeCode(codeFile.name, codeFile.content);
      analyzedCode.push(analyzed);
      
      // Extract slide definitions from code
      if (analyzed.slideDefinitions) {
        console.log(`✅ Found ${analyzed.slideDefinitions.length} slide definitions in ${codeFile.name}`);
      }
    }
  }

  await worker.terminate();

  // Detect slide structure from analyzed content
  const slideStructure = detectSlideStructure(analyzedImages, analyzedCode);

  console.log('📊 Analysis complete!');
  console.log(`  - Images analyzed: ${analyzedImages.length}`);
  console.log(`  - Documents analyzed: ${analyzedDocs.length}`);
  console.log(`  - Code files analyzed: ${analyzedCode.length}`);
  console.log(`  - Songs found: ${extractedData.songs.length}`);
  console.log(`  - Sight words found: ${extractedData.sightWords.length}`);
  console.log(`  - Vocabulary words found: ${extractedData.vocabulary.length}`);
  console.log(`  - Discussion questions found: ${extractedData.discussionQuestions.length}`);

  return {
    images: analyzedImages,
    documents: analyzedDocs,
    code: analyzedCode,
    slideStructure,
    extractedData,
  };
}

function analyzeImageContent(name: string, text: string, defaultType: AnalyzedImage['type']): AnalyzedImage {
  const lowerText = text.toLowerCase();
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  const detectedContent: AnalyzedImage['detectedContent'] = {};

  // Detect song
  if (lowerText.includes('song') || lowerText.includes('sing') || lowerText.includes('music')) {
    detectedContent.hasSong = true;
    // Try to find song title
    const songLine = lines.find(line => 
      line.toLowerCase().includes('song') || 
      line.toLowerCase().includes('sing')
    );
    if (songLine) {
      detectedContent.songTitle = songLine.replace(/song/gi, '').replace(/sing/gi, '').trim();
    }
  }

  // Detect phonics
  const phonicsPatterns = /([a-z]_[a-z]|\/[^\/]+\/|phonics|sound|letter)/i;
  if (phonicsPatterns.test(text)) {
    detectedContent.hasPhonics = true;
    const match = text.match(/([a-z]_[a-z])\s*\/([^\/]+)\//i);
    if (match) {
      detectedContent.phoneticPattern = match[0];
    }
  }

  // Detect sight words - look for common patterns
  const sightWordIndicators = ['sight word', 'high-frequency', 'word of the day'];
  if (sightWordIndicators.some(indicator => lowerText.includes(indicator))) {
    detectedContent.hasSightWord = true;
    detectedContent.sightWords = [];
    
    // Extract words that appear after "sight word" or are in all caps
    lines.forEach(line => {
      if (line.length <= 15 && /^[A-Z]+$/.test(line) && line.length > 1) {
        detectedContent.sightWords!.push(line.toLowerCase());
      }
    });
  }

  // Detect vocabulary
  const vocabIndicators = ['vocabulary', 'definition', 'word:', 'means'];
  if (vocabIndicators.some(indicator => lowerText.includes(indicator))) {
    detectedContent.hasVocabulary = true;
    detectedContent.vocabularyWords = [];
    
    lines.forEach(line => {
      if (line.includes(':') || line.toLowerCase().includes('means')) {
        const word = line.split(':')[0].split('-')[0].trim();
        if (word.length > 2 && word.length < 20) {
          detectedContent.vocabularyWords!.push(word);
        }
      }
    });
  }

  // Detect questions
  const questions = lines.filter(line => 
    line.includes('?') || 
    /^(what|who|where|when|why|how|is|are|can|do|does|did)/i.test(line)
  );
  if (questions.length > 0) {
    detectedContent.hasQuestion = true;
    detectedContent.questions = questions;
  }

  // Detect page number
  const pageMatch = text.match(/page\s*(\d+)/i) || name.match(/page[\s-_]*(\d+)/i) || name.match(/(\d+)/);
  if (pageMatch) {
    detectedContent.pageNumber = parseInt(pageMatch[1]);
  }

  return {
    name,
    type: defaultType,
    extractedText: text,
    detectedContent,
  };
}

function analyzeDocument(name: string, content: string): AnalyzedDocument {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  const lowerText = content.toLowerCase();
  
  const extractedInfo: AnalyzedDocument['extractedInfo'] = {};
  const detectedContent: AnalyzedDocument['detectedContent'] = {};

  // Extract lesson objectives
  const objectiveIndicators = ['objective', 'goal', 'student will', 'swbat', 'learning target'];
  extractedInfo.lessonObjectives = lines.filter(line => 
    objectiveIndicators.some(indicator => line.toLowerCase().includes(indicator))
  );

  // Extract materials
  const materialIndicators = ['material', 'resource', 'need', 'supply', 'preparation'];
  extractedInfo.materials = lines.filter(line => 
    materialIndicators.some(indicator => line.toLowerCase().includes(indicator))
  );

  // Extract instructions/procedures
  const instructionIndicators = ['procedure', 'step', 'instruction', 'activity', 'teacher will'];
  extractedInfo.instructions = lines.filter(line => 
    instructionIndicators.some(indicator => line.toLowerCase().includes(indicator))
  );

  // Extract assessment criteria
  const assessmentIndicators = ['assessment', 'evaluate', 'check', 'observe', 'monitor'];
  extractedInfo.assessmentCriteria = lines.filter(line => 
    assessmentIndicators.some(indicator => line.toLowerCase().includes(indicator))
  );

  // Detect vocabulary and questions
  const vocabIndicators = ['vocabulary', 'definition', 'word:', 'means'];
  const questionIndicators = ['?', 'what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'can', 'do', 'does', 'did'];
  
  if (vocabIndicators.some(indicator => lowerText.includes(indicator))) {
    detectedContent.vocabularyWords = [];
    
    lines.forEach(line => {
      if (line.includes(':') || line.toLowerCase().includes('means')) {
        const word = line.split(':')[0].split('-')[0].trim();
        if (word.length > 2 && word.length < 20) {
          detectedContent.vocabularyWords!.push(word);
        }
      }
    });
  }

  if (questionIndicators.some(indicator => lowerText.includes(indicator))) {
    detectedContent.questions = lines.filter(line => 
      line.includes('?') || 
      /^(what|who|where|when|why|how|is|are|can|do|does|did)/i.test(line)
    );
  }

  return {
    name,
    content,
    extractedInfo,
    detectedContent,
  };
}

function analyzeCode(name: string, content: string): AnalyzedCode {
  const slideDefinitions: AnalyzedCode['slideDefinitions'] = [];

  // Parse slide definitions from code (looking for slide objects)
  const slidePattern = /slides\.push\(\s*\{([^}]+)\}\s*\)/g;
  let match;
  
  while ((match = slidePattern.exec(content)) !== null) {
    const slideObj = match[1];
    const typeMatch = slideObj.match(/type:\s*['"]([^'"]+)['"]/);
    const titleMatch = slideObj.match(/title:\s*['"]([^'"]+)['"]/);
    const contentMatch = slideObj.match(/content:\s*['"]([^'"]+)['"]/);
    
    if (typeMatch) {
      slideDefinitions.push({
        type: typeMatch[1],
        title: titleMatch?.[1],
        content: contentMatch?.[1],
      });
    }
  }

  // Also look for array literals
  const arrayPattern = /\{\s*id:[^}]+type:\s*['"]([^'"]+)['"][^}]*\}/g;
  while ((match = arrayPattern.exec(content)) !== null) {
    const slideStr = match[0];
    const typeMatch = slideStr.match(/type:\s*['"]([^'"]+)['"]/);
    const titleMatch = slideStr.match(/title:\s*['"]([^'"]+)['"]/);
    
    if (typeMatch && !slideDefinitions.some(s => s.type === typeMatch[1] && s.title === titleMatch?.[1])) {
      slideDefinitions.push({
        type: typeMatch[1],
        title: titleMatch?.[1],
      });
    }
  }

  return {
    name,
    content,
    slideDefinitions: slideDefinitions.length > 0 ? slideDefinitions : undefined,
  };
}

function detectSlideStructure(images: AnalyzedImage[], codeFiles: AnalyzedCode[]): SlideStructure | undefined {
  // Try to detect structure from code first
  const allSlideDefinitions = codeFiles.flatMap(c => c.slideDefinitions || []);
  
  if (allSlideDefinitions.length > 0) {
    const sections: SlideStructure['sections'] = [];
    let currentSection: { name: string; startSlide: number; slides: number } | null = null;
    let slideIndex = 0;

    allSlideDefinitions.forEach((slide, idx) => {
      if (slide.type === 'section' || slide.type === 'title') {
        // New section detected
        if (currentSection) {
          sections.push({
            name: currentSection.name,
            startSlide: currentSection.startSlide,
            endSlide: slideIndex - 1,
            slideCount: currentSection.slides,
          });
        }
        currentSection = {
          name: slide.title || `Section ${sections.length + 1}`,
          startSlide: slideIndex,
          slides: 0,
        };
      }
      
      if (currentSection) {
        currentSection.slides++;
      }
      slideIndex++;
    });

    // Add last section
    if (currentSection) {
      sections.push({
        name: currentSection.name,
        startSlide: currentSection.startSlide,
        endSlide: slideIndex - 1,
        slideCount: currentSection.slides,
      });
    }

    if (sections.length > 0) {
      return {
        totalSlides: allSlideDefinitions.length,
        sections,
      };
    }
  }

  return undefined;
}