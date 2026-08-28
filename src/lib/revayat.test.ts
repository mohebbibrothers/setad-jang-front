import { describe, expect, it } from 'vitest';
import {
  buildFeedPath,
  buildFeedQuery,
  dedupeFeed,
  dedupeFeedContent,
  feedContentKey,
  feedFiltersFromSearchParams,
  feedItemKind,
  heroOfFeedItem,
  initialOf,
  parseAuthor,
  readTimeFa,
  type RevayatItem,
} from './revayat';

describe('parseAuthor — الگوی «شهر/کد (نام مستعار)»', () => {
  it('نام از داخلِ پرانتز و مکان از قبلِ اسلش', () => {
    expect(parseAuthor('هرمزگان/ع۱ (بوستان پیرا)')).toEqual({
      name: 'بوستان پیرا',
      location: 'هرمزگان',
    });
  });

  it('بدون پرانتز: بخشِ بعد از اسلش نام است', () => {
    expect(parseAuthor('تهران/کانال رسمی')).toEqual({ name: 'کانال رسمی', location: 'تهران' });
  });

  it('بدون اسلش: کلِ رشته نام است و مکانی نیست', () => {
    expect(parseAuthor('جهاد تبیین')).toEqual({ name: 'جهاد تبیین', location: undefined });
  });

  it('فضای خالیِ اضافی تمیز می‌شود و ورودیِ تهی امن است', () => {
    expect(parseAuthor('  شیراز / سایت ( خبر جنوب ) ')).toEqual({
      name: 'خبر جنوب',
      location: 'شیراز',
    });
    expect(parseAuthor('')).toEqual({ name: '', location: undefined });
    expect(parseAuthor(undefined)).toEqual({ name: '', location: undefined });
    expect(parseAuthor(null)).toEqual({ name: '', location: undefined });
  });
});

describe('initialOf', () => {
  it('نخستین نویسه‌ی معنادار', () => {
    expect(initialOf('بوستان پیرا')).toBe('ب');
    expect(initialOf('')).toBe('ر');
    expect(initialOf(undefined)).toBe('ر');
  });
});

describe('readTimeFa — زمانِ مطالعه', () => {
  it('بر اساس ۲۰۰ کلمه در دقیقه با سقفِ رو به بالا', () => {
    expect(readTimeFa('سلام دنیا')).toBe('۱ دقیقه مطالعه');
    expect(readTimeFa(new Array(420).fill('وازه').join(' '))).toBe('۳ دقیقه مطالعه');
  });

  it('متنِ تهی → null', () => {
    expect(readTimeFa('')).toBeNull();
    expect(readTimeFa(undefined)).toBeNull();
  });
});

describe('feedItemKind — قراردادِ «صوت همیشه می‌برد» در فید هم', () => {
  it('صوت + کاورِ ویدئویی → پادکست، نه فیلم', () => {
    expect(
      feedItemKind({
        primary_media_type: 'video',
        attachments: [
          { url: 'https://m/a.mp4', media_type: 'video' },
          { url: 'https://m/a.mp3', media_type: 'audio' },
        ],
      }),
    ).toBe('audio');
  });

  it('بدونِ رسانه → نوشته', () => {
    expect(feedItemKind({ attachments: [] })).toBe('other');
  });
});

describe('heroOfFeedItem', () => {
  const item: RevayatItem = {
    external_id: 'x1',
    attachments: [
      { url: 'https://m/pic.png', media_type: 'image' },
      { url: 'https://m/ep.mp3', media_type: 'audio' },
    ],
  };

  it(' قهرمان = صوت؛ کاور = نخستین تصویر', () => {
    const { hero, image, all } = heroOfFeedItem(item);
    expect(hero?.media_type).toBe('audio');
    expect(image?.media_type).toBe('image');
    expect(all).toHaveLength(2);
  });

  it('بدونِ تصویر، image تعریف‌نشده است', () => {
    const { image } = heroOfFeedItem({
      attachments: [{ url: 'https://m/a.mp3', media_type: 'audio' }],
    });
    expect(image).toBeUndefined();
  });
});

describe('buildFeedQuery / buildFeedPath', () => {
  it('کوئریِ API همه‌ی فیلترها + صفحه', () => {
    const qs = buildFeedQuery({ q: 'جنگ اقتصادی', type: 'audio', author: 'هرمزگان' }, 3);
    const p = new URLSearchParams(qs);
    expect(p.get('page')).toBe('3');
    expect(p.get('media_type')).toBe('audio');
    expect(p.get('author')).toBe('هرمزگان');
    expect(p.get('search')).toBe('جنگ اقتصادی');
  });

  it('فیلترِ خالی کوئری اضافه نمی‌کند', () => {
    const qs = buildFeedQuery({ q: '', type: '', author: ' ' }, 1, 12);
    expect(qs).toBe('page=1&page_size=12');
  });

  it('مسیرِ صفحه فقط فیلترهای پر را می‌گذارد', () => {
    expect(buildFeedPath({ q: '', type: '', author: '' })).toBe('/tabyin');
    expect(buildFeedPath({ q: 'ایران', type: 'video', author: '' })).toContain('/tabyin?');
    const p = new URLSearchParams(
      buildFeedPath({ q: 'ایران', type: 'video', author: '' }).split('?')[1],
    );
    expect(p.get('q')).toBe('ایران');
    expect(p.get('type')).toBe('video');
  });
});

describe('feedFiltersFromSearchParams — امن در برابرِ نویزِ URL', () => {
  it('مقادیر معتبر را می‌خواند و آرایه را تخت می‌کند', () => {
    expect(feedFiltersFromSearchParams({ q: ['تست'], type: 'audio', author: 'شیراز' })).toEqual({
      q: 'تست',
      type: 'audio',
      author: 'شیراز',
    });
  });

  it('type نامعتبر به «همه» فرو می‌افتد', () => {
    expect(feedFiltersFromSearchParams({ type: 'hack' }).type).toBe('');
    expect(feedFiltersFromSearchParams({}).type).toBe('');
  });
});

describe('dedupeFeed — اسکرولِ بی‌پایان بدونِ تکرار', () => {
  it('external_id تکراری اضافه نمی‌شود و ترتیب حفظ است', () => {
    const a: RevayatItem = { external_id: 'a' };
    const b: RevayatItem = { external_id: 'b' };
    const c: RevayatItem = { external_id: 'c' };
    expect(dedupeFeed([a, b], [b, c]).map((i) => i.external_id)).toEqual(['a', 'b', 'c']);
  });
});

describe('dedupeFeedContent — محتوای «عیناً یکسان» فقط یک‌بار', () => {
  const item = (id: string, title?: string, desc?: string, url?: string): RevayatItem => ({
    external_id: id,
    title,
    description: desc,
    attachments: url ? [{ url, media_type: 'image' }] : [],
  });

  it('دو نوشته‌ی کاملاً یکسان → فقط نخستین می‌ماند و ترتیب حفظ است', () => {
    const a = item('a', 'بیانیه', 'متن ثابت');
    const b = item('b', 'بیانیه', 'متن ثابت');
    const c = item('c', 'بیانیه‌ی دیگر', 'متن دیگر');
    expect(dedupeFeedContent([a, b, c]).map((i) => i.external_id)).toEqual(['a', 'c']);
  });

  it('تفاوتِ سبک‌نویسی (ی/ك عربی، کشیده، اعراب، فاصله‌ی اضافه) یکسان شمرده می‌شود', () => {
    const a = item('a', 'کتاب', 'سلام بر شما');
    const b = item('b', 'كتاب', '  سلام  بر\nشما ');
    const c = item('c', 'کـتاب', 'سَلام بر شما');
    expect(dedupeFeedContent([a, b, c]).map((i) => i.external_id)).toEqual(['a']);
  });

  it('متنِ یکسان ولی رسانه‌ی متفاوت — دو محتوای مجزا (داده قربانی نمی‌شود)', () => {
    const a = item('a', 'گزارش', 'کپشن همسان', 'https://m/1.jpg');
    const b = item('b', 'گزارش', 'کپشن همسان', 'https://m/2.jpg');
    expect(dedupeFeedContent([a, b])).toHaveLength(2);
  });

  it('متنِ یکسان + همان رسانه → یکی می‌ماند', () => {
    const a = item('a', 'گزارش', 'کپشن همسان', 'https://m/1.jpg');
    const b = item('b', 'گزارش', 'کپشن همسان', 'https://m/1.jpg');
    expect(dedupeFeedContent([a, b])).toHaveLength(1);
  });

  it('هر دو تهی و بدون رسانه — به external_id فرو می‌افتد و هیچ‌کدام حذف نمی‌شوند', () => {
    expect(dedupeFeedContent([{ external_id: 'a' }, { external_id: 'b' }])).toHaveLength(2);
  });

  it('feedContentKey — نیم‌فاصله و اعراب در کلید بی‌اثرند', () => {
    expect(feedContentKey(item('x', 'بعثت‌مردم', 'مهمَترین روایت'))).toBe(
      feedContentKey(item('y', 'بعثتمردم', 'مهمترین روایت')),
    );
  });
});
