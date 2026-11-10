"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactFields = exports.contactOperations = void 0;
exports.contactOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['contact'] } },
        options: [
            { name: 'Add / Edit Contact', value: 'addOrEdit', action: 'Add or edit a contact' },
            { name: 'Remove Contact', value: 'remove', action: 'Remove a contact' },
            { name: 'Request Phone Number', value: 'requestPhoneNumber', action: 'Request phone number sharing' },
        ],
        default: 'addOrEdit',
    },
];
exports.contactFields = [
    {
        displayName: 'Contact JID',
        name: 'jid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['contact'], operation: ['addOrEdit', 'remove', 'requestPhoneNumber'] } },
        description: 'WhatsApp JID of the contact',
    },
    {
        displayName: 'Full Name',
        name: 'fullName',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['contact'], operation: ['addOrEdit'] } },
        description: 'Full display name of the contact',
    },
    {
        displayName: 'First Name',
        name: 'firstName',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['contact'], operation: ['addOrEdit'] } },
        description: 'First name of the contact',
    },
];
//# sourceMappingURL=ContactDescription.js.map