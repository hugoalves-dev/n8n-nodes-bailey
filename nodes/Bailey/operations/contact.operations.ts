// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeContactOperation };
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
        case 'resyncSavedNames': {
            // Read-only: forget the local version of the contacts collection and download its
            // snapshot again, which re-emits every saved name. No patch is sent to WhatsApp.
            const collection = 'critical_unblock_low';
            await sock.authState.keys.set({ 'app-state-sync-version': { [collection]: null } });
            await sock.resyncAppState([collection], false);
            return { json: { success: true, collection } };
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
