import { EventEmitter } from 'events';

const sockets: Array<{ ev: EventEmitter; end: jest.Mock }> = [];
jest.mock('@whiskeysockets/baileys', () => ({
	__esModule: true,
	default: () => { const socket = { ev: new EventEmitter(), end: jest.fn() }; sockets.push(socket); return socket; },
	Browsers: { ubuntu: () => [] }, DisconnectReason: { loggedOut: 401 },
	makeCacheableSignalKeyStore: (keys: unknown) => keys,
}));
jest.mock('../../../nodes/Bailey/transport/AuthStateStore', () => ({
	sessionDirFromConfig: () => '/tmp/test',
	useFileAuthState: async () => ({ creds: { registered: true }, keys: {}, saveCreds: jest.fn() }),
}));

type Pool = typeof import('../../../nodes/Bailey/transport/ConnectionPool');

// n8n clears require.cache for a community package when it is installed or updated at runtime.
// Already-active triggers keep the previous module copy while new executions load a fresh one.
async function loadFreshPoolModule(): Promise<Pool> {
	let loaded: Pool | undefined;
	await jest.isolateModulesAsync(async () => { loaded = await import('../../../nodes/Bailey/transport/ConnectionPool'); });
	return loaded!;
}

it('shares connections and trigger subscriptions across reloaded module copies', async () => {
	const before = await loadFreshPoolModule();
	const after = await loadFreshPoolModule();
	expect(after).not.toBe(before);
	const credentials = { sessionId: 'module-reload-test' };
	const handler = jest.fn();

	const release = await before.subscribeToSession(credentials, (socket) => {
		socket.ev.on('messages.upsert', handler);
		return () => socket.ev.off('messages.upsert', handler);
	});
	const count = sockets.length;

	expect(after.getSessionSubscriptionStatus(credentials.sessionId)).toMatchObject({ registered: 1, bound: 1 });
	const reused = await after.getOrCreateConnection(credentials as never);
	expect(sockets).toHaveLength(count);
	expect(reused).toBe(sockets[count - 1]);

	release();
	expect(after.getSessionSubscriptionStatus(credentials.sessionId)).toMatchObject({ registered: 0, bound: 0 });
});
