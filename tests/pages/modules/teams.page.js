import { By } from 'selenium-webdriver';
import { inputByLabel, selectByLabel, textCaseXpath } from '../../framework/support/locators.js';

export const TeamsPage = {
  dashboardLink: By.xpath(textCaseXpath('dashboard', 'a')),
  teamLink: By.xpath(textCaseXpath('team', 'a')),
  teamHeading: By.xpath(textCaseXpath('team', 'h1')),
  inviteMemberButton: By.xpath(textCaseXpath('invite member', 'button')),
  inviteTeamMemberHeading: By.xpath(textCaseXpath('invite team member', 'h1')),
  sendInviteButton: By.xpath(textCaseXpath('send invite', 'button')),
  firstNameField: inputByLabel('first name', 'firstName'),
  lastNameField: inputByLabel('last name', 'lastName'),
  emailField: inputByLabel('email', 'email'),
  roleSelect: selectByLabel('role', 'role'),
  statusToast: By.css('[role="status"]'),
};

export function memberRow(email) {
  return By.xpath(
    `//tr[contains(., '${email}')] | //*[@role='row' and contains(., '${email}')] | //*[contains(@class, 'table-row') and contains(., '${email}')]`
  );
}
