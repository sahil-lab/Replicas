# Engineering conventions

## Scope and gates

Use [docs/PLAN.md](docs/PLAN.md) as the phase ledger. Make small, coherent vertical
slices. Requirements and interfaces precede their implementation. Update the
contract, tests, and relevant documentation together.

Use Java 21 and Spring Boot 3 for orchestration. Use strict TypeScript for the
web application. Containerized tooling is the supported baseline; do not change
host runtime versions to make this repository build.

## Code

- Java: constructor injection, immutable request/response records, Bean
  Validation at the HTTP boundary, explicit domain errors, and Google Java
  Format through Spotless. Do not return success-shaped fallback responses.
- TypeScript: strict checking, runtime validation at the network boundary,
  accessible controls, explicit loading/error states, Oxlint, and Prettier.
- SQL: ordered Flyway migrations. Never edit an applied migration. Review
  destructive changes and document recovery before running them.
- HTTP: document endpoints in the OpenAPI contract. Errors use RFC 9457 problem
  details without rejected values, secrets, or stack traces.
- Logs: structured JSON, request correlation, status and latency. Never log
  request bodies, credentials, repository contents, or generated code.
- Configuration: environment variables at runtime; no embedded credentials.
  Keep local secret files, build output, caches, and test traces out of Git.
- Keep comments short and reserve them for non-obvious reasoning.

## Verification and change control

Run the documented `verify` command before claiming the phase gate passed.
It must include formatting, compilation/type checking, unit tests, PostgreSQL
integration tests, and a browser/API smoke test. CI uses the same command.
Report what actually ran, including failures and unexecuted checks.

Preserve unrelated changes. Do not commit or publish without a direct user
request. No unreviewed code merges. Do not delete volumes, use global Docker
prune commands, or stop other projects' containers.
