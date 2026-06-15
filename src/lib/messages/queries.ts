import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow, MessageRow } from "@/types/database";

export type MessageRowWithProfiles = MessageRow & {
  sender: Pick<ProfileRow, "id" | "full_name" | "role">;
  recipient: Pick<ProfileRow, "id" | "full_name" | "role">;
};

export async function getConversations(profile: ProfileRow, page?: number, pageSize = 20) {
  const supabase = createSupabaseAdminClient();

  const { data, count } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_profile_id_fkey(id, full_name, role),
      recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, role)
    `, { count: "exact" })
    .or(`sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  const messages = (data ?? []) as unknown as MessageRowWithProfiles[];

  const conversationMap = new Map<string, MessageRowWithProfiles>();
  for (const msg of messages) {
    const otherId = msg.sender_profile_id === profile.id ? msg.recipient_profile_id : msg.sender_profile_id;
    const key = `${otherId}-${msg.subject ?? "no-subject"}`;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, msg);
    }
  }

  const conversations = Array.from(conversationMap.values()).slice(0, pageSize);
  return { data: conversations, count: count ?? 0 };
}

export async function getMessages(profile: ProfileRow, otherProfileId: string, subject?: string, page?: number, pageSize = 50) {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_profile_id_fkey(id, full_name, role),
      recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, role),
      student:students(id, full_name)
    `)
    .or(`and(sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${otherProfileId}),and(sender_profile_id.eq.${otherProfileId},recipient_profile_id.eq.${profile.id})`)
    .order("created_at", { ascending: true });

  if (subject) {
    query = query.eq("subject", subject);
  }

  if (page !== undefined) {
    const from = Math.max(0, (page - 1) * pageSize);
    query = query.range(from, from + pageSize - 1);
  }

  const { data } = await query;
  return (data ?? []) as unknown as MessageRowWithProfiles[];
}

export async function getMessageById(id: string) {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_profile_id_fkey(id, full_name, role),
      recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, role),
      student:students(id, full_name)
    `)
    .eq("id", id)
    .single();

  return data as MessageRowWithProfiles | null;
}

export async function getUnreadCount(profile: ProfileRow) {
  const supabase = createSupabaseAdminClient();

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_profile_id", profile.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function markAsRead(profile: ProfileRow, messageId: string) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("recipient_profile_id", profile.id);
}

export async function markConversationAsRead(profile: ProfileRow, otherProfileId: string) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_profile_id", profile.id)
    .eq("sender_profile_id", otherProfileId);
}