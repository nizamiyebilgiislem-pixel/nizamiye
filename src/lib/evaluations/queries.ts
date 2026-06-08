import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AcademicTermRow, ClassRow, DepartmentRow, ProfileRow, StudentEvaluationRow, StudentRow } from "@/types/database";

export type EvaluationWithRelations = StudentEvaluationRow & {
  term: AcademicTermRow | null;
  created_by_profile: ProfileRow | null;
};

export type EvaluationEntryStudent = StudentRow & {
  course_class: ClassRow | null;
  latest_evaluation: EvaluationWithRelations | null;
};

export async function getEvaluationDashboardSummary(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  const [{ data: evaluations }, { data: activeTerms }, { data: departments }, { data: classes }, { data: students }] = await Promise.all([
    supabase.from("student_evaluations").select("*"),
    supabase.from("academic_terms").select("*").eq("is_active", true),
    supabase.from("departments").select("*").eq("is_active", true),
    supabase.from("classes").select("*"),
    supabase.from("students").select("*").eq("status", "active"),
  ]);
  const visibleDepartments = filterDepartmentsByProfile(departments ?? [], profile);
  const visibleDepartmentIds = new Set(visibleDepartments.map((department) => department.id));
  const visibleClasses = (classes ?? []).filter((classRow) => visibleDepartmentIds.has(classRow.department_id));
  const visibleClassIds = new Set(visibleClasses.map((classRow) => classRow.id));
  const visibleStudents = (students ?? []).filter((student) => student.course_class_id && visibleClassIds.has(student.course_class_id));
  const activeTermIds = new Set((activeTerms ?? []).map((term) => term.id));
  const visibleStudentIds = new Set(visibleStudents.map((student) => student.id));
  const visibleEvaluations = (evaluations ?? []).filter((evaluation) => visibleStudentIds.has(evaluation.student_id));
  const activeTermEvaluatedStudentIds = new Set(
    visibleEvaluations.filter((evaluation) => activeTermIds.has(evaluation.term_id)).map((evaluation) => evaluation.student_id),
  );

  return {
    totalEvaluationCount: visibleEvaluations.length,
    activeTermEvaluationCount: visibleEvaluations.filter((evaluation) => activeTermIds.has(evaluation.term_id)).length,
    missingActiveStudentCount: visibleStudents.filter((student) => !activeTermEvaluatedStudentIds.has(student.id)).length,
    departmentEvaluationCounts: visibleDepartments.map((department) => {
      const departmentClassIds = new Set(visibleClasses.filter((classRow) => classRow.department_id === department.id).map((classRow) => classRow.id));
      const departmentStudentIds = new Set(
        visibleStudents.filter((student) => student.course_class_id && departmentClassIds.has(student.course_class_id)).map((student) => student.id),
      );
      return {
        departmentName: department.name,
        count: visibleEvaluations.filter((evaluation) => departmentStudentIds.has(evaluation.student_id)).length,
      };
    }),
  };
}

export async function getEvaluationEntryList(profile: ProfileRow, filters: { departmentId?: string; classId?: string }) {
  const supabase = await createSupabaseServerClient();
  const [{ data: departments }, { data: classes }, { data: evaluations }, { data: terms }, { data: creators }] = await Promise.all([
    supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("classes").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("student_evaluations").select("*").order("created_at", { ascending: false }),
    supabase.from("academic_terms").select("*"),
    supabase.from("profiles").select("*"),
  ]);
  const visibleDepartments = filterDepartmentsByProfile(departments ?? [], profile);
  const visibleDepartmentIds = new Set(visibleDepartments.map((department) => department.id));
  const visibleClasses = (classes ?? []).filter((classRow) => {
    if (!visibleDepartmentIds.has(classRow.department_id)) return false;
    if (filters.departmentId && classRow.department_id !== filters.departmentId) return false;
    return true;
  });
  const selectedClassId = filters.classId ?? visibleClasses[0]?.id;
  const selectedClass = visibleClasses.find((classRow) => classRow.id === selectedClassId) ?? null;
  const students = selectedClass ? await getActiveStudentsByClassId(selectedClass.id) : [];
  const termMap = new Map((terms ?? []).map((term) => [term.id, term]));
  const creatorMap = new Map((creators ?? []).map((creator) => [creator.id, creator]));

  return {
    departments: visibleDepartments,
    classes: visibleClasses,
    selectedClass,
    students: students.map((student) => ({
      ...student,
      course_class: selectedClass,
      latest_evaluation: attachEvaluationRelations(
        (evaluations ?? []).find((evaluation) => evaluation.student_id === student.id) ?? null,
        termMap,
        creatorMap,
      ),
    })),
  };
}

export async function getEvaluationsByStudent(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: evaluations, error }, { data: terms }, { data: creators }] = await Promise.all([
    supabase.from("student_evaluations").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("academic_terms").select("*"),
    supabase.from("profiles").select("*"),
  ]);
  if (error) throw new Error("Kanaat kayıtları alınamadı.");
  const termMap = new Map((terms ?? []).map((term) => [term.id, term]));
  const creatorMap = new Map((creators ?? []).map((creator) => [creator.id, creator]));
  return (evaluations ?? []).map((evaluation) => attachExistingEvaluationRelations(evaluation, termMap, creatorMap));
}

export async function getEvaluationForStudentAndTerm(studentId: string, termId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_evaluations")
    .select("*")
    .eq("student_id", studentId)
    .eq("term_id", termId)
    .maybeSingle();
  if (error) throw new Error("Kanaat kaydı alınamadı.");
  return data;
}

export async function getEvaluationTerms() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("academic_terms").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Dönemler alınamadı.");
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
  if (error) throw new Error("Öğrenciler alınamadı.");
  return data;
}

function filterDepartmentsByProfile(departments: DepartmentRow[], profile: ProfileRow) {
  if (profile.role === "admin" || profile.role === "genel_mudur") return departments;
  return departments.filter((department) => department.id === profile.department_id);
}

function attachEvaluationRelations(
  evaluation: StudentEvaluationRow | null,
  termMap: Map<string, AcademicTermRow>,
  creatorMap: Map<string, ProfileRow>,
): EvaluationWithRelations | null {
  if (!evaluation) return null;
  return {
    ...evaluation,
    term: termMap.get(evaluation.term_id) ?? null,
    created_by_profile: evaluation.created_by ? creatorMap.get(evaluation.created_by) ?? null : null,
  };
}

function attachExistingEvaluationRelations(
  evaluation: StudentEvaluationRow,
  termMap: Map<string, AcademicTermRow>,
  creatorMap: Map<string, ProfileRow>,
): EvaluationWithRelations {
  return {
    ...evaluation,
    term: termMap.get(evaluation.term_id) ?? null,
    created_by_profile: evaluation.created_by ? creatorMap.get(evaluation.created_by) ?? null : null,
  };
}
