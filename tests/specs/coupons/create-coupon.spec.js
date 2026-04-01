import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { By, until } from 'selenium-webdriver';
import { couponData } from '../../data/coupon-data.js';
import { expectSuccessToast } from '../../framework/support/assertions.js';
import { safeClick, safeFill, selectOption } from '../../framework/support/interactions.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { isVisible, waitForVisible } from '../../framework/support/waits.js';
import { destroyDriver } from '../../framework/core/browser.js';
import { openPath, waitForUrl } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { startAuthenticatedDriver } from '../../framework/core/session.js';
import { CouponsPage, couponRow } from '../../pages/modules/coupons.page.js';

async function openCouponsModule(driver) {
  console.log('Opening dashboard with shared authenticated session...');
  await openPath(driver, '/dashboard');
  await waitForVisible(driver, CouponsPage.dashboardLink, 30000);

  console.log('Opening coupons module...');
  await safeClick(driver, CouponsPage.couponsLink, 'coupons link');
  await waitForVisible(driver, CouponsPage.couponsHeading, 30000);
}

async function openNewCouponPage(driver) {
  console.log('Opening new coupon form...');
  await safeClick(driver, CouponsPage.newCouponButton, 'new coupon button');
  await waitForVisible(driver, CouponsPage.newCouponHeading, 30000);
}

async function fillCouponForm(driver, coupon) {
  console.log('Filling coupon form...');
  await safeFill(driver, CouponsPage.codeField, coupon.code, 'coupon code');
  await safeFill(driver, CouponsPage.nameField, coupon.name, 'coupon name');
  await selectOption(driver, CouponsPage.typeSelect, coupon.type);
  await safeFill(driver, CouponsPage.percentageField, coupon.percentage, 'percentage');
  await selectOption(driver, CouponsPage.appliesToSelect, coupon.scope);
  await safeFill(driver, CouponsPage.maxRedemptionsField, coupon.maxRedemptions, 'max redemptions');
  await safeFill(driver, CouponsPage.maxRedemptionsPerClientField, coupon.maxRedemptionsPerClient, 'max redemptions per client');
  await safeFill(driver, CouponsPage.minimumAmountField, coupon.minimumAmount, 'minimum amount');
  await safeFill(driver, CouponsPage.validFromField, coupon.validFrom, 'valid from');
  await safeFill(driver, CouponsPage.validUntilField, coupon.validUntil, 'valid until');
}

async function createCoupon(driver, coupon) {
  await trackNetworkResponse(driver, 'couponCreate', 'coupon');

  console.log('Submitting coupon form...');
  await safeClick(driver, CouponsPage.createCouponButton, 'create coupon button');

  const duplicateVisible = await isVisible(driver, By.xpath("//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'already exists') or contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'already used') or contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'duplicate')]"), 5000);
  if (duplicateVisible) {
    throw new Error(`Coupon code is not unique: ${coupon.code}`);
  }

  const status = await waitForTrackedResponse(driver, 'couponCreate', 30000);
  assert.ok([200, 201].includes(status), `Expected coupon create API status to be 200 or 201, received ${status}.`);

  const statusVisible = await isVisible(driver, CouponsPage.statusToast, 15000);
  if (statusVisible) {
    await expectSuccessToast(driver, /coupon created|created|success/i);
  }
}

async function findCouponRow(driver, coupon) {
  return waitForVisible(driver, couponRow(coupon.code), 30000);
}

async function openEditCouponPage(driver, coupon) {
  console.log('Returning to coupons list for edit check...');
  await openPath(driver, '/coupons');
  await waitForVisible(driver, CouponsPage.couponsHeading, 30000);

  console.log('Opening edit coupon page...');
  const row = await findCouponRow(driver, coupon);
  const actionButtons = await row.findElements(By.css('button'));
  if (actionButtons.length < 2) {
    throw new Error('Edit coupon button was not found.');
  }
  await actionButtons[1].click();

  await waitForUrl(driver, /coupon/i, 30000);
  await waitForVisible(driver, CouponsPage.couponHeading, 30000);
  const codeInput = await waitForVisible(driver, By.xpath(`//input[@value='${coupon.code}']`), 15000);
  assert.equal(await codeInput.getAttribute('value'), coupon.code);
}

async function deactivateCoupon(driver, coupon) {
  console.log('Returning to coupons list...');
  await openPath(driver, '/coupons');
  await waitForVisible(driver, CouponsPage.couponsHeading, 30000);

  const row = await findCouponRow(driver, coupon);
  const actionButtons = await row.findElements(By.css('button'));
  if (actionButtons.length < 3) {
    throw new Error('Deactivate coupon button was not found.');
  }

  await trackNetworkResponse(driver, 'couponDeactivate', 'coupon');

  console.log('Deactivating coupon...');
  await actionButtons[2].click();
  await driver.wait(until.alertIsPresent(), 10000);
  const alert = await driver.switchTo().alert();
  console.log(`Accepting dialog: ${await alert.getText()}`);
  await alert.accept();

  const status = await waitForTrackedResponse(driver, 'couponDeactivate', 30000);
  assert.ok([200, 201].includes(status), `Expected coupon deactivate API status to be 200 or 201, received ${status}.`);

  const statusVisible = await isVisible(driver, CouponsPage.statusToast, 15000);
  if (statusVisible) {
    await expectSuccessToast(driver, /coupon deactivated|deactivated|success/i);
  }
}

describe('Coupons Module Flow', function () {
  this.timeout(120000);

  let driver;
  let profileDir;

  beforeEach(async () => {
    const created = await startAuthenticatedDriver();
    driver = created.driver;
    profileDir = created.profileDir;
  });

  afterEach(async () => {
    await destroyDriver(driver, profileDir);
    driver = undefined;
    profileDir = undefined;
  });

  it('Coupons Module Flow', async function () {
    try {
      await openCouponsModule(driver);
      await openNewCouponPage(driver);
      await fillCouponForm(driver, couponData.coupon);
      await createCoupon(driver, couponData.coupon);
      await openEditCouponPage(driver, couponData.coupon);
      await deactivateCoupon(driver, couponData.coupon);
    } catch (error) {
      console.error('Coupons module flow failed:', error.message);
      await captureFailure(driver, 'coupons-error');
      throw error;
    }
  });
});
