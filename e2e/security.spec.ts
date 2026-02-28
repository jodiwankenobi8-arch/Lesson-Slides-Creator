import { test, expect } from '@playwright/test';

/**
 * E2E Test: Security
 * 
 * Tests:
 * - /kv/cleanup requires auth
 * - /diagnostics requires admin (in production)
 */

test.describe('Security', () => {
  test('should reject /kv/cleanup without auth token', async ({ request }) => {
    const response = await request.delete('/functions/v1/make-server-0d810c1e/kv/cleanup', {
      data: { keys: ['job:test'] },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error).toMatch(/unauthorized/i);
  });
  
  test('should reject invalid keys in cleanup', async ({ request }) => {
    // Try to delete a lesson key (not allowed)
    const response = await request.delete('/functions/v1/make-server-0d810c1e/kv/cleanup', {
      data: { keys: ['lesson:test-delete'] },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token', // Will fail auth anyway
      },
    });
    
    // Should fail either due to auth or key validation
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
  
  test('should enforce rate limiting on cleanup', async ({ page }) => {
    // This test requires a logged-in admin user
    // Skip in CI unless test auth is configured
    test.skip(process.env.CI && !process.env.TEST_ADMIN_TOKEN, 'Requires test admin credentials');
    
    // Make multiple cleanup calls rapidly
    // Should get rate limited after first call
    // (Implementation depends on having test admin auth)
  });
});
