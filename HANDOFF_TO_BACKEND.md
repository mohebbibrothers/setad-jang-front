# Frontend Handoff — Deploy-Ready Package

> **از**: تیم فرانت
> **به**: تیم بک‌اند / DevOps
> **تاریخ**: 1405-04-23
> **Repo**: <https://github.com/mohebbibrothers/setad-jang-front>
> **Commit**: `4f5d281` روی branch `main`
> **Tag**: `v1.0.0-homepage`
>
> این سند تنها چیزی است که برای بالا آوردن فرانت روی سرور موقت
> (`http://188.253.2.86`) لازم دارید. صفحات داخلی (auth, dashboard,
> detail pages) در Phase 2 توسعه داده می‌شوند؛ در Phase 1 (این نسخه)
> فقط صفحه‌ی اصلی، جست‌وجوی سراسری، و صفحه‌ی نتایج جست‌وجو live است.

---

## 1. TL;DR — اگر عجله دارید

```bash
# 1) Clone repo
git clone https://github.com/mohebbibrothers/setad-jang-front.git
cd setad-jang-front
git checkout v1.0.0-homepage

# 2) Env
cp .env.staging.example .env.production

# 3) Install + build (peer-dep flag لازم است چون React 19 RC است)
npm ci --legacy-peer-deps
npm run build

# 4) Run (Node ≥ 18)
PORT=3000 npm start
# → http://188.253.2.86:3000
```

سرویس روی پورت `3000` گوش می‌دهد. اگر روی Nginx می‌گذارید، proxy_pass به `http://127.0.0.1:3000/` کافی است.

---

## 2. پیش‌نیازهای سرور

| نیاز | نسخه پیشنهادی | چرا |
|------|--------------|------|
| Node.js | 20 LTS | Next.js 15 روی 18.18+ کار می‌کند، 20 پایدارتر |
| npm | 10+ | همراه Node 20 نصب است |
| RAM | ≥ 1 GB | Build peak ~800 MB |
| CPU | 1 vCPU کافی است | SSR سبک |
| فضای دیسک | ~500 MB | node_modules + `.next/` |
| Reverse proxy | Nginx یا Caddy | برای TLS + gzip/brotli در آینده |
| Process manager | PM2 یا systemd | برای auto-restart |

بک‌اند دیگر روی همین سرور بالاست (`:18080`)، بنابراین فقط پورت `3000` برای فرانت کافی است.

---

## 3. متغیرهای محیطی

فایل `.env.staging.example` را کپی کنید به `.env.production`. سه مقدار مهم:

```env
NEXT_PUBLIC_SITE_URL=http://188.253.2.86:3000
NEXT_PUBLIC_API_URL=http://188.253.2.86:18080
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

**اخطار مهم**:
- کلیدهای `NEXT_PUBLIC_*` در زمان **build** خوانده می‌شوند، نه runtime. اگر بعداً مقدار عوض شد، `npm run build` را دوباره اجرا کنید.
- هیچ کلید سری در فرانت نداریم — هرچه اینجا بگذارید در client bundle قابل مشاهده است. این عمدی است.

---

## 4. مراحل build + run

### 4.1 نصب dependencyها
```bash
npm ci --legacy-peer-deps
```

⚠️ **حتماً `--legacy-peer-deps`**. دلیلش این است که `react@19.0.0-rc` peer-dep چند پکیج (framer-motion, lucide-react) با React 18/19 مطابقت دارد ولی npm سخت‌گیر است. این پرچم فقط peer conflict را ignore می‌کند، package-lock دست‌نخورده باقی می‌ماند.

### 4.2 Production build
```bash
npm run build
```
خروجی:
```
Route (app)              Size      First Load JS
┌ ○ /                    36.7 kB         206 kB
├ ○ /_not-found          137 B          100 kB
├ ○ /manifest.webmanifest 0 B              0 B
├ ○ /robots.txt          0 B              0 B
├ ƒ /search              198 B          162 kB
└ ○ /sitemap.xml         0 B              0 B
+ Shared chunks                         100 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- صفحه‌ی اصلی SSG است با ISR (revalidate هر ۵ دقیقه)
- `/search` SSR است (نیاز به query string دارد)
- بقیه routeها static asset هستند

### 4.3 Start
```bash
PORT=3000 HOSTNAME=0.0.0.0 npm start
```

- `PORT` پیش‌فرض 3000 است
- `HOSTNAME=0.0.0.0` تا از بیرون هم قابل دسترسی باشد (مهم!)

---

## 5. راه‌اندازی با PM2 (پیشنهادی)

```bash
sudo npm install -g pm2

cd /var/www/setad-jang-front

pm2 start npm --name "setadjang-front" -- start \
  --env production \
  --update-env

pm2 save
pm2 startup   # یک بار برای فعال‌سازی auto-start
```

مانیتور:
```bash
pm2 logs setadjang-front
pm2 monit
pm2 restart setadjang-front
```

**دسترسی به env در PM2**: فایل `.env.production` باید در همان directory باشد که `npm start` را اجرا می‌کنید. Next.js خودش آن را می‌خواند.

---

## 6. راه‌اندازی با systemd (جایگزین PM2)

فایل `/etc/systemd/system/setadjang-front.service`:
```ini
[Unit]
Description=Setad-Jang Next.js frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/setad-jang-front
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
EnvironmentFile=/var/www/setad-jang-front/.env.production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable setadjang-front
sudo systemctl start setadjang-front
sudo systemctl status setadjang-front
```

---

## 7. Nginx reverse proxy (اختیاری ولی توصیه می‌شود)

اگر می‌خواهید روی پورت 80/443 سرو شود:

```nginx
server {
  listen 80;
  server_name 188.253.2.86;

  # (اگر بعداً TLS بگذارید، لطفاً به 443 hop کنید)

  gzip on;
  gzip_types text/plain application/javascript application/json text/css image/svg+xml;

  # Static assets from Next — cache 1 year
  location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_cache_valid 200 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Everything else → Node
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 8. CORS — نکته‌ی حیاتی برای بک‌اند

فرانت روی **`http://188.253.2.86:3000`** (پورت 3000) بالا می‌آید.

طبق راهنمای فعلی، این origin در `CORS_ALLOWED_ORIGINS` بک‌اند **قبلاً whitelist شده است**، پس اقدام اضافی لازم نیست.

اگر تصمیم گرفتید فرانت را روی پورت دیگری (مثلاً 80 پشت Nginx بدون پورت صریح، یعنی `http://188.253.2.86`) بگذارید، حتماً این origin را هم اضافه کنید:

```bash
# در env بک‌اند
CORS_ALLOWED_ORIGINS=http://188.253.2.86:3000,http://188.253.2.86,...
CSRF_TRUSTED_ORIGINS=http://188.253.2.86:3000,http://188.253.2.86,...
```

سپس بک‌اند را restart کنید.

**نکته**: چون فرانت از `/api/proxy/*` (same-origin rewrite) برای همه‌ی درخواست‌های browser استفاده می‌کند، فنی CORS شکسته هم می‌شود کار کند. ولی برای security best practice و SSR requestها (که مستقیم به backend می‌روند)، origin را whitelist کنید.

---

## 9. Smoke test بعد از deploy

```bash
# 1) Frontend up?
curl -I http://188.253.2.86:3000/
# انتظار: HTTP/1.1 200

# 2) Same-origin proxy کار می‌کند؟
curl -s http://188.253.2.86:3000/api/proxy/madadkar/campaigns/ | head -c 300
# انتظار: JSON با {"success":true,"data":{...

# 3) Assets استاتیک؟
curl -I http://188.253.2.86:3000/manifest.webmanifest
curl -I http://188.253.2.86:3000/robots.txt
curl -I http://188.253.2.86:3000/sitemap.xml
curl -I http://188.253.2.86:3000/og/cover.png

# 4) صفحه‌ی جست‌وجو رندر می‌شود؟
curl -s "http://188.253.2.86:3000/search?q=فعال" | grep -o "<title>.*</title>"
```

از مرورگر:
1. `http://188.253.2.86:3000/` را باز کنید
2. صفحه‌ی اصلی باید همه سکشن‌ها را با داده‌ی واقعی نشان دهد
3. روی سرچ بار کلیک کنید → dropdown پیشنهادها باید بیفتد
4. تایپ کنید «فعال» → نتایج واقعی از ۶ منبع
5. کلیک روی کارت‌های کمپین → modal مشارکت باز شود
6. فرم گزارش مردمی را با یک attachment تست کنید

---

## 10. Rollback strategy

`.next/` directory deterministic است. برای rollback فقط build قبلی را نگه دارید:

```bash
# Blue/green ساده
mv .next .next.previous
git checkout v0.9.0     # یا هر tag قبلی
npm ci --legacy-peer-deps
npm run build
# اگر مشکل بود:
rm -rf .next && mv .next.previous .next
pm2 restart setadjang-front
```

DB migration در فرانت نداریم، پس rollback همیشه بی‌خطر است.

---

## 11. آنچه در این نسخه ship می‌شود

### صفحات فعال
- **`/`** — صفحه‌ی اصلی (هفت سکشن + سرچ سراسری)
- **`/search`** — نتایج کامل جست‌وجو (SSR با `?q=&source=`)
- **`/manifest.webmanifest`** · **`/robots.txt`** · **`/sitemap.xml`** — PWA + SEO

### قابلیت‌های عملیاتی
- ✅ ۸ منبع داده روی صفحه‌ی اصلی از بک‌اند pull می‌شود
- ✅ ۶ منبع در جست‌وجوی سراسری موازی
- ✅ فرم «مشارکت در کمپین» → gateway_url redirect
- ✅ فرم «گزارش مردمی» با upload
- ✅ JWT client + refresh flow + `/auth/*` wrapperهای کامل
- ✅ Empty states در هر سکشن اگر داده‌ای نبود

### صفحاتی که هنوز deploy نشده‌اند
این صفحات backend endpoint دارند و client آماده است، ولی UI در Phase 2 توسعه داده می‌شود:

- `/auth/login`, `/auth/signup`, `/auth/forgot`, `/auth/sessions`
- `/dashboard` (activity + notifications)
- `/madadkar/[slug]`, `/madadkar/me/participations`, `/madadkar/me/receipts`
- `/r4j/[slug]`, `/r4j/me/reports`, `/r4j/me/bounties`
- `/lms/courses/[slug]`, `/lms/courses/[slug]/lessons/[lessonSlug]`, `/lms/me/*`
- `/kindness-wall/[slug]`, `/kindness-wall/me/*`
- `/tabyin/[externalId]`, `/tabyin/new`
- `/support/*` (tickets + knowledge)

اگر کاربر روی این لینک‌ها کلیک کند، صفحه‌ی 404 برند-فیت‌شده‌ی زیبا نمایش داده می‌شود. این عمدی است.

---

## 12. مانیتورینگ + لاگ

Next.js لاگ‌های runtime را روی stdout می‌ریزد. با PM2:
```bash
pm2 logs setadjang-front --lines 200
```

با systemd:
```bash
journalctl -u setadjang-front -f
```

اگر خطای 5xx زیاد دیدید، معمولاً یکی از این‌هاست:
1. `NEXT_PUBLIC_API_URL` اشتباه ست شده → build را با env درست repeat کنید
2. Backend روی `:18080` بالا نیست → `curl http://188.253.2.86:18080/api/v1/health/` را چک کنید
3. CORS برای origin فرانت set نشده → env بک‌اند را update کنید

---

## 13. اطلاعات تماس

- **فرانت‌کار**: تیم UI/UX ستاد جنگ
- **Repo issues**: https://github.com/mohebbibrothers/setad-jang-front/issues
- **مستندات فنی داخلی**: `INTEGRATION_STATUS.md` (در همین repo)
- **بریف طراحی**: `DESIGNER_BRIEF.md` + `DESIGNER_BRIEF_AUTH.md`
- **راهنمای release**: `RELEASE_v1.0.md`

---

## 14. تأییدیه نهایی — Deploy-Ready ✅

- [x] Repository جدا شده (frontend مستقل از backend)
- [x] Commit `4f5d281` روی `main` + tag `v1.0.0-homepage` push شده
- [x] Working tree clean، local == remote
- [x] `npm ci --legacy-peer-deps && npm run build` سبز است (206 kB First Load JS)
- [x] هیچ TypeScript error/warning ندارد
- [x] `.env.staging.example` آماده copy است
- [x] `next.config.mjs::images.remotePatterns` شامل `188.253.2.86` است
- [x] JWT auth client کامل (۱۸ endpoint wrap شده)
- [x] ۸ home loader و ۶ search source همه با endpoint واقعی بک‌اند sync
- [x] Documentation کامل (`INTEGRATION_STATUS.md`, `DEPLOY.md`, `RELEASE_v1.0.md`)
- [x] هیچ token/secret در repo نیست

**پروژه ۱۰۰٪ آماده deploy است.** موفق باشید 🚀
