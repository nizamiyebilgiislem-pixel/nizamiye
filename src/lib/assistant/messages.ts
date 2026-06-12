"use server";

import type { ProfileRow, AssistantMessageRow } from "@/types/database";
import { buildAuditActor, createAuditLog } from "@/lib/audit/log";
import { requireAuth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Message } from "./types";

const MESSAGE_LIMIT = 100;

export async function getMessages(profile: ProfileRow): Promise<Message[]> {
  const { profile: sessionProfile } = await requireAuth();
  if (profile.id !== sessionProfile.id) return [];

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("assistant_messages")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(MESSAGE_LIMIT);

  if (error || !data) return [];

  return data.map((row: AssistantMessageRow) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.created_at),
  }));
}

export async function saveMessage(
  profile: ProfileRow,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  await supabase.from("assistant_messages").insert({
    profile_id: profile.id,
    role,
    content,
  });
}

export async function clearMessages(): Promise<{ success: boolean; error?: string }> {
  const { profile } = await requireAuth();
  const supabase = createSupabaseAdminClient();

  const { count } = await supabase
    .from("assistant_messages")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.id);

  const { error } = await supabase
    .from("assistant_messages")
    .delete()
    .eq("profile_id", profile.id);

  if (error) {
    return { success: false, error: "Sohbet geçmişi silinemedi. Lütfen tekrar deneyin." };
  }

  await createAuditLog({
    ...buildAuditActor(profile),
    action: "assistant_history_cleared",
    entityType: "assistant",
    title: "Nizam Aİ sohbet geçmişi silindi",
    description: `${count ?? 0} sohbet mesajı silindi.`,
    metadata: {
      deletedMessageCount: count ?? 0,
    },
  });

  return { success: true };
}
