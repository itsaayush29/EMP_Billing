import { By } from 'selenium-webdriver';
import { textCaseXpath } from '../../framework/support/locators.js';

export const LoginPage = {
  emailField: By.css('input[type="email"], input[name="email"]'),
  passwordField: By.css('input[type="password"]'),
  signInButton: By.xpath(
    "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')] | //input[(@type='submit' or @type='button') and contains(translate(@value, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')]"
  ),
  signInHeading: By.xpath(textCaseXpath('sign in', 'h1')),
  createFreeLink: By.xpath(textCaseXpath('create one free', 'a')),
  statusToast: By.css('[role="status"]'),
};
