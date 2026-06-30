import type { ClassCourseRow, ClassRow, ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

const managerRoles: Array<ProfileRow["role"]> = ["admin", "genel_mudur", "bolum_muduru"];

export function canViewEducationPlanning(profile: ProfileRow) {
  return profile.role !== "veli";
}

export function canManageEducationPlanning(profile: ProfileRow, classRow?: Pick<ClassRow, "department_id"> | null) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return Boolean(classRow && profile.department_id === classRow.department_id);
  }

  return false;
}

export function canViewEducationClass(profile: ProfileRow, classRow: Pick<ClassRow, "department_id" | "class_teacher_id">) {
  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return profile.department_id === classRow.department_id;
  }

  return false;
}

export function canViewClassAssignments(
  profile: ProfileRow,
  classRow: Pick<ClassRow, "department_id" | "class_teacher_id">,
  classCourse?: Pick<ClassCourseRow, "teacher_id"> | null,
) {
  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === classRow.department_id;
  }

  if (profile.role === "hoca") {
    return profile.department_id === classRow.department_id && (classRow.class_teacher_id === profile.id || classCourse?.teacher_id === profile.id);
  }

  return false;
}

export function canManageClassAssignments(profile: ProfileRow, classRow: Pick<ClassRow, "department_id">) {
  return canManageEducationPlanning(profile, classRow);
}

export function canViewClassSchedule(
  profile: ProfileRow,
  classRow: Pick<ClassRow, "department_id" | "class_teacher_id">,
  classCourses: Array<Pick<ClassCourseRow, "teacher_id">> = [],
) {
  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === classRow.department_id;
  }

  if (profile.role === "hoca") {
    if (profile.department_id !== classRow.department_id) {
      return false;
    }

    if (classRow.class_teacher_id === profile.id) {
      return true;
    }

    return classCourses.some((classCourse) => classCourse.teacher_id === profile.id);
  }

  return false;
}

export function canManageClassSchedule(profile: ProfileRow, classRow: Pick<ClassRow, "department_id">) {
  return canManageEducationPlanning(profile, classRow);
}

export function canEditStudentCourseGrade(
  profile: ProfileRow,
  classRow: Pick<ClassRow, "department_id" | "class_teacher_id">,
  classCourse: Pick<ClassCourseRow, "teacher_id" | "is_active">,
) {
  if (!classCourse.is_active) {
    return false;
  }

  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === classRow.department_id;
  }

  if (profile.role === "hoca") {
    if (profile.department_id !== classRow.department_id) {
      return false;
    }

    return classRow.class_teacher_id === profile.id || classCourse.teacher_id === profile.id;
  }

  return false;
}

export function canViewStudentCourseGrade(
  profile: ProfileRow,
  classRow: Pick<ClassRow, "department_id" | "class_teacher_id">,
  classCourse: Pick<ClassCourseRow, "teacher_id">,
) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === classRow.department_id;
  }

  if (profile.role === "hoca") {
    return profile.department_id === classRow.department_id && (classRow.class_teacher_id === profile.id || classCourse.teacher_id === profile.id);
  }

  return false;
}

export function isManagerRole(role: ProfileRow["role"]) {
  return managerRoles.includes(role);
}
