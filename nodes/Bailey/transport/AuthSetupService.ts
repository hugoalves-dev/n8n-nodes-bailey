import { PairingRequestState, requestPairingCodeOnce } from './PairingCoordinator';

export interface AuthSetupSocket {
	ev: {
		on: (event: string, handler: (update?: { qr?: string; connection?: string }) => void) => void;
		off: (event: string, handler: (update?: { qr?: string; connection?: string }) => void) => void;
	};
	requestPairingCode: (phoneNumber: string) => Promise<string>;
}

export interface AuthSetupEntry {
	authRegistered: boolean;
	connectionState: { qr?: string; connection?: string };
	pairingState: PairingRequestState;
}

export type AuthPromptResult =
	| { status: 'authenticated' }
	| { status: 'pairingCode'; pairingCode: string }
	| { status: 'qrCode'; qr: string }
	| { status: 'timeout' }
	| { status: 'error'; message: string };

interface WaitForAuthPromptOptions {
	socket: AuthSetupSocket;
	getEntry: () => AuthSetupEntry | undefined;
	authMethod: string;
	phoneNumber?: string;
	timeoutMs: number;
}

export function waitForAuthPrompt({ socket, getEntry, authMethod, phoneNumber = '', timeoutMs }: WaitForAuthPromptOptions) {
	return new Promise<AuthPromptResult>((resolve) => {
		let settled = false;

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
		const timer = setTimeout(() => finish({ status: 'timeout' }), timeoutMs);
		const onCredentialsUpdate = () => {
			if (getEntry()?.authRegistered) finish({ status: 'authenticated' });
		};
		const onConnectionUpdate = (update: { qr?: string; connection?: string } = {}) => {
			if (getEntry()?.authRegistered) {
				finish({ status: 'authenticated' });
				return;
			}
			if (update.connection === 'close') {
				finish({ status: 'error', message: 'The WhatsApp connection closed before authentication completed.' });
				return;
			}
			if (!update.qr) return;

			if (authMethod === 'qrCode') {
				finish({ status: 'qrCode', qr: update.qr });
				return;
			}

			const entry = getEntry();
			if (!entry) {
				finish({ status: 'error', message: 'The WhatsApp session is no longer available.' });
				return;
			}
			void requestPairingCodeOnce(entry.pairingState, () => socket.requestPairingCode(phoneNumber))
				.then((pairingCode) => finish({ status: 'pairingCode', pairingCode }))
				.catch(() => finish({
					status: 'error',
					message: 'WhatsApp could not create a pairing code. Wait a moment and run the setup node again.',
				}));
		};

		socket.ev.on('connection.update', onConnectionUpdate);
		socket.ev.on('creds.update', onCredentialsUpdate);

		const entry = getEntry();
		if (entry?.authRegistered) finish({ status: 'authenticated' });
		else if (entry?.connectionState.qr) onConnectionUpdate(entry.connectionState);
	});
}
