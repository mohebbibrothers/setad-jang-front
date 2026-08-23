"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampaignParticipateModal } from "@/components/home/CampaignParticipateModal";
import type { CampaignCard } from "@/components/home/WarFundSection";
import { useAuth } from "@/lib/use-auth";

export function CampaignActions({ campaign }: { campaign: CampaignCard }) {
  const auth = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const disabled = campaign.isFullyFunded || campaign.sharesRemaining <= 0;

  const participate = () => {
    if (!auth.isAuthenticated) {
      router.push(
        `/auth/login?next=${encodeURIComponent(`/madadkar/${campaign.slug}`)}`,
      );
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={participate}
        disabled={disabled}
        className="btn-primary btn-lg w-full disabled:bg-ink-300 sm:w-auto"
      >
        {disabled ? "تأمین مالی تکمیل شده" : "مشارکت در این حرکت"}
      </button>
      <CampaignParticipateModal
        open={open}
        onClose={() => setOpen(false)}
        campaign={campaign}
      />
    </>
  );
}
