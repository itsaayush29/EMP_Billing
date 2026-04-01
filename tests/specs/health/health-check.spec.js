import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'mocha';
import { createDriver, destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';

describe('Application Health Check', function () {
  this.timeout(120000);

  let driver;
  let profileDir;

  afterEach(async () => {
    await destroyDriver(driver, profileDir);
    driver = undefined;
    profileDir = undefined;
  });

  it('Application Health Check', async function () {
    try {
      const created = await createDriver();
      driver = created.driver;
      profileDir = created.profileDir;

      await openPath(driver, '/login');
      const url = await driver.getCurrentUrl();
      assert.match(url, /login|dashboard/i);
      console.log(`Health route is accessible: ${url}`);
    } catch (error) {
      console.error('Application health check failed:', error.message);
      console.error('Verify BASE_URL in your .env file:', process.env.BASE_URL);
      throw new Error(`Application not accessible: ${error.message}`);
    }
  });
});
