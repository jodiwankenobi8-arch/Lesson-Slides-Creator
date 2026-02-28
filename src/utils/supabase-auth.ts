/**
 * Supabase Authentication Utilities
 * 
 * Centralized authentication helpers for the application
 * 
 * 🔓 DEV MODE: Auto-login enabled for development/testing
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';
import { getDevAccessToken, getDevUserId, isAutoLoginEnabled } from './dev-auto-login';

// Singleton pattern: ensure only one client instance exists
// Store in window to persist across hot reloads in development
declare global {
  interface Window {
    _supabaseClient?: ReturnType<typeof createClient>;
  }
}

// Create or reuse Supabase client (singleton)
export const supabase = 
  (typeof window !== 'undefined' && window._supabaseClient) ||
  (() => {
    const client = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
    if (typeof window !== 'undefined') {
      window._supabaseClient = client;
    }
    return client;
  })();

/**
 * Check if user is currently authenticated
 * Returns boolean after checking session
 */
export async function isAuthenticated(): Promise<boolean> {
  // 🔓 DEV MODE: Auto-login always returns true
  if (isAutoLoginEnabled()) {
    return true;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return false;
  }
}

/**
 * Get current user's access token
 * Returns null if not authenticated
 * 
 * Usage:
 * ```typescript
 * const token = await getUserAccessToken();
 * if (!token) {
 *   toast.error('Please sign in to upload files');
 *   return;
 * }
 * 
 * fetch(url, {
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *   }
 * });
 * ```
 */
export async function getUserAccessToken(): Promise<string | null> {
  // 🔓 DEV MODE: Return mock token
  const devToken = getDevAccessToken();
  if (devToken) {
    console.log('🔓 Using dev access token (auto-login mode)');
    return devToken;
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth error getting session:', error);
      return null;
    }
    
    if (!session?.access_token) {
      // No active session - user must sign in
      console.warn('⚠️ No active session - user not authenticated');
      return null;
    }
    
    console.log('✅ Access token retrieved:', {
      tokenPrefix: session.access_token.substring(0, 20) + '...',
      userId: session.user?.id,
      email: session.user?.email,
    });
    
    return session.access_token;
  } catch (error) {
    console.error('❌ Exception getting access token:', error);
    return null;
  }
}

/**
 * Wait for auth to be initialized
 * Useful to call before making authenticated requests
 */
export async function waitForAuth(): Promise<boolean> {
  // 🔓 DEV MODE: Always ready
  if (isAutoLoginEnabled()) {
    return true;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('❌ Error waiting for auth:', error);
    return false;
  }
}

/**
 * Get current user ID
 * Returns null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  // 🔓 DEV MODE: Return mock user ID
  const devUserId = getDevUserId();
  if (devUserId) {
    return devUserId;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    return null;
  }
}

/**
 * Get current user ID (alias for getUserId)
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  return getUserId();
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
}