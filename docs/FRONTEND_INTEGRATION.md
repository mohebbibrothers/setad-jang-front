# راهنمای اتصال فرانت به بک‌اند — besat.me

> خلاصه‌ی عملیاتی از مطالعه‌ی کامل `schema.yaml` (۳۶۵ عملیات / ۳۰۳ مسیر / ۶۰۵ اسکیما).
> جزئیات کامل هر اندپوینت در [`API_MAP.md`](./API_MAP.md).

---

## ۱. آدرس پایه

روی پروداکشن، فرانت و API روی **یک origin** هستند:

```
https://besat.me/api/v1/...
```

- مستندات زنده (Swagger): `https://besat.me/api/docs/`
- اسکیمای خام: `https://besat.me/api/schema/`
- در `next.config.mjs` یک rewrite هست: `/api/proxy/:path*` → `${NEXT_PUBLIC_API_URL}/api/v1/:path*/`

⚠️ **Django با `APPEND_SLASH` کار می‌کند.** هر مسیر باید با `/` تمام شود. در
`next.config.mjs` هم `skipTrailingSlashRedirect: true` ست شده تا Next اسلش پایانی
را قبل از رسیدن به Django حذف نکند. اگر اسلش را بیندازی، ۳۰۱/۴۰۴ می‌گیری.

---

## ۲. قالب یکسان پاسخ (envelope)

**همه‌ی** پاسخ‌ها — چه موفق چه ناموفق — در یک پاکت یکسان می‌آیند:

```jsonc
// موفق
{
  "success": true,
  "status_code": 200,
  "message": "...",
  "data": { /* بار اصلی اینجاست */ }
}

// ناموفق
{
  "success": false,
  "status_code": 400,
  "message": "پیام قابل نمایش به کاربر",
  "errors": { "field": ["..."] }   // ممکن است null باشد
}
```

نتیجه‌ی مهم برای فرانت: **همیشه `res.data` را باز کن، نه خود پاسخ را.**
یک `unwrap()` مرکزی در لایه‌ی `src/lib/api.ts` بهترین جاست.

### صفحه‌بندی

لیست‌های صفحه‌بندی‌شده داخل همان `data` قالب DRF را دارند:

```jsonc
{
  "success": true,
  "data": {
    "count": 128,
    "next": "https://besat.me/api/v1/...?page=3",
    "previous": "https://besat.me/api/v1/...?page=1",
    "results": [ /* ... */ ]
  }
}
```

پارامترهای رایج کوئری در کل API: `page`، `page_size`، `search`، `status`،
`created_after`، `created_before`، `is_active`.

---

## ۳. احراز هویت — JWT با «شناسه» (identifier)

بک‌اند مدل **identifier-based** دارد: کاربر با **ایمیل یا شماره موبایل** (هر دو در
یک فیلد به نام `identifier`) کار می‌کند. دو مسیر ورود موازی وجود دارد:

### الف) ورود با رمز عبور

```
POST /api/v1/auth/login/password/
{ "identifier": "user@mail.com | 09121234567", "password": "..." }
→ 200 { data: { tokens: {access, refresh}, user: {...} } }
```

### ب) ورود با کد یک‌بارمصرف (OTP)

```
POST /api/v1/auth/login/otp/request/   { "identifier": "..." }   → 200
POST /api/v1/auth/login/otp/verify/    { "identifier": "...", "code": "..." }
→ 200 { data: { tokens, user } }
```

`otp/request` عمداً **enumeration-safe** است: چه کاربر وجود داشته باشد چه نه،
پاسخ یکسان می‌دهد. پس در UI هرگز نگو «این شماره ثبت نشده».
کدهای `429` (محدودیت نرخ) و `503` (سرویس پیامک/ایمیل در دسترس نیست) را
جداگانه هندل کن.

### ج) ثبت‌نام دو مرحله‌ای

```
POST /api/v1/auth/signup/request/  { "identifier": "..." }        → کد ارسال می‌شود
POST /api/v1/auth/signup/verify/   { "identifier", "code", "password",
                                     "first_name"?, "last_name"? }
→ 200 { data: { tokens, user } }   ← حساب همین‌جا ساخته می‌شود
```

نکته: تا قبل از `verify` **هیچ حسابی ساخته نمی‌شود**. پس فرم ثبت‌نام باید
دو-مرحله‌ای طراحی شود، نه یک فرم بلند.

### د) بازیابی رمز

```
POST /api/v1/auth/password/forgot/request/
POST /api/v1/auth/password/forgot/confirm/
POST /api/v1/auth/password/change/          (نیازمند JWT)
```

### ه) توکن و نشست

```
POST /api/v1/auth/token/refresh/  { "refresh": "..." } → { data: { access, refresh? } }
POST /api/v1/auth/logout/         (نیازمند JWT — refresh را باطل می‌کند)
GET  /api/v1/auth/me/             پروفایل کاربر جاری
PATCH/api/v1/auth/me/
GET  /api/v1/auth/profile/  ·  PATCH /api/v1/auth/profile/
GET  /api/v1/auth/sessions/                       لیست نشست‌های فعال
POST /api/v1/auth/sessions/{session_id}/revoke/   قطع یک نشست
```

وجود `sessions/` یعنی می‌شود یک صفحه‌ی «دستگاه‌های من» حرفه‌ای ساخت.

### و) شناسه‌های چندگانه

```
POST /api/v1/auth/identifiers/add/request/
POST /api/v1/auth/identifiers/add/verify/
POST /api/v1/auth/identifiers/make-primary/
```

یعنی یک کاربر می‌تواند هم ایمیل و هم موبایل داشته باشد و یکی را اصلی کند.

### 🚫 اندپوینت‌های منسوخ — استفاده نکن

بک‌اند صراحتاً این ۶ تا را `deprecated` علامت زده:

| منسوخ | جایگزین |
|---|---|
| `POST /auth/login/` | `POST /auth/login/password/` |
| `POST /auth/register/` | `signup/request/` + `signup/verify/` |
| `POST /auth/verify-email/` | `signup/verify/` |
| `POST /auth/resend-verification/` | `signup/request/` (دوباره) |
| `POST /auth/password/forgot/` | `password/forgot/request/` |
| `POST /auth/password/reset/` | `password/forgot/confirm/` |

> فرانت قبلی (که در PR #1 مِرج شده بود و حذف شد) روی نسخه‌های منسوخ ایمیل‌محور
> بنا شده بود. نسخه‌ی جدید را از ابتدا روی جریان identifier می‌سازیم.

---

## ۴. حوزه‌های کاری و حجم آن‌ها

| حوزه | مسیر | عمومی/کاربری | مدیریتی |
|---|---|---:|---:|
| میز پشتیبانی (تیکتینگ) | `/api/v1/support/` | ۱۷ | ۵۱ |
| آموزش (LMS) | `/api/v1/lms/` | ۲۶ | ۳۵ |
| جایزه‌ای برای عدالت (R4J) | `/api/v1/r4j/` | ۹ | ۵۲ |
| مددکار (کمپین‌ها) | `/api/v1/madadkar/` | ۱۳ | ۴۵ |
| دیوار مهربانی | `/api/v1/kindness-wall/` | ۲۰ | ۲۱ |
| احراز هویت | `/api/v1/auth/` | ۲۵ | ۹ |
| جهاد تبیین | `/api/v1/tabyin/` | ۵ | ۹ |
| گزارشات مردمی | `/api/v1/public-reports/` | ۲ | ۸ |
| اعلان‌ها | `/api/v1/notifications/` | ۵ | ۳ |
| سلامت سیستم | `/api/v1/health/` | ۳ | ۰ |

**نکته‌ی راهبردی:** فرانت فعلی سایت فقط بخش کوچکی از این‌ها را پوشش می‌دهد.
سه حوزه‌ی «میز پشتیبانی (۱۷ اندپوینت کاربری)»، «LMS (۲۶)» و «دیوار مهربانی (۲۰)»
عملاً هنوز صفحه‌ی اختصاصی ندارند — بیشترین ارزشِ افزوده آنجاست.

---

## ۵. نکات فنی که باید در فرانت رعایت شود

1. **کش سمت بک‌اند.** خیلی از اندپوینت‌های عمومی cache دارند (مثلاً لیست تبیین
   TTL=۶۰ ثانیه، جزئیات TTL=۵ دقیقه) و بعد از تغییرات ادمین خودکار invalidate
   می‌شوند. پس `revalidate` سمت Next را با همین بازه‌ها هم‌تراز کن؛ کش دوباره‌کاری لازم نیست.
2. **آپلود فایل.** بیشتر اندپوینت‌های ارسال محتوا هر سه‌ی `application/json`،
   `x-www-form-urlencoded` و `multipart/form-data` را قبول می‌کنند. برای فایل
   حتماً `multipart/form-data`.
3. **تصاویر ریموت.** بک‌اند فقط `jpg/jpeg/png/webp` می‌پذیرد و `dangerouslyAllowSVG`
   عمداً خاموش است. هاست‌های مجاز در `next.config.mjs` لیست شده‌اند.
4. **۴۲۹ را جدی بگیر.** روی OTP و ارسال گزارش، rate limit فعال است؛ UI باید
   شمارش معکوس و پیام درست نشان دهد.
5. **`external_id` در تبیین.** جزئیات محتوای تبیین با `external_id` گرفته می‌شود،
   نه `id` عددی و نه slug.
6. **هدرها.** روی همه‌ی مسیرها CSP و HSTS ست شده؛ هر اسکریپت inline جدیدی
   باید با آن سازگار باشد.

---

## ۶. قدم‌های پیشنهادی بعدی

1. بازنویسی لایه‌ی `src/lib/api.ts` با unwrap مرکزی + مدیریت خودکار refresh توکن
   + تایپ‌های تولیدشده از OpenAPI (تا دستی تایپ ننویسیم).
2. جریان احراز هویت جدید روی identifier (دو مسیر رمز و OTP) با UI دومرحله‌ای.
3. صفحات حوزه‌های پوشش‌داده‌نشده: میز پشتیبانی، LMS، دیوار مهربانی.
