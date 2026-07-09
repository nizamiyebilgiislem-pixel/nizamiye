import { createSimpleMultiPagePdf, sanitizeArchiveFilename } from "@/lib/archives/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassRow, DepartmentRow, ProfileRow, StudentRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export type StudentReportScope = {
  students: StudentBulkReportRow[];
  classes: ClassRow[];
  departments: DepartmentRow[];
  scopeLabel: string;
  details: StudentBulkReportDetails;
};

export type StudentBulkReportRow = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

type StudentBulkReportDetails = {
  parentsByStudentId: Map<string, string[]>;
  gradesByStudentId: Map<string, string[]>;
  evaluationsByStudentId: Map<string, string[]>;
  profileNotesByStudentId: Map<string, string[]>;
  attendanceByStudentId: Map<string, string[]>;
  infirmaryByStudentId: Map<string, string[]>;
  dormitoryByStudentId: Map<string, string[]>;
  libraryByStudentId: Map<string, string[]>;
  booksByStudentId: Map<string, string[]>;
};

type ParentLinkWithProfile = {
  student_id: string;
  relation: string | null;
  parent_profile_id: string;
  parent_profile: Pick<ProfileRow, "full_name" | "email" | "phone"> | null;
};

type GradeReportRow = {
  student_id: string;
  grade: number;
  note: string | null;
  course_id: string;
  exam_type_id: string;
  created_at: string;
};

type EvaluationReportRow = {
  student_id: string;
  behavior_score: number | null;
  attendance_score: number | null;
  lesson_performance_score: number | null;
  discipline_score: number | null;
  memorization_score: number | null;
  general_opinion: string | null;
  term_id: string;
  created_at: string;
};

type ProfileNoteReportRow = {
  student_id: string;
  note: string;
  created_at: string;
  created_by_profile: Pick<ProfileRow, "full_name"> | null;
};

type AttendanceReportRow = {
  student_id: string;
  status: string;
  note: string | null;
  created_at: string;
};

type InfirmaryReportRow = {
  student_id: string;
  record_date: string;
  complaint: string | null;
  treatment: string | null;
  sent_to_hospital: boolean;
  note: string | null;
};

type DormitoryReportRow = {
  student_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  note: string | null;
  dormitory: { name: string } | null;
};

type LibraryLoanReportRow = {
  student_id: string | null;
  status: string;
  loan_date: string;
  due_date: string | null;
  returned_at: string | null;
  note: string | null;
  book: { title: string } | null;
};

type StudentBookReportRow = {
  student_id: string;
  title: string;
  author: string | null;
  read_date: string | null;
  note: string | null;
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
      details: createEmptyStudentBulkReportDetails(),
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

  const details = await getStudentBulkReportDetails(reportStudents.map((student) => student.id));

  return {
    students: reportStudents,
    classes: visibleClasses,
    departments: visibleDepartments,
    scopeLabel: buildScopeLabel(profile, filters, visibleClasses, visibleDepartments),
    details,
  };
}

export function createStudentBulkReportPdf(scope: StudentReportScope) {
  const pages = scope.students.map((student, index) => ({
    title: `${index + 1}. ${student.full_name} Talebe Profil Raporu`,
    lines: buildStudentProfilePageLines(student, scope.details),
  }));

  return createSimpleMultiPagePdf(pages);
}

export function getStudentBulkReportFileName(scope: StudentReportScope) {
  return `${sanitizeArchiveFilename(`${scope.scopeLabel}-talebe-raporu`)}.pdf`;
}

function buildStudentProfilePageLines(student: StudentBulkReportRow, details: StudentBulkReportDetails) {
  return [
    "KIMLIK VE SINIF",
    `Bolum: ${student.department?.name ?? "-"}`,
    `Sinif: ${student.course_class?.name ?? "-"}`,
    `Durum: ${formatStudentStatus(student.status)}`,
    `Kimlik No: ${student.identity_number ?? "-"}`,
    `Dogum Tarihi: ${student.birth_date ?? "-"}`,
    `Kayit Tarihi: ${student.registration_date ?? "-"}`,
    `Kan Grubu: ${student.blood_type ?? "-"}`,
    "",
    "ILETISIM / AILE",
    `Telefon: ${student.guardian_phone ?? student.guardian_phone_2 ?? "-"}`,
    `Baba: ${student.father_name ?? "-"}${student.father_job ? ` (${student.father_job})` : ""}`,
    `Anne: ${student.mother_name ?? "-"}${student.mother_job ? ` (${student.mother_job})` : ""}`,
    `Veli Durumu: ${student.parent_marital_status ?? "-"}`,
    `Kardes Kurumda: ${student.sibling_in_institution ?? "-"}`,
    `Adres: ${student.address ?? "-"}`,
    ...sectionLines("Bagli Veliler", details.parentsByStudentId.get(student.id), 3),
    "",
    "OKUL / PROFIL",
    `Okul: ${student.school_name ?? "-"}`,
    `Okul Sinifi: ${student.school_class ?? "-"}`,
    `Memleket: ${student.hometown ?? "-"}`,
    `Uyruk: ${student.nationality ?? "-"}`,
    ...sectionLines("Notlar", details.gradesByStudentId.get(student.id), 5),
    ...sectionLines("Kanaat / Yorum", details.evaluationsByStudentId.get(student.id), 5),
    ...sectionLines("Hoca Notlari", details.profileNotesByStudentId.get(student.id), 4),
    ...sectionLines("Yoklama Ozeti", details.attendanceByStudentId.get(student.id), 3),
    ...sectionLines("Revir", details.infirmaryByStudentId.get(student.id), 3),
    ...sectionLines("Yatakhane", details.dormitoryByStudentId.get(student.id), 2),
    ...sectionLines("Kutuphane", details.libraryByStudentId.get(student.id), 3),
    ...sectionLines("Okudugu Kitaplar", details.booksByStudentId.get(student.id), 3),
  ];
}

function sectionLines(title: string, lines: string[] | undefined, limit: number) {
  const values = (lines ?? []).filter(Boolean).slice(0, limit);
  return ["", title.toUpperCase(), ...(values.length > 0 ? values.map((line) => `- ${line}`) : ["- Kayit yok"])];
}

function createEmptyStudentBulkReportDetails(): StudentBulkReportDetails {
  return {
    parentsByStudentId: new Map(),
    gradesByStudentId: new Map(),
    evaluationsByStudentId: new Map(),
    profileNotesByStudentId: new Map(),
    attendanceByStudentId: new Map(),
    infirmaryByStudentId: new Map(),
    dormitoryByStudentId: new Map(),
    libraryByStudentId: new Map(),
    booksByStudentId: new Map(),
  };
}

async function getStudentBulkReportDetails(studentIds: string[]): Promise<StudentBulkReportDetails> {
  if (studentIds.length === 0) {
    return createEmptyStudentBulkReportDetails();
  }

  const supabase = await createSupabaseServerClient();
  const [
    parentsResult,
    gradesResult,
    evaluationsResult,
    profileNotesResult,
    attendanceResult,
    infirmaryResult,
    dormitoryResult,
    libraryResult,
    booksResult,
  ] = await Promise.all([
    supabase
      .from("parent_student_links")
      .select("student_id, relation, parent_profile_id, parent_profile:parent_profile_id(full_name, email, phone)")
      .in("student_id", studentIds)
      .returns<ParentLinkWithProfile[]>(),
    supabase
      .from("grades")
      .select("student_id, grade, note, course_id, exam_type_id, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(studentIds.length * 8)
      .returns<GradeReportRow[]>(),
    supabase
      .from("student_evaluations")
      .select("student_id, behavior_score, attendance_score, lesson_performance_score, discipline_score, memorization_score, general_opinion, term_id, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(studentIds.length * 4)
      .returns<EvaluationReportRow[]>(),
    supabase
      .from("student_profile_notes")
      .select("student_id, note, created_at, created_by_profile:created_by(full_name)")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(studentIds.length * 4)
      .returns<ProfileNoteReportRow[]>(),
    supabase
      .from("attendance_records")
      .select("student_id, status, note, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(studentIds.length * 20)
      .returns<AttendanceReportRow[]>(),
    supabase
      .from("infirmary_records")
      .select("student_id, record_date, complaint, treatment, sent_to_hospital, note")
      .in("student_id", studentIds)
      .order("record_date", { ascending: false })
      .limit(studentIds.length * 3)
      .returns<InfirmaryReportRow[]>(),
    supabase
      .from("dormitory_assignments")
      .select("student_id, status, start_date, end_date, note, dormitory:dormitory_id(name)")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(studentIds.length * 2)
      .returns<DormitoryReportRow[]>(),
    supabase
      .from("library_loans")
      .select("student_id, status, loan_date, due_date, returned_at, note, book:book_id(title)")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(studentIds.length * 4)
      .returns<LibraryLoanReportRow[]>(),
    supabase
      .from("student_books")
      .select("student_id, title, author, read_date, note")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(studentIds.length * 4)
      .returns<StudentBookReportRow[]>(),
  ]);

  const grades = gradesResult.data ?? [];
  const evaluations = evaluationsResult.data ?? [];
  const courseNames = await getCourseNames([...new Set(grades.map((grade) => grade.course_id))]);
  const examTypeNames = await getExamTypeNames([...new Set(grades.map((grade) => grade.exam_type_id))]);
  const termNames = await getTermNames([...new Set(evaluations.map((evaluation) => evaluation.term_id))]);

  return {
    parentsByStudentId: groupLines(parentsResult.data ?? [], (row) => row.student_id, formatParentLine),
    gradesByStudentId: groupLines(grades, (row) => row.student_id, (row) => formatGradeLine(row, courseNames, examTypeNames)),
    evaluationsByStudentId: groupLines(evaluations, (row) => row.student_id, (row) => formatEvaluationLine(row, termNames)),
    profileNotesByStudentId: groupLines(profileNotesResult.data ?? [], (row) => row.student_id, formatProfileNoteLine),
    attendanceByStudentId: buildAttendanceLines(attendanceResult.data ?? []),
    infirmaryByStudentId: groupLines(infirmaryResult.data ?? [], (row) => row.student_id, formatInfirmaryLine),
    dormitoryByStudentId: groupLines(dormitoryResult.data ?? [], (row) => row.student_id, formatDormitoryLine),
    libraryByStudentId: groupLines(libraryResult.data ?? [], (row) => row.student_id ?? "", formatLibraryLine),
    booksByStudentId: groupLines(booksResult.data ?? [], (row) => row.student_id, formatStudentBookLine),
  };
}

async function getCourseNames(courseIds: string[]) {
  if (courseIds.length === 0) return new Map<string, string>();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("courses").select("id, name").in("id", courseIds);
  return new Map((data ?? []).map((course) => [course.id, course.name]));
}

async function getExamTypeNames(examTypeIds: string[]) {
  if (examTypeIds.length === 0) return new Map<string, string>();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("exam_types").select("id, name").in("id", examTypeIds);
  return new Map((data ?? []).map((examType) => [examType.id, examType.name]));
}

async function getTermNames(termIds: string[]) {
  if (termIds.length === 0) return new Map<string, string>();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("academic_terms").select("id, name").in("id", termIds);
  return new Map((data ?? []).map((term) => [term.id, term.name]));
}

function groupLines<T>(rows: T[], getStudentId: (row: T) => string, formatLine: (row: T) => string) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const studentId = getStudentId(row);
    if (!studentId) continue;
    const lines = map.get(studentId) ?? [];
    lines.push(formatLine(row));
    map.set(studentId, lines);
  }
  return map;
}

function buildAttendanceLines(rows: AttendanceReportRow[]) {
  const grouped = new Map<string, AttendanceReportRow[]>();
  for (const row of rows) {
    const lines = grouped.get(row.student_id) ?? [];
    lines.push(row);
    grouped.set(row.student_id, lines);
  }

  const map = new Map<string, string[]>();
  for (const [studentId, studentRows] of grouped.entries()) {
    const absent = studentRows.filter((row) => row.status === "absent").length;
    const excused = studentRows.filter((row) => row.status === "excused").length;
    const late = studentRows.filter((row) => row.status === "late").length;
    const present = studentRows.filter((row) => row.status === "present").length;
    const last = studentRows[0];
    map.set(studentId, [
      `Toplam ${studentRows.length} kayit: mevcut ${present}, devamsiz ${absent}, ozurlu ${excused}, gec ${late}`,
      `Son durum: ${formatAttendanceStatus(last.status)} (${formatDate(last.created_at)})${last.note ? ` - ${last.note}` : ""}`,
    ]);
  }
  return map;
}

function formatParentLine(row: ParentLinkWithProfile) {
  const parent = row.parent_profile;
  return `${parent?.full_name ?? "Veli"}${row.relation ? ` (${row.relation})` : ""} - ${parent?.phone ?? parent?.email ?? "-"}`;
}

function formatGradeLine(row: GradeReportRow, courseNames: Map<string, string>, examTypeNames: Map<string, string>) {
  return `${courseNames.get(row.course_id) ?? "Ders"} / ${examTypeNames.get(row.exam_type_id) ?? "Sinav"}: ${row.grade}${row.note ? ` (${row.note})` : ""}`;
}

function formatEvaluationLine(row: EvaluationReportRow, termNames: Map<string, string>) {
  const scores = [
    row.behavior_score != null ? `Davranis ${row.behavior_score}` : null,
    row.attendance_score != null ? `Devam ${row.attendance_score}` : null,
    row.lesson_performance_score != null ? `Ders ${row.lesson_performance_score}` : null,
    row.discipline_score != null ? `Disiplin ${row.discipline_score}` : null,
    row.memorization_score != null ? `Ezber ${row.memorization_score}` : null,
  ].filter(Boolean);
  const summary = scores.length > 0 ? scores.join(", ") : "Puan yok";
  return `${termNames.get(row.term_id) ?? "Donem"}: ${summary}${row.general_opinion ? ` - ${row.general_opinion}` : ""}`;
}

function formatProfileNoteLine(row: ProfileNoteReportRow) {
  return `${row.created_by_profile?.full_name ?? "Hoca"} (${formatDate(row.created_at)}): ${row.note}`;
}

function formatInfirmaryLine(row: InfirmaryReportRow) {
  const hospital = row.sent_to_hospital ? "Hastaneye sevk" : "Revir";
  return `${formatDate(row.record_date)} ${hospital}: ${row.complaint ?? "-"}${row.treatment ? ` / ${row.treatment}` : ""}${row.note ? ` (${row.note})` : ""}`;
}

function formatDormitoryLine(row: DormitoryReportRow) {
  return `${row.dormitory?.name ?? "Yatakhane"} - ${row.status} (${formatDate(row.start_date)}${row.end_date ? ` / ${formatDate(row.end_date)}` : ""})${row.note ? ` - ${row.note}` : ""}`;
}

function formatLibraryLine(row: LibraryLoanReportRow) {
  return `${row.book?.title ?? "Kitap"} - ${row.status} (${formatDate(row.loan_date)}${row.returned_at ? ` / ${formatDate(row.returned_at)}` : row.due_date ? ` / son ${formatDate(row.due_date)}` : ""})`;
}

function formatStudentBookLine(row: StudentBookReportRow) {
  return `${row.title}${row.author ? ` - ${row.author}` : ""}${row.read_date ? ` (${formatDate(row.read_date)})` : ""}${row.note ? ` - ${row.note}` : ""}`;
}

function formatStudentStatus(status: string) {
  if (status === "active") return "Aktif";
  if (status === "graduated") return "Mezun";
  if (status === "left") return "Ayrildi";
  return status;
}

function formatAttendanceStatus(status: string) {
  if (status === "present") return "Mevcut";
  if (status === "absent") return "Devamsiz";
  if (status === "excused") return "Ozurlu";
  if (status === "late") return "Gec";
  return status;
}

function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : "-";
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
