# Architecture decisions

## ADR-001: Preserve the playbook stack

Use Java 21, Spring Boot 3.5.16, React with strict TypeScript, PostgreSQL 17, and
Docker Compose. Spring Boot 3.5.16 was confirmed in Maven Central's published
3.5 release metadata during initialization. Dependency manifests and the npm
lockfile will record exact application dependencies.

Use Node 22 in build containers. Host Node 14 is unsuitable and Java is absent
from PATH; do not replace host runtimes. Docker is installed and the user
started its engine. Container images may receive patch updates within their
declared families; release-image digest pinning is a later packaging task.

The official `create-vite@9.3.4` React/TypeScript scaffold selects Vite 8,
React 19, TypeScript 7, and Oxlint. Retain that compatible toolchain rather than
replacing its linter with the originally considered ESLint. Add Prettier,
Vitest, runtime response validation, and Playwright for the required gates.

## ADR-002: Prove the skeleton without premature task APIs

Use a database-backed system metadata endpoint plus a non-persistent configuration
preflight. This proves routing, JSON contracts, request validation, migrations,
database connectivity, and UI behavior without inventing a partial durable
task engine. The representative task routes begin in Phase 2.

Preflight's response always explicitly states that execution is disabled.

## ADR-003: PostgreSQL is authoritative; defer optional infrastructure

Use Flyway for schema ownership. Phase 1 creates only installation metadata.
Redis and Kafka have no demonstrated requirement yet and are not started.
This avoids introducing dual state stores or non-transactional event writes.

## ADR-004: Local-only access, future identity boundary

Publish only the web gateway on `127.0.0.1:18110`; proxy the API and health paths
through it. No host API/database ports. Development and verification use separate
Compose project names (`replicas` and `replicas-check`); verification publishes
no ports. This avoids collisions with other concurrent project sessions.

Authentication is deliberately absent from non-executing Phase 1 routes.
An identity provider and tenant/role contract must be selected and tested before
Phase 2 exposes task operations. Do not silently treat a request header as proof
of identity.

## ADR-005: Project-scoped operational safety

The user approved initializing a local Git repository on `main`, not committing
or publishing. Generate local credentials without printing them. Keep source,
configuration, test reports, and local credential files within this repository.
Docker owns images and named volumes as part of the approved local runtime.

Only operate on this project's Compose resources. Do not run global cleanup,
delete data volumes, restart Docker Desktop, or change sibling projects.

## ADR-006: Verification before completion

The same PowerShell command runs local and CI checks in containers.
Use real PostgreSQL for integration and smoke tests; do not substitute an
in-memory database. Browser tests exercise the built UI through the gateway.
The verification project is separate from the user's development stack.
CI configuration is not evidence that a hosted CI run has passed.
