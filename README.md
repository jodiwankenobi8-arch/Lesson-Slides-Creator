# Apple Orchard Planner 🍎
### Florida B.E.S.T. Lesson Builder with Charming Teacher-Friendly Design

**An automated lesson template system for K-2 reading instruction with Florida B.E.S.T. standards alignment.**

Built with warm farmhouse aesthetics and cozy workspace design perfect for daily classroom planning.

---

## Quick Start

This application automatically generates interactive slide decks from uploaded materials (PowerPoints, PDFs, Word docs) and teacher inputs. Built for daily classroom use on school Wi-Fi with reliability and consistency as top priorities.

### For Teachers
👉 **[Teacher Quick Guide](./TEACHER_QUICK_GUIDE.md)** - New features, keyboard shortcuts, and classroom tips  
👉 **[Apple Orchard Design Guide](./APPLE_ORCHARD_DESIGN_GUIDE.md)** - Design system and UI patterns

### For Developers
👉 **[Integration Guide](./INTEGRATION_GUIDE.md)** - How to integrate keyboard shortcuts, image optimization, and other features

---

## Design Philosophy 🎨

**Apple Orchard Planner** features a warm, cozy design inspired by farmhouse aesthetics:

- **Warm Cream Backgrounds** (`#FFF6E9`) - Comfortable for extended planning sessions
- **Navy Structure** (`#1F2A44`) - Professional headers and organization
- **Apple Red Actions** (`#C84C4C`) - Clear primary buttons
- **Leaf Green Success** (`#6FA86B`) - Celebrating completion
- **Charming Accents** - Subtle gingham patterns, polka dot empty states, apple icons
- **Teacher-Friendly** - Clean, calm, and delightful to use every day

---

## What It Does

- **Automatic Slide Generation**: Upload your materials → system extracts content → generates 35-slide structured lesson deck
- **Florida B.E.S.T. Standards Alignment**: Auto-detects and aligns with appropriate reading standards
- **Phonics Visual Rules**: Strict enforcement of sound-spelling pattern display rules
- **Fixed Instructional Routine**: Follows UFLI Foundations kindergarten sequence exactly
- **Offline Support**: Works when school WiFi goes down
- **Pixel-Perfect Design**: Maintains original deck aesthetics while preserving interactivity

---

## Key Features

### For Live Teaching
- **Keyboard Shortcuts** - Navigate slides, blackout screen, open timer (all without touching mouse)
- **Blackout Screen** - Press `B` to instantly get students' attention
- **Built-in Timer** - Press `T` for timed activities (1, 3, 5, 10 min presets)
- **Auto-hide Controls** - Cleaner presentation view for students

### For Lesson Prep
- **Multi-file Upload** - PowerPoint, PDF, Word docs, images, and ZIP files
- **Auto-save & Recovery** - Never lose work from crashes or WiFi drops
- **Lesson Management** - Organize by subject, day, and week
- **Delete with Confidence** - 30-day Recently Deleted safety net

### Technical
- **Auth-Required Mode** - Secure user accounts with Supabase Auth
- **Supabase Integration** - File storage, database, edge functions
- **Image Optimization** - Automatic compression for faster loading
- **Lazy Loading** - Components load on-demand for better performance
- **Service Worker** - Offline functionality via background caching

---

## System Requirements

- **Browser**: Chrome, Edge, Safari, or Firefox (latest version)
- **Connection**: Online for initial load, then works offline
- **Account**: Sign up required (email + password)

---

## Architecture

**Frontend**: React + TypeScript + Tailwind CSS + React Router  
**Backend**: Supabase (Auth, Database, Storage, Edge Functions)  
**Build**: Vite  
**Testing**: Playwright (E2E)

**Key Files**:
- `/src/app/App.tsx` - Main application entry
- `/src/app/routes.ts` - Route configuration
- `/supabase/functions/server/index.tsx` - Server API
- `/src/deck/` - Slide rendering system

---

## Development

### Install
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
npm run test:e2e
```

---

## Project Structure

```
/
├── src/
│   ├── app/                    # Main application code
│   │   ├── components/         # React components
│   │   ├─��� routes/             # Page routes
│   │   ├── utils/              # Utilities
│   │   └── hooks/              # Custom hooks
│   ├── deck/                   # Slide rendering system
│   ├── extraction/             # File parsing (PDF, PPTX, DOCX)
│   ├── ocr/                    # OCR service
│   └── services/               # LLM analysis
├── supabase/functions/server/  # Backend edge functions
├── e2e/                        # End-to-end tests
└── public/                     # Static assets
```

---

## Documentation

- **[TEACHER_QUICK_GUIDE.md](./TEACHER_QUICK_GUIDE.md)** - For classroom teachers using the app
- **[APPLE_ORCHARD_DESIGN_GUIDE.md](./APPLE_ORCHARD_DESIGN_GUIDE.md)** - For teachers understanding the design system
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - For developers integrating features
- **[ATTRIBUTIONS.md](./ATTRIBUTIONS.md)** - Third-party licenses and credits

---

## Design Principles

1. **"One clean fix, not 25 patches"** - Comprehensive solutions over incremental patches
2. **Reliability > Cleverness** - School WiFi stability matters more than fancy features
3. **Pixel-perfect preservation** - Match original deck design exactly
4. **Phonics guardrails** - Strict visual display rules for sound-spelling patterns
5. **Fixed template system** - 35 slides, always the same structure

---

## Support

This is for personal daily classroom use. For issues:
1. Check the **Diagnostics** page (accessible via top-right corner)
2. Review **[TEACHER_QUICK_GUIDE.md](./TEACHER_QUICK_GUIDE.md)** for common questions
3. Check browser console for detailed error messages

---

## Status

**Current Version**: v2.1  
**Completion Status**: All major phases complete
- ✅ Foundation files and phonics guardrails
- ✅ Upload system with Supabase integration
- ✅ Extraction pipeline (PDF, PPTX, DOCX, OCR)
- ✅ LLM lesson focus extraction
- ✅ Template system (35 slides)
- ✅ Lesson Dashboard + Build Flow
- ✅ Comprehensive testing systems
- ✅ Security hardening (auth-required mode)
- ✅ UI standardization and cleanup
- ✅ IframeMessageAbortError fixes

---

## License

Personal classroom use.

---

**Built for teachers, by teachers.** 🍎