# Deploy — besat.me frontend

## One-command deploy

After the target branch is merged, deployment is:

```bash
./deploy.sh
```

The script builds in an isolated Git worktree, runs lint/typecheck/coverage/audit/build, performs a fast artifact switch, auto-detects PM2 or systemd, verifies local/public health, and rolls back code, `.next`, and changed dependencies automatically on failure.

Defaults:

```text
branch         main
remote         origin
PM2 app        setadjang-front
systemd unit   setadjang-front.service
local health   http://127.0.0.1:3000/
public health  https://besat.me/
```

Common overrides:

```bash
PROCESS_MANAGER=pm2 APP_NAME=setadjang-front ./deploy.sh
PROCESS_MANAGER=systemd SERVICE_NAME=setadjang-front ./deploy.sh
DEPLOY_RESTART_COMMAND='sudo systemctl restart my-front' ./deploy.sh
./deploy.sh --dry-run
```

Deployment state and one rollback artifact are kept under ignored `.deploy/`.

## Requirements

- Node.js 22 (minimum supported by Next.js: 20.9)
- npm 10+
- `git`, `curl`, and `flock`
- PM2 or a systemd service (or `DEPLOY_RESTART_COMMAND`)
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
