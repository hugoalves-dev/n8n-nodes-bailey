// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export const mediaOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['media'] } },
        options: [
            { name: 'Download', value: 'download', action: 'Download media from a message', description: 'Download media content from a WhatsApp message' },
            { name: 'Download Without Re-Upload', value: 'downloadReadOnly', action: 'Download media without requesting re upload', description: 'Download available media without requesting re-upload from another device' },
            { name: 'Re-Upload', value: 'reupload', action: 'Re upload expired media', description: 'Re-upload media whose URL has expired on WhatsApp servers' },
        ],
        default: 'download',
    },
];
export const mediaFields = [
    {
        displayName: 'Message JSON',
        name: 'messageJson',
        type: 'json',
        required: true,
        default: '{}',
        displayOptions: { show: { resource: ['media'], operation: ['download', 'downloadReadOnly', 'reupload'] } },
        description: 'The full WAMessage object containing the media',
    },
    {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        default: 'buffer',
        displayOptions: { show: { resource: ['media'], operation: ['download', 'downloadReadOnly'] } },
        options: [
            { name: 'Buffer (Binary Data)', value: 'buffer', description: 'Return as n8n binary data' },
            { name: 'Stream', value: 'stream', description: 'Return as a readable stream (advanced)' },
        ],
    },
    {
        displayName: 'Binary Property Name',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        displayOptions: { show: { resource: ['media'], operation: ['download', 'downloadReadOnly'] } },
        description: 'Name of the binary property to store the downloaded file in',
    },
];
