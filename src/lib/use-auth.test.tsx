import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

/**
 * چرخه‌ی حیات useAuth — هوکی که کل سایت روی آن «وارد شده‌ام یا نه؟»
 * را می‌فهمد. با mock سطح './auth' (بدون شبکه) و استورِ واقعی توکن
 * سناریوهای مهمان/ورود/خرابی/خروج را پوشش می‌دهد.
 *
 * دو نکته‌ی ایزوله‌سازی:
 *   ۱) cachedUser در اسکوپِ ماژول است → هر تست ماژول‌ها را تازه
 *      بارگذاری می‌کند (vi.resetModules)؛
 *   ۲) پس از resetModules، './auth-tokens' قدیمی دیگر همان نیست که
 *      هوک به آن subscribe شده — پس setTokens/clearTokens را هم از
 *      رجیستری تازه می‌گیریم تا رویدادها به گوشِ هوک برسند.
 */

const getMeMock = vi.fn();
const logoutMock = vi.fn();
vi.mock('./auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./auth')>();
  return { ...actual, getMe: () => getMeMock(), logout: () => logoutMock() };
});

async function loadModules() {
  vi.resetModules();
  const { useAuth } = await import('./use-auth');
  const tokens = await import('./auth-tokens');
  return { useAuth, tokens };
}

const ME = { id: 7, email: 'user@example.com', full_name: 'کاربر آزمون' };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  getMeMock.mockReset();
  logoutMock.mockReset();
  logoutMock.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('useAuth — مهمان', () => {
  it('بدون توکن: نه وارد شده، نه کاربر، بدون درخواست me', async () => {
    const { useAuth } = await loadModules();
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(getMeMock).not.toHaveBeenCalled();
  });
});

describe('useAuth — ورود', () => {
  it('پس از setTokens کاربر را از /auth/me می‌گیرد و isAuthenticated روشن می‌شود', async () => {
    getMeMock.mockResolvedValue(ME);
    const { useAuth, tokens } = await loadModules();
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      tokens.setTokens({ access: 'a', refresh: 'r', persist: true });
    });

    await waitFor(() => expect(result.current.user?.full_name).toBe('کاربر آزمون'));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(getMeMock).toHaveBeenCalledTimes(1);
  });

  it('خرابی me (پس از چرخه‌ی رفرش) → پاک‌سازی قطعی سشن', async () => {
    getMeMock.mockRejectedValue(new Error('401'));
    const { useAuth, tokens } = await loadModules();
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      tokens.setTokens({ access: 'dead', refresh: 'dead', persist: true });
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('sj.auth.access')).toBeNull();
  });
});

describe('useAuth — خروج و تازه‌سازی', () => {
  it('logout سشن سرور را لغو و state محلی را می‌پاکد', async () => {
    getMeMock.mockResolvedValue(ME);
    const { useAuth, tokens } = await loadModules();
    const { result } = renderHook(() => useAuth());

    // auth.logout واقعی پس از لغو سمت سرور، استور را هم پاک می‌کند؛
    // ماک ما همان اثر را با clearTokens بازتولید می‌کند تا رویداد
    // استور، رندر مجدد هوک را هم تغذیه کند.
    logoutMock.mockImplementation(async () => {
      tokens.clearTokens();
    });

    await act(async () => {
      tokens.setTokens({ access: 'a', refresh: 'r', persist: true });
    });
    await waitFor(() => expect(result.current.user?.full_name).toBe('کاربر آزمون'));

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('refresh() دستی هم کاربر را تازه می‌کند', async () => {
    getMeMock.mockResolvedValue(ME);
    const { useAuth, tokens } = await loadModules();
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      tokens.setTokens({ access: 'a', refresh: 'r', persist: true });
    });
    await waitFor(() => expect(result.current.user?.full_name).toBe('کاربر آزمون'));

    getMeMock.mockResolvedValue({ ...ME, full_name: 'نام تازه' });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.user?.full_name).toBe('نام تازه');
  });
});
