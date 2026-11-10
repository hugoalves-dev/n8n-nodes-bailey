# n8n-nodes-bailey

An independently maintained reconstruction of the Bailey n8n community node, based on the published `@jazario/n8n-nodes-bailey@0.1.2` distribution.

## Provenance

The exact upstream npm tarball, published metadata, and README are preserved under [`upstream/0.1.2/`](upstream/0.1.2/). `CONTENTS.sha512` records hashes for the extracted package files, while `SHA512SUMS` verifies the archived tarball. The recovery workflow verifies the registry integrity before updating this snapshot.

The original TypeScript, tests, build configuration, lockfile, and Git history were not recovered. The `.js.map` files contain no `sourcesContent`. The TypeScript files in `credentials/` and `nodes/` are a manual reconstruction from the npm JavaScript and declarations; they are not represented as recovered original source.

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

All upstream action and trigger operations remain available. New QR or pairing-code prompts are shown by the credential test, which keeps the unauthenticated socket alive for scanning. The trigger shares that socket and requests a pairing code at the pre-authentication QR update. During manual listening, the trigger emits the code as a `pairing.code` event so it is visible in n8n; keep that execution private and remove it after pairing. The code is not written to server logs or auth files.

Authentication files are stored below `~/.n8n/baileys/<sessionId>` by default. In Docker, mount the configured auth directory as a persistent volume. The `sessionId` must be a single path segment; use the same value in credentials shared by a trigger and action node. Set **Idle Timeout (Seconds)** to `0` to disable idle cleanup.

For migration from the legacy package, preserve and back up its session directory before changing package names or auth paths. Use the same session ID and point **Auth Data Path** at the existing directory. Do not remove the old directory; Baileys updates auth files as the session changes.

## Compatibility and limitations

- This node uses `@whiskeysockets/baileys` to connect to WhatsApp Web. It is not an official WhatsApp API integration; WhatsApp can change the protocol, disconnect linked devices, or restrict accounts.
- The package includes QR pairing, phone-number pairing code, existing sessions, message events, and the action operations represented in the v0.1.2 distribution.
- Real WhatsApp integration tests require a dedicated, non-production account and a disposable n8n environment. Unit tests do not claim to verify live pairing, volume behavior in Docker, or message delivery.
- Do not use a production WhatsApp session to validate changes.

## License and attribution

MIT. See [LICENSE](LICENSE) and the preserved original npm distribution under `upstream/0.1.2/`.
