# EMP Billing - Playwright Test Suite

Automated testing suite for the EMP Billing invoice management system using Playwright.

## 📁 Project Structure

```
tests/
├── invoice/                         # Invoice module tests
│   ├── Create_invoice_improved.spec.js          # Enhanced invoice flow
│   └── Create_invoice_multiple_items.spec.js    # Multiple line items flow
├── Vendor_module/                   # Vendor module tests
│   └── Create_vendor.spec.js                    # Vendor creation flow
├── test-data/                       # Shared test data and fixtures
│   ├── invoice-data.js                          # Invoice data set
│   ├── invoice-scenarios.js                     # Invoice scenario variants
│   └── vendor-data.js                           # Vendor module data set
└── health-check.spec.js             # Application health check
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
npm run install:browsers
```

### Environment Setup
1. Create or update your `.env` file:
```bash
BASE_URL=https://your-test-environment.com
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=your-password
TIMEOUT=60000
HEADLESS=true
```

> The vendor flow follows the invoice login pattern and reads the password from `ADMIN_PASSWORD`.

## 🧪 Running Tests

### All Tests
```bash
npm test
```

### Invoice Module Only
```bash
npm run test:invoice
```

### Vendor Module Only
```bash
npx playwright test tests/Vendor_module/
```

### Health Check (Verify App Accessibility)
```bash
npm run test:health
```

### Debug Mode (See Browser)
```bash
npm run test:headed
```

### Visual Test Runner
```bash
npm run test:ui
```

### View Test Reports
```bash
npm run report
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Application URL
BASE_URL=https://test-billing.empcloud.com

# Test Settings
TIMEOUT=60000
HEADLESS=true

# Credentials
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=Admin@123
```

### Playwright Config (playwright.config.js)
- **Timeout**: 60 seconds per test
- **Retries**: 1 in local, 2 in CI
- **Parallel**: 3 workers locally, 1 in CI
- **Browsers**: Chromium, Firefox, WebKit

## 🐛 Troubleshooting

### ❌ "Application not accessible" Error

**Symptoms:**
- Tests timeout with "page.goto: Test timeout exceeded"
- Network connectivity confirmed but app doesn't load

**Solutions:**

1. **Check Application Status:**
   ```bash
   npm run test:health
   ```

2. **Verify Environment URL:**
   - Check `.env` file has correct `BASE_URL`
   - Test URL manually in browser

3. **Network Issues:**
   ```powershell
   Test-NetConnection -ComputerName your-domain.com -Port 443
   ```

4. **Local Development:**
   ```env
   BASE_URL=http://localhost:3000
   ```

### ❌ "Element not found" Errors

**Solutions:**
- Increase timeouts in `playwright.config.js`
- Use `safeFill()` and `safeClick()` helpers
- Check if UI selectors have changed

### ❌ Import/Module Errors

**Solutions:**
- Verify file paths in imports
- Check if test data files exist
- Run: `node -e "require('./tests/test-data/invoice-scenarios.js')"`

### ❌ Browser Installation Issues

**Fix:**
```bash
npx playwright install --force
```

## 📊 Test Reports

### HTML Report
```bash
npm run report
# Opens interactive report in browser
```

### JSON Report (for CI)
```bash
npx playwright test --reporter=json
```

### Screenshots & Videos
- **Screenshots**: Captured for every test and embedded in the localhost HTML report.
- **Videos**: `test-results/` (on failure, if enabled)
- **Traces**: Available in HTML report

## 🏃 Advanced Usage

### Run Specific Test
```bash
npx playwright test tests/invoice/Create_invoice.spec.js
```

### Run with Custom Browser
```bash
npx playwright test --project=firefox
```

### Run Tests Matching Pattern
```bash
npx playwright test --grep "minimum"
```

### Debug Single Test
```bash
npx playwright test tests/invoice/Create_invoice.spec.js --debug
```

### Performance Testing
```bash
npx playwright test --workers=4 --reporter=line
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: playwright-report/
```

## 📈 Best Practices

### ✅ Implemented
- Modular test structure
- External test data
- Environment configuration
- Comprehensive error handling
- Parallel test execution
- Automatic screenshots for every test in the localhost HTML report
- Automatic failure videos where enabled

### 🚀 Recommendations
- Add Page Object Model for complex UIs
- Implement test tagging (@smoke, @regression)
- Add API testing alongside UI tests
- Set up test data cleanup
- Add performance monitoring

## 🆘 Support

### Common Issues & Solutions

1. **Slow Tests**: Increase timeouts, reduce parallel workers
2. **Flaky Tests**: Add retry logic, improve selectors
3. **Data Conflicts**: Use unique test data per run
4. **Environment Issues**: Use environment-specific configs

### Debug Tips
- Use `--headed` to see test execution
- Check `playwright-report/` for traces
- Enable `trace: 'on'` for detailed debugging
- Use `page.pause()` in debug mode

## 📋 Test Scenarios Covered

- ✅ Happy path invoice creation
- ✅ Minimum required fields
- ✅ Multiple line items
- ✅ Past due dates
- ✅ High value transactions
- ✅ Form validation
- ✅ API response verification
- ✅ Toast message validation

---

**Happy Testing! 🎭**