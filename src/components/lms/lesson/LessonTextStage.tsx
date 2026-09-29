'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, BookOpenCheck, FileText, FileWarning, Loader2, RefreshCw } from 'lucide-react';

import { fetchLessonMedia, postLessonProgress, type LessonProgressEntry } from '@/lib/lms-lesson';
import type { LmsLesson } from '@/lib/lms-shared';

type Props = {
  lesson: LmsLesson;
  enrolled: boolean;
  progress?: LessonProgressEntry;
  onCompleted: () => void;
};

/**
 * صحنه‌ی متنی (article / document) — قراردادِ بک‌اند برای این نوع:
 * درصدِ پیشرفت «صفر تا قبل از mark_completed، صد بعدِ آن» — نه دقتِ جعلی.
 * پس اینجا «خواننده‌ی تایپوگرافیک» می‌دهیم + دکمه‌ی صریح «این جلسه را خواندم»
 * که زمانِ مطالعه‌ی روی صفحه را هم به‌عنوان watched_seconds واقعی می‌فرستد.
 */
export function LessonTextStage({ lesson, enrolled, progress, onCompleted }: Props) {
  const kind = lesson.contentType === 'document' ? 'document' : 'article';
  const [body, setBody] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [completed, setCompleted] = useState(progress?.isCompleted ?? false);
  const startRef = useRef<number>(Date.now());
  const completedRef = useRef(completed);
  completedRef.current = completed;

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await fetchLessonMedia(lesson.id, kind);
    if (res.kind === 'ok') {
      if (kind === 'article') setBody(res.media.body || '');
      else {
        setDocUrl(res.media.url || null);
        setDocTitle(res.media.title || null);
      }
    } else if (res.kind === 'forbidden') {
      setErr('برای خواندن این جلسه باید در کلاس ثبت‌نام کرده باشی.');
    } else {
      setErr(res.message);
    }
    setLoading(false);
  }, [kind, lesson.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const [markErr, setMarkErr] = useState<string | null>(null);

  const markRead = useCallback(async () => {
    if (!enrolled || marking || completed) return;
    setMarking(true);
    setMarkErr(null);
    const studySeconds = Math.max(5, Math.floor((Date.now() - startRef.current) / 1000));
    const res = await postLessonProgress(lesson.id, {
      watched_seconds: studySeconds,
      last_position_seconds: 0,
      mark_completed: true,
    });
    setMarking(false);
    if (res?.isCompleted) {
      setCompleted(true);
      onCompleted();
    } else {
      setMarkErr('ثبت تکمیل انجام نشد؛ اتصالت را چک کن و دوباره بزن.');
    }
  }, [enrolled, lesson.id, marking, completed, onCompleted]);

  const paragraphs = useMemo(
    () =>
      (body ?? '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [body],
  );

  if (loading) {
    return (
      <div className="grid min-h-[280px] place-items-center rounded-[22px] border border-ink-100 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-mint-500" aria-hidden="true" />
      </div>
    );
  }
  if (err) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[22px] border border-ink-100 bg-white p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-50 text-gold-600">
          <FileWarning className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="text-[13px] font-bold text-ink-600">{err}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-200 px-4 text-[12px] font-extrabold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          تلاش دوباره
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-ink-100 bg-white shadow-[0_16px_40px_-30px_rgba(11,53,48,.3)]">
      {completed && (
        <div className="flex items-center gap-2 border-b border-mint-100 bg-mint-50 px-5 py-3">
          <BadgeCheck className="h-4 w-4 text-mint-700" aria-hidden="true" />
          <p className="text-[12.5px] font-extrabold text-mint-800">
            این جلسه تکمیل شده — آفرین به پیوستت!
          </p>
        </div>
      )}

      {kind === 'article' ? (
        <article className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="mb-5 flex items-center gap-2 text-[11px] font-extrabold text-brand-600">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            مطالعه‌ی درون‌برنامه‌ای — بدون خروج از کلاس
          </div>
          {paragraphs.length > 0 ? (
            <div className="space-y-4 text-[14px] leading-8 text-ink-700 [&>p:first-child]:text-[15px] [&>p:first-child]:font-bold [&>p:first-child]:leading-8 [&>p:first-child]:text-ink-900">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-[13px] font-bold text-ink-400">متن این جلسه هنوز آماده نشده است.</p>
          )}
        </article>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-[0_12px_24px_-12px_rgba(11,53,48,.6)]">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-black text-ink-900">
                {docTitle || lesson.title}
              </p>
              <p className="mt-1 text-[11.5px] font-bold text-ink-400">
                سندِ درس — با لینکِ امنِ ۱۰‌دقیقه‌ای باز می‌شود
              </p>
            </div>
          </div>
          {docUrl ? (
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-[13px] font-extrabold text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              مشاهده‌ی سند
            </a>
          ) : (
            <span className="text-[12px] font-bold text-ink-400">فایل سند هنوز بارگذاری نشده.</span>
          )}
        </div>
      )}

      {/* نوارِ تکمیل */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-3.5">
        <p className="text-[11.5px] font-bold leading-6 text-ink-500">
          {enrolled
            ? completed
              ? 'تکمیل این جلسه ثبت شده است.'
              : 'وقتی مطالعه‌ات تمام شد، با یک کلیک تکمیلش کن تا درصد کلاس بالا برود.'
            : 'برای ثبتِ تکمیل، در کلاس ثبت‌نام کن.'}
        </p>
        {enrolled && !completed && (
          <button
            type="button"
            onClick={() => void markRead()}
            disabled={marking}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-mint-500 px-5 text-[12.5px] font-extrabold text-ink-950 shadow-[0_10px_22px_-10px_rgba(20,184,166,.6)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:opacity-60"
          >
            {marking ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            )}
            این جلسه را خواندم
          </button>
        )}
        {markErr && <p className="w-full text-[11.5px] font-bold text-red-600">{markErr}</p>}
      </div>
    </div>
  );
}
