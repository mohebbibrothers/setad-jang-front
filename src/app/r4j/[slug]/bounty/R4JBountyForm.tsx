"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck, Trophy } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/AuthUI";
import { apiFetch, firstErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { formatPersianNumber } from "@/lib/utils";

type Criminal = {
  id: number;
  first_name: string;
  last_name: string;
  slug: string;
};

type Bounty = { id: number; amount_toman: number; status: string };

export function R4JBountyForm({ criminal }: { criminal: Criminal }) {
  const auth = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState("50000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Bounty | null>(null);

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      const next = `/r4j/${criminal.slug}/bounty`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [auth.isAuthenticated, auth.loading, criminal.slug, router]);

  const numericAmount = Number(amount || 0);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (numericAmount < 50_000 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<Bounty>(
        `/r4j/criminals/${criminal.id}/bounty/`,
        {
          method: "POST",
          body: JSON.stringify({ amount_toman: numericAmount }),
          cache: "no-store",
        },
      );
      setCreated(result);
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ثبت تعهد جایزه انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  if (auth.loading || !auth.isAuthenticated)
    return (
      <main className="flex min-h-[55vh] items-center justify-center bg-ink-50">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-600" />
      </main>
    );
  const fullName = `${criminal.first_name} ${criminal.last_name}`.trim();

  return (
    <main className="min-h-[65vh] bg-ink-50 py-10">
      <div className="container-edge max-w-2xl">
        <Link
          href={`/r4j/${criminal.slug}`}
          className="text-sm font-extrabold text-brand-700 hover:underline"
        >
          بازگشت به پرونده
        </Link>
        <section className="mt-5 overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-card">
          <div className="bg-gradient-to-br from-accent-500 to-accent-700 p-7 text-white sm:p-9">
            <Trophy className="h-10 w-10" />
            <p className="mt-5 text-sm font-bold text-white/75">
              تعهد جایزه برای پرونده
            </p>
            <h1 className="mt-2 text-2xl font-black text-white">{fullName}</h1>
          </div>
          <div className="p-6 sm:p-9">
            {created ? (
              <div className="space-y-5">
                <AuthAlert type="success">
                  تعهد شما به مبلغ {formatPersianNumber(created.amount_toman)}{" "}
                  تومان ثبت شد.
                </AuthAlert>
                <Link
                  href={`/r4j/${criminal.slug}`}
                  className="btn-primary btn-md"
                >
                  بازگشت به پرونده
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                {error && <AuthAlert>{error}</AuthAlert>}
                <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-xs font-bold leading-7 text-brand-900">
                  <ShieldCheck className="ml-2 inline h-4 w-4" />
                  این بخش یک تعهد اعلامی است. برای ثبت آن، ایمیل و موبایل
                  تأییدشده و پروفایل کامل لازم است.
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold text-ink-700">
                    مبلغ تعهد{" "}
                    <small className="font-medium text-ink-400">(تومان)</small>
                  </span>
                  <input
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value.replace(/\D/g, "").slice(0, 14),
                      )
                    }
                    inputMode="numeric"
                    dir="ltr"
                    className="h-14 w-full rounded-xl border border-ink-200 px-4 text-left text-xl font-black tabular-nums outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {[50_000, 100_000, 500_000, 1_000_000].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(String(value))}
                      className="rounded-full bg-ink-50 px-3 py-2 text-xs font-extrabold text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {formatPersianNumber(value)}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium text-ink-400">
                  حداقل مبلغ قابل ثبت ۵۰٬۰۰۰ تومان است.
                </p>
                <button
                  type="submit"
                  disabled={loading || numericAmount < 50_000}
                  className="btn-primary btn-md w-full"
                >
                  {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trophy className="h-4 w-4" />
                  )}{" "}
                  ثبت تعهد جایزه
                </button>
                <p className="text-center text-xs font-bold text-ink-400">
                  اگر پروفایل شما کامل نیست، از{" "}
                  <Link
                    href="/account"
                    className="text-brand-700 hover:underline"
                  >
                    صفحه حساب
                  </Link>{" "}
                  آن را تکمیل کنید.
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
