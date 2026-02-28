# 🔌 Integration Guide: Keyboard Shortcuts + Features

**Quick guide for integrating the 5 new features into existing components.**

---

## 1️⃣ Adding Keyboard Shortcuts to Lesson Player

### In `/src/app/components/lesson-teach-panel.tsx`

Add imports:
```typescript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { BlackoutOverlay } from './blackout-overlay';
import { TeachingTimer } from './teaching-timer';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
```

Add state for overlays:
```typescript
const [isBlackoutActive, setIsBlackoutActive] = useState(false);
const [showTimer, setShowTimer] = useState(false);
const [showHelp, setShowHelp] = useState(false);
const [currentSlide, setCurrentSlide] = useState(0);
const totalSlides = 35; // Or get from lesson data
```

Enable keyboard shortcuts:
```typescript
useKeyboardShortcuts({
  enabled: true, // Or: enabled: isTeachingMode
  handlers: {
    onNextSlide: () => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    },
    onPreviousSlide: () => {
      if (currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      }
    },
    onFirstSlide: () => setCurrentSlide(0),
    onLastSlide: () => setCurrentSlide(totalSlides - 1),
    onToggleBlackout: () => setIsBlackoutActive(!isBlackoutActive),
    onToggleTimer: () => setShowTimer(!showTimer),
    onEscape: () => {
      // Close any open overlays
      setIsBlackoutActive(false);
      setShowHelp(false);
    },
  }
});
```

Add overlays to render:
```typescript
return (
  <div>
    {/* Existing lesson content */}
    
    {/* Add these at the end */}
    <BlackoutOverlay 
      isActive={isBlackoutActive}
      onDismiss={() => setIsBlackoutActive(false)}
    />
    
    <TeachingTimer
      isVisible={showTimer}
      onClose={() => setShowTimer(false)}
    />
    
    <KeyboardShortcutsHelp
      isVisible={showHelp}
      onClose={() => setShowHelp(false)}
    />
  </div>
);
```

Add help button to UI:
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => setShowHelp(true)}
  className="gap-2"
>
  <Keyboard className="size-4" />
  Shortcuts (?)
</Button>
```

---

## 2️⃣ Using Image Optimization in Upload

### In `/src/app/components/lesson-upload-panel.tsx`

Add import:
```typescript
import { optimizeImage, getOptimizationPreset } from '../utils/image-optimizer';
```

Wrap file upload logic:
```typescript
async function handleFileUpload(file: File) {
  // Check if it's an image
  if (file.type.startsWith('image/')) {
    toast.info('Optimizing image...');
    
    // Optimize before upload
    const result = await optimizeImage(
      file,
      getOptimizationPreset('slide')
    );
    
    if (result.isOptimized) {
      const savings = ((result.originalSize - result.optimizedSize) / result.originalSize) * 100;
      toast.success(`Image optimized: ${savings.toFixed(0)}% smaller`);
    }
    
    // Use optimized blob
    const optimizedFile = new File([result.blob], file.name, {
      type: 'image/webp',
    });
    
    // Continue with upload using optimizedFile
    await uploadToStorage(optimizedFile);
  } else {
    // Non-image file, upload as-is
    await uploadToStorage(file);
  }
}
```

---

## 3️⃣ Pre-loading Components

### In `/src/app/routes/lesson-workspace.tsx`

Add import:
```typescript
import { preloadComponent } from '../components/lazy-components';
```

Pre-load when user likely to need it:
```typescript
useEffect(() => {
  // When user enters lesson workspace, pre-load the player
  // (They'll likely teach the lesson soon)
  preloadComponent('LessonPlayer');
}, []);
```

Or pre-load on hover:
```typescript
<Button
  onMouseEnter={() => preloadComponent('LessonPlayer')}
  onClick={handleStartTeaching}
>
  Start Teaching
</Button>
```

---

## 4️⃣ Using Lazy-Loaded Components

### Replace direct imports with lazy versions

Before:
```typescript
import { LessonWizard } from './lesson-wizard';
import { ExtractionPreviewPanel } from './extraction-preview-panel';
```

After:
```typescript
import { 
  LessonWizard, 
  ExtractionPreviewPanel 
} from './lazy-components';
```

That's it! The components now load on-demand automatically.

---

## 5️⃣ Manual Recovery Snapshot Triggers

### In critical save operations

Add import:
```typescript
import { saveSnapshot } from '../utils/auto-recovery';
```

Force snapshot after important actions:
```typescript
async function saveLessonSetup(setup: LessonSetup) {
  await api.kvSet(`lesson:${lessonId}:setup`, setup);
  
  // Force immediate snapshot (don't wait 30s)
  saveSnapshot();
  
  toast.success('Setup saved');
}
```

Clear snapshot when lesson properly closed:
```typescript
import { clearSnapshot } from '../utils/auto-recovery';

function handleClosLesson() {
  // User properly closed lesson, no need to recover
  clearSnapshot();
  navigate('/lessons');
}
```

---

## 🎯 Quick Integration Checklist

### For Lesson Player / Teach Mode:
- [ ] Import `useKeyboardShortcuts` hook
- [ ] Import overlay components (Blackout, Timer, Help)
- [ ] Add state for overlays
- [ ] Set up keyboard handlers
- [ ] Render overlays in JSX
- [ ] Add "Shortcuts" button to UI

### For Image Uploads:
- [ ] Import `optimizeImage` function
- [ ] Wrap upload logic with optimization
- [ ] Show optimization feedback toast
- [ ] Use optimized blob for upload

### For Heavy Components:
- [ ] Replace direct imports with lazy-components
- [ ] Add pre-loading on hover/entry
- [ ] Test loading fallbacks work

### For Auto-Recovery:
- [ ] Force snapshots after critical saves
- [ ] Clear snapshot on proper close
- [ ] Test recovery prompt shows after crash

---

## 🧪 Testing Your Integration

### Test Keyboard Shortcuts:
1. Open lesson in teach mode
2. Press Space → Should advance slide
3. Press B → Should blackout screen
4. Press T → Should show timer
5. Press ? → Should show help

### Test Image Optimization:
1. Upload a PNG/JPEG
2. Check console for "Image optimized" log
3. Verify file size reduction
4. Confirm image quality looks good

### Test Lazy Loading:
1. Open DevTools → Network → Disable cache
2. Load app → Heavy components should NOT load
3. Navigate to page needing component
4. See component load on-demand with "Loading..." message

### Test Auto-Recovery:
1. Start editing a lesson
2. Wait 30 seconds
3. Close browser tab abruptly
4. Reopen app
5. Should see recovery prompt
6. Click Restore → Should return to exact state

---

## 💡 Tips & Best Practices

### Keyboard Shortcuts:
- Only enable during active teaching/presentation
- Disable when user is typing in inputs
- Provide visual feedback (animations, toasts)
- Show help on first use

### Image Optimization:
- Optimize on upload, not on display
- Use presets for consistency
- Show progress for large images
- Fallback gracefully if optimization fails

### Lazy Loading:
- Pre-load components user will likely need
- Use meaningful loading messages
- Test loading fallbacks look good
- Pre-load everything when connected to WiFi

### Auto-Recovery:
- Clear snapshots when work properly saved
- Don't snapshot temporary/draft states
- Show recovery prompt immediately on boot
- Give clear restore/discard options

---

## 🚨 Common Issues

### "Keyboard shortcuts not working"
→ Check: `enabled={true}` and not typing in input

### "Image still PNG after optimization"
→ Check: Using `result.blob` not original `file`

### "Component not lazy-loading"
→ Check: Importing from `./lazy-components` not direct

### "Recovery prompt not showing"
→ Check: Snapshot < 1 hour old and has data

---

## 📞 Example: Full Integration

```typescript
// lesson-teach-panel.tsx - Complete example
import { useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { BlackoutOverlay } from './blackout-overlay';
import { TeachingTimer } from './teaching-timer';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';

export function LessonTeachPanel() {
  // State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBlackout, setIsBlackout] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const totalSlides = 35;
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    handlers: {
      onNextSlide: () => setCurrentSlide(Math.min(currentSlide + 1, totalSlides - 1)),
      onPreviousSlide: () => setCurrentSlide(Math.max(currentSlide - 1, 0)),
      onFirstSlide: () => setCurrentSlide(0),
      onLastSlide: () => setCurrentSlide(totalSlides - 1),
      onToggleBlackout: () => setIsBlackout(!isBlackout),
      onToggleTimer: () => setShowTimer(!showTimer),
      onEscape: () => {
        setIsBlackout(false);
        setShowHelp(false);
      },
    },
  });
  
  return (
    <div>
      {/* Lesson content */}
      <div>Slide {currentSlide + 1} of {totalSlides}</div>
      
      {/* Controls */}
      <button onClick={() => setShowHelp(true)}>
        Shortcuts (?)
      </button>
      
      {/* Overlays */}
      <BlackoutOverlay 
        isActive={isBlackout} 
        onDismiss={() => setIsBlackout(false)} 
      />
      <TeachingTimer 
        isVisible={showTimer} 
        onClose={() => setShowTimer(false)} 
      />
      <KeyboardShortcutsHelp 
        isVisible={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </div>
  );
}
```

---

**Ready to integrate!** Start with keyboard shortcuts (biggest impact), then add others as needed.
