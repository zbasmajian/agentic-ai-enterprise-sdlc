// Centralized coverage gate for the whole org.
//
// Reads a monocart coverage-summary.json and exits non-zero when any metric is
// below its threshold. Lives here (not per app) so one script governs every web
// app; the reusable workflow calls it after each app's COVERAGE=1 run, and each
// caller passes its own thresholds as inputs. monocart's own `thresholds` only
// color the HTML report — this script is what actually fails CI.
//
// Usage:
//   node ci/check-coverage.mjs <summary.json> [--lines 80] [--functions 80] [--branches 70]
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const summaryPath = args.find((a) => !a.startsWith('--')) ?? 'coverage/coverage-summary.json';
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : def;
};
const thresholds = {
  lines: flag('lines', 80),
  functions: flag('functions', 80),
  branches: flag('branches', 70),
};

let total;
try {
  total = JSON.parse(readFileSync(summaryPath, 'utf8')).total;
} catch {
  console.error(`✖ coverage gate: could not read ${summaryPath}. Did the COVERAGE=1 run produce a report?`);
  process.exit(1);
}

const failures = Object.entries(thresholds)
  .map(([metric, min]) => ({ metric, min, pct: total[metric]?.pct ?? 0 }))
  .filter(({ min, pct }) => pct < min);

for (const { metric, min, pct } of failures) {
  console.error(`✖ coverage ${metric} ${pct}% is below the ${min}% threshold`);
}

if (failures.length) {
  process.exit(1);
}

console.log(
  `✓ coverage gate passed (${summaryPath}): ` +
  Object.keys(thresholds).map((m) => `${m} ${total[m]?.pct}% ≥ ${thresholds[m]}%`).join(', '),
);
