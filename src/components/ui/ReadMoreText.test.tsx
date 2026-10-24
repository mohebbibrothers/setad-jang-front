import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * ReadMoreText — گاردِ نظمِ «دربارهٔ این حرکت»:
 *   متن کوتاه بی‌دست‌خوردگی، متن بلند ۴ خط + گرادیانِ محو + دکمه‌ی فنری.
 */

import { ReadMoreText } from './ReadMoreText';

const LONG_TEXT = 'بعدات در مسیرِ خدمت '.repeat(60); // ≈ بالای آستانهٔ ۲۸۰ کاراکتر
const SHORT_TEXT = 'یک خدمتِ کوتاه';

describe('ReadMoreText', () => {
  afterEach(() => cleanup());

  it('متن کوتاه کامل و بدون هیچ دکمه‌ای رندر می‌شود', () => {
    render(<ReadMoreText text={SHORT_TEXT} />);

    expect(screen.getByText(SHORT_TEXT)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('متن بلند با «نمایش بیشتر» می‌آید و کاملِ آن در DOM می‌ماند (دوستِ SEO)', () => {
    const { container } = render(<ReadMoreText text={LONG_TEXT} />);

    const btn = screen.getByRole('button', { name: /نمایش بیشتر/ });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    // متنِ کامل در DOM است — گرادیان فقط پوششِ بصری است
    expect(container.textContent).toContain(LONG_TEXT.trim().slice(0, 120));
  });

  it('کلیک روی دکمه باز می‌کند و برچسب به «نمایش کمتر» تغییر می‌کند و برعکس', () => {
    render(<ReadMoreText text={LONG_TEXT} />);

    const btn = screen.getByRole('button', { name: /نمایش بیشتر/ });
    fireEvent.click(btn);

    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.textContent).toContain('نمایش کمتر');

    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent).toContain('نمایش بیشتر');
  });

  it('اکسپند/کالپس جایگزینیِ متن نمی‌کند — فقط قابّیتِ دید را', () => {
    const { container } = render(<ReadMoreText text={LONG_TEXT} />);
    const before = container.textContent;

    fireEvent.click(screen.getByRole('button'));
    expect(container.textContent).toContain(LONG_TEXT.trim().slice(-60));
    expect(before).toBeDefined();
  });

  it('متن خالی هیچ چیزی رندر نمی‌کند', () => {
    const { container } = render(<ReadMoreText text="   " />);
    expect(container.firstChild).toBeNull();
  });
});
