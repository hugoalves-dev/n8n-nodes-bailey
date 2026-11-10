export interface PairingCodeUpdate {
	qr?: string;
	connection?: string;
}

interface PairingCodeHandlerOptions {
	requestCode: () => Promise<string>;
	onCode: (code: string) => void;
	onError: (message: string) => void;
	state?: { requested: boolean };
}

export function createPairingCodeHandler({ requestCode, onCode, onError, state }: PairingCodeHandlerOptions) {
	const requestState = state ?? { requested: false };
	return (update: PairingCodeUpdate, registered: boolean): void => {
		if (registered || requestState.requested || !update.qr) return;
		requestState.requested = true;
		void requestCode().then(onCode).catch(() => {
			onError('WhatsApp could not create a pairing code. Wait a moment and try again.');
		});
	};
}
