/**
 * Lesson Setup Types
 * 
 * Defines the structure for Step 0 (Lesson Setup Panel) which determines
 * what slides/components to generate based on curriculum choices.
 */

export type Subject = "ela" | "math" | "science" | "social-studies";

export type TimeBlock = "20" | "30" | "45" | "full";

export type UflDay = 1 | 2; // UFLI has ONLY 2 days

export type UflTimeMode = "short" | "standard" | "extended";

export type WebResourcePurpose = "vocab" | "background" | "informational" | "teacher-reference";

/**
 * Main Lesson Setup Configuration
 * This is the "brain" that tells the system what to generate.
 */
export interface LessonSetup {
  lessonId: string;
  lessonTitle?: string; // Required for setup completion
  gradeLevel?: string; // e.g., "Kindergarten", "1st Grade"
  notes?: string; // Optional teacher notes
  
  // Core settings
  subject: Subject; // default "ela"
  
  sources: {
    savvas: boolean;
    ufli: boolean;
    teacherCreated: boolean;
    webResource: boolean;
  };
  
  schedule: {
    timeAvailable: TimeBlock; // affects slide count + inclusion
    date?: string;
    teacherNotes?: string;
  };
  
  // Savvas-specific settings (only if sources.savvas = true)
  savvas?: {
    unit: number; // 1–10
    week: number; // 1–5
    day: number; // 1–5
    phonicsFocus?: string; // editable auto-fill
    comprehensionFocus?: string; // editable auto-fill
    storyTitle?: string; // the story being taught
    genreTextType?: string; // editable auto-fill
    vocabularyFocus?: string; // editable auto-fill
    highFrequencyWords?: string[]; // tags
    toggles: {
      includeReadAloud: boolean;
      includeVocabulary: boolean;
      includeCompSkill: boolean;
      includeSharedReading: boolean;
    };
  };
  
  // UFLI-specific settings (only if sources.ufli = true)
  ufli?: {
    lessonNumber: number;
    day: UflDay; // 1 or 2 ONLY
    phonicsPattern?: string; // ex: a_e long A
    targetSound?: string; // ex: /ā/
    lettersReviewed?: string[]; // tags
    exampleWords?: string[]; // tags
    
    day2Options: {
      timeMode: UflTimeMode; // short/standard/extended
      includeDictation: boolean; // OPTIONAL
      includeDecodable: boolean; // OPTIONAL
      includeFluency: boolean; // OPTIONAL
      includePartnerReading: boolean; // OPTIONAL
    };
  };
  
  // Weekly focus (master override)
  weeklyFocus?: {
    phonicsOrLetters?: string; // master override
    spellingPattern?: string;
    comprehensionSkill?: string;
    writingSkill?: string;
    sightWords?: string[];
    vocabularyWords?: string[]; // story-specific vocabulary
    academicVocabulary?: string[]; // academic/content-area vocabulary
  };
  
  // Component toggles (what slides to include)
  components: {
    learningTargets: boolean;
    phonicsWarmUp: boolean;
    blendingBoard: boolean;
    wordReadingPractice: boolean;
    sightWords: boolean;
    vocabulary: boolean;
    readAloud: boolean;
    comprehensionModeling: boolean;
    guidedPractice: boolean;
    interactionChecks: boolean;
    writingConnection: boolean;
    exitTicket: boolean;
    celebration: boolean;
  };
  
  // Differentiation options
  differentiation: {
    esolSupports: boolean;
    simplifiedDirections: boolean;
    extraModeling: boolean;
    extensionPrompts: boolean;
  };
  
  // Web resources
  webResources?: Array<{
    url: string;
    purpose: WebResourcePurpose;
    enabled: boolean;
  }>;
  
  // Review preferences
  reviewPreferences: {
    showAISuggestionsBeforeBuild: boolean;
    highlightLowConfidence: boolean;
    requireApprovalBelowConfidence: number; // default 0.70
  };
}

/**
 * Default lesson setup configuration
 */
export const getDefaultLessonSetup = (lessonId: string): LessonSetup => ({
  lessonId,
  subject: 'ela',
  sources: {
    savvas: false,
    ufli: false,
    teacherCreated: false,
    webResource: false,
  },
  schedule: {
    timeAvailable: '30',
  },
  components: {
    learningTargets: true,
    phonicsWarmUp: true,
    blendingBoard: true,
    wordReadingPractice: true,
    sightWords: true,
    vocabulary: true,
    readAloud: true,
    comprehensionModeling: true,
    guidedPractice: true,
    interactionChecks: true,
    writingConnection: false,
    exitTicket: true,
    celebration: true,
  },
  differentiation: {
    esolSupports: false,
    simplifiedDirections: false,
    extraModeling: false,
    extensionPrompts: false,
  },
  reviewPreferences: {
    showAISuggestionsBeforeBuild: true,
    highlightLowConfidence: true,
    requireApprovalBelowConfidence: 0.70,
  },
});

/**
 * Get a human-readable summary of the lesson setup
 */
export function getLessonSetupSummary(setup: LessonSetup): string {
  const parts: string[] = [];
  
  // Subject
  parts.push(setup.subject.toUpperCase());
  
  // UFLI
  if (setup.sources.ufli && setup.ufli) {
    parts.push(`UFLI Lesson ${setup.ufli.lessonNumber} Day ${setup.ufli.day}`);
  }
  
  // Savvas
  if (setup.sources.savvas && setup.savvas) {
    parts.push(`Savvas U${setup.savvas.unit} W${setup.savvas.week} D${setup.savvas.day}`);
  }
  
  // Teacher-created
  if (setup.sources.teacherCreated) {
    parts.push('Teacher-Created');
  }
  
  // Web resource
  if (setup.sources.webResource) {
    parts.push('Web Resource');
  }
  
  // Time
  const timeLabels: Record<TimeBlock, string> = {
    '20': '20 min',
    '30': '30 min',
    '45': '45 min',
    'full': 'Full Block',
  };
  parts.push(timeLabels[setup.schedule.timeAvailable]);
  
  return parts.join(' • ');
}

/**
 * Validate if lesson setup is complete
 * 
 * Setup is complete when:
 * - lessonTitle exists
 * - lesson date exists
 * - UFLI details: lessonNumber + day
 * - Savvas details: unit + week + day
 * - Weekly focus: phonics focus + comprehension focus
 */
export function isSetupComplete(setup: LessonSetup): boolean {
  // Check required core fields
  if (!setup.lessonTitle || !setup.lessonTitle.trim()) {
    return false;
  }
  
  // Check lesson date
  if (!setup.schedule.date) {
    return false;
  }
  
  // UFLI is required - validate UFLI fields
  if (!setup.ufli || !setup.ufli.lessonNumber || !setup.ufli.day) {
    return false;
  }
  // UFLI day must be 1 or 2
  if (setup.ufli.day !== 1 && setup.ufli.day !== 2) {
    return false;
  }
  
  // Savvas is required - validate Savvas fields
  if (!setup.savvas || !setup.savvas.unit || !setup.savvas.week || !setup.savvas.day) {
    return false;
  }
  
  // Weekly focus is required
  if (!setup.weeklyFocus?.phonicsOrLetters?.trim()) {
    return false;
  }
  
  if (!setup.weeklyFocus?.comprehensionSkill?.trim()) {
    return false;
  }
  
  return true;
}