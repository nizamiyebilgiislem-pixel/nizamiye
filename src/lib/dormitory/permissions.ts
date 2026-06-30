import type { ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export function canManageDormitories(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru"].includes(profile.role);
}

export function canDeleteDormitories(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}

export function canViewDormitories(profile: ProfileRow) {
  return isGlobalViewRole(profile.role) || ["bolum_muduru", "hoca"].includes(profile.role);
}

export function canManageDormitoryAssignments(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru"].includes(profile.role);
}

export function canViewDormitoryForStudents(profile: ProfileRow, studentDepartmentId: string | null) {
  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return Boolean(profile.department_id && studentDepartmentId === profile.department_id);
  }

  return false;
}
