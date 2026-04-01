import { createDriver } from './browser.js';
import { loadAuthState } from './storage.js';

export async function startAuthenticatedDriver() {
  const created = await createDriver();
  await loadAuthState(created.driver);
  return created;
}
