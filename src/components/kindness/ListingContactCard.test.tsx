import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * ListingContactCard — راه‌های ارتباط درونِ صفحهٔ آگهی + **درگاهِ ورود**:
 *   • کاربرِ واردشده: تلفن/آیدیِ کامل، لینک‌های درست، کپی با بازخورد.
 *   • بینندهٔ بی‌نام: مقدارهای ماسک‌شده **نمایش داده نمی‌شوند**؛ به‌جایش
 *     کارتِ قفل + CTA ورود + پیش‌نمایشِ نوع کانال‌ها.
 *   • پس از ورود: نسخهٔ کامل با هویتِ کاربر دوباره خوانده می‌شود.
 */

const authState = { isAuthenticated: false, loading: false };
vi.mock('@/lib/use-auth', () => ({ useAuth: () => authState }));

vi.mock('@/components/auth/AuthModal', () => ({
  AuthModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="ورود یا ثبت‌نام" /> : null,
}));

const apiFetchMock = vi.fn();
vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  isApiError: () => false,
}));

import { ListingContactCard } from './ListingContactCard';

const FULL_CHANNELS = [
  { kind: 'telegram', label: 'آیدی تلگرام', value: 'besat', link: 'https://t.me/besat' },
  { kind: 'phone', label: 'شماره تماس', value: '09120000000', link: 'tel:+989120000000' },
  { kind: 'bale', label: 'آیدی بله', value: 'besat_bale', link: '' },
];

const MASKED_CHANNELS = [
  { kind: 'phone', label: 'شماره تماس', value: '0912•••••41', link: '', masked: 'true' },
  { kind: 'telegram', label: 'آیدی تلگرام', value: 'bes•••', link: '', masked: 'true' },
];

describe('ListingContactCard — کاربرِ واردشده', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.loading = false;
    apiFetchMock.mockReset();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });
  afterEach(() => cleanup());

  const renderCard = (props: Partial<Parameters<typeof ListingContactCard>[0]> = {}) =>
    render(<ListingContactCard slug="یخچال-دوقلو" channels={FULL_CHANNELS} {...props} />);

  it('«تماس» به tel: و «بازکردن» به لینکِ کانال وصل است', () => {
    renderCard();
    const call = screen.getByRole('link', { name: /باز کردن شماره تماس/ }) as HTMLAnchorElement;
    expect(call.getAttribute('href')).toBe('tel:+989120000000');
    const tg = screen.getByRole('link', { name: /باز کردن آیدی تلگرام/ }) as HTMLAnchorElement;
    expect(tg.getAttribute('href')).toBe('https://t.me/besat');
    expect(tg.getAttribute('target')).toBe('_blank');
  });

  it('تلفن پیش از پیام‌رسان‌ها نمایش داده می‌شود (ترتیبِ لایهٔ داده)', () => {
    renderCard();
    const labels = screen.getAllByText(/^(شماره تماس|آیدی تلگرام|آیدی بله)$/);
    expect(labels[0].textContent).toBe('شماره تماس');
  });

  it('کانالِ بی‌لینک (بله) فقط کپی دارد', () => {
    renderCard();
    expect(screen.getByText('besat_bale')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /باز کردن آیدی بله/ })).toBeNull();
    expect(screen.getByText('کپی و جست‌وجو')).toBeTruthy();
  });

  it('کپیِ شماره، کلیپ‌بورد را صدا می‌زند و بازخورد می‌دهد', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'کپی شماره تماس' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('09120000000'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'کپی شد' })).toBeTruthy());
  });

  it('یادداشتِ هماهنگی و به‌نیابت از ادمین نمایش داده می‌شوند', () => {
    renderCard({ contactNote: 'تماس ۱۰ تا ۲۰', beneficiary: 'خانواده‌ای در شوش' });
    expect(screen.getByText('تماس ۱۰ تا ۲۰')).toBeTruthy();
    expect(screen.getByText(/خانواده‌ای در شوش/)).toBeTruthy();
  });

  it('بدونِ کانال → پیامِ صریح و دعوت به اعلام آمادگی', () => {
    renderCard({ channels: [] });
    expect(screen.getByText('برای این آگهی راهِ ارتباطی ثبت نشده است')).toBeTruthy();
  });
});

describe('ListingContactCard — درگاهِ ورود', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.loading = false;
    apiFetchMock.mockReset();
  });
  afterEach(() => cleanup());

  it('بینندهٔ بی‌نام مقدارِ کامل و لینکِ قابلِ‌استفاده نمی‌بیند', () => {
    render(<ListingContactCard slug="یخچال-دوقلو" channels={MASKED_CHANNELS} gated />);
    expect(screen.getByTestId('kw-contact-gate')).toBeTruthy();
    expect(screen.queryByText('0912•••••41')).toBeNull();
    expect(screen.queryByRole('link', { name: /باز کردن شماره تماس/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /باز کردن آیدی تلگرام/ })).toBeNull();
  });

  it('نوعِ کانال‌ها به‌عنوان پیش‌نمایش دیده می‌شود (بدونِ مقدار)', () => {
    render(<ListingContactCard slug="x" channels={MASKED_CHANNELS} gated />);
    expect(screen.getByText('شماره تماس')).toBeTruthy();
    expect(screen.getByText('آیدی تلگرام')).toBeTruthy();
    expect(screen.getByText('۲ راهِ ارتباط ثبت شده است')).toBeTruthy();
  });

  it('CTA ورود، مودالِ احراز هویت را باز می‌کند', async () => {
    render(<ListingContactCard slug="x" channels={MASKED_CHANNELS} gated />);
    fireEvent.click(screen.getByRole('button', { name: /ورود برای مشاهدهٔ راه‌های ارتباط/ }));
    expect(await screen.findByRole('dialog', { name: 'ورود یا ثبت‌نام' })).toBeTruthy();
  });

  it('پس از ورود، نسخهٔ کامل با هویتِ کاربر دوباره خوانده می‌شود', async () => {
    apiFetchMock.mockResolvedValue({
      slug: 'x',
      title: 'نیاز',
      contact_gated: false,
      contact_channels: FULL_CHANNELS,
    });
    authState.isAuthenticated = true;
    render(<ListingContactCard slug="x" channels={MASKED_CHANNELS} gated />);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const [path, init] = apiFetchMock.mock.calls[0];
    expect(String(path)).toContain('/kindness-wall/listings/');
    /* درخواست باید هویت‌دار باشد (skipAuth نیاید) */
    expect(init?.skipAuth).toBeUndefined();
    expect(await screen.findByText('09120000000')).toBeTruthy();
    expect(screen.queryByTestId('kw-contact-gate')).toBeNull();
  });
});
