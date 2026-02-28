import { LessonFormData, Slide, LessonTemplate } from '../types';

export function formDataToSlides(formData: LessonFormData): LessonTemplate {
  const slides: Slide[] = [];

  // Title Slide
  slides.push({
    id: `slide-${slides.length + 1}`,
    type: 'title',
    title: formData.welcomeTitle || 'Welcome Readers!',
    subtitle: formData.welcomeSubtitle || 'Get your brain ready to learn!',
    content: '',
    showMascot: true
  });

  // Learning Objectives
  if (formData.objectives.length > 0) {
    slides.push({
      id: `slide-${slides.length + 1}`,
      type: 'objectives',
      title: "Today's Learning Goals",
      subtitle: 'What we will learn together',
      content: '',
      showMascot: true,
      items: formData.objectives.filter(obj => obj.trim() !== '')
    });
  }

  // Vocabulary
  if (formData.vocabulary.length > 0) {
    slides.push({
      id: `slide-${slides.length + 1}`,
      type: 'vocabulary',
      title: 'New Words to Learn',
      subtitle: "Let's learn these special words!",
      content: '',
      showMascot: true,
      items: formData.vocabulary.filter(vocab => vocab.trim() !== '')
    });
  }

  // Content Sections
  formData.contentSections.forEach(section => {
    if (section.title.trim() !== '') {
      slides.push({
        id: `slide-${slides.length + 1}`,
        type: 'content',
        title: section.title,
        subtitle: section.subtitle || '',
        content: section.content || '',
        showMascot: true,
        items: section.items.filter(item => item.trim() !== '')
      });
    }
  });

  // Reading Passage
  if (formData.readingPassage && formData.readingPassage.text.trim() !== '') {
    slides.push({
      id: `slide-${slides.length + 1}`,
      type: 'reading',
      title: formData.readingPassage.title || 'Story Time!',
      subtitle: 'Listen carefully to our story',
      content: formData.readingPassage.text,
      showMascot: true
    });
  }

  // Discussion Questions
  if (formData.discussionQuestions.length > 0) {
    slides.push({
      id: `slide-${slides.length + 1}`,
      type: 'discussion',
      title: "Let's Talk About It",
      subtitle: 'Raise your hand to share!',
      content: '',
      showMascot: true,
      items: formData.discussionQuestions.filter(q => q.trim() !== '')
    });
  }

  // Activity
  if (formData.activity && formData.activity.title.trim() !== '') {
    slides.push({
      id: `slide-${slides.length + 1}`,
      type: 'activity',
      title: formData.activity.title,
      subtitle: "Let's try together",
      content: '',
      showMascot: true,
      items: formData.activity.instructions.filter(inst => inst.trim() !== '')
    });
  }

  // Exit Ticket
  if (formData.exitTicketQuestions.length > 0) {
    slides.push({
      id: `slide-${slides.length + 1}`,
      type: 'summary',
      title: 'Great Job Today!',
      subtitle: 'You are amazing readers!',
      content: 'Before we go, let\'s remember what we learned',
      showMascot: true,
      items: formData.exitTicketQuestions.filter(q => q.trim() !== '')
    });
  }

  return {
    id: `lesson-${Date.now()}`,
    name: formData.lessonName || 'New Kindergarten Lesson',
    subject: formData.subject || 'English Language Arts',
    grade: formData.grade || 'K-1',
    slides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    style: 'kindergarten'
  };
}
