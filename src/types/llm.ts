// LLM request/response types matching LLM_PROMPT_PACK_COMPLETE

// Generic LLM request metadata
export interface LLMRequestMeta {
  request_id: string;
  model_version: string;
}

// Generic LLM response metadata
export interface LLMResponseMeta {
  request_id: string;
  model_version: string;
}

// 1) OCR Normalizer Output
export interface OcrNormalizerOutput {
  meta: LLMResponseMeta;
  cleanText: string;
  confidence: number;
  notes: string[];
}

// 2) Chunk Classifier Output
export interface ChunkClassifierOutput {
  meta: LLMResponseMeta;
  chunkClassifications: {
    chunkId: string;
    tags: string[];
    slideTypeHints: {
      type: string;
      confidence: number;
      reason: string;
    }[];
    confidence: number;
  }[];
}

// 3) Lesson Focus Extractor Output
export interface LessonFocusExtractorOutput {
  meta: LLMResponseMeta;
  lessonFocus: {
    phonics: {
      skillTag: string | null;
      humanLabel: string | null;
      examples: string[];
      confidence: number;
      evidence: { chunkId: string; quote: string }[];
    } | null;
    sightWords: {
      words: string[];
      confidence: number;
      evidence: { chunkId: string; quote: string }[];
    };
    vocabulary: {
      items: {
        word: string;
        kidDefinition: string | null;
        imageHint: string | null;
        confidence: number;
        evidence: { chunkId: string; quote: string }[];
      }[];
      confidence: number;
    };
    skillFocusTags: {
      tags: string[];
      confidence: number;
      evidence: { chunkId: string; quote: string }[];
    };
    discussionQuestions: {
      questions: {
        text: string;
        confidence: number;
        evidence: { chunkId: string; quote: string }[];
      }[];
      confidence: number;
    };
    youtubeLinks: {
      items: {
        title: string | null;
        url: string;
        confidence: number;
        evidence: { chunkId: string; quote: string }[];
      }[];
      confidence: number;
    };
    story: {
      title: string | null;
      pagesDetected: number[];
      confidence: number;
      evidence: { chunkId: string; quote: string }[];
    };
  };
  confidenceNotes: {
    field: string;
    confidence: number;
    reason: string;
  }[];
  warnings: string[];
}

// 4) Merge & Override Output
export interface MergeOverrideOutput {
  meta: LLMResponseMeta;
  normalizedLessonInputs: Record<string, unknown>;
  confidenceNotes: {
    field: string;
    confidence: number;
    reason: string;
  }[];
  warnings: string[];
}

// 5) Standards Candidates Output
export interface StandardsCandidatesOutput {
  meta: LLMResponseMeta;
  candidates: {
    code: string;
    confidence: number;
    rationale: string;
    suggestedICan: string[];
    evidence: { field: string; value: string }[];
  }[];
  confidenceNotes: {
    field: string;
    confidence: number;
    reason: string;
  }[];
  warnings: string[];
}

// 6) Standards-Aligned Questions Output
export interface StandardsAlignedQuestionsOutput {
  meta: LLMResponseMeta;
  questions: {
    text: string;
    skillTag: string;
    confidence: number;
  }[];
  confidenceNotes: {
    field: string;
    confidence: number;
    reason: string;
  }[];
}

// 7) Slide Plan Output
export interface SlidePlanOutput {
  meta: LLMResponseMeta;
  deckPlan: {
    templateId: string;
    themeId: string;
    slides: {
      type: string;
      content: Record<string, unknown>;
      confidence: number;
      evidence: { source: string; detail: string }[];
    }[];
  };
  confidenceNotes: {
    field: string;
    confidence: number;
    reason: string;
  }[];
  warnings: string[];
}

// 8) JSON Repair Output (generic - same schema as original)
export type JsonRepairOutput = 
  | OcrNormalizerOutput
  | ChunkClassifierOutput
  | LessonFocusExtractorOutput
  | MergeOverrideOutput
  | StandardsCandidatesOutput
  | StandardsAlignedQuestionsOutput
  | SlidePlanOutput;

// LLM call types
export type LLMCallType =
  | 'ocr_normalizer'
  | 'chunk_classifier'
  | 'lesson_focus_extractor'
  | 'merge_override'
  | 'standards_candidates'
  | 'standards_aligned_questions'
  | 'slide_plan'
  | 'json_repair';

// Generic LLM request
export interface LLMRequest {
  type: LLMCallType;
  meta: LLMRequestMeta;
  input: Record<string, unknown>;
}

// Generic LLM response wrapper
export interface LLMResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: string[];
  retried?: boolean;
}
