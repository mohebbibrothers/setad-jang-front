'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  FileText,
  FileWarning,
  Loader2,
  Lock,
  RefreshCw,
  ScanEye,
} from 'lucide-react';

import { fetchLessonMedia, postLessonProgress, type LessonProgressEntry } from '@/lib/lms-lesson';
import type { LmsLesson } from '@/lib/lms-shared';

/** نمایشگرِ درون‌برنامه‌ایِ PDF — سنگین است؛ فقط با اوّلین کلیک بار می‌شود. */
const LessonPdfViewer = dynamic(() => import('./LessonPdfViewer').then((m) => m.LessonPdfViewer), {
  ssr: false,
});

type Props = {
  lesson: LmsLesson;
  enrolled: boolean;
  progress?: LessonProgressEntry;
  onCompleted: () => void;
  /** اوّلین بازشدنِ واقعیِ سند در نمایشگر — والد، نقشه‌ی پیشرفت را پچ می‌کند. */
  onMediaOpened?: () => void;
};

/**
 * صحنه‌ی متنی (article / document) — قراردادِ بک‌اند برای این نوع:
 * درصدِ پیشرفت «صفر تا قبل از mark_completed، صد بعدِ آن» — نه دقتِ جعلی.
 *
 * سند (PDF): دیگر هیچ لینکِ دانلودِ خام به بیرون نمی‌رود؛ سند «داخلِ همین
 * صفحه» در نمایشگرِ برند لود می‌شود و «این جلسه را خواندم» تا اوّلین بازشدنِ
 * واقعیِ سند قفل است (گیتِ سروری: media_opened — دور زدنی نیست).
 */
export function LessonTextStage({ lesson, enrolled, progress, onCompleted, onMediaOpened }: Props) {
  const kind = lesson.contentType === 'document' ? 'document' : 'article';
  const [body, setBody] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [completed, setCompleted] = useState(progress?.isCompleted ?? false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [docOpened, setDocOpened] = useState(progress?.mediaOpened ?? false);
  const startRef = useRef<number>(Date.now());
  const completedRef = useRef(completed);
  completedRef.current = completed;
  const docOpenedRef = useRef(docOpened);
  docOpenedRef.current = docOpened;
  const openPostedRef = useRef(progress?.mediaOpened ?? false);

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

  /** ثبتِ سروریِ «سند باز شد» — فقط اوّلین بار؛ گیتِ دکمه‌ی تکمیل. */
  const reportDocumentOpened = useCallback(async () => {
    if (kind !== 'document' || !enrolled || openPostedRef.current) return;
    openPostedRef.current = true;
    const res = await postLessonProgress(lesson.id, { media_opened: true });
    if (!res) {
      // شکستِ شبکه‌ای: اجازه بده تلاشِ بعدیِ کاربر دوباره سیگنال بفرستد.
      openPostedRef.current = false;
      return;
    }
    setDocOpened(true);
    onMediaOpened?.();
  }, [enrolled, kind, lesson.id, onMediaOpened]);

  const markRead = useCallback(async () => {
    if (!enrolled || marking || completed) return;
    if (kind === 'document' && !docOpenedRef.current) return; // گیتِ UI — سرور هم دارد
    setMarking(true);
    setMarkErr(null);
    const studySeconds = Math.max(5, Math.floor((Date.now() - startRef.current) / 1000));
    const res = await postLessonProgress(lesson.id, {
      watched_seconds: studySeconds,
      last_position_seconds: 0,
      mark_completed: true,
      // برای سند: این سیگنال لازم است (سرور بدون بازشدنِ سند ۴۰۰ می‌دهد).
      ...(kind === 'document' ? { media_opened: true } : {}),
    });
    setMarking(false);
    if (res?.isCompleted) {
      setCompleted(true);
      onCompleted();
    } else {
      setMarkErr(
        kind === 'document'
          ? 'اول سند را در نمایشگر باز کن؛ بعد تکمیلش را تأیید کن.'
          : 'ثبت تکمیل انجام نشد؛ اتصالت را چک کن و دوباره بزن.',
      );
    }
  }, [enrolled, lesson.id, marking, completed, kind, onCompleted]);

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

  const readGateLocked = kind === 'document' && !docOpened && !completed;

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
        <div className="relative overflow-hidden p-5 sm:p-7">
          {/* هاله‌ی برند پشت کارتِ سند */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-mint-100/70 blur-3xl"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-[0_12px_24px_-12px_rgba(11,53,48,.6)]">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black text-ink-900">
                  {docTitle || lesson.title}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-bold text-ink-400">
                  <ScanEye className="h-3.5 w-3.5 text-mint-600" aria-hidden="true" />
                  سندِ درس — فقط داخلِ همین صفحه مطالعه می‌شود (بدون دانلود)
                </p>
                {docOpened && !completed && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[10px] font-extrabold text-mint-700 ring-1 ring-mint-200">
                    <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                    سند باز شد — حالا می‌توانی تکمیلش کنی
                  </p>
                )}
              </div>
            </div>
            {docUrl ? (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-[13px] font-extrabold text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                {docOpened ? 'ادامه‌ی مطالعه‌ی سند' : 'مطالعه‌ی سند در نمایشگر'}
              </button>
            ) : (
              <span className="text-[12px] font-bold text-ink-400">
                فایل سند هنوز بارگذاری نشده.
              </span>
            )}
          </div>
        </div>
      )}

      {/* نوارِ تکمیل */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-3.5">
        <p className="text-[11.5px] font-bold leading-6 text-ink-500">
          {enrolled
            ? completed
              ? 'تکمیل این جلسه ثبت شده است.'
              : readGateLocked
                ? 'اول سند را در نمایشگر باز کن؛ بعد دکمه‌ی تأیید فعال می‌شود.'
                : 'وقتی مطالعه‌ات تمام شد، با یک کلیک تکمیلش کن تا درصد کلاس بالا برود.'
            : 'برای ثبتِ تکمیل، در کلاس ثبت‌نام کن.'}
        </p>
        {enrolled && !completed && (
          <span className="relative inline-flex">
            <button
              type="button"
              onClick={() => void markRead()}
              disabled={marking || readGateLocked}
              title={readGateLocked ? 'اول سند را باز کن' : undefined}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-mint-500 px-5 text-[12.5px] font-extrabold text-ink-950 shadow-[0_10px_22px_-10px_rgba(20,184,166,.6)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {marking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : readGateLocked ? (
                <Lock className="h-4 w-4" aria-hidden="true" />
              ) : (
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              )}
              این جلسه را خواندم
            </button>
          </span>
        )}
        {markErr && <p className="w-full text-[11.5px] font-bold text-red-600">{markErr}</p>}
      </div>

      {/* نمایشگرِ درون‌صفحه‌ایِ سند — اوّلین رندرِ موفق = سیگنالِ «باز شد» */}
      {viewerOpen && docUrl && (
        <LessonPdfViewer
          title={docTitle || lesson.title}
          url={docUrl}
          onFirstRender={() => void reportDocumentOpened()}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
