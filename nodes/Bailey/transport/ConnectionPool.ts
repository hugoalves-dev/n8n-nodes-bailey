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
export { registerExternalSocket };
export { deregisterSocket };
export { getPoolEntry };
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const AuthStateStore_1 = require("./AuthStateStore");
const MessageCache_1 = require("./MessageCache");
const TransportPolicy_1 = require("./TransportPolicy");
const pool = new Map();
const DEFAULT_IDLE_TIMEOUT_MS = 30000;
const AUTHENTICATION_TIMEOUT_MS = 5 * 60 * 1000;
const pendingConnections = new Map();
const reconnectTimers = new Map();
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
    const connection = createConnection(credentials, (0, TransportPolicy_1.getIdleTimeoutMs)(idleTimeoutSeconds), messageCacheSize !== null && messageCacheSize !== void 0 ? messageCacheSize : 1000);
    pendingConnections.set(sessionId, connection);
    try {
        return await connection;
    }
    finally {
        pendingConnections.delete(sessionId);
    }
}
async function createConnection(credentials, idleTimeoutMs, cacheSize) {
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
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('creds.update', () => {
        const entry = pool.get(sessionId);
        if (!entry) return;
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
    sock.ev.on('connection.update', (update) => {
        var _a, _b, _c;
        const entry = pool.get(sessionId);
        if (entry && entry.socket === sock) {
            entry.connectionState = { ...entry.connectionState, ...update };
        }
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const currentEntry = pool.get(sessionId);
            if (!currentEntry || currentEntry.socket !== sock) return;
            if (currentEntry && currentEntry.authTimer) clearTimeout(currentEntry.authTimer);
            if (currentEntry.idleTimer) clearTimeout(currentEntry.idleTimer);
            const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
            const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut && !(currentEntry === null || currentEntry === void 0 ? void 0 : currentEntry.authenticationTimedOut);
            if (shouldReconnect) {
                pool.delete(sessionId);
                const previousTimer = reconnectTimers.get(sessionId);
                if (previousTimer) clearTimeout(previousTimer);
                const t = setTimeout(() => {
                    reconnectTimers.delete(sessionId);
                    if (pool.has(sessionId)) return;
                    getOrCreateConnection(credentials, currentEntry.keepAlive).catch(() => {
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
        idleTimer: creds.registered ? scheduleIdle(sessionId, idleTimeoutMs) : null,
        authTimer: creds.registered ? null : scheduleAuthTimeout(sessionId, sock),
        sessionId,
        connectionState: {},
        authRegistered: creds.registered === true,
        authenticationTimedOut: false,
        pairingState: { requested: false },
        keepAlive: false,
    };
    pool.set(sessionId, entry);
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
function getPoolEntry(sessionId) {
    return pool.get(sessionId);
}
