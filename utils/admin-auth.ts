/**
 * Admin Authentication & Authorization
 * 
 * Uses Supabase admins table to manage admin access
 * No code changes needed to add/remove admins
 */

import { supabase } from '../../utils/supabase-auth';
import { projectId } from '../../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Check if current user is an admin
 * Checks the admins table in the database
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) return false;
    
    // Query admins table using KV store (since we can't use direct SQL)
    // Store admin list as a special KV entry
    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-0d810c1e/admin/check`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          email: user.email 
        })
      }
    );
    
    if (!response.ok) return false;
    
    const result = await response.json();
    return result.isAdmin === true;
  } catch {
    return false;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Get admin access token for server requests
 */
export async function getAdminToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) return null;
    
    // Verify user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) return null;
    
    return session.access_token;
  } catch {
    return null;
  }
}

/**
 * Development mode bypass
 * In dev, allow access without auth for convenience
 */
export function isDevelopmentMode(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * Add admin (server-side function)
 * Returns the API endpoint for adding admins
 */
export function getAdminManagementEndpoint(): string {
  return `${supabaseUrl}/functions/v1/make-server-0d810c1e/admin/manage`;
}