import { env } from '../config/env.js';

export async function openPath(driver, appPath) {
  await driver.get(new URL(appPath, env.baseUrl).href);
}

export async function waitForUrl(driver, pattern, timeout = env.timeout) {
  await driver.wait(async () => pattern.test(await driver.getCurrentUrl()), timeout);
}
