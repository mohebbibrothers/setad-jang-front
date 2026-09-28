'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Grid3X3 } from 'lucide-react';

/**
 * ریلِ دسته‌بندیِ هاب — زبانِ دقیقِ پیلِ صفحه‌ی اصلی، ولی آیتم‌ها لینک‌اند
 * (فیلترِ سروری، قابل‌اشتراک) نه دکمه. منطقِ لبه‌ای‌سنجی همان ریاضیاتِ
 * اثبات‌شده‌ی پیلِ خانه است: Math.abs(scrollLeft) برای نرمال‌کردنِ RTL و
 * قابِ mx-auto w-fit max-w-full که هرگز صفحه را عرضی سرریز نمی‌کند.
 */
export type LmsRailTab = {
  slug: string;
  title: string;
  count: number;
  href: string;
  active: boolean;
};

export function LmsRail({ tabs }: { tabs: LmsRailTab[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ overflowing: false, atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const pos = Math.abs(el.scrollLeft);
    setEdge({ overflowing: max > 2, atStart: pos <= 1, atEnd: pos >= max - 1 });
  }, []);

  useEffect(() => {
    measure();
    const el = railRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure, tabs.length]);

  const scrollRail = useCallback((dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({
      left: Math.max(120, Math.round(el.clientWidth * 0.7)) * dir,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="mx-auto w-fit max-w-full px-1 sm:px-0">
      <div className="flex items-center justify-center gap-1.5">
        {edge.overflowing && (
          <RailArrow direction="right" disabled={edge.atStart} onClick={() => scrollRail(1)} />
        )}
        <div
          ref={railRef}
          role="navigation"
          aria-label="فیلتر دسته‌بندی"
          className="min-w-0 max-w-full overflow-x-auto rounded-full bg-ink-50 p-1 shadow-inner ring-1 ring-ink-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex w-max items-center gap-1">
            {tabs.map((t) => (
              <li key={t.slug}>
                <Link
                  href={t.href}
                  prefetch={false}
                  aria-current={t.active ? 'page' : undefined}
                  onClick={(e) =>
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                      inline: 'nearest',
                    })
                  }
                  className={`inline-flex h-10 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12px] font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 active:scale-[.97] sm:px-4 sm:text-[12.5px] ${
                    t.active
                      ? 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]'
                      : 'text-ink-600 hover:bg-white/60 hover:text-ink-900'
                  }`}
                >
                  {t.slug === '__all__' && (
                    <Grid3X3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">{t.title}</span>
                  <span
                    className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums ${
                      t.active ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {t.count.toLocaleString('fa-IR')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {edge.overflowing && (
          <RailArrow direction="left" disabled={edge.atEnd} onClick={() => scrollRail(-1)} />
        )}
      </div>
    </div>
  );
}

function RailArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? 'دیدن دسته‌های بعدی' : 'بازگشت به دسته‌های اول'}
      onClick={onClick}
      disabled={disabled}
      className="grid h-9 w-9 shrink-0 select-none place-items-center rounded-full border-2 border-brand-500 bg-white text-brand-700 shadow-[0_4px_12px_-4px_rgba(13,128,116,.35)] transition-all duration-200 hover:bg-brand-50 hover:shadow-[0_8px_18px_-6px_rgba(13,128,116,.45)] active:scale-95 disabled:cursor-not-allowed disabled:border-ink-200 disabled:text-ink-300 disabled:shadow-none disabled:hover:bg-white"
    >
      {direction === 'left' ? (
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
