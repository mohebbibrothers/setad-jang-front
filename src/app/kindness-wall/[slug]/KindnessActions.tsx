"use client";

import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle2, LoaderCircle, Phone } from "lucide-react";
import { useState } from "react";
import { AuthAlert } from "@/components/auth/AuthUI";
import { apiFetch, firstErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

type Reveal = {
  phone_number: string;
  listing_id: number;
  owner_full_name: string;
};

export function KindnessActions({
  slug,
  contactAvailable,
}: {
  slug: string;
  contactAvailable: boolean;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<"bookmark" | "contact" | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [contact, setContact] = useState<Reveal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requireAuth = () => {
    if (auth.isAuthenticated) return true;
    router.push(
      `/auth/login?next=${encodeURIComponent(`/kindness-wall/${slug}`)}`,
    );
    return false;
  };

  const bookmark = async () => {
    if (!requireAuth()) return;
    setLoading("bookmark");
    setError(null);
    try {
      await apiFetch(
        `/kindness-wall/listings/${encodeURIComponent(slug)}/bookmark/`,
        { method: "POST", cache: "no-store" },
      );
      setBookmarked(true);
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ذخیره آگهی انجام نشد.");
    } finally {
      setLoading(null);
    }
  };

  const reveal = async () => {
    if (!requireAuth()) return;
    setLoading("contact");
    setError(null);
    try {
      setContact(
        await apiFetch<Reveal>(
          `/kindness-wall/listings/${encodeURIComponent(slug)}/reveal-contact/`,
          { method: "POST", cache: "no-store" },
        ),
      );
    } catch (cause) {
      setError(firstErrorMessage(cause) || "نمایش اطلاعات تماس انجام نشد.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && <AuthAlert>{error}</AuthAlert>}
      {contact && (
        <AuthAlert type="success">
          شماره تماس {contact.owner_full_name}:{" "}
          <a
            dir="ltr"
            href={`tel:${contact.phone_number}`}
            className="font-black underline"
          >
            {contact.phone_number}
          </a>
        </AuthAlert>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reveal}
          disabled={!contactAvailable || loading !== null}
          className="btn-primary btn-md flex-1"
        >
          {loading === "contact" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          {contactAvailable ? "نمایش اطلاعات تماس" : "تماس در دسترس نیست"}
        </button>
        <button
          type="button"
          onClick={bookmark}
          disabled={bookmarked || loading !== null}
          className="btn-outline btn-md flex-1"
        >
          {loading === "bookmark" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : bookmarked ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {bookmarked ? "ذخیره شد" : "ذخیره آگهی"}
        </button>
      </div>
    </div>
  );
}
