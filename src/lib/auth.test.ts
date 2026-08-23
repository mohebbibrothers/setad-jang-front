import { afterEach, describe, expect, it, vi } from 'vitest';
import { identifierMakePrimary, loginPassword, signupRequest } from './auth';

function response(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('authentication wire adapters', () => {
  it('accepts the backend nested tokens response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      success: true,
      status_code: 200,
      message: 'ورود موفق',
      data: {
        tokens: { access: 'access-token', refresh: 'refresh-token' },
        user: { id: 1, email: 'user@example.com', full_name: 'کاربر', role: 'user', is_email_verified: true, date_joined: '2026-01-01T00:00:00Z', profile: { phone_number: null } },
      },
    })));

    const result = await loginPassword({ identifier: 'user@example.com', password: 'password' });
    expect(result.tokens).toEqual({ access: 'access-token', refresh: 'refresh-token' });
    expect(result.user.id).toBe(1);
  });

  it('retains the envelope message for empty OTP responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ success: true, status_code: 200, message: 'کد ارسال شد.', data: null })));
    await expect(signupRequest('09120000000')).resolves.toEqual({ identifier: '09120000000', message: 'کد ارسال شد.' });
  });

  it('sends identifier_kind for make-primary', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ success: true, status_code: 200, message: 'ok', data: { id: 1 } }));
    vi.stubGlobal('fetch', fetchMock);
    await identifierMakePrimary('phone');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ identifier_kind: 'phone' });
  });
});
