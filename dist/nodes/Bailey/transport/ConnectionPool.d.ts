export { getOrCreateConnection };
export { registerExternalSocket };
export { deregisterSocket };
export { getPoolEntry };
declare function getOrCreateConnection(credentials: any, keepAlive?: boolean): Promise<any>;
declare function registerExternalSocket(sessionId: any, sock: any, messageCache: any, authCreds: any, idleTimeoutMs: any): any;
declare function deregisterSocket(sessionId: any): void;
declare function getPoolEntry(sessionId: any): any;
