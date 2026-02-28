/**
 * Upload Tips Banner
 * Shows helpful tips for optimizing upload performance
 */

import { Info, Zap } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function UploadTipsBanner() {
  return (
    <Card style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--ao-sky)' }}>
      <CardContent className="py-3 px-4">
        {/* Icon + Content */}
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--ao-sky)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--info-text)' }}>
              Upload Optimization Tips
            </p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--info-text)' }}>
              <li>• <strong>PowerPoint files:</strong> Compress images before uploading (Picture Format → Compress Pictures → Email quality)</li>
              <li>• <strong>Slide Pictures:</strong> Use PNG for clarity, or JPEG for faster uploads</li>
              <li>• <strong>Multiple files:</strong> Process them in batches rather than all at once for stability</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}