import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { useAnimatedHeight } from './use-animated-height';

/**
 * قراردادِ مورفِ نرمِ ارتفاع:
 *  ۱) در محیطِ بدون موتورِ چیدمان (ارتفاعِ صفر) هیچ استایلی تحمیل
 *     نمی‌شود — graceful degradation دقیقاً به رفتارِ پیشین؛
 *  ۲) ترنزیشن فقط پس از مسلح‌شدن فعال است تا ارتفاعِ اولیه با انیمیشنِ
 *     ورودِ خودِ پنل نجنگد؛ ۳) غیرفعال‌شدن، disarm می‌کند.
 */

function Probe({ active }: { active: boolean }) {
  const ah = useAnimatedHeight(active, 100);
  return (
    <div data-testid="container" style={ah.style} data-armed={ah.armed || undefined}>
      <div ref={ah.contentRef}>محتوای متغیر</div>
    </div>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useAnimatedHeight — مورفِ نرمِ ارتفاع', () => {
  it('در محیطِ بدون موتورِ چیدمان: بدون استایلِ تحمیلی و بدون crash', () => {
    const { getByTestId } = render(<Probe active />);
    const container = getByTestId('container');

    // happy-dom ارتفاعِ واقعی ندارد (offsetHeight=0) → گاردِ مثبت‌بودن
    // حاکم است: هیچ ارتفاعی ست نشده و محتوا دقیقاً همان است که بود.
    expect(container.style.height).toBe('');
    expect(container.getAttribute('data-armed')).toBeNull();
    expect(container.textContent).toContain('محتوای متغیر');
  });

  it('پس از زمانِ مسلح‌شدن هم بدون ارتفاعِ معتبر، ترنزیشن فعال نمی‌شود', () => {
    const { getByTestId } = render(<Probe active />);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    // height هنوز null است پس armed هم باید false بماند
    expect(getByTestId('container').getAttribute('data-armed')).toBeNull();
  });

  it('غیرفعال‌شدن: disarm و تمیزکاریِ تایمرها', () => {
    const { rerender, getByTestId } = render(<Probe active />);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    rerender(<Probe active={false} />);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(getByTestId('container').getAttribute('data-armed')).toBeNull();
  });

  it('unmount میانِ مسلح‌شدن: هیچ تایمری عقب نمی‌ماند', () => {
    const { unmount } = render(<Probe active />);
    unmount();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
  });
});
