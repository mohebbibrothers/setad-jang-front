#!/usr/bin/env bash
# ==============================================================================
#  besat.me — Live site & API audit
#  ---------------------------------------------------------------------------
#  چون سرور از بیرون ایران در دسترس نیست، این اسکریپت را روی خودِ سرور اجرا کن
#  و کل خروجی را برای من بفرست:
#
#      ./scripts/site-audit.sh > /tmp/besat-audit.txt 2>&1 ; cat /tmp/besat-audit.txt
#
#  چیزی تغییر نمی‌دهد — فقط می‌خواند. هیچ توکن/رمزی چاپ نمی‌کند.
# ==============================================================================

set -uo pipefail

BASE="${BASE:-https://besat.me}"
API="$BASE/api/v1"
SEP() { printf '\n════════════════════════════════════════════════════════════\n %s\n════════════════════════════════════════════════════════════\n' "$*"; }
SUB() { printf '\n──── %s\n' "$*"; }

# ── مقادیر حساس را از خروجی پاک می‌کنیم ─────────────────────────────────
redact() {
  sed -E \
    -e 's/(Bearer )[A-Za-z0-9._-]+/\1<redacted>/g' \
    -e 's/(gh[pousr]_)[A-Za-z0-9]+/\1<redacted>/g' \
    -e 's/("(access|refresh|token|password|secret|key)"[[:space:]]*:[[:space:]]*")[^"]*/\1<redacted>/g' \
    -e 's/(SECRET[A-Z_]*=)[^[:space:]]+/\1<redacted>/g' \
    -e 's/(PASSWORD[A-Z_]*=)[^[:space:]]+/\1<redacted>/g'
}

probe() { # probe <label> <url>
  local label="$1" url="$2" out
  out="$(curl -sS -o /dev/null -w '%{http_code}|%{time_total}s|%{size_download}B|%{content_type}' \
        --max-time 20 "$url" 2>&1)" || out="FAILED"
  printf '  %-52s %s\n' "$label" "$out"
}

json_head() { # json_head <label> <url> [bytes]
  local label="$1" url="$2" n="${3:-700}"
  SUB "$label  →  $url"
  curl -sS --max-time 20 "$url" 2>&1 | head -c "$n" | redact
  printf '\n'
}

SEP "۰) اطلاعات محیط"
date '+%Y-%m-%d %H:%M:%S %Z'
echo "hostname : $(hostname)"
echo "node     : $(node -v 2>/dev/null || echo -)"
echo "npm      : $(npm -v 2>/dev/null || echo -)"
echo "BASE     : $BASE"

SEP "۱) هدرهای HTTP صفحه‌ی اصلی"
curl -sSI --max-time 20 "$BASE/" 2>&1 | redact

SEP "۲) زمان پاسخ و وزن مسیرهای فرانت"
echo "  (کد | زمان | حجم | نوع)"
for p in / /about-besat /tabyin /tabyin/new /search?q=%D8%A8%D8%B9%D8%AB%D8%AA \
         /sitemap.xml /robots.txt /manifest.webmanifest /sw.js \
         /auth/login /madadkar /r4j /lms /kindness-wall /account /support ; do
  probe "$p" "$BASE$p"
done
echo "  ↑ مسیرهایی که ۴۰۴ می‌دهند هنوز ساخته نشده‌اند (انتظار می‌رود)"

SEP "۳) سلامت و مستندات بک‌اند"
for p in /health/ /health/ready/ /health/detailed/ ; do probe "$p" "$API$p"; done
probe "/api/docs/"   "$BASE/api/docs/"
probe "/api/schema/" "$BASE/api/schema/"
probe "/admin/"      "$BASE/admin/"
json_head "health" "$API/health/" 500

SEP "۴) اندپوینت‌های عمومی — کد وضعیت"
for p in \
  "/madadkar/campaigns/?page_size=1" \
  "/madadkar/sponsors/?page_size=1" \
  "/r4j/criminals/?page_size=1" \
  "/lms/categories/?page_size=1" \
  "/lms/courses/?page_size=1" \
  "/kindness-wall/categories/?page_size=1" \
  "/kindness-wall/listings/?page_size=1" \
  "/tabyin/contents/?page_size=1" \
  "/public-reports/subjects/?page_size=1" \
  "/support/categories/" \
  "/support/departments/" \
  "/support/ticket-types/" \
  "/support/knowledge/articles/?page_size=1" \
; do probe "$p" "$API$p"; done

SEP "۵) حجم واقعی داده در هر حوزه (count)"
for p in \
  "madadkar/campaigns" "madadkar/sponsors" "r4j/criminals" \
  "lms/courses" "lms/categories" "kindness-wall/listings" \
  "kindness-wall/categories" "tabyin/contents" "public-reports/subjects" \
  "support/knowledge/articles" \
; do
  c="$(curl -sS --max-time 20 "$API/$p/?page_size=1" 2>/dev/null \
       | python3 -c 'import sys,json;d=json.load(sys.stdin);print((d.get("data") or {}).get("count","?"))' 2>/dev/null || echo '?')"
  printf '  %-34s count = %s\n' "$p" "$c"
done

SEP "۶) نمونه‌ی واقعی پاسخ‌ها (برای تطبیق دقیق تایپ‌ها)"
json_head "کمپین"        "$API/madadkar/campaigns/?page_size=1"      1400
json_head "مجرم"         "$API/r4j/criminals/?page_size=1"           1400
json_head "دوره"         "$API/lms/courses/?page_size=1"             1400
json_head "آگهی مهربانی" "$API/kindness-wall/listings/?page_size=1"  1400
json_head "تبیین"        "$API/tabyin/contents/?page_size=1"         1400
json_head "موضوع گزارش"  "$API/public-reports/subjects/?page_size=1"  900
json_head "دسته پشتیبانی" "$API/support/categories/"                  900

SEP "۷) رفتار خطاها (برای طراحی UI خطا)"
json_head "۴۰۴ منبع ناموجود" "$API/madadkar/campaigns/this-does-not-exist/" 400
json_head "۴۰۱ بدون توکن"    "$API/auth/me/"                                400
json_head "بدون اسلش پایانی" "$API/madadkar/campaigns"                      300

SEP "۸) وضعیت پراسس‌ها"
SUB "pm2"
pm2 list 2>/dev/null | head -20 || echo "pm2 در دسترس نیست"
SUB "pm2 describe besat-front (خلاصه)"
pm2 describe besat-front 2>/dev/null | grep -Ei 'status|uptime|restarts|script|cwd|exec mode|node.js|memory|watching' | head -20
SUB "docker"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null | head -20
SUB "پورت‌های در حال گوش‌دادن"
ss -ltnp 2>/dev/null | grep -E 'LISTEN' | head -25

SEP "۹) پیکربندی nginx (فقط proxy_pass و server_name و location)"
grep -rhnE '^\s*(server_name|listen|location|proxy_pass|client_max_body_size|gzip|brotli)' \
  /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | grep -v '^\s*#' | head -60 | redact

SEP "۱۰) خطاهای اخیر فرانت"
pm2 logs besat-front --lines 40 --nostream 2>/dev/null | tail -40 | redact

SEP "۱۱) خطاهای اخیر بک‌اند"
docker logs besat-web-1 --tail 40 2>&1 | tail -40 | redact

SEP "پایان — کل این خروجی را برای تحلیل بفرست"
