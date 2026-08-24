import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePresence } from './use-presence';

/**
 * قرارداد usePresence — قلبِ تپنده‌ی رفع باگ «قفل‌شدن صفحه پس از بستن
 * مودال»: تخلیه‌ی لایه باید «قطعی و تضمین‌شده» باشد، نه وابسته به
 * رویداد انیمیشن یا callback کتابخانه.
 */

function hook(initialOpen: boolean, exitMs = 240) {
  return renderHook(({ open, ms }) => usePresence(open, ms), {
    initialProps: { open: initialOpen, ms: exitMs },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePresence — چرخه‌حیات قطعی لایه‌های شناور', () => {
  it('بسته‌ی اولیه: چیزی رندر نمی‌شود و فاز خروجی نیست', () => {
    const { result } = hook(false);
    expect(result.current.rendered).toBe(false);
    expect(result.current.closing).toBe(false);
  });

  it('بازشدن: در همان کامیت رندر می‌شود (بدون فلیکِ یک‌فریمیِ منتظرِ effect)', () => {
    const { result, rerender } = hook(false);
    rerender({ open: true, ms: 240 });
    expect(result.current.rendered).toBe(true);
    expect(result.current.closing).toBe(false);
  });

  it('بستن: تا پایانِ exitMs رندر می‌ماند (فاز closing) و بعد قطعاً تخلیه می‌شود', () => {
    const { result, rerender } = hook(true);
    expect(result.current.rendered).toBe(true);

    rerender({ open: false, ms: 240 });
    // فاز خروج: هنوز در DOM است تا انیمیشنِ خروج بازی کند…
    expect(result.current.rendered).toBe(true);
    expect(result.current.closing).toBe(true);

    act(() => vi.advanceTimersByTime(239));
    expect(result.current.rendered).toBe(true);

    // …اما یک میلی‌ثانیه پس از ددلاین، دیگر هیچ اثری نیست — تضمینی.
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.rendered).toBe(false);
    expect(result.current.closing).toBe(false);
  });

  it('تخلیه حتی بدون هیچ رویدادِ انیمیشنی رخ می‌دهد (تکیه‌گاه فقط تایمر است)', () => {
    const { result, rerender } = hook(true, 120);
    rerender({ open: false, ms: 120 });
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.rendered).toBe(false);
  });

  it('چرخه‌های باز/بسته‌ی پشت‌سرهم: هیچ باقی‌مانده‌ای جمع نمی‌شود', () => {
    const { result, rerender } = hook(true, 200);
    for (let i = 0; i < 3; i += 1) {
      rerender({ open: false, ms: 200 });
      expect(result.current.closing).toBe(true);
      act(() => vi.advanceTimersByTime(200));
      expect(result.current.rendered).toBe(false);

      rerender({ open: true, ms: 200 });
      expect(result.current.rendered).toBe(true);
      expect(result.current.closing).toBe(false);
    }
  });

  it('بازشدنِ میانِ فاز خروج: تایمرِ تخلیه لغو می‌شود — ناپدیدشدنِ دیرهنگام ممنوع', () => {
    const { result, rerender } = hook(true, 240);
    rerender({ open: false, ms: 240 });
    act(() => vi.advanceTimersByTime(120)); // وسط انیمیشنِ خروج

    rerender({ open: true, ms: 240 });
    expect(result.current.rendered).toBe(true);
    expect(result.current.closing).toBe(false);

    // اگر تایمرِ قبلی زنده مانده بود، این‌جا لایه را می‌کشت:
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.rendered).toBe(true);
  });

  it('بستنِ دوباره پس از بازشدنِ میانِ خروج، تایمرِ تازه‌ای می‌سازد که کار می‌کند', () => {
    const { result, rerender } = hook(true, 240);
    rerender({ open: false, ms: 240 });
    act(() => vi.advanceTimersByTime(100));
    rerender({ open: true, ms: 240 });
    rerender({ open: false, ms: 240 });
    expect(result.current.closing).toBe(true);
    act(() => vi.advanceTimersByTime(240));
    expect(result.current.rendered).toBe(false);
  });

  it('unmount میانِ فاز خروج: تایمر عقب نمی‌ماند و خطایی پرتاب نمی‌شود', () => {
    const { rerender, unmount } = hook(true, 240);
    rerender({ open: false, ms: 240 });
    unmount();
    // تایمر باید cleanup شده باشد؛ گذر زمان هیچ اثری ندارد
    act(() => vi.advanceTimersByTime(10_000));
  });

  it('exitMs=0 هم قطعی است (خروجِ بدون انیمیشن — reduced-motion)', () => {
    const { result, rerender } = hook(true, 0);
    rerender({ open: false, ms: 0 });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current.rendered).toBe(false);
  });
});
