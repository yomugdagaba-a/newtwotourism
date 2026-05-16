import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 2,
  use: {
    baseURL: process.env.FRONTEND_URL || 'https://localhost:9000',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    // Bypass self-signed certificate warning page
    launchOptions: {
      args: ['--ignore-certificate-errors', '--ignore-ssl-errors'],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
