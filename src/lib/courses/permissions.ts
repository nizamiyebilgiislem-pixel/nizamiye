import type { ClassRow, ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export function canManageDepartmentCourses(profile: ProfileRow, departmentId: string) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === departmentId;
  }

  return false;
}

export function canViewDepartmentCourses(profile: ProfileRow, departmentId: string) {
  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return profile.department_id === departmentId;
  }

  return false;
}

export function canManageClassCourses(profile: ProfileRow, classRow: Pick<ClassRow, "department_id" | "class_teacher_id">) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === classRow.department_id;
  }

  if (profile.role === "hoca") {
    return classRow.class_teacher_id === profile.id;
  }

  return false;
}
