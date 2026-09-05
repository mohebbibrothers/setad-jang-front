'use client';

import { Fragment, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Download,
  FileAudio,
  FileClock,
  FileImage,
  FileText,
  FileVideo,
  Fingerprint,
  Files,
  Hash,
  Loader2,
  MessageSquareQuote,
  Paperclip,
  Phone,
  RotateCcw,
  Share2,
  StickyNote,
  Undo2,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import {
  REPORTABLE_FIELD_OPTIONS,
  SOCIAL_PLATFORM_META,
  cancelMyReport,
  fetchMyReportDetail,
  fetchMyReports,
  itemStatusMeta,
  jalaliDateFa,
  mediaSrc,
  reportJourney,
  reportStatusMeta,
  summarizeVerdicts,
  type MyReportDetail,
  type MyReportSummary,
  type ReportJourneyStep,
  type ReportItemStatusKey,
} from '@/lib/r4j';
import { cn, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * MyReportsDossier — «دفترِ پیگیریِ گزارش‌ها»
 *
 * مدیریتِ کاملِ گزارش‌های پیشینِ کاربر برای همین پرونده — همه‌ی
 * ظرفیت‌های بک‌اند را مصرف می‌کند، نه فقط لیستِ خلاصه:
 *
 *   • GET  me/reports/            → فهرست + فیلترِ سمتِ کلاینت روی پرونده؛
 *   • GET  me/reports/<id>/       → صورت‌جلسه‌ی lazy: پاسخِ سردبیر، متنِ
 *     گزارش، و سرنخ‌های ثبت‌شده با رأیِ تک‌تک آیتم‌ها
 *     (ReportFieldChangeStatus: pending/approved/rejected)، نشان «اعمال
 *     روی پرونده» برای آیتم‌های applied و «ارتقا به سندِ پرونده» برای
 *     ضمائمِ منتشرشده؛
 *   • POST me/reports/<id>/cancel → درخواستِ لغو با تاییدِ دو مرحله‌ای؛
 *     پاسخِ سرور serializerِ کاملِ detail است پس کشِ صورت‌جلسه هم به‌روز
 *     می‌شود.
 *
 * معماریِ بصری: ریلِ زمانی (timeline) + مُهرِ داوریِ چرخیده + چرخه‌ی
 * سه‌ایستگاهیِ «ثبت ← بررسی ← نتیجه» روی هر کارت.
 * ═══════════════════════════════════════════════════════════════════
 */

const fa = (v: number | string) => toPersianDigits(String(v));

// ── تُن‌های بصری — همه‌ی کلاس‌ها static برای JIT ──────────────────

/** نقطه‌ی ریلِ زمانی — کلاسِ کاملِ before: به‌صورت static تا JIT ببیندش */
const TIMELINE_DOT_BEFORE: Record<string, string> = {
  pending: 'before:bg-amber-400',
  cancel_requested: 'before:bg-amber-400',
  approved: 'before:bg-emerald-500',
  partially_approved: 'before:bg-sky-500',
  rejected: 'before:bg-rose-500',
  canceled: 'before:bg-slate-400',
};

const STAMP_TONE: Record<string, string> = {
  approved: 'border-emerald-500/70 bg-emerald-500/[.06] text-emerald-700',
  partially_approved: 'border-sky-500/70 bg-sky-500/[.06] text-sky-700',
  rejected: 'border-rose-500/70 bg-rose-500/[.06] text-rose-700',
  canceled: 'border-slate-400/80 bg-slate-500/[.07] text-slate-500',
};

const JOURNEY_DOT_DONE: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
};

// ── ابزارهای کوچک ────────────────────────────────────────────────

function fieldLabel(fieldName: string) {
  return REPORTABLE_FIELD_OPTIONS.find((o) => o.value === fieldName)?.label ?? fieldName;
}

function platformLabel(platform: string) {
  return SOCIAL_PLATFORM_META[platform]?.label ?? platform;
}

function fileBaseName(url: string) {
  try {
    const tail = url.split('?')[0].split('/').filter(Boolean).pop() ?? url;
    return decodeURIComponent(tail);
  } catch {
    return url;
  }
}

function attachmentIcon(kind: string) {
  switch (kind) {
    case 'image':
      return FileImage;
    case 'video':
      return FileVideo;
    case 'audio':
      return FileAudio;
    default:
      return FileText;
  }
}

// ── مُهر وضعیت — چرخیده برای مختومه، پالس برای درجریان ───────────

function StatusStamp({ status }: { status: string }) {
  const meta = reportStatusMeta(status);
  const stampCls = STAMP_TONE[status];
  if (stampCls) {
    return (
      <span
        className={cn(
          'inline-flex -rotate-2 select-none items-center gap-1 rounded-[10px] border-2 px-2.5 py-1 text-[10.5px] font-black leading-none shadow-[0_2px_6px_-3px_rgba(15,20,32,.25)]',
          stampCls,
        )}
      >
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        {meta.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-amber-300 bg-amber-50 px-3 py-1 text-[10.5px] font-black text-amber-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
      </span>
      {meta.label}
    </span>
  );
}

// ── چرخه‌ی سه‌ایستگاهیِ داوری ────────────────────────────────────

function JourneyDot({ step }: { step: ReportJourneyStep }) {
  if (step.state === 'done') {
    return (
      <span
        className={cn(
          'flex h-[22px] w-[22px] items-center justify-center rounded-full text-white shadow-sm',
          JOURNEY_DOT_DONE[step.tone] ?? JOURNEY_DOT_DONE.slate,
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
      </span>
    );
  }
  if (step.state === 'active') {
    return (
      <span className="relative flex h-[22px] w-[22px] items-center justify-center">
        <span className="absolute inline-flex h-3.5 w-3.5 animate-ping rounded-full bg-amber-400 opacity-60" />
        <span className="relative h-3.5 w-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="h-[22px] w-[22px] rounded-full border-2 border-dashed border-ink-200 bg-white"
    />
  );
}

function JourneyRail({ status }: { status: string }) {
  const steps = reportJourney(status);
  return (
    <div className="mt-4 flex items-start" role="list" aria-label="چرخه‌ی بررسی گزارش">
      {steps.map((s, i) => (
        <Fragment key={s.key}>
          {i > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                'mx-1.5 mt-[11px] min-w-3 flex-1 border-t-2 border-dashed',
                steps[i - 1].state === 'done' ? 'border-emerald-300' : 'border-ink-200',
              )}
            />
          )}
          <div role="listitem" className="flex w-[74px] shrink-0 flex-col items-center gap-1.5">
            <JourneyDot step={s} />
            <span
              className={cn(
                'text-center text-[10px] font-extrabold leading-4',
                s.state === 'done' && 'text-ink-700',
                s.state === 'active' && 'text-amber-700',
                s.state === 'idle' && 'text-ink-300',
              )}
            >
              {s.label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// ── نشانِ رأیِ تک‌آیتمی ──────────────────────────────────────────

function VerdictChip({ status }: { status: ReportItemStatusKey }) {
  const meta = itemStatusMeta(status);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black leading-none',
        meta.badge,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/** نشانِ «روی پرونده اعمال شد» برای آیتم‌های applied */
function AppliedChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-500/10 px-2 py-1 text-[9.5px] font-black leading-none text-brand-700">
      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

/** یادداشتِ سردبیر روی یک آیتم */
function ItemAdminNote({ note }: { note: string }) {
  if (!note.trim()) return null;
  return (
    <p className="text-[10.5px] leading-5 text-ink-400">
      <span className="font-black text-ink-500">یادداشت سردبیر: </span>
      {note}
    </p>
  );
}

// ── پوسته‌ی گروهِ سرنخ‌ها با سربرگِ آماری ────────────────────────

function VerdictGroup({
  icon: Icon,
  title,
  statuses,
  children,
}: {
  icon: typeof FileText;
  title: string;
  statuses: string[];
  children: React.ReactNode;
}) {
  if (statuses.length === 0) return null;
  const sum = summarizeVerdicts(statuses);
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-3.5">
      <h5 className="flex flex-wrap items-center gap-2 text-[12px] font-black text-ink-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {title}
        <span className="rounded-full bg-ink-900/[.05] px-2 py-0.5 text-[10px] font-black tabular-nums text-ink-500">
          {fa(sum.total)} مورد
        </span>
        <span className="ms-auto flex items-center gap-2 text-[10px] font-black tabular-nums">
          {sum.approved > 0 && (
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {fa(sum.approved)} تأیید
            </span>
          )}
          {sum.rejected > 0 && (
            <span className="flex items-center gap-1 text-rose-600">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
              {fa(sum.rejected)} رد
            </span>
          )}
          {sum.pending > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              {fa(sum.pending)} در انتظار
            </span>
          )}
        </span>
      </h5>
      <ul className="mt-2.5 flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function ItemRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2.5">
      {children}
    </li>
  );
}

// ── صورت‌جلسه‌ی کاملِ یک گزارش (lazy detail) ─────────────────────

function ReportMinutes({ detail }: { detail: MyReportDetail }) {
  const fields = detail.field_changes ?? [];
  const aliases = detail.alias_suggestions ?? [];
  const phones = detail.phone_suggestions ?? [];
  const socials = detail.social_suggestions ?? [];
  const attachments = detail.attachments ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      {/* پاسخِ سردبیر — مهم‌ترین بازخورد، تیره و پررنگ */}
      {detail.admin_note?.trim() ? (
        <section className="relative overflow-hidden rounded-2xl bg-ink-900 p-4 text-white">
          <MessageSquareQuote
            aria-hidden="true"
            className="absolute -bottom-3 -end-2 h-16 w-16 text-white/[.06]"
          />
          <h5 className="flex items-center gap-2 text-[12px] font-black text-mint-400">
            <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
            پاسخ سردبیر
          </h5>
          <p className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-white/85">
            {detail.admin_note}
          </p>
        </section>
      ) : null}

      {/* متنِ گزارشِ کاربر */}
      {detail.notes?.trim() ? (
        <section className="rounded-2xl border border-ink-100 bg-white p-3.5">
          <h5 className="flex items-center gap-2 text-[12px] font-black text-ink-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
              <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            متنِ گزارشِ شما
          </h5>
          <p className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-xl bg-ink-50/60 px-3 py-2.5 text-[12px] leading-6 text-ink-600">
            {detail.notes}
          </p>
        </section>
      ) : null}

      {/* اصلاحِ مشخصات — با مقایسه‌ی مقدارِ ثبت‌شده ↔ پیشنهاد */}
      <VerdictGroup
        icon={Fingerprint}
        title="پیشنهادهای اصلاحِ مشخصات"
        statuses={fields.map((f) => f.status)}
      >
        {fields.map((f) => (
          <ItemRow key={f.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11.5px]">
                <span className="rounded-lg bg-ink-900/[.05] px-2 py-0.5 font-black text-ink-600">
                  {fieldLabel(f.field_name)}
                </span>
                {f.current_value_snapshot ? (
                  <span
                    dir="auto"
                    className="max-w-full truncate rounded-md bg-white px-1.5 py-0.5 text-ink-400 ring-1 ring-ink-100"
                  >
                    {f.current_value_snapshot}
                  </span>
                ) : null}
                <span aria-hidden="true" className="text-ink-300">
                  ←
                </span>
                <span
                  dir="auto"
                  className="max-w-full truncate rounded-md bg-white px-1.5 py-0.5 font-bold text-ink-800 ring-1 ring-brand-200"
                >
                  {f.suggested_value}
                </span>
              </div>
              <VerdictChip status={f.status} />
            </div>
            <ItemAdminNote note={f.admin_note} />
          </ItemRow>
        ))}
      </VerdictGroup>

      {/* نام‌های مستعار */}
      <VerdictGroup
        icon={UserRound}
        title="نام‌های مستعارِ پیشنهادی"
        statuses={aliases.map((a) => a.status)}
      >
        {aliases.map((a) => (
          <ItemRow key={a.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span dir="auto" className="text-[12px] font-bold text-ink-800">
                {a.alias}
              </span>
              <span className="flex items-center gap-1.5">
                {a.applied_alias ? <AppliedChip>روی پرونده اعمال شد</AppliedChip> : null}
                <VerdictChip status={a.status} />
              </span>
            </div>
            <ItemAdminNote note={a.admin_note} />
          </ItemRow>
        ))}
      </VerdictGroup>

      {/* شماره‌های تماس */}
      <VerdictGroup
        icon={Phone}
        title="شماره‌های تماسِ پیشنهادی"
        statuses={phones.map((p) => p.status)}
      >
        {phones.map((p) => (
          <ItemRow key={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-[11.5px]">
                {p.label ? (
                  <span className="rounded-lg bg-ink-900/[.05] px-2 py-0.5 font-black text-ink-600">
                    {p.label}
                  </span>
                ) : null}
                <span dir="ltr" className="font-mono font-bold text-ink-800">
                  {p.number}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                {p.applied_phone ? <AppliedChip>روی پرونده اعمال شد</AppliedChip> : null}
                <VerdictChip status={p.status} />
              </span>
            </div>
            <ItemAdminNote note={p.admin_note} />
          </ItemRow>
        ))}
      </VerdictGroup>

      {/* حساب‌های اجتماعی — فقط متن، بدون لینک (سیاست محتوانگار) */}
      <VerdictGroup
        icon={Share2}
        title="حساب‌های اجتماعیِ پیشنهادی"
        statuses={socials.map((s) => s.status)}
      >
        {socials.map((s) => (
          <ItemRow key={s.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-[11.5px]">
                <span className="rounded-lg bg-ink-900/[.05] px-2 py-0.5 font-black text-ink-600">
                  {platformLabel(s.platform)}
                </span>
                <span dir="ltr" className="font-mono font-bold text-ink-800">
                  {s.handle_or_url}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                {s.applied_social ? <AppliedChip>روی پرونده اعمال شد</AppliedChip> : null}
                <VerdictChip status={s.status} />
              </span>
            </div>
            <ItemAdminNote note={s.admin_note} />
          </ItemRow>
        ))}
      </VerdictGroup>

      {/* اسنادِ پیوست — دانلود فایلِ خودِ کاربر + نشانِ ارتقا */}
      <VerdictGroup
        icon={Paperclip}
        title="اسناد و مدارکِ پیوست"
        statuses={attachments.map((a) => a.status)}
      >
        {attachments.map((a) => {
          const AIcon = attachmentIcon(a.kind);
          const href = mediaSrc(a.file);
          return (
            <ItemRow key={a.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <AIcon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  <span
                    dir="ltr"
                    className="min-w-0 truncate font-mono text-[11px] font-bold text-ink-700"
                  >
                    {a.title?.trim() || fileBaseName(a.file)}
                  </span>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-black text-brand-700 transition-colors hover:bg-brand-500/20"
                    >
                      <Download className="h-3 w-3" aria-hidden="true" />
                      دانلود
                    </a>
                  ) : null}
                </span>
                <span className="flex items-center gap-1.5">
                  {a.promoted_criminal_attachment ? (
                    <AppliedChip>به‌سندِ پرونده ارتقا یافت</AppliedChip>
                  ) : null}
                  <VerdictChip status={a.status} />
                </span>
              </div>
              <ItemAdminNote note={a.admin_note} />
            </ItemRow>
          );
        })}
      </VerdictGroup>
    </div>
  );
}

// ── کامپوننتِ اصلی ────────────────────────────────────────────────

export function MyReportsDossier({
  criminalId,
  refreshKey,
}: {
  criminalId: number;
  /** هر موفقیتِ ثبتِ گزارش → +۱ تا دفتر بدون پرش (بدون اسکلت) بازخوانی شود */
  refreshKey: number;
}) {
  const { isAuthenticated } = useAuth();

  const [reports, setReports] = useState<MyReportSummary[] | null>(null);
  const [listError, setListError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const [openId, setOpenId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, MyReportDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});
  const [detailError, setDetailError] = useState<Record<number, boolean>>({});

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [cancelErrorId, setCancelErrorId] = useState<number | null>(null);

  // فهرست گزارش‌ها — فیلترِ پرونده سمتِ کلاینت (قراردادِ فیلترِ بک‌اند فقط status است)
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    fetchMyReports()
      .then((res) => {
        if (!alive) return;
        setReports(res.results.filter((r) => r.criminal_id === criminalId));
        setListError(false);
      })
      .catch(() => {
        if (alive) setListError(true);
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, criminalId, refreshKey, reloadTick]);

  async function loadDetail(id: number) {
    if (detailLoading[id]) return;
    setDetailError((prev) => ({ ...prev, [id]: false }));
    setDetailLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const d = await fetchMyReportDetail(id);
      setDetails((prev) => ({ ...prev, [id]: d }));
    } catch {
      setDetailError((prev) => ({ ...prev, [id]: true }));
    } finally {
      setDetailLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  function toggleMinutes(id: number) {
    setOpenId((prev) => (prev === id ? null : id));
    if (!details[id]) void loadDetail(id);
  }

  async function confirmCancel(id: number) {
    if (cancelingId) return;
    setCancelingId(id);
    setCancelErrorId(null);
    try {
      // پاسخِ cancel همان detailِ کامل است — ردیف و صورت‌جلسه هر دو تازه می‌شوند
      const updated = await cancelMyReport(id);
      setReports(
        (prev) =>
          prev?.map((r) =>
            r.id === id ? { ...r, status: updated.status, updated_at: updated.updated_at } : r,
          ) ?? null,
      );
      setDetails((prev) => ({ ...prev, [id]: updated }));
      setConfirmingId(null);
    } catch {
      setCancelErrorId(id);
    } finally {
      setCancelingId(null);
    }
  }

  if (!isAuthenticated) return null;

  // ── وضعیت‌های لودینگ/خطا/خالی ─────────────────────────────────

  const stats =
    reports && reports.length > 0
      ? [
          {
            key: 'all',
            label: 'همه‌ی گزارش‌ها',
            value: reports.length,
            dot: 'bg-ink-400',
          },
          {
            key: 'inflight',
            label: 'در جریان',
            value: reports.filter((r) => ['pending', 'cancel_requested'].includes(r.status)).length,
            dot: 'bg-amber-500',
          },
          {
            key: 'decided',
            label: 'تأییدشده',
            value: reports.filter((r) => ['approved', 'partially_approved'].includes(r.status))
              .length,
            dot: 'bg-emerald-500',
          },
          {
            key: 'closed',
            label: 'مختومه',
            value: reports.filter((r) => ['rejected', 'canceled'].includes(r.status)).length,
            dot: 'bg-slate-400',
          },
        ]
      : null;

  return (
    <section
      aria-label="دفتر پیگیری گزارش‌ها"
      className="relative overflow-hidden rounded-[26px] border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04),0_18px_38px_-30px_rgba(15,20,32,.22)] md:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 start-12 h-40 w-40 rounded-full bg-brand-500/[.07] blur-3xl"
      />
      <header className="relative flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-mint-500/15 text-brand-600 ring-1 ring-brand-500/20">
          <Files className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-black text-ink-900">دفترِ پیگیریِ گزارش‌ها</h2>
          <p className="mt-1 text-[11.5px] leading-6 text-ink-400">
            گزارش‌های پیشینِ شما برای این پرونده — سرنخ‌های ثبت‌شده، رأیِ تک‌تک آیتم‌ها و پاسخِ
            سردبیر، شفاف و لحظه‌ای.
          </p>
        </div>
      </header>

      {/* خطای دریافتِ فهرست */}
      {listError && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
        >
          <CircleAlert className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          <p className="text-[12px] font-extrabold text-rose-700">
            فهرستِ گزارش‌ها دریافت نشد؛ اتصال را بررسی کنید.
          </p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="ms-auto flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-rose-700"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            تلاش دوباره
          </button>
        </div>
      )}

      {/* اسکلتِ اولیه */}
      {reports === null && !listError && (
        <div aria-busy="true" className="mt-5 flex flex-col gap-3">
          {[74, 74].map((h) => (
            <div
              key={h}
              className="animate-pulse rounded-[22px] border border-ink-100 bg-ink-50/70"
              style={{ height: h }}
            />
          ))}
        </div>
      )}

      {/* حالتِ خالی */}
      {reports !== null && reports.length === 0 && !listError && (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-ink-200 bg-ink-50/40 px-6 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-300 ring-1 ring-ink-100">
            <FileClock className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13px] font-black text-ink-700">
              هنوز گزارشی برای این پرونده ثبت نکرده‌اید
            </p>
            <p className="mt-1 text-[11.5px] leading-6 text-ink-400">
              اولین گزارشِ شما همین‌جا یک پرونده‌ی پیگیری می‌سازد — با چرخه‌ی داوری، رأیِ هر سرنخ و
              پاسخِ سردبیر.
            </p>
          </div>
        </div>
      )}

      {/* نوارِ آمار */}
      {stats && (
        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((c) => (
            <li
              key={c.key}
              className="rounded-2xl border border-ink-100 bg-ink-50/60 px-3.5 py-2.5"
            >
              <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-ink-400">
                <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} aria-hidden="true" />
                {c.label}
              </p>
              <p className="mt-1 text-lg font-black tabular-nums leading-none text-ink-900">
                {fa(c.value)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* ریلِ زمانی گزارش‌ها */}
      {reports !== null && reports.length > 0 && (
        <ol className="relative mt-5 flex flex-col gap-4 ps-7 before:absolute before:bottom-4 before:start-[8px] before:top-4 before:w-px before:bg-gradient-to-b before:from-brand-300/90 before:via-ink-200 before:to-transparent">
          {reports.map((r) => {
            const open = openId === r.id;
            const detail = details[r.id];
            const loading = Boolean(detailLoading[r.id]);
            const dErr = Boolean(detailError[r.id]);
            return (
              <li
                key={r.id}
                className={cn(
                  'relative before:absolute before:-start-[24px] before:top-8 before:h-[9px] before:w-[9px] before:rounded-full before:ring-[3px] before:ring-white before:content-[""]',
                  TIMELINE_DOT_BEFORE[r.status] ?? 'before:bg-ink-300',
                )}
              >
                <article className="rounded-[22px] border border-ink-100 bg-ink-50/40 p-4 shadow-[0_1px_2px_rgba(15,20,32,.05)] transition-all duration-300 hover:border-brand-200 hover:bg-white hover:shadow-[0_14px_28px_-22px_rgba(15,20,32,.3)] md:p-5">
                  {/* سربرگ: سریال + تاریخ + مُهر */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-brand-500/15">
                        <Hash className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-black text-ink-900">
                          گزارشِ شمارهٔ {fa(r.id)}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-bold text-ink-400">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" />
                          {jalaliDateFa(r.created_at) ?? ''}
                        </p>
                      </div>
                    </div>
                    <StatusStamp status={r.status} />
                  </div>

                  {/* چرخه‌ی داوری */}
                  <JourneyRail status={r.status} />

                  {/* گزیده‌ی متن گزارش */}
                  {r.notes?.trim() ? (
                    <p className="mt-3 line-clamp-2 rounded-xl bg-white px-3.5 py-2.5 text-[11.5px] leading-6 text-ink-500 ring-1 ring-ink-100">
                      {r.notes}
                    </p>
                  ) : null}

                  {/* اقدام‌ها */}
                  <div className="mt-4 border-t border-ink-100 pt-3.5">
                    {confirmingId === r.id && r.status === 'pending' ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-[11px] font-extrabold leading-6 text-amber-800">
                          درخواستِ لغو برای سردبیر ارسال شود؟ تا رأیِ سردبیر، گزارش در صفِ بررسی
                          می‌ماند.
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void confirmCancel(r.id)}
                            disabled={cancelingId === r.id}
                            className="flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
                          >
                            {cancelingId === r.id && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            )}
                            {cancelingId === r.id ? 'در حال ارسال…' : 'ارسال درخواست لغو'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            disabled={cancelingId === r.id}
                            className="flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[11px] font-black text-ink-500 transition-colors hover:border-ink-300 disabled:opacity-60"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            انصراف
                          </button>
                        </div>
                        {cancelErrorId === r.id && (
                          <p role="alert" className="mt-2 text-[11px] font-black text-rose-600">
                            ثبتِ درخواست ناموفق بود؛ دوباره تلاش کنید.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleMinutes(r.id)}
                          aria-expanded={open}
                          aria-controls={`dossier-minutes-${r.id}`}
                          className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/70 px-3.5 py-1.5 text-[11px] font-black text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 transition-transform duration-300',
                              open && 'rotate-180',
                            )}
                            aria-hidden="true"
                          />
                          صورت‌جلسه و سرنخ‌ها
                        </button>
                        {r.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(r.id)}
                            className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[11px] font-black text-ink-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                          >
                            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                            درخواست لغو
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* صورت‌جلسه (lazy) */}
                  {open && (
                    <div id={`dossier-minutes-${r.id}`} className="mt-4">
                      {loading && !detail ? (
                        <div
                          role="status"
                          aria-busy="true"
                          className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-white p-4"
                        >
                          <span className="flex items-center gap-2 text-[11px] font-extrabold text-ink-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            در حال دریافت صورت‌جلسه…
                          </span>
                          {[52, 64].map((h) => (
                            <span
                              key={h}
                              className="block animate-pulse rounded-xl bg-ink-100/80"
                              style={{ height: h }}
                            />
                          ))}
                        </div>
                      ) : dErr && !detail ? (
                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                          <CircleAlert
                            className="h-4 w-4 shrink-0 text-rose-600"
                            aria-hidden="true"
                          />
                          <p className="text-[12px] font-extrabold text-rose-700">
                            صورت‌جلسه دریافت نشد.
                          </p>
                          <button
                            type="button"
                            onClick={() => void loadDetail(r.id)}
                            className="ms-auto flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-rose-700"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                            دوباره تلاش کنید
                          </button>
                        </div>
                      ) : detail ? (
                        <ReportMinutes detail={detail} />
                      ) : null}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
