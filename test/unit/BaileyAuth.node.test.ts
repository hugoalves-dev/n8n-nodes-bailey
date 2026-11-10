const mockGetOrCreateConnection = jest.fn();
const mockGetPoolEntry = jest.fn();
const mockWaitForAuthPrompt = jest.fn();
const mockQrToBuffer = jest.fn();

jest.mock('../../nodes/Bailey/transport/ConnectionPool', () => ({
	getOrCreateConnection: (...args: unknown[]) => mockGetOrCreateConnection(...args),
	getPoolEntry: (...args: unknown[]) => mockGetPoolEntry(...args),
}));
jest.mock('../../nodes/Bailey/transport/AuthSetupService', () => ({
	waitForAuthPrompt: (...args: unknown[]) => mockWaitForAuthPrompt(...args),
}));
jest.mock('qrcode', () => ({ toBuffer: (...args: unknown[]) => mockQrToBuffer(...args) }));

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

	beforeEach(() => jest.clearAllMocks());

	it('returns and logs the pairing code as readable JSON', async () => {
		mockWaitForAuthPrompt.mockResolvedValue({ status: 'pairingCode', pairingCode: '12345678' });
		const { result, context } = await execute('pairingCode');
		const item = result[0][0] as { json: Record<string, unknown> };

		expect(item.json.pairingCode).toBe('1234-5678');
		expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining('1234-5678'));
	});

	it('returns a QR PNG as n8n binary output', async () => {
		mockWaitForAuthPrompt.mockResolvedValue({ status: 'qrCode', qr: 'qr-payload' });
		mockQrToBuffer.mockResolvedValue(Buffer.from('png-data'));
		const { result, context } = await execute('qrCode');
		const item = result[0][0] as { binary: Record<string, unknown> };

		expect(mockQrToBuffer).toHaveBeenCalledWith('qr-payload', expect.objectContaining({ type: 'png' }));
		expect(context.helpers.prepareBinaryData).toHaveBeenCalledWith(Buffer.from('png-data'), 'bailey-qr.png', 'image/png');
		expect(item.binary.qrCode).toMatchObject({ mimeType: 'image/png', fileName: 'bailey-qr.png' });
	});

	it('reports an already registered session without a QR or code', async () => {
		mockWaitForAuthPrompt.mockResolvedValue({ status: 'authenticated' });
		const { result } = await execute('pairingCode');
		const item = result[0][0] as { json: Record<string, unknown>; binary?: unknown };

		expect(item.json.authenticated).toBe(true);
		expect(item.binary).toBeUndefined();
	});
});
