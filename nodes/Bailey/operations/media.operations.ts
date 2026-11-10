// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeMediaOperation };
const baileys_1 = require("@whiskeysockets/baileys");
const n8n_workflow_1 = require("n8n-workflow");
const noopLogger = {
    level: 'silent',
    child: () => noopLogger,
    trace: () => { },
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
async function executeMediaOperation(sock, operation, i) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    switch (operation) {
        case 'download': {
            const messageJson = this.getNodeParameter('messageJson', i);
            const outputFormat = this.getNodeParameter('outputFormat', i, 'buffer');
            const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data');
            const msg = messageJson;
            if (outputFormat !== 'buffer') {
                return { json: { note: 'Stream mode not supported; use buffer mode for binary output' } };
            }
            const buffer = await (0, baileys_1.downloadMediaMessage)(msg, 'buffer', {}, { logger: noopLogger, reuploadRequest: sock.updateMediaMessage });
            const mediaType = ((_a = msg.message) === null || _a === void 0 ? void 0 : _a.imageMessage) ? 'image/jpeg' :
                ((_b = msg.message) === null || _b === void 0 ? void 0 : _b.videoMessage) ? 'video/mp4' :
                    ((_c = msg.message) === null || _c === void 0 ? void 0 : _c.audioMessage) ? 'audio/ogg' :
                        (_f = (_e = (_d = msg.message) === null || _d === void 0 ? void 0 : _d.documentMessage) === null || _e === void 0 ? void 0 : _e.mimetype) !== null && _f !== void 0 ? _f : 'application/octet-stream';
            const fileName = (_j = (_h = (_g = msg.message) === null || _g === void 0 ? void 0 : _g.documentMessage) === null || _h === void 0 ? void 0 : _h.fileName) !== null && _j !== void 0 ? _j : `media-${Date.now()}.bin`;
            const binaryData = await this.helpers.prepareBinaryData(buffer, fileName, mediaType);
            return {
                json: { fileName, mimeType: mediaType },
                binary: { [binaryPropertyName]: binaryData },
            };
        }
        case 'reupload': {
            const messageJson = this.getNodeParameter('messageJson', i);
            const updated = await sock.updateMediaMessage(messageJson);
            return { json: updated };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown media operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
