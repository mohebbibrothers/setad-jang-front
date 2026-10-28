'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  Eye,
  Flame,
  Handshake,
  Images,
  MapPin,
  Package,
  Phone,
  Sparkles,
} from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { formatPersianNumber as fa } from '@/lib/utils';
import type { KindListing } from './KindnessSection';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessCard — کارت «نیاز» روی دیوار مهربانی (v2)
 *
 * هر کارت یک «نیاز واقعی» است (ادمین به‌نیابِ صاحب نیاز ثبت کرده). سلسله‌مراتب
 * بصری: کاور → بج فوریت/ویژگی + روزهای مانده → چیپ دسته (با ایموجی ادمین) →
 * عنوان → چکیده → مقدار/موقعیت → اثبات اجتماعی (اعلام‌های آمادگی) → CTA.
 *
 * قهرمان کارت دکمه‌ی «راه‌های ارتباط» است (همان چیزی که کل سناریو حولش
 * می‌چرخد) — گرادیانت برند مثل خانوادهٔ CTA حرکت‌ها. گالری دوم‌هاست، نه اول.
 * ───────────────────────────────────────────────────────────────────────────
 */

export function KindnessCard({
  l,
  delay = 0,
  onContact,
  onAlbum,
}: {
  l: KindListing;
  delay?: number;
  onContact: (l: KindListing) => void;
  onAlbum: (l: KindListing) => void;
}) {
  const urgent = l.urgency === 'urgent';
  const expiringSoon = l.daysLeft !== null && l.daysLeft <= 14;
  const location = [l.city, l.province].filter(Boolean).join('، ') || 'سراسر کشور';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay }}
      /* همان ریتم ستونی خانواده‌ی صفحه: ۱/۲/۳ ستونه + وسط‌چینی یتیم‌ها */
      className="group isolate flex w-full min-w-0 flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.22)] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
      data-testid="kw-card"
      data-urgent={urgent || undefined}
    >
      {/* کاور — ضربه = گالری تصاویر (lazy از جزئیات) */}
      <button
        type="button"
        onClick={() => onAlbum(l)}
        className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden bg-ink-100 text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label={`نمایش آلبوم تصاویر ${l.title}`}
      >
        <SmartImage
          src={l.coverImage}
          alt={l.title}
          variant="kindness"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        />

        {/* بج فوریت — یا بج «ویژه» (featured ثبیتِ بالای دیوار از سمت بک) */}
        {urgent ? (
          <span className="kw-urgent-pulse absolute right-3 top-3 z-10 inline-flex h-8 items-center gap-1.5 rounded-2xl bg-gradient-to-l from-[#f43f5e] to-[#e11d48] px-3 text-[11.5px] font-extrabold text-white ring-[2.5px] ring-black/10">
            <Flame className="h-3.5 w-3.5" />
            فوری
          </span>
        ) : l.isFeatured ? (
          <span className="absolute right-3 top-3 z-10 inline-flex h-8 items-center gap-1.5 rounded-2xl bg-gradient-to-l from-brand-500 to-brand-700 px-3 text-[11.5px] font-extrabold text-white ring-[2.5px] ring-black/10">
            <Sparkles className="h-3.5 w-3.5" />
            ویژه
          </span>
        ) : null}

        {/* روزهای مانده تا انقضا */}
        {expiringSoon && (
          <span className="absolute left-3 top-3 z-10 inline-flex h-7 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11px] font-extrabold tabular-nums text-amber-700 shadow-soft backdrop-blur-md">
            <Clock className="h-3 w-3" />
            {l.daysLeft === 0 ? 'آخرین روز' : `${fa(l.daysLeft ?? 0)} روز مانده`}
          </span>
        )}

        {/* چیپ دسته با ایموجیِ ادمین‌محور */}
        {l.categoryTitle && (
          <span className="absolute bottom-3 right-3 z-10 inline-flex h-6 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11px] font-extrabold text-ink-700 shadow-soft backdrop-blur-md">
            {l.categoryIcon && (
              <span aria-hidden="true" className="text-[12px] leading-none">
                {l.categoryIcon}
              </span>
            )}
            {l.categoryTitle}
          </span>
        )}
      </button>

      {/* بدنه */}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3
          className="line-clamp-2 min-h-[3.25rem] text-[14.5px] font-extrabold leading-7 text-ink-900 md:text-[15px]"
          title={l.title}
        >
          {l.title}
        </h3>

        {l.excerpt && (
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[12px] font-medium leading-5 text-ink-500">
            {l.excerpt}
          </p>
        )}

        {/* مقدار + موقعیت */}
        <div className="mt-3 flex items-center justify-between gap-2 text-[12px] font-bold text-ink-500">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-50 px-2.5 py-1 ring-1 ring-ink-100">
            <Package className="h-3.5 w-3.5 text-brand-500" />
            <span className="tabular-nums">{`${fa(l.quantity)} ${l.unit}`}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
            <span className="truncate">{location}</span>
          </span>
        </div>

        {/* اثبات اجتماعی + بازدید */}
        <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-[11.5px] font-bold tabular-nums">
          {l.openOffersCount && l.openOffersCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-mint-600">
              <Handshake className="h-3.5 w-3.5" />
              {`${fa(l.openOffersCount)} نفر آماده‌ی کمک‌اند`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-ink-400">
              <Handshake className="h-3.5 w-3.5" />
              اولین نفرِ کمک شو
            </span>
          )}
          {typeof l.viewCount === 'number' && l.viewCount > 0 && (
            <span className="inline-flex items-center gap-1 text-ink-400">
              <Eye className="h-3.5 w-3.5" />
              {fa(l.viewCount)}
            </span>
          )}
        </div>

        {/* اکشن‌ها — راه‌های ارتباط قهرمان است */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onContact(l)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-[13px] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-[1.08] active:scale-[0.985]"
          >
            <Phone className="h-3.5 w-3.5" />
            راه‌های ارتباط
          </button>
          <button
            type="button"
            onClick={() => onAlbum(l)}
            aria-label={`گالری تصاویر ${l.title}`}
            title="گالری تصاویر"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <Images className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
