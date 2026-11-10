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
		description: 'Create or inspect a WhatsApp session and return its pairing code or QR image',
		defaults: { name: 'Bailey Auth' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'baileyApi', required: true }],
		properties: [
			{
				displayName: 'This node starts or reuses the WhatsApp session. Pairing codes are included in node output and n8n logs. The pending socket stays alive for up to five minutes.',
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
		const result = await waitForAuthPrompt({
			socket: socket as never,
			getEntry: () => getPoolEntry(sessionId) as never,
			authMethod,
			phoneNumber,
			timeoutMs: 60_000,
		});

		const item: INodeExecutionData = {
			json: {
				sessionId,
				authenticated: result.status === 'authenticated',
				authStatus: result.status,
			},
		};

		if (result.status === 'pairingCode') {
			const pairingCode = result.pairingCode.length === 8
				? `${result.pairingCode.slice(0, 4)}-${result.pairingCode.slice(4)}`
				: result.pairingCode;
			item.json.pairingCode = pairingCode;
			item.json.instructions = 'In WhatsApp, open Settings → Linked Devices → Link a Device → Link with phone number and enter this code.';
			this.logger.info(`[Bailey Auth] Pairing code for session ${sessionId}: ${pairingCode}`);
		} else if (result.status === 'qrCode') {
			const png = await QRCode.toBuffer(result.qr, { type: 'png', width: 360, margin: 2 });
			item.json.instructions = 'Scan this image in WhatsApp → Settings → Linked Devices → Link a Device.';
			item.binary = {
				qrCode: await this.helpers.prepareBinaryData(png, 'bailey-qr.png', 'image/png'),
			};
		} else if (result.status === 'timeout') {
			item.json.message = 'No authentication prompt arrived within 60 seconds. Run this node again; the session socket remains available until its five-minute authentication timeout.';
		} else if (result.status === 'error') {
			item.json.message = result.message;
		}

		return [[item]];
	}
}

export { BaileyAuth };
