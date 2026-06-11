import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canViewDepartment } from "@/lib/classes/permissions";
import type { DepartmentRow, ProfileRow } from "@/types/database";

export type DepartmentSummary = DepartmentRow & {
  active_class_count: number;
  active_student_count: number;
  teacher_count: number;
  department_manager: ProfileRow | null;
};

export async function getDepartmentSummaries(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("departments").select("*").order("name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Bölümler alınamadı.");
  }

  const departments = data ?? [];
  const departmentIds = departments.map((department) => department.id);

  if (departmentIds.length === 0) {
    return [];
  }

  const [{ data: classes }, { data: students }, { data: profiles }] = await Promise.all([
    supabase.from("classes").select("*").in("department_id", departmentIds),
    supabase.from("students").select("*").eq("status", "active"),
    supabase.from("profiles").select("*").in("department_id", departmentIds).eq("is_active", true),
  ]);

  return departments.map((department) => {
    const departmentClasses = (classes ?? []).filter((classRow) => classRow.department_id === department.id);
    const departmentClassIds = new Set(departmentClasses.map((classRow) => classRow.id));
    const departmentProfiles = (profiles ?? []).filter((profileRow) => profileRow.department_id === department.id);

    return {
      ...department,
      active_class_count: departmentClasses.filter((classRow) => classRow.is_active).length,
      active_student_count: (students ?? []).filter((student) => student.course_class_id && departmentClassIds.has(student.course_class_id)).length,
      teacher_count: departmentProfiles.filter((profileRow) => profileRow.role === "hoca").length,
      department_manager: departmentProfiles.find((profileRow) => profileRow.role === "bolum_muduru") ?? null,
    };
  });
}

export async function getDepartmentSummaryById(profile: ProfileRow, id: string) {
  const departments = await getDepartmentSummaries(profile);
  return departments.find((department) => department.id === id) ?? null;
}

export const getDepartmentById = cache(async (id: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("departments").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Bölüm bilgisi alınamadı.");
  }

  return data ?? null;
});

export async function canProfileViewDepartment(profile: ProfileRow, departmentId: string) {
  return canViewDepartment(profile, departmentId);
}
