import assert from 'node:assert/strict';
import { By } from 'selenium-webdriver';
import { waitForVisible } from './waits.js';

export async function expectSuccessToast(driver, pattern = /created|success/i) {
  const toast = await waitForVisible(driver, By.css('[role="status"]'), 15000);
  const text = (await toast.getText()) || '';
  console.log('Toast message:', text);
  assert.match(text, pattern);
}
