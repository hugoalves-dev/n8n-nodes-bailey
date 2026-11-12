import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
jest.mock('@whiskeysockets/baileys', () => ({ __esModule: true, default: jest.fn() }));
import { RecoveryStore } from '../../nodes/Bailey/transport/RecoveryStore';
import { executeRecoveryOperation } from '../../nodes/Bailey/operations/recovery.operations';

test('acknowledges a message in the trigger-specific durable store', async () => {
 const dir = await mkdtemp(join(tmpdir(), 'bailey-action-'));
 try {
  const key = { remoteJid: 'c@s.whatsapp.net', id: 'm', fromMe: false };
  const store = new RecoveryStore(dir, 's', 'w:n');
  await store.record({ key, messageTimestamp: 100 }, 'live');
  const ctx = { getNode: () => ({ name: 'Bailey' }), getWorkflow: () => ({ id: 'w' }), getNodeParameter: (name: string) => name === 'triggerId' ? 'n' : JSON.stringify(key) };
  const result = await executeRecoveryOperation.call(ctx, store, 'acknowledge', 0);
  expect(result.json).toEqual({ acknowledged: true });
  expect(await store.pending()).toHaveLength(0);
 } finally { await rm(dir, { recursive: true, force: true }); }
});

test('Bailey can acknowledge a persisted message without creating a socket', async () => {
 const root = await mkdtemp(join(tmpdir(), 'bailey-node-action-'));
 try {
  const key = { remoteJid: 'c@s.whatsapp.net', id: 'm', fromMe: false };
  const store = new RecoveryStore(join(root, 's', 'recovery'), 's', 'w:n');
  await store.record({ key, messageTimestamp: 100 }, 'live');
  const { Bailey } = await import('../../nodes/Bailey/Bailey.node');
  const ctx = {
   getInputData: () => [{ json: {} }], getCredentials: async () => ({ sessionId: 's', authDataPath: root }),
   getWorkflow: () => ({ id: 'w' }), getNode: () => ({ name: 'Bailey' }),
   getNodeParameter: (name: string) => ({ resource: 'recovery', operation: 'acknowledge', triggerId: 'n', recoveryKey: JSON.stringify(key) } as Record<string, unknown>)[name],
  };
  const result = await Bailey.prototype.execute.call(ctx as never);
  expect(result[0][0].json).toEqual({ acknowledged: true });
  expect(await store.pending()).toHaveLength(0);
 } finally { await rm(root, { recursive: true, force: true }); }
});
