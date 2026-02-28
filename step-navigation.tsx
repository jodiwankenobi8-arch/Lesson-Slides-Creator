import { Check, Lock } from 'lucide-react';
import { cn } from './ui/utils';
import { Z_INDEX } from '../utils/z-index-scale';

export type LessonStep = 1 | 2 | 3 | 4 | 5;

interface Step {
  number: LessonStep;
  name: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    name: 'Setup',
    description: 'Configure lesson details',
  },
  {
    number: 2,
    name: 'Upload',
    description: 'Add materials',
  },
  {
    number: 3,
    name: 'Review',
    description: 'Approve content',
  },
  {
    number: 4,
    name: 'Build Slides',
    description: 'Generate deck',
  },
  {
    number: 5,
    name: 'Teach Mode',
    description: 'Present lesson',
  },
];

interface StepNavigationProps {
  currentStep: LessonStep;
  completedSteps: LessonStep[];
  onStepClick?: (step: LessonStep) => void;
  setupIsComplete?: boolean; // HARD GATE: controls access to steps 2-5
}

export function StepNavigation({ 
  currentStep, 
  completedSteps,
  onStepClick,
  setupIsComplete = false // Default to false for safety
}: StepNavigationProps) {
  const isStepComplete = (stepNumber: LessonStep) => completedSteps.includes(stepNumber);
  const isStepCurrent = (stepNumber: LessonStep) => stepNumber === currentStep;
  const isStepAccessible = (stepNumber: LessonStep) => {
    // HARD GATE: Steps 2-5 are LOCKED until setup is complete
    if (stepNumber > 1 && !setupIsComplete) {
      return false;
    }
    
    // Can access current step, completed steps, or next step after last completed
    if (stepNumber === currentStep) return true;
    if (isStepComplete(stepNumber)) return true;
    const maxCompleted = Math.max(0, ...completedSteps, currentStep - 1);
    return stepNumber <= maxCompleted + 1;
  };
  
  // Check if step is locked due to setup
  const isLockedBySetup = (stepNumber: LessonStep) => {
    return stepNumber > 1 && !setupIsComplete;
  };

  return (
    <nav 
      aria-label="Progress" 
      className={`sticky top-[73px] border-b ${Z_INDEX.TABS}`}
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
    >
      <div className="overflow-x-auto">
        <ol className="flex items-center justify-between min-w-max max-w-4xl mx-auto px-6 py-4">
          {steps.map((step, index) => {
            const isComplete = isStepComplete(step.number);
            const isCurrent = isStepCurrent(step.number);
            const isAccessible = isStepAccessible(step.number);
            const isLast = index === steps.length - 1;
            const isLocked = isLockedBySetup(step.number);

            return (
              <li key={step.number} className="relative flex-1 min-w-[140px]">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <button
                    onClick={() => isAccessible && onStepClick?.(step.number)}
                    disabled={!isAccessible}
                    title={isLocked ? "Complete Lesson Setup to unlock" : undefined}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors flex-shrink-0",
                      isComplete && "border-transparent",
                      isCurrent && !isComplete && "border-transparent",
                      !isCurrent && !isComplete && isAccessible && "border-gray-300 hover:border-gray-400",
                      !isAccessible && "border-gray-200 opacity-50 cursor-not-allowed"
                    )}
                    style={
                      isComplete 
                        ? { backgroundColor: '#6FA86B' } 
                        : isCurrent && !isComplete 
                        ? { backgroundColor: '#C84C4C' } 
                        : {}
                    }
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: isCurrent ? '#FFFFFF' : isAccessible ? '#333333' : '#999999' }}
                      >
                        {step.number}
                      </span>
                    )}
                  </button>

                  {/* Step Label */}
                  <div className="ml-3 min-w-0 flex-1">
                    <p 
                      className="text-sm font-semibold whitespace-nowrap"
                      style={{ 
                        color: isCurrent ? '#C84C4C' : isComplete ? '#6FA86B' : '#333333',
                        fontFamily: "'Montserrat', 'Nunito', sans-serif"
                      }}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs hidden sm:block whitespace-nowrap" style={{ color: '#666666' }}>
                      {step.description}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {!isLast && (
                    <div 
                      className="hidden md:block w-full h-0.5 mx-2 flex-shrink-0"
                      style={{ backgroundColor: isComplete ? '#6FA86B' : '#E5E5E5' }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}