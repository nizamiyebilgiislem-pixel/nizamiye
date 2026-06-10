import { hasModuleAssignment } from "@/lib/module-assignments/queries";
import type { ProfileRow } from "@/types/database";

export function canManageModuleAssignments(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}

export async function canManageGuidance(profile: ProfileRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  return hasModuleAssignment(profile.id, "guidance");
}

export async function canManageInfirmary(profile: ProfileRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  return hasModuleAssignment(profile.id, "infirmary");
}

export async function canManageLibrary(profile: ProfileRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  return hasModuleAssignment(profile.id, "library");
}
