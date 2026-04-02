# EMP Billing Selenium Suite

Selenium WebDriver end-to-end tests for the EMP Billing application.

## Project Structure

```text
tests/
  data/
    auth-data.js
    onboarding-data.js
    registration-data.js
  framework/
    auth/
      login.js
    config/
      env.js
    core/
      browser.js
      navigation.js
      network.js
      storage.js
    support/
      artifacts.js
      interactions.js
      locators.js
      waits.js
  pages/
    auth/
      login.page.js
      registration.page.js
    onboarding/
      onboarding.page.js
  specs/
    auth/
      auth.setup.js
      login.spec.js
    registration/
      create-account.spec.js
```

## Setup

1. Use Node.js `20+`.

2. Install dependencies:

```bash
npm install
```

3. Configure `.env`:

```env
BASE_URL=https://test-billing.empcloud.com
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=your-password
TIMEOUT=60000
HEADLESS=true
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are required for the authentication flow.
The shared auth setup saves a Selenium session snapshot under `selenium/.auth/` so one-time authentication can be reused where needed.

4. Make sure Google Chrome is installed on the machine.

Selenium uses the `selenium-webdriver` package. This repo launches Chrome for authentication and registration flows.

## Running Tests

Current runnable Selenium commands:

```bash
npm test
npm run test:login
npm run test:auth-setup
npm run test:registration
npm run test:headed
npm run test:headless
```

What each command does:

- `npm test`: runs the login suite, shared authentication setup, and then the registration suite
- `npm run test:login`: runs the Selenium login scenarios
- `npm run test:auth-setup`: runs the shared authentication and session setup explicitly
- `npm run test:registration`: runs the public registration flow and the onboarding/setup flow that follows account creation
- `npm run test:headed`: runs the authentication and registration flows with the browser visible
- `npm run test:headless`: runs the authentication and registration flows in headless mode

Typical local workflow:

```bash
npm install
npm run test:login
npm run test:auth-setup
npm run test:registration
```

If you want to run without opening the browser:

```bash
npm run test:headless
```

If Chrome fails to launch from a restricted terminal on Windows, run the same command from a normal local PowerShell or Command Prompt window.

## Test Coverage

- `authentication`: login, one-time authentication, and saved session handling
  Login coverage includes valid login, invalid login, invalid email format validation, password masking, and multi-click protection.
- `registration`: public registration flow from account creation through onboarding completion

## Notes

- `.env` values are loaded quietly to keep test output readable.
- The repo is wired to run with Selenium WebDriver and Mocha.
- Authentication credentials are read from environment variables instead of hardcoding them in specs.
- Registration test data generates unique emails and organization names per run to reduce collisions.
- Onboarding test data generates unique invite emails per run to reduce collisions.
- Authentication and registration specs are grouped under `tests/specs/`.
- Shared browser, session, network, and interaction code lives under `tests/framework/`.
- Auth and onboarding page objects live under `tests/pages/`.
- Authentication runs through `tests/specs/auth/auth.setup.js` first so the saved session handling remains intact.
- The registration spec currently covers the post-registration onboarding wizard, including module selection and final setup submission.

## Verification

- The install and run steps above match the current package scripts.
- `npm run test:registration` was verified successfully in a normal Windows PowerShell session.
- In this workspace, Chrome launch may fail under restricted/sandboxed terminals on Windows with `DevToolsActivePort file doesn't exist` or `Access is denied`, even when the same command works outside the sandbox.
