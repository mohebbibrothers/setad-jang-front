'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * TabyinStage — استیجِ چندحالته‌ی رسانه در صفحه‌ی جزئیاتِ جهاد تبیین
 *
 * به‌جای یک قابِ ثابت برای همه‌چیز، هر نوع رسانه تجربه‌ی خودش را دارد:
 *
 *   ویدئو  → سینما: قابِ مشکیِ سینمایی + پلیرِ بومی با پوسترِ GIF
 *   تصویر  → گالری: تصویر روی پس‌زمینه‌ی محو‌شده از خودِ تصویر
 *   پادکست → پنلِ برند با کاور (اگر پیوستِ تصویری هست)، اکولایزرِ
 *            زنده و پلیر — برچسبِ کانونیکالِ این حالت «پادکست» است
 *   سایر   → کارتِ دریافتِ فایل
 *
 * چند پیوست → نوارِ بندانگشتیِ قابلِ جابه‌جایی (snap) زیرِ استیج.
 * چیپ‌های ابرداده (مدت/ابعاد/حجم) — فقط وقتی مقدار دارند.
 *
 * ── تاب‌ماندگاری (قراردادِ جدید) ──
 *   اگر لودِ هر رسانه‌ای — به هر دلیل (قطعیِ لحظه‌ایِ شبکه، 404ِ فایل،
 *   CORS، codec) — شکست بخورد، به‌جای قابِ شکسته‌ی مرورگر یک پنلِ
 *   برندشده‌ی «رسانه فعلاً در دسترس نیست» با دکمه‌ی «بارگذاری دوباره»
 *   (با cache-bust واقعی) نمایش داده می‌شود؛ نوارِ بندانگشتی فعال
 *   می‌ماند تا کاربر بتواند به پیوستِ دیگری برود. کاورِ پادکست و
 *   بندانگشتی‌هایی که لود نشوند به آیکونِ برند فرو می‌افتند. حتی در
 *   بدترین سناریو هم صفحه از وقار نمی‌افتد.
 *
 * قاعده‌ی طلاییِ کارفرما: این کامپوننت هیچ نشانیِ بیرونی (منبع) رندر
 * نمی‌کند؛ فقط رسانه‌های خودِ دیتابیس.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AudioLines,
  FileDown,
  FileWarning,
  Image as ImageIcon,
  ImageOff,
  MicOff,
  Music2,
  Play,
  RefreshCw,
  VideoOff,
} from 'lucide-react';
import {
  formatClockFa,
  formatDimensionsFa,
  formatFileSizeFa,
  videoThumbnailGifUrl,
} from '@/lib/media-meta';
import { cn } from '@/lib/utils';

export interface TabyinStageAttachment {
  id?: number;
  url: string;
  media_type?: 'image' | 'video' | 'audio' | 'other';
  media_type_display?: string;
  duration?: number;
  file_size?: number;
  size?: string;
  title?: string;
}

/** انتخابِ هوشمندِ پیوستِ اولیه: ویدئو > پادکست > تصویر > اولین فایل */
function pickInitial(list: TabyinStageAttachment[]): number {
  const find = (t: string) => list.findIndex((a) => a.media_type === t);
  const order = [find('video'), find('audio'), find('image')];
  const idx = order.find((i) => i >= 0);
  return idx !== undefined && idx >= 0 ? idx : 0;
}

/* نوارهای اکولایزر — ارتفاع‌ها و تاخیرها موجِ زنده می‌سازند */
const EQ_BARS = [
  { h: 22, d: '0s' },
  { h: 34, d: '.12s' },
  { h: 26, d: '.24s' },
  { h: 40, d: '.06s' },
  { h: 18, d: '.3s' },
  { h: 30, d: '.18s' },
  { h: 24, d: '.36s' },
];

/* ───────────────────────────────────────────────────────────────── */
/*  تاب‌ماندگاریِ رسانه                                               */
/* ───────────────────────────────────────────────────────────────── */

/**
 * cache-bust برای «بارگذاری دوباره»: با یک پارامترِ بی‌اثر، فایل واقعاً
 * دوباره از شبکه درخواست می‌شود (نه از کشِ خرابِ مرورگر).
 */
function bustUrl(url: string, tick: number): string {
  if (!tick) return url;
  return url + (url.includes('?') ? '&' : '?') + '_tabyin_retry=' + tick;
}

/**
 * تصویر با ورودِ نرم (fade-in پس از لود کامل) + گزارشِ خطا به بالادست.
 * کلید (key) آن در محلِ استفاده به نشانی بسته می‌شود تا با تعویض پیوست
 * یا تلاشِ دوباره، state درونی‌اش تازه شود.
 */
function FadeImg({
  src,
  alt,
  className,
  hidden,
  loading = 'lazy',
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  hidden?: boolean;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      aria-hidden={hidden || undefined}
      loading={loading}
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={onError}
      className={cn(
        className,
        'transition-opacity duration-500',
        loaded ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}

/**
 * پنلِ «رسانه فعلاً در دسترس نیست» — عمداً به اندازه‌ی خودِ استیج
 * طراحی شده تا حتی خطا هم لحظه‌ای برندساز باشد، نه شکستی نمایشی.
 * متن و مشخصاتِ صفحه بیرون از این پنل دست‌نخورده باقی می‌مانند.
 */
function StageUnavailable({
  kind,
  onRetry,
}: {
  kind: TabyinStageAttachment['media_type'];
  onRetry: () => void;
}) {
  const { Glyph, label } =
    kind === 'video'
      ? { Glyph: VideoOff, label: 'ویدئو' }
      : kind === 'audio'
        ? { Glyph: MicOff, label: 'پادکست' }
        : kind === 'image'
          ? { Glyph: ImageOff, label: 'تصویر' }
          : { Glyph: FileWarning, label: 'این فایل' };
  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 px-6 py-10 text-center text-white shadow-[0_30px_70px_-35px_rgba(11,53,48,.65)] ring-1 ring-brand-800/40 sm:px-10 sm:py-12"
    >
      {/* عمقِ نوریِ لایه‌ای */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-400/15 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-mint-400/15 blur-3xl"
      />
      {/* بافتِ نقطه‌ایِ ظریف */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="relative mx-auto flex max-w-sm flex-col items-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-2 ring-white/20 backdrop-blur-sm">
          <Glyph className="h-9 w-9 text-white/90" strokeWidth={1.7} />
        </span>
        <p className="mt-5 text-[16px] font-black sm:text-[17px]">{label} فعلاً در دسترس نیست</p>
        <p className="mt-2.5 text-[12.5px] font-semibold leading-7 text-white/70">
          شاید اتصال لحظه‌ای قطع شده یا فایل هنوز آماده نشده است؛ با یک تلاشِ دوباره معمولاً
          برمی‌گردد. متن و مشخصاتِ همین صفحه در دسترس شماست.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[13px] font-extrabold text-brand-800 shadow-[0_12px_30px_-10px_rgba(0,0,0,.5)] transition-all hover:scale-[1.03] hover:bg-mint-50 active:scale-[.97]"
        >
          <RefreshCw className="h-4 w-4" />
          بارگذاری دوباره
        </button>
      </div>
    </div>
  );
}

export function TabyinStage({
  attachments,
  title,
  originLabel,
}: {
  attachments: TabyinStageAttachment[];
  title: string;
  /** برچسبی که روی پنلِ پادکست می‌نشیند (مثلاً «جهاد تبیین») */
  originLabel?: string;
}) {
  const usable = useMemo(() => attachments.filter((a) => a.url), [attachments]);
  const [index, setIndex] = useState(() => pickInitial(usable));
  const [playing, setPlaying] = useState(false);
  /* تاب‌ماندگاری: نشانی‌هایی که لودشان شکست خورد + شمارنده‌ی تلاشِ دوباره. */
  const [broken, setBroken] = useState<Record<string, true>>({});
  const [retryTick, setRetryTick] = useState<Record<string, number>>({});

  if (usable.length === 0) return null;

  const selected = usable[Math.min(index, usable.length - 1)];
  const tick = retryTick[selected.url] ?? 0;
  const mediaSrc = bustUrl(selected.url, tick);
  const selectedBroken = Boolean(broken[selected.url]);

  const markBroken = (url: string) => setBroken((m) => (m[url] ? m : { ...m, [url]: true }));
  const retrySelected = () => {
    setBroken((m) => {
      if (!m[selected.url]) return m;
      const next = { ...m };
      delete next[selected.url];
      return next;
    });
    setRetryTick((m) => ({ ...m, [selected.url]: (m[selected.url] ?? 0) + 1 }));
  };

  // کاورِ پادکست: اگر پیوستِ فعال صوت است و پیوستِ تصویری هم هست، از آن
  // به‌عنوان آرت‌ورک استفاده می‌کنیم (نکته‌ی کارفرما درباره‌ی پادکست‌ها).
  // اگر کاور لود نشود، بی‌سروصدا به دیسکِ برند فرو می‌افتیم — پنل نمی‌شکند.
  const audioCover =
    selected.media_type === 'audio' ? usable.find((a) => a.media_type === 'image')?.url : undefined;
  const coverBroken = audioCover ? Boolean(broken[audioCover]) : false;

  const metaChips = [
    formatClockFa(selected.duration),
    formatDimensionsFa(selected.size),
    formatFileSizeFa(selected.file_size),
  ].filter((c): c is string => Boolean(c));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* ── استیج ── */}
      {selectedBroken ? (
        <StageUnavailable kind={selected.media_type} onRetry={retrySelected} />
      ) : selected.media_type === 'video' ? (
        <div className="overflow-hidden rounded-[24px] bg-black shadow-[0_30px_70px_-35px_rgba(11,53,48,.6)] ring-1 ring-ink-900/10">
          <video
            key={mediaSrc}
            src={mediaSrc}
            poster={videoThumbnailGifUrl(selected.url)}
            controls
            playsInline
            preload="metadata"
            onError={() => markBroken(selected.url)}
            className="mx-auto max-h-[68dvh] w-full bg-black object-contain"
          />
        </div>
      ) : selected.media_type === 'image' ? (
        <div className="bg-ink-950 relative overflow-hidden rounded-[24px] shadow-[0_30px_70px_-35px_rgba(11,53,48,.6)] ring-1 ring-ink-900/10">
          {/* پس‌زمینه‌ی محو از خودِ تصویر — قابِ گالری‌وار.
              plain <img>: پس‌زمینه‌ی تزئینی است و خطایش از رویِ تصویرِ
              اصلی (که همان نشانی است) شناسایی می‌شود. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          <FadeImg
            key={mediaSrc}
            src={mediaSrc}
            alt={title || 'محتوای تبیین'}
            loading="eager"
            onError={() => markBroken(selected.url)}
            className="relative mx-auto max-h-[68dvh] w-auto max-w-full object-contain"
          />
        </div>
      ) : selected.media_type === 'audio' ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-[24px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 p-6 text-white shadow-[0_30px_70px_-30px_rgba(13,128,116,.6)] ring-1 ring-brand-800/30 sm:p-8',
            playing && 'eq-playing',
          )}
        >
          {/* عمقِ نوریِ لایه‌ای */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-mint-400/20 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-stretch sm:gap-7 sm:text-right">
            {/* آرت‌ورک: کاورِ واقعیِ پیوستِ تصویری، یا دیسکِ برند */}
            <div className="relative shrink-0">
              {audioCover && !coverBroken ? (
                <FadeImg
                  key={audioCover}
                  src={audioCover}
                  alt={title || 'کاور پادکست'}
                  onError={() => markBroken(audioCover)}
                  className="h-36 w-36 rounded-2xl object-cover shadow-[0_20px_45px_-18px_rgba(0,0,0,.5)] ring-2 ring-white/25 sm:h-44 sm:w-44"
                />
              ) : (
                <span className="bg-white/12 flex h-36 w-36 items-center justify-center rounded-2xl ring-2 ring-white/25 backdrop-blur-sm sm:h-44 sm:w-44">
                  <Music2 className="h-16 w-16 text-white/85" strokeWidth={1.6} />
                </span>
              )}
              <span className="absolute -bottom-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-mint-500 px-2.5 py-1 text-[10.5px] font-extrabold shadow-[0_6px_16px_-6px_rgba(37,197,186,.7)]">
                <AudioLines className="h-3 w-3" />
                پادکست
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                {/* اکولایزر — هنگام پخش نفس می‌کشد */}
                <span aria-hidden="true" className="flex h-10 items-end gap-1">
                  {EQ_BARS.map((b, i) => (
                    <span
                      key={i}
                      className="eq-bar bg-white/80"
                      style={{ height: b.h, animationDelay: b.d }}
                    />
                  ))}
                </span>
                <span className="text-[12.5px] font-extrabold text-white/85">
                  {originLabel || 'جهاد تبیین'}
                </span>
              </div>
              {title ? (
                <p className="line-clamp-2 text-[16px] font-extrabold leading-7 sm:text-[17px]">
                  {title}
                </p>
              ) : null}
              <audio
                key={mediaSrc}
                src={mediaSrc}
                controls
                preload="metadata"
                onError={() => markBroken(selected.url)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      ) : (
        /* سایر فایل‌ها: کارتِ دریافت (فعال‌سازی دستیِ کاربر) */
        <a
          href={selected.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 rounded-[24px] border border-ink-100 bg-gradient-to-l from-brand-50/70 to-white p-6 ring-1 ring-black/[0.03] transition-all hover:border-brand-500/40 hover:shadow-[0_20px_45px_-25px_rgba(13,128,116,.45)] sm:p-7"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-700">
              <FileDown className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-[14px] font-extrabold text-ink-900">
                {selected.title || title || 'فایل پیوست'}
              </span>
              <span className="mt-0.5 block text-[12px] font-semibold text-ink-500">
                فایل برای مشاهده یا دریافت
              </span>
            </span>
          </span>
          <span className="text-[12.5px] font-extrabold text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors group-hover:text-brand-800">
            بازکردن فایل
          </span>
        </a>
      )}

      {/* ── چیپ‌های ابرداده‌ی پیوستِ فعال — فقط آنچه مقدار دارد ── */}
      {metaChips.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {metaChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex h-8 items-center rounded-full bg-ink-50 px-3 text-[12px] font-bold tabular-nums text-ink-600 ring-1 ring-inset ring-ink-900/[0.04]"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {/* ── نوارِ بندانگشتی (وقتی بیش از یک پیوست هست) ──
          p-1.5 دور تا دور: رینگِ فعال (2.5px) + آفستِ آن (2px) برای نفس
          کشیدن جا دارد و دیگر لبه‌هایش با overflow برش نمی‌خورد — باگِ
          گزارش‌شده‌ی «آیکون‌های کناری ناقص/کات‌شده» همین بود. */}
      {usable.length > 1 ? (
        <div
          className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto p-1.5"
          role="tablist"
          aria-label="پیوست‌ها"
        >
          {usable.map((att, i) => {
            const active = i === index;
            const isVideo = att.media_type === 'video';
            const isImage = att.media_type === 'image';
            const thumb = isImage ? att.url : isVideo ? videoThumbnailGifUrl(att.url) : undefined;
            const thumbBroken = thumb ? Boolean(broken[thumb]) : false;
            const attBroken = Boolean(broken[att.url]);
            return (
              <button
                key={(att.id ?? i) + '-' + att.url}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`نمایش پیوست ${i + 1}`}
                onClick={() => {
                  setIndex(i);
                  setPlaying(false);
                }}
                className={cn(
                  'group relative h-16 w-16 shrink-0 snap-start overflow-hidden rounded-xl transition-all duration-200 sm:h-[72px] sm:w-[72px]',
                  active
                    ? 'ring-[2.5px] ring-brand-500 ring-offset-2'
                    : 'opacity-75 ring-1 ring-ink-200 hover:opacity-100 hover:ring-brand-300',
                )}
              >
                {thumb && !thumbBroken ? (
                  <FadeImg
                    key={thumb}
                    src={thumb}
                    alt=""
                    onError={() => markBroken(thumb)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                    {att.media_type === 'audio' ? (
                      <Music2 className="h-5 w-5" />
                    ) : att.media_type === 'video' ? (
                      <Play className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </span>
                )}
                {isVideo ? (
                  <span className="absolute bottom-1 left-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
                    <Play className="h-2.5 w-2.5" />
                  </span>
                ) : null}
                {/* نشانِ «لود نشد»: بندانگشتیِ پیوستِ شکست‌خورده با هشدارِ
                    ظریف دیده می‌شود تا کاربر بفهمد کدام پیوست مشکل دارد. */}
                {attBroken ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center bg-ink-900/55"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </motion.div>
  );
}
