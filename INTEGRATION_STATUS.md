# وضعیت اتصال Frontend ↔ Backend

> **Backend دمو**: `http://188.253.2.86:18080`
> **Swagger**: `http://188.253.2.86:18080/api/docs/`
> **Schema**: `http://188.253.2.86:18080/api/schema/`
> **Admin**: `http://188.253.2.86:18080/admin/`
> **Health**: `http://188.253.2.86:18080/api/v1/health/`
>
> این سند نقشه‌ی کامل هر endpoint بک‌اند و اینکه در فرانت کجا/چطور مصرف می‌شود را نگه می‌دارد.
> Source of truth: `apps/*/urls.py` + `apps/*/serializers.py` + `docs/FRONTEND_INTEGRATION_GUIDE.md`.

---

## 1. Architecture

### 1.1 URL routing
```
Server-side (SSR / RSC)     →  <NEXT_PUBLIC_API_URL>/api/v1/<path>
Browser side                →  /api/proxy/<path>     (Next rewrite → backend)
```
`/api/proxy/*` is a same-origin proxy declared in `next.config.mjs`; the browser never speaks the backend host directly, so CORS is a non-issue.

### 1.2 Response envelope
Every backend response uses `apps/core/responses.py`:
```json
{ "success": true,  "status_code": 200, "message": "…", "data": <T> }
{ "success": false, "status_code": 4xx, "message": "…", "errors": {…} }
```
`src/lib/api.ts::apiFetch` unwraps `data` on success and throws `ApiError` on failure — app code never touches the envelope directly.

### 1.3 Pagination
DRF list views return `data = { count, next, previous, results }`. The `Paginated<T>` type is re-exported from `src/lib/api.ts` and every loader defensively unwraps via `unwrap()`.

### 1.4 Auth transport
- Access token → `Authorization: Bearer <token>` (browser only)
- Refresh token → sent as `{ "refresh": … }` to `/auth/token/refresh/`
- 401 → `api.ts` transparently attempts a single-flight refresh + retry
- Storage → `localStorage` (persist) or `sessionStorage` (device-only)
- All storage lives under `sj.auth.*` keys (see `src/lib/auth-tokens.ts`)

### 1.5 File uploads
Any endpoint that takes attachments (public reports, R4J reports, LMS media, kindness images, support tickets, madadkar covers) accepts `multipart/form-data`. `api.ts` refuses to set `Content-Type` when the body is a `FormData`, so the browser controls the boundary.

---

## 2. Environment configuration

| Environment | `NEXT_PUBLIC_SITE_URL`      | `NEXT_PUBLIC_API_URL`           |
|-------------|-----------------------------|---------------------------------|
| Local dev   | `http://localhost:3000`     | `http://127.0.0.1:8000`         |
| **Staging** | `http://188.253.2.86:3000`  | `http://188.253.2.86:18080`     |
| Production  | `https://setadjang.ir`      | `https://api.setadjang.ir`      |

Templates:
- `.env.example` — dev defaults
- `.env.staging.example` — demo server
- `.env.production.example` — real production

The staging backend has already whitelisted `http://188.253.2.86:3000`, `http://localhost:3000`, and `http://127.0.0.1:3000` in `CORS_ALLOWED_ORIGINS`.

---

## 3. Wired endpoints — HOME PAGE (public / SSR)

Every loader lives in `src/lib/home-data.ts` and returns `[]` on failure so the section renders its own EmptyState instead of taking down the page.

| # | UI section                    | Endpoint                                              | Loader                    | Serializer                                     |
|---|-------------------------------|-------------------------------------------------------|---------------------------|------------------------------------------------|
| 1 | WarFund cards                 | `GET /madadkar/campaigns/?page_size=8`                | `loadCampaigns()`         | `CampaignPublicListSerializer`                 |
| 2 | Justice cards                 | `GET /r4j/criminals/?page_size=8`                     | `loadCriminals()`         | `R4JPublicCriminalListSerializer`              |
| 3 | Education tabs                | `GET /lms/categories/?page_size=20`                   | `loadLmsCategories()`     | `LMSCategoryPublicSerializer`                  |
| 4 | Education cards               | `GET /lms/courses/?page_size=12`                      | `loadCourses()`           | `CourseSummarySerializer`                      |
| 5 | Kindness cards                | `GET /kindness-wall/listings/?page_size=12`           | `loadKindnessListings()`  | `KindnessListingListSerializer`                |
| 6 | Kindness category strip       | `GET /kindness-wall/categories/?page_size=30`         | `loadKindnessCategories()`| `KindnessCategorySerializer`                   |
| 7 | Tabyin masonry                | `GET /tabyin/contents/?page_size=20`                  | `loadTabyinItems()`       | `PublicTabyinContentListSerializer`            |
| 8 | Public-report subject dropdown| `GET /public-reports/subjects/?page_size=20`          | `loadReportSubjects()`    | `ReportSubjectPublicSerializer`                |

### Field-level mapping (spot checks)
- WarFund `total_amount` (Toman) — UI shows Rial by multiplying ×10 as per the designer
- Kindness `listing_type ∈ {need_help, offer_help}` normalized to `need | offer` for the segmented switcher
- Tabyin `primary_media_type ∈ {image, video, audio, other}` drives filter chips and hover overlays
- LMS `is_new` auto-derived from `published_at < 30 days`, `is_featured` from `enrollments_count > average`

---

## 4. Wired endpoints — GLOBAL OMNI-SEARCH

Every source is called in parallel via `Promise.allSettled` from `src/lib/global-search.ts::searchAll` (debounced 220 ms, AbortController-safe).

| Source key | Endpoint                                            | Serializer                                  |
|------------|-----------------------------------------------------|---------------------------------------------|
| `madadkar` | `GET /madadkar/campaigns/?search=&page_size=5`      | `CampaignPublicListSerializer`              |
| `r4j`      | `GET /r4j/criminals/?search=&page_size=5`           | `R4JPublicCriminalListSerializer`           |
| `lms`      | `GET /lms/courses/?search=&page_size=5`             | `CourseSummarySerializer`                   |
| `kindness` | `GET /kindness-wall/listings/?search=&page_size=5`  | `KindnessListingListSerializer`             |
| `tabyin`   | `GET /tabyin/contents/?search=&page_size=5`         | `PublicTabyinContentListSerializer`         |
| `knowledge`| `GET /support/knowledge/articles/?search=&page_size=5` | `SupportKnowledgeArticleSerializer`      |

`?search=` is honoured by `apps/core/search::apply_smart_search`, which runs PostgreSQL FTS + trigram in production and a Persian-aware `icontains` fallback in dev / SQLite.

---

## 5. Auth surface — READY FOR PAGE INTEGRATION

Client is complete (`src/lib/auth.ts` + `src/lib/auth-tokens.ts` + `src/lib/use-auth.ts`). Screens for these flows are Phase 2 deliverables.

| Flow                         | Endpoint(s)                                                                                | Client fn                             |
|------------------------------|--------------------------------------------------------------------------------------------|---------------------------------------|
| Signup (multi-identifier)    | `POST /auth/signup/request/` → `POST /auth/signup/verify/`                                 | `signupRequest`, `signupVerify`       |
| Login (password)             | `POST /auth/login/password/`                                                               | `loginPassword`                       |
| Login (OTP)                  | `POST /auth/login/otp/request/` → `POST /auth/login/otp/verify/`                           | `loginOtpRequest`, `loginOtpVerify`   |
| Token refresh                | `POST /auth/token/refresh/`                                                                | `refreshAccessToken` (auto via api.ts)|
| Logout                       | `POST /auth/logout/`                                                                       | `logout`                              |
| Me                           | `GET /auth/me/` · `PATCH /auth/me/`                                                        | `getMe`, `updateMe`                   |
| Profile                      | `GET /auth/profile/` · `PATCH /auth/profile/`                                              | `getProfile`, `updateProfile`         |
| Change password              | `POST /auth/password/change/`                                                              | `changePassword`                      |
| Forgot password              | `POST /auth/password/forgot/request/` → `POST /auth/password/forgot/confirm/`              | `forgotPasswordRequest`, `forgotPasswordConfirm` |
| Sessions                     | `GET /auth/sessions/` · `POST /auth/sessions/<id>/revoke/`                                 | `listSessions`, `revokeSession`       |
| Identifier add               | `POST /auth/identifiers/add/request/` → `POST /auth/identifiers/add/verify/`               | `identifierAddRequest`, `identifierAddVerify` |
| Identifier make-primary      | `POST /auth/identifiers/make-primary/`                                                     | `identifierMakePrimary`               |

Contract constants (`OTP_CODE_LENGTH = 5`, `IDENTIFIER_MAX_LENGTH = 254`) are exported from `src/lib/auth.ts` so UI form validators stay in lock-step with the backend serializers.

---

## 6. Wired writes — HOME PAGE

| UI action                              | Endpoint                                                          | Notes                                                                 |
|----------------------------------------|-------------------------------------------------------------------|-----------------------------------------------------------------------|
| «مشارکت در کمپین» (madadkar modal)     | `POST /madadkar/campaigns/<slug>/participate/`                    | Requires JWT; returns `gateway_url` — UI redirects to payment gateway |
| «ثبت گزارش مردمی»                       | `POST /public-reports/reports/` (multipart)                        | 5 attachments max, jpg/jpeg/png/webp, 5 MB per file                   |

---

## 7. Endpoints ready on the backend — awaiting Phase 2 UI

These are fully implemented server-side and have thin client stubs where useful, but no dedicated page yet.

**Madadkar** — `/madadkar/campaigns/<slug>/`, `/campaigns/<slug>/transparency/`, `/me/participations/`, `/me/receipts/`, `/receipts/verify/`, `/payment/verify/`
**R4J** — `/r4j/criminals/<slug>/`, `/criminals/<id>/reports/`, `/criminals/<id>/bounty/`, `/me/reports/`, `/me/bounties/`
**LMS** — `/lms/courses/<slug>/`, `/courses/<slug>/enroll/`, `/courses/<slug>/lessons/`, `/lessons/<id>/progress/`, `/lessons/<id>/media/<kind>/`, `/me/recommendations/`, `/me/certificates/`, `/certificates/verify/<slug>/`
**Kindness Wall** — `/listings/<slug>/`, `/listings/<slug>/bookmark/`, `/listings/<slug>/reveal-contact/`, `/listings/<slug>/matches/`, `/me/listings/…`, `/me/bookmarks/`, `/me/matches/…`
**Tabyin** — `/contents/<external_id>/`, `/me/submissions/`
**Support desk** — `/departments/`, `/categories/`, `/ticket-types/`, `/knowledge/articles/`, `/me/tickets/…`, `/me/tickets/<num>/reply|submit|attachments|timeline|reopen|satisfaction/`
**Notifications** — `/me/`, `/me/<id>/read/`, `/me/read-all/`, `/me/preferences/`
**Activity** — `/me/`, `/admin/`
**Admin** — `/admin/command-center/`

---

## 8. Health / diagnostics

`src/lib/health.ts` gives ops a probe:
- `checkLiveness()` → `GET /api/v1/health/`
- `checkReadiness()` → `GET /api/v1/health/ready/`

Useful in a future `/api/health` route handler or a monitoring dashboard.

---

## 9. Failure semantics

| HTTP | UI behaviour                                                                       |
|------|------------------------------------------------------------------------------------|
| 401  | `api.ts` runs `refreshAccessToken()` once; on failure it clears tokens + logs out  |
| 403  | Surface backend `message`; if from admin-only endpoint show generic "دسترسی ندارید" |
| 404  | Route-level not-found or inline empty state                                        |
| 429  | Show rate-limit toast, disable resubmit for `retry_after` seconds                  |
| 5xx  | `safeApiFetch` returns `null` → section shows its EmptyState                       |
| 0    | `ApiError` with `status:0` → "خطای شبکه" toast + retry action                       |

---

## 10. Pre-deploy checklist (staging)

- [x] `.env.staging.example` copied to `.env.production` on the staging host
- [x] `NEXT_PUBLIC_API_URL` points at `http://188.253.2.86:18080`
- [x] `next.config.mjs::images.remotePatterns` includes `188.253.2.86`
- [x] `.env` is committed as `.env.staging.example` template only (no secrets)
- [x] `npm run build` completes with **0** TypeScript errors — First Load JS ≈ 205 kB
- [x] Backend `/api/v1/health/ready/` returns `status: ok`
- [x] Backend CORS_ALLOWED_ORIGINS includes the frontend origin
- [ ] `curl -s /api/v1/madadkar/campaigns/` returns real data from the demo db
- [ ] `curl -s /api/v1/tabyin/contents/?page_size=3` returns 3 items from the ~2824 seeded contents
- [ ] Home page renders every section with backend data instead of empty states

---

## 11. Change log

| Date       | Change                                                                                   |
|------------|------------------------------------------------------------------------------------------|
| 2026-07-14 | Repo split into setad-jang (backend) + setad-jang-front (frontend). History preserved.    |
| 2026-07-14 | Full auth client + JWT store + single-flight refresh + `useAuth` hook.                    |
| 2026-07-14 | `.env.staging.example` for the demo server; `next.config.mjs` accepts dynamic API host.   |
| 2026-07-14 | `loadKindnessCategories()` added; `global-search` corrected to `/support/knowledge/`.     |
| 2026-07-14 | `src/lib/health.ts` for readiness probes.                                                 |
