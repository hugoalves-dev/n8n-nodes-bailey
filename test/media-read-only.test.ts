import { executeMediaOperation } from '../nodes/Bailey/operations/media.operations';
import { downloadMediaMessage as downloadMediaMessageOriginal } from '@whiskeysockets/baileys';

jest.mock('@whiskeysockets/baileys', () => ({ downloadMediaMessage: jest.fn() }));
const downloadMediaMessage = jest.mocked(downloadMediaMessageOriginal);

describe('read-only media download', () => {
  const message = { message: { imageMessage: { mimetype: 'image/png' } } };
  const context = {
    getNode: () => ({ name: 'Bailey' }),
    getNodeParameter: (name: string, _index: number, fallback: unknown) => name === 'messageJson' ? message : fallback,
    helpers: { prepareBinaryData: jest.fn(async () => ({ data: 'binary' })) },
  };
  const socket = { updateMediaMessage: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  it('downloads without providing the reupload callback', async () => {
    downloadMediaMessage.mockResolvedValue(Buffer.from('image'));
    const result = await executeMediaOperation.call(context as never, socket as never, 'downloadReadOnly', 0);
    expect(result.binary).toBeDefined();
    expect(downloadMediaMessage.mock.calls[0][3]).toBeUndefined();
    expect(socket.updateMediaMessage).not.toHaveBeenCalled();
  });

  it('reports expired media without requesting reupload', async () => {
    downloadMediaMessage.mockRejectedValue(Object.assign(new Error('gone'), { status: 404 }));
    const result = await executeMediaOperation.call(context as never, socket as never, 'downloadReadOnly', 0);
    expect(result.json).toMatchObject({ available: false });
    expect(socket.updateMediaMessage).not.toHaveBeenCalled();
  });
});
