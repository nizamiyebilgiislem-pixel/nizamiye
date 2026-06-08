import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassRow, DepartmentRow, InfirmaryRecordRow, ProfileRow, StudentRow } from "@/types/database";

export type InfirmaryRecordWithRelations = InfirmaryRecordRow & {
  student: StudentRow | null;
  course_class: ClassRow | null;
  department: DepartmentRow | null;
  created_by_profile: ProfileRow | null;
};

export type InfirmaryFilters = {
  search?: string;
  departmentId?: string;
  classId?: string;
  dateFrom?: string;
  dateTo?: string;
  sentToHospital?: string;
  parentInformed?: string;
};

export async function getInfirmaryDashboardSummary(profile: ProfileRow) {
  const { records } = await getInfirmaryRecordsForProfile(profile, {});
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalCount: records.length,
    todayCount: records.filter((record) => record.record_date === today).length,
    hospitalCount: records.filter((record) => record.sent_to_hospital).length,
    parentInformedCount: records.filter((record) => record.parent_informed).length,
    latestRecords: records.slice(0, 10),
  };
}

export async function getInfirmaryRecordsForProfile(profile: ProfileRow, filters: InfirmaryFilters) {
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
  if (visibleStudentIds.length === 0) return { records: [], departments: visibleDepartments, classes: visibleClasses };

  let query = supabase.from("infirmary_records").select("*").in("student_id", visibleStudentIds).order("record_date", { ascending: false });
  if (filters.dateFrom) query = query.gte("record_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("record_date", filters.dateTo);
  if (filters.sentToHospital === "true" || filters.sentToHospital === "false") query = query.eq("sent_to_hospital", filters.sentToHospital === "true");
  if (filters.parentInformed === "true" || filters.parentInformed === "false") query = query.eq("parent_informed", filters.parentInformed === "true");
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`complaint.ilike.${term},hospital_name.ilike.${term},medication_given.ilike.${term},note.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw new Error("Revir kayıtları alınamadı.");

  const studentMap = new Map(visibleStudents.map((student) => [student.id, student]));
  const classMap = new Map(visibleClasses.map((classRow) => [classRow.id, classRow]));
  const departmentMap = new Map(visibleDepartments.map((department) => [department.id, department]));
  const profileMap = new Map((profiles ?? []).map((profileRow) => [profileRow.id, profileRow]));

  let records = (data ?? []).map((record) => attachRelations(record, studentMap, classMap, departmentMap, profileMap));
  if (filters.search) {
    const term = filters.search.trim().toLocaleLowerCase("tr-TR");
    records = records.filter((record) =>
      [
        record.student?.full_name,
        record.complaint,
        record.treatment,
        record.hospital_name,
        record.medication_given,
        record.note,
      ].some((value) => value?.toLocaleLowerCase("tr-TR").includes(term)),
    );
  }
  return { records, departments: visibleDepartments, classes: visibleClasses };
}

export async function getInfirmaryRecordById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: record, error } = await supabase.from("infirmary_records").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Revir kaydı alınamadı.");
  if (!record) return null;
  const [{ data: student }, { data: creator }] = await Promise.all([
    supabase.from("students").select("*").eq("id", record.student_id).maybeSingle(),
    record.created_by ? supabase.from("profiles").select("*").eq("id", record.created_by).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const courseClass = student?.course_class_id ? (await supabase.from("classes").select("*").eq("id", student.course_class_id).maybeSingle()).data : null;
  const department = courseClass ? (await supabase.from("departments").select("*").eq("id", courseClass.department_id).maybeSingle()).data : null;
  return { ...record, student: student ?? null, course_class: courseClass, department, created_by_profile: creator ?? null };
}

export async function getInfirmaryRecordsByStudent(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: records, error }, { data: profiles }] = await Promise.all([
    supabase.from("infirmary_records").select("*").eq("student_id", studentId).order("record_date", { ascending: false }),
    supabase.from("profiles").select("*"),
  ]);
  if (error) throw new Error("Revir kayıtları alınamadı.");
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return (records ?? []).map((record) => ({ ...record, created_by_profile: record.created_by ? profileMap.get(record.created_by) ?? null : null }));
}

export async function getInfirmaryEntryOptions(profile: ProfileRow, filters: { departmentId?: string; classId?: string }) {
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
  record: InfirmaryRecordRow,
  studentMap: Map<string, StudentRow>,
  classMap: Map<string, ClassRow>,
  departmentMap: Map<string, DepartmentRow>,
  profileMap: Map<string, ProfileRow>,
): InfirmaryRecordWithRelations {
  const student = studentMap.get(record.student_id) ?? null;
  const courseClass = student?.course_class_id ? classMap.get(student.course_class_id) ?? null : null;
  return {
    ...record,
    student,
    course_class: courseClass,
    department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null,
    created_by_profile: record.created_by ? profileMap.get(record.created_by) ?? null : null,
  };
}
