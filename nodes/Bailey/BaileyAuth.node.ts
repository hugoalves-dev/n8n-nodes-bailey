import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import * as QRCode from 'qrcode';
import { getOrCreateConnection, getPoolEntry, getSessionSubscriptionStatus } from './transport/ConnectionPool';
import { waitForAuthPrompt } from './transport/AuthSetupService';
import { normalizePhoneNumber } from './transport/TransportPolicy';

class BaileyAuth implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bailey Auth',
		name: 'baileyAuth',
		icon: { light: 'file:bailey.svg', dark: 'file:bailey.dark.svg' },
		group: ['input'],
		version: 1,
		description: 'Return a pairing code or QR immediately, or inspect the current session',
		defaults: { name: 'Bailey Auth' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'baileyApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'startPairing',
				options: [
					{ name: 'Start Pairing', value: 'startPairing', description: 'Return a code or QR without waiting for authentication', action: 'Return a code or QR without waiting for authentication' },
					{ name: 'Check Status', value: 'checkStatus', description: 'Inspect the active connection without requesting a code', action: 'Inspect the active connection without requesting a code' },
					{ name: 'Wait for Authentication', value: 'waitForAuthentication', description: 'Legacy mode: wait for success or failure and log the prompt', action: 'Wait for success or failure and log the prompt' },
				],
			},
			{
				displayName: 'Pairing codes and QR codes are secrets stored in execution data. Protect execution history. Start Pairing requires a long-lived n8n process.',
				name: 'authenticationNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0, 'startPairing') as string;
		const credentials = await this.getCredentials('baileyApi');
		const sessionId = String(credentials.sessionId ?? 'default');
		const authMethod = String(credentials.authMethod ?? 'pairingCode');
		const phoneNumber = normalizePhoneNumber(String(credentials.phoneNumber ?? ''));
		if (operation === 'checkStatus') {
			const entry = getPoolEntry(sessionId);
			const connection = entry?.connectionState?.connection ?? 'unknown';
			const authenticated = entry?.authRegistered === true && connection === 'open';
			return [[{ json: { sessionId, authenticated, authStatus: authenticated ? 'authenticated' : 'pending', connection, triggerSubscriptions: getSessionSubscriptionStatus(sessionId) } }]];
		}

		const socket = await getOrCreateConnection(credentials as never, operation === 'startPairing');
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
			returnOnPrompt: operation === 'startPairing',
			onPrompt: (prompt) => {
				if (operation === 'startPairing' || !promptActive || !isSocketActive()) return;
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

		if (result.status === 'pairingCode') {
			item.json.pairingCode = result.pairingCode.length === 8
				? `${result.pairingCode.slice(0, 4)}-${result.pairingCode.slice(4)}`
				: result.pairingCode;
			item.json.message = 'Enter this code under WhatsApp Linked Devices, then execute Check Status. The socket stays alive for up to five minutes.';
		} else if (result.status === 'qrCode') {
			const qrBuffer = await QRCode.toBuffer(result.qr, { width: 300, margin: 2 });
			item.binary = { qrCode: await this.helpers.prepareBinaryData(qrBuffer, 'bailey-pairing.png', 'image/png') };
			item.json.message = 'Scan the QR from the Binary tab, then execute Check Status.';
		} else if (result.status === 'authenticated') {
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
