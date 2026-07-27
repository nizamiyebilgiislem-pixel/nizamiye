import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAcademicTerms } from "@/lib/terms/queries";
import { ensureDefaultExamTypesForCourses } from "@/lib/grades/default-exam-types";
import { canEditClassCourseGrades } from "@/lib/grades/permissions";
import type {
  AcademicTermRow,
  ClassCourseRow,
  ClassRow,
  CourseRow,
  DepartmentRow,
  ExamTypeRow,
  ProfileRow,
  StudentRow,
} from "@/types/database";
import type { StudentWithRelations } from "@/lib/students/queries";

export type GradeCourseSummary = {
  classCourseId: string;
  courseId: string;
  courseName: string;
  teacherId: string | null;
  teacherName: string | null;
  isActive: boolean;
  canEdit: boolean;
  examGrades: Array<{
    examTypeId: string;
    examTypeName: string;
    weight: number;
    grade: number | null;
    note: string | null;
  }>;
  average: number | null;
};

export type StudentGradeSummary = {
  terms: AcademicTermRow[];
  selectedTermId: string | null;
  courseSummaries: GradeCourseSummary[];
  generalAverage: number | null;
  classCourses: Array<{
    id: string;
    teacher_id: string | null;
    is_active: boolean;
  }>;
};

export type GradeEntryClassCourseOption = ClassCourseRow & {
  classRow: ClassRow | null;
  course: CourseRow | null;
  teacher: ProfileRow | null;
  examTypes: ExamTypeRow[];
};

export type GradeEntryStudentRow = StudentWithRelations & {
  existingGrade: number | null;
  existingNote: string | null;
};

export type GradeEntryWorkspace = {
  departments: DepartmentRow[];
  classes: ClassRow[];
  classCourses: GradeEntryClassCourseOption[];
  selectedDepartmentId: string;
  selectedClassId: string;
  selectedClassCourseId: string;
  selectedExamTypeId: string;
  selectedDepartment: DepartmentRow | null;
  selectedClass: ClassRow | null;
  selectedClassCourse: GradeEntryClassCourseOption | null;
  selectedExamType: ExamTypeRow | null;
  currentTerm: AcademicTermRow | null;
  students: GradeEntryStudentRow[];
  canSubmit: boolean;
  isReadOnly: boolean;
  lockDepartmentSelection: boolean;
};

export async function getGradeDashboardSummary(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  const departmentFilter =
    profile.role === "bolum_muduru" || profile.role === "hoca" ? profile.department_id ?? "" : undefined;

  const [coursesResult, termsResult, gradesResult, departmentsResult] = await Promise.all([
    departmentFilter
      ? supabase.from("courses").select("*").eq("department_id", departmentFilter).eq("is_active", true)
      : supabase.from("courses").select("*").eq("is_active", true),
    supabase.from("academic_terms").select("*").eq("is_active", true),
    supabase.from("grades").select("id"),
    supabase.from("departments").select("*").eq("is_active", true),
  ]);

  const courses = coursesResult.data ?? [];
  const departments = departmentsResult.data ?? [];

  return {
    activeCourseCount: courses.length,
    activeTermCount: termsResult.data?.length ?? 0,
    gradeCount: gradesResult.data?.length ?? 0,
    departmentCourseCounts: departments
      .filter((department) => !departmentFilter || department.id === departmentFilter)
      .map((department) => ({
        departmentName: department.name,
        count: courses.filter((course) => course.department_id === department.id).length,
      })),
  };
}

export async function getGradeEntryWorkspace(
  profile: ProfileRow,
  filters: { departmentId?: string; classId?: string; classCourseId?: string; examTypeId?: string } = {},
): Promise<GradeEntryWorkspace> {
  const currentTerm = await getCurrentAcademicTermSafe();
  const departments = await getVisibleGradeDepartments(profile);
  const classes = await getVisibleGradeClasses(profile, departments);
  const classCourses = await getVisibleGradeClassCourses(profile, classes);

  const selectedDepartmentId = resolveSelectedDepartmentId(profile, departments, filters.departmentId);
  const classesForDepartment = selectedDepartmentId
    ? classes.filter((classRow) => classRow.department_id === selectedDepartmentId)
    : [];
  const selectedClassId = classesForDepartment.some((classRow) => classRow.id === filters.classId) ? filters.classId ?? "" : "";
  const classCoursesForClass = selectedClassId
    ? classCourses.filter((classCourse) => classCourse.class_id === selectedClassId)
    : [];
  const selectedClassCourseId = classCoursesForClass.some((classCourse) => classCourse.id === filters.classCourseId)
    ? filters.classCourseId ?? ""
    : "";
  const selectedClassCourse = classCourses.find((classCourse) => classCourse.id === selectedClassCourseId) ?? null;
  const examTypesForCourse = selectedClassCourse?.examTypes ?? [];
  const selectedExamTypeId = examTypesForCourse.some((examType) => examType.id === filters.examTypeId) ? filters.examTypeId ?? "" : "";
  const selectedExamType = examTypesForCourse.find((examType) => examType.id === selectedExamTypeId) ?? null;
  const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId) ?? null;
  const selectedClass = classes.find((classRow) => classRow.id === selectedClassId) ?? null;
  const students = selectedClass && selectedClassCourse && selectedExamType
    ? await getGradeEntryStudents(selectedClass, selectedClassCourse, selectedExamType, currentTerm)
    : [];

  return {
    departments,
    classes,
    classCourses,
    selectedDepartmentId,
    selectedClassId,
    selectedClassCourseId,
    selectedExamTypeId,
    selectedDepartment,
    selectedClass,
    selectedClassCourse,
    selectedExamType,
    currentTerm,
    students,
    canSubmit: canEditClassCourseGrades(profile, selectedClass, selectedClassCourse) && Boolean(selectedExamType) && isWritableTerm(currentTerm),
    isReadOnly: profile.role === "destek_birim_muduru",
    lockDepartmentSelection: profile.role === "bolum_muduru" || profile.role === "hoca" || profile.role === "destek_birim_muduru",
  };
}

export async function getStudentsForGradeEntry(profile: ProfileRow, filters: { departmentId?: string; classId?: string }) {
  const supabase = await createSupabaseServerClient();
  let classQuery = supabase.from("classes").select("*").eq("is_active", true).order("name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    classQuery = classQuery.eq("department_id", profile.department_id ?? "");
  }

  const [{ data: classes }, { data: departments }] = await Promise.all([
    classQuery,
    supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true }),
  ]);
  const visibleClasses = (classes ?? []).filter((classRow) => {
    if (filters.departmentId && classRow.department_id !== filters.departmentId) {
      return false;
    }

    return true;
  });
  const selectedClassId = filters.classId ?? visibleClasses[0]?.id;
  const selectedClass = visibleClasses.find((classRow) => classRow.id === selectedClassId) ?? null;
  const students = selectedClass
    ? await getActiveStudentsByClassId(selectedClass.id)
    : [];

  return {
    departments: (departments ?? []).filter((department) => {
      if (profile.role === "admin" || profile.role === "genel_mudur") {
        return true;
      }

      return department.id === profile.department_id;
    }),
    classes: visibleClasses,
    selectedClass,
    students,
  };
}

export async function getStudentGradeSummary(
  profile: ProfileRow,
  student: StudentWithRelations,
  selectedTermId?: string | null,
) {
  const [terms, classCourses] = await Promise.all([
    getAcademicTerms(),
    student.course_class ? getClassCoursesForStudent(student.course_class.id) : Promise.resolve([]),
  ]);
  const fallbackTermId = terms.find((term) => term.is_current && term.status === "active")?.id ?? null;
  const termId = terms.some((term) => term.id === selectedTermId) ? selectedTermId ?? null : fallbackTermId;
  const grades = await getGradesByStudent(student.id, termId);
  const gradeMap = new Map(grades.map((grade) => [`${grade.course_id}:${grade.exam_type_id}`, grade]));
  const courseSummaries = classCourses.map((classCourse) => {
    const course = classCourse.course;
    if (!course) {
      return null;
    }

    const examGrades = classCourse.exam_types.map((examType) => {
      const grade = gradeMap.get(`${course.id}:${examType.id}`);
      return {
        examTypeId: examType.id,
        examTypeName: examType.name,
        weight: Number(examType.weight),
        grade: grade ? Number(grade.grade) : null,
        note: grade?.note ?? null,
      };
    });

    return {
      classCourseId: classCourse.id,
      courseId: course.id,
      courseName: course.name,
      teacherId: classCourse.teacher_id,
      teacherName: classCourse.teacher?.full_name ?? null,
      isActive: classCourse.is_active,
      canEdit: canEditClassCourseGrades(profile, student.course_class!, classCourse),
      examGrades,
      average: calculateWeightedAverage(examGrades),
    };
  }).filter((course): course is GradeCourseSummary => course !== null);

  return {
    terms,
    selectedTermId: termId,
    courseSummaries,
    generalAverage: calculateGeneralAverage(courseSummaries.map((course) => course.average)),
    classCourses: classCourses.map((classCourse) => ({
      id: classCourse.id,
      teacher_id: classCourse.teacher_id,
      is_active: classCourse.is_active,
    })),
  };
}

export async function getClassCoursesForStudent(classId: string) {
  const supabase = await createSupabaseServerClient();
  const [classCoursesResult, coursesResult, teachersResult] = await Promise.all([
    supabase.from("class_courses").select("*").eq("class_id", classId).eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("courses").select("*").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "hoca").eq("is_active", true).order("full_name", { ascending: true }),
  ]);
  const classCourses = classCoursesResult.data ?? [];
  await ensureDefaultExamTypesForCourses(classCourses.map((classCourse) => classCourse.course_id));

  const examTypesResult = await supabase
    .from("exam_types")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const courseMap = new Map((coursesResult.data ?? []).map((course) => [course.id, course]));
  const teacherMap = new Map((teachersResult.data ?? []).map((teacher) => [teacher.id, teacher]));

  return classCourses.map((classCourse) => ({
    ...classCourse,
    course: courseMap.get(classCourse.course_id) ?? null,
    exam_types: (examTypesResult.data ?? []).filter((examType) => examType.course_id === classCourse.course_id),
    teacher: classCourse.teacher_id ? teacherMap.get(classCourse.teacher_id) ?? null : null,
  }));
}

async function getGradesByStudent(studentId: string, termId?: string | null) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("grades").select("*").eq("student_id", studentId);

  if (termId) {
    query = query.eq("term_id", termId);
  } else {
    query = query.is("term_id", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Not kayıtları alınamadı.");
  }

  return data;
}

async function getActiveStudentsByClassId(classId: string): Promise<StudentRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("course_class_id", classId)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error("Sınıf öğrencileri alınamadı.");
  }

  return data;
}

async function getVisibleGradeDepartments(profile: ProfileRow) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("departments").select("*").eq("is_active", true).order("name", { ascending: true });

  if (profile.role === "bolum_muduru" || profile.role === "hoca" || profile.role === "destek_birim_muduru") {
    query = query.eq("id", profile.department_id ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Bölümler alınamadı.");
  }

  return data ?? [];
}

async function getVisibleGradeClasses(profile: ProfileRow, departments: DepartmentRow[]) {
  if (departments.length === 0) {
    return [] as ClassRow[];
  }

  const supabase = await createSupabaseServerClient();
  const departmentIds = departments.map((department) => department.id);
  const { data: classes, error } = await supabase
    .from("classes")
    .select("*")
    .in("department_id", departmentIds)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Sınıflar alınamadı.");
  }

  if (profile.role !== "hoca") {
    return classes ?? [];
  }

  const { data: classCourses, error: classCoursesError } = await supabase
    .from("class_courses")
    .select("class_id")
    .eq("teacher_id", profile.id)
    .eq("is_active", true);

  if (classCoursesError) {
    throw new Error("Hoca ders atamaları alınamadı.");
  }

  const allowedClassIds = new Set((classCourses ?? []).map((classCourse) => classCourse.class_id));
  return (classes ?? []).filter((classRow) => allowedClassIds.has(classRow.id));
}

async function getVisibleGradeClassCourses(profile: ProfileRow, classes: ClassRow[]) {
  if (classes.length === 0) {
    return [] as GradeEntryClassCourseOption[];
  }

  const supabase = await createSupabaseServerClient();
  const classIds = classes.map((classRow) => classRow.id);
  let classCourseQuery = supabase
    .from("class_courses")
    .select("*")
    .in("class_id", classIds)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (profile.role === "hoca") {
    classCourseQuery = classCourseQuery.eq("teacher_id", profile.id);
  }

  const [{ data: classCourses, error: classCoursesError }, { data: courses, error: coursesError }, { data: teachers, error: teachersError }] = await Promise.all([
    classCourseQuery,
    supabase.from("courses").select("*").eq("is_active", true),
    supabase.from("profiles").select("*").eq("role", "hoca").eq("is_active", true),
  ]);

  if (classCoursesError || coursesError || teachersError) {
    throw new Error("Ders atamaları alınamadı.");
  }

  if ((classCourses ?? []).length === 0) {
    return [] as GradeEntryClassCourseOption[];
  }

  await ensureDefaultExamTypesForCourses((classCourses ?? []).map((classCourse) => classCourse.course_id));

  const courseIds = Array.from(new Set((classCourses ?? []).map((classCourse) => classCourse.course_id)));
  const { data: examTypes, error: examTypesError } = await supabase
    .from("exam_types")
    .select("*")
    .in("course_id", courseIds)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (examTypesError) {
    throw new Error("Sınav türleri alınamadı.");
  }

  const classMap = new Map(classes.map((classRow) => [classRow.id, classRow]));
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));
  const teacherMap = new Map((teachers ?? []).map((teacher) => [teacher.id, teacher]));

  return (classCourses ?? []).map((classCourse) => ({
    ...classCourse,
    classRow: classMap.get(classCourse.class_id) ?? null,
    course: courseMap.get(classCourse.course_id) ?? null,
    teacher: classCourse.teacher_id ? teacherMap.get(classCourse.teacher_id) ?? null : null,
    examTypes: (examTypes ?? []).filter((examType) => examType.course_id === classCourse.course_id),
  }));
}

async function getGradeEntryStudents(
  classRow: ClassRow,
  classCourse: GradeEntryClassCourseOption,
  examType: ExamTypeRow,
  currentTerm: AcademicTermRow | null,
) {
  const supabase = await createSupabaseServerClient();
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .eq("course_class_id", classRow.id)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (studentsError) {
    throw new Error("Öğrenciler alınamadı.");
  }

  const studentRows = students ?? [];
  if (studentRows.length === 0) {
    return [] as GradeEntryStudentRow[];
  }

  let gradesQuery = supabase
    .from("grades")
    .select("student_id,grade,note")
    .in("student_id", studentRows.map((student) => student.id))
    .eq("course_id", classCourse.course_id)
    .eq("exam_type_id", examType.id);

  gradesQuery = currentTerm ? gradesQuery.eq("term_id", currentTerm.id) : gradesQuery.is("term_id", null);

  const { data: grades, error: gradesError } = await gradesQuery;

  if (gradesError) {
    throw new Error("Mevcut notlar alınamadı.");
  }

  const gradeMap = new Map((grades ?? []).map((grade) => [grade.student_id, grade]));

  return studentRows.map((student) => {
    const existingGrade = gradeMap.get(student.id);

    return {
      ...student,
      course_class: classRow,
      department: null,
      existingGrade: existingGrade ? Number(existingGrade.grade) : null,
      existingNote: existingGrade?.note ?? null,
    };
  });
}

function resolveSelectedDepartmentId(profile: ProfileRow, departments: DepartmentRow[], requestedDepartmentId?: string) {
  if (departments.length === 0) {
    return "";
  }

  if (requestedDepartmentId && departments.some((department) => department.id === requestedDepartmentId)) {
    return requestedDepartmentId;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca" || profile.role === "destek_birim_muduru") {
    return departments[0]?.id ?? "";
  }

  return "";
}

function isWritableTerm(term: AcademicTermRow | null) {
  return Boolean(term && term.is_active && term.status === "active");
}

async function getCurrentAcademicTermSafe() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("academic_terms").select("*").eq("is_current", true).maybeSingle();

  if (error) {
    throw new Error("Aktif dönem alınamadı.");
  }

  return data as AcademicTermRow | null;
}

function calculateWeightedAverage(items: Array<{ grade: number | null; weight: number }>) {
  const gradedItems = items.filter((item) => item.grade !== null);
  const totalWeight = gradedItems.reduce((total, item) => total + item.weight, 0);

  if (gradedItems.length === 0 || totalWeight === 0) {
    return null;
  }

  return roundAverage(gradedItems.reduce((total, item) => total + Number(item.grade) * item.weight, 0) / totalWeight);
}

function calculateGeneralAverage(averages: Array<number | null>) {
  const valid = averages.filter((average): average is number => average !== null);

  if (valid.length === 0) {
    return null;
  }

  return roundAverage(valid.reduce((total, average) => total + average, 0) / valid.length);
}

function roundAverage(value: number) {
  return Math.round(value * 100) / 100;
}
