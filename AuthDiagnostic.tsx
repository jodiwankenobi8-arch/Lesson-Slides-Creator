/**
 * Auth Diagnostic Component
 * 
 * Tests JWT authentication and displays detailed logs
 */

import { useState } from 'react';
import { supabase, getUserAccessToken } from '../../utils/supabase-auth';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function AuthDiagnostic() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const diagnosticResults: any = {
      timestamp: new Date().toISOString(),
      steps: [],
    };

    try {
      // Step 1: Get current session
      diagnosticResults.steps.push({ step: 1, name: 'Get Session', status: 'running' });
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        diagnosticResults.steps[0].status = 'failed';
        diagnosticResults.steps[0].error = sessionError?.message || 'No active session';
        diagnosticResults.sessionExists = false;
      } else {
        diagnosticResults.steps[0].status = 'success';
        diagnosticResults.sessionExists = true;
        diagnosticResults.session = {
          userId: session.user?.id,
          email: session.user?.email,
          tokenPrefix: session.access_token.substring(0, 30) + '...',
          tokenLength: session.access_token.length,
          expiresAt: session.expires_at,
          expiresIn: session.expires_at ? Math.floor((session.expires_at * 1000 - Date.now()) / 1000 / 60) + ' minutes' : 'unknown',
        };
      }

      // Step 2: Extract project ref from token
      if (session?.access_token) {
        diagnosticResults.steps.push({ step: 2, name: 'Decode JWT', status: 'running' });
        try {
          const parts = session.access_token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            diagnosticResults.steps[1].status = 'success';
            diagnosticResults.decodedToken = {
              iss: payload.iss,
              ref: payload.ref,
              role: payload.role,
              aud: payload.aud,
              exp: payload.exp,
              expiresAt: new Date(payload.exp * 1000).toISOString(),
              sub: payload.sub,
            };
          } else {
            diagnosticResults.steps[1].status = 'failed';
            diagnosticResults.steps[1].error = 'Invalid JWT format';
          }
        } catch (e) {
          diagnosticResults.steps[1].status = 'failed';
          diagnosticResults.steps[1].error = String(e);
        }
      }

      // Step 3: Test auth-test endpoint (no middleware)
      if (session?.access_token) {
        diagnosticResults.steps.push({ step: 3, name: 'Test /auth-test (direct)', status: 'running' });
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/auth-test`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': publicAnonKey,
              },
            }
          );
          const result = await response.json();
          diagnosticResults.steps[2].status = result.validationResult === 'SUCCESS' ? 'success' : 'failed';
          diagnosticResults.steps[2].result = result;
        } catch (e) {
          diagnosticResults.steps[2].status = 'error';
          diagnosticResults.steps[2].error = String(e);
        }
      }

      // Step 4: Test with hybrid auth approach (anon header + userToken param)
      if (session?.access_token) {
        diagnosticResults.steps.push({ step: 4, name: 'Test /auth-test (hybrid)', status: 'running' });
        try {
          const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/auth-test`);
          url.searchParams.set('userToken', session.access_token);
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'apikey': publicAnonKey,
            },
          });
          const result = await response.json();
          diagnosticResults.steps[3].status = result.validationResult === 'SUCCESS' ? 'success' : 'failed';
          diagnosticResults.steps[3].result = result;
        } catch (e) {
          diagnosticResults.steps[3].status = 'error';
          diagnosticResults.steps[3].error = String(e);
        }
      }

      // Step 5: Test /user-data/lessons/me (real endpoint with middleware)
      if (session?.access_token) {
        diagnosticResults.steps.push({ step: 5, name: 'Test /user-data/lessons/me', status: 'running' });
        try {
          const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e/user-data/lessons/me`);
          url.searchParams.set('userToken', session.access_token);
          
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'apikey': publicAnonKey,
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            diagnosticResults.steps[4].status = 'success';
            diagnosticResults.steps[4].result = { lessonsCount: result.length };
          } else {
            const errorText = await response.text();
            diagnosticResults.steps[4].status = 'failed';
            diagnosticResults.steps[4].error = errorText;
            diagnosticResults.steps[4].statusCode = response.status;
          }
        } catch (e) {
          diagnosticResults.steps[4].status = 'error';
          diagnosticResults.steps[4].error = String(e);
        }
      }

      // Environment info
      diagnosticResults.environment = {
        projectId,
        supabaseUrl: `https://${projectId}.supabase.co`,
        anonKeyPrefix: publicAnonKey.substring(0, 30) + '...',
        frontendUrl: window.location.origin,
      };

    } catch (error) {
      diagnosticResults.fatalError = String(error);
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 JWT Authentication Diagnostic</h1>
      
      <div className="mb-4">
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="px-4 py-2 text-white rounded disabled:opacity-50"
          style={{ backgroundColor: 'var(--ao-navy)' }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--ao-text)')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
        >
          {loading ? 'Testing...' : 'Test Auth'}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Environment</h2>
            <pre className="text-xs overflow-auto bg-white p-2 rounded">
              {JSON.stringify(results.environment, null, 2)}
            </pre>
          </div>

          {results.session && (
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="font-bold mb-2">Session Info</h2>
              <pre className="text-xs overflow-auto bg-white p-2 rounded">
                {JSON.stringify(results.session, null, 2)}
              </pre>
            </div>
          )}

          {results.decodedToken && (
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="font-bold mb-2">Decoded JWT Payload</h2>
              <pre className="text-xs overflow-auto bg-white p-2 rounded">
                {JSON.stringify(results.decodedToken, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Test Results</h2>
            {results.steps.map((step: any) => (
              <div key={step.step} className="mb-4 pb-4 border-b last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm">Step {step.step}:</span>
                  <span className="font-medium">{step.name}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    step.status === 'success' ? 'bg-green-200 text-green-800' :
                    step.status === 'failed' ? 'bg-red-200 text-red-800' :
                    step.status === 'error' ? '' :
                    'bg-gray-200 text-gray-800'
                  }`}
                  style={step.status === 'error' ? { backgroundColor: 'var(--ao-cream)', color: 'var(--ao-red)' } : {}}
                  >
                    {step.status}
                  </span>
                </div>
                {step.result && (
                  <pre className="text-xs overflow-auto bg-white p-2 rounded mt-2">
                    {JSON.stringify(step.result, null, 2)}
                  </pre>
                )}
                {step.error && (
                  <div className="text-xs text-red-700 bg-red-50 p-2 rounded mt-2">
                    {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {results.fatalError && (
            <div className="bg-red-100 p-4 rounded">
              <h2 className="font-bold text-red-800 mb-2">Fatal Error</h2>
              <pre className="text-xs text-red-700">{results.fatalError}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}