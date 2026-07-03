/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Global Playwright configuration for the project.
 *
 * This file centralises:
 * - the test directory,
 * - shared execution options,
 * - the base URL of the site under test,
 * - and the browser projects to run against.
 */
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Root directory from which Playwright discovers tests.
  testDir: './tests',
  /* Run tests in parallel when possible. */
  fullyParallel: true,
  /* Fail in CI if test.only is accidentally left in code. */
  forbidOnly: !!process.env.CI,
  /* Retry only in CI to reduce transient failures. */
  retries: process.env.CI ? 2 : 0,
  /* Limit parallelism in CI for more stable runs. */
  workers: process.env.CI ? 1 : undefined,
  /* Generate the HTML report after the test run. */
  reporter: 'html',
  /* Settings shared across all browser projects defined below. */
  use: {
    // Base URL to allow relative navigations like '/cursos'.
    baseURL: 'https://www.freerangetesters.com/',

    /* Save trace on the first retry of a failed test to aid debugging. */
    trace: 'on-first-retry',
  },

  /* Browser execution projects. */
  projects: [
    {
      name: 'chromium',
      testMatch: /.*tests\/ui\/.*/,
      use: {
        // Force Chromium maximized to work with a real viewport.
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        screenshot: 'only-on-failure',
      },
    },

    {
      name: 'firefox',
      testMatch: /.*tests\/ui\/.*/,
      // Playwright preset desktop configuration for Firefox.
      use: { ...devices['Desktop Firefox'], screenshot: 'only-on-failure' },
    },

    {
      name: 'webkit',
      testMatch: /.*tests\/ui\/.*/,
      // Playwright preset desktop configuration for WebKit/Safari.
      use: { ...devices['Desktop Safari'], screenshot: 'only-on-failure' },
    },
    {
      name: 'API TEST',
      testMatch: /.*tests\/api\/.*/,
      use: {
        // Base URL for the GitHub REST API.
        baseURL: 'https://api.github.com/',

        extraHTTPHeaders: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${(process.env.API_TOKEN)}`,
        },
      },
    }
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});