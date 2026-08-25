'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * JalaliCalendarField — تقویمِ شمسیِ تمام‌عیار برای تاریخ تولد
 *
 * چرا جایگزینِ سه‌سلکت شد (ریشه‌ی باگِ «کار نمی‌کند»):
 *   نسخه‌ی سلکتی تا وقتی هر سه بخش (روز/ماه/سال) معتبر نبودند null
 *   emit می‌کرد؛ نتیجه: انتخابِ جزئیِ کاربر فوراً دور ریخته می‌شد و
 *   سلکت به placeholder برمی‌گشت — برای کاربری که هنوز birth_date
 *   نداشت، تکمیلِ فیلد غیرممکن بود. تقویم با یک کلیک روی «روز» تاریخِ
 *   کامل و معتبر صادر می‌کند؛ حالتِ جزئی اصلاً وجود ندارد.
 *
 * معماری:
 *   • منبعِ حقیقتِ تقویمی: lib/jalali (الگوریتم jalaali + سوییپِ
 *     اثباتیِ ۲۲هزارروزه) — کبیسه‌ی ۱۴۰۳، اسفند ۳۰روزه، همه صحیح.
 *   • سه نمایِ drill-down: روزها ← ماه‌ها ← سال‌ها؛ سریع‌ترین مسیر به
 *     سال ۱۳۵۰ هم چند ضربه است (سال → ماه → روز).
 *   • سقفِ آینده: تاریخ تولد نمی‌تواند بعد از «امروز» باشد — روزها/
 *     ماه‌ها/سال‌های آینده disabled می‌شوند؛ فلشِ «ماه بعد» روی ماهِ
 *     جاری قفل است.
 *   • چرخه‌حیاتِ پاپ‌اور: همان قراردادِ صنعتیِ usePresence (تخلیه‌ی
 *     تایمریِ تضمینی، بدون اتکا به انیمیشن) + keyframesهای CSS.
 *   • RTLِ واقعی: هفته از «شنبه» شروع می‌شود؛ ستونِ روز اول از روی
 *     getDayِ گرگوریانِ معادلِ ۱ هر ماه محاسبه می‌شود.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  JALALI_MONTH_NAMES,
  fromJalali,
  jalaliMonthLength,
  todayJalali,
  type JalaliDate,
} from '@/lib/jalali';
import { formatJalaliYear } from '@/lib/persian-time';
import { cn, formatPersianNumber } from '@/lib/utils';
import { usePresence } from '@/lib/use-presence';

const MIN_YEAR = 1300;
const YEAR_PAGE = 12;
const WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;
const WEEKDAY_FULL = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const;

type View = 'days' | 'months' | 'years';

function compareJalali(a: JalaliDate, b: JalaliDate): number {
  if (a.jy !== b.jy) return a.jy < b.jy ? -1 : 1;
  if (a.jm !== b.jm) return a.jm < b.jm ? -1 : 1;
  if (a.jd !== b.jd) return a.jd < b.jd ? -1 : 1;
  return 0;
}

/** ستونِ شنبه-مبنای ۱امِ ماه (۰=شنبه … ۶=جمعه) از روی گرگوریانِ معادل */
function firstWeekdayColumn(jy: number, jm: number): number {
  const g = fromJalali(jy, jm, 1);
  return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
}

/** شبکه‌ی ۷ستونه‌ی ماه: null برای خانه‌های خالیِ ابتدا/انتهای هفته */
function monthGrid(jy: number, jm: number): (number | null)[] {
  const cells: (number | null)[] = Array.from({ length: firstWeekdayColumn(jy, jm) }, () => null);
  for (let d = 1; d <= jalaliMonthLength(jy, jm); d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function JalaliCalendarField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label?: string;
  value: JalaliDate | null;
  onChange: (value: JalaliDate) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const today = useMemo(() => todayJalali(), []);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('days');
  const [cursor, setCursor] = useState<{ jy: number; jm: number }>({
    jy: today.jy,
    jm: today.jm,
  });
  /** جهتِ ترنزیشن: پیش‌روی در زمان = ورود از چپ (fwd) در چیدمانِ RTL */
  const [dir, setDir] = useState<1 | -1>(1);
  const [yearPage, setYearPage] = useState(today.jy - (YEAR_PAGE - 1));
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { rendered, closing } = usePresence(open, 140);

  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) {
      // بعد از انیمیشنِ خروج، فوکوس به تریگر برگردد
      window.setTimeout(() => triggerRef.current?.focus(), 150);
    }
  };

  // بازشدن → مکان‌نما روی ماهِ مقدار (یا امروز) و نمایِ روزها
  useEffect(() => {
    if (!open) return;
    const base = value ?? today;
    setCursor({ jy: base.jy, jm: base.jm });
    setYearPage(Math.min(Math.max(base.jy - 6, MIN_YEAR), today.jy - (YEAR_PAGE - 1)));
    setView('days');
    setDir(1);
    // عمداً فقط روی لبه‌ی بازشدن — مقدار/امروز لحظه‌ی بازشدن خوانده می‌شوند
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // بستن با کلیک بیرون یا Esc — همان قراردادِ منوی هدر
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const atCurrentMonth = cursor.jy > today.jy || (cursor.jy === today.jy && cursor.jm >= today.jm);
  const atMinMonth = cursor.jy <= MIN_YEAR && cursor.jm <= 1;

  const goMonth = (delta: 1 | -1) => {
    setDir(delta);
    setCursor((c) => {
      let { jy, jm } = c;
      jm += delta;
      if (jm > 12) {
        jm = 1;
        jy = Math.min(jy + 1, today.jy);
      } else if (jm < 1) {
        jm = 12;
        jy = Math.max(jy - 1, MIN_YEAR);
      }
      return { jy, jm };
    });
  };

  const pickDay = (jd: number) => {
    const picked: JalaliDate = { jy: cursor.jy, jm: cursor.jm, jd };
    if (compareJalali(picked, today) > 0) return;
    onChange(picked);
    close();
  };

  const pickMonth = (jm: number) => {
    if (cursor.jy === today.jy && jm > today.jm) return;
    setDir(1);
    setCursor((c) => ({ ...c, jm }));
    setView('days');
  };

  const pickYear = (jy: number) => {
    if (jy > today.jy) return;
    setDir(1);
    setCursor((c) => ({
      jy,
      jm: jy === today.jy && c.jm > today.jm ? today.jm : c.jm,
    }));
    setView('months');
  };

  const cells = useMemo(() => monthGrid(cursor.jy, cursor.jm), [cursor.jy, cursor.jm]);
  const years = useMemo(() => {
    const start = Math.min(Math.max(yearPage, MIN_YEAR), today.jy - (YEAR_PAGE - 1));
    return Array.from({ length: YEAR_PAGE }, (_, i) => start + i).filter((y) => y <= today.jy);
  }, [yearPage, today.jy]);

  const triggerText = value
    ? `${formatPersianNumber(value.jd)} ${JALALI_MONTH_NAMES[value.jm - 1]} ${formatJalaliYear(value.jy)}`
    : null;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block text-[13px] font-bold text-ink-900">
          {label}
        </label>
      ) : null}

      <div ref={wrapRef} className="relative">
        {/* ── تریگر ─────────────────────────────────────────────── */}
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={
            triggerText
              ? `${label ?? 'تاریخ تولد'}: ${triggerText}`
              : `${label ?? 'تاریخ تولد'} — انتخاب کنید`
          }
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-12 w-full items-center gap-2.5 rounded-xl border bg-ink-50/60 px-3.5 text-right text-[13.5px] transition-all duration-200',
            'outline-none hover:border-ink-200/80 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15'
              : 'border-ink-200',
            open && !error && 'border-brand-500 bg-white ring-4 ring-brand-500/15',
          )}
        >
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              triggerText ? 'bg-brand-500/10 text-brand-600' : 'bg-ink-100 text-ink-400',
            )}
          >
            <CalendarDays className="h-[17px] w-[17px]" strokeWidth={2.2} />
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 truncate font-bold',
              triggerText ? 'text-ink-900' : 'font-medium text-ink-400',
            )}
          >
            {triggerText ?? 'انتخاب تاریخ تولد'}
          </span>
          <ChevronLeft
            className={cn(
              'h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200',
              open ? '-rotate-90' : 'rotate-0',
            )}
          />
        </button>

        {/* ── پاپ‌اور تقویم ─────────────────────────────────────── */}
        {rendered ? (
          // لایه‌ی بیرونی فقط جای‌گذاری و وسط‌چین؛ انیمیشن (transform)
          // روی لایه‌ی درونی است تا با -translate-x-1/2 تداخل نکند.
          <div className="absolute left-1/2 top-[calc(100%+8px)] z-[80] w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2">
            <div
              role="dialog"
              aria-label="تقویم انتخاب تاریخ تولد"
              aria-hidden={closing || undefined}
              inert={closing || undefined}
              className={cn(
                'overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_24px_48px_-16px_rgba(15,20,32,.28)]',
                closing ? 'ui-menu-exit pointer-events-none' : 'ui-menu-enter',
              )}
            >
              {/* هدر: ناوبری ماه/سال + ورود به نماهای سریع */}
              <div className="flex items-center justify-between gap-1 border-b border-ink-100 bg-ink-50/40 px-2 py-2">
                <button
                  type="button"
                  aria-label={view === 'years' ? 'دوازده سال قبل' : 'ماه قبل'}
                  disabled={view === 'days' ? atMinMonth : yearPage <= MIN_YEAR}
                  onClick={() =>
                    view === 'years'
                      ? (setDir(-1), setYearPage((p) => Math.max(p - YEAR_PAGE, MIN_YEAR)))
                      : goMonth(-1)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 transition-all hover:bg-white hover:text-brand-700 hover:shadow-sm disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="انتخاب ماه"
                    onClick={() => (setDir(1), setView(view === 'months' ? 'days' : 'months'))}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-[13px] font-extrabold transition-colors',
                      view === 'months'
                        ? 'bg-brand-500/10 text-brand-700'
                        : 'text-ink-800 hover:bg-white hover:text-brand-700',
                    )}
                  >
                    {view === 'years'
                      ? `${formatJalaliYear(years[0] ?? cursor.jy)} – ${formatJalaliYear(years[years.length - 1] ?? cursor.jy)}`
                      : JALALI_MONTH_NAMES[cursor.jm - 1]}
                  </button>
                  {view !== 'years' ? (
                    <button
                      type="button"
                      aria-label="انتخاب سال"
                      onClick={() => (setDir(1), setView('years'))}
                      className="rounded-lg px-2.5 py-1.5 text-[13px] font-extrabold text-ink-800 transition-colors hover:bg-white hover:text-brand-700"
                    >
                      {formatJalaliYear(cursor.jy)}
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  aria-label={view === 'years' ? 'دوازده سال بعد' : 'ماه بعد'}
                  disabled={view === 'days' ? atCurrentMonth : yearPage + YEAR_PAGE > today.jy}
                  onClick={() =>
                    view === 'years'
                      ? (setDir(1),
                        setYearPage((p) => Math.min(p + YEAR_PAGE, today.jy - (YEAR_PAGE - 1))))
                      : goMonth(1)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 transition-all hover:bg-white hover:text-brand-700 hover:shadow-sm disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>

              <div className="p-3">
                {/* ── نمای روزها ── */}
                {view === 'days' ? (
                  <div
                    key={`${cursor.jy}-${cursor.jm}`}
                    className={dir === 1 ? 'cal-slide-fwd' : 'cal-slide-bwd'}
                  >
                    <div className="mb-1.5 grid grid-cols-7">
                      {WEEKDAY_SHORT.map((w, i) => (
                        <span
                          key={w}
                          title={WEEKDAY_FULL[i]}
                          className="flex h-7 items-center justify-center text-[10.5px] font-extrabold text-ink-400"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                    <div
                      role="grid"
                      aria-label={`${JALALI_MONTH_NAMES[cursor.jm - 1]} ${formatJalaliYear(cursor.jy)}`}
                      className="grid grid-cols-7 gap-y-0.5"
                    >
                      {cells.map((d, i) => {
                        if (d === null) return <span key={`x${i}`} aria-hidden="true" />;
                        const cell: JalaliDate = { jy: cursor.jy, jm: cursor.jm, jd: d };
                        const future = compareJalali(cell, today) > 0;
                        const selected = value ? compareJalali(cell, value) === 0 : false;
                        const isToday = compareJalali(cell, today) === 0;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="gridcell"
                            disabled={future}
                            aria-selected={selected || undefined}
                            aria-label={`${formatPersianNumber(d)} ${JALALI_MONTH_NAMES[cursor.jm - 1]} ${formatJalaliYear(cursor.jy)}`}
                            onClick={() => pickDay(d)}
                            className={cn(
                              'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[12.5px] font-bold tabular-nums transition-all duration-150',
                              selected
                                ? 'scale-105 bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_16px_-6px_rgba(13,128,116,.55)]'
                                : future
                                  ? 'cursor-not-allowed text-ink-300'
                                  : 'text-ink-700 hover:bg-brand-500/10 hover:text-brand-700 active:scale-95',
                              isToday &&
                                !selected &&
                                'font-extrabold text-brand-700 ring-1 ring-inset ring-brand-500/50',
                            )}
                          >
                            {formatPersianNumber(d)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* ── نمای ماه‌ها ── */}
                {view === 'months' ? (
                  <div key={`m${cursor.jy}`} className="cal-view-in grid grid-cols-3 gap-1.5">
                    {JALALI_MONTH_NAMES.map((name, i) => {
                      const m = i + 1;
                      const futureMonth = cursor.jy === today.jy && m > today.jm;
                      const isCurrent = cursor.jy === today.jy && m === today.jm;
                      const isSelected = value ? value.jy === cursor.jy && value.jm === m : false;
                      return (
                        <button
                          key={name}
                          type="button"
                          disabled={futureMonth}
                          onClick={() => pickMonth(m)}
                          className={cn(
                            'rounded-xl px-1 py-2.5 text-[12.5px] font-bold transition-all duration-150',
                            isSelected
                              ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_16px_-6px_rgba(13,128,116,.5)]'
                              : futureMonth
                                ? 'cursor-not-allowed text-ink-300'
                                : 'text-ink-700 hover:bg-brand-500/10 hover:text-brand-700 active:scale-95',
                            isCurrent &&
                              !isSelected &&
                              'text-brand-700 ring-1 ring-inset ring-brand-500/50',
                          )}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {/* ── نمای سال‌ها ── */}
                {view === 'years' ? (
                  <div
                    key={`y${yearPage}`}
                    className="cal-view-in grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto"
                  >
                    {years.map((y) => {
                      const isCurrent = y === today.jy;
                      const isSelected = value?.jy === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => pickYear(y)}
                          className={cn(
                            'rounded-xl px-1 py-2.5 text-[12.5px] font-bold tabular-nums transition-all duration-150',
                            isSelected
                              ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_16px_-6px_rgba(13,128,116,.5)]'
                              : 'text-ink-700 hover:bg-brand-500/10 hover:text-brand-700 active:scale-95',
                            isCurrent &&
                              !isSelected &&
                              'text-brand-700 ring-1 ring-inset ring-brand-500/50',
                          )}
                        >
                          {formatJalaliYear(y)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[12px] font-medium leading-5 text-rose-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
