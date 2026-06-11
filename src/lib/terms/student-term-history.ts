import type { AcademicTermStatus, JsonValue } from "@/types/database";
import type { StudentTermSnapshotWithRelations } from "@/lib/terms/queries";

export type StudentTermHistoryItem = {
  id: string;
  termId: string;
  termName: string;
  termStatus: AcademicTermStatus;
  departmentName: string;
  className: string;
  studentName: string;
  studentStatus: string;
  snapshotDate: string;
  gradeAverage: number | null;
  gradeCount: number;
  evaluationCount: number;
  infirmaryCount: number;
  evaluationSummary: EvaluationSummary;
  attendanceSummary: AttendanceSummary;
  infirmarySummary: InfirmarySummary;
};

export type StudentTermHistoryComparison = {
  previous: StudentTermHistoryItem;
  latest: StudentTermHistoryItem;
};

export type EvaluationSummary = {
  behaviorScore: number | null;
  attendanceScore: number | null;
  lessonPerformanceScore: number | null;
  disciplineScore: number | null;
  memorizationScore: number | null;
  generalOpinion: string | null;
};

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
};

export type InfirmarySummary = {
  total: number;
  sentToHospital: number;
  parentInformed: number;
};

export function buildStudentTermHistoryView(snapshots: StudentTermSnapshotWithRelations[]) {
  const items = snapshots.map(toHistoryItem);
  const chronologicalItems = [...items].sort((first, second) => new Date(first.snapshotDate).getTime() - new Date(second.snapshotDate).getTime());

  return {
    items,
    comparison:
      chronologicalItems.length > 1
        ? {
            previous: chronologicalItems[chronologicalItems.length - 2],
            latest: chronologicalItems[chronologicalItems.length - 1],
          }
        : null,
  };
}

function toHistoryItem(snapshot: StudentTermSnapshotWithRelations): StudentTermHistoryItem {
  const data = asObject(snapshot.snapshot_data);
  const student = asObject(data?.student);

  return {
    id: snapshot.id,
    termId: snapshot.term_id,
    termName: snapshot.term?.name ?? stringValue(asObject(data?.term)?.name, "Dönem"),
    termStatus: snapshot.term?.status ?? "closed",
    departmentName: snapshot.department?.name ?? stringValue(asObject(data?.department)?.name, "-"),
    className: snapshot.classRow?.name ?? stringValue(asObject(data?.class)?.name, "-"),
    studentName: stringValue(student?.full_name, "-"),
    studentStatus: snapshot.student_status ?? stringValue(student?.status, "-"),
    snapshotDate: snapshot.created_at,
    gradeAverage: snapshot.grade_average,
    gradeCount: snapshot.total_grades,
    evaluationCount: snapshot.total_evaluations,
    infirmaryCount: snapshot.total_infirmary_records,
    evaluationSummary: normalizeEvaluationSummary(snapshot.evaluation_summary),
    attendanceSummary: normalizeAttendanceSummary(snapshot.attendance_summary ?? data?.attendance_summary),
    infirmarySummary: normalizeInfirmarySummary(snapshot.infirmary_summary ?? data?.infirmary_summary, snapshot.total_infirmary_records),
  };
}

export function normalizeEvaluationSummary(value: JsonValue | undefined): EvaluationSummary {
  const summary = asObject(value);

  return {
    behaviorScore: numberOrNull(summary?.behavior_score),
    attendanceScore: numberOrNull(summary?.attendance_score),
    lessonPerformanceScore: numberOrNull(summary?.lesson_performance_score),
    disciplineScore: numberOrNull(summary?.discipline_score),
    memorizationScore: numberOrNull(summary?.memorization_score),
    generalOpinion: stringOrNull(summary?.general_opinion),
  };
}

export function normalizeAttendanceSummary(value: JsonValue | undefined): AttendanceSummary {
  const summary = asObject(value);

  return {
    total: numberOrZero(summary?.total),
    present: numberOrZero(summary?.present),
    absent: numberOrZero(summary?.absent),
    excused: numberOrZero(summary?.excused),
    late: numberOrZero(summary?.late),
  };
}

export function normalizeInfirmarySummary(value: JsonValue | undefined, fallbackTotal = 0): InfirmarySummary {
  const summary = asObject(value);

  return {
    total: numberOrZero(summary?.total, fallbackTotal),
    sentToHospital: numberOrZero(summary?.sent_to_hospital),
    parentInformed: numberOrZero(summary?.parent_informed),
  };
}

function asObject(value: JsonValue | undefined): Record<string, JsonValue> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value;
}

function numberOrNull(value: JsonValue | undefined) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function numberOrZero(value: JsonValue | undefined, fallback = 0) {
  return numberOrNull(value) ?? fallback;
}

function stringOrNull(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value : null;
}

function stringValue(value: JsonValue | undefined, fallback: string) {
  return stringOrNull(value) ?? fallback;
}
