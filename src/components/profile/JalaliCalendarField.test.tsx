import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/**
 * JalaliCalendarField — تقویم شمسیِ تاریخ تولد.
 * همه‌ی انتظاراتِ تقویمی از خودِ lib/jalali محاسبه می‌شوند (مرجعِ
 * اثبات‌شده با سوییپِ ۲۲هزارروزه) تا تست به «امروز» حساس نباشد.
 */

import { JalaliCalendarField } from './JalaliCalendarField';
import { JALALI_MONTH_NAMES, jalaliMonthLength, todayJalali, type JalaliDate } from '@/lib/jalali';
import { formatJalaliYear } from '@/lib/persian-time';
import { formatPersianNumber } from '@/lib/utils';

afterEach(cleanup);

function setup(value: JalaliDate | null = null) {
  const onChange = vi.fn();
  render(<JalaliCalendarField id="birth" label="تاریخ تولد" value={value} onChange={onChange} />);
  return { onChange };
}

const trigger = () => screen.getByRole('button', { name: /^تاریخ تولد/ });
const openCal = () => fireEvent.click(trigger());
const dialog = () => screen.getByRole('dialog', { name: 'تقویم انتخاب تاریخ تولد' });

/** برچسبِ کاملِ یک خانه‌ی روز — دقیقاً همان الگوی aria-label کامپوننت */
const dayName = (d: JalaliDate) =>
  `${formatPersianNumber(d.jd)} ${JALALI_MONTH_NAMES[d.jm - 1]} ${formatJalaliYear(d.jy)}`;

describe('JalaliCalendarField — بسته و نمایش مقدار', () => {
  it('بدون مقدار: placeholder و بدون پاپ‌اور', () => {
    setup(null);
    expect(trigger().getAttribute('aria-label')).toContain('انتخاب کنید');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('با مقدار: تاریخِ فارسیِ خوش‌خوان روی تریگر', () => {
    setup({ jy: 1378, jm: 10, jd: 20 });
    expect(trigger().textContent).toContain('۲۰ دی ۱۳۷۸');
  });
});

describe('JalaliCalendarField — گشودن و انتخاب روز', () => {
  it('بازشدن روی ماهِ مقدار با روزِ انتخاب‌شده‌ی مشخص', () => {
    setup({ jy: 1378, jm: 10, jd: 20 });
    openCal();
    const dlg = dialog();
    expect(within(dlg).getByRole('grid', { name: 'دی ۱۳۷۸' })).toBeTruthy();
    const selected = within(dlg).getByRole('gridcell', { name: '۲۰ دی ۱۳۷۸' });
    expect(selected.getAttribute('aria-selected')).toBe('true');
  });

  it('کلیک روی روز → onChange با تاریخِ کامل + بسته‌شدن', async () => {
    const t = todayJalali();
    const { onChange } = setup(null);
    openCal();
    // روزِ ۱ ماهِ جاری همیشه فعال است (≤ امروز)
    fireEvent.click(within(dialog()).getByRole('gridcell', { name: dayName({ ...t, jd: 1 }) }));
    expect(onChange).toHaveBeenCalledWith({ jy: t.jy, jm: t.jm, jd: 1 });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('روزهای آینده غیرفعال‌اند و کلیکشان emit نمی‌کند', () => {
    const t = todayJalali();
    const future = { ...t, jd: t.jd + 1 };
    if (t.jd >= jalaliMonthLength(t.jy, t.jm)) return; // آخر ماه — سناریو ناممکن
    const { onChange } = setup(null);
    openCal();
    const cell = within(dialog()).getByRole('gridcell', { name: dayName(future) });
    expect((cell as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(cell);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('روی ماهِ جاری، فلش «ماه بعد» قفل است', () => {
    setup(null);
    openCal();
    expect((screen.getByRole('button', { name: 'ماه بعد' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe('JalaliCalendarField — ناوبری ماه و سال', () => {
  it('ماهِ قبل از فروردین → اسفندِ سال قبل (پیچش سال)', () => {
    setup({ jy: 1403, jm: 1, jd: 15 });
    openCal();
    fireEvent.click(screen.getByRole('button', { name: 'ماه قبل' }));
    expect(screen.getByRole('grid', { name: 'اسفند ۱۴۰۲' })).toBeTruthy();
    // ۱۴۰۲ کبیسه نیست → اسفند ۲۹ روزه: خانه‌ی ۳۰ وجود ندارد
    expect(within(dialog()).queryByRole('gridcell', { name: '۳۰ اسفند ۱۴۰۲' })).toBeNull();
  });

  it('اسفندِ ۱۴۰۳ (کبیسه) روزِ سیام دارد', () => {
    // فروردین ۱۴۰۴ → یک ماه قبل = اسفند ۱۴۰۳
    setup({ jy: 1404, jm: 1, jd: 15 });
    openCal();
    fireEvent.click(screen.getByRole('button', { name: 'ماه قبل' }));
    expect(screen.getByRole('grid', { name: 'اسفند ۱۴۰۳' })).toBeTruthy();
    const days = within(dialog()).getByRole('grid', { name: 'اسفند ۱۴۰۳' });
    expect(
      within(days.parentElement as HTMLElement).getByRole('gridcell', { name: '۳۰ اسفند ۱۴۰۳' }),
    ).toBeTruthy();
  });

  it('drill-down ماه: انتخاب مستقیمِ شهریور', () => {
    setup({ jy: 1378, jm: 10, jd: 20 });
    openCal();
    fireEvent.click(screen.getByRole('button', { name: 'انتخاب ماه' }));
    fireEvent.click(screen.getByRole('button', { name: 'شهریور' }));
    expect(screen.getByRole('grid', { name: 'شهریور ۱۳۷۸' })).toBeTruthy();
  });

  it('drill-down سال: پرش سریع به دهه‌ی ۱۳۶۰ و سپس روز', () => {
    const { onChange } = setup({ jy: 1378, jm: 10, jd: 20 });
    openCal();
    fireEvent.click(screen.getByRole('button', { name: 'انتخاب سال' }));
    // صفحه‌ی سال‌ها حولِ مقدارِ فعلی است → یک بلوک به عقب برمی‌گردیم
    fireEvent.click(screen.getByRole('button', { name: 'دوازده سال قبل' }));
    fireEvent.click(screen.getByRole('button', { name: '۱۳۶۳' }));
    // بعد از انتخاب سال → نمای ماه‌ها — سال در هدر دیده می‌شود
    fireEvent.click(screen.getByRole('button', { name: 'مهر' }));
    const grid = screen.getByRole('grid', { name: 'مهر ۱۳۶۳' });
    fireEvent.click(
      within(grid.parentElement as HTMLElement).getByRole('gridcell', { name: '۵ مهر ۱۳۶۳' }),
    );
    expect(onChange).toHaveBeenCalledWith({ jy: 1363, jm: 7, jd: 5 });
  });

  it('سال‌های آینده در نمای سال وجود ندارند', () => {
    const t = todayJalali();
    setup(null);
    openCal();
    fireEvent.click(screen.getByRole('button', { name: 'انتخاب سال' }));
    expect(screen.queryByRole('button', { name: formatJalaliYear(t.jy + 1) })).toBeNull();
    // و صفحه‌ی بعدِ سال‌ها هم قفل است
    expect(
      (screen.getByRole('button', { name: 'دوازده سال بعد' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

describe('JalaliCalendarField — چرخه‌حیات پاپ‌اور', () => {
  it('Escape پاپ‌اور را می‌بندد', async () => {
    setup({ jy: 1378, jm: 10, jd: 20 });
    openCal();
    expect(screen.queryByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('کلیک بیرون پاپ‌اور را می‌بندد', async () => {
    setup({ jy: 1378, jm: 10, jd: 20 });
    openCal();
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
