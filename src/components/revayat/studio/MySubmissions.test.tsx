import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * MySubmissions — «روایت‌های من»:
 *   • فلشِ باز/جمع‌کردنِ فهرست + ترجیحِ پایدار در localStorage؛
 *   • شمارنده‌ی تعداد روایت‌ها توی تیتر؛
 *   • بدونِ جابه‌جاییِ طراحی: فقط جمع‌وشدن + فاصله‌ی تنفسیِ پایین.
 */

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => mocks.apiFetch(...args),
}));

import { MySubmissions } from './MySubmissions';

const KEY = 'besat.tabyin.mysubs.collapsed.v1';

function page(items: unknown[]) {
  return { count: items.length, next: null, previous: null, results: items };
}

const two = [
  { id: 1, external_id: 'x1', title: 'تستِ نخست', submission_status: 'approved' },
  { id: 2, external_id: 'x2', title: 'تستِ دوم', submission_status: 'pending_review' },
];

describe('MySubmissions — جمع‌وشدن و شمارنده', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.apiFetch.mockReset();
    mocks.apiFetch.mockResolvedValue(page(two));
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('به‌صورت پیش‌فرض باز است و با کلیک جمع می‌شود؛ ترجیح در localStorage می‌ماند', async () => {
    render(<MySubmissions refreshKey={0} />);
    await waitFor(() => expect(screen.getByText('تستِ نخست')).toBeTruthy());

    const toggle = screen.getByRole('button', { name: /روایت‌های من/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(window.localStorage.getItem(KEY)).toBe('1');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(window.localStorage.getItem(KEY)).toBe('0');
  });

  it('ترجیحِ جمع‌شدگیِ ذخیره‌شده هنگام بازگشت اعمال می‌شود', async () => {
    window.localStorage.setItem(KEY, '1');
    render(<MySubmissions refreshKey={0} />);
    await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalled());
    const toggle = screen.getByRole('button', { name: /روایت‌های من/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('شمارنده‌ی تعداد روایت‌ها داخل تیتر می‌نشیند', async () => {
    render(<MySubmissions refreshKey={0} />);
    await waitFor(() => expect(screen.getByText('تستِ دوم')).toBeTruthy());
    const heading = screen.getByRole('heading', { name: /روایت‌های من/ });
    expect(heading.textContent).toContain('(۲)');
  });
});
