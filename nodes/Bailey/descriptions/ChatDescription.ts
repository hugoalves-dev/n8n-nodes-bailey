// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export const chatOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['chat'] } },
        options: [
            { name: 'Archive', value: 'archive', action: 'Archive a chat' },
            { name: 'Clear Chat', value: 'clearChat', action: 'Clear all messages in a chat' },
            { name: 'Delete Chat', value: 'deleteChat', action: 'Delete an entire chat' },
            { name: 'Mark Message Read', value: 'markMessageRead', action: 'Mark an individual message as read' },
            { name: 'Mark Read', value: 'markRead', action: 'Mark chat as read' },
            { name: 'Mark Unread', value: 'markUnread', action: 'Mark chat as unread' },
            { name: 'Mute', value: 'mute', action: 'Mute a chat' },
            { name: 'Pin', value: 'pin', action: 'Pin a chat' },
            { name: 'Unarchive', value: 'unarchive', action: 'Unarchive a chat' },
            { name: 'Unmute', value: 'unmute', action: 'Unmute a chat' },
            { name: 'Unpin', value: 'unpin', action: 'Unpin a chat' },
        ],
        default: 'archive',
    },
];
export const chatFields = [
    {
        displayName: 'Chat JID',
        name: 'jid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['chat'],
                operation: ['archive', 'unarchive', 'mute', 'unmute', 'markRead', 'markMessageRead', 'markUnread', 'pin', 'unpin', 'deleteChat', 'clearChat'],
            },
        },
        description: 'JID of the chat to modify',
        placeholder: '12025551234@s.whatsapp.net',
    },
    {
        displayName: 'Last Message (JSON)',
        name: 'lastMessage',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['chat'], operation: ['markRead'] } },
        description: 'The latest WAMessage in the chat, including key and messageTimestamp. Baileys uses it as the range boundary for marking the chat read.',
        placeholder: '{"key":{"remoteJid":"120363000000000000@g.us","fromMe":false,"id":"MESSAGE_ID","participant":"5511999999999@s.whatsapp.net"},"messageTimestamp":1731430800}',
    },
    {
        displayName: 'Message Key (JSON)',
        name: 'messageKey',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['chat'], operation: ['markMessageRead'] } },
        description: 'The message key from the incoming WhatsApp message, including remoteJid, fromMe, and the message ID',
        // eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
        placeholder: '{"remoteJid":"120363000000000000@g.us","fromMe":false,"id":"MESSAGE_ID"}',
    },
    {
        displayName: 'Mute Duration (Ms)',
        name: 'muteDuration',
        type: 'options',
        default: 28800000,
        displayOptions: { show: { resource: ['chat'], operation: ['mute'] } },
        options: [
            { name: '8 Hours', value: 28800000 },
            { name: '1 Week', value: 604800000 },
            { name: 'Always', value: -1 },
        ],
    },
];
