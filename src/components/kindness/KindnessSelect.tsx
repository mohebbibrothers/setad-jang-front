'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessSelect — لیستِ کشوییِ ساختهٔ دست (جایگزینِ select بومی)
 *
 * چرا ساخته‌شده؟ منوی بومیِ مرورگر با استایلِ خانه قابلِ آرایش نیست: فلشِ
 * زشتِ سیستم، اسکرول‌بارِ پیش‌فرض، هایلایتِ آبیِ ویندوز و اندازهٔ متفاوت در
 * هر دستگاه. این کامپوننت:
 *
 *   • پنل را با createPortal روی body می‌برد → هرگز با overflow والدها بریده
 *     نمی‌شود (همان درسِ شیتِ راه‌های ارتباط).
 *   • موقعیت با fixed + اندازه‌گیریِ rect محاسبه می‌شود؛ اگر پایین جایش نبود
 *     به‌بالا فلیپ می‌کند و همیشه ≥۸px از لبه‌های دید فاصله دارد.
 *   • موبایل (<۶۴۰px) → پنل به «کارتِ پایین‌چسب» تبدیل می‌شود: تمام‌عرض،
 *     گوشه‌های بالا گرد، هدرِ عنوانِ کوچک + بستن، اسکرولِ داخلی لمس‌پذیر.
 *   • فلش در سمت راستِ فیلد و دقیقاً وسط‌عمودی؛ با باز شدن می‌چرخد.
 *   • نقش‌های ARIA کامل: trigger با aria-haspopup/aria-expanded، پنل
 *     role=listbox، هر ردیف role=option با aria-selected؛ ناوبری با
 *     ↑/↓/Home/End/Enter/Escape + برگشتِ فوکوس به trigger.
 *   • حالت‌های اختیاری: `searchable` (فیلترِ درونِ پنل + امکانِ «اعمالِ
 *     عبارت» برای مقادیرِ آزادِ بک‌اند مثل شهر) و `clearLabel` (ردیفِ
 *     «همه …» برای پاک‌کردنِ فیلتر).
 *   • اسکرول‌بارِ پنل = همان زبانِ بصریِ سایت (`.kw-scroll` در globals.css).
 * ───────────────────────────────────────────────────────────────────────────
 */

export type KindnessOption = {
  value: string;
  label: string;
  /** ایموجیِ اختیاری (دسته‌ها) — در سمتِ راستِ برچسب می‌نشیند. */
  icon?: string;
  /** متنِ کمکیِ لایهٔ دوم (مثلاً «۱۲ آگهی»). */
  hint?: string;
};

const MOBILE_BREAKPOINT = 640;
const EDGE = 8;
const PANEL_MAX_H = 316;

type PanelBox = { top: number; left: number; width: number; maxHeight: number; above: boolean };

export function KindnessSelect({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
  searchPlaceholder = 'جست‌وجو…',
  clearLabel,
  /** برچسبِ کوچکِ بالای مقدارِ انتخاب‌شده (الگوی فیلترِ حرفه‌ای). */
  stackedLabel,
  leadingIcon: Leading,
  className,
  testId,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: KindnessOption[];
  placeholder: string;
  /** فیلترِ درونِ پنل + امکانِ اعمالِ عبارتِ آزاد (شهرِ دلخواه). */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** برچسبِ ردیفِ پاک‌کردن («همهٔ استان‌ها») — فقط وقتی مقدار انتخاب شده. */
  clearLabel?: string;
  /** برچسبِ کوچکِ ثابت (۹.۵px) بالای مقدار — جای پیشوندِ بلندِ بریده‌شده. */
  stackedLabel?: string;
  leadingIcon?: typeof Search;
  className?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [box, setBox] = useState<PanelBox>({
    top: 0,
    left: 0,
    width: 240,
    maxHeight: PANEL_MAX_H,
    above: false,
  });
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  /* ردیف‌های نمایشی: ترکیبِ «همه …» (اگر لازم) + گزینه‌ها + عبارتِ آزاد */
  const rows = useMemo<KindnessOption[]>(() => {
    const base: KindnessOption[] = [];
    if (clearLabel && value) base.push({ value: '', label: clearLabel });
    base.push(...options);
    return base;
  }, [clearLabel, options, value]);

  const q = query.trim();
  const filtered = useMemo(() => {
    if (!searchable || !q) return rows;
    return rows.filter((r) => r.label.includes(q) || r.value.includes(q));
  }, [rows, q, searchable]);

  /* عبارتِ آزاد: فقط وقتی هیچ گزینه‌ای با این عبارت پیدا نشد، اجازهٔ اعمالش
     را بده (بک‌اند province/city را iexact می‌گیرد، پس رشتهٔ دلخواه معتبر
     است). شرطِ «نتیجهٔ خالی» عمدی است: با «پیشوند» ردیفِ تکراری می‌ساخت
     («اصفه» → هم اصفهان، هم «اعمال اصفه»). */
  const freeTerm = searchable && q && filtered.length === 0 ? q : null;
  const visible = useMemo<KindnessOption[]>(
    () => (freeTerm ? [...filtered, { value: freeTerm, label: `اعمال «${freeTerm}»` }] : filtered),
    [filtered, freeTerm],
  );

  /* ── اندازه‌گیریِ موقعیت (fixed) ─────────────────────────────────────── */
  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(r.width, searchable ? 268 : 244), vw - EDGE * 2);
    const spaceBelow = vh - r.bottom - EDGE * 2;
    const spaceAbove = r.top - EDGE * 2;
    const above = spaceBelow < Math.min(PANEL_MAX_H, 220) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(180, Math.min(PANEL_MAX_H, above ? spaceAbove : spaceBelow));
    const rawLeft = r.right - width; // RTL: همراستا با لبهٔ راستِ فیلد
    const left = Math.min(Math.max(EDGE, rawLeft), vw - width - EDGE);
    setBox({ top: above ? r.top - 6 : r.bottom + 6, left, width, maxHeight, above });
  }, [searchable]);

  const openPanel = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    measure();
    setQuery('');
    setActive(
      Math.max(
        0,
        visible.findIndex((r) => r.value === value),
      ),
    );
    setOpen(true);
  }, [measure, value, visible]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const choose = useCallback(
    (v: string) => {
      onChange(v);
      close();
    },
    [onChange, close],
  );

  useLayoutEffect(() => {
    if (open && !isMobile) measure();
  }, [open, isMobile, measure]);

  /* ESC + کلیک بیرون + اسکرول/ریسایز (بستنِ مؤدب: بدون پرش) */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      close(false);
    };
    const onReflow = () => {
      if (!isMobile) measure();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, isMobile, close, measure]);

  /* فوکوسِ ورودیِ جست‌وجو (دسکتاپ) + قفلِ اسکرولِ بدنه (موبایل) */
  useEffect(() => {
    if (!open) return;
    if (isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    const t = setTimeout(() => searchRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open, isMobile]);

  /* اسکرولِ ردیفِ فعال به دید */
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) setOpen(false);
      else openPanel();
    }
  };

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(visible.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = visible[active];
      if (row) choose(row.value);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  const panel = (
    <div
      className={cn('fixed z-[92]', isMobile ? 'inset-x-0 bottom-0' : 'origin-top')}
      style={
        isMobile
          ? undefined
          : {
              top: box.top,
              left: box.left,
              width: box.width,
              transform: box.above ? 'translateY(-100%)' : undefined,
            }
      }
    >
      <div
        ref={panelRef}
        role="listbox"
        id={listId}
        aria-label={ariaLabel}
        onKeyDown={onPanelKey}
        tabIndex={-1}
        className={cn(
          /* relative ضروری است: نوارِ گرادیانِ بالای پنل absolute است و بدونِ
             این، از بالای پنل بیرون می‌زند و به فیلدِ trigger می‌چسبد. */
          'relative flex flex-col overflow-hidden border border-ink-100 bg-white outline-none',
          isMobile
            ? 'rounded-t-[26px] shadow-[0_-18px_50px_-18px_rgba(11,53,48,.35)]'
            : 'rounded-2xl shadow-[0_26px_60px_-22px_rgba(11,53,48,.35)] ring-1 ring-ink-950/[.03]',
        )}
        style={isMobile ? { maxHeight: '72dvh' } : { maxHeight: box.maxHeight }}
      >
        {/* دسته‌گیرِ بصری (فقط موبایل) + نوارِ برندِ بالای پنل */}
        {isMobile && (
          <div aria-hidden="true" className="flex justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-ink-200" />
          </div>
        )}
        <div
          aria-hidden="true"
          className="h-[3px] w-full bg-[linear-gradient(90deg,#0D8074,#0A6E64_55%,#7DD3C0)]"
        />

        {/* هدرِ موبایل */}
        {isMobile && (
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-[12.5px] font-extrabold text-ink-800">{ariaLabel}</p>
            <button
              type="button"
              onClick={() => close()}
              aria-label="بستن فهرست"
              className="grid h-8 w-8 place-items-center rounded-full bg-ink-100 text-ink-600 transition-colors hover:bg-ink-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {searchable && (
          <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder={searchPlaceholder}
              aria-label={`${ariaLabel} — جست‌وجو در فهرست`}
              /* رینگِ فوکوسِ سراسریِ سایت (globals: :where(input):focus-visible)
                 داخلِ پنل جعبهٔ سبزِ زشتی می‌سازد؛ این‌جا خودِ ردیفِ جست‌وجو
                 نقشِ «فیلدِ فعال» را دارد پس رینگ خنثی می‌شود. */
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActive(0);
                  searchRef.current?.focus();
                }}
                aria-label="پاک‌کردن جست‌وجوی فهرست"
                className="grid h-6 w-6 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="kw-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
          {visible.length === 0 && (
            <p className="px-3 py-5 text-center text-[12px] font-bold text-ink-400">
              چیزی پیدا نشد.
            </p>
          )}
          {visible.map((row, i) => {
            const isSelected = row.value === value;
            const isActive = i === active;
            return (
              <button
                key={`${row.value}-${i}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-idx={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(row.value)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right transition-colors sm:py-2.5',
                  isActive ? 'bg-brand-50' : 'bg-transparent',
                  isSelected && !isActive && 'bg-ink-50',
                )}
              >
                {row.icon && (
                  <span aria-hidden="true" className="shrink-0 text-[15px] leading-none">
                    {row.icon}
                  </span>
                )}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[13px]',
                    isSelected ? 'font-extrabold text-brand-800' : 'font-bold text-ink-700',
                  )}
                >
                  {row.label}
                </span>
                {row.hint && (
                  <span className="shrink-0 text-[10.5px] font-bold tabular-nums text-ink-400">
                    {row.hint}
                  </span>
                )}
                {/* نشانگرِ انتخاب در انتهای مسیرِ خواندن (چپ در RTL) — متن از
                    راست شروع می‌شود و ردیف‌ها با هم تراز می‌مانند. */}
                <span
                  className={cn(
                    'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors',
                    isSelected
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-ink-200 text-transparent',
                  )}
                  aria-hidden="true"
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close(false) : openPanel())}
        onKeyDown={onTriggerKey}
        data-testid={testId}
        data-open={open || undefined}
        className={cn(
          'group inline-flex h-[52px] w-full items-center gap-2 rounded-2xl border bg-white px-3 text-right transition-all duration-200',
          'border-ink-200 hover:border-brand-300',
          open
            ? 'border-brand-500 shadow-[0_0_0_4px_rgba(13,128,116,.10)]'
            : 'shadow-[0_1px_2px_rgba(15,20,32,.04)]',
          'focus:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/25',
          className,
        )}
      >
        {Leading && (
          <Leading
            className="h-4 w-4 shrink-0 text-ink-400 transition-colors group-hover:text-brand-500"
            aria-hidden="true"
          />
        )}
        {selected?.icon && (
          <span aria-hidden="true" className="shrink-0 text-[15px] leading-none">
            {selected.icon}
          </span>
        )}
        {selected && stackedLabel ? (
          /* دو‌سطری: برچسبِ کارکرد + مقدار — مقدار هرگز بریده نمی‌شود و فیلد
             هم باریک‌تر از «پیشوند + مقدار» در یک خط می‌ماند. */
          <span className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-[9.5px] font-bold leading-3 text-ink-400">{stackedLabel}</span>
            <span className="max-w-full truncate text-[12.5px] font-extrabold leading-5 text-ink-900">
              {selected.label}
            </span>
          </span>
        ) : (
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[13px]',
              selected ? 'font-extrabold text-ink-900' : 'font-bold text-ink-400',
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 group-hover:text-brand-500',
            open && 'rotate-180 text-brand-600',
          )}
        />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {isMobile && (
              <div
                aria-hidden="true"
                onClick={() => close(false)}
                className="fixed inset-0 z-[91] bg-ink-950/35 backdrop-blur-[2px]"
              />
            )}
            {panel}
          </>,
          document.body,
        )}
    </>
  );
}
