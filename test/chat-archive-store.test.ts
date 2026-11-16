import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ChatArchiveStore } from '../nodes/Bailey/transport/ChatArchiveStore';

describe('ChatArchiveStore', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'bailey-chat-archive-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('merges history and incremental updates and persists across instances', async () => {
    const store = new ChatArchiveStore(directory);
    await store.record('messaging-history.set', {
      chats: [
        { id: 'one@lid', archived: true },
        { id: 'two@g.us', archived: false },
        { id: 'unknown@lid' },
      ],
      messages: [{ key: { id: 'secret' }, message: { conversation: 'do not persist' } }],
      isLatest: true,
    });
    await store.record('chats.update', [
      { id: 'one@lid', unreadCount: 4 },
      { id: 'two@g.us', archived: true },
    ]);
    const snapshot = await new ChatArchiveStore(directory).snapshot();
    expect(snapshot.chats.map(chat => [chat.jid, chat.archived])).toEqual([
      ['one@lid', true],
      ['two@g.us', true],
    ]);
    expect(snapshot.archivedCount).toBe(2);
    expect(snapshot.knownChatCount).toBe(2);
    expect(snapshot.historySeen).toBe(true);
    expect(snapshot.latestHistoryBatchSeen).toBe(true);
    expect(snapshot.coverage).toBe('partial_or_unknown');
    const disk = await readFile(join(directory, 'chat-archive-state.json'), 'utf8');
    expect(disk).not.toContain('do not persist');
    expect(disk).not.toContain('unknown@lid');
  });

  it('does not treat unseen chats as unarchived or clear old state after a partial sync', async () => {
    const store = new ChatArchiveStore(directory);
    await store.record('chats.upsert', [{ id: 'kept@g.us', archived: true }]);
    await store.record('messaging-history.set', { chats: [], isLatest: false });
    await store.record('chats.update', [{ id: 'kept@g.us', unreadCount: 0 }]);
    expect((await store.snapshot()).chats).toEqual([
      expect.objectContaining({ jid: 'kept@g.us', archived: true }),
    ]);
    expect((await store.snapshot()).latestHistoryBatchSeen).toBe(false);
  });

  it('handles delete events and concurrent updates without lost writes', async () => {
    const store = new ChatArchiveStore(directory);
    await Promise.all([
      store.record('chats.update', [{ id: 'one@lid', archived: true }]),
      store.record('chats.update', [{ id: 'two@lid', archived: true }]),
    ]);
    await store.record('chats.delete', ['one@lid']);
    expect((await store.snapshot()).chats.map(chat => chat.jid)).toEqual(['two@lid']);
  });

  it('never infers completeness when the initial history is unavailable', async () => {
    const store = new ChatArchiveStore(directory);
    const snapshot = await store.snapshot();
    expect(snapshot.historySeen).toBe(false);
    expect(snapshot.coverage).toBe('partial_or_unknown');
    expect(snapshot.chats).toEqual([]);
  });
});
