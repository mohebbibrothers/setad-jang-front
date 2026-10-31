import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * ListingContactCard — راه‌های ارتباط درونِ صفحهٔ آگهی:
 *   ترتیبِ کانال‌ها، لینکِ درست، کپی با بازخورد، و حالتِ «بدونِ کانال».
 */

import { ListingContactCard } from './ListingContactCard';

const CHANNELS = [
  { kind: 'telegram', label: 'آیدی تلگرام', value: 'besat', link: 'https://t.me/besat' },
  { kind: 'phone', label: 'شماره تماس', value: '09120000000', link: 'tel:+989120000000' },
  { kind: 'bale', label: 'آیدی بله', value: 'besat_bale', link: '' },
];

describe('ListingContactCard', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('«تماس» به tel: و «بازکردن» به لینکِ کانال وصل است', () => {
    render(<ListingContactCard channels={CHANNELS} />);
    const call = screen.getByRole('link', { name: /باز کردن شماره تماس/ }) as HTMLAnchorElement;
    expect(call.getAttribute('href')).toBe('tel:+989120000000');
    const tg = screen.getByRole('link', { name: /باز کردن آیدی تلگرام/ }) as HTMLAnchorElement;
    expect(tg.getAttribute('href')).toBe('https://t.me/besat');
    expect(tg.getAttribute('target')).toBe('_blank');
  });

  it('تلفن پیش از پیام‌رسان‌ها نمایش داده می‌شود (ترتیبِ لایهٔ داده)', () => {
    render(<ListingContactCard channels={CHANNELS} />);
    const labels = screen.getAllByText(/^(شماره تماس|آیدی تلگرام|آیدی بله)$/);
    expect(labels[0].textContent).toBe('شماره تماس');
  });

  it('کانالِ بی‌لینک (بله) فقط کپی دارد و برچسبش را نشان می‌دهد', () => {
    render(<ListingContactCard channels={CHANNELS} />);
    expect(screen.getByText('besat_bale')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /باز کردن آیدی بله/ })).toBeNull();
    expect(screen.getByText('کپی و جست‌وجو')).toBeTruthy();
  });

  it('کپیِ شماره، کلیپ‌بورد را صدا می‌زند و بازخوردِ «کپی شد» می‌دهد', async () => {
    render(<ListingContactCard channels={CHANNELS} />);
    fireEvent.click(screen.getByRole('button', { name: 'کپی شماره تماس' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('09120000000'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'کپی شد' })).toBeTruthy());
  });

  it('یادداشتِ هماهنگی و به‌نیابت از ادمین نمایش داده می‌شوند', () => {
    render(
      <ListingContactCard
        channels={CHANNELS}
        contactNote="تماس ۱۰ تا ۲۰"
        beneficiary="خانواده‌ای در شوش"
      />,
    );
    expect(screen.getByText('تماس ۱۰ تا ۲۰')).toBeTruthy();
    expect(screen.getByText(/خانواده‌ای در شوش/)).toBeTruthy();
  });

  it('بدونِ کانال → پیامِ صریح و دعوت به اعلام آمادگی', () => {
    render(<ListingContactCard channels={[]} />);
    expect(screen.getByText('برای این آگهی راهِ ارتباطی ثبت نشده است')).toBeTruthy();
    expect(screen.getByText(/اعلام آمادگی/)).toBeTruthy();
  });
});
