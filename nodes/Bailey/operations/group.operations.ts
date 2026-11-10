// Reconstructed from the published 0.1.2 JavaScript distribution; original TypeScript was unavailable.
// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
export { executeGroupOperation };
const n8n_workflow_1 = require("n8n-workflow");
async function executeGroupOperation(sock, operation, i) {
    switch (operation) {
        case 'create': {
            const subject = this.getNodeParameter('subject', i);
            const participantsStr = this.getNodeParameter('participants', i);
            const participants = participantsStr.split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.groupCreate(subject, participants);
            return { json: result };
        }
        case 'getMetadata': {
            const jid = this.getNodeParameter('jid', i);
            const result = await sock.groupMetadata(jid);
            return { json: result };
        }
        case 'getAllParticipating': {
            const result = await sock.groupFetchAllParticipating();
            return { json: result };
        }
        case 'updateSubject': {
            const jid = this.getNodeParameter('jid', i);
            const subject = this.getNodeParameter('subject', i);
            await sock.groupUpdateSubject(jid, subject);
            return { json: { success: true, jid, subject } };
        }
        case 'updateDescription': {
            const jid = this.getNodeParameter('jid', i);
            const description = this.getNodeParameter('description', i, '');
            await sock.groupUpdateDescription(jid, description || undefined);
            return { json: { success: true, jid } };
        }
        case 'updateSettings': {
            const jid = this.getNodeParameter('jid', i);
            const setting = this.getNodeParameter('setting', i);
            await sock.groupSettingUpdate(jid, setting);
            return { json: { success: true, jid, setting } };
        }
        case 'addParticipants': {
            const jid = this.getNodeParameter('jid', i);
            const jids = this.getNodeParameter('participantJids', i).split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.groupParticipantsUpdate(jid, jids, 'add');
            return { json: { results: result } };
        }
        case 'removeParticipants': {
            const jid = this.getNodeParameter('jid', i);
            const jids = this.getNodeParameter('participantJids', i).split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.groupParticipantsUpdate(jid, jids, 'remove');
            return { json: { results: result } };
        }
        case 'promoteParticipants': {
            const jid = this.getNodeParameter('jid', i);
            const jids = this.getNodeParameter('participantJids', i).split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.groupParticipantsUpdate(jid, jids, 'promote');
            return { json: { results: result } };
        }
        case 'demoteParticipants': {
            const jid = this.getNodeParameter('jid', i);
            const jids = this.getNodeParameter('participantJids', i).split(',').map((p) => p.trim()).filter(Boolean);
            const result = await sock.groupParticipantsUpdate(jid, jids, 'demote');
            return { json: { results: result } };
        }
        case 'leave': {
            const jid = this.getNodeParameter('jid', i);
            await sock.groupLeave(jid);
            return { json: { success: true, jid } };
        }
        case 'getInviteCode': {
            const jid = this.getNodeParameter('jid', i);
            const code = await sock.groupInviteCode(jid);
            return { json: { code: code !== null && code !== void 0 ? code : null, link: code ? `https://chat.whatsapp.com/${code}` : null } };
        }
        case 'revokeInvite': {
            const jid = this.getNodeParameter('jid', i);
            const code = await sock.groupRevokeInvite(jid);
            return { json: { code: code !== null && code !== void 0 ? code : null, link: code ? `https://chat.whatsapp.com/${code}` : null } };
        }
        case 'acceptInvite': {
            const code = this.getNodeParameter('inviteCode', i);
            const groupJid = await sock.groupAcceptInvite(code);
            return { json: { groupJid: groupJid !== null && groupJid !== void 0 ? groupJid : null } };
        }
        case 'getInviteInfo': {
            const code = this.getNodeParameter('inviteCode', i);
            const result = await sock.groupGetInviteInfo(code);
            return { json: result };
        }
        case 'toggleEphemeral': {
            const jid = this.getNodeParameter('jid', i);
            const duration = this.getNodeParameter('ephemeralDuration', i, 0);
            await sock.groupToggleEphemeral(jid, duration);
            return { json: { success: true, jid, duration } };
        }
        case 'setMemberAddMode': {
            const jid = this.getNodeParameter('jid', i);
            const mode = this.getNodeParameter('memberAddMode', i);
            await sock.groupMemberAddMode(jid, mode);
            return { json: { success: true, jid, mode } };
        }
        case 'setJoinApprovalMode': {
            const jid = this.getNodeParameter('jid', i);
            const mode = this.getNodeParameter('joinApprovalMode', i);
            await sock.groupJoinApprovalMode(jid, mode);
            return { json: { success: true, jid, mode } };
        }
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unknown group operation: ${operation}`, {
                itemIndex: i,
            });
    }
}
