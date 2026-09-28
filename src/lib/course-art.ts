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
