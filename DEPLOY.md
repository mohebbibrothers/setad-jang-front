# Deploy — besat.me frontend

## Requirements

- Node.js 22 (minimum supported by Next.js: 20.9)
- npm 10+
- Running backend routed on the same public origin under `/api/v1/`

## Environment

```bash
cp .env.production.example .env.production
```

Required public values:

```env
NEXT_PUBLIC_SITE_URL=https://besat.me
NEXT_PUBLIC_API_URL=https://besat.me
```

Server-only values should be injected by the process manager/secret store:

```env
REVALIDATE_SECRET=<strong-random-secret>
INDEXNOW_SECRET=<strong-random-secret>
```

## Quality gate and build

```bash
npm ci
npm run verify
```

`npm run verify` runs ESLint, TypeScript, tests and a production build. Run coverage and `npm audit --audit-level=high` as additional release gates.

## Run

```bash
HOSTNAME=0.0.0.0 PORT=3000 npm start
```

Recommended systemd/PM2 deployment must run from the repository directory so `.env.production` is loaded.

## Reverse proxy contract

Route Next pages/assets to port 3000 and backend paths directly to Django/Gunicorn:

```nginx
location /api/v1/ { proxy_pass http://127.0.0.1:8000; }
location /api/docs/ { proxy_pass http://127.0.0.1:8000; }
location /api/schema/ { proxy_pass http://127.0.0.1:8000; }
location /admin/ { proxy_pass http://127.0.0.1:8000; }
location /media/ { proxy_pass http://127.0.0.1:8000; }
location / { proxy_pass http://127.0.0.1:3000; }
```

Forward `Host`, `X-Real-IP`, `X-Forwarded-For` and `X-Forwarded-Proto` on every proxy location.

## Smoke tests

```bash
curl -fsS https://besat.me/api/v1/health/
curl -fsS https://besat.me/api/v1/health/ready/
curl -I https://besat.me/
curl -I https://besat.me/auth/login
curl -I https://besat.me/r4j/<published-slug>
curl -I https://besat.me/sitemap.xml
```

Then manually test login, an authenticated route guard, public report submission and one detail page.

## Rollback

Keep the previous commit/build, switch the application symlink or checkout, run `npm ci && npm run build`, and restart only the frontend process. Frontend rollback has no database migration.
