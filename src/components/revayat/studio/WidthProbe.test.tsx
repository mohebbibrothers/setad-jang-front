import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/**
 * WidthProbe — قراردادِ پروبِ عرض:
 *   • بدون فلگ → هیچ‌چیز رندر نمی‌شود (صفر اثر برای کاربرِ عادی)؛
 *   • با فلگ → viewport/scrollWidth و بدترینِ المان‌های بیرون‌زده گزارش می‌شود؛
 *   • فلگ از ?debugwidth=1 هم به localStorage ماندگار می‌شود.
 */

import { WidthProbe } from './WidthProbe';

const KEY = 'besat.width-probe';

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(KEY);
  window.history.replaceState({}, '', '/tabyin/new');
  document.body.innerHTML = '';
});

function injectWideElement(overPx: number, side: 'L' | 'R' = 'R') {
  const el = document.createElement('div');
  el.className = 'rogue-wide-element';
  document.body.appendChild(el);
  const inner = window.innerWidth;
  const rect = {
    x: side === 'R' ? inner - 10 : -Math.abs(overPx) - 10,
    y: 0,
    top: 0,
    bottom: 20,
    height: 20,
    left: side === 'R' ? inner - 10 : -Math.abs(overPx) - 10,
    right: side === 'R' ? inner + Math.abs(overPx) : -10,
    width: 100,
    toJSON: () => ({}),
  } as DOMRect;
  Object.defineProperty(el, 'getBoundingClientRect', { value: () => rect });
  return el;
}

describe('WidthProbe', () => {
  it('بدون فلگ → هیچ‌چیز رندر نمی‌شود', () => {
    const { container } = render(<WidthProbe />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/width-probe/)).toBeNull();
  });

  it('با فلگِ localStorage → المانِ بیرون‌زده را گزارش می‌کند', async () => {
    window.localStorage.setItem(KEY, '1');
    injectWideElement(76, 'R');
    render(<WidthProbe />);
    expect(await screen.findByText(/width-probe:/)).toBeTruthy();
    // بدترینِ مقصر با سمت و مقدارِ بیرون‌زدگی دیده می‌شود
    expect(screen.getByText(/R\+76/)).toBeTruthy();
    expect(screen.getByText(/rogue-wide-element/)).toBeTruthy();
  });

  it('با ?debugwidth=1 → فعال می‌شود و فلگ را ماندگار می‌کند', async () => {
    window.history.replaceState({}, '', '/tabyin/new?debugwidth=1');
    render(<WidthProbe />);
    expect(await screen.findByText(/width-probe:/)).toBeTruthy();
    expect(window.localStorage.getItem(KEY)).toBe('1');
    // DOMِ تمیز → هیچ مقصری گزارش نمی‌شود
    expect(screen.getByText(/no element exceeds viewport/)).toBeTruthy();
  });
});
