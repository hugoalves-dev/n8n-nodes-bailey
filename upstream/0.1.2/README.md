# n8n-nodes-bailey

[![CI](https://github.com/jazarie2/n8n-nodes-bailey/actions/workflows/ci.yml/badge.svg)](https://github.com/jazarie2/n8n-nodes-bailey/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@jazario/n8n-nodes-bailey.svg)](https://www.npmjs.com/package/@jazario/n8n-nodes-bailey)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

n8n community nodes for the [WhiskeySockets Baileys](https://github.com/WhiskeySockets/Baileys) WhatsApp Web API.

Connects n8n workflows directly to WhatsApp — no cloud gateway, no third-party service, no per-message fee. Runs entirely through a standard WhatsApp Linked Device session on your own server.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Authentication](#authentication)
  - [Credential fields](#credential-fields)
  - [Pairing Code (recommended)](#pairing-code-recommended)
  - [QR Code](#qr-code)
- [Nodes](#nodes)
  - [Bailey Trigger](#bailey-trigger)
  - [Bailey (Action)](#bailey-action)
- [Resources & Operations](#resources--operations)
  - [Message](#message)
  - [Chat](#chat)
  - [Group](#group)
  - [Community](#community)
  - [Contact](#contact)
  - [User](#user)
  - [Profile](#profile)
  - [Privacy](#privacy)
  - [Media](#media)
  - [Newsletter](#newsletter)
  - [Business](#business)
  - [Label](#label)
  - [Broadcast](#broadcast)
  - [Call](#call)
- [Connection Pooling](#connection-pooling)
- [E2E Tests](#e2e-tests)
- [Contributing](#contributing)
- [License](#license)

---

## Requirements

- **n8n** ≥ 1.0.0
- **Node.js** ≥ 18
- A WhatsApp account that can register a Linked Device

---

## Installation

### n8n Community Nodes UI

1. In n8n, go to **Settings → Community Nodes**.
2. Click **Install**.
3. Enter `@jazario/n8n-nodes-bailey` and click **Install**.

### Manual (self-hosted)

```bash
npm install @jazario/n8n-nodes-bailey
```

Restart n8n after installation.

---

## Authentication

### Credential fields

Create a **Bailey (WhatsApp) API** credential. All fields:

| Field | Default | Description |
|---|---|---|
| **Session ID** | `default` | Unique name for this WhatsApp session. Shared between Trigger and Action nodes. |
| **Phone Number** | — | International format, no `+` or spaces (e.g. `12025551234`). |
| **Auth Method** | `pairingCode` | `pairingCode` (recommended) or `qrCode`. |
| **Auth Data Path** | `~/.n8n/baileys` | Directory where session files (`creds.json`, signal keys) are stored. |
| **Sync Full History** | `false` | Request full message history on first connect (slow, usually not needed). |
| **Mark Online on Connect** | `true` | Show the account as online when the socket connects. |
| **Browser Name** | `n8n` | Label shown in WhatsApp → Linked Devices. |
| **Message Cache Size** | `1000` | In-memory LRU cache size. Used for poll vote decryption and message retries (100–10 000). |
| **Idle Timeout (Seconds)** | `30` | Seconds before an idle action-node connection auto-closes. `0` to disable. |
| **Proxy URL** | — | Optional HTTP/SOCKS proxy for the WebSocket connection (e.g. `http://proxy:3128`). |

### Pairing Code (recommended)

1. Add a **Bailey Trigger** node to your workflow and open it.
2. Select (or create) your credential with **Auth Method = Pairing Code**.
3. Click **Listen for event** (test mode) — the node logs an 8-digit code.
4. On your phone: **WhatsApp → Linked Devices → Link a Device → Link with Phone Number**.
5. Enter the 8-digit code. The session authenticates and `creds.json` is saved automatically.

### QR Code

Set **Auth Method = QR Code**, then check the n8n process logs for the QR code printed in your terminal. Scan it from your phone via **WhatsApp → Linked Devices → Link a Device**.

> **Persistence** — session files are stored under `Auth Data Path/<Session ID>/`. Back up this directory or mount it as a persistent volume when running n8n in Docker/Kubernetes.

---

## Nodes

### Bailey Trigger

Starts a persistent Baileys WebSocket and emits workflow executions whenever a selected WhatsApp event fires.

**Configuration:**

| Parameter | Description |
|---|---|
| **Credential** | The Bailey API credential to use. |
| **Events** | One or more events to listen for (or `*` for all events). |

**Available events (31 + wildcard):**

| Display Name | Event Key | Description |
|---|---|---|
| Message Received | `messages.upsert` | New or appended messages |
| Message Updated | `messages.update` | Status updates, poll votes, edits |
| Message Deleted | `messages.delete` | Messages deleted |
| Message Reaction | `messages.reaction` | Emoji reactions |
| Message Receipt | `message-receipt.update` | Read/delivery receipts |
| Media Updated | `messages.media-update` | Media re-upload results |
| Chat Created | `chats.upsert` | New chats |
| Chat Updated | `chats.update` | Chat metadata updates |
| Chat Deleted | `chats.delete` | Chats deleted |
| Chat Locked | `chats.lock` | Chat lock/unlock state |
| Contact Created | `contacts.upsert` | New contacts |
| Contact Updated | `contacts.update` | Contact updates |
| Presence Updated | `presence.update` | Online/offline/typing status |
| Group Created | `groups.upsert` | New groups joined |
| Group Updated | `groups.update` | Group metadata changes |
| Group Participants | `group-participants.update` | Members added/removed/promoted |
| Group Join Request | `group.join-request` | Join approval requests |
| Connection Updated | `connection.update` | WebSocket connection state |
| Call Received | `call` | Incoming call events |
| Credentials Updated | `creds.update` | Auth credentials changed (auto-saved) |
| History Sync | `messaging-history.set` | Full history sync data |
| Blocklist Set | `blocklist.set` | Full blocked contacts list |
| Blocklist Updated | `blocklist.update` | Contact blocked/unblocked |
| Label Edited | `labels.edit` | Business label created/edited |
| Label Association | `labels.association` | Label assigned/removed |
| Newsletter Reaction | `newsletter.reaction` | Newsletter message reaction |
| Newsletter View | `newsletter.view` | Newsletter view count update |
| Newsletter Participants | `newsletter-participants.update` | Newsletter admin changes |
| Newsletter Settings | `newsletter-settings.update` | Newsletter settings changed |
| Settings Updated | `settings.update` | App settings sync |
| LID Mapping | `lid-mapping.update` | Linked identity mapping update |
| `*` (all) | — | Every event above |

The trigger also registers its socket in the **connection pool** so subsequent Bailey Action nodes in the same workflow share the same authenticated session without re-connecting.

### Bailey (Action)

Executes WhatsApp operations on demand. Supports `continueOnFail`. Can be used as a **Tool** in n8n AI Agent workflows (`usableAsTool: true`).

---

## Resources & Operations

JIDs (WhatsApp IDs) follow these formats:
- Individual: `1234567890@s.whatsapp.net`
- Group: `1234567890-1234567890@g.us`
- Newsletter: `1234567890@newsletter`

### Message

| Operation | Description |
|---|---|
| `sendText` | Send a plain text message, optionally with `@mentions` |
| `sendImage` | Send an image from a URL or binary data, with optional caption |
| `sendVideo` | Send a video from a URL or binary data, with optional caption |
| `sendAudio` | Send an audio file; set `ptt: true` for voice notes |
| `sendDocument` | Send a file with a filename and MIME type |
| `sendSticker` | Send a WebP sticker |
| `sendGif` | Send a looping GIF video |
| `sendLocation` | Send a GPS location with optional name and address |
| `sendContact` | Send a vCard contact |
| `sendPoll` | Send a poll with up to 12 options |
| `sendReaction` | React to a message with an emoji |
| `sendProduct` | Send a WhatsApp Business product card |
| `sendEvent` | Send a WhatsApp event invitation |
| `sendViewOnce` | Send a view-once image |
| `sendVideoNote` | Send a circular video note (PTV) |
| `sharePhoneNumber` | Share your phone number with a contact |
| `pinMessage` | Pin or unpin a message in a chat |
| `forward` | Forward a message to another JID |
| `edit` | Edit a previously sent message |
| `deleteForEveryone` | Delete a message for all participants |
| `deleteForMe` | Remove a message from your view only |

### Chat

| Operation | Description |
|---|---|
| `archive` | Archive a chat |
| `unarchive` | Unarchive a chat |
| `mute` | Mute a chat for a specified duration |
| `unmute` | Unmute a chat |
| `markRead` | Mark a chat as read |
| `markUnread` | Mark a chat as unread |
| `pin` | Pin a chat |
| `unpin` | Unpin a chat |
| `deleteChat` | Delete a chat |
| `clearChat` | Clear all messages in a chat |

### Group

| Operation | Description |
|---|---|
| `create` | Create a new group |
| `getMetadata` | Fetch group metadata (name, description, participants) |
| `getAllParticipating` | List all groups the session belongs to |
| `updateSubject` | Rename the group |
| `updateDescription` | Update the group description |
| `updateSettings` | Set announcement / locked mode |
| `addParticipants` | Add participants |
| `removeParticipants` | Remove participants |
| `promoteParticipants` | Promote participants to admin |
| `demoteParticipants` | Demote admins to regular members |
| `leave` | Leave the group |
| `getInviteCode` | Get the current invite link code |
| `revokeInvite` | Revoke and regenerate the invite code |
| `acceptInvite` | Join a group by invite code |
| `getInviteInfo` | Get group info from an invite code without joining |
| `toggleEphemeral` | Enable/disable disappearing messages |
| `setMemberAddMode` | Control whether members or only admins can add members |
| `setJoinApprovalMode` | Require admin approval for join requests |

### Community

| Operation | Description |
|---|---|
| `create` | Create a new community |
| `getMetadata` | Fetch community metadata |
| `createGroup` | Create a sub-group inside the community |
| `linkGroup` | Link an existing group to the community |
| `unlinkGroup` | Unlink a group from the community |
| `fetchLinkedGroups` | List all groups linked to the community |
| `updateSubject` | Rename the community |
| `updateDescription` | Update the community description |
| `updateSettings` | Update community settings |
| `addParticipants` | Add participants to the community |
| `removeParticipants` | Remove participants |
| `leave` | Leave the community |
| `getInviteCode` | Get the community invite code |
| `toggleEphemeral` | Enable/disable disappearing messages |
| `setJoinApprovalMode` | Require approval for join requests |
| `getAllParticipating` | List all communities the session belongs to |

### Contact

| Operation | Description |
|---|---|
| `addOrEdit` | Add or update a contact in the address book |
| `remove` | Remove a contact |
| `requestPhoneNumber` | Request a contact to share their phone number |

### User

| Operation | Description |
|---|---|
| `checkExists` | Check if a phone number is on WhatsApp |
| `getStatus` | Get a user's status text |
| `getProfilePicture` | Get a user's profile picture URL |
| `getBusinessProfile` | Fetch WhatsApp Business profile details |
| `subscribePresence` | Subscribe to online/typing presence updates |
| `sendPresence` | Broadcast your own presence to a JID |
| `fetchDisappearingDuration` | Get the default disappearing message duration |
| `fetchMessageHistory` | Request older message history for a chat |

### Profile

| Operation | Description |
|---|---|
| `updateStatus` | Update your status text |
| `updateName` | Update your display name |
| `updatePicture` | Upload a new profile picture |
| `removePicture` | Remove your profile picture |
| `setDisappearing` | Set the global disappearing message default |

### Privacy

| Operation | Description |
|---|---|
| `getSettings` | Get current privacy settings |
| `getBlocklist` | List all blocked contacts |
| `block` | Block a contact |
| `unblock` | Unblock a contact |
| `updateLastSeen` | Control who can see your last seen |
| `updateOnline` | Control who can see your online status |
| `updateProfilePicture` | Control who can see your profile picture |
| `updateReadReceipts` | Enable/disable read receipts |
| `updateCallPrivacy` | Control who can call you |
| `updateGroupsAdd` | Control who can add you to groups |

### Media

| Operation | Description |
|---|---|
| `download` | Download media from a message to n8n binary data |
| `reupload` | Re-upload expired media so it can be sent again |

### Newsletter

| Operation | Description |
|---|---|
| `create` | Create a new newsletter |
| `getMetadata` | Fetch newsletter metadata |
| `follow` | Follow a newsletter |
| `unfollow` | Unfollow a newsletter |
| `mute` | Mute a newsletter |
| `unmute` | Unmute a newsletter |
| `updateName` | Update the newsletter name |
| `updateDescription` | Update the newsletter description |
| `updatePicture` | Upload a newsletter picture |
| `removePicture` | Remove the newsletter picture |
| `reactMessage` | React to a newsletter message |
| `fetchMessages` | Fetch newsletter messages |
| `getSubscribers` | Get the subscriber list |
| `delete` | Delete the newsletter |

### Business

| Operation | Description |
|---|---|
| `getCatalog` | Fetch the product catalog |
| `getCollections` | List product collections |
| `getOrderDetails` | Fetch order details by order ID |
| `createProduct` | Create a new product listing |
| `updateProduct` | Update an existing product |
| `deleteProducts` | Delete one or more products |
| `updateProfile` | Update the Business profile (address, category, email, website) |
| `updateCoverPhoto` | Upload a Business cover photo |

### Label

| Operation | Description |
|---|---|
| `setLabels` | Replace all labels on a chat |
| `addChatLabel` | Add a label to a chat |
| `removeChatLabel` | Remove a label from a chat |
| `addMessageLabel` | Add a label to a specific message |
| `removeMessageLabel` | Remove a label from a specific message |

### Broadcast

| Operation | Description |
|---|---|
| `sendBroadcast` | Send a message to multiple JIDs simultaneously |
| `sendStory` | Send a WhatsApp Story (status update) |

### Call

| Operation | Description |
|---|---|
| `reject` | Reject an incoming call |
| `createLink` | Create a WhatsApp call link |

---

## Connection Pooling

A module-scoped connection pool (`Map<sessionId, ConnectionEntry>`) is shared between the Trigger and Action nodes:

- **Trigger** establishes the socket during workflow activation and registers it in the pool.
- **Action nodes** reuse the registered socket, avoiding a second authentication round-trip.
- **Without a Trigger** (action-only mode), Action nodes create their own connection, which auto-closes after the configured idle timeout.
- **Auto-reconnect**: on unexpected disconnection, the pool waits 3 seconds and re-creates the connection. A clean logout (status 401) removes the session without retrying.
- Idle timers call `.unref()` so Node.js exits cleanly when no other work is pending.

---

## E2E Tests

E2E tests require a real authenticated WhatsApp session and are run **manually via GitHub Actions** (`workflow_dispatch`).

### Running locally

```bash
# 1. Authenticate a session first (run the Trigger once in n8n, or use the Baileys CLI)
# 2. Set environment variables
export E2E_SESSION_ID=e2e-test
export E2E_AUTH_PATH=.baileys-sessions
export E2E_TARGET_JID=1234567890@s.whatsapp.net  # your test contact
export E2E_GROUP_JID=1234567890-1234567890@g.us   # optional, for group tests

# 3. Run
npm run test:e2e
```

### CI setup (GitHub Actions)

Add the following secrets to your repository:

| Secret | Description |
|---|---|
| `E2E_CREDS_JSON` | Contents of `.baileys-sessions/e2e-test/creds.json` |
| `E2E_TARGET_JID` | WhatsApp JID of the test contact |
| `E2E_GROUP_JID` | *(optional)* WhatsApp group JID for group tests |

The workflow is in `.github/workflows/e2e.yml` and must be triggered manually. Optionally pass `test_filter` to run a single suite (e.g. `send-message`).

### Test suites

| Suite | File | Coverage |
|---|---|---|
| Send Message | `test/e2e/send-message.e2e.ts` | sendText, mention, location, contact, poll, delete, reaction, roundtrip |
| Group Operations | `test/e2e/group-operations.e2e.ts` | create, metadata, subject, description, invite, settings, ephemeral, leave |
| Chat Operations | `test/e2e/chat-operations.e2e.ts` | archive, mute, pin, markRead, presence, read receipt |

---

## Contributing

```bash
git clone https://github.com/jazarie2/n8n-nodes-bailey.git
cd n8n-nodes-bailey
npm install

npm run build          # compile TypeScript
npm run lint           # ESLint
npm test               # unit tests
npm run test:integration  # integration tests
```

PRs and issues welcome.

---

## License

[MIT](LICENSE)
