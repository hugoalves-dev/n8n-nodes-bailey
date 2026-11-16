import { executeChatOperation } from '../nodes/Bailey/operations/chat.operations';

jest.mock('../nodes/Bailey/transport/ConnectionPool', () => ({
  getPoolEntry: jest.fn(() => undefined),
}));

describe('Chat mark-read-through-message', () => {
  it('uses remoteJid from the message itself rather than requesting a hidden jid parameter', async () => {
    const lastMessage = {
      key: { remoteJid: '120363123456@g.us', id: 'TEST_MESSAGE', fromMe: false, participant: '5511999999999@s.whatsapp.net' },
      messageTimestamp: 1794828320,
    };
    const context = {
      getNode: () => ({ name: 'Bailey' }),
      getNodeParameter: jest.fn((name: string) => {
        if (name === 'lastMessage') return JSON.stringify(lastMessage);
        throw new Error('Unexpected node parameter: ' + name);
      }),
    };
    const sock = { chatModify: jest.fn(async () => undefined) };
    await expect(executeChatOperation.call(
      context as never, sock as never, 'markChatReadThroughMessage', 0, { sessionId: 'test' },
    )).resolves.toMatchObject({ json: { success: true, jid: '120363123456@g.us' } });
    expect(context.getNodeParameter).toHaveBeenCalledTimes(1);
    expect(sock.chatModify).toHaveBeenCalledWith(
      { markRead: true, lastMessages: [lastMessage] }, '120363123456@g.us',
    );
  });
});
