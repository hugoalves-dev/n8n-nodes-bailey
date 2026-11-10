// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeUserOperation = executeUserOperation;
Object.defineProperty(exports, "__esModule", { value: true });
const n8n_workflow_1 = require("n8n-workflow");
async function executeUserOperation(sock, operation, i) {
    var _a, _b, _c;
    switch (operation) {
        case 'checkExists': {
            const jid = this.getNodeParameter('jid', i);
            const results = await sock.onWhatsApp(jid);
            const result = results === null || results === void 0 ? void 0 : results[0];
            return { json: result !== null && result !== void 0 ? result : { exists: false } };
        }
        case 'getStatus': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.fetchStatus(jid);
            return { json: (_a = result) !== null && _a !== void 0 ? _a : {} };
        }
        case 'getProfilePicture': {
            const jid = this.getNodeParameter('jid', i);
            const picType = this.getNodeParameter('picType', i, 'preview');
            const url = await sock.profilePictureUrl(jid, picType);
            return { json: { url: url !== null && url !== void 0 ? url : null, jid } };
        }
        case 'getBusinessProfile': {
            const jid = this.getNodeParameter('jid', i);
            const profile = await sock.getBusinessProfile(jid);
            return { json: (_b = profile) !== null && _b !== void 0 ? _b : {} };
        }
        case 'subscribePresence': {
            const jid = this.getNodeParameter('jid', i);
            await sock.presenceSubscribe(jid);
            return { json: { success: true, jid, action: 'subscribePresence' } };
        }
        case 'sendPresence': {
            const presenceType = this.getNodeParameter('presenceType', i, 'available');
            const presenceJid = this.getNodeParameter('presenceJid', i, '');
            await sock.sendPresenceUpdate(presenceType, presenceJid || undefined);
            return { json: { success: true, presence: presenceType } };
        }
        case 'fetchDisappearingDuration': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.fetchDisappearingDuration(jid);
            return { json: (_c = result) !== null && _c !== void 0 ? _c : {} };
        }
        case 'fetchMessageHistory': {
            const count = this.getNodeParameter('historyCount', i, 25);
            const keyJson = this.getNodeParameter('oldestMsgKey', i, '{}');
            const timestamp = this.getNodeParameter('oldestMsgTimestamp', i, 0);
            const requestId = await sock.fetchMessageHistory(count, keyJson, timestamp);
            return { json: { requestId, note: 'Results arrive via messaging-history.set event' } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown user operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
//# sourceMappingURL=user.operations.js.map