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
import { subscribeToSession } from '../../../nodes/Bailey/transport/ConnectionPool';

it('rebinds two independent subscriptions across reconnects and closes only after the last release', async () => {
	jest.useFakeTimers();
	const credentials = { sessionId: 'subscription-test' };
	const first = jest.fn(); const second = jest.fn();
	const releaseFirst = await subscribeToSession(credentials, socket => { socket.ev.on('messages.upsert', first); return () => socket.ev.off('messages.upsert', first); });
	const releaseSecond = await subscribeToSession(credentials, socket => { socket.ev.on('messages.upsert', second); return () => socket.ev.off('messages.upsert', second); });
	for (let i = 0; i < 2; i++) {
		const old = sockets[sockets.length - 1];
		old.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 515 } } } });
		await jest.advanceTimersByTimeAsync(3000);
		old.ev.emit('messages.upsert', { messages: [] });
		sockets[sockets.length - 1].ev.emit('messages.upsert', { messages: [] });
	}
	expect(first).toHaveBeenCalledTimes(2); expect(second).toHaveBeenCalledTimes(2);
	releaseFirst();
	const current = sockets[sockets.length - 1];
	expect(current.end).not.toHaveBeenCalled();
	current.ev.emit('messages.upsert', { messages: [] });
	expect(first).toHaveBeenCalledTimes(2); expect(second).toHaveBeenCalledTimes(3);
	releaseSecond();
	expect(current.end).toHaveBeenCalledTimes(1);
	jest.useRealTimers();
});

it('does not reconnect after logout and releases listeners when deactivated', async () => {
	jest.useFakeTimers();
	const credentials = { sessionId: 'logged-out-test' };
	const handler = jest.fn();
	const release = await subscribeToSession(credentials, socket => { socket.ev.on('messages.upsert', handler); return () => socket.ev.off('messages.upsert', handler); });
	const old = sockets[sockets.length - 1];
	const count = sockets.length;
	old.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 401 } } } });
	await jest.advanceTimersByTimeAsync(10000);
	expect(sockets).toHaveLength(count);
	old.ev.emit('messages.upsert', { messages: [] });
	expect(handler).not.toHaveBeenCalled();
	release();
	jest.useRealTimers();
});

it('delivers events through the trigger after a socket replacement', async () => {
	jest.useFakeTimers();
	const { BaileyTrigger } = await import('../../../nodes/Bailey/BaileyTrigger.node');
	const emit = jest.fn();
	const context = {
		getCredentials: async () => ({ sessionId: 'trigger-integration' }),
		getNodeParameter: (_: string, fallback: unknown) => fallback,
		getMode: () => 'trigger', emit,
		helpers: { returnJsonArray: (value: unknown) => value },
		logger: { info: jest.fn(), error: jest.fn() },
	};
	const trigger = await BaileyTrigger.prototype.trigger.call(context as never);
	const old = sockets[sockets.length - 1];
	old.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 515 } } } });
	await jest.advanceTimersByTimeAsync(3000);
	const current = sockets[sockets.length - 1];
	current.ev.emit('messages.upsert', { messages: [{ key: { id: '1' }, message: { conversation: 'hello' } }] });
	expect(emit).toHaveBeenCalledTimes(1);
	expect(emit.mock.calls[0][0][0][0]).toMatchObject({ _event: 'messages.upsert', _sessionId: 'trigger-integration' });
	await trigger.closeFunction();
	expect(current.end).toHaveBeenCalledTimes(1);
	jest.useRealTimers();
});

it('reports registered and currently bound triggers separately from socket state', async () => {
	jest.useFakeTimers();
	const { getSessionSubscriptionStatus } = await import('../../../nodes/Bailey/transport/ConnectionPool');
	const credentials = { sessionId: 'health-test' };
	const release = await subscribeToSession(credentials, socket => {
		const listener = () => {};
		socket.ev.on('messages.upsert', listener);
		return () => socket.ev.off('messages.upsert', listener);
	});
	const old = sockets[sockets.length - 1];
	expect(getSessionSubscriptionStatus(credentials.sessionId)).toEqual({ registered: 1, bound: 1 });
	old.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 515 } } } });
	expect(getSessionSubscriptionStatus(credentials.sessionId)).toEqual({ registered: 1, bound: 0 });
	await jest.advanceTimersByTimeAsync(3000);
	expect(getSessionSubscriptionStatus(credentials.sessionId)).toEqual({ registered: 1, bound: 1 });
	release();
	expect(getSessionSubscriptionStatus(credentials.sessionId)).toEqual({ registered: 0, bound: 0 });
	jest.useRealTimers();
});
