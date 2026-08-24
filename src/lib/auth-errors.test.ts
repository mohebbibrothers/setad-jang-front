import { describe, expect, it } from 'vitest';
import { ApiError } from './api';
import { coerceAuthError, parseWaitSeconds } from './auth-errors';

/** قفل روی قالب‌های دقیق پیامِ بک‌اند (core/exceptions.py + auth services). */
describe('parseWaitSeconds', () => {
  it('قالب Throttled: «… لطفاً N ثانیه صبر کنید.»', () => {
    expect(parseWaitSeconds('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً 42 ثانیه صبر کنید.')).toBe(
      42,
    );
  });

  it('قالب Cooldown: «لطفاً N ثانیه دیگر تلاش کنید.»', () => {
    expect(parseWaitSeconds('لطفاً 7 ثانیه دیگر تلاش کنید.')).toBe(7);
  });

  it.each(['خطای عمومی', 'باید کمی صبر کنید.', 'ثانیه', 'لطفاً 0 ثانیه صبر کنید.'])(
    'بدون رقم معتبر → null: %s',
    (msg) => expect(parseWaitSeconds(msg)).toBeNull(),
  );
});

describe('coerceAuthError', () => {
  it('429 → kind=cooldown و waitSeconds از خود پیام', () => {
    const model = coerceAuthError(
      new ApiError('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً 55 ثانیه صبر کنید.', 429),
    );
    expect(model.kind).toBe('cooldown');
    expect(model.waitSeconds).toBe(55);
  });

  it('503 → kind=delivery', () => {
    const model = coerceAuthError(
      new ApiError('در ارسال کد خطایی رخ داد. لطفاً چند دقیقه دیگر تلاش کنید.', 503),
    );
    expect(model.kind).toBe('delivery');
  });

  it('401 → kind=credential با پیام اصلی بک‌اند', () => {
    const model = coerceAuthError(new ApiError('شناسه یا رمز عبور اشتباه است.', 401));
    expect(model.kind).toBe('credential');
    expect(model.message).toBe('شناسه یا رمز عبور اشتباه است.');
  });

  it('400 با non_field_errors → همان پیام (مثل «این شناسه قبلاً ثبت شده است.»)', () => {
    const model = coerceAuthError(
      new ApiError('داده‌های ارسالی معتبر نیستند.', 400, {
        non_field_errors: ['این شناسه قبلاً ثبت شده است.'],
      }),
    );
    expect(model.kind).toBe('validation');
    expect(model.message).toBe('این شناسه قبلاً ثبت شده است.');
  });

  it('400 با خطای فیلد → به فیلد مربوط نسبت داده می‌شود', () => {
    const model = coerceAuthError(
      new ApiError('داده‌های ارسالی معتبر نیستند.', 400, {
        password: ['رمز عبور باید حداقل ۸ کاراکتر باشد.'],
      }),
    );
    expect(model.fieldErrors.password).toBe('رمز عبور باید حداقل ۸ کاراکتر باشد.');
    expect(model.message).toBe('رمز عبور باید حداقل ۸ کاراکتر باشد.');
  });

  it('status=0 → kind=network با پیام آفلاین', () => {
    const model = coerceAuthError(new ApiError('خطای شبکه', 0));
    expect(model.kind).toBe('network');
    expect(model.message).toContain('اتصال به سرور برقرار نشد');
  });

  it('خطای ناشناخته → پیام fallback انسانی', () => {
    expect(coerceAuthError(new TypeError('boom')).kind).toBe('unknown');
    expect(coerceAuthError(null).message).toBe('خطایی رخ داد. لطفاً دوباره تلاش کنید.');
  });
});
