import type { AuthenticationCreds, SignalDataTypeMap } from '@whiskeysockets/baileys';
type SignalDataSet = {
    [T in keyof SignalDataTypeMap]?: {
        [id: string]: SignalDataTypeMap[T];
    };
};
export interface BaileyAuthState {
    creds: AuthenticationCreds;
    keys: {
        get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{
            [id: string]: SignalDataTypeMap[T];
        }>;
        set(data: SignalDataSet): Promise<void>;
        clear(): Promise<void>;
    };
    saveCreds(): Promise<void>;
}
export declare function useFileAuthState(sessionDir: string): Promise<BaileyAuthState>;
export declare function sessionDirFromConfig(authDataPath: string, sessionId: string): string;
export {};
