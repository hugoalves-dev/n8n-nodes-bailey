import { EventEmitter } from 'events';
import { waitForAuthPrompt } from '../../../nodes/Bailey/transport/AuthSetupService';

function createSocket() {
	const ev = new EventEmitter();
	return {
		ev,
		requestPairingCode: jest.fn().mockResolvedValue('12345678'),
	};
}

function createEntry() {
	return {
		authRegistered: false,
		connectionState: {} as { qr?: string; connection?: string },
		pairingState: { requested: false },
	};
}

describe('waitForAuthPrompt', () => {
	it('returns the pairing code and removes listeners', async () => {
		const socket = createSocket();
		const entry = createEntry();
		const resultPromise = waitForAuthPrompt({
			socket,
			getEntry: () => entry,
			authMethod: 'pairingCode',
			phoneNumber: '15551234567',
			timeoutMs: 100,
		});

		socket.ev.emit('connection.update', { qr: 'qr-payload' });
		const result = await resultPromise;

		expect(result).toEqual({ status: 'pairingCode', pairingCode: '12345678' });
		expect(socket.requestPairingCode).toHaveBeenCalledTimes(1);
		expect(socket.ev.listenerCount('connection.update')).toBe(0);
		expect(socket.ev.listenerCount('creds.update')).toBe(0);
	});

	it('coalesces simultaneous setup executions for a session', async () => {
		const socket = createSocket();
		const entry = createEntry();
		const options = { socket, getEntry: () => entry, authMethod: 'pairingCode', phoneNumber: '15551234567', timeoutMs: 100 };
		const first = waitForAuthPrompt(options);
		const second = waitForAuthPrompt(options);
		socket.ev.emit('connection.update', { qr: 'qr-payload' });

		const results = await Promise.all([first, second]);

		expect(results).toEqual([
			{ status: 'pairingCode', pairingCode: '12345678' },
			{ status: 'pairingCode', pairingCode: '12345678' },
		]);
		expect(socket.requestPairingCode).toHaveBeenCalledTimes(1);
	});

	it('returns QR payload and cleans up when the connection closes', async () => {
		const socket = createSocket();
		const entry = createEntry();
		const qrPromise = waitForAuthPrompt({ socket, getEntry: () => entry, authMethod: 'qrCode', timeoutMs: 100 });
		socket.ev.emit('connection.update', { qr: 'qr-payload' });
		expect(await qrPromise).toEqual({ status: 'qrCode', qr: 'qr-payload' });

		const closePromise = waitForAuthPrompt({ socket, getEntry: () => entry, authMethod: 'qrCode', timeoutMs: 100 });
		socket.ev.emit('connection.update', { connection: 'close' });
		expect(await closePromise).toMatchObject({ status: 'error' });
		expect(socket.ev.listenerCount('connection.update')).toBe(0);
	});

	it('reports an authenticated session immediately', async () => {
		const socket = createSocket();
		const entry = { ...createEntry(), authRegistered: true };

		await expect(waitForAuthPrompt({ socket, getEntry: () => entry, authMethod: 'pairingCode', timeoutMs: 100 }))
			.resolves.toEqual({ status: 'authenticated' });
		expect(socket.ev.listenerCount('connection.update')).toBe(0);
	});

	it('times out and removes temporary listeners without closing the pooled socket', async () => {
		const socket = createSocket();
		const entry = createEntry();
		const resultPromise = waitForAuthPrompt({
			socket,
			getEntry: () => entry,
			authMethod: 'qrCode',
			timeoutMs: 5,
		});

		await expect(resultPromise).resolves.toEqual({ status: 'timeout' });
		expect(socket.ev.listenerCount('connection.update')).toBe(0);
		expect(socket.ev.listenerCount('creds.update')).toBe(0);
		expect(socket.requestPairingCode).not.toHaveBeenCalled();
	});
});
