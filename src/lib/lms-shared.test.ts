import { describe, expect, it } from 'vitest';
import {
  LMS_LEVELS,
  buildStats,
  classifyVideoUrl,
  formatLmsDuration,
  formatLmsHours,
  lmsHref,
  normalizeLessonType,
  normalizeLevel,
  pageWindow,
  parseLmsHubQuery,
  teaserText,
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

describe('normalizeLessonType', () => {
  it('نوع‌های شناخته‌شده عبور می‌کنند و بقیه به ویدئو سقوط می‌کنند', () => {
    expect(normalizeLessonType('video')).toBe('video');
    expect(normalizeLessonType('audio')).toBe('audio');
    expect(normalizeLessonType('document')).toBe('document');
    expect(normalizeLessonType('article')).toBe('article');
    expect(normalizeLessonType('hologram')).toBe('video');
    expect(normalizeLessonType(undefined)).toBe('video');
    expect(normalizeLessonType('')).toBe('video');
  });
});

/* classifyVideoUrl — دیوارِ آتشِ صفحه‌ی جزئیات: تنها الگوهای امنِ پخش
 * عبور می‌کنند؛ هر آدرسِ عجیب بی‌صدا به «بدون ویدئو» سقوط می‌کند تا
 * هیچ لینکِ کاربر‌ساخته‌ای در UI رندر نشود (قانونِ صیانتِ کلاینت). */
describe('classifyVideoUrl', () => {
  it('ورودیِ تهی و URLِ شکسته ⇒ null', () => {
    expect(classifyVideoUrl(undefined)).toBeNull();
    expect(classifyVideoUrl('')).toBeNull();
    expect(classifyVideoUrl('   ')).toBeNull();
    expect(classifyVideoUrl('not a url at all')).toBeNull();
  });

  it('پروتکل‌های خطرناک مسدود می‌شوند', () => {
    expect(classifyVideoUrl('javascript:alert(1)')).toBeNull();
    expect(classifyVideoUrl('data:text/html,<b>x</b>')).toBeNull();
    expect(classifyVideoUrl('ftp://files.example.com/x.mp4')).toBeNull();
  });

  it('فایلِ مستقیمِ رسانه ⇒ native', () => {
    expect(classifyVideoUrl('https://besat.me/media/lms/intro.mp4')).toEqual({
      kind: 'native',
      src: 'https://besat.me/media/lms/intro.mp4',
    });
    expect(classifyVideoUrl('https://cdn.example.com/v/a.webm?sig=1')).toEqual({
      kind: 'native',
      src: 'https://cdn.example.com/v/a.webm?sig=1',
    });
    expect(classifyVideoUrl('http://localhost:4010/media/x.m3u8')?.kind).toBe('native');
  });

  it('یوتیوب از هر شکلِ نشانی به nocookie embed تبدیل می‌شود', () => {
    const exp = { kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/abcDEF12345' };
    expect(classifyVideoUrl('https://www.youtube.com/watch?v=abcDEF12345')).toEqual(exp);
    expect(classifyVideoUrl('https://youtu.be/abcDEF12345')).toEqual(exp);
    expect(classifyVideoUrl('https://www.youtube.com/embed/abcDEF12345')).toEqual(exp);
    expect(classifyVideoUrl('https://www.youtube.com/shorts/abcDEF12345')).toEqual(exp);
    // watch بدون v ⇒ رندرناممکن
    expect(classifyVideoUrl('https://www.youtube.com/watch')).toBeNull();
  });

  it('آپارات: لینکِ صفحه به embed استاندارد تبدیل می‌شود و embedِ آماده دست‌نخورده می‌ماند', () => {
    expect(classifyVideoUrl('https://www.aparat.com/v/xyz12')).toEqual({
      kind: 'embed',
      src: 'https://www.aparat.com/video/video/embed/videohash/xyz12/vt/frame',
    });
    expect(
      classifyVideoUrl('https://www.aparat.com/video/video/embed/videohash/xyz12/vt/frame'),
    ).toEqual({
      kind: 'embed',
      src: 'https://www.aparat.com/video/video/embed/videohash/xyz12/vt/frame',
    });
    expect(classifyVideoUrl('https://www.aparat.com/')).toBeNull();
  });

  it('ویمیوِ پلیر و میزبان‌های ناشناخته', () => {
    expect(classifyVideoUrl('https://player.vimeo.com/video/123456789')).toEqual({
      kind: 'embed',
      src: 'https://player.vimeo.com/video/123456789',
    });
    // آدرسِ تصادفی بدون پسوندِ رسانه ⇒ رندر نمی‌شود (قانونِ اصلیِ صیانت)
    expect(classifyVideoUrl('https://evil.example.com/click/me')).toBeNull();
  });
});

describe('teaserText', () => {
  it('خالی و کوتاه دست‌نخورده', () => {
    expect(teaserText(undefined)).toBe('');
    expect(teaserText('')).toBe('');
    expect(teaserText('سلام')).toBe('سلام');
  });

  it('فاصله‌ها جمع و سقفِ نویسه با سه‌نقطه اعمال می‌شود', () => {
    const flat = teaserText('خطِ اول\n\n   دوم\tبا فاصله');
    expect(flat).toBe('خطِ اول دوم با فاصله');
    const long = 'الف'.repeat(300);
    const out = teaserText(long, 170);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(170);
  });
});
