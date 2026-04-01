import assert from 'node:assert/strict';
import { By, until } from 'selenium-webdriver';
import { env } from '../config/env.js';
import { waitForVisible } from './waits.js';

export async function safeFill(driver, locator, value, fieldName = 'field') {
  try {
    const element = await waitForVisible(driver, locator, env.timeout);
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
    const element = await waitForVisible(driver, locator, env.timeout);
    await element.click();
    console.log(`Clicked ${elementName}`);
  } catch (error) {
    console.error(`Failed to click ${elementName}:`, error.message);
    throw error;
  }
}

export async function selectFirstAvailableOption(driver, selectLocator, placeholderPattern, fieldName = 'field') {
  const selectElement = await waitForVisible(driver, selectLocator, env.timeout);

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
  }, env.timeout);

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

export async function selectOption(driver, locator, valueOrLabel) {
  const selectElement = await waitForVisible(driver, locator, env.timeout);
  const found = await driver.executeScript(
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
    selectElement,
    valueOrLabel
  );

  assert.equal(found, true, `Expected select option "${valueOrLabel}" to be available.`);
}
