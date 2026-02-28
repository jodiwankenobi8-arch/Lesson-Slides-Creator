import { Slide, SlideType } from '../types';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Plus, Trash2 } from 'lucide-react';

interface KindergartenSlideEditorProps {
  slide: Slide;
  onUpdate: (slide: Slide) => void;
}

export function KindergartenSlideEditor({ slide, onUpdate }: KindergartenSlideEditorProps) {
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
    title: 'Welcome Slide',
    objectives: 'Learning Goals',
    vocabulary: 'New Words',
    content: 'Content',
    reading: 'Story Time',
    discussion: 'Discussion',
    activity: 'Activity Time',
    summary: 'Wrap Up'
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

      <div className="flex items-center justify-between">
        <Label htmlFor="show-mascot">Show Bird Mascot</Label>
        <Switch
          id="show-mascot"
          checked={slide.showMascot !== false}
          onCheckedChange={(checked) => updateField('showMascot', checked)}
        />
      </div>

      <div>
        <Label htmlFor="slide-title">Main Heading</Label>
        <Input
          id="slide-title"
          value={slide.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="mt-2 text-lg"
          placeholder="Welcome Readers!"
        />
      </div>

      <div>
        <Label htmlFor="slide-subtitle">Subheading (Blue Text)</Label>
        <Input
          id="slide-subtitle"
          value={slide.subtitle || ''}
          onChange={(e) => updateField('subtitle', e.target.value)}
          className="mt-2"
          placeholder="Get your brain ready to learn!"
        />
      </div>

      <div>
        <Label htmlFor="slide-content">Content Text</Label>
        <Textarea
          id="slide-content"
          value={slide.content}
          onChange={(e) => updateField('content', e.target.value)}
          className="mt-2 min-h-24"
          placeholder="Main content or story text"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>List Items / Bullet Points</Label>
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

      <div className="pt-4 border-t">
        <p className="text-xs italic" style={{ color: 'var(--ao-muted)' }}>
          Tip: Use emojis in your text to make slides more fun for young learners! 🎉📚✨
        </p>
      </div>
    </div>
  );
}