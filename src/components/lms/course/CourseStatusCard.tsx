'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  BadgeCheck,
  ClipboardList,
  Gauge,
  GraduationCap,
  Loader2,
  LogIn,
  Map as MapIcon,
  MessagesSquare,
  Play,
  Rocket,
  Sparkles,
  TriangleAlert,
  UserRoundPen,
} from 'lucide-react';
import type { LmsCourseDetail, LmsLesson } from '@/lib/lms-shared';
import { LessonProgressRing } from '@/components/lms/lesson/LessonProgressRing';
import { LessonSegBar } from '@/components/lms/lesson/LessonSegBar';
import type { CourseJourney, CourseViewerState } from './CourseClassroom';

/**
 * کارتِ وضعیتِ کلاس — دکه‌ی فرمانِ ریل: جایگزینِ دکمه‌ی خشکِ «ثبت‌نام»
 * قدیمی است. سه خانواده‌ی حالت:
 *   • ناشناس/مهمان  → دعوتِ تیره و شیشه‌ای با مزیت‌های روشن مسیر؛
 *   • آماده         → CTAی مینتیِ «ثبت‌نام رایگان و شروع مسیر» + جشن؛
 *   • عضو           → حلقه‌ی پیشرفت + نوارِ سگمنتی + «ادامه از جلسه‌ی n»،
 *     و در صورتِ پایانِ همه‌ی جلسات، بنرِ طلاییِ «وقتِ آزمون».
 * عددها همیشه از سرور می‌آیند؛ هیچ حدسِ کلاینتی در کار نیست.
 */

const fa = (n: number) => n.toLocaleString('fa-IR');

const PERKS: Array<{ icon: typeof Gauge; text: string }> = [
  { icon: Gauge, text: 'پیشرفتِ لحظه‌ایِ هر جلسه، دقیق و ذخیره‌شده' },
  { icon: MessagesSquare, text: 'پرسشِ مستقیم از استاد زیر هر جلسه' },
  { icon: ClipboardList, text: 'آزمونِ پایان دوره با نمره‌ی فوری' },
  { icon: Award, text: 'گواهیِ راستی‌آزما با کدِ یکتای قابل‌استعلام' },
];

type Props = {
  course: LmsCourseDetail;
  viewer: CourseViewerState;
  journey: CourseJourney;
  continueLesson: LmsLesson | null;
  posting: boolean;
  justNow: boolean;
  onEnroll: () => void;
  onRetry: () => void;
};

export function CourseStatusCard({
  course,
  viewer,
  journey,
  continueLesson,
  posting,
  justNow,
  onEnroll,
  onRetry,
}: Props) {
  const router = useRouter();
  const lessonHref = (l: LmsLesson) =>
    `/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(l.slug)}`;

  return (
    <section
      id="class-deck"
      aria-label="کارت وضعیت کلاس"
      className="relative scroll-mt-28 overflow-hidden rounded-[22px] bg-ink-900 p-5 text-white shadow-[0_24px_60px_-32px_rgba(9,24,43,.9)] ring-1 ring-white/10 sm:p-6"
    >
      {/* بافت و هاله — زبانِ تاییدشده‌ی باندهای تیره */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 14px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-brand-500/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-14 -right-12 h-40 w-40 rounded-full bg-mint-500/20 blur-3xl"
      />

      <div className="relative">{renderBody()}</div>

      {/* جشنِ ثبت‌نام — اورلیِ سبک روی خودِ کارت */}
      {justNow && (
        <div
          className="absolute inset-0 z-10 grid place-items-center bg-ink-950/80 p-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-500 text-ink-950 shadow-[0_16px_36px_-12px_rgba(20,184,166,.8)]">
              <span
                className="absolute inset-0 animate-ping rounded-full bg-mint-400/60"
                aria-hidden="true"
              />
              <BadgeCheck className="relative h-8 w-8" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[17px] font-black text-white">ثبت‌نام کامل شد!</p>
            <p className="mt-1 text-[12px] font-bold leading-6 text-white/70">
              جایت در «{course.title}» حفظ شد — مسیر از همین‌جا شروع می‌شود 🌱
            </p>
          </div>
        </div>
      )}
    </section>
  );

  function renderBody() {
    /* ── اسکلتِ صادقانه‌ی بررسیِ وضعیت ── */
    if (viewer.kind === 'boot' || viewer.kind === 'checking') {
      return (
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">در حال بررسی وضعیت کلاس…</span>
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-6 w-3/4 animate-pulse rounded-lg bg-white/10" />
          <div className="mt-5 grid place-items-center">
            <div className="h-24 w-24 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="mt-5 h-12 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-4 space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3.5 w-5/6 animate-pulse rounded-full bg-white/[.07]" />
            ))}
          </div>
        </div>
      );
    }

    /* ── عضوِ کلاس — حلقه + سگمنت + ادامه ── */
    if (viewer.kind === 'enrolled') {
      const pct = Math.max(0, Math.min(100, viewer.percent));
      const complete = pct >= 100 || journey.doneCount >= journey.lessons.length;
      const started =
        journey.doneCount > 0 ||
        [...viewer.progressMap.values()].some((p) => p.progressPercent > 0);
      const lessonCount = journey.lessons.length;
      const continueIndex = continueLesson
        ? journey.lessons.findIndex((l) => l.id === continueLesson.id) + 1
        : 0;
      return (
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-mint-500/15 px-3 py-1 text-[11px] font-extrabold text-mint-300 ring-1 ring-mint-400/30">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              عضویتِ تو فعال است
            </p>
            <p className="text-[10.5px] font-bold tabular-nums text-white/50">
              {fa(journey.doneCount)} از {fa(lessonCount)} جلسه
            </p>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className="grid shrink-0 place-items-center rounded-full bg-white p-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,.6)]">
              <LessonProgressRing percent={pct} size={92} stroke={9} label="پیشرفت" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black leading-6 text-white">
                {complete
                  ? 'همه‌ی جلسات کامل شد — درخشان!'
                  : started
                    ? 'مسیر دارد پیش می‌رود؛ تند برو!'
                    : 'هنوز قدمِ اول را نزده‌ای'}
              </p>
              <p className="mt-1 text-[11px] font-bold leading-5 text-white/55">
                {complete
                  ? 'تنها چیزی که مانده آزمونِ پایانی و گرفتنِ گواهی است.'
                  : `${fa(lessonCount - journey.doneCount)} جلسه تا خطِ پایان؛ هر جلسه که تمام شود، همین‌جا ثبت می‌شود.`}
              </p>
            </div>
          </div>

          <LessonSegBar
            lessons={journey.lessons}
            currentLessonId={journey.continueLessonId ?? 0}
            progressMap={viewer.progressMap}
            className="mt-4"
          />

          {complete ? (
            <div className="mt-4 rounded-2xl border border-gold-400/40 bg-gold-500/10 px-4 py-3">
              <p className="inline-flex items-center gap-2 text-[12px] font-extrabold leading-6 text-gold-200">
                <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
                وقتِ فینال است: آزمونِ پایان دوره و گواهیِ راستی‌آزما
              </p>
            </div>
          ) : null}

          {complete ? (
            <Link
              href={`/lms/courses/${encodeURIComponent(course.slug)}/exam`}
              aria-label="رفتن به صفحه‌ی آزمون پایان دوره"
              className="group mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-gold-400 to-gold-500 px-5 text-[14px] font-black text-ink-950 shadow-[0_16px_34px_-14px_rgba(240,148,26,.8)] transition-all hover:from-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 active:scale-[.98]"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span className="max-w-[78%] truncate">شرکت در آزمون دوره</span>
            </Link>
          ) : (
            continueLesson && (
              <Link
                href={lessonHref(continueLesson)}
                className="group mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 px-5 text-[14px] font-extrabold text-ink-950 shadow-lg shadow-mint-900/40 transition-all hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-200 active:scale-[.98]"
                aria-label={
                  started
                    ? `ادامه از جلسه‌ی ${fa(continueIndex)}: ${continueLesson.title}`
                    : `شروع از جلسه‌ی ${fa(continueIndex)}: ${continueLesson.title}`
                }
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span className="max-w-[78%] truncate">
                  {started
                    ? `ادامه: ${continueLesson.title}`
                    : `شروع مسیر: ${continueLesson.title}`}
                </span>
              </Link>
            )
          )}
          <a
            href="#journey"
            className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[12px] font-extrabold text-mint-200 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
          >
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            دیدنِ نقشه‌ی مسیر، جلسه‌به‌جلسه
          </a>
        </div>
      );
    }

    /* ── مهمان / آماده — دعوتِ تیره‌ی پرمزیت ── */
    const isGuest = viewer.kind === 'guest';
    return (
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-mint-200 ring-1 ring-white/15">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {isGuest ? 'کلاسِ رایگان — میهمانِ قرارگاهی' : 'یک قدم تا شروع'}
        </p>
        <h2 className="mt-3 text-[18px] font-black leading-8 text-white">
          {isGuest ? 'صندلی تو در این کلاس خالی است' : 'یک کلیک تا شروعِ مسیر'}
        </h2>
        <p className="mt-1 text-[11.5px] font-bold leading-6 text-white/55">
          {isGuest
            ? 'برای بازشدنِ همه‌ی جلسات، کافی است وارد حسابت شوی؛ هزینه‌ای در کار نیست.'
            : 'ثبت‌نام رایگان است و بلافاصله همه‌ی جلسات برایت باز می‌شود.'}
        </p>

        <button
          type="button"
          onClick={onEnroll}
          disabled={posting}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 px-5 text-[14px] font-extrabold text-ink-950 shadow-lg shadow-mint-900/40 transition-all hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-200 active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
        >
          {posting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : isGuest ? (
            <LogIn className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Rocket className="h-5 w-5" aria-hidden="true" />
          )}
          {posting
            ? 'در حال رزروِ صندلی…'
            : isGuest
              ? 'ورود | ثبت‌نام رایگان'
              : 'ثبت‌نام رایگان و شروعِ مسیر'}
        </button>

        <ul className="mt-4 list-none space-y-2.5 p-0">
          {PERKS.map((perk) => (
            <li key={perk.text} className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[.06] text-mint-300 ring-1 ring-white/10">
                <perk.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-[11.5px] font-bold leading-5 text-white/70">{perk.text}</span>
            </li>
          ))}
        </ul>

        {viewer.kind === 'profile-incomplete' && (
          <div className="mt-4 rounded-2xl border border-gold-400/40 bg-gold-500/10 p-3.5">
            <p className="inline-flex items-start gap-2 text-[12px] font-bold leading-6 text-gold-200">
              <UserRoundPen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {viewer.message}
            </p>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-gold-500 px-4 text-[12px] font-extrabold text-ink-950 transition-colors hover:bg-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              تکمیل پروفایل
            </button>
          </div>
        )}
        {viewer.kind === 'error' && (
          <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3.5">
            <p className="inline-flex items-start gap-2 text-[12px] font-bold leading-6 text-rose-200">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {viewer.message}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-500/80 px-4 text-[12px] font-extrabold text-white transition-colors hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              تلاشِ دوباره
            </button>
          </div>
        )}
      </div>
    );
  }
}
