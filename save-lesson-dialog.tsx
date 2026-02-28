import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  saveLesson,
  generateLessonId,
  type SavedLesson,
} from '../utils/supabase-lessons';
import { uploadFiles } from '../../utils/storage-client'; // Use new adapter
import { KindergartenLessonData } from '../types/lesson-types';
import type { PPTXAnalysis } from '../utils/pptx-parser';
import type { AnalyzedReference } from '../utils/reference-analyzer';

interface SaveLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonData: KindergartenLessonData;
  metadata?: {
    ufliUploadMethod?: 'powerpoint' | 'screenshots';
    ufliScreenshotCount?: number;
    uploadAnalysis?: string;
    pptxAnalysis?: PPTXAnalysis;
    comprehensiveAnalysis?: AnalyzedReference;
    extractedStoryText?: string;
    uploadedPPTXFiles?: string[];
  };
  fileObjectsMap?: Map<string, File>;
  existingLessonId?: string | null;
  existingCreatedAt?: string;
  onSaveComplete?: () => void; // Callback when save is successful
}

export function SaveLessonDialog({
  open,
  onOpenChange,
  lessonData,
  metadata,
  fileObjectsMap,
  existingLessonId,
  existingCreatedAt,
  onSaveComplete,
}: SaveLessonDialogProps) {
  const [lessonName, setLessonName] = useState(() => {
    // Generate a default name
    const date = lessonData.date ? new Date(lessonData.date).toLocaleDateString() : 'Undated';
    return `${lessonData.subject} - UFLI ${lessonData.ufliLessonNumber} Day ${lessonData.dayNumber} - ${date}`;
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);

      const lessonId = existingLessonId || generateLessonId();
      
      // Upload files to storage if we have them
      const uploadedFilesMetadata: SavedLesson['metadata']['uploadedFiles'] = {
        powerpoint: [],
        slidePictures: [],
        code: [],
        documentation: [],
        savvasReference: [],
      };

      if (fileObjectsMap && fileObjectsMap.size > 0) {
        // Group files by category
        const categorizedFiles: { file: File; category: string }[] = [];
        
        fileObjectsMap.forEach((file, key) => {
          // Determine category from file metadata or key
          let category = 'materials'; // default category
          
          if (key.includes('powerpoint') || file.name.includes('.pptx')) {
            category = 'powerpoint';
          } else if (key.includes('screenshot') || key.includes('book-page')) {
            category = 'screenshots';
          } else if (key.includes('code')) {
            category = 'code';
          } else if (key.includes('documentation') || key.includes('savvas')) {
            category = 'documentation';
          }
          
          categorizedFiles.push({ file, category });
        });
        
        // Upload all files using the unified adapter
        const allFiles = categorizedFiles.map(cf => cf.file);
        const uploadResults = await uploadFiles(allFiles, lessonId, 'materials');
        
        // Process results and build metadata
        uploadResults.forEach((result, index) => {
          if (result.success && result.storagePath) {
            const { file, category } = categorizedFiles[index];
            const metadata = {
              name: file.name,
              size: file.size,
              type: file.type,
              storagePath: result.storagePath,
            };
            
            if (category === 'powerpoint') {
              uploadedFilesMetadata.powerpoint.push(metadata);
            } else if (category === 'screenshots') {
              uploadedFilesMetadata.slidePictures.push(metadata);
            } else if (category === 'code') {
              uploadedFilesMetadata.code.push(metadata);
            } else if (category === 'documentation') {
              uploadedFilesMetadata.documentation.push(metadata);
            }
          } else {
            console.error('Upload failed:', categorizedFiles[index].file.name, result.error);
          }
        });
      }

      // Save lesson data
      const savedLesson: SavedLesson = {
        id: lessonId,
        name: lessonName,
        data: lessonData,
        createdAt: existingLessonId ? existingCreatedAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          uploadedFiles: uploadedFilesMetadata,
        },
      };

      // Remove undefined createdAt if updating existing lesson
      if (existingLessonId && !savedLesson.createdAt) {
        savedLesson.createdAt = new Date().toISOString(); // Fallback
      }

      await saveLesson(savedLesson);

      toast.success('Lesson saved successfully!');
      
      // Clear wizard state from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lesson-wizard-current-step');
        localStorage.removeItem('lesson-wizard-data');
        localStorage.removeItem('current-draft-lesson-id');
        localStorage.removeItem('lesson-setup-data');
        console.log('🧹 Cleared wizard state from localStorage');
      }
      
      // Call onSaveComplete callback if provided
      if (onSaveComplete) {
        onSaveComplete();
      }
      
      onOpenChange(false);
      
      // Redirect to my lessons after a short delay
      setTimeout(() => {
        window.location.href = '/my-lessons';
      }, 1000);
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Lesson</DialogTitle>
          <DialogDescription>
            Give your lesson a name to save it to your library.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-name">Lesson Name</Label>
            <Input
              id="lesson-name"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="e.g., Week 1 Day 1 - Letter A"
            />
          </div>
          
          <div className="bg-sky-50 rounded-lg p-4 text-sm space-y-1">
            <div className="font-semibold text-sky-900 mb-2">Lesson Details:</div>
            <div className="text-sky-800">
              <span className="font-medium">Subject:</span> {lessonData.subject}
            </div>
            <div className="text-sky-800">
              <span className="font-medium">UFLI:</span> Lesson {lessonData.ufliLessonNumber}, Day {lessonData.dayNumber}
            </div>
            {lessonData.phonicsConcept && (
              <div className="text-sky-800">
                <span className="font-medium">Phonics:</span> {lessonData.phonicsConcept}
              </div>
            )}
            {lessonData.storyTitle && (
              <div className="text-sky-800">
                <span className="font-medium">Story:</span> {lessonData.storyTitle}
              </div>
            )}
            {lessonData.savvasUnit && (
              <div className="text-sky-800">
                <span className="font-medium">Savvas:</span> Unit {lessonData.savvasUnit}, Week {lessonData.savvasWeek}, Day {lessonData.savvasDay}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !lessonName.trim()}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Save Lesson
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}