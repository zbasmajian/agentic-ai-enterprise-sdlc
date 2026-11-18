# Project instructions for Claude

Monorepo of web apps sharing one centralized CI/CD pipeline.

## Layout

- `apps/<name>/` — a self-contained Next.js web app (its own `package.json`, tests, `playwright.config.ts`). Work on one app from inside its folder.
- `.github/workflows/web-app-ci.yml` — the one reusable pipeline every app calls. Edit the pipeline here, never per app.
- `.github/actions/setup-web/` — shared composite setup action.
- `ci/check-coverage.mjs` — the one coverage gate for all apps (parameterized by thresholds).
- `ci/healing-policy.md` — the one AI test-healing policy for all apps.
- `policy/` — OPA/Conftest policy bundle (next phase).

## Rules

- Don't copy pipeline YAML into an app. Per-app differences go in the app's caller workflow as `inputs` (`.github/workflows/<app>-ci.yml`).
- Keep each app self-contained: no cross-app imports.
- The coverage gate and the test-healing policy are shared; change them in `ci/`, not per app.

## Test healing policy

Follow `ci/healing-policy.md` whenever you fix, heal, or debug failing tests in any app. In short: the healer may update test code (`apps/*/tests/`) and, narrowly, the plans in `apps/*/specs/*.md` to match an intentional, confirmed UI change — never application code (`apps/*/src/`), `playwright.config.ts`, or CI. When a failure points to a real app bug, stop and report it with evidence for a human to decide.
