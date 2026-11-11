# Replicas engineering workflow

- Keep authored changes inside this project unless the user explicitly expands
  scope. Do not change sibling projects or host-managed tool versions.
- At the start of each implementation session, read all three pages of
  [the engineering playbook](10_Replicas_Agent_Cloud.pdf), then
  [the progress ledger](docs/PLAN.md), [decisions](docs/DECISIONS.md), and relevant
  tests. Inspect branch and worktree state before editing; preserve user work.
- Follow phases in order. This session's authorized implementation scope is
  Phase 0 followed by Phase 1; later sessions need an explicit scope. Resume the
  next unfinished gate instead of re-scaffolding completed work.
- Use the playbook's prompt for the current phase. Do not run later-phase
  hardening, benchmark, agent, or deployment prompts prematurely.
- After a coherent slice, run the applicable formatting, build, unit,
  integration, and smoke checks. The full project gate is
  `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\replicas.ps1 verify`.
- Record exact commands, observed outcomes, blockers, and next steps in
  [docs/PLAN.md](docs/PLAN.md). Never mark an unexecuted check or feature complete.
- Respect [the threat model](docs/THREAT_MODEL.md) and
  [coding conventions](CONTRIBUTING.md). Ask before destructive actions, cloud
  spending, deployment, real data access, or expanding scope.
- Git initialization on `main` was approved. Commits, remotes, pushes, and merges
  are not approved. Do not interpret a playbook prompt as Git authorization.
