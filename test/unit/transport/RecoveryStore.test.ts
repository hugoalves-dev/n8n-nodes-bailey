import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RecoveryStore } from '../../../nodes/Bailey/transport/RecoveryStore';

describe('durable recovery store', () => {
 let dir: string;
 beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'bailey-recovery-')); });
 afterEach(async () => { await rm(dir, { recursive: true, force: true }); });
 const key = { remoteJid: 'chat@s.whatsapp.net', id: 'message-1', participant: 'author@s.whatsapp.net', fromMe: false };
 it('deduplicates live and history delivery after a restart while retaining pending messages', async () => {
  const first = new RecoveryStore(dir, 'session', 'workflow');
  expect(await first.record({ key, messageTimestamp: 123, message: { conversation: 'test' } }, 'live')).toBe(true);
  const restarted = new RecoveryStore(dir, 'session', 'workflow');
  expect(await restarted.record({ key, messageTimestamp: 123, message: { conversation: 'test' } }, 'history')).toBe(false);
  expect(await restarted.pending()).toHaveLength(1);
 });
 it('keeps participant identities distinct and acknowledges only the selected message', async () => {
  const store = new RecoveryStore(dir, 'session', 'workflow');
  await store.record({ key, messageTimestamp: 123 }, 'history');
  await store.record({ key: { ...key, participant: 'other@s.whatsapp.net' }, messageTimestamp: 124 }, 'history');
  await store.acknowledge(key);
  expect(await store.pending()).toHaveLength(1);
  expect(await store.record({ key, messageTimestamp: 123 }, 'live')).toBe(false);
 });
 it('serializes concurrent writers without losing messages', async () => {
  const one = new RecoveryStore(dir, 'session', 'workflow');
  const two = new RecoveryStore(dir, 'session', 'workflow');
  await Promise.all(Array.from({length: 10}, (_, i) => (i % 2 ? one : two).record({ key: { ...key, id: String(i) }, messageTimestamp: 123 + i }, 'live')));
  expect(await one.pending()).toHaveLength(10);
 });
});

it('tracks the newest known message per conversation despite out-of-order arrival', async () => {
 const dir = await mkdtemp(join(tmpdir(), 'bailey-cursor-'));
 try {
  const store = new RecoveryStore(dir, 'session', 'workflow');
  const key = { remoteJid: 'chat@s.whatsapp.net', id: 'new', fromMe: false };
  await store.record({ key, messageTimestamp: 200 }, 'live');
  await store.record({ key: { ...key, id: 'old' }, messageTimestamp: 100 }, 'history');
  expect(await store.cursors()).toEqual([{ key, timestamp: 200 }]);
 } finally { await rm(dir, { recursive: true, force: true }); }
});
