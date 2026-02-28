// Layout constants and helpers

export interface SlideLayout {
  name: string;
  description: string;
  padding: string;
  maxWidth?: string;
  contentAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'center' | 'bottom';
}

// Standard slide layouts
export const slideLayouts = {
  // Full-width centered (Welcome, Celebration)
  intro: {
    name: 'Intro',
    description: 'Full-width centered layout for welcome/celebration slides',
    padding: '3rem',
    contentAlign: 'center',
    verticalAlign: 'center',
  } as SlideLayout,
  
  // Standard instructional (Learning Targets, New Concept)
  instruction: {
    name: 'Instruction',
    description: 'Standard layout for instructional content',
    padding: '3rem',
    maxWidth: '1200px',
    contentAlign: 'left',
    verticalAlign: 'top',
  } as SlideLayout,
  
  // Practice/drill (Word Practice, Blending)
  practice: {
    name: 'Practice',
    description: 'Centered layout for practice activities',
    padding: '3rem',
    maxWidth: '1400px',
    contentAlign: 'center',
    verticalAlign: 'center',
  } as SlideLayout,
  
  // Discussion (Discussion Prompt, Turn & Talk)
  discussion: {
    name: 'Discussion',
    description: 'Centered layout for discussion prompts',
    padding: '3rem',
    maxWidth: '1000px',
    contentAlign: 'center',
    verticalAlign: 'center',
  } as SlideLayout,
  
  // Review/Summary
  review: {
    name: 'Review',
    description: 'Layout for review and summary slides',
    padding: '3rem',
    maxWidth: '1200px',
    contentAlign: 'left',
    verticalAlign: 'center',
  } as SlideLayout,
};

// Standard slide dimensions (for screenshot rendering)
export const SLIDE_DIMENSIONS = {
  width: 1920,
  height: 1080,
  aspectRatio: 16 / 9,
};

// Safe zones (avoid projector cutoff)
export const SAFE_ZONES = {
  horizontal: 80, // 80px margin on left/right
  vertical: 60,   // 60px margin on top/bottom
};

// Typography scale for consistent sizing
export const TYPOGRAPHY_SCALE = {
  slideTitle: '3.75rem',      // 60px - Main slide titles
  sectionTitle: '3rem',        // 48px - Section headers
  heading: '2.25rem',          // 36px - Sub-headings
  bodyLarge: '1.875rem',       // 30px - Large body text
  body: '1.5rem',              // 24px - Regular body text
  bodySmall: '1.125rem',       // 18px - Small body text
  caption: '1rem',             // 16px - Captions
  
  // Phonics-specific
  phonicsWord: '6rem',         // 96px - Large phonics words
  phonicsLetter: '4.5rem',     // 72px - Individual letters
  phonicsExample: '3rem',      // 48px - Example words
};

// Helper: Get layout classes
export function getLayoutClasses(layout: SlideLayout): string {
  const classes: string[] = [];
  
  // Padding
  classes.push(`p-[${layout.padding}]`);
  
  // Max width
  if (layout.maxWidth) {
    classes.push(`max-w-[${layout.maxWidth}]`, 'mx-auto');
  }
  
  // Content alignment
  if (layout.contentAlign === 'center') {
    classes.push('text-center');
  } else if (layout.contentAlign === 'right') {
    classes.push('text-right');
  }
  
  // Vertical alignment
  if (layout.verticalAlign === 'center') {
    classes.push('flex', 'flex-col', 'justify-center', 'h-full');
  } else if (layout.verticalAlign === 'bottom') {
    classes.push('flex', 'flex-col', 'justify-end', 'h-full');
  }
  
  return classes.join(' ');
}
