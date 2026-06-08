import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DepartmentRow, ProfileRow } from "@/types/database";

export type AccountProfile = ProfileRow & {
  department: DepartmentRow | null;
};

export async function getAccountProfile(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();

  if (error) {
    throw new Error("Hesap profili alınamadı.");
  }

  if (!profile) {
    return null;
  }

  const department = profile.department_id
    ? (await supabase.from("departments").select("*").eq("id", profile.department_id).maybeSingle()).data ?? null
    : null;

  return {
    ...profile,
    department,
  } satisfies AccountProfile;
}
