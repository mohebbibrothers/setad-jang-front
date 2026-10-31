import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * ListingGallery — کاور + تامبنیل‌ها + آلبومِ پورتالی.
 * (next/image و CampaignAlbum سبک می‌شوند تا تعامل‌ها ایزوله تست شوند.)
 */

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown> & { fill?: boolean }) => {
    const { fill: _fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={(rest.alt as string) ?? ''} />;
  },
}));

vi.mock('@/components/home/CampaignAlbum', () => ({
  CampaignAlbum: ({
    open,
    title,
    startIndex,
  }: {
    open: boolean;
    title: string;
    startIndex?: number;
  }) =>
    open ? <div role="dialog" aria-label={`گالری ${title}`} data-start={startIndex ?? 0} /> : null,
}));

import { ListingGallery } from './ListingGallery';

const IMAGES = [
  { url: '/a.jpg', alt: 'عکس ۱' },
  { url: '/b.jpg', alt: 'عکس ۲' },
  { url: '/c.jpg', alt: 'عکس ۳' },
];

describe('ListingGallery', () => {
  afterEach(() => cleanup());

  it('شمارندهٔ تصاویر و تامبنیل‌ها را نشان می‌دهد', () => {
    render(<ListingGallery title="یخچال" images={IMAGES} />);
    expect(screen.getByText('۳ تصویر')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /نمایش تصویر|نمایش همهٔ/ })).toHaveLength(3);
  });

  it('تصویرِ تک، روبانِ شمارنده و تامبنیل ندارد', () => {
    render(<ListingGallery title="ویلچر" images={[IMAGES[0]]} />);
    expect(screen.queryByText(/تصویر$/)).toBeNull();
    expect(screen.queryByRole('button', { name: /نمایش تصویر/ })).toBeNull();
  });

  it('کلیک روی کاور، آلبوم را از تصویرِ فعال باز می‌کند', () => {
    render(<ListingGallery title="یخچال" images={IMAGES} />);
    fireEvent.click(screen.getAllByRole('button', { name: /نمایش تصویر/ })[1]);
    const dialog = screen.getByRole('dialog', { name: /گالری یخچال/ });
    expect(dialog.getAttribute('data-start')).toBe('1');
  });

  it('بدونِ تصویر، قابِ کاور با placeholder رندر می‌شود (بدونِ کرش)', () => {
    render(<ListingGallery title="بدون عکس" images={[]} />);
    expect(screen.getByRole('button', { name: /بازکردنِ آلبوم تصاویر/ })).toBeTruthy();
  });

  it('بیش از ۵ تصویر: تامبنیلِ آخر «+N» نشان می‌دهد', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ url: `/i${i}.jpg`, alt: `عکس ${i}` }));
    render(<ListingGallery title="گالری" images={many} />);
    expect(screen.getByText('+۳')).toBeTruthy();
  });
});
