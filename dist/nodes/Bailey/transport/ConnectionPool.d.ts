import type { WASocket, ConnectionState } from '@whiskeysockets/baileys';
import { MessageCache } from './MessageCache';
import type { BaileyCredentials } from '../../../credentials/BaileyApi.credentials';
export interface ConnectionEntry {
    socket: WASocket;
    messageCache: MessageCache;
    lastUsed: number;
    idleTimer: ReturnType<typeof setTimeout> | null;
    sessionId: string;
    connectionState: Partial<ConnectionState>;
}
export declare function getOrCreateConnection(credentials: BaileyCredentials): Promise<WASocket>;
export declare function registerExternalSocket(sessionId: string, sock: WASocket, messageCache: MessageCache): void;
export declare function deregisterSocket(sessionId: string): void;
export declare function getPoolEntry(sessionId: string): ConnectionEntry | undefined;
