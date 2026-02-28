// PHONICS ANNOTATION SCHEMA — Stable, pattern-driven, validator-enforced

/**
 * ALLOWED annotation kinds — validator rejects anything not in this list
 * DO NOT let LLM output arbitrary kinds
 */
export const ALLOWED_PHONICS_KINDS = [
  'vowel',           // single vowel (a, e, i, o, u)
  'consonant',       // single consonant
  'digraph',         // two letters, one sound (sh, ch, th, wh, ph, ck, ng)
  'vowel_team',      // vowel digraph (ai, ea, oa, ee, etc.)
  'r_controlled',    // r-controlled vowel (ar, er, ir, or, ur)
  'blend',           // consonant blend (bl, cr, st, etc.)
  'silent_e',        // magic e marker
  'diphthong',       // oi, oy, ou, ow
  'trigraph',        // three letters, one sound (tch, dge)
  'schwa',           // unstressed vowel
] as const;

export type PhonicsKind = typeof ALLOWED_PHONICS_KINDS[number];

/**
 * Annotation range with strict validation
 */
export interface PhonicsAnnotation {
  start: number;     // character index (0-based)
  end: number;       // character index (exclusive)
  kind: PhonicsKind; // must be from allowed list
  pattern?: string;  // optional: actual pattern ("a_e", "oa", "sh", etc.)
}

/**
 * Word with annotations
 */
export interface AnnotatedWord {
  word: string;
  annotations: PhonicsAnnotation[];
}

/**
 * Validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validate phonics annotations for a word
 * 
 * Rules:
 * 1. No overlaps (unless explicitly multi-layer in future)
 * 2. All kinds must be in allowed list
 * 3. Ranges must be within word bounds
 * 4. start < end
 */
export function validatePhonicsAnnotations(
  word: string,
  annotations: PhonicsAnnotation[]
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!word || word.length === 0) {
    errors.push({
      field: 'word',
      message: 'Word cannot be empty',
      value: word,
    });
    return { valid: false, errors };
  }

  // Check each annotation
  for (let i = 0; i < annotations.length; i++) {
    const anno = annotations[i];

    // 1. Validate kind
    if (!ALLOWED_PHONICS_KINDS.includes(anno.kind)) {
      errors.push({
        field: `annotations[${i}].kind`,
        message: `Invalid phonics kind. Must be one of: ${ALLOWED_PHONICS_KINDS.join(', ')}`,
        value: anno.kind,
      });
    }

    // 2. Validate range bounds
    if (anno.start < 0) {
      errors.push({
        field: `annotations[${i}].start`,
        message: 'Start index cannot be negative',
        value: anno.start,
      });
    }

    if (anno.end > word.length) {
      errors.push({
        field: `annotations[${i}].end`,
        message: `End index ${anno.end} exceeds word length ${word.length}`,
        value: anno.end,
      });
    }

    if (anno.start >= anno.end) {
      errors.push({
        field: `annotations[${i}]`,
        message: 'Start must be less than end',
        value: { start: anno.start, end: anno.end },
      });
    }

    // 3. Check for overlaps with other annotations
    for (let j = i + 1; j < annotations.length; j++) {
      const other = annotations[j];
      
      // Check if ranges overlap
      const overlaps = (
        (anno.start < other.end && anno.end > other.start) ||
        (other.start < anno.end && other.end > anno.start)
      );

      if (overlaps) {
        errors.push({
          field: `annotations[${i}] and annotations[${j}]`,
          message: `Overlapping annotations are not allowed: [${anno.start},${anno.end}) overlaps [${other.start},${other.end})`,
          value: { anno, other },
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Safe annotation renderer — validates before rendering
 * Returns either valid annotations or empty array
 */
export function getSafeAnnotations(
  word: string,
  annotations?: PhonicsAnnotation[]
): PhonicsAnnotation[] {
  if (!annotations || annotations.length === 0) {
    return [];
  }

  const validation = validatePhonicsAnnotations(word, annotations);
  
  if (!validation.valid) {
    console.error('Invalid phonics annotations:', validation.errors);
    // Return empty array instead of crashing
    return [];
  }

  return annotations;
}
