# n8n-nodes-bailey (recovered)

Recovery of the public npm release **`@jazario/n8n-nodes-bailey@0.1.2`** after the [upstream repository](https://github.com/jazarie2/n8n-nodes-bailey) became unavailable.

> **Provenance:** The files under `dist/`, the original `package.json`, and `UPSTREAM_README.md` are copied from the **published npm tarball**, without modifications. Original author/package: **jazarie2 / @jazario**. Original package metadata declares **MIT**. The recovery workflow verifies the npm registry's SHA-512 integrity checksum before extraction.

## What was recovered

- `dist/`: compiled JavaScript, declaration files, source maps, assets.
- `package.json`: original, unmodified npm metadata.
- `UPSTREAM_README.md`: original package documentation.

**Not recovered:** original TypeScript files, tests, build configuration, lockfile, and unpublished repository history. The published `.js.map` files do **not** contain `sourcesContent`. This is a **redistributable snapshot of the npm build**, not a restoration of the original source repository.

## Known issue

The published `BaileyTrigger.node.js` requests a pairing code on `connection === 'open'` while credentials are not yet registered. That event normally occurs *after* successful pairing, so a new session may never receive a pairing code. The credential test also ends the socket while reporting a QR/code prompt. **No fixes have been applied in this recovery commit.**

## Development and publication

The restored package still uses the upstream npm name `@jazario/n8n-nodes-bailey`; **do not republish under that name**. Before publishing a maintained fork, rename the package to a namespace you control, create a proper source project, correct pairing/reconnection/session handling, and validate on an isolated WhatsApp session.

To rerun the recovery, use [Recover published npm release](.github/workflows/recover-npm-release.yml) from GitHub Actions. The workflow does not execute any code from the npm package: it downloads, verifies, and copies files.

## Attribution

Original npm package: [@jazario/n8n-nodes-bailey](https://www.npmjs.com/package/@jazario/n8n-nodes-bailey) (v0.1.2, MIT), by **jazarie2**. This repository is an independent recovery/continuation and is not presented as the original author's repository.
