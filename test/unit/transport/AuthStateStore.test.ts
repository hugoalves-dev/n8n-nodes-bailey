import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
jest.mock('@whiskeysockets/baileys', () => ({
	BufferJSON: { replacer: (_key: string, value: unknown) => value, reviver: (_key: string, value: unknown) => value },
	initAuthCreds: () => ({ registered: false }),
}));
import { clearSessionAuthFiles, sessionDirFromConfig, useFileAuthState } from '../../../nodes/Bailey/transport/AuthStateStore';

describe('sessionDirFromConfig', () => {
	let root: string;
	beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'bailey-auth-')); });
	afterEach(() => { rmSync(root, { recursive: true, force: true }); });

	it('keeps each session in its own directory below the configured root', () => {
		expect(sessionDirFromConfig(root, 'session-a')).toBe(join(root, 'session-a'));
		expect(sessionDirFromConfig(root, 'session-b')).not.toBe(sessionDirFromConfig(root, 'session-a'));
	});

	it('rejects a session id that escapes the configured root', () => {
		expect(() => sessionDirFromConfig(root, '../outside')).toThrow('Session ID must be a single path segment');
	});

	it('clears revoked auth files and temporary writes while keeping metadata and other sessions', async () => {
		const session = sessionDirFromConfig(root, 'revoked');
		const other = sessionDirFromConfig(root, 'other');
		const state = await useFileAuthState(session);
		await state.saveCreds();
		await state.keys.set({ 'session': { example: Buffer.from('old key') } });
		await (await useFileAuthState(other)).saveCreds();
		writeFileSync(join(session, 'creds.json.tmp'), '{}');
		writeFileSync(join(session, 'pre-key-example.json.tmp'), '{}');
		writeFileSync(join(session, 'chat-archive-state.json'), '{}');

		state.invalidate();
		clearSessionAuthFiles(session);
		await state.saveCreds();
		await state.keys.set({ 'session': { example: Buffer.from('stale write') } });
		expect(readdirSync(session)).toEqual(['chat-archive-state.json']);
		expect(readdirSync(other)).toEqual(['creds.json']);
	});

	it('persists credentials and keys atomically in the selected session', async () => {
		const session = sessionDirFromConfig(root, 'persisted');
		const state = await useFileAuthState(session);
		state.creds.registered = true;
		await state.saveCreds();
		await state.keys.set({ 'pre-key': { 'key-1': { private: Buffer.from('private'), public: Buffer.from('public') } } } as never);

		const loaded = await useFileAuthState(session);
		expect(loaded.creds.registered).toBe(true);
		expect((await loaded.keys.get('pre-key', ['key-1']))['key-1']).toBeDefined();
	});
});
