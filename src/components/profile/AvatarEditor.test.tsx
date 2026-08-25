import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * AvatarEditor — قرارداد آپلود عکس:
 *  • فقط image/* با سقف ۵MB؛ خطای کلاینت بدون شبکه؛
 *  • آپلود = PATCH multipart با کلید avatar؛ پیش‌نمایشِ لحظه‌ای با
 *    objectURL؛ موفقیت → URL سرور + سینکِ کشِ کاربر (applyUserPatch)؛
 *  • خطا → بازگشت به عکس قبلی + پیام، و objectURL آزاد می‌شود.
 */

const updateProfileMock = vi.fn();
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, updateProfile: (p: unknown) => updateProfileMock(p) };
});

import { AvatarEditor } from './AvatarEditor';
import { getCachedUser, setCachedUser } from '@/lib/auth-user-cache';
import type { AuthUser } from '@/lib/auth';

const ME: AuthUser = { id: 7, email: 'u@e.com', first_name: 'علی', profile: { avatar: null } };

vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: vi.fn(() => 'blob:preview-stub'),
  revokeObjectURL: vi.fn(),
});

beforeEach(() => {
  setCachedUser(ME);
  updateProfileMock.mockReset();
  (URL.createObjectURL as ReturnType<typeof vi.fn>).mockClear();
  (URL.revokeObjectURL as ReturnType<typeof vi.fn>).mockClear();
});

afterEach(() => {
  cleanup();
  setCachedUser(null);
});

function file(name: string, type: string, bytes: number): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: bytes });
  return f;
}

describe('AvatarEditor', () => {
  it('نبود عکس → حرفِ اول نام؛ داشتن عکس → img با srcِ تبدیل‌شده', () => {
    const { rerender } = render(<AvatarEditor avatar={null} fallbackText="علی رضایی" />);
    expect(screen.getByText('ع')).toBeTruthy();

    rerender(<AvatarEditor avatar="/media/avatars/7/a.jpg" fallbackText="علی" />);
    const img = screen.getByAltText('عکس پروفایل') as HTMLImageElement;
    expect(img.src).toContain('/media/avatars/7/a.jpg');
  });

  it('فایل غیرتصویری یا بزرگ‌تر از ۵MB بدون شبکه رد می‌شود', () => {
    const onError = vi.fn();
    render(<AvatarEditor avatar={null} fallbackText="علی" onError={onError} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file('a.txt', 'text/plain', 10)] } });
    expect(onError).toHaveBeenLastCalledWith('فقط فایل تصویری قابل آپلود است.');

    fireEvent.change(input, {
      target: { files: [file('big.png', 'image/png', 6 * 1024 * 1024)] },
    });
    expect(onError).toHaveBeenLastCalledWith('حجم عکس نباید بیشتر از ۵ مگابایت باشد.');
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('آپلود موفق: FormData با avatar → کشِ کاربر با Profileِ تازه سینک می‌شود', async () => {
    const freshProfile = { avatar: '/media/avatars/7/new.jpg', city: 'شیراز' };
    updateProfileMock.mockResolvedValue(freshProfile);
    const onUploaded = vi.fn();
    render(<AvatarEditor avatar={null} fallbackText="علی" onUploaded={onUploaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file('me.png', 'image/png', 1024)] } });

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledTimes(1));
    const body = updateProfileMock.mock.calls[0][0] as FormData;
    expect(body instanceof FormData).toBe(true);
    expect((body.get('avatar') as File).name).toBe('me.png');

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(freshProfile));
    // applyUserPatch: زیرکلید profile بدون پاک‌شدنِ بقیه مرج شد
    expect(getCachedUser()?.profile?.avatar).toBe('/media/avatars/7/new.jpg');
    expect(getCachedUser()?.profile?.city).toBe('شیراز');
    expect(getCachedUser()?.first_name).toBe('علی');
    // objectURL ساخته و آزاد شد
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('خطای آپلود: پیش‌نمایش برمی‌گردد و پیام خطا داده می‌شود', async () => {
    updateProfileMock.mockRejectedValue(new Error('boom'));
    const onError = vi.fn();
    render(<AvatarEditor avatar={null} fallbackText="علی" onError={onError} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file('me.png', 'image/png', 1024)] } });

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
