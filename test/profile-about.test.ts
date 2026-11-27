import type { BinaryNode } from '@whiskeysockets/baileys';
import { executeProfileOperation } from '../nodes/Bailey/operations/profile.operations';
import { profileFields, profileOperations } from '../nodes/Bailey/descriptions/ProfileDescription';
import { buildAboutInput, getAbout } from '../nodes/Bailey/transport/ProfileAbout';

jest.mock('@whiskeysockets/baileys', () => ({
    S_WHATSAPP_NET: 's.whatsapp.net',
    getBinaryNodeChild: (node: BinaryNode, tag: string) =>
        Array.isArray(node.content) ? node.content.find(child => child.tag === tag) : undefined,
    jidNormalizedUser: (jid?: string) => jid?.replace(/:\d+@/, '@') ?? '',
    USyncQuery: class {
        protocols = [];
        users = [];
        withUser(user: unknown) {
            this.users.push(user);
            return this;
        }
    },
    USyncUser: class {
        id: string;
        withId(id: string) {
            this.id = id;
            return this;
        }
    },
}));

const acknowledged = { data: { xwa2_update_text_status: { result: true } } };
const reply = (payload: unknown) => ({
    tag: 'iq',
    attrs: { type: 'result' },
    content: [{ tag: 'result', attrs: {}, content: Buffer.from(JSON.stringify(payload)) }],
});

const now = Date.parse('2026-11-27T14:00:00Z');
const socket = {
    query: jest.fn(),
    executeUSyncQuery: jest.fn(),
    updateProfileStatus: jest.fn(),
    user: { id: '1234:9@s.whatsapp.net', lid: '5678:9@lid' },
};

function execute(operation: string, fields: Record<string, unknown> = {}) {
    const context = {
        getNodeParameter: jest.fn((name: string, _index: number, fallback: unknown) => fields[name] ?? fallback),
    };
    return executeProfileOperation.call(context, socket, operation, 0);
}

beforeEach(() => jest.resetAllMocks());

it('registers About operations and shows expiration only for custom Update About', () => {
    expect(profileOperations[0].options.map(option => option.value)).toEqual(expect.arrayContaining([
        'clearAbout', 'getAbout', 'updateAbout', 'updateStatus',
    ]));
    expect(profileOperations[0].default).toBe('updateStatus');
    expect(profileFields.find(field => field.name === 'aboutExpiresAt')?.displayOptions?.show).toEqual({
        resource: ['profile'], operation: ['updateAbout'], aboutDuration: ['custom'],
    });
});

it('counts Unicode code points and serializes a single emoji sequence', () => {
    expect(buildAboutInput('🚀'.repeat(50), '👩🏽‍💻', 3600, undefined)).toEqual({
        text: '🚀'.repeat(50), emoji: { content: '👩🏽‍💻' }, ephemeral_duration_sec: 3600,
    });
    expect(() => buildAboutInput('🚀'.repeat(51), '', 3600, undefined)).toThrow('50 Unicode code points');
    expect(() => buildAboutInput(' ', '', 3600, undefined)).toThrow('About text');
    expect(() => buildAboutInput('Working', '🚀🎵', 3600, undefined)).toThrow('single About emoji');
    expect(() => buildAboutInput('Working', '', 0, undefined)).toThrow('preset');
});

it('converts custom expiry to relative whole seconds including the offset', () => {
    expect(buildAboutInput('Working', '', 'custom', '2026-11-27T12:00:00.001-03:00', now))
        .toEqual({ text: 'Working', ephemeral_duration_sec: 3601 });
});

it.each([
    '2026-11-27T14:00:00Z',
    '2026-11-27T15:00:00',
    '2026-02-30T15:00:00Z',
    '2026-11-27T24:00:00Z',
    '2099-11-27T15:00:00Z',
])('rejects custom expiration %s', expiration => {
    expect(() => buildAboutInput('Working', '', 'custom', expiration, now)).toThrow(/expiration/);
});

it.each([
    ['updateAbout', { aboutText: 'Playing 🎵', aboutEmoji: '🚀', aboutDuration: 28800 },
        { text: 'Playing 🎵', emoji: { content: '🚀' }, ephemeral_duration_sec: 28800 }],
    ['clearAbout', {}, { text: null, ephemeral_duration_sec: 0 }],
] as const)('sends a single MEX request for %s', async (operation, fields, input) => {
    socket.query.mockResolvedValue(reply(acknowledged));
    await expect(execute(operation, fields)).resolves.toMatchObject({ json: { success: true } });
    expect(socket.query).toHaveBeenCalledTimes(1);
    expect(socket.query).toHaveBeenCalledWith({
        tag: 'iq',
        attrs: { to: 's.whatsapp.net', type: 'get', xmlns: 'w:mex' },
        content: [{
            tag: 'query',
            attrs: { query_id: '9152604461510864' },
            content: Buffer.from(JSON.stringify({ variables: { input } }), 'utf8'),
        }],
    });
    expect(socket.updateProfileStatus).not.toHaveBeenCalled();
});

it.each([
    [undefined, /did not confirm/],
    [reply({}), /did not confirm/],
    [{ tag: 'iq', attrs: { type: 'result' }, content: [{ tag: 'result', attrs: {}, content: '{' }] }, /did not confirm/],
    [reply({ data: { xwa2_update_text_status: { result: false } } }), /rejected/],
    [reply({ ...acknowledged, errors: [{ message: 'private server detail' }] }), /rejected/],
    [{ tag: 'iq', attrs: { type: 'error' } }, /rejected/],
])('rejects unconfirmed or failed MEX replies', async (response, message) => {
    socket.query.mockResolvedValue(response);
    await expect(execute('clearAbout')).rejects.toThrow(message);
    expect(socket.query).toHaveBeenCalledTimes(1);
});

it('reports transport failures without exposing socket error details', async () => {
    socket.query.mockRejectedValue(new Error('private session detail'));
    await expect(execute('clearAbout')).rejects.toThrow('Check the linked session');
});

it('reads only the linked account and decodes emoji and expiry', async () => {
    socket.executeUSyncQuery.mockResolvedValue({
        list: [
            { id: 'unrelated@s.whatsapp.net', text_status: { tag: 'text_status', attrs: { text: 'Ignore' } } },
            { id: '5678@lid', text_status: {
                tag: 'text_status',
                attrs: { text: 'Playing', ephemeral_duration_sec: '3600', last_update_time: String(now / 1000) },
                content: [{ tag: 'emoji', attrs: { content: '🎵' } }],
            } },
        ],
    });
    await expect(execute('getAbout')).resolves.toEqual({
        json: { text: 'Playing', emoji: '🎵', durationSeconds: 3600, expiresAt: '2026-11-27T15:00:00.000Z' },
    });
    const query = socket.executeUSyncQuery.mock.calls[0][0];
    expect(query.users).toEqual([{ id: '1234@s.whatsapp.net' }]);
    expect(query.protocols.map(protocol => protocol.getQueryElement())).toEqual([{ tag: 'text_status', attrs: {} }]);
});

it('distinguishes an explicit empty note from a missing text_status reply', async () => {
    socket.executeUSyncQuery.mockResolvedValueOnce({
        list: [{ id: '1234@s.whatsapp.net', text_status: { tag: 'text_status', attrs: {} } }],
    }).mockResolvedValueOnce({ list: [{ id: '1234@s.whatsapp.net' }] });
    await expect(getAbout(socket)).resolves.toEqual({
        text: null, emoji: null, durationSeconds: null, expiresAt: null,
    });
    await expect(getAbout(socket)).rejects.toThrow('About read may be unavailable');
});

it('keeps the legacy Update Status input and call unchanged', async () => {
    await expect(execute('updateStatus', { status: 'Legacy status' })).resolves.toEqual({
        json: { success: true, status: 'Legacy status' },
    });
    expect(socket.updateProfileStatus).toHaveBeenCalledWith('Legacy status');
    expect(socket.query).not.toHaveBeenCalled();
});
