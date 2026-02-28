import { createBrowserRouter, Navigate } from 'react-router';
import Dashboard from './routes/dashboard';
import Auth from './routes/auth';
import LessonWorkspace from './routes/lesson-workspace';
import MyLessons from './routes/my-lessons';

// All routes are defined here
// Build: 2026-02-28T16:45:00Z-apple-orchard - Applied Apple Orchard Planner design system

// Error boundary for lessons routes
function LessonsErrorBoundary() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--ao-red)' }}>Oops! Something went wrong</h1>
        <p className="mb-4" style={{ color: 'var(--ao-muted)' }}>There was an error loading the lessons page.</p>
        <a href="/dashboard" className="hover:underline" style={{ color: 'var(--ao-navy)' }}>Go to Dashboard</a>
      </div>
    </div>
  );
}

// Component to create new lesson and redirect
function NewLesson() {
  const lessonId = `lesson-${Date.now()}`;
  localStorage.setItem('current-draft-lesson-id', lessonId);
  return <Navigate to={`/lessons/${lessonId}?subject=ela&step=setup`} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: () => <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    Component: Auth,
  },
  {
    path: '/login',
    Component: Auth,
  },
  {
    path: '/signin',
    Component: Auth,
  },
  {
    path: '/signup',
    Component: Auth,
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/lessons',
    Component: MyLessons,
    ErrorBoundary: LessonsErrorBoundary,
  },
  {
    path: '/lessons/new',
    Component: NewLesson,
  },
  {
    path: '/lessons/:lessonId',
    Component: LessonWorkspace,
    ErrorBoundary: LessonsErrorBoundary,
  },
  {
    path: '/my-lessons',
    Component: MyLessons,
    ErrorBoundary: LessonsErrorBoundary,
  },
  // Catch-all 404 route - must be last
  {
    path: '*',
    Component: () => (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="mb-4">The page you're looking for doesn't exist.</p>
          <a href="/dashboard" className="hover:underline" style={{ color: 'var(--ao-navy)' }}>Go to Dashboard</a>
        </div>
      </div>
    ),
  },
]);