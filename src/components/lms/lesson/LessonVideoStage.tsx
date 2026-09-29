'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, History, Loader2, RefreshCw } from 'lucide-react';

import {
  fetchLessonMedia,
  postLessonProgress,
  type LessonProgressEntry,
  type LessonMediaPayload,
} from '@/lib/lms-lesson';
import { classifyVideoUrl, type LmsLesson } from '@/lib/lms-shared';

const fa = (n: number) => n.toLocaleString('fa-IR');
const HEARTBEAT_MS = 10_000;

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ss = s % 60;
  return (
    fa(h > 0 ? h : 0) +
    ':' +
    (h > 0 ? String(mm).padStart(2, '0') : fa(mm)) +
    ':' +
    String(ss).padStart(2, '0')
  );
}

type Props = {
  lesson: LmsLesson;
  enrolled: boolean;
  progress?: LessonProgressEntry;
  onTick: (entry: Partial<LessonProgressEntry>) => void;
  onCompleted: () => void;
};

/**
 * صحنه‌ی ویدیو — سه Provider:
 *   • uploaded_file / direct_url → پلیرِ نیتیو HTML5 + ادامه‌پخش از آخرین موقعیت
 *     (last_position_seconds) + heartbeat هر ۱۰ثانیه با watched_seconds مونوتون.
 *   • embed (یوتیوب-نوکوکی/آپارات) → آیفریمِ مصفّی‌شده با classifyVideoUrl؛ چون
 *     API زمانی در دسترس نیست، heartbeat به‌صورت «برآوردِ ساعت‌دیواری» فقط وقتی
 *     تب قابل‌مشاهده است می‌رود (روش استاندارد LMSها برای امبدها).
 * تکمیل با آستانه‌ی ۹۰٪ را سرور اعلام می‌کند؛ اینجا فوراً UI را هم‌راستا می‌کنیم.
 */
export function LessonVideoStage({ lesson, enrolled, progress, onTick, onCompleted }: Props) {
  const [media, setMedia] = useState<LessonMediaPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumed, setResumed] = useState(false);
  const [watchedDisplay, setWatchedDisplay] = useState(progress?.watchedSeconds ?? 0);
  const [completed, setCompleted] = useState(progress?.isCompleted ?? false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastBeatRef = useRef(0);
  const watchedRef = useRef(progress?.watchedSeconds ?? 0);
  const completedRef = useRef(completed);
  completedRef.current = completed;
  const durationSnapshot = progress?.durationSnapshot ?? lesson.durationSeconds ?? 0;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await fetchLessonMedia(lesson.id, 'video');
    if (res.kind === 'ok') {
      setMedia(res.media);
    } else if (res.kind === 'forbidden') {
      setLoadError('برای پخش این جلسه باید در کلاس ثبت‌نام کرده باشی.');
    } else {
      setLoadError(res.message);
    }
    setLoading(false);
  }, [lesson.id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** ثبت پیشرفت — بی‌صدا؛ نتیجه فقط برای تکمیل/تیک مصرف می‌شود. */
  const beat = useCallback(
    async (watchedSeconds: number, positionSeconds: number) => {
      if (!enrolled || completedRef.current) return;
      const res = await postLessonProgress(lesson.id, {
        watched_seconds: watchedSeconds,
        last_position_seconds: positionSeconds,
      });
      if (!res) return;
      watchedRef.current = Math.max(watchedRef.current, watchedSeconds);
      setWatchedDisplay(watchedRef.current);
      onTick({
        watchedSeconds: watchedRef.current,
        lastPositionSeconds: positionSeconds,
        progressPercent: res.progressPercent,
        isCompleted: res.isCompleted,
      });
      if (res.isCompleted && !completedRef.current) {
        setCompleted(true);
        onCompleted();
      }
    },
    [enrolled, lesson.id, onCompleted, onTick],
  );

  /* ── پلیرِ نیتیو: heartbeat روی timeupdate ── */
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.paused) return;
    const now = Date.now();
    if (now - lastBeatRef.current < HEARTBEAT_MS) return;
    lastBeatRef.current = now;
    void beat(Math.floor(v.currentTime), Math.floor(v.currentTime));
  }, [beat]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const pos = progress?.lastPositionSeconds ?? 0;
    if (pos > 5 && !Number.isNaN(v.duration) && pos < v.duration - 5) {
      v.currentTime = pos;
      setResumed(true);
    }
  }, [progress?.lastPositionSeconds]);

  const handleEnded = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    void beat(Math.floor(v.duration || v.currentTime), Math.floor(v.currentTime));
  }, [beat]);

  /* ── امبد: heartbeat برآوردِ ساعت‌دیواری — فقط وقتی تب دیده می‌شود ── */
  useEffect(() => {
    if (!media || media.provider === 'uploaded_file' || media.provider === 'direct_url') return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      watchedRef.current += HEARTBEAT_MS / 1000;
      setWatchedDisplay(watchedRef.current);
      void beat(watchedRef.current, 0);
    }, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [media, beat]);

  const embed = useMemo(
    () => (media?.provider === 'embed' ? classifyVideoUrl(media.url) : null),
    [media],
  );

  const percent =
    durationSnapshot > 0 ? Math.min(100, (watchedDisplay / durationSnapshot) * 100) : 0;

  return (
    <div>
      <div className="relative overflow-hidden rounded-[22px] bg-ink-950 shadow-[0_32px_70px_-35px_rgba(0,0,0,.75)] ring-1 ring-ink-200/40">
        {loading && (
          <div className="grid aspect-video place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-mint-300" aria-hidden="true" />
          </div>
        )}
        {!loading && loadError && (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-gold-300">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="max-w-sm text-[13px] font-bold leading-6 text-white/75">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[12px] font-extrabold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              تلاش دوباره
            </button>
          </div>
        )}
        {!loading && media && !loadError && (
          <>
            {(media.provider === 'uploaded_file' || media.provider === 'direct_url') && (
              <video
                ref={videoRef}
                className="aspect-video w-full"
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                src={media.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
              />
            )}
            {media.provider === 'embed' &&
              (embed?.kind === 'embed' ? (
                <iframe
                  src={embed.src}
                  title={`ویدئوی ${lesson.title}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : embed?.kind === 'native' ? (
                <video
                  ref={videoRef}
                  className="aspect-video w-full"
                  controls
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                  src={embed.src}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                />
              ) : (
                <div className="grid aspect-video place-items-center p-6 text-center">
                  <p className="max-w-sm text-[13px] font-bold leading-6 text-white/75">
                    آدرس ویدئوی این جلسه از منبع امن بیرون از قرارگاه نیست؛ برای حفاظت از کاربران
                    پخش نمی‌شود.
                  </p>
                </div>
              ))}
          </>
        )}
        {completed && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-mint-500/95 px-3 py-1.5 text-[11px] font-extrabold text-ink-950 shadow-lg">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            تکمیل‌شده
          </span>
        )}
      </div>

      {/* نوارِ وضعیتِ تماشا */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        {resumed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10.5px] font-extrabold text-brand-700">
            <History className="h-3 w-3" aria-hidden="true" />
            ادامه از {fmtClock(progress?.lastPositionSeconds ?? 0)}
          </span>
        )}
        {enrolled ? (
          <>
            <span className="text-[11.5px] font-bold tabular-nums text-ink-500">
              تماشا: {fa(Math.floor(watchedDisplay / 60))} دقیقه
              {durationSnapshot > 0 && ` از ${fa(Math.floor(durationSnapshot / 60))}`}
            </span>
            {durationSnapshot > 0 && (
              <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-brand-500 to-mint-400 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
            <span className="text-[10.5px] font-bold text-ink-400">
              تکمیل خودکار در ۹۰٪ • پیشرفتت لحظه‌ای ذخیره می‌شود
            </span>
          </>
        ) : (
          <span className="text-[11px] font-bold text-ink-400">
            جلسه‌ی رایگان — برای ذخیره‌ی پیشرفت ثبت‌نام کن
          </span>
        )}
      </div>
    </div>
  );
}
