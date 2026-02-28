/**
 * Extraction Preview Panel
 * 
 * Shows extracted text from OCR/file processing with:
 * - Searchable text viewer
 * - Word count and character stats
 * - Copy to clipboard
 * - Download as .txt
 */

import { projectId } from '../../utils/supabase/info';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { 
  Copy, 
  Download, 
  Search, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { cn } from './ui/utils';
import { toast } from 'sonner';
import { getUserAccessToken } from '../../utils/supabase-auth';

interface ExtractionResult {
  fileId: string;
  lessonId: string;
  fileName: string;
  extractedText: string;
  extractedAt: string;
  method: string;
  characterCount: number;
}

interface ExtractionPreviewPanelProps {
  fileId: string | null;
  fileName?: string;
  onClose?: () => void;
  projectId: string;
  publicAnonKey: string;
}

export function ExtractionPreviewPanel({
  fileId,
  fileName,
  onClose,
  projectId,
  publicAnonKey
}: ExtractionPreviewPanelProps) {
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Load extraction data when fileId changes
  useEffect(() => {
    if (!fileId) {
      setExtraction(null);
      setError(null);
      return;
    }

    loadExtraction();
  }, [fileId]);

  const loadExtraction = async () => {
    if (!fileId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.getExtractionFile(fileId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Extraction not found - file may still be processing');
        }
        throw new Error('Failed to load extraction');
      }

      const data = await response.json();
      setExtraction(data);
    } catch (err) {
      console.error('Error loading extraction:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!extraction?.extractedText) return;

    // Try clipboard API with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(extraction.extractedText)
        .then(() => {
          setCopied(true);
          toast.success('Copied to clipboard!');
        })
        .catch((err) => {
          console.error('Clipboard API failed:', err);
          toast.error('Clipboard blocked. Please copy manually.');
        });
    } else {
      // Fallback: select text for manual copy
      toast.error('Clipboard not available. Please copy manually.');
    }
  };

  const handleDownload = () => {
    if (!extraction?.extractedText) return;

    const blob = new Blob([extraction.extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extraction.fileName}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Downloaded as .txt file!');
  };

  // Highlight search matches
  const getHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? `<mark style="background-color: var(--ao-tan); color: var(--ao-text);">${part}</mark>`
        : part
    ).join('');
  };

  // Calculate statistics
  const getStats = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const lines = text.split('\n').length;
    const chars = text.length;
    
    return { words, lines, chars };
  };

  if (!fileId) {
    return (
      <Card className="h-full flex items-center justify-center border-dashed">
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            Select a file to view extracted text
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">Loading Preview...</span>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--processing-border)' }} />
            <p className="text-sm text-gray-500">Loading extracted text...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">Error</span>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-gray-700 mb-4">{error}</p>
            <Button onClick={loadExtraction} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!extraction) {
    return null;
  }

  const stats = getStats(extraction.extractedText);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: 'var(--ao-navy)' }} />
              <span className="truncate">{fileName || extraction.fileName}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Extracted {stats.words.toLocaleString()} words • {stats.chars.toLocaleString()} characters • {stats.lines.toLocaleString()} lines
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="ml-2">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search in text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="gap-2"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full border rounded-lg bg-gray-50">
          <div className="p-4">
            <pre 
              className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800"
              dangerouslySetInnerHTML={{
                __html: getHighlightedText(extraction.extractedText, searchQuery)
              }}
            />
          </div>
        </ScrollArea>

        {/* Metadata Footer */}
        <div className="mt-4 pt-4 border-t text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Extraction Method:</span>
            <span className="font-medium text-gray-700">{extraction.method.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Extracted:</span>
            <span className="font-medium text-gray-700">
              {new Date(extraction.extractedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}