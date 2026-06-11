import type { ProfileRow } from "@/types/database";

export async function canManageGuidance(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik"].includes(profile.role);
}

export function canViewGuidance(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canViewGuidanceAsParent(profile: ProfileRow) {
  return profile.role === "veli";
}

export async function canViewPrivateNotes(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik"].includes(profile.role);
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

