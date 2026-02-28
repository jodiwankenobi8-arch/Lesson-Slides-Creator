/**
 * Central API Client
 * 
 * ✅ Prevents future direct fetch bugs
 * ✅ All Edge Function calls go through here
 * ✅ RUNTIME ENFORCEMENT: Direct fetch() to Edge Functions is blocked
 * 
 * Usage:
 * ```typescript
 * const res = await api.meJobs();
 * const data = await api.getJSON(res);
 * ```
 */

import { hybridAuthFetch } from './hybridAuthFetch';
import { projectId, publicAnonKey } from './supabase/info';

// ✅ RUNTIME GUARD: Block direct fetch() to Edge Functions
// RE-ENABLED AFTER MIGRATION COMPLETE - 100% coverage achieved
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
    const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].toString() : args[0]?.url || '';
    if (url.includes('/functions/v1/') || url.includes('make-server')) {
      // Check if this is called from hybridAuthFetch (allowed)
      const stack = new Error().stack || '';
      const isFromHybridAuth = stack.includes('hybridAuthFetch');
      
      if (!isFromHybridAuth) {
        console.error('❌ BLOCKED: Direct fetch() to Edge Functions is not allowed. Use api.ts instead.');
        console.error('URL attempted:', url);
        console.error('Stack trace:', stack);
        throw new Error(`POLICY VIOLATION: Direct fetch() to Edge Functions forbidden. Use api.ts methods instead. URL: ${url}`);
      }
    }
    return originalFetch.apply(this, args);
  };
}

function baseFunctionUrl() {
  return `https://${projectId}.supabase.co/functions/v1`;
}

// ✅ IMPORTANT: set this to your function name once (the one in your URLs)
export const FUNCTION_NAME = 'make-server-0d810c1e';

function fn(path: string) {
  return `${baseFunctionUrl()}/${FUNCTION_NAME}${path.startsWith('/') ? path : `/${path}`}`;
}

export const api = {
  // ---- user-data ----
  meJobs: () => hybridAuthFetch(fn('/user-data/jobs/me')),
  meFiles: () => hybridAuthFetch(fn('/user-data/files/me')),
  meLessons: () => hybridAuthFetch(fn('/user-data/lessons/me')),

  // ---- jobs ----
  retryJob: (jobId: string) => 
    hybridAuthFetch(fn(`/jobs/${jobId}/retry`), { method: 'POST' }),
  cancelJob: (jobId: string) => 
    hybridAuthFetch(fn(`/jobs/${jobId}/cancel`), { method: 'POST' }),
  getJob: (jobId: string) =>
    hybridAuthFetch(fn(`/jobs/${jobId}`)),
  getLessonJobs: (lessonId: string) =>
    hybridAuthFetch(fn(`/jobs/lesson/${lessonId}`)),
  createJob: (payload: any) =>
    hybridAuthFetch(fn('/jobs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // ---- files ----
  uploadLessonFile: (body: FormData) =>
    hybridAuthFetch(fn('/files/lesson/upload'), { method: 'POST', body }),

  deleteFile: (fileId: string) =>
    hybridAuthFetch(fn(`/files/${fileId}`), { method: 'DELETE' }),
  
  getLessonFiles: (lessonId: string) =>
    hybridAuthFetch(fn(`/files/lesson/${lessonId}`)),
  
  saveFileMetadata: (payload: any) =>
    hybridAuthFetch(fn('/files'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  
  getExtractionFile: (fileId: string) =>
    hybridAuthFetch(fn(`/extraction/file/${fileId}`)),

  // ---- storage ----
  storageDelete: (storagePath: string) =>
    hybridAuthFetch(fn('/storage/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    }),

  // ---- template files ----
  saveTemplateFile: (payload: any) =>
    hybridAuthFetch(fn('/template-files'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  
  getTemplateFiles: (userId: string, subject: string) =>
    hybridAuthFetch(fn(`/template-files/${userId}/${subject}`)),
  
  deleteTemplateFile: (fileId: string) =>
    hybridAuthFetch(fn(`/template-files/${fileId}`), { method: 'DELETE' }),

  // ---- lessons ----
  saveLesson: (payload: any) =>
    hybridAuthFetch(fn('/lessons/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  loadLesson: (lessonId: string) =>
    hybridAuthFetch(fn(`/lessons/${lessonId}`)),

  deleteLesson: (lessonId: string) =>
    hybridAuthFetch(fn(`/files/lesson/${lessonId}`), { method: 'DELETE' }),

  // ---- templates ----
  createTemplate: (payload: any) =>
    hybridAuthFetch(fn('/templates/create'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // ---- extraction ----
  extractText: (body: FormData) =>
    hybridAuthFetch(fn('/extract-text'), { method: 'POST', body }),

  extractionChunk: (payload: { lessonId: string; chunkIndex: number; text: string }) =>
    hybridAuthFetch(fn('/extraction/chunk'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  analyzeFocus: (payload: { extractedText: string }) =>
    hybridAuthFetch(fn('/analyze-focus'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // ---- LLM / Analysis ----
  getAnalysis: (lessonId: string) =>
    hybridAuthFetch(fn(`/llm/analysis/${lessonId}`)),

  analyzeLesson: (payload: any) =>
    hybridAuthFetch(fn('/llm/analyze-lesson'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  overrideFocus: (payload: any) =>
    hybridAuthFetch(fn('/llm/override-focus'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  overrideContent: (payload: any) =>
    hybridAuthFetch(fn('/llm/override-content'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // ---- KV operations ----
  kvSet: (key: string, value: any) =>
    hybridAuthFetch(fn('/kv/set'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }),

  kvGet: (key: string) =>
    hybridAuthFetch(fn('/kv/get'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }),

  kvDel: (key: string) =>
    hybridAuthFetch(fn('/kv/delete'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }),

  kvDelete: (key: string) =>
    hybridAuthFetch(fn('/kv/delete'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }),

  kvGetByPrefix: (prefix: string) =>
    hybridAuthFetch(fn('/kv/getByPrefix'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix }),
    }),

  kvCleanup: (keys: string[]) =>
    hybridAuthFetch(fn('/kv/cleanup'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    }),

  // ---- Webpage extraction ----
  webpageExtract: (payload: { url: string }) =>
    hybridAuthFetch(fn('/webpage/extract'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // ---- Debug / Admin ----
  debugAllKeys: () =>
    hybridAuthFetch(fn('/user-data/debug/all-keys')),

  debugLessonPrefixes: () =>
    hybridAuthFetch(fn('/user-data/debug/lesson-prefixes')),

  // ---- Health check ----
  healthCheck: () =>
    hybridAuthFetch(fn('/health')),

  // ---- Auth test ----
  authTest: () =>
    hybridAuthFetch(fn('/auth-test')),

  // ---- Admin ----
  adminCheck: () =>
    hybridAuthFetch(fn('/admin/check')),

  // ---- generic helpers ----
  getJSON: async <T>(res: Response): Promise<T> => {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `${res.status} ${res.statusText}`);
    }
    return text ? (JSON.parse(text) as T) : ({} as T);
  },
};