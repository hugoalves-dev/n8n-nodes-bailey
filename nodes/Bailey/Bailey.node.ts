// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n8n_workflow_1 = require("n8n-workflow");
const ConnectionPool_1 = require("./transport/ConnectionPool");
const RecoveryDescription_1 = require("./descriptions/RecoveryDescription");
const RecoveryStore_1 = require("./transport/RecoveryStore");
const RecoveryOperation_1 = require("./operations/recovery.operations");
const AuthStateStore_1 = require("./transport/AuthStateStore");
const path = require("path");
const MessageDescription_1 = require("./descriptions/MessageDescription");
const MediaDescription_1 = require("./descriptions/MediaDescription");
const ChatDescription_1 = require("./descriptions/ChatDescription");
const UserDescription_1 = require("./descriptions/UserDescription");
const ContactDescription_1 = require("./descriptions/ContactDescription");
const ProfileDescription_1 = require("./descriptions/ProfileDescription");
const GroupDescription_1 = require("./descriptions/GroupDescription");
const CommunityDescription_1 = require("./descriptions/CommunityDescription");
const NewsletterDescription_1 = require("./descriptions/NewsletterDescription");
const BusinessDescription_1 = require("./descriptions/BusinessDescription");
const LabelDescription_1 = require("./descriptions/LabelDescription");
const PrivacyDescription_1 = require("./descriptions/PrivacyDescription");
const BroadcastDescription_1 = require("./descriptions/BroadcastDescription");
const CallDescription_1 = require("./descriptions/CallDescription");
const message_operations_1 = require("./operations/message.operations");
const media_operations_1 = require("./operations/media.operations");
const chat_operations_1 = require("./operations/chat.operations");
const user_operations_1 = require("./operations/user.operations");
const contact_operations_1 = require("./operations/contact.operations");
const profile_operations_1 = require("./operations/profile.operations");
const group_operations_1 = require("./operations/group.operations");
const community_operations_1 = require("./operations/community.operations");
const newsletter_operations_1 = require("./operations/newsletter.operations");
const business_operations_1 = require("./operations/business.operations");
const label_operations_1 = require("./operations/label.operations");
const privacy_operations_1 = require("./operations/privacy.operations");
const broadcast_operations_1 = require("./operations/broadcast.operations");
const call_operations_1 = require("./operations/call.operations");
class Bailey {
    constructor() {
        this.description = {
            displayName: 'Bailey (WhatsApp)',
            name: 'bailey',
            icon: {
                light: 'file:bailey.svg',
                dark: 'file:bailey.dark.svg',
            },
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
            description: 'Interact with WhatsApp via Baileys WebSocket API',
            defaults: {
                name: 'Bailey',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            usableAsTool: true,
            credentials: [
                {
                    name: 'baileyApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        { name: 'Broadcast', value: 'broadcast' },
                        { name: 'Business', value: 'business' },
                        { name: 'Call', value: 'call' },
                        { name: 'Chat', value: 'chat' },
                        { name: 'Community', value: 'community' },
                        { name: 'Contact', value: 'contact' },
                        { name: 'Group', value: 'group' },
                        { name: 'Label', value: 'label' },
                        { name: 'Media', value: 'media' },
                        { name: 'Message', value: 'message' },
                        { name: 'Newsletter', value: 'newsletter' },
                        { name: 'Privacy', value: 'privacy' },
                        { name: 'Profile', value: 'profile' },
                        { name: 'Recovery', value: 'recovery' },
                        { name: 'User', value: 'user' },
                    ],
                    default: 'message',
                },
                ...RecoveryDescription_1.recoveryFields,
                ...MessageDescription_1.messageOperations,
                ...MediaDescription_1.mediaOperations,
                ...ChatDescription_1.chatOperations,
                ...UserDescription_1.userOperations,
                ...ContactDescription_1.contactOperations,
                ...ProfileDescription_1.profileOperations,
                ...GroupDescription_1.groupOperations,
                ...CommunityDescription_1.communityOperations,
                ...NewsletterDescription_1.newsletterOperations,
                ...BusinessDescription_1.businessOperations,
                ...LabelDescription_1.labelOperations,
                ...PrivacyDescription_1.privacyOperations,
                ...BroadcastDescription_1.broadcastOperations,
                ...CallDescription_1.callOperations,
                ...MessageDescription_1.messageFields,
                ...MediaDescription_1.mediaFields,
                ...ChatDescription_1.chatFields,
                ...UserDescription_1.userFields,
                ...ContactDescription_1.contactFields,
                ...ProfileDescription_1.profileFields,
                ...GroupDescription_1.groupFields,
                ...CommunityDescription_1.communityFields,
                ...NewsletterDescription_1.newsletterFields,
                ...BusinessDescription_1.businessFields,
                ...LabelDescription_1.labelFields,
                ...PrivacyDescription_1.privacyFields,
                ...BroadcastDescription_1.broadcastFields,
                ...CallDescription_1.callFields,
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = (await this.getCredentials('baileyApi'));
        let sock;
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                let result;
                if (resource === 'recovery') {
                    const triggerId = this.getNodeParameter('triggerId', i);
                    const workflowId = this.getWorkflow().id;
                    if (!triggerId || !workflowId) throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Workflow ID and Trigger ID are required.', { itemIndex: i });
                    const dir = path.join((0, AuthStateStore_1.sessionDirFromConfig)(credentials.authDataPath ?? '~/.n8n/baileys', credentials.sessionId), 'recovery');
                    const store = new RecoveryStore_1.RecoveryStore(dir, credentials.sessionId, `${workflowId}:${triggerId}`);
                    result = await RecoveryOperation_1.executeRecoveryOperation.call(this, store, operation, i);
                    result.pairedItem = i;
                    returnData.push(result);
                    continue;
                }
                sock ??= await (0, ConnectionPool_1.getOrCreateConnection)(credentials);
                switch (resource) {
                    case 'message':
                        result = await message_operations_1.executeMessageOperation.call(this, sock, operation, i);
                        break;
                    case 'media':
                        result = await media_operations_1.executeMediaOperation.call(this, sock, operation, i);
                        break;
                    case 'chat':
                        result = await chat_operations_1.executeChatOperation.call(this, sock, operation, i);
                        break;
                    case 'user':
                        result = await user_operations_1.executeUserOperation.call(this, sock, operation, i);
                        break;
                    case 'contact':
                        result = await contact_operations_1.executeContactOperation.call(this, sock, operation, i);
                        break;
                    case 'profile':
                        result = await profile_operations_1.executeProfileOperation.call(this, sock, operation, i);
                        break;
                    case 'group':
                        result = await group_operations_1.executeGroupOperation.call(this, sock, operation, i);
                        break;
                    case 'community':
                        result = await community_operations_1.executeCommunityOperation.call(this, sock, operation, i);
                        break;
                    case 'newsletter':
                        result = await newsletter_operations_1.executeNewsletterOperation.call(this, sock, operation, i);
                        break;
                    case 'business':
                        result = await business_operations_1.executeBusinessOperation.call(this, sock, operation, i);
                        break;
                    case 'label':
                        result = await label_operations_1.executeLabelOperation.call(this, sock, operation, i);
                        break;
                    case 'privacy':
                        result = await privacy_operations_1.executePrivacyOperation.call(this, sock, operation, i);
                        break;
                    case 'broadcast':
                        result = await broadcast_operations_1.executeBroadcastOperation.call(this, sock, operation, i);
                        break;
                    case 'call':
                        result = await call_operations_1.executeCallOperation.call(this, sock, operation, i);
                        break;
                    default:
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
                            itemIndex: i,
                        });
                }
                result.pairedItem = i;
                returnData.push(result);
            }
            catch (error) {
                if (this.continueOnFail()) {
                    const wrappedError = error instanceof n8n_workflow_1.NodeOperationError
                        ? error
                        : new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
                    returnData.push({
                        json: this.getInputData(i)[0].json,
                        error: wrappedError,
                        pairedItem: i,
                    });
                }
                else {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
                }
            }
        }
        return [returnData];
    }
}
export { Bailey };
