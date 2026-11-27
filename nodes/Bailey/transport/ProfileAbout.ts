import {
    type BinaryNode,
    type WASocket,
    getBinaryNodeChild,
    jidNormalizedUser,
    S_WHATSAPP_NET,
    USyncQuery,
    USyncUser,
} from '@whiskeysockets/baileys';

export const defaultAboutDuration = 86400;

export const aboutDurationPresets = [
    { name: '1 Hour', value: 3600 },
    { name: '8 Hours', value: 28800 },
    { name: '24 Hours', value: defaultAboutDuration },
    { name: '2 Days', value: 172800 },
    { name: '7 Days', value: 604800 },
];

type AboutInput = {
    text: string | null;
    emoji?: { content: string };
    ephemeral_duration_sec: number;
};

const emojiPattern = new RegExp('^\\p{RGI_Emoji}$', 'v');
const isoDateTime = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function durationSeconds(duration: unknown, expiresAt: unknown, now: number): number {
    if (duration !== 'custom') {
        if (typeof duration === 'number' && aboutDurationPresets.some(preset => preset.value === duration)) {
            return duration;
        }
        throw new Error('Choose a preset or Custom for the About duration.');
    }
    const match = typeof expiresAt === 'string' ? isoDateTime.exec(expiresAt) : null;
    const date = match && new Date(match[1] + 'T00:00:00Z');
    if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) {
        throw new Error('Enter a valid ISO 8601 About expiration date and time with a time zone.');
    }
    const seconds = Math.ceil((Date.parse(expiresAt as string) - now) / 1000);
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 2147483647) {
        throw new Error('Choose a valid future About expiration date and time within the protocol duration limit.');
    }
    return seconds;
}

export function buildAboutInput(text: unknown, emoji: unknown, duration: unknown, expiresAt: unknown, now = Date.now()): AboutInput {
    if (typeof text !== 'string' || !text.trim() || Array.from(text).length > 50 || /\p{Surrogate}/u.test(text)) {
        throw new Error('Enter About text with 1 to 50 Unicode code points.');
    }
    if (typeof emoji !== 'string' || (emoji !== '' && emojiPattern.exec(emoji)?.[0] !== emoji)) {
        throw new Error('Enter a single About emoji or leave the emoji field empty.');
    }
    return {
        text,
        ...(emoji && { emoji: { content: emoji } }),
        ephemeral_duration_sec: durationSeconds(duration, expiresAt, now),
    };
}

async function writeAbout(sock: Pick<WASocket, 'query'>, input: AboutInput): Promise<void> {
    // The proposed upstream API also writes the legacy status. About operations use only MEX.
    // https://github.com/WhiskeySockets/Baileys/pull/2798
    let reply: BinaryNode;
    try {
        reply = await sock.query({
            tag: 'iq',
            attrs: { to: S_WHATSAPP_NET, type: 'get', xmlns: 'w:mex' },
            content: [{
                tag: 'query',
                attrs: { query_id: '9152604461510864' },
                content: Buffer.from(JSON.stringify({ variables: { input } }), 'utf8'),
            }],
        });
    } catch {
        throw new Error('WhatsApp rejected the About request or the connection failed. Check the linked session and try again.');
    }
    if (reply?.attrs.type === 'error' || (reply && getBinaryNodeChild(reply, 'error'))) {
        throw new Error('WhatsApp rejected the About request. Check the note and duration.');
    }
    if (reply?.attrs.type !== 'result') {
        throw new Error('WhatsApp did not acknowledge the About request. Check the linked session and try again.');
    }
    const content = getBinaryNodeChild(reply, 'result')?.content;
    let response: { errors?: unknown; data?: { xwa2_update_text_status?: { result?: unknown } } } | undefined;
    if (typeof content === 'string' || content instanceof Uint8Array) {
        try {
            response = JSON.parse(typeof content === 'string' ? content : Buffer.from(content).toString('utf8'));
        } catch {
            // The same error below covers missing, malformed and unfamiliar replies.
        }
    }
    if ((response?.errors && (!Array.isArray(response.errors) || response.errors.length > 0)) ||
        response?.data?.xwa2_update_text_status?.result === false) {
        throw new Error('WhatsApp rejected the About request. Check the note and duration.');
    }
    // Some successful WhatsApp responses acknowledge the IQ request without returning
    // xwa2_update_text_status.result. The IQ result above is the protocol-level ACK;
    // only explicit GraphQL errors or result:false should be treated as a rejection.

}

export async function updateAbout(sock: Pick<WASocket, 'query'>, input: AboutInput) {
    await writeAbout(sock, input);
    return {
        success: true,
        text: input.text,
        emoji: input.emoji?.content ?? null,
        durationSeconds: input.ephemeral_duration_sec,
    };
}

export async function clearAbout(sock: Pick<WASocket, 'query'>) {
    await writeAbout(sock, { text: null, ephemeral_duration_sec: 0 });
    return { success: true };
}

const textStatusProtocol: USyncQuery['protocols'][number] = {
    name: 'text_status',
    getQueryElement: () => ({ tag: 'text_status', attrs: {} }),
    getUserElement: () => null,
    parser: node => node,
};

export async function getAbout(sock: Pick<WASocket, 'user' | 'executeUSyncQuery'>) {
    const jid = jidNormalizedUser(sock.user?.id);
    if (!jid) throw new Error('The linked WhatsApp account is unavailable. Check the session and try again.');

    const query = new USyncQuery().withUser(new USyncUser().withId(jid));
    query.protocols.push(textStatusProtocol);
    let result: Awaited<ReturnType<WASocket['executeUSyncQuery']>>;
    try {
        result = await sock.executeUSyncQuery(query);
    } catch {
        throw new Error('WhatsApp could not read About. Check the linked session and whether it supports About.');
    }
    const ownJids = new Set([jid, jidNormalizedUser(sock.user?.lid)].filter(Boolean));
    const status = result?.list.find(entry => ownJids.has(jidNormalizedUser(entry.id)))?.text_status as BinaryNode | undefined;
    if (!status || getBinaryNodeChild(status, 'error')) {
        throw new Error('WhatsApp did not return About data for this account. About read may be unavailable.');
    }
    const text = status.attrs.text || null;
    const emoji = getBinaryNodeChild(status, 'emoji')?.attrs.content || null;
    const duration = Number(status.attrs.ephemeral_duration_sec);
    const updated = Number(status.attrs.last_update_time);
    const durationSeconds = Number.isSafeInteger(duration) && duration > 0 ? duration : null;
    const expiry = new Date((updated + durationSeconds) * 1000);
    const expiresAt = durationSeconds && Number.isSafeInteger(updated) && updated > 0 &&
        Number.isFinite(expiry.getTime()) ? expiry.toISOString() : null;

    return { text, emoji, durationSeconds, expiresAt };
}
