# Ordered implementation and verification ledger

## Session workflow

Every implementation session reads the complete three-page playbook, this
ledger, decisions, and relevant tests before changing code. Work on the next
unfinished, authorized phase gate. Record commands and observed results below.
Do not reinitialize completed work or turn a planned checkbox into a success
claim.

## Phase 0 - Contract and safety

- [x] Read the full engineering playbook and inspect the initially empty project.
- [x] Define PRD, user stories, non-goals, measurable acceptance, architecture,
      interfaces, threats, approval boundaries, and decisions.
- [x] Add README, coding conventions, repository policies, and CI entrypoint.
- [x] Initialize local Git on `main` with user approval; no commits or remotes.
- [x] Check the Phase 0 artifacts for consistency before implementing Phase 1.

## Phase 1 - Working skeleton

- [x] Bootstrap Java 21 / Spring Boot 3 API and React / TypeScript dashboard.
- [x] Add PostgreSQL, Flyway migration, liveness and database-aware readiness.
- [x] Add strict request validation and safe RFC 9457 errors.
- [x] Add a non-executing preflight and database-backed dashboard.
- [x] Add project-isolated Docker Compose and one-command lifecycle scripts.
- [x] Run formatting, compilation, backend/frontend tests, and real browser/API smoke.
- [x] Verify persisted installation metadata across database/API restart.
- [x] Verify database-outage readiness and absence of misleading UI success.
- [x] Record evidence and mark only verified acceptance criteria complete.

## Later phases - not started

2. Domain entities and task APIs, authorization, idempotency, transitions, tests.
3. Durable scheduling, isolated local worker, leases/retries, checkpoints, budgets,
   bounded verification, PR evidence, and operator workflow.
4. Optional agent adapters behind explicit interfaces and execution limits.
5. Reliability, timeouts, rate limits, trace export, dashboards, and failure cases.
6. Measured benchmarks, clean fixtures, limitations, demo, and deployment guide.

No later-phase feature, benchmark, security property, or deployment is claimed.

## Initialization and first-check history

| Date       | Check                       | Result                                                                                                                                                                                                                                      |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-11 | Full PDF extraction/read    | All 3 pages read (173 extracted lines); temporary extraction will be removed.                                                                                                                                                               |
| 2026-11-11 | Initial project inspection  | Only the supplied PDF existed; no repository or application to preserve.                                                                                                                                                                    |
| 2026-11-11 | Host tools                  | Node 14.21.3 / npm 6.14.18; no Java/Maven on PATH. Containerized builds selected.                                                                                                                                                           |
| 2026-11-11 | Docker engine / Compose     | Engine 29.4.1 responds after user startup; Compose v5.1.3 available.                                                                                                                                                                        |
| 2026-11-11 | Approved Git initialization | Empty local `main` repository created; no commits.                                                                                                                                                                                          |
| 2026-11-11 | Phase 0 gate                | All 10 required contract/workflow artifacts present; scope, limits, non-goals, and approval boundaries checked for consistency. No runtime claims made.                                                                                     |
| 2026-11-11 | Initial Java unit gate      | 26 tests executed; one failed because Jackson coerced a numeric label into a string. Added explicit textual coercion rejection and regression cases; rerun pending.                                                                         |
| 2026-11-11 | Initial frontend gate       | Lint and root TypeScript checks passed. Editor test discovery found no tests; containerized Vitest on the Windows bind mount hit a worker startup timeout. Use the documented image-backed check path before changing application behavior. |

The initial failures above are historical, not outstanding blockers. The numeric
label regression was fixed with explicit Jackson textual coercion rules;
the final gate includes integer, float, and boolean label rejection. The image-backed
frontend check passed without changing or weakening test timeouts.

The first lifecycle invocation also exposed PowerShell 5.1 array forwarding;
the wrapper now accepts a typed string array, and the exact documented commands
have subsequently passed. A transient Playwright image download ended with
`unexpected EOF`; the subsequent build retrieved it successfully.

## Final local verification - 2026-11-11

The complete gate finished successfully at **11:53:02 UTC**:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\replicas.ps1 verify
```

| Gate                      | Observed result                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting and lint       | Prettier and Spotless passed; Oxlint reported zero warnings/errors.                                                                          |
| Compilation               | Java 21 / Spring Boot 3.5.16 package, strict TypeScript, and production Vite build passed.                                                   |
| Backend tests             | 31 passed: 27 preflight/validation cases, 1 safe database-failure case, 3 real PostgreSQL integration cases; zero failures/errors/skips.     |
| Frontend tests            | 7 component tests passed, including failure, retry, response-contract rejection, and non-executing preflight.                                |
| Healthy browser/API smoke | 3 passed: real UI/API preflight, health/invalid-input/body-size contracts, and 375px narrow-screen layout.                                   |
| Database outage           | 1 browser/API scenario passed: readiness and metadata return 503, liveness stays 200, and the dashboard shows a real error.                  |
| Restart persistence       | Installation UUID and schema version were unchanged after restarting PostgreSQL and the API.                                                 |
| Recovery smoke            | All 3 healthy browser/API scenarios passed again after database recovery and restart.                                                        |
| Cleanup                   | Zero `replicas-check` containers remain. Data volumes were not deleted.                                                                      |
| Local development launch  | The documented `up` command succeeded against a newly created development database volume; web/API/database are healthy.                     |
| Local exposure            | Docker inspection confirmed only web `127.0.0.1:18110` is published; API and database have no host bindings.                                 |
| Live HTTP/browser check   | `/`, `/api/v1/system`, liveness, and readiness returned 200 through the local gateway; integrated-browser snapshot and screenshot inspected. |
| Local secret exclusion    | Git ignore checks cover both generated local environment files; no credentials were committed or printed.                                    |

Authoritative local evidence is under `.local/reports/`: JUnit XML, Playwright
JSON for healthy/outage/recovered runs, and `verification.json` with `passed: true`.
These are ignored runtime outputs, not source files or benchmark claims.

The temporary PDF extraction and generated demo assets were removed. The supplied
PDF was not changed. Development containers are intentionally running at
<http://localhost:18110>; stop only this project with the documented `down` command.

**Current state:** Phase 0 and Phase 1 local acceptance criteria P1-01 through
P1-08 passed. Hosted CI is configured but **has not run**; there is no remote,
commit, cloud deployment, real data access, agent execution, or benchmark result.

## UI refresh - 2026-11-11

The user requested a substantially more distinctive interface. This is a
presentation and usability refinement of Phase 1, not the start of Phase 2.

- Replaced the navy dashboard with an aubergine/ivory design, citron actions,
  coral accents, and lavender surfaces.
- Added responsive workspace navigation, an original CSS-layered hero
  illustration, clearer preflight fields, and a structured connection panel.
- Preserved synthetic-only validation, actual database metadata, safe error
  messages, and the explicit execution-disabled boundary. No fabricated workload
  counts or completed future features are shown.
- Added a manual system-status refresh using the existing API; a regression test
  proves that a failed refresh removes stale connection-success state.
- Kept keyboard-accessible controls and labels, added a skip link and section
  navigation, and respected reduced-motion preferences.
- No dependency, backend, contract, or database changes were needed.

Changed files:
[Dashboard.tsx](../apps/web/src/Dashboard.tsx),
[styles.css](../apps/web/src/styles.css),
[Dashboard.test.tsx](../apps/web/src/Dashboard.test.tsx),
[smoke.spec.ts](../tests/e2e/smoke.spec.ts), and this ledger.

### Observed UI verification

| Check                | Result                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend gate        | Prettier, Oxlint, strict TypeScript, production build, and all 8 component tests passed.                                                                                                                                        |
| Browser/API gate     | All 7 healthy scenarios passed: existing real-API flows plus navigation and successful preflight at 1440, 1024, 768, 375, and 320 CSS pixels.                                                                                   |
| Layout assertions    | At all five widths, the page has no horizontal overflow and the preflight panel stays within the viewport. Section links reach the actual form.                                                                                 |
| Real database outage | The existing outage scenario passed with the redesigned UI: readiness/metadata fail, liveness stays up, and no false connection success is shown.                                                                               |
| Visual inspection    | Actual 1440px desktop and 375px mobile renderings were captured with the existing Playwright image and inspected. The integrated browser's viewport override did not stick, so it was not used as evidence of those dimensions. |
| Development runtime  | The rebuilt web image is serving at `http://localhost:18110`. Previously stopped development API/database containers were started with project-scoped Compose; the real metadata endpoint returned 200.                         |
| Isolation            | Only Replicas resources were operated on. Verification containers were removed; no volumes were deleted.                                                                                                                        |

Targeted commands, run from the project root:

```powershell
$check = @(
    '--ansi', 'never', '--project-name', 'replicas-check',
    '--env-file', '.\.local\verification.env',
    '--file', '.\infra\docker\compose.yml', '--profile', 'checks'
)
docker compose @check build web web-check e2e
docker compose @check run --rm --no-deps web-check
docker compose @check up --detach --no-build --wait --wait-timeout 180 db api web
docker compose @check run --rm --no-deps -e TEST_MODE=healthy -e PLAYWRIGHT_OUTPUT_DIR=/workspace/test-results/ui-refresh/healthy e2e
docker compose @check stop db
docker compose @check run --rm --no-deps -e TEST_MODE=outage -e PLAYWRIGHT_OUTPUT_DIR=/workspace/test-results/ui-refresh/outage e2e
docker compose @check down --remove-orphans
```

The executed verification used `finally` cleanup. Results are retained in
`.local/reports/e2e/ui-refresh/` and `.local/ui-frontend-check.log`.
The unchanged backend unit suite was not rerun for this UI-only change.
Hosted CI remains unexecuted.

## Next action

Await authorization for Phase 2. Begin by choosing the identity/tenant boundary,
then implement the domain schema, task contracts, state transitions, permissions,
and retry-safe idempotency with integration tests. Do not treat preflight as a
task-submission API.

## Changed files in this session

58 authored source/configuration/documentation files are present below.
All are new relative to the initial PDF-only folder; the supplied PDF is unchanged.
Generated dependency/build caches and ignored local credentials/reports are excluded.

### Root policies, tooling, and CI

- [.dockerignore](../.dockerignore)
- [.editorconfig](../.editorconfig)
- [.gitattributes](../.gitattributes)
- [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [.gitignore](../.gitignore)
- [.npmrc](../.npmrc)
- [.prettierignore](../.prettierignore)
- [.prettierrc.json](../.prettierrc.json)
- [AGENTS.md](../AGENTS.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [README.md](../README.md)
- [package.json](../package.json)
- [package-lock.json](../package-lock.json)
- [playwright.config.ts](../playwright.config.ts)
- [tsconfig.json](../tsconfig.json)

### Frontend

- [apps/web/.oxlintrc.json](../apps/web/.oxlintrc.json)
- [apps/web/index.html](../apps/web/index.html)
- [apps/web/package.json](../apps/web/package.json)
- [apps/web/src/api.ts](../apps/web/src/api.ts)
- [apps/web/src/Dashboard.tsx](../apps/web/src/Dashboard.tsx)
- [apps/web/src/Dashboard.test.tsx](../apps/web/src/Dashboard.test.tsx)
- [apps/web/src/main.tsx](../apps/web/src/main.tsx)
- [apps/web/src/styles.css](../apps/web/src/styles.css)
- [apps/web/src/test/setup.ts](../apps/web/src/test/setup.ts)
- [apps/web/tsconfig.app.json](../apps/web/tsconfig.app.json)
- [apps/web/tsconfig.json](../apps/web/tsconfig.json)
- [apps/web/tsconfig.node.json](../apps/web/tsconfig.node.json)
- [apps/web/vite.config.ts](../apps/web/vite.config.ts)

### API and database

- [services/api/pom.xml](../services/api/pom.xml)
- [ReplicasApplication.java](../services/api/src/main/java/dev/replicas/api/ReplicasApplication.java)
- [ApiExceptionHandler.java](../services/api/src/main/java/dev/replicas/api/http/ApiExceptionHandler.java)
- [JsonConfiguration.java](../services/api/src/main/java/dev/replicas/api/http/JsonConfiguration.java)
- [RequestLoggingFilter.java](../services/api/src/main/java/dev/replicas/api/http/RequestLoggingFilter.java)
- [PreflightController.java](../services/api/src/main/java/dev/replicas/api/preflight/PreflightController.java)
- [SystemController.java](../services/api/src/main/java/dev/replicas/api/system/SystemController.java)
- [application.yml](../services/api/src/main/resources/application.yml)
- [V1__platform_metadata.sql](../services/api/src/main/resources/db/migration/V1__platform_metadata.sql)
- [PreflightControllerTest.java](../services/api/src/test/java/dev/replicas/api/preflight/PreflightControllerTest.java)
- [DatabaseFailureTest.java](../services/api/src/test/java/dev/replicas/api/system/DatabaseFailureTest.java)
- [SystemIntegrationTest.java](../services/api/src/test/java/dev/replicas/api/system/SystemIntegrationTest.java)

### Infrastructure, contracts, and end-to-end tests

- [infra/docker/api.Dockerfile](../infra/docker/api.Dockerfile)
- [infra/docker/web.Dockerfile](../infra/docker/web.Dockerfile)
- [infra/docker/e2e.Dockerfile](../infra/docker/e2e.Dockerfile)
- [infra/docker/compose.yml](../infra/docker/compose.yml)
- [infra/docker/compose.local.yml](../infra/docker/compose.local.yml)
- [infra/docker/nginx.conf](../infra/docker/nginx.conf)
- [packages/contracts/openapi.yaml](../packages/contracts/openapi.yaml)
- [scripts/replicas.ps1](../scripts/replicas.ps1)
- [tests/e2e/smoke.spec.ts](../tests/e2e/smoke.spec.ts)
- [tests/e2e/outage.spec.ts](../tests/e2e/outage.spec.ts)
- [services/worker/.gitkeep](../services/worker/.gitkeep)
- [benchmarks/.gitkeep](../benchmarks/.gitkeep)

### Documentation

- [docs/PRD.md](PRD.md)
- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/THREAT_MODEL.md](THREAT_MODEL.md)
- [docs/PLAN.md](PLAN.md)
- [docs/DECISIONS.md](DECISIONS.md)
- [docs/TESTING.md](TESTING.md)
