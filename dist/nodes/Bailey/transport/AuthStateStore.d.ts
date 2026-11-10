export { useFileAuthState };
export { sessionDirFromConfig };
declare function useFileAuthState(sessionDir: any): Promise<{
    creds: any;
    keys: {
        get(type: any, ids: any): Promise<{}>;
        set(data: any): Promise<void>;
        clear(): Promise<void>;
    };
    saveCreds: () => Promise<void>;
}>;
declare function sessionDirFromConfig(authDataPath: any, sessionId: any): any;
