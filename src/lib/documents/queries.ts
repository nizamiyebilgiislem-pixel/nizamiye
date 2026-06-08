import { createSupabaseServerClient } from "@/lib/supabase/server";
import { documentTypes } from "@/lib/documents/constants";
import type { ClassRow, DepartmentRow, ProfileRow, StudentDocumentRow, StudentRow } from "@/types/database";

export type StudentDocumentWithRelations = StudentDocumentRow & {
  student: StudentRow | null;
  course_class: ClassRow | null;
  department: DepartmentRow | null;
  uploaded_by_profile: ProfileRow | null;
};

export type DocumentFilters = {
  search?: string;
  departmentId?: string;
  classId?: string;
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getDocumentsDashboardSummary(profile: ProfileRow) {
  const { documents } = await getDocumentsForProfile(profile, {});
  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeStudentsWithoutDocuments = await getActiveStudentsWithoutDocuments(profile);
  return {
    totalCount: documents.length,
    currentMonthCount: documents.filter((document) => document.created_at.startsWith(currentMonth)).length,
    typeCounts: documentTypes.map((type) => ({
      type,
      count: documents.filter((document) => document.document_type === type).length,
    })),
    missingDocumentStudentCount: activeStudentsWithoutDocuments,
    latestDocuments: documents.slice(0, 10),
  };
}

export async function getDocumentsForProfile(profile: ProfileRow, filters: DocumentFilters) {
  const supabase = await createSupabaseServerClient();
  const [{ data: departments }, { data: classes }, { data: students }, { data: profiles }] = await Promise.all([
    supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("classes").select("*").order("name", { ascending: true }),
    supabase.from("students").select("*"),
    supabase.from("profiles").select("*"),
  ]);
  const visibleDepartments = filterDepartments(departments ?? [], profile);
  const visibleDepartmentIds = new Set(visibleDepartments.map((department) => department.id));
  const visibleClasses = (classes ?? []).filter((classRow) => {
    if (!visibleDepartmentIds.has(classRow.department_id)) return false;
    if (filters.departmentId && classRow.department_id !== filters.departmentId) return false;
    return true;
  });
  const visibleClassIds = new Set(visibleClasses.map((classRow) => classRow.id));
  const visibleStudents = (students ?? []).filter((student) => {
    if (!student.course_class_id || !visibleClassIds.has(student.course_class_id)) return false;
    if (filters.classId && student.course_class_id !== filters.classId) return false;
    return true;
  });
  const visibleStudentIds = visibleStudents.map((student) => student.id);
  if (visibleStudentIds.length === 0) return { documents: [], departments: visibleDepartments, classes: visibleClasses };

  let query = supabase.from("student_documents").select("*").in("student_id", visibleStudentIds).order("created_at", { ascending: false });
  if (filters.documentType) query = query.eq("document_type", filters.documentType);
  if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`document_type.ilike.${term},file_url.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw new Error("Evrak kayıtları alınamadı.");

  const studentMap = new Map(visibleStudents.map((student) => [student.id, student]));
  const classMap = new Map(visibleClasses.map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map(visibleDepartments.map((department) => [department.id, department]));
  const profileMap = new Map((profiles ?? []).map((profileRow) => [profileRow.id, profileRow]));
  let documents = (data ?? []).map((document) => attachRelations(document, studentMap, classMap, departmentMap, profileMap));
  if (filters.search) {
    const term = filters.search.trim().toLocaleLowerCase("tr-TR");
    documents = documents.filter((document) =>
      [document.student?.full_name, document.document_type, document.file_url].some((value) => value?.toLocaleLowerCase("tr-TR").includes(term)),
    );
  }
  return { documents, departments: visibleDepartments, classes: visibleClasses };
}

export async function getDocumentById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: document, error } = await supabase.from("student_documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Evrak kaydı alınamadı.");
  if (!document) return null;
  const [{ data: student }, { data: uploader }] = await Promise.all([
    supabase.from("students").select("*").eq("id", document.student_id).maybeSingle(),
    document.uploaded_by ? supabase.from("profiles").select("*").eq("id", document.uploaded_by).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const courseClass = student?.course_class_id ? (await supabase.from("classes").select("*").eq("id", student.course_class_id).maybeSingle()).data : null;
  const department = courseClass ? (await supabase.from("departments").select("*").eq("id", courseClass.department_id).maybeSingle()).data : null;
  return { ...document, student: student ?? null, course_class: courseClass, department, uploaded_by_profile: uploader ?? null };
}

export async function getDocumentsByStudent(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: documents, error }, { data: profiles }] = await Promise.all([
    supabase.from("student_documents").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("*"),
  ]);
  if (error) throw new Error("Öğrenci evrakları alınamadı.");
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return (documents ?? []).map((document) => ({
    ...document,
    uploaded_by_profile: document.uploaded_by ? profileMap.get(document.uploaded_by) ?? null : null,
  }));
}

export async function getDocumentEntryOptions(profile: ProfileRow, filters: { departmentId?: string; classId?: string }) {
  const supabase = await createSupabaseServerClient();
  const [{ data: departments }, { data: classes }] = await Promise.all([
    supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("classes").select("*").eq("is_active", true).order("name", { ascending: true }),
  ]);
  const visibleDepartments = filterDepartments(departments ?? [], profile);
  const visibleDepartmentIds = new Set(visibleDepartments.map((department) => department.id));
  const visibleClasses = (classes ?? []).filter((classRow) => {
    if (!visibleDepartmentIds.has(classRow.department_id)) return false;
    if (profile.role === "hoca" && classRow.class_teacher_id !== profile.id) return false;
    if (filters.departmentId && classRow.department_id !== filters.departmentId) return false;
    return true;
  });
  const selectedClassId = filters.classId ?? visibleClasses[0]?.id;
  const selectedClass = visibleClasses.find((classRow) => classRow.id === selectedClassId) ?? null;
  const students = selectedClass ? await getActiveStudentsByClassId(selectedClass.id) : [];
  return { departments: visibleDepartments, classes: visibleClasses, selectedClass, students };
}

async function getActiveStudentsWithoutDocuments(profile: ProfileRow) {
  const { documents } = await getDocumentsForProfile(profile, {});
  const supabase = await createSupabaseServerClient();
  const [{ data: students }, { data: classes }] = await Promise.all([
    supabase.from("students").select("*").eq("status", "active"),
    supabase.from("classes").select("*"),
  ]);
  const visibleClassIds = new Set((classes ?? []).filter((classRow) => profile.role === "admin" || profile.role === "genel_mudur" || classRow.department_id === profile.department_id).map((classRow) => classRow.id));
  const documentStudentIds = new Set(documents.map((document) => document.student_id));
  return (students ?? []).filter((student) => student.course_class_id && visibleClassIds.has(student.course_class_id) && !documentStudentIds.has(student.id)).length;
}

async function getActiveStudentsByClassId(classId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("students").select("*").eq("status", "active").eq("course_class_id", classId).order("full_name", { ascending: true });
  if (error) throw new Error("Talebeler alınamadı.");
  return data;
}

function filterDepartments(departments: DepartmentRow[], profile: ProfileRow) {
  if (profile.role === "admin" || profile.role === "genel_mudur") return departments;
  return departments.filter((department) => department.id === profile.department_id);
}

function attachRelations(
  document: StudentDocumentRow,
  studentMap: Map<string, StudentRow>,
  classMap: Map<string, ClassRow>,
  departmentMap: Map<string, DepartmentRow>,
  profileMap: Map<string, ProfileRow>,
): StudentDocumentWithRelations {
  const student = studentMap.get(document.student_id) ?? null;
  const courseClass = student?.course_class_id ? classMap.get(student.course_class_id) ?? null : null;
  return {
    ...document,
    student,
    course_class: courseClass,
    department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
    uploaded_by_profile: document.uploaded_by ? profileMap.get(document.uploaded_by) ?? null : null,
  };
}
