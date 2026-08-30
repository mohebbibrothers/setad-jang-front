'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  Check,
  Clock3,
  Eye,
  Feather,
  FileText,
  LayoutGrid,
  Loader2,
  Lock,
  LogIn,
  MessageSquareText,
  Paperclip,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/use-auth';
import { formatRelativeFa } from '@/lib/persian-time';
import { cn, toPersianDigits, truncate } from '@/lib/utils';
import {
  deleteMySubmission,
  fetchAllMySubmissions,
  fetchStudioUploadConfig,
  STUDIO_UPLOAD_FALLBACK,
  type MySubmissionDetail,
  type MySubmissionItem,
  type StudioUploadConfig,
  type SubmissionStatusValue,
} from '@/lib/studio';
import { AuthModal } from '@/components/auth/AuthModal';
import { StatusChip } from './StatusChip';
import { StoryDetailModal } from './StoryDetailModal';

/**
 * ═══════════════════════════════════════════════════════════════════
 * MyStoriesManager — داشبوردِ «روایت‌های من» (/tabyin/mine)
 *
 * نقطه‌ی اوجِ مدیریتِ محتوای مردمی: هر روایت را با همه‌ی ابعادش می‌بینی
 * و رویش حکمرانی می‌کنی — مشاهده‌ی غنی (متن + گالریِ رسانه + وضعیتِ
 * نگه‌داشت روی سرور)، ویرایشِ کامل (با قانونِ بازگشت به صفِ بررسی) و
 * حذفِ قطعی (با تأییدِ دومرحله‌ای و رخدادِ فوری روی دیوارِ خانه).
 *
 * معماری:
 *   • آمارِ زنده (کل/درانتظار/منتشر/رد) که به‌عنوان فیلتر هم عمل می‌کند؛
 *   • جست‌وجوی سمتِ کلاینت روی عناوین — بدونِ رفت‌وبرگشتِ اضافی؛
 *   • مودالِ مشاهده/ویرایش از StoryDetailModal؛ حذف با دیالوگِ تأییدِ
 *     همین فایل تا رفتار در کارت و مودال یکی باشد؛
 *   • toastِ یکپارچه برای بازخوردِ ذخیره/حذف.
 * قراردادهای حفظ‌شده: هیچ لینکِ خارجیِ منبع («محتوانگار») اینجا رندر
 * نمی‌شود؛ وضعیت‌ها فقط از submission_status بک‌اند می‌آیند.
 * ═══════════════════════════════════════════════════════════════════
 */

type StatusFilter = 'all' | 'pending_review' | 'approved' | 'rejected';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'danger';
}

/* ── استخراجِ پیامِ خوانا از خطا ── */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message?: unknown }).message ?? '');
    if (m) return m;
  }
  return fallback;
}

/* ═══ کارت‌های آمار ═══ */

const STAT_DEFS: Array<{
  key: StatusFilter;
  label: string;
  icon: typeof LayoutGrid;
  activeClass: string;
  iconClass: string;
}> = [
  {
    key: 'all',
    label: 'همه‌ی روایت‌ها',
    icon: LayoutGrid,
    activeClass: 'border-brand-500/40 bg-brand-50/70 ring-brand-500/20',
    iconClass: 'bg-brand-600 text-white',
  },
  {
    key: 'pending_review',
    label: 'در انتظار بررسی',
    icon: Clock3,
    activeClass: 'border-amber-400/50 bg-amber-50/70 ring-amber-400/20',
    iconClass: 'bg-amber-500 text-white',
  },
  {
    key: 'approved',
    label: 'منتشر شده',
    icon: BadgeCheck,
    activeClass: 'border-emerald-400/50 bg-emerald-50/70 ring-emerald-400/20',
    iconClass: 'bg-emerald-500 text-white',
  },
  {
    key: 'rejected',
    label: 'بررسی شد — منتشر نشد',
    icon: XCircle,
    activeClass: 'border-rose-400/50 bg-rose-50/70 ring-rose-400/20',
    iconClass: 'bg-rose-500 text-white',
  },
];

function StatCard({
  def,
  count,
  active,
  onSelect,
}: {
  def: (typeof STAT_DEFS)[number];
  count: number;
  active: boolean;
  onSelect: (key: StatusFilter) => void;
}) {
  const ChipIcon = def.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(def.key)}
      aria-pressed={active}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border bg-white p-4 text-right shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(16,24,40,.25)]',
        active ? cn('ring-2', def.activeClass) : 'border-ink-100',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
          def.iconClass,
        )}
      >
        <ChipIcon className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[22px] font-black tabular-nums leading-7 text-ink-900">
          {toPersianDigits(count)}
        </span>
        <span className="truncate text-[11px] font-extrabold text-ink-500">{def.label}</span>
      </span>
    </button>
  );
}

/* ═══ کارتِ روایت ═══ */

function StoryCard({
  item,
  index,
  onView,
  onEdit,
  onDelete,
}: {
  item: MySubmissionItem;
  index: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.28), ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(16,24,40,.22)]"
    >
      <div className="flex items-start justify-between gap-2">
        <StatusChip status={item.submission_status as SubmissionStatusValue} />
        {item.created_at ? (
          <span className="text-[10.5px] font-bold text-ink-300">
            {formatRelativeFa(item.created_at)}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.9em] text-[15px] font-black leading-6 text-ink-900">
        {item.title?.trim() || '(بدون عنوان)'}
      </h3>

      <div className="mt-2 flex items-center gap-3 text-[11px] font-bold text-ink-400">
        {typeof item.attachments_count === 'number' && item.attachments_count > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {toPersianDigits(item.attachments_count)} پیوست
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-ink-300">
            <FileText className="h-3 w-3" />
            روایتِ متنی
          </span>
        )}
      </div>

      {item.submission_status === 'rejected' && item.admin_note?.trim() ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50/70 px-3 py-2.5 text-[11px] font-semibold leading-5 text-rose-800 ring-1 ring-inset ring-rose-100">
          <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
          <p>{truncate(item.admin_note.trim(), 160)}</p>
        </div>
      ) : null}

      {/* اکشن‌ها */}
      <div className="mt-4 flex items-center gap-2 border-t border-ink-100/80 pt-3.5">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-900 text-[11.5px] font-extrabold text-white transition-colors hover:bg-ink-800"
        >
          <Eye className="h-3.5 w-3.5" />
          مشاهده
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-[11.5px] font-extrabold text-white transition-colors hover:bg-brand-700"
        >
          <PenLine className="h-3.5 w-3.5" />
          ویرایش
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`حذف «${item.title?.trim() || 'روایت'}»`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 transition-colors hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.article>
  );
}

/* ═══ اسکلت ═══ */

function CardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-3xl border border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 animate-pulse rounded-full bg-ink-100" />
        <div className="h-3 w-14 animate-pulse rounded-full bg-ink-100/70" />
      </div>
      <div className="mt-4 h-4 w-4/5 animate-pulse rounded-full bg-ink-100" />
      <div className="mt-2 h-4 w-3/5 animate-pulse rounded-full bg-ink-100/80" />
      <div className="mt-5 flex gap-2 border-t border-ink-100/70 pt-4">
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-ink-100" />
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-ink-100" />
        <div className="h-9 w-9 animate-pulse rounded-xl bg-ink-100" />
      </div>
    </div>
  );
}

/* ═══ دیالوگِ تأییدِ حذف ═══ */

function DeleteConfirmDialog({
  item,
  deleting,
  onCancel,
  onConfirm,
}: {
  item: MySubmissionItem;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, deleting]);

  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-label="تأیید حذف روایت"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <button
        type="button"
        aria-label="بستن دیالوگ حذف"
        onClick={() => {
          if (!deleting) onCancel();
        }}
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_40px_80px_-24px_rgba(16,24,40,.45)] sm:p-7"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-[17px] font-black text-ink-900">روایت برای همیشه حذف شود؟</h2>
        <p className="mx-auto mt-2 line-clamp-2 max-w-xs text-[12.5px] font-black leading-6 text-ink-700">
          «{item.title?.trim() || 'بدون عنوان'}»
        </p>
        <p className="mx-auto mt-2 max-w-sm text-[12px] font-semibold leading-6 text-ink-500">
          روایت به‌طور کامل پاک می‌شود و از همان لحظه، دیگر در «دیوار جهاد تبیین»، فیدِ روایت‌ها و
          جست‌وجو دیده نمی‌شود. این کار قابلِ بازگشت نیست.
        </p>
        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 text-[13px] font-extrabold text-white shadow-[0_14px_28px_-12px_rgba(225,29,72,.5)] transition-all hover:bg-rose-700 active:scale-[.99] disabled:opacity-70"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting ? 'در حال حذف…' : 'بله، حذف کن'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border-2 border-ink-200 bg-white text-[13px] font-extrabold text-ink-600 transition-colors hover:bg-ink-50"
          >
            انصراف
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══ toast ═══ */

const TOAST_TONES: Record<ToastState['tone'], string> = {
  success: 'bg-emerald-600',
  info: 'bg-ink-900',
  danger: 'bg-rose-600',
};

function Toast({ toast }: { toast: ToastState }) {
  return (
    <motion.div
      key={toast.id}
      role="status"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'pointer-events-none fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-5 py-3.5 text-[12.5px] font-extrabold text-white shadow-[0_24px_48px_-16px_rgba(16,24,40,.5)]',
        TOAST_TONES[toast.tone],
      )}
    >
      <Check className="h-4 w-4 shrink-0" />
      {toast.message}
    </motion.div>
  );
}

/* ═══ پنلِ قفل (مهمان) ═══ */

function GuestLock({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-ink-100 bg-white p-7 text-center shadow-[0_2px_8px_-2px_rgba(16,24,40,.06)] sm:p-9">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-[18px] font-black text-ink-900">برای دیدنِ روایت‌هایت وارد شو</h2>
      <p className="mx-auto mt-2.5 max-w-sm text-[12.5px] font-semibold leading-7 text-ink-500">
        «روایت‌های من» صندوقِ شخصیِ توست: وضعیتِ بررسی، یادداشتِ مدیر، ویرایش و حذف — همه با حسابِ
        خودت.
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-500 to-brand-700 text-[14px] font-extrabold text-white shadow-[0_14px_30px_-10px_rgba(13,128,116,.55)] transition-transform active:scale-[.985]"
      >
        <LogIn className="h-5 w-5" />
        ورود یا ساخت حساب (چند ثانیه)
      </button>
    </div>
  );
}

/* ═══ داشبورد ═══ */

export function MyStoriesManager() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [items, setItems] = useState<MySubmissionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: number; edit: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MySubmissionItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [uploadConfig, setUploadConfig] = useState<StudioUploadConfig>(STUDIO_UPLOAD_FALLBACK);
  const seqRef = useRef(0);
  const toastSeq = useRef(0);

  const showToast = useCallback((message: string, tone: ToastState['tone'] = 'success') => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 3400);
  }, []);

  const load = useCallback(async (silent = false) => {
    const seq = ++seqRef.current;
    if (!silent) setError(null);
    try {
      const data = await fetchAllMySubmissions();
      if (seq !== seqRef.current) return;
      setItems(data.items);
    } catch (err) {
      if (seq !== seqRef.current) return;
      setItems([]);
      setError(errorMessage(err, 'فهرست روایت‌ها نیامد.'));
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, load]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const cfg = await fetchStudioUploadConfig();
        if (alive) setUploadConfig(cfg);
      } catch {
        /* پیش‌فرض کافی است */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* قفلِ اسکرولِ صفحه وقتی مودال باز است */
  const anyOverlay = selected != null || deleteTarget != null;
  useEffect(() => {
    if (!anyOverlay) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyOverlay]);

  const counts = useMemo(() => {
    const c = { all: 0, pending_review: 0, approved: 0, rejected: 0 } as Record<
      StatusFilter,
      number
    >;
    for (const it of items ?? []) {
      c.all += 1;
      if (it.submission_status === 'pending_review') c.pending_review += 1;
      else if (it.submission_status === 'approved') c.approved += 1;
      else if (it.submission_status === 'rejected') c.rejected += 1;
    }
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim();
    return (items ?? []).filter((it) => {
      if (filter !== 'all' && it.submission_status !== filter) return false;
      if (q && !(it.title ?? '').includes(q)) return false;
      return true;
    });
  }, [items, filter, query]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMySubmission(deleteTarget.id);
      setItems((prev) => (prev ? prev.filter((it) => it.id !== deleteTarget.id) : prev));
      setSelected((prev) => (prev && prev.id === deleteTarget.id ? null : prev));
      setDeleteTarget(null);
      showToast('روایت برای همیشه حذف شد — از دیوار و فید هم رفت.', 'danger');
    } catch (err) {
      showToast(errorMessage(err, 'حذف ناموفق بود؛ دوباره تلاش کن.'), 'danger');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, showToast]);

  const onSaved = useCallback(
    (updated: MySubmissionDetail, rePended: boolean) => {
      /* فهرست را در پس‌زمینه تازه کن تا شمارنده‌ها و وضعیت کارت دقیق بماند */
      void load(true);
      showToast(
        rePended
          ? 'ویرایش ثبت شد؛ روایتت دوباره به صفِ بررسی رفت.'
          : 'روایت به‌روزرسانی شد — همچنان در صفِ بررسی است.',
      );
    },
    [load, showToast],
  );

  /* ── گیتِ احراز ── */
  if (authLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <>
        <GuestLock onLogin={() => setAuthOpen(true)} />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  return (
    <div className="pb-16">
      {/* ── نوارِ ابزار ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجو در عنوانِ روایت‌ها…"
            aria-label="جست‌وجو در روایت‌های من"
            className="h-11 w-full rounded-2xl border border-ink-200 bg-white pl-4 pr-10 text-[13px] font-bold text-ink-900 outline-none transition placeholder:font-semibold placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setItems(null);
            void load();
          }}
          aria-label="تازه‌سازی فهرست"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink-200 bg-white text-ink-500 transition-colors hover:bg-ink-50 hover:text-brand-700"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <Link
          href="/tabyin/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-mint-500 px-5 text-[13px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(37,197,186,.55)] transition-all hover:scale-[1.02] hover:bg-mint-600 active:scale-[.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          روایتِ تازه
        </Link>
      </div>

      {/* ── آمار/فیلتر ── */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_DEFS.map((def) => (
          <StatCard
            key={def.key}
            def={def}
            count={counts[def.key]}
            active={filter === def.key}
            onSelect={(key) => setFilter((f) => (f === key ? 'all' : key))}
          />
        ))}
      </div>

      {/* ── فهرست ── */}
      <div className="mt-6">
        {items === null && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-100 bg-rose-50/50 px-5 py-12 text-center">
            <p className="text-[15px] font-black text-ink-900">فهرست روایت‌ها نیامد</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] font-semibold leading-6 text-ink-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setItems(null);
                void load();
              }}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-[12.5px] font-extrabold text-white transition-colors hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              تلاش دوباره
            </button>
          </div>
        ) : (items ?? []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 px-5 py-14 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-600 ring-1 ring-inset ring-brand-600/15">
              <Feather className="h-7 w-7" />
            </span>
            <p className="mt-4 text-[16px] font-black text-ink-900">هنوز روایتی ننوشته‌ای</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] font-semibold leading-7 text-ink-500">
              اولین روایتت را در استودیو بنویس؛ همین‌جا وضعیتِ بررسی‌اش را دنبال می‌کنی و هر وقت
              خواستی ویرایش یا حذفش می‌کنی.
            </p>
            <Link
              href="/tabyin/new"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-l from-brand-500 to-brand-700 px-6 text-[13px] font-extrabold text-white shadow-[0_12px_26px_-10px_rgba(13,128,116,.55)] transition-transform active:scale-[.985]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              نوشتنِ اولین روایت
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 px-5 py-12 text-center">
            <p className="text-[14px] font-black text-ink-900">چیزی با این فیلتر پیدا نشد</p>
            <p className="mt-1.5 text-[12.5px] font-semibold text-ink-500">
              فیلتر یا عبارتِ جست‌وجو را عوض کن.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
              className="mt-4 inline-flex h-9 items-center rounded-full bg-white px-4 text-[12px] font-extrabold text-brand-700 ring-1 ring-inset ring-brand-600/20 transition-colors hover:bg-brand-50"
            >
              پاک کردن فیلترها
            </button>
          </div>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((item, i) => (
                <StoryCard
                  key={item.id}
                  item={item}
                  index={i}
                  onView={() => setSelected({ id: item.id, edit: false })}
                  onEdit={() => setSelected({ id: item.id, edit: true })}
                  onDelete={() => setDeleteTarget(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── مودال‌ها و toast ── */}
      <AnimatePresence>
        {selected ? (
          <StoryDetailModal
            key={selected.id}
            storyId={selected.id}
            startInEditMode={selected.edit}
            uploadConfig={uploadConfig}
            onClose={() => setSelected(null)}
            onSaved={onSaved}
            onRequestDelete={(item: MySubmissionItem) => setDeleteTarget(item)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {deleteTarget ? (
          <DeleteConfirmDialog
            key="delete-dialog"
            item={deleteTarget}
            deleting={deleting}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => void confirmDelete()}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>{toast ? <Toast key={toast.id} toast={toast} /> : null}</AnimatePresence>
    </div>
  );
}
