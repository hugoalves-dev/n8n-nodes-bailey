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

All upstream action and trigger operations remain available. Add **Bailey Auth** to a manual workflow. The default **Start Pairing** operation returns the pairing code immediately in the JSON output, or a scannable QR image in the Binary tab. The WebSocket stays alive for up to five minutes while you pair; use **Check Status** to verify a registered, open connection. **Wait for Authentication** preserves the old blocking/logging behavior. Pairing codes and QR images are temporary secrets: restrict execution history and logs, and clear them after pairing. The Bailey Trigger continues to emit `pairing.code` during manual listening.

After a QR scan, Baileys v7 may emit `connection: open` without setting `creds.registered`. The pool now treats that server-confirmed login as registered, persists the flag and clears the pairing timeout; a QR or `isNewLogin` event by itself is not sufficient. The connection pool is process-local; Start Pairing and Check Status must run in the same long-lived n8n process. Independent queue workers cannot share that pool. A `401/loggedOut` indicates a rejected session requiring fresh pairing, not an automatic retry; isolate or back up the previous session first. After successful pairing, `515/restartRequired` normally requires recreating the socket with saved credentials; keep-alive now survives that reconnection. Live WhatsApp integration testing is still required.

**Check Status** also reports `triggerSubscriptions.registered` and `triggerSubscriptions.bound` for this session in the current n8n process. A bound subscription is attached to the active socket; it does not prove that WhatsApp delivered events or that a workflow processed them. In multi-process installations, this status reflects only the process executing the status node. A reconnect does not guarantee recovery of messages missed while disconnected; history sync may be partial or unavailable.

The **History Sync** event can be selected in Bailey Trigger. **User → Fetch Message History** requires a known message key (`remoteJid`, `id`, `fromMe`) and a positive Unix timestamp. It requests history asynchronously; results arrive through `messaging-history.set` and can be partial or absent. The caller must persist cursors, deduplicate and handle incomplete recovery; requesting history does not guarantee recovery or downstream notification.

### Durable message recovery (opt-in)

Enable **Durable Message Recovery** on a saved Bailey Trigger configured for **Message Received** or **All Events**. The Trigger stores messages received from `messages.upsert` and `messaging-history.set` before emitting them and deduplicates by session, workflow, trigger, conversation, message ID, direction and participant. The `_recovery` object reports the trigger ID and origin; pending entries also include the time and original source. Only data actually delivered by WhatsApp can be stored. History requests are complementary and may be incomplete or unavailable; the node does not automatically retrieve all messages missed during an outage.

At the end of successful processing, use **Bailey → Recovery → Acknowledge Message** for each message, passing `_recovery.triggerId` and the message's complete `key`. The Recovery resource also exposes **Get Pending Messages** and **Get Cursors**. On activation the Trigger re-emits unacknowledged messages in batches of at most 25. A failed workflow or a crash can cause re-emission; acknowledgement does not establish exactly-once delivery, and a crash after an external notification but before acknowledgement can still duplicate that notification. The downstream workflow owns notification idempotency, rate limiting and aggregation.

The recovery journal stores message content in local files under the configured session directory until acknowledgement, when content is removed from the current journal; identity metadata is retained to prevent replays. Files use restrictive permissions but are not encrypted by this package. Protect and back up the persistent volume, account for execution history and filesystem snapshots, and monitor storage growth. The store is local to the filesystem; all participating processes must share the same persistent directory and support filesystem locking. It does not guarantee cluster-wide coordination on filesystems without reliable atomic rename and locking. Use a test session, not production data, to validate the workflow.

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

When a changed `package.json` is merged into `main`, `.github/workflows/release-on-main.yml` creates the matching `vX.Y.Z` GitHub release and dispatches `publish-npm.yml` on that tag. The npm workflow runs lint, type-checking, tests, build, and `npm pack --dry-run`, then verifies that the tag matches `package.json` before publishing. Releases use npm Trusted Publishing (GitHub OIDC); no npm token or GitHub secret is required. npm also creates provenance for this trusted publish.

### One-time npm setup

1. Make sure the `@hugoalves-dev` scope is owned by your npm account and that you can publish public scoped packages.
2. If `@hugoalves-dev/n8n-nodes-bailey` is not yet present on npm, publish the initial version once from the repository after merging the publishing setup and publish-hook fix: use Node.js 24, run `npm ci`, log in with `npm login`, then run `npm publish --access public` (the `prepublishOnly` hook builds the package). If the package already exists, skip this step.
3. In the package settings on npmjs.com, add a **Trusted Publisher** with provider **GitHub Actions**, owner `hugoalves-dev`, repository `n8n-nodes-bailey`, and workflow filename `publish-npm.yml`. Leave the environment blank; this workflow does not use a GitHub Environment. Save it and trigger a successful publish within two days, or npm expires the new trust configuration.
4. No `NPM_TOKEN` secret is needed. The workflow requests the OIDC token with the narrowly scoped `id-token: write` permission.

### Releasing a version

Update `version` in both `package.json` and `package-lock.json`, validate the pull request CI, then merge to `main`. The version-bump workflow creates the GitHub release and dispatches trusted npm publishing. The npm workflow rejects a tag when its version does not match `package.json`. Check the **Actions** tab for both the release and publish runs.

If automatic publishing needs to be recovered, run **Publish to npm** manually on the existing version tag via GitHub Actions. Do not re-publish an already published npm version.
