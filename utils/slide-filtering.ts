/**
 * Smart Slide Filtering Logic
 * 
 * Filters slides based on lesson setup:
 * - UFLI day logic (Day 1 vs Day 2)
 * - Savvas day logic (Days 1-5)
 * - Time-based filtering (20min, 30min, 45min+)
 */

import type { LessonSetup } from '../types/lesson-setup-types';

export interface SlideTemplate {
  number: number;
  title: string;
  type: string;
  duration: string;
  durationMinutes: number;
  tags: string[];
  ufliDay?: 1 | 2;
  savvasDay?: 1 | 2 | 3 | 4 | 5;
  priority: 'core' | 'guided' | 'extended';
}

/**
 * Generate slides based on UFLI day logic
 */
export function generateSlidesForUFLIDay(
  day: 1 | 2,
  includeDictation: boolean,
  includeDecodableText: boolean,
  includeFluencyPractice: boolean,
  includePartnerReading: boolean
): SlideTemplate[] {
  const baseSlides: SlideTemplate[] = [
    {
      number: 1,
      title: 'Learning Target',
      type: 'Objective',
      duration: '1 min',
      durationMinutes: 1,
      tags: ['objective'],
      ufliDay: 1,
      priority: 'core',
    },
  ];

  if (day === 1) {
    // Day 1: Include new skill introduction and modeling
    baseSlides.push(
      {
        number: 2,
        title: 'New Skill Introduction',
        type: 'Instruction',
        duration: '3 min',
        durationMinutes: 3,
        tags: ['phonics', 'intro'],
        ufliDay: 1,
        priority: 'core',
      },
      {
        number: 3,
        title: 'Phonics Modeling',
        type: 'Instruction',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['phonics', 'modeling'],
        ufliDay: 1,
        priority: 'core',
      },
      {
        number: 4,
        title: 'Guided Practice',
        type: 'Practice',
        duration: '4 min',
        durationMinutes: 4,
        tags: ['practice'],
        ufliDay: 1,
        priority: 'guided',
      },
      {
        number: 5,
        title: 'Sight Words',
        type: 'Instruction',
        duration: '3 min',
        durationMinutes: 3,
        tags: ['sight-words'],
        ufliDay: 1,
        priority: 'core',
      }
    );
  } else {
    // Day 2: Exclude new concept slides, include practice and optional components
    baseSlides.push(
      {
        number: 2,
        title: 'Phonics Review',
        type: 'Review',
        duration: '3 min',
        durationMinutes: 3,
        tags: ['phonics', 'review'],
        ufliDay: 2,
        priority: 'core',
      },
      {
        number: 3,
        title: 'Phonics Practice',
        type: 'Practice',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['phonics', 'practice'],
        ufliDay: 2,
        priority: 'core',
      }
    );

    if (includeDictation) {
      baseSlides.push({
        number: baseSlides.length + 1,
        title: 'Dictation',
        type: 'Practice',
        duration: '4 min',
        durationMinutes: 4,
        tags: ['dictation', 'writing'],
        ufliDay: 2,
        priority: 'guided',
      });
    }

    if (includeDecodableText) {
      baseSlides.push({
        number: baseSlides.length + 1,
        title: 'Decodable Text',
        type: 'Reading',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['reading', 'decodable'],
        ufliDay: 2,
        priority: 'guided',
      });
    }

    if (includeFluencyPractice) {
      baseSlides.push({
        number: baseSlides.length + 1,
        title: 'Fluency Practice',
        type: 'Practice',
        duration: '3 min',
        durationMinutes: 3,
        tags: ['fluency', 'reading'],
        ufliDay: 2,
        priority: 'extended',
      });
    }

    if (includePartnerReading) {
      baseSlides.push({
        number: baseSlides.length + 1,
        title: 'Partner Reading',
        type: 'Practice',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['reading', 'partner'],
        ufliDay: 2,
        priority: 'extended',
      });
    }
  }

  // Add closing slide
  baseSlides.push({
    number: baseSlides.length + 1,
    title: 'Exit Ticket',
    type: 'Assessment',
    duration: '3 min',
    durationMinutes: 3,
    tags: ['assessment'],
    ufliDay: day,
    priority: 'core',
  });

  return baseSlides;
}

/**
 * Generate slides based on Savvas day logic
 */
export function generateSlidesForSavvasDay(
  day: 1 | 2 | 3 | 4 | 5,
  includeReadAloud: boolean,
  includeVocabulary: boolean,
  includeComprehensionSkill: boolean,
  includeSharedReading: boolean
): SlideTemplate[] {
  const baseSlides: SlideTemplate[] = [
    {
      number: 1,
      title: 'Learning Target',
      type: 'Objective',
      duration: '1 min',
      durationMinutes: 1,
      tags: ['objective'],
      savvasDay: day,
      priority: 'core',
    },
  ];

  if (day === 1 || day === 2) {
    // Days 1-2: Emphasize phonics & decoding
    baseSlides.push(
      {
        number: 2,
        title: 'Phonics Introduction',
        type: 'Instruction',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['phonics'],
        savvasDay: day,
        priority: 'core',
      },
      {
        number: 3,
        title: 'Decoding Practice',
        type: 'Practice',
        duration: '4 min',
        durationMinutes: 4,
        tags: ['phonics', 'decoding'],
        savvasDay: day,
        priority: 'core',
      }
    );
  }

  if (day === 3 || day === 4) {
    // Days 3-4: Emphasize comprehension & vocabulary
    if (includeVocabulary) {
      baseSlides.push({
        number: baseSlides.length + 1,
        title: 'Vocabulary Introduction',
        type: 'Vocabulary',
        duration: '4 min',
        durationMinutes: 4,
        tags: ['vocabulary'],
        savvasDay: day,
        priority: 'core',
      });
    }

    if (includeComprehensionSkill) {
      baseSlides.push({
        number: baseSlides.length + 1,
        title: 'Comprehension Skill',
        type: 'Comprehension',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['comprehension'],
        savvasDay: day,
        priority: 'core',
      });
    }

    if (includeReadAloud) {
      baseSlides.push({
        number: baseSlides.length + 1,
        title: 'Read-Aloud',
        type: 'Reading',
        duration: '6 min',
        durationMinutes: 6,
        tags: ['reading', 'read-aloud'],
        savvasDay: day,
        priority: 'guided',
      });
    }
  }

  if (day === 5) {
    // Day 5: Emphasize review & application
    baseSlides.push(
      {
        number: baseSlides.length + 1,
        title: 'Weekly Review',
        type: 'Review',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['review'],
        savvasDay: 5,
        priority: 'core',
      },
      {
        number: baseSlides.length + 1,
        title: 'Application Activity',
        type: 'Practice',
        duration: '6 min',
        durationMinutes: 6,
        tags: ['application'],
        savvasDay: 5,
        priority: 'guided',
      }
    );
  }

  if (includeSharedReading) {
    baseSlides.push({
      number: baseSlides.length + 1,
      title: 'Shared Reading',
      type: 'Reading',
      duration: '5 min',
      durationMinutes: 5,
      tags: ['reading', 'shared'],
      savvasDay: day,
      priority: 'extended',
    });
  }

  // Add closing slide
  baseSlides.push({
    number: baseSlides.length + 1,
    title: 'Exit Ticket',
    type: 'Assessment',
    duration: '3 min',
    durationMinutes: 3,
    tags: ['assessment'],
    savvasDay: day,
    priority: 'core',
  });

  return baseSlides;
}

/**
 * Filter slides based on available time
 */
export function filterSlidesByTime(
  slides: SlideTemplate[],
  timeAvailable: string
): SlideTemplate[] {
  const timeMinutes = timeAvailable === 'full' ? 90 : parseInt(timeAvailable);

  if (timeMinutes <= 20) {
    // 20 min: core slides only
    return slides.filter((s) => s.priority === 'core');
  } else if (timeMinutes <= 30) {
    // 30 min: core + guided practice
    return slides.filter((s) => s.priority === 'core' || s.priority === 'guided');
  } else {
    // 45+ min: full lesson sequence
    return slides;
  }
}

/**
 * Main function: Generate slides based on complete lesson setup
 */
export function generateSlidesFromSetup(
  lessonSetup: LessonSetup,
  approvedReviewContent?: {
    phonicsFocus: string;
    sightWords: string[];
    vocabulary: string[];
    comprehensionFocus: string;
  }
): SlideTemplate[] {
  let slides: SlideTemplate[] = [];

  // Generate slides based on curriculum source
  if (lessonSetup.sources.ufli && lessonSetup.ufli) {
    slides = generateSlidesForUFLIDay(
      lessonSetup.ufli.day,
      lessonSetup.ufli.includeDictation,
      lessonSetup.ufli.includeDecodableText,
      lessonSetup.ufli.includeFluencyPractice,
      lessonSetup.ufli.includePartnerReading
    );
  } else if (lessonSetup.sources.savvas && lessonSetup.savvas) {
    slides = generateSlidesForSavvasDay(
      lessonSetup.savvas.day,
      lessonSetup.savvas.includeReadAloud,
      lessonSetup.savvas.includeVocabulary,
      lessonSetup.savvas.includeComprehensionSkill,
      lessonSetup.savvas.includeSharedReading
    );
  } else {
    // Default generic lesson structure
    slides = [
      {
        number: 1,
        title: 'Learning Target',
        type: 'Objective',
        duration: '1 min',
        durationMinutes: 1,
        tags: ['objective'],
        priority: 'core',
      },
      {
        number: 2,
        title: approvedReviewContent?.phonicsFocus || 'Phonics Focus',
        type: 'Instruction',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['phonics'],
        priority: 'core',
      },
      {
        number: 3,
        title: 'Phonics Practice',
        type: 'Practice',
        duration: '3 min',
        durationMinutes: 3,
        tags: ['practice'],
        priority: 'core',
      },
      {
        number: 4,
        title: 'Sight Words',
        type: 'Instruction',
        duration: '3 min',
        durationMinutes: 3,
        tags: ['sight-words'],
        priority: 'core',
      },
      {
        number: 5,
        title: 'Vocabulary',
        type: 'Vocabulary',
        duration: '4 min',
        durationMinutes: 4,
        tags: ['vocabulary'],
        priority: 'guided',
      },
      {
        number: 6,
        title: approvedReviewContent?.comprehensionFocus || 'Comprehension Focus',
        type: 'Comprehension',
        duration: '5 min',
        durationMinutes: 5,
        tags: ['comprehension'],
        priority: 'guided',
      },
      {
        number: 7,
        title: 'Exit Ticket',
        type: 'Assessment',
        duration: '3 min',
        durationMinutes: 3,
        tags: ['assessment'],
        priority: 'core',
      },
    ];
  }

  // Apply time-based filtering
  const filteredSlides = filterSlidesByTime(slides, lessonSetup.schedule.timeAvailable);

  // Renumber slides after filtering
  return filteredSlides.map((slide, index) => ({
    ...slide,
    number: index + 1,
  }));
}
