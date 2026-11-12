import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let mockDirectory: string;
const sockets: Array<{ ev: EventEmitter; end: jest.Mock }> = [];
jest.mock('@whiskeysockets/baileys', () => ({
 __esModule: true, default: () => { const socket = { ev: new EventEmitter(), end: jest.fn() }; sockets.push(socket); return socket; },
 Browsers: { ubuntu: () => [] }, DisconnectReason: { loggedOut: 401 }, makeCacheableSignalKeyStore: (keys: unknown) => keys,
}));
jest.mock('../../nodes/Bailey/transport/AuthStateStore', () => ({
 sessionDirFromConfig: () => mockDirectory,
 useFileAuthState: async () => ({ creds: { registered: true }, keys: {}, saveCreds: jest.fn() }),
}));
import { BaileyTrigger } from '../../nodes/Bailey/BaileyTrigger.node';
import { RecoveryStore } from '../../nodes/Bailey/transport/RecoveryStore';

it('persists messages, deduplicates history against live, and replays unacknowledged messages after restart', async () => {
 mockDirectory = await mkdtemp(join(tmpdir(), 'bailey-trigger-'));
 const emit = jest.fn();
 const context = { getCredentials: async () => ({ sessionId: 's' }), getNodeParameter: (name: string) => name === 'event' ? 'messages.upsert' : { durableRecovery: true }, getMode: () => 'trigger', getWorkflow: () => ({ id: 'w' }), getNode: () => ({ id: 'n' }), emit, emitError: jest.fn(), helpers: { returnJsonArray: (value: unknown) => value }, logger: { info: jest.fn(), error: jest.fn() } };
 try {
  const first = await BaileyTrigger.prototype.trigger.call(context as never);
  const msg = { key: { remoteJid: 'c@s.whatsapp.net', id: '1', fromMe: false }, messageTimestamp: 100, message: { conversation: 'hello' } };
  sockets.at(-1)!.ev.emit('messages.upsert', { type: 'notify', messages: [msg] });
  await new Promise(resolve => setTimeout(resolve, 200));
  sockets.at(-1)!.ev.emit('messaging-history.set', { messages: [msg] });
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(context.emitError).not.toHaveBeenCalled();
  expect(emit).toHaveBeenCalledTimes(1);
  await first.closeFunction();
  const second = await BaileyTrigger.prototype.trigger.call(context as never);
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(emit).toHaveBeenCalledTimes(2);
  const store = new RecoveryStore(join(mockDirectory, 'recovery'), 's', 'w:n');
  await store.acknowledge(msg.key);
  await second.closeFunction();
  const third = await BaileyTrigger.prototype.trigger.call(context as never);
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(emit).toHaveBeenCalledTimes(2);
  await third.closeFunction();
 } finally { await rm(mockDirectory, { recursive: true, force: true }); }
});
