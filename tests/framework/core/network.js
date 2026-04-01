import { env } from '../config/env.js';

export async function trackNetworkResponse(driver, key, matcherSource, matcherFlags = 'i') {
  await driver.executeScript(
    `
      window.__empNetwork = window.__empNetwork || {};
      window.__empNetworkTrackers = window.__empNetworkTrackers || [];
      window.__empNetwork[arguments[0]] = null;
      window.__empNetworkTrackers = window.__empNetworkTrackers.filter((tracker) => tracker.key !== arguments[0]);
      window.__empNetworkTrackers.push({ key: arguments[0], source: arguments[1], flags: arguments[2] });

      if (!window.__empNetworkFetchPatched) {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          try {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            for (const tracker of window.__empNetworkTrackers) {
              const matcher = new RegExp(tracker.source, tracker.flags);
              if (url && matcher.test(url)) {
                window.__empNetwork[tracker.key] = response.status;
              }
            }
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
              for (const tracker of window.__empNetworkTrackers) {
                const matcher = new RegExp(tracker.source, tracker.flags);
                if (this.__empUrl && matcher.test(String(this.__empUrl))) {
                  window.__empNetwork[tracker.key] = this.status;
                }
              }
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
    const status = await driver.executeScript('return window.__empNetwork?.[arguments[0]];', key);
    return status !== null && status !== undefined;
  }, timeout);

  return driver.executeScript('return window.__empNetwork?.[arguments[0]];', key);
}
