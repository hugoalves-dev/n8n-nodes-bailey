import { EventEmitter } from 'events';

const sockets: Array<{ ev: EventEmitter; end: jest.Mock }> = [];
let mockAdvSecretKey = 'pairing-1';
jest.mock('@whiskeysockets/baileys', () => ({
	__esModule: true,
	default: () => { const socket = { ev: new EventEmitter(), end: jest.fn() }; sockets.push(socket); return socket; },
	Browsers: { ubuntu: () => [] }, DisconnectReason: { loggedOut: 401 },
	makeCacheableSignalKeyStore: (keys: unknown) => keys,
}));
jest.mock('../../../nodes/Bailey/transport/AuthStateStore', () => ({
	sessionDirFromConfig: () => '/tmp/test',
	useFileAuthState: async () => ({ creds: { registered: true, advSecretKey: mockAdvSecretKey }, keys: {}, saveCreds: jest.fn() }),
}));
import {
	getLastDisconnect,
	getOrCreateConnection,
	getSessionEnded,
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

beforeEach(() => { mockAdvSecretKey = 'pairing-1'; });
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
