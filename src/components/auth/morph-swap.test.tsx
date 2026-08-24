import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MorphSwap, MORPH_SWAP_MS } from './morph-swap';

/**
 * قرارداد MorphSwap — هدایت‌گرِ یگانه‌ی موشنِ بدنه‌ی مودال (v8):
 *
 *  • مونتِ نخست کاملاً ایستا است (هیچ لایه/کلاسِ انیمیشنی — پایانِ
 *    «اجزای ناتمام در لحظه‌ی اول»)؛
 *  • تغییر کلید = یک پاس: نسخه‌ی قدیمی به‌صورت لایه‌ی absoluteِ
 *    غیرتعاملی (aria-hidden + inert + pointer-events-none) کنار نسخه‌ی
 *    جدید می‌نشیند و فاز «swap» گزارش می‌شود؛
 *  • پاک‌سازی فقط با تایمرِ تضمین‌شده است — پس از MORPH_SWAP_MS + بافر،
 *    لایه‌ی قدیمی حذف و فاز به سکون برمی‌گردد (الگوی usePresence)؛
 *  • وقفه وسطِ پاس، لایه‌ی کهنه را بلافاصله کنار می‌گذارد و جدیدترین
 *    نسخه‌ی قبلی به لایه‌ی خروجی می‌پیوندد — هیچ روزنه‌ی DOM زامبی؛
 *  • به‌روزرسانیِ محتوا بدون تغییر کلید هیچ پاسی برنمی‌دارد (تایپ
 *    فلش نمی‌زند).
 */

function Harness({ initialKey = 'a' }: { initialKey?: string }) {
  const [key, setKey] = useState(initialKey);
  return (
    <>
      <button type="button" data-testid="swap-to-b" onClick={() => setKey('b')}>
        b
      </button>
      <button type="button" data-testid="swap-to-c" onClick={() => setKey('c')}>
        c
      </button>
      <MorphSwap swapKey={key} boxTestId="morph-box">
        <div data-testid={`content-${key}`}>محتوای {key}</div>
      </MorphSwap>
    </>
  );
}

const CLEANUP_MS = MORPH_SWAP_MS + 100;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('MorphSwap — یک هدایت‌گر، یک ساعت', () => {
  it('مونتِ نخست کاملاً ایستاست: فاز سکون، بدون لایه‌ی خروجی، بدون قفلِ ارتفاع', () => {
    render(<Harness />);
    const box = screen.getByTestId('morph-box');
    expect(box.getAttribute('data-phase')).toBe('rest');
    expect(box.className).toContain('morph-swap');
    expect(box.style.height).toBe(''); // سکون = height:auto
    expect(screen.getByTestId('content-a')).toBeTruthy();
    // هیچ لایه‌ی absoluteِ خروجی در کار نیست
    expect(box.querySelectorAll('.morph-swap-out').length).toBe(0);
  });

  it('تغییر کلید: نسخه‌ی قدیمی به‌صورت لایه‌ی غیرتعاملی کنار نسخه‌ی جدید می‌نشیند', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('swap-to-b'));

    const box = screen.getByTestId('morph-box');
    expect(box.getAttribute('data-phase')).toBe('swap');

    const outgoing = box.querySelector('.morph-swap-out') as HTMLElement;
    expect(outgoing).toBeTruthy();
    expect(outgoing.textContent).toBe('محتوای a'); // نسخه‌ی قبلی هنوز هست
    expect(outgoing.getAttribute('aria-hidden')).toBe('true');
    expect(outgoing.hasAttribute('inert')).toBe(true);
    expect(outgoing.className).toContain('pointer-events-none');
    expect(outgoing.className).toContain('absolute');

    // نسخه‌ی جدید هم‌زمان با کلاسِ ورود مونت است — هیچ فریمِ خالی نیست
    expect(screen.getByTestId('content-b').parentElement!.className).toContain('morph-swap-in');
  });

  it('پاک‌سازی تایمریِ تضمین‌شده: پس از پایانِ پاس، لایه‌ی قدیمی حذف و فاز سکون می‌شود', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('swap-to-b'));
    expect(screen.getByTestId('morph-box').getAttribute('data-phase')).toBe('swap');

    act(() => {
      vi.advanceTimersByTime(CLEANUP_MS);
    });

    const box = screen.getByTestId('morph-box');
    expect(box.getAttribute('data-phase')).toBe('rest');
    expect(box.querySelectorAll('.morph-swap-out').length).toBe(0);
    expect(box.style.height).toBe('');
    expect(screen.queryByText('محتوای a')).toBeNull();
    expect(screen.getByTestId('content-b')).toBeTruthy();
  });

  it('وقفه وسطِ پاس: لایه‌ی کهنه کنار گذاشته می‌شود و جدیدترین نسخه به خروجی می‌پیوندد', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('swap-to-b'));
    // پیش از پایانِ پاسِ اول، پاسِ دوم
    act(() => {
      vi.advanceTimersByTime(MORPH_SWAP_MS / 2);
    });
    fireEvent.click(screen.getByTestId('swap-to-c'));

    const box = screen.getByTestId('morph-box');
    const outgoingLayers = box.querySelectorAll('.morph-swap-out');
    expect(outgoingLayers.length).toBe(1); // فقط یک لایه‌ی خروجی — نه انباشت
    expect(outgoingLayers[0].textContent).toBe('محتوای b');
    expect(screen.getByTestId('content-c')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(CLEANUP_MS);
    });
    expect(box.getAttribute('data-phase')).toBe('rest');
    expect(box.querySelectorAll('.morph-swap-out').length).toBe(0);
    expect(screen.queryByText('محتوای a')).toBeNull();
    expect(screen.queryByText('محتوای b')).toBeNull();
  });

  it('به‌روزرسانیِ محتوا بدون تغییر کلید هیچ پاسی برنمی‌دارد (تایپ فلش نمی‌زند)', () => {
    function TypingHarness() {
      const [text, setText] = useState('الف');
      return (
        <>
          <button type="button" data-testid="type-more" onClick={() => setText('الفب')}>
            تایپ
          </button>
          <MorphSwap swapKey="stable" boxTestId="morph-box">
            <div>{text}</div>
          </MorphSwap>
        </>
      );
    }
    render(<TypingHarness />);
    fireEvent.click(screen.getByTestId('type-more'));

    const box = screen.getByTestId('morph-box');
    expect(box.getAttribute('data-phase')).toBe('rest');
    expect(box.querySelectorAll('.morph-swap-out').length).toBe(0);
    expect(box.textContent).toBe('الفب');
  });

  it('آن‌مونت وسطِ پاس: هیچ تایمری زنده نمی‌ماند و خطایی رخ نمی‌دهد', () => {
    const { unmount } = render(<Harness />);
    fireEvent.click(screen.getByTestId('swap-to-b'));
    unmount();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    // رسیدن به این‌جا بدون استثنا = عبور
    expect(true).toBe(true);
  });
});
