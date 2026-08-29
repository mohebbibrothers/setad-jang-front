import type { RevayatItem } from './revayat';

/**
 * ═══════════════════════════════════════════════════════════════════
 * studio — لایه‌ی قراردادِ خالصِ «استودیوی روایت» (/tabyin/new)
 *
 * این ماژول آینه‌ی دقیقِ قراردادِ بک‌اند است — هیچ قانونی اینجا تعریف
 * نمی‌شود، فقط بازتاب دقیقِ آنچه در بک‌اند تعریف شده:
 *
 *   POST /api/v1/tabyin/me/submissions/        (UserTabyinSubmissionCreateSerializer)
 *     • title       الزامی، حداکثر ۵۱۲ نویسه (serializers.CharField(max_length=512))
 *     • description الزامی، بدون سقف (serializers.CharField)
 *     • attachments اختیاری، حداکثر ۵ مورد (validate_attachments)
 *         └ هر مورد: url (URLField ≤۱۰۲۴) · media_type ∈ image|video|audio|other
 *           (پیش‌فرض other) · title (≤۵۱۲، اختیاری) · order (عدد صحیح ≥۰، پیش‌فرض ترتیب)
 *   نتیجه: با submission_status=pending_review و is_active=false ثبت
 *   می‌شود و پس از تأیید مدیر منتشر می‌شود (services.submit_user_content).
 *   نام نویسنده را بک‌اند از حساب کاربر می‌گیرد (primary_identifier) —
 *   یعنی کاربر نمی‌تواند آن را دستکاری کند و UI هم آن را ویرایش‌پذیر
 *   نمی‌کند.
 * ═══════════════════════════════════════════════════════════════════
 */

/* ── شماره‌های قرارداد (منبعِ واحد — در UI هم نمایش داده می‌شوند) ── */
export const STUDIO_LIMITS = {
  /** CharField(max_length=512) */
  TITLE_MAX: 512,
  /** URLField(max_length=1024) */
  URL_MAX: 1024,
  /** TabyinSubmissionAttachmentInputSerializer.title max_length=512 */
  ATTACHMENT_TITLE_MAX: 512,
  /** validate_attachments — «حداکثر ۵ پیوست برای هر محتوا مجاز است.» */
  ATTACHMENTS_MAX: 5,
} as const;

/* ── انواعِ مولفه‌های فرم ── */
export type StudioMediaType = 'image' | 'video' | 'audio' | 'other';

export interface AttachmentDraft {
  /** شناسه‌ی محلیِ سطر (کلیدِ React — هرگز به بک‌اند نمی‌رود) */
  id: string;
  url: string;
  mediaType: StudioMediaType;
  /** آیا mediaType به‌دستِ کاربر تغییر داده شده؟ اگر نه، بوش‌گرِ خودکار مختار است. */
  typeTouched: boolean;
  title: string;
}

export interface StudioDraft {
  title: string;
  description: string;
  attachments: AttachmentDraft[];
}

/* ───────────────────────────────────────────────────────────────── */
/*  بوش‌گرِ خودکارِ نوعِ رسانه از روی پسوندِ نشانی (UX، نه قرارداد)     */
/* ───────────────────────────────────────────────────────────────── */

const EXT_TO_TYPE: Record<string, StudioMediaType> = {
  // تصویر
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  gif: 'image',
  avif: 'image',
  bmp: 'image',
  svg: 'image',
  // ویدئو
  mp4: 'video',
  webm: 'video',
  mkv: 'video',
  mov: 'video',
  m4v: 'video',
  // صوت
  mp3: 'audio',
  ogg: 'audio',
  oga: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
  flac: 'audio',
};

/**
 * حدسِ نوعِ رسانه از پسوندِ آخرِ مسیرِ نشانی.
 * خروجی null یعنی «پسوندِ ناشناخته» — کاربر باید خودش نوع را انتخاب
 * کند (قراردادِ بک‌اند در آن حالت پیش‌فرضِ other را قبول می‌کند).
 * قبل از «.» در query/hash هرگز به‌عنوان پسوند حساب نمی‌شود.
 */
export function sniffMediaTypeFromUrl(rawUrl: string): StudioMediaType | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  let path = trimmed;
  try {
    path = new URL(trimmed).pathname;
  } catch {
    /* URL نیمه‌کاره در حین تایپ — با همان رشته‌ی خام پیش می‌رویم
       و query/hash را دستی جدا می‌کنیم. */
  }
  const clean = path.split(/[?#]/)[0] ?? '';
  const dot = clean.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = clean.slice(dot + 1).toLowerCase();
  return EXT_TO_TYPE[ext] ?? null;
}

/* ───────────────────────────────────────────────────────────────── */
/*  اعتبارسنجی — منعکس‌کننده‌ی همان‌خطاهای بک‌اند، همین‌جا سمتِ کلاینت  */
/* ───────────────────────────────────────────────────────────────── */

/** آیا رشته یک نشانیِ معتبرِ http/https در محدوده‌ی طولِ قرارداد است؟ */
export function isHttpUrl(value: string, maxLength: number = STUDIO_LIMITS.URL_MAX): boolean {
  const v = value.trim();
  if (!v || v.length > maxLength) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface StudioFieldErrors {
  title?: string;
  description?: string;
  attachments?: string;
  /** خطای نشانیِ هر سطر — کلید = id سطر */
  attachmentUrl: Record<string, string>;
}

/**
 * همان قوانین UserTabyinSubmissionCreateSerializer — سمتِ کلاینت تا
 * کاربر قبل از ارسال دقیقاً همان خطاهایی را ببیند که سرور خواهد داد.
 */
export function validateStudioDraft(draft: StudioDraft): StudioFieldErrors {
  const errors: StudioFieldErrors = { attachmentUrl: {} };

  if (!draft.title.trim()) errors.title = 'عنوان روایت را بنویس؛ بدون عنوان امکان ارسال نیست.';
  else if (draft.title.trim().length > STUDIO_LIMITS.TITLE_MAX)
    errors.title = `عنوان نمی‌تواند از ${STUDIO_LIMITS.TITLE_MAX} نویسه بیشتر باشد.`;

  if (!draft.description.trim()) errors.description = 'شرح روایت را بنویس؛ متن، جانِ روایتِ توست.';

  if (draft.attachments.length > STUDIO_LIMITS.ATTACHMENTS_MAX)
    errors.attachments = `حداکثر ${STUDIO_LIMITS.ATTACHMENTS_MAX} پیوست برای هر روایت مجاز است — همان قانونِ سرور.`;

  for (const a of draft.attachments) {
    if (!a.url.trim()) {
      errors.attachmentUrl[a.id] = 'نشانی فایل را کامل بنویس (با https:// شروع می‌شود).';
      continue;
    }
    if (!isHttpUrl(a.url)) {
      errors.attachmentUrl[a.id] =
        a.url.trim().length > STUDIO_LIMITS.URL_MAX
          ? `نشانی از ${STUDIO_LIMITS.URL_MAX} نویسه بلندتر است.`
          : 'نشانی معتبر نیست — باید با http یا https شروع شود.';
    }
  }
  return errors;
}

/** آیا فرم برای ارسال آماده است؟ (همان قانونِ اصلی — بدون جزئیاتِ پیام) */
export function isStudioSubmittable(draft: StudioDraft): boolean {
  const e = validateStudioDraft(draft);
  return !e.title && !e.description && !e.attachments && Object.keys(e.attachmentUrl).length === 0;
}

/* ───────────────────────────────────────────────────────────────── */
/*  ساختِ payload — دقیقاً به شکلِ serializerِ بک‌اند                    */
/* ───────────────────────────────────────────────────────────────── */

export interface SubmissionAttachmentPayload {
  url: string;
  media_type: StudioMediaType;
  title?: string;
  order: number;
}

export interface SubmissionPayload {
  title: string;
  description: string;
  attachments: SubmissionAttachmentPayload[];
}

/**
 * payloadِ نهاییِ POST /tabyin/me/submissions/
 *   • عنوان/شرح trim می‌شوند (آنچه کاربر دید همان می‌رسد)؛
 *   • order = ترتیبِ نمایشیِ سطرها (۰..n) — همان قراردادِ ترتیبِ بک‌اند؛
 *   • عنوانِ خالیِ پیوست حذف می‌شود (فیلد در بک‌اند اختیاری است).
 */
export function buildSubmissionPayload(draft: StudioDraft): SubmissionPayload {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    attachments: draft.attachments.slice(0, STUDIO_LIMITS.ATTACHMENTS_MAX).map((a, index) => {
      const out: SubmissionAttachmentPayload = {
        url: a.url.trim(),
        media_type: a.mediaType,
        order: index,
      };
      const t = a.title.trim();
      if (t) out.title = t;
      return out;
    }),
  };
}

/* ───────────────────────────────────────────────────────────────── */
/*  پیش‌نمایش زنده — RevayatItem برای کارتِ واقعیِ فید                  */
/* ───────────────────────────────────────────────────────────────── */

/**
 * RevayatItem مصنوعی از حالتِ فرم تا دقیقاً با کارتِ تولیدیِ فید
 * (RevayatCard) رندر شود — «آنچه می‌بینی همان است که منتشر می‌شود».
 */
export function previewItemFromDraft(draft: StudioDraft, authorName: string): RevayatItem {
  return {
    external_id: 'studio-preview',
    title: draft.title.trim(),
    description: draft.description.trim(),
    author_username: authorName,
    origin: 'user_submitted',
    source_created_at: new Date().toISOString(),
    attachments: draft.attachments
      .filter((a) => a.url.trim())
      .map((a, i) => ({ id: i + 1, url: a.url.trim(), media_type: a.mediaType })),
  };
}

/* ───────────────────────────────────────────────────────────────── */
/*  وضعیت‌های بررسی — لیبل و رنگ (submission_status از بک‌اند)          */
/* ───────────────────────────────────────────────────────────────── */

export type SubmissionStatusValue = 'pending_review' | 'approved' | 'rejected' | string;

export interface SubmissionStatusMeta {
  label: string;
  tone: 'amber' | 'emerald' | 'rose' | 'ink';
}

export function submissionStatusMeta(status: SubmissionStatusValue): SubmissionStatusMeta {
  switch (status) {
    case 'pending_review':
      return { label: 'در انتظار بررسی', tone: 'amber' };
    case 'approved':
      return { label: 'تأیید و منتشر شده', tone: 'emerald' };
    case 'rejected':
      return { label: 'بررسی شد — منتشر نشد', tone: 'rose' };
    default:
      return { label: 'نامشخص', tone: 'ink' };
  }
}

/* ───────────────────────────────────────────────────────────────── */
/*  مدل‌های پاسخِ بک‌اند — تایپ‌های مصرفیِ UI                            */
/* ───────────────────────────────────────────────────────────────── */

export interface MySubmissionItem {
  id: number;
  external_id: string;
  title: string;
  submission_status: SubmissionStatusValue;
  admin_note?: string;
  attachments_count?: number;
  created_at?: string;
  reviewed_at?: string | null;
}

export interface MySubmissionDetail extends MySubmissionItem {
  description?: string;
  attachments?: Array<{
    id: number;
    url: string;
    media_type?: StudioMediaType;
    title?: string;
  }>;
}

/** ردیفِ پیوستِ تازه با شناسه‌ی محلیِ یکتا. */
let rowSeq = 0;
export function newAttachmentRow(): AttachmentDraft {
  rowSeq += 1;
  const rid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `row-${Date.now()}-${rowSeq}`;
  return { id: rid, url: '', mediaType: 'other', typeTouched: false, title: '' };
}

/** برچسب‌های فارسیِ نوعِ رسانه (یک‌دست با واژگانِ فید: تصویر/ویدئو/صوت/متن) */
export const MEDIA_TYPE_LABELS: Record<StudioMediaType, string> = {
  image: 'تصویر',
  video: 'ویدئو',
  audio: 'صوت',
  other: 'سایر',
};
