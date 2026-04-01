import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { By, until } from 'selenium-webdriver';
import { teamData } from '../../data/team-data.js';
import { expectSuccessToast } from '../../framework/support/assertions.js';
import { safeClick, safeFill, selectOption } from '../../framework/support/interactions.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { isVisible, waitForNotVisible, waitForVisible } from '../../framework/support/waits.js';
import { destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { startAuthenticatedDriver } from '../../framework/core/session.js';
import { TeamsPage, memberRow } from '../../pages/modules/teams.page.js';

async function openTeamModule(driver) {
  console.log('Opening dashboard with shared authenticated session...');
  await openPath(driver, '/dashboard');
  await waitForVisible(driver, TeamsPage.dashboardLink, 30000);

  console.log('Opening team module...');
  await safeClick(driver, TeamsPage.teamLink, 'team link');
  await waitForVisible(driver, TeamsPage.teamHeading, 30000);
}

async function inviteTeamMember(driver, member) {
  console.log('Opening invite team member form...');
  await safeClick(driver, TeamsPage.inviteMemberButton, 'invite member button');
  await waitForVisible(driver, TeamsPage.inviteTeamMemberHeading, 30000);

  console.log('Filling team member form...');
  await safeFill(driver, TeamsPage.firstNameField, member.firstName, 'first name');
  await safeFill(driver, TeamsPage.lastNameField, member.lastName, 'last name');
  await safeFill(driver, TeamsPage.emailField, member.email, 'team member email');
  await selectOption(driver, TeamsPage.roleSelect, member.role);

  console.log('Submitting invite...');
  await trackNetworkResponse(driver, 'teamInvite', 'team|member|invite');
  await safeClick(driver, TeamsPage.sendInviteButton, 'send invite button');

  const duplicateVisible =
    (await isVisible(driver, By.xpath("//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'already exists')]"), 5000)) ||
    (await isVisible(driver, By.xpath("//*[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'already invited')]"), 5000));
  if (duplicateVisible) {
    throw new Error(`Team member email is not unique: ${member.email}`);
  }

  const status = await waitForTrackedResponse(driver, 'teamInvite', 30000);
  assert.ok([200, 201].includes(status), `Expected team invite API status to be 200 or 201, received ${status}.`);

  const statusVisible = await isVisible(driver, TeamsPage.statusToast, 15000);
  if (statusVisible) {
    await expectSuccessToast(driver, /member invited|invite sent|success/i);
  }
}

async function removeTeamMember(driver, member) {
  console.log('Locating invited team member row...');
  const row = await waitForVisible(driver, memberRow(member.email), 30000);

  const removeButton = await row.findElement(By.xpath(`.//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'remove')]`));
  await trackNetworkResponse(driver, 'teamRemove', 'team|member');

  console.log('Removing invited team member...');
  await removeButton.click();
  await driver.wait(until.alertIsPresent(), 10000);
  const alert = await driver.switchTo().alert();
  console.log(`Accepting dialog: ${await alert.getText()}`);
  await alert.accept();

  const status = await waitForTrackedResponse(driver, 'teamRemove', 30000);
  assert.ok([200, 201].includes(status), `Expected team remove API status to be 200 or 201, received ${status}.`);

  const statusVisible = await isVisible(driver, TeamsPage.statusToast, 15000);
  if (statusVisible) {
    await expectSuccessToast(driver, /member removed|removed|success/i);
  }

  await waitForNotVisible(driver, memberRow(member.email), 30000);
}

describe('Teams Module Flow', function () {
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

  it('Teams Module Flow', async function () {
    try {
      await openTeamModule(driver);
      await inviteTeamMember(driver, teamData.member);
      await removeTeamMember(driver, teamData.member);
    } catch (error) {
      console.error('Teams module flow failed:', error.message);
      await captureFailure(driver, 'teams-error');
      throw error;
    }
  });
});
