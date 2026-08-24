import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { useAnimatedHeight } from './use-animated-height';

/**
 * قراردادِ v2 «اندازه → انیمیت → آزاد»:
 *  ۱) سکون = auto — هیچ ارتفاعِ px پایداری روی کانتینر نیست، پس
 *     اسکرول‌بار فقط و فقط با اورفلوِ واقعی ظاهر می‌شود (رفع باگِ
 *     «اسکرول‌بارِ پیش‌فرض کنار پنجره»)؛
 *  ۲) تغییرِ محتوا → فریز px قبلی → ترنزیشن به px جدید → آزادسازی؛
 *  ۳) اپسیلونِ زیرپیکسلی نویز را نمی‌بیند؛ ۴) مسلح‌شدن با تأخیر؛
 *  ۵) بدون موتورِ چیدمان کاملاً خنثی است.
 */

/** ResizeObserver ساختگی با قابلیتِ تزریقِ رویداد از تست */
class FakeResizeObserver {
  static last: FakeResizeObserver | null = null;
  private cb: ResizeObserverCallback;
  private targets = new Set<Element>();

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    FakeResizeObserver.last = this;
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  fire() {
    for (const target of Array.from(this.targets)) {
      this.cb([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
  }
}

function Probe({ active }: { active: boolean }) {
  const ah = useAnimatedHeight(active, 100);
  return (
    <div
      data-testid="container"
      style={ah.style}
      data-armed={ah.armed || undefined}
      data-animating={ah.isAnimating || undefined}
    >
      <div ref={ah.contentRef}>محتوای متغیر</div>
    </div>
  );
}

/** rect قابل‌کنترل روی بسته‌ی داخلیِ Probe */
function stubContentHeight(container: HTMLElement, height: number) {
  const content = container.firstElementChild as HTMLElement;
  vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
    height,
    width: 300,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 300,
    bottom: height,
    toJSON: () => ({}),
  } as DOMRect);
}

function fireMeasure() {
  act(() => {
    FakeResizeObserver.last?.fire();
  });
}

beforeEach(() => {
  // rAF هم صریحاً فیک می‌شود تا فریمِ مورف با advanceTimers قطعی باشد
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'Date',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ],
  });
  FakeResizeObserver.last = null;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useAnimatedHeight — مورفِ نرمِ ارتفاع (اندازه → انیمیت → آزاد)', () => {
  it('سکون = auto: با وجود هر تعداد اندازه‌گیری بدون تغییر، هیچ px تحمیلی نیست', () => {
    const { getByTestId } = render(<Probe active />);
    const container = getByTestId('container');

    stubContentHeight(container, 400);
    fireMeasure(); // پایه‌گذاری
    fireMeasure();
    fireMeasure();

    expect(container.style.height).toBe('');
    expect(container.getAttribute('data-armed')).toBeNull();
  });

  it('مسلح‌شدن با تأخیر انجام می‌شود (تا با ورودِ پنل نجنگد)', () => {
    const { getByTestId } = render(<Probe active />);
    expect(getByTestId('container').getAttribute('data-armed')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(getByTestId('container').getAttribute('data-armed')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(getByTestId('container').getAttribute('data-armed')).toBe('true');
  });

  it('پیش از مسلح‌شدن فقط پایه‌گذاری می‌کند (بدون مورفِ زودهنگام)', () => {
    const { getByTestId } = render(<Probe active />);
    const container = getByTestId('container');

    stubContentHeight(container, 200);
    fireMeasure(); // پایه
    stubContentHeight(container, 500);
    fireMeasure(); // تغییر اما هنوز خلع‌سلاح

    expect(container.style.height).toBe('');
  });

  it('چرخه‌ی کامل: فریز+کلیپ → ترنزیشن به هدف → آزادسازی به auto (ضدِ فلشِ اسکرول‌بار)', () => {
    const { getByTestId } = render(<Probe active />);
    const container = getByTestId('container');

    // پایه + مسلح‌شدن
    stubContentHeight(container, 100);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(container.getAttribute('data-armed')).toBe('true');
    expect(container.style.height).toBe(''); // هنوز auto در سکون ✔
    expect(container.getAttribute('data-animating')).toBeNull(); // کلیپ خاموش ✔

    // تغییرِ محتوا → انیمیشن به ۲۰۰ (در کلِ این پنجره کلیپ روشن است
    // تا ارتفاعِ میانیِ کوچک‌تر هیچ اسکرول‌باری فلش نزند)
    stubContentHeight(container, 200);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(16); // فلاشِ rAF
    });
    expect(container.style.height).toBe('200px');
    expect(container.getAttribute('data-animating')).toBe('true');

    // پایانِ ترنزیشن → آزادسازی: دوباره auto و کلیپ خاموش
    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(container.style.height).toBe('');
    expect(container.getAttribute('data-animating')).toBeNull();
    // و در همین سکون، بار دیگر تغییرِ کوچک هم auto می‌ماند
    fireMeasure();
    expect(container.style.height).toBe('');
  });

  it('تغییرِ میانِ انیمیشن: هدف به‌روز می‌شود و انیمیشن تلفیق نمی‌شود (پیوسته)', () => {
    const { getByTestId } = render(<Probe active />);
    const container = getByTestId('container');

    stubContentHeight(container, 100);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(100);
    });

    stubContentHeight(container, 300);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(16);
    });
    expect(container.style.height).toBe('300px');

    // وسطِ راه هدف عوض می‌شود — کلیپ در تمامِ این پنجره روشن می‌ماند
    stubContentHeight(container, 250);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(16);
    });
    expect(container.style.height).toBe('250px');
    expect(container.getAttribute('data-animating')).toBe('true');

    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(container.style.height).toBe('');
    expect(container.getAttribute('data-animating')).toBeNull();
  });

  it('نویزِ زیرپیکسلی (کمتر از ۰٫۵) انیمیشنی برنمی‌انگیزد', () => {
    const { getByTestId } = render(<Probe active />);
    const container = getByTestId('container');

    stubContentHeight(container, 200);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(100);
    });

    stubContentHeight(container, 200.3);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(container.style.height).toBe('');
  });

  it('اندازه‌ی صفر (محیطِ بدون موتورِ چیدمان) کاملاً نادیده گرفته می‌شود', () => {
    const { getByTestId } = render(<Probe active />);
    const container = getByTestId('container');

    stubContentHeight(container, 0);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(100);
    });

    stubContentHeight(container, 300);
    fireMeasure(); // چون پایه هنوز صفر است → فقط پایه‌گذاری، بدون مورف
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(container.style.height).toBe('');
  });

  it('خلع‌سلاح: نشده‌ی وسطِ مورف — ریستِ کاملِ px/کلیپ و هیچ تایمرِ عقب‌مانده‌ای', () => {
    const { getByTestId, rerender, unmount } = render(<Probe active />);
    const container = getByTestId('container');

    stubContentHeight(container, 100);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    stubContentHeight(container, 300);
    fireMeasure();
    act(() => {
      vi.advanceTimersByTime(16);
    });
    expect(container.getAttribute('data-animating')).toBe('true');

    // غیرفعال‌شدن وسطِ مورف → ریستِ کامل؛ برای بازشدنِ بعدی هیچ
    // باقی‌مانده‌ی px/کلیپی برنمی‌دارد
    rerender(<Probe active={false} />);
    expect(container.getAttribute('data-armed')).toBeNull();
    expect(container.getAttribute('data-animating')).toBeNull();
    expect(container.style.height).toBe('');

    unmount();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
  });
});
