import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isGlobalViewRole } from "@/types/rbac";
import type {
  ClassCourseRow,
  ClassRow,
  CourseRow,
  DepartmentRow,
  GradeRow,
  ProfileRow,
  StudentRow,
  WeeklyScheduleSlotRow,
  AcademicTermRow,
} from "@/types/database";

export const DEPARTMENT_CAPACITY = 120;

export type StudentMiniAnalytics = StudentRow & {
  average: number | null;
};

export type ClassAnalytics = ClassRow & {
  department: DepartmentRow | null;
  class_teacher: ProfileRow | null;
  active_student_count: number;
  occupancy_percent: number;
  success_average: number | null;
  active_course_count: number;
  has_schedule: boolean;
  courses: Array<{
    id: string;
    name: string;
    teacher: ProfileRow | null;
  }>;
  students: StudentMiniAnalytics[];
};

export type DepartmentAnalytics = DepartmentRow & {
  department_manager: ProfileRow | null;
  active_class_count: number;
  active_student_count: number;
  teacher_count: number;
  occupancy_percent: number;
  success_average: number | null;
  classes: ClassAnalytics[];
  teachers: ProfileRow[];
  latest_students: StudentMiniAnalytics[];
};

type AnalyticsSource = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  profiles: ProfileRow[];
  students: StudentRow[];
  grades: GradeRow[];
  classCourses: ClassCourseRow[];
  courses: CourseRow[];
  scheduleSlots: WeeklyScheduleSlotRow[];
  activeTerm: AcademicTermRow | null;
};

export async function getDepartmentAnalyticsForProfile(profile: ProfileRow): Promise<DepartmentAnalytics[]> {
  const source = await getAnalyticsSource(profile);
  return buildDepartmentAnalytics(source);
}

export async function getDepartmentAnalyticsById(profile: ProfileRow, departmentId: string) {
  const departments = await getDepartmentAnalyticsForProfile(profile);
  return departments.find((department) => department.id === departmentId) ?? null;
}

export async function getClassAnalyticsById(profile: ProfileRow, classId: string) {
  const departments = await getDepartmentAnalyticsForProfile(profile);

  for (const department of departments) {
    const classRow = department.classes.find((item) => item.id === classId);

    if (classRow) {
      return classRow;
    }
  }

  return null;
}

async function getAnalyticsSource(profile: ProfileRow): Promise<AnalyticsSource> {
  const supabase = await createSupabaseServerClient();
  const departmentsQuery = supabase.from("departments").select("*").order("name", { ascending: true });
  const visibleDepartmentsQuery =
    profile.role === "bolum_muduru" || profile.role === "hoca"
      ? departmentsQuery.eq("id", profile.department_id ?? "")
      : departmentsQuery;

  const [
    { data: departments, error },
    profilesResult,
    studentsResult,
    gradesResult,
    classCoursesResult,
    coursesResult,
    scheduleSlotsResult,
    termsResult,
  ] =
    await Promise.all([
      visibleDepartmentsQuery,
      supabase.from("profiles").select("*"),
      supabase.from("students").select("*").eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("grades").select("*"),
      supabase.from("class_courses").select("*"),
      supabase.from("courses").select("*"),
      supabase.from("weekly_schedule_slots").select("*"),
      supabase.from("academic_terms").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);

  if (error) {
    throw new Error("Bölüm bilgileri alınamadı.");
  }

  const visibleDepartments = departments ?? [];
  const visibleDepartmentIds = visibleDepartments.map((department) => department.id);

  if (visibleDepartmentIds.length === 0) {
    return {
      departments: [],
      classes: [],
      profiles: [],
      students: [],
      grades: [],
      classCourses: [],
      courses: [],
      scheduleSlots: [],
      activeTerm: null,
    };
  }

  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("*")
    .in("department_id", visibleDepartmentIds)
    .order("name", { ascending: true });

  if (classError) {
    throw new Error("Sınıf bilgileri alınamadı.");
  }

  const activeTerm = termsResult.data?.[0] ?? null;

  return {
    departments: visibleDepartments,
    classes: classes ?? [],
    profiles: (profilesResult.data ?? []).filter((profileRow) => {
      if (isGlobalViewRole(profile.role) || profile.role === "rehberlik") {
        return true;
      }

      return profileRow.department_id === profile.department_id;
    }),
    students: studentsResult.data ?? [],
    grades: activeTerm ? (gradesResult.data ?? []).filter((grade) => grade.term_id === activeTerm.id) : gradesResult.data ?? [],
    classCourses: classCoursesResult.data ?? [],
    courses: coursesResult.data ?? [],
    scheduleSlots: scheduleSlotsResult.data ?? [],
    activeTerm,
  };
}

function buildDepartmentAnalytics(source: AnalyticsSource): DepartmentAnalytics[] {
  const departmentMap = new Map(source.departments.map((department) => [department.id, department]));
  const profileMap = new Map(source.profiles.map((profile) => [profile.id, profile]));
  const courseMap = new Map(source.courses.map((course) => [course.id, course]));
  const gradesByStudent = groupGradesByStudent(source.grades);

  const classAnalytics = source.classes.map((classRow) => {
    const students = source.students
      .filter((student) => student.course_class_id === classRow.id)
      .map((student) => attachStudentAverage(student, gradesByStudent));
    const activeCourses = source.classCourses.filter((classCourse) => classCourse.class_id === classRow.id && classCourse.is_active);
    const courses = activeCourses
      .map((classCourse) => {
        const course = courseMap.get(classCourse.course_id);

        if (!course) {
          return null;
        }

        return {
          id: course.id,
          name: course.name,
          teacher: classCourse.teacher_id ? profileMap.get(classCourse.teacher_id) ?? null : null,
        };
      })
      .filter((course): course is { id: string; name: string; teacher: ProfileRow | null } => course !== null);

    return {
      ...classRow,
      department: departmentMap.get(classRow.department_id) ?? null,
      class_teacher: classRow.class_teacher_id ? profileMap.get(classRow.class_teacher_id) ?? null : null,
      active_student_count: students.length,
      occupancy_percent: calculatePercent(students.length, DEPARTMENT_CAPACITY),
      success_average: calculateAverage(students.map((student) => student.average)),
      active_course_count: activeCourses.length,
      has_schedule: source.scheduleSlots.some((slot) => slot.class_id === classRow.id),
      courses,
      students,
    } satisfies ClassAnalytics;
  });

  return source.departments.map((department) => {
    const classes = classAnalytics.filter((classRow) => classRow.department_id === department.id);
    const classIds = new Set(classes.map((classRow) => classRow.id));
    const students = source.students
      .filter((student) => student.course_class_id && classIds.has(student.course_class_id))
      .map((student) => attachStudentAverage(student, gradesByStudent));
    const teachers = source.profiles.filter(
      (profile) => profile.department_id === department.id && profile.role === "hoca" && profile.is_active,
    );

    return {
      ...department,
      department_manager:
        source.profiles.find(
          (profile) => profile.department_id === department.id && profile.role === "bolum_muduru" && profile.is_active,
        ) ?? null,
      active_class_count: classes.filter((classRow) => classRow.is_active).length,
      active_student_count: students.length,
      teacher_count: teachers.length,
      occupancy_percent: calculatePercent(students.length, DEPARTMENT_CAPACITY),
      success_average: calculateAverage(students.map((student) => student.average)),
      classes,
      teachers,
      latest_students: students.slice(0, 5),
    } satisfies DepartmentAnalytics;
  });
}

function groupGradesByStudent(grades: GradeRow[]) {
  const map = new Map<string, GradeRow[]>();

  for (const grade of grades) {
    const list = map.get(grade.student_id) ?? [];
    list.push(grade);
    map.set(grade.student_id, list);
  }

  return map;
}

function attachStudentAverage(student: StudentRow, gradesByStudent: Map<string, GradeRow[]>): StudentMiniAnalytics {
  return {
    ...student,
    average: calculateAverage((gradesByStudent.get(student.id) ?? []).map((grade) => Number(grade.grade))),
  };
}

function calculateAverage(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (validValues.length === 0) {
    return null;
  }

  return Math.round((validValues.reduce((total, value) => total + value, 0) / validValues.length) * 100) / 100;
}

function calculatePercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / total) * 100));
}
