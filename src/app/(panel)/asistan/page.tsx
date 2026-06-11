import { requireAuth } from "@/lib/auth";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POLA AI | Nizamiye OYBS",
};

export default async function AsistanPage() {
  const { profile } = await requireAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#093657]">POLA AI</h1>
        <p className="text-sm text-muted-foreground">
          Sistem verilerinizi sorgulamak için doğal dil kullanın.
        </p>
      </div>
      <AssistantChat profile={profile} />
    </div>
  );
}
