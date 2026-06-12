import type { Metadata } from "next";

import { AssistantChat } from "@/components/assistant/assistant-chat";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nizam Aİ | Nizamiye OYBS",
};

export default async function AsistanPage() {
  const { profile } = await requireAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#093657]">Nizam Aİ</h1>
        <p className="text-sm text-muted-foreground">Sistem verilerinizi sorgulamak için doğal dil kullanın.</p>
      </div>
      <AssistantChat profile={profile} variant="page" />
    </div>
  );
}
