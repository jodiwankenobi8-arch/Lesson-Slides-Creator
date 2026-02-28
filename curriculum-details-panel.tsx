/**
 * Curriculum Details Panel
 * 
 * Appears AFTER exemplar upload and analysis.
 * Shows extracted information and allows teacher to fill in curriculum details.
 * 
 * Features:
 * - Shows time available (extracted from exemplar)
 * - Text input fields for UFLI (Lesson #, Day)
 * - Text input fields for Savvas (Unit, Week, Day)
 * - Optional fields like phonics focus, story title, etc.
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Clock, BookOpen, GraduationCap, Check, Info, Sparkles } from 'lucide-react';
import { cn } from './ui/utils';

interface ExemplarAnalysis {
  timeAvailable?: string; // "20", "30", "45", or "full"
  detectedCurriculum?: 'ufli' | 'savvas' | 'both' | 'none';
  extractedData?: {
    ufliLesson?: number;
    ufliDay?: number;
    savvasUnit?: number;
    savvasWeek?: number;
    savvasDay?: number;
    phonicsFocus?: string;
    storyTitle?: string;
  };
}

interface CurriculumData {
  // UFLI
  ufliLesson?: string;
  ufliDay?: string;
  
  // Savvas
  savvasUnit?: string;
  savvasWeek?: string;
  savvasDay?: string;
  savvasPhonics?: string;
  savvasStory?: string;
  savvasComprehension?: string;
}

interface CurriculumDetailsPanelProps {
  lessonId: string;
  exemplarAnalysis?: ExemplarAnalysis;
  initialData?: CurriculumData;
  onSave: (data: CurriculumData) => void;
}

export function CurriculumDetailsPanel({
  lessonId,
  exemplarAnalysis,
  initialData,
  onSave,
}: CurriculumDetailsPanelProps) {
  const [curriculumData, setCurriculumData] = useState<CurriculumData>(
    initialData || {}
  );
  const [activeTab, setActiveTab] = useState<string>(
    exemplarAnalysis?.detectedCurriculum === 'savvas' ? 'savvas' : 'ufli'
  );

  const updateField = (field: keyof CurriculumData, value: string) => {
    setCurriculumData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(curriculumData);
  };

  // Check if minimum required fields are filled
  const hasUfliData = curriculumData.ufliLesson && curriculumData.ufliDay;
  const hasSavvasData = 
    curriculumData.savvasUnit && 
    curriculumData.savvasWeek && 
    curriculumData.savvasDay;
  const canSave = hasUfliData || hasSavvasData;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Exemplar Analysis Summary */}
      {exemplarAnalysis && (
        <Card style={{ backgroundColor: 'var(--processing-bg)', borderColor: 'var(--processing-border)' }}>
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--processing-border)' }} />
              <div className="text-sm flex-1" style={{ color: 'var(--processing-text)' }}>
                <p className="font-medium mb-1">Exemplar Analysis Complete</p>
                <div className="space-y-1" style={{ color: 'var(--processing-text)' }}>
                  {exemplarAnalysis.timeAvailable && (
                    <p>
                      • <strong>Time Available:</strong> {
                        exemplarAnalysis.timeAvailable === '20' ? '20 minutes' :
                        exemplarAnalysis.timeAvailable === '30' ? '30 minutes' :
                        exemplarAnalysis.timeAvailable === '45' ? '45 minutes' :
                        '60+ minutes'
                      }
                    </p>
                  )}
                  {exemplarAnalysis.detectedCurriculum && exemplarAnalysis.detectedCurriculum !== 'none' && (
                    <p>
                      • <strong>Detected Curriculum:</strong> {
                        exemplarAnalysis.detectedCurriculum === 'ufli' ? 'UFLI Foundations' :
                        exemplarAnalysis.detectedCurriculum === 'savvas' ? 'Savvas myView' :
                        'UFLI + Savvas'
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sky-900 dark:text-sky-100">
              <p className="font-medium mb-1">Fill in Curriculum Details</p>
              <p className="text-sky-700 dark:text-sky-300">
                Enter the curriculum information for this lesson. Use the tabs below to fill in UFLI or Savvas details (or both).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Curriculum Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Curriculum Information</CardTitle>
          <CardDescription className="text-xs">
            Select curriculum type and enter details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ufli" className="text-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                UFLI Foundations
              </TabsTrigger>
              <TabsTrigger value="savvas" className="text-sm">
                <GraduationCap className="w-4 h-4 mr-2" />
                Savvas myView
              </TabsTrigger>
            </TabsList>

            {/* UFLI Tab */}
            <TabsContent value="ufli" className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ufli-lesson" className="text-sm">
                    Lesson Number <Badge variant="secondary" className="ml-1 text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="ufli-lesson"
                    value={curriculumData.ufliLesson || exemplarAnalysis?.extractedData?.ufliLesson?.toString() || ''}
                    onChange={(e) => updateField('ufliLesson', e.target.value)}
                    placeholder="e.g., 45"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="ufli-day" className="text-sm">
                    Day <Badge variant="secondary" className="ml-1 text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="ufli-day"
                    value={curriculumData.ufliDay || exemplarAnalysis?.extractedData?.ufliDay?.toString() || ''}
                    onChange={(e) => updateField('ufliDay', e.target.value)}
                    placeholder="e.g., 1 or 2"
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Enter UFLI lesson number and day (1 or 2)
              </div>
            </TabsContent>

            {/* Savvas Tab */}
            <TabsContent value="savvas" className="space-y-3 pt-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="savvas-unit" className="text-sm">
                    Unit <Badge variant="secondary" className="ml-1 text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="savvas-unit"
                    value={curriculumData.savvasUnit || exemplarAnalysis?.extractedData?.savvasUnit?.toString() || ''}
                    onChange={(e) => updateField('savvasUnit', e.target.value)}
                    placeholder="e.g., 3"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="savvas-week" className="text-sm">
                    Week <Badge variant="secondary" className="ml-1 text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="savvas-week"
                    value={curriculumData.savvasWeek || exemplarAnalysis?.extractedData?.savvasWeek?.toString() || ''}
                    onChange={(e) => updateField('savvasWeek', e.target.value)}
                    placeholder="e.g., 2"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="savvas-day" className="text-sm">
                    Day <Badge variant="secondary" className="ml-1 text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="savvas-day"
                    value={curriculumData.savvasDay || exemplarAnalysis?.extractedData?.savvasDay?.toString() || ''}
                    onChange={(e) => updateField('savvasDay', e.target.value)}
                    placeholder="e.g., 1"
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="savvas-phonics" className="text-sm">Phonics Focus</Label>
                <Input
                  id="savvas-phonics"
                  value={curriculumData.savvasPhonics || exemplarAnalysis?.extractedData?.phonicsFocus || ''}
                  onChange={(e) => updateField('savvasPhonics', e.target.value)}
                  placeholder="e.g., Long A (a_e)"
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="savvas-story" className="text-sm">Story Title</Label>
                <Input
                  id="savvas-story"
                  value={curriculumData.savvasStory || exemplarAnalysis?.extractedData?.storyTitle || ''}
                  onChange={(e) => updateField('savvasStory', e.target.value)}
                  placeholder="e.g., The Tale of Peter Rabbit"
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="savvas-comprehension" className="text-sm">Comprehension Focus</Label>
                <Input
                  id="savvas-comprehension"
                  value={curriculumData.savvasComprehension || ''}
                  onChange={(e) => updateField('savvasComprehension', e.target.value)}
                  placeholder="e.g., Character Traits"
                  className="mt-1 text-sm"
                />
              </div>

              <div className="text-xs text-muted-foreground pt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Enter Savvas unit, week, and day. Optional: add phonics/story details
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="min-w-[200px]"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Curriculum Details
        </Button>
      </div>

      {!canSave && (
        <p className="text-xs text-center" style={{ color: 'var(--ao-text)' }}>
          ⚠️ Please fill in required fields for at least one curriculum type
        </p>
      )}
    </div>
  );
}
