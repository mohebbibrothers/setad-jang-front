import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * SearchGroupSection — قراردادِ «نمایش بیشترِ» درون‌صفحه‌ای:
 *   • برشِ اولیه بلافاصله رندر می‌شود + شمارنده‌ی «نمایش X از Y»؛
 *   • کلیک روی «نمایش بیشتر» صفحه‌ی بعدِ فقط همان منبع را می‌چسباند؛
 *   • رسیدن به سرِ فهرست → پیامِ پایانی و حذفِ دکمه؛
 *   • خطای شبکه → چیپِ «تلاش دوباره».
 *
 * نکته‌ی هارنس vitest (تجربه‌ی قبلیِ ریپو): در این پروژه هیچ
 * beforeEach ریستی نمی‌گذاریم — پیکربندیِ سراسریِ clearMocks/
 * restoreMocks تاریخچه‌ی فراخوانی‌ها را بین تست‌ها پاک می‌کند و
 * beforeEach دستی با ماک‌های پرامیس‌محور تعارضِ حسی دارد.
 */

const searchSourcePageMock = vi.fn();
vi.mock('@/lib/global-search', () => ({
  searchSourcePage: (...args: unknown[]) => searchSourcePageMock(...args),
}));

vi.mock('@/components/ui/SmartImage', () => ({
  SmartImage: () => <span data-testid="hit-img" />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SearchGroupSection } from './SearchGroupSection';
import type { SearchHit } from '@/lib/global-search';

afterEach(() => cleanup());

const hit = (id: string, title: string): SearchHit => ({
  source: 'tabyin',
  id: `tabyin:${id}`,
  title,
  href: `/tabyin/${id}`,
  pill: 'ویدئو',
});

const baseProps = {
  source: 'tabyin' as const,
  q: 'جنگ',
  pageSize: 3,
  label: 'جهاد تبیین',
  shortLabel: 'روایت‌ها',
  seeAllHref: '/tabyin?q=جنگ',
  variant: 'tabyin' as const,
};

describe('SearchGroupSection — «نمایش بیشتر» در همان صفحه', () => {
  it('برشِ اولیه + شمارنده‌ی «نمایش ۳ از ۷» و دکمه با باقیمانده', () => {
    render(
      <SearchGroupSection
        {...baseProps}
        initialHits={[hit('1', 'روایت ۱'), hit('2', 'روایت ۲'), hit('3', 'روایت ۳')]}
        count={7}
      />,
    );
    expect(screen.getByText('روایت ۱')).toBeTruthy();
    expect(screen.getByText(/نمایش ۳ از ۷/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: /نمایش بیشتر/ });
    expect(btn.textContent).toContain('۴ مورد باقی مانده');
  });

  it('کلیک → واکشیِ صفحه‌ی ۲ و چسبیدنِ نتایج؛ سرِ فهرست → پیامِ پایانی', async () => {
    searchSourcePageMock.mockResolvedValue({
      source: 'tabyin',
      q: 'جنگ',
      page: 2,
      pageSize: 3,
      count: 6,
      hasMore: false,
      hits: [hit('4', 'روایت ۴'), hit('5', 'روایت ۵'), hit('6', 'روایت ۶')],
    });
    render(
      <SearchGroupSection
        {...baseProps}
        initialHits={[hit('1', 'روایت ۱'), hit('2', 'روایت ۲'), hit('3', 'روایت ۳')]}
        count={6}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /نمایش بیشتر/ }));

    expect(await screen.findByText('روایت ۶')).toBeTruthy();
    expect(searchSourcePageMock).toHaveBeenCalledWith(
      'tabyin',
      'جنگ',
      expect.objectContaining({ page: 2, pageSize: 3 }),
    );
    // شمارنده به «نمایش ۶ از ۶» محو و پیامِ پایانی می‌آید
    expect(screen.queryByRole('button', { name: /نمایش بیشتر/ })).toBeNull();
    expect(await screen.findByText(/همه‌ی ۶ نتیجه‌ی جهاد تبیین نمایش داده شد/)).toBeTruthy();
  });

  it('هم‌پوشانیِ مرزِ صفحه‌ها تکثیر نمی‌سازد (حذفِ تکرارِ id)', async () => {
    searchSourcePageMock.mockResolvedValue({
      source: 'tabyin',
      q: 'جنگ',
      page: 2,
      pageSize: 3,
      count: 5,
      hasMore: false,
      hits: [hit('3', 'روایت ۳'), hit('4', 'روایت ۴'), hit('5', 'روایت ۵')],
    });
    render(
      <SearchGroupSection
        {...baseProps}
        initialHits={[hit('1', 'روایت ۱'), hit('2', 'روایت ۲'), hit('3', 'روایت ۳')]}
        count={5}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /نمایش بیشتر/ }));
    await screen.findByText('روایت ۵');
    expect(screen.getAllByText('روایت ۳')).toHaveLength(1);
  });

  it('خطای شبکه → چیپِ «تلاش دوباره» که همان صفحه را دوباره می‌طلبد', async () => {
    searchSourcePageMock.mockRejectedValueOnce(new Error('network down')).mockResolvedValue({
      source: 'tabyin',
      q: 'جنگ',
      page: 2,
      pageSize: 3,
      count: 4,
      hasMore: false,
      hits: [hit('4', 'روایت ۴')],
    });
    render(
      <SearchGroupSection
        {...baseProps}
        initialHits={[hit('1', 'روایت ۱'), hit('2', 'روایت ۲'), hit('3', 'روایت ۳')]}
        count={4}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /نمایش بیشتر/ }));
    const retry = await screen.findByRole('button', { name: /تلاش دوباره/ });

    fireEvent.click(retry);
    expect(await screen.findByText('روایت ۴')).toBeTruthy();
    expect(searchSourcePageMock).toHaveBeenCalledTimes(2);
  });

  it('هنگامِ واکشیِ دستِکاربر، متنِ «در حال جست‌وجوی نتایج بیشتر…» نمایش داده می‌شود', async () => {
    searchSourcePageMock.mockImplementation(() => new Promise(() => undefined));
    render(
      <SearchGroupSection
        {...baseProps}
        initialHits={[hit('1', 'روایت ۱'), hit('2', 'روایت ۲'), hit('3', 'روایت ۳')]}
        count={9}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /نمایش بیشتر/ }));
    expect(await screen.findByText('در حال جست‌وجوی نتایج بیشتر…')).toBeTruthy();
  });

  it('وقتی همه‌ی نتایج از اول آمده باشد هیچ دکمه‌ای رندر نمی‌شود', () => {
    render(
      <SearchGroupSection
        {...baseProps}
        initialHits={[hit('1', 'روایت ۱'), hit('2', 'روایت ۲')]}
        count={2}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
