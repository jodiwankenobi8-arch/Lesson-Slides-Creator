import { KindergartenLessonData } from '../types/lesson-types';
import { Slide } from '../types';

/**
 * Generates slides dynamically based on the kindergarten lesson data.
 * The number of slides varies per lesson depending on:
 * - Number of UFLI slides uploaded (PowerPoint or screenshots)
 * - Number of sight words (typically 4, but can vary)
 * - Number of book pages uploaded
 * - Number of vocabulary words
 * - Number of discussion questions
 */
export function generateKindergartenSlides(data: KindergartenLessonData): Slide[] {
  const slides: Slide[] = [];
  let slideIndex = 0;

  // ============================================
  // INTRODUCTION & SONGS SECTION
  // ============================================
  
  // Slide 0: Welcome/Title slide
  slides.push({
    id: `slide-${slideIndex++}`,
    type: 'title',
    title: `Day ${data.dayNumber}`,
    subtitle: `${data.phonicsConcept} • ${data.storyTitle}`,
    content: `Date: ${new Date(data.date).toLocaleDateString()}`,
    showMascot: true,
  });

  // Slide 1: Learning Targets
  slides.push({
    id: `slide-${slideIndex++}`,
    type: 'objectives',
    title: 'Learning Targets',
    items: [
      `UFLI Lesson ${data.ufliLessonNumber} - Day ${data.dayNumber}`,
      `Phonics: ${data.phonicsConcept}`,
      `Sight Words: ${data.sightWords.map(w => w.word).filter(Boolean).join(', ') || 'TBD'}`,
      `Reading: ${data.storyTitle}`,
      `Comprehension: ${data.comprehensionTopic}`,
    ],
    showMascot: true,
  });

  // Songs (3 slides - one for each song)
  const songs = [data.songs.song1, data.songs.song2, data.songs.song3];
  songs.forEach((song) => {
    if (song.title) {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'video',
        title: song.title,
        videoUrl: song.youtubeUrl,
        showMascot: true,
      });
    }
  });

  // Transition to UFLI
  slides.push({
    id: `slide-${slideIndex++}`,
    type: 'content',
    title: 'Time for Phonics!',
    content: `Day ${data.dayNumber}`,
    showMascot: true,
  });

  // Progress Tracker
  slides.push({
    id: `slide-${slideIndex++}`,
    type: 'progress',
    title: 'Today\'s Phonics Activities',
    items: [
      `Phonemic Awareness - ${data.ufli.phonemicAwarenessTime} min`,
      `Visual Drill - ${data.ufli.visualDrillTime} min`,
      `Auditory Drill - ${data.ufli.auditoryDrillTime} min`,
      `Blending Drill - ${data.ufli.blendingDrillTime} min`,
      `New Concept - ${data.ufli.newConceptTime} min`,
    ],
    showMascot: false,
  });

  // ============================================
  // UFLI PHONICS LESSON SECTION (VARIABLE COUNT)
  // ============================================
  
  // UFLI Title Slide
  slides.push({
    id: `slide-${slideIndex++}`,
    type: 'section',
    title: 'UFLI Phonics',
    subtitle: `Lesson ${data.ufliLessonNumber} - Day ${data.dayNumber}`,
    content: data.phonicsConcept,
    showMascot: false,
  });

  // UFLI Activity Slides (from PowerPoint or screenshots)
  if (data.ufli.powerpointFile) {
    // PowerPoint uploaded - slides will be extracted from the file
    // For now, create placeholder slides indicating PowerPoint content
    slides.push({
      id: `slide-${slideIndex++}`,
      type: 'ufli-activity',
      title: 'UFLI Activities',
      content: 'Content from uploaded PowerPoint',
      showMascot: false,
      metadata: {
        sourceType: 'powerpoint',
        file: data.ufli.powerpointFile,
      },
    });
  } else if (data.ufli.screenshots && data.ufli.screenshots.length > 0) {
    // Screenshots uploaded - create one slide per screenshot
    data.ufli.screenshots.forEach((screenshot, index) => {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'ufli-activity',
        title: screenshot.slideType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        content: `Screenshot ${index + 1}`,
        showMascot: false,
        metadata: {
          sourceType: 'screenshot',
          screenshot: screenshot.file,
          slideType: screenshot.slideType,
        },
      });
    });
  } else {
    // No uploads - create default UFLI structure with placeholders
    // This is a fallback for when users haven't uploaded content yet
    
    // Phonemic Awareness (variable, default 10)
    for (let i = 0; i < 10; i++) {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'ufli-activity',
        title: 'Phonemic Awareness',
        content: `Activity ${i + 1}`,
        showMascot: false,
        metadata: { activityType: 'phonemic-awareness' },
      });
    }

    // Visual Drill (16 letters or auto-detected)
    const letterCount = data.ufli.visualDrillLetters?.length || 16;
    for (let i = 0; i < letterCount; i++) {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'ufli-activity',
        title: 'Visual Drill',
        content: data.ufli.visualDrillLetters?.[i]?.letter || `Letter ${i + 1}`,
        showMascot: false,
        metadata: {
          activityType: 'visual-drill',
          letterIndex: i,
          youtubeUrl: data.ufli.visualDrillLetters?.[i]?.youtubeUrl,
        },
      });
    }

    // Auditory Drill (variable, default 10)
    for (let i = 0; i < 10; i++) {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'ufli-activity',
        title: 'Auditory Drill',
        content: `Sound ${i + 1}`,
        showMascot: false,
        metadata: { activityType: 'auditory-drill' },
      });
    }

    // Blending Drill (variable, default 8)
    for (let i = 0; i < 8; i++) {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'ufli-activity',
        title: 'Blending Drill',
        content: `Word ${i + 1}`,
        showMascot: false,
        metadata: { activityType: 'blending-drill' },
      });
    }

    // New Concept (variable, default 8)
    for (let i = 0; i < 8; i++) {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'ufli-activity',
        title: `New Concept: ${data.phonicsConcept}`,
        content: `Slide ${i + 1}`,
        showMascot: false,
        metadata: { activityType: 'new-concept' },
      });
    }
  }

  // ============================================
  // SIGHT WORDS SECTION (VARIABLE COUNT)
  // ============================================
  
  // Only add sight words section if there are sight words
  const validSightWords = data.sightWords.filter(w => w.word.trim() !== '');
  
  if (validSightWords.length > 0) {
    // Sight Words Title
    slides.push({
      id: `slide-${slideIndex++}`,
      type: 'section',
      title: 'Sight Words',
      subtitle: 'Words We Know!',
      showMascot: true,
    });

    // Individual sight words (2 slides per word: intro + video/practice)
    validSightWords.forEach((word) => {
      // Introduction slide
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'sight-word-intro',
        title: word.word,
        content: word.word,
        showMascot: true,
      });

      // Video/practice slide (if video provided)
      if (word.youtubeUrl || word.videoFile) {
        slides.push({
          id: `slide-${slideIndex++}`,
          type: 'video',
          title: `Let's Learn: ${word.word}`,
          videoUrl: word.youtubeUrl,
          showMascot: false,
          metadata: {
            videoFile: word.videoFile,
          },
        });
      }
    });
  }

  // ============================================
  // SAVVAS READING SECTION (VARIABLE COUNT)
  // ============================================
  
  // Savvas Reading Title
  slides.push({
    id: `slide-${slideIndex++}`,
    type: 'section',
    title: 'Story Time!',
    subtitle: data.storyTitle,
    content: `Unit ${data.savvasUnit} • Week ${data.savvasWeek} • Day ${data.savvasDay || 1}`,
    showMascot: true,
  });

  // Vocabulary Section (if vocabulary words exist)
  const validVocab = data.savvas.vocabulary.filter(v => v.word.trim() !== '');
  
  if (validVocab.length > 0) {
    // Vocabulary Introduction
    slides.push({
      id: `slide-${slideIndex++}`,
      type: 'vocabulary',
      title: 'New Words',
      items: validVocab.map(v => v.word),
      showMascot: true,
    });

    // Individual vocabulary words with definitions
    validVocab.forEach((vocab) => {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'vocabulary-detail',
        title: vocab.word,
        content: vocab.definition || '',
        showMascot: false,
        metadata: {
          image: vocab.image,
        },
      });
    });
  }

  // Book Pages (one slide per page)
  data.savvas.bookPages.forEach((page, index) => {
    // Get the image from localStorage if it exists
    const imageKey = `book-page-${page.id}`;
    const imageDataUrl = typeof window !== 'undefined' ? localStorage.getItem(imageKey) : null;
    
    if (imageDataUrl || page.imageData) {
      slides.push({
        id: `slide-${slideIndex++}`,
        type: 'book-page',
        title: data.storyTitle,
        content: `Page ${page.pageNumber || index + 1}`,
        showMascot: false,
        metadata: {
          pageIndex: index,
          image: imageDataUrl || undefined,
        },
      });
    }
  });

  // Comprehension Topic
  slides.push({
    id: `slide-${slideIndex++}`,
    type: 'content',
    title: data.comprehensionTopic,
    content: 'Let\'s think about what we read!',
    showMascot: true,
  });

  // Discussion Questions (split across slides if needed, max 3-4 per slide)
  const questionsPerSlide = 3;
  const validQuestions = data.savvas.discussionQuestions.filter(q => q.trim() !== '');
  
  for (let i = 0; i < validQuestions.length; i += questionsPerSlide) {
    const questionBatch = validQuestions.slice(i, i + questionsPerSlide);
    slides.push({
      id: `slide-${slideIndex++}`,
      type: 'discussion',
      title: 'Let\'s Talk About It',
      items: questionBatch,
      showMascot: true,
    });
  }

  // ============================================
  // CELEBRATION SECTION
  // ============================================
  
  if (data.celebration.enabled) {
    slides.push({
      id: `slide-${slideIndex++}`,
      type: 'celebration',
      title: 'Great Job Today!',
      content: 'You learned so much!',
      showMascot: true,
    });

    slides.push({
      id: `slide-${slideIndex++}`,
      type: 'content',
      title: 'What We Learned',
      items: [
        `Phonics: ${data.phonicsConcept}`,
        validSightWords.length > 0 ? `Sight Words: ${validSightWords.map(w => w.word).join(', ')}` : '',
        `Story: ${data.storyTitle}`,
      ].filter(Boolean),
      showMascot: true,
    });

    slides.push({
      id: `slide-${slideIndex++}`,
      type: 'celebration',
      title: 'See You Tomorrow!',
      content: '🎉 Keep being awesome readers! 🎉',
      showMascot: true,
    });
  }

  return slides;
}