'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { cn, formatPersianNumber as fa } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessHubRail — ریل دسته‌بندی هابِ /kindness-wall (لینک‌محور)
 *
 * دقیقاً همان استانداردِ CategoryRail قرارگاه آموزشی / KindnessRail صفحهٔ
 * اصلی است، با یک تفاوتِ معماری: روی هاب، تب‌ها «لینکِ سروری»‌اند (href با
 * حفظِ بقیهٔ فیلترها + لنگرِ #board) نه دکمهٔ state — URL سندِ فیلتر است،
 * shareable و قایل‌بازگشت با دکمهٔ Back.
 *
 *   • قابِ مرکزچینِ RTL-امن (w-fit + mx-auto + max-w-full) → ریل هرگز
 *     اسکرولِ عرضیِ صفحه نمی‌سازد؛ اسکرول فقط درونِ گذرگاه است (مخفی).
 *   • فلش‌های درجریان با مرزبندیِ برند فقط وقتی سرریز هست.
 *   • تبِ «همه» با آیکنِ grid خانواده؛ «فوری‌ها» با لحنِ رز و Flame.
 *   • شمارندهٔ هر تب از endpoint دسته‌ها/آمار (شمارندهٔ زندهٔ بک‌اند) می‌آید.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type HubRailTab = {
  slug: string;
  title: string;
  /** شمارندهٔ زندهٔ آگهی‌های جاریِ آن برش. */
  count: number;
  /** ایموجیِ دسته (ادمین در پنل انتخابش می‌کند). */
  icon?: string;
  tone: 'brand' | 'rose';
  /** آیکنِ grid خانواده برای تبِ «همه». */
  grid?: boolean;
  /** مقصدِ سروری با حفظِ بقیهٔ فیلترها (+ لنگرِ #board). */
  href: string;
  /** از سمتِ سرور تعیین می‌شود (URL سند است). */
  active: boolean;
};

type RailEdge = { overflowing: boolean; atStart: boolean; atEnd: boolean };

export function KindnessHubRail({ tabs }: { tabs: HubRailTab[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<RailEdge>({ overflowing: false, atStart: true, atEnd: true });

  /* ریاضیاتِ RTLِ مطمئن: scrollLeft از ۰ تا max (قدر مطلق)؛ در مرورگرهای
     مدرنِ RTL از ۰ به‌سمت −max می‌رود پس abs می‌گیریم. */
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const measure = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const pos = Math.abs(el.scrollLeft);
      setEdge({
        overflowing: max > 4,
        atStart: pos <= 4,
        atEnd: pos >= max - 4,
      });
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [tabs.length]);

  /* scrollBy روی مختصاتِ «فیزیکی» کار می‌کند (مستقل از RTL):
     +delta → حرکت به‌سمت راست (بازگشت به ابتدا)، −delta → رفتن به انتها. */
  const scrollRail = useCallback((dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const delta = Math.max(120, Math.round(el.clientWidth * 0.7)) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  /* اسکرولِ درون-ریلی طوری که تبِ فعال دیده شود (ورود با لینکِ عمیقِ دسته).
     آگاهانه scrollBy روی خودِ گذرگاه — هرگز scrollIntoView نه: آن می‌تواند
     کلِ صفحه را هنگامِ ورود جابه‌جا کند، این‌جا فقط ریل جابه‌جا می‌شود.
     فیزیکی و RTL-امن: delta مثبت = جابه‌جایی به‌سمت راست. */
  useEffect(() => {
    const el = railRef.current;
    const activeEl = el?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!el || !activeEl) return;
    const er = el.getBoundingClientRect();
    const ar = activeEl.getBoundingClientRect();
    const delta = ar.left + ar.width / 2 - (er.left + er.width / 2);
    if (Math.abs(delta) > er.width / 2 - 24 && typeof el.scrollBy === 'function') {
      el.scrollBy({ left: delta, behavior: 'auto' });
    }
  }, [tabs]);

  return (
    <div className="mx-auto w-fit max-w-full px-2 sm:px-0">
      <div className="flex items-center justify-center gap-1.5">
        {edge.overflowing && (
          <RailArrow direction="right" disabled={edge.atStart} onClick={() => scrollRail(1)} />
        )}

        <div
          ref={railRef}
          role="tablist"
          aria-label="دسته‌بندی آگهی‌های دیوار مهربانی"
          className="min-w-0 max-w-full overflow-x-auto rounded-full bg-ink-50 p-1 shadow-inner ring-1 ring-ink-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-testid="kw-hub-rail"
        >
          <div className="flex w-max items-center gap-1">
            {tabs.map((t) => {
              const isActive = t.active;
              const isRose = t.tone === 'rose';
              return (
                <Link
                  key={t.slug}
                  href={t.href}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'inline-flex h-10 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12px] font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 active:scale-[.97] sm:px-4 sm:text-[12.5px]',
                    isActive
                      ? isRose
                        ? 'bg-gradient-to-l from-[#f43f5e] to-[#e11d48] text-white shadow-[0_8px_20px_-6px_rgba(225,29,72,.55)]'
                        : 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]'
                      : isRose
                        ? 'text-rose-600 hover:bg-white/60 hover:text-rose-700'
                        : 'text-ink-600 hover:bg-white/60 hover:text-ink-900',
                  )}
                >
                  {t.grid && <Icon name="grid" className="h-3.5 w-3.5 shrink-0" />}
                  {isRose && <Flame className="h-3.5 w-3.5 shrink-0" />}
                  {t.icon && !t.grid && !isRose && (
                    <span aria-hidden="true" className="text-[14px] leading-none">
                      {t.icon}
                    </span>
                  )}
                  <span className="truncate">{t.title}</span>
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums',
                      isActive
                        ? 'bg-white/25 text-white'
                        : isRose
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    {fa(t.count)}
                  </span>
                </Link>
              );
            })}
          </div>
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
      aria-label={direction === 'right' ? 'برگشت به ابتدای ریل' : 'رفتن به دنباله‌ی ریل'}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 shrink-0 select-none place-items-center rounded-full border-2 border-brand-500 bg-white text-brand-700 shadow-[0_4px_12px_-4px_rgba(13,128,116,.35)] transition-all duration-200 hover:bg-brand-50 hover:shadow-[0_8px_18px_-6px_rgba(13,128,116,.45)] active:scale-95 disabled:cursor-not-allowed disabled:border-ink-200 disabled:text-ink-300 disabled:shadow-none disabled:hover:bg-white"
    >
      <Icon name={direction === 'left' ? 'chevron-left' : 'chevron-right'} className="h-4 w-4" />
    </button>
  );
}
