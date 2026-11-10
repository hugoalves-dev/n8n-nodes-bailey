"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageCache = void 0;
class MessageCache {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    keyFor(key) {
        var _a, _b;
        return `${(_a = key.remoteJid) !== null && _a !== void 0 ? _a : ''}:${(_b = key.id) !== null && _b !== void 0 ? _b : ''}:${key.fromMe ? '1' : '0'}`;
    }
    set(key, message) {
        const cacheKey = this.keyFor(key);
        this.cache.set(cacheKey, { message, accessTime: Date.now() });
        this.evictIfNeeded();
    }
    get(key) {
        const cacheKey = this.keyFor(key);
        const entry = this.cache.get(cacheKey);
        if (entry) {
            entry.accessTime = Date.now();
            return entry.message;
        }
        return undefined;
    }
    evictIfNeeded() {
        if (this.cache.size <= this.maxSize)
            return;
        let oldestKey = '';
        let oldestTime = Infinity;
        for (const [k, v] of this.cache.entries()) {
            if (v.accessTime < oldestTime) {
                oldestTime = v.accessTime;
                oldestKey = k;
            }
        }
        if (oldestKey)
            this.cache.delete(oldestKey);
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
}
exports.MessageCache = MessageCache;
//# sourceMappingURL=MessageCache.js.map