import type { PhonicsAnnotation } from '../deck/renderers/phonicsAnnotationSchema';

// Slide Type Dictionary - Complete allowed slide types
export const ALLOWED_SLIDE_TYPES = [
  'welcome',
  'learning_targets',
  'journey_nav',
  'songs_roadmap',
  'song',
  'ufli_intro',
  'lesson_day',
  'schedule',
  'phonemic_awareness',
  'phonemic_awareness_check',
  'visual_drill_intro',
  'visual_drill_check',
  'letter_drill',
  'auditory_drill',
  'auditory_drill_check',
  'blending_drill',
  'blending_board',
  'blending_check',
  'new_concept',
  'concept_contrast',
  'pattern_slide',
  'sound_card',
  'word_practice',
  'watch_me_read',
  'read_together',
  'spelling_routine',
  'show_what_you_know',
  'discussion_prompt',
  'turn_and_talk',
  'authors_purpose',
  'authors_purpose_review',
  'vocab_intro',
  'vocab_word',
  'book_cover',
  'story_page',
  'review_exit',
  'celebration',
  'reflection_checkoff',
] as const;

export type SlideType = typeof ALLOWED_SLIDE_TYPES[number];

// Base slide model - all slides have these
export interface SlideModelBase {
  id: string;
  type: SlideType;
  confidence?: number;
  evidence?: SlideEvidence[];
}

export interface SlideEvidence {
  source: string; // 'teacher_input' | 'extraction' | 'standards' | 'generated'
  detail: string;
}

// Content interfaces for each slide type

export interface WelcomeContent {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
}

export interface LearningTargetsContent {
  iCanStatements: string[];
  standardsCodes?: string[];
  skillFocus?: string;
}

export interface JourneyNavContent {
  sections: {
    label: string;
    icon?: string;
    slideIndex: number;
  }[];
}

export interface SongsRoadmapContent {
  songs: {
    title: string;
    youtubeUrl?: string;
    slideIndex?: number;
  }[];
}

export interface SongContent {
  title: string;
  youtubeUrl?: string;
  lyrics?: string;
}

export interface UfliIntroContent {
  skillLabel: string;
  introduction: string;
}

export interface LessonDayContent {
  dayNumber: number;
  skillLabel: string;
  focus: string;
}

export interface PhonemicAwarenessContent {
  instruction: string;
  examples: string[];
}

export interface PhonemicAwarenessCheckContent {
  prompt: string;
  items: string[];
  revealMode?: 'one-by-one' | 'all-at-once';
}

export interface LetterDrillContent {
  letters: string[];
  mode?: 'reveal' | 'flash';
}

export interface AuditoryDrillContent {
  sounds: string[];
  mode?: 'reveal' | 'flash';
}

export interface BlendingBoardContent {
  words: string[];
  highlightVowels?: boolean;
}

export interface BlendingCheckContent {
  prompt: string;
  words: string[];
  revealMode?: 'one-by-one' | 'all-at-once';
}

export interface NewConceptContent {
  skillLabel: string;
  concept: string;
  examples: string[];
  visualRule?: string; // e.g., "highlight_vowels"
}

export interface PatternSlideContent {
  pattern: string;
  examples: string[];
  visualRule?: string;
}

export interface WordPracticeContent {
  mode: 'reveal' | 'flash' | 'blend';
  words: string[];
  highlightVowels?: boolean; // DEPRECATED: removed in favor of schema-validated annotations
  sightWords?: boolean;
  phonicsAnnotations?: {
    word: string;
    annotations: PhonicsAnnotation[]; // Uses validated schema
  }[];
}

export interface WatchMeReadContent {
  text: string;
  highlightWords?: string[];
}

export interface DiscussionPromptContent {
  question: string;
  skillTag?: string;
  imageUrl?: string;
}

export interface TurnAndTalkContent {
  prompt: string;
  timerSeconds: number;
  partnerPrompt?: string;
}

export interface AuthorsPurposeContent {
  prompt: string;
  options?: string[];
}

export interface VocabIntroContent {
  introduction: string;
  totalWords: number;
}

export interface VocabWordContent {
  word: string;
  definition: string;
  imageUrl?: string;
  example?: string;
}

export interface BookCoverContent {
  title: string;
  author?: string;
  imageUrl?: string;
}

export interface StoryPageContent {
  pageNumber?: number;
  imageUrl?: string;
  text?: string;
}

export interface ReviewExitContent {
  summary: string;
  keyPoints?: string[];
}

export interface CelebrationContent {
  message: string;
  imageUrl?: string;
}

export interface ReflectionCheckoffContent {
  prompt: string;
  items: string[];
}

// Discriminated union of all slide models
export type SlideModel =
  | (SlideModelBase & { type: 'welcome'; content: WelcomeContent })
  | (SlideModelBase & { type: 'learning_targets'; content: LearningTargetsContent })
  | (SlideModelBase & { type: 'journey_nav'; content: JourneyNavContent })
  | (SlideModelBase & { type: 'songs_roadmap'; content: SongsRoadmapContent })
  | (SlideModelBase & { type: 'song'; content: SongContent })
  | (SlideModelBase & { type: 'ufli_intro'; content: UfliIntroContent })
  | (SlideModelBase & { type: 'lesson_day'; content: LessonDayContent })
  | (SlideModelBase & { type: 'schedule'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'phonemic_awareness'; content: PhonemicAwarenessContent })
  | (SlideModelBase & { type: 'phonemic_awareness_check'; content: PhonemicAwarenessCheckContent })
  | (SlideModelBase & { type: 'visual_drill_intro'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'visual_drill_check'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'letter_drill'; content: LetterDrillContent })
  | (SlideModelBase & { type: 'auditory_drill'; content: AuditoryDrillContent })
  | (SlideModelBase & { type: 'auditory_drill_check'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'blending_drill'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'blending_board'; content: BlendingBoardContent })
  | (SlideModelBase & { type: 'blending_check'; content: BlendingCheckContent })
  | (SlideModelBase & { type: 'new_concept'; content: NewConceptContent })
  | (SlideModelBase & { type: 'concept_contrast'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'pattern_slide'; content: PatternSlideContent })
  | (SlideModelBase & { type: 'sound_card'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'word_practice'; content: WordPracticeContent })
  | (SlideModelBase & { type: 'watch_me_read'; content: WatchMeReadContent })
  | (SlideModelBase & { type: 'read_together'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'spelling_routine'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'show_what_you_know'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'discussion_prompt'; content: DiscussionPromptContent })
  | (SlideModelBase & { type: 'turn_and_talk'; content: TurnAndTalkContent })
  | (SlideModelBase & { type: 'authors_purpose'; content: AuthorsPurposeContent })
  | (SlideModelBase & { type: 'authors_purpose_review'; content: Record<string, unknown> })
  | (SlideModelBase & { type: 'vocab_intro'; content: VocabIntroContent })
  | (SlideModelBase & { type: 'vocab_word'; content: VocabWordContent })
  | (SlideModelBase & { type: 'book_cover'; content: BookCoverContent })
  | (SlideModelBase & { type: 'story_page'; content: StoryPageContent })
  | (SlideModelBase & { type: 'review_exit'; content: ReviewExitContent })
  | (SlideModelBase & { type: 'celebration'; content: CelebrationContent })
  | (SlideModelBase & { type: 'reflection_checkoff'; content: ReflectionCheckoffContent });

// Deck Plan
export interface DeckPlan {
  templateId: string; // 'ela-k-v1'
  themeId: string;
  slides: SlideModel[];
  metadata?: {
    generatedAt: string;
    confidence?: number;
    warnings?: string[];
  };
}

// Slide screenshot reference
export interface SlideScreenshot {
  slideId: string;
  slideIndex: number;
  slideType: SlideType;
  imageUrl: string;
  generatedAt: string;
}

export interface SlideScreenshotIndex {
  lessonId: string;
  screenshots: SlideScreenshot[];
}