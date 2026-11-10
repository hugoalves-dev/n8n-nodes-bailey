// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeBusinessOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeBusinessOperation(sock, operation, i) {
    switch (operation) {
        case 'getCatalog': {
            const jid = this.getNodeParameter('jid', i, '');
            const limit = this.getNodeParameter('limit', i, 10);
            const cursor = this.getNodeParameter('cursor', i, '');
            const result = await sock.getCatalog({ jid: jid || undefined, limit, cursor: cursor || undefined });
            return { json: result };
        }
        case 'getCollections': {
            const jid = this.getNodeParameter('jid', i, '');
            const limit = this.getNodeParameter('limit', i, 10);
            const result = await sock.getCollections(jid || undefined, limit);
            return { json: result };
        }
        case 'getOrderDetails': {
            const orderId = this.getNodeParameter('orderId', i);
            const orderToken = this.getNodeParameter('orderToken', i);
            const result = await sock.getOrderDetails(orderId, orderToken);
            return { json: result };
        }
        case 'createProduct': {
            const productData = this.getNodeParameter('productData', i);
            const result = await sock.productCreate(productData);
            return { json: result };
        }
        case 'updateProduct': {
            const productId = this.getNodeParameter('productId', i);
            const productData = this.getNodeParameter('productData', i);
            const result = await sock.productUpdate(productId, productData);
            return { json: result };
        }
        case 'deleteProducts': {
            const productIdsStr = this.getNodeParameter('productIds', i);
            const productIds = productIdsStr.split(',').map((id) => id.trim()).filter(Boolean);
            const result = await sock.productDelete(productIds);
            return { json: result };
        }
        case 'updateProfile': {
            const profileData = this.getNodeParameter('profileData', i);
            const result = await sock.updateBussinesProfile(profileData);
            return { json: result };
        }
        case 'updateCoverPhoto': {
            const src = this.getNodeParameter('coverPhotoSource', i);
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const content = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.updateCoverPhoto(content);
            return { json: { result } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown business operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
