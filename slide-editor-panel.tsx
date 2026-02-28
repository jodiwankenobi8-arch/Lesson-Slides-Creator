import { Slide, SlideType } from '../types';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface SlideEditorPanelProps {
  slide: Slide;
  onUpdate: (slide: Slide) => void;
}

export function SlideEditorPanel({ slide, onUpdate }: SlideEditorPanelProps) {
  const updateField = (field: keyof Slide, value: any) => {
    onUpdate({ ...slide, [field]: value });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...(slide.items || [])];
    newItems[index] = value;
    updateField('items', newItems);
  };

  const addItem = () => {
    const newItems = [...(slide.items || []), ''];
    updateField('items', newItems);
  };

  const removeItem = (index: number) => {
    const newItems = slide.items?.filter((_, idx) => idx !== index) || [];
    updateField('items', newItems);
  };

  const slideTypeLabels: Record<SlideType, string> = {
    title: 'Title Slide',
    objectives: 'Learning Objectives',
    vocabulary: 'Vocabulary',
    content: 'Content',
    reading: 'Reading Passage',
    discussion: 'Discussion Questions',
    activity: 'Activity',
    summary: 'Summary/Exit Ticket'
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <Label htmlFor="slide-type">Slide Type</Label>
        <Select value={slide.type} onValueChange={(value) => updateField('type', value as SlideType)}>
          <SelectTrigger id="slide-type" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(slideTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="slide-title">Title</Label>
        <Input
          id="slide-title"
          value={slide.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-2"
          placeholder="Slide title"
        />
      </div>

      {(slide.type === 'title' || slide.type === 'reading' || slide.type === 'activity') && (
        <div>
          <Label htmlFor="slide-subtitle">Subtitle</Label>
          <Input
            id="slide-subtitle"
            value={slide.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
            className="mt-2"
            placeholder="Optional subtitle"
          />
        </div>
      )}

      {slide.type === 'title' && (
        <div>
          <Label htmlFor="slide-background">Background Color</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="slide-background"
              type="color"
              value={slide.background || '#4F46E5'}
              onChange={(e) => updateField('background', e.target.value)}
              className="w-20 h-10"
            />
            <Input
              value={slide.background || '#4F46E5'}
              onChange={(e) => updateField('background', e.target.value)}
              placeholder="#4F46E5"
              className="flex-1"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="slide-content">Content</Label>
        <Textarea
          id="slide-content"
          value={slide.content}
          onChange={(e) => updateField('content', e.target.value)}
          className="mt-2 min-h-24"
          placeholder="Main content text"
        />
      </div>

      {slide.type !== 'title' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>List Items</Label>
            <Button onClick={addItem} size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {slide.items?.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <Textarea
                  value={item}
                  onChange={(e) => updateItem(idx, e.target.value)}
                  placeholder={`Item ${idx + 1}`}
                  className="flex-1 min-h-20"
                />
                <Button
                  onClick={() => removeItem(idx)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {(!slide.items || slide.items.length === 0) && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--ao-muted)' }}>
                No items yet. Click "Add Item" to create a list.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}