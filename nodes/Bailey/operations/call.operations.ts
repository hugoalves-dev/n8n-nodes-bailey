// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeCallOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeCallOperation(sock, operation, i) {
    switch (operation) {
        case 'reject': {
            const callId = this.getNodeParameter('callId', i);
            const callFrom = this.getNodeParameter('callFrom', i);
            await sock.rejectCall(callId, callFrom);
            return { json: { success: true, callId, callFrom } };
        }
        case 'createLink': {
            const callType = this.getNodeParameter('callType', i, 'audio');
            const link = await sock.createCallLink(callType);
            return { json: { link } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown call operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
