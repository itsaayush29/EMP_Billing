# EMP Billing Playwright Suite

Playwright end-to-end tests for the EMP Billing application.

## Project Structure

```text
tests/
  data/
    invoice-data.js
    invoice-scenarios.js
    registration-data.js
    registration-scenarios.js
    vendor-data.js
  specs/
    health/
      health-check.spec.js
    invoice/
      create-invoice.spec.js
      create-invoice-multiple-items.spec.js
    registration/
      create-account.spec.js
    vendor/
      create-vendor.spec.js
  utils/
    auth.js
    ui-helpers.js
reporters/
playwright.config.js
```

## Setup

1. Install dependencies:

```bash
npm install
npm run install:browsers
```

2. Configure `.env`:

```env
BASE_URL=https://test-billing.empcloud.com
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=your-password
TIMEOUT=60000
HEADLESS=true
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are required for the authenticated invoice and vendor flows. The registration suite does not use those credentials.

## Running Tests

```bash
npm test
npm run test:health
npm run test:invoice
npm run test:registration
npm run test:vendor
npm run test:headed
npm run report
```

## Test Coverage

- `health`: basic application availability check
- `invoice`: authenticated invoice creation flows, including a multi-line-item scenario
- `registration`: public registration page coverage with positive and validation scenarios
- `vendor`: authenticated vendor creation flow

## Notes

- `.env` values are loaded quietly to keep Playwright output readable.
- Test data reads credentials from environment variables instead of hardcoding them in specs.
- Registration test data generates unique emails and organization names per run to reduce collisions.
- Specs are grouped by feature under `tests/specs/`.
- Shared login and UI interaction helpers live under `tests/utils/`.
- Generated references and vendor emails are unique per run to reduce data collisions.

## Verification

- The suite layout and scripts are documented for `health`, `invoice`, `registration`, and `vendor`.
- Registration coverage is intentionally isolated from auth helpers so it can validate the public sign-up page directly.
- In this workspace, Playwright/Node verification may fail with a local `EPERM` path permission issue under `C:\Users\Aayush Gupta`.
