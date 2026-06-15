import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { getSmsLimit, getSmsCountForMonth } from "@/lib/messages/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationViewClient } from "./conversation-client";

type MessageWithProfiles = {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  read_at: string | null;
  sent_via: "app" | "sms" | null;
  created_at: string;
  sender: { id: string; full_name: string; role: string };
  recipient: { id: string; full_name: string; role: string };
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MesajDetayPage({ params }: PageProps) {
  const { profile: currentProfile } = await requireAuth();
  const { id: otherProfileId } = await params;

  const supabase = createSupabaseAdminClient();

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone")
    .eq("id", otherProfileId)
    .single();

  if (!otherProfile) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_profile_id_fkey(id, full_name, role),
      recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, role)
    `)
    .or(`and(sender_profile_id.eq.${currentProfile.id},recipient_profile_id.eq.${otherProfileId}),and(sender_profile_id.eq.${otherProfileId},recipient_profile_id.eq.${currentProfile.id})`)
    .order("created_at", { ascending: true });

  await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_profile_id", currentProfile.id)
    .eq("sender_profile_id", otherProfileId);

  const smsLimit = getSmsLimit(currentProfile.role);
  const smsUsed = await getSmsCountForMonth(supabase, currentProfile.id);
  const smsAvailable = smsLimit > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Mesajlaşma"
        title={otherProfile.full_name}
        description={`${otherProfile.role.replace("_", " ")} ile mesajlaşma`}
      />

      <Card>
        <CardContent className="p-6">
          <ConversationViewClient
            otherProfile={otherProfile}
            initialMessages={(messages ?? []) as MessageWithProfiles[]}
            currentProfile={currentProfile}
            smsAvailable={smsAvailable}
            smsLimit={smsLimit}
            smsUsed={smsUsed}
          />
        </CardContent>
      </Card>
    </div>
  );
}