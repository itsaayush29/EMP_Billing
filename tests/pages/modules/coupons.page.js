import { By } from 'selenium-webdriver';
import { inputByLabel, selectByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const CouponsPage = {
  dashboardLink: By.xpath(textCaseXpath('dashboard', 'a')),
  couponsLink: By.xpath(textCaseXpath('coupons', 'a')),
  couponsHeading: By.xpath(textCaseXpath('coupons', 'h1')),
  newCouponButton: By.xpath(textCaseXpath('new coupon', 'button')),
  newCouponHeading: By.xpath(textCaseXpath('new coupon', 'h1')),
  createCouponButton: By.xpath(textCaseXpath('create coupon', 'button')),
  couponHeading: By.xpath(textCaseXpath('coupon', 'h1')),
  codeField: By.css('input[placeholder="SUMMER20"]'),
  nameField: inputByLabel('name', 'name'),
  typeSelect: selectByLabel('type', 'type'),
  percentageField: inputByLabel('percentage (%)', 'percentage'),
  appliesToSelect: selectByLabel('applies to', 'scope'),
  maxRedemptionsField: inputByLabel('max redemptions', 'maxRedemptions'),
  maxRedemptionsPerClientField: By.css('input[name="maxRedemptionsPerClient"]'),
  minimumAmountField: inputByLabel('minimum amount', 'minimumAmount'),
  validFromField: inputByLabel('valid from', 'validFrom'),
  validUntilField: inputByLabel('valid until', 'validUntil'),
  statusToast: By.css('[role="status"]'),
};

export function couponRow(code) {
  return By.xpath(
    `//tr[contains(., '${code}')] | //*[@role='row' and contains(., '${code}')] | //*[contains(@class, 'table-row') and contains(., '${code}')]`
  );
}
