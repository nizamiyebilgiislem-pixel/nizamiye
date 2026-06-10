import { hasModuleAssignment } from "@/lib/module-assignments/queries";
import type { ProfileRow } from "@/types/database";

function isGuidanceManager(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik"].includes(profile.role);
}

export async function canManageGuidance(profile: ProfileRow) {
  if (isGuidanceManager(profile)) return true;
  return hasModuleAssignment(profile.id, "guidance");
}

export function canViewGuidance(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canViewGuidanceAsParent(profile: ProfileRow) {
  return profile.role === "veli";
}

export async function canViewPrivateNotes(profile: ProfileRow) {
  if (isGuidanceManager(profile)) return true;
  return hasModuleAssignment(profile.id, "guidance");
}

export async function canManageInterviews(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export async function canManageFollowUps(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export async function canManageSurveys(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export async function canManageActivities(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export function canViewGuidanceReports(profile: ProfileRow) {
  return canViewGuidance(profile);
}


