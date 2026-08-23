# Production Deployment — Frontend (Next.js 15)

> **Audience**: Ops / DevOps deploying the homepage to `https://setadjang.ir`.
> Backend deploy lives in a separate playbook (Django + Postgres + Redis).

---

## 1. What is shipped

A pre-built Next.js 15 (App Router) site that renders the full
home page server-side and hydrates a handful of interactive islands
(album lightbox, participate modal, slide-to-verify, hero animations).

**Every domain section is backend-faithful:**

| Section            | API endpoint(s)                                           |
| ------------------ | --------------------------------------------------------- |
| WarFund            | `GET /api/v1/madadkar/campaigns/`<br>`GET /api/v1/madadkar/campaigns/<slug>/` (album)<br>`POST /api/v1/madadkar/campaigns/<slug>/participate/` |
| Justice (R4J)      | `GET /api/v1/r4j/criminals/`<br>`GET /api/v1/r4j/criminals/<slug>/` (album) |
| Education (LMS)    | `GET /api/v1/lms/categories/`<br>`GET /api/v1/lms/courses/` |
| Kindness Wall      | `GET /api/v1/kindness-wall/listings/`<br>`GET /api/v1/kindness-wall/listings/<slug>/` (album) |
| Tabyin             | `GET /api/v1/tabyin/contents/`                            |
| Public Reports     | `GET /api/v1/public-reports/subjects/`<br>`POST /api/v1/public-reports/reports/` |

Loaders live in `src/lib/home-data.ts` and return ONLY real data.
Empty arrays render the dedicated empty state (no demo seed ever
leaks to production).

---

## 2. Environment

Create `frontend/.env.production` from `.env.production.example`:

```bash
NEXT_PUBLIC_SITE_URL=https://setadjang.ir
NEXT_PUBLIC_API_URL=https://api.setadjang.ir
```

Both keys are public — they end up in the client bundle.

---

## 3. Build

```bash
cd frontend
npm ci
npm run build              # → .next/
```

Output is a hybrid app: static for everything that can be pre-rendered,
SSR for the homepage (so every page paint already has live data).

---

## 4. Run

### a) Long-running Node server (recommended)

```bash
npm run start              # listens on $PORT (default 3000)
```

Run behind your reverse proxy (Nginx / Caddy / Traefik) terminating
TLS at the edge:

```nginx
server {
  listen 443 ssl http2;
  server_name setadjang.ir;

  location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
  }
}
```

### b) Containerised

A multi-stage Dockerfile is straightforward:

```Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 5. Cache + revalidation

Each loader sets a Next.js `revalidate` window matching the data churn:

| Loader              | revalidate |
| ------------------- | ---------- |
| `loadCampaigns`     | 300 s      |
| `loadCriminals`     | 600 s      |
| `loadLmsCategories` | 600 s      |
| `loadCourses`       | 300 s      |
| `loadKindnessListings` | 240 s   |
| `loadTabyinItems`   | 180 s      |
| `loadReportSubjects` | 600 s     |

If you ever need to bust the cache early (e.g. after a publishing
push), call Next's `revalidateTag('campaigns')` etc. from a webhook
endpoint.

---

## 6. Security headers

Already wired in `next.config.mjs`:

* `X-Frame-Options: SAMEORIGIN`
* `X-Content-Type-Options: nosniff`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
* `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

If you sit behind Nginx / Cloudflare, you can also add a strict
`Content-Security-Policy` at the edge — the bundle only needs
`self`, `'unsafe-inline'` for Next's runtime styles, and the API
origin (`https://api.setadjang.ir`).

---

## 7. Health checks

* HTTP `GET /` should return 200 with `Content-Type: text/html`.
* HTTP `GET /api/proxy/madadkar/campaigns/` exercises the rewrite to
  Django — handy for smoke-testing the proxy.

---

## 8. Rollback

`npm run build` produces a deterministic `.next/` directory, so blue/
green is just two builds + a load-balancer swap. No DB migration is
ever required for a frontend-only rollback.

---

## 🚀 آپدیت با یک خط دستور (update-front.sh)

روی سرور، داخل پوشه‌ی پروژه:

```bash
./update-front.sh
```

همین. اسکریپت به‌ترتیب: آخرین کامیت `main` را از گیت‌هاب می‌گیرد → سورس را
همگام می‌کند (فایل‌های `.env*` دست‌نخورده) → فقط در صورت تغییر `package-lock.json`
پکیج‌ها را نصب می‌کند → بیلد پروداکشن می‌گیرد → سرویس را ری‌استارت می‌کند →
سلامت محلی/دامنه/بک‌اند را چک می‌کند → و اگر هر مرحله‌ای شکست بخورد
**خودکار به آخرین بیلد سالم برمی‌گردد**.

از روی لپ‌تاپ (بدون ssh کردن دستی):

```bash
ssh -p 2233 root@37.152.191.90 'cd /var/www/besat-front && ./update-front.sh'
```

### فلگ‌های مفید

| دستور | کار |
| --- | --- |
| `./update-front.sh` | آپدیت معمولی (اگر کامیت جدیدی نباشد، چیزی بیلد نمی‌شود) |
| `./update-front.sh --force` | بیلد مجدد اجباری |
| `./update-front.sh --status` | وضعیت فعلی: کامیت، manager، هلث محلی/دامنه/بک‌اند |
| `./update-front.sh --rollback` | برگشت فوری به آخرین نسخه‌ی سالم |
| `./update-front.sh --dry-run` | فقط نمایش نقشه‌ی کار، بدون هیچ تغییر |
| `./update-front.sh --deps` | نصب اجباری وابستگی‌ها |
| `./update-front.sh --no-health` | رد کردن health-check |
| `./update-front.sh -q` | خروجی حداقلی (مناسب cron) |

### تنظیمات محیطی

اسکریپت `pm2` / `systemd` / `docker compose` را خودش تشخیص می‌دهد. اگر
سرویس اسم دیگری دارد:

```bash
PM2_APP=besat-front       ./update-front.sh
SYSTEMD_UNIT=besat-front  ./update-front.sh
RESTART_CMD='sudo systemctl restart besat-front' ./update-front.sh
```

برای دائمی‌کردن، یک بار در `~/.bashrc` سرور:

```bash
export PM2_APP=besat-front
alias upfront='cd /var/www/besat-front && ./update-front.sh'
```

لاگ هر دیپلوی در `.deploy/logs/` نگه داشته می‌شود (۲۰ اجرای آخر).
