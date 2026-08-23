# نقشه‌ی کامل API بک‌اند — besat.me

> تولید خودکار از `schema.yaml` (OpenAPI 3.0.3 · ستاد جنگ — API Documentation · v2.0.0).  
> **365 عملیات** روی **303 مسیر** و **605 اسکیما**.  
> پایه روی پروداکشن: `https://besat.me` → یعنی `GET https://besat.me/api/v1/...`  
> در فرانت می‌توان از rewrite داخلی `/api/proxy/:path*` هم استفاده کرد (در `next.config.mjs` تعریف شده).  
> مستندات زنده: `https://besat.me/api/docs/` · اسکیما: `https://besat.me/api/schema/`

علائم: `*` = الزامی · `ro` = فقط‌خواندنی · `↻` = ارجاع بازگشتی · 🌐 = بدون نیاز به لاگین · 🔒 = نیازمند JWT

## فهرست

| حوزه | عمومی/کاربری | مدیریتی |
|---|---:|---:|
| **میز پشتیبانی (تیکتینگ)** (`/api/v1/support/`) | 17 | 51 |
| **آموزش (LMS)** (`/api/v1/lms/`) | 26 | 35 |
| **جایزه‌ای برای عدالت (R4J)** (`/api/v1/r4j/`) | 9 | 52 |
| **مددکار (کمپین‌های حمایتی)** (`/api/v1/madadkar/`) | 13 | 45 |
| **دیوار مهربانی** (`/api/v1/kindness-wall/`) | 20 | 21 |
| **احراز هویت و حساب کاربری** (`/api/v1/auth/`) | 25 | 9 |
| **جهاد تبیین** (`/api/v1/tabyin/`) | 5 | 9 |
| **گزارشات مردمی** (`/api/v1/public-reports/`) | 2 | 8 |
| **اعلان‌ها** (`/api/v1/notifications/`) | 5 | 3 |
| **audit-logs** (`/api/v1/audit-logs/`) | 0 | 3 |
| **سلامت سیستم** (`/api/v1/health/`) | 3 | 0 |
| **لاگ فعالیت** (`/api/v1/activity/`) | 1 | 1 |
| **admin** (`/api/v1/admin/`) | 0 | 1 |
| **metrics** (`/api/v1/metrics/`) | 1 | 0 |

---

# ۱) اندپوینت‌های عمومی و کاربری

این‌ها همان‌هایی هستند که فرانت عمومی سایت مصرف می‌کند.

## آموزش (LMS) — `/api/v1/lms/`

جمعاً 26 عملیات عمومی/کاربری.

### `POST /api/v1/lms/answers/{answer_id}/report/`

دسترسی: 🔒 نیازمند JWT

> Report an answer.

**پارامترها**

- `answer_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `reason`* : string
- `description` : string

**پاسخ‌ها**

- `201` → `LMSDiscussionReportResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Output serializer for discussion reports.
    - `id`* : integer ro
    - `question_id`* : integer ro
    - `answer_id`* : integer ro
    - `reported_by_id`* : integer ro
    - `reason`* : string ro
    - `description`* : string ro
    - `status`* : ? ro
    - `reviewed_by_id`* : integer ro
    - `reviewed_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/categories/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return active categories.

**پاسخ‌ها**

- `200` → `LMSCategoryListResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<LMSCategory>

### `GET /api/v1/lms/categories/{slug}/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return one public category.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSCategoryResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Public/admin category representation.
    - `id`* : integer ro
    - `title`* : string
    - `slug`* : string ro
    - `description` : string
    - `icon` : string
    - `cover_image` : string<uri>
    - `order` : integer<int64>
    - `is_active` : boolean
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/certificates/verify/{verification_slug}/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Verify certificate validity publicly.

**پارامترها**

- `verification_slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSCertificateVerifyResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Public certificate verification serializer.
    - `certificate_code`* : string ro
    - `status`* : ? ro
    - `full_name_snapshot`* : string ro
    - `gender_snapshot`* : string ro
    - `national_code_snapshot`* : string ro
    - `course_title_snapshot`* : string ro
    - `instructor_name_snapshot`* : string ro
    - `score_out_of_20`* : string<decimal> ro
    - `issued_at`* : string<date-time> ro
    - `statement`* : string ro — Return official certificate statement.
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/courses/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return paginated public course catalog.

**پاسخ‌ها**

- `200` → `LMSCourseListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<CourseSummary>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/lms/courses/{slug}/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return one published course.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSCourseResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Detailed course representation including active lessons.
    - `id`* : integer ro
    - `category`* : ? ro
    - `title`* : string ro
    - `slug`* : string ro
    - `subtitle`* : string ro
    - `short_description`* : string ro
    - `instructor_name`* : string ro
    - `level`* : ? ro
    - `status`* : ? ro
    - `is_featured`* : boolean ro
    - `cover_image`* : string<uri> ro
    - `lessons_count`* : integer ro
    - `estimated_duration_seconds`* : integer ro
    - `enrollments_count`* : integer ro
    - `graduates_count`* : integer ro
    - `published_at`* : string<date-time> ro
    - `description`* : string
    - `instructor_bio` : string
    - `instructor_avatar` : string<uri>
    - `intro_video_url` : string<uri>
    - `lessons`* : array<LessonSummary> ro
- `404` → `LMSErrorResponse`

### `POST /api/v1/lms/courses/{slug}/enroll/`

دسترسی: 🔒 نیازمند JWT

> Enroll current user in a course.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSEnrollmentResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User enrollment representation.
    - `id`* : integer ro
    - `course`* : ? ro
    - `status`* : ? ro
    - `enrolled_at`* : string<date-time> ro
    - `completed_at`* : string<date-time> ro
    - `progress_percent`* : string<decimal> ro
    - `watched_seconds`* : integer ro
    - `total_seconds_snapshot`* : integer ro
- `201` → `LMSEnrollmentResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User enrollment representation.
    - `id`* : integer ro
    - `course`* : ? ro
    - `status`* : ? ro
    - `enrolled_at`* : string<date-time> ro
    - `completed_at`* : string<date-time> ro
    - `progress_percent`* : string<decimal> ro
    - `watched_seconds`* : integer ro
    - `total_seconds_snapshot`* : integer ro
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/courses/{slug}/lessons/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return public lessons for a course.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSLessonListResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<LessonSummary>
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/courses/{slug}/lessons/{lesson_slug}/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return one public lesson.

**پارامترها**

- `lesson_slug` (path، الزامی) : string
- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSLessonResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Compact lesson representation for course detail pages.
    - `id`* : integer ro
    - `title`* : string ro
    - `slug`* : string ro
    - `description`* : string ro
    - `order`* : integer ro
    - `video_provider`* : ? ro
    - `video_url`* : string<uri> ro
    - `embed_url`* : string<uri> ro
    - `duration_seconds`* : integer ro
    - `summary`* : string ro
    - `attachment_title`* : string ro
    - `attachment_file`* : string<uri> ro
    - `is_preview`* : boolean ro
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/courses/{slug}/quiz/`

دسترسی: 🔒 نیازمند JWT

> Return quiz metadata without correct answers.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSQuizPublicResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-visible quiz metadata without answers.
    - `id`* : integer ro
    - `course_id`* : integer ro
    - `title`* : string ro
    - `description`* : string ro
    - `time_limit_minutes`* : integer ro
    - `passing_score`* : string<decimal> ro
    - `max_attempts`* : integer ro
    - `retake_delay_days`* : integer ro
    - `questions_count`* : integer ro
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `POST /api/v1/lms/courses/{slug}/quiz/start/`

دسترسی: 🔒 نیازمند JWT

> Start a snapshot-based quiz attempt.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSQuizAttemptResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Attempt detail serializer hiding correct answers unless attempt is passed.
    - `id`* : integer ro
    - `quiz_id`* : integer ro
    - `course_id`* : integer ro
    - `attempt_number`* : integer ro
    - `status`* : ? ro
    - `started_at`* : string<date-time> ro
    - `submitted_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `score_percent`* : string<decimal> ro
    - `score_out_of_20`* : string<decimal> ro
    - `is_passed`* : boolean ro
    - `questions`* : array<object> ro — Return questions in snapshot order.
    - `answers`* : array<object> ro — Return submitted answers; correct answers only after passing.
- `201` → `LMSQuizAttemptResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Attempt detail serializer hiding correct answers unless attempt is passed.
    - `id`* : integer ro
    - `quiz_id`* : integer ro
    - `course_id`* : integer ro
    - `attempt_number`* : integer ro
    - `status`* : ? ro
    - `started_at`* : string<date-time> ro
    - `submitted_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `score_percent`* : string<decimal> ro
    - `score_out_of_20`* : string<decimal> ro
    - `is_passed`* : boolean ro
    - `questions`* : array<object> ro — Return questions in snapshot order.
    - `answers`* : array<object> ro — Return submitted answers; correct answers only after passing.
- `400` → `LMSErrorResponse`
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/lessons/{lesson_id}/media/{media_kind}/`

دسترسی: 🔒 نیازمند JWT

> Return access payload for lesson video or attachment.

**پارامترها**

- `lesson_id` (path، الزامی) : integer
- `media_kind` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `LMSLessonMediaAccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Signed/CDN-ready lesson media access payload.
    - `media_kind`* : string
    - `provider`* : string
    - `url`* : string
    - `expires_in_seconds` : integer
    - `lesson_id`* : integer
    - `course_id`* : integer
    - `title` : string
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `POST /api/v1/lms/lessons/{lesson_id}/progress/`

دسترسی: 🔒 نیازمند JWT

> Update lesson watch progress monotonically.

**پارامترها**

- `lesson_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `watched_seconds`* : integer
- `last_position_seconds` : integer

**پاسخ‌ها**

- `200` → `LMSLessonProgressResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Output serializer for lesson progress state.
    - `id`* : integer ro
    - `lesson`* : ? ro
    - `watched_seconds`* : integer ro
    - `duration_seconds_snapshot`* : integer ro
    - `progress_percent`* : string<decimal> ro
    - `is_completed`* : boolean ro
    - `last_position_seconds`* : integer ro
    - `first_watched_at`* : string<date-time> ro
    - `last_watched_at`* : string<date-time> ro
    - `completed_at`* : string<date-time> ro
- `400` → `LMSErrorResponse`
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/lessons/{lesson_id}/questions/`

دسترسی: 🔒 نیازمند JWT

> Return lesson questions for enrolled users.

**پارامترها**

- `lesson_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `LMSLessonQuestionListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<LessonQuestion>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `POST /api/v1/lms/lessons/{lesson_id}/questions/`

دسترسی: 🔒 نیازمند JWT

> Create a visible question under a lesson.

**پارامترها**

- `lesson_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `title`* : string
- `body`* : string

**پاسخ‌ها**

- `201` → `LMSLessonQuestionResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Output serializer for lesson questions with nested visible answers.
    - `id`* : integer ro
    - `lesson_id`* : integer ro
    - `user_id`* : integer ro
    - `user_display`* : string ro — Return safe display name for question author.
    - `title`* : string ro
    - `body`* : string ro
    - `status`* : ? ro
    - `is_pinned`* : boolean ro
    - `is_answered`* : boolean ro
    - `answer_count`* : integer ro
    - `last_activity_at`* : string<date-time> ro
    - `answers`* : array<LessonAnswer> ro
    - `created_at`* : string<date-time> ro
- `400` → `LMSErrorResponse`
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/me/certificates/`

دسترسی: 🔒 نیازمند JWT

> Return paginated user certificates.

**پاسخ‌ها**

- `200` → `LMSCertificateListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<Certificate>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/lms/me/certificates/{certificate_id}/`

دسترسی: 🔒 نیازمند JWT

> Return one owned certificate.

**پارامترها**

- `certificate_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `LMSCertificateResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User/admin certificate representation.
    - `id`* : integer ro
    - `certificate_code`* : string ro
    - `verification_slug`* : string ro
    - `status`* : ? ro
    - `course_id`* : integer ro
    - `course_title`* : string ro
    - `full_name_snapshot`* : string ro
    - `gender_snapshot`* : string ro
    - `national_code_snapshot`* : string ro
    - `course_title_snapshot`* : string ro
    - `instructor_name_snapshot`* : string ro
    - `score_out_of_20`* : string<decimal> ro
    - `issued_at`* : string<date-time> ro
    - `revoked_at`* : string<date-time> ro
    - `revocation_reason`* : string ro
    - `pdf_file`* : string<uri> ro
    - `statement`* : string ro — Return official certificate statement.
    - `verification_url`* : string ro — Return absolute verification URL when request is available.
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/me/enrollments/`

دسترسی: 🔒 نیازمند JWT

> Return current user's enrollments.

**پاسخ‌ها**

- `200` → `LMSEnrollmentListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<Enrollment>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/lms/me/enrollments/{enrollment_id}/`

دسترسی: 🔒 نیازمند JWT

> Return one owned enrollment.

**پارامترها**

- `enrollment_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `LMSEnrollmentDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Detailed enrollment serializer including lesson progress records.
    - `id`* : integer ro
    - `course`* : ? ro
    - `status`* : ? ro
    - `enrolled_at`* : string<date-time> ro
    - `completed_at`* : string<date-time> ro
    - `progress_percent`* : string<decimal> ro
    - `watched_seconds`* : integer ro
    - `total_seconds_snapshot`* : integer ro
    - `last_accessed_lesson_id`* : integer ro
    - `lesson_progress`* : array<LessonProgress> ro
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/me/recommendations/`

دسترسی: 🔒 نیازمند JWT

> Return ranked course recommendations for the authenticated user.

**پاسخ‌ها**

- `200` → `LMSLearningRecommendationResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<LearningRecommendationItem>

### `GET /api/v1/lms/me/skills/`

دسترسی: 🔒 نیازمند JWT

> Return LMS skills for the current user.

**پاسخ‌ها**

- `200` → `LMSSkillListResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<LMSUserSkill>

### `POST /api/v1/lms/questions/{question_id}/answers/`

دسترسی: 🔒 نیازمند JWT

> Create an answer under an existing question.

**پارامترها**

- `question_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `body`* : string

**پاسخ‌ها**

- `201` → `LMSLessonAnswerResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Output serializer for lesson answers.
    - `id`* : integer ro
    - `user_id`* : integer ro
    - `user_display`* : string ro — Return safe display name for answer author.
    - `body`* : string ro
    - `status`* : ? ro
    - `is_instructor_answer`* : boolean ro
    - `is_accepted`* : boolean ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `400` → `LMSErrorResponse`
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `POST /api/v1/lms/questions/{question_id}/answers/{answer_id}/accept/`

دسترسی: 🔒 نیازمند JWT

> Mark answer as accepted.

**پارامترها**

- `answer_id` (path، الزامی) : integer
- `question_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `LMSLessonAnswerResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Output serializer for lesson answers.
    - `id`* : integer ro
    - `user_id`* : integer ro
    - `user_display`* : string ro — Return safe display name for answer author.
    - `body`* : string ro
    - `status`* : ? ro
    - `is_instructor_answer`* : boolean ro
    - `is_accepted`* : boolean ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `POST /api/v1/lms/questions/{question_id}/report/`

دسترسی: 🔒 نیازمند JWT

> Report a question.

**پارامترها**

- `question_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `reason`* : string
- `description` : string

**پاسخ‌ها**

- `201` → `LMSDiscussionReportResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Output serializer for discussion reports.
    - `id`* : integer ro
    - `question_id`* : integer ro
    - `answer_id`* : integer ro
    - `reported_by_id`* : integer ro
    - `reason`* : string ro
    - `description`* : string ro
    - `status`* : ? ro
    - `reviewed_by_id`* : integer ro
    - `reviewed_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
- `403` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

### `GET /api/v1/lms/quiz/attempts/{attempt_id}/`

دسترسی: 🔒 نیازمند JWT

> Return attempt questions and submitted answers without leaking correct answers before pass.

**پارامترها**

- `attempt_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `LMSQuizAttemptResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Attempt detail serializer hiding correct answers unless attempt is passed.
    - `id`* : integer ro
    - `quiz_id`* : integer ro
    - `course_id`* : integer ro
    - `attempt_number`* : integer ro
    - `status`* : ? ro
    - `started_at`* : string<date-time> ro
    - `submitted_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `score_percent`* : string<decimal> ro
    - `score_out_of_20`* : string<decimal> ro
    - `is_passed`* : boolean ro
    - `questions`* : array<object> ro — Return questions in snapshot order.
    - `answers`* : array<object> ro — Return submitted answers; correct answers only after passing.
- `404` → `LMSErrorResponse`

### `POST /api/v1/lms/quiz/attempts/{attempt_id}/submit/`

دسترسی: 🔒 نیازمند JWT

> Submit attempt answers and calculate weighted score.

**پارامترها**

- `attempt_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `answers`* : array<object>

**پاسخ‌ها**

- `200` → `LMSQuizAttemptResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Attempt detail serializer hiding correct answers unless attempt is passed.
    - `id`* : integer ro
    - `quiz_id`* : integer ro
    - `course_id`* : integer ro
    - `attempt_number`* : integer ro
    - `status`* : ? ro
    - `started_at`* : string<date-time> ro
    - `submitted_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `score_percent`* : string<decimal> ro
    - `score_out_of_20`* : string<decimal> ro
    - `is_passed`* : boolean ro
    - `questions`* : array<object> ro — Return questions in snapshot order.
    - `answers`* : array<object> ro — Return submitted answers; correct answers only after passing.
- `400` → `LMSErrorResponse`
- `404` → `LMSErrorResponse`

---

## احراز هویت و حساب کاربری — `/api/v1/auth/`

جمعاً 25 عملیات عمومی/کاربری.

### `POST /api/v1/auth/identifiers/add/request/`

**درخواست اتصال شناسه ثانویه**  
دسترسی: 🔒 نیازمند JWT

> ارسال کد تأیید برای اتصال ایمیل یا شماره موبایل جدید به حساب.
>
> موارد پشتیبانی‌نشده: جایگزینی یک شناسه‌ی موجود در همان channel.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`
- `429` → `AuthenticationGenericErrorResponse`
- `503` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/identifiers/add/verify/`

**تأیید اتصال شناسه ثانویه**  
دسترسی: 🔒 نیازمند JWT

> تأیید کد و اتصال نهایی ایمیل یا شماره موبایل به حساب.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string
- `code`* : string

**پاسخ‌ها**

- `200` → `UserMeSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — UserMeSerializer implementation for the authentication application.
    - `id`* : integer ro
    - `email`* : string<email> ro
    - `first_name` : string
    - `last_name` : string
    - `full_name`* : string ro
    - `role`* : ? ro
    - `is_email_verified`* : boolean ro
    - `date_joined`* : string<date-time> ro
    - `profile`* : ? ro
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/identifiers/make-primary/`

**تغییر شناسه اصلی**  
دسترسی: 🔒 نیازمند JWT

> تغییر شناسه اصلی حساب به یکی از شناسه‌های تأیید شده.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier_kind`* : enum(email, phone) — * `email` - ایمیل * `phone` - شماره موبایل

**پاسخ‌ها**

- `200` → `UserMeSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — UserMeSerializer implementation for the authentication application.
    - `id`* : integer ro
    - `email`* : string<email> ro
    - `first_name` : string
    - `last_name` : string
    - `full_name`* : string ro
    - `role`* : ? ro
    - `is_email_verified`* : boolean ro
    - `date_joined`* : string<date-time> ro
    - `profile`* : ? ro
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/login/`

**[منسوخ] ورود کاربر با ایمیل**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ورود با ایمیل و رمز عبور و دریافت توکن‌های JWT.
>
> ---
> > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
> > لطفاً به نسخه جدید مهاجرت کنید.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `email`* : string<email>
- `password`* : string

**پاسخ‌ها**

- `200` → `LoginSuccessResponse`
  - `data`* : object
    - `tokens`* : object
    - `user`* : object — UserMeSerializer implementation for the authentication application.
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `401` → `AuthenticationGenericErrorResponse`
- `403` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/login/otp/request/`

**درخواست کد ورود با شناسه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ارسال کد ورود به ایمیل یا شماره موبایل.
>
> این endpoint enumeration-safe است.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `429` → `AuthenticationGenericErrorResponse`
- `503` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/login/otp/verify/`

**تأیید کد ورود**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> تأیید کد ورود و دریافت JWT.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string
- `code`* : string

**پاسخ‌ها**

- `200` → `LoginSuccessResponse`
  - `data`* : object
    - `tokens`* : object
    - `user`* : object — UserMeSerializer implementation for the authentication application.
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `400` → `AuthenticationGenericErrorResponse`
- `403` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/login/password/`

**ورود با رمز عبور و شناسه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ورود با ایمیل یا شماره موبایل و رمز عبور.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string
- `password`* : string

**پاسخ‌ها**

- `200` → `LoginSuccessResponse`
  - `data`* : object
    - `tokens`* : object
    - `user`* : object — UserMeSerializer implementation for the authentication application.
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`
- `403` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/logout/`

**خروج کاربر**  
دسترسی: 🔒 نیازمند JWT

> خروج کاربر و invalidation refresh token.
>
> پس از logout، refresh token در blacklist قرار می‌گیرد.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `refresh`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`

### `GET /api/v1/auth/me/`

**اطلاعات کاربر فعلی**  
دسترسی: 🔒 نیازمند JWT

> دریافت اطلاعات پایه کاربر لاگین کرده.

**پاسخ‌ها**

- `200` → `UserMeSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — UserMeSerializer implementation for the authentication application.
    - `id`* : integer ro
    - `email`* : string<email> ro
    - `first_name` : string
    - `last_name` : string
    - `full_name`* : string ro
    - `role`* : ? ro
    - `is_email_verified`* : boolean ro
    - `date_joined`* : string<date-time> ro
    - `profile`* : ? ro
- `401` → `AuthenticationGenericErrorResponse`

### `PATCH /api/v1/auth/me/`

**ویرایش اطلاعات پایه کاربر**  
دسترسی: 🔒 نیازمند JWT

> ویرایش اطلاعات پایه کاربر لاگین کرده مثل نام و نام خانوادگی.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `first_name` : string
- `last_name` : string

**پاسخ‌ها**

- `200` → `UserMeSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — UserMeSerializer implementation for the authentication application.
    - `id`* : integer ro
    - `email`* : string<email> ro
    - `first_name` : string
    - `last_name` : string
    - `full_name`* : string ro
    - `role`* : ? ro
    - `is_email_verified`* : boolean ro
    - `date_joined`* : string<date-time> ro
    - `profile`* : ? ro
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/password/change/`

**تغییر رمز عبور**  
دسترسی: 🔒 نیازمند JWT

> تغییر رمز عبور توسط کاربر لاگین کرده با تأیید رمز فعلی.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `old_password`* : string
- `new_password`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/password/forgot/`

**[منسوخ] درخواست بازیابی رمز عبور با ایمیل**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ارسال کد بازیابی به ایمیل کاربر.
>
> حتی اگر ایمیل وجود نداشته باشد، پاسخ موفقیت برگردانده می‌شود.
>
> ---
> > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
> > لطفاً به نسخه جدید مهاجرت کنید.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `email`* : string<email>

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/password/forgot/confirm/`

**تأیید بازیابی رمز با شناسه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> تنظیم رمز عبور جدید با شناسه، کد یکبارمصرف و رمز جدید.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string
- `code`* : string
- `new_password`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/password/forgot/request/`

**درخواست بازیابی رمز با شناسه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ارسال کد بازیابی رمز عبور به ایمیل یا شماره موبایل.
>
> این endpoint enumeration-safe است.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `429` → `AuthenticationGenericErrorResponse`
- `503` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/password/reset/`

**[منسوخ] تنظیم رمز جدید با کد بازیابی**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> تنظیم رمز عبور جدید با استفاده از کد ۵ رقمی دریافتی.
>
> ---
> > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
> > لطفاً به نسخه جدید مهاجرت کنید.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `email`* : string<email>
- `code`* : string
- `new_password`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`

### `GET /api/v1/auth/profile/`

**مشاهده پروفایل کاربر**  
دسترسی: 🔒 نیازمند JWT

> دریافت اطلاعات تکمیلی پروفایل کاربر لاگین کرده.

**پاسخ‌ها**

- `200` → `ProfileSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — ProfileSerializer implementation for the authentication application.
    - `phone_number`* : string ro
    - `national_code` : string
    - `birth_date` : string<date>
    - `gender` : ?
    - `avatar` : string<uri>
    - `bio` : string
    - `province` : string
    - `city` : string
    - `address` : string
- `401` → `AuthenticationGenericErrorResponse`

### `PATCH /api/v1/auth/profile/`

**ویرایش پروفایل کاربر**  
دسترسی: 🔒 نیازمند JWT

> ویرایش اطلاعات تکمیلی پروفایل کاربر لاگین کرده.
>
> تمام فیلدها optional هستند.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `phone_number` : string
- `national_code` : string
- `birth_date` : string<date>
- `gender` : ?
- `avatar` : string<uri>
- `bio` : string
- `province` : string
- `city` : string
- `address` : string

**پاسخ‌ها**

- `200` → `ProfileSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — ProfileSerializer implementation for the authentication application.
    - `phone_number`* : string ro
    - `national_code` : string
    - `birth_date` : string<date>
    - `gender` : ?
    - `avatar` : string<uri>
    - `bio` : string
    - `province` : string
    - `city` : string
    - `address` : string
- `400` → `AuthenticationGenericErrorResponse`
- `401` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/register/`

**[منسوخ] ثبت‌نام کاربر جدید**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ساخت حساب کاربری جدید با ایمیل و رمز عبور.
>
> پس از ثبت‌نام موفق، یک کد تأیید ۵ رقمی به ایمیل ارسال می‌شود.
>
> ---
> > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
> > لطفاً به نسخه جدید مهاجرت کنید.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `email`* : string<email>
- `password`* : string
- `first_name` : string
- `last_name` : string

**پاسخ‌ها**

- `201` → `RegisterSuccessResponse`
  - `data`* : object
    - `email`* : string<email>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `400` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/resend-verification/`

**[منسوخ] ارسال مجدد کد تأیید ایمیل**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> اگر کد قبلی منقضی شد، با این endpoint می‌توان کد جدیدی درخواست کرد.
>
> ---
> > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
> > لطفاً به نسخه جدید مهاجرت کنید.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `email`* : string<email>

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `404` → `AuthenticationGenericErrorResponse`

### `GET /api/v1/auth/sessions/`

**لیست نشست‌ها و دستگاه‌های من**  
دسترسی: 🔒 نیازمند JWT

> List current user's tracked auth sessions/devices.

**پاسخ‌ها**

- `200` → `AuthSessionListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<AuthSession>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `401` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/sessions/{session_id}/revoke/`

**لغو یکی از نشست‌های من**  
دسترسی: 🔒 نیازمند JWT

> Revoke one current-user auth session with IDOR protection.

**پارامترها**

- `session_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `AuthSessionDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Read serializer for tracked user auth sessions/devices.
    - `id`* : integer ro
    - `device_label`* : string ro
    - `ip_address`* : string ro
    - `user_agent`* : string ro
    - `request_id`* : string ro
    - `is_revoked`* : boolean ro
    - `revoked_at`* : string<date-time> ro
    - `revoked_by_email`* : string<email> ro
    - `last_seen_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
- `401` → `AuthenticationGenericErrorResponse`
- `404` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/signup/request/`

**درخواست کد ثبت‌نام با شناسه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ارسال کد ثبت‌نام به ایمیل یا شماره موبایل.
>
> در این مرحله هنوز هیچ حساب کاربری‌ای ساخته نمی‌شود.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `429` → `AuthenticationGenericErrorResponse`
- `503` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/signup/verify/`

**تأیید ثبت‌نام و ساخت حساب**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> تأیید کد، ساخت حساب و دریافت JWT.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `identifier`* : string
- `code`* : string
- `password`* : string
- `first_name` : string
- `last_name` : string

**پاسخ‌ها**

- `200` → `LoginSuccessResponse`
  - `data`* : object
    - `tokens`* : object
    - `user`* : object — UserMeSerializer implementation for the authentication application.
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `400` → `AuthenticationGenericErrorResponse`
- `429` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/token/refresh/`

**بروزرسانی توکن JWT**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت access token جدید با استفاده از refresh token.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `refresh`* : string

**پاسخ‌ها**

- `200` → `TokenRefreshSuccessResponse`
  - `data`* : object
    - `access`* : string
    - `refresh` : string
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `401` → `AuthenticationGenericErrorResponse`

### `POST /api/v1/auth/verify-email/`

**[منسوخ] تأیید ایمیل با کد**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> تأیید ایمیل کاربر با ارسال کد ۵ رقمی دریافتی.
>
> ---
> > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
> > لطفاً به نسخه جدید مهاجرت کنید.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `email`* : string<email>
- `code`* : string

**پاسخ‌ها**

- `200` → `AuthenticationEmptySuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `400` → `AuthenticationGenericErrorResponse`
- `404` → `AuthenticationGenericErrorResponse`

---

## دیوار مهربانی — `/api/v1/kindness-wall/`

جمعاً 20 عملیات عمومی/کاربری.

### `GET /api/v1/kindness-wall/categories/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return active categories.

**پاسخ‌ها**

- `200` → `KindnessCategoryListResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<KindnessCategory>

### `GET /api/v1/kindness-wall/listings/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return filtered published listings without phone numbers.

**پاسخ‌ها**

- `200` → `KindnessListingListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<KindnessListingList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/kindness-wall/listings/{slug}/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return one published listing and increment view counter.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `KindnessListingDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Public detail serializer with contact availability but without raw phone.
    - `id`* : integer ro
    - `slug`* : string ro
    - `listing_type`* : ? ro
    - `category`* : ? ro
    - `title`* : string ro
    - `province`* : string ro
    - `city`* : string ro
    - `district`* : string ro
    - `owner_full_name_snapshot`* : string ro
    - `owner_avatar_snapshot`* : string ro
    - `published_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `view_count`* : integer ro
    - `cover_image`* : string ro — Return cover image URL if available.
    - `description`* : string
    - `address_hint` : string
    - `images`* : array<KindnessListingImage> ro
    - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
- `404` → `KindnessWallErrorResponse`

### `POST /api/v1/kindness-wall/listings/{slug}/bookmark/`

دسترسی: 🔒 نیازمند JWT

> Bookmark listing.

**پارامترها**

- `slug` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `slug`* : string ro
- `listing_type`* : ? ro
- `category`* : ? ro
- `title`* : string ro
- `province`* : string ro
- `city`* : string ro
- `district`* : string ro
- `owner_full_name_snapshot`* : string ro
- `owner_avatar_snapshot`* : string ro
- `published_at`* : string<date-time> ro
- `expires_at`* : string<date-time> ro
- `view_count`* : integer ro
- `cover_image`* : string ro — Return cover image URL if available.
- `description`* : string
- `address_hint` : string
- `images`* : array<KindnessListingImage> ro
- `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.

**پاسخ‌ها**

- `200` → `KindnessListingDetail`
  - `id`* : integer ro
  - `slug`* : string ro
  - `listing_type`* : ? ro
  - `category`* : ? ro
  - `title`* : string ro
  - `province`* : string ro
  - `city`* : string ro
  - `district`* : string ro
  - `owner_full_name_snapshot`* : string ro
  - `owner_avatar_snapshot`* : string ro
  - `published_at`* : string<date-time> ro
  - `expires_at`* : string<date-time> ro
  - `view_count`* : integer ro
  - `cover_image`* : string ro — Return cover image URL if available.
  - `description`* : string
  - `address_hint` : string
  - `images`* : array<KindnessListingImage> ro
  - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.

### `DELETE /api/v1/kindness-wall/listings/{slug}/bookmark/`

دسترسی: 🔒 نیازمند JWT

> Remove bookmark.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `204` — No response body

### `GET /api/v1/kindness-wall/listings/{slug}/matches/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return active matches for a public listing.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `KindnessMatchListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<KindnessMatch>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `404` → `KindnessWallErrorResponse`

### `POST /api/v1/kindness-wall/listings/{slug}/report/`

دسترسی: 🔒 نیازمند JWT

> Create a report for a listing.

**پارامترها**

- `slug` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `reason`* : enum(spam, fraud, wrong_category, inappropriate, duplicate, expired, contact_invalid, other) — * `spam` - اسپم * `fraud` - مشکوک به سوءاستفاده * `wrong_category` - دسته‌بندی اشتباه * `inappropria
- `description` : string

**پاسخ‌ها**

- `201` → `KindnessListingReportResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Report output serializer.
    - `id`* : integer ro
    - `listing_id`* : integer ro
    - `listing_title`* : string ro
    - `reported_by_id`* : integer ro
    - `reason`* : ? ro
    - `description`* : string ro
    - `status`* : ? ro
    - `reviewed_by_id`* : integer ro
    - `reviewed_at`* : string<date-time> ro
    - `admin_note`* : string ro
    - `created_at`* : string<date-time> ro
- `403` → `KindnessWallErrorResponse`
- `404` → `KindnessWallErrorResponse`

### `POST /api/v1/kindness-wall/listings/{slug}/reveal-contact/`

دسترسی: 🔒 نیازمند JWT

> Reveal phone and record contact reveal audit row.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `KindnessContactRevealResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Response serializer for contact reveal endpoint.
    - `phone_number`* : string
    - `listing_id`* : integer
    - `owner_full_name`* : string
- `403` → `KindnessWallErrorResponse`
- `404` → `KindnessWallErrorResponse`

### `GET /api/v1/kindness-wall/me/bookmarks/`

دسترسی: 🔒 نیازمند JWT

> Return bookmarked published listings for current user.

**پاسخ‌ها**

- `200` → `KindnessUserBookmarkListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<KindnessBookmark>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/kindness-wall/me/listings/`

دسترسی: 🔒 نیازمند JWT

> Return listings owned by current user.

**پاسخ‌ها**

- `200` → `KindnessUserListingListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<KindnessUserListingDetail>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `POST /api/v1/kindness-wall/me/listings/`

دسترسی: 🔒 نیازمند JWT

> Create a draft listing for current user.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `listing_type` : enum(need_help, offer_help) — * `need_help` - نیاز به کمک دارم * `offer_help` - می‌خواهم کمک کنم
- `category_id` : integer
- `title` : string
- `description` : string
- `province` : string
- `city` : string
- `district` : string
- `address_hint` : string
- `latitude` : string<decimal>
- `longitude` : string<decimal>

**پاسخ‌ها**

- `201` → `KindnessUserListingDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Owner/admin listing serializer with workflow metadata and contact snapshot.
    - `id`* : integer ro
    - `slug`* : string ro
    - `listing_type`* : ? ro
    - `category`* : ? ro
    - `title`* : string ro
    - `province`* : string ro
    - `city`* : string ro
    - `district`* : string ro
    - `owner_full_name_snapshot`* : string ro
    - `owner_avatar_snapshot`* : string ro
    - `published_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `view_count`* : integer ro
    - `cover_image`* : string ro — Return cover image URL if available.
    - `description`* : string ro
    - `address_hint`* : string ro
    - `images`* : array<KindnessListingImage> ro
    - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
    - `status`* : ? ro
    - `contact_phone_snapshot`* : string ro
    - `admin_note`* : string ro
    - `rejection_reason`* : string ro
    - `suspension_reason`* : string ro
    - `contact_reveal_count`* : integer ro
    - `bookmark_count`* : integer ro
    - `report_count`* : integer ro
    - `last_matched_at`* : string<date-time> ro
    - `latitude`* : string<decimal> ro
    - `longitude`* : string<decimal> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `400` → `KindnessWallErrorResponse`
- `403` → `KindnessWallErrorResponse`

### `GET /api/v1/kindness-wall/me/listings/{listing_id}/`

دسترسی: 🔒 نیازمند JWT

> Return own listing detail.

**پارامترها**

- `listing_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `KindnessUserListingDetail`
  - `id`* : integer ro
  - `slug`* : string ro
  - `listing_type`* : ? ro
  - `category`* : ? ro
  - `title`* : string ro
  - `province`* : string ro
  - `city`* : string ro
  - `district`* : string ro
  - `owner_full_name_snapshot`* : string ro
  - `owner_avatar_snapshot`* : string ro
  - `published_at`* : string<date-time> ro
  - `expires_at`* : string<date-time> ro
  - `view_count`* : integer ro
  - `cover_image`* : string ro — Return cover image URL if available.
  - `description`* : string ro
  - `address_hint`* : string ro
  - `images`* : array<KindnessListingImage> ro
  - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
  - `status`* : ? ro
  - `contact_phone_snapshot`* : string ro
  - `admin_note`* : string ro
  - `rejection_reason`* : string ro
  - `suspension_reason`* : string ro
  - `contact_reveal_count`* : integer ro
  - `bookmark_count`* : integer ro
  - `report_count`* : integer ro
  - `last_matched_at`* : string<date-time> ro
  - `latitude`* : string<decimal> ro
  - `longitude`* : string<decimal> ro
  - `created_at`* : string<date-time> ro
  - `updated_at`* : string<date-time> ro

### `PATCH /api/v1/kindness-wall/me/listings/{listing_id}/`

دسترسی: 🔒 نیازمند JWT

> Update own listing.

**پارامترها**

- `listing_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id` : integer ro
- `slug` : string ro
- `listing_type` : ? ro
- `category` : ? ro
- `title` : string ro
- `province` : string ro
- `city` : string ro
- `district` : string ro
- `owner_full_name_snapshot` : string ro
- `owner_avatar_snapshot` : string ro
- `published_at` : string<date-time> ro
- `expires_at` : string<date-time> ro
- `view_count` : integer ro
- `cover_image` : string ro — Return cover image URL if available.
- `description` : string ro
- `address_hint` : string ro
- `images` : array<KindnessListingImage> ro
- `contact_available` : boolean ro — Return whether contact can be revealed via dedicated endpoint.
- `status` : ? ro
- `contact_phone_snapshot` : string ro
- `admin_note` : string ro
- `rejection_reason` : string ro
- `suspension_reason` : string ro
- `contact_reveal_count` : integer ro
- `bookmark_count` : integer ro
- `report_count` : integer ro
- `last_matched_at` : string<date-time> ro
- `latitude` : string<decimal> ro
- `longitude` : string<decimal> ro
- `created_at` : string<date-time> ro
- `updated_at` : string<date-time> ro

**پاسخ‌ها**

- `200` → `KindnessUserListingDetail`
  - `id`* : integer ro
  - `slug`* : string ro
  - `listing_type`* : ? ro
  - `category`* : ? ro
  - `title`* : string ro
  - `province`* : string ro
  - `city`* : string ro
  - `district`* : string ro
  - `owner_full_name_snapshot`* : string ro
  - `owner_avatar_snapshot`* : string ro
  - `published_at`* : string<date-time> ro
  - `expires_at`* : string<date-time> ro
  - `view_count`* : integer ro
  - `cover_image`* : string ro — Return cover image URL if available.
  - `description`* : string ro
  - `address_hint`* : string ro
  - `images`* : array<KindnessListingImage> ro
  - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
  - `status`* : ? ro
  - `contact_phone_snapshot`* : string ro
  - `admin_note`* : string ro
  - `rejection_reason`* : string ro
  - `suspension_reason`* : string ro
  - `contact_reveal_count`* : integer ro
  - `bookmark_count`* : integer ro
  - `report_count`* : integer ro
  - `last_matched_at`* : string<date-time> ro
  - `latitude`* : string<decimal> ro
  - `longitude`* : string<decimal> ro
  - `created_at`* : string<date-time> ro
  - `updated_at`* : string<date-time> ro

### `DELETE /api/v1/kindness-wall/me/listings/{listing_id}/`

دسترسی: 🔒 نیازمند JWT

> Soft-delete own listing.

**پارامترها**

- `listing_id` (path، الزامی) : integer

**پاسخ‌ها**

- `204` — No response body

### `POST /api/v1/kindness-wall/me/listings/{listing_id}/close/`

دسترسی: 🔒 نیازمند JWT

> Close a listing by its owner.

**پارامترها**

- `listing_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `KindnessUserListingDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Owner/admin listing serializer with workflow metadata and contact snapshot.
    - `id`* : integer ro
    - `slug`* : string ro
    - `listing_type`* : ? ro
    - `category`* : ? ro
    - `title`* : string ro
    - `province`* : string ro
    - `city`* : string ro
    - `district`* : string ro
    - `owner_full_name_snapshot`* : string ro
    - `owner_avatar_snapshot`* : string ro
    - `published_at`* : string<date-time> ro
    - `expires_at`* : string<date-time> ro
    - `view_count`* : integer ro
    - `cover_image`* : string ro — Return cover image URL if available.
    - `description`* : string ro
    - `address_hint`* : string ro
    - `images`* : array<KindnessListingImage> ro
    - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
    - `status`* : ? ro
    - `contact_phone_snapshot`* : string ro
    - `admin_note`* : string ro
    - `rejection_reason`* : string ro
    - `suspension_reason`* : string ro
    - `contact_reveal_count`* : integer ro
    - `bookmark_count`* : integer ro
    - `report_count`* : integer ro
    - `last_matched_at`* : string<date-time> ro
    - `latitude`* : string<decimal> ro
    - `longitude`* : string<decimal> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `403` → `KindnessWallErrorResponse`
- `404` → `KindnessWallErrorResponse`

### `POST /api/v1/kindness-wall/me/listings/{listing_id}/renew/`

دسترسی: 🔒 نیازمند JWT

> Renew listing expiration.

**پارامترها**

- `listing_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `slug`* : string ro
- `listing_type`* : ? ro
- `category`* : ? ro
- `title`* : string ro
- `province`* : string ro
- `city`* : string ro
- `district`* : string ro
- `owner_full_name_snapshot`* : string ro
- `owner_avatar_snapshot`* : string ro
- `published_at`* : string<date-time> ro
- `expires_at`* : string<date-time> ro
- `view_count`* : integer ro
- `cover_image`* : string ro — Return cover image URL if available.
- `description`* : string ro
- `address_hint`* : string ro
- `images`* : array<KindnessListingImage> ro
- `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
- `status`* : ? ro
- `contact_phone_snapshot`* : string ro
- `admin_note`* : string ro
- `rejection_reason`* : string ro
- `suspension_reason`* : string ro
- `contact_reveal_count`* : integer ro
- `bookmark_count`* : integer ro
- `report_count`* : integer ro
- `last_matched_at`* : string<date-time> ro
- `latitude`* : string<decimal> ro
- `longitude`* : string<decimal> ro
- `created_at`* : string<date-time> ro
- `updated_at`* : string<date-time> ro

**پاسخ‌ها**

- `200` → `KindnessUserListingDetail`
  - `id`* : integer ro
  - `slug`* : string ro
  - `listing_type`* : ? ro
  - `category`* : ? ro
  - `title`* : string ro
  - `province`* : string ro
  - `city`* : string ro
  - `district`* : string ro
  - `owner_full_name_snapshot`* : string ro
  - `owner_avatar_snapshot`* : string ro
  - `published_at`* : string<date-time> ro
  - `expires_at`* : string<date-time> ro
  - `view_count`* : integer ro
  - `cover_image`* : string ro — Return cover image URL if available.
  - `description`* : string ro
  - `address_hint`* : string ro
  - `images`* : array<KindnessListingImage> ro
  - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
  - `status`* : ? ro
  - `contact_phone_snapshot`* : string ro
  - `admin_note`* : string ro
  - `rejection_reason`* : string ro
  - `suspension_reason`* : string ro
  - `contact_reveal_count`* : integer ro
  - `bookmark_count`* : integer ro
  - `report_count`* : integer ro
  - `last_matched_at`* : string<date-time> ro
  - `latitude`* : string<decimal> ro
  - `longitude`* : string<decimal> ro
  - `created_at`* : string<date-time> ro
  - `updated_at`* : string<date-time> ro

### `POST /api/v1/kindness-wall/me/listings/{listing_id}/submit/`

دسترسی: 🔒 نیازمند JWT

> Submit listing for review.

**پارامترها**

- `listing_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `slug`* : string ro
- `listing_type`* : ? ro
- `category`* : ? ro
- `title`* : string ro
- `province`* : string ro
- `city`* : string ro
- `district`* : string ro
- `owner_full_name_snapshot`* : string ro
- `owner_avatar_snapshot`* : string ro
- `published_at`* : string<date-time> ro
- `expires_at`* : string<date-time> ro
- `view_count`* : integer ro
- `cover_image`* : string ro — Return cover image URL if available.
- `description`* : string ro
- `address_hint`* : string ro
- `images`* : array<KindnessListingImage> ro
- `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
- `status`* : ? ro
- `contact_phone_snapshot`* : string ro
- `admin_note`* : string ro
- `rejection_reason`* : string ro
- `suspension_reason`* : string ro
- `contact_reveal_count`* : integer ro
- `bookmark_count`* : integer ro
- `report_count`* : integer ro
- `last_matched_at`* : string<date-time> ro
- `latitude`* : string<decimal> ro
- `longitude`* : string<decimal> ro
- `created_at`* : string<date-time> ro
- `updated_at`* : string<date-time> ro

**پاسخ‌ها**

- `200` → `KindnessUserListingDetail`
  - `id`* : integer ro
  - `slug`* : string ro
  - `listing_type`* : ? ro
  - `category`* : ? ro
  - `title`* : string ro
  - `province`* : string ro
  - `city`* : string ro
  - `district`* : string ro
  - `owner_full_name_snapshot`* : string ro
  - `owner_avatar_snapshot`* : string ro
  - `published_at`* : string<date-time> ro
  - `expires_at`* : string<date-time> ro
  - `view_count`* : integer ro
  - `cover_image`* : string ro — Return cover image URL if available.
  - `description`* : string ro
  - `address_hint`* : string ro
  - `images`* : array<KindnessListingImage> ro
  - `contact_available`* : boolean ro — Return whether contact can be revealed via dedicated endpoint.
  - `status`* : ? ro
  - `contact_phone_snapshot`* : string ro
  - `admin_note`* : string ro
  - `rejection_reason`* : string ro
  - `suspension_reason`* : string ro
  - `contact_reveal_count`* : integer ro
  - `bookmark_count`* : integer ro
  - `report_count`* : integer ro
  - `last_matched_at`* : string<date-time> ro
  - `latitude`* : string<decimal> ro
  - `longitude`* : string<decimal> ro
  - `created_at`* : string<date-time> ro
  - `updated_at`* : string<date-time> ro

### `GET /api/v1/kindness-wall/me/matches/`

دسترسی: 🔒 نیازمند JWT

> Return active matches for user's listings.

**پاسخ‌ها**

- `200` → `KindnessMatch`
  - `id`* : integer ro
  - `target_listing`* : ? ro
  - `score`* : integer ro
  - `score_breakdown`* : ? ro
  - `reason_codes`* : ? ro
  - `explanation`* : string ro
  - `status`* : ? ro
  - `generated_at`* : string<date-time> ro

### `POST /api/v1/kindness-wall/me/matches/{match_id}/contacted/`

دسترسی: 🔒 نیازمند JWT

> Mark a match as contacted.

**پارامترها**

- `match_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `target_listing`* : ? ro
- `score`* : integer ro
- `score_breakdown`* : ? ro
- `reason_codes`* : ? ro
- `explanation`* : string ro
- `status`* : ? ro
- `generated_at`* : string<date-time> ro

**پاسخ‌ها**

- `200` → `KindnessMatch`
  - `id`* : integer ro
  - `target_listing`* : ? ro
  - `score`* : integer ro
  - `score_breakdown`* : ? ro
  - `reason_codes`* : ? ro
  - `explanation`* : string ro
  - `status`* : ? ro
  - `generated_at`* : string<date-time> ro

### `POST /api/v1/kindness-wall/me/matches/{match_id}/dismiss/`

دسترسی: 🔒 نیازمند JWT

> Dismiss a match owned by user's source listing.

**پارامترها**

- `match_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `target_listing`* : ? ro
- `score`* : integer ro
- `score_breakdown`* : ? ro
- `reason_codes`* : ? ro
- `explanation`* : string ro
- `status`* : ? ro
- `generated_at`* : string<date-time> ro

**پاسخ‌ها**

- `200` → `KindnessMatch`
  - `id`* : integer ro
  - `target_listing`* : ? ro
  - `score`* : integer ro
  - `score_breakdown`* : ? ro
  - `reason_codes`* : ? ro
  - `explanation`* : string ro
  - `status`* : ? ro
  - `generated_at`* : string<date-time> ro

---

## میز پشتیبانی (تیکتینگ) — `/api/v1/support/`

جمعاً 17 عملیات عمومی/کاربری.

### `GET /api/v1/support/categories/`

دسترسی: 🔒 نیازمند JWT

> Return active support categories.

**پاسخ‌ها**

- `200` → `SupportCategoryListResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<SupportCategory>

### `GET /api/v1/support/departments/`

دسترسی: 🔒 نیازمند JWT

> Return active support departments.

**پاسخ‌ها**

- `200` → `SupportDepartmentListResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<SupportDepartment>
- `401` → `SupportDeskErrorResponse`

### `GET /api/v1/support/knowledge/articles/`

دسترسی: 🔒 نیازمند JWT

> Return published knowledge articles with simple search/taxonomy filters.

**پاسخ‌ها**

- `200` → `SupportKnowledgeArticleListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<SupportKnowledgeArticle>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `POST /api/v1/support/knowledge/articles/recommend/`

دسترسی: 🔒 نیازمند JWT

> Recommend published articles from subject/description/taxonomy context.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `subject`* : string
- `description`* : string
- `department_id` : integer
- `category_id` : integer
- `ticket_type_id` : integer

**پاسخ‌ها**

- `200` → `SupportKnowledgeArticleListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<SupportKnowledgeArticle>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/support/knowledge/articles/{slug}/`

دسترسی: 🔒 نیازمند JWT

> Return one published knowledge article by slug.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `SupportKnowledgeArticleDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Read serializer for support knowledge base articles.
    - `id`* : integer ro
    - `department`* : ? ro
    - `category`* : ? ro
    - `ticket_type`* : ? ro
    - `title`* : string ro
    - `slug`* : string ro
    - `summary`* : string ro
    - `body`* : string ro
    - `keywords`* : ? ro
    - `status`* : ? ro
    - `status_display`* : string ro
    - `published_at`* : string<date-time> ro
    - `archived_at`* : string<date-time> ro
    - `usage_count`* : integer ro
    - `is_active`* : boolean ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `404` → `SupportDeskErrorResponse`

### `GET /api/v1/support/me/tickets/`

دسترسی: 🔒 نیازمند JWT

> Return current user's tickets.

**پاسخ‌ها**

- `200` → `SupportTicketListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<SupportTicketList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `POST /api/v1/support/me/tickets/`

دسترسی: 🔒 نیازمند JWT

> Create a draft ticket for current user.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `ticket_type_id`* : integer
- `category_id` : integer
- `subject`* : string
- `description`* : string

**پاسخ‌ها**

- `201` → `SupportTicketDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-safe ticket detail serializer with public timeline and attachments.
    - `id`* : integer ro
    - `uuid`* : string<uuid> ro
    - `ticket_number`* : string ro
    - `subject`* : string ro
    - `status`* : ? ro
    - `priority`* : ? ro
    - `severity`* : ? ro
    - `department`* : ? ro
    - `category`* : ? ro
    - `ticket_type`* : ? ro
    - `submitted_at`* : string<date-time> ro
    - `last_activity_at`* : string<date-time> ro
    - `first_response_due_at`* : string<date-time> ro
    - `resolution_due_at`* : string<date-time> ro
    - `sla_breached_at`* : string<date-time> ro
    - `message_count`* : integer ro
    - `attachment_count`* : integer ro
    - `reopen_count`* : integer ro
    - `satisfaction_rating_snapshot`* : integer ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
    - `description_snapshot`* : string ro
    - `assigned_to_id`* : integer ro
    - `first_admin_response_at`* : string<date-time> ro
    - `resolved_at`* : string<date-time> ro
    - `closed_at`* : string<date-time> ro
    - `reopened_at`* : string<date-time> ro
    - `sla_total_paused_seconds`* : integer ro
    - `is_reopenable`* : boolean ro
    - `messages`* : array<SupportTicketMessage> ro
    - `attachments`* : array<SupportTicketAttachment> ro
- `400` → `SupportDeskErrorResponse`

### `POST /api/v1/support/me/tickets/suggest/`

دسترسی: 🔒 نیازمند JWT

> Return smart triage suggestions and duplicate warning.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `subject`* : string
- `description`* : string
- `category_id` : integer
- `ticket_type_id` : integer

**پاسخ‌ها**

- `200` → `SupportTriageSuggestionResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Output serializer for smart triage suggestions.
    - `department`* : ?
    - `category`* : ?
    - `ticket_type`* : ?
    - `priority`* : string
    - `severity`* : string
    - `sla_policy`* : ?
    - `duplicate_warning`* : boolean
    - `similar_ticket_ids`* : array<integer>
    - `reason_codes`* : array<string>
    - `score`* : integer

### `GET /api/v1/support/me/tickets/{ticket_number}/`

دسترسی: 🔒 نیازمند JWT

> Return current user's ticket detail.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `SupportTicketDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-safe ticket detail serializer with public timeline and attachments.
    - `id`* : integer ro
    - `uuid`* : string<uuid> ro
    - `ticket_number`* : string ro
    - `subject`* : string ro
    - `status`* : ? ro
    - `priority`* : ? ro
    - `severity`* : ? ro
    - `department`* : ? ro
    - `category`* : ? ro
    - `ticket_type`* : ? ro
    - `submitted_at`* : string<date-time> ro
    - `last_activity_at`* : string<date-time> ro
    - `first_response_due_at`* : string<date-time> ro
    - `resolution_due_at`* : string<date-time> ro
    - `sla_breached_at`* : string<date-time> ro
    - `message_count`* : integer ro
    - `attachment_count`* : integer ro
    - `reopen_count`* : integer ro
    - `satisfaction_rating_snapshot`* : integer ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
    - `description_snapshot`* : string ro
    - `assigned_to_id`* : integer ro
    - `first_admin_response_at`* : string<date-time> ro
    - `resolved_at`* : string<date-time> ro
    - `closed_at`* : string<date-time> ro
    - `reopened_at`* : string<date-time> ro
    - `sla_total_paused_seconds`* : integer ro
    - `is_reopenable`* : boolean ro
    - `messages`* : array<SupportTicketMessage> ro
    - `attachments`* : array<SupportTicketAttachment> ro
- `404` → `SupportDeskErrorResponse`

### `PATCH /api/v1/support/me/tickets/{ticket_number}/`

دسترسی: 🔒 نیازمند JWT

> Update a draft ticket before submission.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `ticket_type_id` : integer
- `category_id` : integer
- `subject` : string
- `description` : string

**پاسخ‌ها**

- `200` → `SupportTicketDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-safe ticket detail serializer with public timeline and attachments.
    - `id`* : integer ro
    - `uuid`* : string<uuid> ro
    - `ticket_number`* : string ro
    - `subject`* : string ro
    - `status`* : ? ro
    - `priority`* : ? ro
    - `severity`* : ? ro
    - `department`* : ? ro
    - `category`* : ? ro
    - `ticket_type`* : ? ro
    - `submitted_at`* : string<date-time> ro
    - `last_activity_at`* : string<date-time> ro
    - `first_response_due_at`* : string<date-time> ro
    - `resolution_due_at`* : string<date-time> ro
    - `sla_breached_at`* : string<date-time> ro
    - `message_count`* : integer ro
    - `attachment_count`* : integer ro
    - `reopen_count`* : integer ro
    - `satisfaction_rating_snapshot`* : integer ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
    - `description_snapshot`* : string ro
    - `assigned_to_id`* : integer ro
    - `first_admin_response_at`* : string<date-time> ro
    - `resolved_at`* : string<date-time> ro
    - `closed_at`* : string<date-time> ro
    - `reopened_at`* : string<date-time> ro
    - `sla_total_paused_seconds`* : integer ro
    - `is_reopenable`* : boolean ro
    - `messages`* : array<SupportTicketMessage> ro
    - `attachments`* : array<SupportTicketAttachment> ro
- `403` → `SupportDeskErrorResponse`
- `404` → `SupportDeskErrorResponse`

### `POST /api/v1/support/me/tickets/{ticket_number}/attachments/`

دسترسی: 🔒 نیازمند JWT

> Attach a validated public file to the ticket.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `file`* : string<uri>
- `attachment_kind` : ?

**پاسخ‌ها**

- `201` → `SupportTicketAttachmentResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-safe support attachment serializer.
    - `id`* : integer ro
    - `file`* : string<uri> ro
    - `original_filename`* : string ro
    - `content_type`* : string ro
    - `file_size`* : integer ro
    - `attachment_kind`* : ? ro
    - `visibility`* : ? ro
    - `uploaded_by_display`* : string ro — Return safe uploader display name.
    - `created_at`* : string<date-time> ro
- `403` → `SupportDeskErrorResponse`
- `404` → `SupportDeskErrorResponse`

### `POST /api/v1/support/me/tickets/{ticket_number}/reopen/`

دسترسی: 🔒 نیازمند JWT

> Reopen ticket within the policy window.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `reason` : string

**پاسخ‌ها**

- `200` → `SupportTicketDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-safe ticket detail serializer with public timeline and attachments.
    - `id`* : integer ro
    - `uuid`* : string<uuid> ro
    - `ticket_number`* : string ro
    - `subject`* : string ro
    - `status`* : ? ro
    - `priority`* : ? ro
    - `severity`* : ? ro
    - `department`* : ? ro
    - `category`* : ? ro
    - `ticket_type`* : ? ro
    - `submitted_at`* : string<date-time> ro
    - `last_activity_at`* : string<date-time> ro
    - `first_response_due_at`* : string<date-time> ro
    - `resolution_due_at`* : string<date-time> ro
    - `sla_breached_at`* : string<date-time> ro
    - `message_count`* : integer ro
    - `attachment_count`* : integer ro
    - `reopen_count`* : integer ro
    - `satisfaction_rating_snapshot`* : integer ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
    - `description_snapshot`* : string ro
    - `assigned_to_id`* : integer ro
    - `first_admin_response_at`* : string<date-time> ro
    - `resolved_at`* : string<date-time> ro
    - `closed_at`* : string<date-time> ro
    - `reopened_at`* : string<date-time> ro
    - `sla_total_paused_seconds`* : integer ro
    - `is_reopenable`* : boolean ro
    - `messages`* : array<SupportTicketMessage> ro
    - `attachments`* : array<SupportTicketAttachment> ro
- `403` → `SupportDeskErrorResponse`
- `404` → `SupportDeskErrorResponse`

### `POST /api/v1/support/me/tickets/{ticket_number}/reply/`

دسترسی: 🔒 نیازمند JWT

> Append a user reply to the public timeline.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `body`* : string

**پاسخ‌ها**

- `201` → `SupportTicketReplyResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-safe public timeline message serializer.
    - `id`* : integer ro
    - `message_type`* : ? ro
    - `body`* : string ro
    - `is_from_staff`* : boolean ro
    - `author_display`* : string ro — Return safe display name for a message author.
    - `created_at`* : string<date-time> ro
    - `edited_at`* : string<date-time> ro
- `403` → `SupportDeskErrorResponse`
- `404` → `SupportDeskErrorResponse`

### `POST /api/v1/support/me/tickets/{ticket_number}/satisfaction/`

دسترسی: 🔒 نیازمند JWT

> Submit CSAT rating.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `rating`* : integer
- `comment` : string

**پاسخ‌ها**

- `201` → `SupportTicketSatisfactionResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data` : ?
- `403` → `SupportDeskErrorResponse`
- `404` → `SupportDeskErrorResponse`

### `POST /api/v1/support/me/tickets/{ticket_number}/submit/`

دسترسی: 🔒 نیازمند JWT

> Submit current user's draft ticket.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `SupportTicketDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — User-safe ticket detail serializer with public timeline and attachments.
    - `id`* : integer ro
    - `uuid`* : string<uuid> ro
    - `ticket_number`* : string ro
    - `subject`* : string ro
    - `status`* : ? ro
    - `priority`* : ? ro
    - `severity`* : ? ro
    - `department`* : ? ro
    - `category`* : ? ro
    - `ticket_type`* : ? ro
    - `submitted_at`* : string<date-time> ro
    - `last_activity_at`* : string<date-time> ro
    - `first_response_due_at`* : string<date-time> ro
    - `resolution_due_at`* : string<date-time> ro
    - `sla_breached_at`* : string<date-time> ro
    - `message_count`* : integer ro
    - `attachment_count`* : integer ro
    - `reopen_count`* : integer ro
    - `satisfaction_rating_snapshot`* : integer ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
    - `description_snapshot`* : string ro
    - `assigned_to_id`* : integer ro
    - `first_admin_response_at`* : string<date-time> ro
    - `resolved_at`* : string<date-time> ro
    - `closed_at`* : string<date-time> ro
    - `reopened_at`* : string<date-time> ro
    - `sla_total_paused_seconds`* : integer ro
    - `is_reopenable`* : boolean ro
    - `messages`* : array<SupportTicketMessage> ro
    - `attachments`* : array<SupportTicketAttachment> ro
- `403` → `SupportDeskErrorResponse`
- `404` → `SupportDeskErrorResponse`

### `GET /api/v1/support/me/tickets/{ticket_number}/timeline/`

دسترسی: 🔒 نیازمند JWT

> Return public messages only; internal notes are never exposed.

**پارامترها**

- `ticket_number` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `SupportTicketTimelineResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<SupportTicketMessage>
- `404` → `SupportDeskErrorResponse`

### `GET /api/v1/support/ticket-types/`

دسترسی: 🔒 نیازمند JWT

> Return active support ticket types.

**پاسخ‌ها**

- `200` → `SupportTicketTypeListResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<SupportTicketType>

---

## مددکار (کمپین‌های حمایتی) — `/api/v1/madadkar/`

جمعاً 13 عملیات عمومی/کاربری.

### `GET /api/v1/madadkar/campaigns/`

**لیست حرکت‌های خیریه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت لیست حرکت‌های قابل نمایش (PUBLISHED, COMPLETED, CLOSED).
>
> حرکت‌های DRAFT و is_visible=False در این لیست نمایش داده نمی‌شوند.
>
> نتایج paginated و قابل فیلتر می‌باشند.

**پارامترها**

- `has_deadline` (query) : boolean — فیلتر بر اساس داشتن مهلت زمانی
- `is_fully_funded` (query) : boolean — فیلتر بر اساس تکمیل ۱۰۰٪ سهم‌ها
- `ordering` (query) : string — ترتیب: published_at, created_at, progress, deadline (با - برای descending)
- `page` (query) : integer — شماره صفحه
- `page_size` (query) : integer — تعداد آیتم در هر صفحه (حداکثر ۱۰۰)
- `search` (query) : string — جستجو در عنوان و توضیحات
- `sponsor` (query) : integer — فیلتر بر اساس شناسه مددکار
- `sponsor_slug` (query) : string — فیلتر بر اساس slug مددکار
- `status` (query) : enum(closed, completed, published) — فیلتر بر اساس وضعیت حرکت

**پاسخ‌ها**

- `200` → `MadadkarPublicCampaignListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<CampaignPublicList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/madadkar/campaigns/{slug}/`

**جزئیات یک حرکت خیریه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت جزئیات کامل یک حرکت با slug.
>
> شامل گالری تصاویر، اطلاعات مددکار، پیشرفت سهم و توضیحات کامل.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `MadadkarPublicCampaignDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش جزئیات حرکت در صفحه detail عمومی — همراه گالری و توضیحات کامل.
    - `id`* : integer ro
    - `sponsor`* : ? ro
    - `title`* : string ro
    - `slug`* : string ro — در صورت خالی بودن، از روی عنوان به‌صورت خودکار ساخته می‌شود.
    - `cover_image`* : string<uri> ro
    - `total_amount`* : integer ro
    - `total_shares`* : integer ro
    - `share_price`* : integer ro — به‌صورت خودکار از total_amount / total_shares محاسبه می‌شود.
    - `purchased_shares`* : integer ro — مجموع سهم‌های PAID + PENDING_PAYMENT.
    - `purchased_amount`* : integer ro — فقط مجموع مبلغ پرداخت‌های قطعی (PAID).
    - `participant_count`* : integer ro
    - `remaining_shares`* : integer ro
    - `progress_percent`* : number<double> ro
    - `is_fully_funded`* : boolean ro
    - `status`* : ? ro
    - `status_display`* : string ro
    - `has_deadline`* : boolean ro
    - `deadline`* : string<date-time> ro — فقط زمانی استفاده می‌شود که has_deadline=True باشد.
    - `published_at`* : string<date-time> ro
    - `completed_at`* : string<date-time> ro
    - `closed_at`* : string<date-time> ro
    - `description`* : string ro
    - `gallery_images`* : array<CampaignImageRead> ro
- `404` → `MadadkarGenericErrorResponse`

### `POST /api/v1/madadkar/campaigns/{slug}/participate/`

**شروع مشارکت در حرکت**  
دسترسی: 🔒 نیازمند JWT

> کاربر لاگین‌کرده می‌تواند با وارد کردن تعداد سهم، فرآیند پرداخت را آغاز کند.
>
> **گام‌ها در سمت کلاینت:**
> 1. این endpoint را با share_count فراخوانی کنید.
> 2. به `gateway_url` ریدایرکت کنید.
> 3. پس از بازگشت از درگاه، endpoint verify خودکار صدا زده می‌شود.
>
> **نکات امنیتی:**
> - سهم‌ها به محض initiate رزرو می‌شوند (تا 15 دقیقه).
> - اگر پرداخت موفق نشود، سهم‌ها خودکار آزاد می‌شوند.
> - قیمت سهم در لحظه ایجاد ثبت می‌شود (snapshot).

**پارامترها**

- `slug` (path، الزامی) : string

**بدنه‌ی درخواست** — `application/json` , `multipart/form-data` , `application/x-www-form-urlencoded`

- `share_count`* : integer — تعداد سهمی که می‌خواهید خریداری کنید (حداقل ۱).
- `mobile` : string — شماره موبایل برای ارسال به درگاه (اختیاری).
- `email` : string<email> — ایمیل برای ارسال به درگاه (اختیاری).

**پاسخ‌ها**

- `201` → `MadadkarParticipationInitiatedResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — پاسخ موفقیت‌آمیز شروع مشارکت.  شامل اطلاعات Participation و URL مقصد درگاه. کاربر باید به gateway_ur
    - `participation`* : ? ro
    - `gateway_url`* : string<uri> ro — URL کامل درگاه پرداخت — کاربر باید به این URL ریدایرکت شود.
    - `authority`* : string ro — کد رهگیری پرداخت — برای پیگیری و تأیید.
- `400` → `MadadkarGenericErrorResponse`
- `401` → `MadadkarGenericErrorResponse`
- `404` → `MadadkarGenericErrorResponse`

### `GET /api/v1/madadkar/campaigns/{slug}/transparency/`

**شفافیت مالی عمومی حرکت**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> نمای عمومی و بدون اطلاعات خصوصی از وضعیت مالی حرکت: مبالغ جمع‌آوری‌شده، بازپرداخت‌ها، اصلاحات مالی، تخصیص‌های پرداخت‌شده و مانده قابل تخصیص.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `MadadkarPublicCampaignTransparencyResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Public-safe transparency snapshot for a Madadkar campaign.
    - `campaign_id`* : integer ro
    - `campaign_title`* : string ro
    - `campaign_slug`* : string ro
    - `sponsor_name`* : string ro
    - `generated_at`* : string<date-time> ro
    - `target_amount`* : integer ro
    - `gross_raised_amount`* : integer ro
    - `completed_refund_amount`* : integer ro
    - `applied_adjustment_delta`* : integer ro
    - `net_raised_amount`* : integer ro
    - `paid_disbursement_amount`* : integer ro
    - `committed_disbursement_amount`* : integer ro
    - `remaining_disbursable_amount`* : integer ro
    - `receipt_count`* : integer ro
    - `successful_payment_count`* : integer ro
    - `completed_refund_count`* : integer ro
    - `paid_disbursement_count`* : integer ro
    - `net_progress_percent`* : number<double> ro
    - `public_note`* : string ro
- `404` → `MadadkarGenericErrorResponse`

### `GET /api/v1/madadkar/me/participations/`

**لیست مشارکت‌های من**  
دسترسی: 🔒 نیازمند JWT

> دریافت لیست تمام مشارکت‌های کاربر جاری.

**پارامترها**

- `campaign` (query) : integer — فیلتر بر اساس شناسه حرکت
- `page` (query) : integer — شماره صفحه
- `page_size` (query) : integer — تعداد آیتم در هر صفحه (حداکثر ۱۰۰)
- `status` (query) : enum(expired, failed, paid, pending_payment) — فیلتر بر اساس وضعیت مشارکت

**پاسخ‌ها**

- `200` → `MadadkarUserParticipationListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<ParticipationUserList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `401` → `MadadkarGenericErrorResponse`

### `GET /api/v1/madadkar/me/participations/{participation_id}/`

**جزئیات یک مشارکت من**  
دسترسی: 🔒 نیازمند JWT

> جزئیات یک مشارکت من — IDOR-safe.

**پارامترها**

- `participation_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `MadadkarUserParticipationDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — جزئیات مشارکت کاربر — همراه پرداخت.
    - `id`* : integer ro
    - `campaign`* : ? ro
    - `share_count`* : integer ro
    - `share_price_snapshot`* : integer ro
    - `total_amount`* : integer ro
    - `status`* : ? ro
    - `status_display`* : string ro
    - `created_at`* : string<date-time> ro
    - `paid_at`* : string<date-time> ro
    - `payment`* : ? ro
- `401` → `MadadkarGenericErrorResponse`
- `403` → `MadadkarGenericErrorResponse`
- `404` → `MadadkarGenericErrorResponse`

### `GET /api/v1/madadkar/me/receipts/`

**لیست رسیدهای مشارکت من**  
دسترسی: 🔒 نیازمند JWT

> List verifiable donation receipts owned by current user.

**پاسخ‌ها**

- `200` → `MadadkarUserReceiptListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<DonationReceipt>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `401` → `MadadkarGenericErrorResponse`

### `GET /api/v1/madadkar/me/receipts/{receipt_id}/`

**جزئیات رسید مشارکت من**  
دسترسی: 🔒 نیازمند JWT

> Retrieve one user-owned donation receipt and audit access.

**پارامترها**

- `receipt_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `MadadkarUserReceiptDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Read serializer for user-owned verifiable donation receipts.
    - `id`* : integer ro
    - `receipt_number`* : string ro
    - `receipt_hash`* : string ro
    - `hash_version`* : integer ro
    - `amount`* : integer ro
    - `issued_at`* : string<date-time> ro
    - `campaign`* : integer ro
    - `campaign_title`* : string ro
    - `campaign_slug`* : string ro
    - `payment_snapshot`* : ? ro
    - `campaign_snapshot`* : ? ro
    - `donor_snapshot`* : ? ro
    - `resend_count`* : integer ro
    - `last_resent_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
- `401` → `MadadkarGenericErrorResponse`
- `404` → `MadadkarGenericErrorResponse`

### `GET /api/v1/madadkar/payment/verify/`

**تأیید پرداخت — callback از سمت درگاه**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> این endpoint توسط درگاه پرداخت بعد از تکمیل تراکنش فراخوانی می‌شود.
>
> ورودی شامل `authority` (و گاهی `status`) است که توسط درگاه به‌صورت query string یا body ارسال می‌گردد.
>
> این endpoint **idempotent** است: فراخوانی دوباره با همان authority نتیجه قبلی را برمی‌گرداند بدون تماس مجدد با درگاه.

**پارامترها**

- `authority` (query، الزامی) : string
- `status` (query) : string

**پاسخ‌ها**

- `200` → `MadadkarPaymentVerifyResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — پاسخ نتیجه verify — برای نمایش به کاربر.
    - `payment_status`* : string ro
    - `payment_status_display`* : string ro
    - `participation`* : ? ro
    - `is_verified`* : boolean ro — آیا پرداخت نهایی موفق بود؟
    - `message`* : string ro
- `400` → `MadadkarGenericErrorResponse`
- `404` → `MadadkarGenericErrorResponse`
- `502` → `MadadkarGenericErrorResponse`

### `POST /api/v1/madadkar/payment/verify/`

**تأیید پرداخت — POST callback (درگاه‌های POST-based)**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> Callback تأیید پرداخت — GET/POST /api/v1/madadkar/payment/verify/
>
> نکته مهم: این endpoint از سمت **درگاه پرداخت** فراخوانی می‌شود
> (نه مستقیم از طرف کلاینت ما). در زمان فراخوانی session کاربر
> معمولاً موجود نیست.
>
> بنابراین:
> - permission: AllowAny (verify بر اساس authority انجام می‌شود)
> - throttle: مخصوص (مبتنی بر IP)
> - method: هم GET (Zarinpal) و هم POST (سایر درگاه‌ها) پشتیبانی می‌شوند.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `authority`* : string — کد رهگیری پرداخت برگشتی از درگاه.
- `status` : string — وضعیت اولیه از سمت درگاه (OK/NOK) — قابل اعتماد نیست.

**پاسخ‌ها**

- `200` → `MadadkarPaymentVerifyResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — پاسخ نتیجه verify — برای نمایش به کاربر.
    - `payment_status`* : string ro
    - `payment_status_display`* : string ro
    - `participation`* : ? ro
    - `is_verified`* : boolean ro — آیا پرداخت نهایی موفق بود؟
    - `message`* : string ro
- `400` → `MadadkarGenericErrorResponse`
- `404` → `MadadkarGenericErrorResponse`
- `502` → `MadadkarGenericErrorResponse`

### `POST /api/v1/madadkar/receipts/verify/`

**اعتبارسنجی عمومی رسید مشارکت**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> Public verification for receipt number/hash pairs without exposing donor PII.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `receipt_number`* : string
- `receipt_hash`* : string

**پاسخ‌ها**

- `200` → `MadadkarPublicReceiptVerifyResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Public-safe receipt verification result.
    - `is_valid`* : boolean ro
    - `receipt_number`* : string ro
    - `amount`* : integer ro
    - `issued_at`* : string<date-time> ro
    - `campaign_title`* : string ro
    - `sponsor_name`* : string ro
    - `hash_version`* : integer ro
- `400` → `MadadkarGenericErrorResponse`

### `GET /api/v1/madadkar/sponsors/`

**لیست مددکاران**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت لیست تمام مددکارانی که حداقل یک حرکت قابل نمایش دارند.
>
> این endpoint بدون نیاز به لاگین قابل دسترس است.

**پارامترها**

- `page` (query) : integer — شماره صفحه
- `page_size` (query) : integer — تعداد آیتم در هر صفحه (حداکثر ۱۰۰)

**پاسخ‌ها**

- `200` → `MadadkarPublicSponsorListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<SponsorPublic>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/madadkar/sponsors/{slug}/`

**جزئیات یک مددکار**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت جزئیات یک مددکار با slug.

**پارامترها**

- `slug` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `MadadkarPublicSponsorDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش عمومی مددکار — فقط فیلدهای امن.
    - `id`* : integer ro
    - `name`* : string ro
    - `slug`* : string ro — در صورت خالی بودن، از روی نام به‌صورت خودکار ساخته می‌شود.
    - `logo`* : string<uri> ro
- `404` → `MadadkarGenericErrorResponse`

---

## جایزه‌ای برای عدالت (R4J) — `/api/v1/r4j/`

جمعاً 9 عملیات عمومی/کاربری.

### `GET /api/v1/r4j/criminals/`

**لیست مجرمین منتشرشده**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت لیست مجرمین منتشرشده برای نمایش عمومی.
>
> فقط رکوردهای فعال و منتشرشده در پاسخ هستند. نتایج paginated و قابل فیلتر می‌باشند.

**پارامترها**

- `city` (query) : string — فیلتر بر اساس شهر
- `country` (query) : string — فیلتر بر اساس کشور
- `gender` (query) : enum(female, male, unknown) — فیلتر بر اساس جنسیت
- `page` (query) : integer — شماره صفحه
- `page_size` (query) : integer — تعداد آیتم در هر صفحه (حداکثر ۱۰۰)
- `province` (query) : string — فیلتر بر اساس استان
- `search` (query) : string — جستجو در نام، نام خانوادگی، slug و اسامی مستعار

**پاسخ‌ها**

- `200` → `R4JPublicCriminalListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<R4JPublicCriminalList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `POST /api/v1/r4j/criminals/{criminal_id}/bounty/`

**تعیین یا ویرایش جایزه برای مجرم**  
دسترسی: 🔒 نیازمند JWT

> کاربرانی که احراز هویت کامل داشته و پروفایل آن‌ها کامل باشد می‌توانند برای یک مجرم جایزه تعیین کنند.
>
> اگر قبلاً برای همان مجرم جایزه‌ای فعال ثبت کرده باشند، همان رکورد به‌روزرسانی می‌شود؛ در غیر این صورت رکورد جدید ساخته می‌شود.

**پارامترها**

- `criminal_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `amount_toman`* : integer

**پاسخ‌ها**

- `201` → `R4JUserBountyDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش bounty برای کاربر — شامل اطلاعات criminal.  کاربر فقط bountyهای خودش را می‌بیند. فیلدهای admin
    - `id`* : integer ro
    - `criminal_id`* : integer ro
    - `criminal_name`* : string ro — نام کامل مجرم.
    - `criminal_slug`* : string ro — slug مجرم برای لینک‌دهی.
    - `amount_toman`* : integer ro
    - `status`* : ? ro
    - `cancel_requested_at`* : string<date-time> ro
    - `canceled_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `200` → `R4JUserBountyDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش bounty برای کاربر — شامل اطلاعات criminal.  کاربر فقط bountyهای خودش را می‌بیند. فیلدهای admin
    - `id`* : integer ro
    - `criminal_id`* : integer ro
    - `criminal_name`* : string ro — نام کامل مجرم.
    - `criminal_slug`* : string ro — slug مجرم برای لینک‌دهی.
    - `amount_toman`* : integer ro
    - `status`* : ? ro
    - `cancel_requested_at`* : string<date-time> ro
    - `canceled_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `400` → `R4JGenericErrorResponse`
- `401` → `R4JGenericErrorResponse`
- `403` → `R4JGenericErrorResponse`
- `404` → `R4JGenericErrorResponse`
- `429` → `R4JGenericErrorResponse`

### `POST /api/v1/r4j/criminals/{criminal_id}/reports/`

**ارسال گزارش تکمیلی برای مجرم**  
دسترسی: 🔒 نیازمند JWT

> کاربر لاگین‌کرده می‌تواند گزارشی برای تکمیل یا اصلاح اطلاعات یک مجرم ارسال کند.
>
> **حالت JSON:**
> ```json
> {
>   "notes": "متن آزاد",
>   "field_changes": [{"field_name": "city", "suggested_value": "Tehran"}]
> }
> ```
>
> **حالت Multipart (با فایل ضمیمه):**
> - `notes`: string
> - `field_changes`: JSON string
> - `attachments`: یک یا چند فایل
>
> گزارش باید حداقل شامل یک پیشنهاد تغییر فیلد یا یادداشت باشد.
>
> تا قبل از تأیید ادمین، هیچ تغییری روی پروفایل مجرم اعمال نمی‌شود.

**پارامترها**

- `criminal_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `multipart/form-data` , `application/x-www-form-urlencoded` , `application/json`

- `notes` : string
- `field_changes` : array<R4JReportFieldChangeInput> — در JSON: لیست مستقیم field changeها. در multipart: JSON string از همان لیست. مثال: [{"field_name": "

**پاسخ‌ها**

- `201` → `R4JUserReportDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش جزئیات کامل یک گزارش برای کاربر — شامل field_changes و attachments.
    - `id`* : integer ro
    - `criminal_id`* : integer ro
    - `criminal_name`* : string ro — نام کامل مجرم.
    - `notes`* : string ro — متن آزاد گزارش‌دهنده در صورت نیاز.
    - `status`* : ? ro
    - `admin_note`* : string ro
    - `field_changes`* : array<R4JReportFieldChange> ro
    - `attachments`* : array<R4JReportAttachment> ro
    - `cancel_requested_at`* : string<date-time> ro
    - `canceled_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `400` → `R4JGenericErrorResponse`
- `401` → `R4JGenericErrorResponse`
- `404` → `R4JGenericErrorResponse`

### `GET /api/v1/r4j/criminals/{lookup}/`

**جزئیات یک مجرم منتشرشده**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت جزئیات یک مجرم با استفاده از id یا slug.
>
> فیلدهای حساس بر اساس تنظیمات per-criminal visibility نمایش داده یا مخفی می‌شوند.

**پارامترها**

- `lookup` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `R4JPublicCriminalDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش جزئیات عمومی با اعمال visibility map.  فیلدهایی که visibility آن‌ها False است، None سرو می‌شون
    - `id`* : integer ro
    - `slug`* : string ro — در صورت خالی بودن، خودکار از نام ساخته می‌شود.
    - `first_name`* : string ro
    - `last_name`* : string ro
    - `national_code`* : string ro — برای مجرمین غیرایرانی خالی می‌ماند.
    - `birth_date`* : string<date> ro
    - `gender`* : ? ro
    - `country`* : string ro
    - `province`* : string ro
    - `city`* : string ro
    - `description`* : string ro
    - `crimes_summary`* : string ro
    - `other_info`* : string ro — متن آزاد برای ثبت هر اطلاعات تکمیلی.
    - `photos`* : array<R4JPublicPhoto> ro
    - `phones`* : array<R4JPublicPhone> ro
    - `socials`* : array<R4JPublicSocial> ro
    - `attachments`* : array<R4JPublicAttachment> ro
    - `aliases`* : array<R4JAlias> ro
    - `total_bounty_toman`* : integer ro
    - `bounties_count`* : integer ro
    - `published_at`* : string<date-time> ro
- `404` → `R4JGenericErrorResponse`

### `GET /api/v1/r4j/me/bounties/`

**لیست جوایز من**  
دسترسی: 🔒 نیازمند JWT

> دریافت لیست تمام جوایزی که توسط کاربر جاری تعیین شده‌اند.

**پارامترها**

- `created_after` (query) : string<date-time> — جوایز ثبت‌شده بعد از این تاریخ
- `created_before` (query) : string<date-time> — جوایز ثبت‌شده قبل از این تاریخ
- `criminal_id` (query) : integer — فیلتر بر اساس شناسه مجرم
- `page` (query) : integer — شماره صفحه
- `page_size` (query) : integer — تعداد آیتم در هر صفحه (حداکثر ۱۰۰)
- `status` (query) : string — فیلتر بر اساس وضعیت جایزه

**پاسخ‌ها**

- `200` → `R4JUserBountyListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<R4JUserBounty>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `401` → `R4JGenericErrorResponse`

### `POST /api/v1/r4j/me/bounties/{bounty_id}/cancel/`

**درخواست لغو جایزه**  
دسترسی: 🔒 نیازمند JWT

> کاربر می‌تواند برای جایزه‌ای که خودش تعیین کرده درخواست لغو ثبت کند.
>
> فقط جایزه‌های فعال قابل درخواست لغو هستند و درخواست لغو باید توسط ادمین تأیید یا رد شود.

**پارامترها**

- `bounty_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `R4JUserBountyDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش bounty برای کاربر — شامل اطلاعات criminal.  کاربر فقط bountyهای خودش را می‌بیند. فیلدهای admin
    - `id`* : integer ro
    - `criminal_id`* : integer ro
    - `criminal_name`* : string ro — نام کامل مجرم.
    - `criminal_slug`* : string ro — slug مجرم برای لینک‌دهی.
    - `amount_toman`* : integer ro
    - `status`* : ? ro
    - `cancel_requested_at`* : string<date-time> ro
    - `canceled_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `400` → `R4JGenericErrorResponse`
- `401` → `R4JGenericErrorResponse`
- `404` → `R4JGenericErrorResponse`

### `GET /api/v1/r4j/me/reports/`

**لیست گزارشات من**  
دسترسی: 🔒 نیازمند JWT

> دریافت لیست تمام گزارشاتی که توسط کاربر جاری ارسال شده‌اند.

**پارامترها**

- `page` (query) : integer — شماره صفحه
- `page_size` (query) : integer — تعداد آیتم در هر صفحه (حداکثر ۱۰۰)
- `status` (query) : string — فیلتر بر اساس وضعیت گزارش

**پاسخ‌ها**

- `200` → `R4JUserReportListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<R4JUserReportList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
- `401` → `R4JGenericErrorResponse`

### `GET /api/v1/r4j/me/reports/{report_id}/`

**جزئیات یک گزارش من**  
دسترسی: 🔒 نیازمند JWT

> جزئیات یک گزارش کاربر + cancel request.

**پارامترها**

- `report_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `R4JUserReportDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش جزئیات کامل یک گزارش برای کاربر — شامل field_changes و attachments.
    - `id`* : integer ro
    - `criminal_id`* : integer ro
    - `criminal_name`* : string ro — نام کامل مجرم.
    - `notes`* : string ro — متن آزاد گزارش‌دهنده در صورت نیاز.
    - `status`* : ? ro
    - `admin_note`* : string ro
    - `field_changes`* : array<R4JReportFieldChange> ro
    - `attachments`* : array<R4JReportAttachment> ro
    - `cancel_requested_at`* : string<date-time> ro
    - `canceled_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `401` → `R4JGenericErrorResponse`
- `404` → `R4JGenericErrorResponse`

### `POST /api/v1/r4j/me/reports/{report_id}/cancel/`

**درخواست لغو گزارش**  
دسترسی: 🔒 نیازمند JWT

> کاربر می‌تواند درخواست لغو گزارشی که ارسال کرده را بدهد.
>
> فقط گزارش‌هایی که در وضعیت «در انتظار بررسی» هستند قابل لغو می‌باشند.
>
> درخواست لغو باید توسط ادمین تأیید یا رد شود.

**پارامترها**

- `report_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `R4JUserReportDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — نمایش جزئیات کامل یک گزارش برای کاربر — شامل field_changes و attachments.
    - `id`* : integer ro
    - `criminal_id`* : integer ro
    - `criminal_name`* : string ro — نام کامل مجرم.
    - `notes`* : string ro — متن آزاد گزارش‌دهنده در صورت نیاز.
    - `status`* : ? ro
    - `admin_note`* : string ro
    - `field_changes`* : array<R4JReportFieldChange> ro
    - `attachments`* : array<R4JReportAttachment> ro
    - `cancel_requested_at`* : string<date-time> ro
    - `canceled_at`* : string<date-time> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
- `400` → `R4JGenericErrorResponse`
- `401` → `R4JGenericErrorResponse`
- `404` → `R4JGenericErrorResponse`

---

## اعلان‌ها — `/api/v1/notifications/`

جمعاً 5 عملیات عمومی/کاربری.

### `GET /api/v1/notifications/me/`

دسترسی: 🔒 نیازمند JWT

> Return paginated notifications.

**پاسخ‌ها**

- `200` → `NotificationDelivery`
  - `id`* : integer ro
  - `channel`* : ? ro
  - `status`* : ? ro
  - `subject`* : string ro
  - `body`* : string ro
  - `sent_at`* : string<date-time> ro
  - `read_at`* : string<date-time> ro
  - `created_at`* : string<date-time> ro

### `GET /api/v1/notifications/me/preferences/`

دسترسی: 🔒 نیازمند JWT

> Return preferences.

**پاسخ‌ها**

- `200` → `NotificationPreference`
  - `id`* : integer ro
  - `event_type`* : string ro
  - `channel`* : ? ro
  - `enabled`* : boolean ro
  - `created_at`* : string<date-time> ro
  - `updated_at`* : string<date-time> ro

### `POST /api/v1/notifications/me/preferences/`

دسترسی: 🔒 نیازمند JWT

> Create/update one preference.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `event_type`* : string ro
- `channel`* : ? ro
- `enabled`* : boolean ro
- `created_at`* : string<date-time> ro
- `updated_at`* : string<date-time> ro

**پاسخ‌ها**

- `200` → `NotificationPreference`
  - `id`* : integer ro
  - `event_type`* : string ro
  - `channel`* : ? ro
  - `enabled`* : boolean ro
  - `created_at`* : string<date-time> ro
  - `updated_at`* : string<date-time> ro

### `POST /api/v1/notifications/me/read-all/`

دسترسی: 🔒 نیازمند JWT

> Mark all deliveries as read.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `channel`* : ? ro
- `status`* : ? ro
- `subject`* : string ro
- `body`* : string ro
- `sent_at`* : string<date-time> ro
- `read_at`* : string<date-time> ro
- `created_at`* : string<date-time> ro

**پاسخ‌ها**

- `200` → `NotificationDelivery`
  - `id`* : integer ro
  - `channel`* : ? ro
  - `status`* : ? ro
  - `subject`* : string ro
  - `body`* : string ro
  - `sent_at`* : string<date-time> ro
  - `read_at`* : string<date-time> ro
  - `created_at`* : string<date-time> ro

### `POST /api/v1/notifications/me/{delivery_id}/read/`

دسترسی: 🔒 نیازمند JWT

> Mark a user-owned delivery as read.

**پارامترها**

- `delivery_id` (path، الزامی) : integer

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `id`* : integer ro
- `channel`* : ? ro
- `status`* : ? ro
- `subject`* : string ro
- `body`* : string ro
- `sent_at`* : string<date-time> ro
- `read_at`* : string<date-time> ro
- `created_at`* : string<date-time> ro

**پاسخ‌ها**

- `200` → `NotificationDelivery`
  - `id`* : integer ro
  - `channel`* : ? ro
  - `status`* : ? ro
  - `subject`* : string ro
  - `body`* : string ro
  - `sent_at`* : string<date-time> ro
  - `read_at`* : string<date-time> ro
  - `created_at`* : string<date-time> ro

---

## جهاد تبیین — `/api/v1/tabyin/`

جمعاً 5 عملیات عمومی/کاربری.

### `GET /api/v1/tabyin/contents/`

**لیست محتواهای جهاد تبیین**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> لیست محتواهای عمومی — پاسخ paginated و قابل فیلتر.
>
> **فیلترهای موجود:**
> - `media_type`: image / video / audio
> - `author`: جستجو در نام نویسنده
> - `search`: جستجو در عنوان و توضیحات
>
> این endpoint با cache سطح selector بهینه شده است (TTL=۶۰ ثانیه، invalidation خودکار پس از sync یا تغییرات ادمین).

**پاسخ‌ها**

- `200` → `PublicTabyinContentListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<PublicTabyinContentList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `GET /api/v1/tabyin/contents/{external_id}/`

**جزئیات محتوای تبیین**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> جزئیات یک محتوا با external_id.
>
> این endpoint با cache سطح selector بهینه شده است (TTL=۵ دقیقه، invalidation خودکار پس از sync یا تغییرات ادمین).

**پارامترها**

- `external_id` (path، الزامی) : string

**پاسخ‌ها**

- `200` → `PublicTabyinContentDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — جزئیات یک محتوا — نمایش عمومی.  اطلاعات بیشتر نسبت به لیست.
    - `external_id`* : string — برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
    - `title` : string
    - `description` : string
    - `author_username` : string — مقدار username از محتوانگار.
    - `origin` : ?
    - `source_entity_id` : integer<int64>
    - `source_created_at` : string<date-time>
    - `source_updated_at` : string<date-time>
    - `source_url` : string<uri>
    - `primary_media_type`* : string ro
    - `attachments`* : array<TabyinAttachment> ro
- `404` → `PublicTabyinContentDetailNotFoundResponse`

### `GET /api/v1/tabyin/me/submissions/`

**لیست محتواهای ارسالی من**  
دسترسی: 🔒 نیازمند JWT

> Authenticated users can submit content and list their own submissions.

**پاسخ‌ها**

- `200` → `UserTabyinSubmissionListResponse`
  - `data`* : object
    - `count`* : integer
    - `next` : string<uri>
    - `previous` : string<uri>
    - `results`* : array<UserTabyinSubmissionList>
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string

### `POST /api/v1/tabyin/me/submissions/`

**ارسال محتوای جدید برای بررسی ادمین**  
دسترسی: 🔒 نیازمند JWT

> Authenticated users can submit content and list their own submissions.

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `title`* : string
- `description`* : string
- `attachments` : array<TabyinSubmissionAttachmentInput>

**پاسخ‌ها**

- `201` → `UserTabyinSubmissionCreatedResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Detail serializer for a user's own submitted content.
    - `id`* : integer ro
    - `external_id`* : string — برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
    - `title` : string
    - `description` : string
    - `submission_status` : ?
    - `admin_note` : string
    - `attachments`* : array<TabyinAttachment> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
    - `reviewed_at` : string<date-time>
- `400` → `UserTabyinSubmissionCreateBadRequest`

### `GET /api/v1/tabyin/me/submissions/{content_id}/`

**جزئیات محتوای ارسالی من**  
دسترسی: 🔒 نیازمند JWT

> Authenticated users can inspect one of their own submissions.

**پارامترها**

- `content_id` (path، الزامی) : integer

**پاسخ‌ها**

- `200` → `UserTabyinSubmissionDetailResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Detail serializer for a user's own submitted content.
    - `id`* : integer ro
    - `external_id`* : string — برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
    - `title` : string
    - `description` : string
    - `submission_status` : ?
    - `admin_note` : string
    - `attachments`* : array<TabyinAttachment> ro
    - `created_at`* : string<date-time> ro
    - `updated_at`* : string<date-time> ro
    - `reviewed_at` : string<date-time>
- `404` → `UserTabyinSubmissionNotFound`

---

## سلامت سیستم — `/api/v1/health/`

جمعاً 3 عملیات عمومی/کاربری.

### `GET /api/v1/health/`

**Liveness check**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> بررسی سریع زنده بودن process بدون چک dependency خارجی.
>
> برای Kubernetes/Docker liveness probe و load balancerهای ساده مناسب است.

**پاسخ‌ها**

- `200` → `SimpleHealth`
  - `status`* : ? — وضعیت کلی سرویس  * `ok` - ok * `error` - error * `degraded` - degraded
  - `timestamp`* : string<date-time> — زمان انجام چک

### `GET /api/v1/health/detailed/`

**Detailed health check**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> بررسی جامع وضعیت کامپوننت‌های سیستم.
>
> شامل readiness checks و diagnosticهای تکمیلی مثل Tabyin sync.
> خروجی secret-safe است و credential/traceback خام نشان نمی‌دهد.

**پاسخ‌ها**

- `200` → `DetailedHealth`
  - `status`* : enum(ok, error, degraded) — * `ok` - ok * `error` - error * `degraded` - degraded
  - `timestamp`* : string<date-time>
  - `checks`* : object — چک‌های detailed شامل readiness و diagnosticهای non-critical.
    - `database`* : object — نتیجه چک یک کامپوننت operational.
    - `cache`* : object — نتیجه چک یک کامپوننت operational.
    - `celery_broker`* : object — نتیجه چک یک کامپوننت operational.
    - `migration_state`* : object — نتیجه چک یک کامپوننت operational.
    - `media_storage`* : object — نتیجه چک یک کامپوننت operational.
    - `audit_chain_quick`* : object — نتیجه چک یک کامپوننت operational.
    - `performance_contracts`* : ?
    - `tabyin_sync`* : object — نتیجه چک وضعیت sync تبیین.
  - `system`* : object — اطلاعات سیستمی پروژه.
    - `project_name`* : string — نام پروژه
    - `project_version`* : string — نسخه پروژه
    - `django_version`* : string — نسخه Django
    - `python_version`* : string — نسخه Python
    - `debug`* : boolean — آیا حالت debug فعال است؟
    - `environment`* : string — محیط اجرا
    - `uptime_seconds`* : integer — چند ثانیه از start سرور گذشته
- `503` → `DetailedHealth`

### `GET /api/v1/health/ready/`

**Readiness check**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> بررسی dependencyهای critical برای سرو کردن traffic:
> Database، Cache و Celery broker.
>
> - `200 status=ok`: آماده سرویس‌دهی
> - `200 status=degraded`: آماده ولی کند/غیربهینه
> - `503 status=error`: آماده سرویس‌دهی نیست

**پاسخ‌ها**

- `200` → `ReadinessHealth`
  - `status`* : enum(ok, error, degraded) — * `ok` - ok * `error` - error * `degraded` - degraded
  - `timestamp`* : string<date-time>
  - `checks`* : object — چک‌های critical readiness برای سرو کردن traffic.
    - `database`* : object — نتیجه چک یک کامپوننت operational.
    - `cache`* : object — نتیجه چک یک کامپوننت operational.
    - `celery_broker`* : object — نتیجه چک یک کامپوننت operational.
- `503` → `ReadinessHealth`

---

## گزارشات مردمی — `/api/v1/public-reports/`

جمعاً 2 عملیات عمومی/کاربری.

### `POST /api/v1/public-reports/reports/`

**ثبت گزارش مردمی**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> ثبت گزارش جدید توسط کاربر عمومی همراه با پیوست‌های اختیاری.
>
> **محدودیت‌ها:**
> - حداکثر ۵ فایل پیوست
> - فقط jpg/jpeg/png/webp، حداکثر ۵ مگابایت برای هر فایل
> - ۵ گزارش در دقیقه برای کاربران مهمان
> - ۲۰ گزارش در دقیقه برای کاربران لاگین کرده

**بدنه‌ی درخواست** — `application/json` , `application/x-www-form-urlencoded` , `multipart/form-data`

- `full_name`* : string
- `phone_number` : string
- `subject_id`* : integer
- `description`* : string
- `attachments` : array<string>

**پاسخ‌ها**

- `201` → `ReportPublicCreatedSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : object — Public response serializer for newly-created reports without internal metadata.
    - `id`* : integer ro
    - `full_name`* : string
    - `phone_number` : string
    - `subject`* : ? ro
    - `description`* : string
    - `status` : ?
    - `attachments`* : array<ReportAttachment> ro
    - `created_at`* : string<date-time> ro
- `400` → `PublicReportsGenericErrorResponse`
- `429` → `PublicReportsGenericErrorResponse`

### `GET /api/v1/public-reports/subjects/`

**لیست موضوعات گزارش**  
دسترسی: 🌐 عمومی (JWT اختیاری)

> دریافت لیست موضوعات فعال برای انتخاب در فرم ثبت گزارش.
>
> این endpoint بدون pagination است و فقط موضوعات فعال (با `is_active=True`) را برمی‌گرداند.

**پاسخ‌ها**

- `200` → `ReportSubjectPublicListSuccessResponse`
  - `success` : boolean
  - `status_code` : integer
  - `message`* : string
  - `data`* : array<ReportSubjectPublic>

---

## لاگ فعالیت — `/api/v1/activity/`

جمعاً 1 عملیات عمومی/کاربری.

### `GET /api/v1/activity/me/`

دسترسی: 🔒 نیازمند JWT

> Return paginated current-user activity events.

**پاسخ‌ها**

- `200` → `UserActivity`
  - `id`* : integer ro
  - `event_type`* : string ro
  - `app_label`* : string ro
  - `verb`* : ? ro
  - `title`* : string ro
  - `summary`* : string ro
  - `aggregate_type`* : string ro
  - `aggregate_id`* : string ro
  - `actor_id`* : integer ro
  - `actor_display`* : string ro — Return safe actor display name.
  - `metadata`* : ? ro
  - `created_at`* : string<date-time> ro

---

## metrics — `/api/v1/metrics/`

جمعاً 1 عملیات عمومی/کاربری.

### `GET /api/v1/metrics/`

دسترسی: 🌐 عمومی (JWT اختیاری)

> Return Prometheus text exposition format.

**پاسخ‌ها**

- `200` — No response body
- `404` — No response body

---

# ۲) اندپوینت‌های مدیریتی (ادمین)

برای داشبورد مدیریتی. در فرانت عمومی مصرف نمی‌شوند ولی برای شناخت مدل داده مفیدند.

## جایزه‌ای برای عدالت (R4J) — 52 عملیات مدیریتی

- `GET /api/v1/r4j/admin/bounties/` — لیست جوایز — ادمین
- `GET /api/v1/r4j/admin/bounties/{bounty_id}/` — جزئیات جایزه — ادمین
- `POST /api/v1/r4j/admin/bounties/{bounty_id}/cancel/approve/` — تأیید درخواست لغو جایزه — ادمین
- `POST /api/v1/r4j/admin/bounties/{bounty_id}/cancel/reject/` — رد درخواست لغو جایزه — ادمین
- `GET /api/v1/r4j/admin/cases/` — لیست پرونده‌های عملیاتی R4J
- `GET /api/v1/r4j/admin/cases/{case_number}/` — Admin endpoint for case detail.
- `POST /api/v1/r4j/admin/cases/{case_number}/assign/` — Admin endpoint for assigning a case.
- `POST /api/v1/r4j/admin/cases/{case_number}/close/` — Admin endpoint for closing a case.
- `POST /api/v1/r4j/admin/cases/{case_number}/escalate/` — Admin endpoint for escalating a case.
- `POST /api/v1/r4j/admin/cases/{case_number}/priority/` — Admin endpoint for changing case priority.
- `POST /api/v1/r4j/admin/cases/{case_number}/reject/` — Admin endpoint for rejecting a case.
- `POST /api/v1/r4j/admin/cases/{case_number}/reopen/` — Admin endpoint for reopening a terminal case.
- `POST /api/v1/r4j/admin/cases/{case_number}/request-evidence/` — Admin endpoint for requesting more evidence.
- `POST /api/v1/r4j/admin/cases/{case_number}/resolve/` — Admin endpoint for resolving a case.
- `GET /api/v1/r4j/admin/cases/{case_number}/timeline/` — Admin endpoint for immutable case timeline.
- `POST /api/v1/r4j/admin/cases/{case_number}/triage/` — Admin endpoint for case triage.
- `GET /api/v1/r4j/admin/criminals/` — لیست مجرمین — ادمین
- `POST /api/v1/r4j/admin/criminals/` — ساخت پروفایل مجرم جدید — ادمین
- `GET /api/v1/r4j/admin/criminals/{criminal_id}/` — جزئیات مجرم — ادمین
- `PATCH /api/v1/r4j/admin/criminals/{criminal_id}/` — ویرایش مجرم — ادمین
- `DELETE /api/v1/r4j/admin/criminals/{criminal_id}/` — حذف نرم مجرم — ادمین
- `GET /api/v1/r4j/admin/criminals/{criminal_id}/aliases/` — لیست اسامی مستعار
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/aliases/` — افزودن نام مستعار
- `DELETE /api/v1/r4j/admin/criminals/{criminal_id}/aliases/{alias_id}/` — حذف نام مستعار
- `GET /api/v1/r4j/admin/criminals/{criminal_id}/attachments/` — لیست اسناد
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/attachments/` — آپلود سند
- `DELETE /api/v1/r4j/admin/criminals/{criminal_id}/attachments/{attachment_id}/` — حذف سند
- `GET /api/v1/r4j/admin/criminals/{criminal_id}/phones/` — لیست شماره‌های تماس
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/phones/` — افزودن شماره تماس
- `PATCH /api/v1/r4j/admin/criminals/{criminal_id}/phones/{phone_id}/` — ویرایش شماره تماس
- `DELETE /api/v1/r4j/admin/criminals/{criminal_id}/phones/{phone_id}/` — حذف شماره تماس
- `GET /api/v1/r4j/admin/criminals/{criminal_id}/photos/` — لیست عکس‌ها
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/photos/` — آپلود عکس
- `DELETE /api/v1/r4j/admin/criminals/{criminal_id}/photos/{photo_id}/` — حذف عکس
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/photos/{photo_id}/set-primary/` — تنظیم عکس به‌عنوان اصلی
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/publish/` — انتشار مجرم — ادمین
- `GET /api/v1/r4j/admin/criminals/{criminal_id}/socials/` — لیست شبکه‌های اجتماعی
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/socials/` — افزودن شبکه اجتماعی
- `PATCH /api/v1/r4j/admin/criminals/{criminal_id}/socials/{social_id}/` — ویرایش شبکه اجتماعی
- `DELETE /api/v1/r4j/admin/criminals/{criminal_id}/socials/{social_id}/` — حذف شبکه اجتماعی
- `POST /api/v1/r4j/admin/criminals/{criminal_id}/unpublish/` — خروج از انتشار مجرم — ادمین
- `GET /api/v1/r4j/admin/criminals/{criminal_id}/visibility/` — لیست تنظیمات نمایش فیلدها
- `PATCH /api/v1/r4j/admin/criminals/{criminal_id}/visibility/` — تنظیم نمایش یک فیلد
- `GET /api/v1/r4j/admin/evidence-custody/` — لیست زنجیره نگهداری شواهد
- `POST /api/v1/r4j/admin/evidence-custody/{event_id}/review/` — Admin endpoint to append a custody review/transfer/reject event.
- `GET /api/v1/r4j/admin/operations/overview/` — Admin operational overview for R4J cases.
- `GET /api/v1/r4j/admin/reports/` — لیست گزارشات — ادمین
- `GET /api/v1/r4j/admin/reports/{report_id}/` — جزئیات گزارش — ادمین
- `POST /api/v1/r4j/admin/reports/{report_id}/cancel/approve/` — تأیید درخواست لغو گزارش — ادمین
- `POST /api/v1/r4j/admin/reports/{report_id}/cancel/reject/` — رد درخواست لغو گزارش — ادمین
- `POST /api/v1/r4j/admin/reports/{report_id}/create-case/` — Admin endpoint to create an operational case from a report.
- `POST /api/v1/r4j/admin/reports/{report_id}/review/` — بررسی گزارش — ادمین

## میز پشتیبانی (تیکتینگ) — 51 عملیات مدیریتی

- `GET /api/v1/support/admin/analytics/` — Return support desk analytics summary.
- `GET /api/v1/support/admin/business-calendars/` — Return business calendars.
- `POST /api/v1/support/admin/business-calendars/` — Create business calendar.
- `PATCH /api/v1/support/admin/business-calendars/{calendar_id}/` — Update business calendar.
- `GET /api/v1/support/admin/canned-responses/` — Return canned responses.
- `POST /api/v1/support/admin/canned-responses/` — Create canned response.
- `PATCH /api/v1/support/admin/canned-responses/{canned_response_id}/` — Update canned response.
- `POST /api/v1/support/admin/canned-responses/{canned_response_id}/use/` — Mark canned response as used.
- `GET /api/v1/support/admin/categories/` — Return all categories for admin tree management.
- `POST /api/v1/support/admin/categories/` — Create support category.
- `PATCH /api/v1/support/admin/categories/{category_id}/` — Update category tree node.
- `DELETE /api/v1/support/admin/categories/{category_id}/` — Deactivate category safely.
- `GET /api/v1/support/admin/departments/` — Return all departments for admin taxonomy management.
- `POST /api/v1/support/admin/departments/` — Create support department.
- `GET /api/v1/support/admin/departments/{department_id}/` — Return one department.
- `PATCH /api/v1/support/admin/departments/{department_id}/` — Update department.
- `DELETE /api/v1/support/admin/departments/{department_id}/` — Deactivate department safely.
- `GET /api/v1/support/admin/duplicates/` — Return duplicate candidates.
- `POST /api/v1/support/admin/duplicates/{duplicate_id}/review/` — Review duplicate candidate.
- `GET /api/v1/support/admin/export/csat/` — Export CSAT data as an RTL Excel workbook.
- `GET /api/v1/support/admin/export/messages/` — Export timeline messages as an RTL Excel workbook.
- `GET /api/v1/support/admin/export/sla/` — Export SLA ticket data as an RTL Excel workbook.
- `GET /api/v1/support/admin/export/tickets/` — Export filtered ticket queue as an RTL Excel workbook.
- `GET /api/v1/support/admin/holidays/` — Return support holidays.
- `POST /api/v1/support/admin/holidays/` — Create support holiday.
- `PATCH /api/v1/support/admin/holidays/{holiday_id}/` — Update support holiday.
- `GET /api/v1/support/admin/knowledge/articles/` — Return all knowledge articles for admin management.
- `POST /api/v1/support/admin/knowledge/articles/` — Create a knowledge base article.
- `GET /api/v1/support/admin/knowledge/articles/{article_id}/` — Return article detail for admin.
- `PATCH /api/v1/support/admin/knowledge/articles/{article_id}/` — Update article content/metadata.
- `POST /api/v1/support/admin/knowledge/articles/{article_id}/archive/` — Archive one knowledge article.
- `POST /api/v1/support/admin/knowledge/articles/{article_id}/publish/` — Publish one knowledge article.
- `POST /api/v1/support/admin/knowledge/articles/{article_id}/use/` — Record article usage for analytics and audit.
- `GET /api/v1/support/admin/sla-policies/` — Return SLA policies.
- `POST /api/v1/support/admin/sla-policies/` — Create SLA policy.
- `PATCH /api/v1/support/admin/sla-policies/{policy_id}/` — Update SLA policy.
- `GET /api/v1/support/admin/ticket-types/` — Return ticket types.
- `POST /api/v1/support/admin/ticket-types/` — Create ticket type.
- `PATCH /api/v1/support/admin/ticket-types/{ticket_type_id}/` — Update ticket type.
- `GET /api/v1/support/admin/tickets/` — Return filtered admin ticket queue.
- `GET /api/v1/support/admin/tickets/{ticket_number}/` — Return ticket with internal timeline.
- `POST /api/v1/support/admin/tickets/{ticket_number}/assign/` — Assign ticket to admin/department.
- `GET /api/v1/support/admin/tickets/{ticket_number}/assignment-recommendation/` — Return transparent least-loaded assignment recommendation.
- `POST /api/v1/support/admin/tickets/{ticket_number}/auto-assign/` — Auto-assign ticket to the least-loaded support admin.
- `POST /api/v1/support/admin/tickets/{ticket_number}/close/` — Close ticket by admin.
- `POST /api/v1/support/admin/tickets/{ticket_number}/escalate/` — Escalate ticket.
- `POST /api/v1/support/admin/tickets/{ticket_number}/internal-note/` — Add internal note.
- `POST /api/v1/support/admin/tickets/{ticket_number}/reply/` — Add admin public reply.
- `GET /api/v1/support/admin/tickets/{ticket_number}/smart-replies/` — Generate smart reply suggestions from KB/canned responses/public timeline.
- `POST /api/v1/support/admin/tickets/{ticket_number}/smart-replies/use/` — Send reviewed smart reply body as an admin reply and audit source metadata.
- `POST /api/v1/support/admin/tickets/{ticket_number}/status/` — Change ticket status.

## مددکار (کمپین‌های حمایتی) — 45 عملیات مدیریتی

- `GET /api/v1/madadkar/admin/adjustments/` — لیست اصلاحات مالی — ادمین
- `POST /api/v1/madadkar/admin/adjustments/` — ثبت اصلاح مالی — ادمین
- `POST /api/v1/madadkar/admin/adjustments/{adjustment_id}/{action}/` — عملیات اصلاح مالی — ادمین
- `GET /api/v1/madadkar/admin/campaigns/` — لیست حرکت‌ها — ادمین
- `POST /api/v1/madadkar/admin/campaigns/` — ساخت حرکت جدید — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/` — جزئیات حرکت — ادمین
- `PATCH /api/v1/madadkar/admin/campaigns/{campaign_id}/` — ویرایش حرکت — ادمین
- `DELETE /api/v1/madadkar/admin/campaigns/{campaign_id}/` — حذف نرم حرکت — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/analytics/` — آمار تجمیعی حرکت — ادمین
- `POST /api/v1/madadkar/admin/campaigns/{campaign_id}/close/` — بستن دستی حرکت — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/disbursable/` — مانده قابل تخصیص حرکت — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/export/` — خروجی Excel از پرداخت‌های حرکت — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/financial-control/` — کنترل مالی حرکت — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/images/` — لیست تصاویر گالری حرکت
- `POST /api/v1/madadkar/admin/campaigns/{campaign_id}/images/` — افزودن تصویر به گالری حرکت
- `DELETE /api/v1/madadkar/admin/campaigns/{campaign_id}/images/{image_id}/` — حذف تصویر از گالری حرکت
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/intelligence/` — هوشمندی مالی و عملیاتی حرکت — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/leaderboard/` — رتبه‌بندی بزرگ‌ترین مشارکت‌کنندگان — ادمین
- `GET /api/v1/madadkar/admin/campaigns/{campaign_id}/participants/` — لیست مشارکت‌کنندگان حرکت — ادمین
- `POST /api/v1/madadkar/admin/campaigns/{campaign_id}/publish/` — انتشار حرکت — ادمین
- `GET /api/v1/madadkar/admin/disbursements/` — لیست تخصیص‌های مالی مددکار — ادمین
- `POST /api/v1/madadkar/admin/disbursements/` — درخواست تخصیص مالی از حرکت — ادمین
- `GET /api/v1/madadkar/admin/disbursements/{disbursement_id}/` — جزئیات تخصیص مالی — ادمین
- `POST /api/v1/madadkar/admin/disbursements/{disbursement_id}/{action}/` — عملیات تخصیص مالی — ادمین
- `GET /api/v1/madadkar/admin/financial-controls/` — لیست snapshotهای کنترل مالی مددکار — ادمین
- `POST /api/v1/madadkar/admin/financial-controls/generate/` — تولید snapshot کنترل مالی مددکار — ادمین
- `GET /api/v1/madadkar/admin/financial-controls/latest/` — آخرین snapshot کنترل مالی مددکار — ادمین
- `GET /api/v1/madadkar/admin/intelligence/overview/` — نمای کلی هوشمندی مددکار — ادمین
- `GET /api/v1/madadkar/admin/payments/` — لیست تمام پرداخت‌ها — ادمین
- `POST /api/v1/madadkar/admin/receipts/{receipt_id}/resend/` — ثبت ارسال مجدد رسید — ادمین
- `GET /api/v1/madadkar/admin/reconciliation/batches/` — لیست batchهای تطبیق پرداخت — ادمین
- `GET /api/v1/madadkar/admin/reconciliation/batches/{batch_id}/` — جزئیات batch تطبیق پرداخت — ادمین
- `GET /api/v1/madadkar/admin/reconciliation/batches/{batch_id}/export/` — خروجی CSV اختلافات تطبیق — ادمین
- `GET /api/v1/madadkar/admin/reconciliation/batches/{batch_id}/items/` — لیست ردیف‌های batch تطبیق پرداخت — ادمین
- `POST /api/v1/madadkar/admin/reconciliation/import/` — Import گزارش تطبیق پرداخت — ادمین
- `GET /api/v1/madadkar/admin/refunds/` — لیست بازپرداخت‌ها — ادمین
- `POST /api/v1/madadkar/admin/refunds/` — ثبت درخواست بازپرداخت — ادمین
- `POST /api/v1/madadkar/admin/refunds/{refund_id}/{action}/` — تأیید بازپرداخت — ادمین
- `GET /api/v1/madadkar/admin/risk-signals/` — لیست سیگنال‌های ریسک مددکار — ادمین
- `POST /api/v1/madadkar/admin/risk-signals/{signal_id}/review/` — بررسی سیگنال ریسک مددکار — ادمین
- `GET /api/v1/madadkar/admin/sponsors/` — لیست مددکاران — ادمین
- `POST /api/v1/madadkar/admin/sponsors/` — ساخت مددکار جدید — ادمین
- `GET /api/v1/madadkar/admin/sponsors/{sponsor_id}/` — جزئیات مددکار — ادمین
- `PATCH /api/v1/madadkar/admin/sponsors/{sponsor_id}/` — ویرایش مددکار — ادمین
- `DELETE /api/v1/madadkar/admin/sponsors/{sponsor_id}/` — حذف نرم مددکار — ادمین

## آموزش (LMS) — 35 عملیات مدیریتی

- `GET /api/v1/lms/admin/activity-statements/` — Return paginated learning activity statements for analytics/export readiness.
- `PATCH /api/v1/lms/admin/answers/{answer_id}/moderate/` — Moderate one answer.
- `GET /api/v1/lms/admin/categories/` — Return all categories for admin.
- `POST /api/v1/lms/admin/categories/` — Create a category.
- `GET /api/v1/lms/admin/categories/{category_id}/` — Return one category for admin.
- `PATCH /api/v1/lms/admin/categories/{category_id}/` — Update category.
- `DELETE /api/v1/lms/admin/categories/{category_id}/` — Soft-delete category.
- `POST /api/v1/lms/admin/certificates/{certificate_id}/revoke/` — Revoke one certificate and derived skill.
- `GET /api/v1/lms/admin/courses/` — Return admin course list.
- `POST /api/v1/lms/admin/courses/` — Create draft course.
- `GET /api/v1/lms/admin/courses/{course_id}/` — Return one course for admin.
- `PATCH /api/v1/lms/admin/courses/{course_id}/` — Update course.
- `DELETE /api/v1/lms/admin/courses/{course_id}/` — Soft-delete course.
- `GET /api/v1/lms/admin/courses/{course_id}/analytics/` — Return aggregate analytics for a course.
- `POST /api/v1/lms/admin/courses/{course_id}/archive/` — Archive course.
- `GET /api/v1/lms/admin/courses/{course_id}/export/` — Export course enrollment report as Excel.
- `GET /api/v1/lms/admin/courses/{course_id}/leaderboard/` — Return top learners ranked by score/progress/badge.
- `GET /api/v1/lms/admin/courses/{course_id}/lessons/` — Return all lessons for admin.
- `POST /api/v1/lms/admin/courses/{course_id}/lessons/` — Create lesson.
- `POST /api/v1/lms/admin/courses/{course_id}/publish/` — Publish course.
- `GET /api/v1/lms/admin/courses/{course_id}/quiz/` — Return quiz config for a course.
- `POST /api/v1/lms/admin/courses/{course_id}/quiz/` — Create or update a draft quiz for a course.
- `POST /api/v1/lms/admin/courses/{course_id}/quiz/publish/` — Publish quiz.
- `POST /api/v1/lms/admin/courses/{course_id}/quiz/questions/` — Create quiz question.
- `POST /api/v1/lms/admin/courses/{course_id}/quiz/unlock/` — Grant extra quiz attempts to a user.
- `GET /api/v1/lms/admin/courses/{course_id}/report/` — Return course report rows and summary.
- `GET /api/v1/lms/admin/discussion-reports/` — Return paginated discussion reports.
- `PATCH /api/v1/lms/admin/discussion-reports/{report_id}/review/` — Review one discussion report.
- `PATCH /api/v1/lms/admin/lessons/{lesson_id}/` — Update lesson.
- `DELETE /api/v1/lms/admin/lessons/{lesson_id}/` — Soft-delete lesson.
- `POST /api/v1/lms/admin/lessons/{lesson_id}/video-processing/` — Queue video processing for an uploaded lesson video.
- `GET /api/v1/lms/admin/lessons/{lesson_id}/video-processing/status/` — Return latest video processing job for a lesson.
- `PATCH /api/v1/lms/admin/questions/{question_id}/moderate/` — Moderate one question.
- `POST /api/v1/lms/admin/quiz/questions/{question_id}/options/` — Create quiz option.
- `GET /api/v1/lms/admin/recommendations/overview/` — Return aggregate recommendation overview for admins.

## دیوار مهربانی — 21 عملیات مدیریتی

- `GET /api/v1/kindness-wall/admin/analytics/` — Return analytics summary.
- `GET /api/v1/kindness-wall/admin/categories/` — Return all active/inactive categories for tree management.
- `POST /api/v1/kindness-wall/admin/categories/` — Create a tree category via service layer.
- `GET /api/v1/kindness-wall/admin/categories/{category_id}/` — Return one category for admin editing.
- `PATCH /api/v1/kindness-wall/admin/categories/{category_id}/` — Update category metadata/tree location.
- `DELETE /api/v1/kindness-wall/admin/categories/{category_id}/` — Soft-delete/deactivate category with hierarchy safety checks.
- `GET /api/v1/kindness-wall/admin/contact-reveals/` — Return paginated contact reveal records.
- `GET /api/v1/kindness-wall/admin/duplicates/` — Return duplicate candidates generated by the matching engine.
- `POST /api/v1/kindness-wall/admin/duplicates/{duplicate_id}/review/` — Confirm or dismiss a likely duplicate candidate.
- `GET /api/v1/kindness-wall/admin/listings/` — Return admin listing list.
- `GET /api/v1/kindness-wall/admin/listings/export/` — Export filtered listings as an RTL Excel workbook.
- `GET /api/v1/kindness-wall/admin/listings/{listing_id}/` — Return one listing for admin.
- `POST /api/v1/kindness-wall/admin/listings/{listing_id}/approve/` — Approve listing.
- `POST /api/v1/kindness-wall/admin/listings/{listing_id}/reject/` — Reject listing.
- `POST /api/v1/kindness-wall/admin/listings/{listing_id}/restore/` — Restore listing.
- `POST /api/v1/kindness-wall/admin/listings/{listing_id}/suspend/` — Suspend listing.
- `GET /api/v1/kindness-wall/admin/matches/` — Return all matches with professional moderation filters.
- `GET /api/v1/kindness-wall/admin/matches/{match_id}/` — Return one match with source/target listing context.
- `GET /api/v1/kindness-wall/admin/reports/` — Return listing reports.
- `GET /api/v1/kindness-wall/admin/reports/export/` — Export filtered reports as an RTL Excel workbook.
- `POST /api/v1/kindness-wall/admin/reports/{report_id}/review/` — Review report and optionally suspend listing.

## احراز هویت و حساب کاربری — 9 عملیات مدیریتی

- `GET /api/v1/auth/admin/risk-signals/` — لیست سیگنال‌های ریسک احراز هویت
- `POST /api/v1/auth/admin/risk-signals/{signal_id}/review/` — بررسی سیگنال ریسک احراز هویت
- `GET /api/v1/auth/admin/users/` — لیست کاربران
- `GET /api/v1/auth/admin/users/{user_id}/` — جزئیات کاربر
- `PATCH /api/v1/auth/admin/users/{user_id}/` — ویرایش کاربر
- `DELETE /api/v1/auth/admin/users/{user_id}/` — غیرفعال کردن کاربر
- `POST /api/v1/auth/admin/users/{user_id}/role/` — تغییر نقش کاربر
- `GET /api/v1/auth/admin/users/{user_id}/sessions/` — لیست نشست‌های کاربر — ادمین
- `POST /api/v1/auth/admin/users/{user_id}/sessions/revoke-all/` — لغو همه نشست‌های کاربر — ادمین

## جهاد تبیین — 9 عملیات مدیریتی

- `GET /api/v1/tabyin/admin/contents/` — لیست محتواها — ادمین
- `GET /api/v1/tabyin/admin/contents/{external_id}/` — جزئیات محتوا — ادمین
- `PATCH /api/v1/tabyin/admin/contents/{external_id}/toggle/` — فعال/غیرفعال کردن محتوا — ادمین
- `GET /api/v1/tabyin/admin/submissions/` — صف بررسی محتواهای ارسالی کاربران
- `GET /api/v1/tabyin/admin/submissions/{content_id}/` — جزئیات محتوای ارسالی کاربر
- `POST /api/v1/tabyin/admin/submissions/{content_id}/approve/` — تأیید محتوای ارسالی کاربر
- `POST /api/v1/tabyin/admin/submissions/{content_id}/reject/` — رد محتوای ارسالی کاربر
- `POST /api/v1/tabyin/admin/sync/` — اجرای دستی همگام‌سازی (غیرهمزمان) — ادمین
- `GET /api/v1/tabyin/admin/sync/status/{task_id}/` — پیگیری وضعیت task همگام‌سازی — ادمین

## گزارشات مردمی — 8 عملیات مدیریتی

- `GET /api/v1/public-reports/admin/reports/` — لیست گزارشات
- `GET /api/v1/public-reports/admin/reports/{report_id}/` — جزئیات یک گزارش
- `PATCH /api/v1/public-reports/admin/reports/{report_id}/status/` — تغییر وضعیت گزارش
- `GET /api/v1/public-reports/admin/subjects/` — لیست تمام موضوعات گزارش
- `POST /api/v1/public-reports/admin/subjects/` — ساخت موضوع گزارش جدید
- `GET /api/v1/public-reports/admin/subjects/{subject_id}/` — جزئیات یک موضوع
- `PATCH /api/v1/public-reports/admin/subjects/{subject_id}/` — ویرایش موضوع
- `DELETE /api/v1/public-reports/admin/subjects/{subject_id}/` — حذف نرم موضوع

## audit-logs — 3 عملیات مدیریتی

- `GET /api/v1/audit-logs/admin/logs/` — لیست لاگ‌های فعالیت
- `GET /api/v1/audit-logs/admin/logs/export/` — خروجی بسته forensic لاگ‌های فعالیت
- `GET /api/v1/audit-logs/admin/logs/{audit_log_id}/` — جزئیات لاگ فعالیت

## اعلان‌ها — 3 عملیات مدیریتی

- `GET /api/v1/notifications/admin/deliveries/` — Return notification deliveries.
- `GET /api/v1/notifications/admin/events/` — Return notification events.
- `GET /api/v1/notifications/admin/templates/` — Return templates.

## لاگ فعالیت — 1 عملیات مدیریتی

- `GET /api/v1/activity/admin/` — Return paginated admin activity timeline.

## admin — 1 عملیات مدیریتی

- `GET /api/v1/admin/command-center/` — Return cross-app operational summary.
