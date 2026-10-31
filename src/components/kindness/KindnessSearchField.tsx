'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessSearchField — فیلدِ جست‌وجوی تخته (کاملاً کنترل‌شده و بی‌پرش)
 *
 * سه باگِ نسخهٔ پیشین و ریشه‌ای‌ترین درمانشان:
 *
 *  ۱) «متن وسطِ تایپ می‌پرد» — علتش نبردِ state محلی با propِ سروری بود:
 *     هر پاسخِ RSC مقدارِ تازه‌ای می‌داد و هر بار مکان‌نما به آخر می‌رفت.
 *     درمان: مقدارِ محلی فقط با تغییراتی سینک می‌شود که «از بیرون» آمده‌اند
 *     (چیپِ حذف فیلتر / Back / لینکِ تازه)؛ ناوبری‌هایی که خودمان شروع
 *     کرده‌ایم در `lastPushed` مُهر می‌خورند و propِ برگشتی همان است ⇒ هیچ
 *     بازنویسی‌ای رخ نمی‌دهد. یک اینپوت، یک منبعِ حقیقت در لحظهٔ تایپ.
 *
 *  ۲) «اسپینر به پایین می‌رفت» — آیکن با absolute+top-1/2 بدون تبدیلِ
 *     درست و بدون خطِ مبنا بیرون می‌زد. درمان: چیدمانِ فلکسِ تک‌خط با
 *     `items-center` (هیچ absolute‌ای) + جایگاهِ ثابتِ اسپینر (همیشه رزرو
 *     شده، فقط opacity عوض می‌شود) ⇒ نه پرشِ چیدمان، نه جابه‌جایی.
 *
 *  ۳) «ضربدرِ آبیِ ناهمخوان» — دکمهٔ پاک‌کردنِ بومیِ input[type=search] در
 *     کروم آبی است و قابلِ استایل نیست. درمان: `type="text"` + دکمهٔ سفارشیِ
 *     هم‌خانواده (خاکستریِ سایت با hover برند و فوکوس‌رینگ)، فقط وقتی متن هست.
 *
 * رفتار جست‌وجو: debounceِ ۴۵۰ms، ولی اگر ناوبریِ قبلی هنوز در جریان باشد
 * (pending) به‌جای کوبیدنِ درخواست روی درخواست، در پایانِ آن یک‌بار اعمال
 * می‌شود. Enter/دکمه = اعمالِ فوری. `replace` با `scroll:false` ⇒ تایپ بدونِ
 * پریدنِ صفحه.
 * ───────────────────────────────────────────────────────────────────────────
 */

const DEBOUNCE_MS = 450;

export function KindnessSearchField({
  value,
  onNavigate,
  pending,
  placeholder = 'جست‌وجو در عنوان و شرح نیازها…',
  mobilePlaceholder = 'جست‌وجو در نیازها…',
  label = 'جست‌وجو در آگهی‌های دیوار مهربانی',
}: {
  /** مقدارِ فعلیِ فیلتر (از URL). */
  value: string;
  /** اعمالِ عبارت — مسئولِ ناوبری/state سروری. */
  onNavigate: (next: string) => void;
  /** آیا ناوبری در جریان است؟ (useTransition) */
  pending: boolean;
  placeholder?: string;
  /** نسخهٔ کوتاهِ placeholder برای فیلدهای باریک (جلوگیری از بریدگیِ زشت). */
  mobilePlaceholder?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(value);

  /* عرضِ فیلد < 420px (موبایل/تبلتِ باریک) ⇒ placeholder کوتاه. با
     ResizeObserver به‌جای حدسِ بریک‌پوینت، چون همین فیلد در گریدهای مختلف
     عرضِ متفاوت می‌گیرد و باید همیشه «بدونِ بریدگی» بماند. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setCompact(el.clientWidth < 420);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** آخرین مقداری که خودمان به URL فرستادیم — مبنای تشخیص «تغییرِ بیرونی». */
  const lastPushed = useRef(value);
  /** عبارتی که به‌خاطر pending به تعویق افتاد. */
  const deferred = useRef<string | null>(null);

  /* سینکِ بیرونی: فقط وقتی prop با آنچه خودمان فرستادیم متفاوت است.
     مقایسهٔ مقدارِ خام کافی است چون همین را به URL دادیم. */
  useEffect(() => {
    if (value !== lastPushed.current) {
      lastPushed.current = value;
      setDraft(value);
      deferred.current = null;
    }
  }, [value]);

  /* وقتی pending تمام شد، عبارتِ به‌تعویق‌افتاده را یک‌بار اعمال کن. */
  useEffect(() => {
    if (!pending && deferred.current !== null) {
      const next = deferred.current;
      deferred.current = null;
      if (next !== value) {
        lastPushed.current = next;
        onNavigate(next);
      }
    }
  }, [pending, onNavigate, value]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const commit = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (next === lastPushed.current) return;
    if (pending) {
      deferred.current = next;
      return;
    }
    lastPushed.current = next;
    onNavigate(next);
  };

  const schedule = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), DEBOUNCE_MS);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'group flex h-[52px] w-full min-w-0 items-center gap-1.5 rounded-2xl border bg-white pe-1.5 ps-3 transition-all duration-200',
        'border-ink-200 shadow-[0_1px_2px_rgba(15,20,32,.04)]',
        'hover:border-brand-300',
        'focus-within:border-brand-500 focus-within:shadow-[0_0_0_4px_rgba(13,128,116,.10)]',
      )}
      data-testid="kw-search-field"
    >
      <Search
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-ink-400 transition-colors group-focus-within:text-brand-600"
      />

      <input
        ref={inputRef}
        type="text"
        enterKeyHint="search"
        role="searchbox"
        name="search"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          schedule(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Escape' && draft) {
            e.preventDefault();
            setDraft('');
            commit('');
          }
        }}
        placeholder={compact ? mobilePlaceholder : placeholder}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        /* overflow-hidden + text-ellipsis: اگر placeholder از عرضِ فیلد بلندتر
           شد، مرورگر «…» می‌گذارد نه بریدگیِ خام. */
        className="h-full min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap bg-transparent text-[13px] font-bold text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      {/* جایگاهِ ثابتِ اسپینر — همیشه رزرو، فقط شفافیت عوض می‌شود (بدون پرش) */}
      <span
        aria-hidden="true"
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center transition-opacity duration-150',
          pending ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-brand-500 motion-reduce:animate-none" />
      </span>

      {/* پاک‌کردن — فقط با متن؛ استایلِ سایت، نه ضربدرِ آبیِ مرورگر */}
      {draft.length > 0 && !pending && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            commit('');
            inputRef.current?.focus();
          }}
          aria-label="پاک‌کردن جست‌وجو"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}

      {/* اکشن: آیکن در حالتِ بی‌متن، دکمهٔ کاملِ برند در حالتِ متن‌دار */}
      <button
        type="button"
        onClick={() => commit(draft)}
        aria-label="اعمال جست‌وجو"
        className={cn(
          'inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-3 text-[12.5px] font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
          draft.length > 0
            ? 'bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] hover:brightness-[1.08] active:scale-[.97]'
            : 'bg-ink-50 text-ink-600 hover:bg-brand-50 hover:text-brand-700',
        )}
      >
        جست‌وجو
      </button>
    </div>
  );
}
