"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePrivacyOperation = executePrivacyOperation;
const n8n_workflow_1 = require("n8n-workflow");
async function executePrivacyOperation(sock, operation, i) {
    switch (operation) {
        case 'getSettings': {
            const result = await sock.fetchPrivacySettings(true);
            return { json: result };
        }
        case 'getBlocklist': {
            const result = await sock.fetchBlocklist();
            return { json: { blocklist: result } };
        }
        case 'block': {
            const jid = this.getNodeParameter('jid', i);
            await sock.updateBlockStatus(jid, 'block');
            return { json: { success: true, jid, action: 'block' } };
        }
        case 'unblock': {
            const jid = this.getNodeParameter('jid', i);
            await sock.updateBlockStatus(jid, 'unblock');
            return { json: { success: true, jid, action: 'unblock' } };
        }
        case 'updateLastSeen': {
            const value = this.getNodeParameter('lastSeenValue', i);
            await sock.updateLastSeenPrivacy(value);
            return { json: { success: true, setting: 'lastSeen', value } };
        }
        case 'updateOnline': {
            const value = this.getNodeParameter('onlineValue', i);
            await sock.updateOnlinePrivacy(value);
            return { json: { success: true, setting: 'online', value } };
        }
        case 'updateProfilePicture': {
            const value = this.getNodeParameter('profilePictureValue', i);
            await sock.updateProfilePicturePrivacy(value);
            return { json: { success: true, setting: 'profilePicture', value } };
        }
        case 'updateReadReceipts': {
            const value = this.getNodeParameter('readReceiptsValue', i);
            await sock.updateReadReceiptsPrivacy(value);
            return { json: { success: true, setting: 'readReceipts', value } };
        }
        case 'updateCallPrivacy': {
            const value = this.getNodeParameter('callPrivacyValue', i);
            await sock.updateCallPrivacy(value);
            return { json: { success: true, setting: 'callPrivacy', value } };
        }
        case 'updateGroupsAdd': {
            const value = this.getNodeParameter('groupsAddValue', i);
            await sock.updateGroupsAddPrivacy(value);
            return { json: { success: true, setting: 'groupsAdd', value } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown privacy operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
//# sourceMappingURL=privacy.operations.js.map