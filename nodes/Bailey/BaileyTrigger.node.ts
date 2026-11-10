// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const QRCode = __importStar(require("qrcode"));
const n8n_workflow_1 = require("n8n-workflow");
const AuthStateStore_1 = require("./transport/AuthStateStore");
const MessageCache_1 = require("./transport/MessageCache");
const ConnectionPool_1 = require("./transport/ConnectionPool");
const PairingCoordinator_1 = require("./transport/PairingCoordinator");
const TransportPolicy_1 = require("./transport/TransportPolicy");
const ALL_EVENTS = [
    { name: 'Message Received', value: 'messages.upsert', description: 'New or appended messages' },
    { name: 'Message Updated', value: 'messages.update', description: 'Message status, poll votes, edits' },
    { name: 'Message Deleted', value: 'messages.delete', description: 'Messages deleted' },
    { name: 'Message Reaction', value: 'messages.reaction', description: 'Emoji reactions' },
    { name: 'Message Receipt', value: 'message-receipt.update', description: 'Read/delivery receipts' },
    { name: 'Media Updated', value: 'messages.media-update', description: 'Media re-upload results' },
    { name: 'Chat Created', value: 'chats.upsert', description: 'New chats' },
    { name: 'Chat Updated', value: 'chats.update', description: 'Chat metadata updates' },
    { name: 'Chat Deleted', value: 'chats.delete', description: 'Chats deleted' },
    { name: 'Chat Locked', value: 'chats.lock', description: 'Chat lock/unlock state' },
    { name: 'Contact Created', value: 'contacts.upsert', description: 'New contacts' },
    { name: 'Contact Updated', value: 'contacts.update', description: 'Contact updates' },
    { name: 'Presence Updated', value: 'presence.update', description: 'Online/offline/typing status' },
    { name: 'Group Created', value: 'groups.upsert', description: 'New groups joined' },
    { name: 'Group Updated', value: 'groups.update', description: 'Group metadata changes' },
    { name: 'Group Participants', value: 'group-participants.update', description: 'Members added/removed/promoted' },
    { name: 'Group Join Request', value: 'group.join-request', description: 'Join approval requests' },
    { name: 'Connection Updated', value: 'connection.update', description: 'WebSocket connection state' },
    { name: 'Call Received', value: 'call', description: 'Incoming call events' },
    { name: 'Credentials Updated', value: 'creds.update', description: 'Auth credentials changed (auto-saved)' },
    { name: 'History Sync', value: 'messaging-history.set', description: 'Full history sync data' },
    { name: 'Blocklist Set', value: 'blocklist.set', description: 'Full blocked contacts list' },
    { name: 'Blocklist Updated', value: 'blocklist.update', description: 'Contact blocked/unblocked' },
    { name: 'Label Edited', value: 'labels.edit', description: 'Business label created/edited' },
    { name: 'Label Association', value: 'labels.association', description: 'Label assigned/removed' },
    { name: 'Newsletter Reaction', value: 'newsletter.reaction', description: 'Newsletter message reaction' },
    { name: 'Newsletter View', value: 'newsletter.view', description: 'Newsletter view count update' },
    { name: 'Newsletter Participants', value: 'newsletter-participants.update', description: 'Newsletter admin changes' },
    { name: 'Newsletter Settings', value: 'newsletter-settings.update', description: 'Newsletter settings changed' },
    { name: 'Settings Updated', value: 'settings.update', description: 'App settings sync' },
    { name: 'LID Mapping', value: 'lid-mapping.update', description: 'Linked identity mapping update' },
];
class BaileyTrigger {
    constructor() {
        this.description = {
            displayName: 'Bailey Trigger',
            name: 'baileyTrigger',
            icon: {
                light: 'file:bailey.svg',
                dark: 'file:bailey.dark.svg',
            },
            group: ['trigger'],
            version: 1,
            description: 'Listens to WhatsApp events via Baileys WebSocket connection',
            eventTriggerDescription: 'Waiting for WhatsApp events...',
            defaults: {
                name: 'Bailey Trigger',
            },
            triggerPanel: {
                header: 'Listening for WhatsApp events',
                executionsHelp: {
                    inactive: '<b>While testing:</b> Click "Listen for event" to connect to WhatsApp and wait for a single event.',
                    active: '<b>While active:</b> Your workflow will execute each time the selected WhatsApp event occurs.',
                },
                activationHint: "Once you've finished building your workflow, activate it to start receiving WhatsApp events.",
            },
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'baileyApi',
                    required: true,
                    testedBy: 'baileyCredentialTest',
                },
            ],
            properties: [
                {
                    displayName: 'Event',
                    name: 'event',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        { name: 'All Events', value: '*', description: 'Trigger on any WhatsApp event' },
                        ...ALL_EVENTS.map((e) => ({
                            name: e.name,
                            value: e.value,
                            description: e.description,
                        })),
                    ],
                    default: '*',
                    description: 'Which WhatsApp event to listen for',
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Include Event Metadata',
                            name: 'includeMetadata',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to include event type and session ID in the output',
                        },
                        {
                            displayName: 'Only Real Messages',
                            name: 'onlyRealMessages',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to filter out system/stub messages and only emit real user messages (for messages.upsert event)',
                        },
                    ],
                },
            ],
            usableAsTool: true,
        };
        this.methods = {
            credentialTest: {
                async baileyCredentialTest(credential) {
                    const node = this.getNode();
                    const creds = credential.data;
                    const { sessionId, authDataPath, authMethod, phoneNumber } = creds;
                    const sessionDir = (0, AuthStateStore_1.sessionDirFromConfig)(authDataPath !== null && authDataPath !== void 0 ? authDataPath : '~/.n8n/baileys', sessionId);
                    const credsFile = path.join(sessionDir, 'creds.json');
                    let isFirstAuth = true;
                    try {
                        isFirstAuth = JSON.parse(fs.readFileSync(credsFile, 'utf8')).registered !== true;
                    }
                    catch { }
                    return new Promise((resolve) => {
                        let settled = false;
                        let sock;
                        let connectionUpdateHandler;
                        let pairingCodeRequested = false;
                        const done = (result) => {
                            var _a, _b;
                            if (settled)
                                return;
                            settled = true;
                            clearTimeout(timer);
                            if (sock && connectionUpdateHandler) {
                                sock.ev.off('connection.update', connectionUpdateHandler);
                            }
                            if (result.status !== 'OK') {
                                try {
                                    sock === null || sock === void 0 ? void 0 : sock.end(undefined);
                                }
                                catch { }
                                (0, ConnectionPool_1.deregisterSocket)(sessionId);
                            }
                            resolve(result);
                        };
                        const timer = setTimeout(() => {
                            done({
                                status: 'Error',
                                message: isFirstAuth
                                    ? 'Authentication timed out after 60 seconds. Click "Test" again to get a new code.'
                                    : 'Connection timed out after 60 seconds. Check your network and proxy settings.',
                            });
                        }, 60000);
                        (0, ConnectionPool_1.getOrCreateConnection)(creds).then((sharedSocket) => {
                            if (settled) {
                                sharedSocket.end(undefined);
                                (0, ConnectionPool_1.deregisterSocket)(sessionId);
                                return;
                            }
                            sock = sharedSocket;
                            connectionUpdateHandler = (update) => {
                                var _a, _b;
                                const { connection, qr, lastDisconnect } = update;
                                if (qr && authMethod === 'qrCode' && !settled) {
                                    QRCode.toDataURL(qr, { width: 300, margin: 2 }).then((dataUrl) => {
                                        done({
                                            status: 'OK',
                                            message: `QR code ready. The credential test result supports text only, so scan the QR code from the Bailey Trigger output while listening manually. The connection stays open for up to five minutes.`,
                                        });
                                    }).catch(() => {
                                        done({
                                            status: 'Error',
                                            message: 'Could not render the WhatsApp QR code. Try the credential test again.',
                                        });
                                    });
                                    return;
                                }
                                if (authMethod === 'pairingCode' && isFirstAuth && qr && !pairingCodeRequested) {
                                    pairingCodeRequested = true;
                                    const pairingEntry = (0, ConnectionPool_1.getPoolEntry)(sessionId);
                                    const handlePairingUpdate = (0, PairingCoordinator_1.createPairingCodeHandler)({
                                        requestCode: () => sock.requestPairingCode((0, TransportPolicy_1.normalizePhoneNumber)(phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : '')),
                                        onCode: (code) => {
                                            const formatted = code.length === 8
                                                ? `${code.slice(0, 4)}-${code.slice(4)}`
                                                : code;
                                            done({
                                                status: 'OK',
                                                message: `Pairing code: ${formatted}. In WhatsApp, open Settings → Linked Devices → Link a Device → Link with phone number and enter this code. Keep this credential test open while pairing; the socket remains available for up to five minutes.`,
                                            });
                                        },
                                        onError: (message) => {
                                            done({
                                                status: 'Error',
                                                message,
                                            });
                                        },
                                        state: pairingEntry === null || pairingEntry === void 0 ? undefined : pairingEntry.pairingState,
                                    });
                                    const entry = (0, ConnectionPool_1.getPoolEntry)(sessionId);
                                    handlePairingUpdate(update, (entry === null || entry === void 0 ? void 0 : entry.authRegistered) === true);
                                }
                                const entry = (0, ConnectionPool_1.getPoolEntry)(sessionId);
                                if (connection === 'open' && (entry === null || entry === void 0 ? void 0 : entry.authRegistered) === true) {
                                    done({ status: 'OK', message: 'Successfully connected to WhatsApp.' });
                                }
                                if (connection === 'close') {
                                    const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
                                    if (statusCode === 401) {
                                        done({
                                            status: 'Error',
                                            message: `Session logged out. Delete the session directory at "${sessionDir}" and click "Test" again to re-authenticate.`,
                                        });
                                    }
                                    else if (!isFirstAuth) {
                                        done({
                                            status: 'Error',
                                            message: `Connection closed (code ${statusCode !== null && statusCode !== void 0 ? statusCode : 'unknown'}). Check credentials and try again.`,
                                        });
                                    }
                                }
                            };
                            sock.ev.on('connection.update', connectionUpdateHandler);
                            const entry = (0, ConnectionPool_1.getPoolEntry)(sessionId);
                            if (entry && entry.connectionState.connection === 'open' && entry.authRegistered) {
                                connectionUpdateHandler({ connection: 'open' });
                            }
                            else if (entry && entry.connectionState.qr) {
                                connectionUpdateHandler(entry.connectionState);
                            }
                        }).catch(() => {
                            done({
                                status: 'Error',
                                message: 'Could not initialize the WhatsApp connection. Check the credentials, auth directory permissions, and proxy configuration.',
                            });
                        });
                    });
                },
            },
        };
    }
    async trigger() {
        var _a;
        const credentials = (await this.getCredentials('baileyApi'));
        const event = this.getNodeParameter('event', 'messages.upsert');
        const options = this.getNodeParameter('options', {});
        const { sessionId } = credentials;
        const sock = await (0, ConnectionPool_1.getOrCreateConnection)(credentials, true);
        const poolEntry = (0, ConnectionPool_1.getPoolEntry)(sessionId);
        const isRegistered = poolEntry === null || poolEntry === void 0 ? false : poolEntry.authRegistered;
        const isPairingCode = credentials.authMethod === 'pairingCode';
        if (!isRegistered && credentials.authMethod === 'qrCode' && this.getMode() === 'manual') {
            const qrHandler = (update) => {
                if (update.qr && this.getMode() === 'manual') {
                    this.emit([this.helpers.returnJsonArray([{
                        _event: 'auth.qr',
                        _sessionId: sessionId,
                        qrCode: update.qr,
                        instructions: 'Scan in WhatsApp → Settings → Linked Devices → Link a Device.',
                    }])]);
                }
            };
            sock.ev.on('connection.update', qrHandler);
        }
        if (isPairingCode && !isRegistered && this.getMode() === 'manual') {
            const handlePairingUpdate = (0, PairingCoordinator_1.createPairingCodeHandler)({
                requestCode: () => sock.requestPairingCode((0, TransportPolicy_1.normalizePhoneNumber)(credentials.phoneNumber)),
                onCode: (code) => {
                    if (this.getMode() === 'manual') {
                        this.emit([this.helpers.returnJsonArray([{ _event: 'pairing.code', _sessionId: sessionId, pairingCode: code }])]);
                    }
                    else {
                        this.logger.info('[Bailey] Pairing code created. Run the credential test to display it.');
                    }
                },
                onError: (message) => this.logger.error(message),
                state: poolEntry.pairingState,
            });
            sock.ev.on('connection.update', (update) => {
                const registered = (0, ConnectionPool_1.getPoolEntry)(sessionId);
                handlePairingUpdate(update, registered === null || registered === void 0 ? false : registered.authRegistered);
            });
            if (poolEntry && poolEntry.connectionState.qr) handlePairingUpdate(poolEntry.connectionState, poolEntry.authRegistered);
        }
        else if (isPairingCode && !isRegistered) {
            this.logger.info('[Bailey] Authentication is pending. Run the credential test or listen manually to display a pairing code.');
        }
        const emit = (eventName, data) => {
            const payload = {};
            if (options.includeMetadata !== false) {
                payload._event = eventName;
                payload._sessionId = sessionId;
                payload._timestamp = new Date().toISOString();
            }
            if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
                Object.assign(payload, data);
            }
            else {
                payload.data = data;
            }
            this.emit([this.helpers.returnJsonArray([payload])]);
        };
        const eventsToListen = event === '*' ? ALL_EVENTS.map((e) => e.value) : [event];
        for (const evName of eventsToListen) {
            sock.ev.on(evName, (data) => {
                if (evName === 'messages.upsert' &&
                    options.onlyRealMessages &&
                    data != null &&
                    typeof data === 'object' &&
                    'messages' in data) {
                    const upsert = data;
                    const filtered = upsert.messages.filter((m) => { var _a; return !((_a = m.message) === null || _a === void 0 ? void 0 : _a.protocolMessage); });
                    if (filtered.length === 0)
                        return;
                    emit(evName, { ...upsert, messages: filtered });
                    return;
                }
                emit(evName, data);
            });
        }
        const manualTriggerFunction = async () => {
            await new Promise((resolve) => {
                const evName = eventsToListen[0];
                const unsub = sock.ev.process(async (events) => {
                    if (evName in events) {
                        unsub();
                        emit(evName, events[evName]);
                        resolve();
                    }
                });
            });
        };
        const closeFunction = async () => {
            (0, ConnectionPool_1.deregisterSocket)(sessionId);
            sock.end(undefined);
        };
        return { closeFunction, manualTriggerFunction };
    }
}
export { BaileyTrigger };
