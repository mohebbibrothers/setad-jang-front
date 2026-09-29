'use client';

import { useState } from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';

import { fetchLessonMedia } from '@/lib/lms-lesson';

/**
 * کارتِ پیوست — خودِ فایل با دکلِ امنِ media/attachment صادر می‌شود
 * (لینکِ امضاشده‌ی ۱۰‌دقیقه‌ای؛ document/attachment از بک‌اند می‌آیند، نه از
 * فیلدِ عمومی — همان سیاستِ anti-leak خلاصه‌ی عمومی).
 */
export function LessonAttachmentCard({
  lessonId,
  title,
  enrolled,
  isPreview,
}: {
  lessonId: number;
  title?: string | null;
  enrolled: boolean;
  isPreview: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canDownload = enrolled || isPreview;

  const open = async () => {
    if (!canDownload) return;
    setBusy(true);
    setErr(null);
    const res = await fetchLessonMedia(lessonId, 'attachment');
    setBusy(false);
    if (res.kind === 'ok' && res.media.url) {
      window.open(res.media.url, '_blank', 'noopener,noreferrer');
    } else if (res.kind === 'forbidden') {
      setErr('برای دریافت پیوست باید در کلاس ثبت‌نام کرده باشی.');
    } else {
      setErr(res.kind === 'unavailable' ? res.message : 'پیوست در دسترس نیست.');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-black text-ink-800">
            {title?.trim() || 'فایل پیوست جلسه'}
          </p>
          <p className="mt-0.5 text-[11px] font-bold text-ink-400">
            {canDownload ? 'دانلود با لینکِ امنِ ۱۰‌دقیقه‌ای' : 'ویژه‌ی ثبت‌نام‌شده‌ها'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy || !canDownload}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-[12px] font-extrabold text-white transition hover:bg-brand-500 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <FileDown className="h-4 w-4" aria-hidden="true" />
        )}
        دریافت پیوست
      </button>
      {err && <p className="w-full text-[11.5px] font-bold text-gold-700">{err}</p>}
    </div>
  );
}
