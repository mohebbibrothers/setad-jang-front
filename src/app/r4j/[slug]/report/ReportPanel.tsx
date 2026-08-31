'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CircleAlert,
  FileText,
  Fingerprint,
  Lock,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Share2,
  StickyNote,
  Trash2,
  Undo2,
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
  reportStatusMeta,
  submitCriminalReport,
  type MyReportSummary,
  type ReportDraftInput,
} from '@/lib/r4j';
import { AuthModal } from '@/components/auth/AuthModal';
import { cn, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * ReportPanel — جزیره‌ی کلاینتِ «گزارش اطلاعات»
 *
 * آینه‌ی کاملِ R4JReportSubmitSerializer:
 *   notes + field_changes[] + alias_suggestions[] + phone_suggestions[]
 *   + social_suggestions[] + attachments[] (multipart) —
 *   با همان قانونِ «حداقل یک مسیرِ اطلاع‌رسانی» و سقف‌های فایلِ بک‌اند.
 * پایینِ فرم، «گزارش‌های پیشینِ من» برای همین پرونده با قابلیتِ لغوِ
 * pending ( POST me/reports/<id>/cancel/ ) می‌آید.
 * ═══════════════════════════════════════════════════════════════════
 */

type FieldRow = { id: number; field_name: string; suggested_value: string };
type AliasRow = { id: number; alias: string };
type PhoneRow = { id: number; label: string; number: string };
type SocialRow = { id: number; platform: string; handle_or_url: string };

const inputCls =
  'w-full rounded-2xl border border-ink-200 bg-ink-50/50 px-3.5 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20';

function SectionShell({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof FileText;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[14px] font-black text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            {title}
          </h2>
          {hint && <p className="mt-1.5 text-[11.5px] leading-6 text-ink-400">{hint}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
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

  function addFiles(list: FileList | null) {
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
      <section className="rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-sm md:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-black text-ink-900">برای ارسال گزارش وارد شوید</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-7 text-ink-500">
          برای حفظِ اعتبارِ گزارش‌ها و امکانِ پیگیری، ارسال سرنخ فقط برای کاربرانِ واردشده
          امکان‌پذیر است. هویتِ شما نزد سردبیر محفوظ می‌ماند.
        </p>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="mt-6 rounded-2xl bg-brand-600 px-8 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-[.98]"
        >
          ورود / ثبت‌نام
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </section>
    );
  }

  if (authLoading) {
    return (
      <section
        aria-busy="true"
        className="flex items-center justify-center gap-3 rounded-3xl border border-ink-100 bg-white p-12 text-[13px] font-bold text-ink-400 shadow-sm"
      >
        <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
        در حال آماده‌سازی فرمِ گزارش…
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {succeeded && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5"
        >
          <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
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
        {/* یادداشت آزاد */}
        <SectionShell
          icon={StickyNote}
          title="شرح سرنخ / یادداشت"
          hint="هر آنچه می‌دانید — آخرین محل دیدار، رفتار، ارتباط‌ها — با جزئیات بنویسید."
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="گزارش خود را این‌جا بنویسید…"
            className={cn(inputCls, 'leading-7')}
          />
        </SectionShell>

        {/* اصلاح مشخصات */}
        <SectionShell
          icon={Fingerprint}
          title="پیشنهادِ اصلاحِ مشخصات"
          hint="اگر یکی از فیلدهای پرونده نادرست یا ناقص است، مقدارِ صحیح را پیشنهاد دهید."
        >
          <div className="flex flex-col gap-2.5">
            {fields.map((row) => {
              const opt = REPORTABLE_FIELD_OPTIONS.find((o) => o.value === row.field_name);
              return (
                <div key={row.id} className="flex flex-col gap-2 sm:flex-row">
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
                  <button
                    type="button"
                    onClick={() => setFields((prev) => prev.filter((r) => r.id !== row.id))}
                    aria-label="حذف این پیشنهاد"
                    className="flex items-center justify-center rounded-2xl border border-ink-200 px-3 text-ink-400 transition-colors hover:border-rose-300 hover:text-rose-600 sm:w-11 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
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
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-300 py-2.5 text-[12px] font-extrabold text-ink-500 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              افزودن پیشنهادِ اصلاحِ فیلد
            </button>
          </div>
        </SectionShell>

        {/* نام‌های مستعار */}
        <SectionShell
          icon={UserRound}
          title="نام‌های مستعار"
          hint="نام‌های دیگری که این فرد با آن شناخته می‌شود."
        >
          <div className="flex flex-col gap-2.5">
            {aliases.map((row) => (
              <div key={row.id} className="flex gap-2">
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
                <button
                  type="button"
                  onClick={() => setAliases((prev) => prev.filter((r) => r.id !== row.id))}
                  aria-label="حذف نام مستعار"
                  className="flex w-11 flex-none items-center justify-center rounded-2xl border border-ink-200 text-ink-400 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAliases((prev) => [...prev, { id: nextId(), alias: '' }])}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-300 py-2.5 text-[12px] font-extrabold text-ink-500 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              افزودن نام مستعار
            </button>
          </div>
        </SectionShell>

        {/* شماره‌های تماس */}
        <SectionShell
          icon={Phone}
          title="شماره‌های تماس"
          hint="شماره‌های مرتبط با فردِ پرونده (همراه، خط ثابت، واسطه‌ها…)."
        >
          <div className="flex flex-col gap-2.5">
            {phones.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 sm:flex-row">
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
                <button
                  type="button"
                  onClick={() => setPhones((prev) => prev.filter((r) => r.id !== row.id))}
                  aria-label="حذف شماره"
                  className="flex w-11 flex-none items-center justify-center rounded-2xl border border-ink-200 text-ink-400 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setPhones((prev) => [...prev, { id: nextId(), label: '', number: '' }])
              }
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-300 py-2.5 text-[12px] font-extrabold text-ink-500 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              افزودن شماره تماس
            </button>
          </div>
        </SectionShell>

        {/* شبکه‌های اجتماعی */}
        <SectionShell
          icon={Share2}
          title="حساب‌های اجتماعی"
          hint="هندل یا نشانیِ حساب‌های منتسب به فردِ پرونده."
        >
          <div className="flex flex-col gap-2.5">
            {socials.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 sm:flex-row">
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
                <button
                  type="button"
                  onClick={() => setSocials((prev) => prev.filter((r) => r.id !== row.id))}
                  aria-label="حذف حساب"
                  className="flex w-11 flex-none items-center justify-center rounded-2xl border border-ink-200 text-ink-400 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSocials((prev) => [
                  ...prev,
                  { id: nextId(), platform: 'telegram', handle_or_url: '' },
                ])
              }
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-300 py-2.5 text-[12px] font-extrabold text-ink-500 transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              افزودن حساب اجتماعی
            </button>
          </div>
        </SectionShell>

        {/* ضمائم */}
        <SectionShell
          icon={Paperclip}
          title="اسناد و مدارک (اختیاری)"
          hint={`فرمت‌های مجاز: ${REPORT_ATTACHMENT_ACCEPT_FA} — حداکثر حجمِ هر فایل ۲۰ مگابایت.`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={REPORT_ATTACHMENT_ACCEPT}
            onChange={(e) => addFiles(e.target.files)}
            className="block w-full text-[12px] text-ink-500 file:ml-3 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2.5 file:text-[12px] file:font-extrabold file:text-white hover:file:bg-brand-700"
            aria-label="انتخاب فایل‌های ضمیمه"
          />
          {fileError && (
            <p role="alert" className="mt-2 text-[12px] font-bold text-rose-600">
              {fileError}
            </p>
          )}
          {files.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-2.5"
                >
                  <span className="min-w-0 truncate text-[12px] font-bold text-ink-700" dir="ltr">
                    {f.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-[11px] tabular-nums text-ink-400">
                      {(f.size / (1024 * 1024)).toFixed(1)}MB
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`حذف ${f.name}`}
                      className="text-ink-400 transition-colors hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>

        {/* ارسال */}
        <section className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm md:p-6">
          <button
            type="submit"
            disabled={!submittable || submitting}
            className="w-full rounded-2xl bg-brand-600 py-4 text-[15px] font-black text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
        <section className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm md:p-6">
          <h2 className="flex items-center gap-2 text-[14px] font-black text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
              <FileText className="h-4 w-4" aria-hidden="true" />
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
  );
}
