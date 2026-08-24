import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import {
  MOBILE_VIEWPORT_QUERY,
  overlayStyleForViewport,
  useVisualViewportMetrics,
} from './use-visual-viewport';

/**
 * قراردادِ لایه‌ی جلوگیری از پوشیده‌شدنِ مودال زیر کیبوردِ موبایل:
 *  ۱) تابعِ خالص: متریک → استایلِ کانونیِ چسبیدن به ناحیه‌ی دیدنی؛
 *  ۲) هوک: فقط روی موبایل و با وجود Visual Viewport فعال است و با
 *     باز/بسته‌شدنِ کیبورد (resize/scroll) به‌روز می‌ماند؛ و pathِ
 *     دسکتاپ/SSR/مرورگرِ قدیمی کاملاً خنثی است (null → استایل پیش‌فرض).
 */

type Listener = () => void;
interface FakeVisualViewport {
  height: number;
  offsetTop: number;
  __emit(type: 'resize' | 'scroll', next?: { height?: number; offsetTop?: number }): void;
}

function makeFakeVisualViewport(initial: {
  height: number;
  offsetTop: number;
}): FakeVisualViewport {
  const state = { ...initial };
  const listeners = new Map<string, Set<Listener>>();
  const get = (type: string) => listeners.get(type) ?? listeners.set(type, new Set()).get(type)!;
  return {
    get height() {
      return state.height;
    },
    get offsetTop() {
      return state.offsetTop;
    },
    addEventListener(type: string, fn: Listener) {
      get(type).add(fn);
    },
    removeEventListener(type: string, fn: Listener) {
      get(type).delete(fn);
    },
    __emit(type: 'resize' | 'scroll', next?: { height?: number; offsetTop?: number }) {
      Object.assign(state, next ?? {});
      for (const fn of Array.from(get(type))) fn();
    },
  } as FakeVisualViewport;
}

function stubMobileMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }));
}

describe('overlayStyleForViewport — تابعِ خالصِ استایلِ چسبندگی', () => {
  it('متریک را به کادرِ دقیقِ ناحیه‌ی دیدنی تبدیل می‌کند', () => {
    expect(overlayStyleForViewport({ height: 430, offsetTop: 12 })).toEqual({
      top: '12px',
      height: '430px',
    });
  });

  it('مقادیر منفی هرگز نشت نمی‌کنند (کلمپِ پایینِ صفر)', () => {
    expect(overlayStyleForViewport({ height: -5, offsetTop: -20 })).toEqual({
      top: '0px',
      height: '0px',
    });
  });
});

describe('useVisualViewportMetrics — ردیابِ ناحیه‌ی دیدنی', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    delete (window as unknown as Record<string, unknown>).visualViewport;
  });

  it('بدون Visual Viewport (مسیر پیش‌فرض happy-dom): null — هیچ تغییرِ رفتاری', () => {
    stubMobileMatchMedia(true);
    const { result } = renderHook(({ enabled }) => useVisualViewportMetrics(enabled), {
      initialProps: { enabled: true },
    });
    expect(result.current).toBeNull();
  });

  it('غیرفعال: همیشه null حتی با وجود API', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: makeFakeVisualViewport({ height: 800, offsetTop: 0 }),
      configurable: true,
    });
    stubMobileMatchMedia(true);
    const { result } = renderHook(({ enabled }) => useVisualViewportMetrics(enabled), {
      initialProps: { enabled: false },
    });
    expect(result.current).toBeNull();
  });

  it('دسکتاپ (درگاه بزرگ): null — لایه از استایلِ CSS استفاده می‌کند', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: makeFakeVisualViewport({ height: 900, offsetTop: 0 }),
      configurable: true,
    });
    stubMobileMatchMedia(false);
    const { result } = renderHook(({ enabled }) => useVisualViewportMetrics(enabled), {
      initialProps: { enabled: true },
    });
    expect(result.current).toBeNull();
  });

  it('موبایل: متریکِ اولیه تحویل داده می‌شود و با کوچک‌شدنِ کیبورد به‌روز می‌ماند', () => {
    const vv = makeFakeVisualViewport({ height: 800, offsetTop: 0 });
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
    stubMobileMatchMedia(true);

    const { result } = renderHook(({ enabled }) => useVisualViewportMetrics(enabled), {
      initialProps: { enabled: true },
    });
    expect(result.current).toEqual({ height: 800, offsetTop: 0 });

    // کیبورد باز می‌شود → ناحیه‌ی دیدنی کوچک می‌شود
    act(() => vv.__emit('resize', { height: 430 }));
    expect(result.current).toEqual({ height: 430, offsetTop: 0 });

    // iOS محتوا را هم کمی بالا می‌راند → offsetTop مؤثر می‌شود
    act(() => vv.__emit('scroll', { offsetTop: 24 }));
    expect(result.current).toEqual({ height: 430, offsetTop: 24 });

    // کیبورد بسته می‌شود → بازگشت
    act(() => vv.__emit('resize', { height: 800, offsetTop: 0 }));
    expect(result.current).toEqual({ height: 800, offsetTop: 0 });
  });

  it('غیرفعال‌شدن وسطِ ردیابی: متریک پاک و شنونده‌ها جدا می‌شوند', () => {
    const vv = makeFakeVisualViewport({ height: 800, offsetTop: 0 });
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
    stubMobileMatchMedia(true);

    const { result, rerender } = renderHook(({ enabled }) => useVisualViewportMetrics(enabled), {
      initialProps: { enabled: true },
    });
    expect(result.current).toEqual({ height: 800, offsetTop: 0 });

    rerender({ enabled: false });
    expect(result.current).toBeNull();

    // رویدادِ بعدی دیگر اثری ندارد (شنونده جدا شده)
    act(() => vv.__emit('resize', { height: 400 }));
    expect(result.current).toBeNull();
  });

  it('به کوئریِ درگاهِ موبایلِ تعریف‌شده واکنش نشان می‌دهد', () => {
    expect(MOBILE_VIEWPORT_QUERY).toBe('(max-width: 639px)');
  });
});
