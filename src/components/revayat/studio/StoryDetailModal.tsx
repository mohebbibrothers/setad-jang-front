'use client';

import { motion } from 'framer-motion';
import {
  ExternalLink,
  Eye,
  FileText,
  Film,
  Loader2,
  MessageSquareText,
  Music3,
  Paperclip,
  PenLine,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { firstErrorMessage, isApiError } from '@/lib/api';
import { formatClockFa, formatDimensionsFa, formatFileSizeFa } from '@/lib/media-meta';
import { formatRelativeFa } from '@/lib/persian-time';
import { absoluteMediaUrl, cn, formatPersianNumber, toPersianDigits } from '@/lib/utils';
import {
  buildUpdatePayload,
  fetchMySubmissionDetail,
  isStudioSubmittable,
  lockedMediaTypeOf,
  MEDIA_TYPE_LABELS,
  mirrorStatusMeta,
  newAttachmentRow,
  STUDIO_LIMITS,
  updateMySubmission,
  validateStudioDraft,
  attachmentRowFromDetail,
  type AttachmentDraft,
  type MySubmissionAttachment,
  type MySubmissionDetail,
  type MySubmissionItem,
  type StudioDraft,
  type StudioFieldErrors,
  type StudioUploadConfig,
} from '@/lib/studio';
import { AttachmentEditor } from './AttachmentEditor';
import { StatusChip } from './StatusChip';

/**
 * ═══════════════════════════════════════════════════════════════════
 * StoryDetailModal — مودالِ کاملِ یک روایت در «روایت‌های من»
 *
 * سه چهره دارد:
 *   ۱) نمایشِ غنی: شرحِ کامل، گالریِ رسانه (تصویر/ویدئو/صوت/سند)،
 *      مهرِ وضعیتِ بررسی، یادداشتِ مدیر و وضعیتِ نگه‌داشتِ هر فایل روی
 *      سرورِ بعثت (آینه)؛
 *   ۲) ویرایش: همان فرمِ استودیو (عنوان/شرح/پیوست با قفلِ تک‌نوعی و
 *      آپلودِ مستقیم) که PATCH /me/submissions/<id>/ را صدا می‌زند —
 *      قانونِ سرور: ویرایشِ روایتِ بررسی‌شده آن را به صفِ بررسی برمی‌گرداند؛
 *   ۳) حذف: از مسیرِ تأییدِ والد (MyStoriesManager) — مودال فقط درخواست
 *      را پاس می‌دهد تا رفتارِ تأیید/حذف در کل صفحه یک‌دست بماند.
 * ═══════════════════════════════════════════════════════════════════
 */

/* ═══ ابزارهای کوچک ═══ */

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5 text-[11px] font-bold text-ink-400">
      <span className="text-ink-300">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

const MIRROR_TONE_CLASSES: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  wait: 'bg-amber-50 text-amber-700 ring-amber-200',
  bad: 'bg-rose-50 text-rose-700 ring-rose-200',
  ink: 'bg-ink-50 text-ink-500 ring-ink-100',
};

function MirrorChip({ attachment }: { attachment: MySubmissionAttachment }) {
  const meta = mirrorStatusMeta(attachment.mirror_status);
  if (!meta.label) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ring-1 ring-inset',
        MIRROR_TONE_CLASSES[meta.tone],
      )}
    >
      <ShieldCheck className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}

/** برچسبِ متای فایل: ابعاد + مدت + حجم — هر کدام که قرارداد دارد */
function AttachmentMetaChips({ attachment }: { attachment: MySubmissionAttachment }) {
  const chips: string[] = [];
  const dims = formatDimensionsFa(attachment.size);
  const dur = formatClockFa(attachment.duration);
  const kb = formatFileSizeFa(attachment.file_size);
  if (dims) chips.push(dims);
  if (dur) chips.push(dur);
  if (kb) chips.push(kb);
  if (chips.length === 0) return null;
  return <span className="text-[10px] font-bold text-ink-400">{chips.join(' · ')}</span>;
}

/** گالریِ رسانه‌ی یک روایت — بر اساس نوعِ هر پیوست رندرِ مناسب می‌گیرد */
function AttachmentGallery({ attachments }: { attachments: MySubmissionAttachment[] }) {
  const ordered = useMemo(
    () => [...attachments].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [attachments],
  );
  if (ordered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-[12px] font-bold text-ink-400">
        این روایت پیوستی ندارد — روایتِ متنی است.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {ordered.map((att, i) => {
        const src = absoluteMediaUrl(att.url);
        const kind = att.media_type ?? 'other';
        const title = att.title?.trim() || `پیوست ${toPersianDigits(i + 1)}`;
        return (
          <figure
            key={att.id}
            className="overflow-hidden rounded-2xl border border-ink-100 bg-ink-50/40"
          >
            {kind === 'image' && src ? (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-ink-100/60"
                aria-label={`باز کردن تصویر در تب تازه — ${title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- نشانیِ دلخواه/بیرونیِ پیوست؛ remotePatterns نمی‌تواند همه را پوشش دهد */}
                <img
                  src={src}
                  alt={title}
                  loading="lazy"
                  className="max-h-[420px] w-full object-contain"
                />
              </a>
            ) : null}
            {kind === 'video' && src ? (
              <video
                controls
                preload="metadata"
                src={src}
                className="max-h-[420px] w-full bg-black"
              />
            ) : null}
            {kind === 'audio' && src ? (
              <div className="flex items-center gap-3 bg-white p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15">
                  <Music3 className="h-5 w-5" />
                </span>
                <audio controls preload="metadata" src={src} className="w-full" />
              </div>
            ) : null}
            {kind === 'other' ? (
              <div className="flex items-center gap-3 bg-white p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
                  {att.mime_type?.startsWith('video/') ? (
                    <Film className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </span>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-brand-700 underline-offset-2 hover:underline"
                >
                  باز کردن فایل
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}
            <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-ink-100/70 bg-white px-4 py-2.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-ink-700">
                <Paperclip className="h-3 w-3 text-ink-300" />
                {title}
              </span>
              <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[9.5px] font-extrabold text-ink-500 ring-1 ring-inset ring-ink-100">
                {MEDIA_TYPE_LABELS[kind]}
              </span>
              <AttachmentMetaChips attachment={att} />
              <span className="mr-auto">
                <MirrorChip attachment={att} />
              </span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="در حال دریافت جزئیات روایت">
      <div className="h-5 w-2/5 animate-pulse rounded-full bg-ink-100" />
      <div className="h-32 animate-pulse rounded-2xl bg-ink-100/80" />
      <div className="h-48 animate-pulse rounded-2xl bg-ink-100/60" />
    </div>
  );
}

/* ═══ مودال ═══ */

export function StoryDetailModal({
  storyId,
  startInEditMode = false,
  uploadConfig,
  onClose,
  onSaved,
  onRequestDelete,
}: {
  storyId: number;
  startInEditMode?: boolean;
  uploadConfig: StudioUploadConfig;
  onClose: () => void;
  /** پس از PATCH موفق — والد فهرست/شمارنده‌ها را تازه و toast نشان می‌دهد */
  onSaved: (updated: MySubmissionDetail, rePended: boolean) => void;
  onRequestDelete: (item: MySubmissionItem) => void;
}) {
  const [detail, setDetail] = useState<MySubmissionDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(startInEditMode);
  const seqRef = useRef(0);

  /* حالتِ فرمِ ویرایش */
  const [draft, setDraft] = useState<StudioDraft>({ title: '', description: '', attachments: [] });
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [apiFields, setApiFields] = useState<StudioFieldErrors>({ attachmentUrl: {} });

  const hydrateDraft = useCallback((d: MySubmissionDetail) => {
    setDraft({
      title: d.title ?? '',
      description: d.description ?? '',
      attachments: (d.attachments ?? [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, STUDIO_LIMITS.ATTACHMENTS_MAX)
        .map(attachmentRowFromDetail),
    });
    setAttempted(false);
    setApiFields({ attachmentUrl: {} });
    setBanner(null);
  }, []);

  const load = useCallback(async () => {
    const seq = ++seqRef.current;
    setLoadError(false);
    try {
      const d = await fetchMySubmissionDetail(storyId);
      if (seq !== seqRef.current) return;
      setDetail(d);
      hydrateDraft(d);
    } catch {
      if (seq !== seqRef.current) return;
      setLoadError(true);
    }
  }, [storyId, hydrateDraft]);

  useEffect(() => {
    setDetail(null);
    void load();
    return () => {
      seqRef.current += 1;
    };
  }, [load]);

  /* Escape می‌بندد (به‌جز وسطِ ذخیره) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const errors = useMemo(() => validateStudioDraft(draft), [draft]);
  const lockedType = useMemo(() => lockedMediaTypeOf(draft.attachments), [draft.attachments]);
  const urlErrors = attempted
    ? { ...errors.attachmentUrl, ...apiFields.attachmentUrl }
    : errors.attachmentUrl;

  const patchDraft = (patch: Partial<StudioDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const changeRow = useCallback((id: string, patch: Partial<AttachmentDraft>) => {
    setDraft((d) => ({
      ...d,
      attachments: d.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);
  const addRow = useCallback(() => {
    setDraft((d) =>
      d.attachments.length >= STUDIO_LIMITS.ATTACHMENTS_MAX
        ? d
        : {
            ...d,
            attachments: [...d.attachments, newAttachmentRow(lockedMediaTypeOf(d.attachments))],
          },
    );
  }, []);
  const removeRow = useCallback(
    (id: string) =>
      setDraft((d) => ({ ...d, attachments: d.attachments.filter((a) => a.id !== id) })),
    [],
  );
  const moveRow = useCallback((id: string, dir: -1 | 1) => {
    setDraft((d) => {
      const idx = d.attachments.findIndex((a) => a.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= d.attachments.length) return d;
      const next = [...d.attachments];
      const [row] = next.splice(idx, 1);
      next.splice(target, 0, row);
      return { ...d, attachments: next };
    });
  }, []);
  const resetAttachmentType = useCallback(() => setDraft((d) => ({ ...d, attachments: [] })), []);

  const save = useCallback(async () => {
    if (!detail) return;
    setAttempted(true);
    setApiFields({ attachmentUrl: {} });
    setBanner(null);
    if (!isStudioSubmittable(draft)) {
      setBanner('چند مورد هنوز کامل نیست؛ خطاهای فرم را برطرف کن و دوباره ذخیره کن.');
      return;
    }
    setSaving(true);
    const wasPending = detail.submission_status === 'pending_review';
    try {
      const updated = await updateMySubmission(detail.id, buildUpdatePayload(draft));
      setDetail(updated);
      setEditing(false);
      setAttempted(false);
      onSaved(updated, !wasPending);
    } catch (err) {
      if (isApiError(err) && err.errors) {
        const e = err.errors;
        const pick = (k: string) => {
          const v = e[k];
          if (typeof v === 'string') return v;
          if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
          return undefined;
        };
        const fields: StudioFieldErrors = { attachmentUrl: {} };
        const t = pick('title');
        const d = pick('description');
        const a = pick('attachments');
        if (t) fields.title = t;
        if (d) fields.description = d;
        if (a) fields.attachments = String(a);
        setApiFields(fields);
      }
      setBanner(firstErrorMessage(err) ?? 'ذخیره‌ی ویرایش ناموفق بود؛ دوباره تلاش کن.');
    } finally {
      setSaving(false);
    }
  }, [detail, draft, onSaved]);

  const validNow = isStudioSubmittable(draft);
  const createdAt = detail?.created_at ? formatRelativeFa(detail.created_at) : null;
  const updatedAt = detail?.updated_at ? formatRelativeFa(detail.updated_at) : null;
  const reviewedAt = detail?.reviewed_at ? formatRelativeFa(detail.reviewed_at) : null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'ویرایش روایت' : 'جزئیات روایت'}
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* پس‌زمینه */}
      <button
        type="button"
        aria-label="بستن"
        onClick={() => {
          if (!saving) onClose();
        }}
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_40px_80px_-24px_rgba(16,24,40,.4)] sm:rounded-3xl"
      >
        {/* هدر */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-gradient-to-l from-brand-50/70 via-white to-mint-50/50 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-inset ring-brand-600/15">
              {editing ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-black text-ink-900">
                {editing ? 'ویرایش روایت' : detail?.title?.trim() || 'جزئیات روایت'}
              </h2>
              {detail && !editing ? (
                <p className="mt-0.5 text-[10.5px] font-bold text-ink-400">
                  {createdAt ? `ثبت ${createdAt}` : ''}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {detail ? <StatusChip status={detail.submission_status} /> : null}
            <button
              type="button"
              onClick={() => {
                if (!saving) onClose();
              }}
              aria-label="بستن مودال"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-white hover:text-ink-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* بدنه */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loadError ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[14px] font-black text-ink-900">جزئیات روایت نیامد</p>
              <p className="mt-1.5 text-[12px] font-semibold text-ink-500">
                ارتباط با سرور برقرار نشد؛ دوباره تلاش کن.
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-[12.5px] font-extrabold text-white transition-colors hover:bg-brand-700"
              >
                <RefreshCw className="h-4 w-4" />
                تلاش دوباره
              </button>
            </div>
          ) : !detail ? (
            <DetailSkeleton />
          ) : editing ? (
            /* ════════ حالتِ ویرایش ════════ */
            <div className="space-y-5 p-5 sm:p-6">
              {detail.submission_status !== 'pending_review' ? (
                <p className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold leading-6 text-amber-800">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  روایتت قبلاً بررسی شده؛ با ذخیره‌ی ویرایش دوباره به صفِ بررسی می‌رود و تا تأییدِ
                  مجددِ مدیر منتشر نمی‌شود.
                </p>
              ) : null}

              {/* عنوان */}
              <div>
                <label
                  htmlFor="edit-title"
                  className="flex items-center justify-between text-[13px] font-black text-ink-900"
                >
                  <span>
                    عنوانِ روایت{' '}
                    <span className="text-brand-600" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <span className="text-[10.5px] font-bold tabular-nums text-ink-300">
                    {formatPersianNumber(draft.title.trim().length)} /{' '}
                    {formatPersianNumber(STUDIO_LIMITS.TITLE_MAX)}
                  </span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={draft.title}
                  disabled={saving}
                  onChange={(e) => patchDraft({ title: e.target.value })}
                  maxLength={STUDIO_LIMITS.TITLE_MAX + 20}
                  aria-invalid={Boolean(attempted && errors.title)}
                  className="mt-2 h-12 w-full rounded-2xl border border-ink-200 bg-white px-4 text-[13.5px] font-bold text-ink-900 outline-none transition placeholder:font-semibold placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>

              {/* شرح */}
              <div>
                <label
                  htmlFor="edit-desc"
                  className="flex items-center justify-between text-[13px] font-black text-ink-900"
                >
                  <span>
                    شرحِ روایت{' '}
                    <span className="text-brand-600" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <span className="text-[10.5px] font-bold tabular-nums text-ink-300">
                    {formatPersianNumber(draft.description.trim().length)} نویسه
                  </span>
                </label>
                <textarea
                  id="edit-desc"
                  value={draft.description}
                  disabled={saving}
                  onChange={(e) => patchDraft({ description: e.target.value })}
                  rows={6}
                  aria-invalid={Boolean(attempted && errors.description)}
                  className="mt-2 w-full resize-y rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-[13px] font-semibold leading-7 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>

              {(attempted && (errors.title ?? apiFields.title)) ||
              (attempted && (errors.description ?? apiFields.description)) ? (
                <p role="alert" className="text-[11.5px] font-bold text-rose-600">
                  {(errors.title ?? apiFields.title) ||
                    (errors.description ?? apiFields.description)}
                </p>
              ) : null}

              <AttachmentEditor
                rows={draft.attachments}
                urlErrors={urlErrors}
                listError={attempted ? (errors.attachments ?? apiFields.attachments) : undefined}
                disabled={saving}
                lockedType={lockedType}
                uploadConfig={uploadConfig}
                onAdd={addRow}
                onRemove={removeRow}
                onMove={moveRow}
                onChange={changeRow}
                onResetType={resetAttachmentType}
              />

              {banner ? (
                <p
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] font-bold leading-6 text-rose-700"
                >
                  {banner}
                </p>
              ) : null}
            </div>
          ) : (
            /* ════════ حالتِ نمایش ════════ */
            <div className="space-y-5 p-5 sm:p-6">
              {/* متا */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {createdAt ? <MetaRow label="ثبت" value={createdAt} /> : null}
                {updatedAt ? <MetaRow label="آخرین ویرایش" value={updatedAt} /> : null}
                {reviewedAt ? <MetaRow label="بررسی" value={reviewedAt} /> : null}
              </div>

              {/* یادداشتِ مدیر */}
              {detail.admin_note?.trim() ? (
                <div className="flex items-start gap-2 rounded-2xl bg-ink-50 px-4 py-3 text-[12px] font-semibold leading-6 text-ink-700 ring-1 ring-inset ring-ink-100">
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                  <p>
                    <span className="font-black">یادداشت بررسی مدیر: </span>
                    {detail.admin_note.trim()}
                  </p>
                </div>
              ) : null}

              {/* راهنمای وضعیت */}
              {detail.submission_status === 'pending_review' ? (
                <p className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[11.5px] font-bold leading-6 text-amber-800">
                  روایتت در صفِ بررسی است؛ تا وقتی مدیر تأیید نکرده می‌توانی هر تغییری بدهی یا حذفش
                  کنی. با تأیید، در فیدِ روایت‌ها و دیوارِ جهاد تبیین منتشر می‌شود.
                </p>
              ) : null}

              {/* شرح */}
              <div className="rounded-2xl border border-ink-100 bg-white p-4">
                <p className="whitespace-pre-line text-[13px] font-semibold leading-7 text-ink-800">
                  {detail.description?.trim() || '—'}
                </p>
              </div>

              {/* پیوست‌ها */}
              <section aria-label="پیوست‌های روایت">
                <h3 className="mb-2.5 flex items-center gap-1.5 text-[12.5px] font-black text-ink-900">
                  <Paperclip className="h-4 w-4 text-brand-600" />
                  پیوست‌ها
                  <span className="text-[10.5px] font-bold tabular-nums text-ink-400">
                    ({toPersianDigits(detail.attachments?.length ?? 0)})
                  </span>
                </h3>
                <AttachmentGallery attachments={detail.attachments ?? []} />
              </section>
            </div>
          )}
        </div>

        {/* فوترِ اکشن */}
        {detail && !loadError ? (
          <div className="flex flex-wrap items-center gap-2.5 border-t border-ink-100 bg-white px-5 py-4 sm:px-6">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving || !validNow}
                  className={cn(
                    'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-[13px] font-extrabold text-white transition-all active:scale-[.99]',
                    'bg-gradient-to-l from-brand-500 to-brand-700 shadow-[0_14px_28px_-12px_rgba(13,128,116,.6)]',
                    (saving || !validNow) && 'opacity-70',
                  )}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'در حال ذخیره…' : 'ذخیره‌ی ویرایش'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hydrateDraft(detail);
                    setEditing(false);
                  }}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border-2 border-ink-200 bg-white px-5 text-[12.5px] font-extrabold text-ink-600 transition-colors hover:bg-ink-50"
                >
                  انصراف
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-500 to-brand-700 px-5 text-[13px] font-extrabold text-white shadow-[0_14px_28px_-12px_rgba(13,128,116,.6)] transition-transform active:scale-[.98]"
                >
                  <PenLine className="h-4 w-4" />
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(detail)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white px-5 text-[12.5px] font-extrabold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </button>
                {detail.submission_status === 'approved' ? (
                  <Link
                    href={`/tabyin/${encodeURIComponent(detail.external_id)}`}
                    className="mr-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-mint-400/60 bg-mint-50 px-5 text-[12.5px] font-extrabold text-mint-700 transition-colors hover:bg-mint-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    مشاهده در فید
                  </Link>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
