import { expect } from '@playwright/test';

export async function safeFill(locator, value, fieldName = 'field') {
  try {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.click();
    await locator.clear();
    await locator.fill(String(value));
    console.log(`Filled ${fieldName}: ${value}`);
  } catch (error) {
    console.error(`Failed to fill ${fieldName}:`, error.message);
    throw error;
  }
}

export async function safeClick(locator, elementName = 'element') {
  try {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.click();
    console.log(`Clicked ${elementName}`);
  } catch (error) {
    console.error(`Failed to click ${elementName}:`, error.message);
    throw error;
  }
}

export async function selectFirstAvailableOption(selectLocator, placeholderPattern, fieldName = 'field') {
  await expect(selectLocator).toBeVisible();

  await expect
    .poll(
      async () => {
        const options = await selectLocator.locator('option').evaluateAll((elements) =>
          elements.map((option) => ({
            value: option.value,
            label: option.textContent?.trim() ?? '',
            disabled: option.disabled,
          }))
        );

        return options.filter(
          (option) => option.value && !option.disabled && !(placeholderPattern?.test(option.label) ?? false)
        ).length;
      },
      {
        timeout: 30000,
        message: `Waiting for selectable options for ${fieldName}`,
      }
    )
    .toBeGreaterThan(0);

  const options = await selectLocator.locator('option').evaluateAll((elements) =>
    elements.map((option) => ({
      value: option.value,
      label: option.textContent?.trim() ?? '',
      disabled: option.disabled,
    }))
  );

  const selectedOption = options.find(
    (option) => option.value && !option.disabled && !(placeholderPattern?.test(option.label) ?? false)
  );

  if (!selectedOption) {
    throw new Error(`No selectable options were available for ${fieldName}.`);
  }

  await selectLocator.selectOption(selectedOption.value);
  console.log(`Selected ${fieldName}: ${selectedOption.label}`);
}

export async function expectSuccessToast(page, pattern = /created|success/i) {
  const toast = page.locator('[role="status"]');
  const visible = await toast.isVisible({ timeout: 15000 }).catch(() => false);

  if (!visible) {
    throw new Error('Expected a success toast, but no status toast appeared.');
  }

  const text = (await toast.textContent()) || '';
  console.log('Toast message:', text);
  await expect(toast).toContainText(pattern);
}

export async function expectApiSuccess(responsePromise, entityName) {
  const response = await responsePromise;

  if (!response) {
    console.warn(`${entityName} API response was not captured.`);
    return;
  }

  console.log(`${entityName} API status: ${response.status()}`);
  expect([200, 201]).toContain(response.status());
}
