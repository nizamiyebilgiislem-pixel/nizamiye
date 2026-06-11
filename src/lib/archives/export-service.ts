import { createSimplePdf, sanitizeArchiveFilename, toCsv } from "@/lib/archives/format";
import { buildStudentTermHistoryView } from "@/lib/terms/student-term-history";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AcademicTermRow, ArchiveExportType, ClassRow, DepartmentRow, StudentRow, StudentTermSnapshotRow } from "@/types/database";
import type { StudentTermSnapshotWithRelations } from "@/lib/terms/queries";

export type ArchiveExportPayload = {
  bytes: Buffer;
  fileName: string;
  contentType: string;
  termId: string | null;
  scopeType: string;
  scopeId: string;
  metadata: Record<string, string | number | null>;
};

export async function generateArchiveExportPayload(exportType: ArchiveExportType, scopeId: string, termId?: string | null): Promise<ArchiveExportPayload> {
  if (exportType === "student_pdf") {
    return generateStudentPdf(scopeId);
  }

  if (!termId) {
    throw new Error("CSV export için dönem seçilmelidir.");
  }

  if (exportType === "term_csv") {
    return generateSnapshotCsv({ exportType, termId });
  }

  if (exportType === "department_csv") {
    return generateSnapshotCsv({ exportType, termId, departmentId: scopeId });
  }

  return generateSnapshotCsv({ exportType, termId, classId: scopeId });
}

async function generateStudentPdf(studentId: string): Promise<ArchiveExportPayload> {
  const admin = createSupabaseAdminClient();
  const [{ data: student, error: studentError }, snapshots] = await Promise.all([
    admin.from("students").select("*").eq("id", studentId).maybeSingle(),
    getSnapshotsWithRelations({ studentId }),
  ]);

  if (studentError || !student) {
    throw new Error("Öğrenci bulunamadı.");
  }

  const { items } = buildStudentTermHistoryView(snapshots);
  const lines = [
    `Ogrenci: ${student.full_name}`,
    `TC Kimlik: ${student.identity_number ?? "-"}`,
    `Durum: ${student.status}`,
    `Dogum Tarihi: ${student.birth_date ?? "-"}`,
    `Kayit Tarihi: ${student.registration_date ?? "-"}`,
    "",
    "Donem Gecmisi",
    ...items.flatMap((item) => [
      `${item.termName} (${item.termStatus})`,
      `Bolum/Sinif: ${item.departmentName} / ${item.className}`,
      `Ortalama: ${item.gradeAverage ?? "-"}`,
      `Not/Kanaat/Revir: ${item.gradeCount} / ${item.evaluationCount} / ${item.infirmaryCount}`,
      `Yoklama: ${item.attendanceSummary.total} toplam, ${item.attendanceSummary.absent} devamsiz, ${item.attendanceSummary.late} gec`,
      `Kanaat: ${item.evaluationSummary.generalOpinion ?? "-"}`,
      "",
    ]),
  ];

  const baseName = sanitizeArchiveFilename(`${student.full_name}-ogrenci-arsivi`);

  return {
    bytes: createSimplePdf(`${student.full_name} Ogrenci Arsivi`, lines),
    fileName: `${baseName}.pdf`,
    contentType: "application/pdf",
    termId: null,
    scopeType: "student",
    scopeId: student.id,
    metadata: {
      student_id: student.id,
      snapshot_count: items.length,
    },
  };
}

async function generateSnapshotCsv(input: { exportType: ArchiveExportType; termId: string; departmentId?: string; classId?: string }): Promise<ArchiveExportPayload> {
  const [term, snapshots] = await Promise.all([getClosedTerm(input.termId), getSnapshotsWithRelations(input)]);

  if (snapshots.length === 0) {
    throw new Error("Seçilen kapsam için snapshot bulunamadı.");
  }

  const rows = snapshots.map((snapshot) => {
    const attendance = asRecord(snapshot.attendance_summary);
    const evaluation = asRecord(snapshot.evaluation_summary);
    const infirmary = asRecord(snapshot.infirmary_summary);

    return {
      "Öğrenci": snapshot.student?.full_name ?? "-",
      "Dönem": snapshot.term?.name ?? term.name,
      "Bölüm": snapshot.department?.name ?? "-",
      "Sınıf": snapshot.classRow?.name ?? "-",
      "Ortalama": snapshot.grade_average ?? "",
      "Not Sayısı": snapshot.total_grades,
      "Kanaat Sayısı": snapshot.total_evaluations,
      "Yoklama Toplam": numberValue(attendance.total),
      "Devamsızlık": numberValue(attendance.absent),
      "İzinli": numberValue(attendance.excused),
      "Geç": numberValue(attendance.late),
      "Kanaat Özeti": textValue(evaluation.general_opinion),
      "Revir Kaydı": snapshot.total_infirmary_records,
      "Hastane Sevki": numberValue(infirmary.sent_to_hospital),
      "Snapshot Tarihi": snapshot.created_at,
    };
  });

  const label = await getCsvScopeLabel(input);
  const baseName = sanitizeArchiveFilename(`${term.name}-${label}`);

  return {
    bytes: Buffer.from(toCsv(rows), "utf8"),
    fileName: `${baseName}.csv`,
    contentType: "text/csv; charset=utf-8",
    termId: term.id,
    scopeType: input.exportType === "term_csv" ? "term" : input.exportType === "department_csv" ? "department" : "class",
    scopeId: input.exportType === "term_csv" ? term.id : input.departmentId ?? input.classId ?? term.id,
    metadata: {
      term_id: term.id,
      row_count: rows.length,
    },
  };
}

async function getClosedTerm(termId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("academic_terms").select("*").eq("id", termId).maybeSingle();
  if (error || !data) throw new Error("Dönem bulunamadı.");
  if (data.status !== "closed" && data.status !== "archived") throw new Error("Yalnızca kapalı dönemler export edilebilir.");
  return data as AcademicTermRow;
}

async function getSnapshotsWithRelations(filters: { studentId?: string; termId?: string; departmentId?: string; classId?: string }) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("student_term_snapshots").select("*").order("created_at", { ascending: false });

  if (filters.studentId) query = query.eq("student_id", filters.studentId);
  if (filters.termId) query = query.eq("term_id", filters.termId);
  if (filters.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters.classId) query = query.eq("class_id", filters.classId);

  const { data, error } = await query;
  if (error) throw new Error("Snapshot verileri alınamadı.");

  const snapshots = (data ?? []) as StudentTermSnapshotRow[];
  if (snapshots.length === 0) return [] as Array<StudentTermSnapshotWithRelations & { student: Pick<StudentRow, "id" | "full_name"> | null }>;

  const termIds = uniqueValues(snapshots.map((snapshot) => snapshot.term_id));
  const studentIds = uniqueValues(snapshots.map((snapshot) => snapshot.student_id));
  const departmentIds = uniqueValues(snapshots.map((snapshot) => snapshot.department_id));
  const classIds = uniqueValues(snapshots.map((snapshot) => snapshot.class_id));

  const [termsResult, studentsResult, departmentsResult, classesResult] = await Promise.all([
    admin.from("academic_terms").select("*").in("id", termIds),
    admin.from("students").select("id,full_name").in("id", studentIds),
    departmentIds.length > 0 ? admin.from("departments").select("id,name").in("id", departmentIds) : Promise.resolve({ data: [], error: null }),
    classIds.length > 0 ? admin.from("classes").select("id,name,department_id").in("id", classIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (termsResult.error || studentsResult.error || departmentsResult.error || classesResult.error) {
    throw new Error("Snapshot ilişki verileri alınamadı.");
  }

  const termMap = new Map((termsResult.data ?? []).map((term) => [term.id, term]));
  const studentMap = new Map((studentsResult.data ?? []).map((student) => [student.id, student]));
  const departmentMap = new Map((departmentsResult.data ?? []).map((department) => [department.id, department]));
  const classMap = new Map((classesResult.data ?? []).map((classRow) => [classRow.id, classRow]));

  return snapshots.map((snapshot) => ({
    ...snapshot,
    term: termMap.get(snapshot.term_id) ?? null,
    student: studentMap.get(snapshot.student_id) ?? null,
    department: snapshot.department_id ? (departmentMap.get(snapshot.department_id) as Pick<DepartmentRow, "id" | "name"> | undefined) ?? null : null,
    classRow: snapshot.class_id ? (classMap.get(snapshot.class_id) as Pick<ClassRow, "id" | "name"> | undefined) ?? null : null,
  }));
}

async function getCsvScopeLabel(input: { exportType: ArchiveExportType; departmentId?: string; classId?: string }) {
  const admin = createSupabaseAdminClient();

  if (input.exportType === "department_csv" && input.departmentId) {
    const { data } = await admin.from("departments").select("name").eq("id", input.departmentId).maybeSingle();
    return `${data?.name ?? "bolum"}-arsivi`;
  }

  if (input.exportType === "class_csv" && input.classId) {
    const { data } = await admin.from("classes").select("name").eq("id", input.classId).maybeSingle();
    return `${data?.name ?? "sinif"}-arsivi`;
  }

  return "donem-arsivi";
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
