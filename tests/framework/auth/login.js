import assert from 'node:assert/strict';
import { env } from '../config/env.js';
import { openPath } from '../core/navigation.js';
import { captureFailure } from '../support/artifacts.js';
import { safeClick, safeFill } from '../support/interactions.js';
import { waitForVisible } from '../support/waits.js';
import { LoginPage } from '../../pages/auth/login.page.js';

async function isAuthenticated(driver) {
  try {
    const marker = await driver.findElement(LoginPage.authenticatedMarker);
    return marker.isDisplayed().catch(() => false);
  } catch {
    return false;
  }
}

export async function login(driver, credentials) {
  console.log('Checking authenticated session...');
  await openPath(driver, '/login');

  if (await isAuthenticated(driver)) {
    console.log('Using existing authenticated session');
    return;
  }

  console.log('Opening login page...');
  await openPath(driver, '/login');

  const emailField = await waitForVisible(driver, LoginPage.emailField, env.timeout);
  const passwordField = await waitForVisible(driver, LoginPage.passwordField, env.timeout);
  const signInButton = await waitForVisible(driver, LoginPage.signInButton, env.timeout);

  assert.equal(await signInButton.isEnabled(), true, 'Expected sign in button to be enabled.');

  console.log('Entering login credentials...');
  await safeFill(driver, LoginPage.emailField, credentials.email, 'email');
  await safeFill(driver, LoginPage.passwordField, credentials.password, 'password');
  await safeClick(driver, LoginPage.signInButton, 'sign in button');
  console.log('Waiting for authenticated area after sign in...');

  try {
    await waitForVisible(driver, LoginPage.authenticatedMarker, 60000);
  } catch (error) {
    const statusElements = await driver.findElements(LoginPage.statusToast);
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
