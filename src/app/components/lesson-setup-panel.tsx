/**
 * Lesson Setup Panel (Step 0)
 * 
 * Comprehensive curriculum information collection for lesson planning.
 * Collects all curriculum details upfront to inform material usage,
 * formative assessments, and discussion questions.
 * 
 * Required Information:
 * - Basic lesson info (title, date)
 * - UFLI curriculum details (lesson number, day)
 * - Savvas curriculum details (unit, week, day)
 * - Weekly focus areas (phonics, sight words, comprehension)
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { 
  LessonSetup, 
  getDefaultLessonSetup,
  getLessonSetupSummary,
  isSetupComplete,
  UflDay
} from '../types/lesson-setup-types';
import { BookOpen, Check, Calendar as CalendarIcon, Info, GraduationCap, Sparkles } from 'lucide-react';
import { cn } from './ui/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface LessonSetupPanelProps {
  lessonId: string;
  initialSetup?: LessonSetup;
  onSave: (setup: LessonSetup) => void;
  onCancel?: () => void;
}

export function LessonSetupPanel({ 
  lessonId, 
  initialSetup, 
  onSave,
  onCancel 
}: LessonSetupPanelProps) {
  const [setup, setSetup] = useState<LessonSetup>(() => {
    const base = initialSetup || getDefaultLessonSetup(lessonId);
    // Initialize with UFLI and Savvas enabled since we assume both are used
    return {
      ...base,
      sources: {
        ...base.sources,
        ufli: true,
        savvas: true,
      },
      // Initialize UFLI structure if not present
      ufli: base.ufli || {
        lessonNumber: 1,
        day: 1 as UflDay,
        day2Options: {
          timeMode: 'standard',
          includeDictation: true,
          includeDecodable: true,
          includeFluency: true,
          includePartnerReading: false,
        }
      },
      // Initialize Savvas structure if not present
      savvas: base.savvas || {
        unit: 1,
        week: 1,
        day: 1,
        toggles: {
          includeReadAloud: true,
          includeVocabulary: true,
          includeCompSkill: true,
          includeSharedReading: true,
        }
      },
      // Initialize weekly focus if not present
      weeklyFocus: base.weeklyFocus || {
        phonicsOrLetters: '',
        sightWords: [],
        comprehensionSkill: '',
      }
    };
  });
  
  const [isSaved, setIsSaved] = useState(false);

  // Update a top-level field
  const updateSetup = <K extends keyof LessonSetup>(
    key: K,
    value: LessonSetup[K]
  ) => {
    setSetup(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  // Update a nested field
  const updateNested = <K extends keyof LessonSetup, NK extends keyof NonNullable<LessonSetup[K]>>(
    parentKey: K,
    nestedKey: NK,
    value: NonNullable<LessonSetup[K]>[NK]
  ) => {
    setSetup(prev => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [nestedKey]: value,
      },
    }));
    setIsSaved(false);
  };

  // Handle save
  const handleSave = () => {
    onSave(setup);
    setIsSaved(true);
  };

  // Enhanced validation
  const canSave = () => {
    if (!setup.lessonTitle || !setup.lessonTitle.trim()) return false;
    if (!setup.schedule.date) return false;
    
    // UFLI validation
    if (!setup.ufli?.lessonNumber) return false;
    if (!setup.ufli?.day) return false;
    
    // Savvas validation
    if (!setup.savvas?.unit) return false;
    if (!setup.savvas?.week) return false;
    if (!setup.savvas?.day) return false;
    
    // Weekly focus validation
    if (!setup.weeklyFocus?.phonicsOrLetters?.trim()) return false;
    if (!setup.weeklyFocus?.comprehensionSkill?.trim()) return false;
    
    return true;
  };

  // Arrow key navigation for scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only prevent scrolling if actively typing in an input/textarea or navigating a select
      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      
      // Don't scroll if user is typing in text fields
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        return;
      }
      
      // Don't scroll if user is navigating a select dropdown
      if (tagName === 'SELECT' || target.getAttribute('role') === 'combobox') {
        return;
      }

      const scrollAmount = 100; // pixels to scroll per key press

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        
        // Find the scrollable container (the wizard wrapper or window)
        const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement;
        if (scrollContainer) {
          scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        } else {
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        
        // Find the scrollable container (the wizard wrapper or window)
        const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement;
        if (scrollContainer) {
          scrollContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        } else {
          window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Info Banner */}
      <Card className="bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sky-900 dark:text-sky-100">
              <p className="font-medium mb-1">Curriculum Setup - UFLI + Savvas</p>
              <p className="text-sky-700 dark:text-sky-300">
                Enter your curriculum details below. This information helps the system select the right materials from your uploads, 
                generate formative assessments, and create targeted discussion questions aligned to your weekly focus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Badge (shown after save) */}
      {isSaved && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 justify-center">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Lesson setup saved: {setup.lessonTitle}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 1: Basic Lesson Information */}
      <Card className="border-sky-300">
        <CardHeader className="bg-sky-50 dark:bg-sky-950">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Basic Lesson Information
          </CardTitle>
          <CardDescription>
            Core details about this lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Lesson Title */}
            <div className="col-span-2">
              <Label htmlFor="lesson-title" className="text-sm font-medium mb-2">
                Lesson Title
              </Label>
              <Input
                id="lesson-title"
                value={setup.lessonTitle || ''}
                onChange={(e) => updateSetup('lessonTitle', e.target.value)}
                placeholder="e.g., Long A Sound Practice - Week 3 Day 2"
                className="text-sm"
              />
              {!setup.lessonTitle && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required to continue
                </p>
              )}
            </div>

            {/* Lesson Date */}
            <div>
              <Label className="text-sm font-medium mb-2">
                Lesson Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !setup.schedule.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {setup.schedule.date ? format(new Date(setup.schedule.date + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={setup.schedule.date ? new Date(setup.schedule.date + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        updateNested('schedule', 'date', `${year}-${month}-${day}`);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {!setup.schedule.date && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required
                </p>
              )}
            </div>

            {/* Grade Level */}
            <div>
              <Label htmlFor="grade-level" className="text-sm font-medium mb-2">
                Grade Level
              </Label>
              <Input
                id="grade-level"
                value={setup.gradeLevel || 'Kindergarten'}
                onChange={(e) => updateSetup('gradeLevel', e.target.value)}
                placeholder="e.g., Kindergarten"
                className="text-sm"
              />
            </div>

            {/* Time Available */}
            <div>
              <Label htmlFor="time-available" className="text-sm font-medium mb-2">
                Time Available (minutes)
              </Label>
              <Select
                value={setup.schedule.timeAvailable}
                onValueChange={(value) => updateNested('schedule', 'timeAvailable', value as any)}
              >
                <SelectTrigger id="time-available" className="text-sm">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="full">60+ minutes (full lesson)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: UFLI Curriculum Details */}
      <Card style={{ borderColor: 'var(--processing-border)' }}>
        <CardHeader style={{ backgroundColor: 'var(--processing-bg)' }}>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            UFLI Foundations
          </CardTitle>
          <CardDescription>
            Specify the UFLI lesson and day
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* UFLI Lesson Number */}
            <div>
              <Label htmlFor="ufli-lesson" className="text-sm font-medium mb-2">
                UFLI Lesson #
              </Label>
              <Input
                id="ufli-lesson"
                type="number"
                min="1"
                max="100"
                value={setup.ufli?.lessonNumber || ''}
                onChange={(e) => updateNested('ufli', 'lessonNumber', parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="1-100"
                className="text-sm"
              />
              {!setup.ufli?.lessonNumber && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required
                </p>
              )}
            </div>

            {/* UFLI Day */}
            <div>
              <Label htmlFor="ufli-day" className="text-sm font-medium mb-2">
                Day
              </Label>
              <Select
                value={setup.ufli?.day?.toString() || '1'}
                onValueChange={(value) => updateNested('ufli', 'day', parseInt(value) as UflDay)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Day 1</SelectItem>
                  <SelectItem value="2">Day 2</SelectItem>
                </SelectContent>
              </Select>
              {!setup.ufli?.day && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Savvas myView Curriculum Details */}
      <Card className="border-green-300">
        <CardHeader className="bg-green-50 dark:bg-green-950">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Savvas myView
          </CardTitle>
          <CardDescription>
            Specify the Savvas unit, week, and day
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Savvas Unit */}
            <div>
              <Label htmlFor="savvas-unit" className="text-sm font-medium mb-2">
                Unit Number
              </Label>
              <Input
                id="savvas-unit"
                type="number"
                min="1"
                max="10"
                value={setup.savvas?.unit || ''}
                onChange={(e) => updateNested('savvas', 'unit', parseInt(e.target.value) || 1)}
                onFocus={(e) => e.target.select()}
                placeholder="1-10"
                className="text-sm"
              />
              {!setup.savvas?.unit && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required
                </p>
              )}
            </div>

            {/* Savvas Week */}
            <div>
              <Label htmlFor="savvas-week" className="text-sm font-medium mb-2">
                Week Number
              </Label>
              <Input
                id="savvas-week"
                type="number"
                min="1"
                max="5"
                value={setup.savvas?.week || ''}
                onChange={(e) => updateNested('savvas', 'week', parseInt(e.target.value) || 1)}
                onFocus={(e) => e.target.select()}
                placeholder="1-5"
                className="text-sm"
              />
              {!setup.savvas?.week && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required
                </p>
              )}
            </div>

            {/* Savvas Day */}
            <div>
              <Label htmlFor="savvas-day" className="text-sm font-medium mb-2">
                Day Number
              </Label>
              <Input
                id="savvas-day"
                type="number"
                min="1"
                max="5"
                value={setup.savvas?.day || ''}
                onChange={(e) => updateNested('savvas', 'day', parseInt(e.target.value) || 1)}
                onFocus={(e) => e.target.select()}
                placeholder="1-5"
                className="text-sm"
              />
              {!setup.savvas?.day && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: Weekly Focus Areas */}
      <Card style={{ borderColor: 'var(--ao-tan)' }}>
        <CardHeader style={{ backgroundColor: 'var(--ao-cream)' }}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Weekly Focus Areas
          </CardTitle>
          <CardDescription>
            Key learning focuses for this week - used to generate assessments and discussion questions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Phonics Focus */}
            <div>
              <Label htmlFor="phonics-focus" className="text-sm font-medium mb-2">
                Phonics Focus for the Week
              </Label>
              <Input
                id="phonics-focus"
                value={setup.weeklyFocus?.phonicsOrLetters || ''}
                onChange={(e) => updateNested('weeklyFocus', 'phonicsOrLetters', e.target.value)}
                placeholder="e.g., Long A sound (a_e pattern)"
                className="text-sm"
              />
              {!setup.weeklyFocus?.phonicsOrLetters?.trim() && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required - What phonics skill or letter pattern?
                </p>
              )}
            </div>

            {/* Sight Words */}
            <div>
              <Label htmlFor="sight-words" className="text-sm font-medium mb-2">
                Sight Words for the Week
              </Label>
              <Input
                id="sight-words"
                value={setup.weeklyFocus?.sightWords?.join(', ') || ''}
                onChange={(e) => {
                  const words = e.target.value.split(',').map(w => w.trim()).filter(w => w.length > 0);
                  updateNested('weeklyFocus', 'sightWords', words);
                }}
                placeholder="e.g., the, and, is, for (comma-separated)"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter words separated by commas
              </p>
            </div>

            {/* Vocabulary Words */}
            <div>
              <Label htmlFor="vocabulary-words" className="text-sm font-medium mb-2">
                Vocabulary Words for the Week
              </Label>
              <Input
                id="vocabulary-words"
                value={setup.weeklyFocus?.vocabularyWords?.join(', ') || ''}
                onChange={(e) => {
                  const words = e.target.value.split(',').map(w => w.trim()).filter(w => w.length > 0);
                  updateNested('weeklyFocus', 'vocabularyWords', words);
                }}
                placeholder="e.g., habitat, migrate, season (comma-separated)"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Story-specific vocabulary words - can be auto-extracted from uploads
              </p>
            </div>

            {/* Academic Vocabulary */}
            <div>
              <Label htmlFor="academic-vocabulary" className="text-sm font-medium mb-2">
                Academic Vocabulary Words
              </Label>
              <Input
                id="academic-vocabulary"
                value={setup.weeklyFocus?.academicVocabulary?.join(', ') || ''}
                onChange={(e) => {
                  const words = e.target.value.split(',').map(w => w.trim()).filter(w => w.length > 0);
                  updateNested('weeklyFocus', 'academicVocabulary', words);
                }}
                placeholder="e.g., compare, describe, analyze (comma-separated)"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Content-area or cross-curricular academic terms - can be auto-extracted
              </p>
            </div>

            {/* Comprehension Focus */}
            <div>
              <Label htmlFor="comprehension-focus" className="text-sm font-medium mb-2">
                Comprehension Focus for the Week
              </Label>
              <Textarea
                id="comprehension-focus"
                value={setup.weeklyFocus?.comprehensionSkill || ''}
                onChange={(e) => updateNested('weeklyFocus', 'comprehensionSkill', e.target.value)}
                placeholder="e.g., Making predictions, Identifying main idea, Character feelings"
                className="text-sm min-h-[80px]"
              />
              {!setup.weeklyFocus?.comprehensionSkill?.trim() && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--ao-text)' }}>
                  ⚠️ Required - What comprehension skill or strategy?
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional Teacher Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Additional Notes</CardTitle>
          <CardDescription className="text-xs">
            Optional notes about this lesson
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="lesson-notes"
            value={setup.notes || ''}
            onChange={(e) => updateSetup('notes', e.target.value)}
            placeholder="Any special considerations, student needs, or reminders..."
            className="text-sm min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        <div className="flex items-center gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleSave}
            disabled={!canSave()}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Save Setup
          </Button>
          
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave()}
            className="bg-sky-600 hover:bg-sky-700"
          >
            Save & Continue to Upload
          </Button>
        </div>
      </div>

      {/* Validation Helper */}
      {!canSave() && (
        <Card style={{ backgroundColor: 'var(--ao-cream)', borderColor: 'var(--ao-tan)' }}>
          <CardContent className="py-3">
            <p className="text-sm" style={{ color: 'var(--ao-text)' }}>
              <strong>Complete required fields:</strong> Lesson title, date, UFLI details, Savvas details, phonics focus, and comprehension focus
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}