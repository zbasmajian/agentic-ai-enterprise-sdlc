import { test as base } from '@playwright/test';
import { addCoverageReport } from 'monocart-reporter';
import { FlagBoardPage } from './pages/flag-board-page';

/** Collect V8 code coverage only when COVERAGE=1 (the coverage build/run). */
const COLLECT_COVERAGE = process.env.COVERAGE === '1';

type Fixtures = {
  /** Flag board already opened at / in a fresh state. */
  flagBoard: FlagBoardPage;
  /** Auto fixture: wraps every test in V8 JS coverage when COVERAGE=1. */
  autoCoverage: void;
};

export const test = base.extend<Fixtures>({
  autoCoverage: [async ({ page, browserName }, use) => {
    const enabled = COLLECT_COVERAGE && browserName === 'chromium';
    if (enabled) {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
    }
    await use();
    if (enabled) {
      const coverage = await page.coverage.stopJSCoverage();
      await addCoverageReport(coverage, test.info());
    }
  }, { auto: true }],

  flagBoard: async ({ page, autoCoverage }, use) => {
    void autoCoverage;
    const flagBoard = new FlagBoardPage(page);
    await flagBoard.goto();
    await use(flagBoard);
  },
});

export { expect } from '@playwright/test';
export { SEEDED_FLAG } from './pages/flag-board-page';
