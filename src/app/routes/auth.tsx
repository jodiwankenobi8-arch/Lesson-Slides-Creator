/**
 * Authentication Page
 * Sign in / Sign up for lesson template system
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../../utils/supabase-auth';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0d810c1e`;

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        toast.error('Sign in failed', {
          description: error.message,
        });
        return;
      }

      if (data.session) {
        toast.success('Signed in successfully!');
        // Navigate to lessons page
        navigate('/my-lessons');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      toast.error('Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Starting signup process:', { email, hasName: !!name });
      
      // Call server signup endpoint (uses admin API to bypass email confirmation)
      const response = await fetch(`${SERVER_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      console.log('📡 Signup response status:', response.status);

      const result = await response.json();
      console.log('📦 Signup result:', { success: result.success, error: result.error });

      if (!response.ok || result.error) {
        setError(result.error || 'Sign up failed');
        toast.error('Sign up failed', {
          description: result.error || 'Please try again',
        });
        return;
      }

      if (result.success) {
        toast.success('Account created successfully!', {
          description: 'You can now sign in',
        });
        // Switch to sign in mode
        setMode('signin');
        setPassword('');
      }
    } catch (err) {
      console.error('❌ Sign up error:', err);
      setError('Network error: Could not connect to server');
      toast.error('Sign up failed', {
        description: 'Could not connect to server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, var(--ao-cream), var(--ao-white))' }}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === 'signin' ? '🔐 Sign In' : '✨ Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'Sign in to access your lesson templates'
              : 'Create an account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
            <div className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required={mode === 'signup'}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                {mode === 'signup' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Sign Up'
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError('');
                  }}
                  className="text-sm"
                >
                  {mode === 'signin'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}