import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ANNOUNCEMENT_MODULE_KEY = "announcements";

export type NavigationBadgeCounts = Partial<Record<"/duyurular" | "/mesajlar", number>>;

export async function getNavigationBadgeCounts(profileId: string): Promise<NavigationBadgeCounts> {
  const supabase = createSupabaseAdminClient();

  const [{ count: unreadAnnouncements }, { count: unreadMessages }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("module_key", ANNOUNCEMENT_MODULE_KEY)
      .eq("is_read", false),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_profile_id", profileId)
      .eq("is_read", false),
  ]);

  return {
    "/duyurular": unreadAnnouncements ?? 0,
    "/mesajlar": unreadMessages ?? 0,
  };
}

export async function markAnnouncementNotificationsAsRead(profileId: string) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", profileId)
    .eq("module_key", ANNOUNCEMENT_MODULE_KEY)
    .eq("is_read", false);
}

export { ANNOUNCEMENT_MODULE_KEY };
