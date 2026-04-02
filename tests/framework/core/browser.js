import fs from 'node:fs/promises';
import path from 'node:path';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { env } from '../config/env.js';

export async function resolveChromePaths() {
  const browserCandidates = [
    process.env.CHROME_BIN,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  let browserPath;

  for (const candidate of browserCandidates) {
    try {
      await fs.access(candidate);
      browserPath = candidate;
      break;
    } catch {
      // Try the next Chrome location.
    }
  }

  if (!browserPath) {
    throw new Error('Unable to locate chrome.exe. Set CHROME_BIN to your Chrome executable path.');
  }

  const driverRoot = path.join(process.env.USERPROFILE || '', '.cache', 'selenium', 'chromedriver', 'win64');
  let driverPath;

  try {
    const driverVersions = await fs.readdir(driverRoot, { withFileTypes: true });
    const versionNames = driverVersions.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const latestVersion = versionNames.at(-1);

    if (latestVersion) {
      driverPath = path.join(driverRoot, latestVersion, 'chromedriver.exe');
    }
  } catch {
    // Fall back to Selenium Manager when no cached ChromeDriver is present yet.
  }

  return {
    browserPath,
    driverPath,
  };
}

export async function createDriver() {
  const { browserPath, driverPath } = await resolveChromePaths();
  const buildDriver = async (headlessMode) => {
    const options = new chrome.Options();
    const profileDir = await fs.mkdtemp(path.join(process.cwd(), '.tmp-chrome-profile-'));

    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-background-networking');
    options.addArguments('--disable-component-update');
    options.addArguments('--disable-renderer-backgrounding');
    options.addArguments('--disable-features=Translate,OptimizationHints,MediaRouter');
    options.addArguments('--metrics-recording-only');
    options.addArguments('--mute-audio');
    options.addArguments('--no-first-run');
    options.addArguments('--no-default-browser-check');
    options.addArguments('--password-store=basic');
    options.addArguments('--use-mock-keychain');
    options.addArguments('--window-size=1440,900');
    options.addArguments('--remote-debugging-port=0');
    options.addArguments(`--user-data-dir=${profileDir}`);

    if (headlessMode) {
      options.addArguments(headlessMode);
    }

    if (env.incognito) {
      options.addArguments('--incognito');
    }

    options.setChromeBinaryPath(browserPath);

    const builder = new Builder().forBrowser('chrome').setChromeOptions(options);

    if (driverPath) {
      builder.setChromeService(new chrome.ServiceBuilder(driverPath));
    }

    try {
      const driver = await builder.build();
      return { driver, profileDir };
    } catch (error) {
      await fs.rm(profileDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  };

  if (!env.headless) {
    return buildDriver(null);
  }

  try {
    return await buildDriver('--headless=new');
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    const canRetry =
      message.includes('devtoolsactiveport') ||
      message.includes('chrome failed to start') ||
      message.includes('session not created');

    if (!canRetry) {
      throw error;
    }

    return buildDriver('--headless');
  }
}

export async function destroyDriver(driver, profileDir) {
  if (driver) {
    await driver.quit().catch(() => {});
  }

  if (profileDir) {
    await fs.rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}
