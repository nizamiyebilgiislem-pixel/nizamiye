import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClassesForProfile, getStudentsForProfile } from "@/lib/students/queries";
import { getDepartmentAnalyticsForProfile } from "@/lib/departments/analytics";
import type { ClassRow, DepartmentRow, ProfileRow, StudentRow } from "@/types/database";

export type ReportStudentRow = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
  relation: string | null;
};

export type ReportParentRow = ProfileRow & {
  relation: string | null;
};

export async function getReportStudentsForProfile(profile: ProfileRow) {
  if (profile.role === "veli") {
    return getLinkedStudentsForParent(profile);
  }

  const { students } = await getStudentsForProfile(profile);
  const classes = await getClassesForProfile(profile);
  const departments = await getVisibleDepartmentsForProfile(profile);
  const classMap = new Map(classes.map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map(departments.map((department) => [department.id, department]));

  return students.map((student) => {
    const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;
    return {
      ...student,
      course_class: courseClass,
      department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
      relation: null,
    } satisfies ReportStudentRow;
  });
}

export async function getVisibleDepartmentsForProfile(profile: ProfileRow) {
  const departments = await getDepartmentAnalyticsForProfile(profile);
  return departments.map((department) => ({
    id: department.id,
    name: department.name,
    slug: department.slug,
    description: department.description,
    is_active: department.is_active,
    created_at: department.created_at,
    updated_at: department.updated_at,
  })) as DepartmentRow[];
}

export async function getLinkedStudentsForParent(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  const [linksResult, studentsResult, classesResult, departmentsResult] = await Promise.all([
    supabase.from("parent_student_links").select("*").eq("parent_profile_id", profile.id),
    supabase.from("students").select("*"),
    supabase.from("classes").select("*"),
    supabase.from("departments").select("*"),
  ]);

  if (linksResult.error || studentsResult.error || classesResult.error || departmentsResult.error) {
    throw new Error("Rapor için talebe bağlantıları alınamadı.");
  }

  const linkedStudentIds = new Set((linksResult.data ?? []).map((link) => link.student_id));
  const students = (studentsResult.data ?? []).filter((student) => linkedStudentIds.has(student.id));
  const linksMap = new Map((linksResult.data ?? []).map((link) => [link.student_id, link.relation ?? null]));
  const classMap = new Map((classesResult.data ?? []).map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map((departmentsResult.data ?? []).map((department) => [department.id, department]));

  return students.map((student) => {
    const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

    return {
      ...student,
      course_class: courseClass,
      department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
      relation: linksMap.get(student.id) ?? null,
    } satisfies ReportStudentRow;
  });
}

export async function getStudentReportParents(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [linksResult, parentsResult] = await Promise.all([
    supabase.from("parent_student_links").select("*").eq("student_id", studentId),
    supabase.from("profiles").select("*").eq("role", "veli"),
  ]);

  if (linksResult.error || parentsResult.error) {
    throw new Error("Talebe veli bilgileri alınamadı.");
  }

  const parentMap = new Map((parentsResult.data ?? []).map((parent) => [parent.id, parent]));

  return (linksResult.data ?? [])
    .map((link) => {
      const parent = parentMap.get(link.parent_profile_id);

      if (!parent) {
        return null;
      }

      return {
        ...parent,
        relation: link.relation,
      } satisfies ReportParentRow;
    })
    .filter((parent): parent is ReportParentRow => parent !== null);
}
