// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import { buildAboutInput, clearAbout, defaultAboutDuration, getAbout, updateAbout } from '../transport/ProfileAbout';
export { executeProfileOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeProfileOperation(sock, operation, i) {
    var _a, _b, _c, _d;
    switch (operation) {
        case 'updateAbout': {
            const duration = this.getNodeParameter('aboutDuration', i, defaultAboutDuration);
            const input = buildAboutInput(
                this.getNodeParameter('aboutText', i),
                this.getNodeParameter('aboutEmoji', i, ''),
                duration,
                duration === 'custom' ? this.getNodeParameter('aboutExpiresAt', i) : undefined,
            );
            return { json: await updateAbout(sock, input) };
        }
        case 'getAbout':
            return { json: await getAbout(sock) };
        case 'clearAbout':
            return { json: await clearAbout(sock) };
        case 'updateStatus': {
            const status = this.getNodeParameter('status', i);
            await sock.updateProfileStatus(status);
            return { json: { success: true, status } };
        }
        case 'updateName': {
            const name = this.getNodeParameter('name', i);
            await sock.updateProfileName(name);
            return { json: { success: true, name } };
        }
        case 'updatePicture': {
            const src = this.getNodeParameter('pictureSource', i);
            const isUrl = src.startsWith('http://') || src.startsWith('https://');
            const content = isUrl ? { url: src } : await this.helpers.getBinaryDataBuffer(i, src);
            await sock.updateProfilePicture((_b = (_a = sock.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '', content);
            return { json: { success: true } };
        }
        case 'removePicture': {
            await sock.removeProfilePicture((_d = (_c = sock.user) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : '');
            return { json: { success: true } };
        }
        case 'setDisappearing': {
            const duration = this.getNodeParameter('disappearingDuration', i, 0);
            await sock.updateDefaultDisappearingMode(duration);
            return { json: { success: true, duration } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown profile operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
