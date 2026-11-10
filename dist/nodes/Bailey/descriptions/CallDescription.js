// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callFields = exports.callOperations = void 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.callOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['call'] } },
        options: [
            { name: 'Reject Call', value: 'reject', action: 'Reject an incoming call' },
            { name: 'Create Call Link', value: 'createLink', action: 'Create a whats app call link' },
        ],
        default: 'reject',
    },
];
exports.callFields = [
    {
        displayName: 'Call ID',
        name: 'callId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['call'], operation: ['reject'] } },
        description: 'Call ID from the call event (call[0].ID)',
    },
    {
        displayName: 'Call From JID',
        name: 'callFrom',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['call'], operation: ['reject'] } },
        description: 'JID of the caller (call[0].from)',
    },
    {
        displayName: 'Call Type',
        name: 'callType',
        type: 'options',
        default: 'audio',
        displayOptions: { show: { resource: ['call'], operation: ['createLink'] } },
        options: [
            { name: 'Audio Call', value: 'audio' },
            { name: 'Video Call', value: 'video' },
        ],
    },
];
//# sourceMappingURL=CallDescription.js.map