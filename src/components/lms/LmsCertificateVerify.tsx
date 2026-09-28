'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { BadgeCheck, Loader2, ScanLine, ShieldCheck, ShieldX, TriangleAlert } from 'lucide-react';
import {
  formatCertificateDate,
  sanitizeCertificateCode,
  type CertificateVerifyResult,
} from '@/lib/lms-certificate';

/**
 * ویجتِ «راستی‌آزمایی گواهی» — عملیاتی‌کردنِ همان قابلیتی که backend
 * با endpointِ عمومیِ certificates/verify فراهم کرده (بند ۵: هر
 * توانمندیِ عمومی باید در UI قابل‌استفاده باشد). از هاب به دنیای
 * اعتبارسنجی وصل می‌کند: فارغ‌التحصیل کدش را می‌دهد، کارفرما صحتش را
 * می‌پرسد — بدون ورود، بدون افشای کد ملی.
 */

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; cert: CertificateVerifyResult }
  | { kind: 'not-found' }
  | { kind: 'invalid' }
  | { kind: 'rate-limited' }
  | { kind: 'unavailable' };

export function LmsCertificateVerify() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeCertificateCode(code);
    if (!cleaned) {
      setStatus({ kind: 'invalid' });
      return;
    }
    setStatus({ kind: 'loading' });
    try {
      const res = await fetch(`/api/lms/certificate-verify?code=${encodeURIComponent(cleaned)}`, {
        cache: 'no-store',
      });
      const body = (await res.json().catch(() => null)) as {
        found?: boolean;
        reason?: string;
        certificate?: CertificateVerifyResult;
      } | null;
      if (res.status === 429) {
        setStatus({ kind: 'rate-limited' });
      } else if (res.ok && body?.found && body.certificate) {
        setStatus({ kind: 'found', cert: body.certificate });
      } else if (res.ok && body && body.found === false) {
        setStatus({ kind: 'not-found' });
      } else if (res.status === 400) {
        setStatus({ kind: 'invalid' });
      } else {
        setStatus({ kind: 'unavailable' });
      }
    } catch {
      setStatus({ kind: 'unavailable' });
    }
  };

  const loading = status.kind === 'loading';

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-ink-100 bg-white shadow-[0_18px_45px_-30px_rgba(11,53,48,.35)]">
      {/* نوارِ گرادیانیِ اعتبار — لبه‌ی بالاییِ کارت */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-brand-500 via-mint-400 to-brand-600"
      />
      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-7 sm:p-8">
        {/* مُهرِ بصری — شیلدِ گواهی */}
        <div className="hidden sm:block">
          <span className="relative grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-[0_16px_32px_-16px_rgba(13,128,116,.8)]">
            <BadgeCheck className="h-9 w-9" aria-hidden="true" />
            <span className="absolute -bottom-1.5 -left-1.5 grid h-7 w-7 place-items-center rounded-full bg-mint-500 text-ink-950 ring-4 ring-white">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </span>
        </div>

        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-brand-700">
            <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
            استعلامِ عمومی — بدون نیاز به ورود
          </p>
          <h2 className="mt-1.5 text-[20px] font-black text-ink-900 md:text-[24px]">
            راستی&zwnj;آزمایی گواهی
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-7 text-ink-500">
            هر گواهیِ پایانِ دوره یک کدِ یکتا دارد؛ کد را وارد کن تا اصالتش در چند ثانیه تأیید شود —
            برای فارغ&zwnj;التحصیل، کارفرما یا هر کسی که به اعتبارِ این مدرک تکیه می&zwnj;کند.
          </p>

          <form onSubmit={submit} className="mt-4 flex flex-col gap-2.5 sm:flex-row" noValidate>
            <label className="relative flex-1">
              <span className="sr-only">کد راستی‌آزمایی گواهی</span>
              <input
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="certificate code …"
                autoComplete="off"
                spellCheck={false}
                maxLength={90}
                className="h-12 w-full rounded-xl bg-ink-50/80 px-4 font-mono text-[13px] tracking-wider text-ink-900 ring-1 ring-ink-200 transition placeholder:text-ink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <button
              type="submit"
              disabled={loading || code.trim() === ''}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 px-6 text-[13.5px] font-extrabold text-white shadow-[0_12px_26px_-12px_rgba(13,128,116,.85)] transition-all hover:from-brand-600 hover:to-brand-800 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? 'در حال استعلام…' : 'استعلام کن'}
            </button>
          </form>

          <div aria-live="polite" className="min-w-0">
            {status.kind === 'found' && <FoundCard cert={status.cert} />}
            {status.kind === 'not-found' && (
              <Notice
                tone="danger"
                icon={<ShieldX className="h-4 w-4" aria-hidden="true" />}
                title="مدرکی با این کد تأیید نشد"
                text="کد را دوباره بخوان و امتحان کن؛ اگر از درستی‌اش مطمئنی، ممکن است باطل شده باشد."
              />
            )}
            {status.kind === 'invalid' && (
              <Notice
                tone="warning"
                icon={<TriangleAlert className="h-4 w-4" aria-hidden="true" />}
                title="قالبِ کد درست نیست"
                text="کدِ راستی‌آزمایی فقط حروف و رقمِ لاتین و خطِ تیره دارد؛ بدون فاصله و علامت اضافه بنویسش."
              />
            )}
            {status.kind === 'rate-limited' && (
              <Notice
                tone="warning"
                icon={<TriangleAlert className="h-4 w-4" aria-hidden="true" />}
                title="کمی آرام‌تر"
                text="تعدادِ استعلام‌های پیاپی زیاد شد؛ چند لحظه‌ی دیگر دوباره تلاش کن."
              />
            )}
            {status.kind === 'unavailable' && (
              <Notice
                tone="danger"
                icon={<TriangleAlert className="h-4 w-4" aria-hidden="true" />}
                title="استعلام برقرار نشد"
                text="اتصال با سرورِ استعلام میسر نشد؛ چند لحظه‌ی دیگر دوباره تلاش کن."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── کارتِ موفقیت — سندِ کوچکِ اعتبار ────────────────────────────────── */
function FoundCard({ cert }: { cert: CertificateVerifyResult }) {
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: 'دارنده‌ی گواهی', value: cert.fullName || '—' },
    { label: 'دوره', value: cert.courseTitle || '—' },
    ...(cert.instructorName ? [{ label: 'مدرس', value: cert.instructorName }] : []),
    ...(cert.scoreOutOf20 !== null
      ? [
          {
            label: 'نمره‌ی آزمون',
            value: `${cert.scoreOutOf20.toLocaleString('fa-IR')} از ${(20).toLocaleString('fa-IR')}`,
          },
        ]
      : []),
    ...(cert.issuedAt
      ? [{ label: 'تاریخ صدور', value: formatCertificateDate(cert.issuedAt) }]
      : []),
  ];

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-mint-200 bg-gradient-to-b from-mint-50/80 to-white">
      <p className="flex items-center gap-2 border-b border-mint-100 bg-mint-100/60 px-4 py-2.5 text-[12.5px] font-extrabold text-mint-800">
        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        این گواهی معتبر است
        {cert.certificateCode && (
          <code
            dir="ltr"
            className="ms-auto rounded bg-white/80 px-2 py-0.5 font-mono text-[10.5px] font-bold text-mint-700 ring-1 ring-mint-200"
          >
            {cert.certificateCode}
          </code>
        )}
      </p>
      <dl className="grid gap-x-6 gap-y-2 px-4 py-3.5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex min-w-0 items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[11px] font-bold text-ink-400">{r.label}</dt>
            <dd className="truncate text-[12.5px] font-extrabold text-ink-800">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Notice({
  tone,
  icon,
  title,
  text,
}: {
  tone: 'danger' | 'warning';
  icon: ReactNode;
  title: string;
  text: string;
}) {
  const styles =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';
  return (
    <div className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-extrabold">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-6 opacity-80">{text}</p>
      </div>
    </div>
  );
}
