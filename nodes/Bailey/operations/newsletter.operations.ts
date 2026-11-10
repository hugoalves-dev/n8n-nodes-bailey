// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeNewsletterOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeNewsletterOperation(sock, operation, i) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    switch (operation) {
        case 'create': {
            const name = this.getNodeParameter('name', i);
            const description = this.getNodeParameter('description', i, '');
            const result = await sock.newsletterCreate(name, description || undefined);
            return { json: result };
        }
        case 'getMetadata': {
            const lookupType = this.getNodeParameter('lookupType', i, 'jid');
            const key = this.getNodeParameter('metadataKey', i);
            const result = await sock.newsletterMetadata(lookupType, key);
            return { json: (_a = result) !== null && _a !== void 0 ? _a : {} };
        }
        case 'follow': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.newsletterFollow(jid);
            return { json: (_b = result) !== null && _b !== void 0 ? _b : { success: true } };
        }
        case 'unfollow': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.newsletterUnfollow(jid);
            return { json: (_c = result) !== null && _c !== void 0 ? _c : { success: true } };
        }
        case 'mute': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.newsletterMute(jid);
            return { json: (_d = result) !== null && _d !== void 0 ? _d : { success: true } };
        }
        case 'unmute': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.newsletterUnmute(jid);
            return { json: (_e = result) !== null && _e !== void 0 ? _e : { success: true } };
        }
        case 'updateName': {
            const jid = this.getNodeParameter('jid', i);
            const name = this.getNodeParameter('name', i);
            const result = await sock.newsletterUpdateName(jid, name);
            return { json: (_f = result) !== null && _f !== void 0 ? _f : { success: true } };
        }
        case 'updateDescription': {
            const jid = this.getNodeParameter('jid', i);
            const description = this.getNodeParameter('description', i);
            const result = await sock.newsletterUpdateDescription(jid, description);
            return { json: (_g = result) !== null && _g !== void 0 ? _g : { success: true } };
        }
        case 'updatePicture': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('pictureSource', i);
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const content = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.newsletterUpdatePicture(jid, content);
            return { json: (_h = result) !== null && _h !== void 0 ? _h : { success: true } };
        }
        case 'removePicture': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.newsletterRemovePicture(jid);
            return { json: (_j = result) !== null && _j !== void 0 ? _j : { success: true } };
        }
        case 'reactMessage': {
            const jid = this.getNodeParameter('jid', i);
            const serverId = this.getNodeParameter('serverId', i);
            const reaction = this.getNodeParameter('reaction', i, '');
            await sock.newsletterReactMessage(jid, serverId, reaction || undefined);
            return { json: { success: true } };
        }
        case 'fetchMessages': {
            const jid = this.getNodeParameter('jid', i);
            const count = this.getNodeParameter('count', i, 10);
            const since = this.getNodeParameter('since', i, 0);
            const after = this.getNodeParameter('after', i, 0);
            const result = await sock.newsletterFetchMessages(jid, count, since, after);
            return { json: result };
        }
        case 'getSubscribers': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.newsletterSubscribers(jid);
            return { json: result };
        }
        case 'delete': {
            const jid = this.getNodeParameter('jid', i);
            await sock.newsletterDelete(jid);
            return { json: { success: true, jid } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown newsletter operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
