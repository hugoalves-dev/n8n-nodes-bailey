const mockSocket = {
	ev: { on: jest.fn(), off: jest.fn() },
	end: jest.fn(),
};
const mockMakeWASocket = jest.fn(() => mockSocket);
const mockUseFileAuthState = jest.fn();
let mockCreds: { registered: boolean };
let mockSaveCreds: jest.Mock;

jest.mock('@whiskeysockets/baileys', () => ({
	__esModule: true,
	default: () => mockMakeWASocket(),
	Browsers: { ubuntu: (name: string) => ['Ubuntu', name] },
	DisconnectReason: { loggedOut: 401 },
	makeCacheableSignalKeyStore: (keys: unknown) => keys,
}));
jest.mock('../../../nodes/Bailey/transport/AuthStateStore', () => ({
	sessionDirFromConfig: (root: string, id: string) => `${root}/${id}`,
	useFileAuthState: (...args: unknown[]) => mockUseFileAuthState(...args),
}));

import { deregisterSocket, getOrCreateConnection, getPoolEntry, registerExternalSocket } from '../../../nodes/Bailey/transport/ConnectionPool';

describe('getOrCreateConnection', () => {
	const credentials = {
		sessionId: 'shared-session',
		authDataPath: '/tmp/bailey-tests',
		idleTimeoutSeconds: 0,
		messageCacheSize: 100,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockCreds = { registered: false };
		mockSaveCreds = jest.fn().mockResolvedValue(undefined);
		mockUseFileAuthState.mockResolvedValue({
			creds: mockCreds,
			keys: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
			saveCreds: mockSaveCreds,
		});
	});
	afterEach(() => deregisterSocket(credentials.sessionId));


	it('persists registered credentials only after QR login reaches connection open', async () => {
		await getOrCreateConnection(credentials as never);
		expect(mockCreds.registered).toBe(false);
		expect(getPoolEntry(credentials.sessionId)?.authTimer).toBeDefined();

		const onUpdate = mockSocket.ev.on.mock.calls.find(([event]) => event === 'connection.update')?.[1] as
			((update: { connection?: string; qr?: string; isNewLogin?: boolean }) => void);
		onUpdate({ qr: 'qr-secret' });
		onUpdate({ isNewLogin: true });
		expect(mockCreds.registered).toBe(false);
		expect(mockSaveCreds).not.toHaveBeenCalled();

		onUpdate({ connection: 'open' });
		await Promise.resolve();
		await Promise.resolve();
		expect(mockCreds.registered).toBe(true);
		expect(mockSaveCreds).toHaveBeenCalledTimes(1);
		expect(getPoolEntry(credentials.sessionId)?.authRegistered).toBe(true);
		expect(getPoolEntry(credentials.sessionId)?.connectionState.connection).toBe('open');
		expect(getPoolEntry(credentials.sessionId)?.authTimer).toBeNull();

		onUpdate({ connection: 'open' });
		await Promise.resolve();
		expect(mockSaveCreds).toHaveBeenCalledTimes(1);
	});

	it('restores registered state from persisted credentials after replacing the socket', async () => {
		let saved = { registered: false };
		mockUseFileAuthState.mockImplementation(async () => {
			const creds = { ...saved };
			return {
				creds,
				keys: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
				saveCreds: jest.fn(async () => { saved = { ...creds }; }),
			};
		});

		await getOrCreateConnection(credentials as never);
		const onUpdate = mockSocket.ev.on.mock.calls.find(([event]) => event === 'connection.update')?.[1] as
			((update: { connection?: string }) => void);
		onUpdate({ connection: 'open' });
		await Promise.resolve();
		await Promise.resolve();
		expect(saved.registered).toBe(true);

		deregisterSocket(credentials.sessionId);
		await getOrCreateConnection(credentials as never);
		expect(mockUseFileAuthState).toHaveBeenCalledTimes(2);
		expect(getPoolEntry(credentials.sessionId)?.authRegistered).toBe(true);
		expect(getPoolEntry(credentials.sessionId)?.authTimer).toBeNull();
	});

	it('ignores a late open event from a previous socket', async () => {
		await getOrCreateConnection(credentials as never);
		const oldHandler = mockSocket.ev.on.mock.calls.find(([event]) => event === 'connection.update')?.[1] as
			((update: { connection?: string }) => void);
		const replacementSocket = { ev: { on: jest.fn(), off: jest.fn() }, end: jest.fn() };
		deregisterSocket(credentials.sessionId);
		registerExternalSocket(credentials.sessionId, replacementSocket as never, {} as never, { registered: false } as never, undefined);
		oldHandler({ connection: 'open' });
		await Promise.resolve();
		expect(mockCreds.registered).toBe(false);
		expect(mockSaveCreds).not.toHaveBeenCalled();
		expect(getPoolEntry(credentials.sessionId)?.socket).toBe(replacementSocket);
		expect(getPoolEntry(credentials.sessionId)?.authRegistered).toBe(false);
	});

	it('does not persist stale credential updates from an old socket', async () => {
		await getOrCreateConnection(credentials as never);
		const oldHandlers = mockSocket.ev.on.mock.calls
			.filter(([event]) => event === 'creds.update')
			.map(([, handler]) => handler as () => void);

		const replacementSocket = { ev: { on: jest.fn(), off: jest.fn() }, end: jest.fn() };
		deregisterSocket(credentials.sessionId);
		registerExternalSocket(credentials.sessionId, replacementSocket as never, {} as never, { registered: false } as never, undefined);

		for (const handler of oldHandlers) handler();
		await Promise.resolve();
		expect(mockSaveCreds).not.toHaveBeenCalled();
		expect(getPoolEntry(credentials.sessionId)?.authRegistered).toBe(false);
	});

	it('does not promote authentication when a socket closes before opening', async () => {
		await getOrCreateConnection(credentials as never);
		const onUpdate = mockSocket.ev.on.mock.calls.find(([event]) => event === 'connection.update')?.[1] as
			((update: { connection?: string; lastDisconnect?: unknown }) => void);
		onUpdate({ connection: 'close', lastDisconnect: { error: { output: { statusCode: 401 } } } });
		await Promise.resolve();
		expect(mockCreds.registered).toBe(false);
		expect(mockSaveCreds).not.toHaveBeenCalled();
		expect(getPoolEntry(credentials.sessionId)).toBeUndefined();
	});

	it('shares one socket between concurrent users of the same session', async () => {
		const [first, second] = await Promise.all([
			getOrCreateConnection(credentials as never),
			getOrCreateConnection(credentials as never),
		]);

		expect(first).toBe(second);
		expect(mockMakeWASocket).toHaveBeenCalledTimes(1);
		expect(getPoolEntry(credentials.sessionId)?.idleTimer).toBeNull();
	});

	it('keeps a trigger-owned socket alive after authentication completes', async () => {
		const triggerCredentials = { ...credentials, sessionId: 'trigger-owned-session' };
		const [socket] = await Promise.all([getOrCreateConnection(triggerCredentials as never, true)]);
		mockCreds.registered = true;
		const credsUpdates = mockSocket.ev.on.mock.calls.filter(([event]) => event === 'creds.update');
		for (const [, handler] of credsUpdates) (handler as () => void)();

		expect(socket).toBe(mockSocket);
		expect(getPoolEntry(triggerCredentials.sessionId)?.authRegistered).toBe(true);
		expect(getPoolEntry(triggerCredentials.sessionId)?.idleTimer).toBeNull();
		deregisterSocket(triggerCredentials.sessionId);
	});

	it('preserves keep-alive when reconnecting after restartRequired', async () => {
		jest.useFakeTimers();
		try {
			await getOrCreateConnection(credentials as never, true);
			const close = mockSocket.ev.on.mock.calls.find(([event]) => event === 'connection.update')?.[1] as
				((update: { connection: string; lastDisconnect?: unknown }) => void);
			close({ connection: 'close', lastDisconnect: { error: { output: { statusCode: 515 } } } });
			await jest.advanceTimersByTimeAsync(3001);
			expect(getPoolEntry(credentials.sessionId)?.keepAlive).toBe(true);
			expect(getPoolEntry(credentials.sessionId)?.idleTimer).toBeNull();
		} finally {
			jest.useRealTimers();
		}
	});

	it('ignores a late close from a replaced socket for the same session', async () => {
		await getOrCreateConnection(credentials as never);
		const oldCloseHandler = mockSocket.ev.on.mock.calls.find(([event]) => event === 'connection.update')?.[1] as
			((update: { connection: string; lastDisconnect?: unknown }) => void) | undefined;
		const replacementSocket = { ev: { on: jest.fn(), off: jest.fn() }, end: jest.fn() };
		deregisterSocket(credentials.sessionId);
		registerExternalSocket(credentials.sessionId, replacementSocket as never, {} as never, { registered: false } as never, undefined);

		oldCloseHandler?.({ connection: 'close', lastDisconnect: { error: { output: { statusCode: 515 } } } });

		expect(getPoolEntry(credentials.sessionId)?.socket).toBe(replacementSocket);
	});
});
