/**
 * قراردادِ راستی‌آزماییِ عمومیِ گواهی‌های «قرارگاه آموزشی».
 *
 * منبع حقیقت (خوانده‌شده از apps/lms در بک‌اند):
 *   GET /api/v1/lms/certificates/verify/<verification_slug>/
 *     • AllowAny + throttle اختصاصی per-IP (ضد اوراکلِ شمارش)
 *     • 200 ⇒ CertificateVerifySerializer: certificate_code،
 *       full_name_snapshot، course_title_snapshot،
 *       instructor_name_snapshot، score_out_of_20، issued_at
 *     • 404 ⇒ مدرک یافت نشد / باطل / غیرفعال («مدرک معتبر یافت نشد.»)
 *
 *   verification_slug = certificate_code.lower() و خودِ کد از
 *   uuid4().hex[:24].upper() ساخته می‌شود؛ پس الفبای امنِ ورودی
 *   [a-z0-9-_] با طولِ کران‌دار است (SlugField تا ۸۰ نویسه).
 *
 * این ماژول خالص است تا هم در route handler (سرور) و هم در ویجتِ
 * کلاینت ایمن import شود و با vitest به‌تنهایی قابل آزمون بماند.
 */

/* ── پاک‌سازیِ کد — دفاعِ عمق‌دار پیش از رسیدن به upstream ──────────── */
const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,78}[a-z0-9]$/;

/** نرمال‌سازیِ ورودیِ کاربر: لایه‌های # و فاصله و حروف بزرگ می‌پذیرد،
 *  ولی فقط الفبای اسلاگ را عبور می‌دهد. خروجیِ null یعنی «نامعتبر». */
export function sanitizeCertificateCode(raw: string): string | null {
  const cleaned = raw.trim().replace(/^#+/, '').toLowerCase().replace(/[‌‎]/g, ''); // نیم‌فاصله/جهت‌دهی‌های نامرئی
  if (!CODE_PATTERN.test(cleaned)) return null;
  return cleaned;
}

/* ── مدلِ نمایشیِ نتیجه — آینه‌ی فیلدهای CertificateVerifySerializer ── */
export type CertificateVerifyResult = {
  certificateCode: string;
  fullName: string;
  courseTitle: string;
  instructorName: string;
  /** نمره از ۲۰؛ ممکن است null باشد. */
  scoreOutOf20: number | null;
  /** ISO datetime؛ ممکن است null باشد. */
  issuedAt: string | null;
};

type ApiCertificateVerify = {
  certificate_code?: string;
  full_name_snapshot?: string | null;
  course_title_snapshot?: string | null;
  instructor_name_snapshot?: string | null;
  score_out_of_20?: number | string | null;
  issued_at?: string | null;
};

/** نگاشتِ محتاطانه‌ی payload خام: هر فیلد غایب، خالی می‌ماند نه undefinedِ شکننده. */
export function mapCertificateVerify(raw: ApiCertificateVerify): CertificateVerifyResult {
  const score =
    raw.score_out_of_20 === null || raw.score_out_of_20 === undefined
      ? null
      : Number(raw.score_out_of_20);
  return {
    certificateCode: raw.certificate_code ?? '',
    fullName: raw.full_name_snapshot?.trim() ?? '',
    courseTitle: raw.course_title_snapshot?.trim() ?? '',
    instructorName: raw.instructor_name_snapshot?.trim() ?? '',
    scoreOutOf20: score !== null && Number.isFinite(score) ? score : null,
    issuedAt: raw.issued_at || null,
  };
}

/** تاریخِ صدور به قالبِ خوانای فارسی؛ ورودی نامعتبر ⇒ رشته‌ی خالی تا سطر پنهان شود. */
export function formatCertificateDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}
