import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DepartmentRow,
  ProfileRow,
  StudentRow,
  WeeklyScheduleSlotRow,
} from "@/types/database";

export type ClassTeacherDashboardClass = {
  id: string;
  name: string;
  department_id: string;
  department_name: string | null;
  active_student_count: number;
  today_attendance_taken: boolean;
  has_schedule: boolean;
  missing_evaluation_count: number;
};

export type ClassTeacherDashboardData = {
  classes: ClassTeacherDashboardClass[];
  students: Array<StudentRow & { department_name: string | null }>;
  today_date: string;
};

export type CourseTeacherCourse = {
  id: string;
  course_id: string;
  course_name: string;
  class_id: string;
  class_name: string;
  department_name: string | null;
  is_active: boolean;
};

export type CourseTeacherDashboardData = {
  courses: CourseTeacherCourse[];
  today_schedule: WeeklyScheduleSlotRow[];
  today_date: string;
};

export type DepartmentManagerClassStats = {
  id: string;
  name: string;
  class_teacher_name: string | null;
  active_student_count: number;
  today_attendance_taken: boolean;
  has_schedule: boolean;
};

export type DepartmentManagerDashboardData = {
  department: DepartmentRow | null;
  active_student_count: number;
  active_class_count: number;
  active_teacher_count: number;
  missing_evaluation_count: number;
  open_talep_count: number;
  classes: DepartmentManagerClassStats[];
  today_date: string;
  has_department: boolean;
};

function getTodayDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  return `${year}-${month}-${day}`;
}

export async function getDepartmentManagerDashboardData(profile: ProfileRow): Promise<DepartmentManagerDashboardData> {
  const supabase = await createSupabaseServerClient();
  const today = getTodayDateString();
  const departmentId = profile.department_id;

  if (!departmentId) {
    return {
      department: null,
      active_student_count: 0,
      active_class_count: 0,
      active_teacher_count: 0,
      missing_evaluation_count: 0,
      open_talep_count: 0,
      classes: [],
      today_date: today,
      has_department: false,
    };
  }

  const [departmentResult, classesResult, studentsResult, profilesResult, evaluationsResult, sessionsResult, taleplerResult, activeTermsResult] = await Promise.all([
    supabase.from("departments").select("id, name, is_active").eq("id", departmentId).maybeSingle(),
    supabase.from("classes").select("id, name, department_id, is_active, class_teacher_id").eq("department_id", departmentId).order("name", { ascending: true }),
    supabase.from("students").select("id, full_name, status, course_class_id").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role, department_id").eq("department_id", departmentId).eq("is_active", true),
    supabase.from("student_evaluations").select("id, student_id, term_id"),
    supabase.from("attendance_sessions").select("id, class_id, attendance_type, attendance_date").eq("attendance_date", today),
    supabase.from("talepler").select("id, status").or(`requested_unit.eq.${departmentId},requested_by.eq.${profile.id}`),
    supabase.from("academic_terms").select("id, name, is_active").eq("is_active", true).order("created_at", { ascending: false }),
  ]);

  const department = departmentResult.data;
  const classes = classesResult.data ?? [];
  const students = studentsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const evaluations = evaluationsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const talepler = taleplerResult.data ?? [];

  const classIds = new Set(classes.map((c) => c.id));
  const activeClasses = classes.filter((c) => c.is_active);

  const classStudents = students.filter((s) => s.course_class_id && classIds.has(s.course_class_id));
  const activeStudents = classStudents.filter((s) => s.status === "active");
  const hocaProfiles = profiles.filter((p) => p.role === "hoca");

  const dailySessionClassIds = new Set(
    sessions.filter((s) => s.attendance_type === "daily").map((s) => s.class_id),
  );

  const visibleStudentIds = new Set(classStudents.map((s) => s.id));
  const activeTermIds = new Set((activeTermsResult.data ?? []).map((t) => t.id));
  const evaluatedStudentIds = new Set(
    evaluations
      .filter((e) => activeTermIds.has(e.term_id) && visibleStudentIds.has(e.student_id))
      .map((e) => e.student_id),
  );

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const classStats: DepartmentManagerClassStats[] = activeClasses.map((c) => ({
    id: c.id,
    name: c.name,
    class_teacher_name: c.class_teacher_id ? profileMap.get(c.class_teacher_id)?.full_name ?? null : null,
    active_student_count: classStudents.filter((s) => s.course_class_id === c.id).length,
    today_attendance_taken: dailySessionClassIds.has(c.id),
    has_schedule: false,
  }));

  const openTalepCount = talepler.filter((t) => !["tamamlandi", "iptal_edildi", "reddedildi"].includes(t.status)).length;

  return {
    department: department as DepartmentRow | null,
    active_student_count: activeStudents.length,
    active_class_count: activeClasses.length,
    active_teacher_count: hocaProfiles.length,
    missing_evaluation_count: activeStudents.filter((s) => !evaluatedStudentIds.has(s.id)).length,
    open_talep_count: openTalepCount,
    classes: classStats,
    today_date: today,
    has_department: true,
  };
}

export async function getClassTeacherDashboardData(profile: ProfileRow): Promise<ClassTeacherDashboardData> {
  const supabase = await createSupabaseServerClient();
  const today = getTodayDateString();

  const [classesResult, departmentsResult, evaluationsResult, sessionsResult, scheduleResult, activeTermsResult] = await Promise.all([
    supabase.from("classes").select("id, name, department_id, is_active, class_teacher_id").eq("class_teacher_id", profile.id).order("name", { ascending: true }),
    supabase.from("departments").select("id, name"),
    supabase.from("student_evaluations").select("id, student_id, term_id"),
    supabase.from("attendance_sessions").select("id, class_id, attendance_type, attendance_date").eq("attendance_date", today),
    supabase.from("weekly_schedule_slots").select("id, class_id"),
    supabase.from("academic_terms").select("id, name, is_active").eq("is_active", true).order("created_at", { ascending: false }),
  ]);

  const classes = classesResult.data ?? [];
  const departments = departmentsResult.data ?? [];
  const evaluations = evaluationsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const scheduleSlots = scheduleResult.data ?? [];

  if (classes.length === 0) {
    return { classes: [], students: [], today_date: today };
  }

  const classIds = new Set(classes.map((c) => c.id));
  const departmentMap = new Map(departments.map((d) => [d.id, d]));

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, status, photo_url, course_class_id")
    .eq("status", "active")
    .in("course_class_id", [...classIds]);

  const classStudents = (students ?? []).filter((s) => s.course_class_id && classIds.has(s.course_class_id));
  const visibleStudentIds = new Set(classStudents.map((s) => s.id));
  const activeTermIds = new Set((activeTermsResult.data ?? []).map((t) => t.id));
  const evaluatedStudentIds = new Set(
    evaluations
      .filter((e) => activeTermIds.has(e.term_id) && visibleStudentIds.has(e.student_id))
      .map((e) => e.student_id),
  );

  const dailySessionClassIds = new Set(
    sessions.filter((s) => s.attendance_type === "daily").map((s) => s.class_id),
  );

  const scheduleClassIds = new Set(scheduleSlots.map((s) => s.class_id));

  const dashboardClasses: ClassTeacherDashboardClass[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    department_id: c.department_id,
    department_name: departmentMap.get(c.department_id)?.name ?? null,
    active_student_count: classStudents.filter((s) => s.course_class_id === c.id).length,
    today_attendance_taken: dailySessionClassIds.has(c.id),
    has_schedule: scheduleClassIds.has(c.id),
    missing_evaluation_count: classStudents
      .filter((s) => s.course_class_id === c.id)
      .filter((s) => !evaluatedStudentIds.has(s.id)).length,
  }));

  return {
    classes: dashboardClasses,
    students: classStudents.map((s) => ({
      ...(s as StudentRow),
      department_name: s.course_class_id ? departmentMap.get(classes.find((c) => c.id === s.course_class_id)?.department_id ?? "")?.name ?? null : null,
    })),
    today_date: today,
  };
}

export async function getCourseTeacherDashboardData(profile: ProfileRow): Promise<CourseTeacherDashboardData> {
  const supabase = await createSupabaseServerClient();
  const today = getTodayDateString();

  const [classCoursesResult, coursesResult, classesResult, departmentsResult, scheduleResult] = await Promise.all([
    supabase.from("class_courses").select("id, course_id, class_id, teacher_id, is_active").eq("teacher_id", profile.id).eq("is_active", true),
    supabase.from("courses").select("id, name"),
    supabase.from("classes").select("id, name, department_id"),
    supabase.from("departments").select("id, name"),
    supabase.from("weekly_schedule_slots").select("id, class_id, class_course_id"),
  ]);

  const classCourses = classCoursesResult.data ?? [];
  const courses = coursesResult.data ?? [];
  const classes = classesResult.data ?? [];
  const departments = departmentsResult.data ?? [];
  const scheduleSlots = scheduleResult.data ?? [];

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const departmentMap = new Map(departments.map((d) => [d.id, d]));
  const classCourseIds = new Set(classCourses.map((cc) => cc.id));

  const teacherCourses: CourseTeacherCourse[] = classCourses.map((cc) => {
    const course = courseMap.get(cc.course_id);
    const classRow = classMap.get(cc.class_id);
    return {
      id: cc.id,
      course_id: cc.course_id,
      course_name: course?.name ?? "Bilinmeyen ders",
      class_id: cc.class_id,
      class_name: classRow?.name ?? "Bilinmeyen sınıf",
      department_name: classRow ? departmentMap.get(classRow.department_id)?.name ?? null : null,
      is_active: cc.is_active,
    };
  });

  const todaySchedule = scheduleSlots.filter((slot) => classCourseIds.has(slot.class_course_id));

  return {
    courses: teacherCourses,
    today_schedule: todaySchedule as WeeklyScheduleSlotRow[],
    today_date: today,
  };
}
