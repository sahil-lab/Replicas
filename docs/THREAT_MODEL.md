# Threat model and approval boundaries

This is a design document, not a penetration-test report or a claim that future
controls are implemented. Phase 1 accepts synthetic configuration only.

## Assets and trust boundaries

Future protected assets include repository contents, tenant identities, task
state, credentials, checkpoints, tool output, budgets, verification evidence,
and operator actions. Phase 1 stores only synthetic installation metadata.

Boundaries: browser to gateway; gateway to API; API to PostgreSQL; eventually
orchestrator to worker, worker to agent/tools, and evidence to a code-host API.
Docker daemon access is host-equivalent administrative access.

## Threats and controls

| Threat                                 | Phase 1 control                                                                                 | Required before the relevant future capability                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Unauthorized task/data access          | No task endpoints or customer data; loopback-only gateway; API/DB not published.                | Verified identity, tenant-scoped queries, role/permission checks, deny-by-default tests.      |
| Malformed or oversized configuration   | Strict JSON shape, length/range/type validation, gateway body-size limit, safe problem details. | Per-tenant rate limits and operation-specific quotas.                                         |
| SQL or shell injection                 | Parameter-safe data access; no user shell commands or task execution.                           | Fixed worker entrypoints, argument separation, path normalization and traversal tests.        |
| Secret disclosure                      | Generated ignored local credentials; no request-body logging; limited health exposure.          | Secret broker, scoped short-lived credentials, redaction, rotation and audited access.        |
| SSRF / network exfiltration            | Preflight does not fetch URLs or contact repositories.                                          | Default-deny worker egress and explicit destination policy.                                   |
| Container escape / host access         | No worker and no Docker socket in application containers.                                       | MicroVM isolation for untrusted production code; hardened trusted-local worker configuration. |
| Resource exhaustion                    | Bounded synthetic inputs and local container CPU/memory/PID limits.                             | Enforced job, token, output, disk and concurrency budgets; timeouts and cancellation.         |
| Stale workers / duplicate delivery     | No dispatch or leases yet.                                                                      | Fencing tokens, transactional state transitions, idempotency and duplicate-event tests.       |
| Misleading verification or PR evidence | No task-success claims or PR creation; observable test outcomes only.                           | Immutable evidence linkage, bounded test runner, human review; never automatic merges.        |
| Supply-chain compromise                | Exact dependency lockfile and pinned language/framework families; CI checks.                    | Dependency/image review, digest pinning, scanning and provenance before publication.          |

## Local permissions exception

Health, installation metadata, and read-only preflight are unauthenticated in
the development skeleton. This is acceptable only because they do not execute
work or expose real data and the gateway is loopback-bound.
Local users with Docker access are trusted; containers sharing this project's
network can reach its API. This is **not tenant isolation**.

Changing the bind address, adding task mutations, or accepting real repositories
requires a new authorization design and explicit approval. Do not generalize
the Phase 1 exception to later APIs.

## Approval rules

Ask before destructive migrations or volume deletion, production-affecting
operations, cloud spending/provisioning, real user/repository data, external AI
calls, code-host writes, or changes outside this project.
Do not commit, push, create remotes, or merge without explicit authorization.
All pull requests require human review; no unreviewed code merges.

## Evidence and residual risk

Validation, safe error responses, local exposure, health dependency behavior,
and startup are Phase 1 test targets. Worker isolation, tenant separation,
checkpoint recovery, budget enforcement, external-agent safety, supply-chain
hardening, and production deployment remain unimplemented and unverified.
