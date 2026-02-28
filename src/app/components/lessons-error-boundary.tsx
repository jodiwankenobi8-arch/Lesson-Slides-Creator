import { Link, useRouteError } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

/**
 * Error boundary for My Lessons route
 * Catches rendering errors and provides recovery options
 */
export function LessonsErrorBoundary() {
  const error = useRouteError();
  
  console.error('Lessons page error:', error);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(to bottom right, var(--ao-cream), var(--ao-white))' }}>
      <Card className="max-w-2xl w-full border-2 border-red-200">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="size-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something Went Wrong
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We encountered an error while loading your lessons. This might be due to incomplete data or a temporary issue.
          </p>

          {error instanceof Error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left max-w-lg mx-auto">
              <p className="text-xs font-mono text-red-800 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-sky-600 hover:bg-sky-700"
            >
              <RefreshCw className="size-4 mr-2" />
              Refresh Page
            </Button>
            
            <Link to="/dashboard">
              <Button variant="outline" className="border-sky-300">
                <Home className="size-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If this problem persists, try creating a new lesson or contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}