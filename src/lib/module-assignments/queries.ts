import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ModuleAssignmentRow = {
  id: string;
  module_key: string;
  profile_id: string;
  assigned_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ModuleAssignmentWithProfile = ModuleAssignmentRow & {
  profile: { id: string; full_name: string; role: string; department_id: string | null } | null;
  assigned_by_profile: { id: string; full_name: string } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ma(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): any {
  return supabase.from("module_assignments");
}

export async function getModuleAssignments(profileId: string): Promise<ModuleAssignmentRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await ma(supabase)
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true);
  return (data ?? []) as ModuleAssignmentRow[];
}

export async function getProfileModuleKeys(profileId: string): Promise<string[]> {
  const assignments = await getModuleAssignments(profileId);
  return assignments.map((a) => a.module_key);
}

export async function hasModuleAssignment(profileId: string, moduleKey: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { count } = await ma(supabase)
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("module_key", moduleKey)
    .eq("is_active", true);
  return (count ?? 0) > 0;
}

export async function getModuleAssignees(moduleKey: string): Promise<ModuleAssignmentWithProfile[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await ma(supabase)
    .select("*, profile:profile_id(id, full_name, role, department_id), assigned_by_profile:assigned_by(id, full_name)")
    .eq("module_key", moduleKey)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ModuleAssignmentWithProfile[];
}

export async function getAssignableModuleProfiles() {
  const supabase = await createSupabaseServerClient();
  const staffRoles = ["hoca", "bolum_muduru", "rehberlik", "kutuphane_gorevlisi", "destek_birim_muduru"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl: any = supabase.from("profiles");
  const { data } = await tbl
    .select("id, full_name, role, department_id")
    .in("role", staffRoles)
    .order("full_name", { ascending: true });
  return (data ?? []) as Array<{ id: string; full_name: string; role: string; department_id: string | null }>;
}

export async function getExistingAssignment(profileId: string, moduleKey: string): Promise<ModuleAssignmentRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await ma(supabase)
    .select("*")
    .eq("profile_id", profileId)
    .eq("module_key", moduleKey)
    .maybeSingle();
  return (data ?? null) as ModuleAssignmentRow | null;
}
