/**
 * Background Job Queue System
 * 
 * Manages OCR and extraction jobs that run independently of React component lifecycle.
 * Jobs persist in Supabase and continue processing even when user navigates away.
 */

import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export type JobType = 'extract_pptx' | 'extract_pdf' | 'ocr_image' | 'ocr_pdf';
export type JobStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface Job {
  jobId: string;
  lessonId: string;
  fileId: string;
  fileName: string;
  type: JobType;
  status: JobStatus;
  progress: number; // 0-1
  currentPage?: number;
  totalPages?: number;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
  resultRef?: string; // Reference to where chunks are stored
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e`;

/**
 * Creates a new background job
 */
export async function createJob(job: Omit<Job, 'jobId' | 'status' | 'progress'>): Promise<Job> {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(job),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create job: ${error}`);
  }

  return response.json();
}

/**
 * Gets a job by ID
 */
export async function getJob(jobId: string): Promise<Job | null> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get job: ${error}`);
  }

  return response.json();
}

/**
 * Updates a job's status and progress
 */
export async function updateJob(
  jobId: string,
  updates: Partial<Omit<Job, 'jobId' | 'lessonId' | 'fileId' | 'type'>>
): Promise<Job> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update job: ${error}`);
  }

  return response.json();
}

/**
 * Gets all jobs for a lesson
 */
export async function getLessonJobs(lessonId: string): Promise<Job[]> {
  const response = await fetch(`${API_BASE}/jobs/lesson/${lessonId}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get lesson jobs: ${error}`);
  }

  return response.json();
}

/**
 * Gets all active (pending or processing) jobs
 */
export async function getActiveJobs(): Promise<Job[]> {
  const response = await fetch(`${API_BASE}/jobs?status=active`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get active jobs: ${error}`);
  }

  return response.json();
}

/**
 * Retries a failed or stuck job by resetting its status to pending
 */
export async function retryJob(jobId: string): Promise<Job> {
  return updateJob(jobId, {
    status: 'pending',
    progress: 0,
    errorMessage: undefined,
    startedAt: undefined,
    finishedAt: undefined,
  });
}