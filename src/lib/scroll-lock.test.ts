import { beforeEach, describe, expect, it } from 'vitest';
import { lockBodyScroll } from './scroll-lock';

/**
 * قرارداد scroll-lock — مالکِ متمرکزِ قفلِ بدنه:
 *  ۱) قفل‌ها شمارش‌مرجعی‌اند؛ ۲) آزادسازی idempotent؛ ۳) استایلِ قبلی
 *  حفظ و برگردانده می‌شود؛ ۴) شمارنده هرگز منفی نمی‌شود.
 */

beforeEach(() => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('scroll-lock — قفلِ اسکرولِ بدنه با شمارش‌مرجع', () => {
  it('اولین lock بدنه را قفل می‌کند و آخرین release آزاد می‌کند', () => {
    const release = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    release();
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
  });

  it('قفل‌های تودرتو: releaseِ اول کافی نیست، فقط آخرین آزاد می‌کند', () => {
    const releaseModal = lockBodyScroll();
    const releaseSheet = lockBodyScroll();

    releaseModal(); // یک لایه هنوز زنده است
    expect(document.body.style.overflow).toBe('hidden');

    releaseSheet();
    expect(document.body.style.overflow).toBe('');
  });

  it('release idempotent است — صدازدنِ دوباره ترکیب را به‌هم نمی‌ریزد', () => {
    const releaseA = lockBodyScroll();
    const releaseB = lockBodyScroll();

    releaseA();
    releaseA(); // دوباره — بی‌اثر
    releaseA(); // سه‌باره — بی‌اثر
    expect(document.body.style.overflow).toBe('hidden');

    releaseB();
    expect(document.body.style.overflow).toBe('');
  });

  it('استایلِ قبلیِ بدنه دقیقاً برگردانده می‌شود (نه ریستِ خشک به خالی)', () => {
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '7px';

    const release = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    release();
    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.paddingRight).toBe('7px');
  });

  it('قفلِ بیرونی هم‌زمان بعد از آزادسازیِ ما حفظ می‌شود', () => {
    document.body.style.overflow = 'hidden'; // لایه‌ی بیرونی قفل کرده
    const release = lockBodyScroll();
    release();
    // قفلِ بیرونی نباید خالی شود
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('شمارنده هرگز منفی نمی‌شود — releaseِ بی‌صاحب بی‌اثر است', () => {
    const release = lockBodyScroll();
    release();
    release();
    expect(document.body.style.overflow).toBe('');

    // چرخه‌ی بعدی باید تمیز کار کند
    const release2 = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    release2();
    expect(document.body.style.overflow).toBe('');
  });
});
