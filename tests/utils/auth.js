import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { By, until } from 'selenium-webdriver';
import { safeClick, safeFill } from './ui-helpers.js';

const baseUrl = process.env.BASE_URL || 'https://test-billing.empcloud.com';

async function isAuthenticated(driver) {
  try {
    const navigation = await driver.findElement(By.css('[role="navigation"], nav'));
    return navigation.isDisplayed().catch(() => false);
  } catch {
    return false;
  }
}

async function captureFailure(driver, prefix) {
  try {
    const screenshot = await driver.takeScreenshot();
    const outputPath = `test-results/${prefix}-${Date.now()}.png`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, screenshot, 'base64');
  } catch {
    // Ignore screenshot failures after teardown.
  }
}

export async function login(driver, credentials) {
  console.log('Checking authenticated session...');
  await driver.get(new URL('/dashboard', baseUrl).href);

  if (await isAuthenticated(driver)) {
    console.log('Using existing authenticated session');
    return;
  }

  console.log('Opening login page...');
  await driver.get(new URL('/login', baseUrl).href);

  const email = By.css('input[type="email"], input[name="email"]');
  const password = By.css('input[type="password"]');
  const signInButton = By.xpath(
    "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')] | //input[(@type='submit' or @type='button') and contains(translate(@value, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')]"
  );
  const statusToast = By.css('[role="status"]');

  const emailField = await driver.wait(until.elementLocated(email), 30000);
  const passwordField = await driver.wait(until.elementLocated(password), 30000);
  const signInButtonElement = await driver.wait(until.elementLocated(signInButton), 30000);

  await driver.wait(until.elementIsVisible(emailField), 30000);
  await driver.wait(until.elementIsVisible(passwordField), 30000);
  await driver.wait(until.elementIsVisible(signInButtonElement), 30000);
  assert.equal(await signInButtonElement.isEnabled(), true, 'Expected sign in button to be enabled.');

  console.log('Entering login credentials...');
  await safeFill(driver, email, credentials.email, 'email');
  await safeFill(driver, password, credentials.password, 'password');
  await safeClick(driver, signInButton, 'sign in button');
  console.log('Waiting for dashboard after sign in...');

  try {
    await driver.wait(async () => /\/dashboard\/?$/.test(await driver.getCurrentUrl()), 60000);
  } catch (error) {
    const statusElements = await driver.findElements(statusToast);
    const toastVisible =
      statusElements.length > 0 ? await statusElements[0].isDisplayed().catch(() => false) : false;
    const toastText = toastVisible
      ? (await statusElements[0].getText().catch(() => '')) || 'Unknown login error'
      : 'No status message';
    await captureFailure(driver, 'login-error');
    throw new Error(`Login did not reach the dashboard. ${toastText}. ${error.message}`);
  }

  console.log('Logged in successfully');
}
