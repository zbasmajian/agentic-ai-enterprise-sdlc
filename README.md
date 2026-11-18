# Agentic AI Enterprise SDLC

A reference monorepo showing how to run **one centralized CI/CD pipeline across many web apps** instead of copy-pasting `ci.yml` into every repo. The pipeline logic, the coverage gate, and the AI/test policy live in **one place**; each app contributes a ~20-line caller that says *"run the central pipeline, for this app, with these knobs."*

This is the org-scale evolution of [`agentic-ai-demo`](../agentic-ai-demo): same build → e2e → coverage → deploy → publish stages, but factored for reuse.

```
agentic-ai-enterprise-sdlc/
├── .github/
│   ├── workflows/
│   │   ├── web-app-ci.yml        # ← THE central reusable pipeline (workflow_call)
│   │   ├── taskboard-ci.yml      # caller: apps/taskboard (opts into Kind + publish)
│   │   └── catalog-ci.yml        # caller: apps/catalog  (lean, stricter coverage)
│   └── actions/
│       └── setup-web/            # composite action: Node + npm ci + Playwright, shared
├── ci/
│   ├── check-coverage.mjs        # the ONE coverage gate, parameterized per app
│   └── healing-policy.md         # the ONE AI test-healing policy
├── policy/                       # OPA/Conftest policy bundle (next phase)
├── apps/
│   ├── taskboard/                # web app 1 — Sprint Task Board (full: tests, Docker, k8s)
│   └── catalog/                  # web app 2 — Feature Flags console (lighter)
└── README.md
```

## The idea: reuse + enforcement

"Decoupling policy from pipeline" is two problems, solved by different tools:

| Concern | Mechanism here | Lives in |
| --- | --- | --- |
| **Reuse** the pipeline (no duplicated YAML) | **Reusable workflow** (`workflow_call`) + **composite action** | `.github/workflows/web-app-ci.yml`, `.github/actions/setup-web` |
| **Per-app variation** | workflow **inputs** (paths, thresholds, which stages run) | each app's caller |
| **One coverage gate** for all apps | parameterized Node script | `ci/check-coverage.mjs` |
| **One AI/test policy** for all apps | shared markdown | `ci/healing-policy.md` |
| **Enforcement** (every repo must run it, can't opt out) | **org rulesets / required workflows** (configured in org settings, not here) | GitHub org settings |

## The central pipeline (`web-app-ci.yml`)

One reusable workflow with these jobs, all driven by inputs:

| Job | Runs | Notes |
| --- | --- | --- |
| `build` | always | `npm ci` + `next build` via the shared `setup-web` action |
| `e2e` | after build | Playwright vs `npm start`; uploads `<app>-playwright-report` |
| `coverage` | after build, parallel to e2e | V8 coverage → monocart, then `ci/check-coverage.mjs` enforces the app's thresholds; uploads `<app>-coverage-report` |
| `kind-e2e` | if `run-kind-e2e` | builds the image, deploys to a throwaway Kind cluster, runs e2e against the deployed app |
| `publish` | if `publish-image` and `main` | pushes the image to GHCR (`:<sha>` and `:main`) |

### A whole app's CI is just the caller

```yaml
# .github/workflows/catalog-ci.yml
jobs:
  ci:
    uses: ./.github/workflows/web-app-ci.yml
    with:
      app-path: apps/catalog
      image-name: catalog
      coverage-lines: 90       # this app wants a stricter bar
      run-kind-e2e: false      # no k8s manifests yet
      publish-image: false
```

Change the pipeline once in `web-app-ci.yml` and **every** app picks it up. The two apps here prove the variation: `taskboard` opts into Kind + publish at the default 80% bar; `catalog` skips them and demands 90%.

### Across repos (the real org case)

In a single demo repo the callers use the local `./.github/workflows/web-app-ci.yml` form. In a real org you'd keep `web-app-ci.yml` + `ci/` + `setup-web` in a dedicated repo and have every app repo reference it by a **pinned tag**:

```yaml
uses: my-org/agentic-ai-enterprise-sdlc/.github/workflows/web-app-ci.yml@v1
```

Tag the central repo (`v1`, `v1.2.0`); apps pin `@v1`. A fix moves the tag (everyone gets it next run); a breaking change becomes `v2` (migrate deliberately). Never pin `@main` — one bad commit would break every pipeline at once.

## The apps

- **`apps/taskboard`** — the Sprint Task Board from `agentic-ai-demo`: 20 Playwright tests, page object + fixtures, V8 coverage, Dockerfile, and `k8s/` manifests. Opts into every stage.
- **`apps/catalog`** — a Feature Flags console: add/toggle/remove flags, with its own Playwright suite and coverage. A deliberately lighter second app, to show the pipeline serving more than one shape of app.

Each app is self-contained (`cd apps/<app> && npm ci`), so teams own their app while sharing the pipeline.

## Getting started

```bash
# work on one app
cd apps/catalog
npm ci
npm run dev                # http://localhost:3000
npm test                   # Playwright suite
npm run test:coverage      # produces coverage/ (CI runs the central gate on it)
```

## Roadmap

- [x] Central reusable pipeline with build → e2e → coverage → kind-e2e → publish
- [x] Composite setup action and a parameterized, centralized coverage gate
- [x] Two apps on one pipeline, varied only by caller inputs
- [ ] **OPA / Conftest policy bundle** in `policy/` — validate each app's `k8s/` manifests and Dockerfile (no `:latest`, probes required, resource limits, non-root) as a `conftest` job in the central pipeline, with the same rules enforced at the cluster by OPA Gatekeeper
- [ ] Org rulesets + required workflows to enforce the pipeline across repos
- [ ] Shared AI heal/generate jobs wired to `ci/healing-policy.md`
