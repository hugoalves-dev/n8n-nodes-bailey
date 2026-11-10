// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileAuthState = useFileAuthState;
exports.sessionDirFromConfig = sessionDirFromConfig;
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const baileys_1 = require("@whiskeysockets/baileys");
async function useFileAuthState(sessionDir) {
    var _a;
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }
    const credsFile = path.join(sessionDir, 'creds.json');
    const fixKeys = (obj) => {
        if (!obj || typeof obj !== 'object')
            return obj;
        if (Array.isArray(obj))
            return obj.map(fixKeys);
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            result[k] = fixKeys(v);
        }
        return result;
    };
    const readJSON = (filePath) => {
        try {
            if (!fs.existsSync(filePath))
                return null;
            const raw = fs.readFileSync(filePath, { encoding: 'utf8' });
            return JSON.parse(raw, baileys_1.BufferJSON.reviver);
        }
        catch {
            return null;
        }
    };
    const writeJSON = (filePath, data) => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const tmp = filePath + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(data, baileys_1.BufferJSON.replacer, 2), { encoding: 'utf8' });
        fs.renameSync(tmp, filePath);
    };
    const creds = (_a = readJSON(credsFile)) !== null && _a !== void 0 ? _a : (0, baileys_1.initAuthCreds)();
    const saveCreds = async () => {
        writeJSON(credsFile, creds);
    };
    const keys = {
        async get(type, ids) {
            const data = {};
            for (const id of ids) {
                const filePath = path.join(sessionDir, `${type}-${id}.json`);
                const value = readJSON(filePath);
                if (value != null) {
                    data[id] = type === 'app-state-sync-key' ? fixKeys(value) : value;
                }
            }
            return data;
        },
        async set(data) {
            for (const [type, values] of Object.entries(data)) {
                if (!values)
                    continue;
                for (const [id, value] of Object.entries(values)) {
                    const filePath = path.join(sessionDir, `${type}-${id}.json`);
                    if (value == null) {
                        if (fs.existsSync(filePath))
                            fs.unlinkSync(filePath);
                    }
                    else {
                        writeJSON(filePath, value);
                    }
                }
            }
        },
        async clear() {
            const files = fs.readdirSync(sessionDir);
            for (const file of files) {
                if (file !== 'creds.json') {
                    fs.unlinkSync(path.join(sessionDir, file));
                }
            }
        },
    };
    return { creds, keys, saveCreds };
}
function sessionDirFromConfig(authDataPath, sessionId) {
    const id = String(sessionId);
    if (!id || id === '.' || id === '..' || id.includes('/') || id.includes('\\') || id.includes('\0')) {
        throw new Error('Session ID must be a single path segment.');
    }
    const homeDirectory = process.env.HOME || process.env.USERPROFILE || '.';
    const base = authDataPath === '~' || authDataPath.startsWith('~/') || authDataPath.startsWith('~\\')
        ? path.join(homeDirectory, authDataPath.slice(2))
        : authDataPath;
    return path.resolve(base, id);
}
//# sourceMappingURL=AuthStateStore.js.map