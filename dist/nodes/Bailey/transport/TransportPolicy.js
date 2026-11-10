"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIdleTimeoutMs = getIdleTimeoutMs;
exports.normalizePhoneNumber = normalizePhoneNumber;
exports.validateProxyUrl = validateProxyUrl;
function getIdleTimeoutMs(seconds) {
    if (seconds === 0)
        return undefined;
    return (seconds ?? 30) * 1000;
}
function normalizePhoneNumber(phoneNumber) {
    const normalized = phoneNumber.replace(/[\s()+-]/g, '');
    if (!/^\d{7,15}$/.test(normalized)) {
        throw new Error('Enter a valid phone number with country code (7–15 digits).');
    }
    return normalized;
}
function validateProxyUrl(proxyUrl) {
    if (!proxyUrl?.trim())
        return undefined;
    try {
        const parsed = new URL(proxyUrl);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname)
            throw new Error();
        return parsed.toString();
    }
    catch {
        throw new Error('Proxy URL must use HTTP or HTTPS and include a valid host.');
    }
}
//# sourceMappingURL=TransportPolicy.js.map