/**
 * Lazy-Loaded Components
 * 
 * Heavy components loaded on-demand to improve initial load time.
 * Especially important for older school laptops.
 * 
 * LAZY-LOADED:
 * - Lesson wizard (only loaded when creating lesson)
 * - Extraction preview (only loaded when reviewing)
 * - Webpage import (only when importing webpage)
 * - Diagnostics (only on diagnostics page)
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback component
 */
function LoadingFallback({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px] w-full">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

/**
 * HOC to wrap lazy components with Suspense
 */
export function withLazyLoad<P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy-loaded lesson wizard
 * Only loaded when user creates a new lesson
 */
const LessonWizardLazy = lazy(() => 
  import('./lesson-wizard').then((mod) => ({ default: mod.LessonWizard }))
);

export const LessonWizard = withLazyLoad(
  LessonWizardLazy,
  'Loading lesson builder...'
);

/**
 * Lazy-loaded extraction preview
 * Only loaded when reviewing uploads
 */
const ExtractionPreviewPanelLazy = lazy(() =>
  import('./extraction-preview-panel').then((mod) => ({ default: mod.ExtractionPreviewPanel }))
);

export const ExtractionPreviewPanel = withLazyLoad(
  ExtractionPreviewPanelLazy,
  'Loading preview...'
);

/**
 * Lazy-loaded webpage import
 * Only loaded when user clicks webpage import
 */
const WebpageImportLazy = lazy(() =>
  import('./webpage-import').then((mod) => ({ default: mod.WebpageImport }))
);

export const WebpageImport = withLazyLoad(
  WebpageImportLazy,
  'Loading webpage import...'
);

/**
 * Lazy-loaded diagnostics panel
 * Only loaded on diagnostics page
 */
const AuthDiagnosticsLazy = lazy(() =>
  import('./auth-diagnostics').then((mod) => ({ default: mod.AuthDiagnostics }))
);

export const AuthDiagnostics = withLazyLoad(
  AuthDiagnosticsLazy,
  'Loading diagnostics...'
);

/**
 * Pre-load a component in the background
 * Call this when you know the user will need it soon
 * 
 * Example:
 * ```typescript
 * // Pre-load lesson wizard when user enters lesson page
 * preloadComponent('LessonWizard');
 * ```
 */
export async function preloadComponent(
  componentName: 'LessonWizard' | 'ExtractionPreviewPanel' | 'WebpageImport' | 'AuthDiagnostics'
) {
  console.log(`📦 Preloading ${componentName}...`);
  
  try {
    switch (componentName) {
      case 'LessonWizard':
        await import('./lesson-wizard');
        break;
      case 'ExtractionPreviewPanel':
        await import('./extraction-preview-panel');
        break;
      case 'WebpageImport':
        await import('./webpage-import');
        break;
      case 'AuthDiagnostics':
        await import('./auth-diagnostics');
        break;
    }
    console.log(`✅ ${componentName} preloaded`);
  } catch (error) {
    console.warn(`⚠️ Failed to preload ${componentName}:`, error);
  }
}

/**
 * Pre-load all components for offline use
 * Call this when connected to WiFi
 */
export async function preloadAllComponents() {
  console.log('📦 Preloading all components for offline use...');
  
  const components: Array<Parameters<typeof preloadComponent>[0]> = [
    'LessonWizard',
    'ExtractionPreviewPanel',
    'WebpageImport',
    'AuthDiagnostics',
  ];
  
  await Promise.all(components.map(preloadComponent));
  
  console.log('✅ All components preloaded');
}
