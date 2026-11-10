// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaileyApi {
    constructor() {
        this.name = 'baileyApi';
        this.displayName = 'Bailey (WhatsApp) API';
        this.documentationUrl = 'https://github.com/jazarie2/n8n-nodes-bailey';
        this.icon = {
            light: 'file:../nodes/Bailey/bailey.svg',
            dark: 'file:../nodes/Bailey/bailey.dark.svg',
        };
        this.properties = [
            {
                displayName: 'Session ID',
                name: 'sessionId',
                type: 'string',
                default: 'default',
                required: true,
                description: 'Unique identifier for this WhatsApp session. Use the same ID in your Trigger and Action nodes to share the connection.',
                placeholder: 'my-whatsapp-session',
            },
            {
                displayName: 'Phone Number',
                name: 'phoneNumber',
                type: 'string',
                default: '',
                required: true,
                description: 'WhatsApp phone number with country code, no + or spaces (e.g. 12025551234)',
                placeholder: '12025551234',
            },
            {
                displayName: 'Auth Method',
                name: 'authMethod',
                type: 'options',
                default: 'pairingCode',
                options: [
                    {
                        name: 'Pairing Code (Recommended)',
                        value: 'pairingCode',
                        description: 'Generates a 8-digit code to enter in WhatsApp > Linked Devices > Link with phone number',
                    },
                    {
                        name: 'QR Code',
                        value: 'qrCode',
                        description: 'Generates a QR code — activate a Bailey Trigger node and check the n8n server logs to scan it',
                    },
                ],
            },
            {
                displayName: 'Auth Data Path',
                name: 'authDataPath',
                type: 'string',
                default: '~/.n8n/baileys',
                description: 'Directory path where WhatsApp session files are stored. Supports ~ for home directory.',
            },
            {
                displayName: 'Sync Full History',
                name: 'syncFullHistory',
                type: 'boolean',
                default: false,
                description: 'Whether to request full message history on initial connection (can be slow)',
            },
            {
                displayName: 'Mark Online on Connect',
                name: 'markOnlineOnConnect',
                type: 'boolean',
                default: true,
                description: 'Whether to appear online when connected',
            },
            {
                displayName: 'Browser Name',
                name: 'browserName',
                type: 'string',
                default: 'n8n',
                description: 'Browser name shown in WhatsApp Linked Devices',
            },
            {
                displayName: 'Message Cache Size',
                name: 'messageCacheSize',
                type: 'number',
                default: 1000,
                description: 'Number of messages to cache in memory. Required for poll vote decryption and message retries.',
                typeOptions: {
                    minValue: 100,
                    maxValue: 10000,
                },
            },
            {
                displayName: 'Idle Timeout (Seconds)',
                name: 'idleTimeoutSeconds',
                type: 'number',
                default: 30,
                description: 'Seconds before an idle action-node connection is automatically closed. Set to 0 to disable.',
                typeOptions: {
                    minValue: 0,
                    maxValue: 3600,
                },
            },
            {
                displayName: 'Proxy URL',
                name: 'proxyUrl',
                type: 'string',
                default: '',
                description: 'Optional HTTP/SOCKS proxy URL for the WebSocket connection (e.g. http://proxy:3128)',
            },
        ];
    }
}
export { BaileyApi };
