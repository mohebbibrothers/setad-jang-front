import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/**
 * KindnessHubRail — ریلِ لینک‌محورِ دسته‌ها: همان استانداردِ CategoryRail
 * (گذرگاهِ rounded-full با اسکرولِ مخفیِ درونی، تبِ «همه» با grid، تبِ رزِ
 * فوری‌ها) ولی تب‌ها لینکِ سروری‌اند: URL سندِ فیلتر است و shareable می‌ماند.
 */

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { KindnessHubRail, type HubRailTab } from './KindnessHubRail';

const TABS: HubRailTab[] = [
  {
    slug: '__all__',
    title: 'همه',
    count: 7,
    tone: 'brand',
    grid: true,
    href: '/kindness-wall#board',
    active: false,
  },
  {
    slug: '__urgent__',
    title: 'فوری‌ها',
    count: 3,
    tone: 'rose',
    href: '/kindness-wall?urgent=true#board',
    active: true,
  },
  {
    slug: 'ashpazkhane',
    title: 'لوازم آشپزخانه',
    icon: '🍳',
    count: 4,
    tone: 'brand',
    href: '/kindness-wall?category=ashpazkhane#board',
    active: false,
  },
];

describe('KindnessHubRail', () => {
  afterEach(() => cleanup());

  it('ریل با role=tablist و تب‌های لینک‌محور رندر می‌شود', () => {
    render(<KindnessHubRail tabs={TABS} />);
    const rail = screen.getByRole('tablist', { name: 'دسته‌بندی آگهی‌های دیوار مهربانی' });
    expect(rail.className).toContain('rounded-full');
    expect(rail.className).toContain('overflow-x-auto');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('تبِ فعال aria-selected دارد و hrefها فیلترها را حفظ می‌کنند', () => {
    render(<KindnessHubRail tabs={TABS} />);
    const urgent = screen.getByRole('tab', { name: /فوری‌ها/ }) as HTMLAnchorElement;
    expect(urgent.getAttribute('aria-selected')).toBe('true');
    expect(urgent.getAttribute('href')).toBe('/kindness-wall?urgent=true#board');
    const cat = screen.getByRole('tab', { name: /لوازم آشپزخانه/ }) as HTMLAnchorElement;
    expect(cat.getAttribute('aria-selected')).toBe('false');
    expect(cat.getAttribute('href')).toBe('/kindness-wall?category=ashpazkhane#board');
  });

  it('تبِ «همه» آیکنِ grid دارد و ایموجیِ دسته در تبِ خودش می‌نشیند', () => {
    render(<KindnessHubRail tabs={TABS} />);
    const all = screen.getByRole('tab', { name: /همه/ });
    expect(all.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('🍳')).toBeTruthy();
    /* شمارنده‌ها با ارقام فارسی */
    expect(screen.getByRole('tab', { name: /لوازم آشپزخانه/ }).textContent).toContain('۴');
  });

  it('بدون سرریز، فلش‌های ریل رندر نمی‌شوند', () => {
    render(<KindnessHubRail tabs={TABS} />);
    expect(screen.queryByRole('button', { name: /ریل/ })).toBeNull();
  });
});
