import { expect, test } from '@playwright/test';
import { couponData } from '../../data/coupon-data.js';
import { expectApiSuccess, expectSuccessToast, safeClick, safeFill } from '../../utils/ui-helpers.js';

async function openCouponsModule(page) {
  console.log('Opening dashboard with shared authenticated session...');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();

  console.log('Opening coupons module...');
  await safeClick(page.getByRole('link', { name: /coupons/i }), 'coupons link');
  await expect(page.getByRole('heading', { name: /coupons/i })).toBeVisible();
}

async function openNewCouponPage(page) {
  console.log('Opening new coupon form...');
  await safeClick(page.getByRole('button', { name: /new coupon/i }), 'new coupon button');
  await expect(page.getByRole('heading', { name: /new coupon/i })).toBeVisible();
}

async function fillCouponForm(page, coupon) {
  console.log('Filling coupon form...');
  await safeFill(page.getByPlaceholder('SUMMER20'), coupon.code, 'coupon code');
  await safeFill(page.getByRole('textbox', { name: /name\*/i }), coupon.name, 'coupon name');
  await page.getByLabel(/type\*/i).selectOption(coupon.type);
  await safeFill(page.getByRole('spinbutton', { name: /percentage \(%\)\*/i }), coupon.percentage, 'percentage');
  await page.getByLabel(/applies to/i).selectOption(coupon.scope);
  await safeFill(page.getByRole('spinbutton', { name: /max redemptions/i }), coupon.maxRedemptions, 'max redemptions');
  await safeFill(
    page.locator('input[name="maxRedemptionsPerClient"]'),
    coupon.maxRedemptionsPerClient,
    'max redemptions per client'
  );
  await safeFill(page.getByRole('spinbutton', { name: /minimum amount/i }), coupon.minimumAmount, 'minimum amount');
  await safeFill(page.getByRole('textbox', { name: /valid from/i }), coupon.validFrom, 'valid from');
  await safeFill(page.getByRole('textbox', { name: /valid until/i }), coupon.validUntil, 'valid until');
}

async function createCoupon(page, coupon) {
  const createResponsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && /coupon/i.test(response.url()),
    { timeout: 30000 }
  ).catch(() => null);

  console.log('Submitting coupon form...');
  await safeClick(page.getByRole('button', { name: /create coupon/i }), 'create coupon button');

  const duplicateCodeError = page.getByText(/already exists|already used|duplicate/i).first();
  const duplicateVisible = await duplicateCodeError.isVisible({ timeout: 5000 }).catch(() => false);
  if (duplicateVisible) {
    throw new Error(`Coupon code is not unique: ${coupon.code}`);
  }

  await expectApiSuccess(createResponsePromise, 'Coupon create');

  const statusVisible = await page.locator('[role="status"]').isVisible({ timeout: 15000 }).catch(() => false);
  if (statusVisible) {
    await expectSuccessToast(page, /coupon created|created|success/i);
  }
}

async function findCouponRow(page, coupon) {
  const row = page
    .locator('table tbody tr, [role="row"], .table-row')
    .filter({ hasText: coupon.code })
    .first();

  await expect(row).toBeVisible({ timeout: 30000 });
  return row;
}

async function openEditCouponPage(page, coupon) {
  console.log('Returning to coupons list for edit check...');
  await page.goto('/coupons', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /coupons/i })).toBeVisible();

  console.log('Opening edit coupon page...');
  const row = await findCouponRow(page, coupon);
  const actionButtons = row.getByRole('button');
  await safeClick(actionButtons.nth(1), 'edit coupon button');

  await expect(page).toHaveURL(/coupon/i);
  await expect(page.getByRole('heading', { name: /coupon/i })).toBeVisible();
  await expect(page.getByDisplayValue(coupon.code)).toBeVisible({ timeout: 15000 });
}

async function deactivateCoupon(page, coupon) {
  console.log('Returning to coupons list...');
  await page.goto('/coupons', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /coupons/i })).toBeVisible();

  const row = await findCouponRow(page, coupon);
  const actionButtons = row.getByRole('button');

  page.once('dialog', async (dialog) => {
    console.log(`Accepting dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  const deactivateResponsePromise = page.waitForResponse(
    (response) => {
      const method = response.request().method();
      return /coupon/i.test(response.url()) && ['DELETE', 'PATCH', 'PUT'].includes(method);
    },
    { timeout: 30000 }
  ).catch(() => null);

  console.log('Deactivating coupon...');
  await safeClick(actionButtons.nth(2), 'deactivate coupon button');
  await expectApiSuccess(deactivateResponsePromise, 'Coupon deactivate');

  const statusVisible = await page.locator('[role="status"]').isVisible({ timeout: 15000 }).catch(() => false);
  if (statusVisible) {
    await expectSuccessToast(page, /coupon deactivated|deactivated|success/i);
  }
}

test('Coupons Module Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    await openCouponsModule(page);
    await openNewCouponPage(page);
    await fillCouponForm(page, couponData.coupon);
    await createCoupon(page, couponData.coupon);
    await openEditCouponPage(page, couponData.coupon);
    await deactivateCoupon(page, couponData.coupon);
  } catch (error) {
    console.error('Coupons module flow failed:', error.message);
    await page.screenshot({ path: `test-results/coupons-error-${Date.now()}.png` }).catch(() => {});
    throw error;
  }
});
