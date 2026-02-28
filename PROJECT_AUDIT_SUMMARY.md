# Florida B.E.S.T. Lesson Template System - Complete Technical Audit

**Build:** 2026-02-28T16:45:00Z-apple-orchard  
**Generated:** Saturday, February 28, 2026

---

## APP STRUCTURE

### Page Routes & Navigation Flow

**Router Type:** React Router v7 (Data Mode) with `createBrowserRouter`  
**Entry Point:** `/src/app/App.tsx` → `RouterProvider`  
**Routes Config:** `/src/app/routes.tsx`

**Active Routes:**
- `/` → Home (Landing page)
- `/auth`, `/login`, `/signin`, `/signup` → Auth (All redirect to auth flow)
- `/dashboard` → Dashboard (Main app entry post-login)
- `/lessons` → MyLessons (Lesson library with auth required)
- `/lessons/new` → SubjectLanding (New lesson wizard start - REMOVED subject selection, ELA-only)
- `/lessons/:lessonId` → LessonWorkspace (5-step workflow with deep-link protection)
- `/templates` → Templates (Template management)
- `/my-lessons` → MyLessons (Duplicate route for convenience)
- `/diagnostics` → Diagnostics (Developer diagnostics panel)
- `*` → NotFound (404 handler)

**Unused/Legacy Routes:** None (all routes actively used)

### Entry Flow Behavior

**New User Flow:**
1. Land on `/` (Home)
2. Click "Get Started" → Navigate to `/auth`
3. Sign up/in via Supabase Auth (email + password or OAuth)
4. Redirect to `/dashboard`
5. From dashboard: "New Lesson" → `/lessons/new` (ELA-only, no subject selection)
6. Creates `lesson-{timestamp}-{random}` ID → Navigate to `/lessons/{lessonId}?step=setup`

**Returning User Flow:**
1. Land on `/` (Home)
2. Auto-detect active session via `supabase.auth.getSession()`
3. If session exists: show "Continue to Dashboard"
4. Access `/lessons` → Loads lesson library via `api.meLessons()`

**Deep-Link Protection:**
- Attempting to access step 2-5 without completing step 1 (Setup) → Force redirect to `?step=setup`
- Toast notification: "Complete Lesson Setup first so the system knows what to look for."
- Enforced via `useEffect` in `lesson-workspace.tsx` (lines 291-306)

### Autosave & Snapshot Behavior

**Auto-Save System:**
- **Location:** `/src/app/routes/lesson-workspace.tsx` (lines 203-267)
- **Trigger:** Changes to `lessonSetup` or `lessonTitle`
- **Debounce:** 2000ms (2 seconds after last change)
- **Storage:** Dual persistence - localStorage + Supabase KV Store
- **Conditions:** Only saves if lesson has meaningful content (checks for sources, phonics, story, words)

**Save Flow:**
```
lessonSetup changes → debounce 2s → check hasContent 
  → if true: save to localStorage + Supabase
  → update lastSaved timestamp
  → console: "✅ Auto-save complete"
```

**Snapshot Storage Keys:**
- `lesson-setup-{lessonId}` → localStorage (immediate, per-change)
- `lesson:{lessonId}` → Supabase KV (debounced, with full backup)
- `lesson:{lessonId}:setup` → Wizard format (legacy compatibility)

**Recovery Behavior:**
- On load: Try Supabase first, fallback to localStorage
- Checks multiple key formats: `lesson:{id}:setup`, `lesson:{id}`
- Supports 3 data formats: new `_fullSetup`, wizard `formData`, flat KV structure
- Preserves `createdAt` timestamp across saves

---

## COMPONENT SYSTEM

### Primary UI Components

**Workflow Panels (5-Step Lesson Creation):**
- `LessonSetupPanel` - Step 1: Configure lesson parameters
- `LessonUploadPanel` - Step 2: Upload template + materials
- `LessonReviewPanel` - Step 3: AI extraction + approval
- `LessonBuildPanel` - Step 4: Generate slide deck
- `LessonTeachPanel` - Step 5: Present to students

**Layout Components:**
- `EditorLayout` - Main workspace frame with header, save indicator
- `PageLayout` - Standard page wrapper
- `StepNavigation` - 5-step progress indicator with click navigation

**Data Display:**
- `ExtractionPreviewPanel` - Shows AI-extracted content with search/highlight
- `CurriculumDetailsPanel` - Displays UFLI/Savvas details
- `TemplateSelectorlistview` - Template picker (supports 35 unique slide types)
- `LessonDatabaseViewer` - KV store inspector (diagnostics only)

**Utility Components:**
- `UploadArea` - Drag-drop + paste file uploader (5 categories)
- `UploadTipsBanner` - Optimization tips for uploads
- `GlobalJobStatus` - Background job progress indicator
- `NetworkStatusIndicator` - Connection quality monitor
- `BuildTimestamp` - Shows last build time

### Shared Components

**UI Kit (`/src/app/components/ui/`):**
- `Button`, `Card`, `Input`, `Label`, `Select`, `Checkbox`, `Alert`
- All styled with Apple Orchard palette tokens
- Use Tailwind v4 classes + CSS custom properties

**Error Handling:**
- `LessonsErrorBoundary` - Catches lesson route crashes
- `LessonPlayerErrorBoundary` - Wraps teach mode
- `BootGuard` - Detects and reports router boot failures

**Dialrams:**
- `SaveLessonDialog` - Lesson save confirmation
- `DeleteLessonDialog` - Deletion confirmation with undo

### Modal & Popup Systems

**No Dedicated Modal Framework** - Uses inline conditional rendering:
- Dialogs rendered via `isOpen && <Dialog>` pattern
- No global modal manager or portal system
- Toast notifications via `sonner` library

**Toast Usage:**
```tsx
toast.success('Lesson saved!')
toast.error('Complete Setup first')
toast.info('Loading...')
```

### Layout Containers

**Main Containers:**
- `EditorLayout` - Lesson workspace (60-80% main area, persistent header)
- `PageLayout` - Standard page (max-w-7xl, centered, 24px padding)
- Container pattern: `.container mx-auto px-6 py-8 max-w-6xl`

**Spacing System:**
- Generous padding: 24-32px on cards/panels
- Gap spacing: 12-16px between elements
- Follows Apple Orchard spec: 8/16/24/32/40px scale

---

## STATE & STORAGE

### Autosave Logic & Triggers

**Trigger Points:**
1. `lessonSetup` changes (any field update)
2. `lessonTitle` changes
3. Debounced 2 seconds after last change
4. Only if `!isLoadingFromDB` (prevents save loops)
5. Only if lesson has content (prevents empty state saves)

**Autosave Implementation:**
```tsx
useEffect(() => {
  const saveTimer = setTimeout(saveToDatabaseDebounced, 2000);
  return () => clearTimeout(saveTimer);
}, [lessonSetup, lessonTitle, lessonId, isLoadingFromDB, createdAt]);
```

### Snapshot Storage Behavior

**localStorage:**
- **Purpose:** Immediate, synchronous local cache
- **Keys:** `lesson-setup-{lessonId}`, `lesson-wizard-current-step`, `current-draft-lesson-id`
- **Timing:** Writes on every `lessonSetup` change (no debounce)
- **Format:** JSON stringified `LessonSetup` object

**Supabase KV Store:**
- **Purpose:** Server-side persistence, cross-device sync
- **Keys:** `lesson:{id}`, `lesson:{id}:setup`
- **Timing:** Debounced 2s writes
- **Format:** `SavedLesson` type with `_fullSetup` embedded

### Local Storage Usage

**Active Keys:**
- `lesson-setup-{lessonId}` - Full lesson configuration
- `lesson-wizard-current-step` - Current wizard step (1-5)
- `current-draft-lesson-id` - Active draft ID
- `lesson-wizard-data` - Wizard form data (legacy)

**No Expiration Logic** - Keys persist indefinitely (manual cleanup required)

### Supabase Storage Usage

**Storage Bucket:**
- Name: `make-0d810c1e-lessons`
- Type: Private (requires signed URLs)
- Size Limit: 200MB per file
- Created on server boot (idempotent)

**File Categories:**
- `powerpoint/` - PPTX templates
- `slidePictures/` - Screenshot images
- `code/` - Reference code files
- `documentation/` - PDF/text docs
- `savvasReference/` - Curriculum materials

**File Path Format:** `{lessonId}/{category}/{timestamp}-{filename}`

### Draft & Lesson Persistence Flow

**Save Flow:**
```
User edits → lessonSetup state → localStorage (instant) 
  → debounce 2s → Supabase KV (async)
  → setLastSaved(new Date())
```

**Load Flow:**
```
Navigate to /lessons/{id} → getLesson(id) from Supabase
  → if found: populate lessonSetup + localStorage
  → if not found: check localStorage
  → if neither: use getDefaultLessonSetup()
```

**Load Priority:** Supabase > localStorage > Default

---

## SERVICE & BACKGROUND PROCESSES

### Service Worker Behavior

**File:** `/public/service-worker.js`  
**Registration:** Via `service-worker-manager.ts`  
**Status:** Active, logs changed to `logger.debug()` (no user-facing warnings)

**Current Behavior:**
- Registers on app load
- No caching strategy (pass-through)
- No offline support
- No background sync
- Minimal implementation (placeholder for future features)

### Background Sync Processes

**No Active Background Sync** - Service worker does not implement sync

**Job Queue System:**
- **File:** `/src/app/utils/job-queue.ts`
- **Purpose:** Server-side async job tracking
- **Implementation:** Supabase KV-based job state
- **Status Polling:** Manual, not background

### Autosave Intervals

**Lesson Workspace:**
- **Debounce:** 2000ms (2 seconds)
- **No Polling:** Event-driven only (user edits trigger saves)

**Network Status Check:**
- **Interval:** 30 seconds
- **Purpose:** Monitor connection quality
- **Implementation:** Fetches `/favicon.svg` HEAD request, measures latency

### Recovery Mechanisms

**Auto-Recovery System:**
- **File:** `/src/app/utils/auto-recovery.ts`
- **Purpose:** Detects unsaved work, offers recovery
- **Trigger:** Page unload, navigation away from unsaved lesson
- **Status:** Implemented but not actively blocking navigation

**Lesson Recovery Tool:**
- **Component:** `LessonRecoveryTool`
- **Access:** Via diagnostics page
- **Features:** View recently deleted lessons, restore from backup

**Backup System:**
- Creates `lesson:backup:{id}:{timestamp}` before deletion
- Stores comprehensive snapshot (all related keys)
- Kept for 24 hours (manual cleanup)

---

## API & DATA FLOW

### Supabase Functions Used

**Server Base:** `https://{projectId}.supabase.co/functions/v1/make-server-0d810c1e`

**Active Endpoints:**
- `GET /health` - Server health check
- `GET /auth-test` - Auth validation
- `POST /kv/set` - Write to KV store (requires auth)
- `GET /kv/get/:key` - Read from KV store (requires auth)
- `DELETE /kv/del/:key` - Delete from KV store (requires auth)
- `GET /kv/prefix/:prefix` - Query by prefix (requires auth)
- `GET /me/lessons` - Get user's lessons (requires auth)
- `POST /files/upload` - Upload file to storage (requires auth)
- `POST /extraction/pptx` - Extract PPTX content
- `POST /extraction/webpage` - Extract webpage content
- `POST /llm/classify` - LLM lesson focus extraction

### KV Storage Usage

**Key Patterns:**
- `lesson:{id}` - Main lesson data
- `lesson:{id}:setup` - Wizard-format setup
- `lesson:backup:{id}:{timestamp}` - Deletion backups
- `lesson:draft:current` - Current draft state
- `lesson-files:{id}` - File metadata

**Operations:**
- `api.kvSet(key, value)` - Write (requires auth)
- `api.kvGet(key)` - Read (requires auth)
- `api.kvDel(key)` - Delete (requires auth)
- `api.kvGetByPrefix(prefix)` - Query (requires auth)

### Lesson Save/Retrieve Flow

**Save:**
```
saveLesson(lesson) → api.kvSet(`lesson:${id}`, lesson)
  → Server validates auth token
  → Writes to kv_store_0d810c1e table
  → Returns 200 OK
```

**Retrieve:**
```
getLesson(id) → Try api.kvGet(`lesson:${id}:setup`)
  → If 404, try api.kvGet(`lesson:${id}`)
  → Parse JSON, return SavedLesson object
  → If all fail, return null
```

**List All:**
```
getAllLessons() → api.meLessons()
  → Server queries kv_store WHERE key LIKE 'lesson:%' AND user_id = current_user
  → Filters out backups and drafts
  → Sorts by updatedAt DESC
```

### Template Loading Flow

**Templates:** Stored as static imports in `/src/app/data/templates/`  
**No Server Calls** - Templates bundled in frontend  
**Function:** `getTemplate(userId, subject)` - Returns template config object

**Template Structure:**
```tsx
{
  id: 'kindergarten-ufli-ela',
  name: 'Kindergarten ELA (UFLI-aligned)',
  subject: 'ela',
  grade: 'K',
  slideTypes: [...35 unique slide component types...]
}
```

---

## THEME & STYLE SYSTEM

### Theme Tokens in Use

**Apple Orchard Planner Palette (LOCKED):**
```css
--ao-navy: #1F2A44      /* Structure, headings */
--ao-cream: #FFF6E9     /* Background, workspace */
--ao-white: #FFFFFF     /* Cards, panels */
--ao-red: #C84C4C       /* Primary actions */
--ao-green: #6FA86B     /* Success states */
--ao-sky: #CFE3F5       /* Info tags */
--ao-pink: #F7DDE2      /* Empty states */
--ao-text: #2B2B2B      /* Body text */
--ao-muted: #6B7280     /* Secondary text */
--ao-border: #E5E5E5    /* Dividers */
--ao-tan: #D4AF37       /* Highlights (recently added) */
```

**Design System Specs:**
```css
--ao-radius-card: 16px
--ao-radius-btn: 12px
--ao-shadow: 0 8px 20px rgba(31, 42, 68, 0.08)
```

**Processing/Info State Helpers:**
```css
--processing-bg: color-mix(in srgb, var(--ao-navy) 5%, transparent)
--processing-border: color-mix(in srgb, var(--ao-navy) 20%, transparent)
--info-bg: var(--ao-sky)
--info-text: var(--ao-navy)
```

### Any Remaining Default UI Kit Styles

**FULLY MIGRATED** - All default Tailwind colors replaced with Apple Orchard tokens

**Recent Violations Fixed (Feb 28, 2026):**
- BootGuard.tsx: yellow-50/300/800/900 → ao-cream/tan/text
- upload-tips-banner.tsx: blue-50/200/600/800/900 → ao-sky/navy
- extraction-preview-panel.tsx: yellow-200, blue-500/600 → ao-tan/navy
- lesson-database-viewer.tsx: blue-600 → ao-navy
- lesson-recovery-tool.tsx: orange-600 → ao-red
- AuthDiagnostic.tsx: blue-600/700, orange-200/800 → ao-navy/cream/red
- not-found.tsx: blue-600/700 → ao-navy
- lessons-error-boundary.tsx: amber-50/orange-50/yellow-50 → ao-cream/white gradient
- upload-area.tsx: blue-500, yellow-200 → ao-sky/tan
- network-status-indicator.tsx: yellow-500 → ao-tan

**Status:** **0 violations remaining** (as of 2026-02-28)

### Color Sources & Overrides

**Primary Source:** `/src/styles/theme.css` (CSS custom properties)  
**Application:** Inline `style={{ color: 'var(--ao-navy)' }}` or Tailwind utility classes

**Tailwind Integration:**
```css
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  /* ... maps Tailwind semantic names to Apple Orchard tokens */
}
```

### Tailwind Classes Overriding Tokens

**Minimal Overrides** - Prefers inline styles for Apple Orchard colors:
```tsx
// Preferred pattern:
<div style={{ backgroundColor: 'var(--ao-cream)' }}>

// Allowed for semantic tokens:
<Button className="bg-primary text-primary-foreground">
```

**No Hardcoded Colors** - All colors reference CSS custom properties

---

## PERFORMANCE & BACKGROUND ACTIVITY

### Autosave Frequency

**Debounce:** 2 seconds  
**Max Frequency:** 1 save per 2 seconds (prevents rapid-fire saves)  
**Total Writes:** 2 per save event (localStorage instant + Supabase 2s debounced)

### Background Polling or Timers

**Active Timers:**
1. **Network Status Check** - 30s interval (connection quality)
2. **Autosave Debounce** - 2s timeout (lesson workspace only)

**No Continuous Polling** - All data fetching is event-driven (user actions, navigation)

### Re-render Triggers

**High-Frequency Triggers:**
- `lessonSetup` state changes (triggers autosave effect)
- `currentStep` changes (navigating between 5 workflow steps)
- File upload progress updates
- Job status changes (extraction, LLM processing)

**Optimizations:**
- No unnecessary re-renders (proper dependency arrays)
- LocalStorage writes are synchronous (non-blocking)
- Supabase writes are async (don't block UI)

### Potential Sources of Lag

**Identified Performance Risks:**
1. **Large PPTX Parsing** - Blocking JS thread (100+ slide decks)
2. **OCR Processing** - CPU-intensive (mitigated by Web Workers)
3. **Multiple Simultaneous File Uploads** - Network saturation
4. **LLM API Calls** - 5-10s response time (user perceives as slow)

**Mitigations:**
- Web Workers for OCR (`ocr-worker-service.ts`)
- Job queue for async processing
- Toast notifications for long-running tasks
- File size limits (200MB max per file)

---

## ACTIVE WARNINGS OR GUARDRAILS

### Recovery Systems

**Lesson Recovery Tool:**
- Access via `/diagnostics`
- Shows recently deleted lessons (24h window)
- One-click restore from backup
- Restores all related keys (`lesson:{id}`, `lesson:{id}:setup`, `lesson-files:{id}`)

**Auto-Recovery (Planned, Not Active):**
- File: `/src/app/utils/auto-recovery.ts`
- Detects unsaved work on page unload
- Currently logs warnings, does not block navigation

### Unsaved Work Detection Logic

**Current Implementation:**
- Tracks `lastSaved` timestamp
- Compares to `lessonSetup` changes
- Does NOT block navigation
- Does NOT show "unsaved changes" prompt

**Keyboard Shortcut:**
- `Ctrl/Cmd + S` - Manually trigger save (shows toast confirmation)

### Protection Prompts

**Active Protection:**
1. **Setup Completion Gate** - Cannot access steps 2-5 without completing step 1
2. **Auth Required** - All lesson operations require valid session
3. **Delete Confirmation** - Dialog before deleting lessons

**No Active Prompts:**
- No "unsaved changes" warning on navigation
- No "are you sure?" for closing browser tab

### Version Staging Behavior

**No Versioning System** - Each save overwrites previous state  
**Backup on Delete Only** - Creates timestamped backup before deletion  
**No Revision History** - Cannot revert to earlier versions

**Build Versioning:**
- Build timestamp embedded: `2026-02-28T16:45:00Z-apple-orchard`
- Cache busting via `/src/app/cache-bust.ts`

---

## CURRENT SYSTEM BEHAVIOR SUMMARY

**Architecture:** Three-tier (Frontend → Supabase Edge Functions → PostgreSQL KV Store)  
**Primary Storage:** Supabase KV Store (`kv_store_0d810c1e` table)  
**Caching:** localStorage for instant reads, Supabase for persistence  
**Auth:** Supabase Auth (email/password + OAuth), required for all lesson operations  
**File Storage:** Supabase Storage (private bucket, 200MB file limit)  
**Autosave:** 2s debounce, dual-write (localStorage + Supabase)  
**Design System:** Apple Orchard Planner (locked palette, zero color violations)  
**Workflow:** 5-step lesson creation (Setup → Upload → Review → Build → Teach)  
**Subject Focus:** ELA-only (Math support scaffolded but not active)  
**Template System:** 35 unique slide component types for Kindergarten UFLI  
**Error Handling:** Multiple error boundaries, comprehensive logging, recovery tools  
**Background Activity:** Minimal (30s network check, 2s autosave debounce only)  

---

**End of Report**
