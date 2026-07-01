"use server";

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NotificationRow } from "@/types/database";

type CreateNotificationInput = {
  profileId: string;
  type: NotificationRow["type"];
  moduleKey: string;
  title: string;
  message?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("notifications").insert({
    profile_id: input.profileId,
    type: input.type,
    module_key: input.moduleKey,
    title: input.title,
    message: input.message ?? null,
    is_read: false,
    sent_via: "app",
  });
}

export async function createBatchNotifications(inputs: CreateNotificationInput[]) {
  const supabase = createSupabaseAdminClient();

  const rows = inputs.map((input) => ({
    profile_id: input.profileId,
    type: input.type,
    module_key: input.moduleKey,
    title: input.title,
    message: input.message ?? null,
    is_read: false,
    sent_via: "app",
  }));

  await supabase.from("notifications").insert(rows);
}
