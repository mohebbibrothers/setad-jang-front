"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, LoaderCircle, Send, ShieldCheck, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/AuthUI";
import { apiFetch, firstErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

const ALLOWED = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
  "doc",
  "docx",
  "mp4",
  "mp3",
];
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 5;

type Criminal = {
  id: number;
  first_name: string;
  last_name: string;
  slug: string;
};

export function R4JReportForm({ criminal }: { criminal: Criminal }) {
  const auth = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      const next = `/r4j/${criminal.slug}/report`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [auth.isAuthenticated, auth.loading, criminal.slug, router]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setError(null);
    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED.includes(extension)) {
        setError(`فرمت فایل «${file.name}» مجاز نیست.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`حجم فایل «${file.name}» بیشتر از ۲۰ مگابایت است.`);
        continue;
      }
      if (files.length + accepted.length >= MAX_FILES) break;
      accepted.push(file);
    }
    setFiles((current) => [...current, ...accepted].slice(0, MAX_FILES));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (notes.trim().length < 10 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("notes", notes.trim());
      body.append("field_changes", "[]");
      files.forEach((file) => body.append("attachments", file));
      const created = await apiFetch<{ id: number }>(
        `/r4j/criminals/${criminal.id}/reports/`,
        {
          method: "POST",
          body,
          cache: "no-store",
          timeoutMs: 30_000,
        },
      );
      setCreatedId(created.id);
      setNotes("");
      setFiles([]);
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ثبت اطلاعات تکمیلی انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  if (auth.loading || !auth.isAuthenticated) return <Loading />;
  const fullName = `${criminal.first_name} ${criminal.last_name}`.trim();

  return (
    <main className="min-h-[65vh] bg-ink-50 py-10">
      <div className="container-edge max-w-3xl">
        <Link
          href={`/r4j/${criminal.slug}`}
          className="text-sm font-extrabold text-brand-700 hover:underline"
        >
          بازگشت به پرونده
        </Link>
        <section className="mt-5 rounded-[2rem] border border-ink-100 bg-white p-6 shadow-card sm:p-9">
          <div className="flex items-start gap-4 border-b border-ink-100 pb-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-brand-700">
                مشارکت مردمی
              </p>
              <h1 className="mt-2 text-2xl font-black">
                ارسال اطلاعات درباره {fullName}
              </h1>
              <p className="mt-2 text-sm font-medium leading-7 text-ink-500">
                اطلاعات و اسناد شما پیش از هر تغییری توسط مدیران بررسی می‌شود.
              </p>
            </div>
          </div>

          {createdId !== null ? (
            <div className="mt-6 space-y-5">
              <AuthAlert type="success">
                گزارش با شناسه #{createdId.toLocaleString("fa-IR")} ثبت شد و در
                انتظار بررسی است.
              </AuthAlert>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCreatedId(null)}
                  className="btn-primary btn-md"
                >
                  ارسال گزارش دیگر
                </button>
                <Link href="/account" className="btn-outline btn-md">
                  مشاهده حساب
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-5">
              {error && <AuthAlert>{error}</AuthAlert>}
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-ink-700">
                  شرح اطلاعات یا سرنخ
                </span>
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value.slice(0, 5000))
                  }
                  rows={8}
                  placeholder="اطلاعات را دقیق، روشن و بدون حدس‌های تأییدنشده شرح دهید…"
                  className="w-full rounded-2xl border border-ink-200 p-4 text-sm font-medium leading-8 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  required
                />
              </label>
              <div>
                <span className="mb-2 block text-sm font-extrabold text-ink-700">
                  اسناد و پیوست‌ها{" "}
                  <small className="font-medium text-ink-400">(اختیاری)</small>
                </span>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50 p-6 text-center hover:border-brand-300 hover:bg-brand-50/40">
                  <FilePlus2 className="h-7 w-7 text-brand-600" />
                  <span className="mt-2 text-sm font-extrabold text-ink-700">
                    انتخاب فایل
                  </span>
                  <span className="mt-1 text-xs text-ink-400">
                    حداکثر ۵ فایل، هرکدام تا ۲۰ مگابایت
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.mp4,.mp3"
                    onChange={(event) => addFiles(event.target.files)}
                    className="sr-only"
                  />
                </label>
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-xs font-bold"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                          aria-label={`حذف ${file.name}`}
                          className="text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || notes.trim().length < 10}
                className="btn-primary btn-md w-full sm:w-auto"
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}{" "}
                ثبت برای بررسی
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Loading() {
  return (
    <main className="flex min-h-[55vh] items-center justify-center bg-ink-50">
      <LoaderCircle className="h-8 w-8 animate-spin text-brand-600" />
    </main>
  );
}
