/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ⚠️  این فایل به‌صورت خودکار تولید شده است — دستی ویرایشش نکن.
 *
 *  بازتولید:   npm run api:types
 *  منبع:       /home/user/work/back/schema.yaml
 *  تولید در:   2026-08-23T18:00:40.855Z
 *
 *  برای مصرف راحت و تایپ‌شده‌ی این تعاریف از `src/lib/typed-api.ts` استفاده
 *  کن، نه از `paths`/`components` به‌طور مستقیم.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* eslint-disable */
/* prettier-ignore-start */

export interface paths {
    "/api/v1/activity/admin/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated admin activity timeline. */
        get: operations["activity_admin_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/activity/me/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated current-user activity events. */
        get: operations["activity_me_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/command-center/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return cross-app operational summary. */
        get: operations["admin_command_center_summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/audit-logs/admin/logs/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست لاگ‌های فعالیت
         * @description دریافت لیست تمام لاگ‌های فعالیت سیستم با pagination و فیلتر.
         *
         *     **فیلترهای موجود:**
         *     - `action`: نوع عملیات (مثل LOGIN_SUCCESS, REPORT_CREATED)
         *     - `user_id`: شناسه کاربر
         *     - `resource_type`: نوع منبع (user, report, tabyin_content, ...)
         *     - `resource_id`: شناسه منبع
         *     - `request_id`: شناسه درخواست (X-Request-ID)
         *     - `ip_address`: آدرس IP
         *     - `method`: متد HTTP
         *     - `path`: مسیر درخواست
         *     - `created_after` / `created_before`: بازه زمانی
         *     - `search`: جستجو در action, resource_type, resource_id
         *
         *     نیازمند احراز هویت با نقش admin.
         */
        get: operations["audit_logs_admin_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/audit-logs/admin/logs/{audit_log_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات لاگ فعالیت
         * @description دریافت جزئیات کامل یک لاگ فعالیت شامل changes و extra_data.
         *
         *     نیازمند احراز هویت با نقش admin.
         */
        get: operations["audit_logs_admin_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/audit-logs/admin/logs/export/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * خروجی بسته forensic لاگ‌های فعالیت
         * @description تولید بسته ZIP شامل `manifest.json`, `audit_logs.jsonl`, `audit_logs.csv` و `audit_logs.xlsx`. قبل از export، زنجیره هش کامل audit trail بررسی می‌شود و خود عملیات export نیز با action `AUDIT_PACKAGE_EXPORTED` ثبت می‌گردد.
         */
        get: operations["audit_logs_admin_export_forensic_package"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/admin/risk-signals/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست سیگنال‌های ریسک احراز هویت
         * @description Admin list endpoint for authentication risk signals.
         */
        get: operations["auth_admin_risk_signals_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/admin/risk-signals/{signal_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * بررسی سیگنال ریسک احراز هویت
         * @description Admin endpoint to review/dismiss/escalate an authentication risk signal.
         */
        post: operations["auth_admin_risk_signal_review"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/admin/users/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست کاربران
         * @description لیست تمام کاربران سیستم با pagination و قابلیت فیلتر.
         *
         *     نیازمند احراز هویت با نقش admin.
         */
        get: operations["auth_admin_users_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/admin/users/{user_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات کاربر
         * @description دریافت اطلاعات کامل یک کاربر شامل پروفایل و وضعیت.
         */
        get: operations["auth_admin_user_retrieve"];
        put?: never;
        post?: never;
        /**
         * غیرفعال کردن کاربر
         * @description غیرفعال کردن (soft delete) یک کاربر توسط ادمین.
         */
        delete: operations["auth_admin_user_delete"];
        options?: never;
        head?: never;
        /**
         * ویرایش کاربر
         * @description ویرایش اطلاعات یک کاربر توسط ادمین.
         */
        patch: operations["auth_admin_user_update"];
        trace?: never;
    };
    "/api/v1/auth/admin/users/{user_id}/role/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تغییر نقش کاربر
         * @description تغییر نقش یک کاربر توسط ادمین.
         *
         *     **نقش‌های موجود:**
         *     - `user`: کاربر عادی
         *     - `admin`: مدیر سیستم
         */
        post: operations["auth_admin_user_change_role"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/admin/users/{user_id}/sessions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست نشست‌های کاربر — ادمین
         * @description Admin list endpoint for a user's tracked sessions.
         */
        get: operations["auth_admin_user_sessions_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/admin/users/{user_id}/sessions/revoke-all/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * لغو همه نشست‌های کاربر — ادمین
         * @description Admin endpoint to revoke all active sessions for one user.
         */
        post: operations["auth_admin_user_sessions_revoke_all"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/identifiers/add/request/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * درخواست اتصال شناسه ثانویه
         * @description ارسال کد تأیید برای اتصال ایمیل یا شماره موبایل جدید به حساب.
         *
         *     موارد پشتیبانی‌نشده: جایگزینی یک شناسه‌ی موجود در همان channel.
         */
        post: operations["auth_identifier_add_request"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/identifiers/add/verify/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید اتصال شناسه ثانویه
         * @description تأیید کد و اتصال نهایی ایمیل یا شماره موبایل به حساب.
         */
        post: operations["auth_identifier_add_verify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/identifiers/make-primary/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تغییر شناسه اصلی
         * @description تغییر شناسه اصلی حساب به یکی از شناسه‌های تأیید شده.
         */
        post: operations["auth_identifier_make_primary"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * [منسوخ] ورود کاربر با ایمیل
         * @deprecated
         * @description ورود با ایمیل و رمز عبور و دریافت توکن‌های JWT.
         *
         *     ---
         *     > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
         *     > لطفاً به نسخه جدید مهاجرت کنید.
         */
        post: operations["auth_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login/otp/request/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * درخواست کد ورود با شناسه
         * @description ارسال کد ورود به ایمیل یا شماره موبایل.
         *
         *     این endpoint enumeration-safe است.
         */
        post: operations["auth_login_otp_request"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login/otp/verify/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید کد ورود
         * @description تأیید کد ورود و دریافت JWT.
         */
        post: operations["auth_login_otp_verify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login/password/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * ورود با رمز عبور و شناسه
         * @description ورود با ایمیل یا شماره موبایل و رمز عبور.
         */
        post: operations["auth_login_password"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * خروج کاربر
         * @description خروج کاربر و invalidation refresh token.
         *
         *     پس از logout، refresh token در blacklist قرار می‌گیرد.
         */
        post: operations["auth_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * اطلاعات کاربر فعلی
         * @description دریافت اطلاعات پایه کاربر لاگین کرده.
         */
        get: operations["auth_me_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * ویرایش اطلاعات پایه کاربر
         * @description ویرایش اطلاعات پایه کاربر لاگین کرده مثل نام و نام خانوادگی.
         */
        patch: operations["auth_me_update"];
        trace?: never;
    };
    "/api/v1/auth/password/change/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تغییر رمز عبور
         * @description تغییر رمز عبور توسط کاربر لاگین کرده با تأیید رمز فعلی.
         */
        post: operations["auth_password_change"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/password/forgot/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * [منسوخ] درخواست بازیابی رمز عبور با ایمیل
         * @deprecated
         * @description ارسال کد بازیابی به ایمیل کاربر.
         *
         *     حتی اگر ایمیل وجود نداشته باشد، پاسخ موفقیت برگردانده می‌شود.
         *
         *     ---
         *     > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
         *     > لطفاً به نسخه جدید مهاجرت کنید.
         */
        post: operations["auth_password_forgot"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/password/forgot/confirm/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید بازیابی رمز با شناسه
         * @description تنظیم رمز عبور جدید با شناسه، کد یکبارمصرف و رمز جدید.
         */
        post: operations["auth_password_forgot_confirm_identifier"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/password/forgot/request/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * درخواست بازیابی رمز با شناسه
         * @description ارسال کد بازیابی رمز عبور به ایمیل یا شماره موبایل.
         *
         *     این endpoint enumeration-safe است.
         */
        post: operations["auth_password_forgot_request_identifier"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/password/reset/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * [منسوخ] تنظیم رمز جدید با کد بازیابی
         * @deprecated
         * @description تنظیم رمز عبور جدید با استفاده از کد ۵ رقمی دریافتی.
         *
         *     ---
         *     > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
         *     > لطفاً به نسخه جدید مهاجرت کنید.
         */
        post: operations["auth_password_reset"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/profile/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * مشاهده پروفایل کاربر
         * @description دریافت اطلاعات تکمیلی پروفایل کاربر لاگین کرده.
         */
        get: operations["auth_profile_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * ویرایش پروفایل کاربر
         * @description ویرایش اطلاعات تکمیلی پروفایل کاربر لاگین کرده.
         *
         *     تمام فیلدها optional هستند.
         */
        patch: operations["auth_profile_update"];
        trace?: never;
    };
    "/api/v1/auth/register/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * [منسوخ] ثبت‌نام کاربر جدید
         * @deprecated
         * @description ساخت حساب کاربری جدید با ایمیل و رمز عبور.
         *
         *     پس از ثبت‌نام موفق، یک کد تأیید ۵ رقمی به ایمیل ارسال می‌شود.
         *
         *     ---
         *     > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
         *     > لطفاً به نسخه جدید مهاجرت کنید.
         */
        post: operations["auth_register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/resend-verification/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * [منسوخ] ارسال مجدد کد تأیید ایمیل
         * @deprecated
         * @description اگر کد قبلی منقضی شد، با این endpoint می‌توان کد جدیدی درخواست کرد.
         *
         *     ---
         *     > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
         *     > لطفاً به نسخه جدید مهاجرت کنید.
         */
        post: operations["auth_resend_verification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/sessions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست نشست‌ها و دستگاه‌های من
         * @description List current user's tracked auth sessions/devices.
         */
        get: operations["auth_sessions_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/sessions/{session_id}/revoke/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * لغو یکی از نشست‌های من
         * @description Revoke one current-user auth session with IDOR protection.
         */
        post: operations["auth_sessions_revoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/signup/request/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * درخواست کد ثبت‌نام با شناسه
         * @description ارسال کد ثبت‌نام به ایمیل یا شماره موبایل.
         *
         *     در این مرحله هنوز هیچ حساب کاربری‌ای ساخته نمی‌شود.
         */
        post: operations["auth_signup_request"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/signup/verify/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید ثبت‌نام و ساخت حساب
         * @description تأیید کد، ساخت حساب و دریافت JWT.
         */
        post: operations["auth_signup_verify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/token/refresh/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * بروزرسانی توکن JWT
         * @description دریافت access token جدید با استفاده از refresh token.
         */
        post: operations["auth_token_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/verify-email/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * [منسوخ] تأیید ایمیل با کد
         * @deprecated
         * @description تأیید ایمیل کاربر با ارسال کد ۵ رقمی دریافتی.
         *
         *     ---
         *     > ⚠️ **این endpoint منسوخ شده است** و در نسخه‌های آینده حذف خواهد شد.
         *     > لطفاً به نسخه جدید مهاجرت کنید.
         */
        post: operations["auth_verify_email"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Liveness check
         * @description بررسی سریع زنده بودن process بدون چک dependency خارجی.
         *
         *     برای Kubernetes/Docker liveness probe و load balancerهای ساده مناسب است.
         */
        get: operations["health_liveness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health/detailed/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Detailed health check
         * @description بررسی جامع وضعیت کامپوننت‌های سیستم.
         *
         *     شامل readiness checks و diagnosticهای تکمیلی مثل Tabyin sync.
         *     خروجی secret-safe است و credential/traceback خام نشان نمی‌دهد.
         */
        get: operations["health_detailed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health/ready/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Readiness check
         * @description بررسی dependencyهای critical برای سرو کردن traffic:
         *     Database، Cache و Celery broker.
         *
         *     - `200 status=ok`: آماده سرویس‌دهی
         *     - `200 status=degraded`: آماده ولی کند/غیربهینه
         *     - `503 status=error`: آماده سرویس‌دهی نیست
         */
        get: operations["health_readiness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/analytics/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return analytics summary. */
        get: operations["kindness_wall_admin_analytics_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/categories/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return all active/inactive categories for tree management. */
        get: operations["kindness_admin_categories_list"];
        put?: never;
        /** @description Create a tree category via service layer. */
        post: operations["kindness_admin_categories_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/categories/{category_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one category for admin editing. */
        get: operations["kindness_wall_admin_categories_retrieve"];
        put?: never;
        post?: never;
        /** @description Soft-delete/deactivate category with hierarchy safety checks. */
        delete: operations["kindness_wall_admin_categories_destroy"];
        options?: never;
        head?: never;
        /** @description Update category metadata/tree location. */
        patch: operations["kindness_wall_admin_categories_partial_update"];
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/contact-reveals/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated contact reveal records. */
        get: operations["kindness_admin_contact_reveals_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/duplicates/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return duplicate candidates generated by the matching engine. */
        get: operations["kindness_admin_duplicates_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/duplicates/{duplicate_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Confirm or dismiss a likely duplicate candidate. */
        post: operations["kindness_admin_duplicates_review"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/listings/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return admin listing list. */
        get: operations["kindness_admin_listings_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/listings/{listing_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one listing for admin. */
        get: operations["kindness_admin_listings_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/listings/{listing_id}/approve/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Approve listing. */
        post: operations["kindness_wall_admin_listings_approve_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/listings/{listing_id}/reject/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Reject listing. */
        post: operations["kindness_wall_admin_listings_reject_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/listings/{listing_id}/restore/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Restore listing. */
        post: operations["kindness_wall_admin_listings_restore_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/listings/{listing_id}/suspend/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Suspend listing. */
        post: operations["kindness_wall_admin_listings_suspend_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/listings/export/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Export filtered listings as an RTL Excel workbook. */
        get: operations["kindness_admin_listings_export"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/matches/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return all matches with professional moderation filters. */
        get: operations["kindness_admin_matches_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/matches/{match_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one match with source/target listing context. */
        get: operations["kindness_admin_matches_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/reports/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return listing reports. */
        get: operations["kindness_wall_admin_reports_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/reports/{report_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Review report and optionally suspend listing. */
        post: operations["kindness_wall_admin_reports_review_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/admin/reports/export/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Export filtered reports as an RTL Excel workbook. */
        get: operations["kindness_admin_reports_export"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/categories/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return active categories. */
        get: operations["kindness_categories_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/listings/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return filtered published listings without phone numbers. */
        get: operations["kindness_listings_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/listings/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one published listing and increment view counter. */
        get: operations["kindness_listings_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/listings/{slug}/bookmark/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Bookmark listing. */
        post: operations["kindness_wall_listings_bookmark_create"];
        /** @description Remove bookmark. */
        delete: operations["kindness_wall_listings_bookmark_destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/listings/{slug}/matches/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return active matches for a public listing. */
        get: operations["kindness_listings_matches"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/listings/{slug}/report/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Create a report for a listing. */
        post: operations["kindness_listings_report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/listings/{slug}/reveal-contact/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Reveal phone and record contact reveal audit row. */
        post: operations["kindness_listings_reveal_contact"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/bookmarks/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return bookmarked published listings for current user. */
        get: operations["kindness_user_bookmarks_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/listings/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return listings owned by current user. */
        get: operations["kindness_user_listings_list"];
        put?: never;
        /** @description Create a draft listing for current user. */
        post: operations["kindness_user_listings_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/listings/{listing_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return own listing detail. */
        get: operations["kindness_wall_me_listings_retrieve"];
        put?: never;
        post?: never;
        /** @description Soft-delete own listing. */
        delete: operations["kindness_wall_me_listings_destroy"];
        options?: never;
        head?: never;
        /** @description Update own listing. */
        patch: operations["kindness_wall_me_listings_partial_update"];
        trace?: never;
    };
    "/api/v1/kindness-wall/me/listings/{listing_id}/close/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Close a listing by its owner. */
        post: operations["kindness_user_listings_close"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/listings/{listing_id}/renew/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Renew listing expiration. */
        post: operations["kindness_wall_me_listings_renew_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/listings/{listing_id}/submit/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Submit listing for review. */
        post: operations["kindness_wall_me_listings_submit_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/matches/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return active matches for user's listings. */
        get: operations["kindness_wall_me_matches_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/matches/{match_id}/contacted/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Mark a match as contacted. */
        post: operations["kindness_wall_me_matches_contacted_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/kindness-wall/me/matches/{match_id}/dismiss/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Dismiss a match owned by user's source listing. */
        post: operations["kindness_wall_me_matches_dismiss_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/activity-statements/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated learning activity statements for analytics/export readiness. */
        get: operations["lms_admin_learning_activity_statements_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/answers/{answer_id}/moderate/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Moderate one answer. */
        patch: operations["lms_admin_answers_moderate"];
        trace?: never;
    };
    "/api/v1/lms/admin/categories/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return all categories for admin. */
        get: operations["lms_admin_categories_list"];
        put?: never;
        /** @description Create a category. */
        post: operations["lms_admin_categories_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/categories/{category_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one category for admin. */
        get: operations["lms_admin_categories_retrieve"];
        put?: never;
        post?: never;
        /** @description Soft-delete category. */
        delete: operations["lms_admin_categories_delete"];
        options?: never;
        head?: never;
        /** @description Update category. */
        patch: operations["lms_admin_categories_update"];
        trace?: never;
    };
    "/api/v1/lms/admin/certificates/{certificate_id}/revoke/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Revoke one certificate and derived skill. */
        post: operations["lms_admin_certificates_revoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return admin course list. */
        get: operations["lms_admin_courses_list"];
        put?: never;
        /** @description Create draft course. */
        post: operations["lms_admin_courses_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one course for admin. */
        get: operations["lms_admin_courses_retrieve"];
        put?: never;
        post?: never;
        /** @description Soft-delete course. */
        delete: operations["lms_admin_courses_delete"];
        options?: never;
        head?: never;
        /** @description Update course. */
        patch: operations["lms_admin_courses_update"];
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/analytics/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return aggregate analytics for a course. */
        get: operations["lms_admin_courses_analytics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/archive/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Archive course. */
        post: operations["lms_admin_courses_archive"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/export/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Export course enrollment report as Excel. */
        get: operations["lms_admin_courses_export"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/leaderboard/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return top learners ranked by score/progress/badge. */
        get: operations["lms_admin_courses_leaderboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/lessons/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return all lessons for admin. */
        get: operations["lms_admin_lessons_list"];
        put?: never;
        /** @description Create lesson. */
        post: operations["lms_admin_lessons_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/publish/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Publish course. */
        post: operations["lms_admin_courses_publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/quiz/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return quiz config for a course. */
        get: operations["lms_admin_quiz_retrieve"];
        put?: never;
        /** @description Create or update a draft quiz for a course. */
        post: operations["lms_admin_quiz_create_or_update"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/quiz/publish/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Publish quiz. */
        post: operations["lms_admin_quiz_publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/quiz/questions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Create quiz question. */
        post: operations["lms_admin_quiz_questions_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/quiz/unlock/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Grant extra quiz attempts to a user. */
        post: operations["lms_admin_quiz_unlock"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/courses/{course_id}/report/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return course report rows and summary. */
        get: operations["lms_admin_courses_report"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/discussion-reports/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated discussion reports. */
        get: operations["lms_admin_discussion_reports_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/discussion-reports/{report_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Review one discussion report. */
        patch: operations["lms_admin_discussion_reports_review"];
        trace?: never;
    };
    "/api/v1/lms/admin/lessons/{lesson_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** @description Soft-delete lesson. */
        delete: operations["lms_admin_lessons_delete"];
        options?: never;
        head?: never;
        /** @description Update lesson. */
        patch: operations["lms_admin_lessons_update"];
        trace?: never;
    };
    "/api/v1/lms/admin/lessons/{lesson_id}/video-processing/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Queue video processing for an uploaded lesson video. */
        post: operations["lms_admin_lessons_video_processing_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/lessons/{lesson_id}/video-processing/status/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return latest video processing job for a lesson. */
        get: operations["lms_admin_lessons_video_processing_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/questions/{question_id}/moderate/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Moderate one question. */
        patch: operations["lms_admin_questions_moderate"];
        trace?: never;
    };
    "/api/v1/lms/admin/quiz/questions/{question_id}/options/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Create quiz option. */
        post: operations["lms_admin_quiz_options_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/admin/recommendations/overview/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return aggregate recommendation overview for admins. */
        get: operations["lms_admin_learning_recommendations_overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/answers/{answer_id}/report/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Report an answer. */
        post: operations["lms_answers_report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/categories/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return active categories. */
        get: operations["lms_public_categories_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/categories/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one public category. */
        get: operations["lms_public_categories_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/certificates/verify/{verification_slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Verify certificate validity publicly. */
        get: operations["lms_public_certificates_verify"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/courses/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated public course catalog. */
        get: operations["lms_public_courses_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/courses/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one published course. */
        get: operations["lms_public_courses_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/courses/{slug}/enroll/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Enroll current user in a course. */
        post: operations["lms_user_course_enroll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/courses/{slug}/lessons/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return public lessons for a course. */
        get: operations["lms_public_course_lessons_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/courses/{slug}/lessons/{lesson_slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one public lesson. */
        get: operations["lms_public_lessons_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/courses/{slug}/quiz/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return quiz metadata without correct answers. */
        get: operations["lms_user_course_quiz_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/courses/{slug}/quiz/start/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Start a snapshot-based quiz attempt. */
        post: operations["lms_user_quiz_attempt_start"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/lessons/{lesson_id}/media/{media_kind}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return access payload for lesson video or attachment. */
        get: operations["lms_user_lessons_media_access"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/lessons/{lesson_id}/progress/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Update lesson watch progress monotonically. */
        post: operations["lms_user_lessons_progress_update"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/lessons/{lesson_id}/questions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return lesson questions for enrolled users. */
        get: operations["lms_lesson_questions_list"];
        put?: never;
        /** @description Create a visible question under a lesson. */
        post: operations["lms_lesson_questions_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/me/certificates/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated user certificates. */
        get: operations["lms_user_certificates_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/me/certificates/{certificate_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one owned certificate. */
        get: operations["lms_user_certificates_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/me/enrollments/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return current user's enrollments. */
        get: operations["lms_user_enrollments_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/me/enrollments/{enrollment_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one owned enrollment. */
        get: operations["lms_user_enrollments_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/me/recommendations/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return ranked course recommendations for the authenticated user. */
        get: operations["lms_user_learning_recommendations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/me/skills/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return LMS skills for the current user. */
        get: operations["lms_user_skills_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/questions/{question_id}/answers/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Create an answer under an existing question. */
        post: operations["lms_question_answers_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/questions/{question_id}/answers/{answer_id}/accept/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Mark answer as accepted. */
        post: operations["lms_question_answers_accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/questions/{question_id}/report/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Report a question. */
        post: operations["lms_questions_report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/quiz/attempts/{attempt_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return attempt questions and submitted answers without leaking correct answers before pass. */
        get: operations["lms_user_quiz_attempt_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lms/quiz/attempts/{attempt_id}/submit/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Submit attempt answers and calculate weighted score. */
        post: operations["lms_user_quiz_attempt_submit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/adjustments/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست اصلاحات مالی — ادمین
         * @description List and create financial adjustment workflow rows — admin.
         */
        get: operations["madadkar_admin_adjustments_list"];
        put?: never;
        /**
         * ثبت اصلاح مالی — ادمین
         * @description List and create financial adjustment workflow rows — admin.
         */
        post: operations["madadkar_admin_adjustments_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/adjustments/{adjustment_id}/{action}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * عملیات اصلاح مالی — ادمین
         * @description Approve, reject, and apply financial adjustments — admin.
         */
        post: operations["madadkar_admin_adjustment_action"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست حرکت‌ها — ادمین
         * @description list + create campaigns — admin.
         */
        get: operations["madadkar_admin_campaigns_list"];
        put?: never;
        /**
         * ساخت حرکت جدید — ادمین
         * @description list + create campaigns — admin.
         */
        post: operations["madadkar_admin_campaigns_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات حرکت — ادمین
         * @description retrieve + update + delete campaign — admin.
         */
        get: operations["madadkar_admin_campaign_retrieve"];
        put?: never;
        post?: never;
        /**
         * حذف نرم حرکت — ادمین
         * @description فقط حرکت‌های در وضعیت DRAFT قابل حذف هستند.
         */
        delete: operations["madadkar_admin_campaign_delete"];
        options?: never;
        head?: never;
        /**
         * ویرایش حرکت — ادمین
         * @description ویرایش فیلدهای حرکت با اعمال قوانین قفل:
         *
         *     - در وضعیت DRAFT و PUBLISHED بدون پرداخت موفق: همه فیلدها قابل ویرایش
         *     - بعد از اولین پرداخت موفق: فیلدهای مالی (مبلغ کل، تعداد سهم، مددکار) قفل می‌شوند
         *     - در وضعیت COMPLETED و CLOSED: فقط متن‌ها و تصاویر قابل ویرایش
         *     - deadline فقط می‌تواند به جلو منتقل شود (نه عقب)
         */
        patch: operations["madadkar_admin_campaign_update"];
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/analytics/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * آمار تجمیعی حرکت — ادمین
         * @description دریافت آمار کامل یک حرکت برای دشبورد ادمین:
         *     - تعداد مشارکت‌ها به تفکیک وضعیت
         *     - مجموع مبلغ و سهم پرداخت‌شده
         *     - تعداد کاربران یکتای پرداخت‌کننده
         *     - درصد پیشرفت و سهم باقی‌مانده
         */
        get: operations["madadkar_admin_campaign_analytics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/close/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * بستن دستی حرکت — ادمین
         * @description انتقال حرکت از PUBLISHED به CLOSED. از این پس امکان مشارکت جدید وجود ندارد.
         */
        post: operations["madadkar_admin_campaign_close"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/disbursable/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * مانده قابل تخصیص حرکت — ادمین
         * @description Return disbursable amount summary for one campaign.
         */
        get: operations["madadkar_admin_campaign_disbursable_summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/export/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * خروجی Excel از پرداخت‌های حرکت — ادمین
         * @description تولید و دانلود فایل Excel حرفه‌ای شامل تمام پرداخت‌های موفق یک حرکت.
         *
         *     **ویژگی‌های فایل:**
         *     - RTL alignment (راست به چپ)
         *     - Styled headers با رنگ‌بندی
         *     - ردیف summary در پایان (مجموع‌ها)
         *     - فرمت‌بندی اعداد و تاریخ‌ها
         *     - اطلاعات کامل: نام، ایمیل، موبایل، تعداد سهم، مبلغ، کد رهگیری، تاریخ
         */
        get: operations["madadkar_admin_campaign_export"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/financial-control/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * کنترل مالی حرکت — ادمین
         * @description Campaign-level financial controls summary including refunds and adjustments.
         */
        get: operations["madadkar_admin_campaign_financial_control"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/images/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست تصاویر گالری حرکت
         * @description list + upload gallery image — admin.
         */
        get: operations["madadkar_admin_campaign_images_list"];
        put?: never;
        /**
         * افزودن تصویر به گالری حرکت
         * @description list + upload gallery image — admin.
         */
        post: operations["madadkar_admin_campaign_images_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/images/{image_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * حذف تصویر از گالری حرکت
         * @description delete gallery image — admin.
         */
        delete: operations["madadkar_admin_campaign_images_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/intelligence/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * هوشمندی مالی و عملیاتی حرکت — ادمین
         * @description Campaign-level decision intelligence for Madadkar admins.
         */
        get: operations["madadkar_admin_campaign_intelligence"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/leaderboard/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * رتبه‌بندی بزرگ‌ترین مشارکت‌کنندگان — ادمین
         * @description نمایش top contributors یک حرکت بر اساس مجموع مبلغ پرداخت‌شده.
         *
         *     **Query param:**
         *     - `top_n` (اختیاری، پیش‌فرض 10، حداکثر 100): تعداد نفرات برتر.
         */
        get: operations["madadkar_admin_campaign_leaderboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/participants/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست مشارکت‌کنندگان حرکت — ادمین
         * @description دریافت لیست تمام مشارکت‌های موفق (PAID) یک حرکت. ترتیب: بزرگ‌ترین مبلغ ابتدا، سپس آخرین پرداخت‌ها.
         *
         *     شامل اطلاعات کامل کاربر و Payment.
         */
        get: operations["madadkar_admin_campaign_participants_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/campaigns/{campaign_id}/publish/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * انتشار حرکت — ادمین
         * @description انتقال حرکت از DRAFT به PUBLISHED.
         */
        post: operations["madadkar_admin_campaign_publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/disbursements/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست تخصیص‌های مالی مددکار — ادمین
         * @description List and request campaign fund disbursements — admin.
         */
        get: operations["madadkar_admin_disbursements_list"];
        put?: never;
        /**
         * درخواست تخصیص مالی از حرکت — ادمین
         * @description List and request campaign fund disbursements — admin.
         */
        post: operations["madadkar_admin_disbursements_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/disbursements/{disbursement_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات تخصیص مالی — ادمین
         * @description Retrieve one campaign fund disbursement workflow row — admin.
         */
        get: operations["madadkar_admin_disbursement_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/disbursements/{disbursement_id}/{action}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * عملیات تخصیص مالی — ادمین
         * @description Approve, reject, or mark disbursements as paid — admin.
         */
        post: operations["madadkar_admin_disbursement_action"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/financial-controls/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست snapshotهای کنترل مالی مددکار — ادمین
         * @description List generated Madadkar financial control snapshots.
         */
        get: operations["madadkar_admin_financial_control_snapshots_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/financial-controls/generate/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تولید snapshot کنترل مالی مددکار — ادمین
         * @description Generate financial control snapshot on demand for admins.
         */
        post: operations["madadkar_admin_financial_control_generate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/financial-controls/latest/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * آخرین snapshot کنترل مالی مددکار — ادمین
         * @description Return latest generated financial control snapshot.
         */
        get: operations["madadkar_admin_financial_control_latest"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/intelligence/overview/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * نمای کلی هوشمندی مددکار — ادمین
         * @description Portfolio-level intelligence overview across Madadkar campaigns.
         */
        get: operations["madadkar_admin_intelligence_overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/payments/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست تمام پرداخت‌ها — ادمین
         * @description دریافت لیست تمام پرداخت‌ها در کل سامانه با امکان فیلتر.
         *
         *     Query params:
         *     - `status`: فیلتر بر اساس وضعیت (pending/success/failed)
         *     - `gateway_name`: فیلتر بر اساس درگاه (sandbox/zarinpal/...)
         *     - `campaign`: فیلتر بر اساس شناسه حرکت
         *     - `user`: فیلتر بر اساس شناسه کاربر
         */
        get: operations["madadkar_admin_payments_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/receipts/{receipt_id}/resend/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * ثبت ارسال مجدد رسید — ادمین
         * @description Record audited resend action for a donation receipt.
         */
        post: operations["madadkar_admin_receipt_resend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/reconciliation/batches/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست batchهای تطبیق پرداخت — ادمین
         * @description List reconciliation batches for finance/admin review.
         */
        get: operations["madadkar_admin_reconciliation_batches_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/reconciliation/batches/{batch_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات batch تطبیق پرداخت — ادمین
         * @description Retrieve one reconciliation batch summary.
         */
        get: operations["madadkar_admin_reconciliation_batch_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/reconciliation/batches/{batch_id}/export/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * خروجی CSV اختلافات تطبیق — ادمین
         * @description Export non-matched reconciliation rows as finance-friendly CSV.
         */
        get: operations["madadkar_admin_reconciliation_discrepancies_export"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/reconciliation/batches/{batch_id}/items/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست ردیف‌های batch تطبیق پرداخت — ادمین
         * @description List reconciliation items for one batch with optional status filter.
         */
        get: operations["madadkar_admin_reconciliation_items_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/reconciliation/import/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Import گزارش تطبیق پرداخت — ادمین
         * @description Import provider settlement CSV/XLSX and create reconciliation batch.
         */
        post: operations["madadkar_admin_reconciliation_import"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/refunds/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست بازپرداخت‌ها — ادمین
         * @description List and create reviewed payment refund requests — admin.
         */
        get: operations["madadkar_admin_refunds_list"];
        put?: never;
        /**
         * ثبت درخواست بازپرداخت — ادمین
         * @description List and create reviewed payment refund requests — admin.
         */
        post: operations["madadkar_admin_refunds_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/refunds/{refund_id}/{action}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید بازپرداخت — ادمین
         * @description Approve, reject, and complete payment refund workflow rows — admin.
         */
        post: operations["madadkar_admin_refund_approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/risk-signals/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست سیگنال‌های ریسک مددکار — ادمین
         * @description List Madadkar financial risk signals for admin review.
         */
        get: operations["madadkar_admin_risk_signals_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/risk-signals/{signal_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * بررسی سیگنال ریسک مددکار — ادمین
         * @description Review, dismiss, or escalate Madadkar financial risk signals.
         */
        post: operations["madadkar_admin_risk_signal_review"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/sponsors/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست مددکاران — ادمین
         * @description list + create sponsors — admin.
         */
        get: operations["madadkar_admin_sponsors_list"];
        put?: never;
        /**
         * ساخت مددکار جدید — ادمین
         * @description list + create sponsors — admin.
         */
        post: operations["madadkar_admin_sponsors_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/admin/sponsors/{sponsor_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات مددکار — ادمین
         * @description retrieve + update + delete sponsor — admin.
         */
        get: operations["madadkar_admin_sponsor_retrieve"];
        put?: never;
        post?: never;
        /**
         * حذف نرم مددکار — ادمین
         * @description retrieve + update + delete sponsor — admin.
         */
        delete: operations["madadkar_admin_sponsor_delete"];
        options?: never;
        head?: never;
        /**
         * ویرایش مددکار — ادمین
         * @description retrieve + update + delete sponsor — admin.
         */
        patch: operations["madadkar_admin_sponsor_update"];
        trace?: never;
    };
    "/api/v1/madadkar/campaigns/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست حرکت‌های خیریه
         * @description دریافت لیست حرکت‌های قابل نمایش (PUBLISHED, COMPLETED, CLOSED).
         *
         *     حرکت‌های DRAFT و is_visible=False در این لیست نمایش داده نمی‌شوند.
         *
         *     نتایج paginated و قابل فیلتر می‌باشند.
         */
        get: operations["madadkar_public_campaigns_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/campaigns/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات یک حرکت خیریه
         * @description دریافت جزئیات کامل یک حرکت با slug.
         *
         *     شامل گالری تصاویر، اطلاعات مددکار، پیشرفت سهم و توضیحات کامل.
         */
        get: operations["madadkar_public_campaign_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/campaigns/{slug}/participate/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * شروع مشارکت در حرکت
         * @description کاربر لاگین‌کرده می‌تواند با وارد کردن تعداد سهم، فرآیند پرداخت را آغاز کند.
         *
         *     **گام‌ها در سمت کلاینت:**
         *     1. این endpoint را با share_count فراخوانی کنید.
         *     2. به `gateway_url` ریدایرکت کنید.
         *     3. پس از بازگشت از درگاه، endpoint verify خودکار صدا زده می‌شود.
         *
         *     **نکات امنیتی:**
         *     - سهم‌ها به محض initiate رزرو می‌شوند (تا 15 دقیقه).
         *     - اگر پرداخت موفق نشود، سهم‌ها خودکار آزاد می‌شوند.
         *     - قیمت سهم در لحظه ایجاد ثبت می‌شود (snapshot).
         */
        post: operations["madadkar_user_participate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/campaigns/{slug}/transparency/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * شفافیت مالی عمومی حرکت
         * @description نمای عمومی و بدون اطلاعات خصوصی از وضعیت مالی حرکت: مبالغ جمع‌آوری‌شده، بازپرداخت‌ها، اصلاحات مالی، تخصیص‌های پرداخت‌شده و مانده قابل تخصیص.
         */
        get: operations["madadkar_public_campaign_transparency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/me/participations/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست مشارکت‌های من
         * @description دریافت لیست تمام مشارکت‌های کاربر جاری.
         */
        get: operations["madadkar_user_my_participations_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/me/participations/{participation_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات یک مشارکت من
         * @description جزئیات یک مشارکت من — IDOR-safe.
         */
        get: operations["madadkar_user_my_participation_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/me/receipts/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست رسیدهای مشارکت من
         * @description List verifiable donation receipts owned by current user.
         */
        get: operations["madadkar_user_receipts_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/me/receipts/{receipt_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات رسید مشارکت من
         * @description Retrieve one user-owned donation receipt and audit access.
         */
        get: operations["madadkar_user_receipt_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/payment/verify/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * تأیید پرداخت — callback از سمت درگاه
         * @description این endpoint توسط درگاه پرداخت بعد از تکمیل تراکنش فراخوانی می‌شود.
         *
         *     ورودی شامل `authority` (و گاهی `status`) است که توسط درگاه به‌صورت query string یا body ارسال می‌گردد.
         *
         *     این endpoint **idempotent** است: فراخوانی دوباره با همان authority نتیجه قبلی را برمی‌گرداند بدون تماس مجدد با درگاه.
         */
        get: operations["madadkar_payment_verify"];
        put?: never;
        /**
         * تأیید پرداخت — POST callback (درگاه‌های POST-based)
         * @description Callback تأیید پرداخت — GET/POST /api/v1/madadkar/payment/verify/
         *
         *     نکته مهم: این endpoint از سمت **درگاه پرداخت** فراخوانی می‌شود
         *     (نه مستقیم از طرف کلاینت ما). در زمان فراخوانی session کاربر
         *     معمولاً موجود نیست.
         *
         *     بنابراین:
         *     - permission: AllowAny (verify بر اساس authority انجام می‌شود)
         *     - throttle: مخصوص (مبتنی بر IP)
         *     - method: هم GET (Zarinpal) و هم POST (سایر درگاه‌ها) پشتیبانی می‌شوند.
         */
        post: operations["madadkar_payment_verify_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/receipts/verify/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * اعتبارسنجی عمومی رسید مشارکت
         * @description Public verification for receipt number/hash pairs without exposing donor PII.
         */
        post: operations["madadkar_public_receipt_verify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/sponsors/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست مددکاران
         * @description دریافت لیست تمام مددکارانی که حداقل یک حرکت قابل نمایش دارند.
         *
         *     این endpoint بدون نیاز به لاگین قابل دسترس است.
         */
        get: operations["madadkar_public_sponsors_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/madadkar/sponsors/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات یک مددکار
         * @description دریافت جزئیات یک مددکار با slug.
         */
        get: operations["madadkar_public_sponsor_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/metrics/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return Prometheus text exposition format. */
        get: operations["metrics_prometheus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/admin/deliveries/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return notification deliveries. */
        get: operations["notifications_admin_deliveries_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/admin/events/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return notification events. */
        get: operations["notifications_admin_events_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/admin/templates/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return templates. */
        get: operations["notifications_admin_templates_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/me/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return paginated notifications. */
        get: operations["notifications_me_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/me/{delivery_id}/read/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Mark a user-owned delivery as read. */
        post: operations["notifications_me_read_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/me/preferences/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return preferences. */
        get: operations["notifications_me_preferences_retrieve"];
        put?: never;
        /** @description Create/update one preference. */
        post: operations["notifications_me_preferences_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/me/read-all/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Mark all deliveries as read. */
        post: operations["notifications_me_read_all_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public-reports/admin/reports/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست گزارشات
         * @description دریافت لیست تمام گزارش‌های ثبت‌شده با pagination و فیلتر.
         *
         *     **فیلترهای موجود:**
         *     - `status`: pending / reviewing / approved / rejected
         *     - `subject`: شناسه موضوع
         *     - جستجو در نام، شماره تماس و توضیحات
         */
        get: operations["reports_admin_reports_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public-reports/admin/reports/{report_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات یک گزارش
         * @description دریافت اطلاعات کامل یک گزارش شامل پیوست‌ها و یادداشت‌های مدیریتی.
         */
        get: operations["reports_admin_report_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public-reports/admin/reports/{report_id}/status/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * تغییر وضعیت گزارش
         * @description تغییر وضعیت یک گزارش به همراه یادداشت اختیاری.
         *
         *     **وضعیت‌های ممکن:**
         *     - `pending`: در انتظار بررسی
         *     - `reviewing`: در حال بررسی
         *     - `approved`: تأیید شده
         *     - `rejected`: رد شده
         */
        patch: operations["reports_admin_report_status_update"];
        trace?: never;
    };
    "/api/v1/public-reports/admin/subjects/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست تمام موضوعات گزارش
         * @description دریافت لیست تمام موضوعات شامل غیرفعال‌ها — برای پنل مدیریت.
         *
         *     قابل فیلتر بر اساس وضعیت فعال بودن.
         */
        get: operations["reports_admin_subjects_list"];
        put?: never;
        /**
         * ساخت موضوع گزارش جدید
         * @description ایجاد یک موضوع جدید برای دسته‌بندی گزارش‌های مردمی.
         */
        post: operations["reports_admin_subjects_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public-reports/admin/subjects/{subject_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات یک موضوع
         * @description دریافت جزئیات کامل یک موضوع شامل تعداد گزارش‌های مرتبط.
         */
        get: operations["reports_admin_subject_retrieve"];
        put?: never;
        post?: never;
        /**
         * حذف نرم موضوع
         * @description غیرفعال کردن (soft delete) یک موضوع.
         *
         *     موضوع از سیستم حذف نمی‌شود ولی دیگر در لیست عمومی نمایش داده نمی‌شود و گزارش‌های موجود حفظ می‌شوند.
         */
        delete: operations["reports_admin_subject_delete"];
        options?: never;
        head?: never;
        /**
         * ویرایش موضوع
         * @description ویرایش اطلاعات یک موضوع.
         *
         *     تمام فیلدها optional هستند — فقط مقادیر ارسالی به‌روزرسانی می‌شوند.
         */
        patch: operations["reports_admin_subject_update"];
        trace?: never;
    };
    "/api/v1/public-reports/reports/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * ثبت گزارش مردمی
         * @description ثبت گزارش جدید توسط کاربر عمومی همراه با پیوست‌های اختیاری.
         *
         *     **محدودیت‌ها:**
         *     - حداکثر ۵ فایل پیوست
         *     - فقط jpg/jpeg/png/webp، حداکثر ۵ مگابایت برای هر فایل
         *     - ۵ گزارش در دقیقه برای کاربران مهمان
         *     - ۲۰ گزارش در دقیقه برای کاربران لاگین کرده
         */
        post: operations["reports_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public-reports/subjects/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست موضوعات گزارش
         * @description دریافت لیست موضوعات فعال برای انتخاب در فرم ثبت گزارش.
         *
         *     این endpoint بدون pagination است و فقط موضوعات فعال (با `is_active=True`) را برمی‌گرداند.
         */
        get: operations["reports_subjects_public_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/bounties/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست جوایز — ادمین
         * @description دریافت لیست تمام جوایز ثبت‌شده با امکان فیلتر کامل.
         */
        get: operations["r4j_admin_bounties_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/bounties/{bounty_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات جایزه — ادمین
         * @description جزئیات یک bounty — admin.
         */
        get: operations["r4j_admin_bounty_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/bounties/{bounty_id}/cancel/approve/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید درخواست لغو جایزه — ادمین
         * @description تأیید درخواست لغو bounty توسط ادمین.
         *
         *     endpoint: POST /api/v1/r4j/admin/bounties/{bounty_id}/cancel/approve/
         */
        post: operations["r4j_admin_bounty_cancel_approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/bounties/{bounty_id}/cancel/reject/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * رد درخواست لغو جایزه — ادمین
         * @description رد درخواست لغو bounty توسط ادمین.
         *
         *     endpoint: POST /api/v1/r4j/admin/bounties/{bounty_id}/cancel/reject/
         */
        post: operations["r4j_admin_bounty_cancel_reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست پرونده‌های عملیاتی R4J
         * @description Admin endpoint for listing operational investigation cases.
         */
        get: operations["r4j_admin_case_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin endpoint for case detail. */
        get: operations["r4j_admin_case_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/assign/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for assigning a case. */
        post: operations["r4j_admin_case_assign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/close/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for closing a case. */
        post: operations["r4j_admin_case_close"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/escalate/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for escalating a case. */
        post: operations["r4j_admin_case_escalate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/priority/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for changing case priority. */
        post: operations["r4j_admin_case_priority"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/reject/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for rejecting a case. */
        post: operations["r4j_admin_case_reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/reopen/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for reopening a terminal case. */
        post: operations["r4j_admin_case_reopen"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/request-evidence/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for requesting more evidence. */
        post: operations["r4j_admin_case_evidence_request"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/resolve/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for resolving a case. */
        post: operations["r4j_admin_case_resolve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/timeline/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin endpoint for immutable case timeline. */
        get: operations["r4j_admin_case_timeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/cases/{case_number}/triage/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint for case triage. */
        post: operations["r4j_admin_case_triage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست مجرمین — ادمین
         * @description لیست تمام مجرمین شامل draft و soft-deleted.
         */
        get: operations["r4j_admin_criminals_list"];
        put?: never;
        /**
         * ساخت پروفایل مجرم جدید — ادمین
         * @description ساخت پروفایل جدید. همیشه draft ساخته می‌شود و باید با endpoint publish منتشر شود.
         */
        post: operations["r4j_admin_criminals_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات مجرم — ادمین
         * @description retrieve + update + delete — admin.
         */
        get: operations["r4j_admin_criminal_retrieve"];
        put?: never;
        post?: never;
        /**
         * حذف نرم مجرم — ادمین
         * @description غیرفعال (soft delete) و خودکار unpublish می‌شود.
         */
        delete: operations["r4j_admin_criminal_delete"];
        options?: never;
        head?: never;
        /**
         * ویرایش مجرم — ادمین
         * @description retrieve + update + delete — admin.
         */
        patch: operations["r4j_admin_criminal_update"];
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/aliases/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست اسامی مستعار
         * @description list + create aliases — admin.
         */
        get: operations["r4j_admin_aliases_list"];
        put?: never;
        /**
         * افزودن نام مستعار
         * @description list + create aliases — admin.
         */
        post: operations["r4j_admin_aliases_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/aliases/{alias_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * حذف نام مستعار
         * @description delete one alias — admin.
         */
        delete: operations["r4j_admin_aliases_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/attachments/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست اسناد
         * @description list + upload attachment — admin.
         */
        get: operations["r4j_admin_attachments_list"];
        put?: never;
        /**
         * آپلود سند
         * @description list + upload attachment — admin.
         */
        post: operations["r4j_admin_attachments_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/attachments/{attachment_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * حذف سند
         * @description delete attachment — admin.
         */
        delete: operations["r4j_admin_attachments_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/phones/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست شماره‌های تماس
         * @description list + create phones — admin.
         */
        get: operations["r4j_admin_phones_list"];
        put?: never;
        /**
         * افزودن شماره تماس
         * @description list + create phones — admin.
         */
        post: operations["r4j_admin_phones_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/phones/{phone_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * حذف شماره تماس
         * @description update + delete phone — admin.
         */
        delete: operations["r4j_admin_phones_delete"];
        options?: never;
        head?: never;
        /**
         * ویرایش شماره تماس
         * @description update + delete phone — admin.
         */
        patch: operations["r4j_admin_phones_update"];
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/photos/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست عکس‌ها
         * @description list + upload photo — admin.
         */
        get: operations["r4j_admin_photos_list"];
        put?: never;
        /**
         * آپلود عکس
         * @description list + upload photo — admin.
         */
        post: operations["r4j_admin_photos_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/photos/{photo_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * حذف عکس
         * @description delete photo — admin.
         */
        delete: operations["r4j_admin_photos_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/photos/{photo_id}/set-primary/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تنظیم عکس به‌عنوان اصلی
         * @description set a photo as primary — admin.
         */
        post: operations["r4j_admin_photos_set_primary"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/publish/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * انتشار مجرم — ادمین
         * @description انتشار یک مجرم — admin.
         */
        post: operations["r4j_admin_criminal_publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/socials/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست شبکه‌های اجتماعی
         * @description list + create socials — admin.
         */
        get: operations["r4j_admin_socials_list"];
        put?: never;
        /**
         * افزودن شبکه اجتماعی
         * @description list + create socials — admin.
         */
        post: operations["r4j_admin_socials_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/socials/{social_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * حذف شبکه اجتماعی
         * @description update + delete social — admin.
         */
        delete: operations["r4j_admin_socials_delete"];
        options?: never;
        head?: never;
        /**
         * ویرایش شبکه اجتماعی
         * @description update + delete social — admin.
         */
        patch: operations["r4j_admin_socials_update"];
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/unpublish/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * خروج از انتشار مجرم — ادمین
         * @description خروج از انتشار یک مجرم — admin.
         */
        post: operations["r4j_admin_criminal_unpublish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/criminals/{criminal_id}/visibility/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست تنظیمات نمایش فیلدها
         * @description list + upsert visibility — admin.
         */
        get: operations["r4j_admin_visibility_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * تنظیم نمایش یک فیلد
         * @description list + upsert visibility — admin.
         */
        patch: operations["r4j_admin_visibility_upsert"];
        trace?: never;
    };
    "/api/v1/r4j/admin/evidence-custody/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست زنجیره نگهداری شواهد
         * @description Admin list endpoint for evidence chain-of-custody events.
         */
        get: operations["r4j_admin_evidence_custody_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/evidence-custody/{event_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint to append a custody review/transfer/reject event. */
        post: operations["r4j_admin_evidence_custody_review"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/operations/overview/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Admin operational overview for R4J cases. */
        get: operations["r4j_admin_case_operations_overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/reports/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست گزارشات — ادمین
         * @description دریافت لیست تمام گزارشات با امکان فیلتر کامل.
         */
        get: operations["r4j_admin_reports_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/reports/{report_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات گزارش — ادمین
         * @description جزئیات یک گزارش — admin.
         */
        get: operations["r4j_admin_report_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/reports/{report_id}/cancel/approve/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید درخواست لغو گزارش — ادمین
         * @description تأیید درخواست لغو گزارش توسط ادمین.
         *
         *     endpoint: POST /api/v1/r4j/admin/reports/{report_id}/cancel/approve/
         */
        post: operations["r4j_admin_report_cancel_approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/reports/{report_id}/cancel/reject/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * رد درخواست لغو گزارش — ادمین
         * @description رد درخواست لغو گزارش توسط ادمین.
         *
         *     endpoint: POST /api/v1/r4j/admin/reports/{report_id}/cancel/reject/
         */
        post: operations["r4j_admin_report_cancel_reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/reports/{report_id}/create-case/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Admin endpoint to create an operational case from a report. */
        post: operations["r4j_admin_case_create_from_report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/admin/reports/{report_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * بررسی گزارش — ادمین
         * @description ادمین می‌تواند برای هر فیلد گزارش به‌صورت مستقل تصمیم بگیرد.
         *
         *     بعد از review:
         *     - اگر همه field_changeها approve شوند → وضعیت APPROVED
         *     - اگر برخی approve شوند → وضعیت PARTIALLY_APPROVED
         *     - اگر هیچ‌کدام approve نشوند → وضعیت REJECTED
         *
         *     تغییرات approved بلافاصله روی پروفایل مجرم اعمال می‌شوند.
         */
        post: operations["r4j_admin_report_review"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/criminals/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست مجرمین منتشرشده
         * @description دریافت لیست مجرمین منتشرشده برای نمایش عمومی.
         *
         *     فقط رکوردهای فعال و منتشرشده در پاسخ هستند. نتایج paginated و قابل فیلتر می‌باشند.
         */
        get: operations["r4j_public_criminals_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/criminals/{criminal_id}/bounty/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تعیین یا ویرایش جایزه برای مجرم
         * @description کاربرانی که احراز هویت کامل داشته و پروفایل آن‌ها کامل باشد می‌توانند برای یک مجرم جایزه تعیین کنند.
         *
         *     اگر قبلاً برای همان مجرم جایزه‌ای فعال ثبت کرده باشند، همان رکورد به‌روزرسانی می‌شود؛ در غیر این صورت رکورد جدید ساخته می‌شود.
         */
        post: operations["r4j_user_bounty_set_or_update"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/criminals/{criminal_id}/reports/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * ارسال گزارش تکمیلی برای مجرم
         * @description کاربر لاگین‌کرده می‌تواند گزارشی برای تکمیل یا اصلاح اطلاعات یک مجرم ارسال کند.
         *
         *     **حالت JSON:**
         *     ```json
         *     {
         *       "notes": "متن آزاد",
         *       "field_changes": [{"field_name": "city", "suggested_value": "Tehran"}]
         *     }
         *     ```
         *
         *     **حالت Multipart (با فایل ضمیمه):**
         *     - `notes`: string
         *     - `field_changes`: JSON string
         *     - `attachments`: یک یا چند فایل
         *
         *     گزارش باید حداقل شامل یک پیشنهاد تغییر فیلد یا یادداشت باشد.
         *
         *     تا قبل از تأیید ادمین، هیچ تغییری روی پروفایل مجرم اعمال نمی‌شود.
         */
        post: operations["r4j_user_report_submit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/criminals/{lookup}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات یک مجرم منتشرشده
         * @description دریافت جزئیات یک مجرم با استفاده از id یا slug.
         *
         *     فیلدهای حساس بر اساس تنظیمات per-criminal visibility نمایش داده یا مخفی می‌شوند.
         */
        get: operations["r4j_public_criminal_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/me/bounties/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست جوایز من
         * @description دریافت لیست تمام جوایزی که توسط کاربر جاری تعیین شده‌اند.
         */
        get: operations["r4j_user_my_bounties_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/me/bounties/{bounty_id}/cancel/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * درخواست لغو جایزه
         * @description کاربر می‌تواند برای جایزه‌ای که خودش تعیین کرده درخواست لغو ثبت کند.
         *
         *     فقط جایزه‌های فعال قابل درخواست لغو هستند و درخواست لغو باید توسط ادمین تأیید یا رد شود.
         */
        post: operations["r4j_user_bounty_cancel_request"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/me/reports/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست گزارشات من
         * @description دریافت لیست تمام گزارشاتی که توسط کاربر جاری ارسال شده‌اند.
         */
        get: operations["r4j_user_my_reports_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/me/reports/{report_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات یک گزارش من
         * @description جزئیات یک گزارش کاربر + cancel request.
         */
        get: operations["r4j_user_my_report_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/r4j/me/reports/{report_id}/cancel/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * درخواست لغو گزارش
         * @description کاربر می‌تواند درخواست لغو گزارشی که ارسال کرده را بدهد.
         *
         *     فقط گزارش‌هایی که در وضعیت «در انتظار بررسی» هستند قابل لغو می‌باشند.
         *
         *     درخواست لغو باید توسط ادمین تأیید یا رد شود.
         */
        post: operations["r4j_user_report_cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/analytics/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return support desk analytics summary. */
        get: operations["support_admin_analytics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/business-calendars/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return business calendars. */
        get: operations["support_admin_business_calendars_retrieve"];
        put?: never;
        /** @description Create business calendar. */
        post: operations["support_admin_business_calendars_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/business-calendars/{calendar_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update business calendar. */
        patch: operations["support_admin_business_calendars_partial_update"];
        trace?: never;
    };
    "/api/v1/support/admin/canned-responses/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return canned responses. */
        get: operations["support_admin_canned_responses_retrieve"];
        put?: never;
        /** @description Create canned response. */
        post: operations["support_admin_canned_responses_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/canned-responses/{canned_response_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update canned response. */
        patch: operations["support_admin_canned_responses_partial_update"];
        trace?: never;
    };
    "/api/v1/support/admin/canned-responses/{canned_response_id}/use/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Mark canned response as used. */
        post: operations["support_admin_canned_responses_use_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/categories/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return all categories for admin tree management. */
        get: operations["support_admin_categories_retrieve"];
        put?: never;
        /** @description Create support category. */
        post: operations["support_admin_categories_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/categories/{category_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** @description Deactivate category safely. */
        delete: operations["support_admin_categories_destroy"];
        options?: never;
        head?: never;
        /** @description Update category tree node. */
        patch: operations["support_admin_categories_partial_update"];
        trace?: never;
    };
    "/api/v1/support/admin/departments/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return all departments for admin taxonomy management. */
        get: operations["support_admin_departments_list"];
        put?: never;
        /** @description Create support department. */
        post: operations["support_admin_departments_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/departments/{department_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one department. */
        get: operations["support_admin_departments_retrieve"];
        put?: never;
        post?: never;
        /** @description Deactivate department safely. */
        delete: operations["support_admin_departments_destroy"];
        options?: never;
        head?: never;
        /** @description Update department. */
        patch: operations["support_admin_departments_partial_update"];
        trace?: never;
    };
    "/api/v1/support/admin/duplicates/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return duplicate candidates. */
        get: operations["support_admin_duplicates_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/duplicates/{duplicate_id}/review/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Review duplicate candidate. */
        post: operations["support_admin_duplicates_review_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/export/csat/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Export CSAT data as an RTL Excel workbook. */
        get: operations["support_admin_export_csat"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/export/messages/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Export timeline messages as an RTL Excel workbook. */
        get: operations["support_admin_export_messages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/export/sla/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Export SLA ticket data as an RTL Excel workbook. */
        get: operations["support_admin_export_sla"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/export/tickets/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Export filtered ticket queue as an RTL Excel workbook. */
        get: operations["support_admin_export_tickets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/holidays/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return support holidays. */
        get: operations["support_admin_holidays_retrieve"];
        put?: never;
        /** @description Create support holiday. */
        post: operations["support_admin_holidays_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/holidays/{holiday_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update support holiday. */
        patch: operations["support_admin_holidays_partial_update"];
        trace?: never;
    };
    "/api/v1/support/admin/knowledge/articles/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return all knowledge articles for admin management. */
        get: operations["support_admin_knowledge_articles_list"];
        put?: never;
        /** @description Create a knowledge base article. */
        post: operations["support_admin_knowledge_articles_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/knowledge/articles/{article_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return article detail for admin. */
        get: operations["support_admin_knowledge_article_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update article content/metadata. */
        patch: operations["support_admin_knowledge_article_update"];
        trace?: never;
    };
    "/api/v1/support/admin/knowledge/articles/{article_id}/archive/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Archive one knowledge article. */
        post: operations["support_admin_knowledge_article_archive"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/knowledge/articles/{article_id}/publish/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Publish one knowledge article. */
        post: operations["support_admin_knowledge_article_publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/knowledge/articles/{article_id}/use/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Record article usage for analytics and audit. */
        post: operations["support_admin_knowledge_article_use"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/sla-policies/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return SLA policies. */
        get: operations["support_admin_sla_policies_retrieve"];
        put?: never;
        /** @description Create SLA policy. */
        post: operations["support_admin_sla_policies_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/sla-policies/{policy_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update SLA policy. */
        patch: operations["support_admin_sla_policies_partial_update"];
        trace?: never;
    };
    "/api/v1/support/admin/ticket-types/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return ticket types. */
        get: operations["support_admin_ticket_types_retrieve"];
        put?: never;
        /** @description Create ticket type. */
        post: operations["support_admin_ticket_types_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/ticket-types/{ticket_type_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update ticket type. */
        patch: operations["support_admin_ticket_types_partial_update"];
        trace?: never;
    };
    "/api/v1/support/admin/tickets/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return filtered admin ticket queue. */
        get: operations["support_admin_tickets_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return ticket with internal timeline. */
        get: operations["support_admin_tickets_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/assign/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Assign ticket to admin/department. */
        post: operations["support_admin_tickets_assign_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/assignment-recommendation/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return transparent least-loaded assignment recommendation. */
        get: operations["support_admin_ticket_assignment_recommendation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/auto-assign/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Auto-assign ticket to the least-loaded support admin. */
        post: operations["support_admin_ticket_auto_assign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/close/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Close ticket by admin. */
        post: operations["support_admin_tickets_close_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/escalate/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Escalate ticket. */
        post: operations["support_admin_tickets_escalate_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/internal-note/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Add internal note. */
        post: operations["support_admin_tickets_internal_note_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/reply/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Add admin public reply. */
        post: operations["support_admin_tickets_reply_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/smart-replies/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Generate smart reply suggestions from KB/canned responses/public timeline. */
        get: operations["support_admin_ticket_smart_replies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/smart-replies/use/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Send reviewed smart reply body as an admin reply and audit source metadata. */
        post: operations["support_admin_ticket_smart_reply_use"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/admin/tickets/{ticket_number}/status/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Change ticket status. */
        post: operations["support_admin_tickets_status_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/categories/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return active support categories. */
        get: operations["support_categories_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/departments/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return active support departments. */
        get: operations["support_departments_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/knowledge/articles/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return published knowledge articles with simple search/taxonomy filters. */
        get: operations["support_knowledge_articles_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/knowledge/articles/{slug}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return one published knowledge article by slug. */
        get: operations["support_knowledge_article_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/knowledge/articles/recommend/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Recommend published articles from subject/description/taxonomy context. */
        post: operations["support_knowledge_articles_recommend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return current user's tickets. */
        get: operations["support_user_tickets_list"];
        put?: never;
        /** @description Create a draft ticket for current user. */
        post: operations["support_user_tickets_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/{ticket_number}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return current user's ticket detail. */
        get: operations["support_user_tickets_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update a draft ticket before submission. */
        patch: operations["support_user_tickets_update"];
        trace?: never;
    };
    "/api/v1/support/me/tickets/{ticket_number}/attachments/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Attach a validated public file to the ticket. */
        post: operations["support_user_tickets_attachment_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/{ticket_number}/reopen/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Reopen ticket within the policy window. */
        post: operations["support_user_tickets_reopen"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/{ticket_number}/reply/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Append a user reply to the public timeline. */
        post: operations["support_user_tickets_reply"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/{ticket_number}/satisfaction/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Submit CSAT rating. */
        post: operations["support_user_tickets_satisfaction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/{ticket_number}/submit/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Submit current user's draft ticket. */
        post: operations["support_user_tickets_submit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/{ticket_number}/timeline/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return public messages only; internal notes are never exposed. */
        get: operations["support_user_tickets_timeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/me/tickets/suggest/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Return smart triage suggestions and duplicate warning. */
        post: operations["support_user_tickets_suggest"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/support/ticket-types/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Return active support ticket types. */
        get: operations["support_ticket_types_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/contents/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست محتواها — ادمین
         * @description لیست تمام محتواها شامل غیرفعال و حذف‌شده — paginated و قابل فیلتر.
         *
         *     **فیلترهای موجود:**
         *     - `media_type`: image / video / audio
         *     - `author`: جستجو در نام نویسنده
         *     - `is_active`: فیلتر فعال/غیرفعال
         *     - `is_deleted_in_source`: فیلتر حذف‌شده در منبع
         *     - `search`: جستجو در عنوان و توضیحات
         *
         *     این endpoint cache نمی‌شود — همیشه آخرین state را برمی‌گرداند.
         */
        get: operations["tabyin_admin_contents_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/contents/{external_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات محتوا — ادمین
         * @description جزئیات کامل یک محتوا شامل `raw_payload` (داده خام JSON منبع).
         *
         *     این endpoint cache نمی‌شود — همیشه آخرین state را برمی‌گرداند.
         */
        get: operations["tabyin_admin_content_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/contents/{external_id}/toggle/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * فعال/غیرفعال کردن محتوا — ادمین
         * @description تغییر وضعیت نمایش یک محتوا در سایت عمومی.
         *
         *     با این endpoint می‌توان محتوایی را از نمایش عمومی پنهان کرد بدون اینکه از دیتابیس حذف شود.
         *
         *     پس از تغییر، cache عمومی به‌صورت خودکار invalidate می‌شود.
         */
        patch: operations["tabyin_admin_content_toggle"];
        trace?: never;
    };
    "/api/v1/tabyin/admin/submissions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * صف بررسی محتواهای ارسالی کاربران
         * @description Admin review queue for user-submitted Tabyin content.
         */
        get: operations["tabyin_admin_submissions_queue"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/submissions/{content_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات محتوای ارسالی کاربر
         * @description Admin detail view for one user-submitted content item.
         */
        get: operations["tabyin_admin_submission_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/submissions/{content_id}/approve/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید محتوای ارسالی کاربر
         * @description Approve a pending user-submitted Tabyin content item.
         */
        post: operations["tabyin_admin_submission_approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/submissions/{content_id}/reject/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * رد محتوای ارسالی کاربر
         * @description Reject a pending user-submitted Tabyin content item.
         */
        post: operations["tabyin_admin_submission_reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/sync/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * اجرای دستی همگام‌سازی (غیرهمزمان) — ادمین
         * @description اجرای همگام‌سازی محتوا از سایت محتوانگار به‌صورت **غیرهمزمان**.
         *
         *     این endpoint task مربوط به sync را در صف Celery قرار می‌دهد و بلافاصله پاسخ می‌دهد. خود اجرای sync در پس‌زمینه انجام می‌شود.
         *
         *     **حالت‌های موجود:**
         *     - `full`: همه صفحات پیمایش می‌شوند (سنگین‌تر)
         *     - `incremental`: فقط تغییرات اخیر (سریع‌تر)
         *
         *     برای پیگیری وضعیت اجرا از endpoint وضعیت task استفاده کنید.
         *
         *     پس از sync (در صورت وجود تغییر)، cache عمومی به‌صورت خودکار invalidate می‌شود.
         *
         *     **Throttle:** حداکثر ۵ بار در ساعت.
         */
        post: operations["tabyin_admin_sync_dispatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/admin/sync/status/{task_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * پیگیری وضعیت task همگام‌سازی — ادمین
         * @description نمایش وضعیت لحظه‌ای یک task پس‌زمینه‌ی sync.
         *
         *     **مقادیر ممکن `state`:**
         *     - `PENDING`: هنوز اجرا نشده یا task_id نامعتبر است.
         *     - `STARTED`: در حال اجراست.
         *     - `RETRY`: درحال تلاش مجدد پس از خطا.
         *     - `SUCCESS`: با موفقیت تمام شده — `result` شامل آمار sync است.
         *     - `FAILURE`: شکست خورده — `error` شامل پیام خطاست.
         *     - `REVOKED`: لغو شده.
         *
         *     برای taskهای ناتمام، فیلدهای `result` و `error` خالی هستند.
         */
        get: operations["tabyin_admin_sync_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/contents/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست محتواهای جهاد تبیین
         * @description لیست محتواهای عمومی — پاسخ paginated و قابل فیلتر.
         *
         *     **فیلترهای موجود:**
         *     - `media_type`: image / video / audio
         *     - `author`: جستجو در نام نویسنده
         *     - `search`: جستجو در عنوان و توضیحات
         *
         *     این endpoint با cache سطح selector بهینه شده است (TTL=۶۰ ثانیه، invalidation خودکار پس از sync یا تغییرات ادمین).
         */
        get: operations["tabyin_public_contents_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/contents/{external_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات محتوای تبیین
         * @description جزئیات یک محتوا با external_id.
         *
         *     این endpoint با cache سطح selector بهینه شده است (TTL=۵ دقیقه، invalidation خودکار پس از sync یا تغییرات ادمین).
         */
        get: operations["tabyin_public_content_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/me/submissions/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * لیست محتواهای ارسالی من
         * @description Authenticated users can submit content and list their own submissions.
         */
        get: operations["tabyin_user_submissions_list"];
        put?: never;
        /**
         * ارسال محتوای جدید برای بررسی ادمین
         * @description Authenticated users can submit content and list their own submissions.
         */
        post: operations["tabyin_user_submission_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tabyin/me/submissions/{content_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات محتوای ارسالی من
         * @description Authenticated users can inspect one of their own submissions.
         */
        get: operations["tabyin_user_submission_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description آمار تجمیعی یک حرکت برای دشبورد ادمین. */
        AdminCampaignAnalytics: {
            readonly expired_participations: number;
            readonly failed_participations: number;
            readonly paid_participations: number;
            readonly pending_participations: number;
            /** Format: double */
            readonly progress_percent: number;
            readonly remaining_shares: number;
            readonly total_paid_amount: number;
            readonly total_paid_shares: number;
            readonly total_participations: number;
            readonly unique_paid_users: number;
        };
        /** @description AdminChangeRoleSerializer implementation for the authentication application. */
        AdminChangeRole: {
            role: components["schemas"]["RoleEnum"];
        };
        /** @description یک ردیف از leaderboard — top contributors یک حرکت. */
        AdminLeaderboardEntry: {
            readonly participations_count: number;
            readonly total_amount: number;
            readonly total_shares: number;
            readonly user_display_name: string;
            readonly user_email: string;
            readonly user_id: number;
        };
        /**
         * @description جزئیات مشارکت‌کننده برای نمایش در لیست admin participants.
         *
         *     شامل اطلاعات کاربر، Payment و timing.
         */
        AdminParticipantDetail: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /**
             * زمان پرداخت موفق
             * Format: date-time
             */
            readonly paid_at: string | null;
            readonly payment: components["schemas"]["PaymentUserSummary"];
            /** تعداد سهم */
            readonly share_count: number;
            /** قیمت سهم در لحظه خرید (تومان) */
            readonly share_price_snapshot: number;
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarParticipationStatusEnum"];
            readonly status_display: string;
            /** مبلغ کل (تومان) */
            readonly total_amount: number;
            readonly user: components["schemas"]["AdminUserSummary"];
        };
        /** @description خلاصه‌ای از Campaign برای نمایش در داخل Payment ادمین. */
        AdminPaymentCampaignSummary: {
            readonly id: number;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی عنوان به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
            readonly sponsor_name: string;
            /** عنوان حرکت */
            readonly title: string;
        };
        /** @description لیست پرداخت‌ها برای ادمین — همراه کاربر و حرکت. */
        AdminPaymentList: {
            /** مبلغ (تومان) */
            readonly amount: number;
            /** کد رهگیری درگاه (authority) */
            readonly authority: string;
            readonly campaign: components["schemas"]["AdminPaymentCampaignSummary"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * نام درگاه
             * @description مثال: sandbox, zarinpal, idpay
             */
            readonly gateway_name: string;
            readonly id: number;
            /** آدرس IP */
            readonly ip_address: string | null;
            /**
             * زمان پرداخت
             * Format: date-time
             */
            readonly paid_at: string | null;
            /**
             * شناسه مرجع پرداخت (ref_id)
             * @description پس از verify موفق توسط درگاه برگردانده می‌شود.
             */
            readonly ref_id: string;
            readonly share_count: number;
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarPaymentStatusEnum"];
            readonly status_display: string;
            readonly user: components["schemas"]["AdminUserSummary"];
            /**
             * زمان تأیید توسط درگاه
             * Format: date-time
             */
            readonly verified_at: string | null;
        };
        AdminSyncDispatchBadRequestResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminSyncDispatchForbiddenResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminSyncDispatchResponse: {
            data: components["schemas"]["AdminSyncTaskDispatched"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AdminSyncDispatchThrottledResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminSyncStatusForbiddenResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminSyncStatusResponse: {
            data: components["schemas"]["AdminSyncTaskStatus"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description سریالایزر پاسخ زمانی که sync با موفقیت در صف Celery قرار گرفت.
         *
         *     این پاسخ فقط نشان می‌دهد task با موفقیت publish شده است،
         *     نه اینکه اجرا/تمام شده است.
         */
        AdminSyncTaskDispatched: {
            /**
             * @description حالت اجرای sync.
             *
             *     * `full` - full
             *     * `incremental` - incremental
             */
            mode: components["schemas"]["ModeEnum"];
            /** @description مسیری برای پیگیری وضعیت اجرا. */
            status_url: string;
            /** @description شناسه یکتای task برای پیگیری وضعیت. */
            task_id: string;
        };
        /**
         * @description سریالایزر وضعیت یک task پس‌زمینه‌ی sync.
         *
         *     قراردادها:
         *     - `state`: یکی از مقادیر استاندارد Celery (PENDING, STARTED, RETRY,
         *       SUCCESS, FAILURE, REVOKED).
         *     - `ready`: اگر task به وضعیت نهایی رسیده باشد True است.
         *     - `successful`: فقط برای taskهای ready مقدار معنادار دارد.
         *     - `result`: در حالت SUCCESS، آمار sync (همان شکل SyncStats).
         *     - `error`: در حالت FAILURE پیام/نوع خطا برای ادمین.
         */
        AdminSyncTaskStatus: {
            error?: string | null;
            ready: boolean;
            result?: components["schemas"]["SyncStats"] | null;
            state: string;
            successful?: boolean | null;
            task_id: string;
        };
        /**
         * @description سریالایزر درخواست اجرای دستی sync.
         *
         *     این endpoint اجرای sync را به‌صورت async به Celery می‌سپارد و
         *     بلافاصله پاسخ می‌دهد. خود ادمین می‌تواند با task_id وضعیت اجرا
         *     را پیگیری کند.
         */
        AdminSyncTrigger: {
            /**
             * @description حالت همگام‌سازی: full یا incremental
             *
             *     * `full` - full
             *     * `incremental` - incremental
             * @default incremental
             */
            mode: components["schemas"]["ModeEnum"];
        };
        /** @description جزئیات محتوا — ادمین (شامل raw_payload). */
        AdminTabyinContentDetail: {
            /** یادداشت ادمین */
            admin_note?: string;
            readonly attachments: components["schemas"]["TabyinAttachment"][];
            /**
             * نام پدیدآورنده
             * @description مقدار username از محتوانگار.
             */
            author_username?: string;
            /**
             * هش محتوا
             * @description SHA-256 فیلدهای کلیدی برای تشخیص تغییر.
             */
            content_hash?: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** توضیحات */
            description?: string;
            /**
             * شناسه پایدار
             * @description برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
             */
            external_id: string;
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            /** حذف‌شده در منبع */
            is_deleted_in_source?: boolean;
            /**
             * آخرین همگام‌سازی
             * Format: date-time
             */
            last_synced_at?: string | null;
            /** منشأ محتوا */
            origin?: components["schemas"]["OriginEnum"];
            /**
             * داده خام JSON
             * @description کل JSON دریافتی از منبع برای دیباگ و بازیابی.
             */
            raw_payload?: unknown;
            /**
             * زمان بررسی
             * Format: date-time
             */
            reviewed_at?: string | null;
            /** بررسی‌کننده */
            readonly reviewed_by_id: number | null;
            /**
             * تاریخ ایجاد در منبع
             * Format: date-time
             */
            source_created_at?: string | null;
            /**
             * Entity_id منبع
             * Format: int64
             */
            source_entity_id?: number;
            /**
             * وضعیت در منبع
             * Format: int64
             */
            source_status?: number;
            /**
             * نوع در منبع
             * Format: int64
             */
            source_type?: number;
            /**
             * تاریخ ویرایش در منبع
             * Format: date-time
             */
            source_updated_at?: string | null;
            /**
             * لینک محتوا در محتوانگار
             * Format: uri
             */
            source_url?: string;
            /** وضعیت بررسی */
            submission_status?: components["schemas"]["SubmissionStatusEnum"];
            /** ارسال‌کننده */
            readonly submitted_by_id: number | null;
            /** عنوان */
            title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        AdminTabyinContentDetailForbiddenResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinContentDetailNotFoundResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinContentDetailResponse: {
            data: components["schemas"]["AdminTabyinContentDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description لیست محتواها — ادمین (شامل فیلدهای مدیریتی). */
        AdminTabyinContentList: {
            readonly attachments_count: number;
            /**
             * نام پدیدآورنده
             * @description مقدار username از محتوانگار.
             */
            author_username?: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * شناسه پایدار
             * @description برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
             */
            external_id: string;
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            /** حذف‌شده در منبع */
            is_deleted_in_source?: boolean;
            /**
             * آخرین همگام‌سازی
             * Format: date-time
             */
            last_synced_at?: string | null;
            /** منشأ محتوا */
            origin?: components["schemas"]["OriginEnum"];
            /**
             * زمان بررسی
             * Format: date-time
             */
            reviewed_at?: string | null;
            /** بررسی‌کننده */
            readonly reviewed_by_id: number | null;
            /**
             * تاریخ ایجاد در منبع
             * Format: date-time
             */
            source_created_at?: string | null;
            /**
             * وضعیت در منبع
             * Format: int64
             */
            source_status?: number;
            /**
             * نوع در منبع
             * Format: int64
             */
            source_type?: number;
            /**
             * تاریخ ویرایش در منبع
             * Format: date-time
             */
            source_updated_at?: string | null;
            /** وضعیت بررسی */
            submission_status?: components["schemas"]["SubmissionStatusEnum"];
            /** ارسال‌کننده */
            readonly submitted_by_id: number | null;
            /** عنوان */
            title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        AdminTabyinContentListForbiddenResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinContentListResponse: {
            data: components["schemas"]["AdminTabyinContentListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AdminTabyinContentListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["AdminTabyinContentList"][];
        };
        AdminTabyinContentToggleBadRequestResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinContentToggleForbiddenResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinContentToggleNotFoundResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinContentToggleResponse: {
            data: components["schemas"]["AdminTabyinContentDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AdminTabyinSubmissionApproveResponse: {
            data: components["schemas"]["AdminTabyinSubmissionQueue"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AdminTabyinSubmissionDetailResponse: {
            data: components["schemas"]["AdminTabyinSubmissionQueue"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AdminTabyinSubmissionNotFound: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description Admin serializer for reviewing user-submitted content. */
        AdminTabyinSubmissionQueue: {
            /** یادداشت ادمین */
            admin_note?: string;
            readonly attachments: components["schemas"]["TabyinAttachment"][];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** توضیحات */
            description?: string;
            /**
             * شناسه پایدار
             * @description برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
             */
            external_id: string;
            readonly id: number;
            /**
             * زمان بررسی
             * Format: date-time
             */
            reviewed_at?: string | null;
            /** وضعیت بررسی */
            submission_status?: components["schemas"]["SubmissionStatusEnum"];
            /** Format: email */
            readonly submitted_by_email: string;
            /** ارسال‌کننده */
            readonly submitted_by_id: number | null;
            /** عنوان */
            title?: string;
        };
        AdminTabyinSubmissionQueueResponse: {
            data: components["schemas"]["AdminTabyinSubmissionQueueResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AdminTabyinSubmissionQueueResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["AdminTabyinSubmissionQueue"][];
        };
        AdminTabyinSubmissionRejectBadRequest: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinSubmissionRejectNotFound: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinSubmissionRejectResponse: {
            data: components["schemas"]["AdminTabyinSubmissionQueue"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Input serializer for admin approval/rejection of user submissions. */
        AdminTabyinSubmissionReview: {
            admin_note?: string;
        };
        AdminTabyinSubmissionReviewBadRequest: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        AdminTabyinSubmissionReviewNotFound: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description خلاصه‌ای از User برای نمایش در analytics ادمین. */
        AdminUserSummary: {
            readonly display_name: string;
            readonly email: string;
            readonly id: number;
            readonly mobile: string;
        };
        /** @description نمایش کامل audit log شامل changes و extra_data. */
        AuditLogDetail: {
            /** عملیات */
            readonly action: string;
            /** تغییرات */
            readonly changes: unknown;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** هش رویداد */
            readonly event_hash: string;
            /** داده اضافی */
            readonly extra_data: unknown;
            /** نسخه هش */
            readonly hash_version: number;
            readonly id: number;
            /** آدرس IP */
            readonly ip_address: string | null;
            /** متد HTTP */
            readonly method: string;
            /** مسیر درخواست */
            readonly path: string;
            /** هش قبلی */
            readonly previous_hash: string;
            /** شناسه درخواست */
            readonly request_id: string | null;
            /** شناسه منبع */
            readonly resource_id: string | null;
            /** نوع منبع */
            readonly resource_type: string;
            readonly user: components["schemas"]["AuditLogUserInline"] | null;
            readonly user_agent: string;
        };
        AuditLogDetailResponse: {
            data: components["schemas"]["AuditLogDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AuditLogGenericErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description نمایش خلاصه audit log در لیست — بدون changes و extra_data. */
        AuditLogList: {
            /** عملیات */
            readonly action: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /** آدرس IP */
            readonly ip_address: string | null;
            /** متد HTTP */
            readonly method: string;
            /** مسیر درخواست */
            readonly path: string;
            /** شناسه درخواست */
            readonly request_id: string | null;
            /** شناسه منبع */
            readonly resource_id: string | null;
            /** نوع منبع */
            readonly resource_type: string;
            readonly user: components["schemas"]["AuditLogUserInline"] | null;
        };
        AuditLogPaginatedListResponse: {
            data: components["schemas"]["AuditLogPaginatedListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AuditLogPaginatedListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["AuditLogList"][];
        };
        /** @description نمایش خلاصه کاربر در audit log — بدون اطلاعات حساس. */
        AuditLogUserInline: {
            /** Format: email */
            readonly email: string;
            readonly full_name: string;
            readonly id: number;
        };
        AuthenticationEmptySuccessResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AuthenticationGenericErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /**
         * @description * `male` - مرد
         *     * `female` - زن
         * @enum {string}
         */
        AuthGenderEnum: "male" | "female";
        /** @description Read serializer for authentication risk signals. */
        AuthRiskSignal: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly description: string;
            readonly id: number;
            readonly ip_address: string | null;
            readonly metadata: unknown;
            readonly review_note: string;
            /** Format: date-time */
            readonly reviewed_at: string | null;
            /** Format: email */
            readonly reviewed_by_email: string | null;
            readonly session: number | null;
            readonly severity: components["schemas"]["MadadkarRiskSeverityEnum"];
            readonly severity_display: string;
            readonly signal_type: components["schemas"]["AuthRiskSignalTypeEnum"];
            readonly signal_type_display: string;
            readonly status: components["schemas"]["MadadkarRiskStatusEnum"];
            readonly status_display: string;
            readonly user: number;
            /** Format: email */
            readonly user_email: string | null;
        };
        AuthRiskSignalDetailResponse: {
            data: components["schemas"]["AuthRiskSignal"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AuthRiskSignalListResponse: {
            data: components["schemas"]["AuthRiskSignalListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AuthRiskSignalListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["AuthRiskSignal"][];
        };
        /** @description Input serializer for reviewing authentication risk signals. */
        AuthRiskSignalReview: {
            /** @default  */
            review_note: string;
            status: components["schemas"]["RiskReviewStatusEnum"];
        };
        /**
         * @description * `new_device` - دستگاه جدید
         *     * `new_ip` - IP جدید
         *     * `failed_login_spike` - افزایش تلاش ورود ناموفق
         *     * `session_revoke_spike` - افزایش لغو نشست
         * @enum {string}
         */
        AuthRiskSignalTypeEnum: "new_device" | "new_ip" | "failed_login_spike" | "session_revoke_spike";
        /** @description Read serializer for tracked user auth sessions/devices. */
        AuthSession: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly device_label: string;
            /** Format: date-time */
            readonly expires_at: string | null;
            readonly id: number;
            readonly ip_address: string | null;
            readonly is_revoked: boolean;
            /** Format: date-time */
            readonly last_seen_at: string;
            readonly request_id: string;
            /** Format: date-time */
            readonly revoked_at: string | null;
            /** Format: email */
            readonly revoked_by_email: string | null;
            readonly user_agent: string;
        };
        AuthSessionDetailResponse: {
            data: components["schemas"]["AuthSession"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AuthSessionListResponse: {
            data: components["schemas"]["AuthSessionListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        AuthSessionListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["AuthSession"][];
        };
        /** @enum {unknown} */
        BlankEnum: "";
        /** @description ورودی ساخت Campaign توسط ادمین. */
        CampaignAdminCreate: {
            /** Format: uri */
            cover_image: string;
            /** Format: date-time */
            deadline?: string | null;
            description: string;
            /** @default false */
            has_deadline: boolean;
            /** @default false */
            is_visible: boolean;
            sponsor_id: number;
            title: string;
            total_amount: number;
            total_shares: number;
        };
        /** @description جزئیات کامل حرکت برای ادمین — همراه گالری و توضیحات. */
        CampaignAdminDetail: {
            /**
             * زمان بسته شدن
             * Format: date-time
             */
            readonly closed_at: string | null;
            /**
             * زمان تکمیل (۱۰۰٪ فروش)
             * Format: date-time
             */
            readonly completed_at: string | null;
            /**
             * تصویر اصلی
             * Format: uri
             */
            readonly cover_image: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * مهلت پایان
             * Format: date-time
             * @description فقط زمانی استفاده می‌شود که has_deadline=True باشد.
             */
            readonly deadline: string | null;
            readonly description: string;
            readonly gallery_images: components["schemas"]["CampaignImageRead"][];
            /** دارای مهلت زمانی */
            readonly has_deadline: boolean;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly is_fully_funded: boolean;
            /**
             * قابل نمایش در سایت
             * @description در صورت غیرفعال بودن، حرکت در API عمومی نمایش داده نمی‌شود.
             */
            readonly is_visible: boolean;
            /** تعداد مشارکت‌کنندگان یکتا */
            readonly participant_count: number;
            /** Format: double */
            readonly progress_percent: number;
            /**
             * زمان انتشار
             * Format: date-time
             */
            readonly published_at: string | null;
            /**
             * مبلغ جمع‌آوری‌شده (تومان)
             * @description فقط مجموع مبلغ پرداخت‌های قطعی (PAID).
             */
            readonly purchased_amount: number;
            /**
             * سهم‌های فروخته/رزرو شده
             * @description مجموع سهم‌های PAID + PENDING_PAYMENT.
             */
            readonly purchased_shares: number;
            readonly remaining_shares: number;
            /**
             * قیمت هر سهم (تومان)
             * @description به‌صورت خودکار از total_amount / total_shares محاسبه می‌شود.
             */
            readonly share_price: number;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی عنوان به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
            readonly sponsor: components["schemas"]["SponsorPublic"];
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarCampaignStatusEnum"];
            readonly status_display: string;
            /** عنوان حرکت */
            readonly title: string;
            /** مبلغ کل (تومان) */
            readonly total_amount: number;
            /** تعداد کل سهم */
            readonly total_shares: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description لیست حرکت‌ها برای ادمین — همه فیلدهای کلیدی. */
        CampaignAdminList: {
            /**
             * زمان بسته شدن
             * Format: date-time
             */
            readonly closed_at: string | null;
            /**
             * زمان تکمیل (۱۰۰٪ فروش)
             * Format: date-time
             */
            readonly completed_at: string | null;
            /**
             * تصویر اصلی
             * Format: uri
             */
            readonly cover_image: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * مهلت پایان
             * Format: date-time
             * @description فقط زمانی استفاده می‌شود که has_deadline=True باشد.
             */
            readonly deadline: string | null;
            /** دارای مهلت زمانی */
            readonly has_deadline: boolean;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly is_fully_funded: boolean;
            /**
             * قابل نمایش در سایت
             * @description در صورت غیرفعال بودن، حرکت در API عمومی نمایش داده نمی‌شود.
             */
            readonly is_visible: boolean;
            /** تعداد مشارکت‌کنندگان یکتا */
            readonly participant_count: number;
            /** Format: double */
            readonly progress_percent: number;
            /**
             * زمان انتشار
             * Format: date-time
             */
            readonly published_at: string | null;
            /**
             * مبلغ جمع‌آوری‌شده (تومان)
             * @description فقط مجموع مبلغ پرداخت‌های قطعی (PAID).
             */
            readonly purchased_amount: number;
            /**
             * سهم‌های فروخته/رزرو شده
             * @description مجموع سهم‌های PAID + PENDING_PAYMENT.
             */
            readonly purchased_shares: number;
            readonly remaining_shares: number;
            /**
             * قیمت هر سهم (تومان)
             * @description به‌صورت خودکار از total_amount / total_shares محاسبه می‌شود.
             */
            readonly share_price: number;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی عنوان به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
            readonly sponsor: components["schemas"]["SponsorPublic"];
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarCampaignStatusEnum"];
            readonly status_display: string;
            /** عنوان حرکت */
            readonly title: string;
            /** مبلغ کل (تومان) */
            readonly total_amount: number;
            /** تعداد کل سهم */
            readonly total_shares: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description One day in campaign intelligence trend. */
        CampaignDailyTrend: {
            readonly adjustment_delta: number;
            /** Format: date */
            readonly date: string;
            readonly gross_amount: number;
            readonly net_amount: number;
            readonly refund_amount: number;
            readonly successful_payments: number;
        };
        /** @description Serializer for campaign disbursable amount summary. */
        CampaignDisbursableSummary: {
            readonly campaign_id: number;
            readonly committed_disbursement_amount: number;
            readonly disbursable_amount: number;
            readonly net_effective_amount: number;
            readonly paid_disbursement_amount: number;
        };
        /** @description Read serializer for campaign fund disbursement workflow rows. */
        CampaignDisbursement: {
            /** مبلغ تخصیص */
            readonly amount: number;
            /** Format: date-time */
            readonly approved_at: string | null;
            readonly bank_tracking_reference: string;
            /** حرکت */
            readonly campaign: number;
            readonly campaign_title: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly note: string;
            /** Format: date-time */
            readonly paid_at: string | null;
            readonly paid_by: components["schemas"]["AdminUserSummary"];
            /** هدف تخصیص */
            readonly purpose: string;
            /** حساب/شبا مقصد */
            readonly recipient_bank_account: string;
            /** شناسه/کد گیرنده */
            readonly recipient_identifier: string;
            /** نام گیرنده */
            readonly recipient_name: string;
            readonly recipient_snapshot: unknown;
            /** Format: date-time */
            readonly rejected_at: string | null;
            readonly rejection_reason: string;
            readonly requested_by: components["schemas"]["AdminUserSummary"];
            readonly reviewed_by: components["schemas"]["AdminUserSummary"];
            readonly status: components["schemas"]["MadadkarDisbursementStatusEnum"];
            readonly status_display: string;
            readonly supporting_document: unknown;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description Input serializer for requesting a campaign disbursement. */
        CampaignDisbursementCreate: {
            amount: number;
            campaign_id: number;
            /** @default  */
            note: string;
            purpose: string;
            /** @default  */
            recipient_bank_account: string;
            /** @default  */
            recipient_identifier: string;
            recipient_name: string;
            supporting_document?: unknown;
        };
        /** @description Input serializer for marking approved disbursement as paid. */
        CampaignDisbursementMarkPaid: {
            bank_tracking_reference: string;
        };
        /** @description Serializer for admin campaign financial-control summary. */
        CampaignFinancialControlSummary: {
            readonly applied_adjustment_count: number;
            readonly applied_adjustment_delta: number;
            readonly campaign_id: number;
            readonly completed_refund_amount: number;
            readonly completed_refund_count: number;
            readonly gross_paid_amount: number;
            readonly net_effective_amount: number;
            readonly remaining_shares: number;
        };
        /** @description ورودی افزودن تصویر به گالری. */
        CampaignImageCreate: {
            /** @default  */
            alt_text: string;
            display_order?: number | null;
            /** Format: uri */
            image: string;
        };
        /** @description نمایش تصویر گالری. */
        CampaignImageRead: {
            /** متن جایگزین */
            readonly alt_text: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** ترتیب نمایش */
            readonly display_order: number;
            readonly id: number;
            /**
             * تصویر
             * Format: uri
             */
            readonly image: string;
        };
        /** @description Admin campaign intelligence payload with financial, funnel, risk, and health metrics. */
        CampaignIntelligence: {
            readonly campaign_id: number;
            readonly campaign_title: string;
            readonly daily_trend: components["schemas"]["CampaignDailyTrend"][];
            readonly donor_concentration: unknown;
            readonly financials: unknown;
            readonly funnel: unknown;
            /** Format: date-time */
            readonly generated_at: string;
            readonly health: unknown;
            readonly risk: unknown;
            readonly velocity: unknown;
            readonly window_days: number;
        };
        /** @description نمایش جزئیات حرکت در صفحه detail عمومی — همراه گالری و توضیحات کامل. */
        CampaignPublicDetail: {
            /**
             * زمان بسته شدن
             * Format: date-time
             */
            readonly closed_at: string | null;
            /**
             * زمان تکمیل (۱۰۰٪ فروش)
             * Format: date-time
             */
            readonly completed_at: string | null;
            /**
             * تصویر اصلی
             * Format: uri
             */
            readonly cover_image: string;
            /**
             * مهلت پایان
             * Format: date-time
             * @description فقط زمانی استفاده می‌شود که has_deadline=True باشد.
             */
            readonly deadline: string | null;
            readonly description: string;
            readonly gallery_images: components["schemas"]["CampaignImageRead"][];
            /** دارای مهلت زمانی */
            readonly has_deadline: boolean;
            readonly id: number;
            readonly is_fully_funded: boolean;
            /** تعداد مشارکت‌کنندگان یکتا */
            readonly participant_count: number;
            /** Format: double */
            readonly progress_percent: number;
            /**
             * زمان انتشار
             * Format: date-time
             */
            readonly published_at: string | null;
            /**
             * مبلغ جمع‌آوری‌شده (تومان)
             * @description فقط مجموع مبلغ پرداخت‌های قطعی (PAID).
             */
            readonly purchased_amount: number;
            /**
             * سهم‌های فروخته/رزرو شده
             * @description مجموع سهم‌های PAID + PENDING_PAYMENT.
             */
            readonly purchased_shares: number;
            readonly remaining_shares: number;
            /**
             * قیمت هر سهم (تومان)
             * @description به‌صورت خودکار از total_amount / total_shares محاسبه می‌شود.
             */
            readonly share_price: number;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی عنوان به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
            readonly sponsor: components["schemas"]["SponsorPublic"];
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarCampaignStatusEnum"];
            readonly status_display: string;
            /** عنوان حرکت */
            readonly title: string;
            /** مبلغ کل (تومان) */
            readonly total_amount: number;
            /** تعداد کل سهم */
            readonly total_shares: number;
        };
        /** @description نمایش حرکت در لیست عمومی — سبک‌وزن. */
        CampaignPublicList: {
            /**
             * زمان بسته شدن
             * Format: date-time
             */
            readonly closed_at: string | null;
            /**
             * زمان تکمیل (۱۰۰٪ فروش)
             * Format: date-time
             */
            readonly completed_at: string | null;
            /**
             * تصویر اصلی
             * Format: uri
             */
            readonly cover_image: string;
            /**
             * مهلت پایان
             * Format: date-time
             * @description فقط زمانی استفاده می‌شود که has_deadline=True باشد.
             */
            readonly deadline: string | null;
            /** دارای مهلت زمانی */
            readonly has_deadline: boolean;
            readonly id: number;
            readonly is_fully_funded: boolean;
            /** تعداد مشارکت‌کنندگان یکتا */
            readonly participant_count: number;
            /** Format: double */
            readonly progress_percent: number;
            /**
             * زمان انتشار
             * Format: date-time
             */
            readonly published_at: string | null;
            /**
             * مبلغ جمع‌آوری‌شده (تومان)
             * @description فقط مجموع مبلغ پرداخت‌های قطعی (PAID).
             */
            readonly purchased_amount: number;
            /**
             * سهم‌های فروخته/رزرو شده
             * @description مجموع سهم‌های PAID + PENDING_PAYMENT.
             */
            readonly purchased_shares: number;
            readonly remaining_shares: number;
            /**
             * قیمت هر سهم (تومان)
             * @description به‌صورت خودکار از total_amount / total_shares محاسبه می‌شود.
             */
            readonly share_price: number;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی عنوان به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
            readonly sponsor: components["schemas"]["SponsorPublic"];
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarCampaignStatusEnum"];
            readonly status_display: string;
            /** عنوان حرکت */
            readonly title: string;
            /** مبلغ کل (تومان) */
            readonly total_amount: number;
            /** تعداد کل سهم */
            readonly total_shares: number;
        };
        /** @description Public-safe transparency snapshot for a Madadkar campaign. */
        CampaignTransparency: {
            readonly applied_adjustment_delta: number;
            readonly campaign_id: number;
            readonly campaign_slug: string;
            readonly campaign_title: string;
            readonly committed_disbursement_amount: number;
            readonly completed_refund_amount: number;
            readonly completed_refund_count: number;
            /** Format: date-time */
            readonly generated_at: string;
            readonly gross_raised_amount: number;
            /** Format: double */
            readonly net_progress_percent: number;
            readonly net_raised_amount: number;
            readonly paid_disbursement_amount: number;
            readonly paid_disbursement_count: number;
            readonly public_note: string;
            readonly receipt_count: number;
            readonly remaining_disbursable_amount: number;
            readonly sponsor_name: string;
            readonly successful_payment_count: number;
            readonly target_amount: number;
        };
        /** @description User/admin certificate representation. */
        Certificate: {
            readonly certificate_code: string;
            readonly course_id: number;
            readonly course_title: string;
            readonly course_title_snapshot: string;
            readonly full_name_snapshot: string;
            readonly gender_snapshot: string;
            readonly id: number;
            readonly instructor_name_snapshot: string;
            /** Format: date-time */
            readonly issued_at: string;
            readonly national_code_snapshot: string;
            /** Format: uri */
            readonly pdf_file: string | null;
            readonly revocation_reason: string;
            /** Format: date-time */
            readonly revoked_at: string | null;
            /** Format: decimal */
            readonly score_out_of_20: string;
            /** @description Return official certificate statement. */
            readonly statement: string;
            readonly status: components["schemas"]["LMSCertificateStatusEnum"];
            readonly verification_slug: string;
            /** @description Return absolute verification URL when request is available. */
            readonly verification_url: string;
        };
        /** @description Input serializer for admin certificate revocation. */
        CertificateRevoke: {
            reason: string;
        };
        /** @description Public certificate verification serializer. */
        CertificateVerify: {
            readonly certificate_code: string;
            readonly course_title_snapshot: string;
            readonly full_name_snapshot: string;
            readonly gender_snapshot: string;
            readonly instructor_name_snapshot: string;
            /** Format: date-time */
            readonly issued_at: string;
            readonly national_code_snapshot: string;
            /** Format: decimal */
            readonly score_out_of_20: string;
            /** @description Return official certificate statement. */
            readonly statement: string;
            readonly status: components["schemas"]["LMSCertificateStatusEnum"];
        };
        /** @description ChangePasswordSerializer implementation for the authentication application. */
        ChangePassword: {
            new_password: string;
            old_password: string;
        };
        /**
         * @description * `in_app` - داخل سامانه
         *     * `email` - ایمیل
         *     * `sms` - پیامک
         *     * `webhook` - وب‌هوک
         * @enum {string}
         */
        ChannelEnum: "in_app" | "email" | "sms" | "webhook";
        /** @description Serializer for cross-app command center summary. */
        CommandCenterSummary: {
            activity: {
                [key: string]: unknown;
            };
            /** Format: date-time */
            generated_at: string;
            health: {
                [key: string]: unknown;
            };
            kindness_wall: {
                [key: string]: unknown;
            };
            lms: {
                [key: string]: unknown;
            };
            madadkar: {
                [key: string]: unknown;
            };
            notifications: {
                [key: string]: unknown;
            };
            providers: {
                [key: string]: unknown;
            };
            public_reports: {
                [key: string]: unknown;
            };
            r4j: {
                [key: string]: unknown;
            };
            support: {
                [key: string]: unknown;
            };
            tabyin: {
                [key: string]: unknown;
            };
        };
        CommandCenterSummaryResponse: {
            data: components["schemas"]["CommandCenterSummary"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نتیجه چک یک کامپوننت operational. */
        ComponentCheck: {
            /** @description نوع backend یا label امن dependency */
            backend?: string;
            /** @description جزئیات امن خطا یا degraded state */
            detail?: string;
            /**
             * Format: double
             * @description زمان پاسخ به میلی‌ثانیه
             */
            latency_ms?: number;
            /**
             * @description وضعیت این کامپوننت
             *
             *     * `ok` - ok
             *     * `error` - error
             *     * `degraded` - degraded
             */
            status: components["schemas"]["HealthStatusEnum"];
        };
        /** @description Admin analytics summary for a course. */
        CourseAnalytics: {
            active_count: number;
            /** Format: double */
            average_progress_percent: number;
            /** Format: double */
            average_score_out_of_20: number | null;
            completed_count: number;
            graduates_count: number;
            participants_count: number;
            quiz_attempts_count: number;
            quiz_failed_count: number;
            quiz_passed_count: number;
        };
        /** @description Input serializer for course create/update. */
        CourseCreateUpdate: {
            category_id?: number;
            /** Format: uri */
            cover_image?: string | null;
            description?: string;
            /** Format: uri */
            instructor_avatar?: string | null;
            instructor_bio?: string;
            instructor_name?: string;
            /** Format: uri */
            intro_video_url?: string;
            is_active?: boolean;
            is_featured?: boolean;
            language?: string;
            level?: string;
            short_description?: string;
            subtitle?: string;
            title?: string;
        };
        /** @description Detailed course representation including active lessons. */
        CourseDetail: {
            readonly category: components["schemas"]["LMSCategory"];
            /**
             * تصویر کاور
             * Format: uri
             */
            readonly cover_image: string | null;
            /** توضیحات کامل */
            description: string;
            readonly enrollments_count: number;
            readonly estimated_duration_seconds: number;
            readonly graduates_count: number;
            readonly id: number;
            /**
             * تصویر استاد
             * Format: uri
             */
            instructor_avatar?: string | null;
            /** معرفی استاد */
            instructor_bio?: string;
            /** نام استاد */
            readonly instructor_name: string;
            /**
             * ویدئوی معرفی
             * Format: uri
             */
            intro_video_url?: string;
            /** ویژه */
            readonly is_featured: boolean;
            readonly lessons: components["schemas"]["LessonSummary"][];
            readonly lessons_count: number;
            readonly level: components["schemas"]["LMSCourseLevelEnum"];
            /** Format: date-time */
            readonly published_at: string | null;
            /** توضیح کوتاه */
            readonly short_description: string;
            readonly slug: string;
            readonly status: components["schemas"]["LMSCourseStatusEnum"];
            /** زیرعنوان */
            readonly subtitle: string;
            /** عنوان کلاس */
            readonly title: string;
        };
        /** @description Leaderboard row for top LMS learners in a course. */
        CourseLeaderboardItem: {
            badge_level: string;
            /** Format: double */
            best_score_out_of_20: number | null;
            certificate_code: string;
            /** Format: email */
            email: string;
            full_name: string;
            /** Format: double */
            progress_percent: number;
            user_id: number;
        };
        /** @description Admin detailed course report serializer. */
        CourseReport: {
            course: components["schemas"]["CourseSummary"];
            enrollments: components["schemas"]["CourseReportEnrollment"][];
            summary: {
                [key: string]: unknown;
            };
        };
        /** @description Admin report row for one course participant. */
        CourseReportEnrollment: {
            readonly certificate_code: string | null;
            /** Format: date-time */
            readonly completed_at: string | null;
            /** Format: date-time */
            readonly enrolled_at: string;
            readonly full_name: string;
            readonly id: number;
            /** Format: decimal */
            readonly progress_percent: string;
            readonly status: components["schemas"]["LMSEnrollmentStatusEnum"];
            readonly total_seconds_snapshot: number;
            /** Format: email */
            readonly user_email: string;
            readonly user_id: number;
            readonly watched_seconds: number;
        };
        /** @description Compact course representation for course lists. */
        CourseSummary: {
            readonly category: components["schemas"]["LMSCategory"];
            /**
             * تصویر کاور
             * Format: uri
             */
            readonly cover_image: string | null;
            readonly enrollments_count: number;
            readonly estimated_duration_seconds: number;
            readonly graduates_count: number;
            readonly id: number;
            /** نام استاد */
            readonly instructor_name: string;
            /** ویژه */
            readonly is_featured: boolean;
            readonly lessons_count: number;
            readonly level: components["schemas"]["LMSCourseLevelEnum"];
            /** Format: date-time */
            readonly published_at: string | null;
            /** توضیح کوتاه */
            readonly short_description: string;
            readonly slug: string;
            readonly status: components["schemas"]["LMSCourseStatusEnum"];
            /** زیرعنوان */
            readonly subtitle: string;
            /** عنوان کلاس */
            readonly title: string;
        };
        /**
         * @description * `email` - email
         *     * `in_app` - in_app
         * @enum {string}
         */
        DeliveryChannelEnum: "email" | "in_app";
        /** @description چک‌های detailed شامل readiness و diagnosticهای non-critical. */
        DetailedChecks: {
            audit_chain_quick: components["schemas"]["ComponentCheck"];
            cache: components["schemas"]["ComponentCheck"];
            celery_broker: components["schemas"]["ComponentCheck"];
            database: components["schemas"]["ComponentCheck"];
            media_storage: components["schemas"]["ComponentCheck"];
            migration_state: components["schemas"]["ComponentCheck"];
            performance_contracts: unknown;
            tabyin_sync: components["schemas"]["TabyinSyncCheck"];
        };
        /** @description پاسخ کامل health check شامل تمام چک‌ها و اطلاعات سیستم. */
        DetailedHealth: {
            checks: components["schemas"]["DetailedChecks"];
            status: components["schemas"]["HealthStatusEnum"];
            system: components["schemas"]["SystemInfo"];
            /** Format: date-time */
            timestamp: string;
        };
        /** @description Output serializer for discussion reports. */
        DiscussionReport: {
            readonly answer_id: number | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly description: string;
            readonly id: number;
            readonly question_id: number | null;
            readonly reason: string;
            readonly reported_by_id: number;
            /** Format: date-time */
            readonly reviewed_at: string | null;
            readonly reviewed_by_id: number | null;
            readonly status: components["schemas"]["LMSDiscussionReportStatusEnum"];
        };
        /** @description Input serializer for reporting a question or answer. */
        DiscussionReportCreate: {
            /** @default  */
            description: string;
            reason: string;
        };
        /** @description Read serializer for user-owned verifiable donation receipts. */
        DonationReceipt: {
            /** مبلغ رسید */
            readonly amount: number;
            /** حرکت */
            readonly campaign: number;
            readonly campaign_slug: string;
            readonly campaign_snapshot: unknown;
            readonly campaign_title: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly donor_snapshot: unknown;
            readonly hash_version: number;
            readonly id: number;
            /**
             * زمان صدور
             * Format: date-time
             */
            readonly issued_at: string;
            /** Format: date-time */
            readonly last_resent_at: string | null;
            readonly payment_snapshot: unknown;
            readonly receipt_hash: string;
            readonly receipt_number: string;
            readonly resend_count: number;
        };
        /** @description Input serializer for public receipt verification. */
        DonationReceiptPublicVerify: {
            receipt_hash: string;
            receipt_number: string;
        };
        /** @description Empty serializer for documenting receipt resend action. */
        DonationReceiptResend: {
            /** @default email */
            delivery_channel: components["schemas"]["DeliveryChannelEnum"];
        };
        /** @description Public-safe receipt verification result. */
        DonationReceiptVerificationResult: {
            readonly amount: number | null;
            readonly campaign_title: string;
            readonly hash_version: number | null;
            readonly is_valid: boolean;
            /** Format: date-time */
            readonly issued_at: string | null;
            readonly receipt_number: string;
            readonly sponsor_name: string;
        };
        /** @description User enrollment representation. */
        Enrollment: {
            /** Format: date-time */
            readonly completed_at: string | null;
            readonly course: components["schemas"]["CourseSummary"];
            /** Format: date-time */
            readonly enrolled_at: string;
            readonly id: number;
            /** Format: decimal */
            readonly progress_percent: string;
            readonly status: components["schemas"]["LMSEnrollmentStatusEnum"];
            readonly total_seconds_snapshot: number;
            readonly watched_seconds: number;
        };
        /** @description Detailed enrollment serializer including lesson progress records. */
        EnrollmentDetail: {
            /** Format: date-time */
            readonly completed_at: string | null;
            readonly course: components["schemas"]["CourseSummary"];
            /** Format: date-time */
            readonly enrolled_at: string;
            readonly id: number;
            readonly last_accessed_lesson_id: number | null;
            readonly lesson_progress: components["schemas"]["LessonProgress"][];
            /** Format: decimal */
            readonly progress_percent: string;
            readonly status: components["schemas"]["LMSEnrollmentStatusEnum"];
            readonly total_seconds_snapshot: number;
            readonly watched_seconds: number;
        };
        /** @description Read serializer for campaign financial adjustment workflow rows. */
        FinancialAdjustment: {
            readonly adjustment_type: components["schemas"]["MadadkarFinancialAdjustmentTypeEnum"];
            readonly adjustment_type_display: string;
            /** مبلغ اصلاح */
            readonly amount: number;
            /** Format: date-time */
            readonly applied_at: string | null;
            /** حرکت */
            readonly campaign: number;
            readonly campaign_title: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly note: string;
            /** پرداخت مرتبط */
            readonly payment: number | null;
            readonly payment_authority: string | null;
            /** دلیل */
            readonly reason: string;
            readonly rejection_reason: string;
            readonly requested_by: components["schemas"]["AdminUserSummary"];
            /** Format: date-time */
            readonly reviewed_at: string | null;
            readonly reviewed_by: components["schemas"]["AdminUserSummary"];
            readonly signed_amount: number;
            readonly status: components["schemas"]["MadadkarFinancialAdjustmentStatusEnum"];
            readonly status_display: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description Input serializer for creating a financial adjustment request. */
        FinancialAdjustmentCreate: {
            adjustment_type: components["schemas"]["MadadkarFinancialAdjustmentTypeEnum"];
            amount: number;
            campaign_id: number;
            /** @default  */
            note: string;
            payment_id?: number | null;
            reason: string;
        };
        /** @description Input serializer for rejecting a financial adjustment request. */
        FinancialAdjustmentReject: {
            rejection_reason: string;
        };
        /** @description ForgotPasswordSerializer implementation for the authentication application. */
        ForgotPassword: {
            /** Format: email */
            email: string;
        };
        /**
         * @description * `ok` - ok
         *     * `error` - error
         *     * `degraded` - degraded
         * @enum {string}
         */
        HealthStatusEnum: "ok" | "error" | "degraded";
        /**
         * @description Request OTP for attaching or verifying a secondary identifier.
         *
         *     Supported:
         *     - add a missing secondary identifier
         *     - re-verify the same attached but unverified identifier
         *
         *     Not supported:
         *     - replacing an existing identifier in the same channel
         */
        IdentifierAddRequest: {
            identifier: string;
        };
        /** @description Verify OTP for attaching or verifying a secondary identifier. */
        IdentifierAddVerify: {
            code: string;
            identifier: string;
        };
        /** @description Confirm password reset by identifier + OTP + new password. */
        IdentifierForgotPasswordConfirm: {
            code: string;
            identifier: string;
            new_password: string;
        };
        /** @description Request password reset OTP by identifier. */
        IdentifierForgotPasswordRequest: {
            identifier: string;
        };
        /**
         * @description * `email` - ایمیل
         *     * `phone` - شماره موبایل
         * @enum {string}
         */
        IdentifierKindEnum: "email" | "phone";
        /** @description Switch primary identifier to an already attached + verified channel. */
        IdentifierMakePrimary: {
            identifier_kind: components["schemas"]["IdentifierKindEnum"];
        };
        /** @description Admin analytics summary serializer. */
        KindnessAdminAnalytics: {
            active_matches: number;
            category_distribution: {
                [key: string]: unknown;
            }[];
            city_distribution: {
                [key: string]: unknown;
            }[];
            contact_reveals: number;
            duplicate_candidates: number;
            /** Format: date-time */
            generated_at: string;
            match_effectiveness: {
                [key: string]: unknown;
            };
            need_help_listings: number;
            offer_help_listings: number;
            pending_listings: number;
            pending_reports: number;
            province_distribution: {
                [key: string]: unknown;
            }[];
            published_listings: number;
            report_distribution: {
                [key: string]: unknown;
            }[];
            status_distribution: {
                [key: string]: unknown;
            }[];
            top_revealed_listings: {
                [key: string]: unknown;
            }[];
            top_viewed_listings: {
                [key: string]: unknown;
            }[];
            total_listings: number;
            type_distribution: {
                [key: string]: unknown;
            }[];
        };
        /** @description Admin input serializer for creating/updating tree categories. */
        KindnessAdminCategoryInput: {
            /** @default  */
            description: string;
            /** @default  */
            icon: string;
            is_active?: boolean;
            order?: number;
            parent_id?: number | null;
            title: string;
        };
        KindnessAdminCategoryResponse: {
            data: components["schemas"]["KindnessCategory"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Admin audit serializer for contact reveal rows. */
        KindnessAdminContactReveal: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly ip_address: string | null;
            readonly listing_id: number;
            readonly listing_owner_id: number;
            readonly listing_title: string;
            /** @description Return listing owner display name. */
            readonly owner_full_name: string;
            readonly phone_snapshot: string;
            readonly request_id: string;
            /** @description Return viewer display name. */
            readonly viewer_full_name: string;
            readonly viewer_id: number;
        };
        KindnessAdminContactRevealListResponse: {
            data: components["schemas"]["KindnessAdminContactRevealListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessAdminContactRevealListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessAdminContactReveal"][];
        };
        KindnessAdminDuplicateListResponse: {
            data: components["schemas"]["KindnessAdminDuplicateListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessAdminDuplicateListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessDuplicateCandidate"][];
        };
        KindnessAdminDuplicateReviewResponse: {
            data: components["schemas"]["KindnessDuplicateCandidate"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessAdminListingListResponse: {
            data: components["schemas"]["KindnessAdminListingListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessAdminListingListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessUserListingDetail"][];
        };
        /** @description Admin serializer exposing both sides of a generated match. */
        KindnessAdminMatch: {
            readonly algorithm_version: number;
            /** Format: date-time */
            readonly contacted_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** Format: date-time */
            readonly dismissed_at: string | null;
            readonly dismissed_by_id: number | null;
            readonly explanation: string;
            /** Format: date-time */
            readonly generated_at: string;
            readonly id: number;
            readonly reason_codes: unknown;
            readonly score: number;
            readonly score_breakdown: unknown;
            readonly source_listing: components["schemas"]["KindnessListingList"];
            readonly status: components["schemas"]["KindnessMatchStatusEnum"];
            readonly target_listing: components["schemas"]["KindnessListingList"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        KindnessAdminMatchDetailResponse: {
            data: components["schemas"]["KindnessAdminMatch"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessAdminMatchListResponse: {
            data: components["schemas"]["KindnessAdminMatchListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessAdminMatchListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessAdminMatch"][];
        };
        /** @description User bookmark serializer with optimized listing card. */
        KindnessBookmark: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly listing: components["schemas"]["KindnessListingList"];
        };
        /** @description Category tree row serializer. */
        KindnessCategory: {
            /**
             * تصویر کاور
             * Format: uri
             */
            readonly cover_image: string | null;
            readonly depth: number;
            /** توضیحات */
            readonly description: string;
            /** آیکن */
            readonly icon: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly listings_count: number;
            readonly order: number;
            /** دسته والد */
            readonly parent_id: number | null;
            readonly path: string;
            readonly published_listings_count: number;
            readonly slug: string;
            /** عنوان دسته */
            readonly title: string;
        };
        KindnessCategoryListResponse: {
            data: components["schemas"]["KindnessCategory"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Response serializer for contact reveal endpoint. */
        KindnessContactReveal: {
            listing_id: number;
            owner_full_name: string;
            phone_number: string;
        };
        KindnessContactRevealResponse: {
            data: components["schemas"]["KindnessContactReveal"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Admin serializer for likely duplicate listings. */
        KindnessDuplicateCandidate: {
            readonly candidate_listing: components["schemas"]["KindnessListingList"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly listing: components["schemas"]["KindnessListingList"];
            readonly reason: string;
            readonly score: number;
            readonly status: components["schemas"]["SupportDuplicateReviewStatusEnum"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description Input serializer for duplicate candidate review. */
        KindnessDuplicateReview: {
            /** @default  */
            reason: string;
            status: string;
        };
        /** @description Input serializer for user listing create/update. */
        KindnessListingCreateUpdate: {
            address_hint?: string;
            category_id?: number;
            city?: string;
            description?: string;
            district?: string;
            /** Format: decimal */
            latitude?: string | null;
            listing_type?: components["schemas"]["ListingTypeEnum"];
            /** Format: decimal */
            longitude?: string | null;
            province?: string;
            title?: string;
        };
        /** @description Public detail serializer with contact availability but without raw phone. */
        KindnessListingDetail: {
            address_hint?: string;
            readonly category: components["schemas"]["KindnessCategory"];
            readonly city: string;
            /** @description Return whether contact can be revealed via dedicated endpoint. */
            readonly contact_available: boolean;
            /** @description Return cover image URL if available. */
            readonly cover_image: string | null;
            description: string;
            readonly district: string;
            /** Format: date-time */
            readonly expires_at: string | null;
            readonly id: number;
            readonly images: components["schemas"]["KindnessListingImage"][];
            readonly listing_type: components["schemas"]["ListingTypeEnum"];
            readonly owner_avatar_snapshot: string;
            readonly owner_full_name_snapshot: string;
            readonly province: string;
            /** Format: date-time */
            readonly published_at: string | null;
            readonly slug: string;
            readonly title: string;
            readonly view_count: number;
        };
        KindnessListingDetailResponse: {
            data: components["schemas"]["KindnessListingDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Listing image serializer. */
        KindnessListingImage: {
            readonly alt_text: string;
            readonly caption: string;
            readonly height: number;
            readonly id: number;
            /** Format: uri */
            readonly image: string;
            readonly is_cover: boolean;
            readonly order: number;
            readonly width: number;
        };
        /** @description Public listing card serializer; never exposes contact phone. */
        KindnessListingList: {
            readonly category: components["schemas"]["KindnessCategory"];
            readonly city: string;
            /** @description Return cover image URL if available. */
            readonly cover_image: string | null;
            readonly district: string;
            /** Format: date-time */
            readonly expires_at: string | null;
            readonly id: number;
            readonly listing_type: components["schemas"]["ListingTypeEnum"];
            readonly owner_avatar_snapshot: string;
            readonly owner_full_name_snapshot: string;
            readonly province: string;
            /** Format: date-time */
            readonly published_at: string | null;
            readonly slug: string;
            readonly title: string;
            readonly view_count: number;
        };
        KindnessListingListResponse: {
            data: components["schemas"]["KindnessListingListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessListingListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessListingList"][];
        };
        /** @description Report output serializer. */
        KindnessListingReport: {
            readonly admin_note: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly description: string;
            readonly id: number;
            readonly listing_id: number;
            readonly listing_title: string;
            readonly reason: components["schemas"]["KindnessReportReasonEnum"];
            readonly reported_by_id: number;
            /** Format: date-time */
            readonly reviewed_at: string | null;
            readonly reviewed_by_id: number | null;
            readonly status: components["schemas"]["LMSDiscussionReportStatusEnum"];
        };
        /** @description Input serializer for reporting a listing. */
        KindnessListingReportCreate: {
            /** @default  */
            description: string;
            reason: components["schemas"]["KindnessReportReasonEnum"];
        };
        KindnessListingReportResponse: {
            data: components["schemas"]["KindnessListingReport"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Serializer for smart match results. */
        KindnessMatch: {
            readonly explanation: string;
            /** Format: date-time */
            readonly generated_at: string;
            readonly id: number;
            readonly reason_codes: unknown;
            readonly score: number;
            readonly score_breakdown: unknown;
            readonly status: components["schemas"]["KindnessMatchStatusEnum"];
            readonly target_listing: components["schemas"]["KindnessListingList"];
        };
        KindnessMatchListResponse: {
            data: components["schemas"]["KindnessMatchListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessMatchListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessMatch"][];
        };
        /**
         * @description * `active` - فعال
         *     * `dismissed` - نادیده‌گرفته‌شده
         *     * `contacted` - تماس گرفته‌شده
         *     * `stale` - قدیمی
         *     * `expired` - منقضی‌شده
         * @enum {string}
         */
        KindnessMatchStatusEnum: "active" | "dismissed" | "contacted" | "stale" | "expired";
        /**
         * @description * `spam` - اسپم
         *     * `fraud` - مشکوک به سوءاستفاده
         *     * `wrong_category` - دسته‌بندی اشتباه
         *     * `inappropriate` - محتوای نامناسب
         *     * `duplicate` - تکراری
         *     * `expired` - منقضی‌شده
         *     * `contact_invalid` - شماره تماس نامعتبر
         *     * `other` - سایر
         * @enum {string}
         */
        KindnessReportReasonEnum: "spam" | "fraud" | "wrong_category" | "inappropriate" | "duplicate" | "expired" | "contact_invalid" | "other";
        KindnessUserBookmarkListResponse: {
            data: components["schemas"]["KindnessUserBookmarkListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessUserBookmarkListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessBookmark"][];
        };
        /** @description Owner/admin listing serializer with workflow metadata and contact snapshot. */
        KindnessUserListingDetail: {
            readonly address_hint: string;
            readonly admin_note: string;
            readonly bookmark_count: number;
            readonly category: components["schemas"]["KindnessCategory"];
            readonly city: string;
            /** @description Return whether contact can be revealed via dedicated endpoint. */
            readonly contact_available: boolean;
            readonly contact_phone_snapshot: string;
            readonly contact_reveal_count: number;
            /** @description Return cover image URL if available. */
            readonly cover_image: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly description: string;
            readonly district: string;
            /** Format: date-time */
            readonly expires_at: string | null;
            readonly id: number;
            readonly images: components["schemas"]["KindnessListingImage"][];
            /** Format: date-time */
            readonly last_matched_at: string | null;
            /** Format: decimal */
            readonly latitude: string | null;
            readonly listing_type: components["schemas"]["ListingTypeEnum"];
            /** Format: decimal */
            readonly longitude: string | null;
            readonly owner_avatar_snapshot: string;
            readonly owner_full_name_snapshot: string;
            readonly province: string;
            /** Format: date-time */
            readonly published_at: string | null;
            readonly rejection_reason: string;
            readonly report_count: number;
            readonly slug: string;
            readonly status: components["schemas"]["KindnessUserListingDetailStatusEnum"];
            readonly suspension_reason: string;
            readonly title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            readonly view_count: number;
        };
        KindnessUserListingDetailResponse: {
            data: components["schemas"]["KindnessUserListingDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `draft` - پیش‌نویس
         *     * `pending_review` - در انتظار بررسی
         *     * `published` - منتشرشده
         *     * `rejected` - ردشده
         *     * `needs_edit` - نیازمند ویرایش
         *     * `suspended` - تعلیق‌شده
         *     * `closed` - بسته‌شده
         *     * `expired` - منقضی‌شده
         *     * `deleted` - حذف‌شده
         * @enum {string}
         */
        KindnessUserListingDetailStatusEnum: "draft" | "pending_review" | "published" | "rejected" | "needs_edit" | "suspended" | "closed" | "expired" | "deleted";
        KindnessUserListingListResponse: {
            data: components["schemas"]["KindnessUserListingListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        KindnessUserListingListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["KindnessUserListingDetail"][];
        };
        KindnessWallErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description Read serializer for xAPI-like learning activity statements. */
        LearningActivityStatement: {
            readonly actor: number;
            /** Format: email */
            readonly actor_email: string | null;
            readonly actor_snapshot: unknown;
            readonly certificate: number | null;
            readonly context: unknown;
            readonly course: number;
            readonly course_title: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly enrollment: number | null;
            readonly id: number;
            readonly idempotency_key: string | null;
            readonly lesson: number | null;
            readonly lesson_title: string | null;
            readonly object_id: string;
            readonly object_snapshot: unknown;
            readonly object_type: string;
            /** Format: date-time */
            readonly occurred_at: string;
            readonly quiz_attempt: number | null;
            readonly result: unknown;
            /** Format: uuid */
            readonly statement_id: string;
            readonly verb: components["schemas"]["LMSLearningStatementVerbEnum"];
            readonly verb_display: string;
        };
        /** @description One learner course recommendation with explanation. */
        LearningRecommendationItem: {
            readonly course: components["schemas"]["CourseSummary"];
            readonly reason_codes: string[];
            readonly score: number;
        };
        /** @description Admin overview of recommendation readiness. */
        LearningRecommendationOverview: {
            readonly cold_start_courses: number;
            readonly featured_courses: number;
            readonly published_courses: number;
            readonly top_recommendable_courses: {
                [key: string]: unknown;
            }[];
        };
        /** @description Output serializer for lesson answers. */
        LessonAnswer: {
            readonly body: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly is_accepted: boolean;
            readonly is_instructor_answer: boolean;
            readonly status: components["schemas"]["LMSDiscussionStatusEnum"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            /** @description Return safe display name for answer author. */
            readonly user_display: string;
            readonly user_id: number;
        };
        /** @description Input serializer for creating a lesson answer. */
        LessonAnswerCreate: {
            body: string;
        };
        /** @description Input serializer for lesson create/update. */
        LessonCreateUpdate: {
            /** Format: uri */
            attachment_file?: string | null;
            attachment_title?: string;
            description?: string;
            duration_seconds?: number;
            /** Format: uri */
            embed_url?: string;
            homework?: string;
            is_active?: boolean;
            is_preview?: boolean;
            order?: number;
            summary?: string;
            title?: string;
            transcript?: string;
            /** Format: uri */
            video_file?: string | null;
            video_provider?: string;
            /** Format: uri */
            video_url?: string;
        };
        /** @description Signed/CDN-ready lesson media access payload. */
        LessonMediaAccess: {
            course_id: number;
            expires_in_seconds?: number | null;
            lesson_id: number;
            media_kind: string;
            provider: string;
            title?: string;
            url: string;
        };
        /** @description Output serializer for lesson progress state. */
        LessonProgress: {
            /** Format: date-time */
            readonly completed_at: string | null;
            readonly duration_seconds_snapshot: number;
            /** Format: date-time */
            readonly first_watched_at: string | null;
            readonly id: number;
            readonly is_completed: boolean;
            readonly last_position_seconds: number;
            /** Format: date-time */
            readonly last_watched_at: string | null;
            readonly lesson: components["schemas"]["LessonSummary"];
            /** Format: decimal */
            readonly progress_percent: string;
            readonly watched_seconds: number;
        };
        /** @description Input serializer for lesson progress updates. */
        LessonProgressUpdate: {
            last_position_seconds?: number;
            watched_seconds: number;
        };
        /** @description Output serializer for lesson questions with nested visible answers. */
        LessonQuestion: {
            readonly answer_count: number;
            readonly answers: components["schemas"]["LessonAnswer"][];
            readonly body: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly is_answered: boolean;
            readonly is_pinned: boolean;
            /** Format: date-time */
            readonly last_activity_at: string;
            readonly lesson_id: number;
            readonly status: components["schemas"]["LMSDiscussionStatusEnum"];
            readonly title: string;
            /** @description Return safe display name for question author. */
            readonly user_display: string;
            readonly user_id: number;
        };
        /** @description Input serializer for creating a lesson question. */
        LessonQuestionCreate: {
            body: string;
            title: string;
        };
        /** @description Compact lesson representation for course detail pages. */
        LessonSummary: {
            /** Format: uri */
            readonly attachment_file: string | null;
            readonly attachment_title: string;
            readonly description: string;
            readonly duration_seconds: number;
            /** Format: uri */
            readonly embed_url: string;
            readonly id: number;
            readonly is_preview: boolean;
            readonly order: number;
            readonly slug: string;
            readonly summary: string;
            readonly title: string;
            readonly video_provider: components["schemas"]["LMSVideoProviderEnum"];
            /** Format: uri */
            readonly video_url: string;
        };
        /** @description Read serializer for lesson video processing jobs. */
        LessonVideoProcessingJob: {
            /** Format: date-time */
            readonly completed_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly duration_seconds: number;
            readonly error_message: string;
            readonly id: number;
            readonly lesson: number;
            readonly lesson_title: string;
            readonly metadata: unknown;
            /** Format: uri */
            readonly output_video_url: string;
            readonly provider: string;
            readonly requested_by: number | null;
            readonly source_file_name: string;
            /** Format: date-time */
            readonly started_at: string | null;
            readonly status: components["schemas"]["LMSVideoProcessingStatusEnum"];
            readonly status_display: string;
            /** Format: uri */
            readonly thumbnail_url: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /**
         * @description * `need_help` - نیاز به کمک دارم
         *     * `offer_help` - می‌خواهم کمک کنم
         * @enum {string}
         */
        ListingTypeEnum: "need_help" | "offer_help";
        /**
         * @description * `bronze` - برنزی
         *     * `silver` - نقره‌ای
         *     * `gold` - طلایی
         *     * `distinction` - نشان ممتاز
         * @enum {string}
         */
        LMSBadgeLevelEnum: "bronze" | "silver" | "gold" | "distinction";
        /** @description Public/admin category representation. */
        LMSCategory: {
            /**
             * تصویر کاور
             * Format: uri
             */
            cover_image?: string | null;
            /** توضیحات */
            description?: string;
            /** آیکن */
            icon?: string;
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            /**
             * ترتیب نمایش
             * Format: int64
             */
            order?: number;
            readonly slug: string;
            /** عنوان دسته‌بندی */
            title: string;
        };
        /** @description Input serializer for category create/update. */
        LMSCategoryCreateUpdate: {
            description?: string;
            icon?: string;
            is_active?: boolean;
            order?: number;
            title?: string;
        };
        LMSCategoryDeletedResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCategoryListResponse: {
            data: components["schemas"]["LMSCategory"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCategoryResponse: {
            data: components["schemas"]["LMSCategory"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCertificateListResponse: {
            data: components["schemas"]["LMSCertificateListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCertificateListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["Certificate"][];
        };
        LMSCertificateResponse: {
            data: components["schemas"]["Certificate"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `issued` - صادرشده
         *     * `revoked` - باطل‌شده
         * @enum {string}
         */
        LMSCertificateStatusEnum: "issued" | "revoked";
        LMSCertificateVerifyResponse: {
            data: components["schemas"]["CertificateVerify"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCourseAnalyticsResponse: {
            data: components["schemas"]["CourseAnalytics"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCourseDeletedResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCourseLeaderboardResponse: {
            data: components["schemas"]["CourseLeaderboardItem"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `beginner` - مقدماتی
         *     * `intermediate` - متوسط
         *     * `advanced` - پیشرفته
         *     * `professional` - حرفه‌ای
         * @enum {string}
         */
        LMSCourseLevelEnum: "beginner" | "intermediate" | "advanced" | "professional";
        LMSCourseListResponse: {
            data: components["schemas"]["LMSCourseListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCourseListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["CourseSummary"][];
        };
        LMSCourseReportResponse: {
            data: components["schemas"]["CourseReport"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSCourseResponse: {
            data: components["schemas"]["CourseDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `draft` - پیش‌نویس
         *     * `published` - منتشرشده
         *     * `archived` - آرشیوشده
         * @enum {string}
         */
        LMSCourseStatusEnum: "draft" | "published" | "archived";
        LMSDiscussionReportListResponse: {
            data: components["schemas"]["LMSDiscussionReportListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSDiscussionReportListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["DiscussionReport"][];
        };
        LMSDiscussionReportResponse: {
            data: components["schemas"]["DiscussionReport"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `pending` - در انتظار بررسی
         *     * `reviewed` - بررسی‌شده
         *     * `rejected` - رد گزارش
         * @enum {string}
         */
        LMSDiscussionReportStatusEnum: "pending" | "reviewed" | "rejected";
        /**
         * @description * `visible` - قابل نمایش
         *     * `hidden` - مخفی
         *     * `deleted` - حذف‌شده
         *     * `flagged` - گزارش‌شده
         * @enum {string}
         */
        LMSDiscussionStatusEnum: "visible" | "hidden" | "deleted" | "flagged";
        LMSEnrollmentDetailResponse: {
            data: components["schemas"]["EnrollmentDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSEnrollmentListResponse: {
            data: components["schemas"]["LMSEnrollmentListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSEnrollmentListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["Enrollment"][];
        };
        LMSEnrollmentResponse: {
            data: components["schemas"]["Enrollment"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `active` - فعال
         *     * `completed` - تکمیل‌شده
         *     * `canceled` - لغوشده
         *     * `locked` - قفل‌شده
         * @enum {string}
         */
        LMSEnrollmentStatusEnum: "active" | "completed" | "canceled" | "locked";
        LMSErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        LMSLearningRecommendationOverviewResponse: {
            data: components["schemas"]["LearningRecommendationOverview"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLearningRecommendationResponse: {
            data: components["schemas"]["LearningRecommendationItem"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLearningStatementListResponse: {
            data: components["schemas"]["LMSLearningStatementListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLearningStatementListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["LearningActivityStatement"][];
        };
        /**
         * @description * `initialized` - شروع شد
         *     * `progressed` - پیشرفت کرد
         *     * `completed` - تکمیل شد
         *     * `passed` - قبول شد
         *     * `failed` - مردود شد
         *     * `certificate_issued` - مدرک صادر شد
         * @enum {string}
         */
        LMSLearningStatementVerbEnum: "initialized" | "progressed" | "completed" | "passed" | "failed" | "certificate_issued";
        LMSLessonAnswerResponse: {
            data: components["schemas"]["LessonAnswer"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLessonDeletedResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLessonListResponse: {
            data: components["schemas"]["LessonSummary"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLessonMediaAccessResponse: {
            data: components["schemas"]["LessonMediaAccess"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLessonProgressResponse: {
            data: components["schemas"]["LessonProgress"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLessonQuestionListResponse: {
            data: components["schemas"]["LMSLessonQuestionListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLessonQuestionListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["LessonQuestion"][];
        };
        LMSLessonQuestionResponse: {
            data: components["schemas"]["LessonQuestion"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSLessonResponse: {
            data: components["schemas"]["LessonSummary"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSQuizAdminResponse: {
            data: components["schemas"]["QuizAdmin"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSQuizAttemptResponse: {
            data: components["schemas"]["QuizAttemptDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `in_progress` - در حال انجام
         *     * `submitted` - ثبت‌شده
         *     * `passed` - قبول‌شده
         *     * `failed` - مردود
         *     * `expired` - منقضی‌شده
         *     * `locked` - قفل‌شده
         * @enum {string}
         */
        LMSQuizAttemptStatusEnum: "in_progress" | "submitted" | "passed" | "failed" | "expired" | "locked";
        LMSQuizOptionResponse: {
            data: components["schemas"]["QuizOptionAdmin"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSQuizPublicResponse: {
            data: components["schemas"]["QuizPublic"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSQuizQuestionResponse: {
            data: components["schemas"]["QuizQuestionAdmin"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSQuizUnlockResponse: {
            data: components["schemas"]["QuizUnlock"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LMSSkillListResponse: {
            data: components["schemas"]["LMSUserSkill"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Serializer for profile-visible LMS skills and badges. */
        LMSUserSkill: {
            readonly badge_level: components["schemas"]["LMSBadgeLevelEnum"];
            readonly certificate_code: string;
            readonly course_title: string;
            readonly id: number;
            /** Format: date-time */
            readonly issued_at: string;
            readonly slug: string;
            readonly title: string;
        };
        LMSVideoProcessingJobResponse: {
            data: components["schemas"]["LessonVideoProcessingJob"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `queued` - در صف
         *     * `processing` - در حال پردازش
         *     * `completed` - تکمیل‌شده
         *     * `failed` - ناموفق
         *     * `canceled` - لغوشده
         * @enum {string}
         */
        LMSVideoProcessingStatusEnum: "queued" | "processing" | "completed" | "failed" | "canceled";
        /**
         * @description * `direct_url` - لینک مستقیم
         *     * `embed` - Embed
         *     * `uploaded_file` - فایل آپلودی
         *     * `hybrid` - ترکیبی
         * @enum {string}
         */
        LMSVideoProviderEnum: "direct_url" | "embed" | "uploaded_file" | "hybrid";
        /** @description LoginSerializer implementation for the authentication application. */
        Login: {
            /** Format: email */
            email: string;
            password: string;
        };
        /** @description Password-based login with either email or phone number. */
        LoginPassword: {
            identifier: string;
            password: string;
        };
        LoginResponseData: {
            tokens: components["schemas"]["LoginTokensResponse"];
            user: components["schemas"]["UserMe"];
        };
        LoginSuccessResponse: {
            data: components["schemas"]["LoginResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        LoginTokensResponse: {
            access: string;
            refresh: string;
        };
        /** @description LogoutSerializer implementation for the authentication application. */
        Logout: {
            refresh: string;
        };
        MadadkarAdminAdjustmentDetailResponse: {
            data: components["schemas"]["FinancialAdjustment"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminAdjustmentsListResponse: {
            data: components["schemas"]["MadadkarAdminAdjustmentsListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminAdjustmentsListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["FinancialAdjustment"][];
        };
        MadadkarAdminCampaignAnalyticsResponse: {
            data: components["schemas"]["AdminCampaignAnalytics"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminCampaignDetailResponse: {
            data: components["schemas"]["CampaignAdminDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminCampaignImageListResponse: {
            data: components["schemas"]["CampaignImageRead"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminCampaignImageResponse: {
            data: components["schemas"]["CampaignImageRead"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminCampaignIntelligenceResponse: {
            data: components["schemas"]["CampaignIntelligence"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminCampaignListResponse: {
            data: components["schemas"]["MadadkarAdminCampaignListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminCampaignListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["CampaignAdminList"][];
        };
        MadadkarAdminDisbursableSummaryResponse: {
            data: components["schemas"]["CampaignDisbursableSummary"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminDisbursementDetailResponse: {
            data: components["schemas"]["CampaignDisbursement"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminDisbursementListResponse: {
            data: components["schemas"]["MadadkarAdminDisbursementListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminDisbursementListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["CampaignDisbursement"][];
        };
        MadadkarAdminFinancialControlResponse: {
            data: components["schemas"]["CampaignFinancialControlSummary"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminFinancialControlSnapshotDetailResponse: {
            data: components["schemas"]["MadadkarFinancialControlSnapshot"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminFinancialControlSnapshotListResponse: {
            data: components["schemas"]["MadadkarAdminFinancialControlSnapshotListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminFinancialControlSnapshotListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["MadadkarFinancialControlSnapshot"][];
        };
        MadadkarAdminIntelligenceOverviewResponse: {
            data: components["schemas"]["MadadkarIntelligenceOverview"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminLeaderboardResponse: {
            data: components["schemas"]["AdminLeaderboardEntry"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminParticipantsListResponse: {
            data: components["schemas"]["MadadkarAdminParticipantsListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminParticipantsListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["AdminParticipantDetail"][];
        };
        MadadkarAdminPaymentsListResponse: {
            data: components["schemas"]["MadadkarAdminPaymentsListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminPaymentsListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["AdminPaymentList"][];
        };
        MadadkarAdminReconciliationBatchDetailResponse: {
            data: components["schemas"]["PaymentReconciliationBatch"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminReconciliationBatchListResponse: {
            data: components["schemas"]["MadadkarAdminReconciliationBatchListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminReconciliationBatchListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["PaymentReconciliationBatch"][];
        };
        MadadkarAdminReconciliationItemListResponse: {
            data: components["schemas"]["MadadkarAdminReconciliationItemListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminReconciliationItemListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["PaymentReconciliationItem"][];
        };
        MadadkarAdminRefundDetailResponse: {
            data: components["schemas"]["PaymentRefund"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminRefundsListResponse: {
            data: components["schemas"]["MadadkarAdminRefundsListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminRefundsListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["PaymentRefund"][];
        };
        MadadkarAdminRiskSignalDetailResponse: {
            data: components["schemas"]["MadadkarRiskSignal"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminRiskSignalsListResponse: {
            data: components["schemas"]["MadadkarAdminRiskSignalsListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminRiskSignalsListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["MadadkarRiskSignal"][];
        };
        MadadkarAdminSponsorDetailResponse: {
            data: components["schemas"]["SponsorAdmin"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminSponsorListResponse: {
            data: components["schemas"]["MadadkarAdminSponsorListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarAdminSponsorListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["SponsorAdmin"][];
        };
        /**
         * @description * `draft` - پیش‌نویس
         *     * `published` - منتشرشده
         *     * `completed` - تکمیل‌شده
         *     * `closed` - بسته‌شده
         * @enum {string}
         */
        MadadkarCampaignStatusEnum: "draft" | "published" | "completed" | "closed";
        /**
         * @description * `requested` - درخواست‌شده
         *     * `approved` - تأییدشده
         *     * `rejected` - ردشده
         *     * `paid` - پرداخت‌شده
         *     * `canceled` - لغوشده
         * @enum {string}
         */
        MadadkarDisbursementStatusEnum: "requested" | "approved" | "rejected" | "paid" | "canceled";
        MadadkarEmptySuccessResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `pending_review` - در انتظار بررسی
         *     * `approved` - تأییدشده
         *     * `rejected` - ردشده
         *     * `applied` - اعمال‌شده
         * @enum {string}
         */
        MadadkarFinancialAdjustmentStatusEnum: "pending_review" | "approved" | "rejected" | "applied";
        /**
         * @description * `credit` - افزایش مبلغ مؤثر
         *     * `debit` - کاهش مبلغ مؤثر
         * @enum {string}
         */
        MadadkarFinancialAdjustmentTypeEnum: "credit" | "debit";
        /** @description Read serializer for automated finance-ops control snapshots. */
        MadadkarFinancialControlSnapshot: {
            readonly controls: unknown;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly flags: unknown;
            readonly generated_by_task_id: string;
            /** Format: date */
            readonly generated_for_date: string;
            readonly id: number;
            readonly severity: components["schemas"]["MadadkarFinancialControlSnapshotSeverityEnum"];
            readonly severity_display: string;
            readonly summary: unknown;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /**
         * @description * `healthy` - سالم
         *     * `watch` - نیازمند پایش
         *     * `warning` - هشدار
         *     * `critical` - بحرانی
         * @enum {string}
         */
        MadadkarFinancialControlSnapshotSeverityEnum: "healthy" | "watch" | "warning" | "critical";
        MadadkarGenericErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description Portfolio-level Madadkar intelligence overview for command decisions. */
        MadadkarIntelligenceOverview: {
            /** Format: date-time */
            readonly generated_at: string;
            readonly portfolio: unknown;
            readonly strongest_campaigns: unknown;
            readonly weakest_campaigns: unknown;
            readonly window_days: number;
        };
        MadadkarParticipationInitiatedResponse: {
            data: components["schemas"]["ParticipationInitiatedResponse"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `pending_payment` - در انتظار پرداخت
         *     * `paid` - پرداخت‌شده
         *     * `failed` - ناموفق
         *     * `expired` - منقضی‌شده
         *     * `refunded` - بازپرداخت‌شده
         * @enum {string}
         */
        MadadkarParticipationStatusEnum: "pending_payment" | "paid" | "failed" | "expired" | "refunded";
        /**
         * @description * `pending` - در انتظار
         *     * `success` - موفق
         *     * `failed` - ناموفق
         * @enum {string}
         */
        MadadkarPaymentStatusEnum: "pending" | "success" | "failed";
        MadadkarPaymentVerifyResponse: {
            data: components["schemas"]["PaymentVerifyResult"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarPublicCampaignDetailResponse: {
            data: components["schemas"]["CampaignPublicDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarPublicCampaignListResponse: {
            data: components["schemas"]["MadadkarPublicCampaignListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarPublicCampaignListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["CampaignPublicList"][];
        };
        MadadkarPublicCampaignTransparencyResponse: {
            data: components["schemas"]["CampaignTransparency"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarPublicReceiptVerifyResponse: {
            data: components["schemas"]["DonationReceiptVerificationResult"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarPublicSponsorDetailResponse: {
            data: components["schemas"]["SponsorPublic"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarPublicSponsorListResponse: {
            data: components["schemas"]["MadadkarPublicSponsorListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarPublicSponsorListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["SponsorPublic"][];
        };
        /**
         * @description * `duplicate_payment` - پرداخت تکراری
         *     * `user_request` - درخواست کاربر
         *     * `campaign_canceled` - لغو حرکت
         *     * `provider_reversal` - برگشت از سمت درگاه
         *     * `admin_correction` - اصلاح ادمین
         *     * `other` - سایر
         * @enum {string}
         */
        MadadkarRefundReasonEnum: "duplicate_payment" | "user_request" | "campaign_canceled" | "provider_reversal" | "admin_correction" | "other";
        /**
         * @description * `pending_review` - در انتظار بررسی
         *     * `approved` - تأییدشده
         *     * `rejected` - ردشده
         *     * `completed` - تکمیل‌شده
         *     * `failed` - ناموفق
         * @enum {string}
         */
        MadadkarRefundStatusEnum: "pending_review" | "approved" | "rejected" | "completed" | "failed";
        /**
         * @description * `low` - کم
         *     * `medium` - متوسط
         *     * `high` - زیاد
         *     * `critical` - بحرانی
         * @enum {string}
         */
        MadadkarRiskSeverityEnum: "low" | "medium" | "high" | "critical";
        /** @description Read serializer for Madadkar financial risk signals. */
        MadadkarRiskSignal: {
            readonly adjustment: number | null;
            readonly campaign: number | null;
            readonly campaign_title: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly description: string;
            readonly id: number;
            readonly ip_address: string | null;
            readonly metadata: unknown;
            readonly payment: number | null;
            readonly payment_authority: string | null;
            readonly refund: number | null;
            readonly review_note: string;
            /** Format: date-time */
            readonly reviewed_at: string | null;
            readonly reviewed_by: components["schemas"]["AdminUserSummary"];
            readonly severity: components["schemas"]["MadadkarRiskSeverityEnum"];
            readonly severity_display: string;
            readonly signal_type: components["schemas"]["MadadkarRiskSignalTypeEnum"];
            readonly signal_type_display: string;
            readonly status: components["schemas"]["MadadkarRiskStatusEnum"];
            readonly status_display: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            readonly user: components["schemas"]["AdminUserSummary"];
        };
        /** @description Input serializer for reviewing/dismissing/escalating risk signals. */
        MadadkarRiskSignalReview: {
            /** @default  */
            review_note: string;
            status: components["schemas"]["RiskReviewStatusEnum"];
        };
        /**
         * @description * `high_amount_new_user` - مشارکت مبلغ بالا توسط کاربر جدید
         *     * `payment_failure_spike` - افزایش شکست پرداخت
         *     * `suspicious_ip_velocity` - سرعت غیرعادی پرداخت از IP
         *     * `refund_velocity` - افزایش درخواست بازپرداخت
         *     * `campaign_refund_spike` - افزایش بازپرداخت در حرکت
         *     * `adjustment_anomaly` - اصلاح مالی غیرعادی
         * @enum {string}
         */
        MadadkarRiskSignalTypeEnum: "high_amount_new_user" | "payment_failure_spike" | "suspicious_ip_velocity" | "refund_velocity" | "campaign_refund_spike" | "adjustment_anomaly";
        /**
         * @description * `open` - باز
         *     * `reviewed` - بررسی‌شده
         *     * `dismissed` - ردشده
         *     * `escalated` - ارجاع‌شده
         * @enum {string}
         */
        MadadkarRiskStatusEnum: "open" | "reviewed" | "dismissed" | "escalated";
        MadadkarUserParticipationDetailResponse: {
            data: components["schemas"]["ParticipationUserDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarUserParticipationListResponse: {
            data: components["schemas"]["MadadkarUserParticipationListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarUserParticipationListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["ParticipationUserList"][];
        };
        MadadkarUserReceiptDetailResponse: {
            data: components["schemas"]["DonationReceipt"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarUserReceiptListResponse: {
            data: components["schemas"]["MadadkarUserReceiptListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        MadadkarUserReceiptListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["DonationReceipt"][];
        };
        /**
         * @description * `user_message` - پیام کاربر
         *     * `admin_reply` - پاسخ ادمین
         *     * `internal_note` - یادداشت داخلی
         *     * `system_event` - رویداد سیستمی
         *     * `status_change` - تغییر وضعیت
         *     * `assignment_change` - تغییر مسئول
         *     * `sla_event` - رویداد SLA
         * @enum {string}
         */
        MessageTypeEnum: "user_message" | "admin_reply" | "internal_note" | "system_event" | "status_change" | "assignment_change" | "sla_event";
        /**
         * @description * `full` - full
         *     * `incremental` - incremental
         * @enum {string}
         */
        ModeEnum: "full" | "incremental";
        /** @description User notification delivery serializer. */
        NotificationDelivery: {
            readonly body: string;
            readonly channel: components["schemas"]["ChannelEnum"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /** Format: date-time */
            readonly read_at: string | null;
            /** Format: date-time */
            readonly sent_at: string | null;
            readonly status: components["schemas"]["NotificationDeliveryStatusEnum"];
            readonly subject: string;
        };
        /**
         * @description * `pending` - در انتظار
         *     * `sent` - ارسال‌شده
         *     * `failed` - ناموفق
         *     * `skipped` - ردشده
         *     * `read` - خوانده‌شده
         * @enum {string}
         */
        NotificationDeliveryStatusEnum: "pending" | "sent" | "failed" | "skipped" | "read";
        /** @description Admin notification event serializer. */
        NotificationEvent: {
            readonly aggregate_id: string;
            readonly aggregate_type: string;
            readonly attempt_count: number;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly deliveries_count: number;
            readonly event_type: string;
            readonly id: number;
            readonly last_error: string;
            readonly priority: components["schemas"]["SupportTicketPriorityEnum"];
            /** Format: date-time */
            readonly processed_at: string | null;
            readonly status: components["schemas"]["NotificationEventStatusEnum"];
            /** Format: uuid */
            readonly uuid: string;
        };
        /**
         * @description * `pending` - در انتظار ارسال
         *     * `processing` - در حال پردازش
         *     * `sent` - ارسال‌شده
         *     * `partial` - ارسال ناقص
         *     * `failed` - ناموفق
         *     * `cancelled` - لغوشده
         * @enum {string}
         */
        NotificationEventStatusEnum: "pending" | "processing" | "sent" | "partial" | "failed" | "cancelled";
        /** @description User notification preference serializer. */
        NotificationPreference: {
            readonly channel: components["schemas"]["ChannelEnum"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly enabled: boolean;
            readonly event_type: string;
            readonly id: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description Admin notification template serializer. */
        NotificationTemplate: {
            readonly body_template: string;
            readonly channel: components["schemas"]["ChannelEnum"];
            readonly code: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly description: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly subject_template: string;
            readonly title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /**
         * @description * `external` - همگام‌سازی خارجی
         *     * `user_submitted` - ارسالی کاربر
         * @enum {string}
         */
        OriginEnum: "external" | "user_submitted";
        /** @description Request login OTP for an existing identifier. */
        OTPLoginRequest: {
            identifier: string;
        };
        /** @description Verify login OTP and issue JWT tokens. */
        OTPLoginVerify: {
            code: string;
            identifier: string;
        };
        /** @description خلاصه‌ای از Campaign برای نمایش در داخل Participation. */
        ParticipationCampaignSummary: {
            /**
             * تصویر اصلی
             * Format: uri
             */
            readonly cover_image: string;
            readonly id: number;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی عنوان به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
            readonly sponsor: components["schemas"]["SponsorPublic"];
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarCampaignStatusEnum"];
            readonly status_display: string;
            /** عنوان حرکت */
            readonly title: string;
        };
        /**
         * @description ورودی شروع مشارکت توسط کاربر.
         *
         *     کاربر یک share_count می‌دهد (تعداد سهم درخواستی).
         *     قیمت سهم و مبلغ کل از Campaign استخراج می‌شود (snapshot در service).
         *
         *     نکات اختیاری:
         *     - mobile/email: برخی درگاه‌ها از این‌ها استفاده می‌کنند.
         *       اگر ارسال نشوند، از پروفایل کاربر استخراج می‌شوند.
         */
        ParticipationInitiate: {
            /**
             * Format: email
             * @description ایمیل برای ارسال به درگاه (اختیاری).
             * @default
             */
            email: string;
            /**
             * @description شماره موبایل برای ارسال به درگاه (اختیاری).
             * @default
             */
            mobile: string;
            /** @description تعداد سهمی که می‌خواهید خریداری کنید (حداقل ۱). */
            share_count: number;
        };
        /**
         * @description پاسخ موفقیت‌آمیز شروع مشارکت.
         *
         *     شامل اطلاعات Participation و URL مقصد درگاه.
         *     کاربر باید به gateway_url ریدایرکت شود.
         */
        ParticipationInitiatedResponse: {
            /** @description کد رهگیری پرداخت — برای پیگیری و تأیید. */
            readonly authority: string;
            /**
             * Format: uri
             * @description URL کامل درگاه پرداخت — کاربر باید به این URL ریدایرکت شود.
             */
            readonly gateway_url: string;
            readonly participation: components["schemas"]["ParticipationUserDetail"];
        };
        /** @description جزئیات مشارکت کاربر — همراه پرداخت. */
        ParticipationUserDetail: {
            readonly campaign: components["schemas"]["ParticipationCampaignSummary"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /**
             * زمان پرداخت موفق
             * Format: date-time
             */
            readonly paid_at: string | null;
            readonly payment: components["schemas"]["PaymentUserSummary"];
            /** تعداد سهم */
            readonly share_count: number;
            /** قیمت سهم در لحظه خرید (تومان) */
            readonly share_price_snapshot: number;
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarParticipationStatusEnum"];
            readonly status_display: string;
            /** مبلغ کل (تومان) */
            readonly total_amount: number;
        };
        /** @description لیست مشارکت‌های کاربر — سبک‌وزن. */
        ParticipationUserList: {
            readonly campaign: components["schemas"]["ParticipationCampaignSummary"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /**
             * زمان پرداخت موفق
             * Format: date-time
             */
            readonly paid_at: string | null;
            /** تعداد سهم */
            readonly share_count: number;
            /** قیمت سهم در لحظه خرید (تومان) */
            readonly share_price_snapshot: number;
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarParticipationStatusEnum"];
            readonly status_display: string;
            /** مبلغ کل (تومان) */
            readonly total_amount: number;
        };
        /** @description سریالایزر فعال/غیرفعال کردن محتوا. */
        PatchedAdminTabyinContentToggle: {
            /** @description آیا محتوا در سایت عمومی نمایش داده شود؟ */
            is_active?: boolean;
        };
        /** @description AdminUserUpdateSerializer implementation for the authentication application. */
        PatchedAdminUserUpdate: {
            first_name?: string;
            is_active?: boolean;
            is_email_verified?: boolean;
            last_name?: string;
        };
        /** @description ورودی ویرایش Campaign توسط ادمین. */
        PatchedCampaignAdminUpdate: {
            /** Format: uri */
            cover_image?: string;
            /** Format: date-time */
            deadline?: string | null;
            description?: string;
            has_deadline?: boolean;
            is_visible?: boolean;
            sponsor_id?: number;
            title?: string;
            total_amount?: number;
            total_shares?: number;
        };
        /** @description Input serializer for course create/update. */
        PatchedCourseCreateUpdate: {
            category_id?: number;
            /** Format: uri */
            cover_image?: string | null;
            description?: string;
            /** Format: uri */
            instructor_avatar?: string | null;
            instructor_bio?: string;
            instructor_name?: string;
            /** Format: uri */
            intro_video_url?: string;
            is_active?: boolean;
            is_featured?: boolean;
            language?: string;
            level?: string;
            short_description?: string;
            subtitle?: string;
            title?: string;
        };
        /** @description Input serializer for admin discussion moderation. */
        PatchedDiscussionModeration: {
            is_accepted?: boolean;
            is_pinned?: boolean;
            status?: components["schemas"]["LMSDiscussionStatusEnum"];
        };
        /** @description Input serializer for admin report review. */
        PatchedDiscussionReportReview: {
            status?: components["schemas"]["LMSDiscussionReportStatusEnum"];
        };
        /** @description Category tree row serializer. */
        PatchedKindnessCategory: {
            /**
             * تصویر کاور
             * Format: uri
             */
            readonly cover_image?: string | null;
            readonly depth?: number;
            /** توضیحات */
            readonly description?: string;
            /** آیکن */
            readonly icon?: string;
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly listings_count?: number;
            readonly order?: number;
            /** دسته والد */
            readonly parent_id?: number | null;
            readonly path?: string;
            readonly published_listings_count?: number;
            readonly slug?: string;
            /** عنوان دسته */
            readonly title?: string;
        };
        /** @description Owner/admin listing serializer with workflow metadata and contact snapshot. */
        PatchedKindnessUserListingDetail: {
            readonly address_hint?: string;
            readonly admin_note?: string;
            readonly bookmark_count?: number;
            readonly category?: components["schemas"]["KindnessCategory"];
            readonly city?: string;
            /** @description Return whether contact can be revealed via dedicated endpoint. */
            readonly contact_available?: boolean;
            readonly contact_phone_snapshot?: string;
            readonly contact_reveal_count?: number;
            /** @description Return cover image URL if available. */
            readonly cover_image?: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at?: string;
            readonly description?: string;
            readonly district?: string;
            /** Format: date-time */
            readonly expires_at?: string | null;
            readonly id?: number;
            readonly images?: components["schemas"]["KindnessListingImage"][];
            /** Format: date-time */
            readonly last_matched_at?: string | null;
            /** Format: decimal */
            readonly latitude?: string | null;
            readonly listing_type?: components["schemas"]["ListingTypeEnum"];
            /** Format: decimal */
            readonly longitude?: string | null;
            readonly owner_avatar_snapshot?: string;
            readonly owner_full_name_snapshot?: string;
            readonly province?: string;
            /** Format: date-time */
            readonly published_at?: string | null;
            readonly rejection_reason?: string;
            readonly report_count?: number;
            readonly slug?: string;
            readonly status?: components["schemas"]["KindnessUserListingDetailStatusEnum"];
            readonly suspension_reason?: string;
            readonly title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at?: string;
            readonly view_count?: number;
        };
        /** @description Input serializer for lesson create/update. */
        PatchedLessonCreateUpdate: {
            /** Format: uri */
            attachment_file?: string | null;
            attachment_title?: string;
            description?: string;
            duration_seconds?: number;
            /** Format: uri */
            embed_url?: string;
            homework?: string;
            is_active?: boolean;
            is_preview?: boolean;
            order?: number;
            summary?: string;
            title?: string;
            transcript?: string;
            /** Format: uri */
            video_file?: string | null;
            video_provider?: string;
            /** Format: uri */
            video_url?: string;
        };
        /** @description Input serializer for category create/update. */
        PatchedLMSCategoryCreateUpdate: {
            description?: string;
            icon?: string;
            is_active?: boolean;
            order?: number;
            title?: string;
        };
        /** @description ورودی ویرایش پروفایل criminal توسط admin. */
        PatchedR4JCriminalUpdate: {
            /** Format: date */
            birth_date?: string | null;
            city?: string;
            country?: string;
            crimes_summary?: string;
            description?: string;
            first_name?: string;
            gender?: components["schemas"]["R4JGenderEnum"];
            last_name?: string;
            national_code?: string;
            other_info?: string;
            province?: string;
        };
        /** @description ورودی upsert تنظیمات visibility. */
        PatchedR4JFieldVisibilityUpsert: {
            field_name?: string;
            is_public?: boolean;
        };
        /** @description ورودی ویرایش شماره تماس. */
        PatchedR4JPhoneUpdate: {
            is_public?: boolean;
            label?: string;
            notes?: string;
            number?: string;
        };
        /** @description ورودی ویرایش شبکه اجتماعی. */
        PatchedR4JSocialUpdate: {
            handle_or_url?: string;
            is_public?: boolean;
            platform?: components["schemas"]["R4JSocialPlatformEnum"];
        };
        /** @description ReportStatusUpdateSerializer implementation for the public_reports application. */
        PatchedReportStatusUpdate: {
            admin_note?: string;
            status?: components["schemas"]["ReportStatusEnum"];
        };
        /** @description ReportSubjectUpdateSerializer implementation for the public_reports application. */
        PatchedReportSubjectUpdate: {
            description?: string;
            is_active?: boolean;
            order?: number;
            title?: string;
        };
        /** @description ورودی ویرایش Sponsor توسط ادمین — تمام فیلدها اختیاری. */
        PatchedSponsorUpdate: {
            /** Format: uri */
            logo?: string | null;
            name?: string;
        };
        /** @description Admin business-hours calendar serializer. */
        PatchedSupportBusinessCalendar: {
            /** @description 0=Monday ... 6=Sunday */
            readonly active_weekdays?: unknown;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at?: string;
            readonly department?: components["schemas"]["SupportDepartment"];
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly is_default?: boolean;
            readonly timezone_name?: string;
            readonly title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at?: string;
            /** Format: time */
            readonly workday_end?: string;
            /** Format: time */
            readonly workday_start?: string;
        };
        /** @description Admin canned response serializer. */
        PatchedSupportCannedResponse: {
            readonly body?: string;
            readonly category?: components["schemas"]["SupportCategory"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at?: string;
            readonly department?: components["schemas"]["SupportDepartment"];
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at?: string;
            readonly usage_count?: number;
        };
        /** @description Public support tree category serializer. */
        PatchedSupportCategory: {
            readonly department?: components["schemas"]["SupportDepartment"];
            readonly depth?: number;
            readonly description?: string;
            readonly icon?: string;
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly order?: number;
            readonly parent_id?: number | null;
            readonly path?: string;
            readonly slug?: string;
            readonly title?: string;
        };
        /** @description Public department serializer for support routing. */
        PatchedSupportDepartment: {
            readonly description?: string;
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly order?: number;
            readonly slug?: string;
            readonly title?: string;
            /** Format: uuid */
            readonly uuid?: string;
        };
        /** @description Admin support holiday serializer. */
        PatchedSupportHoliday: {
            readonly calendar?: components["schemas"]["SupportBusinessCalendar"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at?: string;
            /** Format: date */
            readonly date?: string;
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at?: string;
        };
        /** @description Admin input serializer for support knowledge base articles. */
        PatchedSupportKnowledgeArticleInput: {
            body?: string;
            category_id?: number | null;
            department_id?: number | null;
            is_active?: boolean;
            keywords?: string[];
            /** @default draft */
            status: components["schemas"]["LMSCourseStatusEnum"];
            /** @default  */
            summary: string;
            ticket_type_id?: number | null;
            title?: string;
        };
        /** @description Admin SLA policy serializer. */
        PatchedSupportSLAPolicy: {
            readonly business_hours_only?: boolean;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at?: string;
            readonly department?: components["schemas"]["SupportDepartment"];
            readonly escalate_on_breach?: boolean;
            readonly first_response_minutes?: number;
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly order?: number;
            readonly pause_when_waiting_for_user?: boolean;
            readonly priority?: components["schemas"]["SupportTicketPriorityEnum"];
            readonly resolution_minutes?: number;
            readonly severity?: components["schemas"]["SupportTicketSeverityEnum"];
            readonly slug?: string;
            readonly title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at?: string;
        };
        /** @description Input serializer for creating/updating user tickets. */
        PatchedSupportTicketCreateUpdate: {
            category_id?: number | null;
            description?: string;
            subject?: string;
            ticket_type_id?: number;
        };
        /** @description Public dynamic ticket type serializer. */
        PatchedSupportTicketType: {
            readonly code?: string;
            readonly default_category?: components["schemas"]["SupportCategory"];
            readonly default_department?: components["schemas"]["SupportDepartment"];
            readonly default_priority?: components["schemas"]["SupportTicketPriorityEnum"];
            readonly default_severity?: components["schemas"]["SupportTicketSeverityEnum"];
            readonly default_sla_policy?: components["schemas"]["SupportSLAPolicySummary"];
            readonly description?: string;
            readonly id?: number;
            /** فعال */
            readonly is_active?: boolean;
            readonly order?: number;
            readonly title?: string;
        };
        /** @description UpdateMeSerializer implementation for the authentication application. */
        PatchedUpdateMe: {
            first_name?: string;
            last_name?: string;
        };
        /** @description UpdateProfileSerializer implementation for the authentication application. */
        PatchedUpdateProfile: {
            address?: string;
            /** Format: uri */
            avatar?: string | null;
            bio?: string;
            /** Format: date */
            birth_date?: string | null;
            city?: string;
            gender?: components["schemas"]["AuthGenderEnum"] | components["schemas"]["BlankEnum"];
            national_code?: string;
            phone_number?: string;
            province?: string;
        };
        /** @description Read serializer for provider settlement reconciliation batches. */
        PaymentReconciliationBatch: {
            /** Format: date-time */
            readonly completed_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly duplicate_provider_ref_count: number;
            readonly id: number;
            readonly matched_count: number;
            readonly mismatch_count: number;
            readonly missing_internal_count: number;
            /** نام درگاه */
            readonly provider_name: string;
            /** نام فایل/گزارش */
            readonly source_name: string;
            readonly status: components["schemas"]["PaymentReconciliationBatchStatusEnum"];
            readonly status_display: string;
            readonly summary: unknown;
            readonly total_rows: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /**
         * @description * `draft` - پیش‌نویس
         *     * `completed` - تکمیل‌شده
         *     * `failed` - ناموفق
         * @enum {string}
         */
        PaymentReconciliationBatchStatusEnum: "draft" | "completed" | "failed";
        /** @description Input serializer for uploading a provider settlement report. */
        PaymentReconciliationImport: {
            /** Format: uri */
            file: string;
            provider_name: string;
            /** @default  */
            source_name: string;
        };
        /** @description Read serializer for one provider/internal reconciliation comparison row. */
        PaymentReconciliationItem: {
            readonly authority: string;
            readonly batch: number;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly internal_amount: number | null;
            readonly internal_status: string;
            readonly payment: number | null;
            readonly provider_amount: number;
            readonly provider_ref_id: string;
            readonly provider_status: string;
            readonly raw_payload: unknown;
            readonly reason: string;
            readonly status: components["schemas"]["PaymentReconciliationItemStatusEnum"];
            readonly status_display: string;
        };
        /**
         * @description * `matched` - تطبیق موفق
         *     * `missing_internal` - در سیستم داخلی پیدا نشد
         *     * `amount_mismatch` - عدم تطابق مبلغ
         *     * `status_mismatch` - عدم تطابق وضعیت
         *     * `duplicate_provider_ref` - شناسه تکراری در گزارش درگاه
         * @enum {string}
         */
        PaymentReconciliationItemStatusEnum: "matched" | "missing_internal" | "amount_mismatch" | "status_mismatch" | "duplicate_provider_ref";
        /** @description Read serializer for refund workflow rows. */
        PaymentRefund: {
            /** مبلغ بازپرداخت */
            readonly amount: number;
            readonly campaign_id: number;
            /** Format: date-time */
            readonly completed_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly idempotency_key: string | null;
            readonly is_full_refund: boolean;
            /** یادداشت */
            readonly note: string;
            /** پرداخت */
            readonly payment: number;
            readonly payment_authority: string;
            /** شناسه بازپرداخت درگاه */
            readonly provider_ref_id: string;
            /** دلیل */
            readonly reason: components["schemas"]["MadadkarRefundReasonEnum"];
            readonly reason_display: string;
            /** دلیل رد */
            readonly rejection_reason: string;
            readonly requested_by: components["schemas"]["AdminUserSummary"];
            /** Format: date-time */
            readonly reviewed_at: string | null;
            readonly reviewed_by: components["schemas"]["AdminUserSummary"];
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarRefundStatusEnum"];
            readonly status_display: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description Input serializer for creating a payment refund request. */
        PaymentRefundRequest: {
            amount: number;
            /** @default  */
            idempotency_key: string;
            /** @default  */
            note: string;
            payment_id: number;
            /** @default other */
            reason: components["schemas"]["MadadkarRefundReasonEnum"];
        };
        /** @description خلاصه پرداخت برای نمایش در داخل Participation detail. */
        PaymentUserSummary: {
            /** مبلغ (تومان) */
            readonly amount: number;
            /** کد رهگیری درگاه (authority) */
            readonly authority: string;
            /**
             * نام درگاه
             * @description مثال: sandbox, zarinpal, idpay
             */
            readonly gateway_name: string;
            readonly id: number;
            /**
             * زمان پرداخت
             * Format: date-time
             */
            readonly paid_at: string | null;
            /**
             * شناسه مرجع پرداخت (ref_id)
             * @description پس از verify موفق توسط درگاه برگردانده می‌شود.
             */
            readonly ref_id: string;
            /** وضعیت */
            readonly status: components["schemas"]["MadadkarPaymentStatusEnum"];
            readonly status_display: string;
            /**
             * زمان تأیید توسط درگاه
             * Format: date-time
             */
            readonly verified_at: string | null;
        };
        /**
         * @description ورودی callback تأیید پرداخت از سمت درگاه.
         *
         *     اکثر درگاه‌ها (Zarinpal, IDPay) با query params برمی‌گردانند:
         *     - Authority: کد رهگیری
         *     - Status: وضعیت اولیه (OK / NOK)
         *
         *     ما این فیلدها را به‌صورت اختیاری دریافت می‌کنیم و در service
         *     با provider verify می‌کنیم (status اولیه قابل اعتماد نیست).
         */
        PaymentVerifyCallback: {
            /** @description کد رهگیری پرداخت برگشتی از درگاه. */
            authority: string;
            /**
             * @description وضعیت اولیه از سمت درگاه (OK/NOK) — قابل اعتماد نیست.
             * @default
             */
            status: string;
        };
        /** @description پاسخ نتیجه verify — برای نمایش به کاربر. */
        PaymentVerifyResult: {
            /** @description آیا پرداخت نهایی موفق بود؟ */
            readonly is_verified: boolean;
            readonly message: string;
            readonly participation: components["schemas"]["ParticipationUserDetail"];
            readonly payment_status: string;
            readonly payment_status_display: string;
        };
        /** @description ProfileSerializer implementation for the authentication application. */
        Profile: {
            /** آدرس */
            address?: string;
            /**
             * عکس پروفایل
             * Format: uri
             */
            avatar?: string | null;
            /** درباره من */
            bio?: string;
            /**
             * تاریخ تولد
             * Format: date
             */
            birth_date?: string | null;
            /** شهر */
            city?: string;
            /** جنسیت */
            gender?: components["schemas"]["AuthGenderEnum"] | components["schemas"]["BlankEnum"];
            /** کد ملی */
            national_code?: string;
            readonly phone_number: string | null;
            /** استان */
            province?: string;
        };
        ProfileSuccessResponse: {
            data: components["schemas"]["Profile"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        PublicReportsEmptySuccessResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        PublicReportsGenericErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /**
         * @description جزئیات یک محتوا — نمایش عمومی.
         *
         *     اطلاعات بیشتر نسبت به لیست.
         */
        PublicTabyinContentDetail: {
            readonly attachments: components["schemas"]["TabyinAttachment"][];
            /**
             * نام پدیدآورنده
             * @description مقدار username از محتوانگار.
             */
            author_username?: string;
            /** توضیحات */
            description?: string;
            /**
             * شناسه پایدار
             * @description برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
             */
            external_id: string;
            /** منشأ محتوا */
            origin?: components["schemas"]["OriginEnum"];
            readonly primary_media_type: string;
            /**
             * تاریخ ایجاد در منبع
             * Format: date-time
             */
            source_created_at?: string | null;
            /**
             * Entity_id منبع
             * Format: int64
             */
            source_entity_id?: number;
            /**
             * تاریخ ویرایش در منبع
             * Format: date-time
             */
            source_updated_at?: string | null;
            /**
             * لینک محتوا در محتوانگار
             * Format: uri
             */
            source_url?: string;
            /** عنوان */
            title?: string;
        };
        PublicTabyinContentDetailNotFoundResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        PublicTabyinContentDetailResponse: {
            data: components["schemas"]["PublicTabyinContentDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description لیست محتواها — نمایش عمومی.
         *
         *     فقط فیلدهای ضروری برای نمایش در گالری.
         */
        PublicTabyinContentList: {
            readonly attachments: components["schemas"]["TabyinAttachment"][];
            /**
             * نام پدیدآورنده
             * @description مقدار username از محتوانگار.
             */
            author_username?: string;
            /** توضیحات */
            description?: string;
            /**
             * شناسه پایدار
             * @description برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
             */
            external_id: string;
            /** منشأ محتوا */
            origin?: components["schemas"]["OriginEnum"];
            readonly primary_media_type: string;
            /**
             * تاریخ ایجاد در منبع
             * Format: date-time
             */
            source_created_at?: string | null;
            /**
             * لینک محتوا در محتوانگار
             * Format: uri
             */
            source_url?: string;
            /** عنوان */
            title?: string;
        };
        PublicTabyinContentListResponse: {
            data: components["schemas"]["PublicTabyinContentListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        PublicTabyinContentListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["PublicTabyinContentList"][];
        };
        /** @description Admin serializer for full quiz configuration. */
        QuizAdmin: {
            readonly course_id: number;
            description?: string;
            readonly id: number;
            is_required_for_certificate?: boolean;
            /** Format: int64 */
            max_attempts?: number;
            /** Format: decimal */
            passing_score?: string;
            /** Format: date-time */
            readonly published_at: string | null;
            readonly questions: components["schemas"]["QuizQuestionAdmin"][];
            /** Format: int64 */
            retake_delay_days?: number;
            show_correct_answers_after_pass?: boolean;
            show_result_immediately?: boolean;
            shuffle_options?: boolean;
            shuffle_questions?: boolean;
            status?: components["schemas"]["LMSCourseStatusEnum"];
            /** Format: int64 */
            time_limit_minutes?: number;
            title: string;
        };
        /** @description Attempt detail serializer hiding correct answers unless attempt is passed. */
        QuizAttemptDetail: {
            /** @description Return submitted answers; correct answers only after passing. */
            readonly answers: {
                [key: string]: unknown;
            }[];
            readonly attempt_number: number;
            readonly course_id: number;
            /** Format: date-time */
            readonly expires_at: string | null;
            readonly id: number;
            readonly is_passed: boolean;
            /** @description Return questions in snapshot order. */
            readonly questions: {
                [key: string]: unknown;
            }[];
            readonly quiz_id: number;
            /** Format: decimal */
            readonly score_out_of_20: string;
            /** Format: decimal */
            readonly score_percent: string;
            /** Format: date-time */
            readonly started_at: string;
            readonly status: components["schemas"]["LMSQuizAttemptStatusEnum"];
            /** Format: date-time */
            readonly submitted_at: string | null;
        };
        /** @description Input serializer for submitting a quiz attempt. */
        QuizAttemptSubmit: {
            answers: {
                [key: string]: number;
            }[];
        };
        /** @description Input serializer for admin quiz create/update. */
        QuizCreateUpdate: {
            description?: string;
            is_required_for_certificate?: boolean;
            max_attempts?: number;
            /** Format: decimal */
            passing_score?: string;
            retake_delay_days?: number;
            show_correct_answers_after_pass?: boolean;
            show_result_immediately?: boolean;
            shuffle_options?: boolean;
            shuffle_questions?: boolean;
            time_limit_minutes?: number;
            title?: string;
        };
        /** @description Admin serializer exposing correct option flags. */
        QuizOptionAdmin: {
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            is_correct?: boolean;
            /** Format: int64 */
            order?: number;
            text: string;
        };
        /** @description Input serializer for admin quiz option creation. */
        QuizOptionCreate: {
            /** @default false */
            is_correct: boolean;
            /** @default 1 */
            order: number;
            text: string;
        };
        /** @description User-visible quiz metadata without answers. */
        QuizPublic: {
            readonly course_id: number;
            readonly description: string;
            readonly id: number;
            readonly max_attempts: number;
            /** Format: decimal */
            readonly passing_score: string;
            readonly questions_count: number;
            readonly retake_delay_days: number;
            readonly time_limit_minutes: number;
            readonly title: string;
        };
        /** @description Admin serializer for quiz questions and options. */
        QuizQuestionAdmin: {
            explanation?: string;
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            readonly options: components["schemas"]["QuizOptionAdmin"][];
            /** Format: int64 */
            order?: number;
            text: string;
            /** Format: decimal */
            weight?: string;
        };
        /** @description Input serializer for admin quiz question creation. */
        QuizQuestionCreate: {
            /** @default  */
            explanation: string;
            /** @default 1 */
            order: number;
            text: string;
            /**
             * Format: decimal
             * @default 1.00
             */
            weight: string;
        };
        /** @description Output serializer for quiz unlock records. */
        QuizUnlock: {
            readonly course_id: number;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly extra_attempts: number;
            readonly id: number;
            readonly quiz_id: number;
            readonly reason: string;
            readonly unlocked_by_id: number;
            readonly user_id: number;
            /** Format: date-time */
            readonly valid_until: string | null;
        };
        /** @description Input serializer for admin manual quiz unlock. */
        QuizUnlockCreate: {
            /** @default 1 */
            extra_attempts: number;
            reason: string;
            user_id: number;
            /** Format: date-time */
            valid_until?: string | null;
        };
        R4JAdminAliasListResponse: {
            data: components["schemas"]["R4JAlias"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminAliasResponse: {
            data: components["schemas"]["R4JAlias"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش کامل سند برای admin. */
        R4JAdminAttachment: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** توضیحات */
            description?: string;
            /**
             * فایل
             * Format: uri
             */
            file: string;
            /** SHA-256 */
            file_sha256?: string;
            /**
             * حجم فایل
             * Format: int64
             */
            file_size?: number;
            readonly id: number;
            /** نمایش عمومی */
            is_public?: boolean;
            /** نوع */
            kind?: components["schemas"]["R4JCriminalAttachmentKindEnum"];
            /** عنوان */
            title: string;
            /** آپلودکننده */
            readonly uploaded_by: number | null;
        };
        R4JAdminAttachmentListResponse: {
            data: components["schemas"]["R4JAdminAttachment"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminAttachmentResponse: {
            data: components["schemas"]["R4JAdminAttachment"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش جزئیات کامل bounty برای admin — شامل admin_note و timestamps. */
        R4JAdminBountyDetail: {
            /** یادداشت ادمین */
            readonly admin_note: string;
            /** مبلغ (تومان) */
            readonly amount_toman: number;
            /**
             * زمان درخواست لغو
             * Format: date-time
             */
            readonly cancel_requested_at: string | null;
            /**
             * زمان لغو
             * Format: date-time
             */
            readonly canceled_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal_id: number;
            /** @description نام کامل مجرم. */
            readonly criminal_name: string;
            readonly id: number;
            /** وضعیت */
            readonly status: components["schemas"]["R4JBountyStatusEnum"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            /** @description ایمیل کاربر تعیین‌کننده جایزه. */
            readonly user_email: string | null;
            /** تعهدکننده */
            readonly user_id: number;
        };
        R4JAdminBountyDetailResponse: {
            data: components["schemas"]["R4JAdminBountyDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش لیست bountyها برای admin — شامل user و criminal info. */
        R4JAdminBountyList: {
            /** مبلغ (تومان) */
            readonly amount_toman: number;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal_id: number;
            /** @description نام کامل مجرم. */
            readonly criminal_name: string;
            readonly id: number;
            /** وضعیت */
            readonly status: components["schemas"]["R4JBountyStatusEnum"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            /** @description ایمیل کاربر تعیین‌کننده جایزه. */
            readonly user_email: string | null;
            /** تعهدکننده */
            readonly user_id: number;
        };
        R4JAdminBountyListResponse: {
            data: components["schemas"]["R4JAdminBountyListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminBountyListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JAdminBountyList"][];
        };
        /** @description نمایش جزئیات admin — شامل nested resources و فیلدهای حساس. */
        R4JAdminCriminalDetail: {
            readonly aliases: components["schemas"]["R4JAlias"][];
            readonly attachments: components["schemas"]["R4JAdminAttachment"][];
            /**
             * تاریخ تولد
             * Format: date
             */
            birth_date?: string | null;
            /** تعداد جوایز */
            readonly bounties_count: number;
            /** شهر */
            city?: string;
            /** کشور */
            country?: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** ثبت‌کننده */
            readonly created_by: number | null;
            /** خلاصه جرائم */
            crimes_summary?: string;
            /** توضیحات */
            description?: string;
            readonly field_visibility: components["schemas"]["R4JAdminFieldVisibility"][];
            /** نام */
            first_name: string;
            /** جنسیت */
            gender?: components["schemas"]["R4JGenderEnum"];
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            /** منتشر شده */
            readonly is_published: boolean;
            /** نام خانوادگی */
            last_name: string;
            /**
             * کد ملی
             * @description برای مجرمین غیرایرانی خالی می‌ماند.
             */
            national_code?: string | null;
            /**
             * سایر اطلاعات
             * @description متن آزاد برای ثبت هر اطلاعات تکمیلی.
             */
            other_info?: string;
            readonly phones: components["schemas"]["R4JAdminPhone"][];
            readonly photos: components["schemas"]["R4JAdminPhoto"][];
            /** استان */
            province?: string;
            /**
             * زمان انتشار
             * Format: date-time
             */
            readonly published_at: string | null;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، خودکار از نام ساخته می‌شود.
             */
            readonly slug: string;
            readonly socials: components["schemas"]["R4JAdminSocial"][];
            /** مجموع جوایز (تومان) */
            readonly total_bounty_toman: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        R4JAdminCriminalDetailResponse: {
            data: components["schemas"]["R4JAdminCriminalDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش لیست admin — شامل status flags. */
        R4JAdminCriminalList: {
            /** تعداد جوایز */
            readonly bounties_count: number;
            /** شهر */
            readonly city: string;
            /** کشور */
            readonly country: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** نام */
            readonly first_name: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            /** منتشر شده */
            readonly is_published: boolean;
            /** نام خانوادگی */
            readonly last_name: string;
            /** استان */
            readonly province: string;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، خودکار از نام ساخته می‌شود.
             */
            readonly slug: string;
            /** مجموع جوایز (تومان) */
            readonly total_bounty_toman: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        R4JAdminCriminalListResponse: {
            data: components["schemas"]["R4JAdminCriminalListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminCriminalListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JAdminCriminalList"][];
        };
        R4JAdminCustodyEventListResponse: {
            data: components["schemas"]["R4JAdminCustodyEventListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminCustodyEventListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JEvidenceCustodyEvent"][];
        };
        R4JAdminCustodyEventResponse: {
            data: components["schemas"]["R4JEvidenceCustodyEvent"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش تنظیمات visibility فیلد برای admin. */
        R4JAdminFieldVisibility: {
            /** نام فیلد */
            field_name: string;
            readonly id: number;
            /** نمایش عمومی */
            is_public?: boolean;
        };
        /** @description نمایش کامل شماره تماس برای admin. */
        R4JAdminPhone: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /** نمایش عمومی */
            is_public?: boolean;
            /** برچسب */
            label?: string;
            /** توضیحات */
            notes?: string;
            /** شماره */
            number: string;
        };
        R4JAdminPhoneListResponse: {
            data: components["schemas"]["R4JAdminPhone"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminPhoneResponse: {
            data: components["schemas"]["R4JAdminPhone"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش کامل عکس برای admin. */
        R4JAdminPhoto: {
            /** توضیح کوتاه */
            caption?: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /**
             * تصویر
             * Format: uri
             */
            image: string;
            /** عکس اصلی */
            is_primary?: boolean;
            /**
             * ترتیب نمایش
             * Format: int64
             */
            order?: number;
        };
        R4JAdminPhotoListResponse: {
            data: components["schemas"]["R4JAdminPhoto"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminPhotoResponse: {
            data: components["schemas"]["R4JAdminPhoto"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش جزئیات کامل گزارش برای admin — شامل تمام nested data. */
        R4JAdminReportDetail: {
            /** یادداشت ادمین */
            readonly admin_note: string;
            readonly attachments: components["schemas"]["R4JReportAttachment"][];
            /**
             * زمان درخواست لغو
             * Format: date-time
             */
            readonly cancel_requested_at: string | null;
            /**
             * زمان لغو
             * Format: date-time
             */
            readonly canceled_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal_id: number;
            /** @description نام کامل مجرم. */
            readonly criminal_name: string;
            readonly field_changes: components["schemas"]["R4JReportFieldChange"][];
            readonly id: number;
            /**
             * یادداشت گزارش‌دهنده
             * @description متن آزاد گزارش‌دهنده در صورت نیاز.
             */
            readonly notes: string;
            /**
             * زمان بررسی
             * Format: date-time
             */
            readonly reviewed_at: string | null;
            /** @description ایمیل بررسی‌کننده. */
            readonly reviewed_by_email: string | null;
            /** بررسی‌کننده */
            readonly reviewed_by_id: number | null;
            /** وضعیت */
            readonly status: components["schemas"]["R4JReportStatusEnum"];
            /** @description ایمیل گزارش‌دهنده. */
            readonly submitted_by_email: string | null;
            /** گزارش‌دهنده */
            readonly submitted_by_id: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        R4JAdminReportDetailResponse: {
            data: components["schemas"]["R4JAdminReportDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش لیست گزارشات برای admin — شامل submitted_by info. */
        R4JAdminReportList: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal_id: number;
            /** @description نام کامل مجرم. */
            readonly criminal_name: string;
            readonly id: number;
            /** وضعیت */
            readonly status: components["schemas"]["R4JReportStatusEnum"];
            /** @description ایمیل گزارش‌دهنده. */
            readonly submitted_by_email: string | null;
            /** گزارش‌دهنده */
            readonly submitted_by_id: number;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        R4JAdminReportListResponse: {
            data: components["schemas"]["R4JAdminReportListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminReportListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JAdminReportList"][];
        };
        /** @description نمایش کامل شبکه اجتماعی برای admin. */
        R4JAdminSocial: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** هندل یا URL */
            handle_or_url: string;
            readonly id: number;
            /** نمایش عمومی */
            is_public?: boolean;
            /** پلتفرم */
            platform: components["schemas"]["R4JSocialPlatformEnum"];
        };
        R4JAdminSocialListResponse: {
            data: components["schemas"]["R4JAdminSocial"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminSocialResponse: {
            data: components["schemas"]["R4JAdminSocial"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminVisibilityListResponse: {
            data: components["schemas"]["R4JAdminFieldVisibility"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JAdminVisibilityResponse: {
            data: components["schemas"]["R4JAdminFieldVisibility"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش نام مستعار. */
        R4JAlias: {
            /** نام مستعار */
            alias: string;
            readonly id: number;
        };
        /** @description ورودی افزودن نام مستعار. */
        R4JAliasCreate: {
            alias: string;
        };
        /** @description ورودی آپلود سند. */
        R4JAttachmentCreate: {
            description?: string;
            /** Format: uri */
            file: string;
            /** @default false */
            is_public: boolean;
            /** @default document */
            kind: components["schemas"]["R4JCriminalAttachmentKindEnum"];
            title: string;
        };
        /** @description ورودی approve/reject cancel bounty توسط ادمین — فقط admin_note اختیاری. */
        R4JBountyCancelAction: {
            /** @default  */
            admin_note: string;
        };
        /**
         * @description ورودی set/update bounty توسط کاربر.
         *
         *     amount_toman در serializer layer validate می‌شود تا error message
         *     قبل از رسیدن به service layer برگردد.
         *
         *     حداقل مبلغ مجاز: R4J_BOUNTY_MIN_TOMAN تومان.
         */
        R4JBountySet: {
            amount_toman: number;
        };
        /**
         * @description * `active` - فعال
         *     * `cancel_requested` - درخواست لغو
         *     * `canceled` - لغو شده
         * @enum {string}
         */
        R4JBountyStatusEnum: "active" | "cancel_requested" | "canceled";
        /** @description Input serializer for case assignment. */
        R4JCaseAssign: {
            assignee_id: number;
            /** @default  */
            note: string;
        };
        /** @description Optional note for creating an operational case from a report. */
        R4JCaseCreateFromReport: {
            /** @default  */
            note: string;
        };
        R4JCaseDetailResponse: {
            data: components["schemas"]["R4JInvestigationCaseDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Read serializer for immutable R4J case timeline events. */
        R4JCaseEvent: {
            /** عامل */
            readonly actor: number | null;
            /** Format: email */
            readonly actor_email: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly event_type: components["schemas"]["R4JInvestigationCaseEventTypeEnum"];
            readonly event_type_display: string;
            readonly from_status: string;
            readonly id: number;
            readonly metadata: unknown;
            readonly note: string;
            readonly to_status: string;
        };
        R4JCaseEventListResponse: {
            data: components["schemas"]["R4JCaseEvent"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Input serializer for requesting more evidence. */
        R4JCaseEvidenceRequest: {
            note: string;
        };
        R4JCaseListResponse: {
            data: components["schemas"]["R4JCaseListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JCaseListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JInvestigationCaseList"][];
        };
        /** @description Input serializer for transitions that require a reason/note. */
        R4JCaseNoteRequired: {
            reason: string;
        };
        /** @description Serializer documenting R4J case operation overview payload. */
        R4JCaseOperationsOverview: {
            by_priority: {
                [key: string]: number;
            };
            by_status: {
                [key: string]: number;
            };
            overdue_first_response: number;
            overdue_resolution: number;
            total_cases: number;
            unassigned_cases: number;
        };
        R4JCaseOperationsOverviewResponse: {
            data: components["schemas"]["R4JCaseOperationsOverview"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Input serializer for priority change. */
        R4JCasePriority: {
            /** @default  */
            note: string;
            priority: components["schemas"]["MadadkarRiskSeverityEnum"];
        };
        /** @description Input serializer for case triage. */
        R4JCaseTriage: {
            /** @default  */
            note: string;
            priority: components["schemas"]["MadadkarRiskSeverityEnum"];
            severity: components["schemas"]["MadadkarRiskSeverityEnum"];
        };
        /**
         * @description * `image` - تصویر
         *     * `document` - سند
         *     * `video` - ویدئو
         *     * `audio` - صدا
         *     * `other` - سایر
         * @enum {string}
         */
        R4JCriminalAttachmentKindEnum: "image" | "document" | "video" | "audio" | "other";
        /** @description ورودی ساخت پروفایل criminal توسط admin. */
        R4JCriminalCreate: {
            /** Format: date */
            birth_date?: string | null;
            city?: string;
            country?: string;
            crimes_summary?: string;
            description?: string;
            first_name: string;
            /** @default unknown */
            gender: components["schemas"]["R4JGenderEnum"];
            last_name: string;
            national_code?: string;
            other_info?: string;
            province?: string;
        };
        R4JEmptySuccessResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Read serializer for R4J evidence chain-of-custody events. */
        R4JEvidenceCustodyEvent: {
            readonly actor: number | null;
            /** Format: email */
            readonly actor_email: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly criminal_attachment: number | null;
            readonly event_type: components["schemas"]["R4JEvidenceCustodyEventTypeEnum"];
            readonly event_type_display: string;
            readonly file_sha256: string;
            readonly id: number;
            readonly metadata: unknown;
            readonly note: string;
            readonly report_attachment: number | null;
        };
        /**
         * @description * `uploaded` - آپلود شد
         *     * `hashed` - هش شد
         *     * `reviewed` - بررسی شد
         *     * `transferred` - منتقل شد
         *     * `rejected` - رد شد
         *     * `deleted` - حذف شد
         * @enum {string}
         */
        R4JEvidenceCustodyEventTypeEnum: "uploaded" | "hashed" | "reviewed" | "transferred" | "rejected" | "deleted";
        /** @description Input serializer for appending custody review/transfer/reject events. */
        R4JEvidenceCustodyReview: {
            event_type: components["schemas"]["R4JEvidenceCustodyReviewEventTypeEnum"];
            /** @default  */
            note: string;
        };
        /**
         * @description * `reviewed` - reviewed
         *     * `transferred` - transferred
         *     * `rejected` - rejected
         * @enum {string}
         */
        R4JEvidenceCustodyReviewEventTypeEnum: "reviewed" | "transferred" | "rejected";
        /**
         * @description تصمیم ادمین برای یک field_change.
         *
         *     status فقط approved یا rejected می‌تواند باشد —
         *     ادمین نمی‌تواند وضعیت را در pending نگه دارد.
         */
        R4JFieldDecision: {
            /** @default  */
            admin_note: string;
            field_change_id: number;
            status: components["schemas"]["R4JFieldDecisionStatusEnum"];
        };
        /**
         * @description * `approved` - approved
         *     * `rejected` - rejected
         * @enum {string}
         */
        R4JFieldDecisionStatusEnum: "approved" | "rejected";
        /**
         * @description * `male` - مرد
         *     * `female` - زن
         *     * `unknown` - نامشخص
         * @enum {string}
         */
        R4JGenderEnum: "male" | "female" | "unknown";
        R4JGenericErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description Admin detail serializer for operational cases. */
        R4JInvestigationCaseDetail: {
            /** مسئول پرونده */
            readonly assigned_to: number | null;
            /** Format: email */
            readonly assigned_to_email: string | null;
            /** شماره پرونده */
            readonly case_number: string;
            /**
             * زمان بستن
             * Format: date-time
             */
            readonly closed_at: string | null;
            /** بسته‌کننده */
            readonly closed_by: number | null;
            /** Format: email */
            readonly closed_by_email: string | null;
            /** دلیل بستن / رد / حل */
            readonly closure_reason: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal: number;
            /** @description Return display name without exposing additional report data. */
            readonly criminal_name: string;
            readonly events: components["schemas"]["R4JCaseEvent"][];
            /** امتیاز تکمیل مدارک */
            readonly evidence_completeness_score: number;
            /**
             * مهلت پاسخ اولیه
             * Format: date-time
             */
            readonly first_response_due_at: string | null;
            readonly id: number;
            /** متادیتا */
            readonly metadata: unknown;
            /** اولویت */
            readonly priority: components["schemas"]["MadadkarRiskSeverityEnum"];
            /** گزارش */
            readonly report: number;
            /**
             * مهلت حل پرونده
             * Format: date-time
             */
            readonly resolution_due_at: string | null;
            /** شدت */
            readonly severity: components["schemas"]["MadadkarRiskSeverityEnum"];
            /** وضعیت */
            readonly status: components["schemas"]["R4JInvestigationCaseStatusEnum"];
            /**
             * زمان تریاژ
             * Format: date-time
             */
            readonly triaged_at: string | null;
            /** تریاژکننده */
            readonly triaged_by: number | null;
            /** Format: email */
            readonly triaged_by_email: string | null;
        };
        /**
         * @description * `created` - ایجاد شد
         *     * `triaged` - تریاژ شد
         *     * `assigned` - ارجاع شد
         *     * `priority_changed` - اولویت تغییر کرد
         *     * `evidence_requested` - مدرک بیشتر درخواست شد
         *     * `escalated` - ارجاع فوری شد
         *     * `resolved` - حل شد
         *     * `rejected` - رد شد
         *     * `closed` - بسته شد
         *     * `reopened` - بازگشایی شد
         * @enum {string}
         */
        R4JInvestigationCaseEventTypeEnum: "created" | "triaged" | "assigned" | "priority_changed" | "evidence_requested" | "escalated" | "resolved" | "rejected" | "closed" | "reopened";
        /** @description Admin list serializer for operational cases. */
        R4JInvestigationCaseList: {
            /** مسئول پرونده */
            readonly assigned_to: number | null;
            /** Format: email */
            readonly assigned_to_email: string | null;
            /** شماره پرونده */
            readonly case_number: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal: number;
            /** @description Return display name without exposing additional report data. */
            readonly criminal_name: string;
            /** امتیاز تکمیل مدارک */
            readonly evidence_completeness_score: number;
            /**
             * مهلت پاسخ اولیه
             * Format: date-time
             */
            readonly first_response_due_at: string | null;
            readonly id: number;
            /** اولویت */
            readonly priority: components["schemas"]["MadadkarRiskSeverityEnum"];
            /** گزارش */
            readonly report: number;
            /**
             * مهلت حل پرونده
             * Format: date-time
             */
            readonly resolution_due_at: string | null;
            /** شدت */
            readonly severity: components["schemas"]["MadadkarRiskSeverityEnum"];
            /** وضعیت */
            readonly status: components["schemas"]["R4JInvestigationCaseStatusEnum"];
        };
        /**
         * @description * `new` - جدید
         *     * `triaged` - تریاژ شده
         *     * `assigned` - ارجاع شده
         *     * `investigating` - در حال بررسی
         *     * `waiting_for_evidence` - در انتظار مدرک
         *     * `escalated` - ارجاع فوری
         *     * `resolved` - حل شده
         *     * `rejected` - رد شده
         *     * `closed` - بسته شده
         * @enum {string}
         */
        R4JInvestigationCaseStatusEnum: "new" | "triaged" | "assigned" | "investigating" | "waiting_for_evidence" | "escalated" | "resolved" | "rejected" | "closed";
        /** @description ورودی افزودن شماره تماس. */
        R4JPhoneCreate: {
            /** @default false */
            is_public: boolean;
            label?: string;
            notes?: string;
            number: string;
        };
        /** @description ورودی آپلود عکس. */
        R4JPhotoCreate: {
            caption?: string;
            /** Format: uri */
            image: string;
            /** @default false */
            is_primary: boolean;
            /** @default 0 */
            order: number;
        };
        /** @description نمایش سند public. */
        R4JPublicAttachment: {
            /** توضیحات */
            readonly description: string;
            /**
             * فایل
             * Format: uri
             */
            readonly file: string;
            readonly id: number;
            /** نوع */
            readonly kind: components["schemas"]["R4JCriminalAttachmentKindEnum"];
            /** عنوان */
            readonly title: string;
        };
        /**
         * @description نمایش جزئیات عمومی با اعمال visibility map.
         *
         *     فیلدهایی که visibility آن‌ها False است، None سرو می‌شوند تا
         *     schema یکپارچه باقی بماند.
         */
        R4JPublicCriminalDetail: {
            readonly aliases: components["schemas"]["R4JAlias"][];
            readonly attachments: components["schemas"]["R4JPublicAttachment"][];
            /**
             * تاریخ تولد
             * Format: date
             */
            readonly birth_date: string | null;
            /** تعداد جوایز */
            readonly bounties_count: number;
            /** شهر */
            readonly city: string;
            /** کشور */
            readonly country: string;
            /** خلاصه جرائم */
            readonly crimes_summary: string;
            /** توضیحات */
            readonly description: string;
            /** نام */
            readonly first_name: string;
            /** جنسیت */
            readonly gender: components["schemas"]["R4JGenderEnum"];
            readonly id: number;
            /** نام خانوادگی */
            readonly last_name: string;
            /**
             * کد ملی
             * @description برای مجرمین غیرایرانی خالی می‌ماند.
             */
            readonly national_code: string | null;
            /**
             * سایر اطلاعات
             * @description متن آزاد برای ثبت هر اطلاعات تکمیلی.
             */
            readonly other_info: string;
            readonly phones: components["schemas"]["R4JPublicPhone"][];
            readonly photos: components["schemas"]["R4JPublicPhoto"][];
            /** استان */
            readonly province: string;
            /**
             * زمان انتشار
             * Format: date-time
             */
            readonly published_at: string | null;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، خودکار از نام ساخته می‌شود.
             */
            readonly slug: string;
            readonly socials: components["schemas"]["R4JPublicSocial"][];
            /** مجموع جوایز (تومان) */
            readonly total_bounty_toman: number;
        };
        R4JPublicCriminalDetailResponse: {
            data: components["schemas"]["R4JPublicCriminalDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description نمایش لیست عمومی — حداقل اطلاعات + عکس primary + جوایز. */
        R4JPublicCriminalList: {
            /** تعداد جوایز */
            readonly bounties_count: number;
            /** شهر */
            readonly city: string;
            /** کشور */
            readonly country: string;
            /** نام */
            readonly first_name: string;
            readonly id: number;
            /** نام خانوادگی */
            readonly last_name: string;
            /** @description دریافت عکس primary یا اولین عکس موجود. */
            readonly primary_photo: {
                [key: string]: unknown;
            } | null;
            /** استان */
            readonly province: string;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، خودکار از نام ساخته می‌شود.
             */
            readonly slug: string;
            /** مجموع جوایز (تومان) */
            readonly total_bounty_toman: number;
        };
        R4JPublicCriminalListResponse: {
            data: components["schemas"]["R4JPublicCriminalListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JPublicCriminalListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JPublicCriminalList"][];
        };
        /** @description نمایش شماره تماس public. */
        R4JPublicPhone: {
            readonly id: number;
            /** برچسب */
            readonly label: string;
            /** شماره */
            readonly number: string;
        };
        /** @description نمایش عکس برای public. */
        R4JPublicPhoto: {
            /** توضیح کوتاه */
            readonly caption: string;
            readonly id: number;
            /**
             * تصویر
             * Format: uri
             */
            readonly image: string;
            /** عکس اصلی */
            readonly is_primary: boolean;
            /** ترتیب نمایش */
            readonly order: number;
        };
        /** @description نمایش شبکه اجتماعی public. */
        R4JPublicSocial: {
            /** هندل یا URL */
            readonly handle_or_url: string;
            readonly id: number;
            /** پلتفرم */
            readonly platform: components["schemas"]["R4JSocialPlatformEnum"];
        };
        /** @description نمایش ضمیمه گزارش. */
        R4JReportAttachment: {
            /**
             * فایل
             * Format: uri
             */
            readonly file: string;
            readonly id: number;
            /** نوع */
            readonly kind: components["schemas"]["R4JCriminalAttachmentKindEnum"];
            /** عنوان */
            readonly title: string;
        };
        /** @description ورودی approve/reject cancel — فقط admin_note اختیاری. */
        R4JReportCancelAction: {
            /** @default  */
            admin_note: string;
        };
        /** @description نمایش یک پیشنهاد تغییر فیلد در گزارش. */
        R4JReportFieldChange: {
            /** یادداشت ادمین */
            readonly admin_note: string;
            /** مقدار فعلی هنگام گزارش */
            readonly current_value_snapshot: string;
            /** نام فیلد */
            readonly field_name: string;
            readonly id: number;
            /** وضعیت */
            readonly status: components["schemas"]["R4JReportFieldChangeStatusEnum"];
            /** مقدار پیشنهادی */
            readonly suggested_value: string;
        };
        /**
         * @description ورودی یک پیشنهاد تغییر فیلد در submit report.
         *
         *     اعتبارسنجی field_name در اینجا انجام می‌شود تا validation error
         *     قبل از رسیدن به service layer برگردد.
         */
        R4JReportFieldChangeInput: {
            field_name: string;
            suggested_value: string;
        };
        /**
         * @description * `pending` - در انتظار بررسی
         *     * `approved` - تأیید شده
         *     * `rejected` - رد شده
         * @enum {string}
         */
        R4JReportFieldChangeStatusEnum: "pending" | "approved" | "rejected";
        /**
         * @description ورودی review گزارش توسط ادمین.
         *
         *     field_decisions اختیاری است — اگر گزارش بدون field_change باشد.
         */
        R4JReportReview: {
            /** @default  */
            admin_note: string;
            field_decisions?: components["schemas"]["R4JFieldDecision"][];
        };
        /**
         * @description * `pending` - در انتظار بررسی
         *     * `approved` - تأیید شده
         *     * `partially_approved` - تأیید جزئی
         *     * `rejected` - رد شده
         *     * `cancel_requested` - درخواست لغو
         *     * `canceled` - لغو شده
         * @enum {string}
         */
        R4JReportStatusEnum: "pending" | "approved" | "partially_approved" | "rejected" | "cancel_requested" | "canceled";
        /**
         * @description ورودی submit گزارش توسط کاربر.
         *
         *     پشتیبانی از دو حالت:
         *     1. JSON (application/json):
         *        - `field_changes` به‌صورت list واقعی
         *     2. Multipart (multipart/form-data):
         *        - `notes` به‌صورت string
         *        - `field_changes` به‌صورت JSON string
         *        - `attachments` از request.FILES در view خوانده می‌شود
         *
         *     حداقل یک field_change یا یک notes غیر خالی لازم است.
         */
        R4JReportSubmit: {
            /**
             * @description در JSON: لیست مستقیم field changeها.
             *     در multipart: JSON string از همان لیست.
             *     مثال: [{"field_name": "city", "suggested_value": "Tehran"}]
             */
            field_changes?: components["schemas"]["R4JReportFieldChangeInput"][];
            /** @default  */
            notes: string;
        };
        /** @description ورودی افزودن شبکه اجتماعی. */
        R4JSocialCreate: {
            handle_or_url: string;
            /** @default true */
            is_public: boolean;
            platform: components["schemas"]["R4JSocialPlatformEnum"];
        };
        /**
         * @description * `telegram` - تلگرام
         *     * `twitter_x` - توییتر / ایکس
         *     * `instagram` - اینستاگرام
         *     * `linkedin` - لینکدین
         *     * `facebook` - فیسبوک
         *     * `tiktok` - تیک‌تاک
         *     * `truth_social` - تروث سوشال
         *     * `youtube` - یوتیوب
         *     * `website` - وب‌سایت
         *     * `other` - سایر
         * @enum {string}
         */
        R4JSocialPlatformEnum: "telegram" | "twitter_x" | "instagram" | "linkedin" | "facebook" | "tiktok" | "truth_social" | "youtube" | "website" | "other";
        /**
         * @description نمایش bounty برای کاربر — شامل اطلاعات criminal.
         *
         *     کاربر فقط bountyهای خودش را می‌بیند.
         *     فیلدهای admin مثل admin_note در این serializer نیستند.
         */
        R4JUserBounty: {
            /** مبلغ (تومان) */
            readonly amount_toman: number;
            /**
             * زمان درخواست لغو
             * Format: date-time
             */
            readonly cancel_requested_at: string | null;
            /**
             * زمان لغو
             * Format: date-time
             */
            readonly canceled_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal_id: number;
            /** @description نام کامل مجرم. */
            readonly criminal_name: string;
            /** @description slug مجرم برای لینک‌دهی. */
            readonly criminal_slug: string;
            readonly id: number;
            /** وضعیت */
            readonly status: components["schemas"]["R4JBountyStatusEnum"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        R4JUserBountyDetailResponse: {
            data: components["schemas"]["R4JUserBounty"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JUserBountyListResponse: {
            data: components["schemas"]["R4JUserBountyListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JUserBountyListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JUserBounty"][];
        };
        /** @description نمایش جزئیات کامل یک گزارش برای کاربر — شامل field_changes و attachments. */
        R4JUserReportDetail: {
            /** یادداشت ادمین */
            readonly admin_note: string;
            readonly attachments: components["schemas"]["R4JReportAttachment"][];
            /**
             * زمان درخواست لغو
             * Format: date-time
             */
            readonly cancel_requested_at: string | null;
            /**
             * زمان لغو
             * Format: date-time
             */
            readonly canceled_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal_id: number;
            /** @description نام کامل مجرم. */
            readonly criminal_name: string;
            readonly field_changes: components["schemas"]["R4JReportFieldChange"][];
            readonly id: number;
            /**
             * یادداشت گزارش‌دهنده
             * @description متن آزاد گزارش‌دهنده در صورت نیاز.
             */
            readonly notes: string;
            /** وضعیت */
            readonly status: components["schemas"]["R4JReportStatusEnum"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        R4JUserReportDetailResponse: {
            data: components["schemas"]["R4JUserReportDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description نمایش لیست گزارشات برای کاربر — اطلاعات خلاصه.
         *
         *     criminal نام نمایش داده می‌شود بدون nested data.
         */
        R4JUserReportList: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** مجرم */
            readonly criminal_id: number;
            /** @description نام کامل مجرم. */
            readonly criminal_name: string;
            readonly id: number;
            /**
             * یادداشت گزارش‌دهنده
             * @description متن آزاد گزارش‌دهنده در صورت نیاز.
             */
            readonly notes: string;
            /** وضعیت */
            readonly status: components["schemas"]["R4JReportStatusEnum"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        R4JUserReportListResponse: {
            data: components["schemas"]["R4JUserReportListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        R4JUserReportListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["R4JUserReportList"][];
        };
        /** @description چک‌های critical readiness برای سرو کردن traffic. */
        ReadinessChecks: {
            cache: components["schemas"]["ComponentCheck"];
            celery_broker: components["schemas"]["ComponentCheck"];
            database: components["schemas"]["ComponentCheck"];
        };
        /** @description پاسخ readiness شامل dependencyهای critical. */
        ReadinessHealth: {
            checks: components["schemas"]["ReadinessChecks"];
            status: components["schemas"]["HealthStatusEnum"];
            /** Format: date-time */
            timestamp: string;
        };
        /** @description RefreshTokenInputSerializer implementation for the authentication application. */
        RefreshTokenInput: {
            refresh: string;
        };
        /** @description RegisterSerializer implementation for the authentication application. */
        Register: {
            /** Format: email */
            email: string;
            first_name?: string;
            last_name?: string;
            password: string;
        };
        RegisterResponseData: {
            /** Format: email */
            email: string;
        };
        RegisterSuccessResponse: {
            data: components["schemas"]["RegisterResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description ReportAttachmentSerializer implementation for the public_reports application. */
        ReportAttachment: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /**
             * تصویر مستند
             * Format: uri
             */
            image: string;
        };
        /** @description ReportCreateSerializer implementation for the public_reports application. */
        ReportCreate: {
            attachments?: string[];
            description: string;
            full_name: string;
            phone_number?: string;
            subject_id: number;
        };
        /** @description ReportDetailSerializer implementation for the public_reports application. */
        ReportDetail: {
            /** یادداشت ادمین */
            admin_note?: string;
            readonly attachments: components["schemas"]["ReportAttachment"][];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** توضیحات گزارش */
            description: string;
            /** نام گزارش‌دهنده */
            full_name: string;
            readonly id: number;
            /** شماره تماس */
            phone_number?: string | null;
            /** وضعیت بررسی */
            status?: components["schemas"]["ReportStatusEnum"];
            readonly subject: components["schemas"]["ReportSubjectPublic"];
            /** آی‌پی گزارش‌دهنده */
            submitter_ip?: string | null;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        ReportDetailSuccessResponse: {
            data: components["schemas"]["ReportDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description ReportListSerializer implementation for the public_reports application. */
        ReportList: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** نام گزارش‌دهنده */
            full_name: string;
            readonly id: number;
            /** وضعیت بررسی */
            status?: components["schemas"]["ReportStatusEnum"];
            readonly subject: components["schemas"]["ReportSubjectPublic"];
        };
        ReportListPaginatedSuccessResponse: {
            data: components["schemas"]["ReportListPaginatedSuccessResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        ReportListPaginatedSuccessResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["ReportList"][];
        };
        /** @description Public response serializer for newly-created reports without internal metadata. */
        ReportPublicCreated: {
            readonly attachments: components["schemas"]["ReportAttachment"][];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** توضیحات گزارش */
            description: string;
            /** نام گزارش‌دهنده */
            full_name: string;
            readonly id: number;
            /** شماره تماس */
            phone_number?: string | null;
            /** وضعیت بررسی */
            status?: components["schemas"]["ReportStatusEnum"];
            readonly subject: components["schemas"]["ReportSubjectPublic"];
        };
        ReportPublicCreatedSuccessResponse: {
            data: components["schemas"]["ReportPublicCreated"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `pending` - در انتظار بررسی
         *     * `reviewing` - در حال بررسی
         *     * `approved` - تأیید شده
         *     * `rejected` - رد شده
         * @enum {string}
         */
        ReportStatusEnum: "pending" | "reviewing" | "approved" | "rejected";
        /** @description نمایش موضوعات برای ادمین به همراه تعداد گزارش‌ها. */
        ReportSubjectAdmin: {
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** توضیحات */
            description?: string;
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            /**
             * ترتیب نمایش
             * Format: int64
             */
            order?: number;
            readonly reports_count: number;
            /** شناسه */
            readonly slug: string;
            /** عنوان موضوع */
            title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        ReportSubjectAdminDetailSuccessResponse: {
            data: components["schemas"]["ReportSubjectAdmin"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        ReportSubjectAdminListSuccessResponse: {
            data: components["schemas"]["ReportSubjectAdmin"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description ReportSubjectCreateSerializer implementation for the public_reports application. */
        ReportSubjectCreate: {
            description?: string;
            /** @default 0 */
            order: number;
            title: string;
        };
        /** @description نمایش موضوعات برای کاربر عمومی (فقط فعال‌ها). */
        ReportSubjectPublic: {
            /** توضیحات */
            description?: string;
            readonly id: number;
            /**
             * ترتیب نمایش
             * Format: int64
             */
            order?: number;
            /** شناسه */
            slug?: string;
            /** عنوان موضوع */
            title: string;
        };
        ReportSubjectPublicListSuccessResponse: {
            data: components["schemas"]["ReportSubjectPublic"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description ResendVerificationSerializer implementation for the authentication application. */
        ResendVerification: {
            /** Format: email */
            email: string;
        };
        /** @description ResetPasswordSerializer implementation for the authentication application. */
        ResetPassword: {
            code: string;
            /** Format: email */
            email: string;
            new_password: string;
        };
        /**
         * @description * `reviewed` - بررسی‌شده
         *     * `dismissed` - ردشده
         *     * `escalated` - ارجاع‌شده
         * @enum {string}
         */
        RiskReviewStatusEnum: "reviewed" | "dismissed" | "escalated";
        /**
         * @description * `user` - کاربر عادی
         *     * `admin` - مدیر سیستم
         * @enum {string}
         */
        RoleEnum: "user" | "admin";
        /**
         * @description Step 1 of signup:
         *     request OTP for a new identifier.
         */
        SignupRequest: {
            identifier: string;
        };
        /**
         * @description Step 2 of signup:
         *     verify OTP and create account with password.
         */
        SignupVerify: {
            code: string;
            first_name?: string;
            identifier: string;
            last_name?: string;
            password: string;
        };
        /** @description پاسخ ساده health check — مناسب liveness probes. */
        SimpleHealth: {
            /**
             * @description وضعیت کلی سرویس
             *
             *     * `ok` - ok
             *     * `error` - error
             *     * `degraded` - degraded
             */
            status: components["schemas"]["HealthStatusEnum"];
            /**
             * Format: date-time
             * @description زمان انجام چک
             */
            timestamp: string;
        };
        /** @description نمایش کامل مددکار برای ادمین. */
        SponsorAdmin: {
            /** @description تعداد حرکت‌های فعال این مددکار. */
            readonly campaigns_count: number;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            /**
             * لوگو
             * Format: uri
             */
            logo?: string | null;
            /** نام مددکار */
            name: string;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی نام به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description ورودی ساخت Sponsor توسط ادمین. */
        SponsorCreate: {
            /** Format: uri */
            logo?: string | null;
            name: string;
        };
        /** @description نمایش عمومی مددکار — فقط فیلدهای امن. */
        SponsorPublic: {
            readonly id: number;
            /**
             * لوگو
             * Format: uri
             */
            readonly logo: string | null;
            /** نام مددکار */
            readonly name: string;
            /**
             * شناسه URL
             * @description در صورت خالی بودن، از روی نام به‌صورت خودکار ساخته می‌شود.
             */
            readonly slug: string;
        };
        /**
         * @description * `approved` - تأیید شده
         *     * `pending_review` - در انتظار بررسی
         *     * `rejected` - رد شده
         * @enum {string}
         */
        SubmissionStatusEnum: "approved" | "pending_review" | "rejected";
        /** @description Admin support analytics dashboard serializer. */
        SupportAdminAnalytics: {
            assignee_distribution: {
                [key: string]: unknown;
            }[];
            category_distribution: {
                [key: string]: unknown;
            }[];
            /** Format: double */
            csat_average: number;
            csat_count: number;
            csat_distribution: {
                [key: string]: unknown;
            }[];
            department_distribution: {
                [key: string]: unknown;
            }[];
            escalated_tickets: number;
            /** Format: double */
            escalation_rate_percent: number;
            /** Format: date-time */
            generated_at: string;
            open_tickets: number;
            priority_distribution: {
                [key: string]: unknown;
            }[];
            /** Format: double */
            reopen_rate_percent: number;
            reopened_tickets: number;
            resolved_tickets: number;
            severity_distribution: {
                [key: string]: unknown;
            }[];
            /** Format: double */
            sla_breach_rate_percent: number;
            sla_breached_tickets: number;
            status_distribution: {
                [key: string]: unknown;
            }[];
            ticket_type_distribution: {
                [key: string]: unknown;
            }[];
            total_tickets: number;
            unassigned_tickets: number;
        };
        SupportAdminAnalyticsResponse: {
            data: components["schemas"]["SupportAdminAnalytics"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Admin input serializer for assignment. */
        SupportAdminAssign: {
            assignee_id?: number | null;
            department_id?: number | null;
            /** @default  */
            reason: string;
        };
        SupportAdminDepartmentListResponse: {
            data: components["schemas"]["SupportDepartment"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        SupportAdminDepartmentResponse: {
            data: components["schemas"]["SupportDepartment"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Admin ticket detail serializer including internal timeline data. */
        SupportAdminTicketDetail: {
            readonly applied_sla_policy_id: number | null;
            readonly assigned_to_id: number | null;
            readonly attachment_count: number;
            readonly attachments: components["schemas"]["SupportTicketAttachment"][];
            readonly category: components["schemas"]["SupportCategory"];
            /** Format: date-time */
            readonly closed_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly department: components["schemas"]["SupportDepartment"];
            readonly description_snapshot: string;
            /** Format: date-time */
            readonly escalated_at: string | null;
            readonly escalated_by_id: number | null;
            readonly escalation_reason: string;
            /** Format: date-time */
            readonly first_admin_response_at: string | null;
            /** Format: date-time */
            readonly first_response_due_at: string | null;
            readonly id: number;
            readonly internal_note_count: number;
            readonly is_reopenable: boolean;
            /** Format: date-time */
            readonly last_activity_at: string;
            readonly message_count: number;
            readonly messages: components["schemas"]["SupportAdminTicketMessage"][];
            readonly owner_id: number;
            readonly priority: components["schemas"]["SupportTicketPriorityEnum"];
            readonly reopen_count: number;
            /** Format: date-time */
            readonly reopened_at: string | null;
            /** Format: date-time */
            readonly resolution_due_at: string | null;
            /** Format: date-time */
            readonly resolved_at: string | null;
            readonly satisfaction_rating_snapshot: number | null;
            readonly search_document: string;
            readonly severity: components["schemas"]["SupportTicketSeverityEnum"];
            /** Format: date-time */
            readonly sla_breached_at: string | null;
            readonly sla_total_paused_seconds: number;
            readonly status: components["schemas"]["SupportTicketStatusEnum"];
            readonly subject: string;
            /** Format: date-time */
            readonly submitted_at: string | null;
            readonly ticket_number: string;
            readonly ticket_type: components["schemas"]["SupportTicketType"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            /** Format: uuid */
            readonly uuid: string;
        };
        SupportAdminTicketDetailResponse: {
            data: components["schemas"]["SupportAdminTicketDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        SupportAdminTicketListResponse: {
            data: components["schemas"]["SupportAdminTicketListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        SupportAdminTicketListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["SupportTicketList"][];
        };
        /** @description Admin timeline serializer including internal note visibility. */
        SupportAdminTicketMessage: {
            /** @description Return safe display name for a message author. */
            readonly author_display: string;
            readonly author_id: number;
            readonly body: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** Format: date-time */
            readonly edited_at: string | null;
            readonly id: number;
            readonly is_from_staff: boolean;
            readonly is_internal: boolean;
            readonly message_type: components["schemas"]["MessageTypeEnum"];
            readonly metadata: unknown;
        };
        /** @description One candidate in support load-balancing recommendation. */
        SupportAssignmentCandidate: {
            readonly breached_sla_tickets: number;
            readonly department_open_tickets: number;
            readonly open_tickets: number;
            readonly reason_codes: string[];
            readonly urgent_or_critical_tickets: number;
            readonly user_display_name: string;
            readonly user_email: string;
            readonly user_id: number;
            readonly waiting_admin_tickets: number;
            readonly workload_score: number;
        };
        /** @description Load-balanced assignment recommendation payload. */
        SupportAssignmentRecommendation: {
            readonly candidates: components["schemas"]["SupportAssignmentCandidate"][];
            readonly policy_version: string;
            readonly reason_codes: string[];
            readonly recommended_assignee_email: string;
            readonly recommended_assignee_id: number | null;
            readonly ticket_number: string;
        };
        SupportAssignmentRecommendationResponse: {
            data: components["schemas"]["SupportAssignmentRecommendation"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `screenshot` - اسکرین‌شات
         *     * `image` - تصویر
         *     * `document` - سند
         *     * `receipt` - رسید
         *     * `other` - سایر
         * @enum {string}
         */
        SupportAttachmentKindEnum: "screenshot" | "image" | "document" | "receipt" | "other";
        /**
         * @description * `public` - قابل مشاهده برای کاربر و ادمین
         *     * `internal_only` - فقط داخلی
         * @enum {string}
         */
        SupportAttachmentVisibilityEnum: "public" | "internal_only";
        /** @description Admin business-hours calendar serializer. */
        SupportBusinessCalendar: {
            /** @description 0=Monday ... 6=Sunday */
            readonly active_weekdays: unknown;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly department: components["schemas"]["SupportDepartment"];
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly is_default: boolean;
            readonly timezone_name: string;
            readonly title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            /** Format: time */
            readonly workday_end: string;
            /** Format: time */
            readonly workday_start: string;
        };
        /** @description Admin canned response serializer. */
        SupportCannedResponse: {
            readonly body: string;
            readonly category: components["schemas"]["SupportCategory"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly department: components["schemas"]["SupportDepartment"];
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            readonly usage_count: number;
        };
        /** @description Public support tree category serializer. */
        SupportCategory: {
            readonly department: components["schemas"]["SupportDepartment"];
            readonly depth: number;
            readonly description: string;
            readonly icon: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly order: number;
            readonly parent_id: number | null;
            readonly path: string;
            readonly slug: string;
            readonly title: string;
        };
        SupportCategoryListResponse: {
            data: components["schemas"]["SupportCategory"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Public department serializer for support routing. */
        SupportDepartment: {
            readonly description: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly order: number;
            readonly slug: string;
            readonly title: string;
            /** Format: uuid */
            readonly uuid: string;
        };
        SupportDepartmentListResponse: {
            data: components["schemas"]["SupportDepartment"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        SupportDeskErrorResponse: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description Admin duplicate candidate serializer. */
        SupportDuplicateCandidate: {
            readonly candidate_ticket_id: number;
            readonly candidate_ticket_number: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly reason: string;
            /** Format: date-time */
            readonly reviewed_at: string | null;
            readonly reviewed_by_id: number | null;
            readonly score: number;
            readonly status: components["schemas"]["SupportDuplicateReviewStatusEnum"];
            readonly ticket_id: number;
            readonly ticket_number: string;
        };
        /**
         * @description * `active` - فعال
         *     * `dismissed` - نادیده‌گرفته‌شده
         *     * `confirmed` - تأیید تکراری بودن
         * @enum {string}
         */
        SupportDuplicateReviewStatusEnum: "active" | "dismissed" | "confirmed";
        /** @description Admin support holiday serializer. */
        SupportHoliday: {
            readonly calendar: components["schemas"]["SupportBusinessCalendar"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** Format: date */
            readonly date: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description Read serializer for support knowledge base articles. */
        SupportKnowledgeArticle: {
            /** Format: date-time */
            readonly archived_at: string | null;
            readonly body: string;
            readonly category: components["schemas"]["SupportCategory"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly department: components["schemas"]["SupportDepartment"];
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly keywords: unknown;
            /** Format: date-time */
            readonly published_at: string | null;
            readonly slug: string;
            readonly status: components["schemas"]["LMSCourseStatusEnum"];
            readonly status_display: string;
            readonly summary: string;
            readonly ticket_type: components["schemas"]["SupportTicketType"];
            readonly title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            readonly usage_count: number;
        };
        SupportKnowledgeArticleDetailResponse: {
            data: components["schemas"]["SupportKnowledgeArticle"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Admin input serializer for support knowledge base articles. */
        SupportKnowledgeArticleInput: {
            body: string;
            category_id?: number | null;
            department_id?: number | null;
            is_active?: boolean;
            keywords?: string[];
            /** @default draft */
            status: components["schemas"]["LMSCourseStatusEnum"];
            /** @default  */
            summary: string;
            ticket_type_id?: number | null;
            title: string;
        };
        SupportKnowledgeArticleListResponse: {
            data: components["schemas"]["SupportKnowledgeArticleListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        SupportKnowledgeArticleListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["SupportKnowledgeArticle"][];
        };
        /** @description Read serializer for knowledge article usage events. */
        SupportKnowledgeArticleUse: {
            readonly article: number;
            readonly article_title: string;
            readonly context: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly id: number;
            readonly metadata: unknown;
            readonly ticket: number | null;
            readonly ticket_number: string | null;
            readonly used_by: number | null;
        };
        /** @description Input serializer for recording article usage in support context. */
        SupportKnowledgeArticleUseInput: {
            /** @default reply */
            context: string;
            /** @default  */
            ticket_number: string;
        };
        SupportKnowledgeArticleUseResponse: {
            data: components["schemas"]["SupportKnowledgeArticleUse"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Input serializer for knowledge article recommendation. */
        SupportKnowledgeRecommendation: {
            category_id?: number | null;
            department_id?: number | null;
            description: string;
            subject: string;
            ticket_type_id?: number | null;
        };
        /** @description Admin SLA policy serializer. */
        SupportSLAPolicy: {
            readonly business_hours_only: boolean;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly department: components["schemas"]["SupportDepartment"];
            readonly escalate_on_breach: boolean;
            readonly first_response_minutes: number;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly order: number;
            readonly pause_when_waiting_for_user: boolean;
            readonly priority: components["schemas"]["SupportTicketPriorityEnum"];
            readonly resolution_minutes: number;
            readonly severity: components["schemas"]["SupportTicketSeverityEnum"];
            readonly slug: string;
            readonly title: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        /** @description Safe SLA summary serializer. */
        SupportSLAPolicySummary: {
            readonly first_response_minutes: number;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly pause_when_waiting_for_user: boolean;
            readonly resolution_minutes: number;
            readonly title: string;
        };
        /** @description Smart reply suggestion bundle response. */
        SupportSmartReplyBundle: {
            readonly policy_version: string;
            readonly safety_notes: string[];
            readonly suggestions: components["schemas"]["SupportSmartReplySuggestion"][];
            readonly ticket_number: string;
        };
        SupportSmartReplyBundleResponse: {
            data: components["schemas"]["SupportSmartReplyBundle"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description One smart reply suggestion for admin review. */
        SupportSmartReplySuggestion: {
            readonly body: string;
            readonly confidence: number;
            readonly reason_codes: string[];
            readonly source_id: number | null;
            readonly source_type: string;
            readonly title: string;
        };
        /** @description Input serializer for sending a reviewed smart reply suggestion. */
        SupportSmartReplyUse: {
            body: string;
            source_id?: number | null;
            /** @default manual_reviewed */
            source_type: string;
        };
        SupportSmartReplyUseResponse: {
            data: components["schemas"]["SupportAdminTicketMessage"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description User-safe support attachment serializer. */
        SupportTicketAttachment: {
            readonly attachment_kind: components["schemas"]["SupportAttachmentKindEnum"];
            readonly content_type: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** Format: uri */
            readonly file: string;
            readonly file_size: number;
            readonly id: number;
            readonly original_filename: string;
            /** @description Return safe uploader display name. */
            readonly uploaded_by_display: string;
            readonly visibility: components["schemas"]["SupportAttachmentVisibilityEnum"];
        };
        /** @description Input serializer for user attachment upload. */
        SupportTicketAttachmentCreate: {
            /** @default other */
            attachment_kind: components["schemas"]["SupportAttachmentKindEnum"];
            /** Format: uri */
            file: string;
        };
        SupportTicketAttachmentResponse: {
            data: components["schemas"]["SupportTicketAttachment"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Input serializer for creating/updating user tickets. */
        SupportTicketCreateUpdate: {
            category_id?: number | null;
            description: string;
            subject: string;
            ticket_type_id: number;
        };
        /** @description User-safe ticket detail serializer with public timeline and attachments. */
        SupportTicketDetail: {
            readonly assigned_to_id: number | null;
            readonly attachment_count: number;
            readonly attachments: components["schemas"]["SupportTicketAttachment"][];
            readonly category: components["schemas"]["SupportCategory"];
            /** Format: date-time */
            readonly closed_at: string | null;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly department: components["schemas"]["SupportDepartment"];
            readonly description_snapshot: string;
            /** Format: date-time */
            readonly first_admin_response_at: string | null;
            /** Format: date-time */
            readonly first_response_due_at: string | null;
            readonly id: number;
            readonly is_reopenable: boolean;
            /** Format: date-time */
            readonly last_activity_at: string;
            readonly message_count: number;
            readonly messages: components["schemas"]["SupportTicketMessage"][];
            readonly priority: components["schemas"]["SupportTicketPriorityEnum"];
            readonly reopen_count: number;
            /** Format: date-time */
            readonly reopened_at: string | null;
            /** Format: date-time */
            readonly resolution_due_at: string | null;
            /** Format: date-time */
            readonly resolved_at: string | null;
            readonly satisfaction_rating_snapshot: number | null;
            readonly severity: components["schemas"]["SupportTicketSeverityEnum"];
            /** Format: date-time */
            readonly sla_breached_at: string | null;
            readonly sla_total_paused_seconds: number;
            readonly status: components["schemas"]["SupportTicketStatusEnum"];
            readonly subject: string;
            /** Format: date-time */
            readonly submitted_at: string | null;
            readonly ticket_number: string;
            readonly ticket_type: components["schemas"]["SupportTicketType"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            /** Format: uuid */
            readonly uuid: string;
        };
        SupportTicketDetailResponse: {
            data: components["schemas"]["SupportTicketDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description User dashboard ticket card serializer. */
        SupportTicketList: {
            readonly attachment_count: number;
            readonly category: components["schemas"]["SupportCategory"];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly department: components["schemas"]["SupportDepartment"];
            /** Format: date-time */
            readonly first_response_due_at: string | null;
            readonly id: number;
            /** Format: date-time */
            readonly last_activity_at: string;
            readonly message_count: number;
            readonly priority: components["schemas"]["SupportTicketPriorityEnum"];
            readonly reopen_count: number;
            /** Format: date-time */
            readonly resolution_due_at: string | null;
            readonly satisfaction_rating_snapshot: number | null;
            readonly severity: components["schemas"]["SupportTicketSeverityEnum"];
            /** Format: date-time */
            readonly sla_breached_at: string | null;
            readonly status: components["schemas"]["SupportTicketStatusEnum"];
            readonly subject: string;
            /** Format: date-time */
            readonly submitted_at: string | null;
            readonly ticket_number: string;
            readonly ticket_type: components["schemas"]["SupportTicketType"];
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
            /** Format: uuid */
            readonly uuid: string;
        };
        SupportTicketListResponse: {
            data: components["schemas"]["SupportTicketListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        SupportTicketListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["SupportTicketList"][];
        };
        /** @description User-safe public timeline message serializer. */
        SupportTicketMessage: {
            /** @description Return safe display name for a message author. */
            readonly author_display: string;
            readonly body: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** Format: date-time */
            readonly edited_at: string | null;
            readonly id: number;
            readonly is_from_staff: boolean;
            readonly message_type: components["schemas"]["MessageTypeEnum"];
        };
        /**
         * @description * `low` - کم
         *     * `normal` - معمولی
         *     * `high` - زیاد
         *     * `urgent` - فوری
         * @enum {string}
         */
        SupportTicketPriorityEnum: "low" | "normal" | "high" | "urgent";
        /** @description Input serializer for reopening a ticket. */
        SupportTicketReopen: {
            /** @default  */
            reason: string;
        };
        /** @description Input serializer for user/admin replies. */
        SupportTicketReply: {
            body: string;
        };
        SupportTicketReplyResponse: {
            data: components["schemas"]["SupportTicketMessage"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Input serializer for ticket satisfaction rating. */
        SupportTicketSatisfactionCreate: {
            /** @default  */
            comment: string;
            rating: number;
        };
        SupportTicketSatisfactionResponse: {
            data?: unknown;
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description * `minor` - جزئی
         *     * `major` - مهم
         *     * `critical` - بحرانی
         *     * `blocker` - مسدودکننده
         * @enum {string}
         */
        SupportTicketSeverityEnum: "minor" | "major" | "critical" | "blocker";
        /**
         * @description * `draft` - پیش‌نویس
         *     * `submitted` - ثبت‌شده
         *     * `open` - باز
         *     * `in_progress` - در حال بررسی
         *     * `waiting_for_user` - منتظر پاسخ کاربر
         *     * `waiting_for_admin` - منتظر پاسخ ادمین
         *     * `resolved` - حل‌شده
         *     * `closed` - بسته‌شده
         *     * `reopened` - بازگشایی‌شده
         *     * `escalated` - ارجاع/فوری‌شده
         *     * `spam` - اسپم
         *     * `archived` - آرشیوشده
         * @enum {string}
         */
        SupportTicketStatusEnum: "draft" | "submitted" | "open" | "in_progress" | "waiting_for_user" | "waiting_for_admin" | "resolved" | "closed" | "reopened" | "escalated" | "spam" | "archived";
        /** @description Input serializer for smart triage suggestions. */
        SupportTicketSuggest: {
            category_id?: number | null;
            description: string;
            subject: string;
            ticket_type_id?: number | null;
        };
        SupportTicketTimelineResponse: {
            data: components["schemas"]["SupportTicketMessage"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Public dynamic ticket type serializer. */
        SupportTicketType: {
            readonly code: string;
            readonly default_category: components["schemas"]["SupportCategory"];
            readonly default_department: components["schemas"]["SupportDepartment"];
            readonly default_priority: components["schemas"]["SupportTicketPriorityEnum"];
            readonly default_severity: components["schemas"]["SupportTicketSeverityEnum"];
            readonly default_sla_policy: components["schemas"]["SupportSLAPolicySummary"];
            readonly description: string;
            readonly id: number;
            /** فعال */
            readonly is_active: boolean;
            readonly order: number;
            readonly title: string;
        };
        SupportTicketTypeListResponse: {
            data: components["schemas"]["SupportTicketType"][];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Output serializer for smart triage suggestions. */
        SupportTriageSuggestion: {
            category: components["schemas"]["SupportCategory"] | null;
            department: components["schemas"]["SupportDepartment"] | null;
            duplicate_warning: boolean;
            priority: string;
            reason_codes: string[];
            score: number;
            severity: string;
            similar_ticket_ids: number[];
            sla_policy: components["schemas"]["SupportSLAPolicySummary"] | null;
            ticket_type: components["schemas"]["SupportTicketType"] | null;
        };
        SupportTriageSuggestionResponse: {
            data: components["schemas"]["SupportTriageSuggestion"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /**
         * @description سریالایزر خروجی نهایی sync.
         *
         *     فیلدها دقیقاً منعکس‌کننده ساختار `SyncStats` در sync engine هستند.
         *     این سریالایزر هم برای نمایش نتیجه‌ی task موفق استفاده می‌شود،
         *     هم برای نمایش آمار اجراهای قبلی.
         */
        SyncStats: {
            created: number;
            /** Format: double */
            duration_seconds: number;
            errors: number;
            items_processed: number;
            pages_fetched: number;
            skipped: number;
            soft_deleted: number;
            /** Format: date-time */
            started_at?: string | null;
            unchanged: number;
            updated: number;
        };
        /** @description اطلاعات سیستمی پروژه. */
        SystemInfo: {
            /** @description آیا حالت debug فعال است؟ */
            debug: boolean;
            /** @description نسخه Django */
            django_version: string;
            /** @description محیط اجرا */
            environment: string;
            /** @description نام پروژه */
            project_name: string;
            /** @description نسخه پروژه */
            project_version: string;
            /** @description نسخه Python */
            python_version: string;
            /** @description چند ثانیه از start سرور گذشته */
            uptime_seconds: number;
        };
        /** @description سریالایزر پیوست — برای هر دو public و admin. */
        TabyinAttachment: {
            /**
             * مدت (ثانیه)
             * Format: int64
             * @description فقط برای ویدئو/صوت.
             */
            duration?: number;
            /**
             * حجم فایل (KB)
             * Format: int64
             */
            file_size?: number;
            readonly id: number;
            /** نوع رسانه */
            media_type?: components["schemas"]["TabyinMediaTypeEnum"];
            readonly media_type_display: string;
            /**
             * ترتیب
             * Format: int64
             */
            order?: number;
            /**
             * ابعاد
             * @description مثلاً 1280X905
             */
            size?: string;
            /** عنوان فایل */
            title?: string;
            /**
             * آدرس کامل فایل
             * Format: uri
             */
            url: string;
        };
        /**
         * @description * `image` - تصویر
         *     * `video` - ویدئو
         *     * `audio` - صوت
         *     * `other` - سایر
         * @enum {string}
         */
        TabyinMediaTypeEnum: "image" | "video" | "audio" | "other";
        /** @description Input serializer for user-submitted content attachment URLs. */
        TabyinSubmissionAttachmentInput: {
            /** @default other */
            media_type: components["schemas"]["TabyinMediaTypeEnum"];
            /** @default 0 */
            order: number;
            title?: string;
            /** Format: uri */
            url: string;
        };
        /** @description نتیجه چک وضعیت sync تبیین. */
        TabyinSyncCheck: {
            active_contents?: number;
            deleted_in_source?: number;
            detail?: string;
            /** Format: date-time */
            last_synced_at?: string | null;
            seconds_since_last_sync?: number | null;
            status: components["schemas"]["HealthStatusEnum"];
            total_contents?: number;
        };
        TokenRefreshData: {
            access: string;
            refresh?: string;
        };
        TokenRefreshSuccessResponse: {
            data: components["schemas"]["TokenRefreshData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description User activity timeline serializer. */
        UserActivity: {
            /** @description Return safe actor display name. */
            readonly actor_display: string;
            readonly actor_id: number | null;
            readonly aggregate_id: string;
            readonly aggregate_type: string;
            readonly app_label: string;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            readonly event_type: string;
            readonly id: number;
            readonly metadata: unknown;
            readonly summary: string;
            readonly title: string;
            readonly verb: components["schemas"]["UserActivityVerbEnum"];
        };
        /**
         * @description * `created` - ایجاد کرد
         *     * `submitted` - ارسال کرد
         *     * `updated` - بروزرسانی کرد
         *     * `approved` - تأیید شد
         *     * `rejected` - رد شد
         *     * `replied` - پاسخ دریافت کرد
         *     * `resolved` - حل شد
         *     * `paid` - پرداخت کرد
         *     * `issued` - صادر شد
         *     * `revealed` - مشاهده شد
         *     * `matched` - تطبیق یافت
         *     * `notified` - اعلان دریافت کرد
         * @enum {string}
         */
        UserActivityVerbEnum: "created" | "submitted" | "updated" | "approved" | "rejected" | "replied" | "resolved" | "paid" | "issued" | "revealed" | "matched" | "notified";
        /** @description UserAdminSerializer implementation for the authentication application. */
        UserAdmin: {
            /**
             * تاریخ عضویت
             * Format: date-time
             */
            readonly date_joined: string;
            /**
             * ایمیل
             * Format: email
             */
            email?: string | null;
            /** نام */
            first_name?: string;
            readonly full_name: string;
            readonly id: number;
            /** فعال */
            is_active?: boolean;
            /** ایمیل تأیید شده */
            is_email_verified?: boolean;
            /** عضو ستاد */
            is_staff?: boolean;
            /**
             * آخرین ورود
             * Format: date-time
             */
            readonly last_login: string | null;
            /** آخرین IP ورود */
            readonly last_login_ip: string | null;
            /** نام خانوادگی */
            last_name?: string;
            readonly profile: components["schemas"]["Profile"];
            /** نقش */
            role?: components["schemas"]["RoleEnum"];
        };
        UserAdminPaginatedSuccessResponse: {
            data: components["schemas"]["UserAdminPaginatedSuccessResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        UserAdminPaginatedSuccessResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["UserAdmin"][];
        };
        UserAdminSuccessResponse: {
            data: components["schemas"]["UserAdmin"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description UserMeSerializer implementation for the authentication application. */
        UserMe: {
            /**
             * تاریخ عضویت
             * Format: date-time
             */
            readonly date_joined: string;
            /**
             * ایمیل
             * Format: email
             */
            readonly email: string | null;
            /** نام */
            first_name?: string;
            readonly full_name: string;
            readonly id: number;
            /** ایمیل تأیید شده */
            readonly is_email_verified: boolean;
            /** نام خانوادگی */
            last_name?: string;
            readonly profile: components["schemas"]["Profile"];
            /** نقش */
            readonly role: components["schemas"]["RoleEnum"];
        };
        UserMeSuccessResponse: {
            data: components["schemas"]["UserMe"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Input serializer for authenticated user content submissions. */
        UserTabyinSubmissionCreate: {
            attachments?: components["schemas"]["TabyinSubmissionAttachmentInput"][];
            description: string;
            title: string;
        };
        UserTabyinSubmissionCreateBadRequest: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        UserTabyinSubmissionCreatedResponse: {
            data: components["schemas"]["UserTabyinSubmissionDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description Detail serializer for a user's own submitted content. */
        UserTabyinSubmissionDetail: {
            /** یادداشت ادمین */
            admin_note?: string;
            readonly attachments: components["schemas"]["TabyinAttachment"][];
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /** توضیحات */
            description?: string;
            /**
             * شناسه پایدار
             * @description برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
             */
            external_id: string;
            readonly id: number;
            /**
             * زمان بررسی
             * Format: date-time
             */
            reviewed_at?: string | null;
            /** وضعیت بررسی */
            submission_status?: components["schemas"]["SubmissionStatusEnum"];
            /** عنوان */
            title?: string;
            /**
             * تاریخ بروزرسانی
             * Format: date-time
             */
            readonly updated_at: string;
        };
        UserTabyinSubmissionDetailResponse: {
            data: components["schemas"]["UserTabyinSubmissionDetail"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        /** @description List serializer for a user's own submitted contents. */
        UserTabyinSubmissionList: {
            /** یادداشت ادمین */
            admin_note?: string;
            readonly attachments_count: number;
            /**
             * تاریخ ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * شناسه پایدار
             * @description برای محتوای خارجی id منبع و برای محتوای کاربر local UUID است.
             */
            external_id: string;
            readonly id: number;
            /**
             * زمان بررسی
             * Format: date-time
             */
            reviewed_at?: string | null;
            /** وضعیت بررسی */
            submission_status?: components["schemas"]["SubmissionStatusEnum"];
            /** عنوان */
            title?: string;
        };
        UserTabyinSubmissionListResponse: {
            data: components["schemas"]["UserTabyinSubmissionListResponseData"];
            message: string;
            /** @default 200 */
            status_code: number;
            /** @default true */
            success: boolean;
        };
        UserTabyinSubmissionListResponseData: {
            count: number;
            /** Format: uri */
            next?: string | null;
            /** Format: uri */
            previous?: string | null;
            results: components["schemas"]["UserTabyinSubmissionList"][];
        };
        UserTabyinSubmissionNotFound: {
            errors?: unknown;
            message: string;
            status_code: number;
            /** @default false */
            success: boolean;
        };
        /** @description VerifyEmailSerializer implementation for the authentication application. */
        VerifyEmail: {
            code: string;
            /** Format: email */
            email: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    activity_admin_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserActivity"];
                };
            };
        };
    };
    activity_me_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserActivity"];
                };
            };
        };
    };
    admin_command_center_summary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CommandCenterSummaryResponse"];
                };
            };
        };
    };
    audit_logs_admin_list: {
        parameters: {
            query?: {
                /** @description فیلتر بر اساس نوع عملیات (exact match) */
                action?: string;
                /** @description فیلتر از تاریخ (ISO 8601) */
                created_after?: string;
                /** @description فیلتر تا تاریخ (ISO 8601) */
                created_before?: string;
                /** @description فیلتر بر اساس آدرس IP */
                ip_address?: string;
                /** @description فیلتر بر اساس متد HTTP */
                method?: string;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس مسیر درخواست */
                path?: string;
                /** @description فیلتر بر اساس شناسه درخواست (X-Request-ID) */
                request_id?: string;
                /** @description فیلتر بر اساس شناسه منبع */
                resource_id?: string;
                /** @description فیلتر بر اساس نوع منبع (user, report, tabyin_content, ...) */
                resource_type?: string;
                /** @description جستجو در action، resource_type و resource_id */
                search?: string;
                /** @description فیلتر بر اساس شناسه کاربر */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogPaginatedListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogGenericErrorResponse"];
                };
            };
        };
    };
    audit_logs_admin_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                audit_log_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogGenericErrorResponse"];
                };
            };
        };
    };
    audit_logs_admin_export_forensic_package: {
        parameters: {
            query?: {
                /** @description فیلتر بر اساس نوع عملیات (exact match) */
                action?: string;
                /** @description فیلتر از تاریخ (ISO 8601) */
                created_after?: string;
                /** @description فیلتر تا تاریخ (ISO 8601) */
                created_before?: string;
                /** @description فیلتر بر اساس آدرس IP */
                ip_address?: string;
                /** @description فیلتر بر اساس متد HTTP */
                method?: string;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس مسیر درخواست */
                path?: string;
                /** @description فیلتر بر اساس شناسه درخواست (X-Request-ID) */
                request_id?: string;
                /** @description فیلتر بر اساس شناسه منبع */
                resource_id?: string;
                /** @description فیلتر بر اساس نوع منبع (user, report, tabyin_content, ...) */
                resource_type?: string;
                /** @description جستجو در action، resource_type و resource_id */
                search?: string;
                /** @description فیلتر بر اساس شناسه کاربر */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description ZIP forensic package */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_risk_signals_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthRiskSignalListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_risk_signal_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                signal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthRiskSignalReview"];
                "application/x-www-form-urlencoded": components["schemas"]["AuthRiskSignalReview"];
                "multipart/form-data": components["schemas"]["AuthRiskSignalReview"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthRiskSignalDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_users_list: {
        parameters: {
            query?: {
                /** @description فیلتر ایمیل با جستجوی icontains */
                email?: string;
                /** @description فیلتر بر اساس فعال بودن کاربر */
                is_active?: boolean;
                /** @description فیلتر بر اساس تأیید ایمیل */
                is_email_verified?: boolean;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر نقش کاربر */
                role?: "admin" | "user";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAdminPaginatedSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_user_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAdminSuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_user_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_user_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedAdminUserUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedAdminUserUpdate"];
                "multipart/form-data": components["schemas"]["PatchedAdminUserUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAdminSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_user_change_role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminChangeRole"];
                "application/x-www-form-urlencoded": components["schemas"]["AdminChangeRole"];
                "multipart/form-data": components["schemas"]["AdminChangeRole"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserAdminSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_user_sessions_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSessionListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_admin_user_sessions_revoke_all: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_identifier_add_request: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IdentifierAddRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["IdentifierAddRequest"];
                "multipart/form-data": components["schemas"]["IdentifierAddRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_identifier_add_verify: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IdentifierAddVerify"];
                "application/x-www-form-urlencoded": components["schemas"]["IdentifierAddVerify"];
                "multipart/form-data": components["schemas"]["IdentifierAddVerify"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserMeSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_identifier_make_primary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IdentifierMakePrimary"];
                "application/x-www-form-urlencoded": components["schemas"]["IdentifierMakePrimary"];
                "multipart/form-data": components["schemas"]["IdentifierMakePrimary"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserMeSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Login"];
                "application/x-www-form-urlencoded": components["schemas"]["Login"];
                "multipart/form-data": components["schemas"]["Login"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginSuccessResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_login_otp_request: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OTPLoginRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["OTPLoginRequest"];
                "multipart/form-data": components["schemas"]["OTPLoginRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_login_otp_verify: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OTPLoginVerify"];
                "application/x-www-form-urlencoded": components["schemas"]["OTPLoginVerify"];
                "multipart/form-data": components["schemas"]["OTPLoginVerify"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_login_password: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginPassword"];
                "application/x-www-form-urlencoded": components["schemas"]["LoginPassword"];
                "multipart/form-data": components["schemas"]["LoginPassword"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Logout"];
                "application/x-www-form-urlencoded": components["schemas"]["Logout"];
                "multipart/form-data": components["schemas"]["Logout"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_me_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserMeSuccessResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_me_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedUpdateMe"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedUpdateMe"];
                "multipart/form-data": components["schemas"]["PatchedUpdateMe"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserMeSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_password_change: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePassword"];
                "application/x-www-form-urlencoded": components["schemas"]["ChangePassword"];
                "multipart/form-data": components["schemas"]["ChangePassword"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_password_forgot: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ForgotPassword"];
                "application/x-www-form-urlencoded": components["schemas"]["ForgotPassword"];
                "multipart/form-data": components["schemas"]["ForgotPassword"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_password_forgot_confirm_identifier: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IdentifierForgotPasswordConfirm"];
                "application/x-www-form-urlencoded": components["schemas"]["IdentifierForgotPasswordConfirm"];
                "multipart/form-data": components["schemas"]["IdentifierForgotPasswordConfirm"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_password_forgot_request_identifier: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IdentifierForgotPasswordRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["IdentifierForgotPasswordRequest"];
                "multipart/form-data": components["schemas"]["IdentifierForgotPasswordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_password_reset: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetPassword"];
                "application/x-www-form-urlencoded": components["schemas"]["ResetPassword"];
                "multipart/form-data": components["schemas"]["ResetPassword"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_profile_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileSuccessResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_profile_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedUpdateProfile"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedUpdateProfile"];
                "multipart/form-data": components["schemas"]["PatchedUpdateProfile"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Register"];
                "application/x-www-form-urlencoded": components["schemas"]["Register"];
                "multipart/form-data": components["schemas"]["Register"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RegisterSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_resend_verification: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResendVerification"];
                "application/x-www-form-urlencoded": components["schemas"]["ResendVerification"];
                "multipart/form-data": components["schemas"]["ResendVerification"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_sessions_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSessionListResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_sessions_revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSessionDetailResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_signup_request: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SignupRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["SignupRequest"];
                "multipart/form-data": components["schemas"]["SignupRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_signup_verify: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SignupVerify"];
                "application/x-www-form-urlencoded": components["schemas"]["SignupVerify"];
                "multipart/form-data": components["schemas"]["SignupVerify"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_token_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshTokenInput"];
                "application/x-www-form-urlencoded": components["schemas"]["RefreshTokenInput"];
                "multipart/form-data": components["schemas"]["RefreshTokenInput"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenRefreshSuccessResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    auth_verify_email: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyEmail"];
                "application/x-www-form-urlencoded": components["schemas"]["VerifyEmail"];
                "multipart/form-data": components["schemas"]["VerifyEmail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthenticationGenericErrorResponse"];
                };
            };
        };
    };
    health_liveness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SimpleHealth"];
                };
            };
        };
    };
    health_detailed: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DetailedHealth"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DetailedHealth"];
                };
            };
        };
    };
    health_readiness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessHealth"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessHealth"];
                };
            };
        };
    };
    kindness_wall_admin_analytics_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminAnalytics"];
                };
            };
        };
    };
    kindness_admin_categories_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessCategoryListResponse"];
                };
            };
        };
    };
    kindness_admin_categories_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["KindnessAdminCategoryInput"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessAdminCategoryInput"];
                "multipart/form-data": components["schemas"]["KindnessAdminCategoryInput"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminCategoryResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_wall_admin_categories_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessCategory"];
                };
            };
        };
    };
    kindness_wall_admin_categories_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    kindness_wall_admin_categories_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedKindnessCategory"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedKindnessCategory"];
                "multipart/form-data": components["schemas"]["PatchedKindnessCategory"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessCategory"];
                };
            };
        };
    };
    kindness_admin_contact_reveals_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminContactRevealListResponse"];
                };
            };
        };
    };
    kindness_admin_duplicates_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminDuplicateListResponse"];
                };
            };
        };
    };
    kindness_admin_duplicates_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                duplicate_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["KindnessDuplicateReview"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessDuplicateReview"];
                "multipart/form-data": components["schemas"]["KindnessDuplicateReview"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminDuplicateReviewResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_admin_listings_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminListingListResponse"];
                };
            };
        };
    };
    kindness_admin_listings_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_wall_admin_listings_approve_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessUserListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessUserListingDetail"];
                "multipart/form-data": components["schemas"]["KindnessUserListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_wall_admin_listings_reject_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessUserListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessUserListingDetail"];
                "multipart/form-data": components["schemas"]["KindnessUserListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_wall_admin_listings_restore_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessUserListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessUserListingDetail"];
                "multipart/form-data": components["schemas"]["KindnessUserListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_wall_admin_listings_suspend_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessUserListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessUserListingDetail"];
                "multipart/form-data": components["schemas"]["KindnessUserListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_admin_listings_export: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    kindness_admin_matches_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminMatchListResponse"];
                };
            };
        };
    };
    kindness_admin_matches_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                match_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessAdminMatchDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_wall_admin_reports_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessListingReport"];
                };
            };
        };
    };
    kindness_wall_admin_reports_review_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessListingReport"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessListingReport"];
                "multipart/form-data": components["schemas"]["KindnessListingReport"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessListingReport"];
                };
            };
        };
    };
    kindness_admin_reports_export: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    kindness_categories_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessCategoryListResponse"];
                };
            };
        };
    };
    kindness_listings_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessListingListResponse"];
                };
            };
        };
    };
    kindness_listings_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessListingDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_wall_listings_bookmark_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["KindnessListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessListingDetail"];
                "multipart/form-data": components["schemas"]["KindnessListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessListingDetail"];
                };
            };
        };
    };
    kindness_wall_listings_bookmark_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    kindness_listings_matches: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessMatchListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_listings_report: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["KindnessListingReportCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessListingReportCreate"];
                "multipart/form-data": components["schemas"]["KindnessListingReportCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessListingReportResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_listings_reveal_contact: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessContactRevealResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_user_bookmarks_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserBookmarkListResponse"];
                };
            };
        };
    };
    kindness_user_listings_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingListResponse"];
                };
            };
        };
    };
    kindness_user_listings_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessListingCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessListingCreateUpdate"];
                "multipart/form-data": components["schemas"]["KindnessListingCreateUpdate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_wall_me_listings_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_wall_me_listings_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    kindness_wall_me_listings_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedKindnessUserListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedKindnessUserListingDetail"];
                "multipart/form-data": components["schemas"]["PatchedKindnessUserListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_user_listings_close: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessWallErrorResponse"];
                };
            };
        };
    };
    kindness_wall_me_listings_renew_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessUserListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessUserListingDetail"];
                "multipart/form-data": components["schemas"]["KindnessUserListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_wall_me_listings_submit_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessUserListingDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessUserListingDetail"];
                "multipart/form-data": components["schemas"]["KindnessUserListingDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessUserListingDetail"];
                };
            };
        };
    };
    kindness_wall_me_matches_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessMatch"];
                };
            };
        };
    };
    kindness_wall_me_matches_contacted_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                match_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessMatch"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessMatch"];
                "multipart/form-data": components["schemas"]["KindnessMatch"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessMatch"];
                };
            };
        };
    };
    kindness_wall_me_matches_dismiss_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                match_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["KindnessMatch"];
                "application/x-www-form-urlencoded": components["schemas"]["KindnessMatch"];
                "multipart/form-data": components["schemas"]["KindnessMatch"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindnessMatch"];
                };
            };
        };
    };
    lms_admin_learning_activity_statements_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLearningStatementListResponse"];
                };
            };
        };
    };
    lms_admin_answers_moderate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                answer_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedDiscussionModeration"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedDiscussionModeration"];
                "multipart/form-data": components["schemas"]["PatchedDiscussionModeration"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonAnswerResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_categories_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCategoryListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_categories_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["LMSCategoryCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["LMSCategoryCreateUpdate"];
                "multipart/form-data": components["schemas"]["LMSCategoryCreateUpdate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCategoryResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_categories_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCategoryResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_categories_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCategoryDeletedResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_categories_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedLMSCategoryCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedLMSCategoryCreateUpdate"];
                "multipart/form-data": components["schemas"]["PatchedLMSCategoryCreateUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCategoryResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_certificates_revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                certificate_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CertificateRevoke"];
                "application/x-www-form-urlencoded": components["schemas"]["CertificateRevoke"];
                "multipart/form-data": components["schemas"]["CertificateRevoke"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCertificateResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseListResponse"];
                };
            };
        };
    };
    lms_admin_courses_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CourseCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["CourseCreateUpdate"];
                "multipart/form-data": components["schemas"]["CourseCreateUpdate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseDeletedResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedCourseCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedCourseCreateUpdate"];
                "multipart/form-data": components["schemas"]["PatchedCourseCreateUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_analytics: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseAnalyticsResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_archive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_export: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_leaderboard: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseLeaderboardResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_lessons_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_lessons_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["LessonCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["LessonCreateUpdate"];
                "multipart/form-data": components["schemas"]["LessonCreateUpdate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_quiz_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAdminResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_quiz_create_or_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["QuizCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["QuizCreateUpdate"];
                "multipart/form-data": components["schemas"]["QuizCreateUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAdminResponse"];
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAdminResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_quiz_publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAdminResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_quiz_questions_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuizQuestionCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["QuizQuestionCreate"];
                "multipart/form-data": components["schemas"]["QuizQuestionCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizQuestionResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_quiz_unlock: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuizUnlockCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["QuizUnlockCreate"];
                "multipart/form-data": components["schemas"]["QuizUnlockCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizUnlockResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_courses_report: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                course_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseReportResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_discussion_reports_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSDiscussionReportListResponse"];
                };
            };
        };
    };
    lms_admin_discussion_reports_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedDiscussionReportReview"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedDiscussionReportReview"];
                "multipart/form-data": components["schemas"]["PatchedDiscussionReportReview"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSDiscussionReportResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_lessons_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonDeletedResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_lessons_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedLessonCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedLessonCreateUpdate"];
                "multipart/form-data": components["schemas"]["PatchedLessonCreateUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_lessons_video_processing_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSVideoProcessingJobResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_lessons_video_processing_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSVideoProcessingJobResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_questions_moderate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                question_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedDiscussionModeration"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedDiscussionModeration"];
                "multipart/form-data": components["schemas"]["PatchedDiscussionModeration"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonQuestionResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_quiz_options_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                question_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuizOptionCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["QuizOptionCreate"];
                "multipart/form-data": components["schemas"]["QuizOptionCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizOptionResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_admin_learning_recommendations_overview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLearningRecommendationOverviewResponse"];
                };
            };
        };
    };
    lms_answers_report: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                answer_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DiscussionReportCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["DiscussionReportCreate"];
                "multipart/form-data": components["schemas"]["DiscussionReportCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSDiscussionReportResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_public_categories_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCategoryListResponse"];
                };
            };
        };
    };
    lms_public_categories_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCategoryResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_public_certificates_verify: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                verification_slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCertificateVerifyResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_public_courses_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseListResponse"];
                };
            };
        };
    };
    lms_public_courses_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCourseResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_course_enroll: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSEnrollmentResponse"];
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSEnrollmentResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_public_course_lessons_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_public_lessons_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_slug: string;
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_course_quiz_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizPublicResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_quiz_attempt_start: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAttemptResponse"];
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAttemptResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_lessons_media_access: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
                media_kind: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonMediaAccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_lessons_progress_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LessonProgressUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["LessonProgressUpdate"];
                "multipart/form-data": components["schemas"]["LessonProgressUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonProgressResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_lesson_questions_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonQuestionListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_lesson_questions_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LessonQuestionCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["LessonQuestionCreate"];
                "multipart/form-data": components["schemas"]["LessonQuestionCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonQuestionResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_certificates_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCertificateListResponse"];
                };
            };
        };
    };
    lms_user_certificates_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                certificate_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSCertificateResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_enrollments_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSEnrollmentListResponse"];
                };
            };
        };
    };
    lms_user_enrollments_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                enrollment_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSEnrollmentDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_learning_recommendations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLearningRecommendationResponse"];
                };
            };
        };
    };
    lms_user_skills_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSSkillListResponse"];
                };
            };
        };
    };
    lms_question_answers_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                question_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LessonAnswerCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["LessonAnswerCreate"];
                "multipart/form-data": components["schemas"]["LessonAnswerCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonAnswerResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_question_answers_accept: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                answer_id: number;
                question_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSLessonAnswerResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_questions_report: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                question_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DiscussionReportCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["DiscussionReportCreate"];
                "multipart/form-data": components["schemas"]["DiscussionReportCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSDiscussionReportResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_quiz_attempt_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                attempt_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAttemptResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    lms_user_quiz_attempt_submit: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                attempt_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuizAttemptSubmit"];
                "application/x-www-form-urlencoded": components["schemas"]["QuizAttemptSubmit"];
                "multipart/form-data": components["schemas"]["QuizAttemptSubmit"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSQuizAttemptResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LMSErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_adjustments_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminAdjustmentsListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_adjustments_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinancialAdjustmentCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["FinancialAdjustmentCreate"];
                "multipart/form-data": components["schemas"]["FinancialAdjustmentCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminAdjustmentDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_adjustment_action: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                action: string;
                adjustment_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinancialAdjustmentReject"];
                "application/x-www-form-urlencoded": components["schemas"]["FinancialAdjustmentReject"];
                "multipart/form-data": components["schemas"]["FinancialAdjustmentReject"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminAdjustmentDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaigns_list: {
        parameters: {
            query?: {
                created_after?: string;
                created_before?: string;
                is_active?: boolean;
                is_visible?: boolean;
                max_total_amount?: number;
                min_total_amount?: number;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                search?: string;
                /** @description شناسه مددکار */
                sponsor?: number;
                /** @description وضعیت حرکت */
                status?: "closed" | "completed" | "draft" | "published";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaigns_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CampaignAdminCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["CampaignAdminCreate"];
                "multipart/form-data": components["schemas"]["CampaignAdminCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedCampaignAdminUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedCampaignAdminUpdate"];
                "multipart/form-data": components["schemas"]["PatchedCampaignAdminUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_analytics: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignAnalyticsResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_close: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_disbursable_summary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminDisbursableSummaryResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_export: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": string;
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_financial_control: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminFinancialControlResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_images_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignImageListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_images_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CampaignImageCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["CampaignImageCreate"];
                "multipart/form-data": components["schemas"]["CampaignImageCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignImageResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_images_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
                image_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarEmptySuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_intelligence: {
        parameters: {
            query?: {
                /** @description بازه تحلیل روزانه؛ پیش‌فرض ۳۰، حداکثر ۳۶۵. */
                days?: number;
            };
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignIntelligenceResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_leaderboard: {
        parameters: {
            query?: {
                /** @description تعداد نفرات برتر (پیش‌فرض ۱۰، حداکثر ۱۰۰) */
                top_n?: number;
            };
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminLeaderboardResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_participants_list: {
        parameters: {
            query?: {
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
            };
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminParticipantsListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_campaign_publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminCampaignDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_disbursements_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminDisbursementListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_disbursements_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CampaignDisbursementCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["CampaignDisbursementCreate"];
                "multipart/form-data": components["schemas"]["CampaignDisbursementCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminDisbursementDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_disbursement_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                disbursement_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminDisbursementDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_disbursement_action: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                action: string;
                disbursement_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CampaignDisbursementMarkPaid"];
                "application/x-www-form-urlencoded": components["schemas"]["CampaignDisbursementMarkPaid"];
                "multipart/form-data": components["schemas"]["CampaignDisbursementMarkPaid"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminDisbursementDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_financial_control_snapshots_list: {
        parameters: {
            query?: {
                severity?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminFinancialControlSnapshotListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_financial_control_generate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminFinancialControlSnapshotDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_financial_control_latest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminFinancialControlSnapshotDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_intelligence_overview: {
        parameters: {
            query?: {
                /** @description بازه تحلیل روزانه؛ پیش‌فرض ۳۰، حداکثر ۳۶۵. */
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminIntelligenceOverviewResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_payments_list: {
        parameters: {
            query?: {
                /** @description فیلتر بر اساس شناسه حرکت */
                campaign?: number;
                /** @description فیلتر بر اساس نام درگاه (sandbox, zarinpal, ...) */
                gateway_name?: string;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس وضعیت پرداخت */
                status?: "failed" | "pending" | "success";
                /** @description فیلتر بر اساس شناسه کاربر */
                user?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminPaymentsListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_receipt_resend: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                receipt_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["DonationReceiptResend"];
                "application/x-www-form-urlencoded": components["schemas"]["DonationReceiptResend"];
                "multipart/form-data": components["schemas"]["DonationReceiptResend"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarUserReceiptDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_reconciliation_batches_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminReconciliationBatchListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_reconciliation_batch_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                batch_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminReconciliationBatchDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_reconciliation_discrepancies_export: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                batch_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_reconciliation_items_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                batch_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminReconciliationItemListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_reconciliation_import: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/x-www-form-urlencoded": components["schemas"]["PaymentReconciliationImport"];
                "multipart/form-data": components["schemas"]["PaymentReconciliationImport"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminReconciliationBatchDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_refunds_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminRefundsListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_refunds_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentRefundRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["PaymentRefundRequest"];
                "multipart/form-data": components["schemas"]["PaymentRefundRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminRefundDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_refund_approve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                action: string;
                refund_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminRefundDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_risk_signals_list: {
        parameters: {
            query?: {
                campaign?: number;
                ip_address?: string;
                severity?: string;
                status?: string;
                user?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminRiskSignalsListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_risk_signal_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                signal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MadadkarRiskSignalReview"];
                "application/x-www-form-urlencoded": components["schemas"]["MadadkarRiskSignalReview"];
                "multipart/form-data": components["schemas"]["MadadkarRiskSignalReview"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminRiskSignalDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_sponsors_list: {
        parameters: {
            query?: {
                is_active?: boolean;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminSponsorListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_sponsors_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SponsorCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["SponsorCreate"];
                "multipart/form-data": components["schemas"]["SponsorCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminSponsorDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_sponsor_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sponsor_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminSponsorDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_sponsor_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sponsor_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarEmptySuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_admin_sponsor_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sponsor_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSponsorUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSponsorUpdate"];
                "multipart/form-data": components["schemas"]["PatchedSponsorUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarAdminSponsorDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_public_campaigns_list: {
        parameters: {
            query?: {
                /** @description فیلتر بر اساس داشتن مهلت زمانی */
                has_deadline?: boolean;
                /** @description فیلتر بر اساس تکمیل ۱۰۰٪ سهم‌ها */
                is_fully_funded?: boolean;
                /** @description ترتیب: published_at, created_at, progress, deadline (با - برای descending) */
                ordering?: string;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description جستجو در عنوان و توضیحات */
                search?: string;
                /** @description فیلتر بر اساس شناسه مددکار */
                sponsor?: number;
                /** @description فیلتر بر اساس slug مددکار */
                sponsor_slug?: string;
                /** @description فیلتر بر اساس وضعیت حرکت */
                status?: "closed" | "completed" | "published";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPublicCampaignListResponse"];
                };
            };
        };
    };
    madadkar_public_campaign_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPublicCampaignDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_user_participate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ParticipationInitiate"];
                "application/x-www-form-urlencoded": components["schemas"]["ParticipationInitiate"];
                "multipart/form-data": components["schemas"]["ParticipationInitiate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarParticipationInitiatedResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_public_campaign_transparency: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPublicCampaignTransparencyResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_user_my_participations_list: {
        parameters: {
            query?: {
                /** @description فیلتر بر اساس شناسه حرکت */
                campaign?: number;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس وضعیت مشارکت */
                status?: "expired" | "failed" | "paid" | "pending_payment";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarUserParticipationListResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_user_my_participation_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                participation_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarUserParticipationDetailResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_user_receipts_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarUserReceiptListResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_user_receipt_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                receipt_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarUserReceiptDetailResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_payment_verify: {
        parameters: {
            query: {
                authority: string;
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPaymentVerifyResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_payment_verify_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentVerifyCallback"];
                "application/x-www-form-urlencoded": components["schemas"]["PaymentVerifyCallback"];
                "multipart/form-data": components["schemas"]["PaymentVerifyCallback"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPaymentVerifyResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_public_receipt_verify: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DonationReceiptPublicVerify"];
                "application/x-www-form-urlencoded": components["schemas"]["DonationReceiptPublicVerify"];
                "multipart/form-data": components["schemas"]["DonationReceiptPublicVerify"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPublicReceiptVerifyResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    madadkar_public_sponsors_list: {
        parameters: {
            query?: {
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPublicSponsorListResponse"];
                };
            };
        };
    };
    madadkar_public_sponsor_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarPublicSponsorDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MadadkarGenericErrorResponse"];
                };
            };
        };
    };
    metrics_prometheus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description No response body */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    notifications_admin_deliveries_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationDelivery"];
                };
            };
        };
    };
    notifications_admin_events_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationEvent"];
                };
            };
        };
    };
    notifications_admin_templates_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationTemplate"];
                };
            };
        };
    };
    notifications_me_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationDelivery"];
                };
            };
        };
    };
    notifications_me_read_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                delivery_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["NotificationDelivery"];
                "application/x-www-form-urlencoded": components["schemas"]["NotificationDelivery"];
                "multipart/form-data": components["schemas"]["NotificationDelivery"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationDelivery"];
                };
            };
        };
    };
    notifications_me_preferences_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationPreference"];
                };
            };
        };
    };
    notifications_me_preferences_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["NotificationPreference"];
                "application/x-www-form-urlencoded": components["schemas"]["NotificationPreference"];
                "multipart/form-data": components["schemas"]["NotificationPreference"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationPreference"];
                };
            };
        };
    };
    notifications_me_read_all_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["NotificationDelivery"];
                "application/x-www-form-urlencoded": components["schemas"]["NotificationDelivery"];
                "multipart/form-data": components["schemas"]["NotificationDelivery"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationDelivery"];
                };
            };
        };
    };
    reports_admin_reports_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportListPaginatedSuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_admin_report_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportDetailSuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_admin_report_status_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedReportStatusUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedReportStatusUpdate"];
                "multipart/form-data": components["schemas"]["PatchedReportStatusUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportDetailSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_admin_subjects_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportSubjectAdminListSuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_admin_subjects_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportSubjectCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["ReportSubjectCreate"];
                "multipart/form-data": components["schemas"]["ReportSubjectCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportSubjectAdminDetailSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_admin_subject_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportSubjectAdminDetailSuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_admin_subject_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsEmptySuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_admin_subject_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedReportSubjectUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedReportSubjectUpdate"];
                "multipart/form-data": components["schemas"]["PatchedReportSubjectUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportSubjectAdminDetailSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["ReportCreate"];
                "multipart/form-data": components["schemas"]["ReportCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportPublicCreatedSuccessResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicReportsGenericErrorResponse"];
                };
            };
        };
    };
    reports_subjects_public_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportSubjectPublicListSuccessResponse"];
                };
            };
        };
    };
    r4j_admin_bounties_list: {
        parameters: {
            query?: {
                /** @description جوایز ثبت‌شده بعد از این تاریخ */
                created_after?: string;
                /** @description جوایز ثبت‌شده قبل از این تاریخ */
                created_before?: string;
                /** @description فیلتر بر اساس شناسه مجرم */
                criminal_id?: number;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس وضعیت جایزه */
                status?: string;
                /** @description فیلتر بر اساس شناسه کاربر تعیین‌کننده جایزه */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminBountyListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_bounty_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bounty_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminBountyDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_bounty_cancel_approve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bounty_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["R4JBountyCancelAction"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JBountyCancelAction"];
                "multipart/form-data": components["schemas"]["R4JBountyCancelAction"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminBountyDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_bounty_cancel_reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bounty_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["R4JBountyCancelAction"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JBountyCancelAction"];
                "multipart/form-data": components["schemas"]["R4JBountyCancelAction"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminBountyDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_case_list: {
        parameters: {
            query?: {
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseListResponse"];
                };
            };
        };
    };
    r4j_admin_case_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_case_assign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseAssign"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseAssign"];
                "multipart/form-data": components["schemas"]["R4JCaseAssign"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_close: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseNoteRequired"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseNoteRequired"];
                "multipart/form-data": components["schemas"]["R4JCaseNoteRequired"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_escalate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseNoteRequired"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseNoteRequired"];
                "multipart/form-data": components["schemas"]["R4JCaseNoteRequired"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_priority: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCasePriority"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCasePriority"];
                "multipart/form-data": components["schemas"]["R4JCasePriority"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseNoteRequired"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseNoteRequired"];
                "multipart/form-data": components["schemas"]["R4JCaseNoteRequired"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_reopen: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseNoteRequired"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseNoteRequired"];
                "multipart/form-data": components["schemas"]["R4JCaseNoteRequired"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_evidence_request: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseEvidenceRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseEvidenceRequest"];
                "multipart/form-data": components["schemas"]["R4JCaseEvidenceRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_resolve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseNoteRequired"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseNoteRequired"];
                "multipart/form-data": components["schemas"]["R4JCaseNoteRequired"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_case_timeline: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseEventListResponse"];
                };
            };
        };
    };
    r4j_admin_case_triage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                case_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCaseTriage"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseTriage"];
                "multipart/form-data": components["schemas"]["R4JCaseTriage"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
        };
    };
    r4j_admin_criminals_list: {
        parameters: {
            query?: {
                /** @description فیلتر بر اساس شهر */
                city?: string;
                /** @description فیلتر بر اساس کشور */
                country?: string;
                /** @description فیلتر بر اساس جنسیت */
                gender?: "female" | "male" | "unknown";
                /** @description فیلتر بر اساس فعال بودن */
                is_active?: boolean;
                /** @description فیلتر بر اساس انتشار */
                is_published?: boolean;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس استان */
                province?: string;
                /** @description جستجو در نام، نام خانوادگی، slug و اسامی مستعار */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCriminalListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_criminals_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JCriminalCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCriminalCreate"];
                "multipart/form-data": components["schemas"]["R4JCriminalCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCriminalDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_criminal_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCriminalDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_criminal_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JEmptySuccessResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_criminal_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedR4JCriminalUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedR4JCriminalUpdate"];
                "multipart/form-data": components["schemas"]["PatchedR4JCriminalUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCriminalDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_aliases_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminAliasListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_aliases_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JAliasCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JAliasCreate"];
                "multipart/form-data": components["schemas"]["R4JAliasCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminAliasResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_aliases_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                alias_id: number;
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JEmptySuccessResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_attachments_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminAttachmentListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_attachments_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JAttachmentCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JAttachmentCreate"];
                "multipart/form-data": components["schemas"]["R4JAttachmentCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminAttachmentResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_attachments_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                attachment_id: number;
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JEmptySuccessResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_phones_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminPhoneListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_phones_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JPhoneCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JPhoneCreate"];
                "multipart/form-data": components["schemas"]["R4JPhoneCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminPhoneResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_phones_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
                phone_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JEmptySuccessResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_phones_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
                phone_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedR4JPhoneUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedR4JPhoneUpdate"];
                "multipart/form-data": components["schemas"]["PatchedR4JPhoneUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminPhoneResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_photos_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminPhotoListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_photos_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JPhotoCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JPhotoCreate"];
                "multipart/form-data": components["schemas"]["R4JPhotoCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminPhotoResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_photos_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
                photo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JEmptySuccessResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_photos_set_primary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
                photo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminPhotoResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_criminal_publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCriminalDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_socials_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminSocialListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_socials_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JSocialCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JSocialCreate"];
                "multipart/form-data": components["schemas"]["R4JSocialCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminSocialResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_socials_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
                social_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JEmptySuccessResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_socials_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
                social_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedR4JSocialUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedR4JSocialUpdate"];
                "multipart/form-data": components["schemas"]["PatchedR4JSocialUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminSocialResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_criminal_unpublish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCriminalDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_visibility_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminVisibilityListResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_visibility_upsert: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedR4JFieldVisibilityUpsert"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedR4JFieldVisibilityUpsert"];
                "multipart/form-data": components["schemas"]["PatchedR4JFieldVisibilityUpsert"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminVisibilityResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_evidence_custody_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCustodyEventListResponse"];
                };
            };
        };
    };
    r4j_admin_evidence_custody_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                event_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JEvidenceCustodyReview"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JEvidenceCustodyReview"];
                "multipart/form-data": components["schemas"]["R4JEvidenceCustodyReview"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminCustodyEventResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_case_operations_overview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseOperationsOverviewResponse"];
                };
            };
        };
    };
    r4j_admin_reports_list: {
        parameters: {
            query?: {
                /** @description گزارشات بعد از این تاریخ */
                created_after?: string;
                /** @description گزارشات قبل از این تاریخ */
                created_before?: string;
                /** @description فیلتر بر اساس شناسه مجرم */
                criminal_id?: number;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس وضعیت گزارش */
                status?: string;
                /** @description فیلتر بر اساس شناسه گزارش‌دهنده */
                submitted_by_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminReportListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_report_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminReportDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_report_cancel_approve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["R4JReportCancelAction"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JReportCancelAction"];
                "multipart/form-data": components["schemas"]["R4JReportCancelAction"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminReportDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_report_cancel_reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["R4JReportCancelAction"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JReportCancelAction"];
                "multipart/form-data": components["schemas"]["R4JReportCancelAction"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminReportDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_case_create_from_report: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["R4JCaseCreateFromReport"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JCaseCreateFromReport"];
                "multipart/form-data": components["schemas"]["R4JCaseCreateFromReport"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JCaseDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_admin_report_review: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["R4JReportReview"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JReportReview"];
                "multipart/form-data": components["schemas"]["R4JReportReview"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JAdminReportDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_public_criminals_list: {
        parameters: {
            query?: {
                /** @description فیلتر بر اساس شهر */
                city?: string;
                /** @description فیلتر بر اساس کشور */
                country?: string;
                /** @description فیلتر بر اساس جنسیت */
                gender?: "female" | "male" | "unknown";
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس استان */
                province?: string;
                /** @description جستجو در نام، نام خانوادگی، slug و اسامی مستعار */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JPublicCriminalListResponse"];
                };
            };
        };
    };
    r4j_user_bounty_set_or_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["R4JBountySet"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JBountySet"];
                "multipart/form-data": components["schemas"]["R4JBountySet"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserBountyDetailResponse"];
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserBountyDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_user_report_submit: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                criminal_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["R4JReportSubmit"];
                "application/x-www-form-urlencoded": components["schemas"]["R4JReportSubmit"];
                "multipart/form-data": components["schemas"]["R4JReportSubmit"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserReportDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_public_criminal_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lookup: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JPublicCriminalDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_user_my_bounties_list: {
        parameters: {
            query?: {
                /** @description جوایز ثبت‌شده بعد از این تاریخ */
                created_after?: string;
                /** @description جوایز ثبت‌شده قبل از این تاریخ */
                created_before?: string;
                /** @description فیلتر بر اساس شناسه مجرم */
                criminal_id?: number;
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس وضعیت جایزه */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserBountyListResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_user_bounty_cancel_request: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bounty_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserBountyDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_user_my_reports_list: {
        parameters: {
            query?: {
                /** @description شماره صفحه */
                page?: number;
                /** @description تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
                page_size?: number;
                /** @description فیلتر بر اساس وضعیت گزارش */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserReportListResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_user_my_report_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserReportDetailResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    r4j_user_report_cancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                report_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JUserReportDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["R4JGenericErrorResponse"];
                };
            };
        };
    };
    support_admin_analytics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminAnalyticsResponse"];
                };
            };
        };
    };
    support_admin_business_calendars_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportBusinessCalendar"];
                };
            };
        };
    };
    support_admin_business_calendars_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportBusinessCalendar"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportBusinessCalendar"];
                "multipart/form-data": components["schemas"]["SupportBusinessCalendar"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportBusinessCalendar"];
                };
            };
        };
    };
    support_admin_business_calendars_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                calendar_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportBusinessCalendar"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportBusinessCalendar"];
                "multipart/form-data": components["schemas"]["PatchedSupportBusinessCalendar"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportBusinessCalendar"];
                };
            };
        };
    };
    support_admin_canned_responses_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCannedResponse"];
                };
            };
        };
    };
    support_admin_canned_responses_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportCannedResponse"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportCannedResponse"];
                "multipart/form-data": components["schemas"]["SupportCannedResponse"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCannedResponse"];
                };
            };
        };
    };
    support_admin_canned_responses_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                canned_response_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportCannedResponse"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportCannedResponse"];
                "multipart/form-data": components["schemas"]["PatchedSupportCannedResponse"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCannedResponse"];
                };
            };
        };
    };
    support_admin_canned_responses_use_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                canned_response_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportCannedResponse"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportCannedResponse"];
                "multipart/form-data": components["schemas"]["SupportCannedResponse"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCannedResponse"];
                };
            };
        };
    };
    support_admin_categories_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCategory"];
                };
            };
        };
    };
    support_admin_categories_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportCategory"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportCategory"];
                "multipart/form-data": components["schemas"]["SupportCategory"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCategory"];
                };
            };
        };
    };
    support_admin_categories_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    support_admin_categories_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                category_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportCategory"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportCategory"];
                "multipart/form-data": components["schemas"]["PatchedSupportCategory"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCategory"];
                };
            };
        };
    };
    support_admin_departments_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminDepartmentListResponse"];
                };
            };
        };
    };
    support_admin_departments_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportDepartment"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportDepartment"];
                "multipart/form-data": components["schemas"]["SupportDepartment"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDepartment"];
                };
            };
        };
    };
    support_admin_departments_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                department_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminDepartmentResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_departments_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                department_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    support_admin_departments_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                department_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportDepartment"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportDepartment"];
                "multipart/form-data": components["schemas"]["PatchedSupportDepartment"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDepartment"];
                };
            };
        };
    };
    support_admin_duplicates_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDuplicateCandidate"];
                };
            };
        };
    };
    support_admin_duplicates_review_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                duplicate_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportDuplicateCandidate"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportDuplicateCandidate"];
                "multipart/form-data": components["schemas"]["SupportDuplicateCandidate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDuplicateCandidate"];
                };
            };
        };
    };
    support_admin_export_csat: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    support_admin_export_messages: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    support_admin_export_sla: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    support_admin_export_tickets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    support_admin_holidays_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportHoliday"];
                };
            };
        };
    };
    support_admin_holidays_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportHoliday"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportHoliday"];
                "multipart/form-data": components["schemas"]["SupportHoliday"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportHoliday"];
                };
            };
        };
    };
    support_admin_holidays_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                holiday_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportHoliday"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportHoliday"];
                "multipart/form-data": components["schemas"]["PatchedSupportHoliday"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportHoliday"];
                };
            };
        };
    };
    support_admin_knowledge_articles_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleListResponse"];
                };
            };
        };
    };
    support_admin_knowledge_articles_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportKnowledgeArticleInput"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportKnowledgeArticleInput"];
                "multipart/form-data": components["schemas"]["SupportKnowledgeArticleInput"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_knowledge_article_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                article_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_knowledge_article_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                article_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportKnowledgeArticleInput"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportKnowledgeArticleInput"];
                "multipart/form-data": components["schemas"]["PatchedSupportKnowledgeArticleInput"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_knowledge_article_archive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                article_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_knowledge_article_publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                article_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_knowledge_article_use: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                article_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportKnowledgeArticleUseInput"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportKnowledgeArticleUseInput"];
                "multipart/form-data": components["schemas"]["SupportKnowledgeArticleUseInput"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleUseResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_sla_policies_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportSLAPolicy"];
                };
            };
        };
    };
    support_admin_sla_policies_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportSLAPolicy"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportSLAPolicy"];
                "multipart/form-data": components["schemas"]["SupportSLAPolicy"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportSLAPolicy"];
                };
            };
        };
    };
    support_admin_sla_policies_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                policy_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportSLAPolicy"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportSLAPolicy"];
                "multipart/form-data": components["schemas"]["PatchedSupportSLAPolicy"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportSLAPolicy"];
                };
            };
        };
    };
    support_admin_ticket_types_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketType"];
                };
            };
        };
    };
    support_admin_ticket_types_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportTicketType"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportTicketType"];
                "multipart/form-data": components["schemas"]["SupportTicketType"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketType"];
                };
            };
        };
    };
    support_admin_ticket_types_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_type_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportTicketType"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportTicketType"];
                "multipart/form-data": components["schemas"]["PatchedSupportTicketType"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketType"];
                };
            };
        };
    };
    support_admin_tickets_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketListResponse"];
                };
            };
        };
    };
    support_admin_tickets_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_tickets_assign_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportAdminTicketDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportAdminTicketDetail"];
                "multipart/form-data": components["schemas"]["SupportAdminTicketDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketDetail"];
                };
            };
        };
    };
    support_admin_ticket_assignment_recommendation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAssignmentRecommendationResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_ticket_auto_assign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportAdminAssign"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportAdminAssign"];
                "multipart/form-data": components["schemas"]["SupportAdminAssign"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_tickets_close_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportAdminTicketDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportAdminTicketDetail"];
                "multipart/form-data": components["schemas"]["SupportAdminTicketDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketDetail"];
                };
            };
        };
    };
    support_admin_tickets_escalate_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportAdminTicketDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportAdminTicketDetail"];
                "multipart/form-data": components["schemas"]["SupportAdminTicketDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketDetail"];
                };
            };
        };
    };
    support_admin_tickets_internal_note_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportAdminTicketMessage"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportAdminTicketMessage"];
                "multipart/form-data": components["schemas"]["SupportAdminTicketMessage"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketMessage"];
                };
            };
        };
    };
    support_admin_tickets_reply_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportAdminTicketMessage"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportAdminTicketMessage"];
                "multipart/form-data": components["schemas"]["SupportAdminTicketMessage"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketMessage"];
                };
            };
        };
    };
    support_admin_ticket_smart_replies: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportSmartReplyBundleResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_ticket_smart_reply_use: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportSmartReplyUse"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportSmartReplyUse"];
                "multipart/form-data": components["schemas"]["SupportSmartReplyUse"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportSmartReplyUseResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_admin_tickets_status_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportAdminTicketDetail"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportAdminTicketDetail"];
                "multipart/form-data": components["schemas"]["SupportAdminTicketDetail"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportAdminTicketDetail"];
                };
            };
        };
    };
    support_categories_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportCategoryListResponse"];
                };
            };
        };
    };
    support_departments_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDepartmentListResponse"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_knowledge_articles_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleListResponse"];
                };
            };
        };
    };
    support_knowledge_article_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_knowledge_articles_recommend: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportKnowledgeRecommendation"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportKnowledgeRecommendation"];
                "multipart/form-data": components["schemas"]["SupportKnowledgeRecommendation"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportKnowledgeArticleListResponse"];
                };
            };
        };
    };
    support_user_tickets_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketListResponse"];
                };
            };
        };
    };
    support_user_tickets_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportTicketCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportTicketCreateUpdate"];
                "multipart/form-data": components["schemas"]["SupportTicketCreateUpdate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketDetailResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedSupportTicketCreateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedSupportTicketCreateUpdate"];
                "multipart/form-data": components["schemas"]["PatchedSupportTicketCreateUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_attachment_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportTicketAttachmentCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportTicketAttachmentCreate"];
                "multipart/form-data": components["schemas"]["SupportTicketAttachmentCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketAttachmentResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_reopen: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SupportTicketReopen"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportTicketReopen"];
                "multipart/form-data": components["schemas"]["SupportTicketReopen"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_reply: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportTicketReply"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportTicketReply"];
                "multipart/form-data": components["schemas"]["SupportTicketReply"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketReplyResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_satisfaction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportTicketSatisfactionCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportTicketSatisfactionCreate"];
                "multipart/form-data": components["schemas"]["SupportTicketSatisfactionCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketSatisfactionResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_submit: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_timeline: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket_number: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketTimelineResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportDeskErrorResponse"];
                };
            };
        };
    };
    support_user_tickets_suggest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportTicketSuggest"];
                "application/x-www-form-urlencoded": components["schemas"]["SupportTicketSuggest"];
                "multipart/form-data": components["schemas"]["SupportTicketSuggest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTriageSuggestionResponse"];
                };
            };
        };
    };
    support_ticket_types_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SupportTicketTypeListResponse"];
                };
            };
        };
    };
    tabyin_admin_contents_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentListResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentListForbiddenResponse"];
                };
            };
        };
    };
    tabyin_admin_content_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                external_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentDetailResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentDetailForbiddenResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentDetailNotFoundResponse"];
                };
            };
        };
    };
    tabyin_admin_content_toggle: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                external_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedAdminTabyinContentToggle"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedAdminTabyinContentToggle"];
                "multipart/form-data": components["schemas"]["PatchedAdminTabyinContentToggle"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentToggleResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentToggleBadRequestResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentToggleForbiddenResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinContentToggleNotFoundResponse"];
                };
            };
        };
    };
    tabyin_admin_submissions_queue: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionQueueResponse"];
                };
            };
        };
    };
    tabyin_admin_submission_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                content_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionNotFound"];
                };
            };
        };
    };
    tabyin_admin_submission_approve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                content_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["AdminTabyinSubmissionReview"];
                "application/x-www-form-urlencoded": components["schemas"]["AdminTabyinSubmissionReview"];
                "multipart/form-data": components["schemas"]["AdminTabyinSubmissionReview"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionApproveResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionReviewBadRequest"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionReviewNotFound"];
                };
            };
        };
    };
    tabyin_admin_submission_reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                content_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["AdminTabyinSubmissionReview"];
                "application/x-www-form-urlencoded": components["schemas"]["AdminTabyinSubmissionReview"];
                "multipart/form-data": components["schemas"]["AdminTabyinSubmissionReview"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionRejectResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionRejectBadRequest"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminTabyinSubmissionRejectNotFound"];
                };
            };
        };
    };
    tabyin_admin_sync_dispatch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["AdminSyncTrigger"];
                "application/x-www-form-urlencoded": components["schemas"]["AdminSyncTrigger"];
                "multipart/form-data": components["schemas"]["AdminSyncTrigger"];
            };
        };
        responses: {
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSyncDispatchResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSyncDispatchBadRequestResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSyncDispatchForbiddenResponse"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSyncDispatchThrottledResponse"];
                };
            };
        };
    };
    tabyin_admin_sync_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                task_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSyncStatusResponse"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminSyncStatusForbiddenResponse"];
                };
            };
        };
    };
    tabyin_public_contents_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicTabyinContentListResponse"];
                };
            };
        };
    };
    tabyin_public_content_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                external_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicTabyinContentDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicTabyinContentDetailNotFoundResponse"];
                };
            };
        };
    };
    tabyin_user_submissions_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserTabyinSubmissionListResponse"];
                };
            };
        };
    };
    tabyin_user_submission_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserTabyinSubmissionCreate"];
                "application/x-www-form-urlencoded": components["schemas"]["UserTabyinSubmissionCreate"];
                "multipart/form-data": components["schemas"]["UserTabyinSubmissionCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserTabyinSubmissionCreatedResponse"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserTabyinSubmissionCreateBadRequest"];
                };
            };
        };
    };
    tabyin_user_submission_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                content_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserTabyinSubmissionDetailResponse"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserTabyinSubmissionNotFound"];
                };
            };
        };
    };
}

/* prettier-ignore-end */
