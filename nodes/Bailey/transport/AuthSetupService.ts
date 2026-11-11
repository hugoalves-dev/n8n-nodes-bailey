import { PairingRequestState, requestPairingCodeOnce } from './PairingCoordinator';

interface ConnectionUpdate {
	qr?: string;
	connection?: string;
	lastDisconnect?: {
		error?: {
			output?: { statusCode?: number };
		};
	};
}

export interface AuthSetupSocket {
	ev: {
		on: (event: string, handler: (update?: ConnectionUpdate) => void) => void;
		off: (event: string, handler: (update?: ConnectionUpdate) => void) => void;
	};
	requestPairingCode: (phoneNumber: string) => Promise<string>;
}

export interface AuthSetupEntry {
	socket: AuthSetupSocket;
	authRegistered: boolean;
	connectionState: ConnectionUpdate;
	pairingState: PairingRequestState;
}

export type AuthPrompt =
	| { status: 'pairingCode'; pairingCode: string }
	| { status: 'qrCode'; qr: string };

export type AuthPromptResult =
	| { status: 'authenticated' }
	| { status: 'timeout' }
	| { status: 'error'; message: string; statusCode?: number; reason?: string };

interface WaitForAuthPromptOptions {
	socket: AuthSetupSocket;
	getEntry: () => AuthSetupEntry | undefined;
	authMethod: string;
	phoneNumber?: string;
	timeoutMs: number;
	onPrompt: (prompt: AuthPrompt) => void | Promise<void>;
}

const DISCONNECT_REASONS: Record<number, string> = {
	401: 'logged out',
	408: 'connection timed out',
	428: 'connection closed',
	440: 'connection replaced',
	500: 'bad session',
	503: 'service unavailable',
	515: 'restart required',
};

function connectionError(update: ConnectionUpdate): AuthPromptResult {
	const statusCode = update.lastDisconnect?.error?.output?.statusCode;
	const reason = statusCode === undefined ? undefined : DISCONNECT_REASONS[statusCode] ?? 'unknown disconnect reason';
	return {
		status: 'error',
		message: 'The WhatsApp connection closed before authentication completed.',
		...(statusCode === undefined ? {} : { statusCode }),
		...(reason === undefined ? {} : { reason }),
	};
}

export function waitForAuthPrompt({
	socket,
	getEntry,
	authMethod,
	phoneNumber = '',
	timeoutMs,
	onPrompt,
}: WaitForAuthPromptOptions): Promise<AuthPromptResult> {
	return new Promise((resolve) => {
		let settled = false;
		let promptDelivered = false;
		let promptDelivery = Promise.resolve();
		let timer: ReturnType<typeof setTimeout>;

		const cleanup = () => {
			clearTimeout(timer);
			socket.ev.off('connection.update', onConnectionUpdate);
			socket.ev.off('creds.update', onCredentialsUpdate);
		};
		const finish = (result: AuthPromptResult) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(result);
		};
		const finishAuthenticated = () => {
			void promptDelivery.then(() => finish({ status: 'authenticated' }));
		};
		const deliverPrompt = (prompt: AuthPrompt) => {
			promptDelivered = true;
			promptDelivery = Promise.resolve().then(async () => {
				if (!settled) await onPrompt(prompt);
			}).catch(() => finish({ status: 'error', message: 'The authentication prompt could not be displayed.' }));
		};
		const onCredentialsUpdate = () => {
			if (getEntry()?.authRegistered) finishAuthenticated();
		};
		const onConnectionUpdate = (update: ConnectionUpdate = {}) => {
			const entry = getEntry();
			if (entry?.authRegistered) {
				finishAuthenticated();
				return;
			}
			if (update.connection === 'close') {
				finish(connectionError(update));
				return;
			}
			if (!update.qr || promptDelivered) return;
			if (!entry || entry.socket !== socket || entry.connectionState.connection === 'close') {
				finish({ status: 'error', message: 'The WhatsApp session is no longer available.' });
				return;
			}

			if (authMethod === 'qrCode') {
				deliverPrompt({ status: 'qrCode', qr: update.qr });
				return;
			}

			void requestPairingCodeOnce(entry.pairingState, () => socket.requestPairingCode(phoneNumber))
				.then((pairingCode) => {
					if (settled) return;
					const currentEntry = getEntry();
					if (!currentEntry || currentEntry.socket !== socket || currentEntry.connectionState.connection === 'close') {
						finish({ status: 'error', message: 'The WhatsApp connection closed before the pairing code was ready.' });
						return;
					}
					deliverPrompt({ status: 'pairingCode', pairingCode });
				})
				.catch(() => finish({
					status: 'error',
					message: 'WhatsApp could not create a pairing code. Wait a moment and run the setup node again.',
				}));
		};

		timer = setTimeout(() => finish({ status: 'timeout' }), timeoutMs);
		socket.ev.on('connection.update', onConnectionUpdate);
		socket.ev.on('creds.update', onCredentialsUpdate);

		const entry = getEntry();
		if (entry?.authRegistered) finishAuthenticated();
		else if (entry?.connectionState.connection === 'close') finish(connectionError(entry.connectionState));
		else if (entry?.connectionState.qr) onConnectionUpdate(entry.connectionState);
	});
}
