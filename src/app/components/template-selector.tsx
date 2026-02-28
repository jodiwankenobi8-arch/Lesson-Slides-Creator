/**
 * Template Selector Component
 * 
 * Shows current template status and allows:
 * - Using different template (one-time)
 * - Managing template (replace/remove default)
 * 
 * KEY UX RULES:
 * - Default action is "Use for this lesson only" (prevent accidental replacement)
 * - Show non-destructive actions first (Use Different / Manage)
 * - Clear visual distinction between default and one-time templates
 */

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { FileText, Upload, Settings, Trash2, Check, AlertCircle } from 'lucide-react';
import { cn } from './ui/utils';
import { toast } from 'sonner';
import {
  TemplateMetadata,
  TemplateUploadMode,
  formatFileSize,
  formatUploadDate,
} from '../types/template-types';
import { uploadTemplate, deleteTemplate } from '../../utils/template-manager';
import { Subject } from '../types/lesson-setup-types';

interface TemplateSelectorProps {
  userId: string;
  subject: Subject;
  currentTemplate: TemplateMetadata | null;
  isDefault: boolean;
  onTemplateChange: (template: TemplateMetadata | null, isDefault: boolean) => void;
}

export function TemplateSelector({
  userId,
  subject,
  currentTemplate,
  isDefault,
  onTemplateChange,
}: TemplateSelectorProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [uploadMode, setUploadMode] = useState<TemplateUploadMode>('use-once');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pptx')) {
        toast.error('Please select a PowerPoint file (.pptx)');
        return;
      }
      setSelectedFile(file);
      setShowUploadDialog(true);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedBytes(0);

    // Simulate upload progress
    const totalSize = selectedFile.size;
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(prev + Math.random() * 15, 99);
        setUploadedBytes(Math.floor((next / 100) * totalSize));
        return next;
      });
    }, 200);

    try {
      if (uploadMode === 'set-as-default') {
        // Upload as default template
        const result = await uploadTemplate(selectedFile, userId, subject);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadedBytes(totalSize);
        
        // Show completion for a moment
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (result.success && result.metadata) {
          toast.success('Default template updated!');
          onTemplateChange(result.metadata, true);
        } else {
          toast.error(result.error || 'Failed to upload template');
        }
      } else {
        // Use for this lesson only (don't save as default)
        // Simulate a quick upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadedBytes(totalSize);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        toast.success(`Using ${selectedFile.name} for this lesson only`);
        
        // Create temporary metadata (not saved to database)
        const tempMetadata: TemplateMetadata = {
          subject,
          fileName: selectedFile.name,
          size: selectedFile.size,
          storagePath: '', // Not saved to storage
          uploadedAt: new Date().toISOString(),
          userId,
        };
        
        onTemplateChange(tempMetadata, false);
      }

      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadMode('use-once');
      setUploadProgress(0);
      setUploadedBytes(0);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      toast.error('Failed to upload template');
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!currentTemplate) return;

    setIsDeleting(true);

    try {
      const result = await deleteTemplate(userId, subject);
      
      if (result.success) {
        toast.success('Template removed');
        onTemplateChange(null, false);
        setShowManageDialog(false);
      } else {
        toast.error(result.error || 'Failed to remove template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove template');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={cn(
        "border-2",
        currentTemplate
          ? isDefault
            ? "border-green-200 bg-green-50/50 dark:bg-green-950/20"
            : "border border"
          : "border-border"
      )}
      style={currentTemplate && !isDefault ? { borderColor: 'var(--ao-tan)', backgroundColor: 'var(--ao-cream)' } : {}}
    >
        <CardContent className="pt-6">
          {currentTemplate ? (
            // Template loaded
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded",
                  isDefault ? "bg-green-100 dark:bg-green-900" : ""
                )}
                style={!isDefault ? { backgroundColor: 'var(--ao-tan)' } : {}}
                >
                  <FileText className={cn(
                    "w-5 h-5",
                    isDefault ? "text-green-700 dark:text-green-300" : ""
                  )} 
                  style={!isDefault ? { color: 'var(--ao-text)' } : {}}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isDefault && <Check className="w-4 h-4 text-green-600" />}
                    <h3 className={cn(
                      "font-semibold",
                      isDefault ? "text-green-900 dark:text-green-100" : ""
                    )}
                    style={!isDefault ? { color: 'var(--ao-text)' } : {}}
                    >
                      {isDefault ? 'Default ELA template loaded' : 'Custom template for this lesson'}
                    </h3>
                  </div>
                  
                  {/* Template Info */}
                  <div className="mt-2 space-y-1">
                    <div className="text-sm font-medium">{currentTemplate.fileName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(currentTemplate.size)} • Uploaded {formatUploadDate(currentTemplate.uploadedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <label htmlFor="template-upload-replace" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('template-upload-replace')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Use Different Template
                  </Button>
                </label>
                
                {isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManageDialog(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // No template
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-muted">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold">No default template</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your master ELA slide deck once, and it will auto-load for every new lesson.
                  </p>
                </div>
              </div>

              <label htmlFor="template-upload-new" className="block">
                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  onClick={() => document.getElementById('template-upload-new')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ELA Template
                </Button>
              </label>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            id="template-upload-new"
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            id="template-upload-replace"
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        if (!isUploading) {
          setShowUploadDialog(open);
          if (!open) {
            setSelectedFile(null);
            setUploadMode('use-once');
            setUploadProgress(0);
            setUploadedBytes(0);
          }
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isUploading ? 'Uploading Template' : 'Upload Template'}
            </DialogTitle>
            <DialogDescription>
              {isUploading ? 'Please wait while we upload your file' : 'Choose how to use this template'}
            </DialogDescription>
          </DialogHeader>

          {!isUploading && selectedFile && (
            <div className="space-y-4">
              {/* File info */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </div>
              </div>

              {/* Upload mode selection */}
              <RadioGroup value={uploadMode} onValueChange={(value) => setUploadMode(value as TemplateUploadMode)}>
                <div className="space-y-3">
                  {/* Use once (DEFAULT) */}
                  <label
                    className={cn(
                      "flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors",
                      uploadMode === 'use-once'
                        ? "bg-primary/5 border-primary"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <RadioGroupItem value="use-once" id="mode-use-once" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">Use for this lesson only</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Won't affect your default template
                      </div>
                    </div>
                  </label>

                  {/* Set as default */}
                  <label
                    className={cn(
                      "flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors",
                      uploadMode === 'set-as-default'
                        ? "bg-primary/5 border-primary"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <RadioGroupItem value="set-as-default" id="mode-set-default" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">Replace default template</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Auto-load for all future lessons
                      </div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Upload Progress View */}
          {isUploading && selectedFile && (
            <div className="space-y-4 py-4">
              {/* Header with completion badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Uploaded Files (1)</h3>
                <div className="text-sm font-medium px-3 py-1 rounded" style={{ color: 'var(--processing-text)', backgroundColor: 'var(--processing-bg)' }}>
                  {uploadProgress === 100 ? '1' : '0'} of 1 Complete • {Math.round(uploadProgress)}%
                </div>
              </div>

              {/* Status summary */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  {uploadProgress < 100 ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--processing-border)', borderTopColor: 'transparent' }} />
                      <span>1 uploading</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Upload complete</span>
                    </>
                  )}
                </div>
                <span>{Math.round(uploadProgress)}% complete</span>
              </div>

              {/* File upload card */}
              <div className="border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-start gap-3">
                  {/* Spinner icon */}
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mt-1" style={{ borderColor: 'var(--processing-border)', borderTopColor: 'transparent' }} />
                  
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{selectedFile.name}</div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: 'var(--processing-bg)', color: 'var(--processing-text)' }}>
                        Uploading
                      </span>
                      <span className="text-muted-foreground">
                        {formatFileSize(uploadedBytes)} / {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  </div>

                  {/* Cancel button */}
                  <button
                    type="button"
                    onClick={() => {
                      // Cancel upload logic would go here
                      setIsUploading(false);
                      setShowUploadDialog(false);
                      setSelectedFile(null);
                      setUploadProgress(0);
                      setUploadedBytes(0);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%`, backgroundColor: 'var(--processing-border)' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading to cloud...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isUploading && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setSelectedFile(null);
                  setUploadMode('use-once');
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Template</DialogTitle>
            <DialogDescription>
              Update or remove your default ELA template
            </DialogDescription>
          </DialogHeader>

          {currentTemplate && (
            <div className="space-y-4">
              {/* Current template info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{currentTemplate.fileName}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatFileSize(currentTemplate.size)} • Uploaded {formatUploadDate(currentTemplate.uploadedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <label htmlFor="template-upload-manage" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowManageDialog(false);
                      document.getElementById('template-upload-replace')?.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Replace Template
                  </Button>
                </label>

                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Removing...' : 'Remove Template'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowManageDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}