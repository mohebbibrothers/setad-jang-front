# بعثت مردم — Frontend

فرانت‌اند production سامانه [besat.me](https://besat.me)، مستقل از بک‌اند Django و متصل از طریق REST/OpenAPI.

## Stack

- Next.js 16 (App Router, RSC, SSR/ISR)
- React 19 stable + TypeScript strict
- Tailwind CSS 3 + Framer Motion
- Vitest + ESLint 9 flat config
- RTL و Vazirmatn

## Routes

### Public

- `/` — هاب اصلی و تمام حوزه‌ها
- `/search` — جست‌وجوی هم‌زمان در پنج دامنه
- `/about-besat`
- `/tabyin` و `/tabyin/[externalId]`
- `/r4j/[slug]`
- `/madadkar/[slug]`
- `/lms/courses/[slug]`
- `/lms/courses/[slug]/lessons/[lessonSlug]`
- `/kindness-wall/[slug]`

### Authentication / account

- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`
- `/account`

### Authenticated actions

- `/r4j/[slug]/report`
- `/r4j/[slug]/bounty`
- `/tabyin/new`
- Madadkar participation, LMS enrollment and Kindness contact/bookmark actions

## Local development

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Default local URLs:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Production uses one reverse-proxied origin:

```env
NEXT_PUBLIC_SITE_URL=https://besat.me
NEXT_PUBLIC_API_URL=https://besat.me
```

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm audit --audit-level=high
npm run build
npm run verify
```

The `verify`, coverage and audit commands are CI-ready. Activating a repository workflow requires GitHub Workflow permission.

## API architecture

Backend product endpoints live under `/api/v1/` and use this envelope:

```json
{
  "success": true,
  "status_code": 200,
  "message": "...",
  "data": {}
}
```

- SSR/RSC calls `NEXT_PUBLIC_API_URL/api/v1/*` directly.
- Browser calls `/api/v1/*` when frontend and API share an origin.
- In cross-origin staging, browser calls `/api/proxy/*`; Next rewrites it server-side.
- JWT refresh is single-flight and uses the same routing policy.
- Requests are bounded by timeout and preserve AbortController cancellation.

## Authentication contract

Modern login/signup responses are normalized from:

```json
{
  "data": {
    "tokens": { "access": "...", "refresh": "..." },
    "user": {}
  }
}
```

Tokens default to `sessionStorage`; «مرا به خاطر بسپار» explicitly opts into `localStorage`.

## Production caveats outside this repository

The code paths are complete, but live backend diagnostics currently report external providers as not production-ready:

- Email OTP: console provider
- SMS OTP: console provider
- Payment: sandbox provider
- Media: local storage

Real OTP/payment requires server-side provider credentials and configuration in the backend deployment. No secrets belong in this repository.

## Revalidation

Backend can call `POST /api/revalidate` with `REVALIDATE_SECRET`. Public loaders use cache tags matching backend cache policy. Tabyin homepage loading is bounded to five 100-item bucket requests; it never downloads the entire corpus.
