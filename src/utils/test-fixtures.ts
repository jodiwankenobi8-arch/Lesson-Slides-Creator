/**
 * Test Fixtures
 * 
 * Deterministic test data for automated testing
 */

export const TEST_LESSON_DATA = {
  // Basic phonics lesson
  phonicsOnly: {
    name: 'Test: Phonics Only',
    subject: 'ela',
    gradeLevel: 'k',
    ufliLessonNumber: '15',
    phonicsConcept: '/sh/ digraph',
    phonicsWords: ['ship', 'shop', 'shut', 'she', 'shell'],
    irregularWords: ['the', 'of'],
    vocabWords: [],
    storyTitle: '',
    comprehensionQuestions: [],
  },
  
  // Full lesson with vocab
  fullLesson: {
    name: 'Test: Full Lesson',
    subject: 'ela',
    gradeLevel: 'k',
    ufliLessonNumber: '20',
    savvasUnit: '2',
    phonicsConcept: '/ch/ digraph',
    phonicsWords: ['chip', 'chop', 'chat', 'chin', 'chug'],
    irregularWords: ['they', 'was'],
    vocabWords: ['community', 'neighborhood', 'celebrate'],
    storyTitle: 'The Big Parade',
    comprehensionQuestions: [
      'Who was in the parade?',
      'What did they celebrate?',
      'How did the community help?'
    ],
  },
  
  // Single vocab word edge case
  singleVocab: {
    name: 'Test: Single Vocab',
    subject: 'ela',
    gradeLevel: 'k',
    ufliLessonNumber: '10',
    phonicsConcept: '/m/ sound',
    phonicsWords: ['map', 'mat', 'mom', 'mop'],
    irregularWords: ['I', 'a'],
    vocabWords: ['magnificent'],
    storyTitle: '',
    comprehensionQuestions: [],
  },
  
  // Empty edge case (should fail isEmpty check)
  emptyLesson: {
    name: 'Test: Empty Lesson',
    subject: 'ela',
    gradeLevel: 'k',
    ufliLessonNumber: '',
    phonicsConcept: '',
    phonicsWords: [],
    irregularWords: [],
    vocabWords: [],
    storyTitle: '',
    comprehensionQuestions: [],
  }
};

/**
 * Create a deterministic lesson ID for testing
 */
export function createTestLessonId(testName: string): string {
  return `test-lesson-${testName}-${Date.now()}`;
}

/**
 * Create minimal test file for upload simulation
 */
export function createTestFile(content: string, filename: string): File {
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], filename, { type: 'text/plain' });
}

/**
 * Deterministic test file content
 */
export const TEST_FILE_CONTENT = {
  phonicsPassage: `The Fish Shop
  
  Shawn went to the fish shop. He got a shell and a shrimp.
  The shop had a dish with fresh fish. Shawn was so glad!
  
  Focus: /sh/ digraph
  Words: shop, shell, shrimp, dish, fresh, Shawn`,
  
  vocabStory: `The Community Celebration
  
  The neighborhood came together to celebrate. Everyone in the community helped.
  They had a parade with music and dancing. It was magnificent!
  
  Vocabulary: community, neighborhood, celebrate, magnificent
  Comprehension: Who celebrated? What did they do? How did the community help?`
};
