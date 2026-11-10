declare class MessageCache {
    constructor(maxSize?: number);
    keyFor(key: any): string;
    set(key: any, message: any): void;
    get(key: any): any;
    evictIfNeeded(): void;
    clear(): void;
    get size(): any;
}
export { MessageCache };
