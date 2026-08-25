import { describe, expect, it } from 'vitest';
import { computeProfileCompletion, COMPLETION_FIELDS } from './profile-completion';
import type { AuthUser } from './auth';

describe('profile-completion — درصد تکمیل پروفایل', () => {
  it('پروفایل خالی → صفر درصد و همه‌ی آیتم‌ها باز', () => {
    const r = computeProfileCompletion(null, null);
    expect(r.percent).toBe(0);
    expect(r.done).toBe(0);
    expect(r.total).toBe(COMPLETION_FIELDS.length);
    expect(r.items.every((i) => !i.done)).toBe(true);
  });

  it('پروفایل کامل → ۱۰۰٪', () => {
    const user: AuthUser = { id: 1, first_name: 'علی', last_name: 'رضایی' };
    const profile = {
      avatar: '/media/avatars/1/a.jpg',
      national_code: '0012345678',
      birth_date: '2000-01-01',
      gender: 'male',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان آزادی',
      bio: '…',
    };
    const r = computeProfileCompletion(user, profile);
    expect(r.percent).toBe(100);
    expect(r.done).toBe(r.total);
  });

  it('رشته‌ی خالی/فاصله «پر» حساب نمی‌شود؛ فیلدهای R4J هم شامل‌اند', () => {
    const user: AuthUser = { id: 1, first_name: '  ', last_name: 'رضایی' };
    const profile = {
      national_code: '0012345678',
      birth_date: '2000-01-01',
      gender: 'female',
      province: 'تهران',
      city: ' ',
      address: 'x',
      avatar: null,
      bio: '',
    };
    const r = computeProfileCompletion(user, profile);
    // done: last_name، national_code، birth_date، gender، province، address = ۶
    expect(r.done).toBe(6);
    expect(r.percent).toBe(60);
    const byKey = Object.fromEntries(r.items.map((i) => [i.key, i.done]));
    expect(byKey.first_name).toBe(false);
    expect(byKey.city).toBe(false);
    expect(byKey.bio).toBe(false);
    expect(byKey.avatar).toBe(false);
  });

  it('اگر profile جداگانه داده نشود، از user.profile استفاده می‌کند', () => {
    const user: AuthUser = {
      id: 1,
      first_name: 'علی',
      last_name: 'رضایی',
      profile: { city: 'تهران' },
    };
    const r = computeProfileCompletion(user, null);
    expect(r.done).toBe(3);
    expect(r.percent).toBe(30);
  });
});
