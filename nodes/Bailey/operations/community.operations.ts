// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeCommunityOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeCommunityOperation(sock, operation, i) {
    var _a, _b;
    switch (operation) {
        case 'create': {
            const subject = this.getNodeParameter('subject', i);
            const body = this.getNodeParameter('body', i, '');
            const result = await sock.communityCreate(subject, body);
            return { json: (_a = result) !== null && _a !== void 0 ? _a : {} };
        }
        case 'getMetadata': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.communityMetadata(jid);
            return { json: result };
        }
        case 'createGroup': {
            const jid = this.getNodeParameter('jid', i);
            const subject = this.getNodeParameter('subject', i);
            const participantsStr = this.getNodeParameter('participants', i, '');
            const participants = participantsStr.split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.communityCreateGroup(subject, participants, jid);
            return { json: (_b = result) !== null && _b !== void 0 ? _b : {} };
        }
        case 'linkGroup': {
            const jid = this.getNodeParameter('jid', i);
            const groupJid = this.getNodeParameter('groupJid', i);
            await sock.communityLinkGroup(groupJid, jid);
            return { json: { success: true } };
        }
        case 'unlinkGroup': {
            const jid = this.getNodeParameter('jid', i);
            const groupJid = this.getNodeParameter('groupJid', i);
            await sock.communityUnlinkGroup(groupJid, jid);
            return { json: { success: true } };
        }
        case 'fetchLinkedGroups': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.communityFetchLinkedGroups(jid);
            return { json: result };
        }
        case 'updateSubject': {
            const jid = this.getNodeParameter('jid', i);
            const subject = this.getNodeParameter('subject', i);
            await sock.communityUpdateSubject(jid, subject);
            return { json: { success: true, jid } };
        }
        case 'updateDescription': {
            const jid = this.getNodeParameter('jid', i);
            const body = this.getNodeParameter('body', i, '');
            await sock.communityUpdateDescription(jid, body || undefined);
            return { json: { success: true, jid } };
        }
        case 'updateSettings': {
            const jid = this.getNodeParameter('jid', i);
            const setting = this.getNodeParameter('setting', i);
            await sock.communitySettingUpdate(jid, setting);
            return { json: { success: true, jid, setting } };
        }
        case 'addParticipants': {
            const jid = this.getNodeParameter('jid', i);
            const jids = this.getNodeParameter('participants', i).split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.communityParticipantsUpdate(jid, jids, 'add');
            return { json: { results: result } };
        }
        case 'removeParticipants': {
            const jid = this.getNodeParameter('jid', i);
            const jids = this.getNodeParameter('participants', i).split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.communityParticipantsUpdate(jid, jids, 'remove');
            return { json: { results: result } };
        }
        case 'leave': {
            const jid = this.getNodeParameter('jid', i);
            await sock.communityLeave(jid);
            return { json: { success: true, jid } };
        }
        case 'getInviteCode': {
            const jid = this.getNodeParameter('jid', i);
            const code = await sock.communityInviteCode(jid);
            return { json: { code: code !== null && code !== void 0 ? code : null, link: code ? `https://chat.whatsapp.com/${code}` : null } };
        }
        case 'toggleEphemeral': {
            const jid = this.getNodeParameter('jid', i);
            const duration = this.getNodeParameter('ephemeralDuration', i, 0);
            await sock.communityToggleEphemeral(jid, duration);
            return { json: { success: true, jid, duration } };
        }
        case 'setJoinApprovalMode': {
            const jid = this.getNodeParameter('jid', i);
            const mode = this.getNodeParameter('joinApprovalMode', i);
            await sock.communityJoinApprovalMode(jid, mode);
            return { json: { success: true, jid, mode } };
        }
        case 'getAllParticipating': {
            const result = await sock.communityFetchAllParticipating();
            return { json: result };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown community operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
