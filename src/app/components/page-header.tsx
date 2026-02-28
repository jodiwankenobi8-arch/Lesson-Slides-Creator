/**
 * Standardized Page Header
 * 
 * Consistent header pattern for all pages:
 * - Left: Title + optional description
 * - Right: Primary action button (if applicable)
 * - Enforces flex-wrap to prevent overlap on narrow screens
 * - Apple Orchard Planner: Navy headings with soft charcoal descriptions
 */

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-[240px] flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🍎</span>
            <h1 
              className="text-3xl font-bold" 
              style={{ color: '#1F2A44', fontFamily: "'Montserrat', 'Nunito', sans-serif" }}
            >
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-lg ml-14" style={{ color: '#666666' }}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </>
  );
}