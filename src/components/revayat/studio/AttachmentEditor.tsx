'use client';

import {
  ArrowDown,
  ArrowUp,
  AudioLines,
  CloudUpload,
  FileCheck,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Lock,
  Plus,
  RefreshCcw,
  Trash2,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn, toPersianDigits } from '@/lib/utils';
import { formatClockFa, formatDimensionsFa } from '@/lib/media-meta';
import {
  MEDIA_TYPE_LABELS,
  STUDIO_LIMITS,
  acceptForType,
  effectiveMediaTypeOf,
  formatBytesFa,
  isAcceptableAttachmentUrl,
  isLocalMediaUrl,
  isTypeDefiningRow,
  sniffMediaTypeFromFilename,
  sniffMediaTypeFromUrl,
  uploadStudioFile,
  type AttachmentDraft,
  type StudioMediaType,
  type StudioUploadConfig,
} from '@/lib/studio';

/**
 * ═══════════════════════════════════════════════════════════════════
 * AttachmentEditor — ادیتورِ پیوست‌های استودیوی روایت
 *
 * قرارداد (بک‌اند): صفر تا ۵ پیوست؛ هر پیوست = نشانی (≤۱۰۲۴ — https
 * یا نشانیِ بومیِ /media/) + نوع (تصویر/ویدئو/صوت/سایر) + عنوانِ
 * اختیاری + ترتیب، و همه‌ی پیوست‌ها باید هم‌نوع باشند (object-level).
 * تجربه (فراتر از قرارداد، بدونِ تغییرِ آن):
 *   • دو راه برای رسانه: چسباندنِ «نشانی» عمومی (بعداً روی سرورِ
 *     خودمان mirror می‌شود تا مرگِ لینک روایت را نکشد) یا «بارگذاری»
 *     مستقیم روی مدیاسرورِ بعثت با پیشرفتِ واقعی و لغو/تلاشِ دوباره؛
 *   • قفلِ تک‌نوعی: اولین پیوستِ نوع‌دار، نوعِ کلِ روایت را قفل می‌کند
 *     (نوارِ درخشانِ اطلاع + غیرفعال‌شدنِ چیپ‌های ناسازگار)، با
 *     «تغییر نوعِ روایت» دو‌ضربه‌ای برای شروعِ دوباره؛
 *   • «پلاکِ شماره» و دکمه‌های بالا/پایین همان قراردادِ order است؛
 *   • بوش‌گرِ خودکار (✨): تا وقتی کاربر نوع را لمس نکند، تشخیصِ
 *     خودکار او را دنبال می‌کند؛ با اولین انتخابِ دستی، سکوت می‌کند؛
 *   • تامنیلِ زنده برای نشانی‌های تصویری و کارتِ متادیتا (حجم، ابعاد،
 *     مدت) برای فایل‌های آپلودشده — همان متای قراردادِ محتوانگار؛
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

/* ── وضعیتِ آپلودِ هر سطر (محلی — به پیش‌نویسِ ذخیره‌شونده نمی‌رسد) ── */
type UploadPhase = 'idle' | 'uploading' | 'error';
interface RowUploadState {
  phase: UploadPhase;
  percent: number;
  error: string | null;
  fileRef: File | null;
}
const IDLE_UPLOAD: RowUploadState = { phase: 'idle', percent: 0, error: null, fileRef: null };

/* ── ناحیه‌ی رهاسازی/انتخاب فایل ── */
function FilePickerZone({
  row,
  index,
  lockedType,
  uploadConfig,
  disabled,
  onPick,
}: {
  row: AttachmentDraft;
  index: number;
  lockedType: StudioMediaType | null;
  uploadConfig: StudioUploadConfig;
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const accept = acceptForType(lockedType, uploadConfig);
  const [dragOver, setDragOver] = useState(false);
  const hint = lockedType
    ? `${uploadConfig.labels[lockedType]} تا ${toPersianDigits(uploadConfig.maxMb[lockedType])} مگابایت — ${uploadConfig.extensions[
        lockedType
      ]
        .slice(0, 6)
        .map((e) => `.${e}`)
        .join('  ')}`
    : `تصویر، ویدئو، صوت یا سند — حداکثر ${toPersianDigits(uploadConfig.maxMb.video)} مگابایت`;
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !disabled) onPick(f);
        }}
        data-testid={`dropzone-${index}`}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all',
          dragOver
            ? 'border-brand-400 bg-brand-50'
            : 'border-ink-200 bg-ink-50/50 hover:border-brand-300 hover:bg-brand-50/40',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <CloudUpload className="h-6 w-6 text-brand-600" />
        <span className="text-[12px] font-extrabold text-ink-700">
          فایل را اینجا رها کن یا انتخابش کن
        </span>
        <span className="text-[10px] font-semibold leading-4 text-ink-400">{hint}</span>
        <span className="sr-only">بارگذاری پیوست {toPersianDigits(index + 1)}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        aria-hidden
        tabIndex={-1}
        data-rowid={row.id}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />
    </>
  );
}

/* ── کارتِ وضعیتِ آپلود (در حال ارسال / خطا) ── */
function UploadStatusCard({
  state,
  onCancel,
  onRetry,
  onPickAnother,
}: {
  state: RowUploadState;
  onCancel: () => void;
  onRetry: () => void;
  onPickAnother: () => void;
}) {
  const isError = state.phase === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'rounded-2xl border px-3.5 py-3',
        isError
          ? 'border-rose-200 bg-rose-50'
          : 'border-teal-500/25 bg-gradient-to-l from-teal-500/[0.03] to-rose-500/[0.03]',
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[12px] font-bold">
        {isError ? (
          <span className="text-rose-700">{state.error ?? 'آپلود ناموفق بود.'}</span>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-ink-700">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-600" />
            <span className="truncate">
              در حال ارسال{state.fileRef?.name ? ` «${state.fileRef.name}»` : ''}…
            </span>
          </span>
        )}
        {!isError && (
          <span className="shrink-0 text-[11px] font-black tabular-nums text-ink-500">
            {toPersianDigits(`${state.percent}٪`.replace('٪٪', '٪'))}
          </span>
        )}
      </div>
      {isError ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-8 items-center gap-1 rounded-xl bg-rose-600 px-3 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-rose-700"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            تلاش دوباره
          </button>
          <button
            type="button"
            onClick={onPickAnother}
            className="inline-flex h-8 items-center rounded-xl bg-white px-3 text-[11px] font-extrabold text-ink-600 ring-1 ring-inset ring-ink-100 transition hover:bg-ink-50"
          >
            انتخاب فایلِ دیگر
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-teal-500 to-rose-500 transition-[width] duration-200"
              style={{ width: `${Math.min(100, Math.max(2, state.percent))}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 inline-flex h-7 items-center gap-1 rounded-lg bg-white/80 px-2.5 text-[10.5px] font-extrabold text-ink-500 ring-1 ring-inset ring-ink-100 transition hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200"
          >
            <X className="h-3 w-3" />
            لغو
          </button>
        </>
      )}
    </div>
  );
}

/* ── کارتِ موفقیتِ آپلود با متادیتای جزئی (هم‌خانواده با قراردادِ محتوانگار) ── */
function UploadedFileCard({ row }: { row: AttachmentDraft }) {
  const f = row.file;
  if (!f) return null;
  const chips: string[] = [];
  const bytes = formatBytesFa(f.sizeBytes);
  if (bytes) chips.push(bytes);
  if (f.dims && f.dims.width && f.dims.height) {
    const dims = formatDimensionsFa(`${f.dims.width}X${f.dims.height}`);
    if (dims) chips.push(dims);
  }
  const clock = formatClockFa(f.duration);
  if (clock) chips.push(clock);
  return (
    <div
      className="flex items-start gap-2.5 rounded-2xl border border-mint-400/40 bg-mint-50/60 px-3 py-2.5"
      data-testid="upload-success-card"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-500/15 text-mint-600">
        <FileCheck className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p dir="ltr" className="truncate text-left text-[11.5px] font-bold text-ink-800">
          {f.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink-500 ring-1 ring-inset ring-ink-100"
            >
              {c}
            </span>
          ))}
          <span className="rounded-full bg-mint-500/15 px-2 py-0.5 text-[10px] font-extrabold text-mint-700">
            روی سرور بعثت
          </span>
        </div>
      </div>
    </div>
  );
}

export function AttachmentEditor({
  rows,
  urlErrors,
  listError,
  disabled,
  lockedType,
  uploadConfig,
  onAdd,
  onRemove,
  onMove,
  onChange,
  onResetType,
}: {
  rows: AttachmentDraft[];
  urlErrors: Record<string, string>;
  listError?: string;
  disabled?: boolean;
  /** قفلِ تک‌نوعی — محاسبه‌شده از همان rows در والد */
  lockedType: StudioMediaType | null;
  uploadConfig: StudioUploadConfig;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onChange: (id: string, patch: Partial<AttachmentDraft>) => void;
  onResetType: () => void;
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

  /* وضعیتِ آپلودِ سطرها + کنترلرهای لغو */
  const [uploads, setUploads] = useState<Record<string, RowUploadState>>({});
  const aborts = useRef(new Map<string, AbortController>());
  const cancelled = useRef(new Set<string>());
  const [resetArmed, setResetArmed] = useState(false);

  const patchUpload = useCallback((id: string, patch: Partial<RowUploadState>) => {
    setUploads((prev) => ({ ...prev, [id]: { ...(prev[id] ?? IDLE_UPLOAD), ...patch } }));
  }, []);
  const clearUpload = useCallback((id: string) => {
    setUploads((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const startUpload = useCallback(
    async (row: AttachmentDraft, file: File) => {
      const fail = (error: string) => {
        patchUpload(row.id, { phase: 'error', error, fileRef: file, percent: 0 });
      };
      const ext = `.${
        file.name
          .toLowerCase()
          .match(/\.[a-z0-9]{1,8}$/)?.[0]
          ?.replace('.', '') ?? ''
      }`;
      const sniffed = sniffMediaTypeFromFilename(file.name);
      const allowExts = acceptForType(lockedType, uploadConfig)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.startsWith('.'));
      if (file.name.toLowerCase().endsWith('.svg')) {
        return fail('فایل SVG برای امنیت سایت مجاز نیست؛ نسخه‌ی PNG یا JPG را بارگذاری کن.');
      }
      if (allowExts.length && !allowExts.includes(ext)) {
        return fail('پسوندِ این فایل با نوعِ روایت سازگار نیست یا مجاز نیست.');
      }
      const limitMb = uploadConfig.maxMb[sniffed];
      if (file.size > limitMb * 1024 * 1024) {
        return fail(`حجم فایل از سقفِ ${toPersianDigits(limitMb)} مگابایت بیشتر است.`);
      }
      if (lockedType && sniffed !== lockedType) {
        return fail(
          `این فایل «${MEDIA_TYPE_LABELS[sniffed]}» است ولی روایت «${MEDIA_TYPE_LABELS[lockedType]}» قفل شده؛ باید هم‌نوع باشند.`,
        );
      }

      cancelled.current.delete(row.id);
      const controller = new AbortController();
      aborts.current.set(row.id, controller);
      patchUpload(row.id, { phase: 'uploading', percent: 0, error: null, fileRef: file });
      try {
        const result = await uploadStudioFile({
          file,
          onProgress: (percent) => {
            if (!cancelled.current.has(row.id)) patchUpload(row.id, { percent });
          },
          registerAbort: (c) => {
            // کنترلرِ داخلیِ XHR را به کنترلرِ سطر متصل می‌کنیم
            const own = aborts.current.get(row.id);
            if (own) {
              own.signal.addEventListener('abort', () => c.abort(), { once: true });
            } else {
              aborts.current.set(row.id, c);
            }
          },
        });
        aborts.current.delete(row.id);
        if (cancelled.current.has(row.id)) {
          clearUpload(row.id);
          return;
        }
        clearUpload(row.id);
        onChange(row.id, {
          url: result.url,
          mediaType: result.mediaType || sniffed,
          typeTouched: false,
          file: {
            name: result.name || file.name,
            sizeBytes: result.sizeBytes || file.size,
            mime: result.mime || file.type || '',
            dims: result.dims ?? null,
            duration: result.duration ?? null,
          },
        });
      } catch (err) {
        aborts.current.delete(row.id);
        if (cancelled.current.has(row.id) || (err as { status?: number })?.status === 0) {
          clearUpload(row.id);
          return;
        }
        patchUpload(row.id, {
          phase: 'error',
          error: err instanceof Error ? err.message : 'آپلود ناموفق بود؛ دوباره تلاش کن.',
          fileRef: file,
        });
      }
    },
    [clearUpload, lockedType, onChange, patchUpload, uploadConfig],
  );

  const cancelUpload = useCallback(
    (id: string) => {
      cancelled.current.add(id);
      aborts.current.get(id)?.abort();
      aborts.current.delete(id);
      clearUpload(id);
    },
    [clearUpload],
  );

  const confirmReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    aborts.current.forEach((c) => c.abort());
    aborts.current.clear();
    cancelled.current.clear();
    setUploads({});
    setResetArmed(false);
    onResetType();
  };

  const addCaption =
    rows.length >= STUDIO_LIMITS.ATTACHMENTS_MAX
      ? `به سقفِ ${toPersianDigits(STUDIO_LIMITS.ATTACHMENTS_MAX)} پیوست رسیدی (قانونِ سرور)`
      : lockedType
        ? `افزودن پیوستِ ${MEDIA_TYPE_LABELS[lockedType]} دیگر`
        : 'افزودن پیوستِ تازه از یک نشانی دیگر';

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
            <span className="text-[11px] font-bold text-ink-400">(اختیاری — همه هم‌نوع)</span>
          </h2>
          <p className="mt-1.5 text-[12px] font-semibold leading-6 text-ink-500">
            نشانیِ عمومی را بچسبان یا فایل را مستقیم روی سرورِ بعثت بارگذاری کن؛ نوع، خودش تشخیص
            داده می‌شود.
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

      {/* نوارِ درخشانِ قفلِ تک‌نوعی */}
      {lockedType ? (
        <div
          className="mt-3 flex items-start justify-between gap-2 rounded-2xl bg-gradient-to-l from-teal-500/[0.07] to-rose-500/[0.05] px-3.5 py-2.5 ring-1 ring-inset ring-teal-500/25"
          data-testid="type-lock-strip"
        >
          <span className="inline-flex items-start gap-1.5 text-[11px] font-bold leading-5 text-ink-600">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
            این روایت «{MEDIA_TYPE_LABELS[lockedType]}» قفل شده؛ هر روایت فقط یک نوع رسانه می‌پذیرد
            و پیوست‌های بعدی هم باید {MEDIA_TYPE_LABELS[lockedType]} باشند.
          </span>
          <button
            type="button"
            onClick={confirmReset}
            onBlur={() => setResetArmed(false)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition',
              resetArmed
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-100 hover:bg-ink-50',
            )}
          >
            {resetArmed ? 'مطمئنی؟ همه پاک می‌شوند' : 'تغییر نوعِ روایت'}
          </button>
        </div>
      ) : null}

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
          const effective = effectiveMediaTypeOf(row);
          const definesLock = isTypeDefiningRow(row) && effective === lockedType;
          const upload = uploads[row.id] ?? IDLE_UPLOAD;
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
                  {/* سوییچِ روش: نشانی | بارگذاری */}
                  <div className="flex items-center gap-2">
                    <div
                      role="group"
                      aria-label={`روش افزودن پیوست ${toPersianDigits(index + 1)}`}
                      className="inline-flex rounded-full bg-ink-100/80 p-0.5"
                    >
                      {[
                        { key: 'url' as const, label: 'نشانی', Icon: Link2 },
                        { key: 'upload' as const, label: 'بارگذاری', Icon: CloudUpload },
                      ].map(({ key, label, Icon }) => {
                        const active = row.source === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={disabled}
                            aria-pressed={active}
                            onClick={() => {
                              cancelUpload(row.id);
                              onChange(row.id, {
                                source: key,
                                url: '',
                                file: undefined,
                              });
                            }}
                            className={cn(
                              'inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-extrabold transition-all',
                              active
                                ? 'bg-white text-ink-800 shadow-sm ring-1 ring-inset ring-ink-100'
                                : 'text-ink-400 hover:text-ink-600',
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <span className="flex-1" />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        cancelUpload(row.id);
                        onRemove(row.id);
                      }}
                      aria-label={`حذف پیوست ${toPersianDigits(index + 1)}`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-400 ring-1 ring-inset ring-transparent transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* بدنه‌ی روشِ انتخابی */}
                  {row.source === 'url' ? (
                    <>
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
                            aria-describedby={
                              urlErrors[row.id] ? `att-url-err-${row.id}` : undefined
                            }
                            maxLength={STUDIO_LIMITS.URL_MAX + 40}
                            className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-left font-mono text-[11.5px] text-ink-800 outline-none transition placeholder:text-left placeholder:font-sans placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                          />
                        </div>
                        <UrlThumb url={row.url} />
                      </div>
                      {isAcceptableAttachmentUrl(row.url) && !isLocalMediaUrl(row.url) ? (
                        <p className="text-[10.5px] font-semibold leading-4 text-ink-400">
                          پس از ثبت، فایل روی سرورِ بعثت نگهداری و با نشانیِ CDNِ خودمان منتشر
                          می‌شود — اگر لینکِ اصلی هم از بین برود روایتت زنده می‌ماند.
                        </p>
                      ) : null}
                    </>
                  ) : upload.phase === 'uploading' ? (
                    <UploadStatusCard
                      state={upload}
                      onCancel={() => cancelUpload(row.id)}
                      onRetry={() => {
                        /* بی‌استفاده در حالت uploading */
                      }}
                      onPickAnother={() => cancelUpload(row.id)}
                    />
                  ) : upload.phase === 'error' ? (
                    <UploadStatusCard
                      state={upload}
                      onCancel={() => clearUpload(row.id)}
                      onRetry={() => {
                        const f = uploads[row.id]?.fileRef;
                        if (f) void startUpload(row, f);
                      }}
                      onPickAnother={() => {
                        clearUpload(row.id);
                        document
                          .querySelector<HTMLInputElement>(
                            `input[type="file"][data-rowid="${row.id}"]`,
                          )
                          ?.click();
                      }}
                    />
                  ) : row.file && row.url ? (
                    <UploadedFileCard row={row} />
                  ) : (
                    <FilePickerZone
                      row={row}
                      index={index}
                      lockedType={lockedType}
                      uploadConfig={uploadConfig}
                      disabled={disabled}
                      onPick={(file) => void startUpload(row, file)}
                    />
                  )}

                  {urlErrors[row.id] ? (
                    <p
                      id={`att-url-err-${row.id}`}
                      role="alert"
                      className="text-[11.5px] font-bold text-rose-600"
                    >
                      {urlErrors[row.id]}
                    </p>
                  ) : null}

                  {/* نوع — چیپ‌گروهِ آگاه از قفل + نشانِ خودکار */}
                  <div
                    className="flex flex-wrap items-center gap-1.5"
                    role="group"
                    aria-label={`نوع پیوست ${toPersianDigits(index + 1)}`}
                  >
                    {TYPE_ORDER.map((t) => {
                      const Icon = TYPE_ICONS[t];
                      const active = effective === t;
                      const chipDisabled =
                        disabled || (lockedType != null && t !== lockedType && !definesLock);
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={chipDisabled}
                          aria-pressed={active}
                          title={
                            lockedType && t !== lockedType
                              ? `روایت «${MEDIA_TYPE_LABELS[lockedType]}» قفل است`
                              : undefined
                          }
                          onClick={() => onChange(row.id, { mediaType: t, typeTouched: true })}
                          className={cn(
                            'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-extrabold transition-all',
                            active
                              ? 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_5px_13px_-5px_rgba(13,128,116,.5)]'
                              : 'bg-white text-ink-500 ring-1 ring-inset ring-ink-100 hover:bg-ink-100 hover:text-ink-800',
                            chipDisabled && 'cursor-not-allowed opacity-40',
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
        {addCaption}
      </button>
    </section>
  );
}
