import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import * as QRCode from 'qrcode';
import { getOrCreateConnection, getPoolEntry } from './transport/ConnectionPool';
import { waitForAuthPrompt } from './transport/AuthSetupService';
import { normalizePhoneNumber } from './transport/TransportPolicy';

class BaileyAuth implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bailey Auth',
		name: 'baileyAuth',
		icon: { light: 'file:bailey.svg', dark: 'file:bailey.dark.svg' },
		group: ['input'],
		version: 1,
		description: 'Keep a WhatsApp session alive through pairing and report the authentication result',
		defaults: { name: 'Bailey Auth' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'baileyApi', required: true }],
		properties: [
			{
				displayName: 'This node stays active until authentication succeeds or fails. Find the temporary prompt in execution logs and restrict log access.',
				name: 'authenticationNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('baileyApi');
		const sessionId = String(credentials.sessionId ?? 'default');
		const authMethod = String(credentials.authMethod ?? 'pairingCode');
		const phoneNumber = normalizePhoneNumber(String(credentials.phoneNumber ?? ''));
		const socket = await getOrCreateConnection(credentials as never);
		let promptActive = true;
		const isSocketActive = () => {
			const entry = getPoolEntry(sessionId);
			return entry?.socket === socket && entry.connectionState?.connection !== 'close';
		};
		const result = await waitForAuthPrompt({
			socket: socket as never,
			getEntry: () => getPoolEntry(sessionId) as never,
			authMethod,
			phoneNumber,
			timeoutMs: 300_000,
			onPrompt: (prompt) => {
				if (!promptActive || !isSocketActive()) return;
				if (prompt.status === 'pairingCode') {
					const code = prompt.pairingCode.length === 8
						? `${prompt.pairingCode.slice(0, 4)}-${prompt.pairingCode.slice(4)}`
						: prompt.pairingCode;
					this.logger.info(`[Bailey Auth] Pairing code: ${code}`);
					return;
				}
				return QRCode.toString(prompt.qr, { type: 'terminal' }).then((qr) => {
					if (!promptActive || !isSocketActive()) return;
					this.logger.info(`[Bailey Auth] Scan this QR code in WhatsApp:\n${qr}`);
				});
			},
		});
		promptActive = false;

		const item: INodeExecutionData = {
			json: {
				sessionId,
				authenticated: result.status === 'authenticated',
				authStatus: result.status,
			},
		};

		if (result.status === 'authenticated') {
			item.json.message = 'The WhatsApp session is authenticated.';
		} else if (result.status === 'timeout') {
			item.json.message = 'Authentication did not complete within five minutes. The prompt has expired; run this node again for a fresh prompt.';
		} else if (result.status === 'error') {
			item.json.message = result.message;
			if (result.statusCode !== undefined) item.json.disconnectStatusCode = result.statusCode;
			if (result.reason !== undefined) item.json.disconnectReason = result.reason;
		}

		return [[item]];
	}
}

export { BaileyAuth };
