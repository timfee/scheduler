# E2E Testing

This directory contains end-to-end tests using Playwright to test the application in a real browser environment.

## Setup

The E2E tests are configured to run against a local development server. Make sure you have the development server running:

```bash
npm run dev
```

## Running Tests

### All E2E Tests
```bash
npm run test:e2e
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Specific Test File
```bash
npx playwright test e2e/connections.spec.ts
```

### With UI (Headed Mode)
```bash
npx playwright test --headed
```

## Test Structure

### connections.spec.ts
Tests the connections page to ensure:
- The page loads without import errors
- All server actions are properly exported
- The connection form functions correctly
- No JavaScript errors occur when interacting with the form

### smoke.spec.ts
Basic smoke tests to verify:
- The application loads without critical errors
- No missing exports or module resolution issues
- Core functionality works as expected

## Browser Installation

If you get errors about missing browsers, install them:

```bash
npx playwright install
```

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:
- Tests run against `http://localhost:3000`
- Uses existing dev server if available
- Supports multiple browsers (Chrome, Firefox, Safari)
- Generates HTML reports for test results

## Purpose

These tests were added to catch import/export issues that only manifest in a browser environment, such as:
- Missing server action exports
- Build-time errors that prevent proper module loading
- Client-side JavaScript errors that break functionality

The tests specifically validate the fix for the issue where `updateConnectionAction` was not being found as an export from the connections actions module.