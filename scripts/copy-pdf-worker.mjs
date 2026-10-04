#!/usr/bin/env node
/**
 * دارایی‌های سمت-clientsideِ pdf.js را از پکیج به public/ کپی می‌کند تا نمایشگرِ
 * سندِ جلسات (LessonPdfViewer) همه‌چیز را از مسیرهای ثابتِ /vendor/... بخواند —
 * بدون CDN و کاملاً آفلاین/هم‌تراز با نسخه‌ی نصب‌شده‌ی pdfjs-dist.
 * این اسکریپت در postinstall اجرا می‌شود پس در هر دیپلوی قطعی‌سازی است.
 *
 * چرا فونت‌ها و cMapها هم کپی می‌شوند (ریشه‌ی «متنِ فارسیِ زشت»):
 *  • standard_fonts  → وقتی PDF فونت‌های standard-14 را embed نکرده باشد،
 *    pdf.js بدون این فایل‌ها به فونتِ سیستمیِ fallback می‌افتد و گلیف‌های لاتین/
 *    اعداد ناقص و به‌هم‌ریخته رندر می‌شوند.
 *  • cmaps (.bcmap)  → نگاشتِ یونیکدِ فونت‌های composite (همان‌هایی که در اسنادِ
 *    چاپ‌شده‌ی فارسی/عربی زیاد دیده می‌شوند)؛ بدونشان حروف جداجدا و درهم رندر می‌شوند.
 * هر دو از مسیرِ خودِ سایت سرو می‌شوند، پس هیچ وابستگیِ شبکه‌ای/اعتمادی به
 * دامنه‌ی بیگانه در زنجیره‌ی مطالعه نیست.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = join(root, 'node_modules', 'pdfjs-dist');
const vendorDir = join(root, 'public', 'vendor');

if (!existsSync(pkgDir)) {
  // در محیط‌هایی که node_modules هنوز نصب نشده (نادر)، نصب بعدی دوباره اجرا می‌شود.
  console.warn('[copy-pdf-worker] pdfjs-dist not installed yet; skipped.');
  process.exit(0);
}

// ورکرِ legacy با هسته‌ی legacy که LessonPdfViewer ایمپورت می‌کند جفت است —
// بیلد مدرن به Map.getOrInsertComputed نیاز دارد که در کرومیومِ کمی‌قدیمی‌تر/
// موبایل نیست و رندر بی‌صدا سفید می‌ماند.
copyOne(
  join(pkgDir, 'legacy', 'build', 'pdf.worker.min.mjs'),
  join(vendorDir, 'pdf.worker.min.mjs'),
  'pdf.worker.min.mjs',
);

// فونت‌های استاندارد + cMapها — پایه‌ی رندرِ تمیزِ متن در اسنادی که فونتِ
// فارسی/لاتین را embed نکرده‌اند.
copyDir(join(pkgDir, 'standard_fonts'), join(vendorDir, 'pdf-fonts'), 'pdf-fonts');
copyDir(join(pkgDir, 'cmaps'), join(vendorDir, 'pdf-cmaps'), 'pdf-cmaps');

function copyOne(src, dest, label) {
  if (!existsSync(src)) {
    console.warn(`[copy-pdf-worker] missing ${src}; skipped.`);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`[copy-pdf-worker] → public/vendor/${label}`);
}

function copyDir(srcDir, destDir, label) {
  if (!existsSync(srcDir)) {
    console.warn(`[copy-pdf-worker] missing ${srcDir}; skipped.`);
    return;
  }
  mkdirSync(destDir, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(srcDir)) {
    copyFileSync(join(srcDir, entry), join(destDir, entry));
    count += 1;
  }
  console.log(`[copy-pdf-worker] → public/vendor/${label}/ (${count} files)`);
}
