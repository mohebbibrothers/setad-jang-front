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

  it('گالری دوفریمِ واقعی است: کاور → پرتره‌ی استاد (بدونِ اسلاید مشترک)', () => {
    const slides = courseMediaSlides({
      title: 'جاوا اسکریپت',
      coverUrl: '/lms/covers/javascript.jpg',
      instructor: 'استاد محمدی',
      instructorAvatarUrl: DEFAULT_INSTRUCTOR_AVATAR,
    });
    expect(slides.map((s) => s.url)).toEqual([
      '/lms/covers/javascript.jpg',
      DEFAULT_INSTRUCTOR_AVATAR,
    ]);
    expect(slides[0].alt).toContain('کاور کلاس');
    expect(slides[1].alt).toContain('استاد محمدی');
    // تصویرِ مشترکِ قدیمی («فضای یادگیری قرارگاه آموزشی») به درخواستِ مشتری
    // برای همیشه از گالری حذف شده است.
    expect(slides.some((s) => s.url.includes('class-space'))).toBe(false);
  });

  it('تنظیمِ ایندکسِ آواتار با حضور/عدمِ کاور درست از آب درمی‌آید', () => {
    expect(instructorSlideIndex({ coverUrl: 'x', instructorAvatarUrl: 'y' })).toBe(1);
    expect(instructorSlideIndex({ instructorAvatarUrl: 'y' })).toBe(0);
    expect(instructorSlideIndex({ coverUrl: 'x' })).toBe(0);
  });

  it('بدون کاور/آواتارِ واقعی، گالری خالی است نه فریمِ قرضی', () => {
    const slides = courseMediaSlides({ title: 'تست', instructor: 'مدرس قرارگاه' });
    expect(slides).toHaveLength(0);
  });

  it('فقط کاور یا فقط آواتار → گالریِ تک‌فریمِ صادق', () => {
    expect(
      courseMediaSlides({ title: 'تست', coverUrl: '/c.jpg', instructor: 'مدرس' }),
    ).toHaveLength(1);
    expect(
      courseMediaSlides({ title: 'تست', instructor: 'مدرس', instructorAvatarUrl: '/a.jpg' }),
    ).toHaveLength(1);
  });

  it('لاگیکِ فیلد خالی: رشته‌ی خالی = فاقد تصویر محسوب می‌شود', () => {
    const slides = courseMediaSlides({
      title: 'تست',
      coverUrl: '',
      instructor: 'x',
      instructorAvatarUrl: '',
    });
    expect(slides.every((s) => s.url.length > 0 && !s.url.startsWith('blob:'))).toBe(true);
    expect(slides).toHaveLength(0);
  });
});
