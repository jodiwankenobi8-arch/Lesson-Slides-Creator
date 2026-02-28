/**
 * Lesson Teach Panel (Step 5)
 * 
 * Teaching mode launcher:
 * - Fullscreen presentation mode
 * - Navigation controls
 * - Timer
 * - Teacher notes
 */

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Play,
  Monitor,
  Clock,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { LessonSetup } from '../types/lesson-setup-types';

interface LessonTeachPanelProps {
  lessonId: string;
  lessonSetup: LessonSetup;
  onBack: () => void;
}

export function LessonTeachPanel({
  lessonId,
  lessonSetup,
  onBack,
}: LessonTeachPanelProps) {
  const handleStartTeaching = () => {
    toast.info('Opening fullscreen presentation...');
    // TODO: Launch fullscreen presentation mode
  };

  const handleMarkTaught = () => {
    toast.success('Lesson marked as taught!');
    // TODO: Update lesson status to "taught"
  };

  const features = [
    {
      icon: Monitor,
      title: 'Fullscreen Presentation',
      description: 'Distraction-free teaching mode',
    },
    {
      icon: Clock,
      title: 'Built-in Timer',
      description: 'Keep your lesson on track',
    },
    {
      icon: FileText,
      title: 'Teacher Notes',
      description: 'View notes without students seeing',
    },
    {
      icon: Play,
      title: 'Click-to-Advance',
      description: 'Control pacing with keyboard or mouse',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Teach Mode</h2>
        <p className="text-muted-foreground">
          Present your lesson to students with fullscreen teaching tools
        </p>
      </div>

      {/* Ready to Teach Card */}
      <Card className="border-sky-200" style={{ background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)' }}>
        <CardHeader>
          <CardTitle className="text-2xl">Your Lesson is Ready!</CardTitle>
          <CardDescription className="text-base">
            Click below to start fullscreen presentation mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="w-full h-14" onClick={handleStartTeaching}>
            <Play className="w-6 h-6 mr-2" />
            Start Teach Mode
          </Button>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Features</CardTitle>
          <CardDescription>
            Everything you need for interactive instruction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts</CardTitle>
          <CardDescription>Quick commands while teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Next slide</span>
              <kbd className="px-2 py-1 bg-white border rounded text-xs font-mono">
                →
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Previous slide</span>
              <kbd className="px-2 py-1 bg-white border rounded text-xs font-mono">
                ←
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Start/Stop timer</span>
              <kbd className="px-2 py-1 bg-white border rounded text-xs font-mono">
                T
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Exit fullscreen</span>
              <kbd className="px-2 py-1 bg-white border rounded text-xs font-mono">
                ESC
              </kbd>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark as Taught */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Finish Lesson
          </CardTitle>
          <CardDescription>
            Mark this lesson as taught after you finish
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleMarkTaught}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Taught
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Build
        </Button>
      </div>
    </div>
  );
}
