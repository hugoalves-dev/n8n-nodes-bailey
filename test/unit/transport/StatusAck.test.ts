import { EventEmitter } from 'events';
import type { BinaryNode } from '@whiskeysockets/baileys';

const mockSendMessageAck = jest.fn();
jest.mock('@whiskeysockets/baileys', () => ({
	__esModule: true,
	default: () => ({ ev: new EventEmitter(), ws: new EventEmitter(), sendMessageAck: mockSendMessageAck, end: jest.fn() }),
	Browsers: { ubuntu: () => [] },
	makeCacheableSignalKeyStore: (keys: unknown) => keys,
}));
jest.mock('../../../nodes/Bailey/transport/AuthStateStore', () => ({
	sessionDirFromConfig: () => '/tmp/bailey-status-ack-test',
	useFileAuthState: async () => ({ creds: { registered: true }, keys: {}, saveCreds: jest.fn() }),
}));

import { getOrCreateConnection, getPoolEntry, subscribeToSession } from '../../../nodes/Bailey/transport/ConnectionPool';

it('acknowledges live and offline status stanzas and keeps delivering messages after an ACK fails', async () => {
	const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
	const credentials = { sessionId: 'status-ack' };
	const onMessage = jest.fn();
	const release = await subscribeToSession(credentials, (socket) => {
		socket.ev.on('messages.upsert', onMessage);
		return () => socket.ev.off('messages.upsert', onMessage);
	});
	try {
		const socket = await getOrCreateConnection(credentials, true);
		socket.ev.emit('connection.update', { connection: 'open' });
		const live: BinaryNode = {
			tag: 'status',
			attrs: { id: 'status-1', from: 'status@broadcast', type: 'media', participant: '100@s.whatsapp.net', recipient: '200@s.whatsapp.net' },
		};
		const offline = { ...live, attrs: { ...live.attrs, id: 'status-2', offline: '1' } };
		mockSendMessageAck.mockRejectedValueOnce(new Error('Socket write failed')).mockResolvedValueOnce(undefined);

		socket.ws.emit('CB:status', live);
		socket.ws.emit('CB:status', offline);
		await Promise.resolve();
		expect(mockSendMessageAck.mock.calls).toEqual([[live], [offline]]);
		expect(warn).toHaveBeenCalledTimes(1);

		const messages = [{ key: { id: 'later-message', remoteJid: '100@g.us' }, message: { conversation: 'hello' } }];
		socket.ev.emit('messages.upsert', { messages, type: 'append' });
		expect(onMessage).toHaveBeenCalledWith({ messages, type: 'append' });
		expect(getPoolEntry(credentials.sessionId)).toMatchObject({
			connectionOpenedAt: expect.any(String),
			lastInboundMessageAt: expect.any(String),
		});
	} finally {
		release();
		warn.mockRestore();
	}
});
