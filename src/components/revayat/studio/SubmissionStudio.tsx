'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * SubmissionStudio — استودیوی روایت (/tabyin/new)
 *
 * ایده‌ی مرکزی: «کاربر دستش باز باشد، داخل قابلیت‌های واقعی».
 * هر چیزی که بک‌اند برای ارسالِ محتوای مردمی تعریف کرده (عنوان، شرح،
 * ۵ پیوستِ نشانی‌محور با نوع/عنوان/ترتیب، وضعیت‌پیگیری و یادداشتِ
 * بررسی) اینجا به یک تجربه‌ی یکپارچه و لذت‌بخش بدل شده است:
 *
 *   • فرمِ زنده با اعتبارسنجیِ آینه‌ای (lib/studio) — همان خطاهایی که
 *     سرور می‌دهد، قبل از ارسال همین‌جا می‌بینی؛
 *   • بوش‌گرِ خودکارِ نوعِ رسانه + تامنیلِ پروب برای نشانی‌ها؛
 *   • پیش‌نمایشِ واقعی با RevayatCardِ تولیدی — «آنچه می‌نویسی همان
 *     است که در فید می‌بینی»؛
 *   • پیش‌نویسِ خودکار در localStorage — رفرشِ تصادفی، روایتت را نمی‌برد؛
 *   • پنلِ «روایت‌های من» با حلقه‌ی کاملِ وضعیتِ بررسی و یادداشتِ مدیر؛
 *   • ورود/ثبت‌نام درجا با همان AuthModalِ سایت — بدونِ خروج از صفحه.
 *
 * قراردادها که هرگز شکسته نمی‌شوند:
 *   • نام نویسنده توسط بک‌اند از حساب کاربر گرفته می‌شود — اینجا فقط
 *     نمایش است، نه ویرایش (صداقتِ قرارداد)؛
 *   • حداکثر ۵ پیوست، عنوان ≤۵۱۲، نشانی ≤۱۰۲۴ (STUDIO_LIMITS)؛
 *   • انتشار فقط پس از تأیید مدیر (pending_review → approved).
 * ═══════════════════════════════════════════════════════════════════
 */

import {
  BadgeCheck,
  Check,
  Clock3,
  Copy,
  Eye,
  Feather,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  LogIn,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, firstErrorMessage, isApiError } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { cn, formatPersianNumber, toPersianDigits } from '@/lib/utils';
import {
  buildSubmissionPayload,
  fetchStudioUploadConfig,
  isStudioSubmittable,
  lockedMediaTypeOf,
  migrateAttachmentRow,
  newAttachmentRow,
  previewItemFromDraft,
  STUDIO_LIMITS,
  STUDIO_UPLOAD_FALLBACK,
  submissionStatusMeta,
  validateStudioDraft,
  type AttachmentDraft,
  type MySubmissionDetail,
  type StudioDraft,
  type StudioFieldErrors,
  type StudioUploadConfig,
} from '@/lib/studio';
import { AuthModal } from '@/components/auth/AuthModal';
import { RevayatCard } from '@/components/revayat/RevayatCard';
import { AttachmentEditor } from './AttachmentEditor';
import { MySubmissions } from './MySubmissions';

/* ── پیش‌نویسِ پایدار (فرم، نه توکن!) ── */
const DRAFT_KEY = 'besat.tabyin.studio.v1';

function loadPersistedDraft(): StudioDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioDraft> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      attachments: Array.isArray(parsed.attachments)
        ? parsed.attachments
            .map((a) => migrateAttachmentRow(a))
            .filter((a): a is AttachmentDraft => Boolean(a))
            .slice(0, STUDIO_LIMITS.ATTACHMENTS_MAX)
        : [],
    };
  } catch {
    return null;
  }
}

function emptyDraft(): StudioDraft {
  return { title: '', description: '', attachments: [] };
}

/* ── استخراجِ خطاهای سرور (DRF) به ساختارِ مستقیمِ فرم ── */
function mapApiErrors(err: unknown): { banner: string; fields: StudioFieldErrors } {
  const fields: StudioFieldErrors = { attachmentUrl: {} };
  let banner = 'ارسال روایت ناموفق بود؛ دوباره تلاش کن.';
  if (isApiError(err)) {
    const e = err.errors ?? {};
    const pick = (k: string) => {
      const v = e[k];
      if (typeof v === 'string') return v;
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
      return undefined;
    };
    const t = pick('title');
    const d = pick('description');
    const a = pick('attachments');
    if (t) fields.title = t;
    if (d) fields.description = d;
    if (a) fields.attachments = typeof a === 'string' ? a : String(a);
    const first = firstErrorMessage(err);
    if (first) banner = first;
    if (err.status === 401)
      banner = 'نشستت معتبر نیست یا منقضی شده — دوباره وارد حسابت شو و روایتت را بفرست.';
    if (err.status === 429) banner = 'کمی آهسته‌تر! چند دقیقه‌ی دیگر دوباره بفرست.';
  }
  return { banner, fields };
}

/* ═══ ابزارهای نمایشِ کوچک ═══ */

function StepDot({
  done,
  active,
  num,
  label,
}: {
  done: boolean;
  active: boolean;
  num: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5" aria-current={active ? 'step' : undefined}>
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-[10.5px] font-black transition-all',
          done
            ? 'bg-emerald-500 text-white'
            : active
              ? 'bg-brand-600 text-white shadow-[0_4px_10px_-3px_rgba(13,128,116,.6)]'
              : 'bg-ink-100 text-ink-400',
        )}
      >
        {done ? <Check className="h-3 w-3" /> : toPersianDigits(num)}
      </span>
      <span
        className={cn(
          'text-[11px] font-extrabold',
          done || active ? 'text-ink-800' : 'text-ink-400',
        )}
      >
        {label}
      </span>
    </span>
  );
}

function FieldCounter({ value, max }: { value: number; max: number }) {
  const near = value > max * 0.9;
  return (
    <span
      className={cn(
        'text-[10.5px] font-bold tabular-nums transition-colors',
        near ? 'text-amber-600' : 'text-ink-300',
      )}
      aria-live="polite"
    >
      {formatPersianNumber(value)} / {formatPersianNumber(max)}
    </span>
  );
}

/* ═══ پانلِ قفل (مهمان) ═══ */
function LockedPanel({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-ink-100 bg-white p-7 text-center shadow-[0_2px_8px_-2px_rgba(16,24,40,.06)] sm:p-9">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-[18px] font-black text-ink-900">برای روایت‌گویی، وارد شو</h2>
      <p className="mx-auto mt-2.5 max-w-sm text-[12.5px] font-semibold leading-7 text-ink-500">
        ارسال روایت فقط با حسابِ کاربری ممکن است؛ روایتت به نامِ حسابِ خودت ثبت و بعد از تأییدِ
        مدیر، در فیدِ روایت‌ها و دیوارِ جهاد تبیین منتشر می‌شود.
      </p>
      <ul className="mx-auto mt-4 max-w-xs space-y-2 text-right text-[11.5px] font-bold text-ink-600">
        {[
          'روایتِ تو کنار روایت‌های همه‌ی مردم می‌نشیند',
          'وضعیتِ بررسی و پاسخِ مدیر را همین‌جا می‌بینی',
          'فقط چند ثانیه با شماره‌ی موبایل یا ایمیل',
        ].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-50 text-mint-600">
              <Check className="h-3 w-3" />
            </span>
            {t}
          </li>
        ))}
      </ul>
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

/* ═══ موفقیت ═══ */
function SuccessPanel({ externalId, onReset }: { externalId: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(externalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* کلیپ‌برد نیست — سکوت */
    }
  };
  return (
    <div className="studio-fade-up mx-auto max-w-xl rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-white p-7 text-center shadow-[0_2px_10px_-2px_rgba(16,24,40,.05)] sm:p-9">
      <span className="count-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_18px_36px_-12px_rgba(16,185,129,.65)]">
        <BadgeCheck className="h-8 w-8" />
      </span>
      <h2 className="mt-4 text-[20px] font-black text-ink-900">روایتت ثبت شد 🎉</h2>
      <p className="mx-auto mt-2.5 max-w-sm text-[12.5px] font-semibold leading-7 text-ink-600">
        روایتت با موفقیت به صفِ بررسی رفت. مدیر بعد از بازبینی آن را تأیید و منتشر می‌کند؛ وضعیتش را
        همین‌جا در «روایت‌های من» پیگیری کن.
      </p>
      <div className="mx-auto mt-5 flex max-w-xs items-center justify-between gap-2 rounded-2xl border border-ink-100 bg-white px-3.5 py-2.5 ring-1 ring-ink-100/60">
        <span className="text-[10.5px] font-extrabold text-ink-400">کدِ پیگیری</span>
        <code dir="ltr" className="font-mono text-[11px] font-bold text-ink-700">
          {externalId}
        </code>
        <button
          type="button"
          onClick={copyId}
          aria-label="کپی کد پیگیری"
          className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-brand-700"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-l from-brand-500 to-brand-700 px-6 text-[13px] font-extrabold text-white shadow-[0_12px_26px_-10px_rgba(13,128,116,.55)] transition-transform active:scale-[.985]"
      >
        <Feather className="h-4 w-4" />
        نوشتنِ روایتِ بعدی
      </button>
    </div>
  );
}

/* ═══ استودیو ═══ */
export function SubmissionStudio() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  const [draft, setDraft] = useState<StudioDraft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [apiFields, setApiFields] = useState<StudioFieldErrors>({ attachmentUrl: {} });
  const [authOpen, setAuthOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const titleRef = useRef<HTMLInputElement>(null);
  /* تنظیماتِ آپلود از بک‌اند — با پیش‌فرضِ قرارداد شروع و در mount تازه می‌شود */
  const [uploadConfig, setUploadConfig] = useState<StudioUploadConfig>(STUDIO_UPLOAD_FALLBACK);

  /* ── بارگذاریِ پیش‌نویسِ پایدار + ذخیرهٔ پیوسته ── */
  useEffect(() => {
    const persisted = loadPersistedDraft();
    if (persisted) setDraft(persisted);
    setHydrated(true);
  }, []);

  /* ── واکشیِ تنظیماتِ واقعیِ آپلود (فرمت‌ها/سقف‌های env سرور) ── */
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
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* فضای ذخیره‌سازی — سکوت */
      }
    }, 350);
    return () => clearTimeout(t);
  }, [draft, hydrated]);

  const errors = useMemo(() => validateStudioDraft(draft), [draft]);
  const show = useCallback(
    (field: keyof Omit<StudioFieldErrors, 'attachmentUrl'>) =>
      attempted ? { ...errors, ...apiFields }[field] : undefined,
    [attempted, errors, apiFields],
  );
  const urlErrors = attempted
    ? { ...errors.attachmentUrl, ...apiFields.attachmentUrl }
    : errors.attachmentUrl;

  const patchDraft = (patch: Partial<StudioDraft>) => setDraft((d) => ({ ...d, ...patch }));

  /* قفلِ تک‌نوعیِ روایت — از ردیف‌های فعلی محاسبه می‌شود (آینه‌ی object-level بک‌اند) */
  const lockedType = useMemo(() => lockedMediaTypeOf(draft.attachments), [draft.attachments]);

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

  /* «تغییر نوعِ روایت» — شروعِ دوباره با پاک‌سازی همه‌ی پیوست‌ها */
  const resetAttachmentType = useCallback(() => {
    setDraft((d) => ({ ...d, attachments: [] }));
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
  const changeRow = useCallback((id: string, patch: Partial<AttachmentDraft>) => {
    setDraft((d) => ({
      ...d,
      attachments: d.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const submit = useCallback(async () => {
    setAttempted(true);
    setApiFields({ attachmentUrl: {} });
    setBanner(null);
    if (!isStudioSubmittable(draft)) {
      setBanner('چند مورد هنوز کامل نیست؛ خطاهای فرم را برطرف کن و دوباره بفرست.');
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiFetch<MySubmissionDetail>('/tabyin/me/submissions/', {
        method: 'POST',
        body: JSON.stringify(buildSubmissionPayload(draft)),
      });
      setSuccessId(created.external_id);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* سکوت */
      }
    } catch (err) {
      const { banner: b, fields } = mapApiErrors(err);
      setBanner(b);
      setApiFields(fields);
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setSubmitting(false);
    }
  }, [draft]);

  const resetForNew = useCallback(() => {
    setDraft(emptyDraft());
    setAttempted(false);
    setBanner(null);
    setApiFields({ attachmentUrl: {} });
    setSuccessId(null);
    setRefreshKey((k) => k + 1);
    titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ── پله‌های پیشرفت ── */
  const step1Done = Boolean(draft.title.trim()) && Boolean(draft.description.trim());
  const step2Done = draft.attachments.every((a) => a.url.trim());
  /* نامِ نمایشیِ پدیدآور — هم‌راستا با زنجیره‌ی بک‌اند: نام‌کامل ← ایمیل ← موبایل */
  const previewName =
    user?.full_name?.trim() || user?.primary_identifier?.trim() || 'حساب کاربری‌ات';
  const authorBadge = previewName;
  const pendingMeta = submissionStatusMeta('pending_review');

  /* ── گیتِ احراز ── */
  if (authLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="h-56 animate-pulse rounded-3xl bg-ink-100/80" />
        <div className="h-40 animate-pulse rounded-3xl bg-ink-100/60" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <>
        <LockedPanel onLogin={() => setAuthOpen(true)} />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  const validNow = isStudioSubmittable(draft);

  return (
    <div className="pb-24 lg:pb-0">
      {/* ═══ آکاردِ دو ستونه: فرم | پیش‌نمایش ═══ */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(330px,410px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        {/* ──────────────── ستونِ فرم ──────────────── */}
        <div className="space-y-5">
          {successId ? (
            <SuccessPanel externalId={successId} onReset={resetForNew} />
          ) : (
            <form
              noValidate
              aria-label="فرم ارسال روایت"
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              {/* کارتِ روایت */}
              <section className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] sm:p-6">
                {/* پیش‌قرم از سه پله */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink-100/80 pb-4">
                  <StepDot num={1} label="نوشتن" done={step1Done} active={!step1Done} />
                  <span aria-hidden="true" className="hidden h-px w-5 bg-ink-100 sm:block" />
                  <StepDot
                    num={2}
                    label="رسانه"
                    done={step2Done && draft.attachments.length > 0}
                    active={step1Done && !step2Done}
                  />
                  <span aria-hidden="true" className="hidden h-px w-5 bg-ink-100 sm:block" />
                  <StepDot
                    num={3}
                    label="ارسال برای بررسی"
                    done={false}
                    active={step1Done && step2Done}
                  />
                </div>

                {/* نویسنده — قراردادِ صادقِ بک‌اند: نام‌ونام‌خانوادگی ← ایمیل ← موبایل */}
                <div className="mt-4 rounded-2xl bg-ink-50/70 px-3.5 py-2.5 ring-1 ring-inset ring-ink-100">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11.5px] font-bold text-ink-500">
                      <UserRound className="h-4 w-4 text-ink-400" />
                      منتشر می‌شود به نامِ:
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-extrabold text-ink-800 ring-1 ring-inset ring-ink-100">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="max-w-40 truncate" dir="ltr">
                        {authorBadge}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10.5px] font-semibold leading-5 text-ink-400">
                    اولویت با نام‌ونام‌خانوادگی است؛ اگر خالی باشد ایمیل و بعد شماره‌ی موبایلت نمایش
                    داده می‌شود.{' '}
                    <Link
                      href="/profile"
                      className="font-extrabold text-brand-700 underline-offset-2 hover:underline"
                    >
                      تکمیل نام در پروفایل
                    </Link>{' '}
                    — با ذخیره، نامت در دیوار جهاد تبیین و روایت‌ها به‌روز می‌شود.
                  </p>
                </div>

                {/* عنوان */}
                <div className="mt-5">
                  <label
                    htmlFor="studio-title"
                    className="flex items-center justify-between text-[13px] font-black text-ink-900"
                  >
                    <span>
                      عنوانِ روایت{' '}
                      <span className="text-brand-600" aria-hidden="true">
                        *
                      </span>
                    </span>
                    <FieldCounter value={draft.title.trim().length} max={STUDIO_LIMITS.TITLE_MAX} />
                  </label>
                  <input
                    ref={titleRef}
                    id="studio-title"
                    type="text"
                    value={draft.title}
                    disabled={submitting}
                    onChange={(e) => patchDraft({ title: e.target.value })}
                    placeholder="یک عنوانِ کوتاه و گیرا — مثلاً «روایت صبحِ بارانیِ پایانه»"
                    maxLength={STUDIO_LIMITS.TITLE_MAX + 20}
                    aria-invalid={Boolean(show('title'))}
                    aria-describedby={show('title') ? 'studio-title-err' : undefined}
                    className="mt-2 h-12 w-full rounded-2xl border border-ink-200 bg-white px-4 text-[13.5px] font-bold text-ink-900 outline-none transition placeholder:font-semibold placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                  {show('title') ? (
                    <p
                      id="studio-title-err"
                      role="alert"
                      className="mt-1.5 text-[11.5px] font-bold text-rose-600"
                    >
                      {show('title')}
                    </p>
                  ) : null}
                </div>

                {/* شرح */}
                <div className="mt-5">
                  <label
                    htmlFor="studio-desc"
                    className="flex items-center justify-between text-[13px] font-black text-ink-900"
                  >
                    <span>
                      شرحِ روایت{' '}
                      <span className="text-brand-600" aria-hidden="true">
                        *
                      </span>
                    </span>
                    <span
                      className="text-[10.5px] font-bold tabular-nums text-ink-300"
                      aria-live="polite"
                    >
                      {formatPersianNumber(draft.description.trim().length)} نویسه
                    </span>
                  </label>
                  <textarea
                    id="studio-desc"
                    value={draft.description}
                    disabled={submitting}
                    onChange={(e) => patchDraft({ description: e.target.value })}
                    rows={6}
                    placeholder="همه‌چیز را بنویس: کجا بودی، چه اتفاقی افتاد، چه چیزی دیدی. نامِ شهر را هم داخل متن بیاور تا روایتت در جست‌وجو بهتر پیدا شود."
                    aria-invalid={Boolean(show('description'))}
                    aria-describedby={show('description') ? 'studio-desc-err' : undefined}
                    className="mt-2 w-full resize-y rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-[13px] font-semibold leading-7 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                  {show('description') ? (
                    <p
                      id="studio-desc-err"
                      role="alert"
                      className="mt-1.5 text-[11.5px] font-bold text-rose-600"
                    >
                      {show('description')}
                    </p>
                  ) : null}
                </div>
              </section>

              {/* پیوست‌ها — نشانی یا بارگذاری، با قفلِ تک‌نوعی */}
              <AttachmentEditor
                rows={draft.attachments}
                urlErrors={urlErrors}
                listError={attempted ? (errors.attachments ?? apiFields.attachments) : undefined}
                disabled={submitting}
                lockedType={lockedType}
                uploadConfig={uploadConfig}
                onAdd={addRow}
                onRemove={removeRow}
                onMove={moveRow}
                onChange={changeRow}
                onResetType={resetAttachmentType}
              />

              {/* راهنما + قوانین — دو کارتِ فشرده */}
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-mint-400/30 bg-mint-50/50 p-5">
                  <h3 className="flex items-center gap-1.5 text-[12.5px] font-black text-mint-600">
                    <Lightbulb className="h-4 w-4" />
                    دو راه برای رسانه ✨
                  </h3>
                  <ol className="mt-2 space-y-1.5 text-[11.5px] font-semibold leading-6 text-ink-600">
                    <li>۱. «بارگذاری» را بزن و فایل را مستقیم از گوشی‌ات روی سرورِ بعثت بفرست.</li>
                    <li>۲. یا نشانیِ عمومیِ فایل را بچسبان؛ ما روی سرورِ خودمان نگهش می‌داریم.</li>
                    <li>۳. هر روایت تک‌نوع است: همه عکس، همه ویدئو، همه صوت یا همه سند.</li>
                  </ol>
                </div>
                <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
                  <h3 className="flex items-center gap-1.5 text-[12.5px] font-black text-ink-900">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    مسیرِ انتشار — شفاف و قانونمند
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-[11.5px] font-semibold leading-6 text-ink-600">
                    <li className="flex items-start gap-1.5">
                      <Clock3 className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      هر روایت اول به صفِ بررسی می‌رود ({pendingMeta.label}).
                    </li>
                    <li className="flex items-start gap-1.5">
                      <BadgeCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      پس از تأییدِ مدیر، در فید و دیوارِ تبیین منتشر می‌شود.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Info className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-400" />
                      حداکثر {toPersianDigits(STUDIO_LIMITS.ATTACHMENTS_MAX)} پیوست برای هر روایت
                      (قانونِ سرور).
                    </li>
                  </ul>
                </div>
              </section>

              {/* خطای کلی */}
              {banner ? (
                <p
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] font-bold leading-6 text-rose-700"
                >
                  {banner}
                </p>
              ) : null}

              {/* اکشنِ دسکتاپ */}
              <div className="hidden items-center gap-3 lg:flex">
                <button
                  type="submit"
                  disabled={submitting}
                  aria-describedby="studio-submit-hint"
                  className={cn(
                    'inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[14px] font-extrabold text-white transition-all active:scale-[.99]',
                    'bg-gradient-to-l from-brand-500 to-brand-700 shadow-[0_16px_32px_-12px_rgba(13,128,116,.6)] hover:shadow-[0_18px_38px_-10px_rgba(13,128,116,.65)]',
                    submitting && 'opacity-80',
                  )}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? 'در حال ارسال به صفِ بررسی…' : 'ثبت و ارسال روایت برای بررسی'}
                </button>
              </div>
              <p
                id="studio-submit-hint"
                className={cn(
                  'hidden text-center text-[11px] font-semibold lg:block',
                  validNow ? 'text-emerald-600' : 'text-ink-400',
                )}
              >
                {validNow
                  ? 'همه‌چیز آماده است؛ بعد از ارسال، وضعیت را در «روایت‌های من» می‌بینی.'
                  : askedHint(errors)}
              </p>
            </form>
          )}

          {/* روایت‌های من — زیرِ فرم در هر دو وضعیت */}
          <MySubmissions refreshKey={refreshKey} />
        </div>

        {/* ──────────────── ستونِ پیش‌نمایش — استیکی در دسکتاپ ──────────────── */}
        <aside className="lg:sticky lg:top-24" aria-label="پیش‌نمایش روایت در فید">
          <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_2px_10px_-2px_rgba(16,24,40,.07)]">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              aria-expanded={showPreview}
              className="flex w-full items-center justify-between gap-2 border-b border-ink-100/80 bg-gradient-to-l from-brand-50/70 via-white to-mint-50/50 px-5 py-3.5 text-right"
            >
              <span className="flex items-center gap-2 text-[13px] font-black text-ink-900">
                <Eye className="h-4 w-4 text-brand-600" />
                پیش‌نمایشِ زنده در فید
                <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[9.5px] font-extrabold text-mint-600 ring-1 ring-inset ring-mint-400/40">
                  <Sparkles className="h-2.5 w-2.5" />
                  زنده
                </span>
              </span>
              <span className="text-[10.5px] font-extrabold text-ink-400">
                {showPreview ? 'جمع کردن' : 'باز کردن'}
              </span>
            </button>
            {showPreview ? (
              <div className="bg-ink-50/60 p-3.5 sm:p-4">
                {/* آنچه می‌نویسی همان است که منتشر می‌شود — کارتِ واقعیِ فید */}
                <div className="pointer-events-none select-none" aria-hidden="true">
                  <RevayatCard item={previewItemFromDraft(draft, previewName)} />
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-[10.5px] font-semibold leading-5 text-ink-400">
                  <PenLine className="mt-0.5 h-3 w-3 shrink-0 text-brand-500" />
                  دقیقاً همان کارتی که — بعد از تأیید مدیر — همه در فیدِ روایت‌ها می‌بینند. اگر
                  رسانه‌ای در پیش‌نمایش بارگذاری نشد، نشانی‌اش را بازبینی کن.
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {/* ═══ نوارِ اقدامِ چسبان — فقط موبایل ═══ */}
      {!successId ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100/90 bg-white/90 backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto flex max-w-xl items-center gap-2.5 px-4 py-3">
            <div
              className="hidden min-w-0 flex-1 flex-col gap-0.5 min-[380px]:flex"
              aria-hidden="true"
            >
              <span
                className={cn(
                  'text-[10px] font-extrabold',
                  step1Done ? 'text-emerald-600' : 'text-ink-400',
                )}
              >
                {step1Done ? '✓ متن آماده' : 'عنوان و شرح لازم است'}
              </span>
              <span className="text-[10px] font-bold tabular-nums text-ink-400">
                {toPersianDigits(draft.attachments.length)} از{' '}
                {toPersianDigits(STUDIO_LIMITS.ATTACHMENTS_MAX)} پیوست
              </span>
            </div>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-500 to-brand-700 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-8px_rgba(13,128,116,.6)] transition-transform active:scale-[.985] min-[380px]:flex-none min-[380px]:px-6"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'در حال ارسال…' : 'ارسال برای بررسی'}
            </button>
          </div>
        </div>
      ) : null}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

/** جمله‌ی راهنما وقتی هنوز چیزی ناقص است (ترتیبِ اولویت = قلبِ روایت) */
function askedHint(e: StudioFieldErrors): string {
  if (e.title) return 'برای ارسال، اول عنوانِ روایت را بنویس.';
  if (e.description) return 'شرحِ روایت هنوز خالی است.';
  if (e.attachments) return e.attachments;
  if (Object.keys(e.attachmentUrl).length > 0)
    return 'چند نشانیِ پیوست هنوز معتبر نیست — بالا اصلاحشان کن.';
  return '';
}
