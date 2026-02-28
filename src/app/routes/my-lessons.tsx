import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router';
import { FileText, Trash2, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { getAllLessons, deleteLesson, type SavedLesson } from '../utils/supabase-lessons';
import { toast } from 'sonner';

// My Lessons - Apple Orchard Design

export default function MyLessons() {
  const [lessons, setLessons] = useState<SavedLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    try {
      setIsLoading(true);
      const allLessons = await getAllLessons();
      // Sort by most recent first
      const sorted = allLessons.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
      setLessons(sorted);
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteLesson(lessonId);
      toast.success('Lesson deleted successfully');
      loadLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  }

  function handleOpenLesson(lessonId: string) {
    navigate(`/lessons/${lessonId}`);
  }

  function handleCreateNew() {
    navigate('/lessons/new');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ao-navy)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--ao-cream)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--ao-navy)' }}>
              My Lessons
            </h1>
            <p className="text-lg" style={{ color: 'var(--ao-muted)' }}>
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} saved
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="font-semibold"
            style={{ backgroundColor: 'var(--ao-navy)', color: 'var(--ao-white)' }}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Create New Lesson
          </Button>
        </div>

        {lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--ao-muted)' }} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--ao-text)' }}>
                No lessons yet
              </h2>
              <p className="mb-6" style={{ color: 'var(--ao-muted)' }}>
                Create your first lesson to get started
              </p>
              <Button
                onClick={handleCreateNew}
                style={{ backgroundColor: 'var(--ao-navy)', color: 'var(--ao-white)' }}
              >
                Create First Lesson
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleOpenLesson(lesson.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2" style={{ color: 'var(--ao-navy)' }}>
                      {lesson.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lesson.id);
                      }}
                      className="shrink-0"
                      style={{ color: 'var(--ao-red)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ao-muted)' }}>
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(lesson.updatedAt || lesson.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ao-muted)' }}>
                    <FileText className="w-4 h-4" />
                    {lesson.subject === 'ela' ? 'ELA' : 'Math'} • {lesson.status || 'Draft'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
