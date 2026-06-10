import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export function isGuidanceUnrestricted(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik"].includes(profile.role);
}

export function requiresGuidanceScoping(profile: ProfileRow) {
  return profile.role === "bolum_muduru" || profile.role === "hoca";
}

export async function canViewGuidanceForStudent(profile: ProfileRow, student: {
  course_class_id: string | null;
  department_id?: string | null;
}): Promise<boolean> {
  if (isGuidanceUnrestricted(profile)) return true;

  if (profile.role === "bolum_muduru") {
    return student.department_id === profile.department_id;
  }

  if (profile.role === "hoca") {
    if (!student.course_class_id) return false;
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("classes")
      .select("id")
      .eq("id", student.course_class_id)
      .eq("class_teacher_id", profile.id)
      .maybeSingle();
    return data !== null;
  }

  return false;
}

export async function getGuidanceScopedStudentIds(profile: ProfileRow): Promise<string[] | null> {
  if (isGuidanceUnrestricted(profile)) return null;

  const supabase = await createSupabaseServerClient();
  let classIds: string[] = [];

  if (profile.role === "bolum_muduru" && profile.department_id) {
    const { data } = await supabase
      .from("classes")
      .select("id")
      .eq("department_id", profile.department_id);
    classIds = (data ?? []).map((c) => c.id);
  } else if (profile.role === "hoca") {
    const { data } = await supabase
      .from("classes")
      .select("id")
      .eq("class_teacher_id", profile.id);
    classIds = (data ?? []).map((c) => c.id);
  } else {
    return [];
  }

  if (classIds.length === 0) return [];

  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("status", "active")
    .in("course_class_id", classIds);

  return (students ?? []).map((s) => s.id);
}
