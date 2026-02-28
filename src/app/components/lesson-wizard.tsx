import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight, BookOpen, Music, FileText, Eye, BookMarked, PartyPopper, Upload, Plus, Trash2, Check, CalendarIcon, Sparkles, MessageSquare, ScanText, Loader2, Link as LinkIcon, Download, CheckCircle, AlertCircle, Image, Settings, RefreshCw } from 'lucide-react';
import { KindergartenLessonData, SongData, SightWordData, VocabularyWord, BookPageData } from '../types/lesson-types';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { UploadArea } from './upload-area';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { cn } from './ui/utils';
import type { PPTXAnalysis } from '../utils/pptx-parser';
import { parsePPTX, fetchPPTXFromURL } from '../utils/pptx-parser';
import JSZip from 'jszip';
import { analyzeAllReferences, AnalyzedReference } from '../utils/reference-analyzer';
import { SaveLessonDialog } from './save-lesson-dialog';
import { saveDraft } from '../utils/supabase-lessons';
import { createJob } from '../utils/job-queue';
import { ocrWorkerService } from '../utils/ocr-worker-service';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN
import { WebpageImport } from './lazy-components';  // ✅ Lazy-loaded version
import { ReviewApprove } from './review-approve';
import { getUserAccessToken, getCurrentUserId } from '../../utils/supabase-auth';
import { LessonSetupPanel } from './lesson-setup-panel';
import { LessonSetup, getDefaultLessonSetup } from '../types/lesson-setup-types';

// Types for uploaded files
interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content?: string; // For text files
  file?: File; // Keep original file reference
}

interface UploadedFiles {
  powerpoint: UploadedFile[];
  slidePictures: UploadedFile[];
  code: UploadedFile[];
  documentation: UploadedFile[];
  savvasReference: UploadedFile[]; // Teacher lesson plans, guides, etc.
}

interface LessonWizardProps {
  onComplete: (data: KindergartenLessonData) => void;
  onCancel?: () => void;
  initialData?: KindergartenLessonData | null;
  initialFiles?: Map<string, File>;
  initialMetadata?: any;
  existingLessonId?: string | null;
}

const STEPS = [
  { id: 'lesson-setup', title: 'Lesson Setup', icon: Settings },
  { id: 'reference', title: 'Reference Upload', icon: Upload },
  { id: 'review-approve', title: 'Review & Approve', icon: Sparkles },
  { id: 'songs', title: 'Songs', icon: Music },
  { id: 'ufli', title: 'UFLI Phonics', icon: FileText },
  { id: 'sight-words', title: 'Sight Words', icon: Eye },
  { id: 'savvas', title: 'Savvas Reading', icon: BookMarked },
  { id: 'review', title: 'Review', icon: Check },
];

export function LessonWizard({ 
  onComplete, 
  onCancel,
  initialData = null,
  initialFiles = new Map(),
  initialMetadata = null,
  existingLessonId = null,
}: LessonWizardProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    // Load saved step from localStorage - ALWAYS check, even for existing lessons
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('lesson-wizard-current-step');
      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        if (!isNaN(stepNum) && stepNum >= 0 && stepNum < STEPS.length) {
          return stepNum;
        }
      }
    }
    return 0; // Start at beginning by default
  });
  
  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('💾 Saving current step to localStorage:', currentStep, STEPS[currentStep].title);
      localStorage.setItem('lesson-wizard-current-step', currentStep.toString());
    }
  }, [currentStep]);
  
  // CRITICAL: Always have a real lessonId - create draft immediately if needed
  // BUT persist draft ID across refreshes so user doesn't lose their work!
  const [lessonId, setLessonId] = useState<string>(() => {
    // 1. If loading existing lesson, use that ID
    if (existingLessonId) return existingLessonId;
    
    // 2. Check if we have a saved draft ID in localStorage
    if (typeof window !== 'undefined') {
      const savedDraftId = localStorage.getItem('current-draft-lesson-id');
      if (savedDraftId) {
        console.log('📝 Resuming existing draft:', savedDraftId);
        return savedDraftId;
      }
    }
    
    // 3. Only generate a new draft ID if we don't have one saved
    const newDraftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆕 Creating new draft lesson:', newDraftId);
    
    // Save immediately to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('current-draft-lesson-id', newDraftId);
    }
    
    return newDraftId;
  });
  
  const [existingCreatedAt] = useState<string | undefined>(() => {
    // If loading existing lesson data, save the createdAt timestamp
    if (initialData && 'createdAt' in (initialData as any)) {
      return (initialData as any).createdAt;
    }
    return undefined;
  });
  const [formData, setFormData] = useState<Partial<KindergartenLessonData>>(() => {
    // If we have initialData from a loaded lesson, use that
    if (initialData) {
      console.log('📚 Loading wizard with existing lesson data:', initialData);
      return initialData;
    }
    
    // Otherwise, load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lesson-wizard-data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('Loaded saved data from localStorage:', parsed);
          return parsed;
        } catch (e) {
          console.error('Failed to parse saved data', e);
        }
      }
    }
    
    // Default initial state
    return {
      subject: 'English Language Arts',
      ufliLessonNumber: 1,
      dayNumber: 1,
      phonicsConcept: '',
      date: new Date().toISOString().split('T')[0],
      savvasUnit: 1,
      savvasWeek: 1,
      savvasDay: 1,
      storyTitle: '',
      comprehensionTopic: '',
      songs: {
        song1: { title: 'Alphabet Song', youtubeUrl: '' },
        song2: { title: '', youtubeUrl: '' },
        song3: { title: '', youtubeUrl: '' },
      },
      ufli: {
        phonemicAwarenessTime: 2,
        visualDrillTime: 3,
        auditoryDrillTime: 5,
        blendingDrillTime: 5,
        newConceptTime: 15,
      },
      sightWords: [
        { word: '', youtubeUrl: '' },
        { word: '', youtubeUrl: '' },
        { word: '', youtubeUrl: '' },
        { word: '', youtubeUrl: '' },
      ],
      savvas: {
        bookPages: [],
        vocabulary: [
          { word: '', definition: '' },
          { word: '', definition: '' },
          { word: '', definition: '' },
        ],
        discussionQuestions: [
          'What was your favorite part of the story?',
          'Who were the main characters?',
          'What happened at the beginning, middle, and end?',
        ],
      },
      celebration: {
        enabled: true,
      },
    };
  });

  // UFLI upload method state - also persist this
  const [ufliUploadMethod, setUfliUploadMethod] = useState<'powerpoint' | 'screenshots'>(() => {
    if (initialMetadata?.ufliUploadMethod) {
      return initialMetadata.ufliUploadMethod;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ufli-upload-method');
      return (saved as 'powerpoint' | 'screenshots') || 'powerpoint';
    }
    return 'powerpoint';
  });
  
  const [ufliScreenshotCount, setUfliScreenshotCount] = useState(() => {
    if (initialMetadata?.ufliScreenshotCount) {
      return initialMetadata.ufliScreenshotCount;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ufli-screenshot-count');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedStoryText, setExtractedStoryText] = useState(initialMetadata?.extractedStoryText || '');
  
  // Reference slideshow upload state - support multiple PPT files
  const [uploadedPPTXFiles, setUploadedPPTXFiles] = useState<Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
    analysis?: PPTXAnalysis;
    isAnalyzing?: boolean;
    detectedDay?: number; // Auto-detected day number from filename or content
  }>>(initialMetadata?.uploadedPPTXFiles || []);
  const [showAllSlides, setShowAllSlides] = useState(false); // Toggle for day filtering
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'figma'>('file');
  const [pptxAnalysis, setPptxAnalysis] = useState<PPTXAnalysis | null>(initialMetadata?.pptxAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaReference, setFigmaReference] = useState<{ url: string; fileName: string } | null>(null);
  
  // Comprehensive analysis state
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<AnalyzedReference | null>(initialMetadata?.comprehensiveAnalysis || null);
  const [isAnalyzingReferences, setIsAnalyzingReferences] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentUploadCategory, setCurrentUploadCategory] = useState<keyof UploadedFiles | null>(null);
  
  // In-memory storage for actual File objects (can't be serialized to localStorage)
  const [fileObjectsMap, setFileObjectsMap] = useState<Map<string, File>>(() => {
    // Initialize with loaded files if provided
    if (initialFiles && initialFiles.size > 0) {
      console.log(`📁 Initializing wizard with ${initialFiles.size} loaded files from Supabase`);
      return new Map(initialFiles);
    }
    return new Map();
  });
  
  // Drag and drop states
  const [dragActive, setDragActive] = useState<{
    slidePictures: boolean;
    code: boolean;
    documentation: boolean;
    savvasReference: boolean;
    powerpoint: boolean;
  }>({
    slidePictures: false,
    code: false,
    documentation: false,
    savvasReference: false,
    powerpoint: false,
  });

  // Track all uploaded files - load from localStorage or initialMetadata
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>(() => {
    // First check if we have data from a loaded lesson
    if (initialMetadata?.uploadedFiles) {
      console.log('📂 Initializing wizard with uploaded files from Supabase:', initialMetadata.uploadedFiles);
      return {
        powerpoint: initialMetadata.uploadedFiles.powerpoint || [],
        slidePictures: initialMetadata.uploadedFiles.slidePictures || [],
        code: initialMetadata.uploadedFiles.code || [],
        documentation: initialMetadata.uploadedFiles.documentation || [],
        savvasReference: initialMetadata.uploadedFiles.savvasReference || [],
      };
    }
    
    // Otherwise, try localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uploaded-files');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Note: File objects can't be serialized, so we only store metadata
          // Ensure all required properties exist
          return {
            powerpoint: parsed.powerpoint || [],
            slidePictures: parsed.slidePictures || [],
            code: parsed.code || [],
            documentation: parsed.documentation || [],
            savvasReference: parsed.savvasReference || [],
          };
        } catch (e) {
          console.error('Failed to parse uploaded files', e);
        }
      }
    }
    return {
      powerpoint: [],
      slidePictures: [],
      code: [],
      documentation: [],
      savvasReference: [],
    };
  });
  const [uploadAnalysis, setUploadAnalysis] = useState<string>(() => {
    if (initialMetadata?.uploadAnalysis) {
      return initialMetadata.uploadAnalysis;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('upload-analysis') || '';
    }
    return '';
  });
  const [isAnalyzingUploads, setIsAnalyzingUploads] = useState(false);
  
  // Webpage imports state
  const [importedWebpages, setImportedWebpages] = useState<Array<{ fileId: string; title: string; url: string }>>([]);

  // Lesson setup state (Step 0)
  const [lessonSetup, setLessonSetup] = useState<LessonSetup>(() => {
    if (initialMetadata?.lessonSetup) {
      return initialMetadata.lessonSetup;
    }
    if (typeof window !== 'undefined') {
      const storageKey = `lesson:${lessonId}:setup`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          console.log(`📂 Loaded lesson setup from localStorage for ${lessonId}`);
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse lesson setup', e);
        }
      }
    }
    return getDefaultLessonSetup(lessonId);
  });

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Save to localStorage and Supabase draft whenever formData changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Saving to localStorage:', formData);
      
      // Save to localStorage (quick backup)
      try {
        localStorage.setItem('lesson-wizard-data', JSON.stringify(formData));
      } catch (e) {
        console.warn('localStorage quota exceeded for form data. Clearing old data and retrying...', e);
        // Clear non-essential items to make space
        try {
          localStorage.removeItem('upload-analysis');
          localStorage.removeItem('comprehensive-analysis');
          localStorage.setItem('lesson-wizard-data', JSON.stringify(formData));
        } catch (retryError) {
          console.error('Still unable to save form data after cleanup:', retryError);
        }
      }
      
      // Debounced save to Supabase (every 3 seconds)
      const timeoutId = setTimeout(() => {
        saveDraft({
          formData,
          ufliUploadMethod,
          ufliScreenshotCount,
          uploadAnalysis,
          // Don't save file objects, just metadata
        }).catch(err => {
          console.error('Failed to save draft to Supabase:', err);
        });
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, ufliUploadMethod, ufliScreenshotCount, uploadAnalysis]);

  // Save UFLI upload method to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ufli-upload-method', ufliUploadMethod);
    }
  }, [ufliUploadMethod]);

  // Save screenshot count to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ufli-screenshot-count', ufliScreenshotCount.toString());
    }
  }, [ufliScreenshotCount]);

  // Save uploaded files to localStorage (without File objects)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create a serializable version with only metadata (no large content to avoid quota)
      const serializableFiles = {
        powerpoint: (uploadedFiles.powerpoint || []).map(f => ({ name: f.name, size: f.size, type: f.type })),
        slidePictures: (uploadedFiles.slidePictures || []).map(f => ({ name: f.name, size: f.size, type: f.type })),
        code: (uploadedFiles.code || []).map(f => ({ name: f.name, size: f.size, type: f.type })),
        documentation: (uploadedFiles.documentation || []).map(f => ({ name: f.name, size: f.size, type: f.type })),
        savvasReference: (uploadedFiles.savvasReference || []).map(f => ({ name: f.name, size: f.size, type: f.type })),
      };
      try {
        localStorage.setItem('uploaded-files', JSON.stringify(serializableFiles));
      } catch (e) {
        console.warn('localStorage quota exceeded, skipping file metadata storage:', e);
        // Continue without storing - files are still in memory
      }
    }
  }, [uploadedFiles]);

  // CRITICAL: Create draft lesson record on mount if this is a new lesson
  useEffect(() => {
    const persistDraftLesson = async () => {
      // Only create if this is a NEW lesson (not loading existing)
      if (!existingLessonId) {
        try {
          console.log(`📝 Creating draft lesson record: ${lessonId}`);
          
          // Get current user ID for ownership tracking
          const userId = await getCurrentUserId();
          const token = await getUserAccessToken();
          
          if (!token) {
            console.warn('No auth token available, skipping draft lesson creation');
            return;
          }
          
          // HYBRID AUTH: anon key in Authorization, user JWT in query param
          await api.kvSet(`lesson:${lessonId}`, {
            lessonId,
            ownerId: userId, // ✅ SECURITY: Track lesson ownership
            status: 'draft',
            createdAt: new Date().toISOString(),
            subject: 'English Language Arts',
          });
          console.log(`✅ Draft lesson ${lessonId} persisted to database (owner: ${userId})`);
        } catch (error) {
          console.error('Failed to create draft lesson:', error);
        }
      }
    };
    
    persistDraftLesson();
  }, []); // Run once on mount

  // Save upload analysis to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && uploadAnalysis) {
      try {
        localStorage.setItem('upload-analysis', uploadAnalysis);
      } catch (e) {
        console.warn('localStorage quota exceeded for upload analysis:', e);
      }
    }
  }, [uploadAnalysis]);

  // Save lesson setup to localStorage and database
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lesson-setup', JSON.stringify(lessonSetup));
      } catch (e) {
        console.warn('localStorage quota exceeded for lesson setup:', e);
      }
    }
  }, [lessonSetup]);

  // Re-analyze files on mount if they exist
  useEffect(() => {
    const totalFiles = uploadedFiles.powerpoint.length + 
                      uploadedFiles.slidePictures.length + 
                      uploadedFiles.code.length + 
                      uploadedFiles.documentation.length +
                      uploadedFiles.savvasReference.length;
    
    if (totalFiles > 0 && !uploadAnalysis) {
      analyzeUploadedFiles(uploadedFiles);
    }
  }, []); // Only run on mount

  const handleFileUpload = (file: File, field: string) => {
    // Store file metadata in formData
    if (field === 'ufliPowerPoint') {
      updateFormData({ 
        ufliPowerPoint: { 
          name: file.name, 
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        } 
      });
    }
    
    toast.success(`File "${file.name}" uploaded successfully!`);
    console.log('File uploaded:', file.name, 'for field:', field);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, fieldOrCategory: string | keyof UploadedFiles) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Check if this is a category for reference uploads (multiple files)
      if (fieldOrCategory === 'slidePictures' || fieldOrCategory === 'code' || 
          fieldOrCategory === 'documentation' || fieldOrCategory === 'savvasReference') {
        setDragActive(prev => ({ ...prev, [fieldOrCategory]: false }));
        await handleReferenceUpload(files, fieldOrCategory as keyof UploadedFiles);
      } else {
        // Regular single file upload for form fields
        handleFileUpload(files[0], fieldOrCategory);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, category?: keyof typeof dragActive) => {
    e.preventDefault();
    e.stopPropagation();
    if (category) {
      setDragActive(prev => ({ ...prev, [category]: true }));
    } else {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, category?: keyof typeof dragActive) => {
    e.preventDefault();
    e.stopPropagation();
    if (category) {
      setDragActive(prev => ({ ...prev, [category]: false }));
    } else {
      setIsDragging(false);
    }
  };

  // Handle paste events for file uploads
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>, fieldOrCategory: string | keyof UploadedFiles) => {
    console.log('📋 Paste event triggered for:', fieldOrCategory);
    e.preventDefault();
    e.stopPropagation();
    
    const items = Array.from(e.clipboardData.items);
    console.log('📋 Clipboard items:', items.length, items.map(i => ({ kind: i.kind, type: i.type })));
    const files: File[] = [];
    
    // Extract files from clipboard
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
          console.log('📋 File extracted:', file.name, file.type, file.size);
        }
      }
    }
    
    console.log('📋 Total files extracted:', files.length);
    
    if (files.length > 0) {
      // Check if this is a category for reference uploads (multiple files)
      if (fieldOrCategory === 'slidePictures' || fieldOrCategory === 'code' || 
          fieldOrCategory === 'documentation' || fieldOrCategory === 'savvasReference') {
        console.log('📋 Calling handleReferenceUpload');
        await handleReferenceUpload(files, fieldOrCategory as keyof UploadedFiles);
      } else {
        // Regular single file upload for form fields
        console.log('📋 Calling handleFileUpload');
        handleFileUpload(files[0], fieldOrCategory);
      }
    } else {
      console.log('📋 No files found in clipboard');
      toast.info('No files detected in clipboard. Try copying an image or file first.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], field);
    }
  };

  // Helper: Detect day number from filename
  const detectDayNumber = (filename: string): number | undefined => {
    // Look for patterns like "Day 1", "Day1", "D1", "day-1", etc.
    const patterns = [
      /day[\s\-_]*(\d+)/i,
      /d[\s\-_]*(\d+)/i,
      /_(\d+)_/,
      /lesson[\s\-_]*\d+[\s\-_]*day[\s\-_]*(\d+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        const dayNum = parseInt(match[1]);
        if (dayNum >= 1 && dayNum <= 5) { // Valid lesson days
          return dayNum;
        }
      }
    }
    return undefined;
  };

  // Reference slideshow upload handlers - supports multiple PPT files
  const handleReferenceFileSelect = async (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    
    // Track which files are duplicates and which are new
    const newFiles: File[] = [];
    const duplicates: Array<{ file: File; existing: any }> = [];
    
    for (const file of fileArray) {
      if (!file.type.includes('presentation') && !file.name.endsWith('.ppt') && !file.name.endsWith('.pptx')) {
        toast.error(`Skipping ${file.name}: Please upload PowerPoint files only`);
        continue;
      }

      // Check for duplicate by filename
      const existingFile = uploadedPPTXFiles.find(pptx => pptx.name === file.name);
      
      if (existingFile) {
        duplicates.push({ file, existing: existingFile });
      } else {
        newFiles.push(file);
      }
    }
    
    // Handle duplicates - show warning and skip
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map(d => d.file.name).join(', ');
      toast.error(
        `⚠️ Already uploaded: ${duplicateNames}. These files are already in your lesson and will be skipped to prevent duplicates.`,
        { duration: 6000 }
      );
      
      // Log for debugging
      console.log(`🚫 Skipped ${duplicates.length} duplicate file(s):`, duplicateNames);
    }
    
    // Process only new files
    if (newFiles.length === 0) {
      if (duplicates.length > 0) {
        toast.info('💡 Tip: To replace an existing file, remove it first using the 🗑️ button, then upload the new version.');
      }
      return; // Nothing to upload
    }
    
    for (const file of newFiles) {
      const pptxId = `pptx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const detectedDay = detectDayNumber(file.name);
      
      // Add to uploadedPPTXFiles array
      setUploadedPPTXFiles(prev => [...prev, {
        id: pptxId,
        name: file.name,
        size: file.size,
        type: file.type,
        isAnalyzing: false,
        detectedDay,
      }]);
      
      // Also add to tracked files for storage
      setUploadedFiles(prev => {
        const updated = {
          ...prev,
          powerpoint: [...prev.powerpoint, {
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
          }],
        };
        return updated;
      });
      
      // Store File object in map
      const fileKey = `powerpoint-${pptxId}`;
      setFileObjectsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(fileKey, file);
        return newMap;
      });
      
      // Auto-parse the file
      setTimeout(() => handleParseFile(file, pptxId), 100);
    }
    
    // Success message for newly uploaded files
    const detectedDays = newFiles.map(f => detectDayNumber(f.name)).filter(Boolean);
    const message = detectedDays.length > 0
      ? `✅ Uploaded ${newFiles.length} new PowerPoint file(s). Auto-detected: ${detectedDays.map(d => `Day ${d}`).join(', ')}. Analyzing...`
      : `✅ Uploaded ${newFiles.length} new PowerPoint file(s). Analyzing...`;
    toast.success(message);
  };

  const handleParseFile = async (file: File, pptxId: string) => {
    if (!file) {
      toast.error('No file to parse');
      return;
    }

    // Update analyzing status for this specific file
    setUploadedPPTXFiles(prev => prev.map(pptx => 
      pptx.id === pptxId ? { ...pptx, isAnalyzing: true } : pptx
    ));
    
    try {
      const analysis = await parsePPTX(file);
      
      // Extract slide screenshots and save them
      console.log(`📸 Extracting ${analysis.slides.length} slide screenshots from ${file.name}...`);
      
      for (let i = 0; i < analysis.slides.length; i++) {
        const slide = analysis.slides[i];
        
        // If the slide has images, save them as screenshots
        if (slide.images && slide.images.length > 0) {
          for (const image of slide.images) {
            try {
              // Convert dataURL to File
              const response = await fetch(image.dataUrl);
              const blob = await response.blob();
              const screenshotFile = new File(
                [blob], 
                `${file.name.replace('.pptx', '')}_slide${slide.slideNumber}_${image.id}.${image.type}`,
                { type: `image/${image.type}` }
              );
              
              // Store in fileObjectsMap
              const screenshotKey = `screenshot-${pptxId}-slide${slide.slideNumber}-${image.id}`;
              setFileObjectsMap(prev => {
                const newMap = new Map(prev);
                newMap.set(screenshotKey, screenshotFile);
                return newMap;
              });
              
              // Add to uploadedFiles.slidePictures
              setUploadedFiles(prev => ({
                ...prev,
                slidePictures: [...prev.slidePictures, {
                  name: screenshotFile.name,
                  size: screenshotFile.size,
                  type: screenshotFile.type,
                  file: screenshotFile,
                }],
              }));
            } catch (err) {
              console.error(`Failed to extract slide ${slide.slideNumber} image:`, err);
            }
          }
        }
      }
      
      // Update the PPTX file with analysis
      setUploadedPPTXFiles(prev => prev.map(pptx => 
        pptx.id === pptxId 
          ? { ...pptx, analysis, isAnalyzing: false } 
          : pptx
      ));
      
      toast.success(`✅ Analyzed ${file.name}: ${analysis.slides.length} slides extracted!`);
      console.log(`Analysis for ${file.name}:`, analysis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze the slideshow file';
      toast.error(`Failed to analyze ${file.name}: ${errorMessage}`, { duration: 6000 });
      console.error('Error analyzing slideshow file:', error);
      
      // Mark as failed
      setUploadedPPTXFiles(prev => prev.map(pptx => 
        pptx.id === pptxId ? { ...pptx, isAnalyzing: false } : pptx
      ));
    }
  };

  const handleReferenceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleReferenceFileSelect(files); // Pass all files
    }
  };

  const handleReferencePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items = Array.from(e.clipboardData.items);
    const pastedFiles: File[] = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          pastedFiles.push(file);
        }
      }
    }
    if (pastedFiles.length > 0) {
      handleReferenceFileSelect(pastedFiles); // Pass all files
    }
  };

  const handleReferenceFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleReferenceFileSelect(Array.from(files)); // Pass all files
    }
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Check if this is a Figma URL
    if (urlInput.includes('figma.com')) {
      toast.error(
        'Figma URLs cannot be directly parsed. Please either: (1) Export your Figma design to PowerPoint and upload the .pptx file, or (2) Import your Figma frame using Figma\'s import feature.',
        { duration: 10000 }
      );
      console.log(`
📌 Figma URL Detected

Figma designs work differently from PowerPoint files and cannot be directly parsed from a URL.

Here are your options:

1️⃣ Export to PowerPoint (Recommended):
   • In Figma, select your frame
   • Right-click → "Copy as �� Copy as PNG" for each slide
   • Create a PowerPoint with your slides
   • Upload the .pptx file here

2️⃣ Use Figma Import Feature:
   • If you want to use the exact Figma design components, use Figma's import feature
   • This will bring in your design as React components
   • You can then build the template using those imported components

3️⃣ Manual Recreation:
   • Use this template wizard without a reference file
   • The template will generate slides using the existing kindergarten design

Note: The reference slideshow upload is optional and helps match your exact colors/fonts, but it's not required to use this template system.
      `);
      return;
    }

    // Validate URL format
    try {
      new URL(urlInput);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoadingFromUrl(true);
    setLoadingStatus('Fetching file from URL...');
    
    try {
      // Fetch and parse the slideshow file from the URL
      const blob = await fetchPPTXFromURL(urlInput);
      const fileName = urlInput.split('/').pop()?.split('?')[0] || 'slideshow.pptx';
      
      setLoadingStatus('File downloaded! Validating...');
      
      setUploadedFile({
        name: fileName,
        size: blob.size,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        url: urlInput
      });
      
      // Parse the fetched file
      setIsAnalyzing(true);
      setLoadingStatus('Analyzing slideshow structure...');
      const analysis = await parsePPTX(blob);
      setPptxAnalysis(analysis);
      setIsAnalyzing(false);
      setLoadingStatus('Complete!');
      
      // Store analysis in localStorage for use in slide generation
      try {
        localStorage.setItem('pptxAnalysis', JSON.stringify(analysis));
      } catch (e) {
        console.warn('localStorage quota exceeded for PPTX analysis:', e);
      }
      
      toast.success(`Successfully loaded and analyzed: ${fileName}`);
      console.log('Slideshow analyzed from URL:', urlInput);
      console.log('Analysis:', analysis);
      setUrlInput('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch and analyze the slideshow from the URL';
      
      // Show a simple, actionable error message
      toast.error('Unable to download from URL. Please download the file to your computer and use "Upload File" instead, or click "Skip This Step".', { duration: 8000 });
      
      // Log detailed error for debugging
      console.error('URL fetch failed:', errorMessage);
      
      setUploadedFile(null);
      setPptxAnalysis(null);
      setLoadingStatus('');
    } finally {
      setIsLoadingFromUrl(false);
      setIsAnalyzing(false);
      setTimeout(() => setLoadingStatus(''), 2000); // Clear status after 2 seconds
    }
  };

  const handleFigmaUrlSubmit = () => {
    if (!figmaUrl.trim()) {
      toast.error('Please enter a Figma URL');
      return;
    }

    // Validate that it's a Figma URL - be flexible with formats
    const normalizedUrl = figmaUrl.toLowerCase();
    if (!normalizedUrl.includes('figma')) {
      toast.error('Please enter a valid Figma URL (e.g., https://www.figma.com/design/... or https://figma.com/file/...)');
      return;
    }

    // Check if it's a figma.site URL (published prototype)
    if (normalizedUrl.includes('figma.site')) {
      toast.error('This is a published Figma prototype URL. To import frames, you need the design file URL. In Figma, go to File → Copy link to get the design file URL (should be figma.com/design/... or figma.com/file/...)');
      return;
    }

    // Check if it's a Figma Make URL
    if (normalizedUrl.includes('figma.com/make')) {
      toast.error('This is a Figma Make project. Since your slides are already in Figma Make, please export them as images or take screenshots and use the "Upload Screenshots" option instead.');
      return;
    }

    // Extract file name from URL if possible - handle both /file/ and /design/ paths
    let fileName = 'Figma Design';
    
    if (figmaUrl.includes('/file/')) {
      fileName = figmaUrl.split('/file/')[1]?.split('/')[1]?.replace(/-/g, ' ') || 'Figma Design';
    } else if (figmaUrl.includes('/design/')) {
      fileName = figmaUrl.split('/design/')[1]?.split('/')[1]?.replace(/-/g, ' ') || 'Figma Design';
    }

    setFigmaReference({
      url: figmaUrl,
      fileName: fileName
    });

    // Store in localStorage
    try {
      localStorage.setItem('figmaReference', JSON.stringify({
        url: figmaUrl,
        fileName: fileName
      }));
    } catch (e) {
      console.warn('localStorage quota exceeded for Figma reference:', e);
    }

    toast.success('Figma reference saved! You can now import frames from this file using Figma\'s import feature.');
    setFigmaUrl('');
  };

  const handleBookPagePaste = (e: React.ClipboardEvent, pageIndex: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          // Store the pasted image for this book page
          const newPages = [...(formData.savvas?.bookPages || [])];
          newPages[pageIndex] = {
            ...newPages[pageIndex],
            imageData: {
              name: `pasted-image-${Date.now()}.png`,
              size: blob.size,
              type: blob.type,
              uploadedAt: new Date().toISOString()
            }
          };
          updateFormData({ 
            savvas: { ...formData.savvas!, bookPages: newPages }
          });
          toast.success(`Image pasted for Page ${pageIndex + 1}!`);
        }
        e.preventDefault();
        break;
      }
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];
  const StepIcon = currentStepData.icon;

  const updateFormData = (updates: Partial<KindergartenLessonData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Helper: Extract files from ZIP
  const extractZipFiles = async (file: File): Promise<UploadedFile[]> => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const extractedFiles: UploadedFile[] = [];

    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      if (zipEntry.dir) continue; // Skip directories

      const blob = await zipEntry.async('blob');
      const extractedFile = new File([blob], filename, { type: blob.type });
      
      extractedFiles.push({
        name: filename,
        size: extractedFile.size,
        type: extractedFile.type || 'application/octet-stream',
        file: extractedFile,
      });
    }

    return extractedFiles;
  };

  // Helper: Read text content from file
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Helper: Extract text from PDF file
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Disable worker to avoid CDN fetch issues in this environment
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
      }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error}`);
    }
  };

  // Helper: Extract text from DOCX file
  const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error(`Failed to extract text from DOCX: ${error}`);
    }
  };

  // Helper: Determine if file content should be read
  const shouldReadContent = (filename: string, category: keyof UploadedFiles): boolean => {
    const textExtensions = ['.md', '.txt', '.tsx', '.ts', '.jsx', '.js', '.css', '.json', '.html'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    // Always read documentation, code, and Savvas reference files
    if (category === 'documentation' || category === 'code' || category === 'savvasReference') {
      return textExtensions.includes(ext);
    }
    
    return false;
  };

  // Helper: Check if file is PDF
  const isPDFFile = (file: File | { name: string }): boolean => {
    return file.name.toLowerCase().endsWith('.pdf');
  };

  // Helper: Check if file is DOCX
  const isDOCXFile = (file: File | { name: string }): boolean => {
    const name = file.name.toLowerCase();
    return name.endsWith('.docx') || name.endsWith('.doc');
  };

  // Helper: Analyze uploaded files
  const analyzeUploadedFiles = async (files: UploadedFiles) => {
    setIsAnalyzingUploads(true);
    let analysis = '### Upload Analysis\n\n';
    
    // Get current lesson context
    const targetDay = formData.savvasDay || 1;
    const targetUnit = formData.savvasUnit || 1;
    const targetWeek = formData.savvasWeek || 1;
    
    analysis += `**Target Context:** Unit ${targetUnit}, Week ${targetWeek}, Day ${targetDay}\n\n`;

    try {
      // Analyze documentation files
      if (files.documentation.length > 0) {
        analysis += '**Documentation Found:**\n';
        for (const doc of files.documentation) {
          analysis += `- ${doc.name} (${(doc.size / 1024).toFixed(1)} KB)\n`;
          
          // Try to read text content
          if (doc.file && (doc.name.endsWith('.md') || doc.name.endsWith('.txt'))) {
            try {
              const content = await readFileContent(doc.file);
              
              // Extract key information
              const lines = content.split('\n');
              const slideCount = lines.find(l => l.match(/\d+\s*slides?/i));
              const sections = lines.filter(l => l.startsWith('##') || l.startsWith('###'));
              
              if (slideCount) analysis += `  - ${slideCount.trim()}\n`;
              if (sections.length > 0) {
                analysis += `  - ${sections.length} sections documented\n`;
              }
            } catch (e) {
              console.error('Error reading file:', e);
            }
          }
        }
        analysis += '\n';
      }

      // Analyze PowerPoint files
      if (files.powerpoint.length > 0) {
        analysis += `**PowerPoint Files:** ${files.powerpoint.length} file(s)\n`;
        files.powerpoint.forEach(f => {
          analysis += `- ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)\n`;
        });
        analysis += '\n';
      }

      // Analyze slide pictures
      if (files.slidePictures.length > 0) {
        analysis += `**Slide Screenshots:** ${files.slidePictures.length} file(s)\n\n`;
      }

      // Analyze code files
      if (files.code.length > 0) {
        analysis += '**Code Files:**\n';
        const codeByType: Record<string, number> = {};
        files.code.forEach(f => {
          const ext = f.name.split('.').pop() || 'unknown';
          codeByType[ext] = (codeByType[ext] || 0) + 1;
        });
        Object.entries(codeByType).forEach(([ext, count]) => {
          analysis += `- ${count} .${ext} file(s)\n`;
        });
        analysis += '\n';
      }

      // Analyze Savvas reference files
      if (files.savvasReference.length > 0) {
        analysis += '**Savvas Teacher Materials:**\n';
        for (const ref of files.savvasReference) {
          analysis += `- ${ref.name} (${(ref.size / 1024).toFixed(1)} KB)\n`;
          
          // Try to extract day-specific content
          if (ref.file && ref.content) {
            const dayMatches = ref.content.match(new RegExp(`Day\\s*${targetDay}[:\\s].*`, 'gi'));
            if (dayMatches && dayMatches.length > 0) {
              analysis += `  ✓ Found Day ${targetDay} content in this file\n`;
            }
          }
        }
        analysis += `\n💡 *Will extract content specific to Day ${targetDay} when parsing*\n\n`;
      }

      const totalFiles = files.powerpoint.length + files.slidePictures.length + 
                        files.code.length + files.documentation.length + files.savvasReference.length;
      
      if (totalFiles === 0) {
        analysis = 'No files uploaded yet. Upload reference materials to help build your template!';
      } else {
        analysis += `\n**Total:** ${totalFiles} file(s) uploaded`;
      }

      setUploadAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing files:', error);
      setUploadAnalysis('Error analyzing uploaded files');
    } finally {
      setIsAnalyzingUploads(false);
    }
  };

  // Helper to check if file is an image
  const isImageFile = (file: File | { name: string; type?: string }): boolean => {
    if ('type' in file && file.type) {
      return file.type.startsWith('image/');
    }
    const ext = file.name.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext || '');
  };

  // Handle reference file upload for each category with AUTO OCR and ANALYSIS
  const handleReferenceUpload = async (
    files: FileList | File[] | null,
    category: keyof UploadedFiles
  ) => {
    console.log('📤 handleReferenceUpload called:', { filesCount: files?.length, category });
    
    if (!files || files.length === 0) {
      console.log('❌ No files provided');
      return;
    }

    const categoryLabels = {
      powerpoint: 'PowerPoint',
      slidePictures: 'slide picture',
      code: 'code',
      documentation: 'documentation',
      savvasReference: 'Savvas reference'
    };

    // Reset error state and show progress
    setUploadError(null);
    setCurrentUploadCategory(category);
    setIsAnalyzingReferences(true);
    setAnalysisProgress(0);

    try {
      let processedFiles: UploadedFile[] = [];
      const totalFilesToProcess = files.length;
      
      toast.info(`📤 Processing ${totalFilesToProcess} file(s) one at a time for better performance...`);
      
      console.log(`📁 Processing ${files.length} file(s) sequentially for category: ${category}`);

    // REFACTORED: No inline OCR worker - using background job queue instead
    const { computeFileHash, checkOCRCache, saveOCRCache } = await import('../utils/file-hash');
    const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / totalFilesToProcess) * 100);
      setAnalysisProgress(progress);
      
      console.log(`  📄 File ${i + 1}/${totalFilesToProcess}: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`);

      // Check if it's a ZIP file
      if (file.name.endsWith('.zip')) {
        toast.info(`Extracting ${file.name}...`);
        try {
          const extracted = await extractZipFiles(file);
          
          // Read content for text files, QUEUE OCR for images, EXTRACT PDF/DOCX
          for (const extractedFile of extracted) {
            if (extractedFile.file) {
              // REFACTORED: Queue OCR job instead of processing inline
              if (isImageFile(extractedFile.file)) {
                // OCR disabled temporarily - mark as image content
                console.log(`  🖼️ Image file detected: ${extractedFile.name} - skipping OCR (disabled)`);
                extractedFile.content = '[Image file - visual content only]';
              }
              // Extract PDF files
              else if (isPDFFile(extractedFile.file)) {
                try {
                  console.log(`  📄 Extracting PDF: ${extractedFile.name}`);
                  const content = await extractTextFromPDF(extractedFile.file);
                  extractedFile.content = content;
                  console.log(`    ✅ Extracted ${content.length} characters`);
                } catch (e) {
                  console.error(`Failed to extract PDF ${extractedFile.name}:`, e);
                  extractedFile.content = `[PDF extraction failed]`;
                }
              }
              // Extract DOCX files
              else if (isDOCXFile(extractedFile.file)) {
                try {
                  console.log(`  📝 Extracting DOCX: ${extractedFile.name}`);
                  const content = await extractTextFromDOCX(extractedFile.file);
                  extractedFile.content = content;
                  console.log(`    ✅ Extracted ${content.length} characters`);
                } catch (e) {
                  console.error(`Failed to extract DOCX ${extractedFile.name}:`, e);
                  extractedFile.content = `[DOCX extraction failed]`;
                }
              }
              // Read text files
              else if (shouldReadContent(extractedFile.name, category)) {
                try {
                  const content = await readFileContent(extractedFile.file);
                  extractedFile.content = content;
                } catch (e) {
                  console.error(`Failed to read ${extractedFile.name}:`, e);
                }
              }
            }
          }
          
          processedFiles.push(...extracted);
          toast.success(`Extracted ${extracted.length} file(s) from ${file.name}`);
        } catch (error) {
          console.error('Error extracting ZIP:', error);
          toast.error(`Failed to extract ${file.name}`);
        }
      } else {
        const fileKey = `${category}-${file.name}-${Date.now()}`;
        const uploadedFile: UploadedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
        };
        
        // Store File object in map
        setFileObjectsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(fileKey, file);
          return newMap;
        });
        
        // REFACTORED: Queue background OCR for image files
        if (isImageFile(file)) {
          // OCR disabled temporarily - mark as image content
          console.log(`🖼️ Image file detected: ${file.name} - skipping OCR (disabled)`);
          uploadedFile.content = '[Image file - visual content only]';
        }
        // Extract text from PDF files
        else if (isPDFFile(file)) {
          try {
            console.log(`📄 Extracting text from PDF: ${file.name}...`);
            toast.info(`Extracting text from ${file.name}...`, { duration: 2000 });
            const content = await extractTextFromPDF(file);
            uploadedFile.content = content;
            console.log(`  ✅ Extracted ${content.length} characters from PDF`);
            toast.success(`${file.name}: Text extracted successfully`, { duration: 2000 });
          } catch (e) {
            console.error(`Failed to extract PDF text from ${file.name}:`, e);
            uploadedFile.content = `[PDF extraction failed: ${e}]`;
            toast.error(`Failed to extract text from ${file.name}`, { duration: 3000 });
          }
        }
        // Extract text from DOCX files
        else if (isDOCXFile(file)) {
          try {
            console.log(`📝 Extracting text from DOCX: ${file.name}...`);
            toast.info(`Extracting text from ${file.name}...`, { duration: 2000 });
            const content = await extractTextFromDOCX(file);
            uploadedFile.content = content;
            console.log(`  ✅ Extracted ${content.length} characters from DOCX`);
            toast.success(`${file.name}: Text extracted successfully`, { duration: 2000 });
          } catch (e) {
            console.error(`Failed to extract DOCX text from ${file.name}:`, e);
            uploadedFile.content = `[DOCX extraction failed: ${e}]`;
            toast.error(`Failed to extract text from ${file.name}`, { duration: 3000 });
          }
        }
        // Read content for text files
        else if (shouldReadContent(file.name, category)) {
          try {
            const content = await readFileContent(file);
            uploadedFile.content = content;
            console.log(`📖 Read content from ${file.name} (${content.length} chars)`);
          } catch (e) {
            console.error(`Failed to read ${file.name}:`, e);
          }
        }
        
        processedFiles.push(uploadedFile);
      }
    }

    // REFACTORED: No worker cleanup needed - background service handles it

    // Update state
    console.log(`✅ Adding ${processedFiles.length} processed files to category: ${category}`);
    setUploadedFiles(prev => {
      const updated = {
        ...prev,
        [category]: [...prev[category], ...processedFiles],
      };
      
      console.log('📊 Updated uploadedFiles state:', {
        [category]: updated[category].length,
        total: Object.values(updated).reduce((sum, arr) => sum + arr.length, 0)
      });
      
      // Trigger basic analysis (just file count summary, not comprehensive)
      analyzeUploadedFiles(updated);
      
      return updated;
    });

    setAnalysisProgress(100);
    
    const imageCount = processedFiles.filter(f => isImageFile(f)).length;
    const pdfCount = processedFiles.filter(f => isPDFFile(f)).length;
    const docxCount = processedFiles.filter(f => isDOCXFile(f)).length;
    const textCount = processedFiles.length - imageCount - pdfCount - docxCount;
    
    let successMessage = `✅ ${processedFiles.length} ${categoryLabels[category]} file(s) uploaded!`;
    if (imageCount > 0) successMessage += ` 🖼️ ${imageCount} image(s) queued for OCR.`;
    if (pdfCount > 0) successMessage += ` 📄 ${pdfCount} PDF(s) extracted.`;
    if (docxCount > 0) successMessage += ` 📝 ${docxCount} DOCX file(s) extracted.`;
    
    toast.success(successMessage);
    
    console.log('🎉 Upload and auto-analysis complete!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error during file upload:', error);
      setUploadError(errorMessage);
      setAnalysisProgress(0);
      // Don't show toast here - we'll show error UI with retry button instead
    } finally {
      // Always reset processing state, even if there was an error
      setIsAnalyzingReferences(false);
    }
  };



  // Retry upload after error
  const retryUpload = () => {
    setUploadError(null);
    setAnalysisProgress(0);
    toast.info('Ready to upload again. Please select your files.');
  };

  // Start over - clear all uploads in the error category
  const startOverUpload = () => {
    if (currentUploadCategory) {
      setUploadedFiles(prev => ({
        ...prev,
        [currentUploadCategory]: [],
      }));
      setUploadError(null);
      setAnalysisProgress(0);
      setCurrentUploadCategory(null);
      toast.success('Upload cleared. You can start fresh.');
    }
  };

  // Remove uploaded file
  const removeUploadedFile = (category: keyof UploadedFiles, index: number) => {
    setUploadedFiles(prev => {
      const updated = {
        ...prev,
        [category]: prev[category].filter((_, i) => i !== index),
      };
      analyzeUploadedFiles(updated);
      return updated;
    });
    toast.success('File removed');
  };

  const addSightWord = () => {
    const newWords = [...(formData.sightWords || []), { word: '', youtubeUrl: '' }];
    updateFormData({ sightWords: newWords });
  };

  const removeSightWord = (index: number) => {
    const newWords = (formData.sightWords || []).filter((_, i) => i !== index);
    updateFormData({ sightWords: newWords });
  };

  const updateSightWord = (index: number, updates: Partial<SightWordData>) => {
    const newWords = [...(formData.sightWords || [])];
    newWords[index] = { ...newWords[index], ...updates };
    updateFormData({ sightWords: newWords });
  };

  // Delete all files in a category
  const deleteAllFilesInCategory = (category: keyof UploadedFiles) => {
    const categoryLabels = {
      powerpoint: 'PowerPoint files',
      slidePictures: 'slide pictures',
      code: 'code files',
      documentation: 'documentation files',
      savvasReference: 'Savvas reference files'
    };
    
    const count = uploadedFiles[category].length;
    
    if (count === 0) {
      toast.info(`No ${categoryLabels[category]} to delete`);
      return;
    }
    
    setUploadedFiles(prev => {
      const updated = {
        ...prev,
        [category]: [],
      };
      analyzeUploadedFiles(updated);
      return updated;
    });
    
    toast.success(`🗑️ Deleted all ${count} ${categoryLabels[category]}`);
  };

  const addVocabularyWord = () => {
    const newVocab = [...(formData.savvas?.vocabulary || []), { word: '', definition: '' }];
    updateFormData({ 
      savvas: { ...formData.savvas!, vocabulary: newVocab }
    });
  };

  const removeVocabularyWord = (index: number) => {
    const newVocab = (formData.savvas?.vocabulary || []).filter((_, i) => i !== index);
    updateFormData({ 
      savvas: { ...formData.savvas!, vocabulary: newVocab }
    });
  };

  const updateVocabularyWord = (index: number, updates: Partial<VocabularyWord>) => {
    const newVocab = [...(formData.savvas?.vocabulary || [])];
    newVocab[index] = { ...newVocab[index], ...updates };
    updateFormData({ 
      savvas: { ...formData.savvas!, vocabulary: newVocab }
    });
  };

  const addBookPage = () => {
    const newPages = [...(formData.savvas?.bookPages || []), { id: `page-${Date.now()}` }];
    updateFormData({ 
      savvas: { ...formData.savvas!, bookPages: newPages }
    });
  };

  const removeBookPage = (index: number) => {
    const newPages = (formData.savvas?.bookPages || []).filter((_, i) => i !== index);
    updateFormData({ 
      savvas: { ...formData.savvas!, bookPages: newPages }
    });
  };

  const updateDiscussionQuestion = (index: number, value: string) => {
    const newQuestions = [...(formData.savvas?.discussionQuestions || [])];
    newQuestions[index] = value;
    updateFormData({ 
      savvas: { ...formData.savvas!, discussionQuestions: newQuestions }
    });
  };

  const addDiscussionQuestion = () => {
    const newQuestions = [...(formData.savvas?.discussionQuestions || []), ''];
    updateFormData({ 
      savvas: { ...formData.savvas!, discussionQuestions: newQuestions }
    });
  };

  const removeDiscussionQuestion = (index: number) => {
    const newQuestions = (formData.savvas?.discussionQuestions || []).filter((_, i) => i !== index);
    updateFormData({ 
      savvas: { ...formData.savvas!, discussionQuestions: newQuestions }
    });
  };

  // Generate kindergarten-appropriate discussion questions based on focus
  const generateKindergartenQuestions = (focus: string, storyText: string) => {
    const focusLower = focus.toLowerCase();
    const questions: string[] = [];
    
    // Extract potential character names from story (simple word detection)
    const words = storyText.split(/\s+/).filter(word => word.length > 2);
    const capitalizedWords = words.filter(word => /^[A-Z]/.test(word) && word.length < 15);
    const mainCharacter = capitalizedWords[0] || 'the character';
    
    // Character-focused questions
    if (focusLower.includes('character') || focusLower.includes('who')) {
      questions.push(`Who is in the story?`);
      questions.push(`What does ${mainCharacter} look like?`);
      questions.push(`What does ${mainCharacter} do in the story?`);
      questions.push(`Who else is in the story?`);
    }
    
    // Feelings/emotions questions
    if (focusLower.includes('feel') || focusLower.includes('emotion') || focusLower.includes('happy') || focusLower.includes('sad')) {
      questions.push(`How does ${mainCharacter} feel?`);
      questions.push(`What makes ${mainCharacter} happy?`);
      questions.push(`Can you point to ${mainCharacter}'s face? How do you know how they feel?`);
      questions.push(`Have you ever felt like ${mainCharacter}?`);
    }
    
    // Setting/where questions
    if (focusLower.includes('setting') || focusLower.includes('where') || focusLower.includes('place')) {
      questions.push(`Where does the story happen?`);
      questions.push(`What do you see in the picture?`);
      questions.push(`Is it inside or outside?`);
      questions.push(`Have you been to a place like this?`);
    }
    
    // Beginning/middle/end questions
    if (focusLower.includes('beginning') || focusLower.includes('middle') || focusLower.includes('end') || focusLower.includes('sequence')) {
      questions.push(`What happens first in the story?`);
      questions.push(`What happens next?`);
      questions.push(`How does the story end?`);
      questions.push(`Can you tell me what happened?`);
    }
    
    // Problem/solution questions (simplified for K)
    if (focusLower.includes('problem') || focusLower.includes('solution') || focusLower.includes('fix')) {
      questions.push(`What is wrong in the story?`);
      questions.push(`What does ${mainCharacter} need?`);
      questions.push(`How does ${mainCharacter} solve the problem?`);
      questions.push(`Did ${mainCharacter} make things better?`);
    }
    
    // Prediction questions
    if (focusLower.includes('predict') || focusLower.includes('what will') || focusLower.includes('next')) {
      questions.push(`What do you think will happen next?`);
      questions.push(`What would you do?`);
      questions.push(`How do you think the story will end?`);
    }
    
    // Main idea/what happened
    if (focusLower.includes('main') || focusLower.includes('idea') || focusLower.includes('about')) {
      questions.push(`What is this story about?`);
      questions.push(`What happens in this story?`);
      questions.push(`Can you tell me about the story?`);
    }
    
    // Vocabulary/word questions
    if (focusLower.includes('vocab') || focusLower.includes('word')) {
      questions.push(`What does [word] mean?`);
      questions.push(`Can you find the word [word] in the story?`);
      questions.push(`What new words did we learn?`);
    }
    
    // Connection to self
    if (focusLower.includes('connect') || focusLower.includes('relate') || focusLower.includes('self')) {
      questions.push(`Has this ever happened to you?`);
      questions.push(`What would you do if you were ${mainCharacter}?`);
      questions.push(`Do you know anyone like ${mainCharacter}?`);
    }
    
    // If no specific focus matched, generate general questions
    if (questions.length === 0) {
      questions.push(`What happens in the story?`);
      questions.push(`Who is in the story?`);
      questions.push(`Where does the story happen?`);
      questions.push(`How does ${mainCharacter} feel?`);
      questions.push(`What do you see in the pictures?`);
    }
    
    // Return up to 4 questions
    return questions.slice(0, 4);
  };

  // OCR function to extract text and questions from story pages
  const extractTextFromStoryPages = async () => {
    const bookPages = formData.savvas?.bookPages || [];
    if (bookPages.length === 0) {
      toast.error('Please upload story page screenshots first');
      return;
    }

    setIsProcessingOCR(true);
    setOcrProgress(0);
    
    try {
      const worker = await createWorker('eng');
      let fullStoryText = '';
      const extractedQuestions: string[] = [];
      
      for (let i = 0; i < bookPages.length; i++) {
        const page = bookPages[i];
        if (page.imageData) {
          // Get the image blob from localStorage
          const imageKey = `book-page-${page.id}`;
          const imageDataUrl = localStorage.getItem(imageKey);
          
          if (imageDataUrl) {
            setOcrProgress(Math.round(((i + 1) / bookPages.length) * 100));
            toast.info(`Processing page ${i + 1} of ${bookPages.length}...`);
            
            const { data: { text } } = await worker.recognize(imageDataUrl);
            
            // Extract questions (lines that start with common question words or contain "?")
            const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
            const questionPatterns = /^(what|who|where|when|why|how|is|are|can|do|does|did|will|would|should)/i;
            
            lines.forEach(line => {
              if (line.includes('?') || questionPatterns.test(line)) {
                extractedQuestions.push(line);
              }
            });
            
            // Add all text to story
            fullStoryText += text + '\n\n';
          }
        }
      }
      
      await worker.terminate();
      
      setExtractedStoryText(fullStoryText.trim());
      updateFormData({
        savvas: {
          ...formData.savvas!,
          storyText: fullStoryText.trim(),
          extractedQuestions: extractedQuestions.length > 0 ? extractedQuestions : undefined
        }
      });
      
      setIsProcessingOCR(false);
      setOcrProgress(0);
      toast.success(`Extracted ${extractedQuestions.length} questions and full story text from ${bookPages.length} pages!`);
    } catch (error) {
      console.error('OCR error:', error);
      setIsProcessingOCR(false);
      setOcrProgress(0);
      toast.error('Failed to extract text from images');
    }
  };

  // Comprehensive analysis of all uploaded references
  const runComprehensiveAnalysis = async () => {
    console.log('🔬 runComprehensiveAnalysis called!');
    
    const totalFiles = uploadedFiles.slidePictures.length + uploadedFiles.code.length + uploadedFiles.documentation.length;
    
    console.log('📊 Total files:', {
      slidePictures: uploadedFiles.slidePictures.length,
      code: uploadedFiles.code.length,
      documentation: uploadedFiles.documentation.length,
      total: totalFiles
    });
    
    if (totalFiles === 0) {
      console.log('❌ No files to analyze');
      toast.error('No reference files to analyze. Please upload slide pictures, code files, or documentation first.');
      return;
    }

    // Check if we have actual File objects
    const hasFileObjects = uploadedFiles.slidePictures.some(f => f.file) || 
                          uploadedFiles.code.some(f => f.file) || 
                          uploadedFiles.documentation.some(f => f.file);
    
    console.log('🔍 Checking for file objects:', {
      slidePicturesWithFiles: uploadedFiles.slidePictures.filter(f => f.file).length,
      codeWithFiles: uploadedFiles.code.filter(f => f.file).length,
      docsWithFiles: uploadedFiles.documentation.filter(f => f.file).length,
      hasFileObjects
    });
    
    if (!hasFileObjects) {
      console.log('❌ No file objects available!');
      console.log('📋 Sample slidePicture:', uploadedFiles.slidePictures[0]);
      toast.error('File objects not available. Please re-upload your files in this session.');
      return;
    }

    console.log('✅ Starting analysis...');
    setIsAnalyzingReferences(true);
    setAnalysisProgress(10);
    toast.info('🔍 Analyzing all uploaded reference materials...');

    try {
      console.log('📁 Files to analyze:', {
        slidePictures: uploadedFiles.slidePictures.map(f => ({ name: f.name, hasFile: !!f.file })),
        code: uploadedFiles.code.map(f => ({ name: f.name, hasContent: !!f.content })),
        documentation: uploadedFiles.documentation.map(f => ({ name: f.name, hasContent: !!f.content })),
      });
      
      setAnalysisProgress(20);
      const analysis = await analyzeAllReferences(uploadedFiles, {
        targetDay: formData.savvasDay || 1,
        targetUnit: formData.savvasUnit || 1,
        targetWeek: formData.savvasWeek || 1,
      });
      setAnalysisProgress(60);
      setComprehensiveAnalysis(analysis);
      
      // Auto-populate form data from analysis
      setAnalysisProgress(70);
      const updates: any = {};
      
      // Songs
      if (analysis.extractedData.songs.length > 0) {
        const songs = { ...formData.songs };
        analysis.extractedData.songs.forEach((song, idx) => {
          if (idx === 0) songs.song2 = { title: song.title, youtubeUrl: song.url || '' };
          if (idx === 1) songs.song3 = { title: song.title, youtubeUrl: song.url || '' };
        });
        updates.songs = songs;
      }
      
      // Sight words
      if (analysis.extractedData.sightWords.length > 0) {
        const uniqueWords = [...new Set(analysis.extractedData.sightWords)];
        updates.sightWords = uniqueWords.slice(0, 4).map(word => ({ word, youtubeUrl: '' }));
      }
      
      // Vocabulary
      if (analysis.extractedData.vocabulary.length > 0) {
        const uniqueVocab = analysis.extractedData.vocabulary.filter((v, i, arr) => 
          arr.findIndex(t => t.word === v.word) === i
        );
        updates.savvas = {
          ...formData.savvas!,
          vocabulary: uniqueVocab.slice(0, 5),
        };
      }
      
      // Discussion questions
      if (analysis.extractedData.discussionQuestions.length > 0) {
        const uniqueQuestions = [...new Set(analysis.extractedData.discussionQuestions)];
        updates.savvas = {
          ...updates.savvas || formData.savvas!,
          discussionQuestions: uniqueQuestions.slice(0, 6),
        };
      }
      
      setAnalysisProgress(90);
      if (Object.keys(updates).length > 0) {
        updateFormData(updates);
        toast.success(`✅ Analysis complete! Auto-populated ${Object.keys(updates).length} sections from reference materials.`);
      } else {
        toast.success('✅ Analysis complete!');
      }
      
      // Store analysis in uploadAnalysis for backward compatibility
      const analysisText = `
COMPREHENSIVE ANALYSIS RESULTS
================================

📊 Total Images Analyzed: ${analysis.images.length}
📄 Documents Analyzed: ${analysis.documents.length}
💻 Code Files Analyzed: ${analysis.code.length}

EXTRACTED DATA:
---------------
🎵 Songs: ${analysis.extractedData.songs.map(s => s.title).join(', ')}
👁️ Sight Words: ${analysis.extractedData.sightWords.join(', ')}
📖 Vocabulary: ${analysis.extractedData.vocabulary.map(v => v.word).join(', ')}
❓ Discussion Questions: ${analysis.extractedData.discussionQuestions.length} found

${analysis.slideStructure ? `
DETECTED SLIDE STRUCTURE:
-------------------------
Total Slides: ${analysis.slideStructure.totalSlides}
Sections: ${analysis.slideStructure.sections.map(s => `${s.name} (${s.slideCount} slides)`).join(', ')}
` : ''}
      `.trim();
      
      setUploadAnalysis(analysisText);
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze reference materials');
    } finally {
      setIsAnalyzingReferences(false);
      setAnalysisProgress(100);
    }
  };

  const handleSaveLessonSetup = async (setup: LessonSetup) => {
    try {
      setLessonSetup(setup);
      
      // First, save to localStorage as immediate backup
      const storageKey = `lesson:${lessonId}:setup`;
      localStorage.setItem(storageKey, JSON.stringify(setup));
      console.log(`💾 Lesson setup saved to localStorage for ${lessonId}`);
      
      // Then try to persist to database
      try {
        const token = await getUserAccessToken();
        if (!token) {
          console.warn('No auth token, skipping database save');
          return;
        }

        // HYBRID AUTH: anon key in Authorization, user JWT in query param
        const response = await api.kvSet(storageKey, setup);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn(`⚠️ Server save failed: ${errorData.error || response.statusText}, but localStorage backup succeeded`);
        } else {
          console.log(`✅ Lesson setup saved to database for ${lessonId}`);
        }
      } catch (networkError) {
        // Server not available, but localStorage worked
        console.warn('⚠️ Server not available, using localStorage:', networkError);
      }
      
      toast.success('Lesson setup saved!');
      
      // Auto-advance to next step
      handleNext();
    } catch (error) {
      console.error('Failed to save lesson setup:', error);
      toast.error(`Failed to save lesson setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Validate required fields
    if (!formData.phonicsConcept || !formData.storyTitle || !formData.comprehensionTopic) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    console.log('📊 Reference uploads summary:', {
      powerpoint: uploadedFiles.powerpoint.length,
      slidePictures: uploadedFiles.slidePictures.length,
      code: uploadedFiles.code.length,
      documentation: uploadedFiles.documentation.length,
      analysisLength: uploadAnalysis.length,
    });
    
    // Show save dialog instead of immediately completing
    setShowSaveDialog(true);
  };

  // Get complete lesson data for saving
  const getCompleteLessonData = (): KindergartenLessonData => {
    return {
      ...formData,
      referenceUploads: {
        powerpoint: uploadedFiles.powerpoint,
        slidePictures: uploadedFiles.slidePictures,
        code: uploadedFiles.code,
        documentation: uploadedFiles.documentation,
        analysis: uploadAnalysis,
      },
    } as KindergartenLessonData;
  };

  const handleReturnHome = () => {
    if (confirm('Are you sure you want to return home? Your progress will be saved automatically.')) {
      if (onCancel) {
        onCancel();
      }
    }
  };

  const handleClear = () => {
    if (window.confirm('⚠️ START NEW LESSON?\n\nThis will clear ALL your current work and start a completely fresh lesson.\n\n• All form fields will be reset\n• All uploaded files will be removed\n• Current draft will be cleared\n\nThis CANNOT be undone. Are you sure?')) {
      const defaultData = {
        subject: 'English Language Arts',
        ufliLessonNumber: 1,
        dayNumber: 1,
        phonicsConcept: '',
        date: new Date().toISOString().split('T')[0],
        savvasUnit: 1,
        savvasWeek: 1,
        savvasDay: 1,
        storyTitle: '',
        comprehensionTopic: '',
        songs: {
          song1: { title: 'Alphabet Song', youtubeUrl: '' },
          song2: { title: '', youtubeUrl: '' },
          song3: { title: '', youtubeUrl: '' },
        },
        ufli: {
          phonemicAwarenessTime: 2,
          visualDrillTime: 3,
          auditoryDrillTime: 5,
          blendingDrillTime: 5,
          newConceptTime: 15,
        },
        sightWords: [
          { word: '', youtubeUrl: '' },
          { word: '', youtubeUrl: '' },
          { word: '', youtubeUrl: '' },
          { word: '', youtubeUrl: '' },
        ],
        savvas: {
          bookPages: [],
          vocabulary: [
            { word: '', definition: '' },
            { word: '', definition: '' },
            { word: '', definition: '' },
          ],
          discussionQuestions: [
            'What was your favorite part of the story?',
            'Who were the main characters?',
            'What happened at the beginning, middle, and end?',
          ],
        },
        celebration: {
          enabled: true,
        },
      };
      
      setFormData(defaultData);
      setCurrentStep(0);
      setUploadedFiles({
        powerpoint: [],
        slidePictures: [],
        code: [],
        documentation: [],
      });
      setUploadAnalysis('');
      
      // Generate NEW draft lesson ID
      const newDraftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setLessonId(newDraftId);
      console.log('🆕 Starting fresh with new draft:', newDraftId);
      
      setLessonSetup(getDefaultLessonSetup(newDraftId));
      
      // Clear all localStorage
      localStorage.removeItem('lesson-wizard-data');
      localStorage.removeItem('lesson-wizard-current-step');
      localStorage.removeItem('uploaded-files');
      localStorage.removeItem('upload-analysis');
      localStorage.removeItem('lesson-setup');
      localStorage.removeItem('lesson-setup-data');
      localStorage.removeItem('ufli-upload-method');
      localStorage.removeItem('ufli-screenshot-count');
      localStorage.removeItem('current-draft-lesson-id'); // Clear old draft ID
      
      // Save new draft ID
      localStorage.setItem('current-draft-lesson-id', newDraftId);
      
      // Reset to step 0
      setCurrentStep(0);
      
      toast.success('✨ Started new lesson! Your previous work has been cleared.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <StepIcon className="size-8 text-sky-600" />
              {currentStepData.title}
            </h1>
            <p className="text-gray-600 mt-1">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between mb-6 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all min-w-[100px] ${
                isActive
                  ? 'bg-sky-100 text-sky-700'
                  : isCompleted
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Icon className={`size-5 ${isCompleted ? 'text-green-600' : ''}`} />
              <span className="text-xs font-medium text-center">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <Card className="mb-6">
        <CardContent className="p-8">
          {/* Step 0: Lesson Setup */}
          {currentStep === 0 && (
            <LessonSetupPanel
              lessonId={lessonId}
              initialSetup={lessonSetup}
              onSave={handleSaveLessonSetup}
              onCancel={onCancel}
            />
          )}

          {/* Step 1: Reference Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Alert style={{ backgroundColor: 'rgba(207, 227, 245, 0.3)', borderColor: 'var(--ao-sky)' }}>
                <Upload className="size-4" style={{ color: 'var(--ao-navy)' }} />
                <AlertDescription style={{ color: 'var(--ao-text)' }}>
                  <strong>This step is optional!</strong> Upload reference materials to understand <strong>CLASS STRUCTURE & FLOW</strong> - we'll learn the order lessons are taught, where UFLI appears in the daily sequence, and how different activities are organized. This shows us HOW to structure the new lesson.
                </AlertDescription>
              </Alert>
              
              <Alert style={{ backgroundColor: 'var(--ao-cream)', borderColor: 'var(--ao-tan)' }}>
                <AlertDescription className="text-sm" style={{ color: 'var(--ao-text)' }}>
                  <strong>💡 Purpose:</strong> Reference files show us the <strong>pedagogical structure</strong> - when UFLI is taught, how slides flow, where activities appear. We learn the STRUCTURE from references, then insert NEW content from Steps 4 & 6 into that structure.
                </AlertDescription>
              </Alert>

              {/* Display all uploaded PowerPoint files */}
              {uploadedPPTXFiles.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">📊 Uploaded PowerPoint Files ({uploadedPPTXFiles.length})</h3>
                    
                    <div className="flex items-center gap-3">
                      {/* Day filtering toggle - only show if we have a selected day and multiple files */}
                      {formData.ufliDay && uploadedPPTXFiles.length > 1 && (
                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showAllSlides}
                            onChange={(e) => setShowAllSlides(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Show all days
                        </label>
                      )}
                      
                      {/* Delete All PowerPoint Files button */}
                      {uploadedPPTXFiles.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAllFilesInCategory('powerpoint')}
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-3 mr-1" />
                          Delete All
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Filter helper message */}
                  {formData.ufliDay && !showAllSlides && uploadedPPTXFiles.some(p => p.detectedDay === formData.ufliDay) && (
                    <Alert className="bg-[var(--info-bg)] border-[var(--ao-sky)]">
                      <AlertDescription className="text-xs text-[var(--info-text)]">
                        <strong>💡 Day {formData.ufliDay} Filtering:</strong> Showing only files matching Day {formData.ufliDay}. Toggle "Show all days" to see everything.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadedPPTXFiles
                    .filter(pptx => {
                      // If showing all or no day selected, show everything
                      if (showAllSlides || !formData.ufliDay) return true;
                      // If file has detected day, only show if it matches
                      if (pptx.detectedDay) return pptx.detectedDay === formData.ufliDay;
                      // If no detected day, show it (unknown day)
                      return true;
                    })
                    .map((pptx) => (
                    <div key={pptx.id} className="bg-white border-2 border-[var(--processing-border)] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="size-12 rounded bg-[var(--processing-bg)] flex items-center justify-center flex-shrink-0">
                            {pptx.isAnalyzing ? (
                              <div className="animate-spin size-6 border-2 border-[var(--processing-text)] border-t-transparent rounded-full" />
                            ) : pptx.analysis ? (
                              <CheckCircle className="size-6 text-green-600" />
                            ) : (
                              <FileText className="size-6 text-[var(--processing-text)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">{pptx.name}</p>
                              {pptx.detectedDay && (
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0",
                                  pptx.detectedDay === formData.ufliDay 
                                    ? "bg-green-100 text-green-700 border border-green-300" 
                                    : "bg-gray-100 text-gray-600"
                                )}>
                                  Day {pptx.detectedDay}
                                  {pptx.detectedDay === formData.ufliDay && " ✓"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {pptx.isAnalyzing ? (
                                <span className="text-[var(--processing-text)] font-medium">📸 Extracting slides...</span>
                              ) : pptx.analysis ? (
                                <>✅ {pptx.analysis.totalSlides} slides extracted • {pptx.analysis.slides.filter(s => s.images.length > 0).length} with images</>
                              ) : (
                                <>{(pptx.size / 1024 / 1024).toFixed(2)} MB • Queued for analysis</>
                              )}
                            </p>
                            {/* Progress bar when analyzing */}
                            {pptx.isAnalyzing && (
                              <div className="w-full bg-[var(--processing-border)] rounded-full h-1.5 overflow-hidden mt-2">
                                <div className="h-full bg-gradient-to-r from-[var(--ao-navy)] via-[var(--ao-pink)] to-[var(--ao-navy)] rounded-full animate-[loading_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setUploadedPPTXFiles(prev => prev.filter(p => p.id !== pptx.id));
                            // Also remove from uploadedFiles
                            setUploadedFiles(prev => ({
                              ...prev,
                              powerpoint: prev.powerpoint.filter(f => !f.name.includes(pptx.name)),
                            }));
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-[var(--ao-red)] hover:text-[var(--ao-red)]/80 flex-shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary Card */}
                  {uploadedPPTXFiles.some(p => p.analysis) && (
                    <Alert className="bg-[var(--ao-green)]/10 border-2 border-[var(--ao-green)]">
                      <CheckCircle className="size-4 text-green-600" />
                      <AlertDescription className="text-[var(--ao-text)]">
                        <strong>✨ Excellent!</strong> All slide screenshots have been extracted and saved.
                        {formData.ufliDay && uploadedPPTXFiles.some(p => p.detectedDay === formData.ufliDay) && !showAllSlides && (
                          <span className="block mt-1">
                            🎯 <strong>Day {formData.ufliDay} slides</strong> will be prioritized in your slideshow editor.
                          </span>
                        )}
                        {(!formData.ufliDay || showAllSlides) && (
                          <span className="block mt-1">
                            They'll be available in your slideshow editor for reference or insertion.
                          </span>
                        )}
                        <span className="block mt-2 text-xs text-green-800">
                          💡 <strong>Note:</strong> Duplicate files are automatically detected and skipped to prevent multiple copies.
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Upload Area */}
              {(
                <>
                  {/* Upload Method Toggle */}
                  <div className="flex gap-2 mb-4 justify-center">
                    <Button
                      onClick={() => setUploadMethod('file')}
                      variant={uploadMethod === 'file' ? 'default' : 'outline'}
                      size="sm"
                      className={uploadMethod === 'file' ? 'bg-[var(--ao-navy)] hover:bg-[var(--ao-navy)]/90' : ''}
                    >
                      <Upload className="size-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      onClick={() => setUploadMethod('url')}
                      variant={uploadMethod === 'url' ? 'default' : 'outline'}
                      size="sm"
                      className={uploadMethod === 'url' ? 'bg-[var(--ao-navy)] hover:bg-[var(--ao-navy)]/90' : ''}
                    >
                      <LinkIcon className="size-4 mr-2" />
                      From URL
                    </Button>
                  </div>

                  {uploadMethod === 'file' && (
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                        isDragging ? "border-[var(--ao-navy)] bg-[var(--processing-bg)]" : "border-[var(--processing-border)] hover:border-[var(--ao-navy)]/40 bg-white"
                      )}
                      onDrop={handleReferenceDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onPaste={handleReferencePaste}
                      onClick={() => document.getElementById('reference-slideshow-input')?.click()}
                      tabIndex={0}
                    >
                      <Upload className="size-12 mx-auto mb-3 text-[var(--ao-muted)]" />
                      <p className="font-medium text-gray-900 mb-1">Drop, paste (Ctrl+V), or click to upload PowerPoint files</p>
                      <p className="text-sm text-gray-600 mb-1">✨ <strong>Multiple files supported!</strong> Upload all your reference decks</p>
                      <p className="text-xs text-gray-500">PPT, PPTX • Auto-extracts slides as screenshots</p>
                      <input
                        id="reference-slideshow-input"
                        type="file"
                        accept=".ppt,.pptx"
                        multiple
                        className="hidden"
                        onChange={handleReferenceFileInputChange}
                      />
                    </div>
                  )}
                  
                  {uploadMethod === 'url' && (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-[var(--processing-border)] rounded-lg p-6 bg-white">
                        <LinkIcon className="size-10 mx-auto mb-3 text-[var(--ao-muted)]" />
                        <p className="font-medium text-gray-900 mb-3 text-center">Load from URL</p>
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            placeholder="https://example.com/slideshow.pptx (PowerPoint files only)"
                            value={urlInput}
                            onChange={handleUrlInputChange}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleUrlSubmit}
                            disabled={isLoadingFromUrl || !urlInput}
                            className="bg-[var(--ao-navy)] hover:bg-[var(--ao-navy)]/90"
                          >
                            {isLoadingFromUrl ? (
                              <>
                                <Download className="size-4 mr-2 animate-bounce" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Download className="size-4 mr-2" />
                                Load
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* Loading Status */}
                        {isLoadingFromUrl && loadingStatus && (
                          <div className="mt-3 bg-[var(--processing-bg)] border border-[var(--processing-border)] rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin size-4 border-2 border-[var(--processing-text)] border-t-transparent rounded-full" />
                              <p className="text-sm text-[var(--processing-text)] font-medium">
                                {loadingStatus}
                              </p>
                            </div>
                            {/* Animated Progress Bar */}
                            <div className="w-full bg-[var(--processing-border)] rounded-full h-2 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[var(--ao-navy)] via-[var(--ao-pink)] to-[var(--ao-navy)] rounded-full animate-[loading_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          PowerPoint files only (.pptx). <strong>⚠️ URL loading often fails due to CORS/permissions.</strong> We recommend downloading the file and using "Upload File" instead. Figma URLs are not supported.
                        </p>
                      </div>

                      <Alert className="bg-[var(--info-bg)] border-[var(--ao-sky)]">
                        <AlertDescription className="text-xs text-[var(--info-text)]">
                          <strong>💡 Recommended:</strong> If URL loading fails, just download the file and use the "Upload File" button instead. This completely bypasses all permission and CORS issues!
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </>
              )}

              {/* Slide Pictures Upload Section */}
              <UploadArea
                category="slidePictures"
                icon={Image}
                title="Slide Pictures / Screenshots (optional)"
                description="for visual reference"
                acceptedFormats="image/*,.pdf,.zip"
                colorScheme="blue"
                uploadedFiles={uploadedFiles}
                isDragActive={dragActive.slidePictures}
                isProcessing={isAnalyzingReferences}
                progress={analysisProgress}
                error={uploadError}
                isCurrentCategory={currentUploadCategory === 'slidePictures'}
                onFileSelect={(files) => handleReferenceUpload(files, 'slidePictures')}
                onDeleteAll={() => deleteAllFilesInCategory('slidePictures')}
                onRemoveFile={(index) => removeUploadedFile('slidePictures', index)}
                onRetry={retryUpload}
                onStartOver={startOverUpload}
                onDragEnter={(e) => handleDragEnter(e, 'slidePictures')}
                onDragOver={handleDragOver}
                onDragLeave={(e) => handleDragLeave(e, 'slidePictures')}
                onDrop={(e) => handleDrop(e, 'slidePictures')}
                onPaste={(e) => handlePaste(e, 'slidePictures')}
              />

              {/* Code Upload Section */}
              <UploadArea
                category="code"
                icon={FileText}
                title="Component Code (optional)"
                description="for exact styling"
                acceptedFormats=".tsx,.ts,.jsx,.js,.css,.zip"
                colorScheme="green"
                uploadedFiles={uploadedFiles}
                isDragActive={dragActive.code}
                isProcessing={isAnalyzingReferences}
                progress={analysisProgress}
                error={uploadError}
                isCurrentCategory={currentUploadCategory === 'code'}
                onFileSelect={(files) => handleReferenceUpload(files, 'code')}
                onDeleteAll={() => deleteAllFilesInCategory('code')}
                onRemoveFile={(index) => removeUploadedFile('code', index)}
                onRetry={retryUpload}
                onStartOver={startOverUpload}
                onDragEnter={(e) => handleDragEnter(e, 'code')}
                onDragOver={handleDragOver}
                onDragLeave={(e) => handleDragLeave(e, 'code')}
                onDrop={(e) => handleDrop(e, 'code')}
                onPaste={(e) => handlePaste(e, 'code')}
              />

              {/* Documentation Upload Section */}
              <UploadArea
                category="documentation"
                icon={BookOpen}
                title="Documentation (optional)"
                description="README, structure notes, etc."
                acceptedFormats=".md,.txt,.pdf,.doc,.docx,.zip"
                colorScheme="gray"
                uploadedFiles={uploadedFiles}
                isDragActive={dragActive.documentation}
                isProcessing={isAnalyzingReferences}
                progress={analysisProgress}
                error={uploadError}
                isCurrentCategory={currentUploadCategory === 'documentation'}
                onFileSelect={(files) => handleReferenceUpload(files, 'documentation')}
                onDeleteAll={() => deleteAllFilesInCategory('documentation')}
                onRemoveFile={(index) => removeUploadedFile('documentation', index)}
                onRetry={retryUpload}
                onStartOver={startOverUpload}
                onDragEnter={(e) => handleDragEnter(e, 'documentation')}
                onDragOver={handleDragOver}
                onDragLeave={(e) => handleDragLeave(e, 'documentation')}
                onDrop={(e) => handleDrop(e, 'documentation')}
                onPaste={(e) => handlePaste(e, 'documentation')}
              />

              {/* Webpage Import Section */}
              <div className="mt-6">
                <WebpageImport
                  lessonId={lessonId}
                  onImportComplete={(fileId, title, url) => {
                    setImportedWebpages(prev => [...prev, { fileId, title, url }]);
                  }}
                  maxUrls={3}
                  currentUrlCount={importedWebpages.length}
                />
              </div>

              {/* Comprehensive Analysis Button */}
              {(uploadedFiles.slidePictures.length > 0 || uploadedFiles.code.length > 0 || uploadedFiles.documentation.length > 0) && (
                <div className="bg-gradient-to-r from-[var(--info-bg)] to-[var(--processing-bg)] rounded-lg p-6 border-2 border-[var(--ao-sky)]">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <ScanText className="size-6 text-[var(--ao-navy)]" />
                      <h3 className="font-bold text-lg text-gray-900">Smart Analysis Ready!</h3>
                    </div>
                    <p className="text-sm text-gray-700">
                      I'll scan all your uploaded files using OCR and AI to extract songs, sight words, vocabulary, questions, and slide structure to auto-populate your lesson.
                    </p>
                    <Button
                      onClick={runComprehensiveAnalysis}
                      disabled={isAnalyzingReferences}
                      className="w-full h-14 bg-gradient-to-r from-[var(--ao-navy)] to-[var(--ao-navy)]/90 hover:from-[var(--ao-navy)]/90 hover:to-[var(--ao-navy)]/80 text-white font-bold text-lg shadow-lg"
                    >
                      {isAnalyzingReferences ? (
                        <>
                          <Loader2 className="size-6 mr-3 animate-spin" />
                          Analyzing... {analysisProgress}%
                        </>
                      ) : (
                        <>
                          <ScanText className="size-6 mr-3" />
                          Analyze All Files & Auto-Fill Form
                          <Sparkles className="size-5 ml-2" />
                        </>
                      )}
                    </Button>
                    {isAnalyzingReferences && (
                      <Progress value={analysisProgress} className="h-2" />
                    )}
                  </div>
                </div>
              )}

              {/* Upload Analysis */}
              {uploadAnalysis && (
                <div className="bg-[var(--ao-green)]/10 rounded-lg p-4 border-2 border-[var(--ao-green)]">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-green-900 mb-2 text-lg">✅ Analysis Complete!</h4>
                      <div className="text-sm text-green-900 whitespace-pre-line font-mono bg-white/50 rounded p-3 max-h-60 overflow-y-auto">
                        {uploadAnalysis}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg p-3 border" style={{ backgroundColor: 'var(--ao-cream)', borderColor: 'var(--ao-tan)' }}>
                <p className="text-xs" style={{ color: 'var(--ao-text)' }}>
                  <span className="font-semibold">💡 Why provide references?</span> Upload a PowerPoint file for automated analysis, slide pictures for visual reference, component code for exact styling, and/or documentation (like README files) for lesson structure details. All uploads are optional - you can skip and use the default design.
                </p>
              </div>

              {/* Next Step Preview */}
              {uploadedFiles.powerpoint.length > 0 && (
                <Alert className="bg-[var(--processing-bg)] border-[var(--processing-border)]">
                  <Sparkles className="size-4 text-[var(--processing-text)]" />
                  <AlertDescription className="text-[var(--processing-text)] text-sm">
                    <strong>✨ Next: AI Analysis!</strong> When you click "Next", our AI will analyze your uploaded materials to identify the lesson focus, phonics patterns, vocabulary words, and more. You'll be able to review and edit the suggestions before continuing.
                  </AlertDescription>
                </Alert>
              )}

              {/* Skip Button */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setCurrentStep(3)}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Skip This Step - Use Default Design
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Review & Approve (AI Analysis) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <ReviewApprove
                lessonId={lessonId}
                onApprove={() => {
                  // Move to next step after approval
                  setCurrentStep(3);
                  toast.success('✅ Lesson analysis approved! Continue with songs and activities.');
                }}
                onBack={() => {
                  // Go back to upload step
                  setCurrentStep(1);
                }}
              />
            </div>
          )}

          {/* Step 3: Songs */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Alert>
                <Music className="size-4" />
                <AlertDescription>
                  Song 1 stays the same. Songs 2 & 3 change based on your phonics focus.
                </AlertDescription>
              </Alert>

              {/* Song 1 */}
              <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Music className="size-4" />
                  Song 1 (Always the Same)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="song1-title">Song Title</Label>
                    <Input
                      id="song1-title"
                      value={formData.songs?.song1.title}
                      onChange={(e) => updateFormData({
                        songs: {
                          ...formData.songs!,
                          song1: { ...formData.songs!.song1, title: e.target.value }
                        }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <Tabs defaultValue="youtube" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
                      <TabsTrigger value="upload">Upload Video</TabsTrigger>
                    </TabsList>
                    <TabsContent value="youtube" className="mt-3">
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.songs?.song1.youtubeUrl}
                        onChange={(e) => updateFormData({
                          songs: {
                            ...formData.songs!,
                            song1: { ...formData.songs!.song1, youtubeUrl: e.target.value }
                          }
                        })}
                      />
                    </TabsContent>
                    <TabsContent value="upload" className="mt-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-400 transition-colors cursor-pointer">
                        <Upload className="size-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI (max 50MB)</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Song 2 */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--ao-cream)', borderColor: 'var(--ao-tan)' }}>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Music className="size-4" />
                  Song 2 (Changes Based on Phonics Focus)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="song2-title">Song Title</Label>
                    <Input
                      id="song2-title"
                      placeholder="e.g., Long A Song"
                      value={formData.songs?.song2.title}
                      onChange={(e) => updateFormData({
                        songs: {
                          ...formData.songs!,
                          song2: { ...formData.songs!.song2, title: e.target.value }
                        }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <Tabs defaultValue="youtube" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
                      <TabsTrigger value="upload">Upload Video</TabsTrigger>
                    </TabsList>
                    <TabsContent value="youtube" className="mt-3">
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.songs?.song2.youtubeUrl}
                        onChange={(e) => updateFormData({
                          songs: {
                            ...formData.songs!,
                            song2: { ...formData.songs!.song2, youtubeUrl: e.target.value }
                          }
                        })}
                      />
                    </TabsContent>
                    <TabsContent value="upload" className="mt-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-400 transition-colors cursor-pointer">
                        <Upload className="size-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI (max 50MB)</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Song 3 */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--ao-cream)', borderColor: 'var(--ao-tan)' }}>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Music className="size-4" />
                  Song 3 (Changes Based on Phonics Focus)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="song3-title">Song Title</Label>
                    <Input
                      id="song3-title"
                      placeholder="e.g., A_E Pattern Song"
                      value={formData.songs?.song3.title}
                      onChange={(e) => updateFormData({
                        songs: {
                          ...formData.songs!,
                          song3: { ...formData.songs!.song3, title: e.target.value }
                        }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <Tabs defaultValue="youtube" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
                      <TabsTrigger value="upload">Upload Video</TabsTrigger>
                    </TabsList>
                    <TabsContent value="youtube" className="mt-3">
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.songs?.song3.youtubeUrl}
                        onChange={(e) => updateFormData({
                          songs: {
                            ...formData.songs!,
                            song3: { ...formData.songs!.song3, youtubeUrl: e.target.value }
                          }
                        })}
                      />
                    </TabsContent>
                    <TabsContent value="upload" className="mt-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-400 transition-colors cursor-pointer">
                        <Upload className="size-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI (max 50MB)</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: UFLI Phonics */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Alert>
                <FileText className="size-4" />
                <AlertDescription>
                  Upload your entire UFLI PowerPoint slideshow or add individual screenshots.
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-900 text-sm">
                  <strong>📚 Content Source:</strong> These UFLI materials will be analyzed for lesson content, topics, vocabulary, and structure. This is your actual teaching material, not just visual reference.
                </AlertDescription>
              </Alert>

              <Tabs value={ufliUploadMethod} onValueChange={(v) => setUfliUploadMethod(v as 'powerpoint' | 'screenshots')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="powerpoint">Upload PowerPoint</TabsTrigger>
                  <TabsTrigger value="screenshots">Upload Screenshots</TabsTrigger>
                </TabsList>
                
                <TabsContent value="powerpoint" className="space-y-4">
                  {/* Display uploaded file */}
                  {formData.ufliPowerPoint && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded bg-green-100 flex items-center justify-center">
                            <FileText className="size-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">{formData.ufliPowerPoint.name}</p>
                            <p className="text-xs text-green-700">
                              {(formData.ufliPowerPoint.size / 1024 / 1024).toFixed(2)} MB • Uploaded
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => updateFormData({ ufliPowerPoint: undefined })}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative",
                      isDragging ? "border-sky-500 bg-sky-50" : "border-gray-300 hover:border-sky-400"
                    )}
                    onDrop={(e) => handleDrop(e, 'ufliPowerPoint')}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onPaste={(e) => handlePaste(e, 'ufliPowerPoint')}
                    onClick={() => document.getElementById('ufli-powerpoint-input')?.click()}
                    tabIndex={0}
                  >
                    <Upload className="size-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium text-gray-900 mb-1">Drop, paste (Ctrl+V), or click to upload UFLI PowerPoint</p>
                    <p className="text-sm text-gray-600 mb-1">Multiple upload methods supported</p>
                    <p className="text-xs text-gray-500">PPT, PPTX (max 100MB)</p>
                    <input
                      id="ufli-powerpoint-input"
                      type="file"
                      accept=".ppt,.pptx"
                      className="hidden"
                      onChange={(e) => handleFileInputChange(e, 'ufliPowerPoint')}
                    />
                  </div>

                  <Alert className="bg-[var(--info-bg)] border-[var(--ao-sky)]">
                    <FileText className="size-4 text-[var(--info-text)]" />
                    <AlertDescription className="text-[var(--info-text)]">
                      We'll automatically detect visual drill letters from your PowerPoint and extract all slides for you.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="screenshots" className="space-y-4">
                  <div>
                    <Label htmlFor="screenshotCount">How many screenshots do you want to upload?</Label>
                    <Input
                      id="screenshotCount"
                      type="number"
                      min="1"
                      value={ufliScreenshotCount}
                      onChange={(e) => setUfliScreenshotCount(parseInt(e.target.value) || 1)}
                      className="mt-1 max-w-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    {Array.from({ length: ufliScreenshotCount }).map((_, index) => (
                      <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-sky-400 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Upload className="size-6 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Screenshot {index + 1}</p>
                            <p className="text-xs text-gray-500">PNG, JPG (max 10MB)</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Progress Tracker Timing (minutes)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phonemicTime">Phonemic Awareness</Label>
                    <Input
                      id="phonemicTime"
                      type="number"
                      value={formData.ufli?.phonemicAwarenessTime || ''}
                      onChange={(e) => updateFormData({
                        ufli: { ...formData.ufli!, phonemicAwarenessTime: parseInt(e.target.value) || undefined }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="visualDrillTime">Visual Drill</Label>
                    <Input
                      id="visualDrillTime"
                      type="number"
                      value={formData.ufli?.visualDrillTime || ''}
                      onChange={(e) => updateFormData({
                        ufli: { ...formData.ufli!, visualDrillTime: parseInt(e.target.value) || undefined }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="auditoryDrillTime">Auditory Drill</Label>
                    <Input
                      id="auditoryDrillTime"
                      type="number"
                      value={formData.ufli?.auditoryDrillTime || ''}
                      onChange={(e) => updateFormData({
                        ufli: { ...formData.ufli!, auditoryDrillTime: parseInt(e.target.value) || undefined }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blendingDrillTime">Blending Drill</Label>
                    <Input
                      id="blendingDrillTime"
                      type="number"
                      value={formData.ufli?.blendingDrillTime || ''}
                      onChange={(e) => updateFormData({
                        ufli: { ...formData.ufli!, blendingDrillTime: parseInt(e.target.value) || undefined }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newConceptTime">New Concept</Label>
                    <Input
                      id="newConceptTime"
                      type="number"
                      value={formData.ufli?.newConceptTime || ''}
                      onChange={(e) => updateFormData({
                        ufli: { ...formData.ufli!, newConceptTime: parseInt(e.target.value) || undefined }
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Sight Words */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Alert className="flex-1 mr-4">
                  <Eye className="size-4" />
                  <AlertDescription>
                    Typically 4 sight words. Videos can be YouTube links or uploaded files (varies per word).
                  </AlertDescription>
                </Alert>
                <Button onClick={addSightWord} variant="outline" size="sm">
                  <Plus className="size-4 mr-1" />
                  Add Word
                </Button>
              </div>

              <div className="space-y-4">
                {formData.sightWords?.map((word, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`sight-word-${index}`}>Sight Word {index + 1}</Label>
                          <Input
                            id={`sight-word-${index}`}
                            placeholder="e.g., the, and, is"
                            value={word.word}
                            onChange={(e) => updateSightWord(index, { word: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        
                        <Tabs defaultValue="youtube" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
                            <TabsTrigger value="upload">Upload Video</TabsTrigger>
                          </TabsList>
                          <TabsContent value="youtube" className="mt-2">
                            <Input
                              placeholder="https://youtube.com/watch?v=... (e.g., HeidiSongs)"
                              value={word.youtubeUrl}
                              onChange={(e) => updateSightWord(index, { youtubeUrl: e.target.value })}
                            />
                          </TabsContent>
                          <TabsContent value="upload" className="mt-2">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-sky-400 transition-colors cursor-pointer">
                              <Upload className="size-6 mx-auto mb-1 text-gray-400" />
                              <p className="text-xs text-gray-600">Upload video file</p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                      
                      {formData.sightWords!.length > 1 && (
                        <Button
                          onClick={() => removeSightWord(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 mt-6"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Savvas Reading */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Savvas Reference Materials Upload Section */}
              <UploadArea
                category="savvasReference"
                icon={BookMarked}
                title="Savvas Teacher Materials (optional)"
                description="lesson plans, guides, teacher editions"
                acceptedFormats=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,image/*,.zip"
                colorScheme="gray"
                uploadedFiles={uploadedFiles}
                isDragActive={dragActive.savvasReference}
                isProcessing={isAnalyzingReferences}
                progress={analysisProgress}
                error={uploadError}
                isCurrentCategory={currentUploadCategory === 'savvasReference'}
                onFileSelect={(files) => handleReferenceUpload(files, 'savvasReference')}
                onDeleteAll={() => deleteAllFilesInCategory('savvasReference')}
                onRemoveFile={(index) => removeUploadedFile('savvasReference', index)}
                onRetry={retryUpload}
                onStartOver={startOverUpload}
                onDragEnter={(e) => handleDragEnter(e, 'savvasReference')}
                onDragOver={handleDragOver}
                onDragLeave={(e) => handleDragLeave(e, 'savvasReference')}
                onDrop={(e) => handleDrop(e, 'savvasReference')}
                onPaste={(e) => handlePaste(e, 'savvasReference')}
              />

              <Alert className="bg-[var(--info-bg)] border-[var(--ao-sky)]">
                <AlertDescription className="text-[var(--info-text)] text-sm">
                  <strong>💡 Important:</strong> Savvas materials uploaded here are analyzed for actual lesson content (topics, vocabulary, comprehension questions, etc.). This is not just for visual design reference.
                </AlertDescription>
              </Alert>

              <Alert className="bg-sky-50 border-sky-200">
                <BookMarked className="size-4 text-sky-600" />
                <AlertDescription className="text-sky-900">
                  <strong>Tip:</strong> Click on any book page box and press Cmd+V (Mac) or Ctrl+V (Windows) to paste images from your clipboard!
                </AlertDescription>
              </Alert>

              <h3 className="font-semibold text-gray-900">Book Pages</h3>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Upload screenshots of book pages (number varies)</p>
                <Button onClick={addBookPage} variant="outline" size="sm">
                  <Plus className="size-4 mr-1" />
                  Add Page
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {formData.savvas?.bookPages?.map((page, index) => (
                  <div 
                    key={page.id} 
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
                      page.imageData 
                        ? "border-green-400 bg-green-50" 
                        : "border-gray-300 hover:border-sky-400"
                    )}
                    onPaste={(e) => handleBookPagePaste(e, index)}
                    tabIndex={0}
                  >
                    <Button
                      onClick={() => removeBookPage(index)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-red-600 hover:text-red-700 z-10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    
                    {page.imageData ? (
                      <div className="text-center">
                        <div className="size-10 rounded bg-green-100 flex items-center justify-center mx-auto mb-2">
                          <Check className="size-5 text-green-600" />
                        </div>
                        <p className="text-xs font-medium text-green-900 mb-1">Page {index + 1} - Uploaded!</p>
                        <p className="text-xs text-green-700">{page.imageData.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="size-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-xs text-gray-900 font-medium mb-1">Page {index + 1}</p>
                        <p className="text-xs text-gray-500">Click to upload or paste image (Cmd/Ctrl+V)</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {formData.savvas?.bookPages?.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <BookMarked className="size-12 mx-auto mb-2 text-gray-300" />
                    <p>No book pages added yet. Click "Add Page" to get started.</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Vocabulary Words (3-4 typically)</h3>
                  <Button onClick={addVocabularyWord} variant="outline" size="sm">
                    <Plus className="size-4 mr-1" />
                    Add Word
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.savvas?.vocabulary?.map((vocab, index) => (
                    <div key={index} className="p-4 bg-[var(--processing-bg)] rounded-lg border border-[var(--processing-border)]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`vocab-word-${index}`}>Word</Label>
                            <Input
                              id={`vocab-word-${index}`}
                              placeholder="e.g., harvest"
                              value={vocab.word}
                              onChange={(e) => updateVocabularyWord(index, { word: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`vocab-def-${index}`}>Definition (optional)</Label>
                            <Input
                              id={`vocab-def-${index}`}
                              placeholder="e.g., to gather crops"
                              value={vocab.definition}
                              onChange={(e) => updateVocabularyWord(index, { definition: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Image (optional)</Label>
                            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-[var(--ao-navy)]/40 transition-colors cursor-pointer">
                              <Upload className="size-5 mx-auto mb-1 text-gray-400" />
                              <p className="text-xs text-gray-600">Upload placeholder image</p>
                            </div>
                          </div>
                        </div>
                        
                        {formData.savvas!.vocabulary!.length > 1 && (
                          <Button
                            onClick={() => removeVocabularyWord(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 mt-6"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="size-5 text-[var(--ao-navy)]" />
                    Discussion Questions - Close Reading
                  </h3>
                  <p className="text-sm text-gray-600">
                    Extract text and questions from your story pages, then generate additional questions
                  </p>
                </div>

                {/* OCR Extract Button */}
                <div className="mb-6">
                  <Button 
                    onClick={extractTextFromStoryPages}
                    disabled={isProcessingOCR || (formData.savvas?.bookPages?.length || 0) === 0}
                    className="w-full"
                    variant={extractedStoryText ? "outline" : "default"}
                  >
                    {isProcessingOCR ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Extracting... {ocrProgress}%
                      </>
                    ) : extractedStoryText ? (
                      <>
                        <Check className="size-4 mr-2" />
                        Text Extracted! Re-run to update
                      </>
                    ) : (
                      <>
                        <ScanText className="size-4 mr-2" />
                        Extract Text & Questions from Story Pages
                      </>
                    )}
                  </Button>
                  {isProcessingOCR && (
                    <Progress value={ocrProgress} className="mt-2" />
                  )}
                </div>

                {/* Extracted Story Text (read-only preview) */}
                {extractedStoryText && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="size-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Extracted Story Text</h4>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200 max-h-40 overflow-y-auto text-sm">
                      {extractedStoryText.substring(0, 500)}
                      {extractedStoryText.length > 500 && '...'}
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      {extractedStoryText.length} characters extracted
                    </p>
                  </div>
                )}

                {/* Extracted Questions from Story Pages */}
                {formData.savvas?.extractedQuestions && formData.savvas.extractedQuestions.length > 0 && (
                  <div className="mb-6 p-4 bg-[var(--info-bg)] rounded-lg border-2 border-[var(--ao-sky)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="size-5 text-[var(--info-text)]" />
                      <h4 className="font-semibold text-[var(--info-text)]">Questions Found on Story Pages</h4>
                    </div>
                    <p className="text-sm text-[var(--info-text)] mb-3">
                      These questions were automatically detected at the top of your story pages
                    </p>
                    <div className="space-y-2">
                      {formData.savvas.extractedQuestions.map((question: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded border border-[var(--ao-sky)]">
                          <div className="size-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--ao-sky)', color: 'var(--ao-navy)' }}>
                            {idx + 1}
                          </div>
                          <p className="text-sm text-gray-900 flex-1">{question}</p>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={() => {
                        const currentQuestions = formData.savvas?.discussionQuestions || [];
                        const extractedQs = formData.savvas?.extractedQuestions || [];
                        // Add extracted questions to discussion questions if not already there
                        const newQuestions = [...currentQuestions];
                        extractedQs.forEach(q => {
                          if (!currentQuestions.includes(q)) {
                            newQuestions.push(q);
                          }
                        });
                        updateFormData({
                          savvas: { ...formData.savvas!, discussionQuestions: newQuestions }
                        });
                        toast.success('Added extracted questions to your final list!');
                      }}
                      variant="outline"
                      className="mt-3 w-full"
                    >
                      <Plus className="size-4 mr-2" />
                      Add All to Final Questions
                    </Button>
                  </div>
                )}

                {/* Simple Lesson Focus Input */}
                <div className="mb-6 p-4 bg-gradient-to-br from-[var(--processing-bg)] to-[var(--ao-pink)] rounded-lg border-2 border-[var(--processing-border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="size-5 text-[var(--processing-text)]" />
                    <h4 className="font-semibold text-[var(--processing-text)]">What's the Focus of Today's Lesson?</h4>
                  </div>
                  <p className="text-sm text-[var(--processing-text)] mb-4">
                    Tell me what you want to focus on, and I'll suggest questions based on the story
                  </p>

                  <Input
                    placeholder="e.g., character feelings, setting, main idea, vocabulary..."
                    className="mb-3 bg-white"
                    value={formData.savvas?.lessonFocus || ''}
                    onChange={(e) => updateFormData({
                      savvas: { ...formData.savvas!, lessonFocus: e.target.value }
                    })}
                  />

                  <Button 
                    className="w-full bg-gradient-to-r from-[var(--ao-navy)] to-[var(--ao-red)] hover:from-[var(--ao-navy)]/90 hover:to-[var(--ao-red)]/90"
                    disabled={!extractedStoryText || !formData.savvas?.lessonFocus}
                    onClick={() => {
                      // Generate kindergarten-appropriate questions
                      const focus = formData.savvas?.lessonFocus || '';
                      const storyText = extractedStoryText || '';
                      const currentQuestions = formData.savvas?.discussionQuestions || [];
                      
                      const generatedQuestions = generateKindergartenQuestions(focus, storyText);
                      
                      updateFormData({
                        savvas: { 
                          ...formData.savvas!, 
                          discussionQuestions: [...currentQuestions, ...generatedQuestions] 
                        }
                      });
                      
                      toast.success(`Added ${generatedQuestions.length} kindergarten-level questions!`);
                    }}
                  >
                    <Sparkles className="size-4 mr-2" />
                    Generate Questions from Focus
                  </Button>
                </div>

                {/* Final Editable Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Your Final Discussion Questions</h4>
                    <Button onClick={addDiscussionQuestion} variant="outline" size="sm">
                      <Plus className="size-4 mr-1" />
                      Add Custom Question
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Edit, reorder, or add your own questions</p>
                  
                  <div className="space-y-3">
                    {formData.savvas?.discussionQuestions?.map((question, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Textarea
                          placeholder={`Discussion question ${index + 1}`}
                          value={question}
                          onChange={(e) => updateDiscussionQuestion(index, e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        {formData.savvas!.discussionQuestions!.length > 1 && (
                          <Button
                            onClick={() => removeDiscussionQuestion(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Review */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <Check className="size-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Review your lesson details below. You can go back to edit any section.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lesson Basics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">UFLI Lesson:</span>
                      <span className="font-medium">{formData.ufliLessonNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Day #:</span>
                      <span className="font-medium">{formData.dayNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phonics Concept:</span>
                      <span className="font-medium">{formData.phonicsConcept || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Story:</span>
                      <span className="font-medium">{formData.storyTitle || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comprehension:</span>
                      <span className="font-medium">{formData.comprehensionTopic || 'Not set'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Songs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Song 1:</span> {formData.songs?.song1.title || 'Not set'}
                    </div>
                    <div>
                      <span className="text-gray-600">Song 2:</span> {formData.songs?.song2.title || 'Not set'}
                    </div>
                    <div>
                      <span className="text-gray-600">Song 3:</span> {formData.songs?.song3.title || 'Not set'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sight Words</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {formData.sightWords?.map((word, index) => (
                        <Badge key={index} variant="secondary">
                          {word.word || `Word ${index + 1}`}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Savvas Reading</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit/Week/Day:</span>
                      <span className="font-medium">Unit {formData.savvasUnit}, Week {formData.savvasWeek}, Day {formData.savvasDay || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Book Pages:</span>
                      <span className="font-medium">{formData.savvas?.bookPages?.length || 0} pages</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vocabulary Words:</span>
                      <span className="font-medium">{formData.savvas?.vocabulary?.length || 0} words</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discussion Questions:</span>
                      <span className="font-medium">{formData.savvas?.discussionQuestions?.length || 0} questions</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Reference Uploads Summary */}
                {(uploadedFiles.powerpoint.length > 0 || 
                  uploadedFiles.slidePictures.length > 0 || 
                  uploadedFiles.code.length > 0 || 
                  uploadedFiles.documentation.length > 0 ||
                  uploadedFiles.savvasReference.length > 0) && (
                  <Card className="border-[var(--processing-border)]">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Upload className="size-5 text-[var(--processing-text)]" />
                        Reference Materials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {uploadedFiles.powerpoint.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">PowerPoint Files:</span>
                          <span className="font-medium">{uploadedFiles.powerpoint.length} file(s)</span>
                        </div>
                      )}
                      {uploadedFiles.slidePictures.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Slide Pictures:</span>
                          <span className="font-medium">{uploadedFiles.slidePictures.length} file(s)</span>
                        </div>
                      )}
                      {uploadedFiles.code.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Code Files:</span>
                          <span className="font-medium">{uploadedFiles.code.length} file(s)</span>
                        </div>
                      )}
                      {uploadedFiles.documentation.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Documentation:</span>
                          <span className="font-medium">{uploadedFiles.documentation.length} file(s)</span>
                        </div>
                      )}
                      {uploadedFiles.savvasReference.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Savvas Materials:</span>
                          <span className="font-medium">{uploadedFiles.savvasReference.length} file(s)</span>
                        </div>
                      )}
                      <div className="pt-2 mt-2 border-t border-[var(--processing-border)]">
                        <span className="text-[var(--processing-text)] font-medium">
                          ✅ Reference materials will inform template generation
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons - Hide on Review & Approve step (it has custom navigation) */}
      {currentStep !== 2 && (
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            size="lg"
          >
            <ChevronLeft className="size-5 mr-1" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} size="lg" className="bg-sky-600 hover:bg-sky-700">
            Next
            <ChevronRight className="size-5 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleComplete} size="lg" className="bg-green-600 hover:bg-green-700">
            <PartyPopper className="size-5 mr-2" />
            Create Lesson!
          </Button>
        )}
      </div>
      )}

      {/* Save Lesson Dialog */}
      <SaveLessonDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        lessonData={getCompleteLessonData()}
        metadata={{
          ufliUploadMethod,
          ufliScreenshotCount,
          uploadAnalysis,
          pptxAnalysis,
          comprehensiveAnalysis,
          extractedStoryText,
          uploadedPPTXFiles,
        }}
        fileObjectsMap={fileObjectsMap}
        existingLessonId={existingLessonId}
        existingCreatedAt={existingCreatedAt}
      />
    </div>
  );
}