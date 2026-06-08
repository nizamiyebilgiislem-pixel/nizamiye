import { createSupabaseServerClient } from "@/lib/supabase/server";
import { staffProfileRoles } from "@/lib/profiles/permissions";
import type { ClassRow, DepartmentRow, ProfileRow, StudentRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

export type ProfileWithDepartment = ProfileRow & {
  department: DepartmentRow | null;
};

export type ProfileDetail = ProfileWithDepartment & {
  assigned_classes: ClassRow[];
  department_classes: ClassRow[];
};

export type ProfileListFilters = {
  search?: string;
  role?: string;
  departmentId?: string;
  status?: string;
  staffOnly?: boolean;
};

export async function getDepartmentsForProfiles(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Bölümler alınamadı.");
  }

  return data;
}

export async function getProfilesForCurrentProfile(profile: ProfileRow, filters: ProfileListFilters = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("*").order("full_name", { ascending: true });

  if (filters.staffOnly) {
    query = query.in("role", staffProfileRoles);
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("role", "hoca").eq("department_id", profile.department_id ?? "");
  }

  if (filters.role) {
    query = query.eq("role", filters.role as UserRole);
  }

  if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  }

  if (filters.status === "passive") {
    query = query.eq("is_active", false);
  }

  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const [{ data: profiles, error }, departments] = await Promise.all([query, getDepartmentsForProfiles(profile)]);

  if (error) {
    throw new Error("Profil listesi alınamadı.");
  }

  const departmentMap = new Map(departments.map((department) => [department.id, department]));

  return {
    profiles: (profiles ?? []).map((profileRow) => attachDepartment(profileRow, departmentMap)),
    departments,
  };
}

export async function getProfileById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Profil bilgisi alınamadı.");
  }

  if (!profile) {
    return null;
  }

  const [{ data: department }, { data: assignedClasses }, { data: departmentClasses }] = await Promise.all([
    profile.department_id
      ? supabase.from("departments").select("*").eq("id", profile.department_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("classes").select("*").eq("class_teacher_id", profile.id).order("name", { ascending: true }),
    profile.department_id
      ? supabase.from("classes").select("*").eq("department_id", profile.department_id).order("name", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  return {
    ...profile,
    department: department ?? null,
    assigned_classes: assignedClasses ?? [],
    department_classes: departmentClasses ?? [],
  };
}

export async function getAssignedClassCount(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("class_teacher_id", profileId);

  if (error) {
    throw new Error("Sınıf atama bilgisi alınamadı.");
  }

  return count ?? 0;
}

export async function getParentLinkedStudents(profileId: string): Promise<StudentRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: links, error } = await supabase.from("parent_student_links").select("student_id").eq("parent_profile_id", profileId);

  if (error || !links || links.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("students")
    .select("*")
    .in(
      "id",
      links.map((link) => link.student_id),
    )
    .order("full_name", { ascending: true });

  return data ?? [];
}

function attachDepartment(profile: ProfileRow, departmentMap: Map<string, DepartmentRow>): ProfileWithDepartment {
  return {
    ...profile,
    department: profile.department_id ? departmentMap.get(profile.department_id) ?? null : null,
  };
}
