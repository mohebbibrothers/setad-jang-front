import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TabyinSection } from './TabyinSection';

describe('Tabyin homepage cover delivery', () => {
  it('renders public source media directly instead of the Next image optimizer', () => {
    const source = 'https://app-media.armansky.ir/org/uploads/2026/example.png';
    const html = renderToStaticMarkup(
      <TabyinSection
        items={[
          { id: '1', slug: 'one', title: 'تصویر آزمایشی', mediaType: 'image', coverUrl: source },
        ]}
      />,
    );
    expect(html).toContain(
      'src="https://app-media.armansky.ir/thumbnail/uploads/2026/example.png"',
    );
    expect(html).not.toContain(`src="${source}"`);
    expect(html).not.toContain('url=https%3A%2F%2Fapp-media.armansky.ir');
  });
});
