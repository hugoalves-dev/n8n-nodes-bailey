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
export { getOrCreateConnection };
export { waitForConnectionOpen };
export { registerExternalSocket };
export { deregisterSocket };
export { getPoolEntry };
export { subscribeToSession };
export { getSessionSubscriptionStatus };
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const AuthStateStore_1 = require("./AuthStateStore");
const MessageCache_1 = require("./MessageCache");
const TransportPolicy_1 = require("./TransportPolicy");
const pool = new Map();
const DEFAULT_IDLE_TIMEOUT_MS = 30000;
const AUTHENTICATION_TIMEOUT_MS = 5 * 60 * 1000;
const pendingConnections = new Map();
const reconnectTimers = new Map();
const sessionSubscriptions = new Map();

function getSessionSubscriptionStatus(sessionId) {
    const subscriptions = sessionSubscriptions.get(sessionId);
    const socket = pool.get(sessionId)?.socket;
    return { registered: subscriptions?.size ?? 0, bound: socket ? [...(subscriptions ?? [])].filter((subscription) => subscription.socket === socket).length : 0 };
}
async function subscribeToSession(credentials, bind) {
    const sessionId = credentials.sessionId;
    let subscriptions = sessionSubscriptions.get(sessionId);
    if (!subscriptions) sessionSubscriptions.set(sessionId, subscriptions = new Set());
    const subscription = { bind, cleanup: null, socket: null };
    subscriptions.add(subscription);
    try {
        const socket = await getOrCreateConnection(credentials, true);
        if (subscriptions.has(subscription) && subscription.socket !== socket) {
            subscription.socket = socket;
            subscription.cleanup = bind(socket);
        }
    } catch (error) {
        subscriptions.delete(subscription);
        if (!subscriptions.size) sessionSubscriptions.delete(sessionId);
        throw error;
    }
    return () => {
        if (!subscriptions.delete(subscription)) return;
        subscription.cleanup?.();
        if (subscriptions.size) return;
        sessionSubscriptions.delete(sessionId);
        const entry = pool.get(sessionId);
        deregisterSocket(sessionId);
        entry?.socket.end(undefined);
    };
}
function bindSessionSubscriptions(sessionId, socket) {
    for (const subscription of sessionSubscriptions.get(sessionId) ?? []) {
        subscription.cleanup?.();
        subscription.socket = socket;
        subscription.cleanup = subscription.bind(socket);
    }
}
function unbindSessionSubscriptions(sessionId, socket) {
    for (const subscription of sessionSubscriptions.get(sessionId) ?? []) {
        if (subscription.socket !== socket) continue;
        subscription.cleanup?.();
        subscription.cleanup = null;
        subscription.socket = null;
    }
}
async function getOrCreateConnection(credentials, keepAlive = false) {
    const { sessionId, messageCacheSize, idleTimeoutSeconds } = credentials;
    const scheduledReconnect = reconnectTimers.get(sessionId);
    if (scheduledReconnect) {
        clearTimeout(scheduledReconnect);
        reconnectTimers.delete(sessionId);
    }
    const existing = pool.get(sessionId);
    if (existing) {
        if (existing.idleTimer)
            clearTimeout(existing.idleTimer);
        existing.keepAlive = existing.keepAlive || keepAlive;
        existing.idleTimer = existing.authRegistered && !existing.keepAlive
            ? scheduleIdle(sessionId, (0, TransportPolicy_1.getIdleTimeoutMs)(idleTimeoutSeconds))
            : null;
        existing.lastUsed = Date.now();
        return existing.socket;
    }
    const pending = pendingConnections.get(sessionId);
    if (pending) return pending;
    const connection = createConnection(credentials, (0, TransportPolicy_1.getIdleTimeoutMs)(idleTimeoutSeconds), messageCacheSize !== null && messageCacheSize !== void 0 ? messageCacheSize : 1000, keepAlive);
    pendingConnections.set(sessionId, connection);
    try {
        return await connection;
    }
    finally {
        pendingConnections.delete(sessionId);
    }
}
async function createConnection(credentials, idleTimeoutMs, cacheSize, keepAlive = false) {
    const { sessionId, authDataPath, syncFullHistory, markOnlineOnConnect, browserName, proxyUrl } = credentials;
    const sessionDir = (0, AuthStateStore_1.sessionDirFromConfig)(authDataPath !== null && authDataPath !== void 0 ? authDataPath : '~/.n8n/baileys', sessionId);
    const { creds, keys, saveCreds } = await (0, AuthStateStore_1.useFileAuthState)(sessionDir);
    const messageCache = new MessageCache_1.MessageCache(cacheSize);
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
    const validatedProxyUrl = (0, TransportPolicy_1.validateProxyUrl)(proxyUrl);
    if (validatedProxyUrl) {
        try {
            const { HttpsProxyAgent } = await Promise.resolve().then(() => __importStar(require('https-proxy-agent')));
            socketConfig.agent = new HttpsProxyAgent(validatedProxyUrl);
        }
        catch {
            throw new Error('Could not initialize the configured HTTP proxy. Check the proxy URL and package installation.');
        }
    }
    const sock = (0, baileys_1.default)(socketConfig);
    sock.ev.on('creds.update', () => {
        const active = pool.get(sessionId);
        if (!active || active.socket !== sock) return;
        void Promise.resolve().then(() => saveCreds()).catch(() => {
            console.error('[Bailey] Could not persist WhatsApp credentials; check auth storage permissions.');
        });
    });
    sock.ev.on('creds.update', () => {
        const entry = pool.get(sessionId);
        if (!entry || entry.socket !== sock) return;
        entry.authRegistered = creds.registered === true;
        if (entry.authRegistered) {
            if (entry.authTimer) clearTimeout(entry.authTimer);
            entry.authTimer = null;
            if (!entry.keepAlive && !entry.idleTimer) entry.idleTimer = scheduleIdle(sessionId, idleTimeoutMs);
        }
    });
    sock.ev.on('messages.upsert', ({ messages }) => {
        for (const msg of messages) {
            if (msg.key && msg.message) {
                messageCache.set(msg.key, msg.message);
            }
        }
    });
    let initialConnectionState = {};
    sock.ev.on('connection.update', (update) => {
        var _a, _b, _c;
        initialConnectionState = { ...initialConnectionState, ...update };
        const entry = pool.get(sessionId);
        // Ignore events from replaced sockets.
        if (!entry || entry.socket !== sock) return;
        entry.connectionState = { ...entry.connectionState, ...update };
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            // Baileys v7 can leave registered=false after QR pairing even when
            // CB:success confirms the login. QR/isNewLogin alone is insufficient.
            if (!creds.registered) {
                creds.registered = true;
                // Persist the auth object used by this socket for future reconnects.
                void Promise.resolve().then(() => saveCreds()).catch(() => {
                    console.error('[Bailey] Could not persist authenticated session; check auth storage permissions.');
                });
            }
            entry.authRegistered = true;
            if (entry.authTimer) clearTimeout(entry.authTimer);
            entry.authTimer = null;
            if (!entry.keepAlive && !entry.idleTimer) {
                entry.idleTimer = scheduleIdle(sessionId, idleTimeoutMs);
            }
        }
        if (connection === 'close') {
            const currentEntry = pool.get(sessionId);
            if (!currentEntry || currentEntry.socket !== sock) return;
            if (currentEntry && currentEntry.authTimer) clearTimeout(currentEntry.authTimer);
            if (currentEntry.idleTimer) clearTimeout(currentEntry.idleTimer);
            unbindSessionSubscriptions(sessionId, sock);
            const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
            const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut && !(currentEntry === null || currentEntry === void 0 ? void 0 : currentEntry.authenticationTimedOut);
            if (shouldReconnect) {
                pool.delete(sessionId);
                const previousTimer = reconnectTimers.get(sessionId);
                if (previousTimer) clearTimeout(previousTimer);
                const t = setTimeout(() => {
                    reconnectTimers.delete(sessionId);
                    if (pool.has(sessionId)) return;
                    const hadSubscriptions = sessionSubscriptions.has(sessionId);
                    getOrCreateConnection(credentials, currentEntry.keepAlive).then((socket) => {
                        // The last trigger may have been deactivated while auth state was loading.
                        if (hadSubscriptions && !sessionSubscriptions.has(sessionId) && pool.get(sessionId)?.socket === socket) {
                            deregisterSocket(sessionId);
                            socket.end(undefined);
                        }
                    }).catch(() => {
                    });
                }, 3000);
                reconnectTimers.set(sessionId, t);
                (_c = t.unref) === null || _c === void 0 ? void 0 : _c.call(t);
            }
            else {
                pool.delete(sessionId);
            }
        }
    });
    const entry = {
        socket: sock,
        messageCache,
        lastUsed: Date.now(),
        idleTimer: creds.registered && !keepAlive ? scheduleIdle(sessionId, idleTimeoutMs) : null,
        authTimer: creds.registered ? null : scheduleAuthTimeout(sessionId, sock),
        sessionId,
        connectionState: { ...initialConnectionState },
        authRegistered: creds.registered === true,
        authenticationTimedOut: false,
        pairingState: { requested: false },
        keepAlive,
    };
    pool.set(sessionId, entry);
    bindSessionSubscriptions(sessionId, sock);
    return sock;
}
function scheduleIdle(sessionId, timeoutMs) {
    if (timeoutMs === undefined) return null;
    var _a;
    const effectiveTimeout = timeoutMs > 0 ? timeoutMs : DEFAULT_IDLE_TIMEOUT_MS;
    const t = setTimeout(() => {
        const entry = pool.get(sessionId);
        if (entry) {
            entry.socket.end(undefined);
            if (entry.authTimer) clearTimeout(entry.authTimer);
            pool.delete(sessionId);
        }
    }, effectiveTimeout);
    (_a = t.unref) === null || _a === void 0 ? void 0 : _a.call(t);
    return t;
}
function scheduleAuthTimeout(sessionId, socket) {
    const timer = setTimeout(() => {
        const entry = pool.get(sessionId);
        if (!entry || entry.socket !== socket || entry.authRegistered) return;
        entry.authenticationTimedOut = true;
        socket.end(undefined);
    }, AUTHENTICATION_TIMEOUT_MS);
    timer.unref === null || timer.unref === void 0 ? void 0 : timer.unref();
    return timer;
}
function registerExternalSocket(sessionId, sock, messageCache, authCreds, idleTimeoutMs) {
    const existing = pool.get(sessionId);
    if (existing) {
        return existing.socket;
    }
    pool.set(sessionId, {
        socket: sock,
        messageCache,
        lastUsed: Date.now(),
        idleTimer: authCreds && authCreds.registered === true ? scheduleIdle(sessionId, idleTimeoutMs) : null,
        sessionId,
        connectionState: {},
        authRegistered: authCreds === null || authCreds === void 0 ? false : authCreds.registered === true,
        authTimer: authCreds && authCreds.registered !== true ? scheduleAuthTimeout(sessionId, sock) : null,
        authenticationTimedOut: false,
        pairingState: { requested: false },
    });
    sock.ev.on('creds.update', () => {
        const entry = pool.get(sessionId);
        if (!entry || !authCreds) return;
        entry.authRegistered = authCreds.registered === true;
        if (entry.authRegistered && entry.authTimer) {
            clearTimeout(entry.authTimer);
            entry.authTimer = null;
            if (!entry.keepAlive && !entry.idleTimer) entry.idleTimer = scheduleIdle(sessionId, idleTimeoutMs);
        }
    });
    return sock;
}
function deregisterSocket(sessionId) {
    const reconnectTimer = reconnectTimers.get(sessionId);
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimers.delete(sessionId);
    }
    const entry = pool.get(sessionId);
    if (entry) {
        if (entry.idleTimer)
            clearTimeout(entry.idleTimer);
        if (entry.authTimer)
            clearTimeout(entry.authTimer);
        pool.delete(sessionId);
    }
}
async function waitForConnectionOpen(sessionId, socket, timeoutMs = 60000) {
    const entry = pool.get(sessionId);
    if (!entry || entry.socket !== socket) {
        throw new Error('WhatsApp connection is not available in the connection pool.');
    }
    if (entry.connectionState.connection === 'open') return;

    await new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            clearTimeout(timer);
            socket.ev.off('connection.update', onUpdate);
        };
        const finish = (error) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (error) reject(error);
            else resolve();
        };
        const onUpdate = (update) => {
            if (update.connection === 'open') {
                finish();
            } else if (update.connection === 'close') {
                const statusCode = update.lastDisconnect?.error?.output?.statusCode;
                finish(new Error('WhatsApp connection closed before opening (code ' + (statusCode ?? 'unknown') + ').'));
            }
        };
        const timer = setTimeout(() => {
            finish(new Error('Timed out after ' + timeoutMs + ' ms waiting for WhatsApp connection to open.'));
        }, timeoutMs);

        socket.ev.on('connection.update', onUpdate);

        // Recheck after subscribing to close the race between the first state read
        // and listener registration.
        const currentEntry = pool.get(sessionId);
        if (currentEntry?.socket !== socket) {
            finish(new Error('WhatsApp connection was replaced before opening.'));
        } else if (currentEntry.connectionState.connection === 'open') {
            finish();
        }
    });
}
function getPoolEntry(sessionId) {
    return pool.get(sessionId);
}
