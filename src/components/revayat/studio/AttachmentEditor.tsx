'use client';

import {
  ArrowDown,
  ArrowUp,
  AudioLines,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Video,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn, toPersianDigits } from '@/lib/utils';
import {
  MEDIA_TYPE_LABELS,
  STUDIO_LIMITS,
  sniffMediaTypeFromUrl,
  type AttachmentDraft,
  type StudioMediaType,
} from '@/lib/studio';

/**
 * ═══════════════════════════════════════════════════════════════════
 * AttachmentEditor — ادیتورِ پیوست‌های استودیوی روایت
 *
 * قرارداد (بک‌اند): صفر تا ۵ پیوست؛ هر پیوست = نشانی (URL ≤۱۰۲۴) +
 * نوع (تصویر/ویدئو/صوت/سایر) + عنوانِ اختیاری + ترتیب.
 * تجربه (فراتر از قرارداد، بدونِ تغییرِ آن):
 *   • «پلاکِ شماره» روشن می‌کند هر فایل کجای روایت می‌نشیند و دکمه‌های
 *     بالا/پایین همان قراردادِ order را در دستِ کاربر می‌گذارند؛
 *   • بوش‌گرِ خودکار (✨): پس از چسباندنِ نشانی، نوع از روی پسوند حدس
 *     زده می‌شود — تا وقتی کاربر خودش نوع را لمس نکند، تشخیصِ خودکار
 *     او را دنبال می‌کند؛ با اولین انتخابِ دستی، سکوت می‌کند؛
 *   • تامنیلِ زنده‌ی کوچک برای نشانی‌های تصویری (بارگذاریِ واقعی —
 *     تیک سبز یعنی نشانی سالم است؛ ضربدر یعنی چیزی درست نیست)؛
 *   • شمارش‌گرِ بودجه‌ی قرارداد (n از ۵) همیشه جلوی چشم.
 * ═══════════════════════════════════════════════════════════════════
 */

const TYPE_ICONS: Record<StudioMediaType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: AudioLines,
  other: FileText,
};

const TYPE_ORDER: StudioMediaType[] = ['image', 'video', 'audio', 'other'];

/** تامنیلِ زنده‌ی نشانیِ تصویری — پروبِ واقعی با onLoad/onError */
function UrlThumb({ url }: { url: string }) {
  const detected = sniffMediaTypeFromUrl(url);
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  useEffect(() => {
    if (detected !== 'image' || !url.trim()) {
      setState('idle');
      return;
    }
    setState('loading');
  }, [detected, url]);

  if (state === 'idle' || detected !== 'image') return null;
  return (
    <span
      className={cn(
        'relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-inset',
        state === 'loading' && 'bg-ink-100 ring-ink-100',
        state === 'ok' && 'ring-emerald-300',
        state === 'fail' && 'bg-rose-50 ring-rose-200',
      )}
      aria-hidden={state === 'loading'}
      title={
        state === 'ok'
          ? 'نشانیِ تصویر سالم است و بارگذاری شد'
          : state === 'fail'
            ? 'تصویر بارگذاری نشد — نشانی را بازبینی کن'
            : 'در حال بررسی نشانی…'
      }
    >
      {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin text-ink-400" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- پروبِ اعتبارسنجیِ زنده */}
      <img
        src={url.trim()}
        alt=""
        className={cn(
          'absolute inset-0 h-full w-full object-cover',
          state === 'ok' ? 'opacity-100' : 'opacity-0',
        )}
        onLoad={() => setState('ok')}
        onError={() => setState('fail')}
      />
      {state === 'fail' ? <ImageIcon className="h-4 w-4 text-rose-400" /> : null}
    </span>
  );
}

export function AttachmentEditor({
  rows,
  urlErrors,
  listError,
  disabled,
  onAdd,
  onRemove,
  onMove,
  onChange,
}: {
  rows: AttachmentDraft[];
  urlErrors: Record<string, string>;
  listError?: string;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onChange: (id: string, patch: Partial<AttachmentDraft>) => void;
}) {
  const handleUrlChange = useCallback(
    (row: AttachmentDraft, url: string) => {
      /* بوش‌گرِ خودکار — فقط تا وقتی کاربر نوع را دستی لمس نکرده. */
      const patch: Partial<AttachmentDraft> = { url };
      const sniffed = sniffMediaTypeFromUrl(url);
      if (!row.typeTouched && sniffed) patch.mediaType = sniffed;
      onChange(row.id, patch);
    },
    [onChange],
  );

  return (
    <section
      aria-label="پیوست‌های روایت"
      className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-black text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15">
              <Plus className="h-4 w-4" />
            </span>
            پیوست‌ها
            <span className="text-[11px] font-bold text-ink-400">(اختیاری)</span>
          </h2>
          <p className="mt-1.5 text-[12px] font-semibold leading-6 text-ink-500">
            نشانیِ عمومیِ عکس، فیلم یا صدایت را بچسبان؛ نوع، خودش تشخیص داده می‌شود.
          </p>
        </div>
        <span
          className={cn(
            'inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-extrabold tabular-nums',
            rows.length >= STUDIO_LIMITS.ATTACHMENTS_MAX
              ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
              : 'bg-ink-50 text-ink-500 ring-1 ring-inset ring-ink-100',
          )}
          aria-live="polite"
        >
          {toPersianDigits(rows.length)} از {toPersianDigits(STUDIO_LIMITS.ATTACHMENTS_MAX)}
        </span>
      </div>

      {listError ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {listError}
        </p>
      ) : null}

      <ol className="mt-4 space-y-3.5">
        {rows.map((row, index) => {
          const detected = sniffMediaTypeFromUrl(row.url);
          return (
            <li
              key={row.id}
              className="group relative rounded-2xl border border-ink-100 bg-ink-50/40 p-3.5 transition-colors focus-within:border-brand-300 focus-within:bg-white hover:border-ink-200 sm:p-4"
            >
              <div className="flex items-start gap-2.5">
                {/* پلاکِ ترتیب + جابه‌جایی (قراردادِ order) */}
                <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[11px] font-black tabular-nums text-ink-500 ring-1 ring-inset ring-ink-100">
                    {toPersianDigits(index + 1)}
                  </span>
                  <button
                    type="button"
                    disabled={disabled || index === 0}
                    onClick={() => onMove(row.id, -1)}
                    aria-label={`جابه‌جایی پیوست ${toPersianDigits(index + 1)} به بالا`}
                    className="rounded-md p-1 text-ink-300 transition-colors hover:bg-white hover:text-brand-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-300"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === rows.length - 1}
                    onClick={() => onMove(row.id, 1)}
                    aria-label={`جابه‌جایی پیوست ${toPersianDigits(index + 1)} به پایین`}
                    className="rounded-md p-1 text-ink-300 transition-colors hover:bg-white hover:text-brand-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-300"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-2.5">
                  {/* نشانی */}
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                      <input
                        id={`att-url-${row.id}`}
                        type="url"
                        dir="ltr"
                        inputMode="url"
                        value={row.url}
                        disabled={disabled}
                        onChange={(e) => handleUrlChange(row, e.target.value)}
                        placeholder="https://… نشانی عمومی فایل"
                        aria-label={`نشانی پیوست ${toPersianDigits(index + 1)}`}
                        aria-invalid={Boolean(urlErrors[row.id])}
                        aria-describedby={urlErrors[row.id] ? `att-url-err-${row.id}` : undefined}
                        maxLength={STUDIO_LIMITS.URL_MAX + 40}
                        className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-left font-mono text-[11.5px] text-ink-800 outline-none transition placeholder:text-left placeholder:font-sans placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                      />
                    </div>
                    <UrlThumb url={row.url} />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemove(row.id)}
                      aria-label={`حذف پیوست ${toPersianDigits(index + 1)}`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-400 ring-1 ring-inset ring-transparent transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {urlErrors[row.id] ? (
                    <p
                      id={`att-url-err-${row.id}`}
                      role="alert"
                      className="text-[11.5px] font-bold text-rose-600"
                    >
                      {urlErrors[row.id]}
                    </p>
                  ) : null}

                  {/* نوع — چیپ‌گروه + نشانِ خودکار */}
                  <div
                    className="flex flex-wrap items-center gap-1.5"
                    role="group"
                    aria-label={`نوع پیوست ${toPersianDigits(index + 1)}`}
                  >
                    {TYPE_ORDER.map((t) => {
                      const Icon = TYPE_ICONS[t];
                      const active = row.mediaType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={disabled}
                          aria-pressed={active}
                          onClick={() => onChange(row.id, { mediaType: t, typeTouched: true })}
                          className={cn(
                            'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-extrabold transition-all',
                            active
                              ? 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_5px_13px_-5px_rgba(13,128,116,.5)]'
                              : 'bg-white text-ink-500 ring-1 ring-inset ring-ink-100 hover:bg-ink-100 hover:text-ink-800',
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {MEDIA_TYPE_LABELS[t]}
                        </button>
                      );
                    })}
                    {!row.typeTouched && detected ? (
                      <span className="inline-flex h-7 items-center gap-1 rounded-full bg-mint-50 px-2.5 text-[10.5px] font-extrabold text-mint-600 ring-1 ring-inset ring-mint-400/40">
                        <Wand2 className="h-3 w-3" />
                        تشخیص خودکار
                      </span>
                    ) : null}
                  </div>

                  {/* عنوانِ فایل (اختیاری) */}
                  <input
                    type="text"
                    value={row.title}
                    disabled={disabled}
                    onChange={(e) => onChange(row.id, { title: e.target.value })}
                    placeholder="نامِ فایل (اختیاری) — مثلاً «کلیپ صبح روزِ اول»"
                    aria-label={`عنوان پیوست ${toPersianDigits(index + 1)}`}
                    maxLength={STUDIO_LIMITS.ATTACHMENT_TITLE_MAX}
                    className="h-9 w-full rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        disabled={disabled || rows.length >= STUDIO_LIMITS.ATTACHMENTS_MAX}
        onClick={onAdd}
        className={cn(
          'mt-3.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-[12.5px] font-extrabold transition-all',
          rows.length >= STUDIO_LIMITS.ATTACHMENTS_MAX
            ? 'cursor-not-allowed border-ink-100 text-ink-300'
            : 'border-brand-200 bg-brand-50/40 text-brand-700 hover:border-brand-400 hover:bg-brand-50',
        )}
      >
        <Plus className="h-4 w-4" />
        {rows.length >= STUDIO_LIMITS.ATTACHMENTS_MAX
          ? `به سقفِ ${toPersianDigits(STUDIO_LIMITS.ATTACHMENTS_MAX)} پیوست رسیدی (قانونِ سرور)`
          : 'افزودن پیوستِ تازه از یک نشانی دیگر'}
      </button>
    </section>
  );
}
