'use client';

import {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPersianNumber } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Campaign Album — v3 ("Cinema Cylinder")
 *
 * Backend contract (apps/madadkar):
 *   GET /api/v1/madadkar/campaigns/<slug>/  → CampaignPublicDetailSerializer
 *     {
 *       cover_image: str,
 *       gallery_images: [
 *         { id, image, alt_text, display_order, created_at }, ...
 *       ]
 *     }
 *
 *   - ALLOWED_IMAGE_EXTENSIONS = {jpg, jpeg, png, webp}
 *   - MAX_IMAGE_SIZE_MB = 5
 *   - No hard cap on the number of gallery_images per campaign.
 *   - Backend Meta.ordering = ["display_order", "created_at"] — sorting
 *     happens server-side; we only need to render in order.
 *   - alt_text (max 200) is surfaced as a caption below the stage.
 *
 * v5 — 3D Coverflow Carousel:
 *   - Every image is mounted as a 3D card on a deep, perspective stage.
 *   - The active card sits dead-centre, flat. ±1 neighbours rotate ~42°
 *     inwards (face the camera at an angle), recede ~180 px and dim.
 *     ±2 cards recede further, dim more, and ±3+ are hidden.
 *   - Click any side card to navigate to it. The whole strip slides as
 *     one cohesive spring-driven piece — true tactile cinema.
 *   - Kept: cinematic backdrop, smart neighbour preloading, zoom + pan,
 *     pinch + double-tap zoom, slideshow with Ken-Burns drift on the
 *     centre card, fullscreen API, RTL keyboard shortcuts,
 *     copy/download/open-original, help overlay, a11y, hover-to-pause
 *     scoped to the stage only.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type AlbumImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  sponsor?: string;
  images: AlbumImage[];
  loading?: boolean;
  startIndex?: number;
};

const SLIDESHOW_INTERVAL_MS = 5_000;

export function CampaignAlbum({
  open, onClose, title, sponsor, images, loading = false, startIndex = 0,
}: Props) {
  const total = images.length;

  // ── State ──────────────────────────────────────────────────────────
  const [index, setIndexState] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan,  setPan]  = useState({ x: 0, y: 0 });
  const [imgReady, setImgReady] = useState(false);
  const [slideshow, setSlideshow] = useState(false);
  const [helpOpen,  setHelpOpen]  = useState(false);
  const [isFs,      setIsFs]      = useState(false);
  const [hovering,  setHovering]  = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [copied,    setCopied]    = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────
  const stageRef    = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const stripScroll = useRef<HTMLDivElement>(null);
  const stripInner  = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; px: number; py: number; mode: 'pan' | 'swipe' } | null>(null);
  const pinchRef    = useRef<{ startDist: number; startZoom: number } | null>(null);

  // ── Filmstrip overflow state ───────────────────────────────────────
  const [stripOverflow, setStripOverflow] = useState(false);
  const [fadeLeft,  setFadeLeft]  = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  // ── Reset on open / new campaign ───────────────────────────────────
  useEffect(() => {
    if (open) {
      setIndexState(Math.min(startIndex, Math.max(0, total - 1)));
      setZoom(1); setPan({ x: 0, y: 0 });
      setSlideshow(false); setHelpOpen(false); setProgress(0);
      setImgReady(false); setCopied(false);
    }
  }, [open, startIndex, total]);

  // ── Reset zoom/pan when active image changes ───────────────────────
  useEffect(() => {
    setZoom(1); setPan({ x: 0, y: 0 }); setImgReady(false);
  }, [index]);

  // ── Smart preloading of neighbours ─────────────────────────────────
  // Note the explicit `window.Image()` — Next.js aliases the default
  // `Image` global inside client components; using `new Image()` bare
  // sometimes resolves to `next/image` (a React component, not an
  // HTMLImageElement constructor) and throws in strict-mode dev.
  useEffect(() => {
    if (!open || total === 0 || typeof window === 'undefined') return;
    const urls = [
      images[(index + 1) % total]?.url,
      images[(index - 1 + total) % total]?.url,
      images[(index + 2) % total]?.url,
      images[(index - 2 + total) % total]?.url,
    ].filter(Boolean) as string[];
    urls.forEach((src) => {
      try {
        const im = new window.Image();
        im.decoding = 'async';
        im.src = src;
      } catch { /* ignore — preloading is best-effort */ }
    });
  }, [open, index, total, images]);

  // ── Navigation ─────────────────────────────────────────────────────
  // `dir` is accepted for API compatibility with the old cylinder
  // transition; the coverflow layout doesn't need it (the whole strip
  // re-lays out around the new active index on every change).
  const goTo = useCallback((nextIdx: number, _dir?: 1 | -1) => {
    void _dir;
    if (!total) return;
    const norm = ((nextIdx % total) + total) % total;
    if (norm === index) return;
    setIndexState(norm);
  }, [index, total]);
  const next = useCallback(() => goTo(index + 1,  1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1, -1), [index, goTo]);

  // ── Zoom + pan helpers ─────────────────────────────────────────────
  const setSafeZoom = useCallback((nz: number) => {
    const clamped = Math.max(1, Math.min(4, nz));
    setZoom(clamped);
    if (clamped === 1) setPan({ x: 0, y: 0 });
  }, []);
  const zoomIn    = useCallback(() => setSafeZoom(zoom + 0.5), [zoom, setSafeZoom]);
  const zoomOut   = useCallback(() => setSafeZoom(zoom - 0.5), [zoom, setSafeZoom]);
  const zoomReset = useCallback(() => setSafeZoom(1), [setSafeZoom]);

  const constrainPan = useCallback((nx: number, ny: number, z = zoom) => {
    const stage = stageRef.current;
    if (!stage || z <= 1) return { x: 0, y: 0 };
    const w = stage.clientWidth, h = stage.clientHeight;
    const maxX = (w * (z - 1)) / 2;
    const maxY = (h * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  }, [zoom]);

  // ── Fullscreen ─────────────────────────────────────────────────────
  // Full vendor-prefix coverage — Safari, older Chrome/Edge and any
  // embedded webview still ship the webkit-prefixed API only. Without
  // these fallbacks the F key silently does nothing on Safari macOS/iOS.
  const getFsElement = useCallback((): Element | null => {
    if (typeof document === 'undefined') return null;
    const d = document as Document & {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };
    return (
      d.fullscreenElement ??
      d.webkitFullscreenElement ??
      d.mozFullScreenElement ??
      d.msFullscreenElement ??
      null
    );
  }, []);

  const toggleFs = useCallback(async () => {
    const el = panelRef.current; if (!el) return;
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    const anyDoc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };
    try {
      if (!getFsElement()) {
        // Enter fullscreen — try every known API in order of ubiquity.
        if      (anyEl.requestFullscreen)        await anyEl.requestFullscreen();
        else if (anyEl.webkitRequestFullscreen)  await anyEl.webkitRequestFullscreen();
        else if (anyEl.mozRequestFullScreen)     await anyEl.mozRequestFullScreen();
        else if (anyEl.msRequestFullscreen)      await anyEl.msRequestFullscreen();
        setIsFs(true);
      } else {
        if      (anyDoc.exitFullscreen)          await anyDoc.exitFullscreen();
        else if (anyDoc.webkitExitFullscreen)    await anyDoc.webkitExitFullscreen();
        else if (anyDoc.mozCancelFullScreen)     await anyDoc.mozCancelFullScreen();
        else if (anyDoc.msExitFullscreen)        await anyDoc.msExitFullscreen();
        setIsFs(false);
      }
    } catch { /* user-cancelled or unsupported */ }
  }, [getFsElement]);

  useEffect(() => {
    const onChange = () => setIsFs(!!getFsElement());
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];
    events.forEach((ev) => document.addEventListener(ev, onChange));
    return () => events.forEach((ev) => document.removeEventListener(ev, onChange));
  }, [getFsElement]);

  // ── Keyboard shortcuts + body scroll lock ──────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (helpOpen)        setHelpOpen(false);
        else if (zoom > 1)   zoomReset();
        else if (slideshow)  setSlideshow(false);
        else                 onClose();
        return;
      }
      if      (e.key === 'ArrowLeft')                            next();
      else if (e.key === 'ArrowRight')                           prev();
      else if (e.key === ' ')                                   { e.preventDefault(); setSlideshow((s) => !s); }
      else if (e.key === 'f' || e.key === 'F')                  toggleFs();
      else if (e.key === '?' || e.key === 'h' || e.key === 'H') setHelpOpen((h) => !h);
      else if (e.key === '+' || e.key === '=')                  zoomIn();
      else if (e.key === '-' || e.key === '_')                  zoomOut();
      else if (e.key === '0')                                   zoomReset();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, helpOpen, zoom, slideshow, next, prev, onClose, zoomIn, zoomOut, zoomReset]);

  // ── Slideshow tick ─────────────────────────────────────────────────
  //
  // The old implementation restarted the animation-frame loop on every
  // `index` change (because `next` is a fresh useCallback whenever
  // `index` changes). Result: at the moment the loop fired `next()`,
  // the very next render tore down the effect, rebuilt it with a fresh
  // `startedAt = performance.now()`, and the progress bar jumped BACK
  // to 0 mid-tick — visible as a stutter or "the bar and the swap
  // aren't in sync".
  //
  // The fix keeps the RAF loop STABLE across index changes by:
  //   1. Reading `next` from a ref so the effect no longer depends on it
  //   2. Using a mutable ref for `startedAt` and resetting it inline
  //      when we advance a slide — no re-render cycle involved
  //   3. Only re-running the effect on true state changes:
  //      open / slideshow / total / hovering / zoom
  //
  // Progress is also written to a ref-driven imperative style: we still
  // call setProgress so the bar reflects the ticks, but React can batch
  // those updates safely because we cap to `raf` frequency (~60fps).
  const nextRef       = useRef(next);
  const startedAtRef  = useRef<number>(0);
  useEffect(() => { nextRef.current = next; }, [next]);

  useEffect(() => {
    if (!open || !slideshow || total <= 1) { setProgress(0); return; }
    if (hovering || zoom > 1)              { setProgress(0); return; }

    startedAtRef.current = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - startedAtRef.current;
      const p = Math.min(1, elapsed / SLIDESHOW_INTERVAL_MS);
      setProgress(p);
      if (p >= 1) {
        // Reset the clock BEFORE advancing so the next tick's elapsed
        // starts from 0 without a visible flash-back.
        startedAtRef.current = t;
        nextRef.current();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, slideshow, total, hovering, zoom]);

  // ── Stage pointer handlers ─────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (helpOpen) return;
    if ((e.target as Element).closest('.album-nav,.album-hud,.album-strip,.album-dots')) return;
    panStartRef.current = {
      x: e.clientX, y: e.clientY, px: pan.x, py: pan.y,
      mode: zoom > 1 ? 'pan' : 'swipe',
    };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = panStartRef.current; if (!s) return;
    if (s.mode === 'pan') {
      const np = constrainPan(s.px + (e.clientX - s.x), s.py + (e.clientY - s.y));
      setPan(np);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = panStartRef.current; if (!s) return;
    panStartRef.current = null;
    if (s.mode === 'swipe') {
      const dx = e.clientX - s.x;
      if      (dx >  60) prev();   // RTL: drag-right → previous
      else if (dx < -60) next();
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) return;
    e.preventDefault();
    setSafeZoom(zoom + (e.deltaY < 0 ? 0.25 : -0.25));
  };
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { startDist: Math.hypot(dx, dy), startZoom: zoom };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setSafeZoom(pinchRef.current.startZoom * (dist / pinchRef.current.startDist));
    }
  };
  const onTouchEnd = () => { pinchRef.current = null; };
  const onDoubleClick = () => setSafeZoom(zoom > 1 ? 1 : 2.25);

  // ── Action handlers ────────────────────────────────────────────────
  const current = images[index];

  /**
   * Download the active image.
   *
   * The naïve `<a download>` trick only works when the file is served
   * from the SAME origin. Our media lives on the backend host
   * (188.253.2.86:18080) while the page runs on 188.253.2.86:3000 —
   * different origins — so browsers ignore the `download` attribute and
   * simply navigate to the image URL. To force a real save-as dialog we:
   *
   *   1. Fetch the image via CORS (the Django MEDIA endpoints already
   *      send the permissive Access-Control-Allow-Origin headers used
   *      elsewhere in the app).
   *   2. Convert the response body into a same-origin `blob:` URL.
   *   3. Pipe THAT into a temporary `<a>` with the desired filename.
   *   4. Fall back to opening the picture in a new tab if the fetch is
   *      blocked (older browsers or unusual CORS policies) — that way
   *      the user can still right-click → Save Image As instead of
   *      being left with a button that silently does nothing.
   */
  const onDownload = useCallback(async () => {
    if (!current?.url) return;
    const rawName = (current.alt?.trim() || `madadkar-${index + 1}`).slice(0, 60);
    // Derive a sensible extension from the URL path when possible; jpg is
    // the safe default for a Django ImageField without a fingerprint.
    const extMatch = current.url.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const filename = `${rawName.replace(/[\\/:*?"<>|]/g, '_')}.${ext}`;

    const openInNewTab = () => {
      const a = document.createElement('a');
      a.href = current.url;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    };

    try {
      const res = await fetch(current.url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      // Give the browser one tick to consume the blob before revoking
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch {
      openInNewTab();
    }
  }, [current, index]);

  /**
   * Copy the active image URL to the clipboard.
   *
   * `navigator.clipboard` is only available in secure contexts (HTTPS or
   * localhost). Our staging deploy runs plain HTTP, so on many browsers
   * `navigator.clipboard` is literally `undefined` and the old
   * `try { await navigator.clipboard.writeText(...) }` block silently
   * swallowed the failure — leaving the button looking dead.
   *
   * The fallback uses the legacy `document.execCommand('copy')` trick
   * on a hidden textarea, which works from any HTTP page as long as the
   * call is inside a user-initiated event handler (which onClick is).
   */
  const onCopyUrl = useCallback(async () => {
    if (!current?.url) return;
    const abs = new URL(current.url, window.location.origin).href;

    let ok = false;
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function' &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(abs);
        ok = true;
      }
    } catch {
      /* fall through to legacy path */
    }

    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = abs;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, abs.length);
        ok = document.execCommand('copy');
        ta.remove();
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }, [current]);

  // ── Filmstrip overflow detection (RTL-aware) ───────────────────────
  const measureStrip = useCallback(() => {
    const inner = stripInner.current; if (!inner) return;
    const overflow = inner.scrollWidth - 1 > inner.clientWidth;
    setStripOverflow(overflow);
    if (!overflow) { setFadeLeft(false); setFadeRight(false); return; }
    const sl = inner.scrollLeft;
    const max = inner.scrollWidth - inner.clientWidth;
    // RTL: scrollLeft <= 0; LTR: scrollLeft >= 0. Use absolute distance.
    let fromRight: number, fromLeft: number;
    if (sl <= 0) { fromRight = -sl;       fromLeft = max - (-sl); }
    else         { fromRight = sl;        fromLeft = max - sl; }
    setFadeRight(fromRight > 2);
    setFadeLeft (fromLeft  > 2);
  }, []);
  useEffect(() => {
    if (!open) return;
    measureStrip();
    const inner = stripInner.current;
    if (!inner) return;
    inner.addEventListener('scroll', measureStrip);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measureStrip);
      ro.observe(inner);
    }
    window.addEventListener('resize', measureStrip);
    return () => {
      inner.removeEventListener('scroll', measureStrip);
      ro?.disconnect();
      window.removeEventListener('resize', measureStrip);
    };
  }, [open, measureStrip, total]);
  // Scroll active thumb into view when index changes
  useEffect(() => {
    if (!open) return;
    const inner = stripInner.current; if (!inner) return;
    const el = inner.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [open, index]);

  const stripScrollBy = (sign: 1 | -1) => {
    const inner = stripInner.current; if (!inner) return;
    const dist = Math.max(120, inner.clientWidth * 0.8);
    inner.scrollBy({ left: sign * dist, behavior: 'smooth' });
  };

  // Honour the user's motion preference for any micro-animation we own.
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const counter = useMemo(() => {
    if (!total) return '۰';
    return `${formatPersianNumber(index + 1)} / ${formatPersianNumber(total)}`;
  }, [index, total]);

  // ── Reusable HUD button components (lite renderers) ────────────────
  const HudBtn = ({
    onClick, children, ariaLabel, disabled, pressed,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    ariaLabel: string;
    disabled?: boolean;
    pressed?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={`inline-flex items-center justify-center w-[30px] h-[30px] sm:w-8 sm:h-8 rounded-full text-white
                 hover:bg-white/15 active:scale-95 transition-all duration-150 flex-shrink-0
                 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed
                 ${pressed ? 'bg-white/20' : ''}`}
    >
      {children}
    </button>
  );

  const hudControlsRender = (
    <>
      {total > 1 && (
        <HudBtn
          onClick={() => setSlideshow((s) => !s)}
          ariaLabel={slideshow ? 'توقف اسلایدشو (Space)' : 'پخش اسلایدشو (Space)'}
          pressed={slideshow}
        >
          {slideshow
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>}
        </HudBtn>
      )}
      <HudBtn onClick={toggleFs} ariaLabel={isFs ? 'خروج از تمام‌صفحه (F)' : 'تمام‌صفحه (F)'} pressed={isFs}>
        {isFs
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>}
      </HudBtn>
      <HudBtn onClick={onCopyUrl} ariaLabel="کپی نشانی تصویر">
        {copied
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
      </HudBtn>
      <HudBtn onClick={onDownload} ariaLabel="دانلود تصویر">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </HudBtn>
      {current?.url && (
        <a
          href={current.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="باز کردن در زبانهٔ جدید"
          className="inline-flex items-center justify-center w-[30px] h-[30px] sm:w-8 sm:h-8 rounded-full text-white
                     hover:bg-white/15 transition-colors flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      )}
      <HudBtn onClick={() => setHelpOpen((h) => !h)} ariaLabel="میان‌برهای صفحه‌کلید (?)" pressed={helpOpen}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </HudBtn>
    </>
  );

  const zoomControlsRender = (
    <>
      <HudBtn onClick={zoomOut} ariaLabel="کوچک‌نمایی (−)" disabled={zoom <= 1}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </HudBtn>
      <button
        type="button"
        onClick={zoomReset}
        aria-label="بازنشانی بزرگ‌نمایی (۰)"
        className="px-1.5 sm:px-2 h-[26px] sm:h-7 min-w-[38px] sm:min-w-[44px] rounded-full text-white
                   text-[10.5px] sm:text-[11px] font-extrabold tabular-nums
                   hover:bg-white/10 transition-colors flex-shrink-0"
      >
        {`٪${formatPersianNumber(Math.round(zoom * 100))}`}
      </button>
      <HudBtn onClick={zoomIn} ariaLabel="بزرگ‌نمایی (+)" disabled={zoom >= 4}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
      </HudBtn>
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="album-root"
          role="dialog"
          aria-modal="true"
          aria-label={`گالری تصاویر — ${title}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[110] flex items-center justify-center
                     bg-ink-900/85 backdrop-blur-md p-2 sm:p-5"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit   ={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-[1180px] h-[92vh]
                       bg-ink-900 rounded-[28px] overflow-hidden flex flex-col
                       shadow-[0_50px_100px_-25px_rgba(0,0,0,.65)]"
          >
            {/* Slideshow progress bar */}
            {slideshow && total > 1 && (
              <div aria-hidden="true" className="absolute top-0 inset-x-0 h-[3px] z-[6] bg-white/10">
                <div
                  className="h-full bg-gradient-to-l from-mint-500 to-brand-500 transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            )}

            {/* Header — fully responsive, no collisions */}
            <div className="relative z-[5] flex items-center justify-between gap-2 sm:gap-3
                            px-2.5 sm:px-4 md:px-6 py-2.5 sm:py-3.5
                            bg-gradient-to-b from-ink-900/95 to-ink-900/0 text-white">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                <span className="shrink-0 inline-flex w-[34px] h-[34px] sm:w-10 sm:h-10 rounded-[10px] sm:rounded-xl
                                 bg-gradient-to-br from-mint-500 to-brand-700 items-center justify-center
                                 shadow-[0_8px_18px_-6px_rgba(13,128,116,.55)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                       className="sm:w-5 sm:h-5">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] sm:text-[14.5px] md:text-[15.5px] font-extrabold leading-[1.4] truncate">
                    {title}
                  </h3>
                  {sponsor && (
                    <p className="hidden sm:block text-[12px] text-white/60 font-medium leading-5 truncate">
                      مددکار: {sponsor}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span
                  aria-live="polite"
                  className="hidden sm:inline-flex items-center px-3 h-9 rounded-full
                             bg-white/10 text-white text-[12px] font-extrabold tabular-nums
                             ring-1 ring-white/15 backdrop-blur"
                >
                  {counter}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="بستن (Esc)"
                  className="w-[34px] h-[34px] sm:w-10 sm:h-10 rounded-full bg-white/10 text-white
                             hover:bg-rose-500 hover:scale-105 active:scale-95
                             flex items-center justify-center ring-1 ring-white/15 backdrop-blur
                             transition-all duration-200 shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Stage — hover-to-pause is scoped to THIS region only, so
                resting the cursor on the title / HUD / filmstrip never
                freezes the slideshow. */}
            <div
              ref={stageRef}
              className="relative flex-1 overflow-hidden"
              style={{ perspective: '1400px', perspectiveOrigin: '50% 50%' }}
              onWheel={onWheel}
              onTouchStart={(e) => { setHovering(true); onTouchStart(e); }}
              onTouchMove={onTouchMove}
              onTouchEnd={(e) => { setHovering(false); onTouchEnd(); /* no-arg */ void e; }}
              onTouchCancel={() => setHovering(false)}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={onDoubleClick}
            >
              {current?.url && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none transition-[background-image] duration-300"
                  style={{
                    backgroundImage: `url("${current.url}")`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'blur(48px) saturate(1.4) brightness(.55)',
                    transform: 'scale(1.12)',
                  }}
                />
              )}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,.55) 100%)' }}
              />

              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-white/85"><Spinner/></div>
              ) : total === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-[13px] font-medium">
                  تصویری برای نمایش وجود ندارد.
                </div>
              ) : (
                <>
                  {/* ── Coverflow Carousel ─────────────────────────────
                      Every image is mounted as a 3D card on a deep stage.
                      Offset from active index drives translateX / Z /
                      rotateY / scale / opacity / blur so the whole strip
                      animates as one cohesive piece on every nav. */}
                  <div
                    className="absolute inset-0"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {images.map((img, i) => {
                      // shortest signed distance on a circular index space
                      let d = i - index;
                      if      (d >  total / 2) d -= total;
                      else if (d < -total / 2) d += total;
                      const abs = Math.abs(d);
                      const mounted = abs <= 2;
                      const side = d === 0 ? 0 : (d > 0 ? 1 : -1);
                      // Geometry table — mirrors the template build for
                      // a pixel-identical experience between preview and
                      // production.
                      const SPEC = [
                        { x:  0,  z:    0, ry:   0,  scale: 1.00, opacity: 1.00, blur: 0 },
                        { x: 42,  z: -180, ry: -42,  scale: 0.78, opacity: 0.88, blur: 0 },
                        { x: 70,  z: -360, ry: -60,  scale: 0.62, opacity: 0.55, blur: 1 },
                      ];
                      const s = mounted ? SPEC[abs] : SPEC[2];
                      const tx     = s.x  * side;
                      const ry     = s.ry * side;
                      const tz     = s.z;
                      const scale  = mounted ? s.scale : 0.35;
                      const opac   = mounted ? s.opacity : 0;
                      const filter = s.blur > 0 || !mounted
                        ? `blur(${mounted ? s.blur : 2}px) brightness(${mounted ? .78 : .6})`
                        : 'blur(0) brightness(1)';
                      const isCenter = d === 0;
                      const isSide   = mounted && !isCenter;
                      return (
                        <motion.div
                          key={`cf-${i}`}
                          className="absolute inset-0 flex items-center justify-center select-none"
                          style={{
                            transformStyle: 'preserve-3d',
                            transformOrigin: 'center center',
                            // Only side cards need to be clickable (to
                            // jump). The center card must be transparent
                            // to pointers so the HUD (z-[7]) and the
                            // prev/next buttons (z-[6]) that overlap it
                            // stay clickable. Stage-level pointerDown
                            // still hits us for pan/swipe on the center.
                            pointerEvents: isSide ? 'auto' : 'none',
                            cursor: isSide ? 'pointer'
                              : zoom > 1 ? (panStartRef.current ? 'grabbing' : 'grab') : 'zoom-in',
                            touchAction: zoom > 1 ? 'none' : 'pan-y',
                            // Keep coverflow BELOW the HUD (z-[7]) and the
                            // prev/next buttons (z-[6]) at all times.
                            zIndex: 5 - abs,
                            willChange: 'transform, opacity, filter',
                          }}
                          animate={{
                            x: `${tx}%`,
                            z: tz,
                            rotateY: ry,
                            scale,
                            opacity: opac,
                            filter,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 130,
                            damping: 22,
                            mass: 0.9,
                          }}
                          onClick={() => {
                            if (isSide) goTo(i, side > 0 ? -1 : 1);
                          }}
                        >
                          {isCenter && !imgReady && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/70"><Spinner/></div>
                          )}
                          {/* Center card gets pan/zoom + (optional) Ken-Burns

                              Every <img> lives at its own `key` derived from
                              the CURRENT active index — that way, whenever
                              the user pages left/right, React unmounts the
                              old node and mounts a fresh one. If the browser
                              had the picture in its HTTP cache we STILL get
                              a synchronous `.complete === true` on the new
                              node (checked via ref-callback), so we can flip
                              `imgReady = true` without ever waiting for a
                              second `onLoad` event that browsers famously
                              skip for cached responses.                    */}
                          {isCenter && slideshow && zoom === 1 && !reduced ? (
                            <motion.img
                              key={`img-kb-${index}`}
                              src={img.url}
                              alt={img.alt || title}
                              draggable={false}
                              ref={(el) => {
                                if (el && el.complete && el.naturalWidth > 0) {
                                  // Fires when the browser served the
                                  // image straight from cache — onLoad in
                                  // that case is skipped in every engine.
                                  setImgReady(true);
                                }
                              }}
                              onLoad={() => setImgReady(true)}
                              onError={() => setImgReady(true)}
                              initial={{ scale: 1.00, x: '0%', y: '0%', opacity: 0 }}
                              animate={{ scale: 1.06, x: '-1.2%', y: '-0.8%', opacity: imgReady ? 1 : 0 }}
                              transition={{
                                scale:   { duration: 5.4, ease: 'easeOut' },
                                x:       { duration: 5.4, ease: 'easeOut' },
                                y:       { duration: 5.4, ease: 'easeOut' },
                                opacity: { duration: 0.3 },
                              }}
                              className="max-w-[86%] sm:max-w-[94%] max-h-[82%] sm:max-h-[88%] object-contain pointer-events-none
                                         drop-shadow-[0_20px_50px_rgba(0,0,0,.55)] rounded-[14px]"
                              style={{ transformOrigin: 'center center' }}
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={isCenter ? `img-center-${index}` : `img-side-${i}`}
                              src={img.url}
                              alt={img.alt || title}
                              draggable={false}
                              loading={isCenter ? 'eager' : 'lazy'}
                              decoding="async"
                              // Cached-image callback (see comment above).
                              ref={isCenter ? (el) => {
                                if (el && el.complete && el.naturalWidth > 0) {
                                  setImgReady(true);
                                }
                              } : undefined}
                              onLoad={isCenter ? () => setImgReady(true) : undefined}
                              onError={isCenter ? () => setImgReady(true) : undefined}
                              className="max-w-[86%] sm:max-w-[94%] max-h-[82%] sm:max-h-[88%] object-contain pointer-events-none
                                         drop-shadow-[0_20px_50px_rgba(0,0,0,.55)] rounded-[14px]"
                              style={isCenter ? {
                                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                                transformOrigin: 'center center',
                                transition: 'transform .25s cubic-bezier(.22,1,.36,1), opacity .3s',
                                opacity: imgReady ? 1 : 0,
                              } : { opacity: 1 }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Edge nav buttons */}
                  {total > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prev}
                        aria-label="تصویر قبلی (→)"
                        className="album-nav absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 z-[6]
                                   w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 text-white
                                   hover:bg-white hover:text-ink-900 hover:scale-110 active:scale-95
                                   flex items-center justify-center ring-1 ring-white/20 backdrop-blur-md
                                   shadow-[0_10px_24px_-6px_rgba(0,0,0,.55)] transition-all duration-200"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                             className="sm:w-[22px] sm:h-[22px]"><polyline points="9 6 15 12 9 18"/></svg>
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        aria-label="تصویر بعدی (←)"
                        className="album-nav absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 z-[6]
                                   w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 text-white
                                   hover:bg-white hover:text-ink-900 hover:scale-110 active:scale-95
                                   flex items-center justify-center ring-1 ring-white/20 backdrop-blur-md
                                   shadow-[0_10px_24px_-6px_rgba(0,0,0,.55)] transition-all duration-200"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                             className="sm:w-[22px] sm:h-[22px]"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                    </>
                  )}

                  {/* Mobile counter */}
                  <span
                    className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 z-[6]
                               inline-flex items-center px-3 h-7 rounded-full
                               bg-black/60 text-white text-[11.5px] font-extrabold tabular-nums
                               ring-1 ring-white/15 backdrop-blur"
                  >
                    {counter}
                  </span>

                  {/* Caption */}
                  {current?.alt && (
                    <div
                      className="absolute bottom-24 sm:bottom-[104px] inset-x-0 z-[5] flex justify-center px-3 sm:px-4 pointer-events-none"
                      aria-hidden="true"
                    >
                      <motion.span
                        key={`cap-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="max-w-[92%] text-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full
                                   bg-black/55 text-white text-[11.5px] sm:text-[12.5px] font-medium
                                   ring-1 ring-white/15 backdrop-blur-md line-clamp-2 leading-6"
                      >
                        {current.alt}
                      </motion.span>
                    </div>
                  )}

                  {/* ── Unified HUD — ALWAYS bottom-centered ────────
                      Mobile + desktop: a single floating pill containing
                      zoom controls + slideshow + fullscreen + copy +
                      download + open-original + help.
                      No left-anchored bar (was redundant — every action is
                      reachable from this one place).
                   */}
                  <div
                    // `album-hud` is matched by the stage pointerDown
                    // handler's `.closest()` selector so clicking a HUD
                    // button never fires the pan/swipe path underneath.
                    // `onPointerDown` stopPropagation is a belt-and-braces
                    // safeguard in case the CSS selector ever gets renamed
                    // — the buttons stay clickable regardless.
                    className="album-hud absolute z-[7] bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2
                               inline-flex items-center gap-1 sm:gap-1.5 p-[5px] sm:p-1.5 rounded-full
                               bg-black/55 ring-1 ring-white/15 backdrop-blur
                               max-w-[calc(100%-1rem)] overflow-x-auto no-scrollbar"
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {zoomControlsRender}
                    <span aria-hidden="true" className="w-px h-[18px] bg-white/18 mx-0.5 shrink-0" />
                    {hudControlsRender}
                  </div>

                  {/* Dot indicator (≤ 8) — desktop only */}
                  {total > 1 && total <= 8 && (
                    <div className="album-dots hidden sm:flex absolute z-[5] bottom-[72px] left-1/2 -translate-x-1/2 items-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => goTo(i)}
                          aria-label={`نمایش تصویر ${formatPersianNumber(i + 1)}`}
                          aria-current={i === index}
                          className={`h-1.5 rounded-full transition-all duration-200
                                      ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Filmstrip — centered when fits, scroll arrows + edge fades when overflows */}
            {total > 1 && !loading && (
              <div className="relative z-[5] bg-ink-900/95 backdrop-blur border-t border-white/10 px-2 sm:px-4 py-2.5 sm:py-3">
                <div
                  ref={stripScroll}
                  className={`relative overflow-hidden
                              ${stripOverflow ? 'has-overflow' : ''}
                              ${fadeRight ? 'fade-right' : ''}
                              ${fadeLeft  ? 'fade-left'  : ''}`}
                >
                  {/* Edge fades — pure CSS via inline pseudo-element fallback (Tailwind has no ::before util that takes gradient; we use absolute spans) */}
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 bottom-0 right-0 w-12 z-[2] pointer-events-none transition-opacity duration-200
                                ${fadeRight ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'linear-gradient(to left, rgba(15,20,32,.95), rgba(15,20,32,0))' }}
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 bottom-0 left-0 w-12 z-[2] pointer-events-none transition-opacity duration-200
                                ${fadeLeft ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'linear-gradient(to right, rgba(15,20,32,.95), rgba(15,20,32,0))' }}
                  />

                  {/* Scroll arrows — only when overflowing */}
                  {stripOverflow && (
                    <>
                      <button
                        type="button"
                        onClick={() => stripScrollBy( 1)}   // RTL: positive scrollLeft = right
                        aria-label="جابه‌جایی نوار به راست"
                        className="absolute top-1/2 right-1 -translate-y-1/2 z-[3] w-[30px] h-[30px] rounded-full
                                   bg-white/10 text-white border-0 flex items-center justify-center cursor-pointer
                                   ring-1 ring-white/20 backdrop-blur shadow-[0_6px_14px_-4px_rgba(0,0,0,.5)]
                                   hover:bg-white hover:text-ink-900 hover:scale-105 active:scale-95 transition-all duration-200"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 6 15 12 9 18"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => stripScrollBy(-1)}
                        aria-label="جابه‌جایی نوار به چپ"
                        className="absolute top-1/2 left-1 -translate-y-1/2 z-[3] w-[30px] h-[30px] rounded-full
                                   bg-white/10 text-white border-0 flex items-center justify-center cursor-pointer
                                   ring-1 ring-white/20 backdrop-blur shadow-[0_6px_14px_-4px_rgba(0,0,0,.5)]
                                   hover:bg-white hover:text-ink-900 hover:scale-105 active:scale-95 transition-all duration-200"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="15 18 9 12 15 6"/>
                        </svg>
                      </button>
                    </>
                  )}

                  <div
                    ref={stripInner}
                    dir="rtl"
                    className={`flex gap-2 overflow-x-auto py-1 no-scrollbar
                                ${stripOverflow ? 'justify-start' : 'justify-center'}`}
                    style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
                  >
                    {images.map((img, i) => {
                      const active = i === index;
                      return (
                        <button
                          type="button"
                          key={`${img.url}-${i}`}
                          data-thumb={i}
                          onClick={() => goTo(i)}
                          aria-label={`نمایش تصویر ${formatPersianNumber(i + 1)}`}
                          aria-current={active}
                          className={`relative shrink-0 rounded-[12px] sm:rounded-[14px] overflow-hidden
                                      transition-all duration-200
                                      ${active
                                        ? 'ring-2 ring-mint-500 scale-[1.05] shadow-[0_12px_28px_-8px_rgba(37,197,186,.55)]'
                                        : 'ring-1 ring-white/15 hover:ring-mint-300 hover:scale-[1.03] opacity-70 hover:opacity-100'}`}
                          style={{ width: 72, height: 54, scrollSnapAlign: 'center' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url} alt="" loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <span
                            aria-hidden="true"
                            className={`absolute top-1 right-1 px-1 h-4 rounded text-[9px]
                                        font-extrabold tabular-nums ring-1 ring-white/15
                                        ${active ? 'bg-mint-500 text-ink-900' : 'bg-black/55 text-white backdrop-blur-sm'}`}
                          >
                            {formatPersianNumber(i + 1)}
                          </span>
                          {active && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-l from-mint-500 to-brand-500"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Help overlay */}
            <AnimatePresence>
              {helpOpen && (
                <motion.div
                  key="help"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[20] bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
                  onClick={() => setHelpOpen(false)}
                >
                  <motion.div
                    initial={{ y: 16, opacity: 0, scale: 0.96 }}
                    animate={{ y: 0,  opacity: 1, scale: 1 }}
                    exit={{ y: 8, opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-[440px] w-full bg-white rounded-[20px] p-5 md:p-6
                               text-ink-900 shadow-[0_30px_60px_-12px_rgba(0,0,0,.6)]"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700
                                       text-white flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </span>
                      <div>
                        <h4 className="text-[15px] font-extrabold">میان‌برهای صفحه‌کلید</h4>
                        <p className="text-[12px] text-ink-500 font-medium">برای کاوش سریع‌تر گالری</p>
                      </div>
                    </div>
                    <ul className="grid grid-cols-1 gap-2 text-[13px]">
                      <Kbd k="→"               l="تصویر قبلی" />
                      <Kbd k="←"               l="تصویر بعدی" />
                      <Kbd k="Space"           l="پخش / توقف اسلایدشو" />
                      <Kbd k="F"               l="ورود / خروج تمام‌صفحه" />
                      <Kbd k="+ / − / 0"       l="بزرگ‌نمایی / کوچک‌نمایی / بازنشانی" />
                      <Kbd k="دابل‌کلیک"        l="تغییر سریع بزرگ‌نمایی" />
                      <Kbd k="Ctrl + چرخش ماوس" l="بزرگ‌نمایی پیوسته" />
                      <Kbd k="کشیدن انگشت"      l="جابه‌جایی بین تصاویر" />
                      <Kbd k="Esc"             l="بستن یا بازنشانی" />
                    </ul>
                    <button
                      type="button"
                      onClick={() => setHelpOpen(false)}
                      className="mt-5 w-full h-11 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700
                                 text-white font-extrabold text-[13px] transition-colors"
                    >
                      فهمیدم
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Atoms                                                                    */
/* ───────────────────────────────────────────────────────────────────────── */

function Kbd({ k, l }: { k: string; l: string }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-ink-50">
      <span className="text-ink-700 font-medium">{l}</span>
      <kbd className="font-mono text-[11.5px] font-extrabold text-ink-900
                      bg-white px-2 py-0.5 rounded-md ring-1 ring-ink-200
                      shadow-[0_1px_0_rgba(0,0,0,.06)]">
        {k}
      </kbd>
    </li>
  );
}

function Spinner() {
  return (
    <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
