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
import { getAccessToken, getRefreshToken, clearTokens, hasSession } from './auth-tokens';

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
