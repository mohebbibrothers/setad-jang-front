'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * RevayatCard — کارتِ پستِ فیدِ «روایت‌ها» (الهام‌گرفته از اینستاگرام)
 *
 * ساختارِ هر پست (راست‌به‌چپ):
 *   سربرگ   → آواتارِ گرادیانی (حرفِ اولِ نام)، نامِ نمایشی، چیپِ
 *             «مردمی»، چیپِ قابل‌کلیکِ مکان (شهر) + زمانِ نسبی، و
 *             تگِ نوع (ویدئو/تصویر/صوت/متن) با آیکون.
 *   رسانه   → بر اساس نوعِ مؤثر: سینمای ویدئو با پوسترِ GIF و پخشِ
 *             درون‌خطی (توقفِ خودکار هنگام خروج از دید)، گالریِ عکس با
 *             پس‌زمینه‌ی محو، پنلِ پادکست با کاور، یا کارتِ نقل‌قولِ
 *             نوشته. شکستِ لود → پنلِ برندشده + «بارگذاری دوباره»
 *             (همان زبانِ تاب‌ماندگاریِ صفحه‌ی جزئیات).
 *   کنش‌ها  → اشتراک‌گذاری (native share با فروافتِ کپی)، چیپ‌های
 *             متا (مدت/ابعاد/حجم/زمانِ مطالعه)، کپشنِ قابل‌بسط،
 *             تاریخِ جلالی و لینک «تماشای کامل» به صفحه‌ی جزئیات.
 *
 * قاعده‌ی طلایی: هیچ نشانیِ بیرونی (منبع) رندر نمی‌شود؛ فقط رسانه‌های
 * خودِ دیتابیس. تاریخ‌ها با ساعتِ فارسیِ پروژه، digits فارسی.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  AudioLines,
  Check,
  FileDown,
  Image as ImageIcon,
  MapPin,
  Music2,
  PenLine,
  Play,
  Share2,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatJalaliDate, formatRelativeFa } from '@/lib/persian-time';
import {
  formatClockFa,
  formatDimensionsFa,
  formatFileSizeFa,
  videoThumbnailGifUrl,
} from '@/lib/media-meta';
import { asText } from '@/lib/tabyin-attachments';
import { contentKindTagFa, type ContentKind } from '@/lib/media-meta';
import {
  feedItemKind,
  heroOfFeedItem,
  initialOf,
  parseAuthor,
  readTimeFa,
  type RevayatItem,
} from '@/lib/revayat';
import { bustUrl, FadeImg, StageUnavailable } from '@/components/tabyin/TabyinStage';

/* ── آیکون و لحنِ هر نوع ── */
const KIND_META: Record<ContentKind, { Glyph: typeof Video; chip: string }> = {
  video: { Glyph: Video, chip: 'bg-brand-50 text-brand-700 ring-brand-600/10' },
  image: { Glyph: ImageIcon, chip: 'bg-mint-500/15 text-mint-700 ring-mint-500/25' },
  audio: { Glyph: AudioLines, chip: 'bg-ink-900 text-white ring-ink-900/10' },
  other: { Glyph: PenLine, chip: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
};

/* ── ویدئوی فید: پخشِ درون‌خطی + توقفِ خودکارِ بیرونِ دید ── */
function FeedVideo({
  src,
  poster,
  onBroken,
}: {
  src: string;
  poster?: string;
  onBroken: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  /* وقتی کارت از دید خارج می‌شود، ویدئو مکث می‌کند تا فید آرام بماند */
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) el.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  return (
    <div className="relative overflow-hidden bg-black">
      <video
        key={src}
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        preload="none"
        controls={playing}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={onBroken}
        className="mx-auto max-h-[68vh] w-full object-contain"
      />
      {!playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label="پخش ویدئو"
          className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/35 via-transparent to-black/20 transition-colors hover:bg-black/20"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-[0_16px_40px_-10px_rgba(0,0,0,.55)] ring-4 ring-white/25 backdrop-blur transition-transform duration-300 hover:scale-105 active:scale-95">
            <Play className="h-6 w-6 translate-x-[-2px]" />
          </span>
        </button>
      )}
    </div>
  );
}

/* ── پادکستِ فید: پنلِ برندِ جمع‌وجور ── */
function FeedAudio({
  src,
  cover,
  title,
  onBroken,
  onCoverBroken,
  coverBroken,
}: {
  src: string;
  cover?: string;
  title: string;
  onBroken: () => void;
  onCoverBroken: () => void;
  coverBroken: boolean;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 px-5 py-6 text-white">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 right-1/3 h-44 w-44 rounded-full bg-mint-400/20 blur-3xl"
      />
      <div className="relative flex items-center gap-4">
        {cover && !coverBroken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={title || 'کاور پادکست'}
            loading="lazy"
            decoding="async"
            onError={onCoverBroken}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-[0_14px_30px_-12px_rgba(0,0,0,.5)] ring-2 ring-white/25"
          />
        ) : (
          <span className="bg-white/12 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-2 ring-white/25 backdrop-blur-sm">
            <Music2 className="h-7 w-7 text-white/85" strokeWidth={1.6} />
          </span>
        )}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-extrabold backdrop-blur-sm">
            <AudioLines className="h-3 w-3" />
            پادکست
          </span>
          {title ? (
            <p className="mt-2 line-clamp-2 text-[13.5px] font-extrabold leading-6 text-white/95">
              {title}
            </p>
          ) : null}
        </div>
      </div>
      <audio
        key={src}
        src={src}
        controls
        preload="metadata"
        onError={onBroken}
        className="relative mt-4 w-full rounded-xl"
      />
    </div>
  );
}

export function RevayatCard({
  item,
  onLocationClick,
}: {
  item: RevayatItem;
  onLocationClick?: (location: string) => void;
}) {
  const kind = feedItemKind(item);
  const { hero, image } = heroOfFeedItem(item);
  const { name, location } = parseAuthor(item.author_username);
  const title = asText(item.title).trim();
  const caption = asText(item.description).trim();
  const detailHref = `/tabyin/${encodeURIComponent(item.external_id)}`;
  const isUser = item.origin === 'user_submitted';

  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [broken, setBroken] = useState<Record<string, true>>({});
  const [retryTick, setRetryTick] = useState<Record<string, number>>({});

  const markBroken = (url: string) => setBroken((m) => (m[url] ? m : { ...m, [url]: true }));
  const retry = (url: string) => () => {
    setBroken((m) => {
      const next = { ...m };
      delete next[url];
      return next;
    });
    setRetryTick((m) => ({ ...m, [url]: (m[url] ?? 0) + 1 }));
  };

  const heroUrl = hero?.url ?? '';
  const heroBroken = heroUrl ? Boolean(broken[heroUrl]) : false;
  const coverBroken = image?.url ? Boolean(broken[image.url]) : false;
  const mediaSrc = heroUrl ? bustUrl(heroUrl, retryTick[heroUrl] ?? 0) : '';

  const share = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/tabyin/${encodeURIComponent(item.external_id)}`
        : detailHref;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: title || 'روایت از جهاد تبیین', url });
        return;
      } catch {
        /* کاربر لغو کرد — سکوت */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* کلیپ‌برد در دسترس نیست — سکوت */
    }
  };

  /* چیپ‌های متا — فقط مقادیرِ موجود */
  const metaChips = [
    kind === 'other'
      ? readTimeFa(caption || title)
      : (formatClockFa(hero?.duration) ??
        formatDimensionsFa(hero?.size) ??
        formatFileSizeFa(hero?.file_size)),
    kind === 'other' ? null : formatFileSizeFa(hero?.file_size),
  ].filter((c): c is string => Boolean(c));

  const kindMeta = KIND_META[kind];
  const showCaptionInPanel = kind === 'other' && Boolean(caption);
  const longCaption = caption.split('\n').join(' ').length > 180 || caption.split('\n').length > 4;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full break-inside-avoid overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_2px_16px_-8px_rgba(15,20,32,.08)] ring-1 ring-black/[0.02] lg:mb-6"
    >
      {/* ── سربرگِ پست ── */}
      <header className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-[15px] font-black text-white shadow-[0_6px_16px_-6px_rgba(13,128,116,.5)] ring-2 ring-white"
        >
          {initialOf(name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13.5px] font-extrabold text-ink-900">
              {name || 'روایتگر تبیین'}
            </p>
            {isUser && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-mint-500/15 px-2 py-0.5 text-[10px] font-extrabold text-mint-700 ring-1 ring-inset ring-mint-500/25">
                مردمی
              </span>
            )}
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-ink-400">
            {location ? (
              <button
                type="button"
                onClick={() => onLocationClick?.(location)}
                className="inline-flex min-w-0 items-center gap-1 truncate text-brand-700 transition-colors hover:text-brand-800 hover:underline"
                aria-label={`فیلتر بر اساس ${location}`}
              >
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </button>
            ) : null}
            {location && item.source_created_at ? <span aria-hidden="true">·</span> : null}
            {item.source_created_at ? (
              <span className="shrink-0">{formatRelativeFa(item.source_created_at)}</span>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            'inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-extrabold ring-1 ring-inset',
            kindMeta.chip,
          )}
        >
          <kindMeta.Glyph className="h-3 w-3" />
          {contentKindTagFa(kind)}
        </span>
      </header>

      {/* ── رسانه ── */}
      {heroBroken ? (
        <div className="px-3 pb-1 sm:px-4">
          <StageUnavailable kind={kind === 'other' ? undefined : kind} onRetry={retry(heroUrl)} />
        </div>
      ) : kind === 'video' && heroUrl ? (
        <FeedVideo
          src={mediaSrc}
          poster={videoThumbnailGifUrl(heroUrl)}
          onBroken={() => markBroken(heroUrl)}
        />
      ) : kind === 'image' && heroUrl ? (
        <Link
          href={detailHref}
          className="bg-ink-950 relative block overflow-hidden"
          aria-label={title || 'مشاهده‌ی روایت'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaSrc}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          <FadeImg
            src={mediaSrc}
            alt={title || 'روایت تصویری'}
            onError={() => markBroken(heroUrl)}
            className="relative mx-auto max-h-[68vh] w-auto max-w-full object-contain"
          />
        </Link>
      ) : kind === 'audio' && heroUrl ? (
        <FeedAudio
          src={mediaSrc}
          cover={image?.url}
          title={title}
          coverBroken={coverBroken}
          onCoverBroken={() => image?.url && markBroken(image.url)}
          onBroken={() => markBroken(heroUrl)}
        />
      ) : (
        /* نوشته (یا فایلِ سایر): پنلِ نقل‌قولِ برند — متن، ستاره‌ی کارت است */
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-6 py-8 text-white sm:px-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-14 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl"
          />
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="relative h-7 w-7 text-white/45"
          >
            <path d="M7.17 6C4.31 6 2 8.31 2 11.17v6.66h6.66v-6.66H5c0-1.84 1.49-3.33 3.33-3.33V6H7.17zm10 0c-2.86 0-5.17 2.31-5.17 5.17v6.66h6.66v-6.66H15c0-1.84 1.49-3.33 3.33-3.33V6h-1.16z" />
          </svg>
          <p
            className={cn(
              'relative mt-3 whitespace-pre-line text-[14.5px] font-bold leading-8 text-white/95',
              !expanded && 'line-clamp-6',
            )}
          >
            {caption || title || 'روایتِ جهاد تبیین'}
          </p>
          {longCaption && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="relative mt-3 text-[12px] font-extrabold text-white/85 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white"
            >
              {expanded ? 'نمایش کمتر' : 'ادامه‌ی نوشته'}
            </button>
          )}
        </div>
      )}

      {/* ── کنش‌ها + متن ── */}
      <div className="px-4 pt-3 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={share}
              aria-label={copied ? 'پیوند کپی شد' : 'اشتراک‌گذاری روایت'}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90',
                copied
                  ? 'bg-mint-500/15 text-mint-700'
                  : 'text-ink-500 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              {copied ? (
                <Check className="h-[18px] w-[18px]" />
              ) : (
                <Share2 className="h-[18px] w-[18px]" />
              )}
            </button>
            {kind === 'other' && heroUrl ? (
              <a
                href={heroUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="دریافت فایلِ پیوست"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-all hover:bg-brand-50 hover:text-brand-700 active:scale-90"
              >
                <FileDown className="h-[18px] w-[18px]" />
              </a>
            ) : null}
          </div>
          {metaChips.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {metaChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex h-7 items-center rounded-full bg-ink-50 px-2.5 text-[11px] font-bold tabular-nums text-ink-600 ring-1 ring-inset ring-ink-900/[0.04]"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {title && kind !== 'other' ? (
          <h2 className="mt-2 text-[15px] font-black leading-7 text-ink-900">{title}</h2>
        ) : null}

        {caption && !showCaptionInPanel ? (
          <p
            className={cn(
              'mt-1.5 whitespace-pre-line text-[13.5px] leading-7 text-ink-700',
              !expanded && 'line-clamp-3',
            )}
          >
            {caption}
          </p>
        ) : null}
        {caption && !showCaptionInPanel && longCaption ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[12px] font-extrabold text-brand-700 transition-colors hover:text-brand-800"
          >
            {expanded ? 'کمتر' : 'بیشتر'}
          </button>
        ) : null}

        <div className="mt-3 flex items-center justify-between pb-4">
          {item.source_created_at ? (
            <time
              dateTime={item.source_created_at}
              className="text-[11px] font-semibold text-ink-400"
            >
              {formatJalaliDate(item.source_created_at)}
            </time>
          ) : (
            <span />
          )}
          <Link
            href={detailHref}
            className="group inline-flex items-center gap-1 text-[12.5px] font-extrabold text-brand-700 transition-colors hover:text-brand-800"
          >
            تماشای کامل
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
