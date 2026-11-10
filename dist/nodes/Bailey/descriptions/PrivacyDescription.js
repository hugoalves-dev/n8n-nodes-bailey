// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyFields = exports.privacyOperations = void 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['privacy'] } },
        options: [
            { name: 'Block User', value: 'block', action: 'Block a contact' },
            { name: 'Get Blocklist', value: 'getBlocklist', action: 'Get blocked contacts list' },
            { name: 'Get Privacy Settings', value: 'getSettings', action: 'Get all privacy settings' },
            { name: 'Unblock User', value: 'unblock', action: 'Unblock a contact' },
            { name: 'Update Call Privacy', value: 'updateCallPrivacy', action: 'Control who can call you' },
            { name: 'Update Groups Add Privacy', value: 'updateGroupsAdd', action: 'Control who can add you to groups' },
            { name: 'Update Last Seen Privacy', value: 'updateLastSeen', action: 'Control who sees your last seen' },
            { name: 'Update Online Privacy', value: 'updateOnline', action: 'Control who sees you online' },
            { name: 'Update Profile Picture Privacy', value: 'updateProfilePicture', action: 'Control who sees your profile picture' },
            { name: 'Update Read Receipts', value: 'updateReadReceipts', action: 'Enable disable read receipts blue ticks' },
        ],
        default: 'getSettings',
    },
];
exports.privacyFields = [
    {
        displayName: 'User JID',
        name: 'jid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['privacy'], operation: ['block', 'unblock'] } },
    },
    {
        displayName: 'Last Seen Setting',
        name: 'lastSeenValue',
        type: 'options',
        default: 'contacts',
        displayOptions: { show: { resource: ['privacy'], operation: ['updateLastSeen'] } },
        options: [
            { name: 'Everyone', value: 'all' },
            { name: 'Contacts Only', value: 'contacts' },
            { name: 'Contact Whitelist', value: 'contact_whitelist' },
            { name: 'Nobody', value: 'none' },
        ],
    },
    {
        displayName: 'Online Visibility',
        name: 'onlineValue',
        type: 'options',
        default: 'all',
        displayOptions: { show: { resource: ['privacy'], operation: ['updateOnline'] } },
        options: [
            { name: 'Everyone', value: 'all' },
            { name: 'Same as Last Seen', value: 'match_last_seen' },
        ],
    },
    {
        displayName: 'Profile Picture Visibility',
        name: 'profilePictureValue',
        type: 'options',
        default: 'contacts',
        displayOptions: { show: { resource: ['privacy'], operation: ['updateProfilePicture'] } },
        options: [
            { name: 'Everyone', value: 'all' },
            { name: 'Contacts Only', value: 'contacts' },
            { name: 'Contact Whitelist', value: 'contact_whitelist' },
            { name: 'Nobody', value: 'none' },
        ],
    },
    {
        displayName: 'Read Receipts',
        name: 'readReceiptsValue',
        type: 'options',
        default: 'all',
        displayOptions: { show: { resource: ['privacy'], operation: ['updateReadReceipts'] } },
        options: [
            { name: 'Everyone (Enabled)', value: 'all' },
            { name: 'Nobody (Disabled)', value: 'none' },
        ],
    },
    {
        displayName: 'Call Privacy',
        name: 'callPrivacyValue',
        type: 'options',
        default: 'all',
        displayOptions: { show: { resource: ['privacy'], operation: ['updateCallPrivacy'] } },
        options: [
            { name: 'Everyone', value: 'all' },
            { name: 'Known Contacts Only', value: 'known' },
        ],
    },
    {
        displayName: 'Groups Add Privacy',
        name: 'groupsAddValue',
        type: 'options',
        default: 'contacts',
        displayOptions: { show: { resource: ['privacy'], operation: ['updateGroupsAdd'] } },
        options: [
            { name: 'Everyone', value: 'all' },
            { name: 'Contacts Only', value: 'contacts' },
            { name: 'Contact Whitelist', value: 'contact_whitelist' },
            { name: 'Nobody', value: 'none' },
        ],
    },
];
//# sourceMappingURL=PrivacyDescription.js.map