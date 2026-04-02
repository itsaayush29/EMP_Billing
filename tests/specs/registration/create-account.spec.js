import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { registrationData } from '../../data/registration-data.js';
import { onboardingData } from '../../data/onboarding-data.js';
import { safeClick, safeFill } from '../../framework/support/interactions.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { createDriver, destroyDriver } from '../../framework/core/browser.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { waitForVisible, isVisible } from '../../framework/support/waits.js';
import { waitForUrl } from '../../framework/core/navigation.js';
import { LoginPage } from '../../pages/auth/login.page.js';
import { RegistrationPage } from '../../pages/auth/registration.page.js';
import { OnboardingPage } from '../../pages/onboarding/onboarding.page.js';

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
      return await waitForVisible(driver, locator, 2000);
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
      if (url && /\/onboarding/.test(new URL(url).pathname)) {
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

async function submitAndAwaitRedirectChain(
  driver,
  {
    networkKey = null,
    finalPattern = /^\/onboarding/,
    timeout = 60000,
  } = {}
) {
  const knownHandles = new Set(await driver.getAllWindowHandles());

  try {
    await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
  } catch (error) {
    if (!isTransientNavigationError(error)) {
      throw error;
    }

    console.warn('Transient error during submit click; continuing redirect polling.');
  }

  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      const allHandles = await driver.getAllWindowHandles();
      for (const handle of allHandles) {
        if (!knownHandles.has(handle)) {
          console.log(`New window detected (handle: ${handle}), switching to it...`);
          await driver.switchTo().window(handle);
          knownHandles.add(handle);
        }
      }

      const currentUrl = await getCurrentUrlSafe(driver);
      if (currentUrl) {
        const pathname = new URL(currentUrl).pathname;
        if (finalPattern.test(pathname)) {
          console.log(`Reached target URL: ${currentUrl}`);
          return currentUrl;
        }
      }
    } catch (error) {
      if (isTransientNavigationError(error)) {
        try {
          const remaining = await driver.getAllWindowHandles();
          if (remaining.length > 0) {
            const target = remaining.find((handle) => !knownHandles.has(handle)) ?? remaining.at(-1);
            await driver.switchTo().window(target);
            knownHandles.add(target);
          }
        } catch {
          // Ignore secondary switching errors during navigation churn.
        }
      } else {
        throw error;
      }
    }

    if (networkKey) {
      await readTrackedResponseState(driver, networkKey).catch(() => null);
    }

    await driver.sleep(250);
  }

  const finalUrl = await getCurrentUrlSafe(driver);
  throw new Error(`Timeout (${timeout}ms) waiting for redirect to ${finalPattern}. Last URL: ${finalUrl ?? 'unknown'}`);
}

async function clickIfVisible(driver, locator, elementName, timeout = 3000) {
  const visible = await isVisible(driver, locator, timeout).catch(() => false);
  if (!visible) {
    return false;
  }

  await safeClick(driver, locator, elementName);
  return true;
}

async function clickElement(driver, element, elementName) {
  await driver.executeScript(
    `
      arguments[0].scrollIntoView({ block: 'center', inline: 'center' });
    `,
    element
  );

  try {
    await element.click();
  } catch {
    await driver.executeScript('arguments[0].click();', element);
  }

  console.log(`Clicked ${elementName}`);
}

async function isOnboardingComplete(driver) {
  const currentUrl = await getCurrentUrlSafe(driver);
  if (currentUrl && !/\/onboarding/.test(new URL(currentUrl).pathname)) {
    return true;
  }

  const dashboardVisible = await isVisible(driver, OnboardingPage.dashboardShell, 2000).catch(() => false);
  if (dashboardVisible) {
    return true;
  }

  const completionVisible = await isVisible(driver, OnboardingPage.completionHeading, 2000).catch(() => false);
  return completionVisible;
}

async function fillFocusedInput(driver, value, fieldName) {
  await safeFill(driver, OnboardingPage.firstFocusVisibleInput, value, fieldName);
}

async function setInputValue(driver, locator, value, fieldName) {
  const field = await waitForVisible(driver, locator, 10000);
  await driver.executeScript(
    `
      arguments[0].scrollIntoView({ block: 'center', inline: 'center' });
      arguments[0].focus();
      arguments[0].value = arguments[1];
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
    `,
    field,
    value
  );
  console.log(`Set ${fieldName}: ${value}`);
}

async function readInputValue(driver, locator, timeout = 5000) {
  const field = await waitForVisible(driver, locator, timeout);
  return field.getAttribute('value');
}

async function fillVisibleInputByIndex(driver, locator, index, value, fieldName, timeout = 15000) {
  await driver.wait(async () => {
    const elements = await driver.findElements(locator);
    const visibleElements = [];

    for (const element of elements) {
      const displayed = await element.isDisplayed().catch(() => false);
      if (displayed) {
        visibleElements.push(element);
      }
    }

    return visibleElements.length > index;
  }, timeout);

  const elements = await driver.findElements(locator);
  const visibleElements = [];
  for (const element of elements) {
    const displayed = await element.isDisplayed().catch(() => false);
    if (displayed) {
      visibleElements.push(element);
    }
  }

  const target = visibleElements[index];
  await target.click();
  await target.clear();
  await target.sendKeys(String(value));
  console.log(`Filled ${fieldName}: ${value}`);
}

async function selectVisibleSelectByIndex(driver, locator, index, value, fieldName, timeout = 15000) {
  await driver.wait(async () => {
    const elements = await driver.findElements(locator);
    const visibleElements = [];

    for (const element of elements) {
      const displayed = await element.isDisplayed().catch(() => false);
      if (displayed) {
        visibleElements.push(element);
      }
    }

    return visibleElements.length > index;
  }, timeout);

  const elements = await driver.findElements(locator);
  const visibleElements = [];
  for (const element of elements) {
    const displayed = await element.isDisplayed().catch(() => false);
    if (displayed) {
      visibleElements.push(element);
    }
  }

  await driver.executeScript(
    `
      const select = arguments[0];
      const target = arguments[1];
      const option = Array.from(select.options).find(
        (item) => item.value === target || item.label === target || item.text.trim() === target
      );

      if (!option) {
        return false;
      }

      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    `,
    visibleElements[index],
    value
  );
  console.log(`Selected ${fieldName}: ${value}`);
}

async function setFocusedInputValue(driver, value, fieldName) {
  const field = await waitForVisible(driver, OnboardingPage.firstFocusVisibleInput, 10000);
  await driver.executeScript(
    `
      arguments[0].focus();
      arguments[0].value = arguments[1];
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
    `,
    field,
    value
  );
  console.log(`Set ${fieldName}: ${value}`);
}

async function waitForDashboardLoaded(driver, timeout = 30000) {
  await driver.wait(async () => {
    const currentUrl = await getCurrentUrlSafe(driver);
    if (!currentUrl) {
      return false;
    }

    const pathname = new URL(currentUrl).pathname;
    if (/\/onboarding/.test(pathname)) {
      return false;
    }

    const shellVisible = await isVisible(driver, OnboardingPage.dashboardShell, 1000).catch(() => false);
    const headingVisible = await isVisible(driver, OnboardingPage.dashboardHeading, 1000).catch(() => false);
    return shellVisible || headingVisible;
  }, timeout, 'Expected dashboard to be fully loaded after onboarding.');
}

async function finishSetupAndWaitForDashboard(driver) {
  const finishButton = await waitForVisible(driver, OnboardingPage.finishSetupButton, 15000);

  await driver.executeScript(
    `
      arguments[0].scrollIntoView({ block: 'center', inline: 'center' });
    `,
    finishButton
  );

  await driver.wait(async () => {
    const disabled = await finishButton.getAttribute('disabled').catch(() => null);
    const ariaDisabled = await finishButton.getAttribute('aria-disabled').catch(() => null);
    return disabled === null && ariaDisabled !== 'true';
  }, 10000, 'Expected Finish Setup button to be enabled.');

  await clickElement(driver, finishButton, 'finish setup button');

  await driver.wait(async () => {
    const currentUrl = await getCurrentUrlSafe(driver);
    if (currentUrl && !/\/onboarding/.test(new URL(currentUrl).pathname)) {
      return true;
    }

    const finishVisible = await isVisible(driver, OnboardingPage.finishSetupButton, 1000).catch(() => false);
    if (!finishVisible) {
      return true;
    }

    const dashboardVisible = await isVisible(driver, OnboardingPage.dashboardShell, 1000).catch(() => false);
    const dashboardHeadingVisible = await isVisible(driver, OnboardingPage.dashboardHeading, 1000).catch(() => false);
    return dashboardVisible || dashboardHeadingVisible;
  }, 30000, 'Expected onboarding to close after clicking Finish Setup.');

  await waitForDashboardLoaded(driver, 30000);
}

async function clickNextButton(driver, stepNumber) {
  const candidates = [
    OnboardingPage.moduleNextButton,
    OnboardingPage.step1NextButton,
    OnboardingPage.step2NextButton,
    OnboardingPage.step3NextButton,
    OnboardingPage.continueButton,
    OnboardingPage.primaryButton,
  ];

  for (const locator of candidates) {
    try {
      await safeClick(driver, locator, `onboarding step ${stepNumber} next button`);
      return;
    } catch {
      // Try the next locator.
    }
  }

  throw new Error(`Could not locate a next button on onboarding step ${stepNumber}.`);
}

async function selectModuleCard(driver, moduleName) {
  const byName = await driver.findElements(
    OnboardingPage.moduleTrialCards
  );

  for (const card of byName) {
    const text = (await card.getText().catch(() => '')).toLowerCase();
    if (text.includes(moduleName.toLowerCase())) {
      await clickElement(driver, card, `module card ${moduleName}`);
      return true;
    }
  }

  const cards = await driver.findElements(OnboardingPage.moduleTrialCards);
  for (const card of cards) {
    const visible = await card.isDisplayed().catch(() => false);
    if (visible) {
      await clickElement(driver, card, 'first visible module card');
      return true;
    }
  }

  return false;
}

async function completeOnboardingStepOne(driver, data) {
  await clickIfVisible(driver, OnboardingPage.step1StartButton, 'onboarding start button', 5000);
  await clickIfVisible(driver, OnboardingPage.step1FirstOption, 'onboarding step 1 first option', 5000);
  await clickIfVisible(driver, OnboardingPage.step1ThirdOption, 'onboarding step 1 third option', 5000);
  await clickIfVisible(driver, OnboardingPage.step1SixthOption, 'onboarding step 1 sixth option', 5000);
  await clickIfVisible(driver, OnboardingPage.step1SixthOption, 'onboarding step 1 sixth option retry', 2000);

  if (await isVisible(driver, OnboardingPage.step1NameField, 3000).catch(() => false)) {
    await setInputValue(driver, OnboardingPage.step1NameField, data.organizationLabel, 'onboarding step 1 name');
  }

  if (await isVisible(driver, OnboardingPage.step1OrganizationLabelField, 3000).catch(() => false)) {
    await safeFill(
      driver,
      OnboardingPage.step1OrganizationLabelField,
      data.organizationLabel,
      'onboarding organization label'
    );
  }

  await clickNextButton(driver, 1);
}

async function completeOnboardingStepTwo(driver, data) {
  if (await isOnboardingComplete(driver)) {
    return;
  }

  await driver.wait(async () => {
    const inviteHeadingVisible = await isVisible(driver, OnboardingPage.inviteStepHeading, 1000).catch(() => false);
    const emailFieldVisible = await isVisible(driver, OnboardingPage.inviteEmailInputs, 1000).catch(() => false);
    return inviteHeadingVisible || emailFieldVisible || await isOnboardingComplete(driver);
  }, 15000);

  if (await isOnboardingComplete(driver)) {
    return;
  }

  await fillVisibleInputByIndex(driver, OnboardingPage.inviteEmailInputs, 0, data.invitedUsers[0].email, 'first invited user email');
  await selectVisibleSelectByIndex(driver, OnboardingPage.inviteRoleSelects, 0, data.invitedUsers[0].role, 'first invited user role');

  if (data.invitedUsers[1]) {
    await clickIfVisible(driver, OnboardingPage.step2AddAnotherInviteButton, 'add another invite button', 5000);
    await fillVisibleInputByIndex(
      driver,
      OnboardingPage.inviteEmailInputs,
      1,
      data.invitedUsers[1].email,
      'second invited user email'
    );
    await selectVisibleSelectByIndex(driver, OnboardingPage.inviteRoleSelects, 1, data.invitedUsers[1].role, 'second invited user role');
  }

  await clickNextButton(driver, 2);
}

async function completeOnboardingStepThree(driver) {
  await clickIfVisible(driver, OnboardingPage.step3FirstCard, 'onboarding step 3 first card', 5000);
  await clickIfVisible(driver, OnboardingPage.step3ThirdCard, 'onboarding step 3 third card', 5000);
  await clickIfVisible(driver, OnboardingPage.step3FourthCard, 'onboarding step 3 fourth card', 5000);
  await clickIfVisible(driver, OnboardingPage.step3SecondCard, 'onboarding step 3 second card', 5000);
  await clickNextButton(driver, 3);
}

async function completeOnboardingStepFour(driver, data) {
  if (await isOnboardingComplete(driver)) {
    return;
  }

  await driver.wait(async () => {
    const headingVisible = await isVisible(driver, OnboardingPage.moduleStepHeading, 1000).catch(() => false);
    const cardVisible = await isVisible(driver, OnboardingPage.moduleTrialCards, 1000).catch(() => false);
    return headingVisible || cardVisible || await isOnboardingComplete(driver);
  }, 15000);

  if (await isOnboardingComplete(driver)) {
    return;
  }

  const selected = await selectModuleCard(driver, data.moduleName);
  assert.equal(selected, true, `Expected to select a module card for "${data.moduleName}".`);
  await clickNextButton(driver, 4);
}

async function completeOnboardingFinalStep(driver, stepNumber) {
  if (await isOnboardingComplete(driver)) {
    return;
  }

  if (await isVisible(driver, OnboardingPage.shiftNameField, 3000).catch(() => false)) {
    const shiftName = await readInputValue(driver, OnboardingPage.shiftNameField, 3000).catch(() => '');
    if (!String(shiftName || '').trim()) {
      await setInputValue(driver, OnboardingPage.shiftNameField, onboardingData.attendance.shiftName, 'shift name');
    }
  }

  if (await isVisible(driver, OnboardingPage.startTimeField, 3000).catch(() => false)) {
    const startTime = await readInputValue(driver, OnboardingPage.startTimeField, 3000).catch(() => '');
    if (!String(startTime || '').trim()) {
      await setInputValue(driver, OnboardingPage.startTimeField, onboardingData.attendance.startTime, 'start time');
    }
  }

  if (await isVisible(driver, OnboardingPage.endTimeField, 3000).catch(() => false)) {
    const endTime = await readInputValue(driver, OnboardingPage.endTimeField, 3000).catch(() => '');
    if (!String(endTime || '').trim()) {
      await setInputValue(driver, OnboardingPage.endTimeField, onboardingData.attendance.endTime, 'end time');
    }
  }

  if (await isVisible(driver, OnboardingPage.finishSetupButton, 3000).catch(() => false)) {
    await finishSetupAndWaitForDashboard(driver);
  } else if (await isVisible(driver, OnboardingPage.continueButton, 3000).catch(() => false)) {
    await clickNextButton(driver, stepNumber);
    await waitForDashboardLoaded(driver, 30000);
  }
}

async function completeOnboardingStep(driver, stepNumber) {
  console.log(`Completing onboarding step ${stepNumber}/5...`);
  await driver.sleep(1500);

  if (stepNumber === 1) {
    await completeOnboardingStepOne(driver, onboardingData);
  } else if (stepNumber === 2) {
    await completeOnboardingStepTwo(driver, onboardingData);
  } else if (stepNumber === 3) {
    await completeOnboardingStepThree(driver);
  } else if (stepNumber === 4) {
    await completeOnboardingStepFour(driver, onboardingData);
  } else {
    await completeOnboardingFinalStep(driver, stepNumber);
  }

  console.log(`Onboarding step ${stepNumber} submitted.`);
}

async function completeOnboarding(driver) {
  console.log('Beginning onboarding wizard...');
  await waitForUrl(driver, /\/onboarding/, 15000);

  for (let step = 1; step <= 5; step += 1) {
    if (await isOnboardingComplete(driver)) {
      const completedUrl = await getCurrentUrlSafe(driver);
      console.log(`Onboarding already completed before step ${step}. Current URL: ${completedUrl}`);
      return completedUrl;
    }

    await completeOnboardingStep(driver, step);

    if (await isOnboardingComplete(driver)) {
      const url = await getCurrentUrlSafe(driver);
      console.log(`Onboarding finished after step ${step}. Redirected to: ${url}`);
      return url;
    }
  }

  await driver.wait(async () => {
    const url = await getCurrentUrlSafe(driver);
    return Boolean(url && !/\/onboarding/.test(new URL(url).pathname));
  }, 15000, 'Expected to leave /onboarding after completing all onboarding steps');

  const finalUrl = await getCurrentUrlSafe(driver);
  await waitForDashboardLoaded(driver, 30000);
  const completionVisible = await isVisible(driver, OnboardingPage.completionHeading, 5000).catch(() => false);
  const dashboardVisible = await isVisible(driver, OnboardingPage.dashboardShell, 5000).catch(() => false);
  const dashboardHeadingVisible = await isVisible(driver, OnboardingPage.dashboardHeading, 5000).catch(() => false);
  assert.equal(
    completionVisible || dashboardVisible || dashboardHeadingVisible,
    true,
    'Expected dashboard or onboarding completion state to be visible after onboarding.'
  );
  console.log(`Onboarding completed. Final URL: ${finalUrl}`);
  return finalUrl;
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

  it('registers a new account with valid data', async function () {
    try {
      await openRegistrationPage(driver);
      await fillRegistrationForm(driver, registrationData.validUser);
      await trackNetworkResponse(driver, 'registerAccount', '/auth/register');

      await submitAndAwaitRedirectChain(driver, {
        networkKey: 'registerAccount',
        finalPattern: /^\/onboarding/,
        timeout: 60000,
      });

      console.log('Waiting for registration network response...');
      const responseStatus = await waitForTrackedResponse(driver, 'registerAccount', 30000);
      assert.equal(responseStatus, 201, `Expected registration API status to be 201, received ${responseStatus}.`);

      await completeOnboarding(driver);

      console.log('Registration and onboarding completed successfully.');
    } catch (error) {
      console.error('Registration flow failed:', error.message);
      await captureFailure(driver, 'registration-error');
      throw error;
    }
  });
});
