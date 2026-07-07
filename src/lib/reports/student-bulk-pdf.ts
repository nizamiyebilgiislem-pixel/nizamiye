import { createSimpleMultiPagePdf, sanitizeArchiveFilename } from "@/lib/archives/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassRow, DepartmentRow, ProfileRow, StudentRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export type StudentReportScope = {
  students: StudentBulkReportRow[];
  classes: ClassRow[];
  departments: DepartmentRow[];
  scopeLabel: string;
};

export type StudentBulkReportRow = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

export async function getStudentBulkReportScope(
  profile: ProfileRow,
  filters: { departmentId?: string | null; classId?: string | null } = {},
): Promise<StudentReportScope> {
  const supabase = await createSupabaseServerClient();
  const [classesResult, departmentsResult] = await Promise.all([
    supabase.from("classes").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true }),
  ]);

  if (classesResult.error || departmentsResult.error) {
    throw new Error("Rapor kapsami alinamadi.");
  }

  const allClasses = classesResult.data ?? [];
  const allDepartments = departmentsResult.data ?? [];
  const visibleClasses = getVisibleClasses(profile, allClasses).filter((classRow) => {
    if (filters.departmentId && classRow.department_id !== filters.departmentId) return false;
    if (filters.classId && classRow.id !== filters.classId) return false;
    return true;
  });

  if (visibleClasses.length === 0) {
    return {
      students: [],
      classes: [],
      departments: [],
      scopeLabel: "Bos kapsam",
    };
  }

  const classIds = visibleClasses.map((classRow) => classRow.id);
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .eq("status", "active")
    .in("course_class_id", classIds)
    .order("full_name", { ascending: true });

  if (studentsError) {
    throw new Error("Talebe raporu icin talebeler alinamadi.");
  }

  const classMap = new Map(visibleClasses.map((classRow) => [classRow.id, classRow]));
  const visibleDepartmentIds = new Set(visibleClasses.map((classRow) => classRow.department_id));
  const visibleDepartments = allDepartments.filter((department) => visibleDepartmentIds.has(department.id));
  const departmentMap = new Map(visibleDepartments.map((department) => [department.id, department]));
  const reportStudents = (students ?? []).map((student) => {
    const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;
    return {
      ...student,
      course_class: courseClass,
      department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
    };
  });

  return {
    students: reportStudents,
    classes: visibleClasses,
    departments: visibleDepartments,
    scopeLabel: buildScopeLabel(profile, filters, visibleClasses, visibleDepartments),
  };
}

export function createStudentBulkReportPdf(scope: StudentReportScope) {
  const pages = scope.students.map((student, index) => ({
    title: `${student.full_name} Talebe Bilgi Formu`,
    lines: [
      `Sira: ${index + 1}`,
      `Bolum: ${student.department?.name ?? "-"}`,
      `Sinif: ${student.course_class?.name ?? "-"}`,
      `Durum: ${student.status}`,
      `Kimlik No: ${student.identity_number ?? "-"}`,
      `Dogum Tarihi: ${student.birth_date ?? "-"}`,
      `Kayit Tarihi: ${student.registration_date ?? "-"}`,
      `Telefon: ${student.guardian_phone ?? student.guardian_phone_2 ?? "-"}`,
      `Baba Adi: ${student.father_name ?? "-"}`,
      `Anne Adi: ${student.mother_name ?? "-"}`,
      `Okul: ${student.school_name ?? "-"}`,
      `Okul Sinifi: ${student.school_class ?? "-"}`,
      `Memleket: ${student.hometown ?? "-"}`,
      `Uyruk: ${student.nationality ?? "-"}`,
      `Adres: ${student.address ?? "-"}`,
    ],
  }));

  return createSimpleMultiPagePdf(pages);
}

export function getStudentBulkReportFileName(scope: StudentReportScope) {
  return `${sanitizeArchiveFilename(`${scope.scopeLabel}-talebe-raporu`)}.pdf`;
}

function getVisibleClasses(profile: ProfileRow, classes: ClassRow[]) {
  if (isGlobalViewRole(profile.role)) {
    return classes;
  }

  if (profile.role === "bolum_muduru") {
    return classes.filter((classRow) => profile.department_id && classRow.department_id === profile.department_id);
  }

  if (profile.role === "hoca") {
    return classes.filter((classRow) => classRow.class_teacher_id === profile.id);
  }

  return [];
}

function buildScopeLabel(
  profile: ProfileRow,
  filters: { departmentId?: string | null; classId?: string | null },
  classes: ClassRow[],
  departments: DepartmentRow[],
) {
  if (filters.classId) {
    return classes.find((classRow) => classRow.id === filters.classId)?.name ?? "sinif";
  }

  if (filters.departmentId || profile.role === "bolum_muduru") {
    const departmentId = filters.departmentId ?? profile.department_id;
    return departments.find((department) => department.id === departmentId)?.name ?? "bolum";
  }

  if (profile.role === "hoca") {
    return classes.length === 1 ? classes[0].name : "siniflarim";
  }

  return "tum-talebeler";
}
