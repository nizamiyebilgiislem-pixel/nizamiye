import type { ProfileRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

export const staffProfileRoles: UserRole[] = ["genel_mudur", "bolum_muduru", "hoca"];

export function canCreateStaffProfile(profile: ProfileRow) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }
  return profile.role === "bolum_muduru" && Boolean(profile.department_id);
}

export function canEditStaffProfile(profile: ProfileRow, target: ProfileRow) {
  if (profile.role === "admin") {
    return true;
  }

  if (profile.role === "genel_mudur") {
    return target.role !== "admin" && target.role !== "genel_mudur";
  }

  if (profile.role === "bolum_muduru") {
    return (
      target.role === "hoca" &&
      Boolean(profile.department_id) &&
      target.department_id === profile.department_id
    );
  }

  return false;
}

export function canViewStaffProfile(profile: ProfileRow, target: ProfileRow) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    if (target.role !== "hoca") {
      return false;
    }
    return Boolean(profile.department_id && target.department_id === profile.department_id);
  }

  return false;
}

export function canManageUserProfile(profile: ProfileRow, target: ProfileRow) {
  if (profile.role === "admin") {
    return true;
  }

  if (profile.role === "genel_mudur") {
    return target.role !== "admin" && target.role !== "genel_mudur";
  }

  return false;
}

export function getCreatableRoles(profile: ProfileRow): UserRole[] {
  if (profile.role === "admin") {
    return ["genel_mudur", "yonetim", "bolum_muduru", "hoca", "destek_birim_muduru", "rehberlik"];
  }

  if (profile.role === "genel_mudur") {
    return ["yonetim", "bolum_muduru", "hoca", "destek_birim_muduru", "rehberlik"];
  }

  if (profile.role === "bolum_muduru") {
    return ["hoca"];
  }

  return [];
}

export function canAssignRole(profile: ProfileRow, role: UserRole) {
  return getCreatableRoles(profile).includes(role);
}
