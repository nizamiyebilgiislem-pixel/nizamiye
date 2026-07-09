import type { ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";
import type { SupabaseClient } from "@supabase/supabase-js";

export function canViewHafizlikProgress(profile: ProfileRow) {
  return isGlobalViewRole(profile.role) || ["bolum_muduru", "hoca", "rehberlik"].includes(profile.role);
}

export async function canManageHafizlikProgress(
  supabase: SupabaseClient,
  profile: ProfileRow,
  studentId: string,
): Promise<{ error?: { message: string } }> {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return {};
  }

  if (!["bolum_muduru", "hoca"].includes(profile.role)) {
    return { error: { message: "Bu işlem için yetkiniz yok." } };
  }

  const { data: student } = await supabase
    .from("students")
    .select("course_class_id")
    .eq("id", studentId)
    .single();

  if (!student?.course_class_id) {
    return { error: { message: "Öğrenci bulunamadı." } };
  }

  const { data: classData } = await supabase
    .from("classes")
    .select("department_id, class_teacher_id")
    .eq("id", student.course_class_id)
    .single();

  if (!classData) {
    return { error: { message: "Sınıf bilgisi bulunamadı." } };
  }

  if (profile.department_id !== classData.department_id) {
    return { error: { message: "Bu öğrenciyi düzenleme yetkiniz yok." } };
  }

  if (profile.role === "hoca" && classData.class_teacher_id !== profile.id) {
    const { data: assignedCourse } = await supabase
      .from("class_courses")
      .select("teacher_id")
      .eq("class_id", student.course_class_id)
      .eq("teacher_id", profile.id)
      .maybeSingle();

    if (!assignedCourse) {
      return { error: { message: "Bu öğrenciyi düzenleme yetkiniz yok." } };
    }
  }

  return {};
}
