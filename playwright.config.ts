import { defineConfig, devices } from '@playwright/test';
// added by jason, reference to baseUrl file that stores different URL types e.g. local/prod
import baseEnvUrl from './tests/utils/environmentBaseUrl';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* ADDED BY JASON
  add globalSetup, this runs before any tests - gets a "logged-in" state details and stores it in a .json for reuse
  allows skipping of click-through sign-in*/
  globalSetup: require.resolve('./tests/setup/global-setup'),

  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /*ADDED BY JASON 
    ADD STORAGESTATE FOR STORING SIGNED-IN STATE
    CONFIGURE BASEURL TO USE ENV TO EASILY SWITCH BETWEEN WHICH URL TO USE E.G. LOCALHOST OR LIVE SERVER
    */
    storageState: 'storageState.json',
    
    baseURL: process.env.ENV === 'production' 
      ? baseEnvUrl.production.home
      : process.env.ENV === 'staging' 
        ? baseEnvUrl.staging.home
        : baseEnvUrl.local.home,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'],
             storageState: 'storageState.json',
            },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'],
            storageState: 'storageState.json',
       },
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'],
    //          storageState: 'storageState.json'
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
