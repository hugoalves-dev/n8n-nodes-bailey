// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileFields = exports.profileOperations = void 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['profile'] } },
        options: [
            { name: 'Remove Picture', value: 'removePicture', action: 'Remove profile picture' },
            { name: 'Set Default Disappearing Mode', value: 'setDisappearing', action: 'Set default disappearing message duration' },
            { name: 'Update Name', value: 'updateName', action: 'Update profile display name' },
            { name: 'Update Picture', value: 'updatePicture', action: 'Update profile picture' },
            { name: 'Update Status', value: 'updateStatus', action: 'Update profile status text' },
        ],
        default: 'updateStatus',
    },
];
exports.profileFields = [
    {
        displayName: 'Status Text',
        name: 'status',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['profile'], operation: ['updateStatus'] } },
        description: 'Your new WhatsApp status/about text',
    },
    {
        displayName: 'Display Name',
        name: 'name',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['profile'], operation: ['updateName'] } },
        description: 'Your new WhatsApp display name',
    },
    {
        displayName: 'Picture URL or Binary Property',
        name: 'pictureSource',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['profile'], operation: ['updatePicture'] } },
        description: 'URL of the image, or name of binary input property containing the image',
    },
    {
        displayName: 'Disappearing Duration',
        name: 'disappearingDuration',
        type: 'options',
        default: 0,
        displayOptions: { show: { resource: ['profile'], operation: ['setDisappearing'] } },
        options: [
            { name: 'Off', value: 0 },
            { name: '24 Hours', value: 86400 },
            { name: '7 Days', value: 604800 },
            { name: '90 Days', value: 7776000 },
        ],
    },
];
//# sourceMappingURL=ProfileDescription.js.map