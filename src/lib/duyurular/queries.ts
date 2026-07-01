import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnnouncementRow } from "@/types/database";

export type AnnouncementWithCreator = AnnouncementRow & {
  creator: { id: string; full_name: string } | null;
};

export async function getAnnouncements(): Promise<AnnouncementWithCreator[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, creator:created_by(id, full_name)")
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as AnnouncementWithCreator[];
}

export async function getAnnouncementById(id: string): Promise<AnnouncementWithCreator | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*, creator:created_by(id, full_name)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as AnnouncementWithCreator;
  } catch {
    return null;
  }
}
