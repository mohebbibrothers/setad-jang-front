import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TabyinSection, type TabyinItem } from './TabyinSection';

const items: TabyinItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i),
  slug: String(i),
  title: `کارت ${i}`,
  mediaType: 'image',
  coverUrl: `https://cdn.example/${i}.jpg`,
}));

describe('homepage counts are not capped to the preview card window', () => {
  it('displays verified 6101 full count while rendering only a small preview', () => {
    const html = renderToStaticMarkup(
      <TabyinSection
        items={items}
        counts={{ all: 6101, image: 6101, video: 0, text: 0, exact: true }}
      />,
    );
    expect(html).toContain('۶٬۱۰۱');
    expect(html).not.toContain('نمایش تازه‌ترین ۱۰۰ مورد');
    expect(html).toContain('مشاهده همه محتواها');
  });
  it('never treats legacy raw counts as verified full display totals', () => {
    const html = renderToStaticMarkup(
      <TabyinSection items={items} counts={{ all: 6101, image: 6101, video: 0, text: 0 }} />,
    );
    expect(html).not.toContain('۶٬۱۰۱');
    expect(html).not.toContain('نمایش تازه‌ترین ۱۰۰ مورد');
  });
  it('unavailable data is not announced as no published content', () => {
    const html = renderToStaticMarkup(<TabyinSection items={[]} unavailable />);
    expect(html).toContain('دریافت روایت‌ها موقتاً در دسترس نیست');
    expect(html).not.toContain('هنوز محتوایی منتشر نشده');
  });
});
