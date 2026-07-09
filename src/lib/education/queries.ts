import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageEducationPlanning, canViewClassSchedule, canViewEducationClass } from "@/lib/education/permissions";
import { isGlobalViewRole } from "@/types/rbac";
import type {
  ClassCourseRow,
  ClassRow,
  CourseRow,
  DepartmentRow,
  ProfileRow,
  WeeklyScheduleSlotRow,
} from "@/types/database";

export type EducationClassRow = ClassRow & {
  department: DepartmentRow | null;
  class_teacher: ProfileRow | null;
  active_class_course_count: number;
  active_schedule_slot_count: number;
  missing_teacher_count: number;
};

export type ClassCourseWithRelations = ClassCourseRow & {
  course: CourseRow | null;
  teacher: ProfileRow | null;
  slot_count: number;
};

export type WeeklyScheduleSlotWithRelations = WeeklyScheduleSlotRow & {
  class_course: ClassCourseWithRelations | null;
  course: CourseRow | null;
  teacher: ProfileRow | null;
};

export type EducationSelectionData = {
  departments: DepartmentRow[];
  classes: EducationClassRow[];
  selectedDepartment: DepartmentRow | null;
  selectedClass: EducationClassRow | null;
};

export type EducationAssignmentData = {
  classRow: EducationClassRow;
  classCourses: ClassCourseWithRelations[];
  availableCourses: CourseRow[];
  availableTeachers: ProfileRow[];
  loadError: string | null;
};

export type EducationScheduleData = {
  classRow: EducationClassRow;
  classCourses: ClassCourseWithRelations[];
  slots: WeeklyScheduleSlotWithRelations[];
  loadError: string | null;
};

export type EducationDashboardSummary = {
  activeClassCount: number;
  assignedClassCount: number;
  scheduledClassCount: number;
  missingTeacherAssignmentCount: number;
};

export async function getEducationSelectionData(profile: ProfileRow, filters: { departmentId?: string; classId?: string } = {}) {
  const classes = await getVisibleEducationClasses(profile);
  const departments = await getVisibleEducationDepartments(profile);
  const filteredClasses = filterClasses(classes, filters.departmentId, filters.classId);
  const selectedDepartmentId = filters.departmentId ?? filteredClasses[0]?.department_id ?? "";
  const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId) ?? null;
  const selectedClass = filteredClasses.find((classRow) => classRow.id === filters.classId) ?? filteredClasses[0] ?? null;

  return {
    departments,
    classes: filteredClasses,
    selectedDepartment,
    selectedClass,
  } satisfies EducationSelectionData;
}

export async function getEducationDashboard(profile: ProfileRow): Promise<{ summary: EducationDashboardSummary; classes: EducationClassRow[] }> {
  const classes = await getVisibleEducationClasses(profile);
  const summary = calculateSummary(classes);

  return { summary, classes };
}

export async function getEducationAssignmentData(profile: ProfileRow, classId: string): Promise<EducationAssignmentData | null> {
  const classRow = await getEducationClassById(profile, classId);
  if (!classRow) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const departmentId = classRow.department_id;
  const [coursesResult, teacherProfilesResult, managerProfilesResult, classCoursesResult, slotsResult] = await Promise.all([
    supabase.from("courses").select("*").eq("department_id", departmentId).eq("is_active", true).order("name", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "hoca").eq("is_active", true).order("full_name", { ascending: true }),
    supabase.from("profiles").select("*").eq("department_id", departmentId).eq("role", "bolum_muduru").eq("is_active", true).order("full_name", { ascending: true }),
    supabase.from("class_courses").select("*").eq("class_id", classId).order("created_at", { ascending: true }),
    supabase.from("weekly_schedule_slots").select("*").eq("class_id", classId),
  ]);

  const loadError = collectEducationLoadError([
    coursesResult.error,
    teacherProfilesResult.error,
    managerProfilesResult.error,
    classCoursesResult.error,
    slotsResult.error,
  ]);

  if (loadError) {
    console.error("[education:getEducationAssignmentData]", loadError, { classId, departmentId });
  }

  const classCourses = await attachClassCourseRelations(classCoursesResult.data ?? [], slotsResult.data ?? []);
  const assignedCourseIds = new Set(classCourses.map((classCourse) => classCourse.course_id));

  const availableTeachers = dedupeProfilesById([
    ...(teacherProfilesResult.data ?? []),
    ...(managerProfilesResult.data ?? []),
  ]);

  return {
    classRow,
    classCourses,
    availableCourses: (coursesResult.data ?? []).filter((course) => !assignedCourseIds.has(course.id)),
    availableTeachers,
    loadError,
  };
}

export async function getEducationScheduleData(profile: ProfileRow, classId: string): Promise<EducationScheduleData | null> {
  const classRow = await getEducationClassById(profile, classId);
  if (!classRow) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [classCoursesResult, slotsResult] = await Promise.all([
    supabase.from("class_courses").select("*").eq("class_id", classId).eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("weekly_schedule_slots").select("*").eq("class_id", classId).order("period_no", { ascending: true }),
  ]);

  const loadError = collectEducationLoadError([classCoursesResult.error, slotsResult.error]);
  if (loadError) {
    console.error("[education:getEducationScheduleData]", loadError, { classId });
  }

  const classCourses = await attachClassCourseRelations(classCoursesResult.data ?? [], slotsResult.data ?? []);
  const allowedScheduleView = canViewClassSchedule(profile, classRow, classCourses);

  if (!allowedScheduleView) {
    return null;
  }

  const slots = await attachScheduleRelations(slotsResult.data ?? [], classCourses);

  return {
    classRow,
    classCourses,
    slots,
    loadError,
  };
}

export type TeacherScheduleSlot = WeeklyScheduleSlotWithRelations & {
  class_name: string;
};

export async function getTeacherScheduleSlots(profileId: string): Promise<TeacherScheduleSlot[]> {
  const supabase = await createSupabaseServerClient();

  const { data: classCourses } = await supabase
    .from("class_courses")
    .select("*")
    .eq("teacher_id", profileId)
    .eq("is_active", true);

  if (!classCourses || classCourses.length === 0) {
    return [];
  }

  const classCourseIds = classCourses.map((cc) => cc.id);
  const classIds = Array.from(new Set(classCourses.map((cc) => cc.class_id)));
  const courseIds = Array.from(new Set(classCourses.map((cc) => cc.course_id)));

  const [{ data: slots }, { data: classes }, { data: courses }, { data: teachers }] = await Promise.all([
    supabase.from("weekly_schedule_slots").select("*").in("class_course_id", classCourseIds).order("period_no", { ascending: true }),
    supabase.from("classes").select("*").in("id", classIds),
    supabase.from("courses").select("*").in("id", courseIds),
    supabase.from("profiles").select("*").in("id", [profileId]),
  ]);

  const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t]));
  const classCourseMap = new Map(classCourses.map((cc) => [cc.id, cc]));

  return (slots ?? []).map((slot) => {
    const cc = classCourseMap.get(slot.class_course_id);
    return {
      ...slot,
      class_course: cc
        ? {
            ...cc,
            course: courseMap.get(cc.course_id) ?? null,
            teacher: teacherMap.get(profileId) ?? null,
            slot_count: 0,
          }
        : null,
      course: cc ? (courseMap.get(cc.course_id) ?? null) : null,
      teacher: teacherMap.get(profileId) ?? null,
      class_name: cc ? (classMap.get(cc.class_id)?.name ?? "-") : "-",
    };
  });
}

export async function getEducationClassById(profile: ProfileRow, classId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: classRow, error } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();

  if (error) {
    throw new Error("Sınıf bilgisi alınamadı.");
  }

  if (!classRow) {
    return null;
  }

  if (!canViewEducationClass(profile, classRow)) {
    return null;
  }

  const [{ data: department }, { data: teacher }] = await Promise.all([
    supabase.from("departments").select("*").eq("id", classRow.department_id).maybeSingle(),
    classRow.class_teacher_id ? supabase.from("profiles").select("*").eq("id", classRow.class_teacher_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const [classCourseData, slotData] = await Promise.all([
    supabase.from("class_courses").select("*").eq("class_id", classRow.id).order("created_at", { ascending: true }),
    supabase.from("weekly_schedule_slots").select("*").eq("class_id", classRow.id),
  ]);

  const loadError = collectEducationLoadError([classCourseData.error, slotData.error]);
  if (loadError) {
    console.error("[education:getEducationClassById]", loadError, { classId });
  }

  const classCourses = await attachClassCourseRelations(classCourseData.data ?? [], slotData.data ?? []);
  return {
    ...classRow,
    department: department ?? null,
    class_teacher: teacher ?? null,
    active_class_course_count: classCourses.filter((row) => row.is_active).length,
    active_schedule_slot_count: (slotData.data ?? []).length,
    missing_teacher_count: classCourses.filter((row) => row.is_active && !row.teacher_id).length,
  } satisfies EducationClassRow;
}

async function getVisibleEducationDepartments(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Bölümler alınamadı.");
  }

  return data ?? [];
}

async function getVisibleEducationClasses(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  const [classesResult, departmentsResult, teachersResult, classCoursesResult, slotsResult] = await Promise.all([
    supabase.from("classes").select("*").order("name", { ascending: true }),
    getVisibleEducationDepartments(profile),
    getTeachersForEducation(profile),
    supabase.from("class_courses").select("*"),
    supabase.from("weekly_schedule_slots").select("*"),
  ]);

  const classes = (classesResult.data ?? []).filter((classRow) => {
    if (isGlobalViewRole(profile.role)) {
      return true;
    }

    if (profile.role === "bolum_muduru" || profile.role === "hoca") {
      return classRow.department_id === profile.department_id;
    }

    return false;
  });

  const departmentMap = new Map(departmentsResult.map((department) => [department.id, department]));
  const teacherMap = new Map(teachersResult.map((teacher) => [teacher.id, teacher]));
  const classCourseMap = groupClassCoursesByClass(classCoursesResult.data ?? [], slotsResult.data ?? []);
  const slotCounts = countSlotsByClass(slotsResult.data ?? []);

  return classes
    .filter((classRow) => canManageEducationPlanning(profile, classRow) || canViewEducationClass(profile, classRow))
    .map((classRow) => {
      const classCourses = classCourseMap.get(classRow.id) ?? [];
      return {
        ...classRow,
        department: departmentMap.get(classRow.department_id) ?? null,
        class_teacher: classRow.class_teacher_id ? teacherMap.get(classRow.class_teacher_id) ?? null : null,
        active_class_course_count: classCourses.filter((classCourse) => classCourse.is_active).length,
        active_schedule_slot_count: slotCounts.get(classRow.id) ?? 0,
        missing_teacher_count: classCourses.filter((classCourse) => classCourse.is_active && !classCourse.teacher_id).length,
      };
    });
}

async function getTeachersForEducation(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("*").in("role", ["hoca", "bolum_muduru"]).eq("is_active", true).order("full_name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    query = query.eq("department_id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Hoca listesi alınamadı.");
  }

  return data ?? [];
}

async function attachClassCourseRelations(classCourses: ClassCourseRow[], slots: WeeklyScheduleSlotRow[]) {
  const supabase = await createSupabaseServerClient();
  const courseIds = Array.from(new Set(classCourses.map((row) => row.course_id)));
  const teacherIds = Array.from(new Set(classCourses.map((row) => row.teacher_id).filter((teacherId): teacherId is string => Boolean(teacherId))));
  const [coursesResult, teachersResult] = await Promise.all([
    courseIds.length > 0 ? supabase.from("courses").select("*").in("id", courseIds) : Promise.resolve({ data: [] as CourseRow[] }),
    teacherIds.length > 0 ? supabase.from("profiles").select("*").in("id", teacherIds) : Promise.resolve({ data: [] as ProfileRow[] }),
  ]);

  const courseMap = new Map((coursesResult.data ?? []).map((course) => [course.id, course]));
  const teacherMap = new Map((teachersResult.data ?? []).map((teacher) => [teacher.id, teacher]));
  const slotCountMap = new Map<string, number>();

  for (const slot of slots) {
    slotCountMap.set(slot.class_course_id, (slotCountMap.get(slot.class_course_id) ?? 0) + 1);
  }

  return classCourses.map((classCourse) => ({
    ...classCourse,
    course: courseMap.get(classCourse.course_id) ?? null,
    teacher: classCourse.teacher_id ? teacherMap.get(classCourse.teacher_id) ?? null : null,
    slot_count: slotCountMap.get(classCourse.id) ?? 0,
  }));
}

async function attachScheduleRelations(slots: WeeklyScheduleSlotRow[], classCourses: ClassCourseWithRelations[]) {
  const classCourseMap = new Map(classCourses.map((classCourse) => [classCourse.id, classCourse]));

  return slots.map((slot) => {
    const classCourse = classCourseMap.get(slot.class_course_id) ?? null;
    return {
      ...slot,
      class_course: classCourse,
      course: classCourse?.course ?? null,
      teacher: classCourse?.teacher ?? null,
    };
  });
}

function countSlotsByClass(slots: WeeklyScheduleSlotRow[]) {
  const counts = new Map<string, number>();

  for (const slot of slots) {
    counts.set(slot.class_id, (counts.get(slot.class_id) ?? 0) + 1);
  }

  return counts;
}

function groupClassCoursesByClass(classCourses: ClassCourseRow[], slots: WeeklyScheduleSlotRow[]) {
  const classCourseByClass = new Map<string, ClassCourseWithRelations[]>();
  const slotCountMap = new Map<string, number>();

  for (const slot of slots) {
    slotCountMap.set(slot.class_course_id, (slotCountMap.get(slot.class_course_id) ?? 0) + 1);
  }

  for (const classCourse of classCourses) {
    const list = classCourseByClass.get(classCourse.class_id) ?? [];
    list.push({
      ...classCourse,
      course: null,
      teacher: null,
      slot_count: slotCountMap.get(classCourse.id) ?? 0,
    });
    classCourseByClass.set(classCourse.class_id, list);
  }

  return classCourseByClass;
}

function filterClasses(classes: EducationClassRow[], departmentId?: string, classId?: string) {
  return classes.filter((classRow) => {
    if (departmentId && classRow.department_id !== departmentId) {
      return false;
    }

    if (classId && classRow.id !== classId) {
      return false;
    }

    return true;
  });
}

function calculateSummary(classes: EducationClassRow[]): EducationDashboardSummary {
  return {
    activeClassCount: classes.filter((classRow) => classRow.is_active).length,
    assignedClassCount: classes.filter((classRow) => classRow.active_class_course_count > 0).length,
    scheduledClassCount: classes.filter((classRow) => classRow.active_schedule_slot_count > 0).length,
    missingTeacherAssignmentCount: classes.reduce((total, classRow) => total + classRow.missing_teacher_count, 0),
  };
}

function collectEducationLoadError(errors: Array<{ code?: string | null; message?: string | null } | null>) {
  const firstError = errors.find((error): error is { code?: string | null; message?: string | null } => Boolean(error));

  if (!firstError) {
    return null;
  }

  if (firstError.code === "42501") {
    return "policy";
  }

  if (firstError.code === "PGRST301") {
    return "policy";
  }

  return "load";
}

function dedupeProfilesById(profiles: ProfileRow[]) {
  return Array.from(new Map(profiles.map((profile) => [profile.id, profile])).values()).sort((left, right) =>
    left.full_name.localeCompare(right.full_name, "tr-TR"),
  );
}
