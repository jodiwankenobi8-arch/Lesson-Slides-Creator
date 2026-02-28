/**
 * Lesson Player Error Boundary
 * 
 * Catches rendering errors in the lesson player/slideshow area.
 * Prevents blank screens during live teaching.
 * 
 * Features:
 * - Friendly error message
 * - "Continue Teaching" button to skip problem slide
 * - "Reset Lesson" button to restart
 * - Copyable error details for debugging
 * - Auto-recovery attempt
 * 
 * Design Philosophy: "Never leave the teacher stranded"
 */

import { Component, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, SkipForward, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  onSkip?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
  copied: boolean;
}

export class LessonPlayerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 LessonPlayerErrorBoundary caught error:', error);
    console.error('Error details:', errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-recovery: if this is the first error, try to reset after 5 seconds
    if (this.state.errorCount === 0) {
      console.log('🔄 Auto-recovery: Will attempt reset in 5 seconds...');
      setTimeout(() => {
        if (this.state.hasError) {
          console.log('🔄 Auto-recovery: Attempting reset now...');
          this.handleReset();
        }
      }, 5000);
    }
  }

  handleReset = () => {
    console.log('🔄 Resetting lesson player...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
    this.props.onReset?.();
  };

  handleSkip = () => {
    console.log('⏭️ Skipping problematic slide...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
    this.props.onSkip?.();
  };

  handleCopyError = async () => {
    const errorDetails = `
Lesson Player Error Report
Date: ${new Date().toISOString()}
Error Count: ${this.state.errorCount}

Error Message:
${this.state.error?.message || 'Unknown error'}

Stack Trace:
${this.state.error?.stack || 'No stack trace'}

Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack'}
    `.trim();

    try {
      // Try clipboard API first
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      toast.success('Error details copied to clipboard');
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch (error) {
      // Fallback: show in prompt
      const result = prompt(
        'Clipboard access blocked. Press Ctrl+C to copy error details:',
        errorDetails
      );
      if (result !== null) {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 3000);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="size-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Slide Failed to Load</CardTitle>
              <CardDescription className="text-base">
                Don't worry! Your lesson data is safe. Choose an option below to continue teaching.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Primary Actions */}
              <div className="grid gap-3">
                <Button
                  size="lg"
                  onClick={this.handleSkip}
                  className="w-full text-lg h-14"
                  disabled={!this.props.onSkip}
                >
                  <SkipForward className="size-5 mr-2" />
                  Continue Teaching (Skip This Slide)
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={this.handleReset}
                  className="w-full text-lg h-14"
                >
                  <RefreshCw className="size-5 mr-2" />
                  Reset Lesson
                </Button>
              </div>

              {/* Error Details (Collapsible) */}
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-sm text-gray-700 hover:text-gray-900">
                  Technical Details (for debugging)
                </summary>
                <div className="mt-4 space-y-3">
                  <div className="bg-white rounded border p-3">
                    <p className="text-xs font-mono text-red-600 break-all">
                      {this.state.error?.message || 'Unknown error'}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleCopyError}
                    className="w-full"
                  >
                    {this.state.copied ? (
                      <>
                        <CheckCircle className="size-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-2" />
                        Copy Error Report
                      </>
                    )}
                  </Button>

                  {this.state.errorCount > 1 && (
                    <p className="text-xs text-center" style={{ color: 'var(--ao-red)' }}>
                      ⚠️ This error has occurred {this.state.errorCount} times
                    </p>
                  )}
                </div>
              </details>

              {/* Reassurance Message */}
              <div className="text-center text-sm text-gray-600 rounded-lg p-4" style={{ backgroundColor: 'var(--info-bg)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--info-text)' }}>💡 Quick Tip</p>
                <p>
                  If this keeps happening, try refreshing the page. Your lesson progress is auto-saved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}