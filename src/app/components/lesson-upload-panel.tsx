/**
 * Lesson Upload Panel (Step 2)
 * 
 * UPDATED WORKFLOW:
 * 1. Upload exemplar slide deck first
 * 2. System analyzes exemplar (extracts time, curriculum info)
 * 3. Teacher fills in curriculum details (UFLI/Savvas)
 * 4. Upload additional materials if needed
 * 
 * Template and materials upload section:
 * - Upload area for materials (PPTX, PDF, images, ZIP)
 * - File list with processing status
 * - PERSISTENCE: Files are saved to KV store and reloaded on mount
 * - OCR: Automatically triggers extraction jobs after upload
 * 
 * @updated 2026-02-21 - Fixed TemplateSelector import
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  RefreshCw,
  Info,
  Eye,
  Replace,
  ChevronDown,
  ChevronUp,
  FileImage,
  FileCode,
  Package,
} from 'lucide-react';
import { cn } from './ui/utils';
import { LessonSetup } from '../types/lesson-setup-types';
import { CurriculumDetailsPanel } from './curriculum-details-panel';
import { TemplateSelector } from './template-selector';
import { uploadFiles } from '../../utils/storage-client';  // ✅ UNIFIED UPLOAD ADAPTER
import { queueUpload, checkFileSize, getQueueStatus } from '../../utils/uploadManager';  // ✅ UPLOAD OPTIMIZATION
import { projectId } from '../../utils/supabase/info';
import { getCurrentUserId } from '../../utils/supabase-auth';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN
import { needsOCR, getOCRJobType, getOCRJobDescription } from '../../utils/ocr-detection';
import { ExtractionPreviewPanel } from './lazy-components';  // ✅ Lazy-loaded version
import { UploadTipsBanner } from './upload-tips-banner';
import { DEBUG } from '../config';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'extracting' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  storagePath?: string;
  sha256?: string;
  jobId?: string;
  isExemplar?: boolean; // Mark which file is the exemplar
  statusMessage?: string; // Detailed status message
  estimatedTimeRemaining?: number; // Seconds remaining
  uploadStartTime?: number; // Timestamp when upload started
  processingStartTime?: number; // Timestamp when processing started
  totalElapsedSeconds?: number; // Total elapsed time in seconds
  stage?: string; // Current stage (e.g., "Unzipping...", "Extracting...")
}

interface LessonUploadPanelProps {
  lessonId: string;
  lessonSetup: LessonSetup;
  onComplete: () => void;
  onBack: () => void;
}

export function LessonUploadPanel({
  lessonId,
  lessonSetup,
  onComplete,
  onBack,
}: LessonUploadPanelProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [templateFiles, setTemplateFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isTemplateDragging, setIsTemplateDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [curriculumDetailsSaved, setCurriculumDetailsSaved] = useState(false);
  const [exemplarAnalysis, setExemplarAnalysis] = useState<any>(null); // Analysis results from exemplar
  const [showTemplateAssets, setShowTemplateAssets] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<'ready' | 'missing' | 'updating'>('ready');
  const [highlightedFileIds, setHighlightedFileIds] = useState<Set<string>>(new Set());
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<string | null>(null);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize userId on mount
  useEffect(() => {
    getCurrentUserId().then(id => {
      setUserId(id);
      if (!id) {
        console.warn('No user ID found - user may not be authenticated');
      }
    });
  }, []);

  // FIX #9: Debug function to show raw job data from backend
  const debugJob = async (jobId: string) => {
    try {
      const response = await api.getJob(jobId);
      
      if (response.ok) {
        const job = await response.json();
        if (DEBUG) {
          console.log('🔍 DEBUG - Raw job data:', job);
          alert(`Job ${jobId}: ${JSON.stringify(job, null, 2)}`);
        }
        toast.info('Job data logged to console');
      } else {
        const errorText = await response.text();
        if (DEBUG) console.error('Failed to fetch job:', errorText);
        toast.error(`Failed to fetch job: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error(`Error fetching job: ${error}`);
    }
  };

  // FIX #9: Resync - re-fetch job status and update UI
  const resyncJob = async (fileId: string, jobId: string, isTemplate: boolean) => {
    try {
      const response = await api.getJob(jobId);
      
      if (!response.ok) {
        toast.error('Failed to resync job status');
        return;
      }
      
      const job = await response.json();
      if (DEBUG) console.log(`🔄 Resync job ${jobId}:`, job);
      
      const updateFn = isTemplate ? setTemplateFiles : setUploadedFiles;
      
      updateFn(prev => prev.map(f => {
        if (f.id !== fileId) return f;
        
        let frontendStatus = f.status;
        if (job.status === 'complete') frontendStatus = 'complete';
        else if (job.status === 'error') frontendStatus = 'error';
        else if (job.status === 'processing') frontendStatus = 'processing';
        
        return {
          ...f,
          status: frontendStatus,
          progress: job.progress || f.progress,
          statusMessage: job.stageMessage || job.stage,
          error: job.errorMessage,
        };
      }));
      
      toast.success('Job status refreshed from server');
    } catch (error) {
      console.error('Resync error:', error);
      toast.error(`Failed to resync: ${error}`);
    }
  };

  // FIX #9: Retry - create new job for failed/stuck file
  const retryJob = async (file: UploadedFile, isTemplate: boolean) => {
    if (!file.jobId) {
      toast.error('No job ID to retry');
      return;
    }
    
    try {
      const response = await api.retryJob(file.jobId);
      
      if (!response.ok) {
        const errorText = await response.text();
        toast.error(`Failed to retry job: ${errorText}`);
        return;
      }
      
      const { newJob } = await response.json();
      if (DEBUG) console.log(`🔄 Retry created new job:`, newJob);
      
      const updateFn = isTemplate ? setTemplateFiles : setUploadedFiles;
      
      updateFn(prev => prev.map(f => {
        if (f.id !== file.id) return f;
        
        return {
          ...f,
          jobId: newJob.id,
          status: 'processing',
          progress: 0,
          statusMessage: 'Retrying...',
          error: undefined,
        };
      }));
      
      toast.success('Retrying job - new processing started');
    } catch (error) {
      console.error('Retry error:', error);
      toast.error(`Failed to retry: ${error}`);
    }
  };

  // FIX #9: Cancel job
  const cancelJob = async (fileId: string, jobId: string, isTemplate: boolean) => {
    try {
      const response = await api.cancelJob(jobId);
      
      if (!response.ok) {
        toast.error('Failed to cancel job');
        return;
      }
      
      const updateFn = isTemplate ? setTemplateFiles : setUploadedFiles;
      
      updateFn(prev => prev.map(f => {
        if (f.id !== fileId) return f;
        
        return {
          ...f,
          status: 'error',
          statusMessage: 'Canceled by user',
          error: 'Canceled',
        };
      }));
      
      toast.success('Job canceled');
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(`Failed to cancel: ${error}`);
    }
  };

  // ========== FIX 1.2: LOAD FILES ON MOUNT ==========
  useEffect(() => {
    loadSavedFiles();
  }, [lessonId]);

  // ========== PERSIST FILES TO LOCALSTORAGE ==========
  // Save uploaded files to localStorage whenever they change
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem(`lesson_files_${lessonId}`, JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles, lessonId]);

  // Save template files to localStorage whenever they change
  useEffect(() => {
    if (templateFiles.length > 0 && userId) {
      localStorage.setItem(`template_files_${userId}`, JSON.stringify(templateFiles));
    }
  }, [templateFiles, userId]);

  // ========== BACKGROUND JOB POLLING ==========
  useEffect(() => {
    const hasProcessingFiles = uploadedFiles.some(f => 
      f.status === 'processing' || f.status === 'extracting' || f.status === 'uploading'
    );
    
    const hasProcessingTemplates = templateFiles.some(f =>
      f.status === 'processing' || f.status === 'uploading'
    );

    if (!hasProcessingFiles && !hasProcessingTemplates) {
      return;
    }

    if (DEBUG) console.log('🔄 Starting polling');
    
    let pollInterval: NodeJS.Timeout;
    let lastPollTime = 0;
    let unchangedCount = 0;
    
    const poll = async () => {
      // BATCH POLL: Get all jobs for this lesson in one request
      try {
        const response = await api.getLessonJobs(lessonId);
        
        if (response.ok) {
          const jobs = await response.json();
          if (DEBUG) console.log(`📊 Poll: ${jobs.length} jobs`);
          
          // Update all files based on job status
          setUploadedFiles(prev => prev.map(file => {
            if (!file.jobId) return file;
            
            const job = jobs.find((j: any) => j.id === file.jobId);
            if (!job) return file;
            
            // Update based on job status
            if (job.status === 'complete') {
              // ✅ Show extraction complete feedback (only once)
              if (file.status !== 'complete') {
                toast.success(`✅ Extraction complete: ${file.name}`);
              }
              return {
                ...file,
                status: 'complete',
                progress: 100,
                statusMessage: 'Analysis complete',
              };
            } else if (job.status === 'error') {
              return {
                ...file,
                status: 'error',
                error: job.errorMessage || 'Processing failed',
                statusMessage: job.stageMessage || 'Error',
              };
            } else if (job.status === 'processing') {
              return {
                ...file,
                status: 'processing',
                progress: job.progress || file.progress,
                statusMessage: job.stageMessage || job.stage,
              };
            }
            
            return file;
          }));
        }
      } catch (error) {
        console.error('Batch poll error:', error);
      }

      // LEGACY: Individual polling fallback for template files
      for (const file of uploadedFiles) {
        if (file.jobId && (file.status === 'processing' || file.status === 'extracting')) {
          try {
            const response = await api.getJob(file.jobId);
            
            if (response.ok) {
              const job = await response.json();
              
              // Update file status based on job status
              setUploadedFiles(prev => prev.map(f => {
                if (f.id !== file.id) return f;
                
                if (job.status === 'complete') {
                  // Save completion status to database
                  api.saveFileMetadata({
                    ...f,
                    fileId: f.id,
                    status: 'complete',
                    jobId: f.jobId,
                  }).catch(err => console.error('Failed to save complete status:', err));
                  
                  return {
                    ...f,
                    status: 'complete',
                    progress: 100,
                    statusMessage: 'Analysis complete',
                    estimatedTimeRemaining: 0,
                  };
                } else if (job.status === 'error') {
                  // Save error status to database
                  api.saveFileMetadata({
                    ...f,
                    fileId: f.id,
                    status: 'error',
                    jobId: f.jobId,
                    error: job.errorMessage,
                  }).catch(err => console.error('Failed to save error status:', err));
                  
                  return {
                    ...f,
                    status: 'error',
                    error: job.errorMessage || 'Processing failed',
                    statusMessage: job.stageMessage || job.errorMessage || 'Processing failed',
                  };
                } else if (job.status === 'processing') {
                  // FIX #3/#4: Progress is already 0-100 from backend
                  // FIX #3: Use job.stageMessage (not job.statusMessage)
                  const progress = Math.min(job.progress || 0, 99); // Cap at 99 until complete
                  return {
                    ...f,
                    status: 'processing',
                    progress,
                    statusMessage: job.stageMessage || job.stage || 'Processing...',
                    stage: job.stage,
                  };
                }
                
                return f;
              }));
            }
          } catch (error) {
            console.error('Error polling job:', file.jobId, error);
          }
        }
      }
      
      // Poll template files
      for (const file of templateFiles) {
        if (file.jobId && file.status === 'processing') {
          try {
            const response = await api.getJob(file.jobId);
            
            if (response.ok) {
              const job = await response.json();
              console.log(`📊 Template job ${file.jobId} status:`, job.status, `Progress: ${job.progress}%`, job.statusMessage);
              
              setTemplateFiles(prev => prev.map(f => {
                if (f.id !== file.id) return f;
                
                if (job.status === 'complete') {
                  // Save completion status to database
                  getCurrentUserId().then(userId => {
                    api.saveTemplateFile({
                      ...f,
                      fileId: f.id,
                      userId: userId || 'unknown',
                      status: 'ready',
                      jobId: f.jobId,
                    }).catch(err => console.error('Failed to save template complete status:', err));
                  });
                  
                  return {
                    ...f,
                    status: 'ready',
                    progress: 100,
                    statusMessage: 'Template analyzed',
                  };
                } else if (job.status === 'error') {
                  // Save error status to database
                  getCurrentUserId().then(userId => {
                    api.saveTemplateFile({
                      ...f,
                      fileId: f.id,
                      userId: userId || 'unknown',
                      status: 'error',
                      jobId: f.jobId,
                      error: job.errorMessage,
                    }).catch(err => console.error('Failed to save template error status:', err));
                  });
                  
                  return {
                    ...f,
                    status: 'error',
                    error: job.errorMessage || 'Analysis failed',
                  };
                } else if (job.status === 'processing') {
                  // FIX #3/#4: Progress is already 0-100, use stageMessage
                  const progress = Math.min(job.progress || 0, 99);
                  return {
                    ...f,
                    status: 'processing',
                    progress,
                    statusMessage: job.stageMessage || job.stage || 'Analyzing template...',
                  };
                }
                
                return f;
              }));
            }
          } catch (error) {
            console.error('Error polling template job:', file.jobId, error);
          }
        }
      }
    };
    
    // Only poll if there are active jobs
    const hasActiveJobs = uploadedFiles.some(f => f.status === 'processing') || 
                          templateFiles.some(f => f.status === 'processing');
    
    if (hasActiveJobs) {
      poll();
      pollInterval = setInterval(poll, 3000); // Increased to 3 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [uploadedFiles, templateFiles, lessonId]);

  /**
   * Manually refresh job status (for stuck files)
   */
  async function refreshJobStatus(fileId: string, jobId: string, isTemplate: boolean = false) {
    try {
      if (DEBUG) console.log(`🔄 Refresh job ${jobId}`);
      
      const response = await api.getJob(jobId);
      
      if (response.ok) {
        const job = await response.json();
        
        if (isTemplate) {
          setTemplateFiles(prev => prev.map(f => {
            if (f.id !== fileId) return f;
            
            if (job.status === 'complete') {
              toast.success('Template analysis complete!');
              return { ...f, status: 'ready', progress: 100, statusMessage: 'Template analyzed' };
            } else if (job.status === 'error') {
              toast.error('Template analysis failed');
              return { ...f, status: 'error', error: job.errorMessage || 'Analysis failed' };
            } else if (job.status === 'processing') {
              const progress = Math.min(job.progress || 50, 99);
              return { ...f, progress, statusMessage: job.statusMessage };
            }
            return f;
          }));
        } else {
          setUploadedFiles(prev => prev.map(f => {
            if (f.id !== fileId) return f;
            
            if (job.status === 'complete') {
              toast.success('File processing complete!');
              return { ...f, status: 'complete', progress: 100, statusMessage: 'Analysis complete' };
            } else if (job.status === 'error') {
              toast.error('File processing failed');
              return { ...f, status: 'error', error: job.errorMessage || 'Processing failed' };
            } else if (job.status === 'processing') {
              const progress = Math.min(job.progress || 50, 99);
              return { ...f, progress, statusMessage: job.statusMessage };
            }
            return f;
          }));
        }
      }
    } catch (error) {
      console.error('Error refreshing job status:', error);
      toast.error('Failed to refresh status');
    }
  }

  /**
   * Load previously uploaded files from server AND localStorage
   * Strategy: Load from localStorage first (instant), then from server (accurate)
   */
  async function loadSavedFiles() {
    try {
      setIsLoading(true);
      if (DEBUG) console.log('📂 Loading saved files for lesson:', lessonId);
      
      // Get current user ID
      const currentUserId = await getCurrentUserId();
      if (currentUserId && !userId) {
        setUserId(currentUserId);
      }
      
      // STEP 1: Load from localStorage first for instant feedback
      const cachedLessonFiles = localStorage.getItem(`lesson_files_${lessonId}`);
      const cachedTemplateFiles = currentUserId ? localStorage.getItem(`template_files_${currentUserId}`) : null;
      
      if (cachedLessonFiles) {
        try {
          const parsedFiles = JSON.parse(cachedLessonFiles);
          console.log('💾 Restored', parsedFiles.length, 'files from localStorage');
          setUploadedFiles(parsedFiles);
        } catch (e) {
          console.warn('Failed to parse cached lesson files:', e);
        }
      }
      
      if (cachedTemplateFiles) {
        try {
          const parsedFiles = JSON.parse(cachedTemplateFiles);
          console.log('💾 Restored', parsedFiles.length, 'template files from localStorage');
          setTemplateFiles(parsedFiles);
        } catch (e) {
          console.warn('Failed to parse cached template files:', e);
        }
      }
      
      // STEP 2A: Load lesson files from server (source of truth)
      const response = await api.getLessonFiles(lessonId);

      if (response.ok) {
        const savedFiles = await response.json();
        console.log('✅ Loaded', savedFiles.length, 'lesson files from server');

        // Convert server format to UI format
        const converted = savedFiles.map((file: any) => ({
          id: file.fileId,
          name: file.fileName,
          size: file.fileSize,
          type: file.fileType || '',
          status: file.status === 'ready' ? 'complete' : file.status,
          progress: 100,
          storagePath: file.storagePath,
          sha256: file.sha256,
          jobId: file.jobId,
          isExemplar: file.isExemplar || false,
        }));

        // Merge with cached files, preferring server data
        setUploadedFiles(converted);
        
        // If server data matches localStorage, clear localStorage cache (no longer needed)
        if (converted.length > 0 && converted.every((f: UploadedFile) => f.status === 'ready')) {
          localStorage.removeItem(`lesson_files_${lessonId}`);
          console.log('🧹 Cleared lesson files localStorage cache (all files ready)');
        }
      } else {
        console.warn('Failed to load lesson files from server:', response.statusText);
      }
      
      // STEP 2B: Load template files from server
      const templateUserId = currentUserId || await getCurrentUserId();
      const templateResponse = await api.getTemplateFiles(templateUserId, lessonSetup.subject);

      if (templateResponse.ok) {
        const savedTemplateFiles = await templateResponse.json();
        console.log('✅ Loaded', savedTemplateFiles.length, 'template files from server');

        // Convert server format to UI format
        const convertedTemplates = savedTemplateFiles.map((file: any) => ({
          id: file.fileId,
          name: file.fileName,
          size: file.fileSize,
          type: file.fileType || '',
          status: file.status || 'ready',
          progress: 100,
          storagePath: file.storagePath,
          sha256: file.sha256,
          jobId: file.jobId,
        }));

        setTemplateFiles(convertedTemplates);
        
        // Update template status
        if (convertedTemplates.length > 0) {
          setTemplateStatus('ready');
          setShowTemplateAssets(true); // Auto-expand to show existing templates
        } else {
          setTemplateStatus('missing');
        }
        
        // Clear localStorage cache if all ready
        if (convertedTemplates.length > 0 && convertedTemplates.every((f: UploadedFile) => f.status === 'ready')) {
          if (templateUserId) {
            localStorage.removeItem(`template_files_${templateUserId}`);
            console.log('🧹 Cleared template files localStorage cache (all files ready)');
          }
        }
      } else {
        console.warn('Failed to load template files from server:', templateResponse.statusText);
        setTemplateStatus('missing');
      }
      
    } catch (error) {
      console.error('Error loading saved files:', error);
      toast.error('Failed to load previous uploads');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    // ✅ USE UNIFIED UPLOAD ADAPTER
    const fileArray = Array.from(files);
    
    // Check if any files are already uploaded (avoid re-uploading on refresh)
    const newFiles: File[] = [];
    const duplicateFileIds: string[] = [];
    
    for (const file of fileArray) {
      const existingFile = uploadedFiles.find(
        f => f.name === file.name && 
             f.size === file.size && 
             (f.status === 'ready' || f.storagePath)
      );
      
      if (existingFile) {
        duplicateFileIds.push(existingFile.id);
        console.log('⏭️ Skipping already uploaded file:', file.name);
        toast.info(`⏭️ Already uploaded: ${file.name}`);  // ✅ UX FEEDBACK
      } else {
        newFiles.push(file);
      }
    }
    
    // Highlight existing duplicate files temporarily
    if (duplicateFileIds.length > 0) {
      setHighlightedFileIds(new Set(duplicateFileIds));
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedFileIds(new Set());
      }, 3000);
    }
    
    if (newFiles.length === 0) {
      console.log('ℹ️ No new files to upload');
      return;
    }
    
    // ✅ Show batch upload started feedback
    if (newFiles.length > 1) {
      toast.info(`📤 Uploading ${newFiles.length} files...`);
    }
    
    // Check for large files and show warnings
    for (const file of newFiles) {
      const { isVeryLarge, warningMessage } = checkFileSize(file);
      if (warningMessage) {
        if (isVeryLarge) {
          // Show a more prominent warning for very large files
          const proceed = window.confirm(
            `${file.name}\n\n${warningMessage}\n\nContinue upload?`
          );
          if (!proceed) {
            console.log(`⚠️ User cancelled upload of large file: ${file.name}`);
            return;
          }
        } else {
          toast.info(warningMessage, { duration: 5000 });
        }
      }
    }
    
    // Add placeholder entries to UI with uploading state
    const placeholders = newFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
    }));
    
    setUploadedFiles((prev) => [...prev, ...placeholders]);
    
    // Small delay to ensure UI updates before upload starts
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ✅ Show upload started feedback for each file
    newFiles.forEach(file => toast.info(`⬆️ Uploading ${file.name}...`));
    
    // Call unified upload adapter
    const results = await uploadFiles(
      newFiles,
      lessonId,
      'reference',  // Category for lesson materials
      (fileName, progress) => {
        // ✅ Smooth progress for better UX (never shows 100% until complete)
        const smoothedProgress = Math.min(progress, 95);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === fileName && f.status === 'uploading' 
              ? { ...f, progress: smoothedProgress } 
              : f
          )
        );
      }
    );
    
    // ========== FIX 1.1 + 2.1: SAVE METADATA & TRIGGER OCR ==========
    // Process each upload result
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const file = newFiles[i];
      const placeholder = placeholders[i];
      
      if (result.success && result.storagePath && result.sha256) {
        // ✅ Show upload complete feedback
        toast.success(`✅ Uploaded: ${file.name}`);
        
        // Generate unique file ID
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          // (1) IMMEDIATELY save file record after upload success
          console.log('💾 Saving file metadata after upload:', fileId);
          const saveResponse = await api.saveFileMetadata({
            fileId,
            lessonId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            bucket: 'make-0d810c1e-lessons',
            storagePath: result.storagePath,
            sha256: result.sha256,
            status: 'uploaded',
            uploadedAt: new Date().toISOString(),
          });

          if (!saveResponse.ok) {
            throw new Error('Failed to save file metadata');
          }

          console.log('✅ File metadata saved:', fileId);

          // Check if file needs OCR using utility function
          if (!needsOCR(file.name, file.type)) {
            // Skip OCR for files that don't need it (e.g., .txt, .md, .docx)
            console.log('ℹ️ File does not need OCR:', file.name);
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === placeholder.id
                  ? { ...f, id: fileId, status: 'ready', progress: 100, storagePath: result.storagePath }
                  : f
              )
            );
            continue;
          }

          // Get the OCR job type for this file
          const jobType = getOCRJobType(file.name, file.type);
          
          if (!jobType) {
            // Shouldn't happen if needsOCR() returned true, but handle gracefully
            console.warn('⚠️ File needs OCR but no job type determined:', file.name);
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === placeholder.id
                  ? { ...f, id: fileId, status: 'ready', progress: 100, storagePath: result.storagePath }
                  : f
              )
            );
            continue;
          }

          // Trigger OCR/extraction job
          console.log(`🔍 Creating ${jobType} job for:`, file.name);
          
          // ✅ Show processing feedback
          toast.info(`⚙️ Processing ${file.name}...`);
          const jobDescription = getOCRJobDescription(jobType);
          if (jobDescription) {
            toast.info(`📄 ${jobDescription}: ${file.name}`);
          }
          
          const jobResponse = await api.createJob({
            lessonId,
            fileId,
            fileName: file.name,
            type: jobType,
            storagePath: result.storagePath,
            bucket: 'make-0d810c1e-lessons',
          });

          if (!jobResponse.ok) {
            throw new Error('Failed to create extraction job');
          }

          const job = await jobResponse.json();
          console.log(`✅ Extraction job created for "${file.name}": ${job.id}`);
          
          // (2) IMMEDIATELY update file record with jobId after job creation
          // This ensures refresh can reattach to the job
          const updateFileResponse = await api.saveFileMetadata({
            fileId,
            jobId: job.id,
            status: 'processing',
          });
          
          if (!updateFileResponse.ok) {
            console.error('❌ Failed to update file record with jobId:', await updateFileResponse.text());
            // Continue anyway - UI state will still work
          } else {
            console.log(`💾 File record updated with jobId: ${fileId} -> ${job.id}`);
          }
          
          // Determine file extension for status message
          const ext = file.name.toLowerCase().split('.').pop();
          
          // Update UI with job info
          console.log(`📝 Adding file to UI: ${file.name} (fileId: ${fileId}, jobId: ${job.id})`);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === placeholder.id
                ? { 
                    ...f, 
                    id: fileId,
                    status: 'processing',
                    progress: 0,
                    storagePath: result.storagePath,
                    jobId: job.id, // ✅ Use canonical job.id
                    statusMessage: ext === 'pptx' ? 'Extracting PPTX...' : ext === 'pdf' ? 'Extracting PDF...' : 'Extracting text...',
                  }
                : f
            )
          );

        } catch (error) {
          console.error('Error saving file or creating job:', error);
          
          // ✅ Show error feedback
          const errorMsg = error instanceof Error ? error.message : 'Failed to process file';
          toast.error(`❌ Error processing ${file.name}: ${errorMsg}`);
          
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === placeholder.id
                ? { 
                    ...f, 
                    status: 'error',
                    progress: 0,
                    error: 'Failed to register file',
                  }
                : f
            )
          );
        }

      } else {
        // Upload failed
        // ✅ Show error feedback
        toast.error(`❌ Upload failed: ${file.name} - ${result.error}`);
        
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === placeholder.id
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  progress: 0,
                  error: result.error || 'Upload failed'
                }
              : f
          )
        );
        toast.error(`Upload failed: ${file.name}`);
      }
    }
  };

  const updateFileStatus = (
    fileId: string,
    status: UploadedFile['status'],
    progress: number,
    error?: string
  ) => {
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status, progress, error } : f
      )
    );
  };

  const removeFile = async (fileId: string) => {
    try {
      // Delete from server
      await api.deleteFile(fileId);

      // Remove from UI
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success('File removed');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  // ========== FIX 1.3: RETRY OCR BUTTON ==========
  const retryOCR = async (fileId: string, fileName: string) => {
    try {
      toast.info('Retrying OCR...');
      
      // Determine job type
      const ext = fileName.toLowerCase().split('.').pop();
      let jobType: string;
      
      if (ext === 'pptx') {
        jobType = 'extract_pptx';
      } else if (ext === 'pdf') {
        jobType = 'extract_pdf';
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
        jobType = 'ocr_image';
      } else {
        toast.error('Unsupported file type for OCR');
        return;
      }

      // Create new job
      const jobResponse = await api.createJob({
        lessonId,
        fileId,
        fileName,
        type: jobType,
      });

      if (!jobResponse.ok) {
        throw new Error('Failed to create job');
      }

      const job = await jobResponse.json();
      
      // Update file status
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'processing', jobId: job.id, error: undefined }
            : f
        )
      );

      toast.success('OCR job restarted');
    } catch (error) {
      console.error('Error retrying OCR:', error);
      toast.error('Failed to retry OCR');
    }
  };

  // ========== TEMPLATE FILE HANDLERS ==========
  const handleTemplateDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTemplateDragging(true);
  };

  const handleTemplateDragLeave = () => {
    setIsTemplateDragging(false);
  };

  const handleTemplateDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsTemplateDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleTemplateFiles(files);
  };

  const handleTemplateFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleTemplateFiles(files);
  };

  const handleTemplateFiles = async (files: File[]) => {
    setTemplateStatus('updating');
    const fileArray = Array.from(files);
    
    // Check for duplicates in template files
    const newFiles: File[] = [];
    const duplicateFileIds: string[] = [];
    
    for (const file of fileArray) {
      const existingFile = templateFiles.find(
        f => f.name === file.name && 
             f.size === file.size && 
             (f.status === 'ready' || f.storagePath)
      );
      
      if (existingFile) {
        duplicateFileIds.push(existingFile.id);
        console.log('⏭️ Skipping already uploaded template file:', file.name);
        toast.info(`⏭️ Already uploaded: ${file.name}`);  // ✅ UX FEEDBACK
      } else {
        newFiles.push(file);
      }
    }
    
    // Highlight existing duplicate files temporarily
    if (duplicateFileIds.length > 0) {
      setHighlightedFileIds(new Set(duplicateFileIds));
      
      // Auto-expand template assets to show duplicates
      setShowTemplateAssets(true);
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedFileIds(new Set());
      }, 3000);
    }
    
    if (newFiles.length === 0) {
      console.log('ℹ️ No new template files to upload');
      setTemplateStatus('ready');
      return;
    }
    
    // Add placeholder entries
    const placeholders = newFiles.map(file => ({
      id: `template-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
    }));
    
    setTemplateFiles((prev) => [...prev, ...placeholders]);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ✅ Show upload feedback for template files
    if (newFiles.length > 1) {
      toast.info(`📤 Uploading ${newFiles.length} template files...`);
    }
    newFiles.forEach(file => toast.info(`⬆️ Uploading ${file.name}...`));
    
    // Upload to 'template' category
    const userId = await getCurrentUserId();
    const results = await uploadFiles(
      fileArray,
      userId || 'unknown',  // Use userId for template storage (not lesson-specific)
      'template',
      (fileName, progress) => {
        // ✅ Smooth progress for template files
        const smoothedProgress = Math.min(progress, 95);
        setTemplateFiles((prev) =>
          prev.map((f) =>
            f.name === fileName && f.status === 'uploading' 
              ? { ...f, progress: smoothedProgress } 
              : f
          )
        );
      }
    );
    
    // Process template files
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const file = fileArray[i];
      const placeholder = placeholders[i];
      
      if (result.success && result.storagePath && result.sha256) {
        // ✅ Show template upload complete
        toast.success(`✅ Uploaded template: ${file.name}`);
        
        const fileId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          // Save template file metadata
          const saveResponse = await api.saveTemplateFile({
            fileId,
            userId: userId || 'unknown',
            subject: lessonSetup.subject,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            storagePath: result.storagePath,
            sha256: result.sha256,
            uploadedAt: new Date().toISOString(),
          });

          if (!saveResponse.ok) {
            throw new Error('Failed to save template file');
          }

          // Determine if this is a PPTX template that needs analysis
          const ext = file.name.toLowerCase().split('.').pop();
          
          if (ext === 'pptx') {
            // Trigger template analysis job
            const jobResponse = await api.createJob({
              userId: userId || 'unknown',
              fileId,
              fileName: file.name,
              type: 'analyze_template',
            });

            if (jobResponse.ok) {
              const job = await jobResponse.json();
              setTemplateFiles((prev) =>
                prev.map((f) =>
                  f.id === placeholder.id
                    ? { ...f, id: fileId, status: 'processing', jobId: job.id, storagePath: result.storagePath }
                    : f
                )
              );
            } else {
              throw new Error('Failed to analyze template');
            }
          } else {
            // Non-PPTX files (images, icons, etc.) are ready immediately
            setTemplateFiles((prev) =>
              prev.map((f) =>
                f.id === placeholder.id
                  ? { ...f, id: fileId, status: 'ready', progress: 100, storagePath: result.storagePath }
                  : f
              )
            );
          }

        } catch (error) {
          console.error('Error saving template file:', error);
          
          // ✅ Show error feedback
          const errorMsg = error instanceof Error ? error.message : 'Failed to save template file';
          toast.error(`❌ Error saving template ${file.name}: ${errorMsg}`);
          
          setTemplateFiles((prev) =>
            prev.map((f) =>
              f.id === placeholder.id
                ? { ...f, status: 'error', error: 'Failed to save template file' }
                : f
            )
          );
        }
        
      } else {
        // Template upload failed
        // ✅ Show error feedback
        toast.error(`❌ Template upload failed: ${file.name} - ${result.error}`);
        
        setTemplateFiles((prev) =>
          prev.map((f) =>
            f.id === placeholder.id
              ? { ...f, status: 'error', error: result.error || 'Upload failed' }
              : f
          )
        );
      }
    }
    
    setTemplateStatus('ready');
  };

  const removeTemplateFile = async (fileId: string) => {
    try {
      await api.deleteTemplateFile(fileId);

      setTemplateFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success('Template file removed');
    } catch (error) {
      console.error('Error removing template file:', error);
      toast.error('Failed to remove template file');
    }
  };

  // Retry upload for a failed file
  const retryTemplateUpload = async (fileId: string, fileName: string) => {
    toast.info('Please reselect the file to retry upload', {
      description: `File: ${fileName}`
    });

    // Trigger file input click
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pptx,.png,.jpg,.jpeg,.svg,.zip,.json';
    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const file = files[0];

      // Reset file state to uploading
      setTemplateFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
        )
      );

      try {
        const userId = await getCurrentUserId();
        const results = await uploadFiles(
          [file],
          userId || 'unknown',
          'template',
          (fileName, progress) => {
            setTemplateFiles((prev) =>
              prev.map((f) =>
                f.id === fileId ? { ...f, progress: Math.round(progress) } : f
              )
            );
          }
        );

        const result = results[0];

        if (result.success && result.storagePath) {
          const newFileId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const saveResponse = await api.saveTemplateFile({
            fileId: newFileId,
            userId: userId || 'unknown',
            subject: lessonSetup.subject,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            storagePath: result.storagePath,
            sha256: result.sha256,
            uploadedAt: new Date().toISOString(),
          });

          if (!saveResponse.ok) throw new Error('Failed to save template file');

          const ext = file.name.toLowerCase().split('.').pop();
          if (ext === 'pptx') {
            const jobResponse = await api.createJob({
              userId: userId || 'unknown',
              fileId: newFileId,
              fileName: file.name,
              type: 'analyze_template',
            });

            if (jobResponse.ok) {
              const job = await jobResponse.json();
              setTemplateFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId ? { ...f, id: newFileId, status: 'processing', jobId: job.id, storagePath: result.storagePath } : f
                )
              );
              toast.success('Upload successful - analyzing...');
            } else {
              setTemplateFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId ? { ...f, id: newFileId, status: 'ready', storagePath: result.storagePath } : f
                )
              );
              toast.success('Upload successful!');
            }
          } else {
            setTemplateFiles((prev) =>
              prev.map((f) =>
                f.id === fileId ? { ...f, id: newFileId, status: 'ready', storagePath: result.storagePath } : f
              )
            );
            toast.success('Upload successful!');
          }
        } else {
          setTemplateFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, status: 'error', error: result.error || 'Upload failed' } : f
            )
          );
          toast.error(`Upload failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Retry upload error:', error);
        setTemplateFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'error', error: 'Retry failed' } : f
          )
        );
        toast.error('Retry failed');
      }
    };

    fileInput.click();
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const allFilesReady = uploadedFiles.length > 0 && uploadedFiles.every((f) => f.status === 'complete');
  const hasFiles = uploadedFiles.length > 0;

  // Calculate aggregate upload progress
  const uploadingFiles = uploadedFiles.filter(f => f.status === 'uploading');
  const processingFiles = uploadedFiles.filter(f => f.status === 'processing' || f.status === 'extracting');
  const completedFiles = uploadedFiles.filter(f => f.status === 'complete');
  const errorFiles = uploadedFiles.filter(f => f.status === 'error');
  
  const totalFiles = uploadedFiles.length;
  const overallProgress = totalFiles > 0
    ? Math.round((completedFiles.length / totalFiles) * 100)
    : 0;

  // Calculate template files progress
  const templateUploadingFiles = templateFiles.filter(f => f.status === 'uploading');
  const templateProcessingFiles = templateFiles.filter(f => f.status === 'processing');
  const templateCompletedFiles = templateFiles.filter(f => f.status === 'ready');
  const templateErrorFiles = templateFiles.filter(f => f.status === 'error');
  
  const totalTemplateFiles = templateFiles.length;
  const templateOverallProgress = totalTemplateFiles > 0
    ? Math.round((templateCompletedFiles.length / totalTemplateFiles) * 100)
    : 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading uploaded files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Template & Materials</h2>
        <p className="text-muted-foreground">
          Upload your teaching materials and resources
        </p>
      </div>

      {/* Template Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Slide Deck Template
            <Badge 
              className={cn(
                templateStatus === 'ready' && 'bg-green-100 text-green-700',
                templateStatus === 'missing' && '',
                templateStatus === 'updating' && '',
                'ml-auto'
              )}
              style={
                templateStatus === 'missing' ? { backgroundColor: 'var(--ao-cream)', color: 'var(--ao-text)' } :
                templateStatus === 'updating' ? { backgroundColor: 'var(--processing-bg)', color: 'var(--processing-text)' } :
                {}
              }
            >
              {templateStatus === 'ready' && <><CheckCircle2 className="w-3 h-3 mr-1" />Template Ready</>}
              {templateStatus === 'missing' && <><AlertCircle className="w-3 h-3 mr-1" />Missing</>}
              {templateStatus === 'updating' && <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Updating</>}
            </Badge>
          </CardTitle>
          <CardDescription>
            Upload master slide deck template and design assets to inform ALL lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Find the first template file (usually .pptx)
                const firstTemplate = templateFiles.find(f => f.status === 'ready');
                if (firstTemplate) {
                  setSelectedFileForPreview(firstTemplate.id);
                  setShowPreviewPanel(true);
                }
              }}
              disabled={templateStatus === 'missing' || !templateFiles.some(f => f.status === 'ready')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Template
            </Button>
          </div>

          {/* Template Upload Area */}
          <div
            onDragOver={handleTemplateDragOver}
            onDragLeave={handleTemplateDragLeave}
            onDrop={handleTemplateDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isTemplateDragging
                ? "border-[var(--ao-navy)] bg-[var(--processing-bg)]"
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <Package className={cn(
              "w-12 h-12 mx-auto mb-4",
              isTemplateDragging ? "text-[var(--processing-text)]" : "text-gray-400"
            )} />
            
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isTemplateDragging ? 'Drop template files here' : 'Drag & drop template files here'}
            </p>
            
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>

            <label>
              <Button type="button" variant="outline">
                Browse Files
              </Button>
              <input
                type="file"
                multiple
                accept=".pptx,.png,.jpg,.jpeg,.svg,.json,.zip"
                className="hidden"
                onChange={handleTemplateFileSelect}
              />
            </label>

            <p className="text-xs text-gray-500 mt-4">
              Supported: PPTX deck • PNG/JPG/SVG graphics • ZIP asset package • JSON config
            </p>
          </div>

          {/* Template Assets List */}
          {templateFiles.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateAssets(!showTemplateAssets)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  Template Assets ({templateFiles.length})
                  {(templateUploadingFiles.length > 0 || templateProcessingFiles.length > 0) && (
                    <Badge className="bg-[var(--processing-bg)] text-[var(--processing-text)] border-[var(--processing-border)] ml-2">
                      {templateCompletedFiles.length} of {totalTemplateFiles} Complete • {templateOverallProgress}%
                    </Badge>
                  )}
                </span>
                {showTemplateAssets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showTemplateAssets && (
                <div className="mt-3 space-y-2">
                  {templateFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg transition-all duration-300 hover:border-gray-300"
                      )}
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0 pt-0.5">
                        {file.status === 'uploading' && <Loader2 className="w-5 h-5 text-[var(--info-text)] animate-spin" />}
                        {file.status === 'processing' && <Loader2 className="w-5 h-5 text-[var(--processing-text)] animate-spin" />}
                        {file.status === 'ready' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                      </div>

                      {/* File Info & Progress */}
                      <div className="flex-1 min-w-0">
                        {/* File Name */}
                        <p className="font-medium text-gray-900 text-sm truncate mb-1.5">
                          {file.name}
                        </p>
                        
                        {/* Status Row */}
                        <div className="flex items-center gap-2 mb-2">
                          {/* Status Badge */}
                          <Badge
                            className={cn(
                              "text-xs font-medium",
                              file.status === 'uploading' && 'bg-[var(--info-bg)] text-[var(--info-text)] border-0',
                              file.status === 'processing' && 'bg-[var(--processing-bg)] text-[var(--processing-text)] border-0',
                              file.status === 'ready' && 'bg-green-100 text-green-700 border-0',
                              file.status === 'error' && 'bg-red-100 text-red-700 border-0'
                            )}
                          >
                            {file.status === 'uploading' && 'Uploading'}
                            {file.status === 'processing' && (file.progress >= 95 ? 'Finalizing' : 'Analyzing')}
                            {file.status === 'ready' && 'Ready'}
                            {file.status === 'error' && 'Error'}
                          </Badge>
                          
                          {/* Refresh Button for stuck template files */}
                          {file.status === 'processing' && file.progress === 100 && file.jobId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => refreshJobStatus(file.id, file.jobId!, true)}
                              className="h-5 px-1.5 text-[var(--processing-text)] hover:text-[var(--processing-text)]/80 hover:bg-[var(--processing-bg)]"
                              title="Refresh status"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {/* File Size Display */}
                          {file.status === 'uploading' && file.progress > 0 ? (
                            <span className="text-xs font-semibold text-[var(--info-text)]">
                              {((file.size * file.progress / 100) / 1024 / 1024).toFixed(1)} MB / {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          ) : file.status === 'ready' ? (
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          ) : null}
                        </div>
                        
                        {/* Progress Section - Only for active states */}
                        {(file.status === 'uploading' || file.status === 'processing') && (
                          <div className="space-y-1.5">
                            {/* Progress Bar */}
                            <div className="relative">
                              <Progress value={file.progress} className="h-1.5" />
                            </div>
                            
                            {/* Status Message Row */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 font-medium">
                                {file.statusMessage || (
                                  <>
                                    {file.status === 'uploading' && 'Uploading to cloud...'}
                                    {file.status === 'processing' && (
                                      <>
                                        {file.progress < 30 && 'Unzipping template...'}
                                        {file.progress >= 30 && file.progress < 60 && 'Scanning slide layouts...'}
                                        {file.progress >= 60 && file.progress < 90 && 'Analyzing design elements...'}
                                        {file.progress >= 90 && 'Saving template data...'}
                                      </>
                                    )}
                                  </>
                                )}
                              </span>
                              <span className="text-[var(--info-text)] font-semibold">{file.progress}%</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Error Message */}
                        {file.error && (
                          <p className="text-xs text-red-600 mt-1.5 font-medium">{file.error}</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {/* Retry Button - for failed uploads */}
                        {file.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryTemplateUpload(file.id, file.name)}
                            className="h-8 px-2 text-[var(--ao-red)] hover:text-[var(--ao-red)]/80 hover:bg-[var(--ao-red)]/10"
                            title="Retry upload"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Retry</span>
                          </Button>
                        )}
                        
                        {/* View Extraction Button - for completed files */}
                        {file.status === 'ready' && file.name.endsWith('.pptx') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFileForPreview(file.id);
                              setShowPreviewPanel(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="View extracted content"
                          >
                            <Eye className="w-4 h-4 text-[var(--ao-navy)]" />
                          </Button>
                        )}
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTemplateFile(file.id)}
                          className="h-8 w-8 p-0"
                          title="Remove"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Info Banner */}
          <div className="bg-[var(--processing-bg)] dark:bg-[var(--processing-bg)] border border-[var(--processing-border)] dark:border-[var(--processing-border)] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[var(--processing-text)] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--processing-text)] dark:text-[var(--processing-text)]">
                <p className="font-medium">Template informs ALL future lessons</p>
                <p className="text-[var(--processing-text)] dark:text-[var(--processing-text)] mt-1">
                  Slide structure, layouts, fonts, colors, and branding will be automatically applied to generated lessons.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Optimization Tips */}
      <UploadTipsBanner />

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Materials
          </CardTitle>
          <CardDescription>
            Drag & drop or click to upload slides, PDFs, images, or ZIP files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-sky-400 bg-sky-50"
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <Upload className={cn(
              "w-12 h-12 mx-auto mb-4",
              isDragging ? "text-sky-500" : "text-gray-400"
            )} />
            
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>

            <label>
              <Button type="button" variant="outline">
                Browse Files
              </Button>
              <input
                type="file"
                multiple
                accept=".pptx,.pdf,.jpg,.jpeg,.png,.zip,.md,.txt,.docx,.doc"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            <p className="text-xs text-gray-500 mt-4">
              Supported: PPTX, PDF, DOC, DOCX, JPG, PNG, ZIP, MD, TXT • Max 200MB per file
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {hasFiles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Uploaded Files ({uploadedFiles.length})</span>
              {(uploadingFiles.length > 0 || processingFiles.length > 0) && (
                <Badge style={{ backgroundColor: 'var(--processing-bg)', color: 'var(--processing-text)', borderColor: 'var(--processing-border)' }}>
                  {completedFiles.length} of {totalFiles} Complete • {overallProgress}%
                </Badge>
              )}
            </CardTitle>
            {(uploadingFiles.length > 0 || processingFiles.length > 0) && (
              <div className="space-y-2 pt-2">
                <Progress value={overallProgress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    {uploadingFiles.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-[var(--info-text)]" />
                        {uploadingFiles.length} uploading
                      </span>
                    )}
                    {processingFiles.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-[var(--processing-text)]" />
                        {processingFiles.length} analyzing
                      </span>
                    )}
                    {completedFiles.length > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {completedFiles.length} ready
                      </span>
                    )}
                    {errorFiles.length > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        {errorFiles.length} failed
                      </span>
                    )}
                  </div>
                  <span>{overallProgress}% complete</span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg transition-all duration-300 hover:border-gray-300",
                    highlightedFileIds.has(file.id) && "ring-2 animate-pulse"
                  )}
                  style={highlightedFileIds.has(file.id) ? { 
                    backgroundColor: 'var(--ao-cream)', 
                    borderColor: 'var(--ao-tan)',
                    '--tw-ring-color': 'var(--ao-tan)'
                  } as any : {}}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 pt-0.5">
                    {file.status === 'uploading' && <Loader2 className="w-5 h-5 text-[var(--info-text)] animate-spin" />}
                    {file.status === 'processing' && <Loader2 className="w-5 h-5 text-[var(--processing-text)] animate-spin" />}
                    {file.status === 'extracting' && <Loader2 className="w-5 h-5 text-[var(--processing-text)] animate-spin" />}
                    {file.status === 'complete' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  </div>

                  {/* File Info & Progress */}
                  <div className="flex-1 min-w-0">
                    {/* File Name */}
                    <p className="font-medium text-gray-900 text-sm truncate mb-1.5">
                      {file.name}
                    </p>
                    
                    {/* Status Row */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* Status Badge */}
                      <Badge
                        className={cn(
                          "text-xs font-medium",
                          file.status === 'uploading' && 'bg-[var(--info-bg)] text-[var(--info-text)] border-0',
                          file.status === 'processing' && 'bg-[var(--processing-bg)] text-[var(--processing-text)] border-0',
                          file.status === 'extracting' && 'bg-[var(--processing-bg)] text-[var(--processing-text)] border-0',
                          file.status === 'complete' && 'bg-green-100 text-green-700 border-0',
                          file.status === 'error' && 'bg-red-100 text-red-700 border-0'
                        )}
                      >
                        {file.status === 'uploading' && 'Uploading'}
                        {file.status === 'extracting' && 'Extracting'}
                        {file.status === 'processing' && (file.progress >= 95 ? 'Finalizing' : 'Processing')}
                        {file.status === 'complete' && 'Ready'}
                        {file.status === 'error' && 'Error'}
                      </Badge>
                      
                      {/* FIX #9: Action Buttons - Debug, Resync, Retry, Cancel */}
                      {file.jobId && (
                        <div className="flex items-center gap-1">
                          {/* Debug Button - shows raw backend state */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => debugJob(file.jobId!)}
                            className="h-6 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title="Show backend job data (debug)"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          
                          {/* Resync Button - for processing/stuck files */}
                          {(file.status === 'processing' || file.status === 'error') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resyncJob(file.id, file.jobId!, false)}
                              className="h-6 px-2 text-[var(--ao-navy)] hover:text-[var(--ao-navy)]/80 hover:bg-[var(--ao-navy)]/10"
                              title="Refresh status from server"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {/* Retry Button - for error/stuck files */}
                          {(file.status === 'error' || (file.status === 'processing' && file.progress >= 99)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryJob(file, false)}
                              className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Retry processing (creates new job)"
                            >
                              <Replace className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {/* Cancel Button - for processing files */}
                          {file.status === 'processing' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelJob(file.id, file.jobId!, false)}
                              className="h-6 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Cancel job"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* File Size Display */}
                      {file.status === 'uploading' && file.progress > 0 ? (
                        <span className="text-xs font-semibold text-[var(--info-text)]">
                          {((file.size * file.progress / 100) / 1024 / 1024).toFixed(1)} MB / {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      ) : file.status === 'complete' ? (
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      ) : null}
                    </div>
                    
                    {/* Progress Section - Only for active states */}
                    {file.status !== 'complete' && file.status !== 'error' && (
                      <div className="space-y-1.5">
                        {/* Progress Bar */}
                        <div className="relative">
                          <Progress value={file.progress} className="h-1.5" />
                        </div>
                        
                        {/* Status Message Row */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-medium">
                            {file.statusMessage || (
                              <>
                                {file.status === 'uploading' && `Uploading to cloud...`}
                                {file.status === 'processing' && (
                                  <>
                                    {file.name.endsWith('.pptx') && (
                                      <>
                                        {file.progress < 30 && 'Unzipping presentation...'}
                                        {file.progress >= 30 && file.progress < 60 && 'Extracting slide content...'}
                                        {file.progress >= 60 && file.progress < 90 && 'Analyzing layouts...'}
                                        {file.progress >= 90 && 'Saving to database...'}
                                      </>
                                    )}
                                    {file.name.endsWith('.pdf') && (
                                      <>
                                        {file.progress < 25 && 'Reading PDF...'}
                                        {file.progress >= 25 && file.progress < 75 && 'Extracting text...'}
                                        {file.progress >= 75 && 'Saving content...'}
                                      </>
                                    )}
                                    {(file.name.endsWith('.docx') || file.name.endsWith('.doc')) && (
                                      <>
                                        {file.progress < 30 && 'Reading document...'}
                                        {file.progress >= 30 && file.progress < 70 && 'Extracting text...'}
                                        {file.progress >= 70 && 'Saving content...'}
                                      </>
                                    )}
                                    {(file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) && (
                                      <>
                                        {file.progress < 40 && 'Processing image...'}
                                        {file.progress >= 40 && file.progress < 80 && 'Running OCR...'}
                                        {file.progress >= 80 && 'Saving text...'}
                                      </>
                                    )}
                                  </>
                                )}
                                {file.status === 'extracting' && (
                                  <>
                                    {file.progress < 50 && 'Preparing extraction...'}
                                    {file.progress >= 50 && 'Scanning text...'}
                                  </>
                                )}
                              </>
                            )}
                          </span>
                          <span className="text-[var(--info-text)] font-semibold">{file.progress}%</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1.5 font-medium">{file.error}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {/* View Extraction Button - for completed files */}
                    {file.status === 'complete' && needsOCR(file.name, file.type) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFileForPreview(file.id);
                          setShowPreviewPanel(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="View extracted text"
                      >
                        <Eye className="w-4 h-4 text-[var(--ao-navy)]" />
                      </Button>
                    )}
                    
                    {/* Retry Button for Errors */}
                    {file.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryOCR(file.id, file.name)}
                        className="h-8 w-8 p-0"
                        title="Retry"
                      >
                        <RefreshCw className="w-4 h-4 text-[var(--ao-navy)]" />
                      </Button>
                    )}
                    
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0"
                      title="Remove"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Curriculum Details Section - Shows after exemplar uploaded */}
      {hasFiles && allFilesReady && (
        <>
          <Card className="bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800">
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-sky-900 dark:text-sky-100">
                  <p className="font-medium mb-1">Next: Fill in Curriculum Details</p>
                  <p className="text-sky-700 dark:text-sky-300">
                    Your files are ready! Now tell us about the curriculum focus for this lesson.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <CurriculumDetailsPanel
            lessonId={lessonId}
            exemplarAnalysis={exemplarAnalysis}
            onSave={(data) => {
              console.log('Curriculum details saved:', data);
              setCurriculumDetailsSaved(true);
              toast.success('Curriculum details saved!');
            }}
          />
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Setup
        </Button>

        <Button
          type="button"
          onClick={onComplete}
          disabled={!allFilesReady || !curriculumDetailsSaved}
        >
          Continue to Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Extraction Preview Dialog */}
      {showPreviewPanel && selectedFileForPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
            <ExtractionPreviewPanel
              fileId={selectedFileForPreview}
              fileName={uploadedFiles.find(f => f.id === selectedFileForPreview)?.name}
              projectId={projectId}
              publicAnonKey={publicAnonKey}
              onClose={() => {
                setShowPreviewPanel(false);
                setSelectedFileForPreview(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}