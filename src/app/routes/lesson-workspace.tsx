/**
 * Lesson Workspace
 * 
 * Complete lesson creation and management workflow with 5 steps:
 * 1. Setup - Configure lesson details
 * 2. Upload - Add template and materials
 * 3. Review - AI content extraction and approval
 * 4. Build Slides - Generate slide deck
 * 5. Teach Mode - Present to students
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { EditorLayout } from '../components/editor-layout';
import { StepNavigation, LessonStep } from '../components/step-navigation';
import { LessonSetupPanel } from '../components/lesson-setup-panel';
import { LessonUploadPanel } from '../components/lesson-upload-panel';
import { LessonReviewPanel } from '../components/lesson-review-panel';
import { LessonBuildPanel } from '../components/lesson-build-panel';
import { LessonTeachPanel } from '../components/lesson-teach-panel';
import { LessonPlayerErrorBoundary } from '../components/lesson-player-error-boundary';
import { LessonSetup, getDefaultLessonSetup, getLessonSetupSummary, isSetupComplete } from '../types/lesson-setup-types';
import { getTemplate } from '../../utils/template-manager';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Lock, Save, Check } from 'lucide-react';
import type { Subject } from '../types/lesson-setup-types';
import { getLesson, type SavedLesson } from '../utils/supabase-lessons';
import { saveLesson } from '../utils/supabase-lessons';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts';

export default function LessonWorkspace() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Redirect to subject landing if no lessonId (use useEffect to avoid conditional hook)
  useEffect(() => {
    if (!lessonId) {
      // Create new draft lesson and navigate to it
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('current-draft-lesson-id', draftId);
      navigate(`/lessons/${draftId}?subject=ela&step=setup`, { replace: true });
    }
  }, [lessonId, navigate]);
  
  // Provide a fallback while redirecting
  const actualLessonId = lessonId || 'temp';
  
  // Track if we're loading from database
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(true);
  
  // Lesson title and save state - MUST be declared early since used in effects
  const [lessonTitle, setLessonTitle] = useState('Untitled Lesson');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null); // Track original createdAt
  
  // Try to load lesson from Supabase first
  useEffect(() => {
    const loadFromDatabase = async () => {
      if (!lessonId) {
        setIsLoadingFromDB(false);
        return;
      }
      
      try {
        const savedLesson = await getLesson(lessonId);
        
        if (savedLesson) {
          const dbData: any = savedLesson;
          
          // Store the original createdAt for future saves
          if (dbData.createdAt) {
            setCreatedAt(dbData.createdAt);
          }
          
          // ALWAYS set the lesson title from the saved name first
          if (dbData.name) {
            setLessonTitle(dbData.name);
          }
          
          // NEW FORMAT: Check if data has _fullSetup (our new save format)
          if (dbData.data?._fullSetup) {
            const fullSetup = dbData.data._fullSetup;
            setLessonSetup(fullSetup);
            
            // Save to localStorage as well
            localStorage.setItem(`lesson-setup-${lessonId}`, JSON.stringify(fullSetup));
            
            toast.success('Lesson loaded successfully!');
          }
          // Check if this has formData from the wizard (wizard structure)
          else if (dbData.formData) {
            const formData = dbData.formData;
            const convertedSetup: LessonSetup = {
              lessonId: formData.lessonId || lessonId,
              subject: formData.subject || 'ela',
              sources: formData.sources || { ufli: false, savvas: false, webResource: false, teacherCreated: false },
              ufli: formData.ufliLessonNumber ? {
                lessonNumber: parseInt(formData.ufliLessonNumber),
                day: parseInt(formData.ufliDay || '1')
              } : undefined,
              savvas: formData.savvasUnit ? {
                unit: parseInt(formData.savvasUnit),
                week: parseInt(formData.savvasWeek),
                day: parseInt(formData.savvasDay || '1')
              } : undefined,
              schedule: formData.duration ? { 
                date: '', 
                timeAvailable: formData.duration.toString() 
              } : { date: '', timeAvailable: '30' },
              weeklyFocus: formData.weeklyFocus || undefined,
              components: formData.components || undefined,
              differentiation: formData.differentiation || undefined,
              reviewPreferences: formData.reviewPreferences || undefined,
            };
            
            setLessonSetup(convertedSetup);
            
            // Save to localStorage as well
            localStorage.setItem(`lesson-setup-${lessonId}`, JSON.stringify(convertedSetup));
            
            toast.success('Lesson loaded from database!');
          }
          // Check if this is the flat structure from KV store
          else if (dbData.ufli || dbData.savvas || dbData.sources) {
            const convertedSetup: LessonSetup = {
              lessonId: dbData.lessonId || lessonId,
              subject: dbData.subject || 'ela',
              sources: dbData.sources || { ufli: false, savvas: false, webResource: false, teacherCreated: false },
              ufli: dbData.ufli || undefined,
              savvas: dbData.savvas || undefined,
              schedule: dbData.schedule || { date: '', timeAvailable: '30' },
              weeklyFocus: dbData.weeklyFocus || undefined,
              components: dbData.components || undefined,
              differentiation: dbData.differentiation || undefined,
              reviewPreferences: dbData.reviewPreferences || undefined,
            };
            
            setLessonSetup(convertedSetup);
            
            // Save to localStorage as well
            localStorage.setItem(`lesson-setup-${lessonId}`, JSON.stringify(convertedSetup));
            
            toast.success('Lesson loaded from database!');
          } else if (savedLesson.data) {
            // Standard SavedLesson structure
            toast.info('Loaded lesson (standard format)');
          }
        }
      } catch (error) {
        console.error('Error loading lesson from database:', error);
        toast.error('Failed to load lesson from database');
      } finally {
        setIsLoadingFromDB(false);
      }
    };
    
    loadFromDatabase();
  }, [lessonId]);
  
  // Load lesson setup from localStorage or create default
  const [lessonSetup, setLessonSetup] = useState<LessonSetup>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined' && lessonId) {
      const saved = localStorage.getItem(`lesson-setup-${lessonId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved setup', e);
        }
      }
    }
    
    // Create default setup with subject from URL if provided
    const defaultSetup = getDefaultLessonSetup(actualLessonId);
    const subjectParam = searchParams.get('subject') as Subject | null;
    
    if (subjectParam && (subjectParam === 'ela' || subjectParam === 'math')) {
      defaultSetup.subject = subjectParam;
    }
    
    return defaultSetup;
  });
  
  // Save setup to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && lessonId) {
      localStorage.setItem(`lesson-setup-${lessonId}`, JSON.stringify(lessonSetup));
    }
  }, [lessonSetup, lessonId]);
  
  // Save to Supabase database whenever setup or title changes
  useEffect(() => {
    const saveToDatabaseDebounced = async () => {
      if (!lessonId || !lessonSetup || isLoadingFromDB) return;
      
      // DON'T save if the lesson is still in default/empty state
      // Only save if user has actually configured something meaningful
      const hasContent = 
        lessonSetup.sources.ufli || 
        lessonSetup.sources.savvas || 
        lessonSetup.sources.webResource || 
        lessonSetup.sources.teacherCreated ||
        lessonSetup.weeklyFocus?.phonics ||
        lessonSetup.weeklyFocus?.story ||
        lessonSetup.weeklyFocus?.words;
      
      if (!hasContent) {
        return;
      }
      
      try {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        const titleWithDate = `${lessonTitle} - ${formattedDate}`;
        
        // Use the stored createdAt instead of fetching the lesson again
        await saveLesson({
          id: lessonId,
          name: titleWithDate,  // Changed from 'title' to 'name' to match SavedLesson type
          data: {
            ufliLessonNumber: lessonSetup.ufli?.lessonNumber || 0,
            dayNumber: lessonSetup.ufli?.day || lessonSetup.savvas?.day || 1,
            date: lessonSetup.schedule?.date || formattedDate,
            phonicsConcept: lessonSetup.weeklyFocus?.phonics || '',
            storyTitle: lessonSetup.weeklyFocus?.story || '',
            highFrequencyWords: lessonSetup.weeklyFocus?.words 
              ? lessonSetup.weeklyFocus.words.split(',').map(w => w.trim()) 
              : [],
            // Store the complete setup in a way that can be restored
            _fullSetup: lessonSetup,
            _lessonTitle: titleWithDate,
          } as any,  // Use 'as any' to allow our custom fields
          createdAt: createdAt || new Date().toISOString(), // Use stored createdAt
          updatedAt: new Date().toISOString(),
        });
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving lesson to database:', error);
      }
    };
    
    // Debounce the save - wait 10 seconds after last change
    const saveTimer = setTimeout(saveToDatabaseDebounced, 10000);
    return () => clearTimeout(saveTimer);
  }, [lessonSetup, lessonTitle, lessonId, isLoadingFromDB, createdAt]);
  
  // Workflow state
  const setupIsComplete = isSetupComplete(lessonSetup);
  
  // Determine current step from URL params or localStorage
  const [currentStep, setCurrentStep] = useState<LessonStep>(() => {
    const stepParam = searchParams.get('step');
    const stepMap: Record<string, LessonStep> = {
      'setup': 1,
      'upload': 2,
      'review': 3,
      'build': 4,
      'teach': 5,
    };
    
    if (stepParam && stepMap[stepParam]) {
      return stepMap[stepParam];
    }
    
    // Default to setup if nothing specified
    return 1;
  });
  
  // Deep-link protection: redirect to setup if trying to access later steps without setup complete
  useEffect(() => {
    // Don't redirect while still loading from database
    if (isLoadingFromDB) {
      return;
    }
    
    if (!setupIsComplete && currentStep > 1) {
      toast.error('Complete Lesson Setup first so the system knows what to look for.', {
        duration: 4000,
      });
      navigate(`/lessons/${lessonId}?step=setup`, { replace: true });
      setCurrentStep(1);
    }
  }, [setupIsComplete, currentStep, lessonId, navigate, isLoadingFromDB]);
  
  const [completedSteps, setCompletedSteps] = useState<LessonStep[]>([]);
  
  // Auto-load template when component mounts (only once per subject change)
  useEffect(() => {
    const loadTemplate = async () => {
      const userId = 'demo-user'; // TODO: Get from auth
      const template = await getTemplate(userId, lessonSetup.subject);
    };
    
    // Only load if subject is set
    if (lessonSetup.subject) {
      loadTemplate();
    }
  }, [lessonSetup.subject]);

  // Handle step completion
  const markStepComplete = (step: LessonStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  // Handle setup save
  const handleSetupSave = (setup: LessonSetup) => {
    setLessonSetup(setup);
    
    // Generate lesson title from setup
    const summary = getLessonSetupSummary(setup);
    setLessonTitle(summary);
    
    // Mark step 1 complete and move to step 2
    markStepComplete(1);
    setCurrentStep(2);
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    markStepComplete(2);
    setCurrentStep(3);
  };

  // Handle review complete
  const handleReviewComplete = () => {
    markStepComplete(3);
    setCurrentStep(4);
  };

  // Handle slides generated
  const handleSlidesGenerated = () => {
    markStepComplete(4);
    setCurrentStep(5);
  };

  // Generate header info from setup
  const lessonSubject = lessonSetup.subject.toUpperCase();
  const lessonDuration = lessonSetup.schedule.timeAvailable === 'full' 
    ? '60+ min' 
    : `${lessonSetup.schedule.timeAvailable} min`;
  
  const sources: string[] = [];
  if (lessonSetup.sources.ufli) sources.push('UFLI');
  if (lessonSetup.sources.savvas) sources.push('Savvas');
  if (lessonSetup.sources.teacherCreated) sources.push('Teacher');
  if (lessonSetup.sources.webResource) sources.push('Web');
  const lessonSources = sources.join(' + ');

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      toast.success('Lesson saved!', { icon: <Save className="size-4" /> });
      setLastSaved(new Date());
    },
    onPresent: () => {
      if (currentStep === 5 || completedSteps.includes(5)) {
        toast.info('Launching Teach Mode...');
        setCurrentStep(5);
      } else {
        toast.error('Complete all steps before presenting');
      }
    },
  });

  return (
    <EditorLayout
      lessonTitle={lessonTitle}
      lessonSubject={lessonSubject}
      lessonDuration={lessonDuration}
      lessonSources={lessonSources}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      {/* Step Navigation */}
      <StepNavigation
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
        setupIsComplete={setupIsComplete}
      />

      {/* Step Content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {currentStep === 1 && (
          <LessonSetupPanel
            lessonId={actualLessonId}
            initialSetup={lessonSetup}
            onSave={handleSetupSave}
          />
        )}

        {currentStep === 2 && (
          <LessonUploadPanel
            lessonId={actualLessonId}
            lessonSetup={lessonSetup}
            onComplete={handleUploadComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <LessonReviewPanel
            lessonId={actualLessonId}
            lessonSetup={lessonSetup}
            onComplete={handleReviewComplete}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <LessonBuildPanel
            lessonId={actualLessonId}
            lessonSetup={lessonSetup}
            onComplete={handleSlidesGenerated}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <LessonPlayerErrorBoundary>
            <LessonTeachPanel
              lessonId={actualLessonId}
              lessonSetup={lessonSetup}
              onBack={() => setCurrentStep(4)}
            />
          </LessonPlayerErrorBoundary>
        )}
      </div>
    </EditorLayout>
  );
}