# Bailey TypeScript Reconstruction Design

## Intent

Rebuild an editable TypeScript project from the verifiable `@jazario/n8n-nodes-bailey@0.1.2` npm distribution and repair pairing/session lifecycle defects so the fork can be maintained and tested.

## Goals and constraints

- Preserve the exact recovered npm tarball and extracted file hash manifest under `upstream/0.1.2/`; use root `dist/` for reproducible build output. Do not claim recovered original TypeScript, tests, or history.
- Preserve MIT attribution to jazarie2 / @jazario and identify this repository as a manual reconstruction.
- Recreate all credential, action, trigger, operation, description, and transport modules represented in the distribution.
- Make QR/pairing code available to the n8n credential UI while the unauthenticated socket remains alive until registration or a real timeout.
- Serialize socket ownership per `sessionId`, handle incomplete credentials, clean listeners/timers, and honor idle timeout zero.
- Never write pairing codes or QR secrets to files or server logs; pairing UI responses may display the ephemeral value.
- Pin supported tool/runtime dependencies and add CI; do not publish to npm in this change.
- Real WhatsApp/n8n Docker integration requires an isolated external test account and is not asserted by unit tests.

## Approaches

1. Keep only the compiled artifact and patch generated JavaScript: smallest diff, but fails the maintainable-source goal.
2. Reconstruct the TypeScript tree from declarations, source-map paths, and compiled behavior, preserving the tarball and hash manifest: selected because root `dist/` can be rebuilt while upstream evidence remains byte-for-byte recoverable.

## Implementation decisions

Keep existing public node and credential names and all v0.1.2 operations. Use `@hugoalves-dev/n8n-nodes-bailey` as the fork identity (the npm lookup returned 404; no release is performed). Pairing output is returned as actionable HTML in the credential-test response; its message clearly says pairing is pending, and the response does not close the socket. Reconnection, credential testing, and trigger startup share a per-session connection pool.

## Acceptance

TypeScript source, deterministic scripts/lockfile, CI, tests for auth persistence and lifecycle regressions, valid build/package entries, and documentation of provenance, migration, compatibility, and non-official WhatsApp limitations.
