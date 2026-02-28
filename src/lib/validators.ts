// Validation utilities for LLM responses and data structures

import { ALLOWED_SLIDE_TYPES, type SlideType } from '../types/slides';
import type {
  OcrNormalizerOutput,
  ChunkClassifierOutput,
  LessonFocusExtractorOutput,
  MergeOverrideOutput,
  StandardsCandidatesOutput,
  StandardsAlignedQuestionsOutput,
  SlidePlanOutput,
  LLMCallType,
} from '../types/llm';
import type { StandardBenchmark } from '../types/standards';

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate slide type is allowed
export function validateSlideType(type: string): type is SlideType {
  return ALLOWED_SLIDE_TYPES.includes(type as SlideType);
}

// Validate standards code exists in allowed list
export function validateStandardsCode(
  code: string,
  allowedStandards: StandardBenchmark[]
): boolean {
  return allowedStandards.some((s) => s.code === code);
}

// Validate all standards codes
export function validateStandardsCodes(
  codes: string[],
  allowedStandards: StandardBenchmark[]
): ValidationResult {
  const errors: string[] = [];
  const invalid = codes.filter((code) => !validateStandardsCode(code, allowedStandards));
  
  if (invalid.length > 0) {
    errors.push(`Invalid standards codes: ${invalid.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// Validate JSON structure
export function validateJSON(json: string): ValidationResult {
  const errors: string[] = [];
  
  try {
    JSON.parse(json);
  } catch (e) {
    errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// Validate response has required meta fields
function validateMeta(data: unknown): ValidationResult {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Response must be an object');
    return { valid: false, errors, warnings: [] };
  }
  
  const meta = (data as { meta?: unknown }).meta;
  
  if (!meta || typeof meta !== 'object') {
    errors.push('Missing required field: meta');
  } else {
    const m = meta as { request_id?: unknown; model_version?: unknown };
    if (!m.request_id) errors.push('Missing meta.request_id');
    if (!m.model_version) errors.push('Missing meta.model_version');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

// Validate confidence notes for low confidence fields
function validateConfidenceNotes(
  data: { confidenceNotes?: { field: string; confidence: number; reason: string }[] },
  threshold = 0.7
): ValidationResult {
  const warnings: string[] = [];
  
  if (data.confidenceNotes) {
    data.confidenceNotes.forEach((note) => {
      if (note.confidence < threshold) {
        warnings.push(`Low confidence (${note.confidence}) for field: ${note.field} - ${note.reason}`);
      }
    });
  }
  
  return {
    valid: true,
    errors: [],
    warnings,
  };
}

// Validate OCR Normalizer Output
export function validateOcrNormalizerOutput(data: unknown): ValidationResult {
  const metaResult = validateMeta(data);
  if (!metaResult.valid) return metaResult;
  
  const errors: string[] = [];
  const output = data as OcrNormalizerOutput;
  
  if (typeof output.cleanText !== 'string') {
    errors.push('Missing or invalid cleanText');
  }
  if (typeof output.confidence !== 'number') {
    errors.push('Missing or invalid confidence');
  }
  if (!Array.isArray(output.notes)) {
    errors.push('Missing or invalid notes array');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: output.confidence < 0.7 ? [`Low OCR confidence: ${output.confidence}`] : [],
  };
}

// Validate Chunk Classifier Output
export function validateChunkClassifierOutput(data: unknown): ValidationResult {
  const metaResult = validateMeta(data);
  if (!metaResult.valid) return metaResult;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const output = data as ChunkClassifierOutput;
  
  if (!Array.isArray(output.chunkClassifications)) {
    errors.push('Missing or invalid chunkClassifications array');
  } else {
    output.chunkClassifications.forEach((chunk, idx) => {
      if (!chunk.chunkId) errors.push(`chunkClassifications[${idx}] missing chunkId`);
      if (!Array.isArray(chunk.tags)) errors.push(`chunkClassifications[${idx}] missing tags`);
      if (!Array.isArray(chunk.slideTypeHints)) {
        errors.push(`chunkClassifications[${idx}] missing slideTypeHints`);
      } else {
        chunk.slideTypeHints.forEach((hint) => {
          if (!validateSlideType(hint.type)) {
            errors.push(`Invalid slide type: ${hint.type}`);
          }
        });
      }
      if (chunk.confidence < 0.7) {
        warnings.push(`Low confidence for chunk ${chunk.chunkId}: ${chunk.confidence}`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// Validate Lesson Focus Extractor Output
export function validateLessonFocusExtractorOutput(data: unknown): ValidationResult {
  const metaResult = validateMeta(data);
  if (!metaResult.valid) return metaResult;
  
  const errors: string[] = [];
  const output = data as LessonFocusExtractorOutput;
  
  if (!output.lessonFocus) {
    errors.push('Missing lessonFocus');
  }
  if (!Array.isArray(output.confidenceNotes)) {
    errors.push('Missing confidenceNotes array');
  }
  if (!Array.isArray(output.warnings)) {
    errors.push('Missing warnings array');
  }
  
  const confResult = validateConfidenceNotes(output);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: confResult.warnings,
  };
}

// Validate Standards Candidates Output
export function validateStandardsCandidatesOutput(
  data: unknown,
  allowedStandards: StandardBenchmark[]
): ValidationResult {
  const metaResult = validateMeta(data);
  if (!metaResult.valid) return metaResult;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const output = data as StandardsCandidatesOutput;
  
  if (!Array.isArray(output.candidates)) {
    errors.push('Missing candidates array');
  } else {
    if (output.candidates.length < 1 || output.candidates.length > 3) {
      errors.push('Must have 1-3 candidates');
    }
    
    output.candidates.forEach((candidate, idx) => {
      if (!validateStandardsCode(candidate.code, allowedStandards)) {
        errors.push(`Invalid standards code at candidates[${idx}]: ${candidate.code}`);
      }
      if (!Array.isArray(candidate.suggestedICan) || candidate.suggestedICan.length === 0) {
        errors.push(`candidates[${idx}] must have at least one suggestedICan statement`);
      }
      if (candidate.confidence < 0.7) {
        warnings.push(`Low confidence for standard ${candidate.code}: ${candidate.confidence}`);
      }
    });
  }
  
  const confResult = validateConfidenceNotes(output);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [...warnings, ...confResult.warnings],
  };
}

// Validate Slide Plan Output
export function validateSlidePlanOutput(data: unknown): ValidationResult {
  const metaResult = validateMeta(data);
  if (!metaResult.valid) return metaResult;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const output = data as SlidePlanOutput;
  
  if (!output.deckPlan) {
    errors.push('Missing deckPlan');
  } else {
    if (!output.deckPlan.templateId) errors.push('Missing deckPlan.templateId');
    if (!output.deckPlan.themeId) errors.push('Missing deckPlan.themeId');
    
    if (!Array.isArray(output.deckPlan.slides)) {
      errors.push('Missing deckPlan.slides array');
    } else {
      if (output.deckPlan.slides.length < 10) {
        warnings.push('Deck has fewer than 10 slides');
      }
      
      output.deckPlan.slides.forEach((slide, idx) => {
        if (!validateSlideType(slide.type)) {
          errors.push(`Invalid slide type at slides[${idx}]: ${slide.type}`);
        }
        if (!slide.content || typeof slide.content !== 'object') {
          errors.push(`Missing content at slides[${idx}]`);
        }
        if (slide.confidence < 0.7) {
          warnings.push(`Low confidence for slide ${idx} (${slide.type}): ${slide.confidence}`);
        }
      });
    }
  }
  
  const confResult = validateConfidenceNotes(output);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [...warnings, ...confResult.warnings],
  };
}

// Master validator - routes to specific validator based on call type
export function validateLLMResponse(
  type: LLMCallType,
  data: unknown,
  allowedStandards?: StandardBenchmark[]
): ValidationResult {
  switch (type) {
    case 'ocr_normalizer':
      return validateOcrNormalizerOutput(data);
    case 'chunk_classifier':
      return validateChunkClassifierOutput(data);
    case 'lesson_focus_extractor':
      return validateLessonFocusExtractorOutput(data);
    case 'merge_override':
      return validateMeta(data); // Basic validation for now
    case 'standards_candidates':
      if (!allowedStandards) {
        return { valid: false, errors: ['allowedStandards required for validation'], warnings: [] };
      }
      return validateStandardsCandidatesOutput(data, allowedStandards);
    case 'standards_aligned_questions':
      return validateMeta(data); // Basic validation for now
    case 'slide_plan':
      return validateSlidePlanOutput(data);
    case 'json_repair':
      return validateMeta(data); // Basic validation
    default:
      return { valid: false, errors: [`Unknown LLM call type: ${type}`], warnings: [] };
  }
}
