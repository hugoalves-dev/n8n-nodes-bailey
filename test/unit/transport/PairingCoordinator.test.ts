import { createPairingCodeHandler, requestPairingCodeOnce } from '../../../nodes/Bailey/transport/PairingCoordinator';

describe('createPairingCodeHandler', () => {
	it('requests a pairing code once at the unauthenticated QR stage', async () => {
		const requestCode = jest.fn().mockResolvedValue('12345678');
		const onCode = jest.fn();
		const onError = jest.fn();
		const handle = createPairingCodeHandler({ requestCode, onCode, onError });

		handle({ qr: 'qr-payload' }, false);
		handle({ qr: 'next-qr-payload' }, false);
		await new Promise((resolve) => setImmediate(resolve));

		expect(requestCode).toHaveBeenCalledTimes(1);
		expect(onCode).toHaveBeenCalledWith('12345678');
		expect(onError).not.toHaveBeenCalled();
	});

	it('does not request a code for a registered session', () => {
		const requestCode = jest.fn();
		const handle = createPairingCodeHandler({ requestCode, onCode: jest.fn(), onError: jest.fn() });

		handle({ qr: 'qr-payload' }, true);

		expect(requestCode).not.toHaveBeenCalled();
	});

	it('shares request state across credential and trigger listeners', async () => {
		const state = { requested: false };
		const requestCode = jest.fn().mockResolvedValue('12345678');
		const makeHandler = () => createPairingCodeHandler({ requestCode, onCode: jest.fn(), onError: jest.fn(), state });

		makeHandler()({ qr: 'credential-test-qr' }, false);
		makeHandler()({ qr: 'trigger-qr' }, false);
		await Promise.resolve();

		expect(requestCode).toHaveBeenCalledTimes(1);
	});

	it('reports a generic failure without leaking the Baileys error text', async () => {
		const requestCode = jest.fn().mockRejectedValue(new Error('secret phone or token'));
		const onError = jest.fn();
		const handle = createPairingCodeHandler({ requestCode, onCode: jest.fn(), onError });

		handle({ qr: 'qr-payload' }, false);
		await new Promise((resolve) => setImmediate(resolve));

		expect(onError).toHaveBeenCalledWith('WhatsApp could not create a pairing code. Wait a moment and try again.');
		expect(onError.mock.calls[0][0]).not.toContain('secret');
	});
});


describe('requestPairingCodeOnce', () => {
	it('coalesces concurrent requests and caches the generated code', async () => {
		const state = { requested: false };
		const requestCode = jest.fn().mockResolvedValue('12345678');

		const codes = await Promise.all([
			requestPairingCodeOnce(state, requestCode),
			requestPairingCodeOnce(state, requestCode),
		]);
		const reusedCode = await requestPairingCodeOnce(state, requestCode);

		expect(codes).toEqual(['12345678', '12345678']);
		expect(reusedCode).toBe('12345678');
		expect(requestCode).toHaveBeenCalledTimes(1);
	});

	it('allows retry after a failed pairing-code request', async () => {
		const state = { requested: false };
		const requestCode = jest.fn()
			.mockRejectedValueOnce(new Error('temporary failure'))
			.mockResolvedValueOnce('87654321');

		await expect(requestPairingCodeOnce(state, requestCode)).rejects.toThrow('temporary failure');
		await expect(requestPairingCodeOnce(state, requestCode)).resolves.toBe('87654321');
	});
});
