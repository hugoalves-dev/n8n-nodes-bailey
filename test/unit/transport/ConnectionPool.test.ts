const mockSocket = {
	ev: { on: jest.fn(), off: jest.fn() },
	end: jest.fn(),
};
const mockMakeWASocket = jest.fn(() => mockSocket);
const mockUseFileAuthState = jest.fn();
let mockCreds: { registered: boolean };

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

import { deregisterSocket, getOrCreateConnection, getPoolEntry } from '../../../nodes/Bailey/transport/ConnectionPool';

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
		mockUseFileAuthState.mockResolvedValue({
			creds: mockCreds,
			keys: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
			saveCreds: jest.fn(),
		});
	});
	afterEach(() => deregisterSocket(credentials.sessionId));

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
});
