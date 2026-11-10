import { validateProxyUrl } from '../../../nodes/Bailey/transport/TransportPolicy';

describe('validateProxyUrl', () => {
	it('accepts empty optional proxy settings', () => {
		expect(validateProxyUrl('')).toBeUndefined();
	});

	it('accepts HTTP and HTTPS URLs', () => {
		expect(validateProxyUrl('http://proxy.example:3128')).toBe('http://proxy.example:3128/');
	});

	it('rejects malformed or unsupported proxy URLs without echoing credentials', () => {
		expect(() => validateProxyUrl('socks5://user:secret@proxy')).toThrow('Proxy URL must use HTTP or HTTPS');
		expect(() => validateProxyUrl('http://user:secret@%')).toThrow('Proxy URL must use HTTP or HTTPS');
	});
});
