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

## UI rebuild - 2026-11-11 (second pass)

The user asked for a far more beautiful interface. This is still a Phase 1
presentation change: no backend, API contract, database, or gateway-policy
change, and nothing from Phase 2 onward.

- **Type:** self-hosted Fraunces (display), Geist (interface), and Geist Mono
  (data) from exact-pinned `@fontsource-variable/*` 5.3.0 packages (OFL-1.1).
  No third-party requests; the content-security policy is unchanged.
- **Themes:** Midnight (default) and Daylight, switched in the rail and
  remembered in `localStorage`. The rail, hero, and console stay dark in both.
- **Hero:** an SVG isometric stack with orbits that follows the real connection
  state and desaturates on failure. It is hidden from assistive technology.
- **Preflight console:** the exact request body that will be posted, the real
  response or problem details with its HTTP status, and the contract limits.
  The preview and the request are built from one object, so they cannot differ.
- **System view:** the request path (browser, gateway, API, PostgreSQL) is
  marked verified only by a successful database-backed response. It shows the
  measured round trip of that request, and a copy button for the installation
  ID that reports honestly when the browser has no clipboard access.
- **Layout:** scroll-aware navigation, sticky mobile navigation, and container
  queries so content responds to its own width rather than the viewport.
- `ApiError` and the preflight result now carry the HTTP status.

New files:
[Icon.tsx](../apps/web/src/Icon.tsx),
`StackIllustration.tsx` (removed in the fourth pass),
[theme.ts](../apps/web/src/theme.ts),
[useActiveSection.ts](../apps/web/src/useActiveSection.ts), and
[favicon.svg](../apps/web/public/favicon.svg).
Changed:
[Dashboard.tsx](../apps/web/src/Dashboard.tsx),
[styles.css](../apps/web/src/styles.css),
[api.ts](../apps/web/src/api.ts),
[main.tsx](../apps/web/src/main.tsx),
[index.html](../apps/web/index.html),
[vite.config.ts](../apps/web/vite.config.ts),
[apps/web/package.json](../apps/web/package.json),
[package-lock.json](../package-lock.json),
[Dashboard.test.tsx](../apps/web/src/Dashboard.test.tsx),
[smoke.spec.ts](../tests/e2e/smoke.spec.ts),
[DECISIONS.md](DECISIONS.md), [TESTING.md](TESTING.md), and this ledger.

### Observed verification of the rebuild

| Check                | Result                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend gate        | Prettier, Oxlint (zero warnings), strict TypeScript, the production build, and all 13 component tests passed (8 existing, 5 new). Run from the built check image with networking disabled.                                                                                                                                                            |
| Browser/API gate     | 8 healthy scenarios passed against real services: real preflight, HTTP contracts, navigation plus a successful preflight at 1440, 1024, 768, 375 and 320 CSS pixels, and theme persistence across a reload.                                                                                                                                           |
| Fonts and policy     | In the browser test all three font families loaded and the page logged no console or policy errors. The gateway's policy header is unchanged.                                                                                                                                                                                                         |
| Layout assertions    | No horizontal overflow at the five widths; the preflight panel stays within the viewport; the heading reached by navigation is not covered by the sticky bar.                                                                                                                                                                                         |
| Real database outage | 1 scenario passed: readiness and metadata fail, liveness stays up, and the dashboard shows the failure with no connection success.                                                                                                                                                                                                                    |
| Visual inspection    | Real renderings inspected at 1440, 1280, 1024, 768, 375 and 320 px in Midnight, Daylight at 1440 and 375 px, plus the loading state, a real preflight success, and the hero with motion enabled. The outage and validation-error appearances were inspected using intercepted responses; that is not verification evidence, the outage test above is. |
| Contrast             | 34 text/background pairs across both themes were computed; the lowest was 4.55:1, and the two lowest were then darkened further.                                                                                                                                                                                                                      |
| Development runtime  | The final web image is serving at `http://localhost:18110`. Web, API and database are healthy, only `127.0.0.1:18110` is published, and the installation identity is unchanged.                                                                                                                                                                       |
| Cleanup              | Verification containers and the temporary network were removed. No volumes were deleted.                                                                                                                                                                                                                                                              |

Commands, run from the project root:

```powershell
$check = @(
    '--ansi', 'never', '--project-name', 'replicas-check',
    '--env-file', '.\.local\verification.env',
    '--file', '.\infra\docker\compose.yml', '--profile', 'checks'
)
docker compose @check build web web-check e2e
docker run --rm --network none --memory 768m --cpus 1 --pids-limit 128 replicas-check-web-check:latest

# The second file is only needed while Docker's default address pools are exhausted.
$isolated = @(
    '--ansi', 'never', '--project-name', 'replicas-check',
    '--env-file', '.\.local\verification.env',
    '--file', '.\infra\docker\compose.yml',
    '--file', '.\.local\compose.network.yml', '--profile', 'checks'
)
docker compose @isolated up --detach --no-build --wait --wait-timeout 180 db api web
docker compose @isolated run --rm --no-deps -e TEST_MODE=healthy -e PLAYWRIGHT_OUTPUT_DIR=/workspace/test-results/ui3/healthy e2e
docker compose @isolated stop db
docker compose @isolated run --rm --no-deps -e TEST_MODE=outage -e PLAYWRIGHT_OUTPUT_DIR=/workspace/test-results/ui3/outage e2e
docker compose @isolated down --remove-orphans
```

Results are retained in `.local/reports/e2e/ui3/`,
`.local/ui3-frontend-check.log`, and `.local/ui3-e2e.log`.

**Not run in this pass:** the backend suite (the backend is unchanged), the full
`scripts/replicas.ps1 verify` command (see the network note below), and hosted CI.

### Environment events during this pass

These affect every project on this machine, not only Replicas.

- **Disk full.** While preparing this pass, drive C: reached 0 bytes free. A
  backup copy and a task-list write failed. No source file had been modified,
  and later checks confirmed nothing was truncated. About 17.8 GB became free
  after Docker Desktop was restarted at 22:37 local time; this session did not
  restart it. About 15.7 GB was free at the end of this pass.
- **Engine restart.** That restart stopped the Replicas development containers
  (exit code 255). They were started again with project-scoped Compose and the
  database kept its installation identity.
- **Docker usage.** Docker reported 58.5 GB of images, 12.0 GB of container
  layers, 10.3 GB of volumes and 6.5 GB of build cache across all projects.
  No Docker cleanup was performed. Nearly all of it belongs to other projects,
  and Docker's "reclaimable" figure counts stacks that are merely stopped.
- **Network address pools exhausted.** Docker holds 35 networks and has no
  default range left, so Compose cannot create `replicas-check_default` and
  `scripts/replicas.ps1 verify` currently fails at network creation on this
  machine. This pass used an explicit range in the uncommitted
  `.local/compose.network.yml`. Other projects' networks were not removed.
- **Rollback aid.** The repository has no commits, so a hash-verified copy of
  the previous interface sources is kept in the ignored `.local/ui-v2-backup/`.

## Experience rebuild - 2026-11-12 (third pass)

The user said the second pass was not what they expected and asked for a
jaw-dropping interface of the kind featured on Awwwards. The design described
in the second-pass section above was replaced; its verification record is kept
as history. This is still a Phase 1 presentation change: no backend, API
contract, database, gateway-policy, or dependency change.

- **Shape:** the sidebar became a floating header (brand, section dock with a
  sliding indicator, status and controls), with a bottom tab bar on small
  screens. Sections are full-width colour blocks whose rounded tops ride over
  the block above.
- **Hero:** a full-viewport panel that stays pinned while the page slides over
  it. The headline is set in oversized Fraunces around a real-time 3D stack of
  21 glass plates: the first line passes behind the object, with an outline of
  the same line in front. The stack is a raymarched WebGL shader written for
  this project. It follows the pointer, fans out on scroll, and loses its
  colour when the stack is unreachable.
- **Motion:** a boot counter, a premise paragraph lit word by word on scroll,
  section reveals, marquees, a cursor follower, a magnetic call to action, and
  a theme change that spreads from the control that chose it. All of it sits
  behind one motion setting (see ADR-007).
- **Preflight:** oversized numeric fields with sliders. Slider and field stay
  in step; a typed value outside the range is still sent as typed, so the API
  remains the judge. The request console is kept, and a stamp marks a response.
- **System:** the measured round trip as a very large figure, a signal path
  with a travelling dot, and the installation ID at display size.
- **Roadmap and footer:** phase rows with planned phases drawn in outline and
  only the current one solid; a headline marquee in the footer.
- **Code:** `Dashboard.tsx` now holds state only; the page is split into
  components.

New files:
[Header.tsx](../apps/web/src/Header.tsx),
[Hero.tsx](../apps/web/src/Hero.tsx),
[HeroCanvas.tsx](../apps/web/src/HeroCanvas.tsx),
`heroRenderer.ts` and `heroShader.ts` (both replaced in the fourth pass),
[PreflightSection.tsx](../apps/web/src/PreflightSection.tsx),
[SystemSection.tsx](../apps/web/src/SystemSection.tsx),
[Sections.tsx](../apps/web/src/Sections.tsx),
[Preloader.tsx](../apps/web/src/Preloader.tsx),
[Cursor.tsx](../apps/web/src/Cursor.tsx),
[motion.ts](../apps/web/src/motion.ts),
[model.ts](../apps/web/src/model.ts), and
[ui.tsx](../apps/web/src/ui.tsx).
Changed:
[Dashboard.tsx](../apps/web/src/Dashboard.tsx),
[styles.css](../apps/web/src/styles.css),
`StackIllustration.tsx` (then only the no-WebGL stand-in; removed in the
fourth pass),
[Icon.tsx](../apps/web/src/Icon.tsx),
[theme.ts](../apps/web/src/theme.ts),
[main.tsx](../apps/web/src/main.tsx),
[Dashboard.test.tsx](../apps/web/src/Dashboard.test.tsx),
[smoke.spec.ts](../tests/e2e/smoke.spec.ts),
[DECISIONS.md](DECISIONS.md), and this ledger.

### Observed verification of the experience rebuild

| Check                    | Result                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend gate            | Prettier, Oxlint (zero warnings), strict TypeScript, the production build, and all 16 component tests passed: the 13 existing tests with their assertions unchanged, plus 3 new (slider and field in step, the motion setting, the no-WebGL stand-in).                                                                                                                                                    |
| Browser/API gate         | 14 healthy scenarios passed against real services: the 8 existing ones, plus 6 new (the boot sequence clears itself and a paused-animation choice survives a reload; the pinned hero is covered and hidden on scroll and the premise lights up; the headline is legible and clear of its neighbours at 1440x620, 375x667, 320x568 and 740x360).                                                           |
| Real database outage     | 1 scenario passed: readiness and metadata fail, liveness stays up, and the page shows the failure with no connection success.                                                                                                                                                                                                                                                                             |
| Fonts and policy         | All three font families loaded and the page logged no console or policy errors in the browser test. The gateway's policy header was read back unchanged.                                                                                                                                                                                                                                                  |
| Visual inspection        | Real renderings inspected: the full page at 1440x900 and 375x812; the hero at 1920x1080, 1024x768, 768x1024, 375x667, 320x640, 1440x620 and 740x360; scroll, premise, success, hover and theme-change states with motion on; Daylight in full; the boot screen; the no-WebGL stand-in. The outage appearance was inspected with an intercepted response, which is not evidence; the outage test above is. |
| Sculpture, CPU path      | The test browser draws WebGL on the CPU. The page detected this and drew exactly one still frame on a 480 px canvas, as designed.                                                                                                                                                                                                                                                                         |
| Sculpture, animated path | Exercised by overriding the reported renderer name in the test browser. It started after the boot sequence, followed the pointer, stopped when scrolled past and when animations were switched off, resumed at the top, and stepped its resolution down (638 to 479 px) when frames were slow.                                                                                                            |
| Contrast                 | About 40 text/background pairs were computed across the tones and both hero backdrops. One failed (3.98:1, the response time in the header) and was fixed; every computed pair now reaches at least 4.5:1. Headline letters that cross the sculpture are blended with it and were not computed.                                                                                                           |
| Development runtime      | The final web image is serving at `http://localhost:18110`. Web, API and database are healthy, only `127.0.0.1:18110` is published, and the installation identity is unchanged.                                                                                                                                                                                                                           |
| Cleanup                  | Verification containers and the temporary network were removed. No volumes were deleted and no Docker cleanup was performed.                                                                                                                                                                                                                                                                              |

The commands are the same as in the second-pass section, with results written
to `.local/reports/e2e/aw/`, `.local/aw-frontend-check.log`, and
`.local/aw-e2e.log`.

Correction, made during the fourth pass: `.local/aw-e2e.log`, the console log
of this run, no longer exists. A helper script written in the fourth pass
reused its name and overwrote it. That was a mistake. The Playwright reports
in `.local/reports/e2e/aw/` are intact and record the same run: 14 healthy
scenarios and the outage scenario passed.

**Not verified, and why it matters:**

- **Frame rate on a real GPU.** No GPU was available here, so how smoothly the
  sculpture animates on real hardware is unmeasured. The fallbacks above were
  exercised; the smoothness itself has to be judged in a real browser.
- **Cost on CPU renderers.** With one CPU core on this busy machine, the single
  still frame took 1.2 to 1.7 seconds to draw, blocking the page for that long
  once at load. Before the frame was reduced to one draw at a smaller size, the
  page drew two or three frames of 0.6 to 1.0 seconds each. Timings varied too
  much between runs for a precise comparison.
- **Other browsers.** Only Chromium was run. The theme-change animation uses
  the View Transitions API and falls back to an instant change elsewhere; the
  hero sizing relies on container query units.
- **Not run:** the backend suite (the backend is unchanged), the full
  `scripts/replicas.ps1 verify` command (Docker still has no free default
  network range; it held 37 networks during this pass), and hosted CI.

### State of the repository during this pass

- The repository gained two commits during this session, both authored by the
  repository owner: `1967e14` "Initial project import", between the second and
  third passes, and `3fddf29` "Improve UI and UX", at 07:19 on 2026-11-12 while
  this ledger was being written. The local remote-tracking branch points at
  `3fddf29`, which indicates it was pushed. This session created neither commit
  and did no staging, committing, or pushing.
- `3fddf29` holds the final third-pass source that the checks above ran
  against. When this was written, the working tree differed from it only in
  this ledger and [DECISIONS.md](DECISIONS.md). Until those two files are
  committed, the committed ADR-007 still describes the second-pass design.
- An exact, hash-verified copy of the second-pass sources is kept in the
  ignored `.local/ui-v3-backup/`.
- Free space on drive C: ranged from about 10 GB to 25 GB during this pass.

## Experience upgrade - 2026-11-12 (fourth pass)

The user asked for the third-pass interface to be taken much further ("10
times more"). This pass builds on that design instead of replacing it. It is
still a Phase 1 presentation change: no backend, API contract, database,
gateway-policy, or dependency change.

- **Scrolling:** with motion on and a mouse or trackpad, wheel scrolling glides
  to its target. Keys, links, the scrollbar and touch stay native and cancel a
  glide. The marquees speed up with the scroll and follow its direction.
- **Headline:** the hero headline arrives letter by letter, growing from a
  hairline weight, and its letters then swell toward the pointer.
- **Preflight:** the console gained a live drawing of the limits being set: a
  second 3D stack with 6 to 21 plates for the timeout and a width that follows
  the memory, with a ruler for each. An accepted check sends a band of light up
  the stack; a rejected one drains its colour. It is labelled "Drawn from the
  limits you set. Nothing is running." and has no say in validity. The contract
  now sits under the fields it governs.
- **System:** every check measured during the visit is drawn as a bar, to scale
  against the slowest, with a failed check shown as failed. Up to 16 are kept
  in memory; nothing is stored.
- **Roadmap:** at 1000 px wide and 620 px tall or more, with motion on, the
  phases become one horizontal strip that stays pinned while vertical scrolling
  carries it sideways. The marker on its rail shows how far along the strip the
  view is, not how far the work is.
- **Footer:** when all of it fits on screen, the footer waits under the page
  and the last section slides away to uncover it. A taller footer stays in the
  normal flow, so its top can always be reached.
- **Labels and headings:** small labels resolve out of scrambled characters and
  section headings rise word by word. Their accessible names are unchanged.
- **Sculpture:** the shader now takes the number of plates, their width, a zoom
  and a band of light as inputs, so one renderer draws both the hero and the
  preflight drawing. Where the real-time drawing cannot run, a flat schematic
  with one outline per plate stands in and follows the same numbers.
- **Timing:** every script-driven animation is eased by elapsed time, so it
  behaves the same at any refresh rate (see ADR-007).

New files:
[StackPreview.tsx](../apps/web/src/StackPreview.tsx),
[StackSchematic.tsx](../apps/web/src/StackSchematic.tsx),
[stackRenderer.ts](../apps/web/src/stackRenderer.ts),
[stackShader.ts](../apps/web/src/stackShader.ts),
[kinetic.ts](../apps/web/src/kinetic.ts), and
[scroll.ts](../apps/web/src/scroll.ts).
Removed: `heroRenderer.ts` and `heroShader.ts` (generalised into the two stack
files) and `StackIllustration.tsx` (replaced by the schematic).
Changed:
[Dashboard.tsx](../apps/web/src/Dashboard.tsx),
[Hero.tsx](../apps/web/src/Hero.tsx),
[HeroCanvas.tsx](../apps/web/src/HeroCanvas.tsx),
[PreflightSection.tsx](../apps/web/src/PreflightSection.tsx),
[SystemSection.tsx](../apps/web/src/SystemSection.tsx),
[Sections.tsx](../apps/web/src/Sections.tsx),
[ui.tsx](../apps/web/src/ui.tsx),
[model.ts](../apps/web/src/model.ts),
[Preloader.tsx](../apps/web/src/Preloader.tsx),
[Cursor.tsx](../apps/web/src/Cursor.tsx),
[styles.css](../apps/web/src/styles.css),
[Dashboard.test.tsx](../apps/web/src/Dashboard.test.tsx),
[smoke.spec.ts](../tests/e2e/smoke.spec.ts),
[DECISIONS.md](DECISIONS.md), [TESTING.md](TESTING.md), and this ledger.

### Defects found and fixed during this pass

Three of the six new browser checks failed on their first run. Each failure,
and each oddity seen in a rendering or a measurement, was examined in the
running page before anything was changed.

| Finding                                                                                                                                                                                                                                                                                                                      | Kind           | Found by                                                             | Resolution                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The uncovered footer could not be used with a mouse. The transparent block that reserves its scrolling room lay on top of it and took every click. The keyboard still worked, and no rendering could show it.                                                                                                                | Product defect | New browser check                                                    | The block lets the pointer through. The check asserts that the footer's link is the topmost element at its own centre, then clicks it.                                                                                                    |
| The marquee reacted slowly at low frame rates. After rest, the scroll-speed estimate started from a stale time reading, and it was smoothed per frame, not per unit of time.                                                                                                                                                 | Product defect | New browser check, then a measurement                                | The estimate starts measuring at the first frame after rest and is smoothed by elapsed time. Measured afterwards: 3.16 times the ordinary speed while scrolling down, the same in reverse while scrolling up, the ordinary speed at rest. |
| Animations could run backwards for one frame. A frame is stamped with the time it began, which can be earlier than a clock reading taken just before its callbacks run. The latency count-up could show a negative number, a wheel glide could begin by stepping back, and the band of light went negative (-0.08 measured). | Product defect | Recording the shader's inputs, then reading every use of the pattern | Progress is never below zero, and a glide's first frame counts as one ordinary frame. With the fix removed in a throwaway copy of the check image, the new component test failed showing -25.                                             |
| The flat schematic was drawn below its frame in the preflight console. A later rule of equal weight kept the unused canvas in the layout.                                                                                                                                                                                    | Product defect | Inspecting a rendering                                               | The rule is scoped to each drawing. The browser check asserts that the drawing sits inside its frame at the default and at the largest limits.                                                                                            |
| The boot counter and the headline's letter weights moved by a fixed amount per frame, so they ran slower on slow devices and faster on fast displays. The cursor ring did the same.                                                                                                                                          | Product defect | Measuring letter weights mid-entrance, then reading the code         | All three are eased by elapsed time. The boot counter and the cursor ring date from the third pass.                                                                                                                                       |
| The roadmap check required a position of exactly zero, where the section begins at a fractional offset (-0.39 px measured).                                                                                                                                                                                                  | Test defect    | New browser check                                                    | Positions are compared to within about a pixel.                                                                                                                                                                                           |
| The marquee check allowed 0.7 seconds for a response in a browser that was drawing about three frames a second.                                                                                                                                                                                                              | Test defect    | New browser check                                                    | It drives the scroll until the marquee responds, for up to six seconds each way.                                                                                                                                                          |
| A new component test expected a rejection without sending a request the form allows.                                                                                                                                                                                                                                         | Test defect    | Frontend gate                                                        | It sends an allowed value and lets the mocked API reject it.                                                                                                                                                                              |

### Observed verification of the upgrade

| Check                 | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend gate         | Prettier, Oxlint (zero warnings), strict TypeScript, the production build, and all 18 component tests passed: the 16 existing tests (three extended: heading and label names, the check history after a failed refresh, the hero schematic) plus 2 new (the preview follows the limits and leaves validity to the API; the latency count-up never goes negative). Run from the built check image with networking disabled.                                                                                                                                                                                                                                                            |
| Browser/API gate      | 20 healthy scenarios passed against real services: the 14 existing ones, plus 6 new (wheel scrolling glides and keys stay native; the marquee follows scroll speed and direction; headline letters swell toward the pointer and settle; the roadmap travels sideways while pinned and ends fully in view; the footer waits under the page, takes focus safely and can be clicked; the preflight drawing and its rulers follow the limits). The five viewport scenarios also assert that the pinned roadmap is off under reduced motion.                                                                                                                                               |
| Real database outage  | 1 scenario passed: readiness and metadata fail, liveness stays up, and the page shows the failure with no connection success.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Fonts and policy      | All three font families loaded and the page logged no console or policy errors in the browser test. The gateway's policy header was read back unchanged, and the gateway configuration is unmodified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Shader                | The final shader was rendered at 12 fixed poses outside the app. The tallest drawing (21 plates at full width) kept at least 7.6% of its canvas clear on every side at three different moments. The band of light showed at three heights, and the rejected state lost its colour.                                                                                                                                                                                                                                                                                                                                                                                                    |
| Animated path         | Exercised by overriding the reported renderer name in the test browser. Both canvases reported real-time drawing. Recording the values sent to the shader on the final build showed the band sweeping the hero's 21 plates after a press and the preview's 11 plates after an accepted check, with a brightness between 0 and 0.99 and never negative.                                                                                                                                                                                                                                                                                                                                |
| CPU path              | The test browser draws WebGL on the CPU. The hero drew its single still frame and the preflight drawing used the flat schematic.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Pointer and scrolling | Measured in the running page. Every hero link, the header, the dock and the footer link were the topmost element at their own centres, with motion on and off. A navigation click landed exactly on its section. The wheel took over from a navigation scroll, and a navigation click took over from a wheel glide. With every scrolling call instrumented, page code made none while fields were being filled.                                                                                                                                                                                                                                                                       |
| Visual inspection     | Real renderings inspected, with motion on unless noted: the hero mid-entrance, at rest and with the pointer over the headline; the preflight instrument at the default, smallest and largest limits on both drawing paths, and after an accepted check; the system section after three and five checks; the roadmap at the start, middle and end of its travel at 1440x900, and at 1024x768 and 1440x620; the uncovered footer with the pointer on its link; Daylight; the page without WebGL; the full page at 375x812 with motion off; and the page end at 375x812, 375x667 and 320x568. The rejected appearance was inspected with an intercepted response, which is not evidence. |
| Development runtime   | The final web image is serving at `http://localhost:18110`, and it is the image the gate ran against (same image ID). Web, API and database are healthy, only `127.0.0.1:18110` is published, the installation identity is unchanged, and a preflight still answers `executionEnabled: false`.                                                                                                                                                                                                                                                                                                                                                                                        |
| Cleanup               | Verification containers and the temporary network were removed after every run. No volumes were deleted and no Docker cleanup was performed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

The commands are the same as in the second-pass section, with results written
to `.local/reports/e2e/ui4/`, `.local/ui4-frontend-check.log`, and
`.local/ui4-e2e.log`. The first run, with its three failures, is kept in
`.local/reports/e2e/ui4-first-run/`, and the run that slept through its
startup wait in `.local/ui4-e2e-interrupted-by-sleep.log`. The scripts used to
capture renderings, measure the running page and run the browser gate are
kept in the ignored `.local/aids/` folder; they are not part of the
repository.

**How the final run went.** The complete browser gate, 20 healthy scenarios and
then the outage, passed twice. The first complete pass ran without interruption
on the build before the timing fixes; its reports were replaced by those of the
second, so only this ledger records it. During the second, on the final build,
the machine went to sleep for about three hours partway through the healthy
scenarios. Docker's virtual machine froze and resumed with it, and the run then
completed. A pause can make a check fail; it cannot make one pass.

**Not verified, and why it matters:**

- **Frame rate on a real GPU.** Still unmeasured, and there are now two
  real-time drawings. At the sizes inspected they are never on screen together,
  because the hero is hidden before the preflight drawing appears. On a very
  tall window they could be.
- **How the glide feels.** Its mechanics are tested. Whether it feels right
  under a real mouse wheel or trackpad has to be judged by hand. Switching
  animations off in the header removes it.
- **Cost on CPU renderers.** Unchanged in design. The hero's single still frame
  blocked the page once at load for about 1.5 seconds (1.48 and 1.62 seconds in
  two runs on one busy core). The preflight drawing sets up WebGL before it
  learns that the renderer is a CPU, then discards it; that cost 10 to 90 ms.
- **Other browsers.** Only Chromium was run. The marquee changes speed through
  the Web Animations API, and the pinned roadmap relies on sticky positioning
  and `overflow: clip`.
- **Not run:** the backend suite (the backend is unchanged), the full
  `scripts/replicas.ps1 verify` command (Docker still has no free default
  network range; it held 37 networks during this pass), and hosted CI.

### Environment events during the fourth pass

These affect every project on this machine, not only Replicas.

- **Sleep.** The machine is set to sleep after five idle minutes, on mains
  power too. It slept from 09:58 to 13:00, twenty seconds into a browser run.
  The 180-second startup wait expired while it was asleep, so the run reported
  that the API had failed to start. Nothing was wrong with the stack. Later
  sleeps paused runs, which then completed. This session changed no power
  setting.
- **Disk.** Free space on drive C: fell from about 16 GB to between 3.9 and
  4.7 GB. The Windows page file was 32.9 GB and was last written when the
  machine woke at 13:00. Docker's disk file grew by 0.15 GB in two hours across
  all projects. Nothing of this project's was large enough to matter (its
  largest folder is 200 MB of installed dependencies), so nothing was deleted
  and no Docker cleanup was performed.
- **Working below 6 GB.** Earlier passes started no heavy step below 6 GB free.
  That floor guards against downloads and dependency installs. Below it, this
  pass ran only rebuilds in which every dependency layer came from cache, test
  runs, and the captures and measurements described above, with a hard stop at
  3 GB. During browser runs a watchdog would have removed this project's
  verification stack, and nothing else, had free space fallen below that. It
  never triggered.
- **Memory.** At 13:15 the machine had 31.4 GB of memory with about 1 GB
  available and 49.9 of 53.8 GB committed, with about 30 containers running
  across ten projects. Docker's own virtual machine had 12 GB available.
- **Networks.** Docker still holds 37 networks and has no default range left,
  so the verification network again used the explicit range in the uncommitted
  `.local/compose.network.yml`.

### State of the repository during the fourth pass

- The branch is at `3fddf29` and matches its remote. Everything in this pass
  is uncommitted: in `apps/web/src`, 12 changed, 6 new and 3 removed files; the
  browser test; and three documents. This session did no staging, committing,
  or pushing.
- Until these changes are committed, the committed interface is the third-pass
  design, and the committed ADR-007 still describes the second-pass one.

## Smoothness and sculpture rebuild - 2026-11-13 (fifth pass)

The user asked for the interface to be smoother and far more striking. Until
this pass, smoothness had never been measured: every earlier check ran in a
test browser that draws on the CPU. This pass measured the page in this
machine's own Edge, headless, on its real GPU (Intel Arc), found why it was
not smooth, and fixed the causes. Still a Phase 1 presentation change: no
backend, API contract, database, gateway-policy, or dependency change.

- **Sculpture:** rebuilt as ordinary geometry in place of a shape traced per
  pixel (see ADR-007). Each plate moves on its own springs: the stack drops
  into place plate by plate, leans after the pointer with the top trailing,
  steps out into a spiral as the page scrolls on, and hops as a wave of light
  climbs it. Specks of light drift around the hero's stack.
- **Headline:** letters stretch and lean toward the pointer by transform, not
  by changing weight. They grow away from the labels above and the text below,
  never into them.
- **Scroll engine:** one animation frame serves every scroll effect, reads the
  position once, measures only when sizes may have changed, then writes
  ([frame.ts](../apps/web/src/frame.ts)). Only whole wheel notches glide;
  touchpads are left to the browser.
- **Latency figure:** the digits roll into place like a mechanical counter.
  Readers and reduced motion get the plain number.
- **New touches:** the preflight console leans toward the pointer with a soft
  highlight; a pool of light follows the pointer in the hero; marquees lean
  against the direction of travel.
- **Cheaper effects:** the travelling dot, the status ping, the scroll cue,
  the cursor ring and the section marker in the header now move by transform
  or clipping. The header no longer blurs what is behind it.

New files: [frame.ts](../apps/web/src/frame.ts),
[stackGeometry.ts](../apps/web/src/stackGeometry.ts), and
[tilt.ts](../apps/web/src/tilt.ts). Removed: `scroll.ts` (replaced by
`frame.ts`). Rewritten: [stackRenderer.ts](../apps/web/src/stackRenderer.ts),
[stackShader.ts](../apps/web/src/stackShader.ts),
[kinetic.ts](../apps/web/src/kinetic.ts), and
[useActiveSection.ts](../apps/web/src/useActiveSection.ts). Changed:
[Dashboard.tsx](../apps/web/src/Dashboard.tsx),
[Header.tsx](../apps/web/src/Header.tsx),
[Hero.tsx](../apps/web/src/Hero.tsx),
[HeroCanvas.tsx](../apps/web/src/HeroCanvas.tsx),
[StackPreview.tsx](../apps/web/src/StackPreview.tsx),
[PreflightSection.tsx](../apps/web/src/PreflightSection.tsx),
[SystemSection.tsx](../apps/web/src/SystemSection.tsx),
[Sections.tsx](../apps/web/src/Sections.tsx),
[Cursor.tsx](../apps/web/src/Cursor.tsx),
[motion.ts](../apps/web/src/motion.ts), [ui.tsx](../apps/web/src/ui.tsx),
[styles.css](../apps/web/src/styles.css),
[Dashboard.test.tsx](../apps/web/src/Dashboard.test.tsx),
[smoke.spec.ts](../tests/e2e/smoke.spec.ts), [DECISIONS.md](DECISIONS.md),
[TESTING.md](TESTING.md), and this ledger.

### What made it unsmooth, and what was done

| Cause                                                                                                                                                                                                                 | Found by                                               | Fix                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moving the pointer over the headline changed each letter's weight, so the browser laid the headline out again on every frame. The page fell to between 2 and 18 frames a second for as long as the pointer was there. | First measurement on the real GPU                      | Letters move by transform only. A browser check now fails if sweeping the pointer across the headline causes layout.                                        |
| The page was laid out again on every frame even at rest. The dot that travels the request path was animated by its position, the only animation on the page that needed layout.                                       | Main-thread counters during the same measurement       | The dot slides. Layouts at rest went from one per frame to none.                                                                                            |
| While scrolling, each effect read the layout after another had written styles: 720 to 830 layouts for one trip down the page.                                                                                         | The same counters                                      | The shared frame described above. A settled page now scrolls its whole length and back with two layouts at most, and none in the steady-scroll measurement. |
| The traced sculpture cost too much per pixel for integrated graphics. On the loaded machine of 12 November it needed 17 ms a frame at full size, so it halved its own resolution and, while wheeling, gave up moving. | Timing the shader alone on the GPU                     | Geometry. At full resolution it now needs about 2 ms, and it no longer steps down.                                                                          |
| Each word of the premise stopped being a group when it reached full opacity, so the paragraph was laid out and drawn again as every word lit or dimmed.                                                               | The new layout check failing, then counting on the GPU | Each word keeps a layer of its own.                                                                                                                         |
| Reading on into the next section redrew the whole page, because the current section was held by the page.                                                                                                             | Reading the code after locating long frames            | The header holds it. Not measured on its own.                                                                                                               |
| The glide took over touchpad scrolling, which the browser already does smoothly off the main thread.                                                                                                                  | Reading the code                                       | Only whole wheel notches glide. Checked with synthetic events only.                                                                                         |
| First versions of two new effects were wrong: the rolling digits showed slivers of their neighbours, and swelling letters ran into the labels above the headline.                                                     | Inspecting renderings from the real GPU                | Both fixed, and each has a browser check (digits centred with neighbours outside the window; letter tops clear of the labels).                              |

### Measured on the real GPU

Edge 157, headless, on the Intel Arc GPU, 1280 by 680 CSS pixels at 1.5x,
animation on. "Before" is the fourth-pass interface, rebuilt from its
hash-verified backup and served beside the new one, the two measured in turn
on 13 November between 13:28 and 14:52. Rounds 1 and 2 used a fifth-pass build
without the last fixes; round 3 used the build before the final two.

| Scenario                               | Before (three rounds)                                    | After (three rounds)                    |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| Pointer moving over the headline, 4 s  | 14.4, 10.7, 18.1 fps; 3.6 to 3.8 s of it spent in layout | 60.0, 60.0, 56.8 fps; no layout         |
| At rest with the hero on screen, 4 s   | 236 to 242 layouts                                       | none                                    |
| Wheel down the whole page, first visit | 51.1, 52.8, 59.3 fps; 722 to 826 layouts                 | 54.5, 55.8, 57.4 fps; 99 to 118 layouts |
| Steady scroll down the whole page      | 56.8, 54.8, 59.8 fps; 370 to 393 layouts                 | 58.4, 59.0, 60.0 fps; 2 to 18 layouts   |
| Pinned roadmap, there and back         | 60 fps; 721 to 725 layouts                               | 60 fps; none                            |
| Loading until settled                  | 251 to 307 layouts taking 0.8 to 1.2 s                   | 58 to 110 layouts taking under 0.1 s    |
| Hero canvas                            | had stepped down to 600 px                               | full 799 px                             |

The final build, measured once at 15:27: 60.0 fps with the pointer over the
headline, slowest frame 19 ms, no layout. Wheeling down the page for the first
time, two frames ran long (250 ms at the first notch, 148 ms as the preflight
section arrived). On the second trip no frame took longer than 60 ms.

One frame of the sculpture alone, on a quiet machine: 3.65 ms traced against
1.72 ms as geometry at 799 px, and 1.65 ms against 0.32 ms for the preflight
drawing. Timed again at the end on a busy machine the geometry took 2.35 ms.
A first version of the geometry, with multisampling and a sheet of glow over
every plate, took 2.65 ms; narrow bands of glow and edges softened in the
shader brought it down.

Under the load of 12 November (about 30 containers, memory nearly exhausted)
the fourth-pass page managed 1.9 fps with the pointer over the headline and
20.9 fps while wheeling. Those conditions could not be reproduced for the new
build, so that comparison was not made.

### Observed verification of the fifth pass

| Check                | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend gate        | Prettier, Oxlint (zero warnings), strict TypeScript, the production build, and all 19 component tests passed: 17 unchanged, 2 new for the rolling figure (digits per column, plain number for readers and with animation off). The fourth-pass test for a negative count went with the counter it tested.                                                                                                                                                                                           |
| Browser/API gate     | 22 healthy scenarios passed against real services: the 20 existing ones, two of them reworked (the headline check now measures stretch, clearance from the labels and layout; the wheel check also asserts that touchpad-sized movements are left alone), plus 2 new (the latency figure rolls to the measured number; a settled page rests, slides over the hero and scrolls its whole length without layout).                                                                                     |
| Real database outage | 1 scenario passed: readiness and metadata fail, liveness stays up, and the page shows the failure with no connection success.                                                                                                                                                                                                                                                                                                                                                                       |
| Visual inspection    | From the real GPU: the sculpture at 16 poses and moments (assembly, light wave, pointer lean, fan-out, both preflight extremes, rejected), the hero at rest, with the pointer on each line and just after a press, the hero being covered, the preflight console while sending, and the latency figure mid-roll and at rest. From the CPU-drawn test browser: the hero's still frame, the schematic after an accepted check, Daylight, the reduced-motion roadmap, and the full page at 375 by 812. |
| Fonts and policy     | All three font families loaded and the page logged no console or policy errors in the browser test. The gateway's policy header was read back unchanged.                                                                                                                                                                                                                                                                                                                                            |
| Development runtime  | The final web image is serving at `http://localhost:18110`, and it is the image the final gate ran against (same image ID). Web, API and database are healthy, only `127.0.0.1:18110` is published, the installation identity is unchanged, and a preflight still answers `executionEnabled: false`.                                                                                                                                                                                                |
| Cleanup              | Verification containers and the temporary network were removed after every run, and so were the extra container and image used to serve the fourth-pass interface for comparison. No volumes were deleted and no Docker cleanup was performed.                                                                                                                                                                                                                                                      |

The browser gate was run five times. The first found the premise defect in the
table above (21 of 22). The second passed. The third lost its first scenario to
a teardown timeout: the machine entered standby about a minute and a half
after the tests began. The fourth passed on the same images. After the last
two fixes the fifth passed, with no standby during it, and its reports are the
ones kept in `.local/reports/e2e/ui5/`, with `.local/ui5-frontend-check.log`.

Only part of the raw measurement output survives in `.local/aids/p5-*.txt`.
Later rounds were written under the file names of earlier ones, the same
mistake as the overwritten log of the third pass. The figures above were
copied from each run as it was made. The scripts that produced them are in
the same folder.

**Not verified, and why it matters:**

- **A real wheel and a real touchpad.** Every input was synthetic. How the
  glide feels, and whether every mouse and touchpad is told apart correctly,
  has to be judged by hand. Switching animations off removes the glide.
- **A visible window.** Edge ran headless. Frame pacing in a window on the
  screen, on battery, or on a display faster than 60 Hz was not measured.
- **Other hardware and browsers.** One GPU and one browser engine. The CPU
  path was checked for correctness, not speed.
- **The first visit.** Sections still cost something the first time they
  appear: about 100 layouts as labels decode and blocks reveal, and the two
  long frames noted above. A second visit costs none.
- **The final build's comparison.** Its paired rounds predate the last two
  fixes; after them it has the single run quoted above.
- **Not run:** the backend suite (the backend is unchanged), the full
  `scripts/replicas.ps1 verify` command (Docker still has no free default
  network range), and hosted CI.

### Environment events during the fifth pass

- **Disk.** Drive C: fell to 1.6 GB free on the morning of 13 November. This
  session stopped building and asked. None of it was this project's (about
  8 MB of working files). After a restart 18.9 GB was free; it dipped to
  6.3 GB once more in the afternoon and recovered.
- **Restarts.** The machine was restarted at 11:41 and again at 13:03, both
  times between steps of this pass. The measurement that followed the second
  found the API and database stopped and was discarded. Each time the Replicas
  containers were started again with project-scoped Compose, and the database
  kept its installation identity. This session restarted nothing but its own
  stack.
- **Standby.** The machine slept at 14:55 and 15:01. One gate run and one
  measurement were lost to it and repeated. No power setting was changed.
- **Tools used on the host.** The machine's own Edge, headless, with a
  throwaway profile inside `.local` and a debugging port bound to loopback,
  removed after every run. The newer Node already installed on the machine,
  called by its full path, to prepare the sculpture for the harness. Nothing
  was installed and no setting was changed.
- **State of the repository.** The branch is still at `3fddf29`. The fourth
  and fifth passes are both uncommitted. A hash-verified copy of the
  fourth-pass sources is kept in the ignored `.local/ui-v4-backup/`. This
  session did no staging, committing, or pushing.

## Next action

Await authorization for Phase 2. Begin by choosing the identity/tenant boundary,
then implement the domain schema, task contracts, state transitions, permissions,
and retry-safe idempotency with integration tests. Do not treat preflight as a
task-submission API.

## Files created in the first pass

The 58 authored source/configuration/documentation files of the initial Phase 0
and Phase 1 pass are listed below. Later passes list their own files above.
All were new relative to the initial PDF-only folder; the supplied PDF is unchanged.
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
