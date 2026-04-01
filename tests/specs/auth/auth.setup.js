import { describe, it, afterEach } from 'mocha';
import { invoiceData } from '../../data/invoice-data.js';
import { login } from '../../framework/auth/login.js';
import { env } from '../../framework/config/env.js';
import { createDriver, destroyDriver } from '../../framework/core/browser.js';
import { saveAuthState } from '../../framework/core/storage.js';

describe('authenticate once for protected modules', function () {
  this.timeout(120000);

  let driver;
  let profileDir;

  afterEach(async () => {
    await destroyDriver(driver, profileDir);
    driver = undefined;
    profileDir = undefined;
  });

  it('authenticate once for protected modules', async function () {
    const created = await createDriver();
    driver = created.driver;
    profileDir = created.profileDir;

    console.log('Creating shared authenticated session...');
    await login(driver, invoiceData.login);
    await saveAuthState(driver, env.authFile);
    console.log(`Saved authenticated session to ${env.authFile}`);
  });
});
