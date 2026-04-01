import assert from 'node:assert/strict';
import { until } from 'selenium-webdriver';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { registrationScenarios } from '../../data/registration-scenarios.js';
import { safeClick, safeFill } from '../../framework/support/interactions.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { createDriver, destroyDriver } from '../../framework/core/browser.js';
import { getTrackedResponseCount, trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { waitForVisible, isVisible } from '../../framework/support/waits.js';
import { waitForUrl } from '../../framework/core/navigation.js';
import { LoginPage } from '../../pages/auth/login.page.js';
import { RegistrationPage } from '../../pages/auth/registration.page.js';

function isTransientNavigationError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('target frame detached') ||
    message.includes('received inspector.detached event') ||
    message.includes('inspector.detached') ||
    message.includes('stale element reference') ||
    message.includes('no such window') ||
    message.includes('browsing context has been discarded')
  );
}

async function getCurrentUrlSafe(driver) {
  try {
    return await driver.getCurrentUrl();
  } catch (error) {
    if (isTransientNavigationError(error)) {
      return null;
    }

    throw error;
  }
}

async function waitForFreshVisible(driver, locator, timeout = 30000) {
  return driver.wait(async () => {
    try {
      const element = await waitForVisible(driver, locator, 2000);
      return element;
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, timeout);
}

async function dismissRegistrationPopup(driver) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const popupVisible = await isVisible(driver, RegistrationPage.popupCloseButton, 2000).catch(() => false);
    if (!popupVisible) {
      return;
    }

    try {
      await safeClick(driver, RegistrationPage.popupCloseButton, 'registration popup dismiss button');
    } catch (error) {
      if (!isTransientNavigationError(error)) {
        throw error;
      }
    }
    await driver.sleep(1000);
  }
}

async function waitForRegistrationForm(driver, timeout = 30000) {
  return driver.wait(async () => {
    try {
      const url = await getCurrentUrlSafe(driver);
      if (url && /\/onboarding\/?$/.test(url)) {
        return false;
      }

      const organizationNameField = await waitForVisible(driver, RegistrationPage.organizationNameField, 2000);
      await dismissRegistrationPopup(driver);
      return organizationNameField;
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, timeout);
}

async function openRegistrationPage(driver) {
  console.log('Opening login page...');
  await driver.get('https://test-empcloud.empcloud.com/login');
  await waitForFreshVisible(driver, LoginPage.signInHeading, 30000);
  await dismissRegistrationPopup(driver);

  console.log('Opening registration form...');
  await driver.wait(async () => {
    try {
      await safeClick(driver, RegistrationPage.registerOrganizationLink, 'register your organization link');
      return true;
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, 30000);

  await waitForRegistrationForm(driver, 30000);
  await dismissRegistrationPopup(driver);
}

async function fillRegistrationForm(driver, user) {
  if (user.organizationName) {
    await safeFill(driver, RegistrationPage.organizationNameField, user.organizationName, 'organization name');
  }

  if (user.organizationCountry) {
    await safeFill(driver, RegistrationPage.organizationCountryField, user.organizationCountry, 'organization country');
  }

  if (user.organizationState) {
    await safeFill(driver, RegistrationPage.organizationStateField, user.organizationState, 'organization state');
  }

  if (user.firstName) {
    await safeFill(driver, RegistrationPage.firstNameField, user.firstName, 'first name');
  }

  if (user.lastName) {
    await safeFill(driver, RegistrationPage.lastNameField, user.lastName, 'last name');
  }

  if (user.workEmail) {
    await safeFill(driver, RegistrationPage.workEmailField, user.workEmail, 'work email');
  }

  if (user.password) {
    await safeFill(driver, RegistrationPage.passwordField, user.password, 'password');
  }

  return {
    organizationName: RegistrationPage.organizationNameField,
    organizationCountry: RegistrationPage.organizationCountryField,
    organizationState: RegistrationPage.organizationStateField,
    firstName: RegistrationPage.firstNameField,
    lastName: RegistrationPage.lastNameField,
    workEmail: RegistrationPage.workEmailField,
    password: RegistrationPage.passwordField,
  };
}

async function expectFieldToBeInvalid(driver, locator) {
  await driver.wait(async () => {
    try {
      const element = await driver.wait(until.elementLocated(locator), 2000);
      const state = await driver.executeScript(
        `
          return {
            checkValidity: typeof arguments[0].checkValidity === 'function' ? arguments[0].checkValidity() : true,
            validationMessage: arguments[0].validationMessage || '',
            ariaInvalid: arguments[0].getAttribute('aria-invalid') || '',
            required: arguments[0].required === true,
            value: arguments[0].value || ''
          };
        `,
        element
      );

      return (
        state.checkValidity === false ||
        state.validationMessage.length > 0 ||
        state.ariaInvalid === 'true' ||
        (state.required && state.value === '')
      );
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, 10000);
}

async function expectRegistrationToStayOnForm(driver) {
  const organizationNameField = await waitForRegistrationForm(driver, 10000);
  assert.equal(await organizationNameField.isDisplayed(), true);
}

async function readTrackedResponseState(driver, key) {
  return driver
    .executeScript(
      `
        const memoryValue = window.__empNetwork?.[arguments[0]];
        if (memoryValue) {
          return memoryValue;
        }

        try {
          const stored = JSON.parse(window.sessionStorage.getItem('__empNetworkState') || '{}');
          return stored?.[arguments[0]] ?? null;
        } catch {
          return null;
        }
      `,
      key
    )
    .catch((error) => {
      if (isTransientNavigationError(error)) {
        return null;
      }

      throw error;
    });
}

// Inject a small script on the page to suppress window.close/window.open for the registration flow only.
// This prevents the app from closing the browser/tab during the rapid redirect chain.
async function suppressWindowClose(driver) {
  try {
    await driver.executeScript(
      `
        // Backup originals so we can still log if needed
        (function(){
          if (!window.__empTestHelpers) {
            window.__empTestHelpers = {};
          }

          if (!window.__empTestHelpers._closePatched) {
            window.__empTestHelpers._origClose = window.close;
            window.close = function() { console.warn('window.close suppressed by test harness'); };
            try { window.self.close = window.close; } catch(e) {}
            window.__empTestHelpers._closePatched = true;
          }

          if (!window.__empTestHelpers._openPatched) {
            window.__empTestHelpers._origOpen = window.open;
            window.open = function(){ console.warn('window.open suppressed by test harness'); return null; };
            window.__empTestHelpers._openPatched = true;
          }
        })();
      `
    );
  } catch (error) {
    if (isTransientNavigationError(error)) {
      // If the frame detached while installing the suppression, ignore — navigation likely started.
      return;
    }
    throw error;
  }
}

async function submitAndAwaitRedirectChain(driver, { networkKey = null, finalPattern = /\/onboarding\/?$/, timeout = 60000 } = {}) {
  // Install suppression only for this spec run to prevent the app from closing the window.
  await suppressWindowClose(driver);

  // Attempt the click but tolerate transient errors from navigation
  try {
    await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
  } catch (error) {
    if (!isTransientNavigationError(error)) {
      throw error;
    }
    // If the click failed because the frame detached, it likely means navigation started.
    console.warn('Transient error during click, continuing to wait for navigation...');
  }

  const start = Date.now();
  const deadline = start + timeout;

  // If a network tracker key is provided, wait for the API response in parallel while watching URL.
  while (Date.now() < deadline) {
    const currentUrl = await getCurrentUrlSafe(driver);
    if (currentUrl) {
      const pathname = new URL(currentUrl).pathname;

      // Final success state
      if (finalPattern.test(pathname)) {
        return currentUrl;
      }

      // Allowed intermediate transient state (app briefly navigates to '/')
      if (pathname === '/') {
        // keep waiting until finalPattern appears
      }
    }

    // If networkKey provided, check whether the tracked response arrived and was successful
    if (networkKey) {
      const status = await readTrackedResponseState(driver, networkKey).catch(() => null);
      if (status && typeof status.lastStatus === 'number') {
        // If the API returned success (201) we can keep waiting for final URL; continue
        // No immediate action here, but presence indicates server processed registration
      }
    }

    await driver.sleep(250);
  }

  // As a last attempt, try to explicitly wait for the final URL to appear using existing helper
  try {
    await waitForUrl(driver, finalPattern, 5000);
    return await getCurrentUrlSafe(driver);
  } catch (err) {
    throw new Error(`Timeout waiting for redirect chain to final onboarding within ${timeout}ms`);
  }
}

describe('Registration Page Flow', function () {
  this.timeout(120000);

  let driver;
  let profileDir;

  beforeEach(async () => {
    const created = await createDriver();
    driver = created.driver;
    profileDir = created.profileDir;
  });

  afterEach(async () => {
    await destroyDriver(driver, profileDir);
    driver = undefined;
    profileDir = undefined;
  });

  it(registrationScenarios.validRegistration.name, async function () {
    try {
      await openRegistrationPage(driver);
      await fillRegistrationForm(driver, registrationScenarios.validRegistration.user);
      await trackNetworkResponse(driver, 'registerAccount', '/auth/register');

      // Submit and wait for the redirect chain (this tolerates a brief '/' transient navigation)
      await submitAndAwaitRedirectChain(driver, { networkKey: 'registerAccount', finalPattern: /\/onboarding\/?$/, timeout: 60000 });

      console.log('Waiting for registration network response...');
      const responseStatus = await waitForTrackedResponse(driver, 'registerAccount', 30000);
      assert.equal(responseStatus, 201, `Expected registration API status to be 201, received ${responseStatus}.`);

      // Confirm final onboarding URL is reached
      await waitForUrl(driver, /\/onboarding\/?$/, 30000);
    } catch (error) {
      console.error('Registration flow failed:', error.message);
      await captureFailure(driver, 'registration-error');
      throw error;
    }
  });

  it(registrationScenarios.missingFirstName.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.missingFirstName.user);
    await trackNetworkResponse(driver, 'registerBlockedMissingFirstName', '/auth/register');

    // Submit but do not treat transient navigation as success for validation tests.
    try {
      // Ensure suppression is in place before clicking so the app cannot close the tab
      await suppressWindowClose(driver);
      await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
    } catch (error) {
      if (!isTransientNavigationError(error)) {
        throw error;
      }
    }

    // Re-check the field using a fresh locator to avoid stale references
    await expectFieldToBeInvalid(driver, RegistrationPage.firstNameField);
    const blockedStatus = await readTrackedResponseState(driver, 'registerBlockedMissingFirstName');
    assert.equal(blockedStatus, null);
    assert.equal(await getTrackedResponseCount(driver, 'registerBlockedMissingFirstName'), 0);
    await expectRegistrationToStayOnForm(driver);
  });

  it(registrationScenarios.invalidEmail.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.invalidEmail.user);
    await trackNetworkResponse(driver, 'registerBlockedInvalidEmail', '/auth/register');

    try {
      await suppressWindowClose(driver);
      await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
    } catch (error) {
      if (!isTransientNavigationError(error)) {
        throw error;
      }
    }

    await expectFieldToBeInvalid(driver, RegistrationPage.workEmailField);
    const blockedStatus = await readTrackedResponseState(driver, 'registerBlockedInvalidEmail');
    assert.equal(blockedStatus, null);
    assert.equal(await getTrackedResponseCount(driver, 'registerBlockedInvalidEmail'), 0);
    await expectRegistrationToStayOnForm(driver);
  });
});
