import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trash2, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from './ui/utils';

export interface UploadedFile {
  name: string;
  size: number;
  type?: string;
  file?: File;
  content?: string;
}

export type UploadedFiles = {
  powerpoint: UploadedFile[];
  slidePictures: UploadedFile[];
  code: UploadedFile[];
  documentation: UploadedFile[];
  savvasReference: UploadedFile[];
};

interface UploadAreaProps {
  category: keyof UploadedFiles;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  acceptedFormats: string;
  colorScheme: 'gray' | 'green' | 'amber';
  
  // State
  uploadedFiles: UploadedFiles;
  isDragActive: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  isCurrentCategory: boolean;
  
  // Handlers
  onFileSelect: (files: FileList | null) => void;
  onDeleteAll: () => void;
  onRemoveFile: (index: number) => void;
  onRetry: () => void;
  onStartOver: () => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
}

export function UploadArea({
  category,
  icon: Icon,
  title,
  description,
  acceptedFormats,
  colorScheme,
  uploadedFiles,
  isDragActive,
  isProcessing,
  progress,
  error,
  isCurrentCategory,
  onFileSelect,
  onDeleteAll,
  onRemoveFile,
  onRetry,
  onStartOver,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onPaste,
}: UploadAreaProps) {
  const colorClasses = {
    gray: {
      border: 'border-gray-200',
      iconColor: 'text-[var(--ao-navy)]',
      progressBg: 'bg-[var(--info-bg)] border-[var(--ao-sky)]',
      progressText: 'text-[var(--info-text)]',
      progressBar: 'bg-[var(--ao-sky)]/20',
      progressIcon: 'text-[var(--info-text)]',
      dragBorder: 'border-[var(--ao-navy)] bg-[var(--processing-bg)]',
      normalBorder: 'border-gray-300 hover:border-gray-400',
      iconLight: 'text-gray-400',
      fileBg: 'bg-gray-50',
      fileIcon: 'text-[var(--ao-navy)]',
    },
    green: {
      border: 'border-green-200',
      iconColor: 'text-green-600',
      progressBg: 'bg-green-50 border-green-200',
      progressText: 'text-green-900',
      progressBar: 'bg-green-100',
      progressIcon: 'text-green-600',
      dragBorder: 'border-green-500 bg-green-50',
      normalBorder: 'border-green-300 hover:border-green-400',
      iconLight: 'text-green-400',
      fileBg: 'bg-green-50',
      fileIcon: 'text-green-600',
    },
    amber: {
      border: '',
      iconColor: '',
      progressBg: '',
      progressText: '',
      progressBar: '',
      progressIcon: '',
      dragBorder: '',
      normalBorder: '',
      iconLight: '',
      fileBg: '',
      fileIcon: '',
    },
  };

  const colors = colorClasses[colorScheme];
  const inputId = `${category}-upload-input`;
  const files = uploadedFiles[category];

  // Custom styles for amber theme (using Apple Orchard tokens)
  const getAmberStyles = () => {
    if (colorScheme !== 'amber') return {};
    return {
      '--custom-border': 'var(--ao-tan)',
      '--custom-icon': 'var(--ao-text)',
      '--custom-progress-bg': 'var(--ao-cream)',
      '--custom-progress-text': 'var(--ao-text)',
      '--custom-drag-border': 'var(--ao-tan)',
      '--custom-drag-bg': 'var(--ao-cream)',
    } as React.CSSProperties;
  };

  return (
    <div className={`bg-white border-2 rounded-lg p-4`} 
         style={colorScheme === 'amber' ? { borderColor: 'var(--ao-tan)' } : {}}
         {...(colorScheme !== 'amber' && { className: `bg-white border-2 ${colors.border} rounded-lg p-4` })}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Icon className={`size-5 ${colors.iconColor}`} />
          {title}
          {files.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {files.length}
            </Badge>
          )}
        </h3>
        {files.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteAll}
            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="size-3 mr-1" />
            Delete All
          </Button>
        )}
      </div>

      {/* Upload Progress Indicator */}
      {isProcessing && isCurrentCategory && progress > 0 && progress < 100 && (
        <div className={`mb-4 ${colors.progressBg} border rounded-lg p-4 space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className={`size-4 ${colors.progressIcon} animate-spin`} />
              <span className={`text-sm font-medium ${colors.progressText}`}>
                Uploading and processing files...
              </span>
            </div>
            <span className={`text-sm font-semibold ${colors.progressIcon}`}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className={`h-2.5 ${colors.progressBar}`} />
          <p className={`text-xs ${colors.progressIcon}`}>
            Processing each file individually for best results
          </p>
        </div>
      )}

      {/* Error State with Retry/Start Over Buttons */}
      {error && isCurrentCategory && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">
                Upload Failed
              </p>
              <p className="text-xs text-gray-600 mb-3">
                {error}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="size-3 mr-1" />
                  Try Again
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartOver}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-3 mr-1" />
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Area - Consistent Styling */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
          isDragActive
            ? `${colors.dragBorder} scale-105`
            : `${colors.normalBorder} bg-white`,
          "focus:outline-none focus:ring-2 focus:border"
        )}
        style={{
          '--tw-ring-color': 'var(--ao-sky)',
          '--tw-border-color': 'var(--ao-sky)'
        } as any}
        onClick={() => document.getElementById(inputId)?.click()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={onPaste}
        tabIndex={0}
        role="button"
        aria-label={`Upload ${title}`}
      >
        <Icon className={`size-10 mx-auto mb-3 ${colors.iconLight}`} />
        <p className="font-medium text-gray-900 mb-1">
          {isDragActive ? '📥 Drop files here!' : 'Click, drag, or paste (Ctrl+V)'}
        </p>
        <p className="text-sm text-gray-600 mb-1">{description}</p>
        <p className="text-xs text-gray-500">{acceptedFormats}</p>
        {category === 'slidePictures' && (
          <p className="text-xs mt-2" style={{ color: 'var(--ao-sky)' }}>💡 Click this area first, then paste</p>
        )}
        <input
          id={inputId}
          type="file"
          accept={acceptedFormats}
          multiple
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files)}
        />
      </div>

      {/* Display uploaded files - Consistent Styling */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
          {files.map((file, index) => (
            <div key={index} className={`flex items-center justify-between ${colors.fileBg} rounded px-3 py-2`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CheckCircle className={`size-4 ${colors.fileIcon} flex-shrink-0`} />
                <span className="text-sm text-gray-900 truncate">{file.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(index)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}