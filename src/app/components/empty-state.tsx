/**
 * Apple Orchard Planner - Empty State Component
 * 
 * Welcoming, encouraging empty states with charming accents
 */

import { ReactNode } from 'react';
import { PolkaDotPanel, AppleIcon } from './decorative-patterns';
import { Button } from './ui/button';

interface EmptyStateProps {
  variant?: 'pink' | 'blue';
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  variant = 'pink',
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <PolkaDotPanel variant={variant} className="text-center max-w-md mx-auto my-12">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        {icon || <span className="text-6xl">🍎</span>}
      </div>

      {/* Title */}
      <h3 
        className="text-xl font-semibold mb-3"
        style={{ 
          color: '#1F2A44',
          fontFamily: "'Montserrat', 'Nunito', sans-serif"
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-base mb-6" style={{ color: '#666666' }}>
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          size="lg"
          className="mx-auto"
        >
          {action.label}
        </Button>
      )}
    </PolkaDotPanel>
  );
}

/**
 * No Lessons Empty State
 */
export function NoLessonsEmptyState({ onCreateLesson }: { onCreateLesson: () => void }) {
  return (
    <EmptyState
      variant="pink"
      title="✨ Let's Create Your First Lesson! ✨"
      description="Start building beautiful, interactive slide decks with Florida B.E.S.T. standards alignment."
      action={{
        label: '🍎 Create My First Lesson',
        onClick: onCreateLesson,
      }}
    />
  );
}

/**
 * No Materials Empty State
 */
export function NoMaterialsEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      variant="blue"
      title="📚 Ready to Upload Materials?"
      description="Upload PDFs, PowerPoints, or documents to get started building your lesson."
      action={{
        label: '📎 Upload Materials',
        onClick: onUpload,
      }}
    />
  );
}

/**
 * No Results Empty State
 */
export function NoResultsEmptyState({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      variant="blue"
      title="🔍 No Matches Found"
      description={
        searchTerm
          ? `No lessons match "${searchTerm}". Try a different search term!`
          : "Adjust your filters to see more results."
      }
    />
  );
}