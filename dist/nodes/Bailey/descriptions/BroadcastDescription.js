"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastFields = exports.broadcastOperations = void 0;
exports.broadcastOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['broadcast'] } },
        options: [
            { name: 'Send to Broadcast List', value: 'sendBroadcast', action: 'Send a message to a broadcast list' },
            { name: 'Send Story', value: 'sendStory', description: 'Post a text or media story to WhatsApp Status', action: 'Post a whats app status story' },
        ],
        default: 'sendBroadcast',
    },
];
exports.broadcastFields = [
    {
        displayName: 'Broadcast JID',
        name: 'broadcastJid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['broadcast'], operation: ['sendBroadcast'] } },
        description: 'JID of the broadcast list (e.g. 1234567890@broadcast)',
        placeholder: '1234567890@broadcast',
    },
    {
        displayName: 'Status JIDs (Recipients)',
        name: 'statusJids',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['broadcast'], operation: ['sendBroadcast'] } },
        description: 'Comma-separated JIDs of contacts to receive the broadcast',
    },
    {
        displayName: 'Message Type',
        name: 'msgType',
        type: 'options',
        default: 'text',
        displayOptions: {
            show: {
                resource: ['broadcast'],
                operation: ['sendBroadcast', 'sendStory'],
            },
        },
        options: [
            { name: 'Text', value: 'text' },
            { name: 'Image', value: 'image' },
            { name: 'Video', value: 'video' },
        ],
    },
    {
        displayName: 'Text',
        name: 'text',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['broadcast'],
                operation: ['sendBroadcast', 'sendStory'],
                msgType: ['text'],
            },
        },
        typeOptions: { rows: 3 },
    },
    {
        displayName: 'Media URL or Binary Property',
        name: 'mediaSource',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['broadcast'],
                operation: ['sendBroadcast', 'sendStory'],
                msgType: ['image', 'video'],
            },
        },
    },
    {
        displayName: 'Caption',
        name: 'caption',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['broadcast'],
                operation: ['sendBroadcast', 'sendStory'],
                msgType: ['image', 'video'],
            },
        },
    },
];
//# sourceMappingURL=BroadcastDescription.js.map