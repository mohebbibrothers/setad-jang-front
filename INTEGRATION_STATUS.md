# Frontend ↔ Backend Integration Status

Updated: 2026-08-23

## Live origins

```text
Site / API : https://besat.me
Swagger    : https://besat.me/api/docs/
Schema     : https://besat.me/api/schema/
Health     : https://besat.me/api/v1/health/
Readiness  : https://besat.me/api/v1/health/ready/
```

## Corrected contracts

- Auth login/signup reads `data.tokens.access|refresh`, not root token fields.
- Make-primary sends `{ identifier_kind: "email" | "phone" }`.
- Auth sessions use `device_label`, `is_revoked`, `last_seen_at` and related backend fields.
- Empty success responses are represented as `data: null`; UI messages come from envelope metadata.
- Browser refresh follows the same-origin/proxy routing strategy rather than bypassing it.
- Abort errors remain cancellable and do not appear as failed search sources.

## Public SSR integrations

| Domain | List/home | Detail route | Authenticated action |
|---|---:|---:|---:|
| Madadkar | ✅ | `/madadkar/[slug]` | participation + gateway redirect ✅ |
| R4J | ✅ | `/r4j/[slug]` | report + bounty ✅ |
| LMS | ✅ | `/lms/courses/[slug]` | enroll + secure media access ✅ |
| Kindness | ✅ | `/kindness-wall/[slug]` | bookmark + contact reveal ✅ |
| Tabyin | ✅ | `/tabyin/[id]` | URL-based submission ✅ |
| Public Reports | ✅ | homepage form | multipart submission ✅ |

## Auth and account UI

- Password login ✅
- OTP login ✅
- Signup OTP ✅
- Forgot/reset password ✅
- Profile/base information ✅
- Password change ✅
- Session list/revoke ✅
- Route guards with sanitized `next` redirect ✅

Backend `UserMe` currently does not expose `primary_identifier`, `is_phone_verified` or an identifiers collection, so a truthful identifier-management screen remains blocked on a backend contract extension.

## Performance

- Homepage Tabyin requests are constant-cost: one page each for all/image/video/audio/other.
- No full 3k+ corpus fan-out remains.
- Search suggestions fetch 5 items/source while `/search` fetches 24/source and reports backend totals.
- `/tabyin` has real server-side pagination and media filters.

## Backend work still required in a backend-bound Agent Mode

1. Expose verified/primary identifier state in `UserMe`.
2. Add Kindness user image upload endpoints if listing images are required.
3. Add a Tabyin aggregate/stats endpoint for exact mutually-exclusive media counts.
4. Add a public report tracking token + lookup endpoint, or keep UI wording as “شناسه ثبت”.
5. Correct action/pagination/filter metadata in several OpenAPI operations.
6. Protect or reduce detailed health/metrics diagnostics.
7. Clarify LMS public lesson media fields versus the protected media endpoint.
8. Configure real Email/SMS/Zarinpal/S3 providers in production.

## Quality gate

- ESLint flat config ✅
- TypeScript strict ✅
- Vitest contract/security tests ✅
- Coverage thresholds ✅
- npm audit: 0 vulnerabilities ✅
- Next.js production build ✅
- CI-ready quality scripts ✅ (workflow activation requires GitHub Workflow permission)
