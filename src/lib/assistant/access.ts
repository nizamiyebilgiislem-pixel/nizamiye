import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ClassRow, ProfileRow, StudentRow } from "@/types/database";

export function canUseAssistant(profile: ProfileRow) {
  return [
    "admin",
    "genel_mudur",
    "bolum_muduru",
    "hoca",
    "rehberlik",
    "kutuphane_gorevlisi",
    "destek_birim_muduru",
    "muhasebe",
  ].includes(profile.role);
}

export function canViewAllAssistantData(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur";
}

export async function getAssistantVisibleClasses(profile: ProfileRow): Promise<ClassRow[]> {
  const supabase = createSupabaseAdminClient();
  const query = supabase.from("classes").select("*").eq("is_active", true).order("name", { ascending: true });

  if (canViewAllAssistantData(profile)) {
    const { data } = await query;
    return data ?? [];
  }

  if (profile.role === "bolum_muduru" || profile.role === "rehberlik" || profile.role === "destek_birim_muduru") {
    if (!profile.department_id) return [];
    const { data } = await query.eq("department_id", profile.department_id);
    return data ?? [];
  }

  if (profile.role === "hoca") {
    const { data: classCourses } = await supabase
      .from("class_courses")
      .select("class_id")
      .eq("teacher_id", profile.id)
      .eq("is_active", true);
    const classIds = [...new Set((classCourses ?? []).map((row) => row.class_id))];

    const filters = [`class_teacher_id.eq.${profile.id}`];
    if (classIds.length > 0) {
      filters.push(`id.in.(${classIds.join(",")})`);
    }

    const { data } = await query.or(filters.join(","));
    return data ?? [];
  }

  return [];
}

export async function getAssistantVisibleClassIds(profile: ProfileRow): Promise<string[] | null> {
  if (canViewAllAssistantData(profile)) return null;
  const classes = await getAssistantVisibleClasses(profile);
  return classes.map((courseClass) => courseClass.id);
}

export async function getAssistantVisibleStudents(profile: ProfileRow): Promise<StudentRow[]> {
  const supabase = createSupabaseAdminClient();
  const query = supabase.from("students").select("*").eq("status", "active").order("full_name", { ascending: true });
  const classIds = await getAssistantVisibleClassIds(profile);

  if (classIds === null) {
    const { data } = await query;
    return data ?? [];
  }

  if (classIds.length === 0) return [];
  const { data } = await query.in("course_class_id", classIds);
  return data ?? [];
}

export async function canViewAssistantStudent(profile: ProfileRow, student: Pick<StudentRow, "course_class_id">) {
  if (canViewAllAssistantData(profile)) return true;
  if (!student.course_class_id) return false;
  const classIds = await getAssistantVisibleClassIds(profile);
  return classIds?.includes(student.course_class_id) ?? false;
}

export async function applyAssistantClassScope<T extends { in: (column: string, values: string[]) => T }>(
  profile: ProfileRow,
  query: T,
) {
  const classIds = await getAssistantVisibleClassIds(profile);
  if (classIds === null) return query;
  if (classIds.length === 0) return null;
  return query.in("class_id", classIds);
}
