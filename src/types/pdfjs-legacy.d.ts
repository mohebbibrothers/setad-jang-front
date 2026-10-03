/**
 * تایپِ مسیرِ legacy بیلد pdf.js — همان API بیلد اصلی با تایپ‌های همان پکیج؛
 * تنها تفاوت، سازگاری با مرورگرهای بدون APIهای Stage-3 (Map.getOrInsertComputed) است.
 * LessonPdfViewer از همین مسیر ایمپورت می‌کند تا رندر روی کرومیومِ کمی‌قدیمی‌تر
 * و موبایل‌های کاربران بی‌صدا سفید نماند.
 */
declare module 'pdfjs-dist/legacy/build/pdf.min.mjs' {
  export * from 'pdfjs-dist';
}
