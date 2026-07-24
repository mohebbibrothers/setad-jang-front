'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SmartImage — universal image loader with a designer-grade fallback.
 *
 *  Why this exists
 *  ───────────────
 *  next/image renders the browser's default "broken image" icon when a
 *  URL fails to load — a bare grey square that shatters the visual
 *  consistency of the site. Backend uploads on a fresh deploy, VPN /
 *  proxy hiccups, expired signed URLs, malformed media paths, or a
 *  simple 404 can all trip that fallback several times per page load
 *  on a fresh session. SmartImage wraps next/image and:
 *
 *   1. Shows a shimmering skeleton while the image is decoding, so the
 *      layout is never a flat empty rectangle.
 *   2. On error (or when no src was provided at all) swaps in a
 *      branded placeholder — a soft brand-tinted gradient with a
 *      subtle dot texture and a centred glyph derived from the
 *      `variant` prop (image / avatar / campaign / criminal / course /
 *      kindness / tabyin). Every placeholder feels like it BELONGS on
 *      the page instead of screaming "something broke".
 *   3. Preserves next/image's `fill` layout + `sizes` prop so it drops
 *      in as a 1-for-1 replacement wherever we already use next/image.
 *
 *  Every visual token (colour, glyph size, corner radius) is inherited
 *  from the parent container — SmartImage never sets its own rounded
 *  corners or margins, so it slots into any card / avatar / hero /
 *  cover we already ship without visual regressions.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import Image, { type ImageProps } from 'next/image';
import { useState, useEffect, useMemo } from 'react';

export type SmartImageVariant =
  | 'image'      // generic photograph
  | 'avatar'     // user portrait
  | 'campaign'   // madadkar cover
  | 'criminal'   // r4j portrait
  | 'course'     // lms cover
  | 'kindness'   // dude/dude help listing cover
  | 'tabyin';    // tabyin content thumbnail

type Base = Omit<ImageProps, 'src' | 'alt' | 'onError' | 'onLoad' | 'onLoadingComplete'>;

export type SmartImageProps = Base & {
  /** URL to fetch. When falsy, the placeholder is shown immediately. */
  src?: string | null;
  /** Alt text — required for a11y. */
  alt: string;
  /** Visual family for the fallback glyph + palette. */
  variant?: SmartImageVariant;
  /** When true, we skip the shimmer entirely (useful for tiny 24px
   *  thumbnails where the pulse looks noisier than the image itself). */
  quietSkeleton?: boolean;
  /** Extra class merged with the wrapper (relative + full-size by
   *  default so the parent can rely on the same box that next/image
   *  would occupy). */
  wrapperClassName?: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Glyph atlas — one inline SVG per variant, no icon library needed         */
/* ───────────────────────────────────────────────────────────────────────── */

function VariantGlyph({ variant, className }: { variant: SmartImageVariant; className: string }) {
  const common = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    className, 'aria-hidden': true,
  };
  switch (variant) {
    case 'avatar':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    case 'campaign':
      return (
        <svg {...common}>
          <path d="M3 11v2a4 4 0 0 0 4 4h2l5 4V3L9 7H7a4 4 0 0 0-4 4z" />
        </svg>
      );
    case 'criminal':
      return (
        <svg {...common}>
          <path d="m14.5 12.5-8 8a2.1 2.1 0 1 1-3-3l8-8" />
          <path d="m16 16 6-6" /><path d="m8 8 6-6" />
          <path d="m9 7 8 8" /><path d="M21 11 13 3" />
        </svg>
      );
    case 'course':
      return (
        <svg {...common}>
          <path d="M22 10v6" />
          <path d="M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 1.7 4 3 6 3s6-1.3 6-3v-5" />
        </svg>
      );
    case 'kindness':
      return (
        <svg {...common}>
          <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
        </svg>
      );
    case 'tabyin':
      return (
        <svg {...common}>
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case 'image':
    default:
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="1.8" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      );
  }
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Palette per variant — soft brand tints, never grey                        */
/* ───────────────────────────────────────────────────────────────────────── */

type Palette = { from: string; via: string; to: string; glyph: string; dot: string };

const PALETTE: Record<SmartImageVariant, Palette> = {
  image:    { from: '#E6F3F1', via: '#F5F7FA', to: '#C2E0DB', glyph: 'text-brand-500/70',  dot: 'rgba(13,128,116,0.10)' },
  avatar:   { from: '#E6F3F1', via: '#F5F7FA', to: '#C2E0DB', glyph: 'text-brand-600/80',  dot: 'rgba(13,128,116,0.12)' },
  campaign: { from: '#E6F3F1', via: '#F0F7F5', to: '#B8DBD5', glyph: 'text-brand-600/75',  dot: 'rgba(13,128,116,0.10)' },
  criminal: { from: '#FFF1E6', via: '#FFF7EF', to: '#FFDCB8', glyph: 'text-accent-500/70', dot: 'rgba(255,107,26,0.10)' },
  course:   { from: '#FFF7E6', via: '#FFFBEF', to: '#FFE6B0', glyph: 'text-gold-600/75',   dot: 'rgba(240,148,26,0.12)' },
  kindness: { from: '#E6F8F6', via: '#F0FBF9', to: '#B8ECE5', glyph: 'text-mint-600/80',   dot: 'rgba(37,197,186,0.12)' },
  tabyin:   { from: '#F3E9FF', via: '#F7F0FF', to: '#DDC7F5', glyph: 'text-violet-500/75', dot: 'rgba(139,92,246,0.10)' },
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Placeholder — pure CSS, no <img> — never fails                           */
/* ───────────────────────────────────────────────────────────────────────── */

function Placeholder({
  variant, animated = false, ariaLabel,
}: { variant: SmartImageVariant; animated?: boolean; ariaLabel?: string }) {
  const p = PALETTE[variant];
  return (
    <div
      role="img"
      aria-label={ariaLabel ?? 'تصویر در دسترس نیست'}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        // Diagonal brand-tinted gradient — never a flat grey square.
        backgroundImage: `
          radial-gradient(circle at 1px 1px, ${p.dot} 1px, transparent 1px),
          linear-gradient(135deg, ${p.from} 0%, ${p.via} 50%, ${p.to} 100%)
        `,
        backgroundSize: '14px 14px, 100% 100%',
      }}
    >
      {/* Subtle top-left highlight for depth */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/3 -right-1/4 w-[80%] h-[80%] rounded-full opacity-40 blur-2xl"
        style={{ background: `radial-gradient(circle, ${p.from} 0%, transparent 60%)` }}
      />
      {/* Glyph — sized to ~28% of the shortest edge so it works on
          every scale from a 32px avatar to a 400px hero cover. */}
      <span className={`relative ${p.glyph} ${animated ? 'animate-pulse' : ''}`}>
        <VariantGlyph variant={variant} className="w-[clamp(20px,28%,64px)] h-[clamp(20px,28%,64px)]" />
      </span>
      {/* Corner watermark — barely visible brand mark, keeps the tile
          feeling considered rather than empty. */}
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-2 text-[9px] font-extrabold tracking-wider uppercase opacity-25 text-ink-700 select-none"
      >
        بعثت مردم
      </span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  SmartImage — wrapper                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export function SmartImage({
  src,
  alt,
  variant = 'image',
  quietSkeleton = false,
  wrapperClassName,
  className,
  fill,
  sizes,
  priority,
  unoptimized,
  ...rest
}: SmartImageProps) {
  const hasSrc = typeof src === 'string' && src.trim().length > 0;
  const [errored, setErrored] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  // Reset load/error state whenever the source changes — important for
  // gallery-style callers that swap the src between renders.
  useEffect(() => {
    setErrored(false);
    setLoaded(false);
  }, [src]);

  const showPlaceholder = !hasSrc || errored;

  // The wrapper always fills its parent so it's a drop-in replacement
  // for `<Image fill />`. Callers that want inline sizing can pass
  // their own wrapperClassName.
  const wrap = useMemo(
    () =>
      wrapperClassName ??
      (fill ? 'absolute inset-0' : 'relative w-full h-full'),
    [wrapperClassName, fill],
  );

  if (showPlaceholder) {
    return (
      <span className={wrap} aria-hidden={false}>
        <Placeholder variant={variant} ariaLabel={alt} />
      </span>
    );
  }

  return (
    <span className={wrap}>
      {/* Skeleton — visible ONLY while the image is decoding. Uses a
          brand-tinted shimmer, not a plain grey pulse, so it feels like
          part of the site even in a 100ms flash. */}
      {!loaded && !quietSkeleton && (
        <Placeholder variant={variant} animated ariaLabel={alt} />
      )}
      <Image
        {...rest}
        src={src as string}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`${className ?? ''} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Standalone Placeholder — useful when a caller wants the fallback but      */
/*  doesn't want an <img> tag at all (e.g. a preload-only tile).              */
/* ───────────────────────────────────────────────────────────────────────── */

export function SmartImagePlaceholder({
  variant = 'image',
  ariaLabel,
  className,
}: {
  variant?: SmartImageVariant;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <span className={className ?? 'relative w-full h-full block'}>
      <Placeholder variant={variant} ariaLabel={ariaLabel} />
    </span>
  );
}
