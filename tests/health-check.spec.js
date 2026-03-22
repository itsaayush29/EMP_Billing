import { test, expect } from '@playwright/test';

test('Application Health Check', async ({ page }) => {
  // Test if the application is accessible
  try {
    await page.goto('/', { timeout: 30000 });
    console.log('✅ Application is accessible');

    // Check if login page loads
    const loginForm = page.locator('form').first();
    await expect(loginForm).toBeVisible({ timeout: 10000 });
    console.log('✅ Login form is visible');

  } catch (error) {
    console.error('❌ Application health check failed:', error.message);
    console.error('💡 Make sure the application server is running at:', process.env.BASE_URL);

    // Provide helpful suggestions
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if the application server is running');
    console.log('2. Verify the BASE_URL in .env file');
    console.log('3. Test the URL manually in a browser');
    console.log('4. Check network connectivity');

    throw new Error(`Application not accessible: ${error.message}`);
  }
});