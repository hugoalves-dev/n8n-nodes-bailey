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
exports.getOrCreateConnection = getOrCreateConnection;
exports.registerExternalSocket = registerExternalSocket;
exports.deregisterSocket = deregisterSocket;
exports.getPoolEntry = getPoolEntry;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const AuthStateStore_1 = require("./AuthStateStore");
const MessageCache_1 = require("./MessageCache");
const pool = new Map();
const DEFAULT_IDLE_TIMEOUT_MS = 30000;
async function getOrCreateConnection(credentials) {
    const { sessionId, messageCacheSize, idleTimeoutSeconds } = credentials;
    const existing = pool.get(sessionId);
    if (existing) {
        if (existing.idleTimer)
            clearTimeout(existing.idleTimer);
        existing.idleTimer = scheduleIdle(sessionId, (idleTimeoutSeconds !== null && idleTimeoutSeconds !== void 0 ? idleTimeoutSeconds : 30) * 1000);
        existing.lastUsed = Date.now();
        return existing.socket;
    }
    return createConnection(credentials, (idleTimeoutSeconds !== null && idleTimeoutSeconds !== void 0 ? idleTimeoutSeconds : 30) * 1000, messageCacheSize !== null && messageCacheSize !== void 0 ? messageCacheSize : 1000);
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
    sock.ev.on('connection.update', (update) => {
        var _a, _b, _c;
        const entry = pool.get(sessionId);
        if (entry) {
            entry.connectionState = { ...entry.connectionState, ...update };
        }
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
            const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut;
            if (shouldReconnect) {
                pool.delete(sessionId);
                const t = setTimeout(() => {
                    createConnection(credentials, idleTimeoutMs, cacheSize).catch(() => {
                    });
                }, 3000);
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
        idleTimer: scheduleIdle(sessionId, idleTimeoutMs),
        sessionId,
        connectionState: {},
    };
    pool.set(sessionId, entry);
    return sock;
}
function scheduleIdle(sessionId, timeoutMs) {
    var _a;
    const effectiveTimeout = timeoutMs > 0 ? timeoutMs : DEFAULT_IDLE_TIMEOUT_MS;
    const t = setTimeout(() => {
        const entry = pool.get(sessionId);
        if (entry) {
            entry.socket.end(undefined);
            pool.delete(sessionId);
        }
    }, effectiveTimeout);
    (_a = t.unref) === null || _a === void 0 ? void 0 : _a.call(t);
    return t;
}
function registerExternalSocket(sessionId, sock, messageCache) {
    const existing = pool.get(sessionId);
    if (existing) {
        if (existing.idleTimer)
            clearTimeout(existing.idleTimer);
        existing.socket = sock;
        existing.messageCache = messageCache;
        existing.lastUsed = Date.now();
        existing.idleTimer = null;
        return;
    }
    pool.set(sessionId, {
        socket: sock,
        messageCache,
        lastUsed: Date.now(),
        idleTimer: null,
        sessionId,
        connectionState: {},
    });
}
function deregisterSocket(sessionId) {
    const entry = pool.get(sessionId);
    if (entry) {
        if (entry.idleTimer)
            clearTimeout(entry.idleTimer);
        pool.delete(sessionId);
    }
}
function getPoolEntry(sessionId) {
    return pool.get(sessionId);
}
//# sourceMappingURL=ConnectionPool.js.map