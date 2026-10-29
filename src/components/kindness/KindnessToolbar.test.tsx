import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * KindnessToolbar — نوارِ ابزارِ زندهٔ هاب: جست‌وجوی debounceدار → replace
 * (scroll:false)، Enter → فوری، مرتب‌سازی → push با لنگرِ #board، استان/شهر
 * با debounce ۶۰۰ms و datalistِ ۳۱ استان، و «حذف فیلترها» فقط وقتی فیلتری هست.
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

function renderToolbar(f: KindnessFilters = BASE, hasFilters = false) {
  return render(<KindnessToolbar filters={f} hasFilters={hasFilters} />);
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
    fireEvent.change(screen.getByLabelText('جست‌وجو در آگهی‌های دیوار مهربانی'), {
      target: { value: 'یخچال' },
    });
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

  it('Enter/سابمیتِ فرم جست‌وجو را فوری اعمال می‌کند', () => {
    renderToolbar();
    fireEvent.change(screen.getByLabelText('جست‌وجو در آگهی‌های دیوار مهربانی'), {
      target: { value: 'ویلچر' },
    });
    fireEvent.submit(document.querySelector('form')!);
    /* بدون advanceTimers — سابمیت لحظه‌ای است */
    expect(replaceMock).toHaveBeenCalledWith(
      `/kindness-wall?search=${encodeURIComponent('ویلچر')}`,
      { scroll: false },
    );
  });

  it('تغییر مرتب‌سازی با push (Back معنادار) و لنگرِ #board اعمال می‌شود', () => {
    renderToolbar({ ...BASE, search: 'لباس' });
    fireEvent.change(screen.getByLabelText('مرتب‌سازی آگهی‌ها'), {
      target: { value: 'popular' },
    });
    expect(pushMock).toHaveBeenCalledWith(
      `/kindness-wall?search=${encodeURIComponent('لباس')}&ordering=popular#board`,
    );
  });

  it('تایپ در شهر پس از ۶۰۰ms اعمال می‌شود و بقیهٔ فیلترها حفظ می‌شود', () => {
    renderToolbar({ ...BASE, urgent: true, ordering: 'expiring' }, true);
    fireEvent.change(screen.getByLabelText('شهر'), { target: { value: 'شوش' } });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(replaceMock).toHaveBeenCalledWith(
      `/kindness-wall?city=${encodeURIComponent('شوش')}&urgent=true&ordering=expiring`,
      { scroll: false },
    );
  });

  it('«حذف فیلترها» فقط با فیلترِ فعال هست و به نمایِ تمیز برمی‌گردد', () => {
    const { unmount } = renderToolbar({ ...BASE, category: 'poshak' }, true);
    const reset = screen.getByRole('link', { name: /حذف فیلترها/ }) as HTMLAnchorElement;
    expect(reset.getAttribute('href')).toBe('/kindness-wall#board');
    unmount();
    renderToolbar(BASE, false);
    expect(screen.queryByRole('link', { name: /حذف فیلترها/ })).toBeNull();
  });

  it('datalist استان‌ها ۳۱ گزینه دارد (پیشنهاد، نه محدودیت)', () => {
    renderToolbar();
    expect(document.querySelectorAll('#kw-provinces option')).toHaveLength(31);
  });
});
