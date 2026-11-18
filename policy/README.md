# Policy bundle (OPA / Conftest) — next phase

This folder will hold the org's **policy-as-code** in [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/), evaluated two ways against the same rules:

1. **Shift-left, in CI** — a `conftest` job in `web-app-ci.yml` runs `conftest test apps/<app>/k8s/*.yaml --policy policy/` on every PR, so a bad manifest fails fast without a cluster.
2. **Backstop, in the cluster** — the same rules as **OPA Gatekeeper** constraints, so a non-compliant deploy is rejected by the Kubernetes API server even if CI is bypassed.

### Planned rules (for `apps/*/k8s/*.yaml` and `Dockerfile`)

- No `:latest` image tags — require an immutable tag.
- Every container has a **readiness** and **liveness** probe.
- Every container sets CPU/memory **requests and limits**.
- Containers run as **non-root**.
- Images come only from **allowed registries** (e.g. `ghcr.io/my-org/*`).

These are exactly the deployment mistakes the `taskboard` app's notes already document catching at runtime — policy-as-code moves them to PR time, centralized and versioned here instead of hand-checked per repo.

> This is the agreed next step after the centralized pipeline. See the repo README's roadmap.
