"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  LoaderCircle,
  LogOut,
  MonitorSmartphone,
  Save,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { AuthAlert, AuthField, PasswordField } from "@/components/auth/AuthUI";
import {
  changePassword,
  getProfile,
  listSessions,
  revokeSession,
  updateMe,
  updateProfile,
  type AuthProfile,
  type AuthSession,
} from "@/lib/auth";
import { firstErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const EMPTY_PROFILE: AuthProfile = {
  phone_number: null,
  national_code: "",
  birth_date: null,
  gender: "",
  avatar: null,
  bio: "",
  province: "",
  city: "",
  address: "",
};

type Tab = "profile" | "security" | "sessions";

export function AccountDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<AuthProfile>(EMPTY_PROFILE);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.replace("/auth/login?next=%2Faccount");
    }
  }, [auth.isAuthenticated, auth.loading, router]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    let active = true;
    setLoadingData(true);
    Promise.all([getProfile(), listSessions()])
      .then(([nextProfile, nextSessions]) => {
        if (!active) return;
        setProfile({ ...EMPTY_PROFILE, ...nextProfile });
        setSessions(nextSessions);
      })
      .catch(
        (cause) =>
          active &&
          setError(
            firstErrorMessage(cause) || "دریافت اطلاعات حساب انجام نشد.",
          ),
      )
      .finally(() => active && setLoadingData(false));
    return () => {
      active = false;
    };
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!auth.user) return;
    setFirstName(auth.user.first_name || "");
    setLastName(auth.user.last_name || "");
  }, [auth.user]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const [user, nextProfile] = await Promise.all([
        updateMe({ first_name: firstName.trim(), last_name: lastName.trim() }),
        updateProfile({
          national_code: profile.national_code || "",
          birth_date: profile.birth_date || null,
          gender: profile.gender || "",
          bio: profile.bio || "",
          province: profile.province || "",
          city: profile.city || "",
          address: profile.address || "",
        }),
      ]);
      setProfile(nextProfile);
      await auth.refresh();
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setMessage("اطلاعات پروفایل با موفقیت ذخیره شد.");
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ذخیره پروفایل انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }
    setSaving(true);
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("رمز عبور با موفقیت تغییر کرد.");
    } catch (cause) {
      setError(firstErrorMessage(cause) || "تغییر رمز عبور انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (session: AuthSession) => {
    setError(null);
    setMessage(null);
    try {
      const revoked = await revokeSession(session.id);
      setSessions((current) =>
        current.map((item) => (item.id === revoked.id ? revoked : item)),
      );
      setMessage("نشست انتخاب‌شده پایان یافت.");
    } catch (cause) {
      setError(firstErrorMessage(cause) || "پایان دادن نشست انجام نشد.");
    }
  };

  const signOut = async () => {
    await auth.logout();
    router.replace("/");
    router.refresh();
  };

  if (auth.loading || (auth.isAuthenticated && loadingData)) {
    return (
      <main className="flex min-h-[55vh] items-center justify-center bg-ink-50">
        <LoaderCircle
          className="h-8 w-8 animate-spin text-brand-600"
          aria-label="در حال بارگذاری"
        />
      </main>
    );
  }
  if (!auth.isAuthenticated) return null;

  const tabs: Array<{ key: Tab; label: string; icon: typeof UserRound }> = [
    { key: "profile", label: "اطلاعات شخصی", icon: UserRound },
    { key: "security", label: "امنیت و رمز", icon: KeyRound },
    { key: "sessions", label: "نشست‌های فعال", icon: MonitorSmartphone },
  ];

  return (
    <main className="min-h-[65vh] bg-ink-50 py-8 md:py-12">
      <div className="container-edge">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold text-brand-700">حساب کاربری</p>
            <h1 className="mt-2 text-2xl font-black text-ink-900">
              {auth.user?.full_name || auth.user?.email || "همراه بعثت"}
            </h1>
          </div>
          <Link href="/" className="btn-outline btn-sm">
            بازگشت به خانه
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-2xl border border-ink-100 bg-white p-3 shadow-soft">
            <nav className="space-y-1" aria-label="بخش‌های حساب">
              {tabs.map(({ key, label, icon: TabIcon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    setError(null);
                    setMessage(null);
                  }}
                  className={cn(
                    "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-right text-sm font-extrabold transition",
                    tab === key
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                  )}
                >
                  <TabIcon className="h-4 w-4" /> {label}
                </button>
              ))}
              <button
                type="button"
                onClick={signOut}
                className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-extrabold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> خروج از حساب
              </button>
            </nav>
          </aside>

          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft sm:p-7">
            {error && (
              <div className="mb-5">
                <AuthAlert>{error}</AuthAlert>
              </div>
            )}
            {message && (
              <div className="mb-5">
                <AuthAlert type="success">{message}</AuthAlert>
              </div>
            )}

            {tab === "profile" && (
              <form onSubmit={saveProfile} className="space-y-5">
                <SectionHeading
                  icon={<UserRound />}
                  title="اطلاعات شخصی"
                  description="اطلاعات پایه‌ای که در سرویس‌های بعثت استفاده می‌شود."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthField
                    label="نام"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    maxLength={100}
                  />
                  <AuthField
                    label="نام خانوادگی"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    maxLength={100}
                  />
                  <AuthField
                    label="کد ملی"
                    value={profile.national_code || ""}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        national_code: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      }))
                    }
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={10}
                  />
                  <AuthField
                    label="تاریخ تولد"
                    value={profile.birth_date || ""}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        birth_date: event.target.value || null,
                      }))
                    }
                    type="date"
                    dir="ltr"
                  />
                  <AuthField
                    label="استان"
                    value={profile.province || ""}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        province: event.target.value,
                      }))
                    }
                    maxLength={100}
                  />
                  <AuthField
                    label="شهر"
                    value={profile.city || ""}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    maxLength={100}
                  />
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-ink-700">
                    جنسیت
                  </span>
                  <select
                    value={profile.gender || ""}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        gender: event.target.value as AuthProfile["gender"],
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold outline-none focus:border-brand-500"
                  >
                    <option value="">انتخاب نشده</option>
                    <option value="male">مرد</option>
                    <option value="female">زن</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-ink-700">
                    آدرس
                  </span>
                  <textarea
                    value={profile.address || ""}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-xl border border-ink-200 p-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </label>
                <button
                  disabled={saving}
                  className="btn-primary btn-md min-w-40"
                  type="submit"
                >
                  {saving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  ذخیره تغییرات
                </button>
              </form>
            )}

            {tab === "security" && (
              <form onSubmit={savePassword} className="max-w-xl space-y-5">
                <SectionHeading
                  icon={<ShieldCheck />}
                  title="امنیت حساب"
                  description="برای حفاظت از حساب، رمز منحصربه‌فرد انتخاب کنید."
                />
                <PasswordField
                  label="رمز عبور فعلی"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <PasswordField
                  label="رمز عبور جدید"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <PasswordField
                  label="تکرار رمز جدید"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  error={
                    confirmPassword && confirmPassword !== newPassword
                      ? "رمزها یکسان نیستند."
                      : undefined
                  }
                  required
                />
                <button
                  disabled={
                    saving ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  className="btn-primary btn-md"
                  type="submit"
                >
                  {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{" "}
                  تغییر رمز عبور
                </button>
              </form>
            )}

            {tab === "sessions" && (
              <div>
                <SectionHeading
                  icon={<MonitorSmartphone />}
                  title="نشست‌ها و دستگاه‌ها"
                  description="دستگاه‌هایی که با توکن فعال به حساب متصل شده‌اند."
                />
                <div className="mt-6 space-y-3">
                  {sessions.length === 0 ? (
                    <p className="rounded-xl bg-ink-50 p-5 text-center text-sm font-bold text-ink-500">
                      نشستی برای نمایش وجود ندارد.
                    </p>
                  ) : (
                    sessions.map((session) => (
                      <article
                        key={session.id}
                        className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-100 p-4"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <MonitorSmartphone className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-extrabold">
                            {session.device_label || "دستگاه ناشناس"}
                          </h3>
                          <p
                            dir="ltr"
                            className="mt-1 truncate text-left text-xs text-ink-400"
                          >
                            {session.ip_address || "IP نامشخص"} ·{" "}
                            {new Date(session.last_seen_at).toLocaleString(
                              "fa-IR",
                            )}
                          </p>
                        </div>
                        {session.is_revoked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-ink-400">
                            <XCircle className="h-4 w-4" /> پایان‌یافته
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => revoke(session)}
                            className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100"
                          >
                            پایان نشست
                          </button>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-ink-100 pb-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-black text-ink-900">{title}</h2>
          <p className="mt-1 text-xs font-medium leading-6 text-ink-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
