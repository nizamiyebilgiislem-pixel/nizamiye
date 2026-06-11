import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export type DashboardRole = "admin" | "genel_mudur" | "bolum_muduru" | "guidance" | "class_teacher" | "course_teacher" | "destek_birim_muduru" | "other";

export async function getPrimaryDashboardRole(profile: ProfileRow): Promise<DashboardRole> {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return profile.role;
  }

  if (profile.role === "bolum_muduru") {
    return "bolum_muduru";
  }

  if (profile.role === "rehberlik") {
    return "guidance";
  }

  if (profile.role === "destek_birim_muduru") {
    return "destek_birim_muduru";
  }

  const isClassTeacher = await checkIsClassTeacher(profile.id);
  if (isClassTeacher) {
    return "class_teacher";
  }

  const isCourseTeacher = await checkIsCourseTeacher(profile.id);
  if (isCourseTeacher) {
    return "course_teacher";
  }

  return "other";
}

async function checkIsClassTeacher(profileId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("class_teacher_id", profileId)
    .eq("is_active", true);

  if (error) return false;
  return (count ?? 0) > 0;
}

async function checkIsCourseTeacher(profileId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("class_courses")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", profileId)
    .eq("is_active", true);

  if (error) return false;
  return (count ?? 0) > 0;
}

export function canViewDepartmentDashboard(profile: ProfileRow, departmentId: string): boolean {
  if (profile.role === "admin" || profile.role === "genel_mudur") return true;
  return profile.department_id === departmentId;
}
