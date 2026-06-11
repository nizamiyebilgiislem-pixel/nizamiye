import test from "node:test";
import assert from "node:assert/strict";

import {
  buildStudentTermHistoryView,
  normalizeAttendanceSummary,
  normalizeEvaluationSummary,
  normalizeInfirmarySummary,
} from "../src/lib/terms/student-term-history.ts";

function snapshot(overrides) {
  return {
    id: overrides.id,
    student_id: "student-1",
    term_id: overrides.term.id,
    department_id: "department-1",
    class_id: "class-1",
    student_status: "active",
    grade_average: overrides.grade_average,
    evaluation_summary: overrides.evaluation_summary ?? null,
    attendance_summary: overrides.attendance_summary ?? null,
    infirmary_summary: overrides.infirmary_summary ?? null,
    total_grades: overrides.total_grades ?? 0,
    total_evaluations: overrides.total_evaluations ?? 0,
    total_infirmary_records: overrides.total_infirmary_records ?? 0,
    snapshot_data: {
      student: { full_name: "Ali Veli", status: "active" },
    },
    created_at: overrides.created_at,
    created_by: null,
    term: overrides.term,
    department: { id: "department-1", name: "Hafızlık" },
    classRow: { id: "class-1", name: "A Sınıfı" },
  };
}

test("snapshot ozetleri normalize edilir", () => {
  assert.deepEqual(normalizeAttendanceSummary({ total: 10, present: 7, absent: 2, excused: 1, late: 3 }), {
    total: 10,
    present: 7,
    absent: 2,
    excused: 1,
    late: 3,
  });

  assert.deepEqual(normalizeInfirmarySummary({ total: 4, sent_to_hospital: 1, parent_informed: 2 }), {
    total: 4,
    sentToHospital: 1,
    parentInformed: 2,
  });

  assert.deepEqual(normalizeEvaluationSummary({ behavior_score: 90, general_opinion: "İyi" }), {
    behaviorScore: 90,
    attendanceScore: null,
    lessonPerformanceScore: null,
    disciplineScore: null,
    memorizationScore: null,
    generalOpinion: "İyi",
  });
});

test("birden fazla snapshot onceki ve son donem karsilastirmasi uretir", () => {
  const result = buildStudentTermHistoryView([
    snapshot({
      id: "snapshot-2",
      term: { id: "term-2", name: "2027-2028", status: "closed" },
      grade_average: 88,
      attendance_summary: { total: 12, absent: 4 },
      infirmary_summary: { total: 2 },
      created_at: "2028-06-30T10:00:00.000Z",
    }),
    snapshot({
      id: "snapshot-1",
      term: { id: "term-1", name: "2026-2027", status: "closed" },
      grade_average: 85,
      attendance_summary: { total: 20, absent: 12 },
      infirmary_summary: { total: 5 },
      created_at: "2027-06-30T10:00:00.000Z",
    }),
  ]);

  assert.equal(result.items.length, 2);
  assert.equal(result.comparison?.previous.termName, "2026-2027");
  assert.equal(result.comparison?.latest.termName, "2027-2028");
  assert.equal(result.comparison?.previous.gradeAverage, 85);
  assert.equal(result.comparison?.latest.attendanceSummary.absent, 4);
  assert.equal(result.comparison?.latest.infirmarySummary.total, 2);
});
