// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeContactOperation = executeContactOperation;
Object.defineProperty(exports, "__esModule", { value: true });
const n8n_workflow_1 = require("n8n-workflow");
async function executeContactOperation(sock, operation, i) {
    switch (operation) {
        case 'addOrEdit': {
            const jid = this.getNodeParameter('jid', i);
            const fullName = this.getNodeParameter('fullName', i, '');
            const firstName = this.getNodeParameter('firstName', i, '');
            await sock.addOrEditContact(jid, {
                fullName: fullName || undefined,
                firstName: firstName || undefined,
            });
            return { json: { success: true, jid } };
        }
        case 'remove': {
            const jid = this.getNodeParameter('jid', i);
            await sock.removeContact(jid);
            return { json: { success: true, jid } };
        }
        case 'requestPhoneNumber': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.sendMessage(jid, { requestPhoneNumber: true });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown contact operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
//# sourceMappingURL=contact.operations.js.map