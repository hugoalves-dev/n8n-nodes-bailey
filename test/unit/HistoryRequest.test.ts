import { executeUserOperation } from '../../nodes/Bailey/operations/user.operations';

function context(key: unknown, timestamp: number) {
	return { getNode: () => ({ name: 'Bailey' }), getNodeParameter: (name: string) => ({ historyCount: 25, oldestMsgKey: key, oldestMsgTimestamp: timestamp } as Record<string, unknown>)[name] };
}

test('requests history using a parsed message key and indicates that the result is asynchronous', async () => {
	const socket = { fetchMessageHistory: jest.fn().mockResolvedValue('request') };
	const key = { remoteJid: '123@s.whatsapp.net', id: 'message', fromMe: false };
	const result = await executeUserOperation.call(context(JSON.stringify(key), 123), socket, 'fetchMessageHistory', 0);
	expect(socket.fetchMessageHistory).toHaveBeenCalledWith(25, key, 123);
	expect(result.json).toMatchObject({ requestId: 'request' });
});

test('rejects a history request without a usable conversation key and timestamp', async () => {
	const socket = { fetchMessageHistory: jest.fn() };
	await expect(executeUserOperation.call(context('{}', 0), socket, 'fetchMessageHistory', 0)).rejects.toThrow();
	expect(socket.fetchMessageHistory).not.toHaveBeenCalled();
});
