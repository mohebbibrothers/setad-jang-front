import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAuthFlowDraft,
  patchAuthFlow,
  resetAuthFlow,
  resetAllAuthFlows,
  resetAuthFlowOtp,
  secondsUntil,
  subscribeAuthFlow,
} from './auth-flow-session';

/**
 * قرارداد حافظه‌ی سشنِ فلوها — همان پایه‌ای که باگ «برگشت از اول» را
 * ریشه‌کن کرد؛ این قرارداد نباید بی‌صدا بشکند.
 */
beforeEach(() => {
  resetAllAuthFlows();
});

describe('pre-drafts — شروع همیشه تمیز', () => {
  it('سه فلو در مرحله‌ی شناسه، بدون کد، با روش پیش‌فرض رمز', () => {
    for (const key of ['login', 'signup', 'forgot'] as const) {
      const d = getAuthFlowDraft(key);
      expect(d.step).toBe('identifier');
      expect(d.code).toBe('');
      expect(d.password).toBe('');
      expect(d.resendAt).toBeNull();
      expect(d.expiresAt).toBeNull();
      expect(d.wrongAttempts).toBe(0);
      expect(d.sendError).toBeNull();
    }
    expect(getAuthFlowDraft('login').method).toBe('password');
  });
});

describe('patchAuthFlow', () => {
  it('immutable است: مرجع قبلی حفظ می‌شود و listener بیدار می‌شود', () => {
    const before = getAuthFlowDraft('signup');
    const listener = vi.fn();
    const unsubscribe = subscribeAuthFlow(listener);

    patchAuthFlow('signup', { step: 'code', code: '123' });

    const after = getAuthFlowDraft('signup');
    expect(after).not.toBe(before);
    expect(after.step).toBe('code');
    expect(after.code).toBe('123');
    expect(before.step).toBe('identifier'); // snapshot قدیمی دست‌نخورده
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    patchAuthFlow('signup', { code: '9' });
    expect(listener).toHaveBeenCalledTimes(1); // بدون leak
  });

  it('فیلدهای پیش‌فرضِ نامشخص دست‌نخورده می‌مانند (ادغام کمّی)', () => {
    patchAuthFlow('login', { method: 'otp' });
    patchAuthFlow('login', { step: 'code' });
    const d = getAuthFlowDraft('login');
    expect(d.method).toBe('otp');
    expect(d.step).toBe('code');
  });
});

describe('ریست‌ها', () => {
  it('resetAuthFlowOtp فقط فیلدهای OTP را نو می‌کند، پیش‌نویس متن حفظ است', () => {
    patchAuthFlow('signup', {
      step: 'code',
      password: 'secret-123',
      firstName: 'علی',
      resendAt: Date.now() + 60_000,
      expiresAt: Date.now() + 300_000,
      wrongAttempts: 3,
    });
    resetAuthFlowOtp('signup');
    const d = getAuthFlowDraft('signup');
    expect(d.resendAt).toBeNull();
    expect(d.expiresAt).toBeNull();
    expect(d.wrongAttempts).toBe(0);
    expect(d.password).toBe('secret-123'); // پیش‌نویس کاربر حفظ شد
    expect(d.firstName).toBe('علی');
    expect(d.step).toBe('code');
  });

  it('resetAuthFlow و resetAllAuthFlows کامل تمیز می‌کنند', () => {
    patchAuthFlow('forgot', { step: 'code', code: '12345' });
    resetAuthFlow('forgot');
    expect(getAuthFlowDraft('forgot').step).toBe('identifier');
    resetAllAuthFlows();
    expect(getAuthFlowDraft('login').method).toBe('password');
  });
});

describe('secondsUntil — ریاضیات ددلاین مطلق', () => {
  it('سقف به ثانیه‌ی بالاتر گرد می‌شود تا شمارش «زود تمام» نشود', () => {
    const now = 1_000_000;
    expect(secondsUntil(now + 61_000, now)).toBe(61);
    expect(secondsUntil(now + 500, now)).toBe(1);
    expect(secondsUntil(now + 1, now)).toBe(1);
  });

  it('گذشته یا null → صفر', () => {
    const now = 1_000_000;
    expect(secondsUntil(now - 1, now)).toBe(0);
    expect(secondsUntil(null, now)).toBe(0);
  });
});
