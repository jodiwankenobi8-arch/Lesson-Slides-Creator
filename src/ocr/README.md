# OCR Pipeline - Checkpoint 3

Asynchronous, non-blocking OCR system for extracting text from images and scanned PDFs.

## Architecture

```
┌─────────────────┐
│ Upload Manager  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ Extraction      │────▶│  OCR Queue   │
│ Service         │     │  (async)     │
└─────────────────┘     └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ OCR Service  │
                        │ (worker mgr) │
                        └──────┬───────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          ┌──────────┐  ┌──────────┐  ┌──────────┐
          │  Image   │  │   PDF    │  │ Cache    │
          │  OCR     │  │   OCR    │  │ (SHA256) │
          └──────────┘  └──────────┘  └──────────┘
                 │             │             │
                 └─────────────┴─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Extraction   │
                        │ Result +     │
                        │ Chunks       │
                        └──────────────┘
```

## Key Components

### 1. OCR Queue (`ocrQueue.ts`)
- **Purpose**: Manages async OCR jobs with concurrency control
- **Default concurrency**: 1 job at a time
- **Features**:
  - Non-blocking job execution
  - Job status tracking
  - Progress updates via callbacks
  - Result caching

### 2. OCR Worker Manager (`ocrWorker.ts`)
- **Purpose**: Manages Tesseract.js worker lifecycle
- **Features**:
  - Lazy initialization (only creates worker when needed)
  - Worker reuse across jobs
  - Auto-cleanup after 30s of inactivity
  - Job count tracking

### 3. Image OCR (`imageOcr.ts`)
- **Purpose**: OCR images directly
- **Performance safeguards**:
  - Skips files < 20KB (likely decorative)
  - Downscales images to max 2000px
  - Returns confidence score

### 4. PDF OCR (`pdfOcr.ts`)
- **Purpose**: Render PDF pages to canvas and OCR each page
- **Features**:
  - Sequential page processing
  - Progress reporting per page
  - Smart scaling (max 2000px, up to 2x for quality)
  - Average confidence calculation

### 5. OCR Service (`ocrService.ts`)
- **Purpose**: Main orchestration layer
- **Features**:
  - SHA-256 based caching
  - Low confidence detection (<70%)
  - Extraction result persistence
  - File type routing

## Data Flow

### Initial Extraction
```
1. File uploaded → extractionService.ts
2. Check if needs OCR (images, scanned PDFs)
3. If yes → Queue OCR job (non-blocking)
4. Extraction completes immediately (chunks may be empty)
```

### OCR Processing
```
1. Queue picks up job based on concurrency
2. Check cache by SHA-256
3. If not cached:
   - Load Tesseract worker
   - Process file (image or PDF pages)
   - Track progress
4. Save chunks to extraction result
5. Cache result by SHA-256
```

### Confidence & Quality
```
1. Each chunk gets confidence score (0-1)
2. If confidence < 0.70:
   - Flag as lowConfidence
   - Surface in Debug View with warning
   - Requires manual review
3. If confidence >= 0.70:
   - Auto-usable in lesson generation
```

## File Status Lifecycle

```
uploaded → pending_ocr → processing → complete
                            ↓
                          error
```

## API Reference

### Queue a job
```typescript
import { ocrQueue } from './ocr/ocrQueue';

const jobId = ocrQueue.addJob(file, fileRef);
```

### Subscribe to updates
```typescript
const unsubscribe = ocrQueue.subscribe((job) => {
  console.log('Job update:', job.status, job.progress);
});
```

### Check if file needs OCR
```typescript
import { needsOcr } from './ocr/ocrService';

if (needsOcr(fileRef)) {
  // Queue OCR
}
```

## Caching Strategy

### Cache Key
- SHA-256 hash of file content
- Same file uploaded twice = instant result

### Cache Storage
- Server-side KV store
- Key: `ocr_cache:{sha256}`
- Value: OcrResult with chunks + confidence

### Cache Invalidation
- No TTL (permanent cache)
- Manual clear only (re-run extraction)

## Performance Safeguards

1. **Concurrency limit**: Default 1 job
2. **Image downscaling**: Max 2000px dimension
3. **Skip tiny files**: < 20KB ignored
4. **Worker cleanup**: Auto-terminate after 30s idle
5. **Non-blocking**: Never blocks UI or lesson generation

## Testing Checklist

- [x] Image OCR (PNG/JPG)
  - [x] Upload photo with text
  - [x] OCR runs async
  - [x] Chunks appear in Debug View
  - [x] Confidence displayed

- [x] PDF OCR
  - [x] Upload scanned PDF
  - [x] Pages OCR'd sequentially
  - [x] Progress shown in UI
  - [x] Chunks per page

- [x] Caching
  - [x] Upload same file twice
  - [x] Second upload instant (cached)
  - [x] Cache hit logged

- [x] Low Confidence
  - [x] Poor scan detected
  - [x] Warning shown in Debug View
  - [x] Not auto-filled (future: Review & Approve)

## Next Steps

After OCR is verified:
- **Checkpoint 4**: LLM Lesson Focus Extraction
- Use OCR chunks as input to LLM
- Extract lesson-specific fields (phonics, vocab, etc.)
