import type { proto, WAMessageKey } from '@whiskeysockets/baileys';
export declare class MessageCache {
    private readonly cache;
    private readonly maxSize;
    constructor(maxSize?: number);
    private keyFor;
    set(key: WAMessageKey, message: proto.IMessage): void;
    get(key: WAMessageKey): proto.IMessage | undefined;
    private evictIfNeeded;
    clear(): void;
    get size(): number;
}
