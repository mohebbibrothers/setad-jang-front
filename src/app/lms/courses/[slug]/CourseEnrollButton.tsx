"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { AuthAlert } from "@/components/auth/AuthUI";
import { apiFetch, firstErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

export function CourseEnrollButton({ slug }: { slug: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enroll = async () => {
    if (!auth.isAuthenticated) {
      router.push(
        `/auth/login?next=${encodeURIComponent(`/lms/courses/${slug}`)}`,
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/lms/courses/${encodeURIComponent(slug)}/enroll/`, {
        method: "POST",
        cache: "no-store",
      });
      setEnrolled(true);
      router.refresh();
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ثبت‌نام در دوره انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <AuthAlert>{error}</AuthAlert>}
      <button
        type="button"
        onClick={enroll}
        disabled={loading || enrolled}
        className="btn-primary btn-lg w-full"
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : enrolled ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : null}
        {enrolled ? "در دوره ثبت‌نام شدید" : "ثبت‌نام رایگان در دوره"}
      </button>
    </div>
  );
}
