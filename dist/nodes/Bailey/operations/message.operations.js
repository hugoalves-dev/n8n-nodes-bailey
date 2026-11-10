// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeMessageOperation = executeMessageOperation;
Object.defineProperty(exports, "__esModule", { value: true });
const n8n_workflow_1 = require("n8n-workflow");
async function executeMessageOperation(sock, operation, i) {
    switch (operation) {
        case 'sendText': {
            const jid = this.getNodeParameter('jid', i);
            const text = this.getNodeParameter('text', i);
            const mentionsStr = this.getNodeParameter('mentions', i, '');
            const mentions = mentionsStr ? mentionsStr.split(',').map((m) => m.trim()) : [];
            const result = await sock.sendMessage(jid, { text, mentions });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendImage': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const caption = this.getNodeParameter('caption', i, '');
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const imageContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, { image: imageContent, caption: caption || undefined });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendVideo': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const caption = this.getNodeParameter('caption', i, '');
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const videoContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, { video: videoContent, caption: caption || undefined });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendAudio': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const ptt = this.getNodeParameter('ptt', i, false);
            const mimeType = this.getNodeParameter('mimeType', i, '');
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const audioContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, {
                audio: audioContent,
                ptt,
                mimetype: mimeType || undefined,
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendDocument': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const filename = this.getNodeParameter('filename', i, '');
            const mimeType = this.getNodeParameter('mimeType', i, '');
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const docContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, {
                document: docContent,
                fileName: filename || 'file',
                mimetype: mimeType || 'application/octet-stream',
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendSticker': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const stickerContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, { sticker: stickerContent });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendLocation': {
            const jid = this.getNodeParameter('jid', i);
            const latitude = this.getNodeParameter('latitude', i);
            const longitude = this.getNodeParameter('longitude', i);
            const locationName = this.getNodeParameter('locationName', i, '');
            const address = this.getNodeParameter('address', i, '');
            const result = await sock.sendMessage(jid, {
                location: {
                    degreesLatitude: latitude,
                    degreesLongitude: longitude,
                    name: locationName || undefined,
                    address: address || undefined,
                },
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendContact': {
            const jid = this.getNodeParameter('jid', i);
            const contactName = this.getNodeParameter('contactName', i);
            const contactPhone = this.getNodeParameter('contactPhone', i);
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL;type=CELL;type=VOICE;waid=${contactPhone}:+${contactPhone}\nEND:VCARD`;
            const result = await sock.sendMessage(jid, {
                contacts: { displayName: contactName, contacts: [{ vcard }] },
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendGif': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const caption = this.getNodeParameter('caption', i, '');
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const gifContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, {
                video: gifContent,
                gifPlayback: true,
                caption: caption || undefined,
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendPoll': {
            const jid = this.getNodeParameter('jid', i);
            const pollName = this.getNodeParameter('pollName', i);
            const optionsStr = this.getNodeParameter('pollOptions', i);
            const selectableCount = this.getNodeParameter('selectableCount', i, 1);
            const values = optionsStr.split(',').map((o) => o.trim()).filter(Boolean);
            const result = await sock.sendMessage(jid, { poll: { name: pollName, values, selectableCount } });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendReaction': {
            const jid = this.getNodeParameter('jid', i);
            const messageId = this.getNodeParameter('messageId', i);
            const fromMe = this.getNodeParameter('messageFromMe', i, false);
            const emoji = this.getNodeParameter('emoji', i);
            const result = await sock.sendMessage(jid, {
                react: { text: emoji, key: { remoteJid: jid, id: messageId, fromMe } },
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendProduct': {
            const jid = this.getNodeParameter('jid', i);
            const productJson = this.getNodeParameter('productJson', i);
            const result = await sock.sendMessage(jid, { product: productJson });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendEvent': {
            const jid = this.getNodeParameter('jid', i);
            const eventName = this.getNodeParameter('eventName', i);
            const startTime = this.getNodeParameter('eventStartTime', i);
            const location = this.getNodeParameter('eventLocation', i, '');
            const result = await sock.sendMessage(jid, {
                event: { name: eventName, startTime, location },
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'pinMessage': {
            const jid = this.getNodeParameter('jid', i);
            const messageId = this.getNodeParameter('messageId', i);
            const fromMe = this.getNodeParameter('messageFromMe', i, false);
            const pinAction = this.getNodeParameter('pinAction', i, 'pin');
            const pinDuration = this.getNodeParameter('pinDuration', i, 86400);
            const key = { remoteJid: jid, id: messageId, fromMe };
            const result = await sock.sendMessage(jid, {
                pin: { type: pinAction === 'pin' ? 1 : 2, time: pinDuration, key },
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'forward': {
            const jid = this.getNodeParameter('jid', i);
            const messageJson = this.getNodeParameter('messageJson', i);
            const result = await sock.sendMessage(jid, {
                forward: messageJson,
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'deleteForEveryone': {
            const jid = this.getNodeParameter('jid', i);
            const messageId = this.getNodeParameter('messageId', i);
            const fromMe = this.getNodeParameter('messageFromMe', i, false);
            const result = await sock.sendMessage(jid, {
                delete: { remoteJid: jid, id: messageId, fromMe },
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'deleteForMe': {
            const jid = this.getNodeParameter('jid', i);
            const messageId = this.getNodeParameter('messageId', i);
            const fromMe = this.getNodeParameter('messageFromMe', i, false);
            await sock.chatModify({
                deleteForMe: { deleteMedia: true, key: { remoteJid: jid, id: messageId, fromMe }, timestamp: Date.now() },
            }, jid);
            return { json: { success: true } };
        }
        case 'edit': {
            const jid = this.getNodeParameter('jid', i);
            const messageId = this.getNodeParameter('messageId', i);
            const fromMe = this.getNodeParameter('messageFromMe', i, true);
            const newText = this.getNodeParameter('newText', i);
            const result = await sock.sendMessage(jid, {
                text: newText,
                edit: { remoteJid: jid, id: messageId, fromMe },
            });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendViewOnce': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const mediaContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, { image: mediaContent, viewOnce: true });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sendVideoNote': {
            const jid = this.getNodeParameter('jid', i);
            const src = this.getNodeParameter('mediaUrlOrBinary', i);
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const videoContent = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            const result = await sock.sendMessage(jid, { video: videoContent, ptv: true });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        case 'sharePhoneNumber': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.sendMessage(jid, { sharePhoneNumber: true });
            return { json: (result !== null && result !== void 0 ? result : {}) };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown message operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
//# sourceMappingURL=message.operations.js.map