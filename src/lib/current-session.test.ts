import { describe, expect, it } from 'vitest';

/**
 * current-session — منطقِ خالصِ تشخیصِ نشستِ فعلی.
 * فیکسچرها دقیقاً روی فیلدهای واقعیِ AuthSessionِ بک‌اند سوارند.
 */

import {
  clientUserAgent,
  findCurrentSessionId,
  isSessionExpired,
  orderSessionsForDisplay,
  userAgentMatches,
} from './current-session';
import type { AuthSession } from './auth';

const NOW = Date.parse('2026-08-25T12:00:00Z');

function session(partial: Partial<AuthSession> & { id: number }): AuthSession {
  return {
    device_label: 'Chrome browser',
    ip_address: '1.2.3.4',
    user_agent: 'UA-TEST',
    request_id: '',
    is_revoked: false,
    revoked_at: null,
    revoked_by_email: null,
    last_seen_at: '2026-08-20T10:00:00Z',
    expires_at: '2026-09-01T10:00:00Z',
    created_at: '2026-08-20T10:00:00Z',
    ...partial,
  } as AuthSession;
}

describe('isSessionExpired', () => {
  it('expires_at در گذشته → منقضی؛ آینده → معتبر؛ null → نامحدود', () => {
    expect(isSessionExpired({ expires_at: '2026-08-01T00:00:00Z' }, NOW)).toBe(true);
    expect(isSessionExpired({ expires_at: '2026-09-01T00:00:00Z' }, NOW)).toBe(false);
    expect(isSessionExpired({ expires_at: null }, NOW)).toBe(false);
  });
});

describe('userAgentMatches', () => {
  it('برابری دقیق و تحملِ truncate در هر دو جهت', () => {
    expect(userAgentMatches('Mozilla/5.0 Chrome', 'Mozilla/5.0 Chrome')).toBe(true);
    expect(userAgentMatches('Mozilla/5.0 Chr', 'Mozilla/5.0 Chrome')).toBe(true);
    expect(userAgentMatches('Mozilla/5.0 Chrome Extra', 'Mozilla/5.0 Chrome')).toBe(true);
    expect(userAgentMatches('Firefox', 'Chrome')).toBe(false);
    expect(userAgentMatches('', 'Chrome')).toBe(false);
    expect(userAgentMatches(null, 'Chrome')).toBe(false);
    expect(userAgentMatches('Chrome', '')).toBe(false);
  });
});

describe('findCurrentSessionId', () => {
  const ua = 'My Browser/1.0';

  it('تازه‌ترین نشستِ فعالِ هم‌UA انتخاب می‌شود', () => {
    const list = [
      session({ id: 1, user_agent: ua, last_seen_at: '2026-08-10T10:00:00Z' }),
      session({ id: 2, user_agent: ua, last_seen_at: '2026-08-25T09:00:00Z' }),
      session({ id: 3, user_agent: 'Other/2.0', last_seen_at: '2026-08-25T11:00:00Z' }),
    ];
    expect(findCurrentSessionId(list, ua, NOW)).toBe(2);
  });

  it('نشستِ لغوشده یا منقضی هرگز «فعلی» نیست', () => {
    const list = [
      session({ id: 1, user_agent: ua, is_revoked: true }),
      session({ id: 2, user_agent: ua, expires_at: '2026-08-01T00:00:00Z' }),
    ];
    expect(findCurrentSessionId(list, ua, NOW)).toBeNull();
  });

  it('بدون تطبیقِ UA → null (بدون مثبتِ کاذب)', () => {
    expect(findCurrentSessionId([session({ id: 1, user_agent: 'X' })], ua, NOW)).toBeNull();
  });

  it('وقتی last_seen_at خالی است، created_at ملاکِ تازگی است', () => {
    const list = [
      session({ id: 1, user_agent: ua, last_seen_at: '', created_at: '2026-08-10T00:00:00Z' }),
      session({ id: 2, user_agent: ua, last_seen_at: '', created_at: '2026-08-24T00:00:00Z' }),
    ];
    expect(findCurrentSessionId(list, ua, NOW)).toBe(2);
  });
});

describe('orderSessionsForDisplay', () => {
  it('نشستِ فعلی به بالای لیست می‌آید؛ ترتیبِ بقیه حفظ می‌شود', () => {
    const a = session({ id: 1 });
    const b = session({ id: 2 });
    const c = session({ id: 3 });
    expect(orderSessionsForDisplay([a, b, c], 3).map((s) => s.id)).toEqual([3, 1, 2]);
    expect(orderSessionsForDisplay([a, b, c], null).map((s) => s.id)).toEqual([1, 2, 3]);
    expect(orderSessionsForDisplay([a, b], 99).map((s) => s.id)).toEqual([1, 2]);
  });
});

describe('clientUserAgent', () => {
  it('در محیطِ تست UAِ happy-dom را برمی‌گرداند', () => {
    expect(typeof clientUserAgent()).toBe('string');
  });
});
