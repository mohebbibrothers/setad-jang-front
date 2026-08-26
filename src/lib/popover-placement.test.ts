import { describe, expect, it } from 'vitest';
import { computePopoverPlacement, POPOVER_MENU_HEIGHT_ESTIMATE } from './popover-placement';

/**
 * قرارداد popover-placement:
 *  ۱) فضای کافیِ پایین → down با offsetX=0 (لنگرِ طبیعی)؛
 *  ۲) نزدیکِ کفِ ویوپورت → auto-flip به up؛
 *  ۳) تریگرِ چسبیده به لبه‌ها → گیرِ افقی داخل [gutter, vw−gutter−menu]؛
 *  ۴) وقتی هیچ‌کدام جا نیستند، سمتِ جادارتر انتخاب می‌شود؛
 *  ۵) نوکِ فلِّش زیرِ مرکزِ تریگر می‌ماند و از بدنه‌ی منو خارج نمی‌شود.
 */

const VW = { width: 360, height: 760 };

describe('popover-placement — جای‌گذاریِ هوشمندِ پاپ‌اوور', () => {
  it('فضای کافیِ پایین: down و بدون اصلاحِ افقی', () => {
    const p = computePopoverPlacement({
      anchor: { top: 60, bottom: 104, left: 16, width: 44 },
      viewport: VW,
      menuWidth: 240,
    });
    expect(p.side).toBe('down');
    expect(p.offsetX).toBe(0);
    // نوکِ فلِّش نزدیکِ مرکزِ تریگر (16 + 22 − offsetX و نصفِ فلِّش)
    expect(p.caretX).toBeGreaterThanOrEqual(0);
    expect(p.caretX).toBeLessThanOrEqual(240 - 12 - 12);
  });

  it('نزدیکِ کف (کارتِ کفِ شیت): فلیپ به up', () => {
    const p = computePopoverPlacement({
      anchor: { top: 680, bottom: 736, left: 59, width: 245 },
      viewport: VW,
      menuWidth: 245,
    });
    expect(p.side).toBe('up');
    expect(p.offsetX).toBe(0); // تمام‌عرض داخل شیت، بدون اصلاح
  });

  it('تریگرِ بیرون‌زده از لبه‌ی چپ: منو داخلِ ویوپورت گیر می‌افتد', () => {
    const p = computePopoverPlacement({
      anchor: { top: 60, bottom: 104, left: -30, width: 44 },
      viewport: VW,
      menuWidth: 240,
    });
    // هدف: left ≥ gutter=12 → دلتا = 12 − (−30) = 42
    expect(p.offsetX).toBe(42);
  });

  it('تریگرِ نزدیکِ لبه‌ی راست: منو از آن سمت بیرون نمی‌زند', () => {
    const p = computePopoverPlacement({
      anchor: { top: 60, bottom: 104, left: 330, width: 28 },
      viewport: VW,
      menuWidth: 240,
    });
    // maxLeft = 360 − 12 − 240 = 108 → دلتا = 108 − 330 = −222
    expect(p.offsetX).toBe(108 - 330);
  });

  it('وقتی هیچ سمتی جا نیست، سمتِ جادارتر برنده است', () => {
    const shortVW = { width: 360, height: 200 };
    const p = computePopoverPlacement({
      anchor: { top: 40, bottom: 84, left: 16, width: 44 },
      viewport: shortVW,
      menuWidth: 240, // menuHeight پیش‌فرض 260 > هر دو سمت
    });
    expect(POPOVER_MENU_HEIGHT_ESTIMATE).toBeGreaterThan(shortVW.height - 84);
    expect(p.side).toBe('down'); // below=116 > above=40

    const p2 = computePopoverPlacement({
      anchor: { top: 150, bottom: 194, left: 16, width: 44 },
      viewport: shortVW,
      menuWidth: 240,
    });
    expect(p2.side).toBe('up'); // above=150 > below=6
  });

  it('نوک فلِّشِ منویِ اصلاح‌شده افقياً هم زیرِ مرکزِ تریگر می‌ماند', () => {
    const p = computePopoverPlacement({
      anchor: { top: 700, bottom: 744, left: 4, width: 60 },
      viewport: VW,
      menuWidth: 240,
    });
    expect(p.offsetX).toBe(12 - 4); // گیر به gutter
    // مرکزِ تریگر نسبت به منو: 30 − 8 = 22 → فلِّش ≈ 22 − 6 = 16
    expect(p.caretX).toBe(16);
  });

  it('گپ و gutterِ سفارشی لحاظ می‌شوند', () => {
    const p = computePopoverPlacement({
      anchor: { top: 0, bottom: 40, left: 0, width: 50 },
      viewport: { width: 100, height: 118 },
      menuWidth: 40,
      menuHeight: 60,
      gap: 8,
      gutter: 4,
    });
    // below = 78 ≥ 68 → down؛ هدف چپ: clamp(0, 4, 100−4−40=56) = 4
    expect(p.side).toBe('down');
    expect(p.offsetX).toBe(4);
  });
});
