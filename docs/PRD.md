# Product requirements

Source: all three pages of [the engineering playbook](../10_Replicas_Agent_Cloud.pdf).
This is an independent proof-of-work prototype, not an official company
specification.

## Problem and users

Engineering teams need long-running coding tasks to survive interruptions without
losing work, escaping their workspace, or exceeding a resource budget. Evaluators
need reproducible evidence rather than a simulated success screen.

Roles for the eventual MVP:

- **Task author:** submit a bounded task and observe its state and evidence.
- **Operator:** cancel work, inspect failures, and recover safe checkpoints.
- **Reviewer:** inspect verification results and a draft PR before any merge.

Tenant identity must come from authenticated server-side context, never a
caller-controlled body field. The authentication provider is a Phase 2 decision;
Phase 1 has no task or sensitive-data endpoints.

## Phase 0 and Phase 1 scope

| ID    | User story                                                            | Measurable acceptance                                                                                                                                                                                   |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | An engineer can understand the contract before implementation.        | README, PRD, architecture diagram, threat model, non-goals, plan, decisions, conventions, ignore rules, and CI definition exist and agree on scope.                                                     |
| P0-02 | Work resumes without skipping phase gates.                            | Project instructions require reading the full playbook and progress ledger each session; unexecuted work is explicitly pending.                                                                         |
| P1-01 | An evaluator can start the local skeleton without host SDK changes.   | One documented PowerShell command builds and starts Java 21, Spring Boot 3, React/TypeScript, and PostgreSQL using Docker Compose.                                                                      |
| P1-02 | An operator can distinguish process health from database readiness.   | Liveness returns 200 while running; readiness includes PostgreSQL and returns non-200 if the database is unavailable.                                                                                   |
| P1-03 | Database state is migrated and survives a restart.                    | Flyway applies V1 once; the installation UUID returned by the API stays unchanged after database/API container restart.                                                                                 |
| P1-04 | A user can validate a synthetic configuration without executing code. | Preflight returns HTTP 200 with `valid: true` and `executionEnabled: false` for a valid request; no task is stored or scheduled.                                                                        |
| P1-05 | Bad input produces actionable, safe errors.                           | Blank or over-80-character labels, missing values, timeouts outside 1-900 seconds, memory outside 128-2048 MiB, malformed JSON, unknown fields, and wrong scalar types return HTTP 400 problem details. |
| P1-06 | A dashboard reflects actual server state.                             | Browser smoke test loads database-backed metadata and submits preflight through the gateway; service failure displays an error, not mock health.                                                        |
| P1-07 | Verification is reproducible.                                         | Formatting, Java compilation, TypeScript build, backend unit/integration tests, frontend unit tests, and browser/API smoke tests pass using the same command configured in CI.                          |
| P1-08 | Local exposure and approvals are bounded.                             | Only web port 18110 is published, bound to 127.0.0.1; PostgreSQL and API have no host ports; no worker, external AI, cloud, real-data, or PR operations occur.                                          |

Health endpoints are operationally public within this local stack. Preflight is
also intentionally unauthenticated because it is non-executing and non-persistent.
This exception must not extend to future task mutations.

## Future MVP contract (not implemented in Phase 1)

- Submit, inspect, and cancel tasks with tenant-bound authorization.
- Durably transition through `queued`, `leased`, `running`,
  `verification_pending`, `succeeded`, `failed`, and `cancelled`.
- Use bounded retries and fencing tokens so stale workers cannot write.
- Checkpoint task state, commit references, and bounded tool-output artifacts.
- Enforce compute, wall-clock, memory, and token budgets.
- Run verification before publishing PR evidence; require human review.

Representative task routes remain `POST /agent-tasks`,
`GET /agent-tasks/{id}`, and `POST /agent-tasks/{id}/cancel`.

## Non-goals

No production or multi-region deployment; no public SaaS; no arbitrary untrusted
code execution; no real customer repository access; no automatic merges; no
model training; no Kafka/Redis just to complete a stack checklist; no invented
benchmark, recovery, isolation, or cost results.

## Later measurable gates

The Phase 6 evaluation must run 20 concurrent synthetic tasks with no cross-tenant
file access, demonstrate recovery from the last safe checkpoint after worker
interruption, and report measured compute/token cost per validated task.
Those numbers are **not measured or claimed in Phase 1**.
