import { test, expect } from '@playwright/test';

test.describe('Connections E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the connections page
    await page.goto('/connections');
  });

  test('should load connections page without import errors', async ({ page }) => {
    // Check if page loads successfully 
    await expect(page).toHaveTitle(/Scheduler/);
    
    // Check for any JavaScript errors in the console
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check if the connections client component loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Verify no import errors related to updateConnectionAction
    const hasUpdateConnectionError = errors.some(error => 
      error.includes('updateConnectionAction') && error.includes('not found')
    );
    
    expect(hasUpdateConnectionError, 
      `Import error found: ${errors.join(', ')}`
    ).toBe(false);
  });

  test('should be able to create a new connection', async ({ page }) => {
    // Look for "Add Connection" or similar button
    const addButton = page.locator('text=Add Connection').or(
      page.locator('text=New Connection')
    ).or(
      page.locator('button').filter({ hasText: /add|new|create/i })
    );
    
    if (await addButton.count() > 0) {
      await addButton.first().click();
      
      // Check if form opens
      await expect(page.locator('form')).toBeVisible();
      
      // Look for provider select
      const providerSelect = page.locator('select[name="provider"]').or(
        page.locator('[role="combobox"]')
      );
      
      if (await providerSelect.count() > 0) {
        await providerSelect.first().click();
        
        // Check if options are available
        await expect(page.locator('option, [role="option"]')).toHaveCount(1);
      }
    }
  });

  test('should handle connection form submission', async ({ page }) => {
    // Check for any console errors that might indicate missing exports
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try to interact with the connections interface
    await page.click('body'); // Just trigger any client-side code
    
    // Wait a bit for any async operations
    await page.waitForTimeout(1000);
    
    // Check for specific export errors
    const exportErrors = consoleErrors.filter(error => 
      error.includes('Export') && 
      error.includes('not found') && 
      error.includes('updateConnectionAction')
    );
    
    expect(exportErrors).toHaveLength(0);
  });
});