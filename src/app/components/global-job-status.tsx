/**
 * Global Job Status Banner
 * 
 * Displays background job progress across all screens.
 * Shows "Processing X files..." with real-time status updates.
 */

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from './ui/utils';
import { Z_INDEX } from '../utils/z-index-scale';

interface GlobalJobStatusProps {
  lessonId?: string;
  onViewDetails?: () => void;
}

export function GlobalJobStatus({ lessonId, onViewDetails }: GlobalJobStatusProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');

  // Poll for job updates
  useEffect(() => {
    async function fetchJobs() {
      try {
        const activeJobs = lessonId 
          ? await getLessonJobs(lessonId)
          : await getActiveJobs();
        
        // ONLY show error jobs - processing status is shown in file list
        const erroredJobs = activeJobs.filter(j => j.status === 'error');
        
        setJobs(erroredJobs);
      } catch (error) {
        // Silently handle fetch errors - the component will retry on next poll
        // Only log in development to avoid console spam
        if (import.meta.env.DEV) {
          console.debug('Job fetch failed (will retry):', error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();

    // Only poll if there are active jobs - check every 5 seconds
    const interval = setInterval(() => {
      if (jobs.length > 0 && jobs.some(j => j.status === 'processing')) {
        fetchJobs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lessonId, jobs.length]);

  // Don't show banner if no error jobs
  if (jobs.length === 0 && !isLoading) {
    return null;
  }

  const totalJobs = jobs.length;
  const processingJobs = jobs.filter(j => j.status === 'processing').length;
  const errorJobs = jobs.filter(j => j.status === 'error').length;
  const averageProgress = jobs.reduce((sum, j) => sum + j.progress, 0) / totalJobs;

  return (
    <div className={`fixed bottom-4 right-4 ${Z_INDEX.TOAST} max-w-md`}>
      <Card className={cn(
        "shadow-lg",
        status === 'success' && "border-green-500",
        status === 'error' && "border-red-500"
      )}>
        {/* Collapsed view */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full p-4 flex items-center gap-3 text-left transition-colors",
            errorJobs > 0 ? "hover:bg-red-100" : "hover:bg-blue-100"
          )}
        >
          <div className="flex-shrink-0">
            {errorJobs > 0 ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--processing-border)' }} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={cn(
              "font-medium",
              errorJobs > 0 ? "text-red-900" : ""
            )} style={errorJobs > 0 ? {} : { color: 'var(--processing-text)' }}>
              {errorJobs > 0 ? (
                `${errorJobs} ${errorJobs === 1 ? 'job' : 'jobs'} failed`
              ) : (
                `Processing ${totalJobs} ${totalJobs === 1 ? 'file' : 'files'}...`
              )}
            </div>
            <div className={cn(
              "text-sm",
              errorJobs > 0 ? "text-red-700" : ""
            )} style={errorJobs > 0 ? {} : { color: 'var(--processing-text)' }}>
              {errorJobs > 0 ? 'Click to retry' : `${Math.round(averageProgress * 100)}% complete`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className={cn(
                  errorJobs > 0 
                    ? "text-red-700 hover:text-red-900 hover:bg-red-200" 
                    : ""
                )}
                style={errorJobs > 0 ? {} : { color: 'var(--processing-text)' }}
              >
                View Details
              </Button>
            )}
            {isExpanded ? (
              <ChevronDown className={cn(
                "h-4 w-4",
                errorJobs > 0 ? "text-red-600" : ""
              )} style={errorJobs > 0 ? {} : { color: 'var(--processing-border)' }} />
            ) : (
              <ChevronUp className={cn(
                "h-4 w-4",
                errorJobs > 0 ? "text-red-600" : ""
              )} style={errorJobs > 0 ? {} : { color: 'var(--processing-border)' }} />
            )}
          </div>
        </button>

        {/* Expanded view */}
        {isExpanded && (
          <div className={cn(
            "p-4 space-y-3 max-h-96 overflow-y-auto",
            errorJobs > 0 ? "border-t border-red-200" : "border-t"
          )} style={errorJobs > 0 ? {} : { borderColor: 'var(--processing-border)' }}>
            {jobs.map((job) => (
              <div key={job.jobId} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {job.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--processing-border)' }} />
                  ) : job.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : job.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--ao-green)' }} />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--processing-text)' }}>
                    {job.fileName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--processing-text)' }}>
                    {job.type === 'ocr_image' && 'OCR: Image'}
                    {job.type === 'ocr_pdf' && `OCR: PDF ${job.currentPage ? `(${job.currentPage}/${job.totalPages})` : ''}`}
                    {job.type === 'extract_pptx' && 'Extracting PPTX'}
                    {job.type === 'extract_pdf' && 'Extracting PDF'}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--processing-bg)' }}>
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        job.status === 'error' ? "bg-red-500" : ""
                      )}
                      style={job.status === 'error' ? {} : { backgroundColor: 'var(--processing-border)', width: `${job.progress * 100}%` }}
                    />
                  </div>

                  {job.errorMessage && (
                    <div className="mt-1 text-xs text-red-600">
                      Error: {job.errorMessage}
                    </div>
                  )}
                </div>

                <div className="text-xs font-medium" style={{ color: 'var(--processing-text)' }}>
                  {Math.round(job.progress * 100)}%
                </div>

                {job.status === 'error' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await retryJob(job.jobId);
                        toast.success('Job retried successfully');
                      } catch (error) {
                        toast.error('Failed to retry job');
                      }
                    }}
                    style={{ color: 'var(--processing-text)' }}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}