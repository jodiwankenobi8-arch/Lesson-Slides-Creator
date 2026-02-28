/**
 * Authenticated Fetch Utility
 * 
 * Centralized fetch wrapper that ensures all API calls include proper authentication.
 * 
 * CRITICAL: This is the ONLY way to call lesson/template/file endpoints.
 * Direct fetch() calls to authenticated endpoints are NOT allowed.
 */

import { getUserAccessToken } from '../../utils/supabase-auth';
import { publicAnonKey } from '../../../utils/supabase/info';

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizedFetchError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`Fetch failed: ${status} ${statusText}`);
    this.name = 'AuthorizedFetchError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

interface AuthedFetchOptions extends RequestInit {
  skipAuth?: boolean;
  throwOnError?: boolean;
}

/**
 * Authenticated fetch wrapper
 * 
 * Usage:
 * ```typescript
 * const response = await authedFetch('/make-server-0d810c1e/user-data/lessons/me');
 * const data = await response.json();
 * ```
 * 
 * @param url - Full URL or path (will be prefixed with Supabase URL if needed)
 * @param options - Fetch options plus skipAuth flag
 * @throws AuthenticationError if no valid session exists
 * @throws AuthorizedFetchError if request fails (when throwOnError is true)
 */
export async function authedFetch(
  url: string,
  options: AuthedFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, throwOnError = false, ...fetchOptions } = options;

  // Get authentication token
  let token: string | null = null;
  if (!skipAuth) {
    token = await getUserAccessToken();
    if (!token) {
      console.error('❌ AUTH VALIDATION FAILED:', {
        message: 'No auth token available',
        url,
        timestamp: new Date().toISOString(),
      });
      throw new AuthenticationError('Please sign in to continue');
    } else {
      console.log('✅ AUTH VALIDATION PASSED:', {
        message: 'Token obtained successfully',
        tokenPrefix: token.substring(0, 20) + '...',
        url,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Merge headers
  const headers = new Headers(fetchOptions.headers);
  
  // Always set Content-Type for JSON requests (unless already set)
  if (!headers.has('Content-Type') && (fetchOptions.method === 'POST' || fetchOptions.method === 'PUT')) {
    headers.set('Content-Type', 'application/json');
  }

  // WORKAROUND for Supabase Edge Functions gateway requirements:
  // 1. Gateway REQUIRES Authorization header to be present
  // 2. Gateway validates JWTs and rejects user tokens with "Invalid JWT"
  // 
  // SOLUTION: Send anon key in Authorization header (satisfies gateway requirement),
  // and send user's JWT as query parameter (our code validates it).
  
  // CRITICAL: Both apikey and Authorization headers are required by Supabase
  headers.set('apikey', publicAnonKey);
  headers.set('Authorization', `Bearer ${publicAnonKey}`); // Use anon key, not user token!
  
  // Pass user's JWT as query parameter (our server extracts and validates it)
  let finalUrl = url;
  if (token) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('userToken', token); // Changed from 'token' to 'userToken' for clarity
    finalUrl = urlObj.toString();
    
    console.log('🔍 Auth setup:', {
      authorizationHeader: 'anon_key',
      userTokenLocation: 'query_parameter',
      userTokenLength: token.length,
      userTokenPrefix: token.substring(0, 30) + '...',
    });
  } else {
    console.warn('⚠️ No user token available - request will fail auth');
  }

  // Make request
  try {
    const response = await fetch(finalUrl, {
      ...fetchOptions,
      headers,
    });

    // Log request details for debugging
    if (!response.ok) {
      const bodyText = await response.clone().text();
      console.error(`❌ Authenticated fetch failed:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        body: bodyText.substring(0, 200),
        hasAuthHeader: headers.has('Authorization'),
      });

      if (throwOnError) {
        throw new AuthorizedFetchError(response.status, response.statusText, bodyText);
      }
    } else {
      console.log(`✅ Authenticated fetch succeeded:`, {
        url,
        status: response.status,
        hasAuthHeader: headers.has('Authorization'),
      });
    }

    return response;
  } catch (error) {
    if (error instanceof AuthorizedFetchError || error instanceof AuthenticationError) {
      throw error;
    }
    
    console.error('❌ Network error during authenticated fetch:', error);
    throw error;
  }
}

/**
 * Authenticated fetch with automatic JSON parsing and error handling
 * 
 * Usage:
 * ```typescript
 * const lessons = await authedFetchJson<SavedLesson[]>('/make-server-0d810c1e/user-data/lessons/me');
 * ```
 */
export async function authedFetchJson<T>(
  url: string,
  options: AuthedFetchOptions = {}
): Promise<T> {
  const response = await authedFetch(url, { ...options, throwOnError: true });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Check if user has a valid authentication session
 * Returns true if authenticated, false otherwise
 * 
 * This is a lightweight check that doesn't throw errors
 */
export async function hasValidSession(): Promise<boolean> {
  try {
    const token = await getUserAccessToken();
    return token !== null;
  } catch {
    return false;
  }
}