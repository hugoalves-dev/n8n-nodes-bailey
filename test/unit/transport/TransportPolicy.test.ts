import { getIdleTimeoutMs, normalizePhoneNumber } from '../../../nodes/Bailey/transport/TransportPolicy';

describe('getIdleTimeoutMs', () => {
	it('disables idle cleanup when the configured value is zero', () => {
		expect(getIdleTimeoutMs(0)).toBeUndefined();
	});

	it('uses the configured timeout in milliseconds', () => {
		expect(getIdleTimeoutMs(12)).toBe(12_000);
	});

	it('uses the default when the value is omitted', () => {
		expect(getIdleTimeoutMs(undefined)).toBe(30_000);
	});
});

describe('normalizePhoneNumber', () => {
	it('removes presentation characters from an international number', () => {
		expect(normalizePhoneNumber('+1 (202) 555-0123')).toBe('12025550123');
	});

	it('rejects numbers outside Baileys accepted length', () => {
		expect(() => normalizePhoneNumber('1234')).toThrow('Enter a valid phone number');
	});
});
