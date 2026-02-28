import { LessonTemplate } from '../types';

export const kindergartenTemplate: LessonTemplate = {
  id: 'kindergarten-1',
  name: 'Interactive Kindergarten ELA',
  subject: 'English Language Arts',
  grade: 'K-1',
  createdAt: '2026-02-19',
  updatedAt: '2026-02-19',
  style: 'kindergarten',
  slides: [
    {
      id: 'slide-1',
      type: 'title',
      title: 'Welcome Readers!',
      subtitle: 'Get your brain ready to learn!',
      content: '',
      showMascot: true
    },
    {
      id: 'slide-2',
      type: 'objectives',
      title: "Today's Learning Goals",
      subtitle: 'What we will learn together',
      content: '',
      showMascot: true,
      items: [
        'We will learn new letters and sounds',
        'We will read fun stories together',
        'We will practice writing our words',
        'We will share our ideas with friends'
      ]
    },
    {
      id: 'slide-3',
      type: 'vocabulary',
      title: 'New Words to Learn',
      subtitle: 'Let\'s learn these special words!',
      content: '',
      showMascot: true,
      items: [
        'Sound - The noise letters make',
        'Letter - The symbols we use to write',
        'Word - Letters put together to mean something',
        'Story - Words that tell us about something fun'
      ]
    },
    {
      id: 'slide-4',
      type: 'content',
      title: 'Letter of the Day: B',
      subtitle: 'B says "buh"',
      content: 'Can you think of words that start with B?',
      showMascot: true,
      items: [
        '🐻 Bear',
        '🎈 Balloon', 
        '📚 Book',
        '🦋 Butterfly'
      ]
    },
    {
      id: 'slide-5',
      type: 'reading',
      title: 'Story Time!',
      subtitle: 'Listen carefully to our story',
      content: 'The little bird loved to read books. Every day, the bird would find a cozy spot under a tree and open a new book. The bird learned about faraway places, magical friends, and exciting adventures. Reading made the little bird very happy!',
      showMascot: true
    },
    {
      id: 'slide-6',
      type: 'discussion',
      title: 'Let\'s Talk About It',
      subtitle: 'Raise your hand to share!',
      content: '',
      showMascot: true,
      items: [
        'What did the little bird love to do?',
        'Where did the bird like to read?',
        'What do you like to read about?',
        'How does reading make you feel?'
      ]
    },
    {
      id: 'slide-7',
      type: 'activity',
      title: 'Time to Practice!',
      subtitle: 'Let\'s try together',
      content: 'Find all the things that start with B',
      showMascot: true,
      items: [
        'Look at the pictures on your worksheet',
        'Circle all the things that start with B',
        'Say the "buh" sound when you find one',
        'Share what you found with a friend'
      ]
    },
    {
      id: 'slide-8',
      type: 'summary',
      title: 'Great Job Today!',
      subtitle: 'You are amazing readers!',
      content: 'Before we go, let\'s remember what we learned',
      showMascot: true,
      items: [
        'What letter did we learn today?',
        'What sound does it make?',
        'What was your favorite part of the story?'
      ]
    }
  ]
};