/**
 * Build Timestamp - Force cache busting
 */

export function BuildTimestamp() {
  const buildTime = '2026-02-28T17:00:00Z-recovery-fix';
  
  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded opacity-50 hover:opacity-100 transition-opacity">
      Build: {buildTime}
    </div>
  );
}