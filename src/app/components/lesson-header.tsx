import { LessonTemplate } from '../types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Save, FileDown, Home } from 'lucide-react';
import { Link } from 'react-router';

interface LessonHeaderProps {
  template: LessonTemplate;
  onUpdate: (template: LessonTemplate) => void;
  onSave: () => void;
}

export function LessonHeader({ template, onUpdate, onSave }: LessonHeaderProps) {
  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="size-4 mr-2" />
              Home
            </Button>
          </Link>
          <div className="h-6 w-px" style={{ backgroundColor: 'var(--ao-border)' }} />
          <div className="flex-1 grid grid-cols-3 gap-3 max-w-2xl">
            <Input
              value={template.name}
              onChange={(e) => onUpdate({ ...template, name: e.target.value })}
              placeholder="Lesson name"
              className="font-semibold"
            />
            <Input
              value={template.subject}
              onChange={(e) => onUpdate({ ...template, subject: e.target.value })}
              placeholder="Subject"
            />
            <Input
              value={template.grade}
              onChange={(e) => onUpdate({ ...template, grade: e.target.value })}
              placeholder="Grade level"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onSave} variant="default">
            <Save className="size-4 mr-2" />
            Save
          </Button>
          <Button variant="outline">
            <FileDown className="size-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}