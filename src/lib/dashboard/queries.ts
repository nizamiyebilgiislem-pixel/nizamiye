import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ClassCourseRow,
  ClassRow,
  DepartmentRow,
  InfirmaryRecordRow,
  ProfileRow,
  StudentDocumentRow,
  StudentEvaluationRow,
  StudentRow,
  WeeklyScheduleSlotRow,
} from "@/types/database";

export type DashboardMetric = {
  key: string;
  label: string;
  value: number;
  description: string;
};

export type DashboardStudentListItem = StudentRow & {
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

export type DashboardInfirmaryListItem = InfirmaryRecordRow & {
  student: StudentRow | null;
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

export type DashboardDocumentListItem = StudentDocumentRow & {
  student: StudentRow | null;
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

export type DashboardEvaluationListItem = StudentEvaluationRow & {
  student: StudentRow | null;
  course_class: ClassRow | null;
  department: DepartmentRow | null;
};

export type DashboardDistributionItem = {
  id: string;
  name: string;
  count: number;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  latestStudents: DashboardStudentListItem[];
  latestInfirmaryRecords: DashboardInfirmaryListItem[];
  latestDocuments: DashboardDocumentListItem[];
  latestEvaluations: DashboardEvaluationListItem[];
  departmentDistribution: DashboardDistributionItem[];
  classDistribution: DashboardDistributionItem[];
};

type QueryResult<T> = {
  data: T;
  failed: boolean;
};

const emptyResult = {
  students: [] as StudentRow[],
  profiles: [] as ProfileRow[],
  departments: [] as DepartmentRow[],
  classes: [] as ClassRow[],
  infirmaryRecords: [] as InfirmaryRecordRow[],
  documents: [] as StudentDocumentRow[],
  evaluations: [] as StudentEvaluationRow[],
  classCourses: [] as ClassCourseRow[],
  scheduleSlots: [] as WeeklyScheduleSlotRow[],
};

export async function getDashboardData(profile: ProfileRow): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  const [
    studentsResult,
    profilesResult,
    departmentsResult,
    classesResult,
    infirmaryResult,
    documentsResult,
    evaluationsResult,
    classCoursesResult,
    scheduleSlotsResult,
  ] = await Promise.all([
    safeQuery(supabase.from("students").select("id, full_name, status, photo_url, course_class_id, created_at").order("created_at", { ascending: false }), emptyResult.students),
    safeQuery(supabase.from("profiles").select("id, full_name, role, department_id, is_active"), emptyResult.profiles),
    safeQuery(supabase.from("departments").select("id, name, is_active").eq("is_active", true).order("name", { ascending: true }), emptyResult.departments),
    safeQuery(supabase.from("classes").select("id, name, department_id, is_active, class_teacher_id").order("name", { ascending: true }), emptyResult.classes),
    safeQuery(supabase.from("infirmary_records").select("id, student_id, record_date, complaint").order("record_date", { ascending: false }).limit(50), emptyResult.infirmaryRecords),
    safeQuery(supabase.from("student_documents").select("id, student_id, document_type, created_at").order("created_at", { ascending: false }).limit(50), emptyResult.documents),
    safeQuery(supabase.from("student_evaluations").select("id, student_id, general_opinion, term_id, created_at").order("created_at", { ascending: false }).limit(50), emptyResult.evaluations),
    safeQuery(supabase.from("class_courses").select("id, class_id, course_id, teacher_id, is_active"), emptyResult.classCourses),
    safeQuery(supabase.from("weekly_schedule_slots").select("id, class_id, class_course_id"), emptyResult.scheduleSlots),
  ]);

  const visibleDepartments = filterDepartments(departmentsResult.data as DepartmentRow[], profile);
  const visibleDepartmentIds = new Set(visibleDepartments.map((department) => department.id));
  const visibleClasses = classesResult.data.filter((classRow) => visibleDepartmentIds.has(classRow.department_id));
  const visibleClassIds = new Set(visibleClasses.map((classRow) => classRow.id));
  const visibleStudents = studentsResult.data.filter((student) => student.course_class_id && visibleClassIds.has(student.course_class_id));
  const visibleStudentIds = new Set(visibleStudents.map((student) => student.id));
  const visibleProfiles = profilesResult.data.filter((profileRow) => {
    if (profile.role === "admin" || profile.role === "genel_mudur") {
      return true;
    }

    return profileRow.department_id === profile.department_id;
  });

  const classMap = new Map(visibleClasses.map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map(visibleDepartments.map((department) => [department.id, department]));
  const studentMap = new Map(visibleStudents.map((student) => [student.id, student]));
  const visibleInfirmaryRecords = infirmaryResult.data.filter((record) => visibleStudentIds.has(record.student_id));
  const visibleDocuments = documentsResult.data.filter((document) => visibleStudentIds.has(document.student_id));
  const visibleEvaluations = evaluationsResult.data.filter((evaluation) => visibleStudentIds.has(evaluation.student_id));
  const visibleClassCourses = classCoursesResult.data.filter((classCourse) => visibleClassIds.has(classCourse.class_id));
  const visibleScheduleSlots = scheduleSlotsResult.data.filter((slot) => visibleClassIds.has(slot.class_id));
  const assignedClassIds = new Set(visibleClassCourses.filter((classCourse) => classCourse.is_active).map((classCourse) => classCourse.class_id));
  const scheduledClassIds = new Set(visibleScheduleSlots.map((slot) => slot.class_id));

  return {
    metrics: [
      metric("active-students", "Aktif talebe", visibleStudents.filter((student) => student.status === "active").length, "Kayıtlı ve aktif devam eden talebeler."),
      metric("passive-students", "Pasif talebe", visibleStudents.filter((student) => student.status === "passive").length, "Geçici olarak pasif durumda olan talebeler."),
      metric("graduated-students", "Mezun talebe", visibleStudents.filter((student) => student.status === "graduated").length, "Mezun olarak arşivlenen talebeler."),
      metric("teachers", "Toplam hoca", visibleProfiles.filter((profileRow) => profileRow.role === "hoca" && profileRow.is_active).length, "Aktif hoca profilleri."),
      metric("active-classes", "Aktif sınıf", visibleClasses.filter((classRow) => classRow.is_active).length, "Eğitime açık sınıflar."),
      metric("active-departments", "Aktif bölüm", visibleDepartments.length, "Yönetilebilir aktif bölümler."),
      metric("infirmary", "Toplam revir kaydı", visibleInfirmaryRecords.length, "Yetki alanındaki tüm revir kayıtları."),
      metric("evaluations", "Toplam kanaat kaydı", visibleEvaluations.length, "Yetki alanındaki kanaat kayıtları."),
      metric("documents", "Toplam evrak", visibleDocuments.length, "Talebelere bağlı yüklenmiş evraklar."),
      metric("assigned-classes", "Ders atanmış sınıf", assignedClassIds.size, "En az bir aktif ders ataması olan sınıflar."),
      metric("scheduled-classes", "Programlı sınıf", scheduledClassIds.size, "Ders programı oluşturulmuş sınıflar."),
      metric("missing-teachers", "Hocası atanmamış ders", visibleClassCourses.filter((classCourse) => classCourse.is_active && !classCourse.teacher_id).length, "Aktif olup hocası seçilmemiş ders atamaları."),
    ],
    latestStudents: visibleStudents.slice(0, 5).map((student) => attachStudentRelations(student as StudentRow, classMap as Map<string, ClassRow>, departmentMap as Map<string, DepartmentRow>)),
    latestInfirmaryRecords: visibleInfirmaryRecords.slice(0, 5).map((record) => attachRecordRelations(record as InfirmaryRecordRow, studentMap as Map<string, StudentRow>, classMap as Map<string, ClassRow>, departmentMap as Map<string, DepartmentRow>)),
    latestDocuments: visibleDocuments.slice(0, 5).map((document) => attachDocumentRelations(document as StudentDocumentRow, studentMap as Map<string, StudentRow>, classMap as Map<string, ClassRow>, departmentMap as Map<string, DepartmentRow>)),
    latestEvaluations: visibleEvaluations.slice(0, 5).map((evaluation) => attachEvaluationRelations(evaluation as StudentEvaluationRow, studentMap as Map<string, StudentRow>, classMap as Map<string, ClassRow>, departmentMap as Map<string, DepartmentRow>)),
    departmentDistribution: visibleDepartments.map((department) => {
      const departmentClassIds = new Set(visibleClasses.filter((classRow) => classRow.department_id === department.id).map((classRow) => classRow.id));
      return {
        id: department.id,
        name: department.name,
        count: visibleStudents.filter((student) => student.course_class_id && departmentClassIds.has(student.course_class_id)).length,
      };
    }),
    classDistribution: visibleClasses
      .map((classRow) => ({
        id: classRow.id,
        name: classRow.name,
        count: visibleStudents.filter((student) => student.course_class_id === classRow.id).length,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8),
  };
}

async function safeQuery<T>(query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<QueryResult<T>> {
  try {
    const result = await query;

    if (result.error) {
      return { data: fallback, failed: true };
    }

    return { data: result.data ?? fallback, failed: false };
  } catch {
    return { data: fallback, failed: true };
  }
}

function metric(key: string, label: string, value: number, description: string): DashboardMetric {
  return { key, label, value, description };
}

function filterDepartments(departments: DepartmentRow[], profile: ProfileRow) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return departments;
  }

  return departments.filter((department) => department.id === profile.department_id);
}

function attachStudentRelations(
  student: StudentRow,
  classMap: Map<string, ClassRow>,
  departmentMap: Map<string, DepartmentRow>,
): DashboardStudentListItem {
  const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

  return {
    ...student,
    course_class: courseClass,
    department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
  };
}

function attachRecordRelations(
  record: InfirmaryRecordRow,
  studentMap: Map<string, StudentRow>,
  classMap: Map<string, ClassRow>,
  departmentMap: Map<string, DepartmentRow>,
): DashboardInfirmaryListItem {
  const student = studentMap.get(record.student_id) ?? null;
  const courseClass = student?.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

  return {
    ...record,
    student,
    course_class: courseClass,
    department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
  };
}

function attachDocumentRelations(
  document: StudentDocumentRow,
  studentMap: Map<string, StudentRow>,
  classMap: Map<string, ClassRow>,
  departmentMap: Map<string, DepartmentRow>,
): DashboardDocumentListItem {
  const student = studentMap.get(document.student_id) ?? null;
  const courseClass = student?.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

  return {
    ...document,
    student,
    course_class: courseClass,
    department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
  };
}

function attachEvaluationRelations(
  evaluation: StudentEvaluationRow,
  studentMap: Map<string, StudentRow>,
  classMap: Map<string, ClassRow>,
  departmentMap: Map<string, DepartmentRow>,
): DashboardEvaluationListItem {
  const student = studentMap.get(evaluation.student_id) ?? null;
  const courseClass = student?.course_class_id ? classMap.get(student.course_class_id) ?? null : null;

  return {
    ...evaluation,
    student,
    course_class: courseClass,
    department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
  };
}
