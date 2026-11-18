import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
const externalURL = process.env.BASE_URL;

/**
 * Code coverage (Lab 11). Set COVERAGE=1 to collect V8 JS coverage during the
 * run and write an HTML + lcov report under ./coverage. The autoCoverage fixture
 * in tests/fixtures.ts feeds monocart; monocart maps the browser bundle back to
 * src/ via the source maps that next.config.ts emits under COVERAGE=1.
 */
const collectCoverage = process.env.COVERAGE === '1';

// CI gate: minimum coverage of our src/ code. Tune in LEARNING.md as code grows.
const COVERAGE_THRESHOLDS = { lines: 80, functions: 80, branches: 70 };

const reporters: ReporterDescription[] = [['html', { open: 'never' }]];
if (collectCoverage) {
  reporters.push(['monocart-reporter', {
    name: 'taskboard – Coverage',
    // Keep the monocart test report off coverage/index.html, which the v8 coverage
    // report owns (both default to outputDir/index.html otherwise and collide).
    outputFile: './coverage/test-report.html',
    coverage: {
      // Keep only the app's own browser bundles, then only src/ sources, so the
      // numbers describe our code and not Next.js runtime or node_modules.
      entryFilter: (entry: { url: string }) => entry.url.includes('/_next/'),
      // Source-map paths look like turbopack:///[project]/src/app/page.tsx
      // (or webpack://_N_E/./src/... on webpack). Keep our src/, drop deps.
      sourceFilter: (path: string) => /\/src\//.test(path) && !path.includes('node_modules'),
      // json-summary writes coverage/coverage-summary.json, which the gate in
      // the central ci/check-coverage.mjs gate reads. (monocart's own `thresholds` below only
      // colors the HTML report; it does not fail the run, so the script enforces.)
      // inline:true bundles the viewer into the HTML so the uploaded CI artifact
      // is self-contained (no separate ./assets/ dir to commit or lose).
      reports: [['v8', { inline: true }], ['console-summary'], ['lcovonly'], ['json-summary']],
      outputDir: './coverage',
      thresholds: COVERAGE_THRESHOLDS,
    },
  }]);
}

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  /* GitHub's Linux runners have 4 CPUs, so run 4 test files at once on CI. */
  workers: process.env.CI ? 4 : undefined,
  /* On CI, stop after 5 failures: that many usually share one cause (e.g. a renamed button), and the healer takes over. */
  maxFailures: process.env.CI ? 5 : 0,
  /* Fail fast: a whole test gets 15 s, a missing element or unmet expect fails after 5 s (defaults are 30 s). */
  timeout: 15_000,
  expect: { timeout: 5_000 },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: reporters,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: externalURL ?? 'http://localhost:3000',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

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
  webServer: externalURL ? undefined : {
     command: 'npm run build && npm run start',
     url: 'http://localhost:3000/healthz',
     reuseExistingServer: !process.env.CI,
     // The coverage build (COVERAGE=1) also emits browser source maps, so give
     // build + start extra headroom over Playwright's 60s default.
     timeout: 120_000,
  }
});
