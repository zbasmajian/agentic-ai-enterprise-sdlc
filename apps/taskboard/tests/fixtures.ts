import { test as base } from '@playwright/test';
import { addCoverageReport } from 'monocart-reporter';
import { TaskBoardPage } from './pages/task-board-page';

/** Collect V8 code coverage only when COVERAGE=1 (the coverage build/run). */
const COLLECT_COVERAGE = process.env.COVERAGE === '1';

type Fixtures = {
  /** Task board already opened at / in a fresh state. */
  taskBoard: TaskBoardPage;
  /** Auto fixture: wraps every test in V8 JS coverage when COVERAGE=1. */
  autoCoverage: void;
};

export const test = base.extend<Fixtures>({
  // Runs automatically around every test. When coverage is off, it does nothing,
  // so local and CI e2e runs are unaffected. When COVERAGE=1, it records which
  // lines of the browser bundle each test executed and hands them to monocart,
  // which maps them back to src/ through the source maps and merges every test.
  autoCoverage: [async ({ page, browserName }, use) => {
    const enabled = COLLECT_COVERAGE && browserName === 'chromium';
    if (enabled) {
      // resetOnNavigation:false keeps counts across the page.goto in taskBoard.
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
    }
    await use();
    if (enabled) {
      const coverage = await page.coverage.stopJSCoverage();
      await addCoverageReport(coverage, test.info());
    }
  }, { auto: true }],

  taskBoard: async ({ page, autoCoverage }, use) => {
    // autoCoverage is listed only to force it to set up first (start coverage
    // before the goto below); it has no value of its own.
    void autoCoverage;
    const taskBoard = new TaskBoardPage(page);
    await taskBoard.goto();
    await use(taskBoard);
  },
});

export { expect } from '@playwright/test';
export { SEEDED_TASK } from './pages/task-board-page';
