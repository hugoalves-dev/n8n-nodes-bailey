import type { ICredentialType, INodeProperties } from 'n8n-workflow';
export interface BaileyCredentials {
    sessionId: string;
    phoneNumber: string;
    authMethod: 'pairingCode' | 'qrCode';
    authDataPath: string;
    syncFullHistory: boolean;
    markOnlineOnConnect: boolean;
    browserName: string;
    messageCacheSize: number;
    idleTimeoutSeconds: number;
    proxyUrl?: string;
}
export declare class BaileyApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: ICredentialType['icon'];
    properties: INodeProperties[];
}
