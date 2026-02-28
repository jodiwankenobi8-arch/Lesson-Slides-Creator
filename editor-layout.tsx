/**
 * Editor Layout
 * 
 * Minimal layout for lesson editor/workspace.
 * No sidebar. Just top bar with lesson context + main content.
 * Uses sticky header pattern with proper z-index layering.
 * Apple Orchard Planner: Navy header on warm cream background
 */

import { ReactNode } from 'react';
import { Toaster } from './ui/sonner';
import { NavControl } from './nav-control';
import { Z_INDEX } from '../utils/z-index-scale';

interface EditorLayoutProps {
  children: ReactNode;
  lessonTitle?: string;
  lessonSubject?: string;
  lessonDuration?: string;
  lessonSources?: string;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export function EditorLayout({
  children,
  lessonTitle,
  lessonSubject,
  lessonDuration,
  lessonSources,
  lastSaved,
  isSaving = false,
}: EditorLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFF6E9' }}>
      {/* Universal Navigation - Top-left */}
      <div className={`fixed top-4 left-4 ${Z_INDEX.NAV_CONTROL}`}>
        <NavControl />
      </div>

      {/* Top Bar with Lesson Context - Sticky with Navy background */}
      <header 
        className={`sticky top-0 border-b px-6 py-4 ${Z_INDEX.STICKY_HEADER}`}
        style={{ backgroundColor: '#1F2A44', borderColor: '#2A3A5A' }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate" style={{ color: '#FFFFFF' }}>
              {lessonTitle || 'Untitled Lesson'}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {lessonSubject && (
                <span className="px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: '#CFE3F5', color: '#1F2A44' }}>
                  {lessonSubject}
                </span>
              )}
              {lessonDuration && (
                <span className="px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: '#6FA86B', color: '#FFFFFF' }}>
                  {lessonDuration}
                </span>
              )}
              {lessonSources && (
                <span className="px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: '#C84C4C', color: '#FFFFFF' }}>
                  {lessonSources}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {isSaving ? (
              <span className="text-sm" style={{ color: '#CFE3F5' }}>Saving...</span>
            ) : (
              <span className="text-sm" style={{ color: '#CFE3F5' }}>
                {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Auto-saved'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Toast Notifications */}
      <Toaster richColors position="top-right" />
    </div>
  );
}