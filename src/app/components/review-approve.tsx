// Review & Approve Screen - Teacher reviews extracted lesson focus and approves for generation
// This is where the magic happens: AI suggestions + teacher expertise = perfect lessons

import { projectId } from '../../utils/supabase/info';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN

interface LessonFocus {
  primaryFocus: string;
  phonicsPattern?: string;
  targetGrapheme?: string;
  targetPhoneme?: string;
  secondaryFocus?: string[];
  gradeLevel?: string;
  confidence: number;
}

interface ClassifiedContent {
  vocabularyWords: string[];
  highFrequencyWords: string[];
  decodableWords: string[];
  comprehensionQuestions: string[];
  phoneticExamples: string[];
  confidence: number;
}

interface LessonAnalysis {
  focus: LessonFocus;
  content: ClassifiedContent;
  extractedAt: string;
  sourceChunkCount: number;
}

interface ReviewApproveProps {
  lessonId: string;
  onApprove: () => void;
  onBack: () => void;
}

export function ReviewApprove({ lessonId, onApprove, onBack }: ReviewApproveProps) {
  const [analysis, setAnalysis] = useState<LessonAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingFocus, setEditingFocus] = useState(false);
  const [editedFocus, setEditedFocus] = useState<LessonFocus | null>(null);
  const [editingContent, setEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState<ClassifiedContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrRunAnalysis();
  }, [lessonId]);

  async function loadOrRunAnalysis() {
    setLoading(true);
    setError(null);

    try {
      // Try to load existing analysis
      const response = await api.getAnalysis(lessonId);

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setEditedFocus(data.analysis.focus);
        setEditedContent(data.analysis.content);
      } else {
        // No existing analysis - run it now
        await runAnalysis();
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await api.analyzeLesson({ lessonId });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setEditedFocus(data.analysis.focus);
      setEditedContent(data.analysis.content);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveFocusOverride() {
    if (!editedFocus) return;

    setSaving(true);
    try {
      const response = await api.overrideFocus({ 
        lessonId,
        focus: editedFocus,
      });

      if (!response.ok) {
        throw new Error('Failed to save focus override');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setEditingFocus(false);
    } catch (err) {
      console.error('Error saving focus override:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function saveContentOverride() {
    if (!editedContent) return;

    setSaving(true);
    try {
      const response = await api.overrideContent({ 
        lessonId,
        content: editedContent,
      });

      if (!response.ok) {
        throw new Error('Failed to save content override');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setEditingContent(false);
    } catch (err) {
      console.error('Error saving content override:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || analyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--processing-bg)] via-white to-[var(--info-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[var(--processing-text)] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {analyzing ? 'Analyzing Your Lesson...' : 'Loading...'}
          </h2>
          <p className="text-gray-600">
            {analyzing ? 'Our AI is reading your materials and identifying the lesson focus.' : 'Please wait...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--processing-bg)] via-white to-[var(--info-bg)] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Go Back
            </button>
            <button
              onClick={runAnalysis}
              className="flex-1 px-4 py-3 bg-[var(--ao-navy)] text-white rounded-lg font-semibold hover:bg-[var(--ao-navy)]/90 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const confidenceColor = analysis.focus.confidence >= 80 ? 'text-green-600' : 
                          analysis.focus.confidence >= 60 ? 'text-[var(--ao-text)]' : 'text-[var(--ao-red)]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--processing-bg)] via-white to-[var(--info-bg)] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-[var(--processing-text)]" />
            <h1 className="text-4xl font-bold text-gray-900">Review & Approve</h1>
          </div>
          <p className="text-lg text-gray-600">
            We've analyzed your materials. Review our suggestions and make any adjustments before generating your lesson.
          </p>
        </div>

        {/* Lesson Focus Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Focus</h2>
              <p className="text-gray-600">
                The primary phonics pattern or skill for this lesson
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-sm font-semibold ${confidenceColor}`}>
                {analysis.focus.confidence}% confident
              </div>
              {!editingFocus && (
                <button
                  onClick={() => setEditingFocus(true)}
                  className="px-4 py-2 bg-[var(--processing-bg)] text-[var(--processing-text)] rounded-lg font-semibold hover:bg-[var(--processing-border)] transition flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {editingFocus ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Primary Focus
                </label>
                <input
                  type="text"
                  value={editedFocus?.primaryFocus || ''}
                  onChange={(e) => setEditedFocus(prev => prev ? { ...prev, primaryFocus: e.target.value } : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                  placeholder="e.g., short a CVC words"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phonics Pattern
                  </label>
                  <input
                    type="text"
                    value={editedFocus?.phonicsPattern || ''}
                    onChange={(e) => setEditedFocus(prev => prev ? { ...prev, phonicsPattern: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                    placeholder="e.g., CVC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    value={editedFocus?.gradeLevel || 'K'}
                    onChange={(e) => setEditedFocus(prev => prev ? { ...prev, gradeLevel: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                  >
                    <option value="K">Kindergarten</option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Grapheme
                  </label>
                  <input
                    type="text"
                    value={editedFocus?.targetGrapheme || ''}
                    onChange={(e) => setEditedFocus(prev => prev ? { ...prev, targetGrapheme: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                    placeholder="e.g., a, ch, ar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Phoneme (IPA)
                  </label>
                  <input
                    type="text"
                    value={editedFocus?.targetPhoneme || ''}
                    onChange={(e) => setEditedFocus(prev => prev ? { ...prev, targetPhoneme: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                    placeholder="e.g., /æ/, /tʃ/"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setEditingFocus(false);
                    setEditedFocus(analysis.focus);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFocusOverride}
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--ao-navy)] text-white rounded-lg font-semibold hover:bg-[var(--ao-navy)]/90 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--processing-bg)] rounded-lg p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
                  <div className="text-sm font-semibold text-[var(--processing-text)] mb-1">Primary Focus</div>
                  <div className="text-2xl font-bold text-[var(--processing-text)]">{analysis.focus.primaryFocus}</div>
                </div>
                {analysis.focus.phonicsPattern && (
                  <div>
                    <div className="text-sm font-semibold text-[var(--processing-text)] mb-1">Phonics Pattern</div>
                    <div className="text-xl font-bold text-[var(--processing-text)]">{analysis.focus.phonicsPattern}</div>
                  </div>
                )}
                {analysis.focus.targetGrapheme && (
                  <div>
                    <div className="text-sm font-semibold text-[var(--processing-text)] mb-1">Target Grapheme</div>
                    <div className="text-xl font-bold text-[var(--processing-text)]">{analysis.focus.targetGrapheme}</div>
                  </div>
                )}
                {analysis.focus.targetPhoneme && (
                  <div>
                    <div className="text-sm font-semibold text-[var(--processing-text)] mb-1">Target Phoneme</div>
                    <div className="text-xl font-bold text-[var(--processing-text)]">{analysis.focus.targetPhoneme}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Classified Content Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Extracted Content</h2>
              <p className="text-gray-600">
                Words and questions we found in your materials
              </p>
            </div>
            {!editingContent && (
              <button
                onClick={() => setEditingContent(true)}
                className="px-4 py-2 bg-[var(--processing-bg)] text-[var(--processing-text)] rounded-lg font-semibold hover:bg-[var(--processing-border)] transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {editingContent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vocabulary Words (comma-separated)
                </label>
                <input
                  type="text"
                  value={editedContent?.vocabularyWords.join(', ') || ''}
                  onChange={(e) => setEditedContent(prev => prev ? { 
                    ...prev, 
                    vocabularyWords: e.target.value.split(',').map(w => w.trim()).filter(Boolean) 
                  } : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                  placeholder="e.g., amazing, discover, journey"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  High-Frequency Words (comma-separated)
                </label>
                <input
                  type="text"
                  value={editedContent?.highFrequencyWords.join(', ') || ''}
                  onChange={(e) => setEditedContent(prev => prev ? { 
                    ...prev, 
                    highFrequencyWords: e.target.value.split(',').map(w => w.trim()).filter(Boolean) 
                  } : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                  placeholder="e.g., the, and, is, was"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Decodable Words (comma-separated)
                </label>
                <input
                  type="text"
                  value={editedContent?.decodableWords.join(', ') || ''}
                  onChange={(e) => setEditedContent(prev => prev ? { 
                    ...prev, 
                    decodableWords: e.target.value.split(',').map(w => w.trim()).filter(Boolean) 
                  } : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ao-navy)]"
                  placeholder="e.g., cat, mat, sat, hat"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setEditingContent(false);
                    setEditedContent(analysis.content);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveContentOverride}
                  disabled={saving}
                  className="px-4 py-2 bg-[var(--ao-navy)] text-white rounded-lg font-semibold hover:bg-[var(--ao-navy)]/90 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[var(--info-bg)] rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--info-text)] mb-2">Vocabulary Words</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.content.vocabularyWords.length > 0 ? (
                    analysis.content.vocabularyWords.map((word, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[var(--info-bg)] text-[var(--info-text)] rounded-full text-sm font-medium">
                        {word}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm italic">None found</span>
                  )}
                </div>
              </div>
              <div className="bg-[var(--ao-tan)]/20 rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--ao-text)] mb-2">High-Frequency Words</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.content.highFrequencyWords.length > 0 ? (
                    analysis.content.highFrequencyWords.map((word, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[var(--ao-tan)] text-[var(--ao-text)] rounded-full text-sm font-medium">
                        {word}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm italic">None found</span>
                  )}
                </div>
              </div>
              <div className="bg-[var(--ao-tan)]/20 rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--ao-text)] mb-2">Decodable Words</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.content.decodableWords && analysis.content.decodableWords.length > 0 ? (
                    analysis.content.decodableWords.map((word, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[var(--ao-tan)] text-[var(--ao-text)] rounded-full text-sm font-medium">
                        {word}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm italic">None found</span>
                  )}
                </div>
              </div>
              <div className="bg-[var(--processing-bg)] rounded-lg p-4">
                <div className="text-sm font-semibold text-[var(--processing-text)] mb-2">Phonetic Examples</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.content.phoneticExamples && analysis.content.phoneticExamples.length > 0 ? (
                    analysis.content.phoneticExamples.map((word, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[var(--processing-border)] text-[var(--processing-text)] rounded-full text-sm font-medium">
                        {word}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm italic">None found</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              Analyzed {analysis.sourceChunkCount} text chunks from your uploaded materials
            </div>
            <div>
              {new Date(analysis.extractedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Go Back
          </button>
          <button
            onClick={runAnalysis}
            className="px-6 py-3 bg-[var(--processing-bg)] text-[var(--processing-text)] rounded-lg font-semibold hover:bg-[var(--processing-border)] transition flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Re-analyze
          </button>
          <button
            onClick={onApprove}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--ao-navy)] to-[var(--ao-navy)]/90 text-white rounded-lg font-bold text-lg hover:from-[var(--ao-navy)]/90 hover:to-[var(--ao-navy)]/80 transition flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle className="w-6 h-6" />
            Approve & Continue
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}