import { expect, test } from '@playwright/test';
import { teamData } from '../../data/team-data.js';
import { expectApiSuccess, expectSuccessToast, safeClick, safeFill } from '../../utils/ui-helpers.js';

async function openTeamModule(page) {
  console.log('Opening dashboard with shared authenticated session...');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();

  console.log('Opening team module...');
  await safeClick(page.getByRole('link', { name: /team/i }), 'team link');
  await expect(page.getByRole('heading', { name: /team/i })).toBeVisible();
}

async function inviteTeamMember(page, member) {
  console.log('Opening invite team member form...');
  await safeClick(page.getByRole('button', { name: /invite member/i }), 'invite member button');
  await expect(page.getByRole('heading', { name: /invite team member/i })).toBeVisible();

  console.log('Filling team member form...');
  await safeFill(page.getByRole('textbox', { name: /first name\*/i }), member.firstName, 'first name');
  await safeFill(page.getByRole('textbox', { name: /last name\*/i }), member.lastName, 'last name');
  await safeFill(page.getByRole('textbox', { name: /^email\*$/i }), member.email, 'team member email');
  await page.getByLabel(/role\*/i).selectOption({ label: member.role }).catch(async () => {
    await page.getByLabel(/role\*/i).selectOption(member.role);
  });

  console.log('Submitting invite...');
  const inviteResponsePromise = page.waitForResponse(
    (response) => {
      const request = response.request();
      return request.method() === 'POST' && /team|member|invite/i.test(response.url());
    },
    { timeout: 30000 }
  ).catch(() => null);

  await safeClick(page.getByRole('button', { name: /send invite/i }), 'send invite button');

  const duplicateEmailError = page.getByText(/already exists|already invited|email.*exists/i).first();
  const duplicateVisible = await duplicateEmailError.isVisible({ timeout: 5000 }).catch(() => false);
  if (duplicateVisible) {
    throw new Error(`Team member email is not unique: ${member.email}`);
  }

  await expectApiSuccess(inviteResponsePromise, 'Team invite');

  const statusVisible = await page.locator('[role="status"]').isVisible({ timeout: 15000 }).catch(() => false);
  if (statusVisible) {
    await expectSuccessToast(page, /member invited|invite sent|success/i);
  }
}

async function removeTeamMember(page, member) {
  console.log('Locating invited team member row...');
  const memberRow = page
    .locator('tr, [role="row"], .table-row')
    .filter({ hasText: member.email })
    .first();

  await expect(memberRow).toBeVisible({ timeout: 30000 });

  page.once('dialog', async (dialog) => {
    console.log(`Accepting dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  const removeResponsePromise = page.waitForResponse(
    (response) => {
      const request = response.request();
      return /team|member/i.test(response.url()) && ['DELETE', 'PATCH', 'PUT'].includes(request.method());
    },
    { timeout: 30000 }
  ).catch(() => null);

  console.log('Removing invited team member...');
  await safeClick(memberRow.getByRole('button', { name: /remove/i }).first(), 'remove member button');

  await expectApiSuccess(removeResponsePromise, 'Team remove');

  const statusVisible = await page.locator('[role="status"]').isVisible({ timeout: 15000 }).catch(() => false);
  if (statusVisible) {
    await expectSuccessToast(page, /member removed|removed|success/i);
  }

  await expect(memberRow).not.toBeVisible({ timeout: 30000 });
}

test('Teams Module Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    await openTeamModule(page);
    await inviteTeamMember(page, teamData.member);
    await removeTeamMember(page, teamData.member);
  } catch (error) {
    console.error('Teams module flow failed:', error.message);
    await page.screenshot({ path: `test-results/teams-error-${Date.now()}.png` }).catch(() => {});
    throw error;
  }
});
