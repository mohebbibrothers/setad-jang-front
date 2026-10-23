import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/**
 * CompletionCta — «مُهرِ جشنِ تأمین» / «سوگِ آرامِ بسته‌شده»:
 *   زبانِ بصریِ تکمیلِ حرکت در هوم و هابِ مددکار باید یک‌دست، غیرتعاملی
 *   (role=status)، و جشن‌گونه برای تأمینِ کامل باشد — نه خاکستریِ ناامیدی.
 */

import { CompletionCta } from './CompletionCta';

describe('CompletionCta', () => {
  afterEach(() => cleanup());

  it('حالت funded: لیبل و خط تشکر را با نقشِ status رندر می‌کند', () => {
    render(<CompletionCta state="funded" label="تأمین شد" sublabel="سپاس از همراهی‌تان" />);

    const seal = screen.getByRole('status');
    expect(seal.textContent).toContain('تأمین شد');
    expect(seal.textContent).toContain('سپاس از همراهی‌تان');
  });

  it('حالت funded: لایه‌های جشن (sheen + هاله‌ی مهر + دو ستاره‌چین) حضور دارند', () => {
    const { container } = render(<CompletionCta state="funded" label="حرکت کامل شد" />);

    expect(container.querySelector('.cta-sheen')).not.toBeNull();
    expect(container.querySelector('.cta-seal-halo')).not.toBeNull();
    expect(container.querySelectorAll('.cta-twinkle, .cta-twinkle-b')).toHaveLength(2);
    // مُهرِ تیک + دو ستاره‌چین = سه SVG تزئینی
    expect(container.querySelectorAll('svg')).toHaveLength(3);
  });

  it('حالت funded: بدون sublabel هم سالم رندر می‌شود و گرادیان جشن دارد', () => {
    render(<CompletionCta state="funded" label="تأمین شد" />);

    const seal = screen.getByRole('status');
    expect(seal.textContent).toBe('تأمین شد');
    expect(seal.className).toContain('135deg');
  });

  it('حالت closed: متن با قفل رندر می‌شود و هیچ لایه‌ی جشنی ندارد', () => {
    const { container } = render(
      <CompletionCta state="closed" label="بسته شد" sublabel="نباید دیده شود" />,
    );

    const seal = screen.getByRole('status');
    expect(seal.textContent).toContain('بسته شد');
    expect(seal.textContent).not.toContain('نباید دیده شود');
    expect(container.querySelector('.cta-sheen')).toBeNull();
    expect(container.querySelector('.cta-twinkle')).toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(1); // فقط قفل
    expect(seal.className).toContain('bg-ink-100');
  });

  it('هیچ‌کدام از حالت‌ها عنصرِ تعاملی (button/link) تولید نمی‌کنند', () => {
    const { container: funded } = render(<CompletionCta state="funded" label="الف" />);
    const { container: closed } = render(<CompletionCta state="closed" label="ب" />);

    expect(funded.querySelector('button, a')).toBeNull();
    expect(closed.querySelector('button, a')).toBeNull();
  });
});
