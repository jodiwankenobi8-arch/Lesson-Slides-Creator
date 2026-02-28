/**
 * Webpage Import Component
 * 
 * Allows teachers to import online resources as lesson references.
 * Enforces strict limits (1-3 URLs, http/https only) and handles errors gracefully.
 */

import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN

interface WebpageImportProps {
  lessonId: string;
  onImportComplete: (fileId: string, title: string, url: string) => void;
  maxUrls?: number;
  currentUrlCount?: number;
}

interface ImportedWebpage {
  fileId: string;
  url: string;
  title: string;
  excerpt: string;
  status: 'importing' | 'success' | 'error';
  error?: string;
  errorType?: string;
}

export function WebpageImport({ 
  lessonId, 
  onImportComplete,
  maxUrls = 3,
  currentUrlCount = 0,
}: WebpageImportProps) {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedPages, setImportedPages] = useState<ImportedWebpage[]>([]);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Check URL limit
    if (currentUrlCount + importedPages.length >= maxUrls) {
      toast.error(`Maximum ${maxUrls} URLs allowed per lesson`);
      return;
    }

    // Validate URL format
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        toast.error('Only HTTP and HTTPS URLs are allowed');
        return;
      }
    } catch (e) {
      toast.error('Invalid URL format');
      return;
    }

    setIsImporting(true);
    const tempFileId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to list immediately with importing status
    const newPage: ImportedWebpage = {
      fileId: tempFileId,
      url: url,
      title: 'Importing...',
      excerpt: '',
      status: 'importing',
    };
    setImportedPages(prev => [...prev, newPage]);
    setUrl('');

    try {
      console.log(`🌐 Importing webpage: ${url}`);
      
      const response = await api.webpageExtract({ url });

      const result = await response.json();

      if (!result.success) {
        // Update with error
        setImportedPages(prev =>
          prev.map(p =>
            p.fileId === tempFileId
              ? {
                  ...p,
                  status: 'error',
                  error: result.error || 'Failed to import webpage',
                  errorType: result.errorType,
                  title: new URL(url).hostname,
                }
              : p
          )
        );

        // Show specific error message
        if (result.errorType === 'blocked') {
          toast.error('Page requires login', {
            description: 'Please upload a PDF or screenshot instead',
            duration: 5000,
          });
        } else if (result.errorType === 'size_limit') {
          toast.error('Page too large', {
            description: result.error,
            duration: 5000,
          });
        } else {
          toast.error('Import failed', {
            description: result.error,
            duration: 5000,
          });
        }

        return;
      }

      // Success - store as chunks
      const fileId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const chunkId = `chunk_${fileId}_1`;
      const chunkKey = `extraction_chunk:${lessonId}:${fileId}:${chunkId}`;

      // Save chunk with quality metadata from server
      await api.extractionChunk({
        lessonId,
        chunkIndex: 1,
        text: result.textContent,
      });

      // Save extraction summary
      await api.kvSet(`extraction:${fileId}`, {
        fileId,
        lessonId,
        fileName: result.title,
        url: result.url,
        source: 'web',
        chunkCount: 1,
        contentLength: result.contentLength,
        extractedAt: new Date().toISOString(),
      });

      // Update status to success
      setImportedPages(prev =>
        prev.map(p =>
          p.fileId === tempFileId
            ? {
                ...p,
                fileId,
                status: 'success',
                title: result.title || 'Untitled',
                excerpt: result.excerpt || '',
              }
            : p
        )
      );

      toast.success(`Imported: ${result.title}`, {
        description: `${result.contentLength?.toLocaleString()} characters extracted`,
      });

      onImportComplete(fileId, result.title || 'Untitled', result.url);
    } catch (error) {
      console.error('Import error:', error);
      
      setImportedPages(prev =>
        prev.map(p =>
          p.fileId === tempFileId
            ? {
                ...p,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                title: 'Import failed',
              }
            : p
        )
      );

      toast.error('Network error', {
        description: 'Failed to connect to server',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-3">
          <Globe className="w-5 h-5 mt-0.5" style={{ color: 'var(--ao-navy)' }} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Online Resource (Optional)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import educational webpages as lesson references. Maximum {maxUrls} URLs per lesson.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isImporting && handleImport()}
            placeholder="https://example.com/article"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--ao-sky)' } as any}
            disabled={isImporting || currentUrlCount + importedPages.length >= maxUrls}
          />
          <button
            onClick={handleImport}
            disabled={isImporting || !url.trim() || currentUrlCount + importedPages.length >= maxUrls}
            className="px-4 py-2 text-white rounded-md text-sm font-medium hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: 'var(--ao-navy)' }}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </button>
        </div>

        {currentUrlCount + importedPages.length >= maxUrls && (
          <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'var(--ao-text)' }}>
            <AlertCircle className="w-4 h-4" />
            URL limit reached ({maxUrls} maximum)
          </p>
        )}
      </div>

      {/* Imported Pages List */}
      {importedPages.length > 0 && (
        <div className="space-y-2">
          {importedPages.map((page) => (
            <div
              key={page.fileId}
              className={`border rounded-lg p-3 ${
                page.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : page.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : ''
              }`}
              style={page.status !== 'error' && page.status !== 'success' ? { borderColor: 'var(--processing-border)', backgroundColor: 'var(--processing-bg)' } : {}}
            >
              <div className="flex items-start gap-3">
                {page.status === 'importing' && (
                  <Loader2 className="w-5 h-5 animate-spin mt-0.5" style={{ color: 'var(--processing-border)' }} />
                )}
                {page.status === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                {page.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {page.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline flex items-center gap-1 truncate"
                      style={{ color: 'var(--ao-navy)' }}
                    >
                      {page.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  {page.excerpt && page.status === 'success' && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {page.excerpt}
                    </p>
                  )}
                  {page.error && page.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{page.error}</p>
                  )}
                  {page.status === 'error' && page.errorType === 'blocked' && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      💡 Try uploading a PDF or screenshot instead
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}