import { describe, expect, it } from 'vitest';
import {
  BOUNTY_MIN_TOMAN,
  GENDER_LABELS,
  REPORTABLE_FIELD_OPTIONS,
  SOCIAL_PLATFORM_META,
  bountyFa,
  buildReportFormData,
  canonicalApiLookup,
  criminalFullName,
  isFullyRedacted,
  isReportSubmittable,
  jalaliDateFa,
  locationLine,
  normalizeGallery,
  parseTomanInput,
  pruneReportDraft,
  socialMeta,
  socialUrl,
  type CriminalDetail,
  type CriminalPhoto,
  type ReportDraftInput,
} from './r4j';

/**
 * تست‌های لایه‌ی دامنه‌ی r4j — تمرکز روی قراردادهای شکستِ بی‌صدا:
 *   • نگاشتِ ۱۰ پلتفرم اجتماعی (هندل → نشانی امن)؛
 *   • نرمال‌سازیِ گالری (primary اول + حذفِ srcِ خالی)؛
 *   • قانونِ «حداقل یک مسیر» در گزارش + ساختِ FormData (آینه‌ی multipart بک‌اند)؛
 *   • پارسِ مبلغ با ارقامِ فارسی/عربی/جداکننده؛
 *   • visibility-aware بودنِ برداشت‌ها (isFullyRedacted).
 */

/* ────────────────────────────────────────────────────────────
 * پلتفرم‌های اجتماعی — هر ۱۰ گزینه‌ی بک‌اند
 * ──────────────────────────────────────────────────────────── */
describe('socialUrl — ساختِ نشانی برای هر ۱۰ پلتفرم', () => {
  const cases: [string, string, string][] = [
    ['telegram', '@some_user', 'https://t.me/some_user'],
    ['telegram', 'some_user', 'https://t.me/some_user'],
    ['twitter_x', '@jack', 'https://x.com/jack'],
    ['instagram', 'reza.pahlavi', 'https://instagram.com/reza.pahlavi'],
    ['linkedin', 'ahmad-vahidi', 'https://linkedin.com/in/ahmad-vahidi'],
    ['facebook', 'somebody', 'https://facebook.com/somebody'],
    ['tiktok', '@dancer', 'https://tiktok.com/@dancer'],
    ['truth_social', 'realDonaldTrump', 'https://truthsocial.com/@realDonaldTrump'],
    ['youtube', '@channel', 'https://youtube.com/channel'],
    ['website', 'example.com', 'https://example.com'],
    ['other', 'bsky.app/profile/x', 'https://bsky.app/profile/x'],
  ];

  it.each(cases)('%s با «%s» → %s', (platform, handle, expected) => {
    expect(socialUrl(platform, handle)).toBe(expected);
  });

  it('هندل با http مستقیم عبور می‌کند', () => {
    expect(socialUrl('telegram', 'https://t.me/already')).toBe('https://t.me/already');
  });

  it('پلتفرمِ ناشناس → فالبکِ «سایر» با https', () => {
    expect(socialUrl('mastodon', 'mastodon.social/@x')).toBe('https://mastodon.social/@x');
    expect(socialMeta('mastodon').label).toBe(SOCIAL_PLATFORM_META.other.label);
  });
});

/* ────────────────────────────────────────────────────────────
 * locationLine — خطِ مکان با حذفِ تکراری و تهی
 * ──────────────────────────────────────────────────────────── */
describe('locationLine', () => {
  it('شهر، استان، کشور را با «،» می‌چسباند', () => {
    expect(locationLine({ city: 'تهران', province: 'تهران بزرگ', country: 'ایران' })).toBe(
      'تهران، تهران بزرگ، ایران',
    );
  });

  it('تکراری‌ها فقط یک‌بار می‌آیند (شهر = استان)', () => {
    expect(locationLine({ city: 'تهران', province: 'تهران', country: 'ایران' })).toBe(
      'تهران، ایران',
    );
  });

  it('قطعاتِ خالی/فاصله‌دار حذف می‌شوند', () => {
    expect(locationLine({ city: '  ', province: null, country: 'ایران' })).toBe('ایران');
  });

  it('همه خالی → null', () => {
    expect(locationLine({ city: null, province: '', country: null })).toBeNull();
  });
});

/* ────────────────────────────────────────────────────────────
 * تاریخ جلالی
 * ──────────────────────────────────────────────────────────── */
describe('jalaliDateFa', () => {
  it('میلادی→جلالی با ارقامِ فارسی (نوروز ۱۴۰۳)', () => {
    expect(jalaliDateFa('2024-03-20')).toBe('۱ فروردین ۱۴۰۳');
  });

  it('datetime با ساعت هم فقط با بخشِ تاریخ کار می‌کند', () => {
    expect(jalaliDateFa('1985-03-21T10:30:00Z')).toBe('۱ فروردین ۱۳۶۴');
  });

  it('ورودی تهی/خراب → null', () => {
    expect(jalaliDateFa(null)).toBeNull();
    expect(jalaliDateFa('')).toBeNull();
  });
});

/* ────────────────────────────────────────────────────────────
 * criminalFullName / bountyFa / GENDER
 * ──────────────────────────────────────────────────────────── */
describe('crime identity helpers', () => {
  it('نام+فامیل با فشرده‌سازیِ فاصله', () => {
    expect(criminalFullName({ first_name: 'Ahmad ', last_name: ' Vahidi' })).toBe('Ahmad Vahidi');
  });

  it('bountyFa جداکننده‌ی فارسی + واحد دارد', () => {
    expect(bountyFa(1_500_000)).toContain('تومان');
    expect(bountyFa(1_500_000)).toContain('۵۰۰');
  });

  it('هر سه جنسیتِ بک‌اند برچسب دارند', () => {
    expect(GENDER_LABELS.male).toBe('مرد');
    expect(GENDER_LABELS.female).toBe('زن');
    expect(GENDER_LABELS.unknown).toBe('نامشخص');
  });

  it('۱۱ فیلدِ reportable بک‌اند در گزینه‌هاست (بدون aliases — آن مسیر جداست)', () => {
    const values = REPORTABLE_FIELD_OPTIONS.map((o) => o.value);
    expect(values).toEqual([
      'first_name',
      'last_name',
      'national_code',
      'birth_date',
      'gender',
      'country',
      'province',
      'city',
      'description',
      'crimes_summary',
      'other_info',
    ]);
  });
});

/* ────────────────────────────────────────────────────────────
 * normalizeGallery — primary اول، srcِ خالی حذف
 * ──────────────────────────────────────────────────────────── */
describe('normalizeGallery', () => {
  const photo = (id: number, is_primary: boolean, image = `/media/p${id}.jpg`): CriminalPhoto => ({
    id,
    image,
    caption: '',
    is_primary,
    order: id,
  });

  it('عکسِ primary در ابتدا قرار می‌گیرد', () => {
    const items = normalizeGallery([photo(1, false), photo(2, true), photo(3, false)]);
    expect(items.map((i) => i.id)).toEqual([2, 1, 3]);
    expect(items[0].isPrimary).toBe(true);
  });

  it('عکس‌های بدون src حذف می‌شوند', () => {
    const items = normalizeGallery([photo(1, false, ''), photo(2, false)]);
    expect(items.map((i) => i.id)).toEqual([2]);
  });

  it('ورودی خالی → آرایه‌ی خالی', () => {
    expect(normalizeGallery([])).toEqual([]);
  });
});

/* ────────────────────────────────────────────────────────────
 * isFullyRedacted — تشخیصِ پرونده‌ی کاملاً محدود
 * ──────────────────────────────────────────────────────────── */
describe('isFullyRedacted', () => {
  const base = {
    national_code: null,
    birth_date: null,
    gender: null,
    country: null,
    province: null,
    city: null,
    description: null,
    crimes_summary: null,
    other_info: null,
  } as unknown as CriminalDetail;

  it('همه‌ی فیلدهای visibility خالی → true', () => {
    expect(isFullyRedacted(base)).toBe(true);
  });

  it('حتی یک فیلدِ منتشرشده → false', () => {
    expect(isFullyRedacted({ ...base, city: 'تهران' })).toBe(false);
  });

  it('رشته‌ی خالی هم «منتشرنشده» حساب می‌شود', () => {
    expect(isFullyRedacted({ ...base, description: '' })).toBe(true);
  });
});

/* ────────────────────────────────────────────────────────────
 * ReportDraft — قانونِ «حداقل یکی» + ساختِ FormData
 * ──────────────────────────────────────────────────────────── */
describe('report draft contract', () => {
  const empty: ReportDraftInput = {
    notes: '',
    field_changes: [],
    alias_suggestions: [],
    phone_suggestions: [],
    social_suggestions: [],
    attachments: [],
  };

  it('draft کاملاً خالی → قابل ارسال نیست (قانونِ validate بک‌اند)', () => {
    expect(isReportSubmittable(empty)).toBe(false);
  });

  it('فقط فاصله/خط‌جدید در یادداشت معتبر نیست', () => {
    expect(isReportSubmittable({ ...empty, notes: '   \n  ' })).toBe(false);
  });

  it('فیلدِ اصلاح با مقدارِ خالی در آستانه شمرده نمی‌شود', () => {
    expect(
      isReportSubmittable({
        ...empty,
        field_changes: [{ field_name: 'city', suggested_value: '   ' }],
      }),
    ).toBe(false);
  });

  it.each([
    ['یادداشت', { ...empty, notes: 'آخرین بار در ترکیه دیده شد' }],
    ['اصلاح فیلد', { ...empty, field_changes: [{ field_name: 'city', suggested_value: 'وان' }] }],
    ['نام مستعار', { ...empty, alias_suggestions: [{ alias: 'ابوعلی' }] }],
    ['شماره تماس', { ...empty, phone_suggestions: [{ label: '', number: '+98 912 000 0000' }] }],
    [
      'شبکه اجتماعی',
      { ...empty, social_suggestions: [{ platform: 'telegram', handle_or_url: '@somebody' }] },
    ],
  ])('فقط «%s» هم کافی است', (_label, draft) => {
    expect(isReportSubmittable(draft as ReportDraftInput)).toBe(true);
  });

  it('pruneReportDraft ورودی‌های نیمه‌پر را دور می‌ریزد', () => {
    const pruned = pruneReportDraft({
      ...empty,
      notes: '  یادداشت  ',
      alias_suggestions: [{ alias: '  ' }, { alias: 'مستعار' }],
      phone_suggestions: [{ label: 'همراه', number: '' }],
    });
    expect(pruned.notes).toBe('یادداشت');
    expect(pruned.alias_suggestions).toEqual([{ alias: 'مستعار' }]);
    expect(pruned.phone_suggestions).toEqual([]);
  });

  it('buildReportFormData: لیست‌ها JSON string‌اند و فایل‌ها با کلید attachments می‌آیند', () => {
    const file = new File(['бинар'], 'evidence.pdf', { type: 'application/pdf' });
    const form = buildReportFormData({
      ...empty,
      notes: 'سرنخ',
      field_changes: [{ field_name: 'city', suggested_value: 'تهران' }],
      alias_suggestions: [{ alias: 'ابوعلی' }],
      attachments: [file],
    });
    expect(form.get('notes')).toBe('سرنخ');
    expect(JSON.parse(String(form.get('field_changes')))).toEqual([
      { field_name: 'city', suggested_value: 'تهران' },
    ]);
    expect(JSON.parse(String(form.get('alias_suggestions')))).toEqual([{ alias: 'ابوعلی' }]);
    expect(form.getAll('attachments')).toHaveLength(1);
  });

  it('buildReportFormData با draft خالی هم لیست‌های خالیِ JSON می‌فرستد', () => {
    const form = buildReportFormData(empty);
    expect(String(form.get('field_changes'))).toBe('[]');
    expect(form.get('notes')).toBeNull();
  });
});

/* ────────────────────────────────────────────────────────────
 * canonicalApiLookup — گاردِ باگِ double-encoding در پروداکشن
 * ──────────────────────────────────────────────────────────── */
describe('canonicalApiLookup', () => {
  it('اسلاگِ فارسیِ خام دقیقاً یک لایه encode می‌گیرد', () => {
    expect(canonicalApiLookup('رضا-پهلوی')).toBe(encodeURIComponent('رضا-پهلوی'));
  });

  it('idempotent روی ورودیِ از‌پیش‌انکدشده (باگِ اسلاگ‌های یونیکد در پروداکشن)', () => {
    const once = canonicalApiLookup('رضا-پهلوی');
    expect(canonicalApiLookup(once)).toBe(once);
  });

  it('اسلاگِ ASCII بدون تغییر می‌ماند', () => {
    expect(canonicalApiLookup('ahmad-vahidi')).toBe('ahmad-vahidi');
    expect(canonicalApiLookup('criminal-7')).toBe('criminal-7');
  });

  it('دنباله‌ی % ناقص استثنا نمی‌اندازد', () => {
    expect(() => canonicalApiLookup('%ZZ')).not.toThrow();
  });
});

/* ────────────────────────────────────────────────────────────
 * parseTomanInput — ارقامِ فارسی/عربی/جداکننده/واحد
 * ──────────────────────────────────────────────────────────── */
describe('parseTomanInput', () => {
  it.each([
    ['150000', 150_000],
    ['۱۵۰۰۰۰', 150_000],
    ['١٥٠٠٠٠', 150_000], // ارقامِ عربی
    ['۱٬۵۰۰٬۰۰۰', 1_500_000], // جداکننده‌ی فارسی
    ['1,500,000', 1_500_000], // جداکننده‌ی لاتین
    ['1500000 تومان', 1_500_000], // واحد
    ['  50000  ', 50_000],
  ])('«%s» → %d', (raw, expected) => {
    expect(parseTomanInput(raw)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '۱۲.۵', '-1000', '0', 'تومان'])('«%s» → null', (raw) => {
    expect(parseTomanInput(raw)).toBeNull();
  });

  it('حداقلِ بک‌اند (۵۰٬۰۰۰) پایین‌تر از آن را «نامعتبرِ کم» می‌گیرد', () => {
    // خودِ پارسر فقط عدد می‌دهد؛ قانونِ حداقل در پنل چک می‌شود —
    // اینجا فقط ثابت می‌کنیم مقدارِ حداقل با ثابتِ اشتراکی یکی است.
    expect(parseTomanInput('۵۰٬۰۰۰')).toBe(BOUNTY_MIN_TOMAN);
  });
});
