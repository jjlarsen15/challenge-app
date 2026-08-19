# AGENTS.md

## Cursor Cloud specific instructions

### Current repository state

This repository is currently an **empty "challenge app" starter**. The only content is `readme.md`.
There is no application code, no dependency manifests (no `package.json`, `requirements.txt`,
`go.mod`, `Cargo.toml`, etc.), no services, and no build/lint/test/run scripts yet. A tech stack
has not been chosen.

Because there is no application, there is nothing to build, run, lint, or test until the challenge
app is created.

### Pre-installed toolchains

The Cloud Agent VM already ships with these runtimes/package managers (no install step needed):

- Node.js `v22` (`npm`, `pnpm`, `yarn` available)
- Python `3.12` (`pip3` available)
- Go `1.22`
- Rust/Cargo `1.83`
- Java (OpenJDK) `21`
- `git`

`docker` is **not** installed by default. If the app ends up needing containers, install Docker
during environment setup (not in the update script).

### Update script (dependency refresh on startup)

The configured update script is a guarded, idempotent detector: it installs dependencies only when
a recognized manifest/lockfile is present (`pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` /
`package.json`, and `uv.lock` / `poetry.lock` / `Pipfile.lock` / `requirements.txt`). On the current
empty repo it is a safe no-op.

### Guidance once a stack is chosen

When the challenge app is created and a stack + dependency manifests are added:

- The existing guarded update script already covers common Node and Python setups. If you pick a
  different stack (Go, Rust, Java, etc.) or a custom install flow, update the Cloud Agent update
  script accordingly (keep it minimal, idempotent, and dependency-refresh only — no service startup).
- Add dev-server / long-running processes to `start` or `terminals`, not to the update script.
- Document the concrete lint/test/build/dev commands here once they exist, or point to the
  authoritative source (`package.json` scripts, `Makefile`, etc.) instead of duplicating them.
