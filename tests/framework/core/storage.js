import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export async function saveAuthState(driver, filePath = env.authFile) {
  const cookies = await driver.manage().getCookies();
  const origin = new URL(env.baseUrl).origin;
  const localStorage = await driver.executeScript(`
    return Object.entries(window.localStorage).map(([name, value]) => ({ name, value }));
  `);
  const sessionStorage = await driver.executeScript(`
    return Object.entries(window.sessionStorage).map(([name, value]) => ({ name, value }));
  `);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        cookies,
        origins: [
          {
            origin,
            localStorage,
            sessionStorage,
          },
        ],
      },
      null,
      2
    )
  );
}

export async function loadAuthState(driver, filePath = env.authFile) {
  let rawState;

  try {
    rawState = await fs.readFile(filePath, 'utf8');
  } catch {
    return false;
  }

  const state = JSON.parse(rawState);
  const origin = state.origins?.[0]?.origin || new URL(env.baseUrl).origin;
  await driver.get(origin);

  if (Array.isArray(state.cookies)) {
    for (const cookie of state.cookies) {
      const normalizedCookie = { ...cookie };
      delete normalizedCookie.sameSite;
      delete normalizedCookie.expiry;
      if (cookie.expiry) {
        normalizedCookie.expiry = Number(cookie.expiry);
      }
      await driver.manage().addCookie(normalizedCookie).catch(() => {});
    }
  }

  const localStorageEntries = state.origins?.[0]?.localStorage ?? [];
  const sessionStorageEntries = state.origins?.[0]?.sessionStorage ?? [];

  await driver.executeScript(
    `
      const localEntries = arguments[0];
      const sessionEntries = arguments[1];
      window.localStorage.clear();
      window.sessionStorage.clear();

      for (const entry of localEntries) {
        window.localStorage.setItem(entry.name, entry.value);
      }

      for (const entry of sessionEntries) {
        window.sessionStorage.setItem(entry.name, entry.value);
      }
    `,
    localStorageEntries,
    sessionStorageEntries
  );

  return true;
}
