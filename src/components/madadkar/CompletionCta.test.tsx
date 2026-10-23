import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * خانواده‌ی یکپارچه‌ی CTA حرکت — ActiveCta + CompletionCta:
 *   سه حالتِ چرخه‌عمر باید از یک قاب (ارتفاع/گردی/زبان حرکتی) بیایند تا
 *   دیگر به چشم نخورند «جدا طراحی شده‌اند».
 */

import { ActiveCta, CompletionCta } from './CompletionCta';

const FRAME_HEIGHT = 'h-[56px]';

describe('ActiveCta — دعوتِ فعال', () => {
  afterEach(() => cleanup());

  it('دکمه‌ی واقعی با لیبل رندر می‌شود و کلیک هندلر را صدا می‌زند', () => {
    const onClick = vi.fn();
    render(<ActiveCta label="مدد به حرکت" onClick={onClick} />);

    const btn = screen.getByRole('button', { name: /مدد به حرکت/ });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('با قابِ مشترکِ خانواده (۵۶px) و لایه‌های دعوت (sheen سفید + هاله) می‌آید', () => {
    const { container } = render(<ActiveCta label="مدد به حرکت" onClick={() => {}} />);

    const btn = screen.getByRole('button');
    expect(btn.className).toContain(FRAME_HEIGHT);
    expect(container.querySelector('.cta-sheen--white')).not.toBeNull();
    expect(container.querySelector('.cta-halo-white')).not.toBeNull();
  });

  it('ستاره‌چین ندارد — آن فقط مختص جشنِ تأمین است (سلسله‌مراتب بصری)', () => {
    const { container } = render(<ActiveCta label="مدد به حرکت" onClick={() => {}} />);
    expect(container.querySelector('.cta-twinkle')).toBeNull();
  });
});

describe('CompletionCta — مُهرِ جشنِ تأمین', () => {
  afterEach(() => cleanup());

  it('حالت funded: لیبل و خط تشکر را با نقشِ status رندر می‌کند', () => {
    render(<CompletionCta state="funded" label="تأمین شد" sublabel="سپاس از همراهی‌تان" />);

    const seal = screen.getByRole('status');
    expect(seal.textContent).toContain('تأمین شد');
    expect(seal.textContent).toContain('سپاس از همراهی‌تان');
    expect(seal.className).toContain(FRAME_HEIGHT);
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
    expect(seal.className).toContain(FRAME_HEIGHT);
    expect(container.querySelector('.cta-sheen')).toBeNull();
    expect(container.querySelector('.cta-twinkle')).toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(1); // فقط قفل
    expect(seal.className).toContain('bg-ink-100');
  });

  it('حالت‌های پایانی عنصرِ تعاملی (button/link) تولید نمی‌کنند', () => {
    const { container: funded } = render(<CompletionCta state="funded" label="الف" />);
    const { container: closed } = render(<CompletionCta state="closed" label="ب" />);

    expect(funded.querySelector('button, a')).toBeNull();
    expect(closed.querySelector('button, a')).toBeNull();
  });
});

describe('انسجام خانواده — هر سه حالت از یک قاب', () => {
  afterEach(() => cleanup());

  it('فعال/جشن/سوگ هم‌ضخامت (۵۶) و هم‌گردی (۱۴px)‌اند', () => {
    const { container } = render(
      <>
        <ActiveCta label="الف" onClick={() => {}} />
        <CompletionCta state="funded" label="ب" />
        <CompletionCta state="closed" label="ج" />
      </>,
    );

    const nodes = container.querySelectorAll(
      `.${FRAME_HEIGHT.replace('[', '\\[').replace(']', '\\]')}`,
    );
    expect(nodes).toHaveLength(3);
    for (const n of nodes) expect(n.className).toContain('rounded-[14px]');
  });
});
