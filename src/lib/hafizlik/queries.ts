import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DepartmentRow, HafizlikProgressRow, ProfileRow } from "@/types/database";

type ScopedDepartment = Pick<DepartmentRow, "id" | "name" | "slug">;

type HafizlikStudentBase = {
  id: string;
  full_name: string;
  course_class: {
    id: string;
    name: string;
    department_id: string;
    class_teacher_id: string | null;
  } | null;
};

export type HafizlikScopedStudent = HafizlikStudentBase & {
  departmentName: string | null;
  progress: HafizlikProgressRow | null;
  teacherName: string | null;
  percentage: number;
};

export type HafizlikDepartmentScope = {
  departments: ScopedDepartment[];
  selectedDepartment: ScopedDepartment | null;
  canSelectDepartment: boolean;
};

export async function getHafizlikDepartmentScope(
  profile: Pick<ProfileRow, "role" | "department_id">,
  requestedDepartmentId?: string | null,
): Promise<HafizlikDepartmentScope> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("departments")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const canSelectDepartment = profile.role === "admin" || profile.role === "genel_mudur";

  if (!canSelectDepartment) {
    query = query.eq("id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Bölüm bilgileri alınamadı.");
  }

  const departments = data ?? [];

  if (departments.length === 0) {
    return { departments: [], selectedDepartment: null, canSelectDepartment };
  }

  const selectedDepartment =
    (requestedDepartmentId ? departments.find((department) => department.id === requestedDepartmentId) : null) ??
    departments[0] ??
    null;

  return { departments, selectedDepartment, canSelectDepartment };
}

export async function getHafizlikStudentsByDepartment(
  departmentId: string,
  options: { onlyWithProgress?: boolean } = {},
): Promise<HafizlikScopedStudent[]> {
  const supabase = await createSupabaseServerClient();
  const { data: allStudents, error: studentsError } = await supabase
    .from("students")
    .select(`
      id,
      full_name,
      course_class:classes!inner(id, name, department_id, class_teacher_id)
    `)
    .eq("status", "active");

  if (studentsError) {
    throw new Error("Öğrenciler alınamadı.");
  }

  const students = ((allStudents ?? []) as HafizlikStudentBase[]).filter(
    (student) => student.course_class?.department_id === departmentId,
  );

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((student) => student.id);
  const classTeacherIds = students.map((student) => student.course_class?.class_teacher_id).filter(Boolean) as string[];

  const [{ data: progressRows, error: progressError }, { data: teachers, error: teachersError }, { data: department }] =
    await Promise.all([
      supabase.from("hafizlik_progress").select("*").in("student_id", studentIds),
      classTeacherIds.length > 0
        ? supabase.from("profiles").select("id, full_name").in("id", classTeacherIds)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("departments").select("name").eq("id", departmentId).maybeSingle(),
    ]);

  if (progressError) {
    throw new Error("Hafızlık kayıtları alınamadı.");
  }

  if (teachersError) {
    throw new Error("Hoca bilgileri alınamadı.");
  }

  const teacherMap = new Map((teachers ?? []).map((teacher) => [teacher.id, teacher.full_name]));
  const progressMap = new Map((progressRows ?? []).map((progress) => [progress.student_id, progress]));

  return students
    .map((student) => {
      const progress = progressMap.get(student.id) ?? null;
      const percentage = progress
        ? Math.round((((progress.current_juz - 1) * 604) + progress.current_page) / 604 * 100)
        : 0;

      return {
        ...student,
        departmentName: department?.name ?? null,
        progress,
        teacherName: teacherMap.get(student.course_class?.class_teacher_id ?? "") ?? null,
        percentage,
      };
    })
    .filter((student) => (options.onlyWithProgress ? Boolean(student.progress) : true));
}
