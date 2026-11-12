// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeChatOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeChatOperation(sock, operation, i) {
    const jid = this.getNodeParameter('jid', i);
    switch (operation) {
        case 'archive':
            await sock.chatModify({ archive: true, lastMessages: [] }, jid);
            return { json: { success: true, jid, action: 'archive' } };
        case 'unarchive':
            await sock.chatModify({ archive: false, lastMessages: [] }, jid);
            return { json: { success: true, jid, action: 'unarchive' } };
        case 'mute': {
            const muteDuration = this.getNodeParameter('muteDuration', i, 86400000);
            await sock.chatModify({ mute: muteDuration === -1 ? null : muteDuration }, jid);
            return { json: { success: true, jid, action: 'mute', duration: muteDuration } };
        }
        case 'unmute':
            await sock.chatModify({ mute: null }, jid);
            return { json: { success: true, jid, action: 'unmute' } };
        case 'markRead':
            await sock.chatModify({ markRead: true, lastMessages: [] }, jid);
            return { json: { success: true, jid, action: 'markRead' } };
        case 'markChatReadThroughMessage': {
            let lastMessage;
            try {
                lastMessage = JSON.parse(this.getNodeParameter('lastMessage', i));
            }
            catch {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Last Message must be valid JSON.', {
                    itemIndex: i,
                });
            }
            const key = lastMessage?.key;
            const timestamp = Number(lastMessage?.messageTimestamp);
            if (!key
                || typeof key !== 'object'
                || typeof key.remoteJid !== 'string'
                || key.remoteJid !== jid
                || typeof key.fromMe !== 'boolean'
                || typeof key.id !== 'string'
                || !key.id
                || !Number.isFinite(timestamp)
                || timestamp <= 0
                || (jid.endsWith('@g.us') && key.fromMe === false && typeof key.participant !== 'string')) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Last Message must include a matching chat key, message ID, timestamp, and a participant for incoming group messages.', {
                    itemIndex: i,
                });
            }
            lastMessage.messageTimestamp = timestamp;
            await sock.chatModify({ markRead: true, lastMessages: [lastMessage] }, jid);
            return { json: { success: true, jid, action: 'markChatReadThroughMessage', messageId: key.id } };
        }
        case 'markMessageRead': {
            let messageKey;
            try {
                messageKey = JSON.parse(this.getNodeParameter('messageKey', i));
            }
            catch {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Message Key must be valid JSON.', {
                    itemIndex: i,
                });
            }
            if (!messageKey
                || typeof messageKey !== 'object'
                || typeof messageKey.remoteJid !== 'string'
                || messageKey.remoteJid !== jid
                || typeof messageKey.fromMe !== 'boolean'
                || typeof messageKey.id !== 'string') {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Message Key must include a matching remoteJid, fromMe, and id.', {
                    itemIndex: i,
                });
            }
            await sock.readMessages([messageKey]);
            return { json: { success: true, jid, action: 'markMessageRead', messageId: messageKey.id } };
        }
        case 'markUnread':
            await sock.chatModify({ markRead: false, lastMessages: [] }, jid);
            return { json: { success: true, jid, action: 'markUnread' } };
        case 'pin':
            await sock.chatModify({ pin: true }, jid);
            return { json: { success: true, jid, action: 'pin' } };
        case 'unpin':
            await sock.chatModify({ pin: false }, jid);
            return { json: { success: true, jid, action: 'unpin' } };
        case 'deleteChat':
            await sock.chatModify({ delete: true, lastMessages: [] }, jid);
            return { json: { success: true, jid, action: 'deleteChat' } };
        case 'clearChat':
            await sock.chatModify({ clear: true, lastMessages: [] }, jid);
            return { json: { success: true, jid, action: 'clearChat' } };
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown chat operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
