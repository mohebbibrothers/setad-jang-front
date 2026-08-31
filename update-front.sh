#!/usr/bin/env bash
# ==============================================================================
#  besat.me — Frontend one-command updater
#  ---------------------------------------------------------------------------
#  یک خط، و فرانت سایت آپدیت می‌شود:
#
#      ./update-front.sh
#
#  چرخه‌ی کامل:
#    fetch → sync → deps (فقط اگر لازم باشد) → build → restart
#          → health-check → rollback خودکار در صورت هر خطا
#
#  فلسفه‌ی طراحی:
#    • سایت هرگز در وضعیت نیمه‌کاره رها نمی‌شود (بکاپ بیلد + rollback خودکار)
#    • اگر package-lock عوض نشده باشد npm ci رد می‌شود  → دیپلوی چند ثانیه‌ای
#    • قفل flock: دو دیپلوی همزمان غیرممکن است
#    • فایل‌های .env* و node_modules و .next هرگز پاک نمی‌شوند
#    • pm2 / systemd / docker-compose خودکار تشخیص داده می‌شود
#    • هر اجرا لاگ کامل در .deploy/logs/ ذخیره می‌کند
#
#  Besat DevOps · https://besat.me
# ==============================================================================

set -Eeuo pipefail
shopt -s inherit_errexit 2>/dev/null || true
umask 022

readonly SCRIPT_VERSION="2.2.1"
readonly SCRIPT_PATH="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)/$(basename -- "${BASH_SOURCE[0]}")"
readonly SCRIPT_DIR="$(dirname -- "$SCRIPT_PATH")"
readonly SCRIPT_NAME="$(basename -- "$SCRIPT_PATH")"
readonly START_EPOCH=$SECONDS

# ──────────────────────────────────────────────────────────────────────────────
#  پیکربندی — هر مقدار با متغیر محیطی یا فلگ قابل override است
# ──────────────────────────────────────────────────────────────────────────────
REPO_URL="${REPO_URL:-https://github.com/mohebbibrothers/setad-jang-front.git}"
APP_DIR="${APP_DIR:-}"                     # خالی = پوشه‌ی خودِ اسکریپت
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"

PM2_APP="${PM2_APP:-besat-front}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-}"           # خالی = تشخیص خودکار
COMPOSE_SERVICE="${COMPOSE_SERVICE:-frontend}"
RESTART_CMD="${RESTART_CMD:-}"             # اگر ست شود، اولویت مطلق دارد

# پورت را هاردکد نمی‌کنیم: اگر کاربر ست نکرده باشد، از pm2 / سوکت‌های باز
# کشفش می‌کنیم (روی سرور بعثت فرانت روی ۳۰۰۰ نیست).
PORT_EXPLICIT=0; [[ -n "${PORT:-}" ]] && PORT_EXPLICIT=1
PORT="${PORT:-}"
LOCAL_HEALTH_URL_EXPLICIT=0; [[ -n "${LOCAL_HEALTH_URL:-}" ]] && LOCAL_HEALTH_URL_EXPLICIT=1
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-}"
PUBLIC_HEALTH_URL="${PUBLIC_HEALTH_URL:-https://besat.me/}"
API_HEALTH_URL="${API_HEALTH_URL:-https://besat.me/api/v1/health/}"

HEALTH_RETRIES="${HEALTH_RETRIES:-30}"     # 30 × 2s → تا ۶۰ ثانیه صبر
HEALTH_INTERVAL="${HEALTH_INTERVAL:-2}"
PUBLIC_HEALTH_REQUIRED="${PUBLIC_HEALTH_REQUIRED:-0}"
KEEP_LOGS="${KEEP_LOGS:-20}"

FORCE=0; DRY_RUN=0; SKIP_HEALTH=0; FORCE_DEPS=0; DO_ROLLBACK=0; SHOW_STATUS=0; QUIET=0
ORIGINAL_ARGS=("$@")                       # برای re-exec زیر flock

# ──────────────────────────────────────────────────────────────────────────────
#  خروجی
# ──────────────────────────────────────────────────────────────────────────────
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  B=$'\033[1m'; D=$'\033[2m'; R=$'\033[0m'
  RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; BLU=$'\033[34m'; CYN=$'\033[36m'
else
  B=""; D=""; R=""; RED=""; GRN=""; YLW=""; BLU=""; CYN=""
fi

STEP_NO=0
_ts()  { date '+%H:%M:%S'; }
log()  { ((QUIET)) || printf '%s  %s\n'       "${D}$(_ts)${R}" "$*"; }
ok()   { ((QUIET)) || printf '%s  %s✔%s %s\n' "${D}$(_ts)${R}" "$GRN" "$R" "$*"; }
warn() {              printf '%s  %s!%s %s\n' "${D}$(_ts)${R}" "$YLW" "$R" "$*" >&2; }
err()  {              printf '%s  %s✘%s %s\n' "${D}$(_ts)${R}" "$RED" "$R" "$*" >&2; }
die()  { err "$*"; exit 1; }
step() { STEP_NO=$((STEP_NO+1)); ((QUIET)) || printf '\n%s%s▸ [%d] %s%s\n' "$B" "$CYN" "$STEP_NO" "$*" "$R"; }
run()  { if ((DRY_RUN)); then printf '%s      dry-run: %s%s\n' "$D" "$*" "$R"; else "$@"; fi; }

banner() {
  if ((QUIET)); then return 0; fi
  printf '\n%s%s' "$B" "$BLU"
  cat <<'ART'
  ╔══════════════════════════════════════════════════════════╗
  ║   بعثت مردم  ·  besat.me   —   Frontend Deployer         ║
  ╚══════════════════════════════════════════════════════════╝
ART
  printf '%s' "$R"
  printf '  %sv%s  ·  branch %s  ·  %s%s\n\n' "$D" "$SCRIPT_VERSION" "$BRANCH" "$(date '+%Y-%m-%d %H:%M:%S')" "$R"
}

usage() {
  cat <<EOF
besat.me frontend updater v${SCRIPT_VERSION}

استفاده:
  ./${SCRIPT_NAME} [options]

گزینه‌ها:
  -b, --branch <name>   دیپلوی برنچ دیگر (پیش‌فرض: ${BRANCH})
  -f, --force           حتی وقتی کامیت جدیدی نیست، دوباره بیلد کن
      --deps            npm ci را اجباری اجرا کن (حتی بدون تغییر lockfile)
      --no-health       از health-check صرف‌نظر کن
      --rollback        برگشت فوری به آخرین نسخه‌ی سالم
      --status          فقط وضعیت فعلی سرور را نشان بده
  -n, --dry-run         فقط نقشه‌ی کار را چاپ کن، هیچ تغییری نده
  -q, --quiet           خروجی حداقلی (مناسب cron)
  -h, --help            همین راهنما

متغیرهای محیطی:
  APP_DIR=/var/www/besat-front       مسیر پروژه روی سرور
  PM2_APP=${PM2_APP}                   نام پراسس pm2
  SYSTEMD_UNIT=besat-front           نام یونیت systemd (بدون .service)
  COMPOSE_SERVICE=${COMPOSE_SERVICE}          نام سرویس در docker compose
  RESTART_CMD='...'                  دستور ری‌استارت دلخواه (اولویت اول)
  PORT=<n>                           پورت فرانت (پیش‌فرض: کشف خودکار از pm2)
  NPM_FLAGS='--legacy-peer-deps'     فلگ اضافه برای npm
  PUBLIC_HEALTH_REQUIRED=1           خطای هلث دامنه هم باعث rollback شود
  HEALTH_RETRIES=${HEALTH_RETRIES}  HEALTH_INTERVAL=${HEALTH_INTERVAL}

نمونه‌ها:
  ./${SCRIPT_NAME}
  ./${SCRIPT_NAME} --force
  ./${SCRIPT_NAME} --status
  RESTART_CMD='sudo systemctl restart besat-front' ./${SCRIPT_NAME}
EOF
}

while (($#)); do
  case "$1" in
    -b|--branch)  [[ $# -ge 2 ]] || die "--branch مقدار می‌خواهد"; BRANCH="$2"; shift 2 ;;
    -f|--force)   FORCE=1; shift ;;
    --deps)       FORCE_DEPS=1; shift ;;
    --no-health)  SKIP_HEALTH=1; shift ;;
    --rollback)   DO_ROLLBACK=1; shift ;;
    --status)     SHOW_STATUS=1; shift ;;
    -n|--dry-run) DRY_RUN=1; shift ;;
    -q|--quiet)   QUIET=1; shift ;;
    -h|--help)    usage; exit 0 ;;
    *) die "گزینه‌ی ناشناخته: $1   (راهنما: --help)" ;;
  esac
done

[[ "$BRANCH" =~ ^[A-Za-z0-9._/-]+$ ]] || die "نام برنچ نامعتبر: $BRANCH"
if [[ -n "$PORT" && ! "$PORT" =~ ^[0-9]+$ ]]; then die "PORT باید عدد باشد"; fi

# ──────────────────────────────────────────────────────────────────────────────
#  تعیین مسیر پروژه (و clone در اولین اجرا)
# ──────────────────────────────────────────────────────────────────────────────
if [[ -z "$APP_DIR" ]]; then
  if git -C "$SCRIPT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
    APP_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
  else
    APP_DIR="/opt/sites/besat/frontend/repo"
  fi
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  warn "ریپو در $APP_DIR نیست — برای اولین بار clone می‌کنم"
  if ((!DRY_RUN)); then
    mkdir -p "$APP_DIR"
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
fi
cd "$APP_DIR"

STATE_DIR="$APP_DIR/.deploy"
LOG_DIR="$STATE_DIR/logs"
LOCK_FILE="$STATE_DIR/.lock"
LAST_GOOD_FILE="$STATE_DIR/last-good-commit"
LOCK_HASH_FILE="$STATE_DIR/deps.sha256"
BUILD_BAK="$APP_DIR/.next.previous"
BUILD_TMP="$APP_DIR/.next.failed"
readonly STATE_DIR LOG_DIR LOCK_FILE LAST_GOOD_FILE LOCK_HASH_FILE BUILD_BAK BUILD_TMP
mkdir -p "$LOG_DIR"
readonly LOG_FILE="$LOG_DIR/deploy-$(date '+%Y%m%d-%H%M%S').log"

# ──────────────────────────────────────────────────────────────────────────────
#  قفل تک‌نمونه‌ای
# ──────────────────────────────────────────────────────────────────────────────
if [[ "${_BESAT_LOCKED:-0}" != "1" ]] && command -v flock >/dev/null 2>&1 && ((!DRY_RUN)); then
  set +e
  env _BESAT_LOCKED=1 flock --nonblock --conflict-exit-code 75 "$LOCK_FILE" \
      bash "$SCRIPT_PATH" ${ORIGINAL_ARGS[@]+"${ORIGINAL_ARGS[@]}"}
  lock_status=$?
  set -e
  if [[ $lock_status -eq 75 ]]; then
    die "یک دیپلوی دیگر همین حالا در حال اجراست (قفل: $LOCK_FILE)"
  fi
  exit $lock_status
fi

# خروجی همزمان روی ترمینال و داخل فایل لاگ
if ((!DRY_RUN)); then
  exec > >(tee -a "$LOG_FILE") 2>&1
  ls -1t "$LOG_DIR"/deploy-*.log 2>/dev/null | tail -n +$((KEEP_LOGS+1)) | xargs -r rm -f || true
fi

# ──────────────────────────────────────────────────────────────────────────────
#  ابزارها
# ──────────────────────────────────────────────────────────────────────────────
MANAGER=""
PORT_SOURCE="صریح"
detect_manager() {
  if [[ -n "$RESTART_CMD" ]]; then MANAGER="custom"; return; fi
  if command -v pm2 >/dev/null 2>&1 && pm2 describe "$PM2_APP" >/dev/null 2>&1; then
    MANAGER="pm2"; return
  fi
  if command -v systemctl >/dev/null 2>&1; then
    local u
    for u in ${SYSTEMD_UNIT:-} besat-front besat-frontend setadjang-front nextjs-besat; do
      [[ -n "$u" ]] || continue
      if systemctl cat "${u}.service" >/dev/null 2>&1; then
        SYSTEMD_UNIT="$u"; MANAGER="systemd"; return
      fi
    done
  fi
  if [[ -f "$APP_DIR/docker-compose.yml" || -f "$APP_DIR/compose.yml" ]] \
     && command -v docker >/dev/null 2>&1; then
    MANAGER="compose"; return
  fi
  if command -v pm2 >/dev/null 2>&1; then MANAGER="pm2-new"; return; fi
  MANAGER="none"
}

restart_app() {
  case "$MANAGER" in
    custom)  run bash -c "$RESTART_CMD" ;;
    pm2)     run pm2 reload "$PM2_APP" --update-env ;;
    pm2-new) run pm2 start npm --name "$PM2_APP" --cwd "$APP_DIR" -- start && run pm2 save ;;
    systemd) if [[ $EUID -eq 0 ]]; then run systemctl restart "${SYSTEMD_UNIT}.service"
             else run sudo systemctl restart "${SYSTEMD_UNIT}.service"; fi ;;
    compose) run docker compose -f "$APP_DIR/docker-compose.yml" up -d --build "$COMPOSE_SERVICE" ;;
    none)    warn "هیچ process manager ای پیدا نشد — ری‌استارت را دستی انجام بده" ;;
  esac
}

# نصب وابستگی‌ها با سه لایه fallback:
#   npm ci  →  npm ci --legacy-peer-deps  →  npm install --legacy-peer-deps
# (lockfile فعلی پروژه روی react RC / framer-motion تضاد peerDependency دارد،
#  پس لایه‌ی دوم عملاً مسیر همیشگی است و بدون آن دیپلوی تمیز انجام نمی‌شود)
install_deps() {
  local flags=(--no-audit --no-fund) extra=()
  if [[ -n "${NPM_FLAGS:-}" ]]; then read -r -a extra <<< "$NPM_FLAGS"; flags+=("${extra[@]}"); fi

  log "نصب پکیج‌ها: npm ci …"
  if npm ci "${flags[@]}" --prefer-offline; then return 0; fi

  warn "npm ci رد شد — تلاش دوباره با --legacy-peer-deps"
  if npm ci "${flags[@]}" --legacy-peer-deps; then return 0; fi

  warn "lockfile با package.json همگام نیست — npm install --legacy-peer-deps"
  npm install "${flags[@]}" --legacy-peer-deps
}

# پورتی که pm2 در env اپ ثبت کرده
pm2_env_port() {
  command -v pm2 >/dev/null 2>&1 || return 1
  command -v node >/dev/null 2>&1 || return 1
  pm2 jlist 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try {
        const list = JSON.parse(s);
        const app  = list.find(x => x.name === process.argv[1]);
        const env  = (app && app.pm2_env && app.pm2_env.env) || {};
        const port = env.PORT || env.port || "";
        if (String(port).match(/^[0-9]+$/)) process.stdout.write(String(port));
      } catch (_) {}
    });' "$PM2_APP" 2>/dev/null
}

# پورتی که پراسسِ pm2 عملاً رویش LISTEN کرده
pm2_listen_port() {
  command -v pm2 >/dev/null 2>&1 || return 1
  local pid
  pid="$(pm2 pid "$PM2_APP" 2>/dev/null | tr -dc '0-9')"
  [[ -n "$pid" && "$pid" != "0" ]] || return 1
  if command -v ss >/dev/null 2>&1; then
    ss -ltnpH 2>/dev/null | awk -v pat="pid=${pid}," '
      $0 ~ pat { n = split($4, a, ":"); print a[n]; exit }'
  fi
}

# ترتیب کشف پورت: PORT صریح → env داخل pm2 → سوکت واقعیِ پراسس → 3000
resolve_port() {
  if ((PORT_EXPLICIT)); then return 0; fi
  local p
  p="$(pm2_env_port || true)"
  if [[ "$p" =~ ^[0-9]+$ ]]; then PORT="$p"; PORT_SOURCE="pm2 env"; return 0; fi
  p="$(pm2_listen_port || true)"
  if [[ "$p" =~ ^[0-9]+$ ]]; then PORT="$p"; PORT_SOURCE="سوکت باز پراسس"; return 0; fi
  PORT=3000; PORT_SOURCE="پیش‌فرض"
}

http_ok() {
  local code
  code="$(curl -fsSL --max-time 10 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null)" || return 1
  printf '%s' "$code"
}

wait_healthy() {
  local url="$1" label="$2" i code
  for ((i=1; i<=HEALTH_RETRIES; i++)); do
    code="$(http_ok "$url" || true)"
    if [[ "$code" =~ ^(200|30[0-8])$ ]]; then
      ok "$label سالم است  ${D}(HTTP $code، تلاش $i)${R}"; return 0
    fi
    sleep "$HEALTH_INTERVAL"
  done
  return 1
}

# ──────────────────────────────────────────────────────────────────────────────
#  rollback
# ──────────────────────────────────────────────────────────────────────────────
ROLLBACK_ARMED=0
PREV_COMMIT=""

do_rollback() {
  err "دیپلوی شکست خورد — در حال بازگرداندن نسخه‌ی قبلی…"
  if [[ -n "$PREV_COMMIT" ]]; then git reset --hard --quiet "$PREV_COMMIT" || true; fi
  if [[ -d "$BUILD_BAK" ]]; then
    rm -rf "$BUILD_TMP"
    if [[ -d "$APP_DIR/.next" ]]; then mv "$APP_DIR/.next" "$BUILD_TMP"; fi
    mv "$BUILD_BAK" "$APP_DIR/.next"
    ok "بیلد سالم قبلی برگردانده شد"
  fi
  restart_app || true
  if ((SKIP_HEALTH)); then
    warn "به نسخه‌ی ${PREV_COMMIT:0:8} برگشتیم (health-check رد شد). لاگ: $LOG_FILE"
    return 0
  fi
  if wait_healthy "$LOCAL_HEALTH_URL" "سرویس (بعد از rollback)"; then
    warn "سایت روی نسخه‌ی قبلی ${PREV_COMMIT:0:8} بالا آمد. لاگ: $LOG_FILE"
  else
    err "rollback هم سالم بالا نیامد — بررسی دستی لازم است. لاگ: $LOG_FILE"
  fi
}

on_error() {
  local code=$?
  trap - ERR
  err "خطا در خط $1 (کد خروج $code) — مرحله: بعد از «${STEP_NO}»"
  if ((ROLLBACK_ARMED)); then do_rollback; fi
  printf '\n%s%s ✘ دیپلوی ناموفق %s  ·  لاگ کامل: %s\n\n' "$B" "$RED" "$R" "$LOG_FILE"
  exit "$code"
}
trap 'on_error $LINENO' ERR

# ──────────────────────────────────────────────────────────────────────────────
#  مسیرهای کوتاه: --status / --rollback
# ──────────────────────────────────────────────────────────────────────────────
detect_manager
resolve_port
if ((!LOCAL_HEALTH_URL_EXPLICIT)); then LOCAL_HEALTH_URL="http://127.0.0.1:${PORT}/"; fi

if ((SHOW_STATUS)); then
  banner
  printf '  %sمسیر%s           %s\n'    "$D" "$R" "$APP_DIR"
  printf '  %sبرنچ%s           %s\n'    "$D" "$R" "$(git rev-parse --abbrev-ref HEAD)"
  printf '  %sکامیت%s          %s  %s\n' "$D" "$R" "$(git rev-parse --short HEAD)" "$(git log -1 --format=%s | cut -c1-55)"
  printf '  %sتاریخ کامیت%s    %s\n'    "$D" "$R" "$(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M')"
  printf '  %smanager%s        %s%s\n'  "$D" "$R" "$MANAGER" "$([[ $MANAGER == systemd ]] && printf ' (%s)' "$SYSTEMD_UNIT")"
  printf '  %sپورت%s           %s  %s(%s)%s\n' "$D" "$R" "$PORT" "$D" "$PORT_SOURCE" "$R"
  printf '  %sآخرین نسخه سالم%s %s\n'   "$D" "$R" "$(cat "$LAST_GOOD_FILE" 2>/dev/null | cut -c1-8 || echo '—')"
  printf '  %sهلث محلی%s       %s\n'    "$D" "$R" "$(http_ok "$LOCAL_HEALTH_URL"  || echo 'در دسترس نیست')"
  printf '  %sهلث دامنه%s      %s\n'    "$D" "$R" "$(http_ok "$PUBLIC_HEALTH_URL" || echo 'در دسترس نیست')"
  printf '  %sهلث بک‌اند%s     %s\n\n'  "$D" "$R" "$(http_ok "$API_HEALTH_URL"    || echo 'در دسترس نیست')"
  exit 0
fi

if ((DO_ROLLBACK)); then
  banner
  [[ -f "$LAST_GOOD_FILE" ]] || die "هیچ نسخه‌ی سالم ثبت‌شده‌ای وجود ندارد"
  PREV_COMMIT="$(cat "$LAST_GOOD_FILE")"
  step "بازگشت دستی به ${PREV_COMMIT:0:8}"
  do_rollback
  exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
#  دیپلوی اصلی
# ══════════════════════════════════════════════════════════════════════════════
banner

step "بررسی پیش‌نیازها"
for c in git node npm curl; do
  command -v "$c" >/dev/null 2>&1 || die "دستور لازم نصب نیست: $c"
done
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
(( NODE_MAJOR >= 18 )) || die "Node 18 یا بالاتر لازم است (نسخه‌ی فعلی: $(node -v))"
ok "node $(node -v) · npm v$(npm -v) · git $(git --version | awk '{print $3}')"
ok "manager: ${B}${MANAGER}${R}$([[ $MANAGER == systemd ]] && printf ' → %s.service' "$SYSTEMD_UNIT")$([[ $MANAGER == pm2* ]] && printf ' → %s' "$PM2_APP")"
if [[ "$MANAGER" == "none" ]]; then warn "بدون process manager فقط بیلد انجام می‌شود"; fi
ok "پورت فرانت: ${B}${PORT}${R} ${D}(${PORT_SOURCE})${R} → $LOCAL_HEALTH_URL"

step "دریافت آخرین تغییرات از گیت‌هاب"
PREV_COMMIT="$(git rev-parse HEAD)"
run git fetch --prune --quiet "$REMOTE" "$BRANCH"
TARGET_COMMIT="$(git rev-parse "${REMOTE}/${BRANCH}")"
log "فعلی : ${PREV_COMMIT:0:8}   $(git log -1 --format=%s "$PREV_COMMIT" | cut -c1-48)"
log "هدف  : ${TARGET_COMMIT:0:8}   $(git log -1 --format=%s "$TARGET_COMMIT" | cut -c1-48)"

# اثرانگشتِ بیلد: «آخرین بیلدِ موفق» با «HEADِ فعلیِ گیت» دو چیزِ متفاوت‌اند!
# اگر کسی (مثل دستورالعملِ دیپلویِ ما) اول «git reset --hard» بزند و بعد این
# اسکریپت را اجرا کند، HEAD از قبل روی هدف است و هرگز نباید صرفِ یکی‌بودنِ
# هش، از بیلد صرف‌نظر شود — وگرنه .next و pm2 روی بیلدِ قدیمی می‌مانند و
# سایت نسخه‌ی stale سرو می‌کند (دقیقاً ریشه‌ی باگِ «دیپلوی شد ولی درست نشد»).
# پس ردِ بیلد فقط وقتی امن است که هر سه شرط برقرار باشد:
#   HEAD == هدف  +  آخرین بیلدِ موفق == هدف  +  خروجیِ بیلد واقعاً موجود است.
LAST_BUILT_COMMIT="$(cat "$LAST_GOOD_FILE" 2>/dev/null || true)"
if [[ "$PREV_COMMIT" == "$TARGET_COMMIT" ]] \
  && [[ "$LAST_BUILT_COMMIT" == "$TARGET_COMMIT" ]] \
  && [[ -f .next/BUILD_ID ]] \
  && ((!FORCE)); then
  ok "همین حالا آخرین نسخه روی سرور است — کاری لازم نیست"
  printf '  %s(برای بیلد مجدد: ./%s --force)%s\n\n' "$D" "$SCRIPT_NAME" "$R"
  exit 0
fi
if [[ "$PREV_COMMIT" == "$TARGET_COMMIT" ]] && ((!FORCE)); then
  if [[ "$LAST_BUILT_COMMIT" != "$TARGET_COMMIT" ]]; then
    # نکته: ${var:0:8:-پیش‌فرض} ساختارِ نامعتبری در bash است (آن را عبارتِ
    # حسابی می‌خواند و syntax error می‌دهد). نمایشِ ۸ کاراکترِ اول + فالبک
    # باید در دو گامِ جدا انجام شود.
    lb_short="${LAST_BUILT_COMMIT:0:8}"
    [[ -z "$lb_short" ]] && lb_short="ناشناخته"
    warn "هشِ سورس به‌روز است ولی آخرین بیلدِ موفق برای «${lb_short}» بوده — بیلدِ مجدد انجام می‌شود"
  elif [[ ! -f .next/BUILD_ID ]]; then
    warn "خروجیِ بیلد (.next) موجود نیست — بیلدِ مجدد انجام می‌شود"
  fi
fi

if [[ "$PREV_COMMIT" != "$TARGET_COMMIT" ]]; then
  n_commits="$(git rev-list --count "${PREV_COMMIT}..${TARGET_COMMIT}" 2>/dev/null || echo '?')"
  n_files="$(git diff --name-only "$PREV_COMMIT" "$TARGET_COMMIT" | wc -l | tr -d ' ')"
  log "${n_commits} کامیت جدید · ${n_files} فایل تغییر کرده"
  # محدودسازی تعداد سطرها با خودِ «git log -8» انجام می‌شود — نه «| head».
  # با pipefail، خروجِ زودهنگامِ head لوله را می‌بندد و git با SIGPIPE (کد ۱۴۱)
  # کشته می‌شود؛ در دیپلوی‌هایی با بیش از ۸ کامیت جدید (مثل بازنویسی تاریخچه)
  # این مسیر کل دیپلوی را می‌کشت.
  if ((!QUIET)); then
    git log -8 --oneline --no-decorate "${PREV_COMMIT}..${TARGET_COMMIT}" \
      | sed "s/^/      ${D}•${R} /" | cut -c1-100
    if [[ "$n_commits" =~ ^[0-9]+$ ]] && ((n_commits > 8)); then
      printf '      %s… و %s کامیت دیگر%s\n' "$D" "$((n_commits - 8))" "$R"
    fi
  fi
fi

if ((DRY_RUN)); then
  printf '\n  %sحالت dry-run — هیچ تغییری اعمال نشد.%s\n\n' "$YLW" "$R"
  exit 0
fi

step "همگام‌سازی سورس"
git reset --hard --quiet "$TARGET_COMMIT"
# پاک‌سازی فایل‌های سرگردان — اما .env* و node_modules و .next و state دیپلوی
# و خودِ همین اسکریپت هرگز حذف نمی‌شوند.
git clean -fdq \
  -e '.env' -e '.env.*' -e '.deploy' -e 'node_modules' -e '.next*' -e "$SCRIPT_NAME"
ok "روی ${TARGET_COMMIT:0:8} قرار گرفت (فایل‌های .env دست‌نخورده)"
ROLLBACK_ARMED=1

step "بررسی وابستگی‌ها"
NEW_HASH="$(cat package-lock.json package.json 2>/dev/null | { sha256sum 2>/dev/null || shasum -a 256; } | awk '{print $1}')"
OLD_HASH="$(cat "$LOCK_HASH_FILE" 2>/dev/null || echo none)"
if [[ "$NEW_HASH" != "$OLD_HASH" || ! -d node_modules || $FORCE_DEPS -eq 1 ]]; then
  install_deps
  printf '%s' "$NEW_HASH" > "$LOCK_HASH_FILE"
  ok "وابستگی‌ها به‌روز شد"
else
  ok "lockfile تغییری نکرده — npm ci رد شد ${D}(صرفه‌جویی در زمان)${R}"
fi

step "بیلد پروداکشن"
rm -rf "$BUILD_BAK" "$BUILD_TMP"
if [[ -d .next ]]; then
  cp -al .next "$BUILD_BAK" 2>/dev/null || cp -a .next "$BUILD_BAK"
  log "از بیلد فعلی نسخه‌ی پشتیبان گرفته شد"
fi
BUILD_START=$SECONDS
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 npm run build
ok "بیلد موفق ${D}($((SECONDS-BUILD_START)) ثانیه)${R}"

step "ری‌استارت سرویس"
restart_app
ok "ری‌استارت انجام شد (${MANAGER})"

if ((SKIP_HEALTH)); then
  warn "health-check طبق درخواست رد شد (--no-health)"
else
  step "بررسی سلامت"
  wait_healthy "$LOCAL_HEALTH_URL" "سرویس محلی" || die "سرویس محلی روی $LOCAL_HEALTH_URL بالا نیامد"
  if ! wait_healthy "$PUBLIC_HEALTH_URL" "دامنه‌ی عمومی"; then
    if ((PUBLIC_HEALTH_REQUIRED)); then die "دامنه‌ی عمومی پاسخ نداد"; fi
    warn "دامنه‌ی عمومی پاسخ نداد — احتمالاً CDN/DNS/پروکسی؛ rollback نشد."
  fi
  api_code="$(http_ok "$API_HEALTH_URL" || true)"
  if [[ "$api_code" == "200" ]]; then
    ok "بک‌اند سالم است (HTTP 200)"
  else
    warn "هلث بک‌اند: ${api_code:-بدون پاسخ} (فرانت مستقل از آن بالا آمده)"
  fi
fi

ROLLBACK_ARMED=0
printf '%s' "$TARGET_COMMIT" > "$LAST_GOOD_FILE"

step "پاک‌سازی"
rm -rf "$BUILD_BAK" "$BUILD_TMP"
ok "نسخه‌های پشتیبان موقت حذف شدند"

trap - ERR
printf '\n%s%s ✔ دیپلوی با موفقیت انجام شد %s\n' "$B" "$GRN" "$R"
printf '  %sکامیت%s   %s  %s\n'   "$D" "$R" "${TARGET_COMMIT:0:8}" "$(git log -1 --format=%s | cut -c1-55)"
printf '  %sمدت%s     %s ثانیه\n' "$D" "$R" "$((SECONDS-START_EPOCH))"
printf '  %sسایت%s    %s\n'       "$D" "$R" "$PUBLIC_HEALTH_URL"
printf '  %sلاگ%s     %s\n\n'     "$D" "$R" "$LOG_FILE"
