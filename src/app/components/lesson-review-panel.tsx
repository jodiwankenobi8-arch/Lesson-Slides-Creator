/**
 * Lesson Review Panel (Step 3)
 * 
 * AI content extraction review and approval:
 * - Phonics focus
 * - Sight words
 * - Vocabulary
 * - Comprehension focus
 * - Low confidence warnings
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  BookOpen,
  Eye,
  Brain,
  AlertTriangle,
  Check,
  Edit2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from './ui/utils';
import { LessonSetup } from '../types/lesson-setup-types';

interface ExtractedContent {
  phonicsFocus: string;
  sightWords: string[];
  vocabulary: string[];
  comprehensionFocus: string;
  lowConfidenceWarnings: string[];
}

interface LessonReviewPanelProps {
  lessonId: string;
  lessonSetup: LessonSetup;
  onComplete: () => void;
  onBack: () => void;
}

export function LessonReviewPanel({
  lessonId,
  lessonSetup,
  onComplete,
  onBack,
}: LessonReviewPanelProps) {
  // Load saved content from localStorage or use defaults
  const [extracted, setExtracted] = useState<ExtractedContent>(() => {
    if (typeof window !== 'undefined' && lessonId) {
      const saved = localStorage.getItem(`lesson-review-${lessonId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('📚 Loaded review edits from localStorage:', parsed.extracted);
          return parsed.extracted;
        } catch (e) {
          console.error('Failed to parse saved review data', e);
        }
      }
    }
    
    // Default mock extracted content (would come from AI extraction)
    return {
      phonicsFocus: 'Long A (a_e)',
      sightWords: ['play', 'come', 'came', 'make'],
      vocabulary: ['forest', 'path', 'traveler', 'journey'],
      comprehensionFocus: 'Main Idea & Details',
      lowConfidenceWarnings: ['Page 3: Text may be blurry - review recommended'],
    };
  });

  const [isEditing, setIsEditing] = useState((() => {
    if (typeof window !== 'undefined' && lessonId) {
      const saved = localStorage.getItem(`lesson-review-${lessonId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.isEditing || {
            phonicsFocus: false,
            sightWords: false,
            vocabulary: false,
            comprehensionFocus: false,
          };
        } catch (e) {
          console.error('Failed to parse saved review data', e);
        }
      }
    }
    
    return {
      phonicsFocus: false,
      sightWords: false,
      vocabulary: false,
      comprehensionFocus: false,
    };
  })());

  const [approved, setApproved] = useState((() => {
    if (typeof window !== 'undefined' && lessonId) {
      const saved = localStorage.getItem(`lesson-review-${lessonId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.approved || {
            phonicsFocus: false,
            sightWords: false,
            vocabulary: false,
            comprehensionFocus: false,
          };
        } catch (e) {
          console.error('Failed to parse saved review data', e);
        }
      }
    }
    
    return {
      phonicsFocus: false,
      sightWords: false,
      vocabulary: false,
      comprehensionFocus: false,
    };
  })());

  // Save to localStorage whenever extracted content or approval state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && lessonId) {
      const dataToSave = {
        extracted,
        approved,
        isEditing,
      };
      localStorage.setItem(`lesson-review-${lessonId}`, JSON.stringify(dataToSave));
      console.log('💾 Saved review edits to localStorage');
    }
  }, [extracted, approved, isEditing, lessonId]);

  const allApproved = Object.values(approved).every((v) => v);

  const handleApprove = (field: keyof typeof approved) => {
    setApproved({ ...approved, [field]: true });
    setIsEditing({ ...isEditing, [field]: false });
    toast.success('✅ Edits saved');
  };
  
  const handleApproveAll = () => {
    setApproved({
      phonicsFocus: true,
      sightWords: true,
      vocabulary: true,
      comprehensionFocus: true,
    });
    setIsEditing({
      phonicsFocus: false,
      sightWords: false,
      vocabulary: false,
      comprehensionFocus: false,
    });
    toast.success('✅ All sections approved');
  };

  const handleEdit = (field: keyof typeof isEditing) => {
    setIsEditing({ ...isEditing, [field]: true });
    setApproved({ ...approved, [field]: false });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Suggested Content</h2>
        <p className="text-muted-foreground">
          AI has extracted content from your materials. Review and approve each section.
        </p>
      </div>
      
      {/* Approve All Button */}
      {!allApproved && (
        <div className="flex justify-end">
          <Button onClick={handleApproveAll} variant="outline">
            <Check className="w-4 h-4 mr-2" />
            Approve All
          </Button>
        </div>
      )}

      {/* Low Confidence Warnings */}
      {extracted.lowConfidenceWarnings.length > 0 && (
        <Card style={{ borderColor: 'var(--ao-tan)', backgroundColor: 'var(--ao-cream)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--ao-text)' }}>
              <AlertTriangle className="w-5 h-5" />
              Review Recommended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {extracted.lowConfidenceWarnings.map((warning, index) => (
                <li key={index} className="text-sm" style={{ color: 'var(--ao-text)' }}>
                  ⚠ {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Phonics Focus */}
      <Card className={cn(
        "transition-colors",
        approved.phonicsFocus && "border-green-200 bg-green-50/50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Phonics Focus
            {approved.phonicsFocus && (
              <Badge className="bg-green-100 text-green-700 ml-auto">
                <Check className="w-3 h-3 mr-1" />
                Approved
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Detected from UFLI and Savvas materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing.phonicsFocus ? (
            <div className="space-y-3">
              <Input
                value={extracted.phonicsFocus}
                onChange={(e) =>
                  setExtracted({ ...extracted, phonicsFocus: e.target.value })
                }
                placeholder="e.g., Long A (a_e)"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove('phonicsFocus')}>
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing({ ...isEditing, phonicsFocus: false })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-gray-900">
                {extracted.phonicsFocus}
              </p>
              <div className="flex gap-2">
                {!approved.phonicsFocus && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit('phonicsFocus')}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleApprove('phonicsFocus')}>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sight Words */}
      <Card className={cn(
        "transition-colors",
        approved.sightWords && "border-green-200 bg-green-50/50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Sight Words
            {approved.sightWords && (
              <Badge className="bg-green-100 text-green-700 ml-auto">
                <Check className="w-3 h-3 mr-1" />
                Approved
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            High-frequency words for this lesson
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing.sightWords ? (
            <div className="space-y-3">
              <Input
                value={extracted.sightWords.join(', ')}
                onChange={(e) =>
                  setExtracted({
                    ...extracted,
                    sightWords: e.target.value.split(',').map((w) => w.trim()),
                  })
                }
                placeholder="e.g., play, come, came"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove('sightWords')}>
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing({ ...isEditing, sightWords: false })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {extracted.sightWords.map((word, index) => (
                  <Badge key={index} variant="outline" className="text-base px-3 py-1">
                    {word}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                {!approved.sightWords && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit('sightWords')}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleApprove('sightWords')}>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vocabulary */}
      <Card className={cn(
        "transition-colors",
        approved.vocabulary && "border-green-200 bg-green-50/50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Vocabulary
            {approved.vocabulary && (
              <Badge className="bg-green-100 text-green-700 ml-auto">
                <Check className="w-3 h-3 mr-1" />
                Approved
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Key vocabulary words from reading materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing.vocabulary ? (
            <div className="space-y-3">
              <Input
                value={extracted.vocabulary.join(', ')}
                onChange={(e) =>
                  setExtracted({
                    ...extracted,
                    vocabulary: e.target.value.split(',').map((w) => w.trim()),
                  })
                }
                placeholder="e.g., forest, path, traveler"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove('vocabulary')}>
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing({ ...isEditing, vocabulary: false })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {extracted.vocabulary.map((word, index) => (
                  <Badge key={index} variant="outline" className="text-base px-3 py-1">
                    {word}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                {!approved.vocabulary && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit('vocabulary')}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleApprove('vocabulary')}>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comprehension Focus */}
      <Card className={cn(
        "transition-colors",
        approved.comprehensionFocus && "border-green-200 bg-green-50/50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Comprehension Focus
            {approved.comprehensionFocus && (
              <Badge className="bg-green-100 text-green-700 ml-auto">
                <Check className="w-3 h-3 mr-1" />
                Approved
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Reading comprehension skill focus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing.comprehensionFocus ? (
            <div className="space-y-3">
              <Input
                value={extracted.comprehensionFocus}
                onChange={(e) =>
                  setExtracted({ ...extracted, comprehensionFocus: e.target.value })
                }
                placeholder="e.g., Main Idea & Details"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove('comprehensionFocus')}>
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setIsEditing({ ...isEditing, comprehensionFocus: false })
                  }
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-gray-900">
                {extracted.comprehensionFocus}
              </p>
              <div className="flex gap-2">
                {!approved.comprehensionFocus && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit('comprehensionFocus')}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleApprove('comprehensionFocus')}>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>

        <Button type="button" onClick={onComplete} disabled={!allApproved}>
          {allApproved ? (
            <>
              Continue to Build
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>Approve all sections to continue</>
          )}
        </Button>
      </div>
    </div>
  );
}