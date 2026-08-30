import type { RevayatItem } from './revayat';
import { apiFetch, resolveBrowserApiBaseUrl, type Paginated } from './api';

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
 *         └ هر مورد: url (≤۱۰۲۴ — https یا نشانی بومیِ /media/) ·
 *           media_type ∈ image|video|audio|other (پیش‌فرض other) ·
 *           title (≤۵۱۲، اختیاری) · order (عدد صحیح ≥۰، پیش‌فرض ترتیب)
 *         └ قانونِ تک‌نوعی: همه‌ی پیوست‌ها باید هم‌نوع باشند (object-level)
 *   POST /api/v1/tabyin/me/uploads/            (UserTabyinMediaUploadView)
 *     • آپلودِ مستقیم روی مدیاسرورِ بعثت (/media/public/tabyin/users/…)
 *     • خروجی: url · name · size_bytes · mime · media_type · dims · duration
 *     • مسیرِ پایه از resolveBrowserApiBaseUrl (lib/api) — هرگز هاردکدِ
 *       /api/proxy نیست (ریشهٔ باگِ ۴۰۴ پروداکشن: Nginx روی besat.me هر
 *       /api/* را مستقیم به Django می‌فرستد و پراکسیِ Next را baypass
 *       می‌کند).
 *   GET  /api/v1/tabyin/uploads/config/        (TabyinUploadConfigView)
 *   GET/PATCH/DELETE /api/v1/tabyin/me/submissions/<id>/
 *     • مدیریتِ کاملِ «روایت‌های من»: جزئیات، ویرایش (با قانونِ بازگشت
 *       به صفِ بررسی پس از هر ویرایشِ روی روایتِ بررسی‌شده) و حذفِ کامل
 *       که بلافاصله کش‌های عمومی و ISR فرانت را باطل می‌کند.
 *   نتیجه‌ی ثبت: با submission_status=pending_review و is_active=false
 *   ثبت می‌شود و پس از تأیید مدیر منتشر می‌شود (services.submit_user_content).
 *   نشانی‌های پیوستِ بیرونی بعداً توسط بک‌اند روی سرورِ خودمان mirror
 *   می‌شوند (TABYIN_MIRROR_*) تا مرگِ لینک، روایت را نکشد.
 *   نام نویسنده را بک‌اند از حساب کاربر می‌گیرد (full_name ← ایمیل ←
 *   موبایل) — یعنی کاربر نمی‌تواند آن را دستکاری کند و UI هم آن را
 *   ویرایش‌پذیر نمی‌کند.
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

/** ابعادِ رسانه (پیکسل) — متادیتای جزئیِ قراردادِ محتوانگار */
export interface MediaDims {
  width: number;
  height: number;
}

/** متای فایلِ آپلودشده روی مدیاسرور — خروجیِ me/uploads/ */
export interface UploadedFileMeta {
  name: string;
  sizeBytes: number;
  mime: string;
  dims?: MediaDims | null;
  duration?: number | null;
}

export interface AttachmentDraft {
  /** شناسه‌ی محلیِ سطر (کلیدِ React — هرگز به بک‌اند نمی‌رود) */
  id: string;
  /** روشِ افزودن: نشانیِ تحتِ وب یا آپلودِ مستقیم روی سرورِ بعثت */
  source: 'url' | 'upload';
  url: string;
  mediaType: StudioMediaType;
  /** آیا mediaType به‌دستِ کاربر تغییر داده شده؟ اگر نه، بوش‌گرِ خودکار مختار است. */
  typeTouched: boolean;
  title: string;
  /** متای فایلِ آپلودیِ موفق (فقط در حالتِ upload) — به بک‌اند نمی‌رود */
  file?: UploadedFileMeta;
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
  // svg آگاهانه در فهرستِ آپلود نیست (امنیت) — در نشانی به‌عنوان تصویر بویده می‌شود
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

/** استخراجِ امنِ پسوند از URL/نام‌فایل (query/hash هرگز پسوند نیست) */
function extFromName(name: string): string | null {
  const clean = name.split(/[?#]/)[0] ?? '';
  const dot = clean.lastIndexOf('.');
  if (dot < 0) return null;
  return clean.slice(dot + 1).toLowerCase() || null;
}

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
  const ext = extFromName(path);
  return ext ? (EXT_TO_TYPE[ext] ?? null) : null;
}

/** بوش‌گرِ نوع از روی نامِ فایلِ انتخابی (حالتِ آپلود) */
export function sniffMediaTypeFromFilename(name: string): StudioMediaType {
  const ext = extFromName(name || '');
  return ext ? (EXT_TO_TYPE[ext] ?? 'other') : 'other';
}

/* ───────────────────────────────────────────────────────────────── */
/*  نشانی‌های بومیِ مدیاسرور — حاصلِ آپلود یا آینه‌ی بک‌اند               */
/* ───────────────────────────────────────────────────────────────── */

/**
 * آیا نشانی، مدیای خودمان است؟ — مسیرِ نسبیِ /media/… یا نشانیِ مطلقِ
 * روی هاستِ بعثت با مسیرِ /media/. دقیقاً هم‌راستا با validate_url بک‌اند.
 */
export function isLocalMediaUrl(raw: string): boolean {
  const v = (raw || '').trim();
  if (!v) return false;
  if (v.startsWith('/media/') || v.startsWith('media/')) return true;
  try {
    const u = new URL(v);
    if (!u.pathname.startsWith('/media/')) return false;
    const h = u.hostname.toLowerCase();
    return (
      h === 'besat.me' ||
      h === 'www.besat.me' ||
      h === 'cdn.besat.me' ||
      h === 'localhost' ||
      h === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

/**
 * نشانیِ قابل‌قبولِ پیوست: http/https سالم یا نشانیِ بومیِ /media/.
 * (لینک‌های ممنوعه‌ی تلگرام/ایتا/… مخصوصِ «نشانیِ خبر» است نه پیوست.)
 */
export function isAcceptableAttachmentUrl(raw: string): boolean {
  const v = (raw || '').trim();
  if (!v) return false;
  if (isLocalMediaUrl(v)) return true;
  return isHttpUrl(v);
}

/* ───────────────────────────────────────────────────────────────── */
/*  قفلِ تک‌نوعیِ روایت — آینه‌ی object-level validationِ بک‌اند        */
/* ───────────────────────────────────────────────────────────────── */

/** نوعِ مؤثرِ یک سطر: فایلِ آپلودی > انتخابِ دستی > بو از نشانی > مقدارِ فعلی */
export function effectiveMediaTypeOf(row: AttachmentDraft): StudioMediaType {
  if (row.file?.mime) {
    if (row.file.mime.startsWith('image/')) return 'image';
    if (row.file.mime.startsWith('video/')) return 'video';
    if (row.file.mime.startsWith('audio/')) return 'audio';
    return 'other';
  }
  if (row.file) return sniffMediaTypeFromFilename(row.file.name);
  if (row.typeTouched) return row.mediaType;
  const sniffed = sniffMediaTypeFromUrl(row.url);
  return sniffed ?? row.mediaType;
}

/**
 * آیا این سطر «نوع‌دار» است و می‌تواند قفلِ روایت را تعریف کند؟
 * نشانیِ بی‌بو و نیمه‌کاره قفل نمی‌سازد تا کاربر اسیرِ اشتباهِ تایپی نشود.
 */
export function isTypeDefiningRow(row: AttachmentDraft): boolean {
  if (row.file) return true;
  if (!row.url.trim()) return false;
  if (row.typeTouched) return true;
  return sniffMediaTypeFromUrl(row.url) != null;
}

/** قفلِ نوعِ روایت = نوعِ اولین سطرِ نوع‌دار؛ null یعنی هنوز آزاد */
export function lockedMediaTypeOf(rows: AttachmentDraft[]): StudioMediaType | null {
  for (const row of rows) {
    if (!isTypeDefiningRow(row)) continue;
    return effectiveMediaTypeOf(row);
  }
  return null;
}

/** آیا ترکیبِ انواع در پیوست‌ها دیده می‌شود؟ (خطای object-level بک‌اند) */
export function hasMixedMediaTypes(rows: AttachmentDraft[]): boolean {
  let first: StudioMediaType | null = null;
  for (const row of rows) {
    if (!isTypeDefiningRow(row)) continue;
    const t = effectiveMediaTypeOf(row);
    if (first == null) first = t;
    else if (t !== first) return true;
  }
  return false;
}

/** آیا نشانیِ این سطر با قفلِ فعلی ناسازگار است؟ (انتخابِ دستیِ هم‌نوع معاف است) */
export function urlConflictsWithLock(
  row: AttachmentDraft,
  locked: StudioMediaType | null,
): boolean {
  if (!locked || row.file) return false;
  if (!row.url.trim()) return false;
  if (row.typeTouched && row.mediaType === locked) return false;
  const sniffed = sniffMediaTypeFromUrl(row.url);
  if (sniffed == null) return false;
  return sniffed !== locked;
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

/** پیامِ قراردادِ تک‌نوعی — عیناً همان متنِ بک‌اند تا تجربه یک‌دست بماند */
export const HOMOGENEOUS_TYPES_MESSAGE =
  'هر روایت فقط یک نوع رسانه می‌پذیرد؛ همه‌ی پیوست‌ها باید هم‌نوع باشند (همه تصویر یا همه ویدئو یا همه صوت یا همه سایر).';

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
  else if (hasMixedMediaTypes(draft.attachments)) errors.attachments = HOMOGENEOUS_TYPES_MESSAGE;

  const locked = lockedMediaTypeOf(draft.attachments);
  for (const a of draft.attachments) {
    // حالتِ آپلود: فایل باید انتخاب و آپلودش کامل شده باشد
    if (a.source === 'upload') {
      if (!a.url.trim()) {
        errors.attachmentUrl[a.id] = 'فایل را انتخاب کن و صبر کن تا آپلودش روی سرور کامل شود.';
        continue;
      }
      if (!isLocalMediaUrl(a.url)) {
        errors.attachmentUrl[a.id] = 'نشانیِ فایلِ آپلودشده باید از مدیاسرورِ بعثت باشد.';
        continue;
      }
    } else {
      // حالتِ نشانی: https سالم یا نشانیِ بومیِ /media/
      if (!a.url.trim()) {
        errors.attachmentUrl[a.id] = 'نشانی فایل را کامل بنویس (با https:// شروع می‌شود).';
        continue;
      }
      if (!isAcceptableAttachmentUrl(a.url)) {
        errors.attachmentUrl[a.id] =
          a.url.trim().length > STUDIO_LIMITS.URL_MAX
            ? `نشانی از ${STUDIO_LIMITS.URL_MAX} نویسه بلندتر است.`
            : 'نشانی معتبر نیست — باید با http یا https شروع شود.';
        continue;
      }
    }
    // قانونِ تازه‌ی سخت‌گیرانه‌ی سرور: اگر پسوندِ نشانی قابل‌تشخیص است،
    // انتخابِ دستیِ ناسازگار با آن پذیرفته نیست (ردِ ۴۰۰ بک‌اند). نشانیِ
    // بدونِ پسوندِ شناخته‌شده همچنان به انتخابِ کاربر اعتماد می‌کند.
    if (a.source !== 'upload' && a.typeTouched) {
      const sniffed = sniffMediaTypeFromUrl(a.url);
      if (sniffed != null && sniffed !== a.mediaType) {
        errors.attachmentUrl[a.id] =
          `پسوندِ این نشانی «${MEDIA_TYPE_LABELS[sniffed]}» است ولی نوع را «${MEDIA_TYPE_LABELS[a.mediaType]}» انتخاب کرده‌ای — نوع را همان چیزی بگذار که فایل واقعاً هست.`;
        continue;
      }
    }
    if (urlConflictsWithLock(a, locked)) {
      errors.attachmentUrl[a.id] =
        `این پیوست با نوعِ روایت (${MEDIA_TYPE_LABELS[locked ?? 'other']}) هم‌خوانی ندارد؛ همه باید هم‌نوع باشند.`;
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
 *   • عنوانِ خالیِ پیوست حذف می‌شود (فیلد در بک‌اند اختیاری است)؛
 *   • فیلدهای داخلی (source/file/typeTouched) هرگز به بک‌اند نمی‌رسد.
 */
export function buildSubmissionPayload(draft: StudioDraft): SubmissionPayload {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    attachments: draft.attachments.slice(0, STUDIO_LIMITS.ATTACHMENTS_MAX).map((a, index) => {
      const out: SubmissionAttachmentPayload = {
        url: a.url.trim(),
        media_type: effectiveMediaTypeOf(a),
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
 * (RevayatCard) رندر شود — «آنچه می‌نویسی همان است که منتشر می‌شود».
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
      .map((a, i) => ({
        id: i + 1,
        url: a.url.trim(),
        media_type: effectiveMediaTypeOf(a),
      })),
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

/** پیوستِ برگشتی از جزئیاتِ روایت — آینه‌ی UserTabyinSubmissionAttachmentSerializer */
export interface MySubmissionAttachment {
  id: number;
  url: string;
  media_type?: StudioMediaType;
  media_type_display?: string;
  size?: string;
  duration?: number;
  file_size?: number;
  title?: string;
  order?: number;
  origin_url?: string;
  mirror_status?: 'none' | 'pending' | 'mirrored' | 'failed' | string;
  mirror_status_display?: string;
  mime_type?: string;
}

export interface MySubmissionDetail extends MySubmissionItem {
  description?: string;
  updated_at?: string;
  attachments?: MySubmissionAttachment[];
}

/** ردیفِ پیوستِ تازه با شناسه‌ی محلیِ یکتا؛ نوعِ ارثی برای قفلِ تک‌نوعی. */
let rowSeq = 0;
export function newAttachmentRow(inheritMediaType?: StudioMediaType | null): AttachmentDraft {
  rowSeq += 1;
  const rid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `row-${Date.now()}-${rowSeq}`;
  return {
    id: rid,
    source: 'url',
    url: '',
    mediaType: inheritMediaType ?? 'other',
    typeTouched: inheritMediaType != null,
    title: '',
  };
}

/** برچسب‌های فارسیِ نوعِ رسانه (یک‌دست با واژگانِ فید: تصویر/ویدئو/صوت/متن) */
export const MEDIA_TYPE_LABELS: Record<StudioMediaType, string> = {
  image: 'تصویر',
  video: 'ویدئو',
  audio: 'صوت',
  other: 'سایر',
};

/* ───────────────────────────────────────────────────────────────── */
/*  مهاجرتِ پیش‌نویس‌های قدیمیِ localStorage (قبل از source/file)        */
/* ───────────────────────────────────────────────────────────────── */

export function migrateAttachmentRow(raw: unknown): AttachmentDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<AttachmentDraft> & { id?: unknown };
  if (typeof r.url !== 'string') return null;
  const mediaType: StudioMediaType =
    r.mediaType === 'image' || r.mediaType === 'video' || r.mediaType === 'audio'
      ? r.mediaType
      : 'other';
  /* پیش‌نویس‌های قدیمیِ فاقد source: نشانیِ بومیِ /media/ به حالتِ آپلود می‌رود */
  const source: 'url' | 'upload' =
    r.source === 'upload' || (r.source !== 'url' && isLocalMediaUrl(r.url)) ? 'upload' : 'url';
  return {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    source,
    url: r.url,
    mediaType,
    typeTouched: Boolean(r.typeTouched) || mediaType !== 'other',
    title: typeof r.title === 'string' ? r.title : '',
    file:
      r.file && typeof r.file === 'object' && typeof (r.file as UploadedFileMeta).name === 'string'
        ? (r.file as UploadedFileMeta)
        : undefined,
  };
}

/* ───────────────────────────────────────────────────────────────── */
/*  پیکربندیِ آپلود — آینه‌ی GET /tabyin/uploads/config/                  */
/* ───────────────────────────────────────────────────────────────── */

export interface StudioUploadConfig {
  maxAttachments: number;
  extensions: Record<StudioMediaType, string[]>;
  maxMb: Record<StudioMediaType, number>;
  labels: Record<StudioMediaType, string>;
}

/** مقادیرِ پیش‌فرض — دقیقاً همان fallbackِ settings بک‌اند */
export const STUDIO_UPLOAD_FALLBACK: StudioUploadConfig = {
  maxAttachments: STUDIO_LIMITS.ATTACHMENTS_MAX,
  extensions: {
    image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp'],
    video: ['mp4', 'webm', 'mov', 'm4v', 'mkv'],
    audio: ['mp3', 'ogg', 'oga', 'wav', 'm4a', 'aac', 'flac'],
    other: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt'],
  },
  maxMb: { image: 10, video: 100, audio: 30, other: 25 },
  labels: { image: 'تصویری', video: 'ویدئویی', audio: 'صوتی', other: 'سایر' },
};

/** نرمال‌سازیِ امنِ پاسخِ سرور؛ هر بخشِ خراب با پیش‌فرض پر می‌شود */
export function normalizeStudioUploadConfig(raw: unknown): StudioUploadConfig {
  const fb = STUDIO_UPLOAD_FALLBACK;
  if (!raw || typeof raw !== 'object') return fb;
  const r = raw as Record<string, unknown>;
  const num = (obj: unknown, key: string, def: number): number => {
    const v = obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : def;
  };
  const list = (obj: unknown, key: string, def: string[]): string[] => {
    const v = obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined;
    return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x)
      ? (v as string[])
      : def;
  };
  const str = (obj: unknown, key: string, def: string): string => {
    const v = obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined;
    return typeof v === 'string' && v ? v : def;
  };
  const mbRaw = r.max_mb ?? r.maxMb;
  const extsRaw = r.extensions;
  const labelsRaw = r.labels;
  return {
    maxAttachments: num(r, 'max_attachments', fb.maxAttachments),
    extensions: {
      image: list(extsRaw, 'image', fb.extensions.image),
      video: list(extsRaw, 'video', fb.extensions.video),
      audio: list(extsRaw, 'audio', fb.extensions.audio),
      other: list(extsRaw, 'other', fb.extensions.other),
    },
    maxMb: {
      image: num(mbRaw, 'image', fb.maxMb.image),
      video: num(mbRaw, 'video', fb.maxMb.video),
      audio: num(mbRaw, 'audio', fb.maxMb.audio),
      other: num(mbRaw, 'other', fb.maxMb.other),
    },
    labels: {
      image: str(labelsRaw, 'image', fb.labels.image),
      video: str(labelsRaw, 'video', fb.labels.video),
      audio: str(labelsRaw, 'audio', fb.labels.audio),
      other: str(labelsRaw, 'other', fb.labels.other),
    },
  };
}

/** رشته‌ی accept برای input با توجه به قفلِ نوع */
export function acceptForType(
  locked: StudioMediaType | null,
  config?: StudioUploadConfig | null,
): string {
  const cfg = config ?? STUDIO_UPLOAD_FALLBACK;
  const extList = (t: StudioMediaType) => cfg.extensions[t].map((e) => `.${e}`);
  if (locked) {
    const mime = locked === 'other' ? 'application/*' : `${locked}/*`;
    return [...extList(locked), mime].join(',');
  }
  const all = (['image', 'video', 'audio', 'other'] as StudioMediaType[]).flatMap(extList);
  return all.join(',');
}

export function formatBytesFa(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const fa = (n: string) => n.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]).replace('.', '٫');
  if (bytes < 1024) return `${fa(String(Math.round(bytes)))} بایت`;
  if (bytes < 1024 * 1024) return `${fa((bytes / 1024).toFixed(1).replace(/\.0$/, ''))} کیلوبایت`;
  return `${fa((bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, ''))} مگابایت`;
}

/* ───────────────────────────────────────────────────────────────── */
/*  آپلودِ مستقیم — POST /tabyin/me/uploads/ با پیشرفتِ واقعی (XHR)      */
/* ───────────────────────────────────────────────────────────────── */

export interface StudioUploadResult {
  url: string;
  name: string;
  sizeBytes: number;
  mime: string;
  mediaType: StudioMediaType;
  dims?: MediaDims | null;
  duration?: number | null;
}

export class StudioUploadError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'StudioUploadError';
    this.status = status;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any -- پاسخِ داینامیکِ بک‌اند */
function unwrapEnvelope(body: any): any {
  if (body && typeof body === 'object' && body.data && typeof body.data === 'object') {
    return body.data;
  }
  return body;
}

function parseUploadResponse(body: unknown): StudioUploadResult {
  const d: Record<string, any> = unwrapEnvelope(body) ?? {};
  const url = typeof d.url === 'string' ? d.url : '';
  if (!url) throw new StudioUploadError('پاسخِ آپلود نشانیِ معتبری نداشت؛ دوباره تلاش کن.');
  const mt =
    d.media_type === 'image' || d.media_type === 'video' || d.media_type === 'audio'
      ? (d.media_type as StudioMediaType)
      : 'other';
  const dims: MediaDims | null =
    d.dims && typeof d.dims === 'object'
      ? {
          width: Number((d.dims as MediaDims).width) || 0,
          height: Number((d.dims as MediaDims).height) || 0,
        }
      : typeof d.width === 'number' && typeof d.height === 'number'
        ? { width: d.width, height: d.height }
        : null;
  return {
    url,
    name: typeof d.name === 'string' ? d.name : '',
    sizeBytes: Number(d.size_bytes ?? d.sizeBytes ?? d.file_size ?? 0) || 0,
    mime: typeof d.mime === 'string' ? d.mime : typeof d.mime_type === 'string' ? d.mime_type : '',
    mediaType: mt,
    dims,
    duration: typeof d.duration === 'number' ? d.duration : null,
  };
}

/**
 * آپلودِ امنِ فایل به مدیاسرورِ بعثت:
 *   • هدرِ JWT با یک‌بارِ رفرش و تلاشِ مجدد هنگام ۴۰۱ (قراردادِ apiFetch)؛
 *   • پیشرفتِ واقعیِ آپلود از طریق xhr.upload؛
 *   • لغو از طریق AbortController (UI و شبکه با هم قطع می‌شوند).
 * مسیرِ پایه از resolveBaseUrlِ قراردادِ مرکزی گرفته می‌شود تا در هر
 * محیط (پراکسیِ next یا API مستقیم) درست کار کند.
 */
export function uploadStudioFile(opts: {
  file: File;
  onProgress: (percent: number) => void;
  registerAbort: (controller: AbortController) => void;
}): Promise<StudioUploadResult> {
  const { file, onProgress, registerAbort } = opts;

  // مسیرِ پایه از resolveBaseUrlِ قراردادِ مرکزی (lib/api) می‌آید — همان
  // منطقی که apiFetch برای هر call دیگر اعمال می‌کند: روی besat.me که
  // Nginx هر /api/* را مستقیم به Django می‌فرستد، «/api/v1» بازمی‌گردد و
  // فقط وقتی میزبانِ API با میزبانِ صفحه فرق کند از پراکسیِ Next
  // («/api/proxy») عبور می‌کنیم. هاردکدِ «/api/proxy» در اینجا ریشهٔ
  // باگِ ۴۰۴ آپلود روی پروداکشن بود.
  const resolveBase = (): string => resolveBrowserApiBaseUrl();

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    registerAbort(controller);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${resolveBase()}/tabyin/me/uploads/`, true);
    xhr.responseType = 'text';
    xhr.setRequestHeader('Accept', 'application/json');

    // توکن از همان ذخیره‌ی قراردادِ auth خوانده می‌شود — apiFetch با
    // FormData برای رفرش خودکار ساخته نشده، پس اینجا یک‌بار رفرشِ
    // دستی هنگام ۴۰۱ را خودمان با apiFetch انجام می‌دهیم.
    const applyAuth = async (): Promise<void> => {
      const { getAccessToken, refreshAccessToken } = await import('./auth-tokens');
      let token = getAccessToken();
      if (!token) token = await refreshAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    };
    const finish401Retry = async (): Promise<boolean> => {
      const { refreshAccessToken } = await import('./auth-tokens');
      const token = await refreshAccessToken().catch(() => null);
      if (!token) {
        reject(new StudioUploadError('نشستت منقضی شده؛ دوباره وارد شو و فایل را بفرست.', 401));
        return false;
      }
      // تلاشِ دوم با توکنِ تازه — Promiseِ تازه
      try {
        const retryResult = await new Promise<StudioUploadResult>((res2, rej2) => {
          const xhr2 = new XMLHttpRequest();
          xhr2.open('POST', `${resolveBase()}/tabyin/me/uploads/`, true);
          xhr2.responseType = 'text';
          xhr2.setRequestHeader('Accept', 'application/json');
          xhr2.setRequestHeader('Authorization', `Bearer ${token}`);
          controller.signal.addEventListener('abort', () => xhr2.abort(), { once: true });
          xhr2.upload.onprogress = (ev) => {
            if (ev.lengthComputable && ev.total > 0)
              onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
          };
          xhr2.onload = () => {
            let body2: unknown = null;
            try {
              body2 = xhr2.responseText ? JSON.parse(xhr2.responseText) : null;
            } catch {
              body2 = null;
            }
            if (xhr2.status >= 200 && xhr2.status < 300) {
              try {
                onProgress(100);
                res2(parseUploadResponse(body2));
              } catch (e2) {
                rej2(e2);
              }
              return;
            }
            rej2(
              new StudioUploadError(
                (body2 as { detail?: string } | null)?.detail ||
                  'آپلود ناموفق بود؛ دوباره تلاش کن.',
                xhr2.status,
              ),
            );
          };
          xhr2.onerror = () =>
            rej2(new StudioUploadError('خطای شبکه هنگام آپلود؛ اتصال را بررسی کن.'));
          xhr2.onabort = () => rej2(new StudioUploadError('آپلود لغو شد.', 0));
          const fd2 = new FormData();
          fd2.append('file', file);
          xhr2.send(fd2);
        });
        onProgress(100);
        resolve(retryResult);
        return true;
      } catch (e3) {
        reject(e3);
        return false;
      }
    };

    controller.signal.addEventListener(
      'abort',
      () => {
        try {
          xhr.abort();
        } catch {
          /* no-op */
        }
      },
      { once: true },
    );

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0)
        onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
    };
    xhr.onload = () => {
      if (controller.signal.aborted) return;
      if (xhr.status === 401) {
        void finish401Retry();
        return;
      }
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          onProgress(100);
          resolve(parseUploadResponse(body));
        } catch (err) {
          reject(err);
        }
        return;
      }
      const b = body as { detail?: string; error?: string; message?: string } | null;
      const msg =
        b?.detail ||
        b?.error ||
        b?.message ||
        (xhr.status === 413
          ? 'حجم فایل از سقفِ مجاز بیشتر است.'
          : xhr.status === 429
            ? 'کمی آهسته‌تر! چند لحظه‌ی دیگر دوباره تلاش کن.'
            : 'آپلود ناموفق بود؛ دوباره تلاش کن.');
      reject(new StudioUploadError(msg, xhr.status));
    };
    xhr.onerror = () => {
      if (controller.signal.aborted) return;
      reject(new StudioUploadError('خطای شبکه هنگام آپلود؛ اتصال را بررسی کن.'));
    };
    xhr.onabort = () => reject(new StudioUploadError('آپلود لغو شد.', 0));

    void applyAuth()
      .then(() => {
        const fd = new FormData();
        fd.append('file', file);
        xhr.send(fd);
      })
      .catch(() =>
        reject(new StudioUploadError('نشستِ امن برقرار نشد؛ دوباره وارد حسابت شو.', 401)),
      );
  });
}

/* ── دریافتِ تنظیماتِ آپلود (عمومی — بدون احراز هویت) ── */
export async function fetchStudioUploadConfig(): Promise<StudioUploadConfig> {
  try {
    const raw = await apiFetch<unknown>('/tabyin/uploads/config/', {
      skipAuth: true,
      skipRefresh: true,
    });
    return normalizeStudioUploadConfig(raw);
  } catch {
    // آفلاین/خطا — تجربه با پیش‌فرض‌های قرارداد ادامه می‌یابد
    return STUDIO_UPLOAD_FALLBACK;
  }
}

/* ───────────────────────────────────────────────────────────────── */
/*  «روایت‌های من» — مدیریتِ کامل (مشاهده/ویرایش/حذف)                  */
/* ───────────────────────────────────────────────────────────────── */

/** یک صفحه از فهرستِ روایت‌های کاربر — GET /tabyin/me/submissions/ */
export async function fetchMySubmissionsPage(
  page: number,
  pageSize = 50,
): Promise<Paginated<MySubmissionItem>> {
  const data = await apiFetch<Paginated<MySubmissionItem>>(
    `/tabyin/me/submissions/?page=${page}&page_size=${pageSize}`,
  );
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    count: Number(data?.count) || 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

/**
 * همه‌ی روایت‌های کاربر (صفحه‌به‌صفحه تا ته) — برای آمار و نمایشِ کاملِ
 * داشبورد «روایت‌های من». سقفِ صفحه امانتِ سمتِ کاربر عادی بیش از حدِ
 * کافی است و حلقه، جلوی هر خطای بین‌راهی می‌ایستد.
 */
export const MY_SUBMISSIONS_MAX_PAGES = 20;
export async function fetchAllMySubmissions(
  pageSize = 50,
): Promise<{ items: MySubmissionItem[]; total: number }> {
  const items: MySubmissionItem[] = [];
  let total = 0;
  for (let page = 1; page <= MY_SUBMISSIONS_MAX_PAGES; page += 1) {
    const data = await fetchMySubmissionsPage(page, pageSize);
    if (page === 1) total = data.count;
    items.push(...data.results);
    if (!data.next || data.results.length === 0) break;
  }
  return { items, total };
}

/** جزئیاتِ کاملِ یک روایت — GET /tabyin/me/submissions/<id>/ */
export function fetchMySubmissionDetail(id: number): Promise<MySubmissionDetail> {
  return apiFetch<MySubmissionDetail>(`/tabyin/me/submissions/${id}/`);
}

export interface UpdateMySubmissionPayload {
  title?: string;
  description?: string;
  /** اگر بفرستی، فهرستِ کاملِ جدیدِ پیوست‌هاست (replace-all) */
  attachments?: SubmissionAttachmentPayload[];
}

/** ویرایشِ روایت — PATCH /tabyin/me/submissions/<id>/ */
export function updateMySubmission(
  id: number,
  payload: UpdateMySubmissionPayload,
): Promise<MySubmissionDetail> {
  return apiFetch<MySubmissionDetail>(`/tabyin/me/submissions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** حذفِ کاملِ روایت — DELETE /tabyin/me/submissions/<id>/ */
export function deleteMySubmission(id: number): Promise<unknown> {
  return apiFetch<unknown>(`/tabyin/me/submissions/${id}/`, { method: 'DELETE' });
}

/** هیدراته‌کردنِ پیوست‌های موجودِ یک روایت به ردیف‌های قابل‌ویرایشِ استودیو */
export function attachmentRowFromDetail(att: MySubmissionAttachment): AttachmentDraft {
  const local = isLocalMediaUrl(att.url || '');
  const mediaType: StudioMediaType =
    att.media_type === 'image' || att.media_type === 'video' || att.media_type === 'audio'
      ? att.media_type
      : 'other';
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `row-${Date.now()}-${att.id}`,
    source: local ? 'upload' : 'url',
    url: typeof att.url === 'string' ? att.url : '',
    mediaType,
    // نوعِ سرور معتبر است: با typeTouched=true بوش‌گرِ خودکار دست نمی‌زند
    typeTouched: true,
    title: typeof att.title === 'string' ? att.title : '',
    file: local
      ? {
          name: att.url.split('/').filter(Boolean).pop() ?? '',
          sizeBytes: Number(att.file_size) || 0,
          mime: att.mime_type || '',
          duration: typeof att.duration === 'number' ? att.duration : null,
        }
      : undefined,
  };
}

/** ساختِ payloadِ ویرایش از پیش‌نویسِ استودیو — همان قراردادِ ثبت */
export function buildUpdatePayload(draft: StudioDraft): UpdateMySubmissionPayload {
  const full = buildSubmissionPayload(draft);
  return {
    title: full.title,
    description: full.description,
    attachments: full.attachments,
  };
}

/** بهترین برچسبِ ملکِ آینه برای چیپِ وضعیت در «روایت‌های من» */
export function mirrorStatusMeta(status?: string): {
  label: string;
  tone: 'ok' | 'wait' | 'bad' | 'ink';
} {
  switch (status) {
    case 'mirrored':
      return { label: 'روی سرور بعثت', tone: 'ok' };
    case 'pending':
      return { label: 'در صف نگه‌داشت روی سرور', tone: 'wait' };
    case 'failed':
      return { label: 'نگه‌داشت ناموفق — نشانی اصلی فعال است', tone: 'bad' };
    case 'none':
      return { label: 'بدون نیاز به نگه‌داشت', tone: 'ink' };
    default:
      return { label: '', tone: 'ink' };
  }
}
