# بعثت مردم — فرانت‌اند

فرانت‌اند سایت [besat.me](https://besat.me) با Next.js 15 (App Router)، React 19،
TypeScript و Tailwind CSS. کاملاً راست‌به‌چپ و فارسی.

بک‌اند در مخزن جداگانه‌ی [`setad-jang`](https://github.com/mohebbibrothers/setad-jang)
است (Django + DRF) و روی همان دامنه زیر `/api/v1/` سرو می‌شود.

---

## شروع سریع

```bash
nvm use                 # Node 20 (از .nvmrc)
npm ci
cp .env.example .env.local
npm run dev             # http://localhost:3000
```

## دستورها

| دستور | کار |
| --- | --- |
| `npm run dev` | سرور توسعه |
| `npm run build` | بیلد پروداکشن |
| `npm start` | اجرای بیلد |
| `npm run lint` | ESLint (flat config) |
| `npm run lint:fix` | رفع خودکار مشکلات لینت |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | تست‌ها (Vitest) |
| `npm run test:watch` | تست در حالت watch |
| `npm run test:coverage` | تست با گزارش پوشش |
| `npm run format` | قالب‌بندی با Prettier |
| `npm run format:check` | بررسی قالب‌بندی بدون تغییر |
| `npm run api:types` | بازتولید تایپ‌ها از OpenAPI بک‌اند |
| `npm run verify` | کل زنجیره: format + lint + typecheck + test + build |

قبل از هر پوش، `npm run verify` را بزن — همان چیزی است که CI اجرا می‌کند.

---

## تایپ‌های API — منبع حقیقت واحد

هیچ تایپ API را دستی ننویس. کل قرارداد از اسکیمای OpenAPI بک‌اند تولید می‌شود:

```bash
npm run api:types                                   # از https://besat.me/api/schema/
npm run api:types -- ../setad-jang/schema.yaml      # از فایل محلی
SCHEMA_SRC=http://127.0.0.1:8000/api/schema/ npm run api:types
```

خروجی در `src/types/api.ts` است و **کامیت می‌شود** تا بیلد به شبکه وابسته نباشد
و هر تغییر قرارداد در diff گیت دیده شود.

برای مصرف، از `src/lib/typed-api.ts` استفاده کن، نه از `paths` خام:

```ts
import { apiGet, apiPost } from '@/lib/typed-api';

// نوع خروجی خودکار استنتاج می‌شود؛ کلیدهای query هم بررسی می‌شوند
const campaigns = await apiGet('/api/v1/madadkar/campaigns/', {
  query: { page_size: 8, ordering: '-published_at' },
  revalidate: 300,
  tags: ['campaigns'],
});

// پارامتر مسیر در سطح تایپ اجباری است
const campaign = await apiGet('/api/v1/madadkar/campaigns/{slug}/', {
  params: { slug },
});

// فیلدهای الزامی بدنه بررسی می‌شوند
await apiPost('/api/v1/auth/login/password/', {
  body: { identifier, password },
  skipAuth: true,
});
```

چهار تضمین در زمان کامپایل: وجود مسیر، پشتیبانی متد روی آن مسیر، اجباری‌بودن
پارامترهای `{slug}`، و استنتاج نوع پاسخ **پس از باز شدن پاکت**.

---

## معماری

```
src/
├── app/          مسیرهای App Router (RSC به‌صورت پیش‌فرض)
├── components/   کامپوننت‌های UI
│   ├── home/     سکشن‌های صفحه‌ی اصلی
│   ├── layout/   هدر، فوتر، ناوبری
│   └── ui/       اجزای پایه
├── lib/          منطق: api، auth، لودرهای داده، ابزارها
└── types/        api.ts — تولید خودکار، ویرایش دستی ممنوع
```

### قراردادهای بک‌اند که باید رعایت شوند

1. **پاکت یکنواخت**: هر پاسخ `{ success, status_code, message, data }` است.
   `apiFetch` خودش `data` را باز می‌کند.
2. **اسلش پایانی الزامی** — جنگو `APPEND_SLASH` دارد.
3. **صفحه‌بندی DRF** داخل `data`: `count / next / previous / results`.
4. **احراز هویت identifier-محور** (ایمیل یا موبایل در یک فیلد) با دو مسیر رمز و OTP.
5. **۶ اندپوینت auth منسوخ** که نباید استفاده شوند — فهرست در
   [`docs/FRONTEND_INTEGRATION.md`](docs/FRONTEND_INTEGRATION.md).

---

## مستندات

| سند | محتوا |
| --- | --- |
| [`docs/API_MAP.md`](docs/API_MAP.md) | نقشه‌ی کامل ۳۶۵ عملیات API با پارامترها و پاسخ‌ها |
| [`docs/FRONTEND_INTEGRATION.md`](docs/FRONTEND_INTEGRATION.md) | قراردادها، جریان احراز هویت، تله‌های فنی |
| [`docs/DEEP_ANALYSIS.md`](docs/DEEP_ANALYSIS.md) | تحلیل وضعیت، شکاف پوشش، بدهی فنی، نقشه‌ی راه |
| [`DEPLOY.md`](DEPLOY.md) | استقرار روی سرور |

---

## استقرار

روی سرور، با یک دستور:

```bash
./update-front.sh
```

fetch → همگام‌سازی → نصب وابستگی‌ها (فقط در صورت تغییر lockfile) → بیلد →
ری‌استارت pm2 → health-check → و rollback خودکار روی هر خطا.
جزئیات و فلگ‌ها در [`DEPLOY.md`](DEPLOY.md).

برای ممیزی سایت زنده از روی خود سرور: `./scripts/site-audit.sh`

---

## کیفیت

هر push و PR در CI این زنجیره را می‌گذراند: `format:check` → `lint` →
`typecheck` → `test:coverage` → `build`.

`npm ci` عمداً بدون `--legacy-peer-deps` اجرا می‌شود؛ اگر درخت وابستگی‌ها
دوباره ناسازگار شود، در CI شکست می‌خورد نه سر دیپلوی.
