// Slide renderer map - maps slide types to their renderer components
import { WelcomeSlide } from './WelcomeSlide';
import { LearningTargetsSlide } from './LearningTargetsSlide';
import { JourneyNavSlide } from './JourneyNavSlide';
import { SongSlide } from './SongSlide';
import { WordPracticeSlide } from './WordPracticeSlide';
import { StoryPageSlide } from './StoryPageSlide';
import { DiscussionPromptSlide } from './DiscussionPromptSlide';
import { TurnAndTalkSlide } from './TurnAndTalkSlide';
import { ReviewExitSlide } from './ReviewExitSlide';

export const slideRenderers = {
  welcome: WelcomeSlide,
  learning_targets: LearningTargetsSlide,
  journey_nav: JourneyNavSlide,
  song: SongSlide,
  word_practice: WordPracticeSlide,
  story_page: StoryPageSlide,
  discussion_prompt: DiscussionPromptSlide,
  turn_and_talk: TurnAndTalkSlide,
  review_exit: ReviewExitSlide,
  // Add more renderers as they're built
} as const;

export type RenderedSlideType = keyof typeof slideRenderers;

export function hasRenderer(type: string): type is RenderedSlideType {
  return type in slideRenderers;
}
