import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademicTermRow, ProfileRow, StudentEvaluationRow, StudentRow } from "@/types/database";

type SnapshotStudent = StudentRow & {
  course_class?: { id: string; name: string; department_id: string } | null;
};

type SnapshotResult = {
  snapshotCount: number;
  activeStudentCount: number;
  gradeCount: number;
  evaluationCount: number;
};

export async function buildStudentTermSnapshots(term: AcademicTermRow, profile: ProfileRow): Promise<SnapshotResult> {
  const admin = createSupabaseAdminClient();
  const snapshotEndDate = term.closed_at ?? term.end_date ?? new Date().toISOString();
  const startDate = term.start_date ?? null;

  const [studentsResult, classesResult, departmentsResult, gradesResult, evaluationsResult, infirmaryResult] = await Promise.all([
    admin.from("students").select("*").eq("status", "active").order("full_name", { ascending: true }),
    admin.from("classes").select("id,name,department_id"),
    admin.from("departments").select("id,name"),
    admin.from("grades").select("*").eq("term_id", term.id),
    admin.from("student_evaluations").select("*").eq("term_id", term.id),
    startDate
      ? admin
          .from("infirmary_records")
          .select("*")
          .gte("record_date", startDate)
          .lte("record_date", snapshotEndDate.slice(0, 10))
      : admin.from("infirmary_records").select("*").lte("record_date", snapshotEndDate.slice(0, 10)),
  ]);

  if (studentsResult.error || classesResult.error || departmentsResult.error || gradesResult.error || evaluationsResult.error || infirmaryResult.error) {
    throw new Error("Dönem snapshot verileri alınamadı.");
  }

  const activeStudents = (studentsResult.data ?? []) as SnapshotStudent[];
  const classMap = new Map((classesResult.data ?? []).map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map((departmentsResult.data ?? []).map((department) => [department.id, department]));
  const gradesByStudent = groupBy((gradesResult.data ?? []) as Array<Record<string, unknown> & { student_id: string }>, (grade) => grade.student_id);
  const evaluationsByStudent = new Map<string, StudentEvaluationRow>(
    (evaluationsResult.data ?? []).map((evaluation) => [evaluation.student_id, evaluation as StudentEvaluationRow]),
  );
  const infirmaryByStudent = groupBy((infirmaryResult.data ?? []) as Array<Record<string, unknown> & { student_id: string }>, (record) => record.student_id);

  const snapshots = activeStudents.map((student) => {
    const courseClass = student.course_class_id ? (classMap.get(student.course_class_id) as { id: string; name: string; department_id: string } | undefined) ?? null : null;
    const department = courseClass ? (departmentMap.get(courseClass.department_id) as { id: string; name: string } | undefined) ?? null : null;
    const studentGrades = gradesByStudent.get(student.id) ?? [];
    const studentEvaluation = evaluationsByStudent.get(student.id) ?? null;
    const studentInfirmary = infirmaryByStudent.get(student.id) ?? [];
    const gradeAverage = calculateAverage(studentGrades.map((grade) => Number(grade.grade)).filter((value) => Number.isFinite(value)));

    return {
      student_id: student.id,
      term_id: term.id,
      department_id: courseClass?.department_id ?? null,
      class_id: courseClass?.id ?? null,
      student_status: student.status,
      grade_average: gradeAverage,
      evaluation_summary: studentEvaluation
        ? {
            behavior_score: studentEvaluation.behavior_score,
            attendance_score: studentEvaluation.attendance_score,
            lesson_performance_score: studentEvaluation.lesson_performance_score,
            discipline_score: studentEvaluation.discipline_score,
            memorization_score: studentEvaluation.memorization_score,
            general_opinion: studentEvaluation.general_opinion,
          }
        : null,
      total_grades: studentGrades.length,
      total_evaluations: studentEvaluation ? 1 : 0,
      total_infirmary_records: studentInfirmary.length,
      snapshot_data: {
        term: {
          id: term.id,
          name: term.name,
          status: term.status,
          is_current: term.is_current,
        },
        student: {
          id: student.id,
          full_name: student.full_name,
          status: student.status,
        },
        class: courseClass,
        department,
        grades: studentGrades,
        evaluation: studentEvaluation,
        infirmary_records: studentInfirmary,
        totals: {
          grades: studentGrades.length,
          evaluations: studentEvaluation ? 1 : 0,
          infirmary_records: studentInfirmary.length,
        },
      },
      created_by: profile.id,
    };
  });

  if (snapshots.length > 0) {
    const { error } = await admin.from("student_term_snapshots").upsert(snapshots, { onConflict: "student_id,term_id" });

    if (error) {
      throw new Error("Dönem snapshotları kaydedilemedi.");
    }
  }

  return {
    snapshotCount: snapshots.length,
    activeStudentCount: activeStudents.length,
    gradeCount: (gradesResult.data ?? []).length,
    evaluationCount: (evaluationsResult.data ?? []).length,
  };
}

function groupBy<T extends Record<string, unknown>>(items: T[], keyGetter: (item: T) => string) {
  const map = new Map<string, T[]>();

  items.forEach((item) => {
    const key = keyGetter(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  });

  return map;
}

function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 100) / 100;
}

export async function getTermClosurePreview(term: AcademicTermRow) {
  const admin = createSupabaseAdminClient();
  const snapshotEndDate = term.closed_at ?? term.end_date ?? new Date().toISOString();
  const startDate = term.start_date ?? null;

  const [studentsResult, gradesResult, evaluationsResult, infirmaryResult] = await Promise.all([
    admin.from("students").select("id").eq("status", "active"),
    admin.from("grades").select("id").eq("term_id", term.id),
    admin.from("student_evaluations").select("id").eq("term_id", term.id),
    startDate
      ? admin
          .from("infirmary_records")
          .select("id")
          .gte("record_date", startDate)
          .lte("record_date", snapshotEndDate.slice(0, 10))
      : admin.from("infirmary_records").select("id").lte("record_date", snapshotEndDate.slice(0, 10)),
  ]);

  if (studentsResult.error || gradesResult.error || evaluationsResult.error || infirmaryResult.error) {
    throw new Error("Dönem özet verileri alınamadı.");
  }

  return {
    activeStudentCount: studentsResult.data?.length ?? 0,
    gradeCount: gradesResult.data?.length ?? 0,
    evaluationCount: evaluationsResult.data?.length ?? 0,
    infirmaryCount: infirmaryResult.data?.length ?? 0,
  };
}
