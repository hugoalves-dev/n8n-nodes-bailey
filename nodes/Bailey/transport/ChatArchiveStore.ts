import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as lockfile from 'proper-lockfile';

export type ChatArchiveRecord = {
  jid: string;
  archived: boolean;
  updated_at: string;
};

type StoreData = {
  version: 1;
  chats: Record<string, ChatArchiveRecord>;
  historySeen: boolean;
  lastHistoryAt: string | null;
  latestHistoryBatchSeen: boolean;
};

export type ChatArchiveSnapshot = {
  chats: ChatArchiveRecord[];
  knownChatCount: number;
  archivedCount: number;
  historySeen: boolean;
  lastHistoryAt: string | null;
  latestHistoryBatchSeen: boolean;
  coverage: 'partial_or_unknown';
};

type ChatUpdate = { id?: unknown; jid?: unknown; remoteJid?: unknown; archived?: unknown };

const emptyStore = (): StoreData => ({
  version: 1,
  chats: {},
  historySeen: false,
  lastHistoryAt: null,
  latestHistoryBatchSeen: false,
});

function normalizeUpdates(event: string, payload: unknown) {
  const history = event === 'messaging-history.set';
  const chatItems = history ? (payload as { chats?: unknown })?.chats : payload;
  const updates = Array.isArray(chatItems) ? chatItems : [];
  const now = new Date().toISOString();
  const rows: ChatArchiveRecord[] = [];
  const deletions: string[] = [];

  for (const raw of updates) {
    if (event === 'chats.delete' && typeof raw === 'string') {
      if (raw && !raw.endsWith('@newsletter') && !raw.endsWith('@broadcast')) deletions.push(raw);
      continue;
    }
    if (!raw || typeof raw !== 'object') continue;
    const chat = raw as ChatUpdate;
    const jid = [chat.id, chat.jid, chat.remoteJid].find(value => typeof value === 'string' && value.length > 0) as string | undefined;
    if (!jid || jid.endsWith('@newsletter') || jid.endsWith('@broadcast')) continue;
    if (event === 'chats.delete') {
      deletions.push(jid);
    } else if (typeof chat.archived === 'boolean') {
      rows.push({ jid, archived: chat.archived, updated_at: now });
    }
  }

  return {
    rows,
    deletions,
    history,
    historyLatest: history && (payload as { isLatest?: unknown })?.isLatest === true,
    now,
  };
}

/**
 * Records only explicit archive flags; it never guesses that an unseen chat is unarchived.
 * One store per session. Locking and atomic rename protect against worker restarts and
 * concurrent processes sharing a filesystem with reliable advisory locks.
 */
export class ChatArchiveStore {
  private readonly file: string;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly directory: string) {
    this.file = join(directory, 'chat-archive-state.json');
  }

  private async transaction<T>(callback: (data: StoreData) => T, persist: boolean): Promise<T> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const unlock = await lockfile.lock(this.directory, {
      lockfilePath: this.file + '.lock',
      retries: { retries: 100, minTimeout: 10, maxTimeout: 100 },
    });
    let temporary: string | undefined;
    try {
      try {
        await writeFile(this.file, JSON.stringify(emptyStore()), { flag: 'wx', mode: 0o600 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
      const parsed: unknown = JSON.parse(await readFile(this.file, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || (parsed as StoreData).version !== 1 ||
          !((parsed as StoreData).chats) || typeof (parsed as StoreData).chats !== 'object') {
        throw new Error('Invalid chat archive state store');
      }
      const data = parsed as StoreData;
      const result = callback(data);
      if (persist) {
        temporary = this.file + '.' + randomUUID() + '.tmp';
        await writeFile(temporary, JSON.stringify(data), { flag: 'wx', mode: 0o600 });
        await rename(temporary, this.file);
        temporary = undefined;
      }
      return result;
    } finally {
      if (temporary) await unlink(temporary).catch(() => undefined);
      await unlock();
    }
  }

  async record(event: 'messaging-history.set' | 'chats.upsert' | 'chats.update' | 'chats.delete', payload: unknown): Promise<void> {
    // Extract only metadata immediately, avoiding retention of huge history/message payloads.
    const update = normalizeUpdates(event, payload);
    if (!update.rows.length && !update.deletions.length && !update.history) return;
    const write = this.queue.then(() => this.transaction(data => {
      for (const jid of update.deletions) delete data.chats[jid];
      for (const row of update.rows) data.chats[row.jid] = row;
      if (update.history) {
        data.historySeen = true;
        data.lastHistoryAt = update.now;
        data.latestHistoryBatchSeen ||= update.historyLatest;
      }
    }, true));
    // A rejected operation must not poison all future updates.
    this.queue = write.catch(() => undefined);
    return write;
  }

  async snapshot(): Promise<ChatArchiveSnapshot> {
    await this.queue;
    return this.transaction(data => {
      const chats = Object.values(data.chats).sort((a, b) => a.jid.localeCompare(b.jid));
      return {
        chats,
        knownChatCount: chats.length,
        archivedCount: chats.filter(row => row.archived).length,
        historySeen: data.historySeen,
        lastHistoryAt: data.lastHistoryAt,
        latestHistoryBatchSeen: data.latestHistoryBatchSeen,
        // Even isLatest does not certify that the primary phone delivered all chats.
        coverage: 'partial_or_unknown' as const,
      };
    }, false);
  }
}
