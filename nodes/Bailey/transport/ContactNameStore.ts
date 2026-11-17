import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as lockfile from 'proper-lockfile';

type StoreData = {
	version: 1;
	names: Record<string, string>;
};

type ContactUpdate = { id?: unknown; lid?: unknown; phoneNumber?: unknown; name?: unknown };

const emptyStore = (): StoreData => ({ version: 1, names: {} });

function isJid(value: unknown): value is string {
	return typeof value === 'string' && value.includes('@');
}

function extractNames(event: string, payload: unknown): Record<string, string> {
	const items = event === 'messaging-history.set' ? (payload as { contacts?: unknown })?.contacts : payload;
	const names: Record<string, string> = {};
	for (const raw of Array.isArray(items) ? items : []) {
		if (!raw || typeof raw !== 'object') continue;
		const contact = raw as ContactUpdate;
		// `name` is the address-book name; the profile name arrives as `notify` and is ignored.
		if (typeof contact.name !== 'string' || !contact.name.trim()) continue;
		const name = contact.name.trim();
		for (const jid of [contact.id, contact.lid, contact.phoneNumber]) {
			if (isJid(jid)) names[jid] = name;
		}
	}
	return names;
}

/**
 * Names saved in the phone's address book, indexed by every JID WhatsApp gives for the
 * contact (PN and LID). They only arrive in the initial sync and on later edits, so they
 * are persisted per session. Lookups are synchronous against an in-memory copy.
 */
export class ContactNameStore {
	private readonly file: string;
	private names = new Map<string, string>();
	private queue: Promise<void> = Promise.resolve();

	constructor(private readonly directory: string) {
		this.file = join(directory, 'contact-names.json');
	}

	async load(): Promise<void> {
		try {
			const parsed = JSON.parse(await readFile(this.file, 'utf8')) as StoreData;
			if (parsed?.version === 1 && parsed.names && typeof parsed.names === 'object') {
				// Names recorded while the file was loading are newer than the file.
				for (const [jid, name] of Object.entries(parsed.names)) {
					if (typeof name === 'string' && !this.names.has(jid)) this.names.set(jid, name);
				}
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
	}

	lookup(jids: unknown[]): string | undefined {
		for (const jid of jids) {
			if (isJid(jid) && this.names.has(jid)) return this.names.get(jid);
		}
		return undefined;
	}

	async record(event: 'contacts.upsert' | 'contacts.update' | 'messaging-history.set', payload: unknown): Promise<void> {
		const names = extractNames(event, payload);
		if (!Object.keys(names).length) return;
		for (const [jid, name] of Object.entries(names)) this.names.set(jid, name);
		const write = this.queue.then(() => this.persist(names));
		// A failed write must not poison later updates.
		this.queue = write.catch(() => undefined);
		return write;
	}

	private async persist(names: Record<string, string>): Promise<void> {
		await mkdir(this.directory, { recursive: true, mode: 0o700 });
		try {
			await writeFile(this.file, JSON.stringify(emptyStore()), { flag: 'wx', mode: 0o600 });
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
		}
		const unlock = await lockfile.lock(this.file, { retries: { retries: 100, minTimeout: 10, maxTimeout: 100 } });
		let temporary: string | undefined;
		try {
			const parsed = JSON.parse(await readFile(this.file, 'utf8')) as StoreData;
			const data: StoreData = parsed?.version === 1 && parsed.names && typeof parsed.names === 'object' ? parsed : emptyStore();
			Object.assign(data.names, names);
			temporary = this.file + '.' + randomUUID() + '.tmp';
			await writeFile(temporary, JSON.stringify(data), { flag: 'wx', mode: 0o600 });
			await rename(temporary, this.file);
			temporary = undefined;
		} finally {
			if (temporary) await unlink(temporary).catch(() => undefined);
			await unlock();
		}
	}
}
