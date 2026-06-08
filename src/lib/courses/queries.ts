import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canViewDepartmentGrades } from "@/lib/grades/permissions";
import type { CourseRow, DepartmentRow, ExamTypeRow, ProfileRow } from "@/types/database";

export type CourseWithRelations = CourseRow & {
  department: DepartmentRow | null;
  exam_types: ExamTypeRow[];
};

export type CourseFilters = {
  search?: string;
  departmentId?: string;
  status?: string;
};

export async function getCourseDepartments(profile: ProfileRow) {
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

export async function getCoursesForProfile(profile: ProfileRow, filters: CourseFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const departments = await getCourseDepartments(profile);
  const departmentIds = departments.map((department) => department.id);

  if (departmentIds.length === 0) {
    return { courses: [], departments };
  }

  let query = supabase.from("courses").select("*").in("department_id", departmentIds).order("name", { ascending: true });

  if (filters.departmentId && canViewDepartmentGrades(profile, filters.departmentId)) {
    query = query.eq("department_id", filters.departmentId);
  }

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  }

  if (filters.status === "passive") {
    query = query.eq("is_active", false);
  }

  if (filters.search) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  const [{ data: courses, error }, { data: examTypes }] = await Promise.all([
    query,
    supabase.from("exam_types").select("*").order("name", { ascending: true }),
  ]);

  if (error) {
    throw new Error("Dersler alınamadı.");
  }

  const departmentMap = new Map(departments.map((department) => [department.id, department]));

  return {
    courses: (courses ?? []).map((course) => ({
      ...course,
      department: departmentMap.get(course.department_id) ?? null,
      exam_types: (examTypes ?? []).filter((examType) => examType.course_id === course.id),
    })),
    departments,
  };
}

export async function getCourseById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Ders bilgisi alınamadı.");
  }

  return data;
}

export async function getActiveCoursesByDepartment(departmentId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: courses, error }, { data: examTypes }] = await Promise.all([
    supabase.from("courses").select("*").eq("department_id", departmentId).eq("is_active", true).order("name", { ascending: true }),
    supabase.from("exam_types").select("*").eq("is_active", true).order("name", { ascending: true }),
  ]);

  if (error) {
    throw new Error("Aktif dersler alınamadı.");
  }

  return (courses ?? []).map((course) => ({
    ...course,
    exam_types: (examTypes ?? []).filter((examType) => examType.course_id === course.id),
  }));
}
