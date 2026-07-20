'use client';

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  GlobalSearch — production omni-search command bar for the hero.
 *
 *  UX highlights
 *  ─────────────
 *   • Live parallel search across all five public list endpoints
 *     (madadkar / r4j / lms / kindness / tabyin) — powered by
 *     lib/global-search.ts::searchAll.
 *   • Source chip filter row with LIVE hit counts and per-source
 *     brand accent (brand / rose / amber / mint / violet).
 *   • Facet chips for the most-used per-source filters (status,
 *     media type, level, listing type, etc). Adding a facet chip
 *     re-runs the search and narrows the results server-side.
 *   • Trending presets + recent-searches (localStorage, max 6).
 *   • Keyboard nav: ↑/↓ traverses hits, Enter opens the highlighted
 *     one, Esc closes.
 *   • Portal-mounted dropdown — teleported to <body> so no ancestor
 *     with overflow:hidden / transform / filter can ever clip it.
 *     z-index is carefully picked to sit ABOVE the surrounding page
 *     content but BELOW the sticky site header (z-50).
 *   • Fully typed against the backend's exact filterset contract.
 * ───────────────────────────────────────────────────────────────────────────
 */

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  searchAll,
  SEARCH_SOURCES,
  SEARCH_SOURCE_ORDER,
  loadRecent,
  pushRecent,
  clearRecent,
  TRENDING_QUERIES,
  type SearchAggregate,
  type SearchHit,
  type SearchSource,
  type SearchFacets,
} from '@/lib/global-search';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Glyph atlas (inline SVGs — zero icon-dep)                              */
/* ═══════════════════════════════════════════════════════════════════════ */

function Glyph({ glyph, className = 'w-4 h-4' }: { glyph: string; className?: string }) {
  const common = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    className,
  };
  switch (glyph) {
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'x':
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case 'flame':
      return <svg {...common}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a7 7 0 0 0 7-7c0-3-2.5-4.5-3-7C13 4 12 2 12 2S9 5 9 9c-1.5 0-3-1-3-3 0 0-3 2-3 6 0 4 3 7 7 7"/></svg>;
    case 'arrow-left':
      return <svg {...common}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
    case 'grid':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case 'sliders':
      return <svg {...common}><line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/></svg>;
    case 'campaign':
      return <svg {...common}><path d="M3 11v2a4 4 0 0 0 4 4h2l5 4V3L9 7H7a4 4 0 0 0-4 4z"/></svg>;
    case 'gavel':
      return <svg {...common}><path d="m14.5 12.5-8 8a2.1 2.1 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="M21 11 13 3"/></svg>;
    case 'graduation':
      return <svg {...common}><path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"/></svg>;
    case 'heart':
      return <svg {...common}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
    case 'megaphone':
      return <svg {...common}><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>;
    case 'spinner':
      return <svg viewBox="0 0 24 24" className={`${className} animate-spin`}><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={3} opacity={0.25}/><path d="M21 12a9 9 0 0 1-9 9" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"/></svg>;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Accent palette                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

type AccentKey = 'brand' | 'rose' | 'amber' | 'mint' | 'violet' | 'ink';

const ACCENT: Record<AccentKey, {
  chipActive: string;
  chipIdle:   string;
  disc:       string;
  pill:       string;
}> = {
  brand:  { chipActive: 'bg-brand-600  text-white',  chipIdle: 'bg-brand-50  text-brand-700  hover:bg-brand-100',
            disc: 'bg-brand-50  text-brand-600',  pill: 'bg-brand-50  text-brand-700' },
  rose:   { chipActive: 'bg-rose-600   text-white',  chipIdle: 'bg-rose-50   text-rose-700   hover:bg-rose-100',
            disc: 'bg-rose-50   text-rose-600',   pill: 'bg-rose-50   text-rose-700' },
  amber:  { chipActive: 'bg-amber-500  text-white',  chipIdle: 'bg-amber-50  text-amber-700  hover:bg-amber-100',
            disc: 'bg-amber-50  text-amber-600',  pill: 'bg-amber-50  text-amber-700' },
  mint:   { chipActive: 'bg-mint-500   text-white',  chipIdle: 'bg-mint-50   text-mint-700   hover:bg-mint-100',
            disc: 'bg-mint-50   text-mint-600',   pill: 'bg-mint-50   text-mint-700' },
  violet: { chipActive: 'bg-violet-600 text-white',  chipIdle: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
            disc: 'bg-violet-50 text-violet-600', pill: 'bg-violet-50 text-violet-700' },
  ink:    { chipActive: 'bg-ink-900    text-white',  chipIdle: 'bg-ink-100   text-ink-700    hover:bg-ink-200',
            disc: 'bg-ink-100   text-ink-600',    pill: 'bg-ink-100   text-ink-700' },
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Facet catalogue — mirrors the backend filtersets exactly                */
/* ═══════════════════════════════════════════════════════════════════════ */

type FacetChip = { label: string; value: string };

/**
 * A curated set of facet chips per source. Each chip corresponds
 * EXACTLY to a valid filterset value; adding it to the URL narrows
 * results server-side. Only the most commonly-useful facets are
 * surfaced in the omni-search — deep filtering happens on the
 * destination /madadkar, /r4j, /lms, etc. pages.
 */
const FACETS: Record<SearchSource, { key: string; label: string; chips: FacetChip[] }[]> = {
  madadkar: [
    {
      key: 'status', label: 'وضعیت',
      chips: [
        // Backend CampaignStatus is stored lowercase; the ChoiceFilter
        // was misconfigured in the previous revision (was sending the
        // enum NAME "PUBLISHED"). The actual DB values are lowercase.
        { label: 'در حال اجرا', value: 'published' },
        { label: 'تکمیل شد',    value: 'completed' },
        { label: 'بسته شد',     value: 'closed' },
      ],
    },
    {
      key: 'is_fully_funded', label: 'تأمین',
      chips: [
        { label: 'تأمین شده',        value: 'true' },
        { label: 'در حال جمع‌آوری', value: 'false' },
      ],
    },
    {
      key: 'has_deadline', label: 'مهلت',
      chips: [
        { label: 'دارای مهلت', value: 'true' },
        { label: 'بدون مهلت',  value: 'false' },
      ],
    },
  ],
  r4j: [
    {
      key: 'gender', label: 'جنسیت',
      chips: [
        { label: 'مرد',     value: 'male' },
        { label: 'زن',      value: 'female' },
        { label: 'نامشخص',  value: 'unknown' },
      ],
    },
  ],
  lms: [
    {
      key: 'level', label: 'سطح',
      chips: [
        { label: 'مقدماتی', value: 'beginner' },
        { label: 'متوسط',   value: 'intermediate' },
        { label: 'پیشرفته', value: 'advanced' },
        { label: 'حرفه‌ای', value: 'professional' },
      ],
    },
  ],
  kindness: [
    {
      key: 'listing_type', label: 'نوع',
      chips: [
        { label: 'نیازمند کمک',  value: 'need_help' },
        { label: 'پیشنهاد کمک', value: 'offer_help' },
      ],
    },
  ],
  tabyin: [
    {
      key: 'media_type', label: 'رسانه',
      chips: [
        { label: 'تصویر', value: 'image' },
        { label: 'ویدئو', value: 'video' },
        { label: 'صوت',   value: 'audio' },
      ],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Portal-anchor geometry                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

type DropdownGeom = {
  top: number; left: number; width: number;
  maxHeight: number; placement: 'below' | 'above';
};

function useDropdownPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
): DropdownGeom | null {
  const [geom, setGeom] = useState<DropdownGeom | null>(null);

  useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const measure = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const gap = 16;
      // ── Placement policy ─────────────────────────────────────────
      // The panel ALWAYS opens downward — never above the pill.
      // If the viewport is too short, we cap `maxHeight` to whatever
      // fits below (with a sensible floor) and let the panel's inner
      // scroll area do the rest. If even that floor doesn't fit,
      // we still open downward and the user can scroll the *page* to
      // see the rest — but we NEVER flip above the pill.
      const desiredMax = Math.min(640, vh * 0.78);
      const spaceBelow = vh - r.bottom - gap - 12; // 12px safety at the bottom
      const maxHeight = Math.max(320, Math.min(desiredMax, Math.max(spaceBelow, 320)));
      const top = r.bottom + gap;
      setGeom({ top, left: r.left, width: r.width, maxHeight, placement: 'below' });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchorRef, open]);

  useEffect(() => { if (!open) setGeom(null); }, [open]);
  return geom;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Live-search hook                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function useLiveSearch(
  q: string,
  source: SearchSource | 'all',
  facets: SearchFacets,
  enabled: boolean,
) {
  const [data, setData] = useState<SearchAggregate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const cleaned = q.trim();
    if (cleaned.length < 2) {
      setData(null); setLoading(false); setError(null);
      return;
    }
    setLoading(true); setError(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const handle = window.setTimeout(async () => {
      try {
        const result = await searchAll(cleaned, {
          sources: source === 'all' ? undefined : [source],
          facets,
          signal: ctrl.signal,
        });
        if (!ctrl.signal.aborted) { setData(result); setLoading(false); }
      } catch (err) {
        const name = (err as { name?: string })?.name;
        if (name === 'AbortError') return;
        setError('جست‌وجو با خطا مواجه شد');
        setLoading(false);
      }
    }, 220);

    return () => { window.clearTimeout(handle); ctrl.abort(); };
  }, [q, source, facets, enabled]);

  return { data, loading, error };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Component                                                               */
/* ═══════════════════════════════════════════════════════════════════════ */

type Props = {
  initialQuery?: string;
  variant?: 'hero' | 'inline';
  className?: string;
};

export function GlobalSearch({
  initialQuery = '',
  variant = 'hero',
  className,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef  = useRef<HTMLDivElement  | null>(null);
  const formRef  = useRef<HTMLFormElement | null>(null);
  const panelRef = useRef<HTMLDivElement  | null>(null);

  const [q, setQ]           = useState(initialQuery);
  const [open, setOpen]     = useState(false);
  const [source, setSource] = useState<SearchSource | 'all'>('all');
  const [recents, setRecents] = useState<string[]>([]);
  const [active, setActive] = useState<number>(-1);
  const [mounted, setMounted] = useState(false);
  const [facets, setFacets] = useState<SearchFacets>({});
  const listboxId = useId();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setRecents(loadRecent()); }, []);

  const geom = useDropdownPosition(formRef, open);
  const { data, loading, error } = useLiveSearch(q, source, facets, open);

  const flatHits: SearchHit[] = useMemo(
    () => data?.groups.flatMap((g) => g.hits) ?? [],
    [data],
  );

  useEffect(() => { setActive(-1); }, [data?.q, source, facets]);

  // Outside-click — exempt both the pill wrapper AND the portal panel
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t))   return;
      if (panelRef.current?.contains(t))  return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const counts = useMemo(() => {
    const out: Record<SearchSource, number> = {
      madadkar: 0, r4j: 0, lms: 0, kindness: 0, tabyin: 0,
    };
    data?.groups.forEach((g) => { out[g.source] = g.hits.length; });
    return out;
  }, [data]);
  const total = data?.total ?? 0;

  const goToHit = useCallback((hit: SearchHit) => {
    pushRecent(q.trim());
    setOpen(false);
    router.push(hit.href);
  }, [q, router]);

  const submitForm = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = q.trim();
    if (!cleaned) { inputRef.current?.focus(); return; }
    if (active >= 0 && flatHits[active]) { goToHit(flatHits[active]); return; }
    pushRecent(cleaned);
    setOpen(false);
    const params = new URLSearchParams({ q: cleaned });
    if (source !== 'all') params.set('source', source);
    router.push(`/search?${params.toString()}`);
  }, [q, active, flatHits, source, router, goToHit]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!flatHits.length) return;
      setActive((i) => (i + 1) % flatHits.length);
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flatHits.length) return;
      setActive((i) => (i <= 0 ? flatHits.length - 1 : i - 1));
      setOpen(true);
    }
  };

  const clearInput = () => {
    setQ(''); setActive(-1); inputRef.current?.focus();
  };

  const activeFacetKeys: string[] = useMemo(() => {
    if (source === 'all') return [];
    const facetGroups = FACETS[source] ?? [];
    const active: string[] = [];
    facetGroups.forEach((g) => {
      const src = (facets[source] ?? {}) as Record<string, unknown>;
      const v = src[g.key];
      if (v !== undefined && v !== '') active.push(`${g.key}:${String(v)}`);
    });
    return active;
  }, [facets, source]);

  const setFacetValue = useCallback((facetKey: string, value: string | undefined) => {
    if (source === 'all') return;
    setFacets((prev) => {
      const src = prev[source] ?? {};
      const nextSrc: Record<string, unknown> = { ...src };
      if (value === undefined) {
        delete nextSrc[facetKey];
      } else if (value === 'true' || value === 'false') {
        nextSrc[facetKey] = value === 'true';
      } else {
        nextSrc[facetKey] = value;
      }
      const next: SearchFacets = { ...prev, [source]: nextSrc };
      return next;
    });
  }, [source]);

  const clearAllFacets = useCallback(() => setFacets({}), []);

  /* ── Layout ─────────────────────────────────────────────────────── */

  const pillClasses = variant === 'hero'
    ? 'relative z-30 mx-auto -mt-[100px] md:-mt-[120px] lg:-mt-[140px] max-w-3xl'
    : 'relative z-30 mx-auto max-w-3xl';

  return (
    <div ref={wrapRef} className={`${pillClasses} ${className ?? ''}`}>
      {/* ── Pill ──────────────────────────────────────────────────── */}
      <form
        ref={formRef}
        role="search"
        onSubmit={submitForm}
        className={`
          relative bg-white rounded-full ring-1 ring-ink-100
          ${open
            ? 'shadow-[0_4px_14px_-4px_rgba(13,128,116,.18)]'
            : 'shadow-[0_18px_50px_-22px_rgba(11,53,48,.30)] hover:shadow-[0_22px_56px_-22px_rgba(11,53,48,.36)] focus-within:shadow-[0_22px_60px_-18px_rgba(13,128,116,.45)]'}
          focus-within:ring-2 focus-within:ring-brand-500
          transition-[box-shadow,ring] duration-300
          flex items-center pl-1.5 pr-3 md:pr-5 py-1.5 gap-2
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-50 text-brand-600
                         flex items-center justify-center" aria-hidden="true">
          <Glyph glyph="search" className="w-4 h-4 md:w-[18px] md:h-[18px]" />
        </span>

        <input
          ref={inputRef}
          type="search"
          name="q"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKey}
          placeholder="جست‌وجو در حرکت‌ها، آموزش‌ها، پرونده‌ها، روایت‌ها…"
          aria-label="جست‌وجوی سراسری"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={active >= 0 ? `${listboxId}-opt-${active}` : undefined}
          dir="rtl"
          autoComplete="off"
          spellCheck={false}
          className="gs-search-input flex-1 min-w-0 h-10 md:h-11 bg-transparent outline-none
                     text-[14px] md:text-[15px] text-ink-900 placeholder:text-ink-400 text-right appearance-none"
        />

        {q.length > 0 && (
          <button
            type="button"
            onClick={clearInput}
            aria-label="پاک کردن"
            className="shrink-0 w-8 h-8 rounded-full text-ink-400 hover:text-ink-700
                       hover:bg-ink-50 inline-flex items-center justify-center transition-colors"
          >
            <Glyph glyph="x" className="w-4 h-4" />
          </button>
        )}

        {loading && (
          <span className="shrink-0 text-brand-500" aria-hidden="true">
            <Glyph glyph="spinner" className="w-4 h-4" />
          </span>
        )}

        <button
          type="submit"
          aria-label="جست‌وجو"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 h-10 md:h-11 px-4 md:px-5
                     rounded-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[13px] md:text-[14px]
                     shadow-[0_8px_22px_-8px_rgba(13,128,116,.55)]
                     hover:scale-[1.02] active:scale-[.98] transition-all duration-200"
        >
          <span className="hidden sm:inline">جست‌وجو</span>
          <Glyph glyph="search" className="w-4 h-4 sm:hidden" />
        </button>
      </form>

      {/* ── Dropdown (portal) ─────────────────────────────────────── */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && geom && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: geom.placement === 'above' ? -6 : 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: geom.placement === 'above' ? -4 : 6, scale: 0.985 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: geom.top,
                left: geom.left,
                width: geom.width,
                maxHeight: geom.maxHeight,
                // z-40 sits ABOVE the page content but BELOW the sticky
                // site header (z-50) so the header stays interactive
                // while the dropdown is open.
                zIndex: 40,
              }}
              className="bg-white rounded-3xl ring-1 ring-ink-100
                         shadow-[0_30px_80px_-20px_rgba(11,53,48,.45)]
                         overflow-hidden flex flex-col"
              role="region"
              aria-label="پیشنهادهای جست‌وجو"
              dir="rtl"
            >
              {/* Source chips */}
              <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3 pb-2 border-b border-ink-50 shrink-0">
                <SourceChip
                  label="همه"
                  glyph="grid"
                  accent="ink"
                  active={source === 'all'}
                  count={total}
                  onClick={() => setSource('all')}
                />
                {SEARCH_SOURCE_ORDER.map((src) => {
                  const meta = SEARCH_SOURCES[src];
                  return (
                    <SourceChip
                      key={src}
                      label={meta.shortLabel}
                      glyph={meta.glyph}
                      accent={meta.accent}
                      count={counts[src]}
                      active={source === src}
                      onClick={() => setSource(src)}
                    />
                  );
                })}
              </div>

              {/* Facet chips — only shown when a specific source is selected */}
              {source !== 'all' && FACETS[source]?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 pb-2 border-b border-ink-50 shrink-0
                                bg-ink-50/40">
                  <span className="inline-flex items-center gap-1 h-6 text-[11px] font-extrabold text-ink-500
                                   uppercase tracking-wider">
                    <Glyph glyph="sliders" className="w-3 h-3" />
                    فیلتر
                  </span>
                  {FACETS[source].map((group) => {
                    const sourceFacets = (facets[source] ?? {}) as Record<string, unknown>;
                    const currentValue = sourceFacets[group.key];
                    return group.chips.map((chip) => {
                      const isActive = String(currentValue) === chip.value;
                      return (
                        <button
                          key={`${group.key}-${chip.value}`}
                          type="button"
                          onClick={() => setFacetValue(
                            group.key,
                            isActive ? undefined : chip.value,
                          )}
                          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11.5px]
                                      font-extrabold transition-all
                                      ${isActive
                                        ? ACCENT[SEARCH_SOURCES[source].accent].chipActive
                                        : 'bg-white text-ink-700 hover:bg-ink-100 ring-1 ring-ink-200'}`}
                        >
                          {chip.label}
                        </button>
                      );
                    });
                  })}
                  {activeFacetKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFacets}
                      className="mr-auto inline-flex items-center gap-1 h-7 px-2 text-[11px] font-bold
                                 text-ink-500 hover:text-rose-600 transition-colors"
                    >
                      پاک کردن فیلترها
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div
                id={listboxId}
                role="listbox"
                aria-label="نتایج جست‌وجو"
                className="flex-1 min-h-0 overflow-y-auto custom-scroll"
              >
                {q.trim().length < 2 ? (
                  <EmptyInputBody
                    recents={recents}
                    onPickRecent={(r) => { setQ(r); inputRef.current?.focus(); }}
                    onClearRecents={() => { clearRecent(); setRecents([]); }}
                    onPickTrending={(t) => {
                      if (t.source) setSource(t.source);
                      setQ(t.q || t.label);
                      inputRef.current?.focus();
                    }}
                  />
                ) : loading && !data ? (
                  <LoadingBody />
                ) : error ? (
                  <ErrorBody message={error} />
                ) : !data || data.total === 0 ? (
                  <NoResultsBody q={q} />
                ) : (
                  <ResultsBody
                    data={data}
                    active={active}
                    listboxId={listboxId}
                    setActive={setActive}
                    onPick={goToHit}
                    facets={facets}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 shrink-0
                              border-t border-ink-50 bg-ink-50/50 text-[11.5px] text-ink-500">
                <span className="hidden sm:flex items-center gap-2">
                  <KbdPair items={['↑','↓']}/> برای حرکت
                  <KbdPair items={['Enter']}/> برای انتخاب
                  <KbdPair items={['Esc']}/> برای بستن
                </span>
                {q.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => submitForm()}
                    className="inline-flex items-center gap-1.5 text-brand-700
                               font-extrabold hover:text-brand-800 transition-colors"
                  >
                    مشاهده همه‌ی نتایج برای «{q.trim()}»
                    <Glyph glyph="arrow-left" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Subcomponents                                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

function SourceChip({
  label, glyph, accent = 'brand', active, count, onClick,
}: {
  label: string; glyph: string;
  accent: AccentKey; active: boolean; count: number;
  onClick: () => void;
}) {
  const a = ACCENT[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-extrabold
                  tabular-nums transition-all duration-150
                  ${active ? `${a.chipActive} shadow-[0_4px_14px_-4px_rgba(0,0,0,.20)]` : a.chipIdle}`}
    >
      <Glyph glyph={glyph} className="w-3.5 h-3.5" />
      <span>{label}</span>
      {count > 0 && (
        <span className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1
                          rounded-full text-[10.5px] font-extrabold
                          ${active ? 'bg-white/25 text-white' : 'bg-white/70 text-ink-700'}`}>
          {count.toLocaleString('fa-IR')}
        </span>
      )}
    </button>
  );
}

function KbdPair({ items }: { items: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {items.map((k, i) => (
        <kbd key={`${k}-${i}`} className="inline-flex items-center justify-center min-w-[20px] h-5 px-1
                                          rounded bg-white ring-1 ring-ink-200 text-ink-700 font-extrabold
                                          font-sans text-[10.5px]">
          {k}
        </kbd>
      ))}
    </span>
  );
}

function EmptyInputBody({
  recents, onPickRecent, onClearRecents, onPickTrending,
}: {
  recents: string[];
  onPickRecent: (q: string) => void;
  onClearRecents: () => void;
  onPickTrending: (t: { label: string; q: string; source?: SearchSource }) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2.5 text-ink-500">
          <Glyph glyph="flame" className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11.5px] font-extrabold uppercase tracking-wider">جست‌وجوهای پیشنهادی</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING_QUERIES.map((t) => {
            const accent = t.source ? SEARCH_SOURCES[t.source].accent : 'brand';
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => onPickTrending(t)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full
                            ${ACCENT[accent].chipIdle} text-[12px] font-bold transition-all`}
              >
                {t.source && <Glyph glyph={SEARCH_SOURCES[t.source].glyph} className="w-3 h-3" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {recents.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-ink-500">
              <Glyph glyph="clock" className="w-3.5 h-3.5" />
              <span className="text-[11.5px] font-extrabold uppercase tracking-wider">جست‌وجوهای اخیر</span>
            </div>
            <button
              type="button"
              onClick={onClearRecents}
              className="text-[11px] text-ink-400 hover:text-rose-500 font-bold"
            >
              پاک کردن همه
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {recents.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onPickRecent(r)}
                className="group flex items-center gap-3 w-full text-right px-2.5 py-2 rounded-xl
                           hover:bg-ink-50 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-ink-50 text-ink-500 flex items-center justify-center shrink-0">
                  <Glyph glyph="clock" className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 text-[13px] text-ink-800 font-bold truncate">{r}</span>
                <span className="opacity-0 group-hover:opacity-100 text-brand-600 transition-opacity">
                  <Glyph glyph="arrow-left" className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-ink-400 text-center leading-7 py-3">
          عبارت موردنظر را تایپ کنید — می‌توانید بخشی از عنوان کمپین، اسم مددکار،
          نام مدرس، تیتر روایت یا حتی بخشی از نام مجرم را جست‌وجو کنید.
        </p>
      )}
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="p-4 space-y-2.5" aria-live="polite" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-ink-50/60 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-ink-100" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 rounded-full bg-ink-100 w-[60%]" />
            <div className="h-2.5 rounded-full bg-ink-100 w-[40%]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-ink-100" />
        </div>
      ))}
    </div>
  );
}

function ErrorBody({ message }: { message: string }) {
  return (
    <div className="p-6 text-center" role="alert">
      <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
             strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p className="text-[14px] font-extrabold text-ink-900">{message}</p>
      <p className="text-[12px] text-ink-500 mt-1">دوباره تلاش کنید یا عبارت دیگری را امتحان کنید.</p>
    </div>
  );
}

function NoResultsBody({ q }: { q: string }) {
  return (
    <div className="p-6 text-center" aria-live="polite">
      <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600
                      flex items-center justify-center">
        <Glyph glyph="search" className="w-6 h-6" />
      </div>
      <p className="text-[14px] font-extrabold text-ink-900">نتیجه‌ای برای «{q.trim()}» پیدا نشد</p>
      <p className="text-[12px] text-ink-500 mt-1 leading-7">
        عبارت را کوتاه‌تر یا متفاوت‌تر بنویسید، یا فیلترها را تغییر دهید.
      </p>
    </div>
  );
}

function ResultsBody({
  data, active, listboxId, setActive, onPick, facets,
}: {
  data: SearchAggregate;
  active: number;
  listboxId: string;
  setActive: (i: number) => void;
  onPick: (h: SearchHit) => void;
  facets: SearchFacets;
}) {
  let cursor = -1;
  return (
    <div className="py-2">
      {data.groups.map((g) => {
        const meta = SEARCH_SOURCES[g.source];
        const a = ACCENT[meta.accent];
        const sourceFacets = facets[g.source] as Record<string, string> | undefined;
        const seeAllFacets: Record<string, string> = {};
        if (sourceFacets) {
          Object.entries(sourceFacets).forEach(([k, v]) => {
            if (v !== undefined && v !== '') seeAllFacets[k] = String(v);
          });
        }
        return (
          <div key={g.source} className="mb-1.5 last:mb-0">
            <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${a.disc}`}>
                  <Glyph glyph={meta.glyph} className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-ink-600">
                  {meta.label}
                </span>
                <span className="text-[10.5px] text-ink-400 font-bold">
                  ({g.hits.length.toLocaleString('fa-IR')})
                </span>
              </div>
              <Link
                href={meta.seeAllHref(data.q, seeAllFacets)}
                className="text-[11px] font-extrabold text-brand-700 hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
            <ul className="px-1.5">
              {g.hits.map((h) => {
                cursor += 1;
                const idx = cursor;
                const isActive = idx === active;
                return (
                  <li key={h.id} role="option" aria-selected={isActive}
                      id={`${listboxId}-opt-${idx}`}
                      onMouseEnter={() => setActive(idx)}>
                    <button
                      type="button"
                      onClick={() => onPick(h)}
                      className={`w-full text-right flex items-center gap-3 rounded-xl px-2.5 py-2
                                  transition-colors ${isActive ? 'bg-brand-50' : 'hover:bg-ink-50'}`}
                    >
                      <span className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-ink-100">
                        {h.thumb ? (
                          <Image src={h.thumb} alt="" fill sizes="44px" className="object-cover" unoptimized />
                        ) : (
                          <span className={`absolute inset-0 flex items-center justify-center ${a.disc}`}>
                            <Glyph glyph={meta.glyph} className="w-5 h-5" />
                          </span>
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-extrabold text-ink-900 truncate">
                          {h.title}
                        </span>
                        {(h.subtitle || h.badge) && (
                          <span className="block text-[11.5px] text-ink-500 font-medium truncate mt-0.5">
                            {h.subtitle}
                            {h.subtitle && h.badge && <span className="mx-1.5 text-ink-300">·</span>}
                            {h.badge && <span className="text-ink-700 font-bold">{h.badge}</span>}
                          </span>
                        )}
                      </span>
                      {h.pill && (
                        <span className={`shrink-0 inline-flex items-center px-2.5 h-7 rounded-full
                                         text-[11px] font-extrabold ${a.pill}`}>
                          {h.pill}
                        </span>
                      )}
                      <span className={`shrink-0 transition-all
                                       ${isActive ? 'text-brand-600 -translate-x-0.5' : 'text-ink-300'}`}>
                        <Glyph glyph="arrow-left" className="w-4 h-4" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {data.errored.length > 0 && (
        <p className="px-4 pt-2 pb-3 text-[11px] text-ink-400 text-center">
          ({data.errored.length.toLocaleString('fa-IR')} منبع موقتاً در دسترس نبود)
        </p>
      )}
    </div>
  );
}
