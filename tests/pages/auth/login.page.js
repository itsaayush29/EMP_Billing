import { By } from 'selenium-webdriver';
import { textCaseXpath } from '../../framework/support/locators.js';

export const LoginPage = {
  emailField: By.name('email'),
  passwordField: By.name('password'),
  signInButton: By.xpath(
    "//*[contains(@class, 'bg-brand-600') and (self::button or self::input or self::div)] | //button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')] | //input[(@type='submit' or @type='button') and contains(translate(@value, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')]"
  ),
  signInHeading: By.xpath(textCaseXpath('sign in', 'h1')),
  createFreeLink: By.xpath(textCaseXpath('create one free', 'a')),
  authenticatedMarker: By.linkText('Leave Management'),
  loginFormMarker: By.name('email'),
  statusToast: By.css('[role="status"]'),
};
