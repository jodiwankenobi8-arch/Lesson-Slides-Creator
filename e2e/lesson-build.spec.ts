import { test, expect } from '@playwright/test';

/**
 * E2E Test: Build Slides
 * 
 * Tests:
 * - Phonics-only lesson builds successfully
 * - Single vocab word edge case
 * - Rebuild without duplication
 */

test.describe('Lesson Building', () => {
  test('should build phonics-only lesson', async ({ page }) => {
    await page.goto('/lessons/new');
    await page.getByText(/ela/i).click();
    
    // Fill phonics-only data
    await page.getByLabel(/lesson name/i).fill('E2E Phonics Only');
    await page.getByLabel(/ufli.*lesson/i).fill('15');
    await page.getByLabel(/phonics concept/i).fill('/sh/ digraph');
    await page.getByLabel(/phonics words/i).fill('ship, shop, shut, she, shell');
    await page.getByLabel(/irregular.*words/i).fill('the, of');
    
    // Leave vocab empty
    await page.getByLabel(/vocab/i).fill('');
    
    await page.getByRole('button', { name: /save/i }).click();
    
    // Build slides
    await page.getByRole('button', { name: /build.*slides/i }).click();
    
    // Wait for build completion
    await expect(page.getByText(/deck.*ready/i)).toBeVisible({ timeout: 30000 });
    
    // Verify slide count > 0
    const slideCount = await page.locator('[data-testid="slide-count"]').textContent();
    expect(parseInt(slideCount || '0')).toBeGreaterThan(0);
    
    // Cleanup
    await page.goto('/my-lessons');
    await page.locator('text=E2E Phonics Only').locator('..').getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
  });
  
  test('should handle single vocab word edge case', async ({ page }) => {
    await page.goto('/lessons/new');
    await page.getByText(/ela/i).click();
    
    await page.getByLabel(/lesson name/i).fill('E2E Single Vocab');
    await page.getByLabel(/ufli/i).fill('10');
    await page.getByLabel(/phonics concept/i).fill('/m/ sound');
    await page.getByLabel(/phonics words/i).fill('map, mat, mom, mop');
    await page.getByLabel(/vocab/i).fill('magnificent');
    
    await page.getByRole('button', { name: /save/i }).click();
    await page.getByRole('button', { name: /build/i }).click();
    
    // Should build without errors
    await expect(page.getByText(/deck.*ready/i)).toBeVisible({ timeout: 30000 });
    
    // Cleanup
    await page.goto('/my-lessons');
    await page.locator('text=E2E Single Vocab').locator('..').getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
  });
  
  test('should rebuild without duplication', async ({ page }) => {
    // Create and build lesson
    await page.goto('/lessons/new');
    await page.getByText(/ela/i).click();
    await page.getByLabel(/lesson name/i).fill('E2E Rebuild Test');
    await page.getByLabel(/phonics concept/i).fill('test');
    await page.getByRole('button', { name: /save/i }).click();
    await page.getByRole('button', { name: /build/i }).click();
    await expect(page.getByText(/deck.*ready/i)).toBeVisible({ timeout: 30000 });
    
    const firstSlideCount = await page.locator('[data-testid="slide-count"]').textContent();
    
    // Change UFLI day and rebuild
    await page.getByLabel(/ufli.*day/i).selectOption('2');
    await page.getByRole('button', { name: /build/i }).click();
    await expect(page.getByText(/deck.*ready/i)).toBeVisible({ timeout: 30000 });
    
    const secondSlideCount = await page.locator('[data-testid="slide-count"]').textContent();
    
    // Verify no weird duplication (slide count should be reasonable)
    expect(parseInt(secondSlideCount || '0')).toBeLessThan(parseInt(firstSlideCount || '0') * 2);
    
    // Cleanup
    await page.goto('/my-lessons');
    await page.locator('text=E2E Rebuild Test').locator('..').getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
  });
});
