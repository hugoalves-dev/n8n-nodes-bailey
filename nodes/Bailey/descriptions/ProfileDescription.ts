// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import { aboutDurationPresets, defaultAboutDuration } from '../transport/ProfileAbout';

export const profileOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['profile'] } },
        options: [
            { name: 'Clear About', value: 'clearAbout', action: 'Clear the current about note' },
            { name: 'Get About', value: 'getAbout', action: 'Get the current about note' },
            { name: 'Remove Picture', value: 'removePicture', action: 'Remove profile picture' },
            { name: 'Set Default Disappearing Mode', value: 'setDisappearing', action: 'Set default disappearing message duration' },
            { name: 'Update About', value: 'updateAbout', action: 'Update the current about note' },
            { name: 'Update Name', value: 'updateName', action: 'Update profile display name' },
            { name: 'Update Picture', value: 'updatePicture', action: 'Update profile picture' },
            { name: 'Update Status', value: 'updateStatus', action: 'Update profile status text' },
        ],
        default: 'updateStatus',
    },
];
export const profileFields = [
    {
        displayName: 'About Text',
        name: 'aboutText',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['profile'], operation: ['updateAbout'] } },
        description: 'Text for the About note, up to 50 Unicode code points',
    },
    {
        displayName: 'Emoji',
        name: 'aboutEmoji',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['profile'], operation: ['updateAbout'] } },
        description: 'A single emoji to display alongside the About note',
    },
    {
        displayName: 'Duration',
        name: 'aboutDuration',
        type: 'options',
        default: defaultAboutDuration,
        displayOptions: { show: { resource: ['profile'], operation: ['updateAbout'] } },
        options: [...aboutDurationPresets, { name: 'Custom', value: 'custom' }],
    },
    {
        displayName: 'Expiration',
        name: 'aboutExpiresAt',
        type: 'dateTime',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['profile'], operation: ['updateAbout'], aboutDuration: ['custom'] } },
        description: 'Future date and time for the About note to expire',
    },
    {
        displayName: 'Status Text',
        name: 'status',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['profile'], operation: ['updateStatus'] } },
        description: 'Your new legacy WhatsApp profile status text',
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
