import { defineConfig, devices } from '@playwright/test';
import { DEV_SERVER, TEST_CONSTANTS } from "@/lib/constants";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: DEV_SERVER.URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment these to test on additional browsers
    // (requires: npx playwright install firefox webkit)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: `ENCRYPTION_KEY="${TEST_CONSTANTS.ENCRYPTION_KEY}" WEBHOOK_SECRET="${TEST_CONSTANTS.WEBHOOK_SECRET}" SQLITE_PATH="${TEST_CONSTANTS.SQLITE_PATH}" npm run dev`,
    port: DEV_SERVER.PORT,
    reuseExistingServer: true,
  },
});