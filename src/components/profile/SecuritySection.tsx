'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * SecuritySection — رمز عبور، نشست‌ها و خروج (امنیتِ حساب)
 *
 * قراردادهای بک‌اند:
 *   POST /auth/password/change/  {old_password, new_password}
 *     → خطای رمز فعلی: message «رمز فعلی اشتباه است.»؛ خطاهای فیلد از
 *       envelope.errors می‌آیند (new_password با validate_password جنگو).
 *   GET  /auth/sessions/  → {count,next,previous,results[]} صفحه‌بندی‌شده
 *   POST /auth/sessions/<id>/revoke/ → AuthSessionِ به‌روز (is_revoked)
 *     و همان را جایگزینِ ردیف می‌کنیم — بدون رفرشِ کاملِ لیست.
 *   نکته‌ی صادقانه: خروجیِ سریالایزر فیلد «نشست فعلی» ندارد؛ پس ردیفی
 *     را به‌دروغ «این دستگاه» نمی‌نامیم — فقط هشدارِ شفاف می‌دهیم که لغوِ
 *     نشستِ فعلی، خروج از حساب است.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { KeyRound, MonitorSmartphone, ShieldCheck, LogOut } from 'lucide-react';
import { changePassword, revokeSession, type AuthSession, type SessionsPage } from '@/lib/auth';
import { firstErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { formatJalaliDateTime, formatRelativeFa } from '@/lib/persian-time';
import { Alert, SubmitButton } from '@/components/auth/ui';
import { PasswordField, isPasswordAcceptable } from '@/components/auth/PasswordField';
import {
  SectionCard,
  Badge,
  GhostButton,
  DeviceIcon,
  deviceLabelFa,
  extractFieldErrors,
} from './account-ui';
import { cn } from '@/lib/utils';

/* ── تغییر رمز ──────────────────────────────────────────────────────────── */

function ChangePasswordCard() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mismatch = confirm.length > 0 && confirm !== newPassword;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (!oldPassword || !newPassword) {
      setFieldErrors({
        ...(oldPassword ? {} : { old_password: 'رمز فعلی را وارد کنید.' }),
        ...(newPassword ? {} : { new_password: 'رمز جدید را وارد کنید.' }),
      });
      return;
    }
    if (!isPasswordAcceptable(newPassword)) {
      setFieldErrors({
        new_password: 'رمز جدید قواعد امنیتی را ندارد (حداقل ۸ کاراکتر، فقط عدد نباشد).',
      });
      return;
    }
    if (newPassword !== confirm) {
      setFieldErrors({ confirm: 'تکرار رمز جدید با آن یکسان نیست.' });
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    setFieldErrors({});
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setNotice('رمز عبور با موفقیت تغییر کرد.');
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      const fe = extractFieldErrors(err);
      const message = firstErrorMessage(err);
      if (message?.includes('رمز فعلی')) {
        fe.old_password = fe.old_password ?? message;
      }
      setFieldErrors(fe);
      setError(Object.keys(fe).length ? null : (message ?? 'تغییر رمز انجام نشد.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      icon={<KeyRound className="h-[18px] w-[18px]" />}
      title="تغییر رمز عبور"
      description="با تأیید رمز فعلی، رمز تازه بسازید. بعد از تغییر، ورودهای بعدی با رمز جدید انجام می‌شود."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {notice ? <Alert kind="success">{notice}</Alert> : null}
        {error ? <Alert kind="error">{error}</Alert> : null}

        <PasswordField
          id="acc-old-password"
          label="رمز فعلی"
          value={oldPassword}
          onChange={setOldPassword}
          error={fieldErrors.old_password ?? null}
          autoComplete="current-password"
          disabled={busy}
        />
        <PasswordField
          id="acc-new-password"
          label="رمز جدید"
          value={newPassword}
          onChange={setNewPassword}
          error={fieldErrors.new_password ?? null}
          autoComplete="new-password"
          withChecklist
          disabled={busy}
        />
        <PasswordField
          id="acc-confirm-password"
          label="تکرار رمز جدید"
          value={confirm}
          onChange={setConfirm}
          error={fieldErrors.confirm ?? (mismatch ? 'تکرار رمز جدید با آن یکسان نیست.' : null)}
          autoComplete="new-password"
          disabled={busy}
        />

        <SubmitButton loading={busy} className="max-w-[220px]">
          ذخیره رمز جدید
        </SubmitButton>
      </form>
    </SectionCard>
  );
}

/* ── نشست‌ها ────────────────────────────────────────────────────────────── */

function SessionRow({
  session,
  onRevoked,
}: {
  session: AuthSession;
  onRevoked: (fresh: AuthSession) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoke = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const fresh = await revokeSession(session.id);
      onRevoked(fresh);
    } catch (err) {
      setError(firstErrorMessage(err) ?? 'لغوی نشست انجام نشد.');
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className={cn(
        'rounded-2xl border p-4 transition-all duration-200',
        session.is_revoked
          ? 'border-ink-100 bg-ink-50/40 opacity-70'
          : 'border-ink-100 bg-white hover:shadow-[0_10px_26px_-16px_rgba(15,20,32,.22)]',
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            session.is_revoked ? 'bg-ink-100 text-ink-400' : 'bg-brand-50 text-brand-600',
          )}
        >
          <DeviceIcon label={session.device_label} className="h-[20px] w-[20px]" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[13.5px] font-extrabold text-ink-900">
              {deviceLabelFa(session.device_label)}
            </h3>
            {session.is_revoked ? (
              <Badge tone="danger">لغو شده</Badge>
            ) : (
              <Badge tone="ok">فعال</Badge>
            )}
          </div>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] font-medium text-ink-500">
            {session.ip_address ? (
              <span dir="ltr" className="tabular-nums">
                IP: {session.ip_address}
              </span>
            ) : null}
            {session.last_seen_at ? (
              <span>آخرین فعالیت: {formatRelativeFa(session.last_seen_at)}</span>
            ) : null}
            {session.expires_at ? (
              <span>انقضا: {formatJalaliDateTime(session.expires_at)}</span>
            ) : null}
          </p>
        </div>

        {!session.is_revoked ? (
          confirming ? (
            <div className="flex items-center gap-2">
              <GhostButton danger busy={busy} onClick={revoke}>
                بله، لغو شود
              </GhostButton>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="text-[12px] font-bold text-ink-500 transition-colors hover:text-ink-800"
              >
                انصراف
              </button>
            </div>
          ) : (
            <GhostButton onClick={() => setConfirming(true)}>لغو نشست</GhostButton>
          )
        ) : null}
      </div>
      {error ? (
        <div className="mt-3">
          <Alert kind="error">{error}</Alert>
        </div>
      ) : null}
    </li>
  );
}

export function SessionsCard({
  sessionsPage,
  onPatch,
  onLoadMore,
  loadingMore,
}: {
  sessionsPage: SessionsPage | null;
  onPatch: (fresh: AuthSession) => void;
  onLoadMore: () => void;
  loadingMore: boolean;
}) {
  const sessions = sessionsPage?.results ?? [];
  return (
    <SectionCard
      icon={<MonitorSmartphone className="h-[18px] w-[18px]" />}
      title="نشست‌ها و دستگاه‌ها"
      description="هر ورودی که هنوز معتبر است این‌جا دیده می‌شود. لغوی نشستِ فعلی هم‌ارزِ خروج از حساب است."
      actions={
        sessions.length ? <ShieldCheck className="h-4 w-4 text-brand-500" aria-label="امن" /> : null
      }
    >
      {sessions.length === 0 ? (
        <p className="rounded-xl bg-ink-50/60 px-4 py-6 text-center text-[12.5px] font-medium text-ink-500">
          نشستِ فعالی پیدا نشد.
        </p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <SessionRow key={s.id} session={s} onRevoked={onPatch} />
          ))}
        </ul>
      )}
      {sessionsPage?.next ? (
        <div className="mt-4 text-center">
          <GhostButton onClick={onLoadMore} busy={loadingMore}>
            نمایش نشست‌های قدیمی‌تر
          </GhostButton>
        </div>
      ) : null}
    </SectionCard>
  );
}

/* ── خروج ────────────────────────────────────────────────────────────────── */

export function LogoutCard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <SectionCard
      icon={<LogOut className="h-[18px] w-[18px]" />}
      title="خروج از حساب"
      description="نشستِ فعلی روی این دستگاه بسته و توکن‌ها باطل می‌شوند."
      className="border-rose-100"
    >
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <GhostButton
            danger
            busy={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await logout();
                onLoggedOut();
              } finally {
                setBusy(false);
              }
            }}
          >
            بله، خارج شوم
          </GhostButton>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="text-[12.5px] font-bold text-ink-500 transition-colors hover:text-ink-800"
          >
            انصراف
          </button>
        </div>
      ) : (
        <GhostButton danger onClick={() => setConfirming(true)}>
          خروج از حساب
        </GhostButton>
      )}
    </SectionCard>
  );
}

/* ── بخش امنیت (ترکیب) ──────────────────────────────────────────────────── */

export function SecuritySection(props: {
  sessionsPage: SessionsPage | null;
  onPatchSession: (fresh: AuthSession) => void;
  onLoadMoreSessions: () => void;
  loadingMoreSessions: boolean;
  onLoggedOut: () => void;
}) {
  return (
    <div className="space-y-4">
      <ChangePasswordCard />
      <SessionsCard
        sessionsPage={props.sessionsPage}
        onPatch={props.onPatchSession}
        onLoadMore={props.onLoadMoreSessions}
        loadingMore={props.loadingMoreSessions}
      />
      <LogoutCard onLoggedOut={props.onLoggedOut} />
    </div>
  );
}
