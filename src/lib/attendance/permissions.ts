import type { ClassRow, ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export function canViewAttendance(profile: ProfileRow) {
  return isGlobalViewRole(profile.role) || ["bolum_muduru", "hoca"].includes(profile.role);
}

export function canManageAttendance(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur" || profile.role === "bolum_muduru" || profile.role === "hoca";
}

export function canManageAttendanceSettings(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur";
}

export function canViewAttendanceClass(profile: ProfileRow, classRow: Pick<ClassRow, "department_id" | "class_teacher_id"> | null) {
  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (!classRow) {
    return false;
  }

  if (profile.role === "bolum_muduru") {
    return classRow.department_id === profile.department_id;
  }

  if (profile.role === "hoca") {
    return classRow.class_teacher_id === profile.id;
  }

  return false;
}

export function canManageAttendanceClass(profile: ProfileRow, classRow: Pick<ClassRow, "department_id" | "class_teacher_id"> | null) {
  return canViewAttendanceClass(profile, classRow);
}
