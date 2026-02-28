import { LessonFormData, ContentSection } from '../types';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, Sparkles } from 'lucide-react';

interface LessonFormProps {
  formData: LessonFormData;
  onChange: (data: LessonFormData) => void;
  onGenerate: () => void;
}

export function LessonForm({ formData, onChange, onGenerate }: LessonFormProps) {
  const updateField = (field: keyof LessonFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const updateArrayItem = (field: 'objectives' | 'vocabulary' | 'discussionQuestions' | 'exitTicketQuestions', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const addArrayItem = (field: 'objectives' | 'vocabulary' | 'discussionQuestions' | 'exitTicketQuestions') => {
    updateField(field, [...formData[field], '']);
  };

  const removeArrayItem = (field: 'objectives' | 'vocabulary' | 'discussionQuestions' | 'exitTicketQuestions', index: number) => {
    const newArray = formData[field].filter((_, idx) => idx !== index);
    updateField(field, newArray);
  };

  const updateContentSection = (index: number, section: ContentSection) => {
    const newSections = [...formData.contentSections];
    newSections[index] = section;
    updateField('contentSections', newSections);
  };

  const addContentSection = () => {
    updateField('contentSections', [...formData.contentSections, { title: '', content: '', items: [''] }]);
  };

  const removeContentSection = (index: number) => {
    updateField('contentSections', formData.contentSections.filter((_, idx) => idx !== index));
  };

  const updateContentSectionItem = (sectionIndex: number, itemIndex: number, value: string) => {
    const section = { ...formData.contentSections[sectionIndex] };
    section.items[itemIndex] = value;
    updateContentSection(sectionIndex, section);
  };

  const addContentSectionItem = (sectionIndex: number) => {
    const section = { ...formData.contentSections[sectionIndex] };
    section.items = [...section.items, ''];
    updateContentSection(sectionIndex, section);
  };

  const removeContentSectionItem = (sectionIndex: number, itemIndex: number) => {
    const section = { ...formData.contentSections[sectionIndex] };
    section.items = section.items.filter((_, idx) => idx !== itemIndex);
    updateContentSection(sectionIndex, section);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Lesson Info */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Information</CardTitle>
          <CardDescription>Basic details about your lesson</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lesson-name">Lesson Name</Label>
            <Input
              id="lesson-name"
              value={formData.lessonName}
              onChange={(e) => updateField('lessonName', e.target.value)}
              placeholder="Interactive Kindergarten ELA"
              className="mt-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                placeholder="English Language Arts"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade Level</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => updateField('grade', e.target.value)}
                placeholder="K-1"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Slide */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome Slide</CardTitle>
          <CardDescription>Your opening slide with the bird mascot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="welcome-title">Main Title</Label>
            <Input
              id="welcome-title"
              value={formData.welcomeTitle}
              onChange={(e) => updateField('welcomeTitle', e.target.value)}
              placeholder="Welcome Readers!"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="welcome-subtitle">Subtitle</Label>
            <Input
              id="welcome-subtitle"
              value={formData.welcomeSubtitle}
              onChange={(e) => updateField('welcomeSubtitle', e.target.value)}
              placeholder="Get your brain ready to learn!"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Learning Objectives</CardTitle>
              <CardDescription>What students will learn today</CardDescription>
            </div>
            <Button onClick={() => addArrayItem('objectives')} size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.objectives.map((obj, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={obj}
                onChange={(e) => updateArrayItem('objectives', idx, e.target.value)}
                placeholder={`Objective ${idx + 1}`}
                className="flex-1"
              />
              <Button onClick={() => removeArrayItem('objectives', idx)} size="sm" variant="ghost">
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Vocabulary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vocabulary Words</CardTitle>
              <CardDescription>Format: "Word - Definition"</CardDescription>
            </div>
            <Button onClick={() => addArrayItem('vocabulary')} size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.vocabulary.map((vocab, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={vocab}
                onChange={(e) => updateArrayItem('vocabulary', idx, e.target.value)}
                placeholder="Sound - The noise letters make"
                className="flex-1"
              />
              <Button onClick={() => removeArrayItem('vocabulary', idx)} size="sm" variant="ghost">
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Sections</CardTitle>
              <CardDescription>Main teaching content (letters, numbers, concepts, etc.)</CardDescription>
            </div>
            <Button onClick={addContentSection} size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.contentSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="border rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--ao-cream)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Section {sectionIdx + 1}</span>
                <Button onClick={() => removeContentSection(sectionIdx)} size="sm" variant="ghost">
                  <Trash2 className="size-4 text-red-600" />
                </Button>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateContentSection(sectionIdx, { ...section, title: e.target.value })}
                  placeholder="Letter of the Day: B"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Subtitle (optional)</Label>
                <Input
                  value={section.subtitle || ''}
                  onChange={(e) => updateContentSection(sectionIdx, { ...section, subtitle: e.target.value })}
                  placeholder='B says "buh"'
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Content Text</Label>
                <Textarea
                  value={section.content}
                  onChange={(e) => updateContentSection(sectionIdx, { ...section, content: e.target.value })}
                  placeholder="Can you think of words that start with B?"
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Examples/Items</Label>
                  <Button onClick={() => addContentSectionItem(sectionIdx)} size="sm" variant="outline">
                    <Plus className="size-3" />
                  </Button>
                </div>
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) => updateContentSectionItem(sectionIdx, itemIdx, e.target.value)}
                      placeholder="🐻 Bear"
                      className="flex-1"
                    />
                    <Button onClick={() => removeContentSectionItem(sectionIdx, itemIdx)} size="sm" variant="ghost">
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reading Passage */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Passage (Optional)</CardTitle>
          <CardDescription>A story or passage for students to read</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reading-title">Story Title</Label>
            <Input
              id="reading-title"
              value={formData.readingPassage?.title || ''}
              onChange={(e) => updateField('readingPassage', { ...formData.readingPassage, title: e.target.value })}
              placeholder="Story Time!"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="reading-text">Story Text</Label>
            <Textarea
              id="reading-text"
              value={formData.readingPassage?.text || ''}
              onChange={(e) => updateField('readingPassage', { ...formData.readingPassage, text: e.target.value })}
              placeholder="The little bird loved to read books..."
              className="mt-2 min-h-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discussion Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Discussion Questions</CardTitle>
              <CardDescription>Questions to ask students</CardDescription>
            </div>
            <Button onClick={() => addArrayItem('discussionQuestions')} size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.discussionQuestions.map((question, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => updateArrayItem('discussionQuestions', idx, e.target.value)}
                placeholder="What did you learn today?"
                className="flex-1"
              />
              <Button onClick={() => removeArrayItem('discussionQuestions', idx)} size="sm" variant="ghost">
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activity (Optional)</CardTitle>
          <CardDescription>A hands-on activity for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="activity-title">Activity Title</Label>
            <Input
              id="activity-title"
              value={formData.activity?.title || ''}
              onChange={(e) => updateField('activity', { ...formData.activity, title: e.target.value, instructions: formData.activity?.instructions || [''] })}
              placeholder="Time to Practice!"
              className="mt-2"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Instructions</Label>
              <Button 
                onClick={() => updateField('activity', { 
                  ...formData.activity, 
                  title: formData.activity?.title || '',
                  instructions: [...(formData.activity?.instructions || []), ''] 
                })} 
                size="sm" 
                variant="outline"
              >
                <Plus className="size-4 mr-1" />
                Add
              </Button>
            </div>
            {formData.activity?.instructions.map((instruction, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input
                  value={instruction}
                  onChange={(e) => {
                    const newInstructions = [...(formData.activity?.instructions || [])];
                    newInstructions[idx] = e.target.value;
                    updateField('activity', { ...formData.activity, title: formData.activity?.title || '', instructions: newInstructions });
                  }}
                  placeholder={`Step ${idx + 1}`}
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    const newInstructions = formData.activity?.instructions.filter((_, i) => i !== idx) || [];
                    updateField('activity', { ...formData.activity, title: formData.activity?.title || '', instructions: newInstructions });
                  }} 
                  size="sm" 
                  variant="ghost"
                >
                  <Trash2 className="size-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exit Ticket */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exit Ticket Questions</CardTitle>
              <CardDescription>Final review questions before leaving</CardDescription>
            </div>
            <Button onClick={() => addArrayItem('exitTicketQuestions')} size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.exitTicketQuestions.map((question, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => updateArrayItem('exitTicketQuestions', idx, e.target.value)}
                placeholder="What was your favorite part?"
                className="flex-1"
              />
              <Button onClick={() => removeArrayItem('exitTicketQuestions', idx)} size="sm" variant="ghost">
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
        <Button onClick={onGenerate} className="w-full h-12 text-lg bg-sky-600 hover:bg-sky-700">
          <Sparkles className="size-5 mr-2" />
          Generate Slideshow
        </Button>
      </div>
    </div>
  );
}