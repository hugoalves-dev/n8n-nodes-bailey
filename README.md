# n8n-nodes-bailey

An independently maintained reconstruction of the Bailey n8n community node, based on the published `@jazario/n8n-nodes-bailey@0.1.2` distribution.

## Provenance

The upstream package was authored by **jazarie2 / @jazario** and is MIT licensed. This fork preserves that attribution and the license. It uses the separate package identity `@hugoalves-dev/n8n-nodes-bailey`; this repository does not publish the upstream package.

## Development

Requirements: Node.js 22 and npm.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

All upstream action and trigger operations remain available. Pairing codes are returned as plain text by the credential test, which keeps the unauthenticated socket alive while pairing. For QR authentication, listen manually with Bailey Trigger and use the emitted `auth.qr` output payload; the credential test UI does not render QR images. The trigger shares that socket and requests a pairing code at the pre-authentication QR update. During manual listening, the trigger emits the code as a `pairing.code` event so it is visible in n8n; keep that execution private and remove it after pairing. The code is not written to server logs or auth files.

Authentication files are stored below `~/.n8n/baileys/<sessionId>` by default. In Docker, mount the configured auth directory as a persistent volume. The `sessionId` must be a single path segment; use the same value in credentials shared by a trigger and action node. Set **Idle Timeout (Seconds)** to `0` to disable idle cleanup.

For migration from the legacy package, preserve and back up its session directory before changing package names or auth paths. Use the same session ID and point **Auth Data Path** at the existing directory. Do not remove the old directory; Baileys updates auth files as the session changes.

## Compatibility and limitations

- This node uses `@whiskeysockets/baileys` to connect to WhatsApp Web. It is not an official WhatsApp API integration; WhatsApp can change the protocol, disconnect linked devices, or restrict accounts.
- The package includes QR pairing, phone-number pairing code, existing sessions, message events, and the action operations represented in the v0.1.2 distribution.
- Real WhatsApp integration tests require a dedicated, non-production account and a disposable n8n environment. Unit tests do not claim to verify live pairing, volume behavior in Docker, or message delivery.
- Do not use a production WhatsApp session to validate changes.

## License and attribution

MIT. See [LICENSE](LICENSE) and the preserved original npm distribution under `upstream/0.1.2/`.

## Publishing to npm

The GitHub Actions release workflow publishes `@hugoalves-dev/n8n-nodes-bailey` when a version tag (`vX.Y.Z`) is pushed. It runs lint, type-checking, tests, build, and `npm pack --dry-run`, then verifies that the tag matches `package.json` before publishing. Releases use npm Trusted Publishing (GitHub OIDC); no npm token or GitHub secret is required. npm also creates provenance for this trusted publish.

### One-time npm setup

1. Make sure the `@hugoalves-dev` scope is owned by your npm account and that you can publish public scoped packages.
2. If `@hugoalves-dev/n8n-nodes-bailey` is not yet present on npm, publish the initial version once from the repository after merging the publishing setup and publish-hook fix: use Node.js 24, run `npm ci`, log in with `npm login`, then run `npm publish --access public` (the `prepublishOnly` hook builds the package). If the package already exists, skip this step.
3. In the package settings on npmjs.com, add a **Trusted Publisher** with provider **GitHub Actions**, owner `hugoalves-dev`, repository `n8n-nodes-bailey`, and workflow filename `publish-npm.yml`. Leave the environment blank; this workflow does not use a GitHub Environment. Save it and trigger a successful publish within two days, or npm expires the new trust configuration.
4. No `NPM_TOKEN` secret is needed. The workflow requests the OIDC token with the narrowly scoped `id-token: write` permission.

### Releasing a version

Update `version` in both `package.json` and `package-lock.json`, commit and push that change, then create and push the matching tag. For example, if the package version is `0.2.1`:

```sh
git tag v0.2.1
git push origin v0.2.1
```

The workflow rejects a tag when its version does not match `package.json`. Check the **Actions** tab for the validation and publish result.
