import type { ClassCourseRow, ClassRow, ProfileRow, StudentRow } from "@/types/database";

export function canManageGradeSettings(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}

export function canViewDepartmentGrades(profile: ProfileRow, departmentId: string) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return profile.department_id === departmentId;
  }

  return false;
}

export function canEditStudentGrades(
  profile: ProfileRow,
  student: Pick<StudentRow, "status">,
  _courseClass: Pick<ClassRow, "department_id" | "class_teacher_id"> | null,
  classCourses: Array<Pick<ClassCourseRow, "teacher_id">> = [],
) {
  if (student.status !== "active") {
    return false;
  }

  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "hoca") {
    return classCourses.some((classCourse) => classCourse.teacher_id === profile.id);
  }

  return false;
}

export function canViewStudentGrades(profile: ProfileRow, courseClass: Pick<ClassRow, "department_id"> | null) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return Boolean(profile.department_id && courseClass?.department_id === profile.department_id);
  }

  return false;
}
