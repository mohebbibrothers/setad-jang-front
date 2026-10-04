'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Check,
  ChevronLeft,
  Clock3,
  Flame,
  Lock,
  Paperclip,
  Route,
  Sparkles,
} from 'lucide-react';
import {
  LESSON_TYPE_LABEL,
  TYPE_ICON,
  TYPE_TONE,
  effectiveDurationSeconds,
  formatLmsDuration,
  teaserText,
  type LmsCourseDetail,
  type LmsLesson,
} from '@/lib/lms-shared';
import type { QuizMeta } from '@/lib/lms-lesson';
import type { CourseJourney, CourseViewerState } from './CourseClassroom';

/**
 * «نقشه‌ی مسیر» — پاسخِ ریشه‌ای به گلایه‌ی «لیست جلسات معلوم نیست»:
 * تایم‌لاینِ شماره‌دارِ عمودی که هر جلسه را با وضعیتِ واقعی‌اش نشان
 * می‌دهد (قفل / پیش‌نمایشِ رایگان / جاریِ نبض‌دار / نیمه‌کاره با درصد /
 * تکمیل‌شده)، مسیرِ پیموده‌شده با پرشدنِ محورِ گرادیانی دیده می‌شود و
 * هر ردیفِ باز مستقیم به کنسولِ همان جلسه می‌رود. گرهِ پایانی، آزمون و
 * گواهی است — مقصدِ مسیر از همان نگاهِ اول روشن است.
 */

const fa = (n: number) => n.toLocaleString('fa-IR');

type Props = {
  course: LmsCourseDetail;
  viewer: CourseViewerState;
  journey: CourseJourney;
};

/** از «بیش از این تعداد جلسه» نقشه به «دالانِ اسکرول‌شونده» تبدیل می‌شود —
 * یعنی ۴ جلسه هنوز خطِ بازِ مسیر است و از ۵ به بعد اسکرول‌بارِ کناری می‌آید تا
 * صفحه دراز نشود (درخواستِ صریحِ محصول). سقفِ ارتفاع «۴ ردیف + سرِخوردنِ
 * ردیفِ پنجم» را نشان می‌دهد تا کشف‌پذیریِ اسکرول همیشه روشن باشد. */
const JOURNEY_SCROLL_THRESHOLD = 4;

export function CourseJourneyMap({ course, viewer, journey }: Props) {
  const enrolled = viewer.kind === 'enrolled';
  const quizMeta = enrolled ? viewer.quizMeta : null;
  const { lessons } = journey;
  const totalDuration = formatLmsDuration(effectiveDurationSeconds(course));
  // پرشدنِ محور: درصدِ واقعیِ کلاس (همان عددِ حلقه) تا مسیر و عدد یکی باشند
  const fillPct = enrolled ? Math.max(0, Math.min(100, journey.percent)) : 0;

  /* ── دالانِ مسیر: سقفِ ارتفاع + اسکرولِ داخلی برای سیلابوس‌های بلند ──
     ماسکِ لبه‌ها (mask-image) محتوای نقشه را نزدیکِ لبه‌های برش نرم محو
     می‌کند — مستقل از رنگِ پس‌زمینه‌ی صفحه و فقط برای سمتی که «ادامه» دارد.
     برای اعضا، ردیفِ «از اینجا ادامه بده» اگر بیرون از دید باشد با اسکرول
     خودکار + دکمه‌ی پرشِ شناور همیشه یک قدم فاصله دارد. */
  const scrollable = lessons.length > JOURNEY_SCROLL_THRESHOLD;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [fades, setFades] = useState({ up: false, down: false });
  const [continueOutOfView, setContinueOutOfView] = useState(false);

  useEffect(() => {
    if (!scrollable) return;
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setFades({
        up: el.scrollTop > 10,
        down: el.scrollTop + el.clientHeight < el.scrollHeight - 10,
      });
      const row = el.querySelector('[data-journey-current="true"]');
      if (row) {
        const r = row.getBoundingClientRect();
        const c = el.getBoundingClientRect();
        setContinueOutOfView(r.bottom < c.top + 8 || r.top > c.bottom - 8);
      } else {
        setContinueOutOfView(false);
      }
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.querySelectorAll('li').forEach((li) => ro.observe(li));
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [scrollable, enrolled, journey.continueLessonId, lessons.length]);

  // فرودِ نرم روی جایگاهِ کاربر: وقتی نقشه بلند است، دالان به‌جای ابتدای
  // سیلابوس، از ردیفِ «ادامه بده» آغاز می‌شود (بدونِ انیمیشن — بی‌سروصدا).
  useEffect(() => {
    if (!scrollable || !enrolled || !journey.continueLessonId) return;
    const el = scrollerRef.current;
    if (!el) return;
    const row = el.querySelector('[data-journey-current="true"]');
    if (!row) return;
    const r = row.getBoundingClientRect();
    const c = el.getBoundingClientRect();
    const fullyVisible = r.top >= c.top && r.bottom <= c.bottom;
    if (!fullyVisible) {
      el.scrollTo({ top: Math.max(0, el.scrollTop + (r.top - c.top) - 72), behavior: 'auto' });
    }
  }, [scrollable, enrolled, journey.continueLessonId]);

  const jumpToContinue = () => {
    const el = scrollerRef.current;
    const row = el?.querySelector('[data-journey-current="true"]');
    if (!el || !row) return;
    const target =
      el.scrollTop + (row.getBoundingClientRect().top - el.getBoundingClientRect().top) - 72;
    el.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  };

  const edgeMask =
    fades.up || fades.down
      ? `linear-gradient(to bottom, ${
          fades.up ? 'transparent 0, #000 26px' : '#000 0'
        }, #000 calc(100% - 26px), ${fades.down ? 'transparent 100%' : '#000 100%'})`
      : undefined;

  return (
    <section id="journey" aria-label="نقشه‌ی مسیر کلاس" className="scroll-mt-28">
      {/* سربرگِ نقشه */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
            <Route className="h-3.5 w-3.5" aria-hidden="true" />
            نقشه‌ی مسیر
          </p>
          <h2 className="mt-1 text-[20px] font-black text-ink-900 md:text-[24px]">
            جلسه‌به‌جلسه، تا گواهی
          </h2>
          {lessons.length > 0 && (
            <p className="mt-1.5 text-[12px] font-bold text-ink-500">
              {fa(lessons.length)} جلسه
              {totalDuration ? ` · ${totalDuration}` : ''}
              {enrolled && (
                <span className="text-brand-700">
                  {' '}
                  · {fa(journey.doneCount)}‌تای آن را پیموده‌ای
                </span>
              )}
            </p>
          )}
        </div>
        {enrolled && lessons.length > 0 && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-[11px] font-extrabold text-mint-800 ring-1 ring-mint-200">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            مسیرت ذخیره می‌شود؛ از هر جا رفتی، از همان‌جا برمی‌گردی
          </p>
        )}
      </div>

      {lessons.length === 0 ? (
        <JourneyPreparing />
      ) : (
        <div className="relative mt-6">
          <div
            ref={scrollerRef}
            data-testid={scrollable ? 'journey-scroller' : undefined}
            className={
              scrollable
                ? 'qa-scroll relative max-h-[440px] overflow-y-auto py-2 pe-2 sm:max-h-[520px] lg:max-h-[610px]'
                : 'relative'
            }
            style={edgeMask ? { WebkitMaskImage: edgeMask, maskImage: edgeMask } : undefined}
          >
            {/* محورِ مسیر — ریل + پرشدگیِ گرادیانی بر اساس درصدِ واقعی */}
            <span
              aria-hidden="true"
              className="absolute inset-y-6 start-[21px] w-[3px] rounded-full bg-ink-100"
            />
            <span
              aria-hidden="true"
              className="absolute inset-y-6 start-[21px] w-[3px] origin-top rounded-full bg-gradient-to-b from-brand-500 to-mint-400 transition-all duration-700"
              style={{ height: `${fillPct}%` }}
            />

            <ol className="relative m-0 list-none space-y-3.5 p-0">
              {lessons.map((lesson, index) => (
                <JourneyLessonRow
                  key={lesson.id}
                  course={course}
                  lesson={lesson}
                  index={index}
                  viewer={viewer}
                  journey={journey}
                />
              ))}

              {/* گرهِ پایانی — آزمون و گواهی */}
              <JourneyFinale
                course={course}
                enrolled={enrolled}
                quizMeta={quizMeta}
                journey={journey}
              />
            </ol>
          </div>

          {/* پرشِ شناور به جایگاهِ کاربر — وقتی ردیفِ ادامه بیرون از دید است */}
          {scrollable && enrolled && journey.continueLessonId != null && continueOutOfView && (
            <button
              type="button"
              onClick={jumpToContinue}
              data-testid="journey-jump-continue"
              className="absolute bottom-4 left-1/2 z-20 inline-flex h-9 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gold-500 px-4 text-[11.5px] font-extrabold text-ink-950 shadow-[0_14px_30px_-10px_rgba(240,148,26,.75)] ring-1 ring-gold-300 transition hover:bg-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600"
            >
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              برو به «از اینجا ادامه بده»
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ── ردیفِ یک جلسه ──────────────────────────────────────────────────── */

type NodeState = 'done' | 'current' | 'partial' | 'locked' | 'preview' | 'open';

function JourneyLessonRow({
  course,
  lesson,
  index,
  viewer,
  journey,
}: Props & { lesson: LmsLesson; index: number }) {
  const enrolled = viewer.kind === 'enrolled';
  const boot = viewer.kind === 'boot' || viewer.kind === 'checking';
  const entry = enrolled ? viewer.progressMap.get(lesson.id) : undefined;
  const pct = entry ? Math.max(0, Math.min(100, entry.progressPercent)) : 0;
  const done = entry?.isCompleted ?? false;
  const isContinue = enrolled && !done && lesson.id === journey.continueLessonId;

  const state: NodeState = done
    ? 'done'
    : isContinue
      ? 'current'
      : enrolled && pct > 0
        ? 'partial'
        : !enrolled && !boot
          ? lesson.isPreview
            ? 'preview'
            : 'locked'
          : 'open';

  // قانونِ دسترسی: عضو ⇒ همه‌ی جلسات؛ مهمان/آماده ⇒ فقط پیش‌نمایش
  const href =
    enrolled || state === 'preview' || (state === 'open' && enrolled)
      ? `/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.slug)}`
      : null;

  const Icon = TYPE_ICON[lesson.contentType];
  const typeLabel = lesson.contentTypeDisplay || LESSON_TYPE_LABEL[lesson.contentType];
  const duration = formatLmsDuration(lesson.durationSeconds);
  const teaser = teaserText(lesson.description || lesson.summary, 130);

  const interactiveCls = href
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_18px_38px_-24px_rgba(11,53,48,.3)]'
    : '';
  const card = (
    <div
      className={`group relative min-w-0 flex-1 overflow-hidden rounded-2xl border bg-white p-3.5 sm:p-5 ${interactiveCls} ${
        isContinue
          ? 'border-brand-300 shadow-[0_16px_36px_-22px_rgba(13,128,116,.35)] ring-1 ring-brand-200'
          : 'border-ink-100 shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)]'
      } ${state === 'locked' ? 'bg-ink-50/40' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h3
              className={`text-[13.5px] font-extrabold leading-6 md:text-[14.5px] ${
                state === 'locked'
                  ? 'text-ink-400'
                  : 'text-ink-900 transition-colors group-hover:text-brand-700'
              }`}
            >
              {lesson.title}
            </h3>
            <span
              className={`inline-flex h-6 select-none items-center gap-1 rounded-full px-2 text-[10px] font-extrabold ring-1 ${TYPE_TONE[lesson.contentType]}`}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              {typeLabel}
            </span>
            {state === 'preview' && (
              <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-mint-500 px-2 text-[10px] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(37,197,186,.8)]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                پیش‌نمایشِ رایگان
              </span>
            )}
            {isContinue && (
              <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-gold-500 px-2 text-[10px] font-extrabold text-ink-950 shadow-[0_6px_14px_-6px_rgba(240,148,26,.55)]">
                <Flame className="h-3 w-3" aria-hidden="true" />
                از اینجا ادامه بده
              </span>
            )}
            {done && (
              <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-mint-50 px-2 text-[10px] font-extrabold text-mint-800 ring-1 ring-mint-200">
                <Check className="h-3 w-3" aria-hidden="true" />
                تکمیل شد
              </span>
            )}
          </div>
          {teaser && (
            <p
              className={`mt-1 hidden text-[12px] leading-6 sm:line-clamp-1 ${state === 'locked' ? 'text-ink-400' : 'text-ink-500'}`}
            >
              {teaser}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {duration && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-500">
                <Clock3 className="h-3 w-3 text-brand-600" aria-hidden="true" />
                <span dir="rtl">{duration}</span>
              </span>
            )}
            {lesson.attachmentTitle && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-500">
                <Paperclip className="h-3 w-3 text-gold-600" aria-hidden="true" />
                پیوست دارد
              </span>
            )}
            {state === 'locked' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-400">
                <Lock className="h-3 w-3" aria-hidden="true" />
                با ثبت‌نام باز می‌شود
              </span>
            )}
            {state === 'partial' && (
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-700">
                <span className="inline-block h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-l from-brand-500 to-mint-400"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                ٪{fa(Math.round(pct))} دیده شده
              </span>
            )}
          </div>
        </div>
        {href && (
          <ChevronLeft
            className="mt-1 h-5 w-5 shrink-0 text-ink-300 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-brand-600"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );

  return (
    <li className="relative flex gap-4" data-journey-current={isContinue ? 'true' : undefined}>
      <JourneyNode state={state} index={index} pct={pct} />
      {href ? (
        <Link
          href={href}
          aria-label={`جلسه‌ی ${fa(index + 1)}: ${lesson.title}`}
          className="min-w-0 flex-1 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </li>
  );
}

/** حبابِ وضعیت روی محور — چشم‌وَردِ یک‌نگاهه‌ی مسیر. */
function JourneyNode({ state, index, pct }: { state: NodeState; index: number; pct: number }) {
  const num = fa(index + 1);
  if (state === 'done') {
    return (
      <span
        aria-hidden="true"
        className="relative z-10 mt-3 grid h-11 w-11 shrink-0 select-none place-items-center rounded-full bg-mint-500 text-white shadow-[0_10px_22px_-8px_rgba(20,184,166,.75)] ring-4 ring-white"
      >
        <Check className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span
        aria-hidden="true"
        className="relative z-10 mt-3 grid h-11 w-11 shrink-0 select-none place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[15px] font-black tabular-nums text-white ring-4 ring-white"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/50" />
        <span className="relative">{num}</span>
      </span>
    );
  }
  if (state === 'partial') {
    return (
      <span
        aria-hidden="true"
        className="relative z-10 mt-3 grid h-11 w-11 shrink-0 select-none place-items-center rounded-full ring-4 ring-white"
        style={{
          background: `conic-gradient(var(--color-brand-500, #0e9f8a) ${pct}%, #e8eaef ${pct}% 100%)`,
        }}
      >
        <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-white text-[13px] font-black tabular-nums text-brand-700">
          {num}
        </span>
      </span>
    );
  }
  if (state === 'locked') {
    return (
      <span
        aria-hidden="true"
        className="relative z-10 mt-3 grid h-11 w-11 shrink-0 select-none place-items-center rounded-full bg-ink-100 text-ink-400 ring-4 ring-white"
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  // open / preview — شماره‌ی روشن با حلقه‌ی برندی
  return (
    <span
      aria-hidden="true"
      className={`relative z-10 mt-3 grid h-11 w-11 shrink-0 select-none place-items-center rounded-full bg-white text-[15px] font-black tabular-nums shadow-[0_6px_16px_-8px_rgba(15,20,32,.25)] ring-4 ring-white ${
        state === 'preview'
          ? 'text-mint-600 outline outline-2 outline-mint-300'
          : 'text-ink-500 outline outline-2 outline-ink-100'
      }`}
    >
      {num}
    </span>
  );
}

/* ── گرهِ پایانی: آزمون و گواهی ─────────────────────────────────────── */

function JourneyFinale({
  course,
  enrolled,
  quizMeta,
  journey,
}: {
  course: LmsCourseDetail;
  enrolled: boolean;
  quizMeta: QuizMeta | null;
  journey: CourseJourney;
}) {
  const ready =
    enrolled && journey.doneCount >= journey.lessons.length && journey.lessons.length > 0;
  // فقط وقتی همه‌ی جلسات کامل شده باشد گرهِ پایانی «کلیک‌پذیر» است؛ مقصدش
  // صفحه‌ی مستقلِ آزمون است — همان «جلسه‌ی پایانی» که جایگاه خودش را دارد.
  const href = ready ? `/lms/courses/${encodeURIComponent(course.slug)}/exam` : null;
  const passing = quizMeta
    ? parseFloat(quizMeta.passing_score).toLocaleString('fa-IR', { maximumFractionDigits: 2 })
    : null;

  const card = (
    <div
      className={`group relative min-w-0 flex-1 overflow-hidden rounded-2xl border p-4 ${href ? 'transition-all duration-300 hover:-translate-y-0.5' : ''} ${
        ready
          ? 'border-gold-300 bg-gradient-to-l from-gold-50 to-white shadow-[0_16px_36px_-22px_rgba(240,148,26,.45)] ring-1 ring-gold-200'
          : 'border-gold-200/70 bg-gradient-to-l from-gold-50/50 to-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h3 className="text-[13.5px] font-extrabold leading-6 text-ink-900 md:text-[14.5px]">
              آزمونِ پایان دوره و گواهیِ راستی‌آزما
            </h3>
            {ready ? (
              <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-gold-500 px-2 text-[10px] font-extrabold text-ink-950 shadow-[0_6px_14px_-6px_rgba(240,148,26,.6)]">
                <Flame className="h-3 w-3" aria-hidden="true" />
                آماده‌ی آزمون هستی!
              </span>
            ) : enrolled ? (
              <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-white px-2 text-[10px] font-extrabold text-gold-800 ring-1 ring-gold-200">
                مقصدِ مسیر
              </span>
            ) : (
              <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-white px-2 text-[10px] font-extrabold text-ink-400 ring-1 ring-ink-100">
                <Lock className="h-3 w-3" aria-hidden="true" />
                پس از ثبت‌نام
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-6 text-ink-500">
            {quizMeta
              ? `${fa(quizMeta.questions_count)} سؤال · ${fa(quizMeta.time_limit_minutes)} دقیقه · حدِّ قبولی ${passing} از ۲۰ — با قبولی، گواهی خودکار صادر می‌شود.`
              : 'پایانِ مسیر اینجاست؛ با گذراندنِ همه‌ی جلسات و قبولی در آزمون، گواهی با کدِ یکتای قابل‌استعلام برایت صادر می‌شود.'}
          </p>
          {ready && href && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-extrabold text-gold-800">
              شرکت در آزمون دوره — جلسه‌ی پایانی
              <ChevronLeft
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <li className="relative flex gap-4">
      <span
        aria-hidden="true"
        className={`relative z-10 mt-3 grid h-11 w-11 shrink-0 select-none place-items-center rounded-full text-white ring-4 ring-white ${
          ready
            ? 'bg-gradient-to-br from-gold-400 to-gold-600 shadow-[0_10px_24px_-8px_rgba(240,148,26,.8)]'
            : 'bg-gradient-to-br from-ink-300 to-ink-400'
        }`}
      >
        <Award className="h-5 w-5" aria-hidden="true" />
      </span>
      {href ? (
        <Link
          href={href}
          aria-label="رفتن به صفحه‌ی آزمون پایان دوره"
          className="min-w-0 flex-1 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </li>
  );
}

/** صفر جلسه — روایتِ صادقانه‌ی «بزودی» به‌جای خلأ. */
function JourneyPreparing() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-brand-200 bg-gradient-to-b from-brand-50/60 to-white p-7 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_14px_30px_-12px_rgba(13,128,116,.7)]">
        <Route className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-3.5 text-[15px] font-black text-ink-900">سیلابوس در حال آماده‌سازی است</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-6 text-ink-500">
        تیمِ محتوا برنامه‌ی جلسات این کلاس را جلسه‌به‌جلسه منتشر می‌کند. اگر همین حالا ثبت‌نام کنی،
        از اولین جلسه‌ای که می‌آید باخبر می‌شوی و جایت در کلاس حفظ می‌ماند.
      </p>
      <a
        href="#class-deck"
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-brand-500 to-brand-700 px-5 text-[12.5px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.75)] transition-all hover:from-brand-600 hover:to-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        رزروی صندلیِ من در کلاس
      </a>
    </div>
  );
}
