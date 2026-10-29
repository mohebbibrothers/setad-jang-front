import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * KindnessToolbar — نوارِ ابزارِ زندهٔ هاب:
 *   • جست‌وجوی debounceدار با replace(scroll:false) و Enterِ فوری
 *   • دراپ‌دان‌های سفارشی (KindnessSelect): باز شدن، انتخاب، پاک‌کردن، کیبورد
 *   • «حذف فیلترها» فقط با فیلترِ فعال
 */

const replaceMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { KindnessToolbar } from './KindnessToolbar';
import { DEFAULT_KINDNESS_FILTERS, type KindnessFilters } from '@/lib/kindness-wall';

const BASE = DEFAULT_KINDNESS_FILTERS;
const FACETS = { provinces: ['تهران', 'اصفهان'], cities: ['شوش', 'ری'] };

function renderToolbar(f: KindnessFilters = BASE, hasFilters = false) {
  return render(<KindnessToolbar filters={f} hasFilters={hasFilters} facets={FACETS} />);
}

describe('KindnessToolbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replaceMock.mockReset();
    pushMock.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('تایپ در جست‌وجو پس از ۴۵۰ms با replace و scroll:false اعمال می‌شود', () => {
    renderToolbar();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'یخچال' } });
    expect(replaceMock).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(replaceMock).toHaveBeenCalledWith(
      `/kindness-wall?search=${encodeURIComponent('یخچال')}`,
      { scroll: false },
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('نوشتهٔ کاربر هنگام تایپ دست‌نخورده می‌ماند (باگِ پرشِ متن)', () => {
    const { rerender } = renderToolbar();
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'نیاز' } });
    act(() => {
      vi.advanceTimersByTime(450);
    });
    /* سرور همان مقداری را برمی‌گرداند که خودمان فرستادیم */
    rerender(<KindnessToolbar filters={{ ...BASE, search: 'نیاز' }} hasFilters facets={FACETS} />);
    expect(input.value).toBe('نیاز');
    fireEvent.change(input, { target: { value: 'نیاز فوری' } });
    expect(input.value).toBe('نیاز فوری');
  });

  it('Enter جست‌وجو را فوری اعمال می‌کند', () => {
    renderToolbar();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'ویلچر' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(replaceMock).toHaveBeenCalledWith(
      `/kindness-wall?search=${encodeURIComponent('ویلچر')}`,
      { scroll: false },
    );
  });

  it('دکمهٔ پاک‌کردن، عبارت را پاک و فیلتر را برمی‌دارد', () => {
    renderToolbar({ ...BASE, search: 'لباس' }, true);
    fireEvent.click(screen.getByRole('button', { name: 'پاک‌کردن جست‌وجو' }));
    expect(replaceMock).toHaveBeenCalledWith('/kindness-wall', { scroll: false });
  });

  it('مرتب‌سازی: انتخاب از دراپ‌دانِ سفارشی با push و لنگرِ #board', () => {
    renderToolbar();
    fireEvent.click(screen.getByLabelText('مرتب‌سازی آگهی‌ها'));
    fireEvent.click(screen.getByRole('option', { name: /پربازدیدترین‌ها/ }));
    expect(pushMock).toHaveBeenCalledWith('/kindness-wall?ordering=popular#board');
  });

  it('استان: دراپ‌دانِ جست‌وجوپذیر، گزینهٔ استان و ردیفِ «همهٔ استان‌ها» را دارد', () => {
    renderToolbar({ ...BASE, province: 'تهران' }, true);
    fireEvent.click(screen.getByLabelText('فیلتر استان'));
    /* فیلترِ درونِ پنل */
    const box = screen.getByLabelText('فیلتر استان — جست‌وجو در فهرست');
    fireEvent.change(box, { target: { value: 'اصفه' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toContain('اصفهان');
    fireEvent.click(options[0]);
    expect(replaceMock).toHaveBeenCalledWith(
      `/kindness-wall?province=${encodeURIComponent('اصفهان')}`,
      { scroll: false },
    );
  });

  it('شهر: عبارتِ آزادِ بیرون از فهرست هم قابلِ اعمال است (iexact بک‌اند)', () => {
    renderToolbar();
    fireEvent.click(screen.getByLabelText('فیلتر شهر'));
    const box = screen.getByLabelText('فیلتر شهر — جست‌وجو در فهرست');
    fireEvent.change(box, { target: { value: 'قزوین' } });
    fireEvent.click(screen.getByRole('option', { name: /اعمال «قزوین»/ }));
    expect(replaceMock).toHaveBeenCalledWith(`/kindness-wall?city=${encodeURIComponent('قزوین')}`, {
      scroll: false,
    });
  });

  it('استانِ فعالِ بیرون از فهرستِ رسمی هم در فیلد دیده می‌شود', () => {
    renderToolbar({ ...BASE, province: 'استانِ فرضی' }, true);
    const trigger = screen.getByLabelText('فیلتر استان');
    expect(trigger.textContent).toContain('استانِ فرضی');
  });

  it('«حذف فیلترها» فقط با فیلترِ فعال هست', () => {
    const { unmount } = renderToolbar({ ...BASE, category: 'poshak' }, true);
    const reset = screen.getByTestId('kw-clear-filters') as HTMLAnchorElement;
    expect(reset.getAttribute('href')).toBe('/kindness-wall#board');
    unmount();
    renderToolbar(BASE, false);
    expect(screen.queryByTestId('kw-clear-filters')).toBeNull();
  });

  it('کیبورد: ↓ روی گزینهٔ دوم و Enter انتخابش می‌کند', () => {
    renderToolbar();
    fireEvent.click(screen.getByLabelText('مرتب‌سازی آگهی‌ها'));
    const listbox = screen.getByRole('listbox', { name: 'مرتب‌سازی آگهی‌ها' });
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    fireEvent.keyDown(listbox, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledWith('/kindness-wall?ordering=fresh#board');
  });

  it('Escape پنل را می‌بندد', () => {
    renderToolbar();
    fireEvent.click(screen.getByLabelText('مرتب‌سازی آگهی‌ها'));
    expect(screen.queryByRole('listbox')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
