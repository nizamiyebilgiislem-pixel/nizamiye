import type { ProfileRow } from "@/types/database";

export function canManageCourseBooks(profile: ProfileRow, courseDepartmentId?: string | null) {
  if (!profile.is_active) return false;

  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return courseDepartmentId ? profile.department_id === courseDepartmentId : true;
  }

  if (profile.role === "hoca") {
    return courseDepartmentId ? profile.department_id === courseDepartmentId : true;
  }

  return false;
}

export function canViewCourseBooks(profile: ProfileRow, courseDepartmentId?: string | null) {
  if (!profile.is_active) return false;

  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return courseDepartmentId ? profile.department_id === courseDepartmentId : true;
  }

  if (["veli", "sponsor"].includes(profile.role)) {
    return true;
  }

  return false;
}

export function canManageCourseBookProgress(profile: ProfileRow, classDepartmentId?: string | null) {
  if (!profile.is_active) return false;

  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return classDepartmentId ? profile.department_id === classDepartmentId : true;
  }

  if (profile.role === "hoca") {
    return classDepartmentId ? profile.department_id === classDepartmentId : true;
  }

  return false;
}