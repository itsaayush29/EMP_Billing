import { By } from 'selenium-webdriver';
import { inputByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const OnboardingPage = {
  continueButton: By.xpath(
    [
      "//button[",
      "  contains(@class,'bg-brand') or @type='submit'",
      "][",
      "  contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'continue')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'next')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'get started')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'finish')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'complete')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'done')",
      "]",
    ].join('')
  ),
  primaryButton: By.css('button.bg-brand-600, input[type="submit"].bg-brand-600'),
  firstFocusVisibleInput: By.css('.focus-visible'),

  // Temporary onboarding selectors mapped from the existing Selenium IDE flow.
  step1StartButton: By.css('.inline-flex'),
  step1FirstOption: By.css('.px-4:nth-child(1)'),
  step1ThirdOption: By.css('.gap-3:nth-child(3)'),
  step1SixthOption: By.css('.flex:nth-child(6)'),
  step1OrganizationLabelField: By.css('.px-3'),
  step1NameField: By.xpath(
    `${inputByLabel('organization').value} | ${inputByLabel('company').value} | ${inputByLabel('team').value}`
  ),
  step1NextButton: By.css('.px-5'),

  inviteEmailInputs: By.css(
    'input[type="email"], input[name*="email" i], input[placeholder*="email" i], input[placeholder*="mail" i]'
  ),
  inviteRoleSelects: By.css('select'),
  inviteStepHeading: By.xpath(
    textCaseXpath('invite', 'h1') +
      ' | ' +
      textCaseXpath('invite', 'h2') +
      ' | ' +
      textCaseXpath('team', 'h1') +
      ' | ' +
      textCaseXpath('team', 'h2')
  ),
  step2AddAnotherInviteButton: By.css('.hover\\3Atext-brand-700'),
  step2NextButton: By.css('.gap-2'),

  step3FirstCard: By.css('.flex:nth-child(1) > .flex-1 > .text-gray-500'),
  step3ThirdCard: By.css('.items-start:nth-child(3)'),
  step3FourthCard: By.css('.flex:nth-child(4) > .flex-1'),
  step3SecondCard: By.css('.flex:nth-child(2) > .flex-1 > .text-gray-500'),
  step3NextButton: By.css('.gap-2'),

  moduleStepHeading: By.xpath(
    textCaseXpath('module', 'h1') +
      ' | ' +
      textCaseXpath('module', 'h2') +
      ' | ' +
      textCaseXpath('product', 'h1') +
      ' | ' +
      textCaseXpath('product', 'h2')
  ),
  moduleTrialCards: By.xpath(
    "//div[.//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '14-day free trial')]]" +
      " | //button[.//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '14-day free trial')]]"
  ),
  moduleNextButton: By.xpath(
    "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'next')]" +
      " | //button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'continue')]"
  ),
  finishSetupButton: By.xpath(
    "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'finish setup')]" +
      " | //button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'finish')]"
  ),
  shiftNameField: By.xpath(
    `${inputByLabel('shift name').value} | //label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'shift name')]/following::input[1]`
  ),
  startTimeField: By.xpath(
    `${inputByLabel('start time').value} | //label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'start time')]/following::input[1]`
  ),
  endTimeField: By.xpath(
    `${inputByLabel('end time').value} | //label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'end time')]/following::input[1]`
  ),
  finishSetupContainer: By.xpath(
    "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'finish setup')]/ancestor::*[self::div or self::footer][1]"
  ),

  dashboardShell: By.css('aside, nav, [data-testid="sidebar"], [class*="sidebar"]'),
  dashboardHeading: By.xpath(
    textCaseXpath('welcome back', 'h1') +
      ' | ' +
      textCaseXpath('dashboard', 'h1') +
      ' | ' +
      textCaseXpath('dashboard', 'h2')
  ),
  completionHeading: By.xpath(
    textCaseXpath('congratulations', 'h1') +
      ' | ' +
      textCaseXpath('all set', 'h1') +
      ' | ' +
      textCaseXpath("you're all set", 'h1') +
      ' | ' +
      textCaseXpath('welcome', 'h1')
  ),
};
