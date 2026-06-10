import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canViewDepartment } from "@/lib/classes/permissions";
import type { ClassRow, DepartmentRow, ProfileRow, StudentRow } from "@/types/database";

export type DepartmentSummary = DepartmentRow & {
  active_class_count: number;
  active_student_count: number;
  teacher_count: number;
  department_manager: ProfileRow | null;
};

export type ClassWithRelations = ClassRow & {
  department: DepartmentRow | null;
  class_teacher: ProfileRow | null;
  active_student_count: number;
  students: StudentRow[];
};

export type ClassListFilters = {
  search?: string;
  departmentId?: string;
  status?: string;
};

export async function getDepartmentsForProfile(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("departments").select("*").order("name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Bölümler alınamadı.");
  }

  return data;
}

export async function getDepartmentSummaries(profile: ProfileRow): Promise<DepartmentSummary[]> {
  const supabase = await createSupabaseServerClient();
  const departments = await getDepartmentsForProfile(profile);
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

export async function getTeachersForProfile(profile: ProfileRow, departmentId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("*").eq("role", "hoca").eq("is_active", true).order("full_name", { ascending: true });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  } else if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("department_id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Hoca listesi alınamadı.");
  }

  return data;
}

export async function getClassesForProfile(profile: ProfileRow, filters: ClassListFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const departments = await getDepartmentsForProfile(profile);
  const allowedDepartmentIds = departments.map((department) => department.id);

  if (allowedDepartmentIds.length === 0) {
    return { classes: [], departments, teachers: [] };
  }

  let query = supabase.from("classes").select("*").in("department_id", allowedDepartmentIds).order("name", { ascending: true });

  if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  }

  if (filters.status === "passive") {
    query = query.eq("is_active", false);
  }

  const [{ data: classes, error }, teachers, students] = await Promise.all([
    query,
    getTeachersForProfile(profile),
    getActiveStudents(),
  ]);

  if (error) {
    throw new Error("Sınıflar alınamadı.");
  }

  const departmentMap = new Map(departments.map((department) => [department.id, department]));
  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const studentGroupMap = groupStudentsByClass(students);
  const search = filters.search?.trim().toLocaleLowerCase("tr-TR");

  const rows = (classes ?? [])
    .map((classRow) => attachClassRelations(classRow, departmentMap, teacherMap, students, studentGroupMap))
    .filter((classRow) => {
      if (!search) {
        return true;
      }

      return (
        classRow.name.toLocaleLowerCase("tr-TR").includes(search) ||
        (classRow.class_teacher?.full_name.toLocaleLowerCase("tr-TR").includes(search) ?? false)
      );
    });

  return { classes: rows, departments, teachers };
}

export async function getClassById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: classRow, error } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error("Sınıf bilgisi alınamadı.");
  }

  if (!classRow) {
    return null;
  }

  const [{ data: department }, { data: teacher }, students] = await Promise.all([
    supabase.from("departments").select("*").eq("id", classRow.department_id).maybeSingle(),
    classRow.class_teacher_id
      ? supabase.from("profiles").select("*").eq("id", classRow.class_teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getActiveStudentsByClassId(classRow.id),
  ]);

  return {
    ...classRow,
    department: department ?? null,
    class_teacher: teacher ?? null,
    active_student_count: students.length,
    students,
  };
}

export async function getTeachersByDepartment(departmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "hoca")
    .eq("is_active", true)
    .eq("department_id", departmentId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error("Hoca listesi alınamadı.");
  }

  return data;
}

async function getActiveStudents() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("students").select("*").eq("status", "active");

  if (error) {
    throw new Error("Öğrenci sayıları alınamadı.");
  }

  return data;
}

async function getActiveStudentsByClassId(classId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("status", "active")
    .eq("course_class_id", classId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error("Sınıf öğrencileri alınamadı.");
  }

  return data;
}

function groupStudentsByClass(students: StudentRow[]) {
  const map = new Map<string, StudentRow[]>();
  for (const student of students) {
    if (!student.course_class_id) continue;
    const list = map.get(student.course_class_id) ?? [];
    list.push(student);
    map.set(student.course_class_id, list);
  }
  return map;
}

function attachClassRelations(
  classRow: ClassRow,
  departmentMap: Map<string, DepartmentRow>,
  teacherMap: Map<string, ProfileRow>,
  students: StudentRow[],
  studentGroupMap: Map<string, StudentRow[]>,
): ClassWithRelations {
  const classStudents = studentGroupMap.get(classRow.id) ?? [];
  return {
    ...classRow,
    department: departmentMap.get(classRow.department_id) ?? null,
    class_teacher: classRow.class_teacher_id ? teacherMap.get(classRow.class_teacher_id) ?? null : null,
    active_student_count: classStudents.length,
    students: classStudents,
  };
}

export function assertDepartmentVisible(profile: ProfileRow, departmentId: string) {
  if (!canViewDepartment(profile, departmentId)) {
    throw new Error("Bu bölüm için yetkiniz yok.");
  }
}
