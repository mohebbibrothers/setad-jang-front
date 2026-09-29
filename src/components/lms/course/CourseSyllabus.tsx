import { Clock3, FileText, ListVideo, Lock, Mic, MonitorPlay, Sparkles, Type } from 'lucide-react';
import {
  LESSON_TYPE_LABEL,
  classifyVideoUrl,
  formatLmsDuration,
  teaserText,
  type LmsCourseDetail,
  type LmsLesson,
  type LmsLessonType,
} from '@/lib/lms-shared';
import { LessonPreviewButton } from './LessonPreviewButton';

/**
 * سیلابوس — قلبِ اعتمادِ صفحه: «دقیقاً چه چیزی می‌خوانم».
 *
 *  • هر جلسه با آیکونِ نوعِ محتوایش (ویدئو/صوت/سند/متن) — آینه‌ی
 *    LessonContentType در backend؛
 *  • جلساتِ is_preview با نشانِ «پیش‌نمایش رایگان» و — اگر منبعِ
 *    پخش‌پذیر دارند (video_url/embed_url که backend عمداً عمومی گذاشته)
 *    — دکمه‌ی پخشِ واقعی بدون ورود؛
 *  • خلاصه‌ی جلسه (summary) به‌صورت چکیده، مدتِ هر جلسه، و شماره‌ی ترتیب؛
 *  • صفر جلسه (داده‌ی واقعیِ پروداکشن الان!) ⇒ حالتِ «در حال آماده‌سازی»
 *    با دعوتِ ثبت‌نام، نه صفحه‌ی خالیِ خام.
 */

export const TYPE_ICON: Record<LmsLessonType, typeof MonitorPlay> = {
  video: MonitorPlay,
  audio: Mic,
  document: FileText,
  article: Type,
};

export const TYPE_TONE: Record<LmsLessonType, string> = {
  video: 'bg-brand-50 text-brand-700 ring-brand-100',
  audio: 'bg-mint-50 text-mint-800 ring-mint-200',
  document: 'bg-gold-50 text-gold-800 ring-gold-200',
  article: 'bg-ink-50 text-ink-700 ring-ink-100',
};

export function CourseSyllabus({ course }: { course: LmsCourseDetail }) {
  const fa = (n: number) => n.toLocaleString('fa-IR');
  const lessons = course.lessons;
  const totalDuration = formatLmsDuration(course.durationSeconds);

  return (
    <section id="syllabus" className="scroll-mt-24">
      <div className="flex flex-col items-center text-center">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
          <ListVideo className="h-3.5 w-3.5" aria-hidden="true" />
          سیلابوس کلاس
        </p>
        <h2 className="mt-1 text-[22px] font-black text-ink-900 md:text-[26px]">برنامه‌ی جلسات</h2>
        {lessons.length > 0 && (
          <p className="mt-2 text-[12.5px] font-bold text-ink-500">
            {fa(lessons.length)} جلسه
            {totalDuration ? ` · ${totalDuration}` : ''} · مرتب‌شده از آغازِ مسیر تا آزمون
          </p>
        )}
      </div>

      {lessons.length === 0 ? (
        <SyllabusPreparing />
      ) : (
        <ol className="mx-auto mt-8 max-w-3xl list-none space-y-3 p-0">
          {lessons.map((lesson, idx) => (
            <LessonRow key={lesson.id} lesson={lesson} index={idx} />
          ))}
        </ol>
      )}
    </section>
  );
}

function LessonRow({ lesson, index }: { lesson: LmsLesson; index: number }) {
  const fa = (n: number) => n.toLocaleString('fa-IR');
  const Icon = TYPE_ICON[lesson.contentType];
  const label = lesson.contentTypeDisplay || LESSON_TYPE_LABEL[lesson.contentType];
  const duration = formatLmsDuration(lesson.durationSeconds);
  // منبعِ پخش‌پذیر: اول embed (سرویس پخش)، بعد فایلِ مستقیم — فقط برای preview
  const playable = lesson.isPreview
    ? (classifyVideoUrl(lesson.embedUrl) ?? classifyVideoUrl(lesson.videoUrl))
    : null;
  const teaser = teaserText(lesson.description || lesson.summary);

  return (
    <li>
      <article className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_38px_-24px_rgba(11,53,48,.28)] md:p-5">
        <div className="flex items-start gap-3.5">
          {/* شماره‌ی جلسه */}
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 select-none place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-[15px] font-black tabular-nums text-white shadow-[0_8px_20px_-8px_rgba(13,128,116,.7)]"
          >
            {fa(index + 1)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h3 className="text-[14.5px] font-extrabold text-ink-900 transition-colors group-hover:text-brand-700 md:text-[15.5px]">
                {lesson.title}
              </h3>
              <span
                className={`inline-flex h-6 select-none items-center gap-1 rounded-full px-2 text-[10px] font-extrabold ring-1 ${TYPE_TONE[lesson.contentType]}`}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                {label}
              </span>
              {lesson.isPreview && (
                <span className="inline-flex h-6 select-none items-center gap-1 rounded-full bg-mint-500 px-2 text-[10px] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(37,197,186,.8)]">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  پیش‌نمایشِ رایگان
                </span>
              )}
            </div>
            {teaser && (
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-6 text-ink-500">{teaser}</p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
              {duration && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-500">
                  <Clock3 className="h-3 w-3 text-brand-600" aria-hidden="true" />
                  <span dir="rtl">{duration}</span>
                </span>
              )}
              {lesson.attachmentTitle && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-500">
                  <FileText className="h-3 w-3 text-gold-600" aria-hidden="true" />
                  پیوست: {lesson.attachmentTitle}
                </span>
              )}
              {!lesson.isPreview && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-400">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  ویژه‌ی اعضای کلاس
                </span>
              )}
            </div>
          </div>

          {playable && (
            <div className="shrink-0 self-center">
              <LessonPreviewButton
                source={playable}
                lessonTitle={lesson.title}
                description={teaser}
              />
            </div>
          )}
        </div>
      </article>
    </li>
  );
}

/** صفر جلسه — روایتِ صادقانه و جذابِ «بزودی» به‌جای خلأ. */
function SyllabusPreparing() {
  return (
    <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-[22px] border border-dashed border-brand-200 bg-gradient-to-b from-brand-50/60 to-white p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_14px_30px_-12px_rgba(13,128,116,.7)]">
        <ListVideo className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-[16px] font-black text-ink-900">سیلابوس در حال آماده‌سازی است</h3>
      <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-7 text-ink-500">
        تیمِ محتوا برنامه‌ی جلسات این کلاس را جلسه‌به‌جلسه منتشر می‌کند. اگر همین حالا ثبت‌نام کنی،
        از اولین جلسه‌ای که می‌آید باخبر می‌شوی و جای تو در کلاس حفظ می‌ماند.
      </p>
      <a
        href="#enroll-cta"
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-brand-500 to-brand-700 px-6 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.75)] transition-all hover:from-brand-600 hover:to-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        رزروِ صندلیِ من در کلاس
      </a>
    </div>
  );
}
