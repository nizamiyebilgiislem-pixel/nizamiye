import type { ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

export function canViewAnnouncements(profile: ProfileRow) {
  return isGlobalViewRole(profile.role) || ["rehberlik", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canCreateAnnouncements(profile: ProfileRow) {
  return ["admin", "genel_mudur", "rehberlik"].includes(profile.role);
}

export function canManageAnnouncements(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}
