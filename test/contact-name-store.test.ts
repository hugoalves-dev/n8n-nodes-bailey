import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ContactNameStore } from '../nodes/Bailey/transport/ContactNameStore';

describe('ContactNameStore', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'bailey-contact-names-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	it('indexes a saved name under the contact id, LID and phone number', async () => {
		const store = new ContactNameStore(directory);
		await store.load();
		await store.record('contacts.upsert', [
			{ id: '5514991112222@s.whatsapp.net', name: 'RC | SONNITECH (Gabriel)', lid: '115105643671683@lid', phoneNumber: '5514991112222@s.whatsapp.net' },
		]);

		expect(store.lookup(['115105643671683@lid'])).toBe('RC | SONNITECH (Gabriel)');
		expect(store.lookup(['5514991112222@s.whatsapp.net'])).toBe('RC | SONNITECH (Gabriel)');
		expect(store.lookup(['unknown@lid', '115105643671683@lid'])).toBe('RC | SONNITECH (Gabriel)');
		expect(store.lookup(['unknown@lid'])).toBeUndefined();
	});

	it('ignores profile names and keeps names saved in the address book', async () => {
		const store = new ContactNameStore(directory);
		await store.load();
		await store.record('contacts.upsert', [{ id: 'a@lid', name: 'Saved Name' }]);
		await store.record('contacts.update', [{ id: 'a@lid', notify: 'Profile Name' }]);
		await store.record('messaging-history.set', { contacts: [{ id: 'b@lid', notify: 'Only Profile' }] });

		expect(store.lookup(['a@lid'])).toBe('Saved Name');
		expect(store.lookup(['b@lid'])).toBeUndefined();
	});

	it('records names from history contacts and persists them across instances', async () => {
		const store = new ContactNameStore(directory);
		await store.load();
		await store.record('messaging-history.set', {
			contacts: [{ id: 'c@s.whatsapp.net', name: 'History Name', lid: 'c@lid' }],
			messages: [{ key: { id: 'secret' }, message: { conversation: 'do not persist' } }],
		});

		const reloaded = new ContactNameStore(directory);
		await reloaded.load();
		expect(reloaded.lookup(['c@lid'])).toBe('History Name');
		expect(await readFile(join(directory, 'contact-names.json'), 'utf8')).not.toContain('do not persist');
	});

	it('renames a contact when a newer saved name arrives', async () => {
		const store = new ContactNameStore(directory);
		await store.load();
		await store.record('contacts.upsert', [{ id: 'd@lid', name: 'Old' }]);
		await store.record('contacts.upsert', [{ id: 'd@lid', name: 'New' }]);
		expect(store.lookup(['d@lid'])).toBe('New');
	});
});
