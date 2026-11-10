const mockGetOrCreateConnection = jest.fn();


jest.mock('@whiskeysockets/baileys', () => ({
	__esModule: true,
	default: jest.fn(),
	Browsers: { ubuntu: jest.fn() },
	DisconnectReason: { loggedOut: 401 },
	makeCacheableSignalKeyStore: jest.fn(),
}));
jest.mock('../../nodes/Bailey/transport/ConnectionPool', () => ({
	getOrCreateConnection: (...args: unknown[]) => mockGetOrCreateConnection(...args),
	deregisterSocket: jest.fn(),
	getPoolEntry: jest.fn(),
}));

import { BaileyTrigger } from '../../nodes/Bailey/BaileyTrigger.node';

describe('Bailey credential test context', () => {
	it('runs without node execution helpers on the n8n credential-test context', async () => {
		mockGetOrCreateConnection.mockRejectedValueOnce(new Error('connection unavailable'));
		const trigger = new BaileyTrigger() as unknown as {
			methods: { credentialTest: { baileyCredentialTest: (this: object, credential: unknown) => Promise<unknown> } };
		};
		const testCredential = trigger.methods.credentialTest.baileyCredentialTest;

		const result = await testCredential.call({} as never, {
			data: {
				sessionId: 'credential-test-session',
				authDataPath: '/tmp/bailey-test',
				authMethod: 'pairingCode',
				phoneNumber: '15551234567',
			},
		} as never);

		expect(result).toEqual({
			status: 'Error',
			message: 'Could not initialize the WhatsApp connection. Check the credentials, auth directory permissions, and proxy configuration.',
		});
	});
});
