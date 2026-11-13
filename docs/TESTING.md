# Local verification and troubleshooting

## Supported path

From the repository root, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\replicas.ps1 verify
```

The same script is the CI entrypoint (`pwsh` on GitHub's Ubuntu runner).
It checks Compose configuration without printing expanded credentials, builds
production images, checks formatting/lint/types, runs frontend unit tests,
runs Java unit/integration tests against PostgreSQL, then runs the built browser
and API smoke tests.

The failure-path gate stops only the `replicas-check` database and proves that
readiness and metadata fail, liveness stays healthy, and the dashboard reports
the real failure. The script restores the database, restarts both database and
API containers, compares installation identities, and reruns the browser smoke
tests. A nonzero command exits the gate; it is not converted to a success.

All verification containers are removed in `finally`. Named database volumes
are retained; the script never deletes volumes or other projects' containers.
The development project (`replicas`) is independent and is not stopped.

## Evidence

Ignored, local reports are written below `.local/reports/`:

- `java/`: JUnit XML and text reports.
- `e2e/healthy/`, `e2e/outage/`, `e2e/recovered/`: Playwright JSON reports and
  failure-only screenshots/traces.
- `verification.json`: overall outcome, completed gates, timestamp, and whether
  execution actually occurred in GitHub Actions.

The human-readable phase record is [PLAN.md](PLAN.md). Do not mistake generated
CI configuration for a passed hosted CI run.

## Focused checks

These commands use the project-created local verification environment file:

```powershell
docker compose --project-name replicas-check --env-file .\.local\verification.env --file .\infra\docker\compose.yml --profile checks run --rm --no-deps web-check
docker compose --project-name replicas-check --env-file .\.local\verification.env --file .\infra\docker\compose.yml --profile checks up --detach --wait db
docker compose --project-name replicas-check --env-file .\.local\verification.env --file .\infra\docker\compose.yml --profile checks run --rm --no-deps api-check
docker compose --project-name replicas-check --env-file .\.local\verification.env --file .\infra\docker\compose.yml down
```

Run the full gate first to build those check images. No host Java/Node is needed.
These commands do not start the browser stack; use the full gate for E2E.

## Troubleshooting

- **Docker unavailable:** start Docker Desktop in Linux-container mode; check
  `docker info`. Do not restart a shared daemon or stop sibling projects.
- **Port conflict:** set `$env:REPLICAS_WEB_PORT` before `up`. The binding stays
  loopback-only. Verification publishes no host ports.
- **"All predefined address pools have been fully subnetted":** Docker has no
  default network range left, usually because many Compose projects exist on
  the machine. Do not prune networks that belong to other projects; a network
  with no attached containers may only mean that its stack is stopped. Either
  remove networks you own and no longer need, or give this project's
  verification network an explicit range in an uncommitted Compose file such as
  `.local/compose.network.yml`, passed as a second `--file`. The frontend check
  needs no network:
  `docker run --rm --network none replicas-check-web-check:latest`.
- **Disk nearly full:** container builds can fill the drive and leave partial
  writes. Check free space first, and do not prune Docker globally to recover
  it; decide per project what can go. Free space can also fall with no build
  running, because Windows grows its page file when memory is short. That
  space is not Docker's to give back; it usually returns after a restart.
- **"timeout waiting for dependencies" after the machine slept:** the startup
  wait is counted by the host, so a sleep during startup uses it up while the
  containers are frozen. Nothing is wrong with the stack. Run the command
  again.
- **Judging smoothness:** the browser tests draw on the CPU, so their timings
  say nothing about frame rate. What they can and do check is that a settled
  page scrolls, and the headline follows the pointer, without the browser
  laying the page out again. Frame pacing has to be measured in a browser
  that uses the machine's GPU; [PLAN.md](PLAN.md) records how that was done.
- **Initial downloads:** Maven, npm, and container images require network access.
  Keep dependencies locked and retry a failed download rather than skipping checks.
- **Database authentication after deleting local config:** existing volumes retain
  their original credential. Recover the matching ignored environment file.
  Do not reset or delete a volume without explicit approval.
- **Readiness failure:** inspect project-scoped API/database logs; never print
  resolved Compose configuration or the local credential files.
- **Migration recovery:** V1 creates only synthetic installation metadata.
  Flyway Community has no automatic undo workflow here. Later schema changes
  require a new forward migration; any destructive reset needs approval.
- **Editor test discovery unavailable:** use the documented containerized test
  command; host SDKs are not the supported test environment.
- **No worker/task APIs:** intentional Phase 1 boundary, not a runtime outage.
