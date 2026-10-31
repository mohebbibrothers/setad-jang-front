'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { cn, formatPersianNumber as fa } from '@/lib/utils';
import { registerListingView } from '@/lib/kindness-listing';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * ListingViewCounter — شمارندهٔ بازدیدِ «زنده» با beacon کلاینتی
 *
 * چرا کلاینتی؟ صفحهٔ آگهی SSR + ISR است؛ اگر شمارش در رندرِ سروری انجام شود،
 * هر revalidate و هر prefetchِ سرور یک «بازدید» جعلی می‌سازد. این‌جا:
 *
 *   • عددِ اولیه همان مقدارِ کش‌شدهٔ سرور است (بدونِ پرشِ چیدمان: SSR عدد را
 *     از قبل دارد)؛
 *   • یک‌بار در هر mount یک beacon سبک `POST .../view/` می‌رود؛
 *   • سرور با پنجرهٔ dedupe تصمیم می‌گیرد (۶ ساعت پیش‌فرض) و عددِ تازه را
 *     برمی‌گرداند؛ اگر شمارش انجام شده باشد، عددِ نمایشی نرم بالا می‌رود؛
 *   • اگر شبکه/سرور پاسخ نداد، عددِ اولیه دست‌نخورده می‌ماند (بی‌صدا)؛
 *   • در StrictMode (mount دوباره در dev) با یک مجموعهٔ ماژول‌سطح از ارسالِ
 *     دوبارهٔ beacon برای همان اسلاگ جلوگیری می‌شود.
 * ───────────────────────────────────────────────────────────────────────────
 */

/**
 * درخواست‌های در جریان، در سطحِ ماژول نگه داشته می‌شوند.
 *
 * چرا Set کافی نبود؟ در StrictMode (dev) و در هر mount مجدد، کامپوننت
 * یک‌بار unmount و بلافاصله remount می‌شود. با یک Set ساده، mountِ دوم فکر
 * می‌کرد «قبلاً فرستاده شده» و کاری نمی‌کرد، در حالی که نتیجهٔ درخواستِ
 * mountِ اول به‌خاطر `alive=false` دور ریخته می‌شد — یعنی عدد هرگز به‌روز
 * نمی‌شد. با نگه‌داشتنِ **همان promise**، هیچ درخواستِ دومی ساخته نمی‌شود
 * و هر mount (هرچند چندبار) همان نتیجه را دریافت و اعمال می‌کند.
 */
const inflight = new Map<string, Promise<Awaited<ReturnType<typeof registerListingView>>>>();

function beaconOnce(slug: string) {
  const existing = inflight.get(slug);
  if (existing) return existing;
  const request = registerListingView(slug);
  inflight.set(slug, request);
  return request;
}

export function ListingViewCounter({
  slug,
  initialCount,
  className,
  withLabel = false,
}: {
  slug: string;
  initialCount: number;
  className?: string;
  /** نمایشِ برچسبِ «بازدید» در کنار عدد (سایدبار) یا فقط عدد (هیرو). */
  withLabel?: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [bumped, setBumped] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    beaconOnce(slug).then((result) => {
      if (!alive.current || !result) return;
      /* عددِ سرور همیشه معتبرترین است (شاملِ شمارشِ همین بیننده). */
      setCount((current) => (result.viewCount > current ? result.viewCount : current));
      if (result.counted) setBumped(true);
    });
    return () => {
      alive.current = false;
    };
  }, [slug]);

  /* انیمیشنِ کوتاهِ «+۱» فقط وقتی شمارش انجام شده باشد — بازخوردِ صادق،
     بدونِ اینکه کاربر را به کلیک/رفرش تشویق کند. */
  useEffect(() => {
    if (!bumped) return;
    const t = setTimeout(() => setBumped(false), 2200);
    return () => clearTimeout(t);
  }, [bumped]);

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 tabular-nums', className)}
      data-testid="kw-view-count"
      title="بازدیدِ یکتا (هر بازدیدکننده در هر ۶ ساعت یک‌بار)"
    >
      <Eye
        className={cn('h-3.5 w-3.5', bumped ? 'text-brand-500' : undefined)}
        aria-hidden="true"
      />
      <span className={cn('transition-colors duration-300', bumped && 'text-brand-600')}>
        {fa(count)}
        {withLabel && ' بازدید'}
      </span>
      {bumped && (
        <span
          className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-extrabold text-brand-700 ring-1 ring-brand-100"
          aria-hidden="true"
        >
          +۱
        </span>
      )}
      {/* وقتی برچسبِ دیداری نمایش داده می‌شود، تکرارِ sr-only فقط برای
          اسکرین‌ریدر «بازدیدبازدید» می‌خواند. */}
      {!withLabel && <span className="sr-only">بازدید</span>}
    </span>
  );
}
