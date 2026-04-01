import { env } from '../config/env.js';

function isTransientScriptError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('target frame detached') ||
    message.includes('inspector.detached') ||
    message.includes('received inspector.detached event') ||
    message.includes('stale element reference') ||
    message.includes('no such window')
  );
}

async function runTrackerScript(driver, script, ...args) {
  try {
    return await driver.executeScript(script, ...args);
  } catch (error) {
    if (isTransientScriptError(error)) {
      return null;
    }

    throw error;
  }
}

export async function trackNetworkResponse(driver, key, matcherSource, matcherFlags = 'i') {
  await runTrackerScript(
    driver,
    `
      const storageKey = '__empNetworkState';
      const trackerStorageKey = '__empNetworkTrackers';
      const readJson = (key, fallback) => {
        try {
          const value = window.sessionStorage.getItem(key);
          return value ? JSON.parse(value) : fallback;
        } catch {
          return fallback;
        }
      };
      const writeJson = (key, value) => {
        try {
          window.sessionStorage.setItem(key, JSON.stringify(value));
        } catch {}
      };
      const ensureState = () => {
        window.__empNetwork = window.__empNetwork || readJson(storageKey, {});
        window.__empNetworkTrackers = window.__empNetworkTrackers || readJson(trackerStorageKey, []);
      };
      const persistState = () => {
        writeJson(storageKey, window.__empNetwork);
        writeJson(trackerStorageKey, window.__empNetworkTrackers);
      };
      const recordMatch = (url, status) => {
        if (!url) {
          return;
        }

        ensureState();

        for (const tracker of window.__empNetworkTrackers) {
          const matcher = new RegExp(tracker.source, tracker.flags);
          if (matcher.test(String(url))) {
            window.__empNetwork[tracker.key] = window.__empNetwork[tracker.key] || { lastStatus: null, count: 0, statuses: [] };
            window.__empNetwork[tracker.key].lastStatus = status;
            window.__empNetwork[tracker.key].count += 1;
            window.__empNetwork[tracker.key].statuses.push(status);
          }
        }

        persistState();
      };

      ensureState();
      window.__empNetwork[arguments[0]] = { lastStatus: null, count: 0, statuses: [] };
      window.__empNetworkTrackers = window.__empNetworkTrackers.filter((tracker) => tracker.key !== arguments[0]);
      window.__empNetworkTrackers.push({ key: arguments[0], source: arguments[1], flags: arguments[2] });
      persistState();

      if (!window.__empNetworkFetchPatched) {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          try {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            recordMatch(url, response.status);
          } catch {}
          return response;
        };
        window.__empNetworkFetchPatched = true;
      }

      if (!window.__empNetworkXhrPatched) {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
          this.__empMethod = method;
          this.__empUrl = url;
          return originalOpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function(...args) {
          this.addEventListener('loadend', function() {
            try {
              recordMatch(this.__empUrl, this.status);
            } catch {}
          });

          return originalSend.apply(this, args);
        };

        window.__empNetworkXhrPatched = true;
      }
    `,
    key,
    matcherSource,
    matcherFlags
  );
}

export async function waitForTrackedResponse(driver, key, timeout = env.timeout) {
  await driver.wait(async () => {
    const result = await runTrackerScript(
      driver,
      `
        const memoryValue = window.__empNetwork?.[arguments[0]]?.lastStatus;
        if (memoryValue !== undefined && memoryValue !== null) {
          return memoryValue;
        }

        try {
          const stored = JSON.parse(window.sessionStorage.getItem('__empNetworkState') || '{}');
          return stored?.[arguments[0]]?.lastStatus ?? null;
        } catch {
          return null;
        }
      `,
      key
    );
    return result !== null && result !== undefined;
  }, timeout);

  return runTrackerScript(
    driver,
    `
      const memoryValue = window.__empNetwork?.[arguments[0]]?.lastStatus;
      if (memoryValue !== undefined && memoryValue !== null) {
        return memoryValue;
      }

      try {
        const stored = JSON.parse(window.sessionStorage.getItem('__empNetworkState') || '{}');
        return stored?.[arguments[0]]?.lastStatus ?? null;
      } catch {
        return null;
      }
    `,
    key
  );
}

export async function getTrackedResponseCount(driver, key) {
  const result = await runTrackerScript(
    driver,
    `
      const memoryValue = window.__empNetwork?.[arguments[0]]?.count;
      if (memoryValue !== undefined && memoryValue !== null) {
        return memoryValue;
      }

      try {
        const stored = JSON.parse(window.sessionStorage.getItem('__empNetworkState') || '{}');
        return stored?.[arguments[0]]?.count ?? 0;
      } catch {
        return 0;
      }
    `,
    key
  );

  return result ?? 0;
}
