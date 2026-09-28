'use client';

import { useEffect } from 'react';

/**
 * توریِ امانِ اسپلش — جفتِ اسکریپتِ inline در layout.
 *
 * چرا لازم است؟ اسپلش با سازوکاری از DOM حذف می‌شود که به اجرای
 * اسکریپتِ inline اتکا دارد. در پاسخ‌های RSCِ استریم‌شده‌ای که
 * برخوردار از notFound()/error داخلِ یک روتِ داینامیک‌اند (مثل
 * /lms/courses/<slugِ ناموجود> یا /r4j/<slugِ ناموجود>)، دیوِ اسپلش
 * به‌عنوان بخشی از flight data بعداً توسط React رندر می‌شود و
 * scriptهای inlineِ آن اجرا نمی‌شوند — نتیجه: سپیدبرگِ ابدیِ اسپلش
 * روی کانتنتِ زنده‌ی زیرش. در صفحاتِ عادی این کامپوننت پس از حذفِ
 * زودهنگامِ inline به‌راحتی no-op می‌ماند (عنصری پیدا نمی‌کند)، ولی
 * در سناریوی استریم‌شده نجات‌دهنده است: به‌محض mount، اگر اسپلش هنوز
 * هست با همان سیاستِ پنهان‌سازیِ نرم حذفش می‌کند (کفِ ۱۱۰۰ms نمایشِ
 * برند محفوظ).
 */
export function SplashSafety() {
  useEffect(() => {
    const kill = () => {
      const el = document.getElementById('app-splash');
      if (!el) return;
      el.classList.add('hide');
      document.documentElement.classList.remove('app-splash-lock');
      window.setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 420);
    };
    // احترام به کفِ نمایشِ برند (MIN_HOLD_MS اسکریپتِ inline = ۱۱۰۰)
    const t = window.setTimeout(kill, 1100);
    // اگر inline قبلاً کارش را کرده، این‌جا چیزی برای انجام نیست
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
