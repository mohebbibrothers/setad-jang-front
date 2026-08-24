import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { SwapTransition } from './SwapTransition';

/**
 * قراردادِ کراس‌فید:
 *  ۱) بدون تغییر کلید، هیچ لایه‌ی خروجی نیست (تایپ/رندرهای میانی فلش
 *     نمی‌زنند)؛ ۲) با تغییر کلید، نسخه‌ی قدیمی ۱۷۰ms بیم‌تعامل محو و
 *     جدیدی بلافاصله می‌آید؛ ۳) لایه‌ی خروجی absolute است (چیدمان را
 *     نمی‌سازد) و از دیدِ اسکرین‌ریدر/کوئری/تعامل پنهان است؛ ۴) حذفِ آن
 *     تایمری و تضمینی است — الگوی usePresence.
 */

function openButton(label = 'ورود') {
  return <button type="button">{label}</button>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SwapTransition — کراس‌فیدِ تمیزِ تعویض محتوا', () => {
  it('رندرِ اولیه: فقط نسخه‌ی جاری، بدون لایه‌ی خروجی', () => {
    const { container } = render(<SwapTransition swapKey="a">{openButton('ورود')}</SwapTransition>);
    expect(screen.getByRole('button', { name: 'ورود' })).toBeTruthy();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it('به‌روزرسانیِ محتوا با کلیدِ ثابت: هیچ تعویضی ساخته نمی‌شود', () => {
    const { rerender, container } = render(
      <SwapTransition swapKey="a">{openButton('ورود')}</SwapTransition>,
    );
    rerender(<SwapTransition swapKey="a">{openButton('ورود — نسخه‌ی تازه')}</SwapTransition>);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'ورود — نسخه‌ی تازه' })).toBeTruthy();
  });

  it('تغییر کلید: نسخه‌ی قدیمی غیرتعاملی‌محو و جدیدی وارد می‌شود — بدون فریمِ خالی', () => {
    const { rerender, container } = render(
      <SwapTransition swapKey="a">{openButton('قدیمی')}</SwapTransition>,
    );

    rerender(<SwapTransition swapKey="b">{openButton('جدیدی')}</SwapTransition>);

    // هر دو در DOM‌اند (پنجره‌ی کراس‌فید)…
    const hiddenLayer = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(hiddenLayer).toBeTruthy();
    // …ولی قدیمی غیرفعال/پنهان/کلیپ-تعاملی است و absolute (بدون اثر چیدمانی)
    expect(hiddenLayer.textContent).toContain('قدیمی');
    expect(hiddenLayer.hasAttribute('inert')).toBe(true);
    expect(hiddenLayer.className).toContain('pointer-events-none');
    expect(hiddenLayer.className).toContain('absolute');
    expect(hiddenLayer.className).toContain('auth-view-exit');

    // از دیدِ کوئری‌ها فقط نسخه‌ی جدید معتبر است (با وجود نسخه دوم در DOM)
    expect(screen.queryByRole('button', { name: 'قدیمی' })).toBeNull();
    expect(screen.getByRole('button', { name: 'جدیدی' })).toBeTruthy();

    // و با گذرِ زمانِ تضمینی، لایه‌ی خروجی حذف می‌شود
    act(() => {
      vi.advanceTimersByTime(170);
    });
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'جدیدی' })).toBeTruthy();
  });

  it('تعویض‌هایِ پشت‌سرهمِ تند: فقط آخرین خروجی زنده می‌ماند و همه حذف می‌شوند', () => {
    const { rerender, container } = render(
      <SwapTransition swapKey="a">{openButton('یک')}</SwapTransition>,
    );
    rerender(<SwapTransition swapKey="b">{openButton('دو')}</SwapTransition>);
    rerender(<SwapTransition swapKey="c">{openButton('سه')}</SwapTransition>);

    // فقط یک لایه‌ی خروجی (آخرین تعویض) — نه زنجیره‌ای از لایه‌ها
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'سه' })).toBeTruthy();
  });

  it('unmount میانِ پنجره: تایمرِ حذف عقب نمی‌ماند', () => {
    const { rerender, unmount } = render(
      <SwapTransition swapKey="a">{openButton()}</SwapTransition>,
    );
    rerender(<SwapTransition swapKey="b">{openButton('جدید')}</SwapTransition>);
    unmount();
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
  });
});
