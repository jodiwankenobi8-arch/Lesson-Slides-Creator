/**
 * Auth Diagnostics Panel
 * 
 * Real-time validation of authentication flow
 * Shows current auth state and helps debug token issues
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase, getUserAccessToken, isAuthenticated } from '../../utils/supabase-auth';
import { hasValidSession } from '../utils/authed-fetch';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { AuthDiagnostic } from './AuthDiagnostic';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
}

export function AuthDiagnostics() {
  return <AuthDiagnostic />;
}