const mockGetOrCreateConnection = jest.fn();
const mockRepairLoggedOutSession = jest.fn();
const mockGetPoolEntry = jest.fn();
const mockGetSessionSubscriptionStatus = jest.fn(() => ({ registered: 0, bound: 0 }));
const mockListSessionSubscriptionStatuses = jest.fn((): unknown[] => []);
const mockGetLastDisconnect = jest.fn((): unknown => null);
const mockGetSessionEnded = jest.fn((): unknown => null);
const mockWaitForAuthPrompt = jest.fn();
const mockQrToBuffer = jest.fn();
const mockQrToString = jest.fn();

jest.mock('../../nodes/Bailey/transport/ConnectionPool', () => ({
	getOrCreateConnection: (...args: unknown[]) => mockGetOrCreateConnection(...args),
	repairLoggedOutSession: (...args: unknown[]) => mockRepairLoggedOutSession(...args),
	getPoolEntry: (...args: unknown[]) => mockGetPoolEntry(...args),
	getSessionSubscriptionStatus: (...args: unknown[]) => mockGetSessionSubscriptionStatus(...args as []),
	listSessionSubscriptionStatuses: () => mockListSessionSubscriptionStatuses(),
	getLastDisconnect: () => mockGetLastDisconnect(),
	getSessionEnded: () => mockGetSessionEnded(),
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
	const execute = async (authMethod: string, operation = 'waitForAuthentication') => {
		const node = new BaileyAuth() as unknown as { execute: (this: unknown) => Promise<unknown[][]> };
		const context = {
			getNodeParameter: jest.fn().mockReturnValue(operation),
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
		mockQrToBuffer.mockResolvedValue(Buffer.from('png'));
	});

	it('returns the pairing code promptly and keeps the socket alive', async () => {
		const socket = {};
		mockGetOrCreateConnection.mockResolvedValue(socket);
		mockGetPoolEntry.mockReturnValue({ socket, connectionState: {} });
		mockWaitForAuthPrompt.mockResolvedValue({ status: 'pairingCode', pairingCode: '12345678' });
		const { result, context } = await execute('pairingCode', 'startPairing');
		const item = result[0][0] as { json: Record<string, unknown> };

		expect(mockGetOrCreateConnection).toHaveBeenCalledWith(expect.anything(), true);
		expect(mockWaitForAuthPrompt).toHaveBeenCalledWith(expect.objectContaining({ returnOnPrompt: true }));
		expect(item.json).toMatchObject({ authenticated: false, authStatus: 'pairingCode', pairingCode: '1234-5678' });
		expect(context.logger.info).not.toHaveBeenCalled();
	});

	it('returns a prompt through the explicit re-pair operation for the selected session', async () => {
		const socket = {};
		mockRepairLoggedOutSession.mockResolvedValue(socket);
		mockWaitForAuthPrompt.mockResolvedValue({ status: 'pairingCode', pairingCode: '12345678' });

		const { result } = await execute('pairingCode', 'repairLoggedOutSession');

		expect(mockRepairLoggedOutSession).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'test-session' }));
		expect(mockGetOrCreateConnection).not.toHaveBeenCalled();
		expect(mockWaitForAuthPrompt).toHaveBeenCalledWith(expect.objectContaining({ socket, returnOnPrompt: true }));
		expect(result[0][0]).toMatchObject({ json: { pairingCode: '1234-5678', authenticated: false } });
	});

	it('returns a scannable QR in the Binary tab', async () => {
		const socket = {};
		mockGetOrCreateConnection.mockResolvedValue(socket);
		mockGetPoolEntry.mockReturnValue({ socket, connectionState: {} });
		mockWaitForAuthPrompt.mockResolvedValue({ status: 'qrCode', qr: 'qr-payload' });
		const { result } = await execute('qrCode', 'startPairing');
		const item = result[0][0] as { json: Record<string, unknown>; binary?: unknown };

		expect(item.json.authStatus).toBe('qrCode');
		expect(mockQrToBuffer).toHaveBeenCalledWith('qr-payload', expect.anything());
		expect(item.binary).toEqual({ qrCode: { mimeType: 'image/png', fileName: 'bailey-qr.png' } });
	});

	it('checks connection state without creating another socket', async () => {
		mockGetPoolEntry.mockReturnValue({ authRegistered: true, connectionState: { connection: 'open' } });
		const { result } = await execute('pairingCode', 'checkStatus');
		expect(result[0][0]).toMatchObject({ json: { authenticated: true, authStatus: 'authenticated', connection: 'open' } });
		expect(mockGetOrCreateConnection).not.toHaveBeenCalled();
	});

	it('reports listener binding separately from authentication and connection', async () => {
		mockGetPoolEntry.mockReturnValue({ authRegistered: true, connectionState: { connection: 'open' } });
		mockGetSessionSubscriptionStatus.mockReturnValueOnce({ registered: 1, bound: 0 });
		const { result } = await execute('pairingCode', 'checkStatus');
		expect(result[0][0]).toMatchObject({ json: { authenticated: true, connection: 'open', triggerSubscriptions: { registered: 1, bound: 0 } } });
	});

	it('marks subscription counts as process-local and exposes triggers bound to other sessions', async () => {
		mockGetPoolEntry.mockReturnValue({ authRegistered: true, connectionState: { connection: 'open' } });
		mockListSessionSubscriptionStatuses.mockReturnValueOnce([
			{ sessionId: 'old-session', registered: 1, bound: 0 },
			{ sessionId: 'test-session', registered: 0, bound: 0 },
		]);
		const { result } = await execute('pairingCode', 'checkStatus');
		expect(result[0][0]).toMatchObject({ json: {
			triggerSubscriptions: { registered: 0, bound: 0, scope: 'process' },
			otherSessionSubscriptions: [{ sessionId: 'old-session', registered: 1, bound: 0 }],
		} });
	});

	it('reports a session logged out by WhatsApp with the disconnect reason', async () => {
		const ended = { statusCode: 401, reason: 'Stream Errored (conflict)', detail: 'device_removed', at: '2026-11-17T12:25:30.526Z' };
		mockGetPoolEntry.mockReturnValue(undefined);
		mockGetSessionEnded.mockReturnValueOnce(ended);
		mockGetLastDisconnect.mockReturnValueOnce({ ...ended, loggedOut: true });
		const { result } = await execute('pairingCode', 'checkStatus');
		expect(result[0][0]).toMatchObject({ json: {
			authenticated: false, authStatus: 'loggedOut', connection: 'unknown',
			sessionEnded: ended, lastDisconnect: { detail: 'device_removed', loggedOut: true },
		} });
	});

	it('reports no disconnect details for a healthy session', async () => {
		mockGetPoolEntry.mockReturnValue({ authRegistered: true, connectionState: { connection: 'open' } });
		const { result } = await execute('pairingCode', 'checkStatus');
		expect(result[0][0]).toMatchObject({ json: { authStatus: 'authenticated', sessionEnded: null, lastDisconnect: null } });
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
