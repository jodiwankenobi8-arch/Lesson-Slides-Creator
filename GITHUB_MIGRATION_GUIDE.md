# GitHub Migration Guide - Lesson Template System

Complete guide to migrate this Figma Make project to GitHub with Codespaces support.

---

## EXECUTIVE SUMMARY

**What you have:** 250+ files already created in Figma Make
**What you need:** Add 6 config files + push to GitHub
**End result:** Fully functional GitHub repo that runs in Codespaces

---

## PART 1: COMPLETE FILE TREE

```
lesson-template-system/
├── .devcontainer/
│   └── devcontainer.json                    [CREATE - see below]
├── .github/
│   └── workflows/
│       └── ci.yml                           [CREATE - see below]
├── e2e/
│   ├── lesson-build.spec.ts                 [EXISTS ✓]
│   ├── lesson-create.spec.ts                [EXISTS ✓]
│   └── security.spec.ts                     [EXISTS ✓]
├── public/
│   ├── diagnostic.html                      [EXISTS ✓]
│   └── service-worker.js                    [EXISTS ✓]
├── src/
│   ├── app/
│   │   ├── components/                      [70+ files - ALL EXIST ✓]
│   │   │   ├── figma/
│   │   │   │   └── ImageWithFallback.tsx
│   │   │   ├── icons/
│   │   │   │   └── apple-icon.tsx
│   │   │   ├── patterns/
│   │   │   │   ├── gingham-pattern.tsx
│   │   │   │   └── polka-dot-pattern.tsx
│   │   │   ├── slide-components/
│   │   │   │   ├── CelebrationSlide.tsx
│   │   │   │   ├── ICanStatementsSlide.tsx
│   │   │   │   ├── SightWordSlide.tsx
│   │   │   │   ├── SlideLayout.tsx
│   │   │   │   ├── StoryPageSlide.tsx
│   │   │   │   ├── Timer.tsx
│   │   │   │   ├── UFLISlideLayout.tsx
│   │   │   │   ├── UFLITitleSlide.tsx
│   │   │   │   ├── VideoSlide.tsx
│   │   │   │   ├── WelcomeSlide.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ui/                          [40+ shadcn components]
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── [35+ more UI components]
│   │   │   ├── AuthDiagnostic.tsx
│   │   │   ├── BootGuard.tsx
│   │   │   ├── FileCenter.tsx
│   │   │   ├── lesson-wizard.tsx
│   │   │   ├── review-approve.tsx
│   │   │   └── [50+ more components]
│   │   ├── config/
│   │   │   └── debug.ts                     [EXISTS ✓]
│   │   ├── data/
│   │   │   ├── kindergarten-template.ts     [EXISTS ✓]
│   │   │   └── templates.ts                 [EXISTS ✓]
│   │   ├── hooks/
│   │   │   ├── use-keyboard-shortcuts.ts    [EXISTS ✓]
│   │   │   └── useKeyboardShortcuts.ts      [EXISTS ✓]
│   │   ├── routes/
│   │   │   ├── auth.tsx                     [EXISTS ✓]
│   │   │   ├── dashboard.tsx                [EXISTS ✓]
│   │   │   ├── diagnostics.tsx              [EXISTS ✓]
│   │   │   ├── lesson-workspace.tsx         [EXISTS ✓]
│   │   │   ├── my-lessons.tsx               [EXISTS ✓]
│   │   │   └── templates.tsx                [EXISTS ✓]
│   │   ├── types/
│   │   │   ├── lesson-setup-types.ts        [EXISTS ✓]
│   │   │   ├── lesson-types.ts              [EXISTS ✓]
│   │   │   └── template-types.ts            [EXISTS ✓]
│   │   ├── utils/                           [20+ utility files - ALL EXIST ✓]
│   │   │   ├── admin-auth.ts
│   │   │   ├── authed-fetch.ts
│   │   │   ├── supabase-lessons.ts
│   │   │   └── [17+ more utils]
│   │   ├── App.tsx                          [EXISTS ✓]
│   │   ├── cache-bust.ts                    [EXISTS ✓]
│   │   ├── config.ts                        [EXISTS ✓]
│   │   ├── routes.tsx                       [EXISTS ✓]
│   │   └── types.ts                         [EXISTS ✓]
│   ├── deck/
│   │   ├── components/                      [4 files - ALL EXIST ✓]
│   │   │   ├── NavTileGrid.tsx
│   │   │   ├── RevealBlock.tsx
│   │   │   ├── TimerWidget.tsx
│   │   │   └── YouTubeEmbed.tsx
│   │   ├── renderers/                       [11 files - ALL EXIST ✓]
│   │   │   ├── DiscussionPromptSlide.tsx
│   │   │   ├── PhonicsWordRenderer.tsx
│   │   │   └── [9+ more renderers]
│   │   ├── DeckPlayer.tsx                   [EXISTS ✓]
│   │   ├── TeachModeShell.tsx               [EXISTS ✓]
│   │   └── useDeckNavigation.ts             [EXISTS ✓]
│   ├── extraction/
│   │   ├── docxExtractor.ts                 [EXISTS ✓]
│   │   ├── extractionService.ts             [EXISTS ✓]
│   │   ├── pdfExtractorSimple.ts            [EXISTS ✓]
│   │   └── pptxExtractor.ts                 [EXISTS ✓]
│   ├── imports/
│   │   ├── svg-afh1ljnmzd.ts                [EXISTS ✓]
│   │   ├── svg-h9imbi5xbp.ts                [EXISTS ✓]
│   │   ├── svg-wg27m963yb.ts                [EXISTS ✓]
│   │   └── [10+ documentation files]        [EXISTS ✓]
│   ├── lib/
│   │   └── validators.ts                    [EXISTS ✓]
│   ├── ocr/
│   │   ├── imageOcr.ts                      [EXISTS ✓]
│   │   ├── index.ts                         [EXISTS ✓]
│   │   ├── ocrQueue.ts                      [EXISTS ✓]
│   │   ├── ocrService.ts                    [EXISTS ✓]
│   │   ├── ocrTestHelper.ts                 [EXISTS ✓]
│   │   ├── ocrWorker.ts                     [EXISTS ✓]
│   │   ├── pdfOcr.ts                        [EXISTS ✓]
│   │   └── README.md                        [EXISTS ✓]
│   ├── services/
│   │   └── llm-analysis.ts                  [EXISTS ✓]
│   ├── styles/
│   │   ├── fonts.css                        [EXISTS ✓]
│   │   ├── index.css                        [EXISTS ✓]
│   │   ├── tailwind.css                     [EXISTS ✓]
│   │   └── theme.css                        [EXISTS ✓]
│   ├── theme/
│   │   ├── layout.ts                        [EXISTS ✓]
│   │   └── tokens.ts                        [EXISTS ✓]
│   ├── types/
│   │   ├── extraction.ts                    [EXISTS ✓]
│   │   ├── files.ts                         [EXISTS ✓]
│   │   ├── lesson.ts                        [EXISTS ✓]
│   │   ├── llm.ts                           [EXISTS ✓]
│   │   ├── slides.ts                        [EXISTS ✓]
│   │   ├── standards.ts                     [EXISTS ✓]
│   │   └── subject.ts                       [EXISTS ✓]
│   ├── utils/
│   │   ├── upload/
│   │   │   ├── imageCompress.ts             [EXISTS ✓]
│   │   │   ├── preflight.ts                 [EXISTS ✓]
│   │   │   ├── uploadQueue.ts               [EXISTS ✓]
│   │   │   └── xhrUpload.ts                 [EXISTS ✓]
│   │   ├── supabase/
│   │   │   └── info.tsx                     [EXISTS ✓]
│   │   ├── api.ts                           [EXISTS ✓]
│   │   ├── hybridAuthFetch.ts               [EXISTS ✓]
│   │   ├── ocr-detection.ts                 [EXISTS ✓]
│   │   ├── storage-client.ts                [EXISTS ✓]
│   │   ├── supabase-auth.ts                 [EXISTS ✓]
│   │   ├── template-manager.ts              [EXISTS ✓]
│   │   └── [8+ more utils]                  [EXISTS ✓]
│   └── main.tsx                             [EXISTS ✓]
├── supabase/
│   └── functions/
│       └── server/
│           ├── auth-middleware.ts           [EXISTS ✓]
│           ├── auth-utils.ts                [EXISTS ✓]
│           ├── extraction.ts                [EXISTS ✓]
│           ├── files.ts                     [EXISTS ✓]
│           ├── index.tsx                    [EXISTS ✓]
│           ├── jobs.ts                      [EXISTS ✓]
│           ├── keys.ts                      [EXISTS ✓]
│           ├── kv_store.tsx                 [EXISTS ✓]
│           ├── llm-classifier.ts            [EXISTS ✓]
│           ├── ocr-service.ts               [EXISTS ✓]
│           ├── storage.ts                   [EXISTS ✓]
│           ├── template-analyzer.ts         [EXISTS ✓]
│           ├── template-files.ts            [EXISTS ✓]
│           ├── types.ts                     [EXISTS ✓]
│           ├── user-data.ts                 [EXISTS ✓]
│           └── webpage-extractor.ts         [EXISTS ✓]
├── utils/
│   └── supabase/
│       └── info.tsx                         [EXISTS ✓]
├── .gitignore                               [CREATE - see below]
├── index.html                               [EXISTS ✓]
├── package.json                             [EXISTS ✓]
├── playwright.config.ts                     [EXISTS ✓]
├── postcss.config.mjs                       [EXISTS ✓]
├── README.md                                [REPLACE - see below]
├── tsconfig.json                            [CREATE - see below]
├── tsconfig.node.json                       [CREATE - see below]
└── vite.config.ts                           [EXISTS ✓]
```

**SUMMARY:**
- Total files: ~260
- Already exist in Figma Make: ~254
- Need to create: 6 files (marked with [CREATE] or [REPLACE])

---

## PART 2: FILES TO CREATE

### FILE 1: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### FILE 2: `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

---

### FILE 3: `.gitignore`

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.production.local
.env.development.local
.env.test.local

# Test results
/playwright-report/
/test-results/
/blob-report/
/playwright/.cache/

# Build outputs
/build
/public/build
```

---

### FILE 4: `.devcontainer/devcontainer.json`

```json
{
  "name": "Lesson Template System",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss"
      ]
    }
  },
  "forwardPorts": [5173],
  "postCreateCommand": "npm install",
  "remoteUser": "node"
}
```

---

### FILE 5: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npm test
```

---

### FILE 6: `README.md` (REPLACE EXISTING)

```markdown
# Lesson Template System

Interactive slide deck generator with Florida B.E.S.T. standards alignment for classroom use.

## Prerequisites

- Node.js 18+ 
- npm or pnpm

## Installation

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Testing

Run Playwright tests:

```bash
npm test
```

Run tests in UI mode:

```bash
npm run test:ui
```

## Environment Variables

Create a `.env` file in the root directory with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

## GitHub Codespaces

This project is configured for GitHub Codespaces. After opening in Codespaces:

1. Wait for the container to build
2. Run: `npm ci`
3. Run: `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`
4. Access the forwarded port in your browser

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v4 (Apple Orchard design system)
- **Backend**: Supabase (Auth, Storage, Edge Functions)
- **Testing**: Playwright

## Features

- 35 unique slide components
- Florida B.E.S.T. standards alignment
- Phonics visual rules enforcement
- File upload and extraction (PDF, DOCX, PPTX)
- LLM-powered lesson focus extraction
- Complete lesson dashboard and build flow
- Auth-required security mode

## Project Structure

```
src/
├── app/              # Main application code
│   ├── components/   # React components (70+ files)
│   ├── routes/       # Route components
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
├── deck/             # Slide deck player system
├── extraction/       # File extraction services
├── ocr/              # OCR processing
├── services/         # External services (LLM, etc.)
└── styles/           # Global styles and theme
```

## License

Private - For classroom use only
```

---

## PART 3: EXISTING FILES NEEDING UPDATES

### UPDATE: `package.json` (add dev script)

In your existing `/package.json`, update the `scripts` section to:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "playwright test",
  "test:ui": "playwright test --ui",
  "test:report": "playwright show-report"
}
```

Also add to `dependencies`:

```json
"react-router-dom": "^6.28.0"
```

And add to `devDependencies`:

```json
"@types/node": "^22.10.5",
"@types/react": "^18.3.1",
"@types/react-dom": "^18.3.1",
"typescript": "^5.7.3"
```

---

### UPDATE: `src/app/routes.tsx` (use react-router-dom)

Replace the imports at the top:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
```

---

### UPDATE: `vite.config.ts` (add server config)

Add this to the export at the bottom:

```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  strictPort: true,
},
```

---

### UPDATE: `index.html` (simplify)

Replace entire file with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lesson Template System</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

### UPDATE: `src/main.tsx` (simplify)

Replace entire file with:

```tsx
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

function showFatal(message: string, extra?: unknown) {
  console.error("FATAL_BOOT_ERROR:", message, extra);

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:999999;background:#0b1220;" +
    "color:#e5e7eb;padding:16px;overflow:auto;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
  overlay.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <h1 style="font-size:18px;margin:0 0 8px 0">App failed to boot</h1>
      <p style="opacity:.85;margin:0 0 12px 0">${message}</p>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);padding:12px;border-radius:12px">${extra ? String(extra) : ""}</pre>
    </div>
  `;
  document.body.appendChild(overlay);
}

try {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    showFatal("Missing #root element in index.html");
  } else {
    createRoot(rootEl).render(<App />);
  }
} catch (err: any) {
  showFatal("Exception during React mount", err?.stack || err?.message || String(err));
}
```

---

## PART 4: MIGRATION STEPS

### Step 1: Download All Files from Figma Make

Use Figma Make's export/download feature to get all existing files.

---

### Step 2: Create New Config Files

Create the 6 files listed in PART 2:
1. `tsconfig.json`
2. `tsconfig.node.json`
3. `.gitignore`
4. `.devcontainer/devcontainer.json`
5. `.github/workflows/ci.yml`
6. `README.md` (replace)

---

### Step 3: Update Existing Files

Make the small changes listed in PART 3:
1. Update `package.json` scripts and dependencies
2. Update `src/app/routes.tsx` imports
3. Update `vite.config.ts` server config
4. Simplify `index.html`
5. Simplify `src/main.tsx`

---

### Step 4: Initialize Git Repository

```bash
cd lesson-template-system
git init
git add -A
git commit -m "Initial commit: Lesson Template System from Figma Make"
git branch -M main
```

---

### Step 5: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `lesson-template-system`
3. Description: "Interactive slide deck generator with Florida B.E.S.T. standards alignment"
4. Choose Private or Public
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

---

### Step 6: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/lesson-template-system.git
git push -u origin main
```

---

### Step 7: Open in Codespaces

1. Go to your GitHub repository
2. Click the green "Code" button
3. Click "Codespaces" tab
4. Click "Create codespace on main"
5. Wait for container to build (~2-3 minutes)

---

### Step 8: Run in Codespaces

Once Codespaces opens, run:

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Access the app at the forwarded port (Codespaces will show a notification).

---

## PART 5: ENVIRONMENT VARIABLES

Create a `.env` file in Codespaces:

```bash
VITE_SUPABASE_URL=https://sbhlnarifpbhfjabjbmi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaGxuYXJpZnBiaGZqYWJqYm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODc5NTIsImV4cCI6MjA4NzE2Mzk1Mn0.9rqhU-r5kGZAjBkyyX9eUeHTIasbQDS2ARpVL1Lnp90
VITE_SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
VITE_OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

**IMPORTANT:** Never commit `.env` to git (it's already in `.gitignore`)

---

## PART 6: TROUBLESHOOTING

### Issue: Module not found errors

**Solution:** Run `npm ci` to ensure all dependencies are installed

---

### Issue: Port 5173 already in use

**Solution:** Stop other processes or change port in `vite.config.ts`

---

### Issue: Supabase connection errors

**Solution:** Verify environment variables in `.env` file

---

### Issue: Build fails in CI

**Solution:** Check that all TypeScript errors are resolved locally first

---

## PART 7: QUICK REFERENCE

### Local Development
```bash
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests
```

### Codespaces Development
```bash
npm ci                                                 # Install dependencies (faster)
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort # Start dev server (accessible)
```

### Git Commands
```bash
git status                    # Check file changes
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push                      # Push to GitHub
git pull                      # Pull latest changes
```

---

## CHECKLIST

**Pre-Migration:**
- [ ] Download all files from Figma Make
- [ ] Verify you have ~254 files

**File Creation:**
- [ ] Create `tsconfig.json`
- [ ] Create `tsconfig.node.json`
- [ ] Create `.gitignore`
- [ ] Create `.devcontainer/devcontainer.json`
- [ ] Create `.github/workflows/ci.yml`
- [ ] Replace `README.md`

**File Updates:**
- [ ] Update `package.json` (scripts + dependencies)
- [ ] Update `src/app/routes.tsx` (imports)
- [ ] Update `vite.config.ts` (server config)
- [ ] Update `index.html` (simplify)
- [ ] Update `src/main.tsx` (simplify)

**Git Setup:**
- [ ] Run `git init`
- [ ] Run `git add -A`
- [ ] Run `git commit -m "Initial commit"`
- [ ] Create GitHub repository
- [ ] Run `git remote add origin <URL>`
- [ ] Run `git push -u origin main`

**Codespaces:**
- [ ] Open Codespaces from GitHub
- [ ] Create `.env` file with credentials
- [ ] Run `npm ci`
- [ ] Run `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`
- [ ] Access forwarded port

**Verification:**
- [ ] App loads without errors
- [ ] Can navigate between routes
- [ ] Can create new lesson
- [ ] File upload works
- [ ] Auth flow works

---

## END OF GUIDE

**Total effort:** ~30 minutes
- 5 min: Download files from Figma Make
- 10 min: Create 6 new config files
- 5 min: Update 5 existing files
- 5 min: Git setup and push
- 5 min: Codespaces setup and test

**Questions?** Review the relevant section above or check GitHub docs.
