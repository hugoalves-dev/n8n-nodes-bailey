import { EventEmitter } from 'events';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const sessionRoot = mkdtempSync(join(tmpdir(), 'bailey-contact-trigger-'));
const sockets: Array<{ ev: EventEmitter; end: jest.Mock }> = [];
jest.mock('@whiskeysockets/baileys', () => ({
	__esModule: true,
	default: () => { const socket = { ev: new EventEmitter(), end: jest.fn() }; sockets.push(socket); return socket; },
	Browsers: { ubuntu: () => [] }, DisconnectReason: { loggedOut: 401 },
	makeCacheableSignalKeyStore: (keys: unknown) => keys,
}));
jest.mock('../../../nodes/Bailey/transport/AuthStateStore', () => ({
	sessionDirFromConfig: (_root: string, id: string) => `${sessionRoot}/${id}`,
	useFileAuthState: async () => ({ creds: { registered: true, advSecretKey: 'key' }, keys: {}, saveCreds: jest.fn() }),
}));
import { getPoolEntry } from '../../../nodes/Bailey/transport/ConnectionPool';

afterAll(() => rmSync(sessionRoot, { recursive: true, force: true }));

const startTrigger = async (sessionId: string) => {
	const { BaileyTrigger } = await import('../../../nodes/Bailey/BaileyTrigger.node');
	const emit = jest.fn();
	const context = {
		getCredentials: async () => ({ sessionId }),
		getNodeParameter: (_: string, fallback: unknown) => fallback,
		getMode: () => 'trigger', emit, emitError: jest.fn(),
		helpers: { returnJsonArray: (value: unknown) => value },
		logger: { info: jest.fn(), error: jest.fn() },
	};
	const trigger = await BaileyTrigger.prototype.trigger.call(context as never);
	return { trigger, emit, socket: sockets[sockets.length - 1] };
};
const flush = async () => { for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve)); };
// Background writes must finish before the session directory is removed.
const settle = async (sessionId: string) => {
	await flush();
	const entry = getPoolEntry(sessionId);
	await entry?.contactNameStore?.whenIdle();
	await entry?.chatArchiveStore?.snapshot();
};
const emittedMessages = (emit: jest.Mock) => emit.mock.calls
	.map((call) => call[0][0][0])
	.filter((payload) => payload._event === 'messages.upsert')
	.flatMap((payload) => payload.messages);

it('adds the saved contact name to direct messages, matching LID or phone number', async () => {
	const { trigger, emit, socket } = await startTrigger('contact-names-direct');
	socket.ev.emit('contacts.upsert', [{ id: '5514991112222@s.whatsapp.net', name: 'RC | SONNITECH (Gabriel)', lid: '115105643671683@lid' }]);
	await flush();

	socket.ev.emit('messages.upsert', { type: 'notify', messages: [
		{ key: { remoteJid: '115105643671683@lid', id: '1' }, pushName: 'Sonnitech', message: { conversation: 'oi' } },
		{ key: { remoteJid: '999@lid', remoteJidAlt: '5514991112222@s.whatsapp.net', id: '2' }, pushName: 'Sonnitech', message: { conversation: 'oi' } },
		{ key: { remoteJid: 'stranger@lid', id: '3' }, pushName: 'Stranger', message: { conversation: 'oi' } },
	] });

	const messages = emittedMessages(emit);
	expect(messages.map((message: { _contactName?: string }) => message._contactName)).toEqual(['RC | SONNITECH (Gabriel)', 'RC | SONNITECH (Gabriel)', undefined]);
	expect(messages[0].pushName).toBe('Sonnitech');
	await settle('contact-names-direct');
	await trigger.closeFunction();
});

it('uses the sender in groups and never the group subject', async () => {
	const { trigger, emit, socket } = await startTrigger('contact-names-group');
	socket.ev.emit('messaging-history.set', { contacts: [{ id: '120363@g.us', name: 'Group Subject' }], chats: [], messages: [] });
	socket.ev.emit('contacts.upsert', [{ id: 'kevin@s.whatsapp.net', name: 'Kevin - JC', lid: '224863163801710@lid' }]);
	await flush();

	socket.ev.emit('messages.upsert', { type: 'notify', messages: [
		{ key: { remoteJid: '120363@g.us', participant: '224863163801710@lid', id: '1' }, pushName: 'Kevin', message: { conversation: 'oi' } },
		{ key: { remoteJid: '120363@g.us', participant: 'unknown@lid', id: '2' }, pushName: 'Someone', message: { conversation: 'oi' } },
	] });

	const messages = emittedMessages(emit);
	expect(messages.map((message: { _contactName?: string }) => message._contactName)).toEqual(['Kevin - JC', undefined]);
	await settle('contact-names-group');
	await trigger.closeFunction();
});

it('resyncs contact names on demand by re-reading only the contacts collection from scratch', async () => {
	const { executeContactOperation } = await import('../../../nodes/Bailey/operations/contact.operations');
	const calls: string[] = [];
	const sock = {
		authState: { keys: { set: jest.fn(async (data: unknown) => { calls.push('clear:' + JSON.stringify(data)); }) } },
		resyncAppState: jest.fn(async (collections: string[], initial: boolean) => { calls.push(`resync:${collections.join(',')}:${initial}`); }),
	};
	const result = await executeContactOperation.call({ getNode: () => ({}) } as never, sock as never, 'resyncSavedNames', 0);

	expect(calls).toEqual([
		'clear:{"app-state-sync-version":{"critical_unblock_low":null}}',
		'resync:critical_unblock_low:false',
	]);
	expect(result).toMatchObject({ json: { success: true, collection: 'critical_unblock_low' } });
	expect(getPoolEntry('never-created')).toBeUndefined();
});
