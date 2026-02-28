/**
 * File Hashing Utilities
 * Compute SHA-256 hashes for file deduplication and caching
 */

import { supabase } from '../../utils/supabase-auth';
import { publicAnonKey } from '../../../utils/supabase/info';

/**
 * Compute SHA-256 hash of a file
 */
export async function computeFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Check if OCR result exists in cache by hash
 */
export async function checkOCRCache(sha256: string, apiUrl: string): Promise<any | null> {
  try {
    // Get current session for user token
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      console.warn('No session available for cache check');
      return null;
    }
    
    // Build URL with userToken query parameter (hybrid auth pattern)
    const url = new URL(`${apiUrl}/extraction/cache/${sha256}`);
    url.searchParams.set('userToken', session.access_token);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`, // Use anon key
        'apikey': publicAnonKey,
      },
    });

    if (response.status === 404) {
      return null; // Not cached
    }

    if (!response.ok) {
      console.warn('Failed to check OCR cache:', await response.text());
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error checking OCR cache:', error);
    return null;
  }
}

/**
 * Save OCR result to cache by hash
 */
export async function saveOCRCache(
  sha256: string,
  result: any,
  apiUrl: string
): Promise<void> {
  try {
    // Get current session for user token
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      console.warn('No session available for cache save');
      return;
    }
    
    // Build URL with userToken query parameter (hybrid auth pattern)
    const url = new URL(`${apiUrl}/extraction/cache`);
    url.searchParams.set('userToken', session.access_token);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`, // Use anon key
        'apikey': publicAnonKey,
      },
      body: JSON.stringify({ sha256, result }),
    });

    if (!response.ok) {
      console.warn('Failed to save OCR cache:', await response.text());
    }
  } catch (error) {
    console.error('Error saving OCR cache:', error);
  }
}