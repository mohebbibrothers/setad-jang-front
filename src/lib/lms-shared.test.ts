import { describe, expect, it } from 'vitest';
import {
  LMS_LEVELS,
  buildStats,
  formatLmsDuration,
  formatLmsHours,
  lmsHref,
  normalizeLevel,
  pageWindow,
  parseLmsHubQuery,
  type LmsCourse,
} from './lms-shared';

describe('normalizeLevel', () => {
  it('فقط سطح‌های شناخته‌شده را قبول می‌کند', () => {
    for (const lv of LMS_LEVELS) expect(normalizeLevel(lv)).toBe(lv);
    expect(normalizeLevel('god')).toBeNull();
    expect(normalizeLevel('')).toBeNull();
    expect(normalizeLevel(undefined)).toBeNull();
    expect(normalizeLevel('BEGINNER')).toBeNull(); // حساس به حالت — قراردادِ backend
  });
});

describe('parseLmsHubQuery', () => {
  it('ورودیِ خالی، کوئریِ خالی می‌دهد', () => {
    expect(parseLmsHubQuery({})).toEqual({
      category: undefined,
      level: null, // قراردادِ normalizeLevel: ناشناخته/غایب = null
      q: undefined,
      featured: undefined,
      page: 1,
    });
  });

  it('آرایه‌ها به اولین مقدار فرو می‌روند و فضای خالی تر می‌شود', () => {
    expect(parseLmsHubQuery({ category: [' نظامی ', 'دیگر'] }).category).toBe('نظامی');
  });

  it('featured فقط با ۱/true صریح روشن می‌شود و بقیه‌ی مقادیر دور ریخته می‌شوند', () => {
    expect(parseLmsHubQuery({ featured: '1' }).featured).toBe(true);
    expect(parseLmsHubQuery({ featured: 'true' }).featured).toBe(true);
    expect(parseLmsHubQuery({ featured: 'TRUE' }).featured).toBe(true);
    expect(parseLmsHubQuery({ featured: 'yes' }).featured).toBeUndefined();
    expect(parseLmsHubQuery({ featured: '0' }).featured).toBeUndefined();
    expect(parseLmsHubQuery({ featured: '' }).featured).toBeUndefined();
  });

  it('سطحِ نامعتبر و صفحه‌ی عجیب مهار می‌شوند', () => {
    expect(parseLmsHubQuery({ level: 'hack' }).level).toBeNull();
    expect(parseLmsHubQuery({ page: '-3' }).page).toBe(1);
    expect(parseLmsHubQuery({ page: 'abc' }).page).toBe(1);
    expect(parseLmsHubQuery({ page: '500' }).page).toBe(100);
    expect(parseLmsHubQuery({ page: '2' }).page).toBe(2);
  });

  it('متنِ جست‌وجو سقف ۱۲۰ نویسه دارد', () => {
    expect(parseLmsHubQuery({ q: 'الف'.repeat(200) }).q).toHaveLength(120);
  });
});

describe('lmsHref', () => {
  it('خالی ⇒ /lmsِ تمیز', () => {
    expect(lmsHref()).toBe('/lms');
    expect(lmsHref({ page: 1 })).toBe('/lms');
  });

  it('featured به featured=1 سریالایز می‌شود', () => {
    expect(lmsHref({ featured: true })).toBe('/lms?featured=1');
  });

  it('ترکیب‌ها حفظ و برگردان (patch روی base) کار می‌کند', () => {
    const base = { category: 'نظامی', level: 'beginner' as const, q: 'fpv' };
    const href = lmsHref({ page: 2 }, base);
    expect(href).toContain('q=fpv');
    expect(href).toContain('category=' + encodeURIComponent('نظامی'));
    expect(href).toContain('level=beginner');
    expect(href).toContain('page=2');
  });

  it('خاموش‌کردن فیلتر با undefined ممکن است', () => {
    const base = parseLmsHubQuery({ featured: '1', level: 'advanced' });
    const href = lmsHref({ featured: undefined }, base);
    expect(href).not.toContain('featured');
    expect(href).toContain('level=advanced');
  });

  it('round-trip: خروجی‌دوباره‌خوان همان معنا را دارد', () => {
    const q1 = parseLmsHubQuery({ category: 'برنامه-نویسی', featured: '1', page: '3' });
    const href = lmsHref({}, q1);
    const params = new URLSearchParams(href.split('?')[1]);
    const q2 = parseLmsHubQuery(Object.fromEntries(params));
    expect(q2).toEqual(q1);
  });
});

describe('buildStats', () => {
  const course = (over: Partial<LmsCourse>): LmsCourse => ({
    slug: 'x',
    title: 'x',
    instructor: 'x',
    lessonsCount: 0,
    durationSeconds: 0,
    enrollmentsCount: 0,
    graduatesCount: 0,
    isFeatured: false,
    isNew: false,
    ...over,
  });

  it('شمارِ ویژه‌ها و جمع‌های صادقانه را مشتق می‌کند', () => {
    const stats = buildStats(
      [
        course({ isFeatured: true, lessonsCount: 3, durationSeconds: 3600 }),
        course({ isFeatured: false, lessonsCount: 2, enrollmentsCount: 5 }),
        course({ isFeatured: true, categorySlug: 'نظامی' }),
      ],
      10,
    );
    expect(stats.featuredCount).toBe(2);
    expect(stats.totalLessons).toBe(5);
    expect(stats.totalLearners).toBe(5);
    expect(stats.courseCount).toBe(10);
    expect(stats.truncated).toBe(true); // ۱۰ > ۳ اسکن‌شده
    expect(stats.countByCategory.get('نظامی')).toBe(1);
  });

  it('کاتالوگِ کوچک‌تر از صفحه‌ی اسکن truncated نمی‌شود', () => {
    expect(buildStats([course({})], 1).truncated).toBe(false);
  });
});

describe('formatLmsDuration / formatLmsHours', () => {
  it('لبه‌ها', () => {
    expect(formatLmsDuration(0)).toBe('');
    expect(formatLmsDuration(-5)).toBe('');
    expect(formatLmsDuration(45 * 60)).toContain('دقیقه');
    expect(formatLmsDuration(3600)).toContain('ساعت');
    expect(formatLmsDuration(2 * 3600 + 30 * 60)).toContain('س');
    expect(formatLmsHours(5 * 3600)).toBe((5).toLocaleString('fa-IR'));
  });
});

describe('pageWindow', () => {
  it('تا ۷ صفحه بدون شکاف', () => {
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it('لبه‌ها با gap نمایش داده می‌شوند', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 'gap', 20]);
    expect(pageWindow(20, 20)).toEqual([1, 'gap', 19, 20]);
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
  });
});
