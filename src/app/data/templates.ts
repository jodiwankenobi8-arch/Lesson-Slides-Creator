import { LessonTemplate } from '../types';

export const elaTemplate: LessonTemplate = {
  id: 'ela-1',
  name: 'Narrative Elements',
  subject: 'English Language Arts',
  grade: '6-8',
  createdAt: '2026-02-19',
  updatedAt: '2026-02-19',
  style: 'standard',
  slides: [
    {
      id: 'slide-1',
      type: 'title',
      title: 'Narrative Elements',
      subtitle: 'Understanding Plot, Character, and Setting',
      content: 'English Language Arts • Grade 6-8',
      background: '#4F46E5'
    },
    {
      id: 'slide-2',
      type: 'objectives',
      title: 'Learning Objectives',
      content: 'By the end of this lesson, students will be able to:',
      items: [
        'Identify the key elements of a narrative story',
        'Analyze character development throughout a text',
        'Describe how setting influences plot events',
        'Create a plot diagram for a given narrative'
      ]
    },
    {
      id: 'slide-3',
      type: 'vocabulary',
      title: 'Key Vocabulary',
      content: 'Important terms for today\'s lesson',
      items: [
        'Exposition - The introduction of characters, setting, and conflict',
        'Rising Action - Events that build tension and develop the conflict',
        'Climax - The turning point or most intense moment',
        'Falling Action - Events after the climax leading to resolution',
        'Resolution - The conclusion where conflicts are resolved'
      ]
    },
    {
      id: 'slide-4',
      type: 'content',
      title: 'Elements of a Narrative',
      content: 'Every story contains three essential elements',
      items: [
        '📖 Plot - The sequence of events that make up the story',
        '👥 Characters - The people or beings who drive the action',
        '🏞️ Setting - The time and place where the story occurs'
      ]
    },
    {
      id: 'slide-5',
      type: 'reading',
      title: 'Reading Passage',
      content: 'The old lighthouse stood alone on the rocky cliff, its paint peeling and windows broken. Maya had heard the stories—how her grandmother used to keep the light burning every night, guiding ships safely to shore. Now, with the lighthouse abandoned for decades, Maya wondered if she could restore it to its former glory. As she pushed open the creaking door, she discovered something unexpected: a journal, its pages yellowed with age, containing her grandmother\'s adventures at sea.',
      subtitle: 'Read the passage carefully and identify the narrative elements'
    },
    {
      id: 'slide-6',
      type: 'discussion',
      title: 'Discussion Questions',
      content: 'Think critically about the reading passage:',
      items: [
        'What is the setting of this story? How does it affect the mood?',
        'What can we infer about Maya\'s character from this passage?',
        'What conflict might develop in this narrative?',
        'What role does the grandmother play in the story?'
      ]
    },
    {
      id: 'slide-7',
      type: 'activity',
      title: 'Group Activity',
      content: 'Create a Plot Diagram',
      subtitle: 'Work in groups of 3-4',
      items: [
        'Choose a familiar story or movie',
        'Identify the exposition, rising action, climax, falling action, and resolution',
        'Create a visual plot diagram on poster paper',
        'Present your diagram to the class (3 minutes)'
      ]
    },
    {
      id: 'slide-8',
      type: 'summary',
      title: 'Exit Ticket',
      content: 'Before you leave today, please answer:',
      items: [
        'Name one narrative element and explain its purpose',
        'How does understanding plot structure help you as a reader?',
        'What was the most interesting thing you learned today?'
      ]
    }
  ]
};

export const blankTemplate: LessonTemplate = {
  id: 'blank-1',
  name: 'New Lesson',
  subject: '',
  grade: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  style: 'standard',
  slides: [
    {
      id: 'slide-1',
      type: 'title',
      title: 'Lesson Title',
      subtitle: 'Subtitle or Topic',
      content: 'Subject • Grade Level',
      background: '#4F46E5'
    }
  ]
};