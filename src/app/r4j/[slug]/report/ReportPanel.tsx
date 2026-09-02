'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  EyeOff,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Filter,
  Fingerprint,
  Lock,
  Paperclip,
  Phone,
  Plus,
  Share2,
  ShieldCheck,
  StickyNote,
  Trash2,
  Undo2,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { isApiError } from '@/lib/api';
import {
  REPORTABLE_FIELD_OPTIONS,
  REPORT_ATTACHMENT_ACCEPT,
  REPORT_ATTACHMENT_ACCEPT_FA,
  REPORT_ATTACHMENT_MAX_BYTES,
  REPORT_ATTACHMENT_MAX_COUNT,
  SOCIAL_PLATFORM_META,
  buildReportFormData,
  cancelMyReport,
  fetchMyReports,
  isReportSubmittable,
  jalaliDateFa,
  pruneReportDraft,
  reportStatusMeta,
  submitCriminalReport,
  type MyReportSummary,
  type ReportDraftInput,
} from '@/lib/r4j';
import { AuthModal } from '@/components/auth/AuthModal';
import { cn, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * ReportPanel v2 — تجربه‌ی کاملِ «گزارش اطلاعات و سرنخ»
 *
 * آینه‌ی کاملِ R4JReportSubmitSerializer (بدون تغییر در قرارداد):
 *   notes + field_changes[] + alias_suggestions[] + phone_suggestions[]
 *   + social_suggestions[] + attachments[] (multipart) —
 *   با همان قانونِ «حداقل یک مسیرِ اطلاع‌رسانی» و سقف‌های فایلِ بک‌اند.
 *
 * معماریِ بصری:
 *   ستونِ اصلی → ۶ مسیرِ گام‌به‌گام + ارسال + گزارش‌های پیشین.
 *   ستونِ کناری (چسبان) → چک‌لیستِ زنده‌ی مسیرها + چرخه‌ی بررسی +
 *   کارتِ محرمانگی.
 * ═══════════════════════════════════════════════════════════════════
 */

type FieldRow = { id: number; field_name: string; suggested_value: string };
type AliasRow = { id: number; alias: string };
type PhoneRow = { id: number; label: string; number: string };
type SocialRow = { id: number; platform: string; handle_or_url: string };

const inputCls =
  'w-full rounded-2xl border border-ink-200 bg-ink-50/50 px-3.5 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20';

const chipAddCls =
  'flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink-200 py-3 text-[12px] font-extrabold text-ink-500 transition-all duration-200 hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-600';

function RowShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-ink-50/40 p-2.5 sm:flex-row sm:items-center sm:bg-transparent sm:p-0">
      {children}
    </div>
  );
}

function TrashBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 items-center justify-center rounded-xl border border-ink-200 bg-white px-3 text-ink-400 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:w-10 sm:flex-none sm:px-0"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      <span className="ms-1.5 text-[11px] font-extrabold sm:hidden">حذف</span>
    </button>
  );
}

function StepSection({
  step,
  icon: Icon,
  title,
  hint,
  filled,
  children,
}: {
  step: number;
  icon: typeof FileText;
  title: string;
  hint?: string;
  /** هر زمان این مسیر محتوا داشته باشد (با pruneReportDraft محاسبه می‌شود) */
  filled: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04),0_18px_38px_-30px_rgba(15,20,32,.22)] transition-shadow duration-300 focus-within:shadow-[0_1px_2px_rgba(15,20,32,.04),0_22px_44px_-30px_rgba(13,128,116,.35)] md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300',
              filled ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-2 text-[14.5px] font-black text-ink-900">
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900/[.05] px-1.5 text-[10.5px] font-black tabular-nums text-ink-400">
                {toPersianDigits(step)}
              </span>
              {title}
              {filled && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  تکمیل شد
                </span>
              )}
            </h2>
            {hint && <p className="mt-1.5 text-[11.5px] leading-6 text-ink-400">{hint}</p>}
          </div>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function fileIconFor(name: string) {
  const ext = (name.split('.').pop() ?? '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return FileImage;
  if (ext === 'mp4') return FileVideo;
  if (ext === 'mp3') return FileAudio;
  return FileText;
}

export function ReportPanel({
  criminalId,
  slug,
  name,
}: {
  criminalId: number;
  slug: string;
  name: string;
}) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [notes, setNotes] = useState('');
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [aliases, setAliases] = useState<AliasRow[]>([]);
  const [phones, setPhones] = useState<PhoneRow[]>([]);
  const [socials, setSocials] = useState<SocialRow[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const [myReports, setMyReports] = useState<MyReportSummary[] | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const idRef = useRef(1);
  const nextId = () => idRef.current++;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // گزارش‌های پیشینِ کاربر برای این پرونده
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    fetchMyReports()
      .then((res) => {
        if (!alive) return;
        setMyReports(res.results.filter((r) => r.criminal_id === criminalId));
      })
      .catch(() => {
        if (alive) setMyReports([]);
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, criminalId, succeeded]);

  const draft: ReportDraftInput = {
    notes,
    field_changes: fields.map((f) => ({
      field_name: f.field_name,
      suggested_value: f.suggested_value,
    })),
    alias_suggestions: aliases.map((a) => ({ alias: a.alias })),
    phone_suggestions: phones.map((p) => ({ label: p.label, number: p.number })),
    social_suggestions: socials.map((s) => ({
      platform: s.platform,
      handle_or_url: s.handle_or_url,
    })),
    attachments: files,
  };
  const submittable = isReportSubmittable(draft);

  // چک‌لیستِ زنده‌ی مسیرها (برای ستونِ کناری + نشانِ «تکمیل شد» روی سکشن‌ها)
  const pruned = pruneReportDraft(draft);
  const pathFilled = {
    notes: Boolean(pruned.notes),
    fields: pruned.field_changes.length > 0,
    aliases: pruned.alias_suggestions.length > 0,
    phones: pruned.phone_suggestions.length > 0,
    socials: pruned.social_suggestions.length > 0,
  };
  const filledCount = Object.values(pathFilled).filter(Boolean).length;

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    setFileError(null);
    const incoming = Array.from(list);
    const merged = [...files, ...incoming];
    if (merged.length > REPORT_ATTACHMENT_MAX_COUNT) {
      setFileError(
        `حداکثر ${toPersianDigits(REPORT_ATTACHMENT_MAX_COUNT)} فایل می‌توانید ضمیمه کنید.`,
      );
      return;
    }
    const tooBig = merged.find((f) => f.size > REPORT_ATTACHMENT_MAX_BYTES);
    if (tooBig) {
      setFileError(`حجم «${tooBig.name}» بیش از ۲۰ مگابایت است.`);
      return;
    }
    setFiles(merged);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!submittable || submitting) return;
    setSubmitting(true);
    try {
      await submitCriminalReport(criminalId, buildReportFormData(draft));
      setSucceeded(true);
      // پاک‌سازی فرم پس از موفقیت
      setNotes('');
      setFields([]);
      setAliases([]);
      setPhones([]);
      setSocials([]);
      setFiles([]);
    } catch (err) {
      setApiError(
        isApiError(err) && err.message
          ? err.message
          : 'ثبت گزارش انجام نشد؛ اتصال را بررسی و دوباره تلاش کنید.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelReport(reportId: number) {
    if (cancelingId) return;
    setCancelingId(reportId);
    try {
      const updated = await cancelMyReport(reportId);
      setMyReports(
        (prev) =>
          prev?.map((r) => (r.id === reportId ? { ...r, status: updated.status } : r)) ?? null,
      );
    } catch {
      // وضعیت با فچ بعدی هم‌راستا می‌شود
    } finally {
      setCancelingId(null);
    }
  }

  // ── مهمان ────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-ink-100 bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,20,32,.04),0_24px_48px_-32px_rgba(15,20,32,.3)] md:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl"
        />
        <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-brand-500/15 to-mint-500/15 text-brand-600 ring-1 ring-brand-500/25">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="relative mt-5 text-lg font-black text-ink-900 md:text-xl">
          برای ارسال گزارش وارد شوید
        </h2>
        <p className="relative mx-auto mt-2.5 max-w-md text-[13px] leading-7 text-ink-500">
          برای حفظِ اعتبارِ گزارش‌ها و امکانِ پیگیری، ارسال سرنخ فقط برای کاربرانِ واردشده
          امکان‌پذیر است. هویتِ شما نزد سردبیر محفوظ می‌ماند.
        </p>
        <ul className="relative mx-auto mt-5 grid max-w-md grid-cols-1 gap-2 text-center sm:grid-cols-3">
          {['۵ مسیرِ اطلاع‌رسانی', 'ضمیمه تا ۵ سند', 'بررسی پیش از انتشار'].map((t) => (
            <li
              key={t}
              className="rounded-2xl bg-ink-50 px-3 py-2.5 text-[11px] font-extrabold text-ink-500"
            >
              {t}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="relative mt-7 rounded-2xl bg-brand-600 px-10 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-[.98]"
        >
          ورود / ثبت‌نام
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </section>
    );
  }

  if (authLoading) {
    return (
      <div aria-busy="true" className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-8">
          {[170, 220, 200].map((h) => (
            <div
              key={h}
              className="animate-pulse rounded-[26px] border border-ink-100 bg-white shadow-sm"
              style={{ height: h }}
            />
          ))}
        </div>
        <div className="hidden flex-col gap-5 lg:col-span-4 lg:flex">
          {[240, 260].map((h) => (
            <div
              key={h}
              className="animate-pulse rounded-[26px] border border-ink-100 bg-white shadow-sm"
              style={{ height: h }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ═════════ ستونِ اصلی ═════════ */}
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        {succeeded && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 shadow-[0_14px_30px_-24px_rgba(22,160,107,.6)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <BadgeCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[15px] font-black text-emerald-800">گزارش شما ثبت شد</h2>
              <p className="mt-1 text-[12.5px] leading-7 text-emerald-700">
                گزارش در صفِ بررسی سردبیر قرار گرفت و تا تأیید، هیچ تغییری روی پرونده اعمال نمی‌شود.
                وضعیتِ آن را در فهرستِ «گزارش‌های پیشینِ شما» در همین صفحه می‌بینید.
              </p>
            </div>
          </div>
        )}

        {apiError && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] font-bold text-rose-700"
          >
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {apiError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ۱) یادداشت آزاد */}
          <StepSection
            step={1}
            icon={StickyNote}
            title="شرح سرنخ / یادداشت"
            hint="هر آنچه می‌دانید — آخرین محل دیدار، رفتار، ارتباط‌ها — با جزئیات بنویسید."
            filled={pathFilled.notes}
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="گزارش خود را این‌جا بنویسید…"
              className={cn(inputCls, 'leading-7')}
            />
          </StepSection>

          {/* ۲) اصلاح مشخصات */}
          <StepSection
            step={2}
            icon={Fingerprint}
            title="پیشنهادِ اصلاحِ مشخصات"
            hint="اگر یکی از فیلدهای پرونده نادرست یا ناقص است، مقدارِ صحیح را پیشنهاد دهید."
            filled={pathFilled.fields}
          >
            <div className="flex flex-col gap-2.5">
              {fields.map((row) => {
                const opt = REPORTABLE_FIELD_OPTIONS.find((o) => o.value === row.field_name);
                return (
                  <RowShell key={row.id}>
                    <select
                      value={row.field_name}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, field_name: e.target.value } : r,
                          ),
                        )
                      }
                      className={cn(inputCls, 'sm:w-44 sm:flex-none')}
                      aria-label="فیلد"
                    >
                      {REPORTABLE_FIELD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      dir={opt?.dir ?? 'auto'}
                      value={row.suggested_value}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, suggested_value: e.target.value } : r,
                          ),
                        )
                      }
                      placeholder={opt?.placeholder ?? 'مقدارِ پیشنهادی…'}
                      className={cn(inputCls, 'flex-1')}
                      aria-label={`مقدار پیشنهادی ${opt?.label ?? ''}`}
                    />
                    <TrashBtn
                      onClick={() => setFields((prev) => prev.filter((r) => r.id !== row.id))}
                      label="حذف این پیشنهاد"
                    />
                  </RowShell>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setFields((prev) => [
                    ...prev,
                    { id: nextId(), field_name: 'city', suggested_value: '' },
                  ])
                }
                className={chipAddCls}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                افزودن پیشنهادِ اصلاحِ فیلد
              </button>
            </div>
          </StepSection>

          {/* ۳) نام‌های مستعار */}
          <StepSection
            step={3}
            icon={UserRound}
            title="نام‌های مستعار"
            hint="نام‌های دیگری که این فرد با آن شناخته می‌شود."
            filled={pathFilled.aliases}
          >
            <div className="flex flex-col gap-2.5">
              {aliases.map((row) => (
                <RowShell key={row.id}>
                  <input
                    type="text"
                    dir="auto"
                    value={row.alias}
                    onChange={(e) =>
                      setAliases((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, alias: e.target.value } : r)),
                      )
                    }
                    placeholder="نام مستعار…"
                    className={cn(inputCls, 'flex-1')}
                    aria-label="نام مستعار"
                  />
                  <TrashBtn
                    onClick={() => setAliases((prev) => prev.filter((r) => r.id !== row.id))}
                    label="حذف نام مستعار"
                  />
                </RowShell>
              ))}
              <button
                type="button"
                onClick={() => setAliases((prev) => [...prev, { id: nextId(), alias: '' }])}
                className={chipAddCls}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                افزودن نام مستعار
              </button>
            </div>
          </StepSection>

          {/* ۴) شماره‌های تماس */}
          <StepSection
            step={4}
            icon={Phone}
            title="شماره‌های تماس"
            hint="شماره‌های مرتبط با فردِ پرونده (همراه، خط ثابت، واسطه‌ها…)."
            filled={pathFilled.phones}
          >
            <div className="flex flex-col gap-2.5">
              {phones.map((row) => (
                <RowShell key={row.id}>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) =>
                      setPhones((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)),
                      )
                    }
                    placeholder="برچسب (مثلاً همراه شخصی)"
                    className={cn(inputCls, 'sm:w-44 sm:flex-none')}
                    aria-label="برچسب شماره"
                  />
                  <input
                    type="tel"
                    dir="ltr"
                    value={row.number}
                    onChange={(e) =>
                      setPhones((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, number: e.target.value } : r)),
                      )
                    }
                    placeholder="+98 912 000 0000"
                    className={cn(inputCls, 'flex-1 font-mono')}
                    aria-label="شماره تماس"
                  />
                  <TrashBtn
                    onClick={() => setPhones((prev) => prev.filter((r) => r.id !== row.id))}
                    label="حذف شماره"
                  />
                </RowShell>
              ))}
              <button
                type="button"
                onClick={() =>
                  setPhones((prev) => [...prev, { id: nextId(), label: '', number: '' }])
                }
                className={chipAddCls}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                افزودن شماره تماس
              </button>
            </div>
          </StepSection>

          {/* ۵) شبکه‌های اجتماعی */}
          <StepSection
            step={5}
            icon={Share2}
            title="حساب‌های اجتماعی"
            hint="هندل یا نشانیِ حساب‌های منتسب به فردِ پرونده."
            filled={pathFilled.socials}
          >
            <div className="flex flex-col gap-2.5">
              {socials.map((row) => (
                <RowShell key={row.id}>
                  <select
                    value={row.platform}
                    onChange={(e) =>
                      setSocials((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, platform: e.target.value } : r)),
                      )
                    }
                    className={cn(inputCls, 'sm:w-40 sm:flex-none')}
                    aria-label="پلتفرم"
                  >
                    {Object.entries(SOCIAL_PLATFORM_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    dir="ltr"
                    value={row.handle_or_url}
                    onChange={(e) =>
                      setSocials((prev) =>
                        prev.map((r) =>
                          r.id === row.id ? { ...r, handle_or_url: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="@handle یا نشانیِ کامل"
                    className={cn(inputCls, 'flex-1 font-mono')}
                    aria-label="هندل یا نشانی"
                  />
                  <TrashBtn
                    onClick={() => setSocials((prev) => prev.filter((r) => r.id !== row.id))}
                    label="حذف حساب"
                  />
                </RowShell>
              ))}
              <button
                type="button"
                onClick={() =>
                  setSocials((prev) => [
                    ...prev,
                    { id: nextId(), platform: 'telegram', handle_or_url: '' },
                  ])
                }
                className={chipAddCls}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                افزودن حساب اجتماعی
              </button>
            </div>
          </StepSection>

          {/* ۶) ضمائم — دراپ‌زون */}
          <StepSection
            step={6}
            icon={Paperclip}
            title="اسناد و مدارک (اختیاری)"
            hint={`فرمت‌های مجاز: ${REPORT_ATTACHMENT_ACCEPT_FA} — حداکثر حجمِ هر فایل ۲۰ مگابایت.`}
            filled={files.length > 0}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={REPORT_ATTACHMENT_ACCEPT}
              onChange={(e) => addFiles(e.target.files)}
              className="sr-only"
              aria-label="انتخاب فایل‌های ضمیمه"
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed px-4 py-8 text-center transition-all duration-200',
                dragging
                  ? 'scale-[1.01] border-brand-500 bg-brand-50/70 shadow-[0_16px_30px_-20px_rgba(13,128,116,.5)]'
                  : 'border-ink-200 bg-ink-50/50',
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
                  dragging ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600',
                )}
              >
                <UploadCloud className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[12.5px] font-black text-ink-700">
                  فایل‌ها را این‌جا رها کنید یا انتخاب کنید
                </p>
                <p className="mt-1 text-[11px] font-bold text-ink-400">
                  حداکثر {toPersianDigits(REPORT_ATTACHMENT_MAX_COUNT)} فایل · هر کدام تا ۲۰ مگابایت
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl bg-brand-600 px-5 py-2.5 text-[12px] font-extrabold text-white shadow-md shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-[.98]"
              >
                انتخاب فایل
              </button>
            </div>
            {fileError && (
              <p role="alert" className="mt-2 text-[12px] font-bold text-rose-600">
                {fileError}
              </p>
            )}
            {files.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {files.map((f, i) => {
                  const FIcon = fileIconFor(f.name);
                  return (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-2.5"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <FIcon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                        <span
                          className="min-w-0 truncate text-[12px] font-bold text-ink-700"
                          dir="ltr"
                        >
                          {f.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="text-[11px] font-bold tabular-nums text-ink-400">
                          {toPersianDigits((f.size / (1024 * 1024)).toFixed(1))} مگابایت
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                          aria-label={`حذف ${f.name}`}
                          className="text-ink-400 transition-colors hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </StepSection>

          {/* ارسال */}
          <section className="overflow-hidden rounded-[26px] border border-ink-100 bg-gradient-to-b from-white to-brand-50/40 p-5 shadow-[0_1px_2px_rgba(15,20,32,.04)] md:p-6">
            <button
              type="submit"
              disabled={!submittable || submitting}
              className="w-full rounded-[22px] bg-gradient-to-b from-brand-500 to-brand-700 py-4 text-[15px] font-black text-white shadow-[0_16px_32px_-12px_rgba(13,128,116,.55)] transition-all hover:from-brand-400 hover:to-brand-600 active:scale-[.99] disabled:cursor-not-allowed disabled:from-ink-300 disabled:to-ink-300 disabled:opacity-70 disabled:shadow-none"
            >
              {submitting ? 'در حال ارسال گزارش…' : 'ثبت گزارش'}
            </button>
            {!submittable && (
              <p className="mt-3 text-center text-[11.5px] font-bold leading-6 text-ink-400">
                برای ارسال، حداقل یکی از موارد — یادداشت، اصلاح فیلد، نام مستعار، شماره تماس یا حساب
                اجتماعی — لازم است.
              </p>
            )}
            <p className="mt-3 text-center text-[11px] leading-6 text-ink-400">
              گزارش‌ها محرمانه‌اند؛ تا تأیید سردبیر هیچ تغییری روی پرونده اعمال نمی‌شود.
            </p>
          </section>
        </form>

        {/* گزارش‌های پیشینِ من */}
        {myReports && myReports.length > 0 && (
          <section className="rounded-[26px] border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04)] md:p-6">
            <h2 className="flex items-center gap-2.5 text-[14.5px] font-black text-ink-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
                <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              گزارش‌های پیشینِ شما برای این پرونده
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {myReports.map((r) => {
                const meta = reportStatusMeta(r.status);
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-ink-50/50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-extrabold text-ink-700">
                        گزارشِ شمارهٔ {toPersianDigits(r.id)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-ink-400">
                        {jalaliDateFa(r.created_at) ?? ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-extrabold',
                          meta.badge,
                        )}
                      >
                        {meta.label}
                      </span>
                      {r.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleCancelReport(r.id)}
                          disabled={cancelingId === r.id}
                          className="flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-ink-500 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {cancelingId === r.id ? '…' : 'درخواست لغو'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="text-center">
          <Link
            href={`/r4j/${encodeURIComponent(slug)}`}
            className="text-[12.5px] font-extrabold text-brand-600 transition-colors hover:text-brand-700"
          >
            بازگشت به پروندهٔ {name}
          </Link>
        </div>
      </div>

      {/* ═════════ ستونِ کناری — چسبان در دسکتاپ ═════════ */}
      <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4">
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          {/* چک‌لیستِ زنده‌ی مسیرها */}
          <section className="rounded-[26px] border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04),0_18px_38px_-30px_rgba(15,20,32,.22)] md:p-6">
            <h2 className="flex items-center gap-2.5 text-[14.5px] font-black text-ink-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                <Filter className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              وضعیتِ گزارشِ شما
            </h2>
            <div
              className={cn(
                'mt-3 flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-[11.5px] font-black',
                submittable
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-amber-500/10 text-amber-700',
              )}
            >
              <span>
                {submittable
                  ? 'گزارشِ شما آماده‌ی ارسال است'
                  : 'حداقل یک مسیرِ اطلاع‌رسانی لازم است'}
              </span>
              <span className="tabular-nums">
                {toPersianDigits(filledCount)} از {toPersianDigits(5)}
              </span>
            </div>
            {/* نوارِ پیشرفت */}
            <div
              aria-hidden="true"
              className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-ink-100"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  submittable ? 'bg-emerald-500' : 'bg-amber-400',
                )}
                style={{ width: `${(filledCount / 5) * 100}%` }}
              />
            </div>
            <ul className="mt-3.5 flex flex-col gap-1.5">
              {[
                { key: 'notes', label: 'شرح سرنخ / یادداشت', done: pathFilled.notes },
                { key: 'fields', label: 'اصلاحِ مشخصات', done: pathFilled.fields },
                { key: 'aliases', label: 'نام مستعار', done: pathFilled.aliases },
                { key: 'phones', label: 'شماره تماس', done: pathFilled.phones },
                { key: 'socials', label: 'حساب اجتماعی', done: pathFilled.socials },
                { key: 'attachments', label: 'سندِ ضمیمه (اختیاری)', done: files.length > 0 },
              ].map((p) => (
                <li
                  key={p.key}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11.5px] font-bold transition-colors duration-300',
                    p.done ? 'bg-brand-500/[.07] text-brand-700' : 'text-ink-400',
                  )}
                >
                  <span>{p.label}</span>
                  {p.done ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-emerald-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-ink-200"
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* چرخه‌ی بررسی */}
          <section className="rounded-[26px] border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04),0_18px_38px_-30px_rgba(15,20,32,.22)] md:p-6">
            <h2 className="flex items-center gap-2.5 text-[14.5px] font-black text-ink-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              بعد از ارسال چه می‌شود؟
            </h2>
            <ol className="mt-4 flex flex-col gap-3">
              {[
                {
                  t: 'ثبت در صفِ سردبیر',
                  b: 'گزارشِ شما بلافاصله وارد صفِ بررسی تحریریه می‌شود.',
                },
                {
                  t: 'راستی‌آزمایی',
                  b: 'هر مورد — نام، شماره، هندل، سند — جداگانه ارزیابی می‌شود.',
                },
                {
                  t: 'اعمال روی پرونده',
                  b: 'تاییدشده‌ها روی پرونده اعمال و در وضعیتِ گزارشِ شما منعکس می‌شود.',
                },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-black tabular-nums text-brand-600">
                    {toPersianDigits(i + 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-ink-800">{s.t}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-ink-400">{s.b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* محرمانگی */}
          <section className="rounded-[26px] bg-ink-900 p-5 text-white shadow-[0_24px_48px_-28px_rgba(15,20,32,.8)] md:p-6">
            <h2 className="flex items-center gap-2.5 text-[14px] font-black text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-mint-400">
                <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              محرمانگیِ گزارشِ شما
            </h2>
            <ul className="mt-4 space-y-2.5 text-[11.5px] leading-6 text-white/70">
              <li>• گزارش‌ها در سایت نمایش داده نمی‌شوند؛ فقط در حسابِ خودِ شما دیده می‌شوند.</li>
              <li>• تا زمانِ تأیید سردبیر، هیچ تغییری روی پرونده اعمال نمی‌شود.</li>
              <li>• گزارشِ pending را هر زمان می‌توانید با «درخواست لغو» پس بگیرید.</li>
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
