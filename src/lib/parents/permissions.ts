import type { ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export function canViewParentDirectory(profile: ProfileRow) {
  return profile.role !== "veli";
}

export function canCreateParentProfile(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur" || profile.role === "bolum_muduru";
}

export function canEditParentProfile(profile: ProfileRow, visibleLinkedStudentCount: number) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return visibleLinkedStudentCount > 0;
  }

  return false;
}

export function canManageParentLinks(profile: ProfileRow, visibleLinkedStudentCount: number) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru") {
    return visibleLinkedStudentCount > 0;
  }

  return false;
}

export function canViewParentDetail(profile: ProfileRow, visibleLinkedStudentCount: number) {
  if (isGlobalViewRole(profile.role)) {
    return true;
  }

  if (profile.role === "rehberlik") {
    return visibleLinkedStudentCount > 0;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return visibleLinkedStudentCount > 0;
  }

  return false;
}

export function canBindParentFromStudentDetail(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur" || profile.role === "bolum_muduru";
}
