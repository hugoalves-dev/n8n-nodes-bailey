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
		socket: undefined as ReturnType<typeof createSocket> | undefined,
		authRegistered: false,
		connectionState: {} as { qr?: string; connection?: string },
		pairingState: { requested: false },
	};
}

describe('waitForAuthPrompt', () => {
	it('delivers a pairing code then waits for auth and removes listeners', async () => {
		const socket = createSocket();
		const entry = createEntry();
		entry.socket = socket;
		const onPrompt = jest.fn();
		const resultPromise = waitForAuthPrompt({
			socket,
			getEntry: () => entry,
			authMethod: 'pairingCode',
			phoneNumber: '15551234567',
			timeoutMs: 100,
			onPrompt,
		});

		socket.ev.emit('connection.update', { qr: 'qr-payload' });
		await new Promise((resolve) => setImmediate(resolve));
		expect(onPrompt).toHaveBeenCalledWith({ status: 'pairingCode', pairingCode: '12345678' });
		entry.authRegistered = true;
		socket.ev.emit('creds.update');
		const result = await resultPromise;

		expect(result).toEqual({ status: 'authenticated' });
		expect(socket.requestPairingCode).toHaveBeenCalledTimes(1);
		expect(socket.ev.listenerCount('connection.update')).toBe(0);
		expect(socket.ev.listenerCount('creds.update')).toBe(0);
	});

	it('coalesces simultaneous setup executions for a session', async () => {
		const socket = createSocket();
		const entry = createEntry();
		entry.socket = socket;
		const onPrompt = jest.fn();
		const options = { socket, getEntry: () => entry, authMethod: 'pairingCode', phoneNumber: '15551234567', timeoutMs: 100, onPrompt };
		const first = waitForAuthPrompt(options);
		const second = waitForAuthPrompt(options);
		socket.ev.emit('connection.update', { qr: 'qr-payload' });
		await new Promise((resolve) => setImmediate(resolve));
		entry.authRegistered = true;
		socket.ev.emit('creds.update');

		const results = await Promise.all([first, second]);

		expect(results).toEqual([
			{ status: 'authenticated' },
			{ status: 'authenticated' },
		]);
		expect(socket.requestPairingCode).toHaveBeenCalledTimes(1);
		expect(onPrompt).toHaveBeenCalledTimes(2);
	});

	it('provides a QR prompt while waiting for auth and reports close status', async () => {
		const socket = createSocket();
		const entry = createEntry();
		entry.socket = socket;
		const onPrompt = jest.fn();
		const qrPromise = waitForAuthPrompt({ socket, getEntry: () => entry, authMethod: 'qrCode', timeoutMs: 100, onPrompt } as never);
		socket.ev.emit('connection.update', { qr: 'qr-payload' });
		await new Promise((resolve) => setImmediate(resolve));
		expect(onPrompt).toHaveBeenCalledWith({ status: 'qrCode', qr: 'qr-payload' });

		const closePromise = waitForAuthPrompt({ socket, getEntry: () => entry, authMethod: 'qrCode', timeoutMs: 100, onPrompt: jest.fn() });
		socket.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 440 } } } });
		expect(await qrPromise).toEqual({ status: 'error', message: 'The WhatsApp connection closed before authentication completed.', statusCode: 440, reason: 'connection replaced' });
		expect(await closePromise).toMatchObject({ status: 'error' });
		expect(socket.ev.listenerCount('connection.update')).toBe(0);
	});

	it('returns safe disconnect details when the socket closes before authentication', async () => {
		const socket = createSocket();
		const entry = createEntry();
		entry.socket = socket;
		const closePromise = waitForAuthPrompt({ socket, getEntry: () => entry, authMethod: 'pairingCode', timeoutMs: 100, onPrompt: jest.fn() });

		socket.ev.emit('connection.update', {
			connection: 'close',
			lastDisconnect: { error: { output: { statusCode: 401 } } },
		});

		expect(await closePromise).toMatchObject({
			status: 'error',
			statusCode: 401,
			reason: 'logged out',
		});
		expect(socket.requestPairingCode).not.toHaveBeenCalled();
	});

	it('does not deliver a late code after the session switches to a new socket', async () => {
		const oldSocket = createSocket();
		const newSocket = createSocket();
		let finishCode!: (code: string) => void;
		oldSocket.requestPairingCode.mockImplementation(() => new Promise((resolve) => {
			finishCode = resolve;
		}));
		const oldEntry = createEntry();
		oldEntry.socket = oldSocket;
		let currentEntry = oldEntry;
		const onPrompt = jest.fn();
		const resultPromise = waitForAuthPrompt({
			socket: oldSocket,
			getEntry: () => currentEntry,
			authMethod: 'pairingCode',
			timeoutMs: 100,
			onPrompt,
		});

		oldSocket.ev.emit('connection.update', { qr: 'old-qr' });
		currentEntry = { ...createEntry(), socket: newSocket };
		finishCode('87654321');

		expect(await resultPromise).toEqual({ status: 'error', message: 'The WhatsApp connection closed before the pairing code was ready.' });
		expect(onPrompt).not.toHaveBeenCalled();
	});

	it('requests a fresh code after reconnecting on a replacement socket', async () => {
		const oldSocket = createSocket();
		const oldEntry = createEntry();
		oldEntry.socket = oldSocket;
		const oldPrompt = jest.fn();
		const oldResult = waitForAuthPrompt({
			socket: oldSocket,
			getEntry: () => oldEntry,
			authMethod: 'pairingCode',
			timeoutMs: 100,
			onPrompt: oldPrompt,
		});
		oldSocket.ev.emit('connection.update', { qr: 'old-qr' });
		await new Promise((resolve) => setImmediate(resolve));
		oldSocket.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 515 } } } });

		expect(await oldResult).toMatchObject({ status: 'error', statusCode: 515, reason: 'restart required' });
		expect(oldPrompt).toHaveBeenCalledWith({ status: 'pairingCode', pairingCode: '12345678' });

		const newSocket = createSocket();
		newSocket.requestPairingCode.mockResolvedValue('87654321');
		const newEntry = createEntry();
		newEntry.socket = newSocket;
		const newPrompt = jest.fn();
		const newResult = waitForAuthPrompt({
			socket: newSocket,
			getEntry: () => newEntry,
			authMethod: 'pairingCode',
			timeoutMs: 100,
			onPrompt: newPrompt,
		});
		newSocket.ev.emit('connection.update', { qr: 'new-qr' });
		await new Promise((resolve) => setImmediate(resolve));
		expect(newPrompt).toHaveBeenCalledWith({ status: 'pairingCode', pairingCode: '87654321' });
		newEntry.authRegistered = true;
		newSocket.ev.emit('creds.update');
		expect(await newResult).toEqual({ status: 'authenticated' });
	});

	it('reports an authenticated session immediately', async () => {
		const socket = createSocket();
		const entry = { ...createEntry(), authRegistered: true };

		await expect(waitForAuthPrompt({ socket, getEntry: () => entry, authMethod: 'pairingCode', timeoutMs: 100, onPrompt: jest.fn() }))
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
			onPrompt: jest.fn(),
		});

		await expect(resultPromise).resolves.toEqual({ status: 'timeout' });
		expect(socket.ev.listenerCount('connection.update')).toBe(0);
		expect(socket.ev.listenerCount('creds.update')).toBe(0);
		expect(socket.requestPairingCode).not.toHaveBeenCalled();
	});
});
