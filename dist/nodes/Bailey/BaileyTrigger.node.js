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
exports.BaileyTrigger = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const QRCode = __importStar(require("qrcode"));
const n8n_workflow_1 = require("n8n-workflow");
const AuthStateStore_1 = require("./transport/AuthStateStore");
const MessageCache_1 = require("./transport/MessageCache");
const ConnectionPool_1 = require("./transport/ConnectionPool");
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
                    const creds = credential.data;
                    const { sessionId, authDataPath, authMethod, phoneNumber, browserName, proxyUrl } = creds;
                    const sessionDir = (0, AuthStateStore_1.sessionDirFromConfig)(authDataPath !== null && authDataPath !== void 0 ? authDataPath : '~/.n8n/baileys', sessionId);
                    const credsFile = path.join(sessionDir, 'creds.json');
                    const isFirstAuth = !fs.existsSync(credsFile);
                    return new Promise((resolve) => {
                        let settled = false;
                        let sock;
                        const done = (result) => {
                            var _a, _b;
                            if (settled)
                                return;
                            settled = true;
                            clearTimeout(timer);
                            if (result.status !== 'OK' || !isFirstAuth) {
                                try {
                                    sock === null || sock === void 0 ? void 0 : sock.end(undefined);
                                }
                                catch { }
                            }
                            else {
                                (_b = (_a = setTimeout(() => { try {
                                    sock === null || sock === void 0 ? void 0 : sock.end(undefined);
                                }
                                catch { } }, 2000)).unref) === null || _b === void 0 ? void 0 : _b.call(_a);
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
                        (0, AuthStateStore_1.useFileAuthState)(sessionDir).then(({ creds: authCreds, keys, saveCreds }) => {
                            const socketConfig = {
                                auth: {
                                    creds: authCreds,
                                    keys: (0, baileys_1.makeCacheableSignalKeyStore)(keys, undefined),
                                },
                                browser: baileys_1.Browsers.ubuntu(browserName !== null && browserName !== void 0 ? browserName : 'n8n'),
                                syncFullHistory: false,
                                markOnlineOnConnect: false,
                                generateHighQualityLinkPreview: false,
                            };
                            if (proxyUrl) {
                                Promise.resolve().then(() => __importStar(require('https-proxy-agent'))).then(({ HttpsProxyAgent }) => {
                                    socketConfig.agent = new HttpsProxyAgent(proxyUrl);
                                }).catch(() => { });
                            }
                            sock = (0, baileys_1.default)(socketConfig);
                            sock.ev.on('creds.update', saveCreds);
                            sock.ev.on('connection.update', (update) => {
                                var _a, _b;
                                const { connection, qr, lastDisconnect } = update;
                                if (qr) {
                                    QRCode.toDataURL(qr, { width: 300, margin: 2 }).then((dataUrl) => {
                                        done({
                                            status: 'Error',
                                            message: `<div style="text-align:center">` +
                                                `<p><b>Scan this QR code in WhatsApp</b></p>` +
                                                `<p style="color:#888;font-size:12px">WhatsApp → Settings → Linked Devices → Link a Device</p>` +
                                                `<img src="${dataUrl}" style="width:250px;height:250px;display:block;margin:12px auto" />` +
                                                `<p style="color:#888;font-size:12px">After scanning, click <b>Test</b> again to confirm the connection.</p>` +
                                                `</div>`,
                                        });
                                    }).catch(() => {
                                        done({
                                            status: 'Error',
                                            message: `QR Code (copy into a QR generator to scan):\n${qr}\n\nAfter scanning, click "Test" again.`,
                                        });
                                    });
                                    return;
                                }
                                if (connection === 'open') {
                                    if (authMethod === 'pairingCode' && isFirstAuth && !authCreds.registered) {
                                        sock.requestPairingCode(phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : '').then((code) => {
                                            const formatted = code.length === 8
                                                ? `${code.slice(0, 4)}-${code.slice(4)}`
                                                : code;
                                            done({
                                                status: 'Error',
                                                message: `<div style="text-align:center">` +
                                                    `<p><b>Enter this pairing code in WhatsApp</b></p>` +
                                                    `<p style="color:#888;font-size:12px">WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number</p>` +
                                                    `<p style="font-size:36px;font-weight:bold;letter-spacing:8px;font-family:monospace;margin:16px 0">${formatted}</p>` +
                                                    `<p style="color:#888;font-size:12px">After entering the code, click <b>Test</b> again to confirm the connection.</p>` +
                                                    `</div>`,
                                            });
                                        }).catch((err) => {
                                            var _a;
                                            done({
                                                status: 'Error',
                                                message: `Failed to get pairing code: ${(_a = err.message) !== null && _a !== void 0 ? _a : String(err)}`,
                                            });
                                        });
                                    }
                                    else {
                                        done({
                                            status: 'OK',
                                            message: isFirstAuth
                                                ? 'WhatsApp linked successfully! Your session has been saved.'
                                                : 'Successfully connected to WhatsApp',
                                        });
                                    }
                                    return;
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
                            });
                        }).catch((err) => {
                            var _a;
                            done({
                                status: 'Error',
                                message: `Failed to load session: ${(_a = err.message) !== null && _a !== void 0 ? _a : String(err)}`,
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
        const { sessionId, authDataPath, syncFullHistory, markOnlineOnConnect, browserName, proxyUrl } = credentials;
        const sessionDir = (0, AuthStateStore_1.sessionDirFromConfig)(authDataPath !== null && authDataPath !== void 0 ? authDataPath : '~/.n8n/baileys', sessionId);
        const { creds, keys, saveCreds } = await (0, AuthStateStore_1.useFileAuthState)(sessionDir);
        const messageCache = new MessageCache_1.MessageCache((_a = credentials.messageCacheSize) !== null && _a !== void 0 ? _a : 1000);
        const socketConfig = {
            auth: {
                creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(keys, undefined),
            },
            browser: baileys_1.Browsers.ubuntu(browserName !== null && browserName !== void 0 ? browserName : 'n8n'),
            syncFullHistory: syncFullHistory !== null && syncFullHistory !== void 0 ? syncFullHistory : false,
            markOnlineOnConnect: markOnlineOnConnect !== null && markOnlineOnConnect !== void 0 ? markOnlineOnConnect : true,
            generateHighQualityLinkPreview: true,
            enableAutoSessionRecreation: true,
            enableRecentMessageCache: true,
            getMessage: async (key) => {
                return messageCache.get(key);
            },
        };
        if (proxyUrl) {
            try {
                const { HttpsProxyAgent } = await Promise.resolve().then(() => __importStar(require('https-proxy-agent')));
                socketConfig.agent = new HttpsProxyAgent(proxyUrl);
            }
            catch {
            }
        }
        const sock = (0, baileys_1.default)(socketConfig);
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('messages.upsert', ({ messages }) => {
            for (const msg of messages) {
                if (msg.key && msg.message) {
                    messageCache.set(msg.key, msg.message);
                }
            }
        });
        (0, ConnectionPool_1.registerExternalSocket)(sessionId, sock, messageCache);
        const isPairingCode = credentials.authMethod === 'pairingCode';
        if (isPairingCode && !creds.registered) {
            sock.ev.process(async (events) => {
                var _a;
                if (events['connection.update']) {
                    const update = events['connection.update'];
                    if (update.connection === 'open' && !creds.registered) {
                        try {
                            const code = await sock.requestPairingCode(credentials.phoneNumber);
                            this.logger.info(`[Bailey] Pairing code for ${credentials.phoneNumber}: ${code}`);
                        }
                        catch (err) {
                            this.logger.error(`[Bailey] Failed to get pairing code: ${(_a = err.message) !== null && _a !== void 0 ? _a : String(err)}`);
                        }
                    }
                }
            });
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
exports.BaileyTrigger = BaileyTrigger;
//# sourceMappingURL=BaileyTrigger.node.js.map