# EMP Billing Selenium Suite

Selenium WebDriver end-to-end tests for the EMP Billing application.

## Project Structure

```text
tests/
  data/
    client-data.js
    coupon-data.js
    invoice-data.js
    payment-data.js
    quote-data.js
    registration-data.js
    registration-scenarios.js
    team-data.js
    vendor-data.js
  framework/
    auth/
      login.js
    config/
      env.js
    core/
      browser.js
      navigation.js
      network.js
      session.js
      storage.js
    support/
      artifacts.js
      assertions.js
      interactions.js
      locators.js
      waits.js
  pages/
    auth/
      login.page.js
      registration.page.js
    modules/
      client.page.js
      coupons.page.js
      invoice.page.js
      payments.page.js
      quotes.page.js
      teams.page.js
      vendor.page.js
  specs/
    auth/
      auth.setup.js
    client/
      client.spec.js
    coupons/
      create-coupon.spec.js
    health/
      health-check.spec.js
    invoice/
      create-invoice.spec.js
    payments/
      create-payment.spec.js
    quotes/
      create-quote.spec.js
    registration/
      create-account.spec.js
    teams/
      create-team-member.spec.js
    vendor/
      create-vendor.spec.js
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

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are required for the authenticated flows.
The shared auth setup saves a Selenium session snapshot under `selenium/.auth/` so protected flows can reuse the session data.

4. Make sure Google Chrome is installed on the machine.

Selenium uses the `selenium-webdriver` package. This repo launches Chrome for the full suite.

## Running Tests

Current runnable Selenium commands:

```bash
npm test
npm run test:auth-setup
npm run test:client
npm run test:coupons
npm run test:health
npm run test:invoice
npm run test:payments
npm run test:quotes
npm run test:registration
npm run test:teams
npm run test:vendor
npm run test:headed
npm run test:headless
```

What each command does:

- `npm test`: runs the shared Selenium auth setup and then runs all Selenium specs
- `npm run test:auth-setup`: runs the shared Selenium auth setup explicitly
- `npm run test:client`: runs the client flow
- `npm run test:coupons`: runs the coupons flow
- `npm run test:health`: runs the health check
- `npm run test:invoice`: runs the invoice flow
- `npm run test:payments`: runs the payments flow
- `npm run test:quotes`: runs the quote flow
- `npm run test:registration`: runs the Selenium registration flow
- `npm run test:teams`: runs the team flow
- `npm run test:vendor`: runs the vendor flow
- `npm run test:headed`: runs the full Selenium suite with the browser visible
- `npm run test:headless`: runs the full Selenium suite in headless mode

Typical local workflow:

```bash
npm install
npm run test:auth-setup
npm run test:registration
```

If you want to run without opening the browser:

```bash
npm run test:headless
```

If Chrome fails to launch from a restricted terminal on Windows, run the same command from a normal local PowerShell or Command Prompt window.

## Test Coverage

- `client`: authenticated client creation flow
- `coupons`: authenticated coupon creation, edit, and deactivate flow
- `health`: basic application availability check
- `invoice`: authenticated simple invoice creation flow
- `payments`: authenticated payment recording flow
- `quotes`: authenticated simple quote creation flow
- `registration`: public registration page coverage with positive and validation scenarios
- `teams`: authenticated team invite and remove flow
- `vendor`: authenticated vendor creation flow

## Notes

- `.env` values are loaded quietly to keep test output readable.
- The repo is wired to run with Selenium WebDriver and Mocha.
- Test data reads credentials from environment variables instead of hardcoding them in specs.
- Registration test data generates unique emails and organization names per run to reduce collisions.
- Specs are grouped by feature under `tests/specs/`.
- Shared browser, session, network, and interaction code lives under `tests/framework/`.
- Page objects live under `tests/pages/`.
- Generated references and vendor emails are unique per run to reduce data collisions.
- Authenticated modules run through `tests/specs/auth/auth.setup.js` first so a single saved session can be reused across protected flows.
- Feature specs are organized by module under `tests/specs/`.

## Verification

- The install and run steps above match the current package scripts.
- In this workspace, Chrome launch verification may still fail under terminal sandbox restrictions on Windows even when the same code works in a normal local shell.
