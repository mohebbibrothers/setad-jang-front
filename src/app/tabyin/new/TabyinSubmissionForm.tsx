"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Link2,
  LoaderCircle,
  Megaphone,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { AuthAlert, AuthField } from "@/components/auth/AuthUI";
import { apiFetch, firstErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

type MediaType = "image" | "video" | "audio" | "other";
type Attachment = {
  url: string;
  media_type: MediaType;
  title: string;
  order: number;
};
type CreatedSubmission = {
  id: number;
  external_id: string;
  submission_status: string;
};

const emptyAttachment = (order: number): Attachment => ({
  url: "",
  media_type: "other",
  title: "",
  order,
});

export function TabyinSubmissionForm() {
  const auth = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedSubmission | null>(null);

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated)
      router.replace("/auth/login?next=%2Ftabyin%2Fnew");
  }, [auth.isAuthenticated, auth.loading, router]);

  const updateAttachment = (index: number, patch: Partial<Attachment>) =>
    setAttachments((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const validAttachments = attachments
        .filter((item) => item.url.trim())
        .map((item, index) => ({
          ...item,
          url: item.url.trim(),
          title: item.title.trim(),
          order: index,
        }));
      const result = await apiFetch<CreatedSubmission>(
        "/tabyin/me/submissions/",
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            attachments: validAttachments,
          }),
          cache: "no-store",
        },
      );
      setCreated(result);
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ارسال روایت انجام نشد.");
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

  return (
    <main className="min-h-[65vh] bg-ink-50 py-10">
      <div className="container-edge max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/tabyin"
            className="text-sm font-extrabold text-brand-700 hover:underline"
          >
            بازگشت به آرشیو
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">
            <Megaphone className="h-4 w-4" /> روایت مردمی
          </span>
        </div>
        <section className="rounded-[2rem] border border-ink-100 bg-white p-6 shadow-card sm:p-9">
          {created ? (
            <div className="space-y-5">
              <AuthAlert type="success">
                روایت شما با شناسه #{created.id.toLocaleString("fa-IR")} ثبت شد
                و پیش از انتشار بررسی می‌شود.
              </AuthAlert>
              <div className="flex gap-3">
                <Link href="/tabyin" className="btn-primary btn-md">
                  مشاهده آرشیو
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCreated(null);
                    setTitle("");
                    setDescription("");
                    setAttachments([]);
                  }}
                  className="btn-outline btn-md"
                >
                  ارسال روایت دیگر
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <p className="text-xs font-extrabold text-brand-700">
                  ارسال برای بررسی
                </p>
                <h1 className="mt-2 text-2xl font-black">
                  روایت خود را به جریان حقیقت اضافه کنید
                </h1>
                <p className="mt-3 text-sm font-medium leading-8 text-ink-500">
                  در نسخه فعلی بک‌اند، پیوست‌ها به‌صورت نشانی اینترنتی ثبت
                  می‌شوند و حداکثر پنج پیوند قابل افزودن است.
                </p>
              </div>
              {error && <AuthAlert>{error}</AuthAlert>}
              <AuthField
                label="عنوان روایت"
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, 512))}
                required
              />
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-ink-700">
                  متن روایت
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={9}
                  className="w-full rounded-2xl border border-ink-200 p-4 text-sm font-medium leading-8 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  required
                />
              </label>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold text-ink-700">
                    پیوندهای رسانه
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((current) =>
                        current.length < 5
                          ? [...current, emptyAttachment(current.length)]
                          : current,
                      )
                    }
                    disabled={attachments.length >= 5}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-700 disabled:text-ink-300"
                  >
                    <Plus className="h-4 w-4" /> افزودن پیوند
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="grid gap-2 rounded-xl border border-ink-100 bg-ink-50 p-3 sm:grid-cols-[1fr_130px_auto]"
                    >
                      <label className="relative">
                        <Link2 className="absolute right-3 top-3.5 h-4 w-4 text-ink-400" />
                        <input
                          type="url"
                          dir="ltr"
                          value={attachment.url}
                          onChange={(event) =>
                            updateAttachment(index, { url: event.target.value })
                          }
                          placeholder="https://…"
                          className="h-11 w-full rounded-lg border border-ink-200 bg-white pr-9 pl-3 text-left text-xs outline-none focus:border-brand-500"
                        />
                      </label>
                      <select
                        value={attachment.media_type}
                        onChange={(event) =>
                          updateAttachment(index, {
                            media_type: event.target.value as MediaType,
                          })
                        }
                        className="h-11 rounded-lg border border-ink-200 bg-white px-2 text-xs font-bold"
                      >
                        <option value="image">تصویر</option>
                        <option value="video">ویدئو</option>
                        <option value="audio">صوت</option>
                        <option value="other">سایر</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label="حذف پیوند"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !title.trim() || !description.trim()}
                className="btn-primary btn-lg w-full"
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}{" "}
                ارسال برای بررسی
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
