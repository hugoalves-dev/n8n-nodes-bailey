import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as lockfile from 'proper-lockfile';

type MessageKey = { remoteJid: string; id: string; fromMe: boolean; participant?: string | null };
type Message = { key: MessageKey; messageTimestamp: unknown; [key: string]: unknown };
type Entry = { key: MessageKey; message: Message | null; origin: 'live' | 'history'; receivedAt: string; acknowledged: boolean };
type Store = { entries: Record<string, Entry>; cursors?: Record<string, { key: MessageKey; timestamp: number }> };

function identity(key: MessageKey): string {
 if (!key || typeof key.remoteJid !== 'string' || !key.remoteJid || typeof key.id !== 'string' || !key.id || typeof key.fromMe !== 'boolean') throw new Error('Message identity requires remoteJid, id and fromMe');
 return createHash('sha256').update(JSON.stringify([key.remoteJid, key.id, key.fromMe, key.participant ?? ''])).digest('hex');
}

export class RecoveryStore {
 private readonly file: string;
 constructor(private readonly directory: string, sessionId: string, workflowId: string) {
  const name = createHash('sha256').update(JSON.stringify([sessionId, workflowId])).digest('hex');
  this.file = join(directory, `recovery-${name}.json`);
 }
 private async transaction<T>(fn: (state: Store) => T): Promise<T> {
  await mkdir(this.directory, { recursive: true, mode: 0o700 });
  // Lock a stable directory, since replacing the data file changes its inode.
  const release = await lockfile.lock(this.directory, { lockfilePath: `${this.file}.lock`, retries: { retries: 100, minTimeout: 10, maxTimeout: 100 } });
  let temp: string | undefined;
  try {
   try { await writeFile(this.file, '{"entries":{}}', { flag: 'wx', mode: 0o600 }); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
   const state = JSON.parse(await readFile(this.file, 'utf8')) as Store;
   if (!state || typeof state.entries !== 'object' || !state.entries) throw new Error('Invalid recovery store');
   const result = fn(state);
   temp = `${this.file}.${randomUUID()}.tmp`;
   await writeFile(temp, JSON.stringify(state), { flag: 'wx', mode: 0o600 });
   await rename(temp, this.file);
   temp = undefined;
   return result;
  } finally {
   if (temp) await unlink(temp).catch(() => undefined);
   await release();
  }
 }
 async record(message: Message, origin: 'live' | 'history'): Promise<boolean> {
  const id = identity(message.key);
  return this.transaction(state => {
   if (state.entries[id]) return false;
   state.entries[id] = { key: message.key, message, origin, receivedAt: new Date().toISOString(), acknowledged: false };
   const timestamp = Number(message.messageTimestamp);
   if (Number.isSafeInteger(timestamp) && timestamp > 0) {
    state.cursors ??= {};
    const previous = state.cursors[message.key.remoteJid];
    if (!previous || timestamp > previous.timestamp) state.cursors[message.key.remoteJid] = { key: message.key, timestamp };
   }
   return true;
  });
 }
 async cursors(): Promise<Array<{ key: MessageKey; timestamp: number }>> { return this.transaction(state => Object.values(state.cursors ?? {})); }
 async pending(): Promise<Entry[]> { return this.transaction(state => Object.values(state.entries).filter(entry => !entry.acknowledged)); }
 async acknowledge(key: MessageKey): Promise<void> {
  const id = identity(key);
  await this.transaction(state => { if (!state.entries[id]) throw new Error('Message is not in the recovery store'); state.entries[id].acknowledged = true; state.entries[id].message = null; });
 }
}
