import { EventEmitter } from 'events';

const sockets: Array<{ ev: EventEmitter; end: jest.Mock }> = [];
const mockClearSessionAuthFiles = jest.fn();
let mockRegistered = true;
let mockAdvSecretKey = 'pairing-1';
jest.mock('@whiskeysockets/baileys', () => ({
	__esModule: true,
	default: () => { const socket = { ev: new EventEmitter(), end: jest.fn() }; sockets.push(socket); return socket; },
	Browsers: { ubuntu: () => [] }, DisconnectReason: { loggedOut: 401, restartRequired: 515 },
	makeCacheableSignalKeyStore: (keys: unknown) => keys,
}));
jest.mock('../../../nodes/Bailey/transport/AuthStateStore', () => ({
	sessionDirFromConfig: (root: string, id: string) => root + '/' + id,
	clearSessionAuthFiles: (...args: unknown[]) => mockClearSessionAuthFiles(...args),
	useFileAuthState: async () => ({ creds: { registered: mockRegistered, advSecretKey: mockAdvSecretKey }, keys: {}, saveCreds: jest.fn() }),
}));
import {
	getLastDisconnect,
	getOrCreateConnection,
	getSessionEnded,
	getSessionSubscriptionStatus,
	repairLoggedOutSession,
	subscribeToSession,
} from '../../../nodes/Bailey/transport/ConnectionPool';

const deviceRemoved = {
	error: {
		message: 'Stream Errored (conflict)',
		output: { statusCode: 401 },
		data: { tag: 'stream:error', attrs: { code: '401' }, content: [{ tag: 'conflict', attrs: { type: 'device_removed' } }] },
	},
};
const restartRequired = { error: { message: 'Stream Errored (restart required)', output: { statusCode: 515 } } };
const latest = () => sockets[sockets.length - 1];

beforeEach(() => { mockAdvSecretKey = 'pairing-1'; mockRegistered = true; mockClearSessionAuthFiles.mockReset(); });
afterEach(() => jest.useRealTimers());

it('refuses to open a new socket with the credentials WhatsApp logged out', async () => {
	const credentials = { sessionId: 'ended-same-creds' };
	const release = await subscribeToSession(credentials, () => () => {});
	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: deviceRemoved });
	const count = sockets.length;

	await expect(getOrCreateConnection(credentials as never, true)).rejects.toThrow(/logged out.*device_removed/i);
	expect(sockets).toHaveLength(count);
	release();
});

it('allows a new connection once the session is paired again', async () => {
	const credentials = { sessionId: 'ended-repaired' };
	const release = await subscribeToSession(credentials, () => () => {});
	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: deviceRemoved });
	release();

	mockAdvSecretKey = 'pairing-2';
	const count = sockets.length;
	await expect(getOrCreateConnection(credentials as never)).resolves.toBeDefined();
	expect(sockets).toHaveLength(count + 1);
	expect(getSessionEnded(credentials.sessionId)).toBeNull();
});

it('records why the session ended', async () => {
	const credentials = { sessionId: 'ended-details' };
	const release = await subscribeToSession(credentials, () => () => {});
	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: deviceRemoved });

	expect(getLastDisconnect(credentials.sessionId)).toMatchObject({
		statusCode: 401, reason: 'Stream Errored (conflict)', detail: 'device_removed', loggedOut: true,
	});
	expect(getSessionEnded(credentials.sessionId)).toMatchObject({ statusCode: 401, detail: 'device_removed' });
	release();
});

it('does not loop when n8n re-activates the trigger after a logout', async () => {
	jest.useFakeTimers();
	const { BaileyTrigger } = await import('../../../nodes/Bailey/BaileyTrigger.node');
	const emitError = jest.fn();
	const context = {
		getCredentials: async () => ({ sessionId: 'ended-trigger' }),
		getNodeParameter: (_: string, fallback: unknown) => fallback,
		getMode: () => 'trigger', emit: jest.fn(), emitError,
		helpers: { returnJsonArray: (value: unknown) => value },
		logger: { info: jest.fn(), error: jest.fn() },
	};
	const first = await BaileyTrigger.prototype.trigger.call(context as never);
	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: deviceRemoved });
	expect(emitError).toHaveBeenCalledTimes(1);
	expect(String(emitError.mock.calls[0][0].message)).toMatch(/device_removed/);
	await first.closeFunction();

	const count = sockets.length;
	await expect(BaileyTrigger.prototype.trigger.call(context as never)).rejects.toThrow(/logged out/i);
	await jest.advanceTimersByTimeAsync(60_000);
	expect(sockets).toHaveLength(count);
});

it('backs off between consecutive failed reconnects and resets after the connection opens', async () => {
	jest.useFakeTimers();
	const credentials = { sessionId: 'backoff-test' };
	const release = await subscribeToSession(credentials, () => () => {});

	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: restartRequired });
	let count = sockets.length;
	await jest.advanceTimersByTimeAsync(3000);
	expect(sockets).toHaveLength(count + 1);

	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: restartRequired });
	count = sockets.length;
	await jest.advanceTimersByTimeAsync(3000);
	expect(sockets).toHaveLength(count);
	await jest.advanceTimersByTimeAsync(3000);
	expect(sockets).toHaveLength(count + 1);

	latest().ev.emit('connection.update', { connection: 'open' });
	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: restartRequired });
	count = sockets.length;
	await jest.advanceTimersByTimeAsync(3000);
	expect(sockets).toHaveLength(count + 1);
	release();
});

it('requires an explicit repair after logout and binds triggers only after the new login opens', async () => {
	jest.useFakeTimers();
	const credentials = { sessionId: 'repair-same-id', authDataPath: '/sessions' };
	const other = { ...credentials, sessionId: 'repair-other-id' };
	const otherSocket = await getOrCreateConnection(other, true);
	const release = await subscribeToSession(credentials, () => () => {});
	await expect(async () => repairLoggedOutSession(credentials)).rejects.toThrow(/confirmed logout/i);
	latest().ev.emit('connection.update', { connection: 'close', lastDisconnect: deviceRemoved });
	const count = sockets.length;
	await jest.advanceTimersByTimeAsync(60_000);
	expect(sockets).toHaveLength(count);
	await expect(subscribeToSession(credentials, jest.fn())).rejects.toThrow(/logged out/i);

	mockClearSessionAuthFiles.mockImplementation(() => {
		mockRegistered = false;
		mockAdvSecretKey = 'fresh-key';
	});
	const [socket, sameSocket] = await Promise.all([
		repairLoggedOutSession(credentials), repairLoggedOutSession(credentials),
	]);
	expect(socket).toBe(sameSocket);
	expect(sockets).toHaveLength(count + 1);
	expect(mockClearSessionAuthFiles).toHaveBeenCalledTimes(1);
	expect(mockClearSessionAuthFiles).toHaveBeenCalledWith('/sessions/repair-same-id');
	expect(getSessionEnded(credentials.sessionId)).toBeNull();
	expect(getSessionSubscriptionStatus(credentials.sessionId)).toEqual({ registered: 1, bound: 0 });
	await expect(subscribeToSession(credentials, jest.fn())).rejects.toThrow(/complete re-pairing/i);
	await expect(getOrCreateConnection(other, true)).resolves.toBe(otherSocket);

	socket.ev.emit('connection.update', { connection: 'close', lastDisconnect: restartRequired });
	await jest.advanceTimersByTimeAsync(3000);
	expect(sockets).toHaveLength(count + 2);
	expect(getSessionSubscriptionStatus(credentials.sessionId).bound).toBe(0);
	latest().ev.emit('connection.update', { connection: 'open' });
	expect(getSessionSubscriptionStatus(credentials.sessionId).bound).toBe(1);
	await expect(getOrCreateConnection(credentials, true)).resolves.toBe(latest());
	release();
});
