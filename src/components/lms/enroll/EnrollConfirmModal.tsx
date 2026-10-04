'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  Award,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  MessagesSquare,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

import { SmartImage } from '@/components/ui/SmartImage';
import { effectiveLessonsCount, lessonCountFact, type LmsCourseDetail } from '@/lib/lms-shared';
import { lockBodyScroll } from '@/lib/scroll-lock';
import { usePresence } from '@/lib/use-presence';

const EXIT_MS = 220;

type Props = {
  open: boolean;
  course: Pick<LmsCourseDetail, 'title' | 'lessonsCount' | 'coverUrl' | 'slug'>;
  /** در حالِ ارسالِ POST ثبت‌نام — دکمه‌ها قفل و اسپینر می‌خورند. */
  busy: boolean;
  /** پیام خطای ثبت‌نام (اگر تلاش قبلی ناموفق بود) تا داخل همان پنجره دیده شود. */
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * پنجره‌ی تأیید ثبت‌نام — «لحظه‌ی رزروی صندلی».
 *
 * به‌جای ثبت‌نامِ خشکِ یک‌کلیکی، یک میکرو-سرمونیِ خوش‌ساخت: کاور کلاس،
 * وعده‌های دقیق (جلسات، آزمون و گواهی، پرسش‌وپاسخ، بدونِ محدودیتِ زمان)،
 * نشانِ «رایگان — برای همیشه» و یک تأییدِ آگاهانه. ثبت‌نام فقط بعد از
 * تأیید ارسال می‌شود.
 *
 * نظمِ چرخه‌حیات مثل AuthModal v3: usePresence (تخلیه‌ی تضمینی با تایمرِ
 * بومی)، قفلِ اسکرولِ شمارش‌مرجعی تا وقتی لایه رندر است، Esc فقط در فازِ
 * باز، قطعِ تعامل هنگامِ خروج، و بازگردانیِ فوکوس به عنصرِ قبلی.
 */
export function EnrollConfirmModal({ open, course, busy, error, onConfirm, onClose }: Props) {
  const { rendered, closing } = usePresence(open, EXIT_MS);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<Element | null>(null);

  // قفلِ اسکرول + بازگردانیِ فوکوس — جفت با rendered
  useEffect(() => {
    if (!rendered) return;
    restoreFocusRef.current = document.activeElement;
    const release = lockBodyScroll();
    closeRef.current?.focus();
    return () => {
      release();
      const prev = restoreFocusRef.current;
      if (prev instanceof HTMLElement && document.contains(prev))
        prev.focus({ preventScroll: true });
    };
  }, [rendered]);

  // Esc فقط در فازِ باز و وقتی مشغولِ ارسال نیستیم
  useEffect(() => {
    if (!rendered || closing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [rendered, closing, busy, onClose]);

  const tryClose = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  if (!rendered) return null;

  const lessons = lessonCountFact(effectiveLessonsCount(course));

  return (
    <div
      className={`fixed inset-0 z-[80] grid place-items-center overflow-y-auto p-4 sm:p-6 ${closing ? 'pointer-events-none' : ''}`}
      role="presentation"
    >
      <style>{`
        @keyframes enrollx-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes enrollx-panel-in {
          from { opacity: 0; transform: translateY(26px) scale(.96) }
          to   { opacity: 1; transform: translateY(0)    scale(1)   }
        }
        @keyframes enrollx-panel-out {
          from { opacity: 1; transform: translateY(0)    scale(1)   }
          to   { opacity: 0; transform: translateY(14px) scale(.97) }
        }
        @keyframes enrollx-glow { 0%,100% { opacity:.55 } 50% { opacity:.95 } }
      `}</style>

      {/* پرده */}
      <button
        type="button"
        aria-label="بستن پنجره‌ی تأیید ثبت‌نام"
        onClick={tryClose}
        className="absolute inset-0 cursor-default bg-ink-950/65 backdrop-blur-sm"
        style={{ animation: 'enrollx-backdrop-in .25s ease-out both' }}
      />

      {/* پنل */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="enrollx-title"
        aria-describedby="enrollx-desc"
        inert={closing ? true : undefined}
        className="relative w-full max-w-md overflow-hidden rounded-[26px] bg-ink-900 text-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)] ring-1 ring-white/10"
        style={{
          animation: closing
            ? `enrollx-panel-out ${EXIT_MS}ms ease-in both`
            : 'enrollx-panel-in .34s cubic-bezier(.22,1,.36,1) both',
        }}
      >
        {/* بافت + هاله‌ها — زبانِ هیروهای تیره‌ی سایت */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[.5]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 14px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-mint-500/20 blur-3xl"
          style={{ animation: 'enrollx-glow 4.5s ease-in-out infinite' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 bottom-0 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl"
        />

        {/* سربرگ: کاور + عنوانِ کلاس + نشانِ رایگان */}
        <div className="relative flex items-center gap-3.5 border-b border-white/10 px-5 py-4 sm:px-6">
          <span className="relative h-14 w-[84px] shrink-0 overflow-hidden rounded-xl ring-2 ring-white/15">
            <SmartImage
              src={course.coverUrl}
              alt={`کاور کلاس ${course.title}`}
              variant="course"
              fill
              sizes="84px"
              className="object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-mint-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              تأیید ثبت‌نام
            </p>
            <h2 id="enrollx-title" className="mt-0.5 truncate text-[15.5px] font-black leading-7">
              {course.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={tryClose}
            disabled={busy}
            aria-label="بستن"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="relative px-5 py-5 sm:px-6">
          <p id="enrollx-desc" className="text-[13.5px] font-extrabold leading-7 text-white/90">
            صندلی‌ات را در این کلاس رزرو کنیم؟
            <span className="ms-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-gradient-to-l from-gold-400 to-gold-500 px-2.5 py-0.5 text-[10px] font-black text-ink-950 shadow-[0_8px_18px_-8px_rgba(240,148,26,.8)]">
              <Lock className="h-2.5 w-2.5" aria-hidden="true" />
              رایگان — برای همیشه
            </span>
          </p>
          <p className="mt-1 text-[11.5px] font-bold leading-6 text-white/50">
            با یک تأیید، همه‌ی امکاناتِ کلاسِ تو فعال می‌شود؛ هیچ هزینه‌ای در کار نیست.
          </p>

          {/* وعده‌ها */}
          <ul className="mt-4 space-y-2.5">
            {[
              {
                icon: PlayCircle,
                title:
                  course.lessonsCount > 0
                    ? `${lessons.value} ${lessons.label} — همه‌اش همین حالا باز می‌شود`
                    : 'جلسات همین که منتشر شوند، اول برای تو باز می‌شود',
              },
              {
                icon: Award,
                title: 'آزمونِ پایانی و گواهی با کدِ راستی‌آزما، به نامِ خودت',
              },
              {
                icon: MessagesSquare,
                title: 'پرسش‌وپاسخِ زنده زیر هر جلسه با مدرس و همراهانِ کلاس',
              },
              {
                icon: InfinityIcon,
                title: 'بدونِ محدودیتِ زمان — با هر ریتمی جلو برو، پیشرفتت ذخیره است',
              },
            ].map((perk, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint-500/15 text-mint-300 ring-1 ring-mint-400/25">
                  <perk.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-[12px] font-bold leading-6 text-white/80">{perk.title}</span>
              </li>
            ))}
          </ul>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-[11.5px] font-bold leading-6 text-rose-200 ring-1 ring-rose-400/25"
            >
              {error}
            </p>
          )}

          {/* اکشن‌ها */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-mint-500 px-5 text-[14px] font-black text-ink-950 shadow-[0_16px_34px_-14px_rgba(20,184,166,.75)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Rocket className="h-4 w-4" aria-hidden="true" />
              )}
              {busy ? 'در حالِ رزروی صندلی…' : 'بله، ثبت‌نامم کن'}
            </button>
            <button
              type="button"
              onClick={tryClose}
              disabled={busy}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 text-[12.5px] font-extrabold text-white/75 backdrop-blur-sm transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:opacity-50"
            >
              فعلاً فکر می‌کنم
            </button>
          </div>

          <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-white/35">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />۰ تومان · بدونِ درگاه پرداخت ·
            لغوِ عضویت هر زمان که خواستی
          </p>
        </div>
      </section>
    </div>
  );
}
