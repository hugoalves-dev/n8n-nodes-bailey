export interface PairingCodeUpdate {
	qr?: string;
	connection?: string;
}

export interface PairingRequestState {
	requested: boolean;
	code?: string;
	codeExpiresAt?: number;
	requestPromise?: Promise<string>;
}

interface PairingCodeHandlerOptions {
	requestCode: () => Promise<string>;
	onCode: (code: string) => void;
	onError: (message: string) => void;
	state?: PairingRequestState;
}

export function requestPairingCodeOnce(
	state: PairingRequestState,
	requestCode: () => Promise<string>,
): Promise<string> {
	if (state.code && state.codeExpiresAt && Date.now() < state.codeExpiresAt) return Promise.resolve(state.code);
	if (state.requestPromise) return state.requestPromise;

	state.code = undefined;
	state.requested = true;
	state.requestPromise = requestCode()
		.then((code) => {
			state.code = code;
			state.codeExpiresAt = Date.now() + 60_000;
			return code;
		})
		.catch((error: unknown) => {
			state.requested = false;
			throw error;
		})
		.finally(() => {
			state.requestPromise = undefined;
		});

	return state.requestPromise;
}

export function createPairingCodeHandler({ requestCode, onCode, onError, state }: PairingCodeHandlerOptions) {
	const requestState = state ?? { requested: false };
	let delivered = false;
	return (update: PairingCodeUpdate, registered: boolean): void => {
		if (registered || delivered || !update.qr) return;
		delivered = true;
		void requestPairingCodeOnce(requestState, requestCode).then(onCode).catch(() => {
			delivered = false;
			onError('WhatsApp could not create a pairing code. Wait a moment and try again.');
		});
	};
}
