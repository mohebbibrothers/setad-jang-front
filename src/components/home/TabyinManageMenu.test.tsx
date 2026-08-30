import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * TabyinManageMenu — دکمه‌ی «مدیریت محتوا» در دیوارِ جهاد تبیینِ خانه:
 *   منوی hover/tap با دو مسیرِ «روایت‌های من» و «افزودن محتوا».
 */

import { TabyinManageMenu } from './TabyinManageMenu';

describe('TabyinManageMenu', () => {
  afterEach(() => cleanup());

  it('دکمه با دسترس‌پذیریِ منو رندر می‌شود و منو اول بسته است', () => {
    render(<TabyinManageMenu />);
    const trigger = screen.getByRole('button', { name: /مدیریت محتوا/ });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('با کلیک باز می‌شود و هر دو مسیر را با مقصدِ درست نشان می‌دهد', () => {
    render(<TabyinManageMenu />);
    fireEvent.click(screen.getByRole('button', { name: /مدیریت محتوا/ }));

    expect(screen.getByRole('button', { name: /مدیریت محتوا/ }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    const mineLink = screen.getByRole('menuitem', { name: /روایت‌های من/ });
    const newLink = screen.getByRole('menuitem', { name: /افزودن محتوا/ });
    expect(mineLink.getAttribute('href')).toBe('/tabyin/mine');
    expect(newLink.getAttribute('href')).toBe('/tabyin/new');
  });

  it('Escape منو را می‌بندد', async () => {
    render(<TabyinManageMenu />);
    fireEvent.click(screen.getByRole('button', { name: /مدیریت محتوا/ }));
    expect(screen.queryByRole('menu')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    // خروجِ framer-motion چند فریم طول می‌کشد — حذفِ قطعی async است
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('انتخابِ یک گزینه منو را می‌بندد', async () => {
    render(<TabyinManageMenu />);
    fireEvent.click(screen.getByRole('button', { name: /مدیریت محتوا/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /افزودن محتوا/ }));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });
});
