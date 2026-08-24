import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * تست قرارداد احراز هویت — قفل روی دقیق‌ترین نقطه‌ی شکست ممکن:
 *
 *   بک‌اند: data = { user, tokens: { access, refresh } }   (تودرتو!)
 *
 * اگر فرانت tokens.access را از ریشه‌ی data بخواند (data.access)،
 * ورود «موفق» به‌نظر می‌رسد ولی هیچ توکنی ذخیره نمی‌شود و کاربر
 * عملاً هرگز وارد نمی‌شود. این تست‌ها شیوه‌ی خواندن را قفل می‌کنند.
 */

const apiFetchMock = vi.fn();
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return { ...actual, apiFetch: (path: string, init?: unknown) => apiFetchMock(path, init) };
});

import {
  loginPassword,
  loginOtpVerify,
  signupVerify,
  forgotPasswordConfirm,
  OTP_CODE_LENGTH,
} from './auth';
import { getAccessToken, getRefreshToken, clearTokens, hasSession, setTokens } from './auth-tokens';

const BACKEND_SUCCESS = {
  user: { id: 1, email: 'user@example.com', full_name: 'کاربر نمونه' },
  tokens: { access: 'ACCESS-1', refresh: 'REFRESH-1' },
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearTokens();
  apiFetchMock.mockReset();
  apiFetchMock.mockResolvedValue(BACKEND_SUCCESS);
});

describe('persistFromResponse — قرارداد data.tokens تو در تو', () => {
  it('loginPassword جفت توکن را از data.tokens می‌خواند و ذخیره می‌کند', async () => {
    const res = await loginPassword({ identifier: '09120000000', password: 'secret-123' });
    expect(res.user.full_name).toBe('کاربر نمونه');
    expect(getAccessToken()).toBe('ACCESS-1');
    expect(getRefreshToken()).toBe('REFRESH-1');
    expect(hasSession()).toBe(true);
  });

  it('loginOtpVerify نیز همان قرارداد را می‌شناسد', async () => {
    await loginOtpVerify({ identifier: 'user@example.com', code: '12345' });
    expect(getAccessToken()).toBe('ACCESS-1');
  });

  it('signupVerify بدون نام‌خانوادگی اختیاری خالی هم persist می‌کند و persist=false را محترم می‌شمارد', async () => {
    await signupVerify({
      identifier: 'user@example.com',
      code: '12345',
      password: 'secret-123',
      persist: false,
    });
    // persist=false → فقط حافظه‌ی تب (sessionStorage)
    expect(sessionStorage.getItem('sj.auth.access')).toBe('ACCESS-1');
    expect(localStorage.getItem('sj.auth.access')).toBeNull();
  });

  it('بدنه‌ی درخواست login/password دقیقاً {identifier,password} است (kind سمت سرور تشخیص داده می‌شود)', async () => {
    await loginPassword({ identifier: ' 09120000000 ', password: 'پ' });
    const [, init] = apiFetchMock.mock.calls[0];
    expect((init as { body: string }).body).toBe(
      JSON.stringify({ identifier: ' 09120000000 ', password: 'پ' }),
    );
    expect((init as { skipAuth?: boolean }).skipAuth).toBe(true);
  });

  it('بدنه‌ی verify فقط فیلدهای قراردادی بک‌اند را می‌فرستد (persist نشت نمی‌کند)', async () => {
    await signupVerify({
      identifier: 'user@example.com',
      code: '12345',
      password: 'p',
      first_name: 'علی',
      persist: true,
    });
    const [, init] = apiFetchMock.mock.calls[0];
    expect(JSON.parse((init as { body: string }).body)).toEqual({
      identifier: 'user@example.com',
      code: '12345',
      password: 'p',
      first_name: 'علی',
    });
  });
});

describe('forgotPasswordConfirm — بدون صدور توکن', () => {
  it('به endpoint تأیید با new_password می‌زند و ذخیره‌ای انجام نمی‌دهد', async () => {
    apiFetchMock.mockResolvedValue({ detail: 'ok' });
    await forgotPasswordConfirm({
      identifier: '09120000000',
      code: '12345',
      new_password: 'newSecret-1',
    });
    const [path, init] = apiFetchMock.mock.calls[0];
    expect(path).toBe('/auth/password/forgot/confirm/');
    expect(JSON.parse((init as { body: string }).body)).toEqual({
      identifier: '09120000000',
      code: '12345',
      new_password: 'newSecret-1',
    });
    expect(hasSession()).toBe(false);
  });
});

describe('ثابت طول کد', () => {
  it('OTP_CODE_LENGTH با بک‌اند یکی است (۵)', () => {
    expect(OTP_CODE_LENGTH).toBe(5);
  });
});

/* ── پوشش کامل بقیه‌ی کلاینت ───────────────────────────────────────────── */

import {
  signupRequest,
  loginOtpRequest,
  forgotPasswordRequest,
  identifierAddRequest,
  identifierAddVerify,
  identifierMakePrimary,
  getMe,
  updateMe,
  getProfile,
  updateProfile,
  changePassword,
  listSessions,
  revokeSession,
  logout,
} from './auth';

function lastCall(): { path: string; init: Record<string, unknown> } {
  const [path, init] = apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1];
  return { path, init: init as Record<string, unknown> };
}

describe('endpoint های درخواست کد — بدنه و مسیر دقیق', () => {
  it.each([
    ['signup', () => signupRequest('09120000000'), '/auth/signup/request/'],
    ['login-otp', () => loginOtpRequest('user@example.com'), '/auth/login/otp/request/'],
    ['forgot', () => forgotPasswordRequest('09120000000'), '/auth/password/forgot/request/'],
    ['id-add', () => identifierAddRequest('new@example.com'), '/auth/identifiers/add/request/'],
  ])('%s → POST فقط با identifier و skipAuth متناسب', async (_name, call, expectedPath) => {
    apiFetchMock.mockResolvedValue(null);
    await call();
    const { path, init } = lastCall();
    expect(path).toBe(expectedPath);
    expect(JSON.parse(init.body as string)).toEqual({
      identifier: expect.any(String),
    });
  });

  it('identifierAddRequest احرازشده است (skipAuth ندارد) ولی درخواست‌های عمومی skipAuth دارند', async () => {
    apiFetchMock.mockResolvedValue(null);
    await identifierAddRequest('new@example.com');
    expect(lastCall().init.skipAuth).toBeUndefined();
    await loginOtpRequest('09120000000');
    expect(lastCall().init.skipAuth).toBe(true);
  });

  it('identifierAddVerify و identifierMakePrimary بدنه‌ی قراردادی می‌فرستند', async () => {
    apiFetchMock.mockResolvedValue({});
    await identifierAddVerify({ identifier: 'x@y.com', code: '12345' });
    expect(lastCall().path).toBe('/auth/identifiers/add/verify/');
    expect(JSON.parse(lastCall().init.body as string)).toEqual({
      identifier: 'x@y.com',
      code: '12345',
    });
    await identifierMakePrimary('09120000000');
    expect(lastCall().path).toBe('/auth/identifiers/make-primary/');
  });
});

describe('me / profile / password', () => {
  it('getMe و getProfile ساده‌اند و updateMe پچ JSON می‌فرستد', async () => {
    apiFetchMock.mockResolvedValue({ id: 1 });
    await getMe();
    expect(lastCall().path).toBe('/auth/me/');
    await getProfile();
    expect(lastCall().path).toBe('/auth/profile/');
    await updateMe({ first_name: 'علی' });
    const { path, init } = lastCall();
    expect(path).toBe('/auth/me/');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ first_name: 'علی' });
  });

  it('updateProfile با JSON معمولی', async () => {
    apiFetchMock.mockResolvedValue({});
    await updateProfile({ city: 'تهران' });
    const { init } = lastCall();
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ city: 'تهران' });
  });

  it('updateProfile با FormData همان را دست‌نخورده می‌فرستد (boundary مرورگر)', async () => {
    apiFetchMock.mockResolvedValue({});
    const fd = new FormData();
    fd.append('avatar', 'blob-stub');
    await updateProfile(fd);
    expect(lastCall().init.body).toBe(fd);
  });

  it('changePassword بدنه‌ی old/new می‌فرستد', async () => {
    apiFetchMock.mockResolvedValue({});
    await changePassword({ old_password: 'a1', new_password: 'b2' });
    expect(lastCall().path).toBe('/auth/password/change/');
    expect(JSON.parse(lastCall().init.body as string)).toEqual({
      old_password: 'a1',
      new_password: 'b2',
    });
  });
});

describe('sessions', () => {
  it('هر دو شکل لیست (آرایه‌ی خام یا صفحه‌بندی results) پشتیبانی می‌شود', async () => {
    apiFetchMock.mockResolvedValueOnce([{ id: 1 }]);
    expect(await listSessions()).toEqual([{ id: 1 }]);
    apiFetchMock.mockResolvedValueOnce({ results: [{ id: 2 }, { id: 3 }] });
    expect(await listSessions()).toEqual([{ id: 2 }, { id: 3 }]);
    apiFetchMock.mockResolvedValueOnce({});
    expect(await listSessions()).toEqual([]);
  });

  it('revokeSession مسیر revoke را با id می‌زند', async () => {
    apiFetchMock.mockResolvedValue({});
    await revokeSession(42);
    expect(lastCall().path).toBe('/auth/sessions/42/revoke/');
    expect(lastCall().init.method).toBe('POST');
  });
});

describe('logout — بهترین‌تلاشِ دوطرفه', () => {
  it('با refresh موجود: لغو سمت سرور + پاک‌سازی محلی', async () => {
    apiFetchMock.mockResolvedValue({});
    setTokensForTest();
    await logout();
    const { path, init } = lastCall();
    expect(path).toBe('/auth/logout/');
    expect(JSON.parse(init.body as string)).toEqual({ refresh: 'REFRESH-1' });
    expect(init.skipRefresh).toBe(true);
    expect(hasSession()).toBe(false);
  });

  it('اگر سرور خطا دهد باز هم سشن محلی پاک می‌شود (offline-safe)', async () => {
    apiFetchMock.mockRejectedValue(new Error('network down'));
    setTokensForTest();
    await expect(logout()).resolves.toBeUndefined();
    expect(hasSession()).toBe(false);
  });

  it('بدون refresh هیچ درخواستی نمی‌رود ولی پاک‌سازی انجام می‌شود', async () => {
    apiFetchMock.mockClear();
    await logout();
    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(hasSession()).toBe(false);
  });
});

function setTokensForTest() {
  setTokens({ access: 'ACCESS-1', refresh: 'REFRESH-1', persist: true });
  expect(hasSession()).toBe(true);
}
