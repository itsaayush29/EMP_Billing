import { By } from 'selenium-webdriver';
import { textCaseXpath } from '../../framework/support/locators.js';

export const RegistrationPage = {
  registerOrganizationLink: By.linkText('Register your organization'),
  organizationNameField: By.name('org_name'),
  organizationCountryField: By.name('org_country'),
  organizationStateField: By.name('org_state'),
  firstNameField: By.name('first_name'),
  lastNameField: By.name('last_name'),
  workEmailField: By.name('email'),
  passwordField: By.name('password'),
  createAccountHeading: By.xpath(textCaseXpath('register', 'h1')),
  createFreeAccountButton: By.css('.bg-brand-600'),
  popupCloseButton: By.xpath(
    "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'close') or contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'never') or contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'no thanks')] | //a[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'close') or contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'never') or contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'no thanks')]"
  ),
};
