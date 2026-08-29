import { describe, expect, it } from 'vitest';
import {
  buildFeedCountQuery,
  buildFeedPath,
  buildFeedQuery,
  dedupeFeed,
  dedupeFeedContent,
  feedContentKey,
  feedLooseKey,
  feedFiltersFromSearchParams,
  feedItemKind,
  feedScopeKey,
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

  it('پوستهٔ تهیِ نویسندهٔ یکسان ادغام می‌شود؛ نویسندهٔ متفاوت هر دو می‌مانند', () => {
    // بدون نویسنده: هر دو پوستهٔ تهی → کلید void: مشترک → یک نسخه
    expect(dedupeFeedContent([{ external_id: 'a' }, { external_id: 'b' }])).toHaveLength(1);
    const c1: RevayatItem = { external_id: 'c1', author_username: 'تهران/کانال (الف)' };
    const c2: RevayatItem = { external_id: 'c2', author_username: 'تهران/کانال (الف)' };
    expect(dedupeFeedContent([c1, c2])).toHaveLength(1);
    const d1: RevayatItem = { external_id: 'd1', author_username: 'تهران/کانال (الف)' };
    const d2: RevayatItem = { external_id: 'd2', author_username: 'شیراز/کانال (ب)' };
    expect(dedupeFeedContent([d1, d2])).toHaveLength(2);
  });

  it('feedContentKey — نیم‌فاصله و اعراب در کلید بی‌اثرند', () => {
    expect(feedContentKey(item('x', 'بعثت‌مردم', 'مهمَترین روایت'))).toBe(
      feedContentKey(item('y', 'بعثتمردم', 'مهمترین روایت')),
    );
  });
});

describe('feedLooseKey / پاسِ فشرده — نسخه‌هایی که فقط در نویسه‌های نامرئی فرق دارند', () => {
  const item = (id: string, title?: string, desc?: string, url?: string): RevayatItem => ({
    external_id: id,
    title,
    description: desc,
    attachments: url ? [{ url, media_type: 'image' }] : [],
  });

  it('نشانه‌های نامرئیِ جهت‌دهی (ALM/RLM و bidi embedding) در کلید بی‌اثرند', () => {
    const plain = item('a', 'روایتِ روز', 'دشمن را بشناسید');
    const marked = item('b', 'روایتِ روز', '‏‪دشمن را بشناسید‬');
    expect(feedLooseKey(plain)).toBe(feedLooseKey(marked));
    expect(dedupeFeedContent([plain, marked])).toHaveLength(1);
  });

  it('تفاوتِ سجاوند (نقطه/سه‌نقطه/ویرگول) دو نسخه‌ی یک متن نمی‌سازد', () => {
    const a = item('a', 'بیانیه', 'پیروزی نزدیک است.');
    const b = item('b', 'بیانیه', 'پیروزی نزدیک است…!');
    const c = item('c', 'بیانیه', 'پیروزی، نزدیک است؟');
    expect(dedupeFeedContent([a, b, c]).map((i) => i.external_id)).toEqual(['a']);
  });

  it('«عنوانِ پر + کپشنِ خالی» با «عنوانِ خالی + کپشنِ پر» برابر است', () => {
    const a = item('a', 'روایتِ جهاد تبیین', undefined);
    const b = item('b', undefined, 'روایتِ جهاد تبیین');
    expect(feedLooseKey(a)).toBe(feedLooseKey(b));
    expect(dedupeFeedContent([a, b])).toHaveLength(1);
  });

  it('متنِ واقعاً متفاوت هرگز یکی شمرده نمی‌شود', () => {
    const a = item('a', 'روایتِ روز', 'متنِ نخست');
    const b = item('b', 'روایتِ روز', 'متنِ دومِ متفاوت');
    expect(dedupeFeedContent([a, b])).toHaveLength(2);
    const c = item('c', 'روایتِ یک', undefined);
    const d = item('d', 'روایتِ دو', undefined);
    expect(dedupeFeedContent([c, d])).toHaveLength(2);
  });

  it('آیتمِ رسانه‌دار کلیدِ فشرده نمی‌گیرد — حتی با متنِ عیناً یکسان', () => {
    const a = item('a', 'گزارشِ تصویری', 'کپشنِ همسان', 'https://m/9.jpg');
    const b = item('b', 'گزارشِ تصویری', 'کپشنِ همسان', 'https://m/10.jpg');
    expect(feedLooseKey(a)).toBeNull();
    expect(dedupeFeedContent([a, b])).toHaveLength(2);
  });

  it('پوستهٔ تهی (نه متن دیگر، نه فایلِ عنوانی‌دار) کلیدِ void می‌گیرد', () => {
    expect(feedLooseKey({ external_id: 'x' })).toBe('void:');
    expect(feedLooseKey(item('y', '  ', '…'))).toBe('void:');
    const authored: RevayatItem = { external_id: 'n', author_username: 'هرمزگان/ع۱ (بوستان)' };
    expect(feedLooseKey(authored)).toBe('void:هرمزگانع۱بوستان');
  });

  it('پیوستِ «سایر» (سند): با عنوانِ فایل محافظت می‌شود، نه URL — تکراریِ بی‌عنوان ادغام می‌شود', () => {
    const file = (id: string, url: string, title?: string): RevayatItem => ({
      external_id: id,
      attachments: [{ url, title, media_type: 'other' }],
    });
    // دو متنِ همسان + سندِ بی‌عنوان (URL فرق!) → یکی (متن هویت است، نه ذخیره‌سازی)
    const a1 = { ...file('a1', 'https://m/1.pdf'), title: 'سند', description: 'متنِ همسان' };
    const a2 = { ...file('a2', 'https://m/2.pdf'), title: 'سند', description: 'متنِ همسان' };
    expect(dedupeFeedContent([a1, a2])).toHaveLength(1);
    // دو متنِ همسان ولی دو سندِ عنوانی‌دارِ متفاوت → هر دو نمایش داده می‌شوند
    const b1 = { ...file('b1', 'https://m/1.pdf', 'نامهٔ اول'), title: 'سند' };
    const b2 = { ...file('b2', 'https://m/2.pdf', 'نامهٔ دوم'), title: 'سند' };
    expect(dedupeFeedContent([b1, b2])).toHaveLength(2);
    // دو متنِ همسان ولی یکی بدونِ سند و دیگری با سندِ عنوانی‌دار → هر دو (فایل تفاوت است)
    const c1 = { external_id: 'c1', title: 'سند', description: 'متنِ همسان' };
    const c2 = {
      ...file('c2', 'https://m/2.pdf', 'نامهٔ جدید'),
      title: 'سند',
      description: 'متنِ همسان',
    };
    expect(dedupeFeedContent([c1, c2])).toHaveLength(2);
  });

  it('سه نسخه‌ی سندیکاشده با موجِ کوتاه و نویسه‌های ترکیبی → فقط یکی', () => {
    const a = item('a', 'وصیت‌نامه', 'شهید راهِ آزادی را گشود');
    const b = item('b', 'وصیت‌نامه', 'شهید راهِ آزادی را گشود‏');
    const c = item('c', 'وصیت‌نامه', 'شهید راهِ آزادی را گشود؟');
    expect(dedupeFeedContent([a, b, c]).map((i) => i.external_id)).toEqual(['a']);
  });
});

describe('feedScopeKey — کلیدِ دامنه‌ی فیلتر برای اعتبارِ شمارِ اسکن‌شده', () => {
  it('پایدار است: فیلترهای معادل همیشه کلیدِ یکسان می‌سازند', () => {
    const a = feedScopeKey({ q: 'ایران', type: 'other', author: 'هرمزگان' });
    const b = feedScopeKey({ q: ' ایران ', type: 'other', author: ' هرمزگان' });
    expect(a).toBe(b);
  });

  it('تمایزگذار است: کوچک‌ترین تغییرِ فیلتر → کلیدِ دیگر (عددِ دیدگاهِ قبلی هرگز با دیدگاهِ تازه جفت نمی‌شود)', () => {
    const base = feedScopeKey({ q: '', type: '', author: '' });
    expect(feedScopeKey({ q: '', type: 'other', author: '' })).not.toBe(base);
    expect(feedScopeKey({ q: 'ایران', type: '', author: '' })).not.toBe(base);
    expect(feedScopeKey({ q: '', type: '', author: 'هرمزگان' })).not.toBe(base);
    expect(feedScopeKey({ q: '', type: 'video', author: '' })).not.toBe(
      feedScopeKey({ q: '', type: 'audio', author: '' }),
    );
  });

  it('با متنِ حاوی فاصله/جداکننده‌ی معمولی برخورد نمی‌کند', () => {
    expect(feedScopeKey({ q: 'الف', type: '', author: '' })).not.toBe(
      feedScopeKey({ q: '', type: '', author: 'الف' }),
    );
  });
});

describe('buildFeedCountQuery — کوئریِ سرویسِ شمارِ واقعی', () => {
  it('واژگانِ عمومیِ صفحه را نقشه می‌کند (q/type/author) و فیلدهای خالی را حذف', () => {
    const params = new URLSearchParams(
      buildFeedCountQuery({ q: 'وعده صادق', type: 'other', author: ' بوشهر ' }),
    );
    expect(params.get('q')).toBe('وعده صادق');
    expect(params.get('type')).toBe('other');
    expect(params.get('author')).toBe('بوشهر');
    expect(params.has('page')).toBe(false);
    expect(params.has('page_size')).toBe(false);
    expect(params.has('media_type')).toBe(false);
  });

  it('دیدگاهِ پیش‌فرض → کوئریِ خالی (همان کرپوسِ کامل)', () => {
    expect(buildFeedCountQuery({ q: '', type: '', author: '' })).toBe('');
  });
});
