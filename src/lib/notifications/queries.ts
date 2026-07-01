import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type NavigationBadgeCounts = Partial<Record<"/duyurular" | "/mesajlar" | "/gorevler" | "/talepler", number>>;

export async function getNavigationBadgeCounts(profileId: string): Promise<NavigationBadgeCounts> {
  const supabase = createSupabaseAdminClient();

  const [{ count: unreadAnnouncements }, { count: unreadMessages }, { count: unreadTasks }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("module_key", "announcements")
      .eq("is_read", false),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_profile_id", profileId)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .in("module_key", ["tasks", "talepler"])
      .eq("is_read", false),
  ]);

  return {
    "/duyurular": unreadAnnouncements ?? 0,
    "/mesajlar": unreadMessages ?? 0,
    "/gorevler": unreadTasks ?? 0,
  };
}

export async function markModuleNotificationsAsRead(profileId: string, moduleKey: string) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", profileId)
    .eq("module_key", moduleKey)
    .eq("is_read", false);
}
