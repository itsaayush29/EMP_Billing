import { Key, until } from 'selenium-webdriver';
import { env } from '../config/env.js';

export async function waitForVisible(driver, locator, timeout = env.timeout) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

export async function isVisible(driver, locator, timeout = 3000) {
  try {
    const element = await driver.wait(until.elementLocated(locator), timeout);
    return element.isDisplayed().catch(() => false);
  } catch {
    return false;
  }
}

export async function waitForNotVisible(driver, locator, timeout = 15000) {
  await driver.wait(async () => {
    const elements = await driver.findElements(locator);
    if (!elements.length) {
      return true;
    }

    const visible = await elements[0].isDisplayed().catch(() => false);
    return !visible;
  }, timeout);
}

export async function sendEnter(driver, locator) {
  const element = await waitForVisible(driver, locator);
  await element.sendKeys(Key.ENTER);
}
