// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export const userOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['user'] } },
        options: [
            { name: 'Check Exists on WhatsApp', value: 'checkExists', action: 'Check if a number is on whats app' },
            { name: 'Fetch Disappearing Duration', value: 'fetchDisappearingDuration', action: 'Fetch default disappearing duration' },
            { name: 'Fetch Message History', value: 'fetchMessageHistory', action: 'Request message history from phone' },
            { name: 'Get Business Profile', value: 'getBusinessProfile', action: 'Get business profile info' },
            { name: 'Get Profile Picture', value: 'getProfilePicture', action: 'Get profile picture URL' },
            { name: 'Get Status', value: 'getStatus', action: 'Get status text of a user' },
            { name: 'Send Presence Update', value: 'sendPresence', action: 'Update your presence status' },
            { name: 'Subscribe to Presence', value: 'subscribePresence', action: 'Subscribe to presence updates' },
        ],
        default: 'checkExists',
    },
];
export const userFields = [
    {
        displayName: 'JID',
        name: 'jid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['checkExists', 'getStatus', 'getProfilePicture', 'getBusinessProfile', 'subscribePresence', 'fetchDisappearingDuration'],
            },
        },
        description: 'WhatsApp JID of the user',
        placeholder: '12025551234@s.whatsapp.net',
    },
    {
        displayName: 'Profile Picture Type',
        name: 'picType',
        type: 'options',
        default: 'preview',
        displayOptions: { show: { resource: ['user'], operation: ['getProfilePicture'] } },
        options: [
            { name: 'Preview (Low Res)', value: 'preview' },
            { name: 'Full Image (High Res)', value: 'image' },
        ],
    },
    {
        displayName: 'Presence Type',
        name: 'presenceType',
        type: 'options',
        default: 'available',
        displayOptions: { show: { resource: ['user'], operation: ['sendPresence'] } },
        options: [
            { name: 'Available (Online)', value: 'available' },
            { name: 'Composing (Typing)', value: 'composing' },
            { name: 'Paused', value: 'paused' },
            { name: 'Recording (Audio)', value: 'recording' },
            { name: 'Unavailable (Offline)', value: 'unavailable' },
        ],
    },
    {
        displayName: 'Presence JID',
        name: 'presenceJid',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['user'], operation: ['sendPresence'] } },
        description: 'Optional: JID to send presence update to. Leave empty for global update.',
    },
    {
        displayName: 'History Count',
        name: 'historyCount',
        type: 'number',
        default: 25,
        displayOptions: { show: { resource: ['user'], operation: ['fetchMessageHistory'] } },
        description: 'Number of messages to request (max 50)',
        typeOptions: { minValue: 1, maxValue: 50 },
    },
    {
        displayName: 'Oldest Message Key',
        name: 'oldestMsgKey',
        type: 'json',
        default: '{}',
        displayOptions: { show: { resource: ['user'], operation: ['fetchMessageHistory'] } },
        description: 'WAMessageKey of the oldest known message (from messages.upsert event)',
    },
    {
        displayName: 'Oldest Message Timestamp',
        name: 'oldestMsgTimestamp',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['user'], operation: ['fetchMessageHistory'] } },
        description: 'Unix timestamp of the oldest known message',
    },
];
