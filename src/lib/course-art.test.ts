import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COURSE_COVER,
  DEFAULT_INSTRUCTOR_AVATAR,
  courseCoverArt,
  courseMediaSlides,
  instructorSlideIndex,
} from './course-art';

describe('course-art — آرت‌ورکِ fallback و گالریِ رسانه‌ای', () => {
  it('اسلاگ‌های شناخته‌شده کاورِ اختصاصی دارند؛ بقیه کاورِ عمومی می‌گیرند', () => {
    expect(courseCoverArt('php')).toBe('/lms/covers/php.jpg');
    expect(courseCoverArt('جاوا-اسکریپت')).toBe('/lms/covers/javascript.jpg');
    expect(courseCoverArt('پایتون')).toBe('/lms/covers/python.jpg');
    expect(courseCoverArt('کار-با-fpv')).toBe('/lms/covers/fpv.jpg');
    expect(courseCoverArt('هر-کلاس-جدیدی')).toBe(DEFAULT_COURSE_COVER);
  });

  it('ترتیبِ سه‌فریم: کاور → فضای یادگیری → پرتره‌ی استاد', () => {
    const slides = courseMediaSlides({
      title: 'جاوا اسکریپت',
      coverUrl: '/lms/covers/javascript.jpg',
      instructor: 'استاد محمدی',
      instructorAvatarUrl: DEFAULT_INSTRUCTOR_AVATAR,
    });
    expect(slides.map((s) => s.url)).toEqual([
      '/lms/covers/javascript.jpg',
      '/lms/class-space.jpg',
      DEFAULT_INSTRUCTOR_AVATAR,
    ]);
    expect(slides[0].alt).toContain('کاور کلاس');
    expect(slides[2].alt).toContain('استاد محمدی');
  });

  it('بدون کاور/آواتارِ واقعی، fallback عبور می‌کند و ایندکسِ آواتار درست می‌ماند', () => {
    const slides = courseMediaSlides({ title: 'تست', instructor: 'مدرس قرارگاه' });
    expect(slides).toHaveLength(1); // فقط فضای یادگیری
    expect(instructorSlideIndex({ coverUrl: 'x', instructorAvatarUrl: 'y' })).toBe(2);
    expect(instructorSlideIndex({ instructorAvatarUrl: 'y' })).toBe(1);
    expect(instructorSlideIndex({ coverUrl: 'x' })).toBe(0);
  });

  it('لاگیکِ فیلد خالی: رشته‌ی خالی = فاقد تصویر محسوب می‌شود', () => {
    const slides = courseMediaSlides({
      title: 'تست',
      coverUrl: '',
      instructor: 'x',
      instructorAvatarUrl: '',
    });
    expect(slides.every((s) => s.url.length > 0 && !s.url.startsWith('blob:'))).toBe(true);
    expect(slides).toHaveLength(1);
  });
});
