// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeBroadcastOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeBroadcastOperation(sock, operation, i) {
    switch (operation) {
        case 'sendBroadcast': {
            const broadcastJid = this.getNodeParameter('broadcastJid', i);
            const statusJidsStr = this.getNodeParameter('statusJids', i);
            const statusJidList = statusJidsStr.split(',').map((j) => j.trim()).filter(Boolean);
            const msgType = this.getNodeParameter('msgType', i, 'text');
            let content;
            if (msgType === 'text') {
                const text = this.getNodeParameter('text', i);
                content = { text };
            }
            else {
                const src = this.getNodeParameter('mediaSource', i);
                const caption = this.getNodeParameter('caption', i, '');
                const isUrl = src.startsWith('http://') || src.startsWith('https://');
                const mediaContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
                content = msgType === 'image'
                    ? { image: mediaContent, caption: caption || undefined }
                    : { video: mediaContent, caption: caption || undefined };
            }
            const result = await sock.sendMessage(broadcastJid, {
                ...content,
                broadcast: true,
                statusJidList,
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendStory': {
            const STORIES_JID = 'status@broadcast';
            const msgType = this.getNodeParameter('msgType', i, 'text');
            let content;
            if (msgType === 'text') {
                const text = this.getNodeParameter('text', i);
                content = { text };
            }
            else {
                const src = this.getNodeParameter('mediaSource', i);
                const caption = this.getNodeParameter('caption', i, '');
                const isUrl = src.startsWith('http://') || src.startsWith('https://');
                const mediaContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
                content = msgType === 'image'
                    ? { image: mediaContent, caption: caption || undefined }
                    : { video: mediaContent, caption: caption || undefined };
            }
            const result = await sock.sendMessage(STORIES_JID, content);
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown broadcast operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
