import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Segmented } from './segmented';

/**
 * قرارداد Segmented — کپسولِ لغزانِ «اندازه‌گیری‌شده»:
 *
 *  • ساختار a11y کامل: role=tablist/tab + aria-selected؛
 *  • کپسول جعبه‌ی دقیقِ دکمه‌ی فعال را می‌سنجد (offset*) و با transformِ
 *    فیزیکی دقیقاً همان جعبه را پوشش می‌دهد — هیچ هندسه‌ی حدسی در کار
 *    نیست؛ با هر تغییر مقدار، هدفِ کپسول پیش از پینت به‌روز می‌شود؛
 *  • نخستین قرارگیری بدون ترنزیشن است (data-instant) — فلشِ مونت ممنوع —
 *    و یک فریم بعد مسلح می‌شود؛
 *  • ترک overflow-hidden است: حتی اورشوتِ فرضی هرگز بیرون نقاشی نمی‌شود.
 */

function Harness({ initial = 'a' }: { initial?: 'a' | 'b' | 'c' }) {
  const [value, setValue] = useState<'a' | 'b' | 'c'>(initial);
  return (
    <Segmented<'a' | 'b' | 'c'>
      ariaLabel="گزینه‌ها"
      value={value}
      onChange={setValue}
      indicatorTestId="seg-indicator"
      options={[
        { value: 'a', label: 'الف' },
        { value: 'b', label: 'ب' },
        { value: 'c', label: 'ج' },
      ]}
    />
  );
}

/** استابِ هندسه‌ی واقعی روی دکمه‌ها (happy-dom موتور چیدمان ندارد) */
function stubGeometry(map: Record<string, { x: number; y: number; w: number; h: number }>) {
  const track = screen.getByRole('tablist', { name: 'گزینه‌ها' });
  track.querySelectorAll<HTMLElement>('[role="tab"]').forEach((btn) => {
    // هندسه برای همه استاب می‌شود تا اندازه‌گیرِ «دکمه‌ی فعال» بعد از
    // سوییچ هم مقدارِ واقعی بخواند — با برچسبِ متن تطبیق می‌دهیم
    const label = btn.textContent ?? '';
    const key = label === 'الف' ? 'a' : label === 'ب' ? 'b' : 'c';
    const g = map[key];
    Object.defineProperty(btn, 'offsetLeft', { configurable: true, get: () => g.x });
    Object.defineProperty(btn, 'offsetTop', { configurable: true, get: () => g.y });
    Object.defineProperty(btn, 'offsetWidth', { configurable: true, get: () => g.w });
    Object.defineProperty(btn, 'offsetHeight', { configurable: true, get: () => g.h });
  });
}

const GEOMETRY = {
  a: { x: 4, y: 4, w: 100, h: 40 },
  b: { x: 108, y: 4, w: 100, h: 40 },
  c: { x: 212, y: 4, w: 100, h: 40 },
};

afterEach(cleanup);

describe('Segmented — کپسولِ اندازه‌گیری‌شده', () => {
  it('ساختار a11y کامل دارد و ترک کلیپ‌شده است', () => {
    render(<Harness />);
    const track = screen.getByRole('tablist', { name: 'گزینه‌ها' });
    expect(track.className).toContain('overflow-hidden');

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');

    const indicator = screen.getByTestId('seg-indicator');
    expect(indicator.className).toContain('auth-seg-indicator');
    expect(indicator.getAttribute('aria-hidden')).toBe('true');
    expect(indicator.getAttribute('data-active')).toBe('a');
  });

  it('کپسول دقیقاً آینه‌ی جعبه‌ی دکمه‌ی فعال است (هندسه‌ی اندازه‌گیری‌شده، نه حدسی)', () => {
    render(<Harness initial="a" />);
    stubGeometry(GEOMETRY);

    // سوییچ به «ج» — اندازه‌گیر پیش از پینت جعبه‌ی دکمه‌ی فعالِ جدید را
    // می‌خواند و کپسول دقیقاً همان جعبه را پوشش می‌دهد
    fireEvent.click(screen.getByRole('tab', { name: 'ج' }));

    const indicator = screen.getByTestId('seg-indicator');
    expect(indicator.getAttribute('data-active')).toBe('c');
    expect(indicator.style.transform).toBe('translate3d(212px, 4px, 0)');
    expect(indicator.style.width).toBe('100px');
    expect(indicator.style.height).toBe('40px');
  });

  it('کلیک روی گزینه، onChange را با همان مقدار صدا می‌زند و انتخاب عوض می‌شود', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: 'ب' }));
    expect(screen.getByRole('tab', { name: 'ب' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('seg-indicator').getAttribute('data-active')).toBe('b');
  });

  it('نخستین قرارگیری بدون ترنزیشن است و یک فریم بعد مسلح می‌شود', async () => {
    render(<Harness />);
    const indicator = screen.getByTestId('seg-indicator');
    expect(indicator.getAttribute('data-instant')).toBe('true');

    await act(async () => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 60);
      });
    });
    expect(indicator.getAttribute('data-instant')).toBe('false');
  });

  it('قراردادِ بصری: کپسول استادیوم/بیضی است (شعاعِ کامل) — نه مستطیل', () => {
    // کاربر صراحتاً «بیضی» خواست؛ این قرارداد را برای همیشه قفل می‌کنیم
    const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
    const block = css.match(/\.auth-seg-indicator\s*\{[^}]*\}/);
    expect(block).toBeTruthy();
    expect(block![0]).toContain('border-radius: 9999px');
  });
});
