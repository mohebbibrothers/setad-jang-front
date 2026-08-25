import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCachedUser,
  setCachedUser,
  patchCachedUser,
  subscribeCachedUser,
} from './auth-user-cache';
import type { AuthUser } from './auth';

const ME: AuthUser = {
  id: 7,
  email: 'user@example.com',
  first_name: 'علی',
  last_name: 'رضایی',
  profile: { city: 'تهران', avatar: null },
};

beforeEach(() => {
  setCachedUser(null);
});

describe('auth-user-cache — منبعِ واحدِ کاربر برای همه‌ی مصرف‌کننده‌ها', () => {
  it('setCachedUser جایگزین می‌کند و به شنونده‌ها خبر می‌دهد', () => {
    const listener = vi.fn();
    setCachedUser(ME);
    setCachedUser(null);
    const unsub = subscribeCachedUser(listener);

    setCachedUser(ME);
    expect(getCachedUser()?.email).toBe('user@example.com');
    expect(listener).toHaveBeenCalledTimes(1);

    setCachedUser(null);
    expect(getCachedUser()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
  });

  it('patchCachedUser مرجِ کم‌عمق است وprofile را ادغام می‌کند (نه پاک)', () => {
    setCachedUser(ME);
    // خروجی /auth/profile/ فقط زیرکلید profile را تازه می‌کند
    patchCachedUser({ profile: { city: 'شیراز', bio: 'مددکار' } });

    const u = getCachedUser()!;
    expect(u.first_name).toBe('علی'); // سطحِ user حفظ شد
    expect(u.profile?.city).toBe('شیراز');
    expect(u.profile?.bio).toBe('مددکار');
    expect(u.profile?.avatar).toBeNull(); // بقیه‌ی profile حفظ شد
  });

  it('patchCachedUser بدون profile هم کار می‌کند و روی cache خالی بی‌اثر است', () => {
    patchCachedUser({ first_name: 'x' }); // کش خالی — بی‌اثر
    expect(getCachedUser()).toBeNull();

    setCachedUser(ME);
    patchCachedUser({ first_name: 'محمد' });
    expect(getCachedUser()?.first_name).toBe('محمد');
    expect(getCachedUser()?.profile?.city).toBe('تهران');
  });

  it('لغوی اشتراک دیگر emit نمی‌گیرد', () => {
    const listener = vi.fn();
    const unsub = subscribeCachedUser(listener);
    unsub();
    setCachedUser(ME);
    expect(listener).not.toHaveBeenCalled();
  });
});
