/**
 * Lesson Build Panel (Step 4)
 * 
 * Slide generation and preview:
 * - Slide preview summary
 * - Time adjustment notice
 * - Generate slides button
 * - Preview slides
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  FileText,
  Play,
  Eye,
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { LessonSetup } from '../types/lesson-setup-types';
import { generateSlidesFromSetup, type SlideTemplate } from '../utils/slide-filtering';

interface LessonBuildPanelProps {
  lessonId: string;
  lessonSetup: LessonSetup;
  onComplete: () => void;
  onBack: () => void;
}

export function LessonBuildPanel({
  lessonId,
  lessonSetup,
  onComplete,
  onBack,
}: LessonBuildPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [slides, setSlides] = useState<SlideTemplate[]>([]);

  // Load approved review content from localStorage
  const [approvedReviewContent, setApprovedReviewContent] = useState<{
    phonicsFocus: string;
    sightWords: string[];
    vocabulary: string[];
    comprehensionFocus: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && lessonId) {
      const saved = localStorage.getItem(`lesson-review-${lessonId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setApprovedReviewContent(parsed.extracted);
          console.log('📚 Loaded approved review content for build:', parsed.extracted);
        } catch (e) {
          console.error('Failed to parse saved review data', e);
        }
      }
    }
  }, [lessonId]);

  // Generate slides based on lesson setup
  useEffect(() => {
    const generatedSlides = generateSlidesFromSetup(
      lessonSetup,
      approvedReviewContent || undefined
    );
    setSlides(generatedSlides);
    console.log('🎯 Smart slides generated:', {
      total: generatedSlides.length,
      ufliDay: lessonSetup.ufli?.day,
      savvasDay: lessonSetup.savvas?.day,
      timeAvailable: lessonSetup.schedule.timeAvailable,
    });
  }, [lessonSetup, approvedReviewContent]);

  const totalDuration = lessonSetup.schedule.timeAvailable === 'full' 
    ? 60 
    : parseInt(lessonSetup.schedule.timeAvailable);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate generation progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Simulate generation time
    await new Promise((resolve) => setTimeout(resolve, 3500));

    clearInterval(interval);
    setGenerationProgress(100);
    setIsGenerating(false);
    setIsGenerated(true);
    toast.success(`🎉 Lesson ready! ${slides.length} slides created for ${lessonSetup.schedule.timeAvailable}-minute lesson`);
  };

  const handlePreview = () => {
    toast.info('Preview feature coming soon!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Build Lesson Slides</h2>
        <p className="text-muted-foreground">
          Generate your interactive slide deck based on approved content
        </p>
      </div>

      {/* Slide Preview Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Slide Preview Summary
          </CardTitle>
          <CardDescription>
            {slides.length} slides • Adjusted for {totalDuration} minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {slides.map((slide) => (
              <div
                key={slide.number}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-sky-100 flex items-center justify-center text-sm font-semibold text-sky-700">
                    {slide.number}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{slide.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {slide.type}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {slide.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Adjustment Notice */}
      <Card style={{ borderColor: 'var(--ao-tan)', backgroundColor: 'var(--ao-cream)' }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--ao-text)' }} />
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--ao-text)' }}>
                Slides adjusted to fit {totalDuration} minutes
              </p>
              <p className="text-sm" style={{ color: 'var(--ao-text)' }}>
                Practice slides have been optimized for your selected time block. You can
                adjust timing during teaching.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Reassurance Card */}
      <Card style={{ borderColor: 'var(--ao-sky)', backgroundColor: 'var(--ao-cream)' }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--ao-navy)' }} />
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--ao-navy)' }}>
                You can still edit after building
              </p>
              <p className="text-sm" style={{ color: 'var(--ao-text)' }}>
                Once slides are generated, you can preview, edit, and regenerate as needed.
                Nothing will be lost.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Section */}
      {!isGenerated && !isGenerating && (
        <Card className="border-sky-200" style={{ background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600" />
              Ready to Generate
            </CardTitle>
            <CardDescription>
              Click below to create your interactive slide deck
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full" onClick={handleGenerate}>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Slides
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generating Progress */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600 animate-pulse" />
              Generating Slides...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={generationProgress} />
              <p className="text-sm text-gray-600 text-center">
                {generationProgress < 30 && 'Analyzing content...'}
                {generationProgress >= 30 && generationProgress < 60 && 'Building slides...'}
                {generationProgress >= 60 && generationProgress < 90 && 'Applying template...'}
                {generationProgress >= 90 && 'Finalizing...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Success */}
      {isGenerated && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              Slides Generated Successfully!
            </CardTitle>
            <CardDescription>
              Your lesson is ready to preview or teach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePreview} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Preview Slides
              </Button>
              <Button onClick={onComplete} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Teach Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review
        </Button>

        {isGenerated && (
          <Button type="button" onClick={onComplete}>
            Continue to Teach Mode
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}