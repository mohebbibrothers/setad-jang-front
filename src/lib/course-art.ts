/**
 * آرت‌ورکِ برندیشده‌ی قرارگاه آموزشی — پوششِ پیش‌فرضِ طراحی‌شده برای کلاس‌ها.
 *
 * چرا: تا وقتی ادمین برای کلاسی کاور/آواتار آپلود نکرده، UI به‌جای قابِ خالی
 * یک آرت‌ورکِ هم‌خانواده با زبانِ بصریِ برند (اینکِ تیره + مینت + کهربایی؛
 * همان سبکی که آلبوم‌های «اپ مدد به حرکت» و r4j دارند) نشان می‌دهد.
 *
 * قرارداد:
 *   • تصویرِ واقعیِ آپلودشده در ادمین همیشه اولویت دارد (این مقادیر فقط
 *     fallback هستند — در mapCourse با عملگر ?? تزریق می‌شوند).
 *   • اسلاگ‌های شناخته‌شده آرت‌ورک اختصاصی دارند؛ بقیه DEFAULT را می‌گیرند.
 *   • فایل‌ها در public/lms میزبان‌اند و همان‌ها برای آپلود به ادمینِ جنگو
 *     هم تحویل داده شده‌اند (پوشه‌ی lms-artwork).
 */
const THEMED_COVERS: Record<string, string> = {
  php: '/lms/covers/php.jpg',
  'جاوا-اسکریپت': '/lms/covers/javascript.jpg',
  پایتون: '/lms/covers/python.jpg',
  'کار-با-fpv': '/lms/covers/fpv.jpg',
};

export const DEFAULT_COURSE_COVER = '/lms/covers/default.jpg';
export const DEFAULT_INSTRUCTOR_AVATAR = '/lms/instructor-default.jpg';

/** کاورِ fallback بر اساس اسلاگ؛ برای اسلاگ‌های ناشناخته آرت‌ورکِ عمومی. */
export function courseCoverArt(slug: string): string {
  return THEMED_COVERS[slug] ?? DEFAULT_COURSE_COVER;
}

/* ── گالری رسانه‌ای کلاس (آلبومِ سینماییِ CampaignAlbum در صفحه‌ی اسلاگ) ── */

export type CourseMediaSlide = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

/**
 * اسلایدهای گالریِ صفحه‌ی کلاس — دوفریمِ واقعی (به درخواستِ مشتری):
 *   ۱) کاورِ کلاس (واقعی یا آرت‌ورکِ fallback)
 *   ۲) پرتره‌ی استاد (واقعی یا آرت‌ورکِ fallback)
 * اسلایدِ مشترکِ «فضای یادگیری» حذف شد — گالری فقط متعلق به خودِ کلاس است.
 * ترتیب مهم است: لانچرِ کاور از اسلایدِ ۰ شروع می‌کند و لانچرهای آواتار با
 * startIndex = slides.length - 1 مستقیم روی پرتره باز می‌شوند.
 */
export function courseMediaSlides(input: {
  title: string;
  coverUrl?: string;
  instructor: string;
  instructorAvatarUrl?: string;
}): CourseMediaSlide[] {
  const slides: CourseMediaSlide[] = [];
  if (input.coverUrl) {
    slides.push({ url: input.coverUrl, alt: `کاور کلاس ${input.title}` });
  }
  if (input.instructorAvatarUrl) {
    slides.push({ url: input.instructorAvatarUrl, alt: `تصویر ${input.instructor}` });
  }
  return slides;
}

/** ایندکسِ اسلایدِ آواتار در خروجیِ courseMediaSlides (اگر آواتار دارد). */
export function instructorSlideIndex(input: {
  coverUrl?: string;
  instructorAvatarUrl?: string;
}): number {
  if (!input.instructorAvatarUrl) return 0;
  return input.coverUrl ? 1 : 0;
}
