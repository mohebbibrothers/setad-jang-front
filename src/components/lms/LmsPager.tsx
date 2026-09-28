import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageWindow } from '@/lib/lms-shared';

/**
 * پیجرِ سرور-محورِ هاب — شماره‌ها لینک‌اند (SEO-friendly, shareable) و
 * صفحه‌ی جاری «aria-current» می‌گیرد. پنجره‌ی حداکثر ۷ نشان با فاصله‌ی
 * هوشمندانه روی لبه‌ها.
 */
export function LmsPager({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const window = pageWindow(page, totalPages);
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      aria-label="صفحه‌بندی آموزش‌ها"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      <PagerArrow
        disabled={prev === null}
        href={prev === null ? undefined : buildHref(prev)}
        dir="right"
        label="صفحه‌ی قبلی"
      />
      <ul className="flex items-center gap-1.5">
        {window.map((n, i) =>
          n === 'gap' ? (
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="grid h-10 w-6 place-items-center text-ink-300"
            >
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={buildHref(n)}
                prefetch={false}
                aria-current={n === page ? 'page' : undefined}
                aria-label={
                  n === page
                    ? `صفحه‌ی ${n.toLocaleString('fa-IR')} (فعلی)`
                    : `صفحه‌ی ${n.toLocaleString('fa-IR')}`
                }
                className={`grid h-10 min-w-10 select-none place-items-center rounded-full px-2 text-[12.5px] font-extrabold tabular-nums transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  n === page
                    ? 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]'
                    : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                {n.toLocaleString('fa-IR')}
              </Link>
            </li>
          ),
        )}
      </ul>
      <PagerArrow
        disabled={next === null}
        href={next === null ? undefined : buildHref(next)}
        dir="left"
        label="صفحه‌ی بعدی"
      />
      <span className="ms-2 text-[11px] font-bold text-ink-400">
        صفحه‌ی {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
      </span>
    </nav>
  );
}

function PagerArrow({
  disabled,
  href,
  dir,
  label,
}: {
  disabled: boolean;
  href?: string;
  dir: 'left' | 'right';
  label: string;
}) {
  const IconCmp = dir === 'left' ? ChevronLeft : ChevronRight;
  const cls =
    'grid h-10 w-10 select-none place-items-center rounded-full border-2 text-brand-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ' +
    (disabled
      ? 'cursor-not-allowed border-ink-200 text-ink-300'
      : 'border-brand-500 bg-white shadow-[0_4px_12px_-4px_rgba(13,128,116,.35)] hover:bg-brand-50 active:scale-95');
  if (disabled || !href) {
    return (
      <span aria-hidden="true" className={cls}>
        <IconCmp className="h-4 w-4" />
      </span>
    );
  }
  return (
    <Link href={href} prefetch={false} aria-label={label} className={cls}>
      <IconCmp className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
