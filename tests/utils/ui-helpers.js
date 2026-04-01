import assert from 'node:assert/strict';
import { By, until } from 'selenium-webdriver';

export async function safeFill(driver, locator, value, fieldName = 'field') {
  try {
    const element = await driver.wait(until.elementLocated(locator), 30000);
    await driver.wait(until.elementIsVisible(element), 30000);
    await element.click();
    await element.clear();
    await element.sendKeys(String(value));
    console.log(`Filled ${fieldName}: ${value}`);
  } catch (error) {
    console.error(`Failed to fill ${fieldName}:`, error.message);
    throw error;
  }
}

export async function safeClick(driver, locator, elementName = 'element') {
  try {
    const element = await driver.wait(until.elementLocated(locator), 30000);
    await driver.wait(until.elementIsVisible(element), 30000);
    await element.click();
    console.log(`Clicked ${elementName}`);
  } catch (error) {
    console.error(`Failed to click ${elementName}:`, error.message);
    throw error;
  }
}

export async function selectFirstAvailableOption(driver, selectLocator, placeholderPattern, fieldName = 'field') {
  const selectElement = await driver.wait(until.elementLocated(selectLocator), 30000);
  await driver.wait(until.elementIsVisible(selectElement), 30000);

  await driver.wait(async () => {
    const optionElements = await selectElement.findElements(By.css('option'));
    const options = await Promise.all(
      optionElements.map(async (option) => ({
        value: (await option.getAttribute('value')) || '',
        label: ((await option.getText()) || '').trim(),
        disabled: (await option.getAttribute('disabled')) !== null,
      }))
    );

    return options.filter(
      (option) => option.value && !option.disabled && !(placeholderPattern?.test(option.label) ?? false)
    ).length > 0;
  }, 30000);

  const optionElements = await selectElement.findElements(By.css('option'));
  const options = await Promise.all(
    optionElements.map(async (option) => ({
      value: (await option.getAttribute('value')) || '',
      label: ((await option.getText()) || '').trim(),
      disabled: (await option.getAttribute('disabled')) !== null,
    }))
  );

  const selectedOption = options.find(
    (option) => option.value && !option.disabled && !(placeholderPattern?.test(option.label) ?? false)
  );

  if (!selectedOption) {
    throw new Error(`No selectable options were available for ${fieldName}.`);
  }

  await driver.executeScript(
    `
      arguments[0].value = arguments[1];
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
    `,
    selectElement,
    selectedOption.value
  );
  console.log(`Selected ${fieldName}: ${selectedOption.label}`);
}

export async function expectSuccessToast(driver, pattern = /created|success/i) {
  const toasts = await driver.wait(async () => {
    const elements = await driver.findElements(By.css('[role="status"]'));
    return elements.length ? elements : false;
  }, 15000);
  const toast = toasts[0];
  const visible = await toast.isDisplayed().catch(() => false);

  if (!visible) {
    throw new Error('Expected a success toast, but no status toast appeared.');
  }

  const text = (await toast.getText()) || '';
  console.log('Toast message:', text);
  assert.match(text, pattern);
}

export async function expectApiSuccess(responsePromise, entityName) {
  const response = await responsePromise;

  if (!response) {
    console.warn(`${entityName} API response was not captured.`);
    return;
  }

  const status =
    typeof response.status === 'function'
      ? await response.status()
      : typeof response.getStatus === 'function'
        ? await response.getStatus()
        : response.statusCode;

  console.log(`${entityName} API status: ${status}`);
  assert.ok([200, 201].includes(status), `Expected ${entityName} API status to be 200 or 201, received ${status}.`);
}
