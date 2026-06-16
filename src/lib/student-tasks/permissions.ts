import type { ProfileRow, StudentTaskRow } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export function canViewStudentTasks(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canCreateStudentTask(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canDeleteStudentTask(profile: ProfileRow, task?: StudentTaskRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (task && task.assigned_by === profile.id) return true;
  return false;
}

export async function canManageStudentTask(
  supabase: SupabaseClient,
  profile: ProfileRow,
  studentId: string,
): Promise<{ error?: { message: string } }> {
  if (["admin", "genel_mudur"].includes(profile.role)) {
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

  if (profile.role === "bolum_muduru") {
    if (profile.department_id !== classData.department_id) {
      return { error: { message: "Bu öğrenciyi yönetme yetkiniz yok." } };
    }
    return {};
  }

  if (profile.role === "hoca") {
    if (classData.class_teacher_id !== profile.id) {
      return { error: { message: "Bu öğrenciyi yönetme yetkiniz yok." } };
    }
    return {};
  }

  return { error: { message: "Bu işlem için yetkiniz yok." } };
}

export async function canViewStudentTaskForStudent(
  supabase: SupabaseClient,
  profile: ProfileRow,
  studentId: string,
): Promise<boolean> {
  if (["admin", "genel_mudur"].includes(profile.role)) {
    return true;
  }

  const { data: student } = await supabase
    .from("students")
    .select("course_class_id")
    .eq("id", studentId)
    .single();

  if (!student?.course_class_id) {
    return false;
  }

  const { data: classData } = await supabase
    .from("classes")
    .select("department_id, class_teacher_id")
    .eq("id", student.course_class_id)
    .single();

  if (!classData) {
    return false;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === classData.department_id;
  }

  if (profile.role === "hoca") {
    return classData.class_teacher_id === profile.id;
  }

  return false;
}