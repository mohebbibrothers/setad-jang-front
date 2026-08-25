import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { JalaliDateField } from './JalaliDateField';
import type { JalaliDate } from '@/lib/jalali';

/**
 * JalaliDateField — قواعد کلیدی:
 *  • طول روزهای ماه دقیق است (کبیسه ۱۳۹۹ → اسفند ۳۰ روز)؛
 *  • عوض‌شدن ماه، روزِ انتخاب‌شده clamp می‌شود (۳۱ خرداد → ۳۰ تیر هرگز
 *    تاریخِ ناموجود نمی‌سازد)؛
 *  • onChange فقط برای تاریخِ کاملِ معتبر emit می‌کند.
 */

function Harness({
  initial = null,
  onChange,
}: {
  initial?: JalaliDate | null;
  onChange: (v: JalaliDate | null) => void;
}) {
  const [value, setValue] = useState<JalaliDate | null>(initial);
  return (
    <JalaliDateField
      id="birth"
      label="تاریخ تولد"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

afterEach(cleanup);

describe('JalaliDateField', () => {
  it('سه سلکت روز/ماه/سال و برچسب‌ها', () => {
    render(<Harness onChange={() => undefined} />);
    expect(screen.getByLabelText('روز')).toBeTruthy();
    expect(screen.getByLabelText('ماه')).toBeTruthy();
    expect(screen.getByLabelText('سال')).toBeTruthy();
    expect(screen.getByText('اردیبهشت')).toBeTruthy();
  });

  it('مقدار اولیه از ISOِ تبدیل‌شده آورده می‌شود و انتخاب معتبر emit می‌کند', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ jy: 1378, jm: 10, jd: 11 }} onChange={onChange} />);

    expect((screen.getByLabelText('روز') as HTMLSelectElement).value).toBe('11');
    expect((screen.getByLabelText('ماه') as HTMLSelectElement).value).toBe('10');
    expect((screen.getByLabelText('سال') as HTMLSelectElement).value).toBe('1378');

    fireEvent.change(screen.getByLabelText('روز'), { target: { value: '25' } });
    expect(onChange).toHaveBeenLastCalledWith({ jy: 1378, jm: 10, jd: 25 });
  });

  it('اسفندِ سالِ کبیسه ۳۰ روز دارد؛ سالِ عادی ۲۹', () => {
    render(<Harness initial={{ jy: 1399, jm: 12, jd: 1 }} onChange={() => undefined} />);
    let daySelect = screen.getByLabelText('روز') as HTMLSelectElement;
    expect(daySelect.querySelectorAll('option').length).toBe(30 + 1); // + placeholder

    fireEvent.change(screen.getByLabelText('سال'), { target: { value: '1402' } });
    daySelect = screen.getByLabelText('روز') as HTMLSelectElement;
    expect(daySelect.querySelectorAll('option').length).toBe(29 + 1);
  });

  it('روزِ انتخاب‌شده هنگام عوض‌شدن ماه clamp می‌شود', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ jy: 1403, jm: 6, jd: 31 }} onChange={onChange} />);
    // مهر ۳۰ روزه — ۳۱ باید به ۳۰ برسد
    act(() => {
      fireEvent.change(screen.getByLabelText('ماه'), { target: { value: '7' } });
    });
    expect(onChange).toHaveBeenLastCalledWith({ jy: 1403, jm: 7, jd: 30 });
  });

  it('بدون انتخابِ کامل، null می‌ماند', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('سال'), { target: { value: '1380' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
