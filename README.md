# Elastic Cloud Coding-Agent Orchestrator

An original, local engineering prototype inspired by the public product area of
Replicas. This project is independent and is not affiliated with Replicas or
based on private company systems.

**Status: Phase 0 and Phase 1 are implemented and locally verified.** The implementation and verification ledger
is [docs/PLAN.md](docs/PLAN.md). A scaffold is not a completed task orchestrator.

## Product

Long-running coding agents need durable execution, recovery, isolation, and cost
control. The eventual MVP will schedule tasks, lease isolated workers, save safe
checkpoints, enforce budgets, run verification, and prepare evidence for
human-reviewed pull requests.

Phase 1 is deliberately smaller: a Java 21 / Spring Boot 3 API, a React /
TypeScript dashboard, PostgreSQL migrations, health checks, and a **read-only
configuration preflight**. Preflight does not queue tasks, execute code, contact
repositories, or create pull requests.

## Local commands

Prerequisites: Git (optional for running), PowerShell 5.1+ or PowerShell 7, and a
running Docker engine with Docker Compose 2.24+. Linux containers are required.
Host Java, Maven, Node, and npm are not required or modified.

Run from this project directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\replicas.ps1 up
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\replicas.ps1 status
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\replicas.ps1 verify
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\replicas.ps1 down
```

On platforms with PowerShell 7, replace `powershell` with `pwsh`.
`up` builds and starts the local stack; the dashboard is
<http://localhost:18110>. Only the web gateway is published, on loopback.
`verify` uses a separate `replicas-check` Compose project with no published ports
and cleans up its containers afterward. It does not stop the development stack.
`down` stops this project's development containers without deleting data.

The script creates a random, local-only database credential in an ignored
environment file when needed. Do not print, share, or commit that file.
Docker images, build caches, and named volumes are managed by Docker; all
authored source and configuration stay inside this repository.

## Repository

```text
apps/web/           React dashboard and component tests
services/api/       Spring Boot API, migrations, Java tests
services/worker/    Reserved boundary; no worker is implemented in Phase 1
packages/contracts/ OpenAPI contract
infra/docker/      Local stack and containerized verification
tests/e2e/         Browser/API smoke tests
benchmarks/        Reserved for measured Phase 6 evaluation
docs/              Requirements, architecture, safety, decisions, progress
scripts/           Project-scoped PowerShell lifecycle commands
```

## Read next

- [Requirements and measurable acceptance](docs/PRD.md)
- [Architecture and interfaces](docs/ARCHITECTURE.md)
- [Threat model and approval boundaries](docs/THREAT_MODEL.md)
- [Phase plan and observed verification](docs/PLAN.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Coding and contribution conventions](CONTRIBUTING.md)
- [Verification and troubleshooting](docs/TESTING.md)
- [Original engineering playbook](10_Replicas_Agent_Cloud.pdf)

## Limitations

No worker, task state machine, authentication, tenant isolation, checkpoint
recovery, budget accounting, AI integration, or PR automation is implemented in
Phase 1. The local unauthenticated endpoints accept synthetic preflight data
only. Do not expose this stack to a network or use real user data.

Docker alone is **not** a hardened boundary for untrusted code. Production
execution requires a separately designed microVM boundary, identity, secrets
management, network policy, and security review. No production-readiness,
benchmark, or cost claims are made.
