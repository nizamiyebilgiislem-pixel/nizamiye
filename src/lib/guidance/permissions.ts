import type { ProfileRow } from "@/types/database";

export function canManageGuidance(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik"].includes(profile.role);
}

export function canViewGuidance(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canViewGuidanceAsParent(profile: ProfileRow) {
  return profile.role === "veli";
}

export function canViewPrivateNotes(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik"].includes(profile.role);
}

export function canManageInterviews(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export function canManageFollowUps(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export function canManageSurveys(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export function canManageActivities(profile: ProfileRow) {
  return canManageGuidance(profile);
}

export function canViewGuidanceReports(profile: ProfileRow) {
  return canViewGuidance(profile);
}


