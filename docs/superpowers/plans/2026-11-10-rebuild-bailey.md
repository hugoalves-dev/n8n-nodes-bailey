# Bailey TypeScript Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore maintainable TypeScript sources for the recovered n8n Bailey node package and fix pairing/session lifecycle defects.

**Architecture:** Reconstruct source modules from checked-in declarations and compiled JavaScript while leaving the recovered `dist/` snapshot unchanged. Centralize session ownership in transport helpers and keep credential pairing responses separate from authenticated connection success.

**Tech Stack:** TypeScript, n8n node CLI, Jest, `@whiskeysockets/baileys`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-10-rebuild-bailey-design.md`

## Global Constraints

- The original TypeScript, tests, configuration, and Git history were not recovered.
- Preserve MIT attribution to jazarie2 / @jazario.
- Do not publish this package as `@jazario`; do not publish any version in this PR.
- Keep all v0.1.2 node operations and credential contracts.
- Never expose pairing/session secrets in logs.
- The real WhatsApp Docker integration is not available in this environment.

## Review Focus

- QR/pairing is returned once while the connection remains open: unit test credential-test lifecycle.
- Empty/incomplete credentials can retry: test `creds.registered`, not only file existence.
- Concurrent credential tests and triggers do not create duplicate sockets: test per-session acquisition.
- Idle timeout zero disables closure: fake-timer test.
- Proxy URL is validated and failures are actionable without credentials: test invalid URL and redacted errors.

---

### Task 1: Reconstruct source tree and package metadata

**Files:** Create TypeScript modules mirroring all `.js`/`.d.ts` paths under `dist/`; modify `package.json`; create `tsconfig.json`, lockfile, source/resource structure.

- [x] Inventory node resources, operations, and declarations against the recovered distribution.
- [x] Reconstruct editable TypeScript from the declaration contracts and compiled behavior; preserve the exact npm tarball and its file hashes under `upstream/0.1.2/` as the upstream reference.
- [x] Set fork package identity, author/provenance, pinned tool versions, scripts, and n8n entry points.
- [x] Confirm build emits the expected credential/node entry files.

### Task 2: Auth state and connection pool correctness

**Files:** `nodes/Bailey/transport/AuthStateStore.ts`, `ConnectionPool.ts`, `MessageCache.ts`; tests under `test/unit/transport/`.

- [x] Test session path isolation, persistence, and atomic credential writes.
- [x] Test that idle timeout zero schedules no timer and cleanup clears listeners/timers.
- [x] Test duplicate concurrent acquisitions return one socket.
- [x] Implement per-session acquisition, safe proxy parsing/error reporting, zero-timeout behavior, auth timeout, and teardown.

### Task 3: Pairing credential flow and trigger lifecycle

**Files:** `nodes/Bailey/BaileyTrigger.node.ts`, shared pairing helper if needed; tests under `test/unit/nodes/`.

- [x] Test pairing code requests on the unauthenticated QR update and deduplicate credential and trigger listeners.
- [x] Keep the socket alive after QR and pairing responses while authentication proceeds; bound unregistered sessions with an auth timeout.
- [x] Detect first auth from `creds.registered`, not file existence.
- [x] Implement phone validation, credential-test response UX, shared socket ownership, and listener cleanup.

### Task 4: CI, docs, and package verification

**Files:** `.github/workflows/ci.yml`, `README.md`, `UPSTREAM_README.md`, package docs and tests.

- [x] Document recovered baseline limits, attribution, migration, non-official WhatsApp constraints, and no automatic npm release.
- [x] Add deterministic CI for install, lint, typecheck, unit tests, build, and `npm pack --dry-run`.
- [x] Run available verification and inspect the packed package manifest and contents.
- [x] Record unavailable real-account Docker integration as a release follow-up, without claiming it passed.
