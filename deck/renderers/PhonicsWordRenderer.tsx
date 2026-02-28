// Phonics word renderer - driven by phonics tokens, not hardcoded rules

import type { ReactNode } from 'react';
import { getSafeAnnotations, ALLOWED_PHONICS_KINDS } from './phonicsAnnotationSchema';
import type { PhonicsAnnotation, PhonicsKind } from './phonicsAnnotationSchema';

export type { PhonicsAnnotation, PhonicsKind };
export { ALLOWED_PHONICS_KINDS };

export interface PhonicsWordProps {
  word: string;
  annotations?: PhonicsAnnotation[];
  fontSize?: string;
  className?: string;
}

/**
 * Renders a word with phonics highlighting based on annotations.
 * Annotations are DATA-DRIVEN from the lesson focus, not regex-based.
 * 
 * GUARDRAILS:
 * 1. All annotations validated against schema (kind allowed-list, no overlaps)
 * 2. If no annotations provided → renders PLAIN TEXT (no regex guessing)
 * 3. Invalid annotations → logs error + renders plain text
 * 
 * Example:
 * - "cake" with long_a pattern:
 *   annotations: [
 *     { start: 1, end: 2, kind: 'vowel' },      // 'a'
 *     { start: 3, end: 4, kind: 'silent_e' },   // 'e'
 *   ]
 * 
 * - "boat" with 'oa' vowel team:
 *   annotations: [
 *     { start: 1, end: 3, kind: 'vowel_team' }  // 'oa' as one unit
 *   ]
 */
export function PhonicsWordRenderer({ 
  word, 
  annotations = [], 
  fontSize = '4xl',
  className = '',
}: PhonicsWordProps) {
  // GUARDRAIL #2: No annotations → plain text, NO regex guessing
  const safeAnnotations = getSafeAnnotations(word, annotations);
  
  if (safeAnnotations.length === 0) {
    // Render plain (no highlighting)
    return (
      <span className={`text-${fontSize} font-bold ${className}`}>
        {word}
      </span>
    );
  }

  // Build segments with validated annotations
  const chars = word.split('');
  const segments: ReactNode[] = [];
  let currentIndex = 0;

  // Sort annotations by start position
  const sortedAnnotations = [...safeAnnotations].sort((a, b) => a.start - b.start);

  sortedAnnotations.forEach((annotation, idx) => {
    // Add any un-annotated chars before this annotation
    if (currentIndex < annotation.start) {
      segments.push(
        <span key={`plain-${idx}`} className="text-gray-900">
          {chars.slice(currentIndex, annotation.start).join('')}
        </span>
      );
    }

    // Add the annotated segment
    const text = chars.slice(annotation.start, annotation.end).join('');
    const { className: colorClass, style } = getColorClass(annotation.kind);
    
    segments.push(
      <span key={`annotated-${idx}`} className={colorClass} style={style}>
        {text}
      </span>
    );

    currentIndex = annotation.end;
  });

  // Add any remaining un-annotated chars
  if (currentIndex < chars.length) {
    segments.push(
      <span key="plain-end" className="text-gray-900">
        {chars.slice(currentIndex).join('')}
      </span>
    );
  }

  return (
    <span className={`text-${fontSize} font-bold ${className}`}>
      {segments}
    </span>
  );
}

function getColorClass(kind: PhonicsKind): { className: string; style?: React.CSSProperties } {
  // Use theme colors from tokens.ts
  switch (kind) {
    case 'vowel':
      return { className: 'text-red-600 font-bold' }; // theme vowel color
    case 'vowel_team':
    case 'digraph':
      return { className: 'text-green-600 font-bold underline' }; // theme digraph color
    case 'r_controlled':
      return { className: 'font-bold', style: { color: 'var(--ao-red)' } }; // r-controlled distinct
    case 'blend':
      return { className: 'font-bold', style: { color: 'var(--ao-navy)' } }; // theme blend color
    case 'silent_e':
      return { className: 'text-gray-400 line-through' }; // silent letters
    case 'diphthong':
      return { className: 'font-bold', style: { color: 'var(--ao-tan)' } }; // diphthongs distinct
    case 'trigraph':
      return { className: 'font-bold underline', style: { color: 'var(--ao-sky)' } }; // trigraphs
    case 'schwa':
      return { className: '', style: { color: 'var(--ao-tan)' } }; // schwa (unstressed)
    case 'consonant':
    default:
      return { className: 'text-gray-900' };
  }
}