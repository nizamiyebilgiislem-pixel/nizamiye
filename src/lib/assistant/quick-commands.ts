"use server";

import { requireAuth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ClassRow, DepartmentRow, DormitoryRow, ProfileRow, StudentRow } from "@/types/database";

export type AssistantQuickCommand = "student" | "department" | "class" | "dormitory";
export type AssistantQuickSummaryType =
  | "general"
  | "grades"
  | "attendance"
  | "guidance"
  | "infirmary"
  | "term_history"
  | "classes"
  | "students"
  | "courses"
  | "occupancy"
  | "capacity";

type QuickSearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  meta: string[];
};

type QuickSearchResponse = {
  items: QuickSearchResult[];
  error?: string;
};

type QuickSummaryResponse = {
  title?: string;
  lines: string[];
  error?: string;
};

const maxResults = 25;

export async function searchAssistantQuickCommandAction(
  command: AssistantQuickCommand,
  query = "",
): Promise<QuickSearchResponse> {
  const { profile } = await requireAuth();
  const normalizedQuery = normalizeSearch(query);

  if (command === "student") return searchStudents(profile, normalizedQuery);
  if (command === "department") return searchDepartments(profile, normalizedQuery);
  if (command === "class") return searchClasses(profile, normalizedQuery);
  if (command === "dormitory") return searchDormitories(profile, normalizedQuery);

  return { items: [], error: "Desteklenmeyen komut." };
}

export async function getAssistantQuickCommandSummaryAction(
  command: AssistantQuickCommand,
  id: string,
  summaryType: AssistantQuickSummaryType,
): Promise<QuickSummaryResponse> {
  const { profile } = await requireAuth();

  if (command === "student") return getStudentSummary(profile, id, summaryType);
  if (command === "department") return getDepartmentSummary(profile, id, summaryType);
  if (command === "class") return getClassSummary(profile, id, summaryType);
  if (command === "dormitory") return getDormitorySummary(profile, id, summaryType);

  return { lines: [], error: "Desteklenmeyen komut." };
}

async function searchStudents(profile: ProfileRow, query: string): Promise<QuickSearchResponse> {
  const supabase = createSupabaseAdminClient();
  const scope = await getStudentScope(profile);
  if (scope.denied) return { items: [], error: "Bu komut için yetkiniz bulunmamaktadır." };
  if (scope.studentIds && scope.studentIds.length === 0) return { items: [] };
  if (scope.classIds && scope.classIds.length === 0) return { items: [] };

  let studentQuery = supabase
    .from("students")
    .select("id,full_name,identity_number,status,school_class,course_class_id")
    .order("full_name", { ascending: true })
    .limit(maxResults);

  if (scope.studentIds) studentQuery = studentQuery.in("id", scope.studentIds);
  if (scope.classIds) studentQuery = studentQuery.in("course_class_id", scope.classIds);
  if (query) {
    const term = `%${query}%`;
    studentQuery = studentQuery.or(`full_name.ilike.${term},identity_number.ilike.${term},school_class.ilike.${term}`);
  }

  const { data: students, error } = await studentQuery;
  if (error) return { items: [], error: "Talebeler alınamadı." };

  const relations = await getClassDepartmentMaps((students ?? []).map((student) => student.course_class_id).filter(Boolean) as string[]);

  return {
    items: (students ?? []).map((student) => {
      const courseClass = student.course_class_id ? relations.classMap.get(student.course_class_id) ?? null : null;
      const department = courseClass ? relations.departmentMap.get(courseClass.department_id) ?? null : null;

      return {
        id: student.id,
        title: student.full_name,
        subtitle: department?.name ?? "Bölüm yok",
        meta: [courseClass?.name ?? "Sınıf yok", student.school_class ?? "Okul sınıfı yok", statusLabel(student.status)],
      };
    }),
  };
}

async function searchDepartments(profile: ProfileRow, query: string): Promise<QuickSearchResponse> {
  if (profile.role === "veli") return { items: [], error: "Bu komut için yetkiniz bulunmamaktadır." };
  const supabase = createSupabaseAdminClient();
  const allowedDepartmentIds = await getVisibleDepartmentIds(profile);
  if (allowedDepartmentIds && allowedDepartmentIds.length === 0) return { items: [] };

  let departmentQuery = supabase
    .from("departments")
    .select("id,name,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(maxResults);

  if (allowedDepartmentIds) departmentQuery = departmentQuery.in("id", allowedDepartmentIds);
  if (query) departmentQuery = departmentQuery.ilike("name", `%${query}%`);

  const { data: departments, error } = await departmentQuery;
  if (error) return { items: [], error: "Bölümler alınamadı." };

  const stats = await getDepartmentStats((departments ?? []).map((department) => department.id));

  return {
    items: (departments ?? []).map((department) => {
      const stat = stats.get(department.id) ?? { classCount: 0, studentCount: 0, teacherCount: 0 };
      return {
        id: department.id,
        title: department.name,
        meta: [`${stat.classCount} sınıf`, `${stat.studentCount} aktif talebe`, `${stat.teacherCount} hoca`],
      };
    }),
  };
}

async function searchClasses(profile: ProfileRow, query: string): Promise<QuickSearchResponse> {
  if (profile.role === "veli") return { items: [], error: "Bu komut için yetkiniz bulunmamaktadır." };
  const supabase = createSupabaseAdminClient();
  const classIds = await getVisibleClassIds(profile);
  if (classIds && classIds.length === 0) return { items: [] };

  let classQuery = supabase
    .from("classes")
    .select("id,name,department_id,class_teacher_id,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(maxResults);

  if (classIds) classQuery = classQuery.in("id", classIds);
  if (query) classQuery = classQuery.ilike("name", `%${query}%`);

  const { data: classes, error } = await classQuery;
  if (error) return { items: [], error: "Sınıflar alınamadı." };

  const departmentIds = [...new Set((classes ?? []).map((classRow) => classRow.department_id))];
  const teacherIds = (classes ?? []).map((classRow) => classRow.class_teacher_id).filter(Boolean) as string[];
  const classStats = await getClassStats((classes ?? []).map((classRow) => classRow.id));
  const [departmentMap, teacherMap] = await Promise.all([getDepartmentsByIds(departmentIds), getProfilesByIds(teacherIds)]);

  return {
    items: (classes ?? []).map((classRow) => ({
      id: classRow.id,
      title: classRow.name,
      subtitle: departmentMap.get(classRow.department_id)?.name ?? "Bölüm yok",
      meta: [
        `Hoca: ${classRow.class_teacher_id ? (teacherMap.get(classRow.class_teacher_id)?.full_name ?? "-") : "-"}`,
        `${classStats.get(classRow.id) ?? 0} talebe`,
      ],
    })),
  };
}

async function searchDormitories(profile: ProfileRow, query: string): Promise<QuickSearchResponse> {
  if (!canViewDormitories(profile)) return { items: [], error: "Bu komut için yetkiniz bulunmamaktadır." };
  const supabase = createSupabaseAdminClient();
  const departmentIds = await getVisibleDepartmentIds(profile);
  if (departmentIds && departmentIds.length === 0) return { items: [] };

  let dormitoryQuery = supabase
    .from("dormitories")
    .select("id,name,capacity,department_id,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(maxResults);

  if (departmentIds) dormitoryQuery = dormitoryQuery.in("department_id", departmentIds);
  if (query) dormitoryQuery = dormitoryQuery.ilike("name", `%${query}%`);

  const { data: dormitories, error } = await dormitoryQuery;
  if (error) return { items: [], error: "Yatakhaneler alınamadı." };

  const occupancy = await getDormitoryOccupancy((dormitories ?? []).map((dormitory) => dormitory.id));

  return {
    items: (dormitories ?? []).map((dormitory) => {
      const occupied = occupancy.get(dormitory.id) ?? 0;
      return {
        id: dormitory.id,
        title: dormitory.name,
        meta: [`Kapasite: ${dormitory.capacity}`, `Doluluk: ${occupied}`, `Boş: ${Math.max(0, dormitory.capacity - occupied)}`],
      };
    }),
  };
}

async function getStudentSummary(profile: ProfileRow, studentId: string, summaryType: AssistantQuickSummaryType): Promise<QuickSummaryResponse> {
  const student = await getScopedStudent(profile, studentId);
  if (!student) return { lines: [], error: "Bu talebeyi görüntüleme yetkiniz bulunmamaktadır." };

  const title = `${student.full_name} — ${summaryLabel(summaryType)}`;
  if (summaryType === "general") return getStudentGeneralSummary(student, title);
  if (summaryType === "grades") return getStudentGradeSummary(student.id, title);
  if (summaryType === "attendance") return getStudentAttendanceSummary(student.id, title);
  if (summaryType === "guidance") return getStudentGuidanceSummary(profile, student.id, title);
  if (summaryType === "infirmary") return getStudentInfirmarySummary(profile, student.id, title);
  if (summaryType === "term_history") return getStudentTermHistorySummary(student.id, title);

  return { lines: [], error: "Desteklenmeyen özet türü." };
}

async function getDepartmentSummary(profile: ProfileRow, departmentId: string, summaryType: AssistantQuickSummaryType): Promise<QuickSummaryResponse> {
  if (!(await canViewDepartment(profile, departmentId))) return { lines: [], error: "Bu bölümü görüntüleme yetkiniz bulunmamaktadır." };
  const supabase = createSupabaseAdminClient();
  const { data: department } = await supabase.from("departments").select("id,name").eq("id", departmentId).maybeSingle();
  if (!department) return { lines: [], error: "Bölüm bulunamadı." };

  const stats = (await getDepartmentStats([departmentId])).get(departmentId) ?? { classCount: 0, studentCount: 0, teacherCount: 0 };
  const title = `${department.name} — ${summaryLabel(summaryType)}`;

  if (summaryType === "general") {
    return { title, lines: [`Sınıf sayısı: ${stats.classCount}`, `Aktif talebe: ${stats.studentCount}`, `Hoca sayısı: ${stats.teacherCount}`] };
  }
  if (summaryType === "classes") {
    const { data } = await supabase.from("classes").select("name").eq("department_id", departmentId).eq("is_active", true).order("name").limit(20);
    return { title, lines: (data ?? []).map((item) => `- ${item.name}`) };
  }
  if (summaryType === "students") {
    const classIds = await getDepartmentClassIds(departmentId);
    if (classIds.length === 0) return { title, lines: ["Aktif sınıf bulunamadı."] };
    const { data } = await supabase.from("students").select("full_name").in("course_class_id", classIds).eq("status", "active").order("full_name").limit(20);
    return { title, lines: (data ?? []).map((item) => `- ${item.full_name}`) };
  }
  if (summaryType === "attendance") {
    const classIds = await getDepartmentClassIds(departmentId);
    return getAttendanceLinesForClassIds(title, classIds);
  }

  return { title, lines: ["Bu özet türü bölüm için desteklenmiyor."] };
}

async function getClassSummary(profile: ProfileRow, classId: string, summaryType: AssistantQuickSummaryType): Promise<QuickSummaryResponse> {
  if (!(await canViewClass(profile, classId))) return { lines: [], error: "Bu sınıfı görüntüleme yetkiniz bulunmamaktadır." };
  const supabase = createSupabaseAdminClient();
  const { data: classRow } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
  if (!classRow) return { lines: [], error: "Sınıf bulunamadı." };
  const title = `${classRow.name} — ${summaryLabel(summaryType)}`;

  if (summaryType === "general") {
    const count = (await getClassStats([classId])).get(classId) ?? 0;
    const department = (await getDepartmentsByIds([classRow.department_id])).get(classRow.department_id);
    return { title, lines: [`Bölüm: ${department?.name ?? "-"}`, `Aktif talebe: ${count}`] };
  }
  if (summaryType === "students") {
    const { data } = await supabase.from("students").select("full_name,status").eq("course_class_id", classId).eq("status", "active").order("full_name").limit(25);
    return { title, lines: (data ?? []).map((student) => `- ${student.full_name} (${statusLabel(student.status)})`) };
  }
  if (summaryType === "attendance") return getAttendanceLinesForClassIds(title, [classId]);
  if (summaryType === "courses") {
    const { data: classCourses } = await supabase.from("class_courses").select("course_id").eq("class_id", classId).eq("is_active", true);
    const courseIds = [...new Set((classCourses ?? []).map((item) => item.course_id))];
    if (courseIds.length === 0) return { title, lines: ["Aktif ders bulunamadı."] };
    const { data: courses } = await supabase.from("courses").select("name").in("id", courseIds).order("name");
    return { title, lines: (courses ?? []).map((course) => `- ${course.name}`) };
  }
  if (summaryType === "grades") {
    const { data: students } = await supabase.from("students").select("id").eq("course_class_id", classId).eq("status", "active");
    const studentIds = (students ?? []).map((student) => student.id);
    if (studentIds.length === 0) return { title, lines: ["Aktif talebe bulunamadı."] };
    const { data: grades } = await supabase.from("grades").select("grade").in("student_id", studentIds);
    return { title, lines: [`Not kaydı: ${grades?.length ?? 0}`, `Ortalama: ${average((grades ?? []).map((grade) => Number(grade.grade)))}`] };
  }

  return { title, lines: ["Bu özet türü sınıf için desteklenmiyor."] };
}

async function getDormitorySummary(profile: ProfileRow, dormitoryId: string, summaryType: AssistantQuickSummaryType): Promise<QuickSummaryResponse> {
  const dormitory = await getScopedDormitory(profile, dormitoryId);
  if (!dormitory) return { lines: [], error: "Bu yatakhaneyi görüntüleme yetkiniz bulunmamaktadır." };
  const occupancy = (await getDormitoryOccupancy([dormitory.id])).get(dormitory.id) ?? 0;
  const title = `${dormitory.name} — ${summaryLabel(summaryType)}`;

  if (summaryType === "occupancy" || summaryType === "general") {
    return { title, lines: [`Kapasite: ${dormitory.capacity}`, `Doluluk: ${occupancy}`, `Boş kontenjan: ${Math.max(0, dormitory.capacity - occupancy)}`] };
  }
  if (summaryType === "capacity") {
    return { title, lines: [`Boş kontenjan: ${Math.max(0, dormitory.capacity - occupancy)}`] };
  }
  if (summaryType === "students") {
    if (profile.role === "rehberlik") return { title, lines: ["Rehberlik rolü için sadece genel doluluk özeti gösterilir."] };
    const supabase = createSupabaseAdminClient();
    const { data: assignments } = await supabase.from("dormitory_assignments").select("student_id").eq("dormitory_id", dormitory.id).eq("status", "active").limit(25);
    const studentIds = (assignments ?? []).map((assignment) => assignment.student_id);
    if (studentIds.length === 0) return { title, lines: ["Aktif yerleşim bulunamadı."] };
    const { data: students } = await supabase.from("students").select("full_name").in("id", studentIds).order("full_name");
    return { title, lines: (students ?? []).map((student) => `- ${student.full_name}`) };
  }

  return { title, lines: ["Bu özet türü yatakhane için desteklenmiyor."] };
}

async function getStudentGeneralSummary(student: StudentRow & { courseClass: ClassRow | null; department: DepartmentRow | null }, title: string) {
  return {
    title,
    lines: [
      `Bölüm: ${student.department?.name ?? "-"}`,
      `Sınıf: ${student.courseClass?.name ?? "-"}`,
      `Okul sınıfı: ${student.school_class ?? "-"}`,
      `Durum: ${statusLabel(student.status)}`,
      `Veli telefonu: ${student.guardian_phone ?? "-"}`,
    ],
  };
}

async function getStudentGradeSummary(studentId: string, title: string) {
  const supabase = createSupabaseAdminClient();
  const { data: grades } = await supabase.from("grades").select("grade,course_id").eq("student_id", studentId).order("created_at", { ascending: false }).limit(50);
  if (!grades || grades.length === 0) return { title, lines: ["Not kaydı bulunamadı."] };
  const latestCourse = grades[0]?.course_id ? await getCourseName(grades[0].course_id) : "-";
  return { title, lines: [`Not kaydı: ${grades.length}`, `Ortalama: ${average(grades.map((grade) => Number(grade.grade)))}`, `Son not: ${latestCourse} / ${grades[0]?.grade ?? "-"}`] };
}

async function getStudentAttendanceSummary(studentId: string, title: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("attendance_records").select("status").eq("student_id", studentId);
  const records = data ?? [];
  return {
    title,
    lines: [
      `Toplam kayıt: ${records.length}`,
      `Devamsızlık: ${records.filter((record) => record.status === "absent").length}`,
      `Geç: ${records.filter((record) => record.status === "late").length}`,
      `Mazeretli: ${records.filter((record) => record.status === "excused").length}`,
    ],
  };
}

async function getStudentGuidanceSummary(profile: ProfileRow, studentId: string, title: string) {
  if (!["admin", "genel_mudur", "bolum_muduru", "rehberlik"].includes(profile.role)) return { title, lines: ["Bu özet için yetkiniz bulunmamaktadır."] };
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("guidance_interviews").select("id,status,title").eq("student_id", studentId).order("interview_date", { ascending: false }).limit(5);
  if (!data || data.length === 0) return { title, lines: ["Rehberlik kaydı bulunamadı."] };
  return { title, lines: [`Toplam gösterilen kayıt: ${data.length}`, ...data.map((item) => `- ${item.title} (${item.status})`)] };
}

async function getStudentInfirmarySummary(profile: ProfileRow, studentId: string, title: string) {
  if (!["admin", "genel_mudur", "bolum_muduru", "destek_birim_muduru"].includes(profile.role)) return { title, lines: ["Bu özet için yetkiniz bulunmamaktadır."] };
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("infirmary_records").select("record_date,complaint").eq("student_id", studentId).order("record_date", { ascending: false }).limit(5);
  if (!data || data.length === 0) return { title, lines: ["Revir kaydı bulunamadı."] };
  return { title, lines: [`Toplam gösterilen kayıt: ${data.length}`, ...data.map((item) => `- ${item.record_date}: ${item.complaint ?? "Şikayet yok"}`)] };
}

async function getStudentTermHistorySummary(studentId: string, title: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("student_term_snapshots").select("term_id,grade_average,total_grades").eq("student_id", studentId).order("created_at", { ascending: false }).limit(5);
  if (!data || data.length === 0) return { title, lines: ["Dönem geçmişi bulunamadı."] };
  return { title, lines: data.map((item) => `- Dönem: ${item.term_id} / Ortalama: ${item.grade_average ?? "-"} / Not: ${item.total_grades}`) };
}

async function getStudentScope(profile: ProfileRow) {
  if (["admin", "genel_mudur", "rehberlik"].includes(profile.role)) return {};
  if (profile.role === "veli") {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("parent_student_links").select("student_id").eq("parent_profile_id", profile.id);
    return { studentIds: (data ?? []).map((link) => link.student_id) };
  }

  const classIds = await getVisibleClassIds(profile);
  if (classIds) return { classIds };
  return { denied: true };
}

async function getVisibleClassIds(profile: ProfileRow): Promise<string[] | null> {
  if (["admin", "genel_mudur", "rehberlik"].includes(profile.role)) return null;
  const supabase = createSupabaseAdminClient();

  if (profile.role === "bolum_muduru" && profile.department_id) {
    const { data } = await supabase.from("classes").select("id").eq("department_id", profile.department_id).eq("is_active", true);
    return (data ?? []).map((classRow) => classRow.id);
  }

  if (profile.role === "hoca") {
    const [{ data: ownedClasses }, { data: courseClasses }] = await Promise.all([
      supabase.from("classes").select("id").eq("class_teacher_id", profile.id).eq("is_active", true),
      supabase.from("class_courses").select("class_id").eq("teacher_id", profile.id).eq("is_active", true),
    ]);
    return [...new Set([...(ownedClasses ?? []).map((item) => item.id), ...(courseClasses ?? []).map((item) => item.class_id)])];
  }

  return [];
}

async function getVisibleDepartmentIds(profile: ProfileRow): Promise<string[] | null> {
  if (["admin", "genel_mudur", "rehberlik"].includes(profile.role)) return null;
  if (profile.role === "bolum_muduru" && profile.department_id) return [profile.department_id];
  if (profile.role === "hoca") {
    const classIds = await getVisibleClassIds(profile);
    if (!classIds || classIds.length === 0) return [];
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("classes").select("department_id").in("id", classIds);
    return [...new Set((data ?? []).map((item) => item.department_id))];
  }
  if (profile.role === "destek_birim_muduru" && profile.department_id) return [profile.department_id];
  return [];
}

async function getScopedStudent(profile: ProfileRow, studentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: student } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
  if (!student) return null;

  const scope = await getStudentScope(profile);
  if (scope.denied) return null;
  if (scope.studentIds && !scope.studentIds.includes(student.id)) return null;
  if (scope.classIds && (!student.course_class_id || !scope.classIds.includes(student.course_class_id))) return null;

  const { classMap, departmentMap } = await getClassDepartmentMaps(student.course_class_id ? [student.course_class_id] : []);
  const courseClass = student.course_class_id ? classMap.get(student.course_class_id) ?? null : null;
  return { ...student, courseClass, department: courseClass ? departmentMap.get(courseClass.department_id) ?? null : null };
}

async function canViewDepartment(profile: ProfileRow, departmentId: string) {
  const ids = await getVisibleDepartmentIds(profile);
  return ids === null || ids.includes(departmentId);
}

async function canViewClass(profile: ProfileRow, classId: string) {
  const ids = await getVisibleClassIds(profile);
  return ids === null || ids.includes(classId);
}

function canViewDormitories(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik", "destek_birim_muduru"].includes(profile.role);
}

async function getScopedDormitory(profile: ProfileRow, dormitoryId: string): Promise<DormitoryRow | null> {
  if (!canViewDormitories(profile)) return null;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("dormitories").select("*").eq("id", dormitoryId).maybeSingle();
  if (!data) return null;
  const departmentIds = await getVisibleDepartmentIds(profile);
  if (departmentIds && !departmentIds.includes(data.department_id)) return null;
  return data;
}

async function getClassDepartmentMaps(classIds: string[]) {
  const classMap = new Map<string, ClassRow>();
  const departmentMap = new Map<string, DepartmentRow>();
  if (classIds.length === 0) return { classMap, departmentMap };

  const supabase = createSupabaseAdminClient();
  const { data: classes } = await supabase.from("classes").select("*").in("id", [...new Set(classIds)]);
  for (const classRow of classes ?? []) classMap.set(classRow.id, classRow);
  const departmentIds = [...new Set((classes ?? []).map((classRow) => classRow.department_id))];
  const departments = await getDepartmentsByIds(departmentIds);
  return { classMap, departmentMap: departments };
}

async function getDepartmentsByIds(ids: string[]) {
  const map = new Map<string, DepartmentRow>();
  if (ids.length === 0) return map;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("departments").select("*").in("id", [...new Set(ids)]);
  for (const department of data ?? []) map.set(department.id, department);
  return map;
}

async function getProfilesByIds(ids: string[]) {
  const map = new Map<string, ProfileRow>();
  if (ids.length === 0) return map;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("profiles").select("*").in("id", [...new Set(ids)]);
  for (const profile of data ?? []) map.set(profile.id, profile);
  return map;
}

async function getDepartmentStats(departmentIds: string[]) {
  const map = new Map<string, { classCount: number; studentCount: number; teacherCount: number }>();
  if (departmentIds.length === 0) return map;
  const supabase = createSupabaseAdminClient();
  const [{ data: classes }, { data: teachers }] = await Promise.all([
    supabase.from("classes").select("id,department_id").in("department_id", departmentIds).eq("is_active", true),
    supabase.from("profiles").select("id,department_id").in("department_id", departmentIds).eq("role", "hoca").eq("is_active", true),
  ]);
  const classIds = (classes ?? []).map((classRow) => classRow.id);
  const { data: students } = classIds.length > 0
    ? await supabase.from("students").select("course_class_id").in("course_class_id", classIds).eq("status", "active")
    : { data: [] };

  for (const id of departmentIds) {
    const departmentClassIds = new Set((classes ?? []).filter((classRow) => classRow.department_id === id).map((classRow) => classRow.id));
    map.set(id, {
      classCount: departmentClassIds.size,
      studentCount: (students ?? []).filter((student) => student.course_class_id && departmentClassIds.has(student.course_class_id)).length,
      teacherCount: (teachers ?? []).filter((teacher) => teacher.department_id === id).length,
    });
  }

  return map;
}

async function getClassStats(classIds: string[]) {
  const map = new Map<string, number>();
  if (classIds.length === 0) return map;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("students").select("course_class_id").in("course_class_id", classIds).eq("status", "active");
  for (const id of classIds) map.set(id, (data ?? []).filter((student) => student.course_class_id === id).length);
  return map;
}

async function getDepartmentClassIds(departmentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("classes").select("id").eq("department_id", departmentId).eq("is_active", true);
  return (data ?? []).map((classRow) => classRow.id);
}

async function getDormitoryOccupancy(dormitoryIds: string[]) {
  const map = new Map<string, number>();
  if (dormitoryIds.length === 0) return map;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("dormitory_assignments").select("dormitory_id").in("dormitory_id", dormitoryIds).eq("status", "active");
  for (const id of dormitoryIds) map.set(id, (data ?? []).filter((assignment) => assignment.dormitory_id === id).length);
  return map;
}

async function getAttendanceLinesForClassIds(title: string, classIds: string[]): Promise<QuickSummaryResponse> {
  if (classIds.length === 0) return { title, lines: ["Sınıf bulunamadı."] };
  const supabase = createSupabaseAdminClient();
  const { data: sessions } = await supabase.from("attendance_sessions").select("id").in("class_id", classIds);
  const sessionIds = (sessions ?? []).map((session) => session.id);
  if (sessionIds.length === 0) return { title, lines: ["Yoklama kaydı bulunamadı."] };
  const { data: records } = await supabase.from("attendance_records").select("status").in("session_id", sessionIds);
  return {
    title,
    lines: [
      `Oturum: ${sessionIds.length}`,
      `Kayıt: ${records?.length ?? 0}`,
      `Devamsızlık: ${(records ?? []).filter((record) => record.status === "absent").length}`,
    ],
  };
}

async function getCourseName(courseId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("courses").select("name").eq("id", courseId).maybeSingle();
  return data?.name ?? "-";
}

function normalizeSearch(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Aktif",
    passive: "Pasif",
    graduated: "Mezun",
    left: "Ayrıldı",
  };
  return labels[status] ?? status;
}

function summaryLabel(type: AssistantQuickSummaryType) {
  const labels: Record<string, string> = {
    general: "Genel Bilgi",
    grades: "Not Özeti",
    attendance: "Yoklama Özeti",
    guidance: "Rehberlik Özeti",
    infirmary: "Revir Özeti",
    term_history: "Dönem Geçmişi",
    classes: "Sınıflar",
    students: "Öğrenciler",
    courses: "Dersler",
    occupancy: "Doluluk Özeti",
    capacity: "Boş Kontenjan",
  };
  return labels[type] ?? type;
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return "-";
  return (valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2);
}
