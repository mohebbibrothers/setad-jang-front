#!/usr/bin/env bash
# ==============================================================================
# Besat frontend — safe one-command production deployment
#
# Daily use (after the target branch has been merged):
#   ./deploy.sh
#
# Useful overrides:
#   DEPLOY_BRANCH=main APP_NAME=setadjang-front ./deploy.sh
#   PROCESS_MANAGER=systemd SERVICE_NAME=setadjang-front ./deploy.sh
#   DEPLOY_RESTART_COMMAND='sudo systemctl restart besat-front' ./deploy.sh
#   ./deploy.sh --dry-run
#
# Deployment model:
#   1. Fetch the target commit without touching the live checkout.
#   2. Build and verify it in an isolated git worktree.
#   3. Fast-forward the live checkout only after every quality gate passes.
#   4. Atomically replace .next (and node_modules when dependencies changed).
#   5. Reload PM2/systemd, run local + public health checks.
#   6. Restore code, build and dependencies automatically on any failure.
# ==============================================================================

set -euo pipefail
IFS=$'\n\t'
umask 027

readonly SCRIPT_VERSION="1.0.2"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly REPO_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"

REMOTE_NAME="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
APP_NAME="${APP_NAME:-setadjang-front}"
SERVICE_NAME="${SERVICE_NAME:-setadjang-front}"
PROCESS_MANAGER="${PROCESS_MANAGER:-auto}"
PORT="${PORT:-3000}"
HOSTNAME_VALUE="${DEPLOY_HOSTNAME:-0.0.0.0}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:${PORT}/}"
PUBLIC_HEALTH_URL="${PUBLIC_HEALTH_URL:-https://besat.me/}"
API_HEALTH_URL="${API_HEALTH_URL:-https://besat.me/api/v1/health/}"
PUBLIC_HEALTH_REQUIRED="${PUBLIC_HEALTH_REQUIRED:-1}"
REQUIRE_API_HEALTH="${REQUIRE_API_HEALTH:-0}"
KEEP_BACKUPS="${KEEP_BACKUPS:-1}"
FORCE_NPM_CI="${FORCE_NPM_CI:-0}"
FORCE_DEPLOY="${FORCE_DEPLOY:-0}"
DRY_RUN=0
ORIGINAL_ARGS=("$@")
CURRENT_STEP="initialization"

DEPLOY_DIR=""
DEPLOYED_MARKER=""
WORKTREE_DIR=""
BACKUP_DIR=""
OLD_COMMIT=""
TARGET_COMMIT=""
TARGET_SHORT=""
TIMESTAMP=""
MANAGER=""
DEPENDENCIES_REUSED=0
SWITCH_STARTED=0
NEXT_SWAPPED=0
MODULES_SWAPPED=0
WORKTREE_REGISTERED=0

if [[ -t 1 && "${NO_COLOR:-0}" != "1" ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'
  C_CYAN=$'\033[36m'
else
  C_RESET="" C_BOLD="" C_GREEN="" C_YELLOW="" C_RED="" C_CYAN=""
fi

now() { date '+%Y-%m-%d %H:%M:%S'; }
log() { printf '%s[%s]%s %s\n' "$C_CYAN" "$(now)" "$C_RESET" "$*"; }
success() { printf '%s[%s] OK%s %s\n' "$C_GREEN" "$(now)" "$C_RESET" "$*"; }
warn() { printf '%s[%s] WARN%s %s\n' "$C_YELLOW" "$(now)" "$C_RESET" "$*" >&2; }
fatal() { printf '%s[%s] ERROR%s %s\n' "$C_RED" "$(now)" "$C_RESET" "$*" >&2; exit 1; }

step() {
  CURRENT_STEP="$1"
  printf '\n%s━━ %s%s\n' "$C_BOLD" "$CURRENT_STEP" "$C_RESET"
}

usage() {
  cat <<EOF
Besat frontend deployer v${SCRIPT_VERSION}

Usage:
  ./deploy.sh [options]

Options:
  --branch <name>       Deploy another branch (default: ${DEPLOY_BRANCH})
  --remote <name>       Git remote (default: ${REMOTE_NAME})
  --force               Rebuild even when the commit is already deployed
  --force-npm-ci        Do not reuse node_modules when lockfiles are unchanged
  --dry-run             Fetch and show the deployment plan without changing files
  -h, --help            Show this help

Environment:
  PROCESS_MANAGER=auto|pm2|systemd|custom
  DEPLOY_RESTART_COMMAND='<command>'   Required when manager=custom
  APP_NAME=${APP_NAME}                 PM2 process name
  SERVICE_NAME=${SERVICE_NAME}         systemd unit name (without .service)
  PORT=${PORT}
  LOCAL_HEALTH_URL=${LOCAL_HEALTH_URL}
  PUBLIC_HEALTH_URL=${PUBLIC_HEALTH_URL}
  PUBLIC_HEALTH_REQUIRED=0|1
  API_HEALTH_URL=${API_HEALTH_URL}
  REQUIRE_API_HEALTH=0|1
  KEEP_BACKUPS=${KEEP_BACKUPS}
EOF
}

while (($#)); do
  case "$1" in
    --branch)
      (($# >= 2)) || fatal "--branch requires a value"
      DEPLOY_BRANCH="$2"; shift 2 ;;
    --remote)
      (($# >= 2)) || fatal "--remote requires a value"
      REMOTE_NAME="$2"; shift 2 ;;
    --force)
      FORCE_DEPLOY=1; shift ;;
    --force-npm-ci)
      FORCE_NPM_CI=1; shift ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      fatal "Unknown option: $1 (use --help)" ;;
  esac
done

[[ -n "$REPO_DIR" ]] || fatal "deploy.sh must live inside a Git repository"
[[ "$SCRIPT_DIR" == "$REPO_DIR" ]] || fatal "deploy.sh must be executed from the frontend repository root"
[[ "$DEPLOY_BRANCH" =~ ^[A-Za-z0-9._/-]+$ ]] || fatal "Unsafe branch name: $DEPLOY_BRANCH"
[[ "$REMOTE_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || fatal "Unsafe remote name: $REMOTE_NAME"
[[ "$PORT" =~ ^[0-9]+$ ]] || fatal "PORT must be numeric"
[[ "$KEEP_BACKUPS" =~ ^[0-9]+$ ]] || fatal "KEEP_BACKUPS must be numeric"

DEPLOY_DIR="$REPO_DIR/.deploy"
DEPLOYED_MARKER="$DEPLOY_DIR/current-commit"
mkdir -p "$DEPLOY_DIR" "$DEPLOY_DIR/worktrees" "$DEPLOY_DIR/backups"

# Prevent two operators/cron jobs from deploying the same checkout together.
# flock remains the parent process while this script runs and --close prevents
# PM2/systemd children from accidentally inheriting the lock descriptor.
if [[ "${_BESAT_DEPLOY_LOCKED:-0}" != "1" ]]; then
  command -v flock >/dev/null 2>&1 || fatal "Required command is missing: flock"
  set +e
  flock --close --nonblock --conflict-exit-code 75 "$DEPLOY_DIR/deploy.lock" \
    env _BESAT_DEPLOY_LOCKED=1 bash "$SCRIPT_DIR/deploy.sh" "${ORIGINAL_ARGS[@]}"
  lock_status=$?
  set -e
  [[ "$lock_status" != "75" ]] || fatal "Another deployment is already running (lock: $DEPLOY_DIR/deploy.lock)"
  exit "$lock_status"
fi

cleanup_worktree() {
  if ((WORKTREE_REGISTERED)) && [[ -n "$WORKTREE_DIR" ]]; then
    git -C "$REPO_DIR" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || true
    git -C "$REPO_DIR" worktree prune >/dev/null 2>&1 || true
    WORKTREE_REGISTERED=0
  fi
}

run_systemctl() {
  if [[ "$(id -u)" == "0" ]]; then
    systemctl "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo systemctl "$@"
  else
    return 1
  fi
}

detect_process_manager() {
  if [[ -n "${DEPLOY_RESTART_COMMAND:-}" ]]; then
    printf 'custom'; return
  fi

  case "$PROCESS_MANAGER" in
    custom)
      [[ -n "${DEPLOY_RESTART_COMMAND:-}" ]] || fatal "PROCESS_MANAGER=custom requires DEPLOY_RESTART_COMMAND"
      printf 'custom' ;;
    pm2)
      command -v pm2 >/dev/null 2>&1 || fatal "PROCESS_MANAGER=pm2 but pm2 is not installed"
      printf 'pm2' ;;
    systemd)
      command -v systemctl >/dev/null 2>&1 || fatal "PROCESS_MANAGER=systemd but systemctl is unavailable"
      systemctl cat "${SERVICE_NAME}.service" >/dev/null 2>&1 || fatal "systemd unit ${SERVICE_NAME}.service was not found"
      printf 'systemd' ;;
    auto)
      if command -v pm2 >/dev/null 2>&1 && pm2 describe "$APP_NAME" >/dev/null 2>&1; then
        printf 'pm2'
      elif command -v systemctl >/dev/null 2>&1 && systemctl cat "${SERVICE_NAME}.service" >/dev/null 2>&1; then
        printf 'systemd'
      elif command -v pm2 >/dev/null 2>&1; then
        printf 'pm2'
      else
        fatal "Could not find PM2 process '$APP_NAME' or systemd unit '${SERVICE_NAME}.service'. Set DEPLOY_RESTART_COMMAND explicitly."
      fi ;;
    *) fatal "Unknown PROCESS_MANAGER: $PROCESS_MANAGER" ;;
  esac
}

restart_app() {
  case "$MANAGER" in
    custom)
      log "Running custom restart command"
      (cd "$REPO_DIR" && bash -lc "$DEPLOY_RESTART_COMMAND") ;;
    pm2)
      if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
        log "Reloading PM2 process: $APP_NAME"
        (cd "$REPO_DIR" && PORT="$PORT" HOSTNAME="$HOSTNAME_VALUE" APP_VERSION="$TARGET_COMMIT" pm2 reload "$APP_NAME" --update-env)
      else
        log "Creating PM2 process: $APP_NAME"
        (cd "$REPO_DIR" && PORT="$PORT" HOSTNAME="$HOSTNAME_VALUE" APP_VERSION="$TARGET_COMMIT" pm2 start npm --name "$APP_NAME" --cwd "$REPO_DIR" -- start)
      fi
      pm2 save >/dev/null 2>&1 || warn "PM2 state could not be saved; process is running but startup persistence should be checked" ;;
    systemd)
      log "Restarting systemd unit: ${SERVICE_NAME}.service"
      run_systemctl restart "${SERVICE_NAME}.service"
      run_systemctl is-active --quiet "${SERVICE_NAME}.service" ;;
    *) return 1 ;;
  esac
}

wait_for_url() {
  local url="$1" label="$2" attempts="${3:-15}" delay="${4:-2}"
  local i status
  for ((i=1; i<=attempts; i++)); do
    status="$(curl --location --silent --show-error --output /dev/null \
      --write-out '%{http_code}' --connect-timeout 3 --max-time 8 "$url" 2>/dev/null || true)"
    if [[ "$status" =~ ^2[0-9][0-9]$ || "$status" =~ ^3[0-9][0-9]$ ]]; then
      success "$label responded with HTTP $status"
      return 0
    fi
    ((i < attempts)) && sleep "$delay"
  done
  warn "$label did not become healthy: $url (last HTTP status: ${status:-none})"
  return 1
}

rollback() {
  trap - ERR
  set +e
  warn "Deployment failed after the live switch; rolling back to ${OLD_COMMIT:0:12}"

  if ((NEXT_SWAPPED)); then
    rm -rf "$REPO_DIR/.next"
    [[ -d "$BACKUP_DIR/.next" ]] && mv "$BACKUP_DIR/.next" "$REPO_DIR/.next"
  fi

  if ((MODULES_SWAPPED)); then
    rm -rf "$REPO_DIR/node_modules"
    [[ -d "$BACKUP_DIR/node_modules" ]] && mv "$BACKUP_DIR/node_modules" "$REPO_DIR/node_modules"
  fi

  git -C "$REPO_DIR" reset --hard "$OLD_COMMIT" >/dev/null 2>&1
  TARGET_COMMIT="$OLD_COMMIT"
  restart_app || warn "Automatic process restart during rollback failed; restart ${APP_NAME}/${SERVICE_NAME} manually"
  wait_for_url "$LOCAL_HEALTH_URL" "Rolled-back frontend" 10 2 || true
  printf '%s\n' "$OLD_COMMIT" >"$DEPLOYED_MARKER"
  printf '%s rollback %s -> %s\n' "$(date --iso-8601=seconds)" "${TARGET_SHORT:-unknown}" "${OLD_COMMIT:0:12}" >>"$DEPLOY_DIR/deployments.log"
  warn "Rollback completed"
}

on_error() {
  local exit_code="$1" line="$2"
  trap - ERR
  printf '\n%sDeployment failed%s during "%s" (line %s, exit %s).\n' "$C_RED" "$C_RESET" "$CURRENT_STEP" "$line" "$exit_code" >&2
  ((SWITCH_STARTED)) && rollback
  cleanup_worktree
  exit "$exit_code"
}
on_signal() {
  trap - ERR INT TERM
  warn "Deployment interrupted"
  ((SWITCH_STARTED)) && rollback
  cleanup_worktree
  exit 130
}

trap 'on_error "$?" "$LINENO"' ERR
trap on_signal INT TERM
trap cleanup_worktree EXIT

step "Preflight"
for command_name in git node npm curl flock; do
  command -v "$command_name" >/dev/null 2>&1 || fatal "Required command is missing: $command_name"
done

NODE_VERSION="$(node -p 'process.versions.node')"
IFS='.' read -r NODE_MAJOR NODE_MINOR _ <<<"$NODE_VERSION"
if ((NODE_MAJOR < 20 || (NODE_MAJOR == 20 && NODE_MINOR < 9))); then
  fatal "Node.js ${NODE_VERSION} is unsupported. Install Node.js 22 (minimum 20.9)."
fi
success "Node.js $NODE_VERSION"

CURRENT_BRANCH="$(git -C "$REPO_DIR" branch --show-current)"
[[ -n "$CURRENT_BRANCH" ]] || fatal "The live checkout is detached; switch it to $DEPLOY_BRANCH first"
[[ "$CURRENT_BRANCH" == "$DEPLOY_BRANCH" ]] || fatal "Live checkout is on '$CURRENT_BRANCH', expected '$DEPLOY_BRANCH'. Use --branch $CURRENT_BRANCH intentionally or switch branches first."

if [[ -n "$(git -C "$REPO_DIR" status --porcelain --untracked-files=normal)" ]]; then
  git -C "$REPO_DIR" status --short >&2
  fatal "The live checkout has uncommitted files. Commit/remove them before deploying; automatic deploy never overwrites local work."
fi

if ((DRY_RUN)); then
  MANAGER="dry-run"
else
  MANAGER="$(detect_process_manager)"
  success "Process manager: $MANAGER"
fi

if [[ ! -f "$REPO_DIR/.env.production" && ! -f "$REPO_DIR/.env.production.local" ]]; then
  warn "No .env.production(.local) file found. Build-time public URLs will use repository defaults (https://besat.me)."
fi

step "Fetch ${REMOTE_NAME}/${DEPLOY_BRANCH}"
OLD_COMMIT="$(git -C "$REPO_DIR" rev-parse HEAD)"
git -C "$REPO_DIR" fetch --prune "$REMOTE_NAME" "$DEPLOY_BRANCH"
TARGET_COMMIT="$(git -C "$REPO_DIR" rev-parse FETCH_HEAD)"
TARGET_SHORT="${TARGET_COMMIT:0:12}"

if ! git -C "$REPO_DIR" merge-base --is-ancestor "$OLD_COMMIT" "$TARGET_COMMIT"; then
  fatal "Remote history is not a fast-forward from the deployed commit. Resolve the branch history manually."
fi

log "Current: ${OLD_COMMIT:0:12}"
log "Target : $TARGET_SHORT"
RECORDED_DEPLOY="$(cat "$DEPLOYED_MARKER" 2>/dev/null || true)"
if [[ "$OLD_COMMIT" == "$TARGET_COMMIT" && "$RECORDED_DEPLOY" == "$TARGET_COMMIT" && "$FORCE_DEPLOY" != "1" ]]; then
  success "Already built and deployed; no action needed"
  wait_for_url "$LOCAL_HEALTH_URL" "Current frontend" 3 1 || true
  exit 0
fi
if [[ "$OLD_COMMIT" == "$TARGET_COMMIT" && "$RECORDED_DEPLOY" != "$TARGET_COMMIT" ]]; then
  warn "Source is current but no matching deployment marker exists; rebuilding safely"
fi

git -C "$REPO_DIR" log --oneline --no-decorate "$OLD_COMMIT..$TARGET_COMMIT" | sed 's/^/  • /' || true
if ((DRY_RUN)); then
  success "Dry-run completed; no files were changed"
  exit 0
fi

TIMESTAMP="$(date -u '+%Y%m%dT%H%M%SZ')"
WORKTREE_DIR="$DEPLOY_DIR/worktrees/${TIMESTAMP}-${TARGET_SHORT}"
BACKUP_DIR="$DEPLOY_DIR/backups/${TIMESTAMP}-${OLD_COMMIT:0:12}"

step "Prepare isolated release"
git -C "$REPO_DIR" worktree add --detach "$WORKTREE_DIR" "$TARGET_COMMIT"
WORKTREE_REGISTERED=1

# Next loads these files at build time. Copy ignored deployment configuration
# without printing or parsing its contents.
for env_file in .env .env.local .env.production .env.production.local; do
  if [[ -f "$REPO_DIR/$env_file" ]]; then
    cp -p "$REPO_DIR/$env_file" "$WORKTREE_DIR/$env_file"
    chmod 600 "$WORKTREE_DIR/$env_file" 2>/dev/null || true
  fi
done

LOCKFILES_CHANGED=1
if git -C "$REPO_DIR" diff --quiet "$OLD_COMMIT" "$TARGET_COMMIT" -- package.json package-lock.json .nvmrc \
  && [[ -d "$REPO_DIR/node_modules" ]] \
  && (cd "$REPO_DIR" && npm ls --depth=0 >/dev/null 2>&1); then
  LOCKFILES_CHANGED=0
fi

if [[ "$FORCE_NPM_CI" == "0" && "$LOCKFILES_CHANGED" == "0" ]]; then
  # Turbopack rejects a node_modules symlink that points outside its project
  # root. A same-filesystem hard-link copy is nearly instant, consumes only
  # directory metadata, and keeps the candidate path self-contained.
  cp -al "$REPO_DIR/node_modules" "$WORKTREE_DIR/node_modules"
  DEPENDENCIES_REUSED=1
  REQUIRED_FREE_MB=800
  success "Dependency lock unchanged; created a hard-linked candidate dependency tree"
else
  REQUIRED_FREE_MB=2500
fi

AVAILABLE_MB="$(df -Pm "$REPO_DIR" | awk 'NR==2 {print $4}')"
((AVAILABLE_MB >= REQUIRED_FREE_MB)) || fatal "Insufficient disk space for release build: ${AVAILABLE_MB}MB free, ${REQUIRED_FREE_MB}MB required"
success "Disk preflight: ${AVAILABLE_MB}MB available"

if (( ! DEPENDENCIES_REUSED )); then
  (cd "$WORKTREE_DIR" && npm ci)
  success "Installed clean production candidate dependencies"
fi

step "Quality gate"
(
  cd "$WORKTREE_DIR"
  export NEXT_TELEMETRY_DISABLED=1
  npm run lint
  npm run typecheck
  npm run test:coverage
  npm audit --audit-level=high
  npm run build
)
[[ -f "$WORKTREE_DIR/.next/BUILD_ID" ]] || fatal "Build completed without .next/BUILD_ID"
success "Candidate $TARGET_SHORT passed every gate"

step "Atomic live switch"
mkdir -p "$BACKUP_DIR"
printf '%s\n' "$OLD_COMMIT" >"$BACKUP_DIR/commit"
SWITCH_STARTED=1

git -C "$REPO_DIR" merge --ff-only "$TARGET_COMMIT"

if ((DEPENDENCIES_REUSED)); then
  log "Live dependencies unchanged; no node_modules switch required"
else
  if [[ -d "$REPO_DIR/node_modules" ]]; then
    mv "$REPO_DIR/node_modules" "$BACKUP_DIR/node_modules"
  fi
  MODULES_SWAPPED=1
  mv "$WORKTREE_DIR/node_modules" "$REPO_DIR/node_modules"
fi

if [[ -d "$REPO_DIR/.next" ]]; then
  mv "$REPO_DIR/.next" "$BACKUP_DIR/.next"
fi
NEXT_SWAPPED=1
mv "$WORKTREE_DIR/.next" "$REPO_DIR/.next"

step "Reload application"
restart_app

step "Health checks"
wait_for_url "$LOCAL_HEALTH_URL" "Local frontend" 20 2

if [[ -n "$PUBLIC_HEALTH_URL" ]]; then
  if ! wait_for_url "$PUBLIC_HEALTH_URL" "Public frontend" 12 3; then
    if [[ "$PUBLIC_HEALTH_REQUIRED" == "1" ]]; then
      false
    else
      warn "Public health is non-blocking by configuration"
    fi
  fi
fi

if [[ -n "$API_HEALTH_URL" ]] && ! wait_for_url "$API_HEALTH_URL" "Backend API" 3 2; then
  if [[ "$REQUIRE_API_HEALTH" == "1" ]]; then
    false
  else
    warn "Backend health is degraded/unreachable, but frontend deployment remains active"
  fi
fi

# The new process has passed all required checks; from here on cleanup/logging
# failures must not roll a healthy release back.
SWITCH_STARTED=0

step "Finalize"
printf '%s\n' "$TARGET_COMMIT" >"$DEPLOYED_MARKER"
printf '%s success %s -> %s manager=%s\n' \
  "$(date --iso-8601=seconds)" "${OLD_COMMIT:0:12}" "$TARGET_SHORT" "$MANAGER" >>"$DEPLOY_DIR/deployments.log"

# Keep a bounded number of rollback artifacts. Names are UTC-sortable.
mapfile -t BACKUPS < <(find "$DEPLOY_DIR/backups" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r)
for ((index=KEEP_BACKUPS; index<${#BACKUPS[@]}; index++)); do
  rm -rf "$DEPLOY_DIR/backups/${BACKUPS[$index]}"
done

cleanup_worktree
success "Deployed ${TARGET_SHORT} to ${DEPLOY_BRANCH}"
log "Frontend: $PUBLIC_HEALTH_URL"
log "Rollback artifacts retained: $KEEP_BACKUPS"
