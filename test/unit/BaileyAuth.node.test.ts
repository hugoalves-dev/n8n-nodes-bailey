const mockGetOrCreateConnection = jest.fn();
const mockGetPoolEntry = jest.fn();
const mockWaitForAuthPrompt = jest.fn();
const mockQrToBuffer = jest.fn();
const mockQrToString = jest.fn();

jest.mock('../../nodes/Bailey/transport/ConnectionPool', () => ({
	getOrCreateConnection: (...args: unknown[]) => mockGetOrCreateConnection(...args),
	getPoolEntry: (...args: unknown[]) => mockGetPoolEntry(...args),
}));
jest.mock('../../nodes/Bailey/transport/AuthSetupService', () => ({
	waitForAuthPrompt: (...args: unknown[]) => mockWaitForAuthPrompt(...args),
}));
jest.mock('qrcode', () => ({
	toBuffer: (...args: unknown[]) => mockQrToBuffer(...args),
	toString: (...args: unknown[]) => mockQrToString(...args),
}));

import { BaileyAuth } from '../../nodes/Bailey/BaileyAuth.node';

describe('Bailey Auth node output', () => {
	const execute = async (authMethod: string) => {
		const node = new BaileyAuth() as unknown as { execute: (this: unknown) => Promise<unknown[][]> };
		const context = {
			getCredentials: jest.fn().mockResolvedValue({
				sessionId: 'test-session', authMethod, phoneNumber: '15551234567',
			}),
			helperData: {},
			helpers: { prepareBinaryData: jest.fn().mockResolvedValue({ mimeType: 'image/png', fileName: 'bailey-qr.png' }) },
			logger: { info: jest.fn() },
		};
		return { result: await node.execute.call(context), context };
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockQrToString.mockResolvedValue('terminal-qr');
	});

	it('logs a live pairing code and returns only the final auth state', async () => {
		const socket = {};
		mockGetOrCreateConnection.mockResolvedValue(socket);
		mockGetPoolEntry.mockReturnValue({ socket, connectionState: {} });
		mockWaitForAuthPrompt.mockImplementationOnce(async ({ onPrompt }: { onPrompt: (prompt: unknown) => void }) => {
			onPrompt({ status: 'pairingCode', pairingCode: '12345678' });
			return { status: 'authenticated' };
		});
		const { result, context } = await execute('pairingCode');
		const item = result[0][0] as { json: Record<string, unknown> };

		expect(item.json.authenticated).toBe(true);
		expect(item.json.authStatus).toBe('authenticated');
		expect(item.json.pairingCode).toBeUndefined();
		expect(context.logger.info).toHaveBeenCalledWith('[Bailey Auth] Pairing code: 1234-5678');
	});

	it('does not log a pairing code if its socket is replaced before prompt delivery', async () => {
		const socket = {};
		mockGetOrCreateConnection.mockResolvedValue(socket);
		mockGetPoolEntry.mockReturnValue({ socket, connectionState: {} });
		mockWaitForAuthPrompt.mockImplementationOnce(async ({
			getEntry,
			onPrompt,
		}: {
			getEntry: () => { socket: object };
			onPrompt: (prompt: unknown) => void;
		}) => {
			expect(getEntry().socket).toBe(socket);
			mockGetPoolEntry.mockReturnValue({ socket: {} });
			onPrompt({ status: 'pairingCode', pairingCode: '12345678' });
			return { status: 'error', message: 'The WhatsApp connection closed before authentication completed.' };
		});
		const { context } = await execute('pairingCode');

		expect(context.logger.info).not.toHaveBeenCalled();
	});

	it('writes a live terminal QR prompt and returns final auth state', async () => {
		const socket = {};
		mockGetOrCreateConnection.mockResolvedValue(socket);
		mockGetPoolEntry.mockReturnValue({ socket, connectionState: {} });
		mockWaitForAuthPrompt.mockImplementationOnce(async ({ onPrompt }: { onPrompt: (prompt: unknown) => void }) => {
			onPrompt({ status: 'qrCode', qr: 'qr-payload' });
			return { status: 'authenticated' };
		});
		const { result, context } = await execute('qrCode');
		const item = result[0][0] as { json: Record<string, unknown> };

		expect(item.json.authenticated).toBe(true);
		expect(context.logger.info).toHaveBeenCalledWith('[Bailey Auth] Scan this QR code in WhatsApp:\nterminal-qr');
	});

	it('does not display a QR if its socket is replaced while rendering', async () => {
		let finishRendering!: (qr: string) => void;
		mockQrToString.mockImplementationOnce(() => new Promise((resolve) => {
			finishRendering = resolve;
		}));
		const socket = {};
		mockGetOrCreateConnection.mockResolvedValue(socket);
		mockGetPoolEntry.mockReturnValue({ socket });
		mockWaitForAuthPrompt.mockImplementationOnce(async ({ onPrompt }: { onPrompt: (prompt: unknown) => void }) => {
			onPrompt({ status: 'qrCode', qr: 'qr-payload' });
			return { status: 'authenticated' };
		});
		const { context } = await execute('qrCode');
		mockGetPoolEntry.mockReturnValue({ socket: {} });
		finishRendering('terminal-qr');
		await new Promise((resolve) => setImmediate(resolve));

		expect(context.logger.info).not.toHaveBeenCalled();
	});

	it('does not log a QR that finishes rendering after the auth wait times out', async () => {
		let finishRendering!: (qr: string) => void;
		mockQrToString.mockImplementationOnce(() => new Promise((resolve) => {
			finishRendering = resolve;
		}));
		const socket = {};
		mockGetOrCreateConnection.mockResolvedValue(socket);
		mockGetPoolEntry.mockReturnValue({ socket, connectionState: {} });
		mockWaitForAuthPrompt.mockImplementationOnce(async ({ onPrompt }: { onPrompt: (prompt: unknown) => void }) => {
			onPrompt({ status: 'qrCode', qr: 'qr-payload' });
			return { status: 'timeout' };
		});
		const { result, context } = await execute('qrCode');
		finishRendering('terminal-qr');
		await new Promise((resolve) => setImmediate(resolve));

		expect((result[0][0] as { json: Record<string, unknown> }).json.authStatus).toBe('timeout');
		expect(context.logger.info).not.toHaveBeenCalled();
	});

	it('reports an already registered session without a QR or code', async () => {
		mockWaitForAuthPrompt.mockResolvedValue({ status: 'authenticated' });
		const { result } = await execute('pairingCode');
		const item = result[0][0] as { json: Record<string, unknown>; binary?: unknown };

		expect(item.json.authenticated).toBe(true);
		expect(item.binary).toBeUndefined();
	});

	it('returns disconnect details without returning the prompt again', async () => {
		mockWaitForAuthPrompt.mockResolvedValue({
			status: 'error',
			message: 'The WhatsApp connection closed before authentication completed.',
			statusCode: 401,
			reason: 'logged out',
		});
		const { result } = await execute('pairingCode');
		const item = result[0][0] as { json: Record<string, unknown> };

		expect(item.json).toMatchObject({
			authenticated: false,
			authStatus: 'error',
			disconnectStatusCode: 401,
			disconnectReason: 'logged out',
		});
		expect(item.json.pairingCode).toBeUndefined();
		expect(item.json.message).toBe('The WhatsApp connection closed before authentication completed.');
	});
});
