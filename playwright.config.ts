import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run server',
      url: 'http://localhost:5001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
    {
      command: 'npx vite --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
  ],
});
url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
    timeout: 15000,
    },
  ],
});
