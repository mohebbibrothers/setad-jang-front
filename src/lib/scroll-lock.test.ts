import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lockBodyScroll } from './scroll-lock';

/**
 * قرارداد scroll-lock — مالکِ متمرکزِ قفلِ بدنه:
 *  ۱) قفل‌ها شمارش‌مرجعی‌اند؛ ۲) آزادسازی idempotent؛ ۳) استایلِ قبلی
 *  حفظ و برگردانده می‌شود؛ ۴) شمارنده هرگز منفی نمی‌شود؛ ۵) قفل
 *  iOS-Safe است (position:fixed + top:−scrollY) و موقعیتِ اسکرول موقعِ
 *  آزادسازی «فوری» (بدون اسکرولِ نرمِ globals.css) برمی‌گردد.
 */

function resetBody() {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.documentElement.style.scrollBehavior = '';
}

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
}

beforeEach(() => {
  resetBody();
  setScrollY(0);
});

describe('scroll-lock — قفلِ اسکرولِ بدنه با شمارش‌مرجع', () => {
  it('اولین lock بدنه را قفل می‌کند و آخرین release آزاد می‌کند', () => {
    const release = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    release();
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
  });

  it('قفل iOS-Safe است: بدنه fixed با top برابرِ منفیِ scrollY می‌شود', () => {
    setScrollY(640);
    const release = lockBodyScroll();

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-640px');
    expect(document.body.style.left).toBe('0px');
    expect(document.body.style.right).toBe('0px');
    expect(document.body.style.width).toBe('100%');

    release();
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
  });

  it('هنگام آزادسازی، موقعیتِ اسکرول «فوری» برمی‌گردد (نه با اسکرولِ نرم)', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.documentElement.style.scrollBehavior = 'smooth'; // همان قرارداد globals.css
    setScrollY(640);

    const release = lockBodyScroll();
    release();

    expect(scrollTo).toHaveBeenCalledWith(0, 640);
    // حینِ بازیابی رفتار موقتاً auto بوده و بعد به مقدارِ قبلی برگشته است
    expect(document.documentElement.style.scrollBehavior).toBe('smooth');
  });

  it('قفل‌های تودرتو: releaseِ اول کافی نیست، فقط آخرین آزاد می‌کند', () => {
    const releaseModal = lockBodyScroll();
    const releaseSheet = lockBodyScroll();

    releaseModal(); // یک لایه هنوز زنده است
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');

    releaseSheet();
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
  });

  it('قفل‌های تودرتو موقعیتِ اسکرول را فقط یک‌بار (در اولین lock) می‌خوانند', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    setScrollY(300);
    const releaseSheet = lockBodyScroll();
    setScrollY(480); // کاربر... نه! لایه‌ی دوم نباید مبدأ را جابه‌جا کند
    const releaseModal = lockBodyScroll();

    expect(document.body.style.top).toBe('-300px');

    releaseModal();
    releaseSheet();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 300);
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
