// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeLabelOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeLabelOperation(sock, operation, i) {
    switch (operation) {
        case 'setLabels': {
            const jid = this.getNodeParameter('jid', i);
            const labelsJson = this.getNodeParameter('labelsJson', i);
            await sock.addLabel(jid, labelsJson);
            return { json: { success: true, jid } };
        }
        case 'addChatLabel': {
            const jid = this.getNodeParameter('jid', i);
            const labelId = this.getNodeParameter('labelId', i);
            await sock.addChatLabel(jid, labelId);
            return { json: { success: true, jid, labelId } };
        }
        case 'removeChatLabel': {
            const jid = this.getNodeParameter('jid', i);
            const labelId = this.getNodeParameter('labelId', i);
            await sock.removeChatLabel(jid, labelId);
            return { json: { success: true, jid, labelId } };
        }
        case 'addMessageLabel': {
            const jid = this.getNodeParameter('jid', i);
            const labelId = this.getNodeParameter('labelId', i);
            const messageId = this.getNodeParameter('messageId', i);
            await sock.addMessageLabel(jid, messageId, labelId);
            return { json: { success: true, jid, messageId, labelId } };
        }
        case 'removeMessageLabel': {
            const jid = this.getNodeParameter('jid', i);
            const labelId = this.getNodeParameter('labelId', i);
            const messageId = this.getNodeParameter('messageId', i);
            await sock.removeMessageLabel(jid, messageId, labelId);
            return { json: { success: true, jid, messageId, labelId } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown label operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
