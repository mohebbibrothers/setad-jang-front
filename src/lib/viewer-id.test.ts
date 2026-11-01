import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetViewerIdForTests, getViewerId } from './viewer-id';

/**
 * viewer-id — شناسهٔ پایدارِ مرورگر برای dedupe بازدید.
 *   • بار اول ساخته و ذخیره می‌شود؛ بارهای بعد همان است.
 *   • داخل mount دوباره ساخته نمی‌شود (مقاومت در برابر StrictMode).
 *   • اگر localStorage مسدود باشد، شناسهٔ نشست برمی‌گرداند (بدونِ throw).
 *   • در SSR (بدونِ window) رشتهٔ خالی می‌دهد.
 */

const STORE_KEY = 'besat.viewer_id';

describe('getViewerId', () => {
  beforeEach(() => {
    __resetViewerIdForTests();
    window.localStorage.clear();
  });
  afterEach(() => {
    __resetViewerIdForTests();
    vi.restoreAllMocks();
  });

  it('بار اول یک شناسه می‌سازد و ذخیره می‌کند', () => {
    const id = getViewerId();
    expect(id.length).toBeGreaterThanOrEqual(8);
    expect(window.localStorage.getItem(STORE_KEY)).toBe(id);
  });

  it('بار دوم همان شناسه را برمی‌گرداند (پایدار)', () => {
    const first = getViewerId();
    __resetViewerIdForTests(); // شبیه‌سازیِ mount/refresh تازه
    expect(getViewerId()).toBe(first);
  });

  it('مقدارِ ذخیره‌شدهٔ معتبر را دوباره استفاده می‌کند', () => {
    window.localStorage.setItem(STORE_KEY, 'existing-client-id-123');
    expect(getViewerId()).toBe('existing-client-id-123');
  });

  it('مقدارِ نامعتبر (خیلی کوتاه) را دور می‌ریزد و تازه می‌سازد', () => {
    window.localStorage.setItem(STORE_KEY, 'abc');
    const id = getViewerId();
    expect(id).not.toBe('abc');
    expect(id.length).toBeGreaterThanOrEqual(8);
  });

  it('اگر localStorage مسدود باشد، شناسهٔ نشست می‌دهد (بدونِ throw)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const id = getViewerId();
    expect(id.length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});
