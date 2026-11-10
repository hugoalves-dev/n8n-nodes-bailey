export function getIdleTimeoutMs(seconds: number | undefined): number | undefined {
	if (seconds === 0) return undefined;
	return (seconds ?? 30) * 1000;
}

export function normalizePhoneNumber(phoneNumber: string): string {
	const normalized = phoneNumber.replace(/[\s()+-]/g, '');
	if (!/^\d{7,15}$/.test(normalized)) {
		throw new Error('Enter a valid phone number with country code (7–15 digits).');
	}
	return normalized;
}

export function validateProxyUrl(proxyUrl: string | undefined): string | undefined {
	if (!proxyUrl?.trim()) return undefined;
	try {
		const parsed = new URL(proxyUrl);
		if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error();
		return parsed.toString();
	} catch {
		throw new Error('Proxy URL must use HTTP or HTTPS and include a valid host.');
	}
}
