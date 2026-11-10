"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeChatOperation = executeChatOperation;
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
//# sourceMappingURL=chat.operations.js.map