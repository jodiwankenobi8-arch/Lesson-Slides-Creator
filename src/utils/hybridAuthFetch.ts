/**
 * Hybrid Auth Fetch - Centralized Authentication Layer
 * 
 * ✅ Ground Rule: No component calls fetch() to Edge Functions directly.
 * Everything goes through this API client.
 * 
 * This is the "one clean fix" policy in code form.
 */

import { supabase } from './supabase-auth';
import { publicAnonKey, projectId } from './supabase/info';

export async function hybridAuthFetch(input: string | URL, init: RequestInit = {}) {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`getSession failed: ${error.message}`);
  }
  
  if (!session?.access_token) {
    throw new Error('No session access token (user not signed in)');
  }

  const url = new URL(typeof input === 'string' ? input : input.toString(), window.location.origin);

  // Always attach userToken for server validation
  url.searchParams.set('userToken', session.access_token);

  // Merge headers safely
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${publicAnonKey}`);
  headers.set('apikey', publicAnonKey);
  headers.set('x-project', projectId); // optional: helpful for debugging mismatches

  return fetch(url.toString(), { ...init, headers });
}
