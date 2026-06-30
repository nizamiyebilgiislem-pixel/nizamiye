import type { ClassRow, ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export function canManageClasses(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru"].includes(profile.role);
}

export function canViewDepartment(profile: ProfileRow, departmentId: string) {
  if (isGlobalViewRole(profile.role) || profile.role === "rehberlik") {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return profile.department_id === departmentId;
  }

  return false;
}

export function canViewClass(profile: ProfileRow, classRow: Pick<ClassRow, "department_id">) {
  return canViewDepartment(profile, classRow.department_id);
}

export function canEditClass(profile: ProfileRow, classRow: Pick<ClassRow, "department_id">) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return profile.department_id === classRow.department_id;
  }

  return false;
}
