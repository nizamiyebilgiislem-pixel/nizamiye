"use server";

import type { ProfileRow, AssistantMessageRow } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Message } from "./types";

const MESSAGE_LIMIT = 100;

export async function getMessages(profile: ProfileRow): Promise<Message[]> {
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
