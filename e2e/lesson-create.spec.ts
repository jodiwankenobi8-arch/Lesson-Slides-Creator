import { test, expect } from '@playwright/test';

/**
 * E2E Test: Create Lesson and Verify Persistence
 * 
 * Tests:
 * - Create lesson without uploads
 * - Verify appears in My Lessons
 * - Verify title shows correctly
 * - Verify NOT detected as empty
 */

test.describe('Lesson Creation and Persistence', () => {
  test('should create lesson and show in My Lessons with correct title', async ({ page }) => {
    // Navigate to new lesson page
    await page.goto('/');
    await page.getByRole('link', { name: /create.*lesson/i }).click();
    
    // Select ELA
    await page.getByText(/ela/i).click();
    
    // Fill in lesson details
    await page.getByLabel(/lesson name/i).fill('E2E Test Lesson');
    await page.getByLabel(/phonics concept/i).fill('/sh/ digraph');
    await page.getByLabel(/phonics words/i).fill('ship, shop, shut');
    
    // Save lesson
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for save confirmation
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
    
    // Navigate to My Lessons
    await page.goto('/my-lessons');
    
    // Verify lesson appears
    await expect(page.getByText('E2E Test Lesson')).toBeVisible();
    
    // Verify NOT marked as empty
    const lessonCard = page.locator('text=E2E Test Lesson').locator('..');
    await expect(lessonCard).not.toHaveClass(/border-orange/);
    
    // Cleanup: delete test lesson
    await lessonCard.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
  });
  
  test('should persist edits after refresh', async ({ page }) => {
    // Create lesson
    await page.goto('/lessons/new');
    await page.getByText(/ela/i).click();
    await page.getByLabel(/lesson name/i).fill('E2E Edit Test');
    await page.getByLabel(/phonics concept/i).fill('initial');
    await page.getByRole('button', { name: /save/i }).click();
    
    // Edit lesson
    await page.getByLabel(/phonics concept/i).fill('updated');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Verify edit persisted
    await expect(page.getByLabel(/phonics concept/i)).toHaveValue('updated');
    
    // Cleanup
    await page.goto('/my-lessons');
    await page.locator('text=E2E Edit Test').locator('..').getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
  });
});
