import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { describe, it, afterEach } from 'mocha';
import dotenv from 'dotenv';
import { invoiceData } from '../../data/invoice-data.js';
import { login } from '../../utils/auth.js';

dotenv.config({ quiet: true });

const execFileAsync = promisify(execFile);

const authFile = 'playwright/.auth/user.json';
const baseUrl = process.env.BASE_URL || 'https://test-billing.empcloud.com';

async function resolveChromePaths() {
  const managerPath = path.resolve('node_modules/selenium-webdriver/bin/windows/selenium-manager.exe');
  const { stdout } = await execFileAsync(managerPath, [
    '--browser',
    'chrome',
    '--language-binding',
    'javascript',
    '--output',
    'json',
  ]);
  const parsed = JSON.parse(stdout);

  if (parsed?.result?.code !== 0 || !parsed?.result?.driver_path || !parsed?.result?.browser_path) {
    throw new Error(`Unable to resolve Chrome paths from Selenium Manager: ${stdout}`);
  }

  return {
    driverPath: parsed.result.driver_path,
    browserPath: parsed.result.browser_path,
  };
}

async function saveAuthState(driver, filePath) {
  const cookies = await driver.manage().getCookies();
  const origin = new URL(baseUrl).origin;
  const localStorage = await driver.executeScript(`
    return Object.entries(window.localStorage).map(([name, value]) => ({ name, value }));
  `);
  const sessionStorage = await driver.executeScript(`
    return Object.entries(window.sessionStorage).map(([name, value]) => ({ name, value }));
  `);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        cookies,
        origins: [
          {
            origin,
            localStorage,
            sessionStorage,
          },
        ],
      },
      null,
      2
    )
  );
}

describe('authenticate once for protected modules', function () {
  this.timeout(120000);

  let driver;

  afterEach(async () => {
    if (driver) {
      await driver.quit();
      driver = undefined;
    }
  });

  it('authenticate once for protected modules', async function () {
    const options = new chrome.Options();
    const { driverPath, browserPath } = await resolveChromePaths();

    if (process.env.HEADLESS !== 'false') {
      options.addArguments('--headless=new');
    }

    options.setChromeBinaryPath(browserPath);

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(new chrome.ServiceBuilder(driverPath))
      .build();

    console.log('Creating shared authenticated session...');
    await login(driver, invoiceData.login);
    await saveAuthState(driver, authFile); // Replaces Playwright storageState() with a Selenium session snapshot.
    console.log(`Saved authenticated session to ${authFile}`);
  });
});
