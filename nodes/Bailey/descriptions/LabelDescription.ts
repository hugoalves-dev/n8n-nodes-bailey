// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export const labelOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['label'] } },
        options: [
            { name: 'Add Chat Label', value: 'addChatLabel', action: 'Add a label to a chat' },
            { name: 'Add Message Label', value: 'addMessageLabel', action: 'Add a label to a message' },
            { name: 'Remove Chat Label', value: 'removeChatLabel', action: 'Remove a label from a chat' },
            { name: 'Remove Message Label', value: 'removeMessageLabel', action: 'Remove a label from a message' },
            { name: 'Set Labels on Chat', value: 'setLabels', action: 'Set multiple labels on a chat' },
        ],
        default: 'addChatLabel',
    },
];
export const labelFields = [
    {
        displayName: 'Chat JID',
        name: 'jid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['label'],
                operation: ['setLabels', 'addChatLabel', 'removeChatLabel', 'addMessageLabel', 'removeMessageLabel'],
            },
        },
    },
    {
        displayName: 'Label ID',
        name: 'labelId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['label'],
                operation: ['addChatLabel', 'removeChatLabel', 'addMessageLabel', 'removeMessageLabel'],
            },
        },
        description: 'ID of the label (from labels.edit event)',
    },
    {
        displayName: 'Labels (JSON)',
        name: 'labelsJson',
        type: 'json',
        required: true,
        default: '[]',
        displayOptions: { show: { resource: ['label'], operation: ['setLabels'] } },
        description: 'Array of label action objects',
    },
    {
        displayName: 'Message ID',
        name: 'messageId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['label'],
                operation: ['addMessageLabel', 'removeMessageLabel'],
            },
        },
    },
];
