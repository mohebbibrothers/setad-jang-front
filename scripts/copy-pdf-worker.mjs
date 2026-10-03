#!/usr/bin/env node
/**
 * ورکرِ pdf.js را از پکیج به public/ کپی می‌کند تا نمایشگرِ سندِ جلسات
 * (LessonPdfViewer) بتواند آن را از مسیرِ ثابتِ /vendor/pdf.worker.min.mjs
 * بخواند — بدون CDN و کاملاً آفلاین/هم‌تراز با نسخه‌ی نصب‌شده‌ی pdfjs-dist.
 * این اسکریپت در postinstall اجرا می‌شود پس در هر دیپلوی قطعی‌سازی است.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// ورکرِ legacy با هسته‌ی legacy که LessonPdfViewer ایمپورت می‌کند جفت است —
// بیلد مدرن به Map.getOrInsertComputed نیاز دارد که در کرومیومِ کمی‌قدیمی‌تر/
// موبایل نیست و رندر بی‌صدا سفید می‌ماند.
const src = join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
const destDir = join(root, 'public', 'vendor');
const dest = join(destDir, 'pdf.worker.min.mjs');

if (!existsSync(src)) {
  // در محیط‌هایی که node_modules هنوز نصب نشده (نادر)، نصب بعدی دوباره اجرا می‌شود.
  console.warn('[copy-pdf-worker] pdfjs-dist not installed yet; skipped.');
  process.exit(0);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('[copy-pdf-worker] → public/vendor/pdf.worker.min.mjs');
