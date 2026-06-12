"use client";

import { Copy } from "lucide-react";

import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";

type CopyMeetingLinkButtonProps = {
  sessionId: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "xs";
  className?: string;
};

export function CopyMeetingLinkButton({ sessionId, variant = "outline", size = "sm", className }: CopyMeetingLinkButtonProps) {
  const { addToast } = useToast();

  async function copyLink() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const normalizedBase = baseUrl.replace(/\/$/, "");
    const link = `${normalizedBase}/canli-oturumlar/${sessionId}/katil`;

    await navigator.clipboard.writeText(link);
    addToast("success", "Toplantı linki kopyalandı.");
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={copyLink}>
      <Copy className="size-4" />
      Kopyala
    </Button>
  );
}
