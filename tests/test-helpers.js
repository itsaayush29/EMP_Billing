import { expect } from '@playwright/test';

const DEFAULT_TIMEOUT = 30000;
const DASHBOARD_URL_PATTERN = /dashboard/;

export async function safeFill(locator, value, fieldName = 'field', timeout = DEFAULT_TIMEOUT) {
  await locator.waitFor({ state: 'visible', timeout });
  await locator.click();
  await locator.fill(String(value));
  console.log(`✅ Filled ${fieldName}: ${value}`);
}

export async function safeClick(locator, elementName = 'element', timeout = DEFAULT_TIMEOUT) {
  await locator.waitFor({ state: 'visible', timeout });
  await locator.click();
  console.log(`✅ Clicked ${elementName}`);
}

export async function loginToApplication(page, credentials) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();

  await expect(email).toBeVisible({ timeout: DEFAULT_TIMEOUT });

  await safeFill(email, credentials.email, 'email');
  await safeFill(password, credentials.password, 'password');
  await safeClick(page.getByRole('button', { name: /sign in/i }), 'sign in button');

  await expect(page).toHaveURL(DASHBOARD_URL_PATTERN, { timeout: 60000 });
  console.log('✅ Logged in successfully');
}

export async function waitForPostResponse(page, pathFragment, timeout = DEFAULT_TIMEOUT) {
  return page.waitForResponse(
    (response) => response.url().includes(pathFragment) && response.request().method() === 'POST',
    { timeout }
  ).catch(() => null);
}

export async function logApiResponse(response, emptyMessage) {
  if (!response) {
    console.warn(emptyMessage);
    return;
  }

  try {
    const body = await response.json();
    console.log('📦 API RESPONSE:', body);

    if (![200, 201].includes(response.status())) {
      console.warn('⚠️ API returned unexpected status:', response.status());
    }
  } catch {
    console.warn('⚠️ API parse failed');
  }
}

export async function logToastStatus(page, successMessage) {
  const toast = page.locator('[role="status"]');
  const visible = await toast.isVisible({ timeout: 15000 }).catch(() => false);

  if (!visible) {
    console.warn('⚠️ No toast message appeared');
    return;
  }

  const text = (await toast.textContent()) ?? '';
  console.log('🔔 Toast message:', text);

  if (/created/i.test(text)) {
    console.log(successMessage);
    return;
  }

  console.warn('⚠️ Invoice NOT created:', text);
}

export async function fillLineItems(page, lineItems) {
  for (const [index, item] of lineItems.entries()) {
    if (index > 0) {
      await safeClick(page.getByRole('button', { name: /add line item/i }), 'add line item button');
    }

    await safeFill(page.locator(`input[name="items.${index}.name"]`), item.name, `item ${index + 1} name`);
    await safeFill(page.locator(`input[name="items.${index}.description"]`), item.description, `item ${index + 1} description`);
    await safeFill(page.locator(`input[name="items.${index}.quantity"]`), item.quantity, `item ${index + 1} quantity`);
    await safeFill(page.locator(`input[name="items.${index}.rate"]`), item.rate, `item ${index + 1} rate`);

    console.log(`📝 Added line item ${index + 1}: ${item.name}`);
  }
}
