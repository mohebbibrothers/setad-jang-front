import { describe, expect, it } from 'vitest';

import { computeLessonSequence, type LessonProgressEntry } from './lms-lesson';

const lessons = [
  { id: 1, slug: 'l1', title: 'جلسه‌ی اول', isPreview: false },
  { id: 2, slug: 'l2', title: 'جلسه‌ی دوم', isPreview: false },
  { id: 3, slug: 'l3', title: 'جلسه‌ی سوم', isPreview: false },
];

const progress = (completed: boolean): LessonProgressEntry => ({
  lessonId: 0,
  watchedSeconds: 0,
  durationSnapshot: 0,
  progressPercent: completed ? 100 : 0,
  isCompleted: completed,
  lastPositionSeconds: 0,
  mediaOpened: false,
});

describe('computeLessonSequence — زنجیره‌ی تماشای پشت‌سرهم', () => {
  it('بدون هیچ پیشرفتی فقط جلسه‌ی اول باز است و قفلِ دومی به اولی اشاره می‌کند', () => {
    const seq = computeLessonSequence(lessons, null);
    expect(seq.get(1)).toEqual({ unlocked: true, blocking: null });
    expect(seq.get(2)).toEqual({
      unlocked: false,
      blocking: { id: 1, slug: 'l1', title: 'جلسه‌ی اول' },
    });
    expect(seq.get(3)).toEqual({
      unlocked: false,
      blocking: { id: 1, slug: 'l1', title: 'جلسه‌ی اول' },
    });
  });

  it('با کامل‌شدن هر جلسه، قفلِ بعدی به اولین ناتمامِ پیش‌رو می‌چسبد', () => {
    const map = new Map([[1, progress(true)]]);
    const seq = computeLessonSequence(lessons, map);
    expect(seq.get(2)?.unlocked).toBe(true);
    expect(seq.get(3)).toEqual({
      unlocked: false,
      blocking: { id: 2, slug: 'l2', title: 'جلسه‌ی دوم' },
    });
  });

  it('سوراخِ میانی: دیدنِ جلسه‌ی سه بدونِ دو، همه را پشتِ قفلِ دومی نگه می‌دارد', () => {
    const map = new Map([
      [1, progress(true)],
      [3, progress(true)],
    ]);
    const seq = computeLessonSequence(lessons, map);
    expect(seq.get(2)?.unlocked).toBe(true); // خودِ دومی باز است (اولی کامل)
    expect(seq.get(3)?.unlocked).toBe(false);
    expect(seq.get(3)?.blocking?.id).toBe(2);
  });

  it('با کامل‌شدنِ همه، همه بازند', () => {
    const map = new Map(lessons.map((l) => [l.id, progress(true)]));
    const seq = computeLessonSequence(lessons, map);
    for (const l of lessons) {
      expect(seq.get(l.id)).toEqual({ unlocked: true, blocking: null });
    }
  });

  it('جلسه‌ی پیش‌نمایش از قفل معاف است — حتی وسطِ زنجیره', () => {
    const list = [
      lessons[0],
      { id: 4, slug: 'preview', title: 'پیش‌نمایش', isPreview: true },
      lessons[1],
    ];
    const seq = computeLessonSequence(list, null);
    expect(seq.get(4)).toEqual({ unlocked: true, blocking: null });
    expect(seq.get(2)?.unlocked).toBe(false);
  });
});

describe('مدلِ جدیدِ داده — گیتِ سند و استریمِ امضاشده', () => {
  it('resolveMediaUrl مسیرِ نسبیِ استریمِ امضاشده را زیر پایه‌ی API می‌برد', async () => {
    const { resolveMediaUrl } = await import('./lms-lesson');
    const out = resolveMediaUrl('lms/lessons/7/media/document/stream/?t=sig');
    expect(out.startsWith('lms/')).toBe(false);
    expect(out.endsWith('/lms/lessons/7/media/document/stream/?t=sig')).toBe(true);
  });

  it('resolveMediaUrl نشانیِ مطلقِ بیرونی و رشته‌ی خالی را دست‌نخورده نگه می‌دارد', async () => {
    const { resolveMediaUrl } = await import('./lms-lesson');
    expect(resolveMediaUrl('https://cdn.example.com/v.mp4')).toBe('https://cdn.example.com/v.mp4');
    expect(resolveMediaUrl('')).toBe('');
  });
});
