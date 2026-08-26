/**
 * ═══════════════════════════════════════════════════════════════════
 * popover-placement — جای‌گذاریِ هوشمندِ پاپ‌اوور (pure / بدون DOM).
 *
 * چرا؟ منوی حساب در دو بسترِ متفاوت سوار می‌شود: هدرِ چسبان (تریگر به
 * لبه‌ی چپِ ویوپورت) و کفِ شیتِ موبایل (تریگر به کفِ ویوپورت). هیچ
 * لنگرِ ثابتی برای هر دو درست نیست: وسط‌چین از لبه بیرون می‌زد
 * (گزارشِ کارفرما) و top-anchored در کفِ شیت زیرِ صفحه می‌افتاد.
 * راهِ استاندارد (الگوی Floating UI): از rectِ واقعیِ تریگر و ابعادِ
 * ویوپورت، دو تصمیمِ مکانیک گرفته می‌شود —
 *
 *   ۱) سمتِ بازشو (side): پایین ترجیح دارد؛ اگر جا نبود و بالا
 *      جادارتر بود → بالا (auto-flip). معیارِ «جا داشتن» با یک
 *      تخمینِ محافظه‌کارانه‌ی ارتفاعِ منو سنجیده می‌شود.
 *   ۲) اصلاحِ افقی (offsetX): لبه‌ی چپِ منو در بازه‌ی
 *      [gutter, vw − gutter − menuWidth] گیر می‌افتد. نتیجه به‌صورتِ
 *      دلتایِ نسبت به لبه‌ی چپِ تریگر برمی‌گردد تا روی همان لایه‌ی
 *      absoluteِ معمول (left) سوار شود — بدون position:fixed.
 *
 * خروجیِ سوم (caretX): موقعیتِ افقیِ نوکِ فلِّشِ کوچکِ منو نسبت به
 * لبه‌ی چپِ منو، طوری که دقیقاً زیر مرکزِ تریگر بماند.
 * ═══════════════════════════════════════════════════════════════════
 */

export interface PopoverAnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export interface PopoverViewport {
  width: number;
  height: number;
}

export interface PopoverPlacement {
  /** سمتِ بازشو: down = زیرِ تریگر، up = بالایِ تریگر */
  side: 'down' | 'up';
  /** اصلاحِ افقی (px) برای لایه‌ی absolute نسبت به لبه‌ی چپِ تریگر */
  offsetX: number;
  /** فاصله‌ی چپِ نوکِ فلِّش از لبه‌ی چپِ منو (px) */
  caretX: number;
}

/** تخمینِ محافظه‌کارانه‌ی ارتفاعِ منو برای تصمیمِ flip (کمی بیشتر از واقع) */
export const POPOVER_MENU_HEIGHT_ESTIMATE = 260;

const CARET_SIZE = 12; // h-3 w-3

export function computePopoverPlacement(opts: {
  anchor: PopoverAnchorRect;
  viewport: PopoverViewport;
  /** پهنای واقعیِ منو (px) — برای منوی تمام‌عرض، عرضِ خودِ تریگر */
  menuWidth: number;
  menuHeight?: number;
  /** فاصله‌ی عمودیِ منو از تریگر */
  gap?: number;
  /** حاشیه‌ی امن از لبه‌های ویوپورت */
  gutter?: number;
}): PopoverPlacement {
  const gap = opts.gap ?? 10;
  const gutter = opts.gutter ?? 12;
  const menuHeight = opts.menuHeight ?? POPOVER_MENU_HEIGHT_ESTIMATE;
  const menuWidth = Math.max(0, opts.menuWidth);

  /* ── سمتِ بازشو ── */
  const below = opts.viewport.height - opts.anchor.bottom;
  const above = opts.anchor.top;
  // پایین ترجیح دارد؛ فورس به بالا فقط وقتی پایین جا نیست و بالا جادارتر است.
  const side: PopoverPlacement['side'] =
    below >= menuHeight + gap || below >= above ? 'down' : 'up';

  /* ── اصلاحِ افقی ── */
  const maxLeft = Math.max(gutter, opts.viewport.width - gutter - menuWidth);
  const targetLeft = Math.min(Math.max(opts.anchor.left, gutter), maxLeft);
  const offsetX = Math.round(targetLeft - opts.anchor.left);

  /* ── نوکِ فلِّش: دقیقاً زیرِ مرکزِ تریگر ── */
  const centerRelMenu = opts.anchor.width / 2 - offsetX;
  const caretX = Math.round(
    Math.min(Math.max(centerRelMenu - CARET_SIZE / 2, gutter), menuWidth - gutter - CARET_SIZE),
  );

  return { side, offsetX, caretX };
}
