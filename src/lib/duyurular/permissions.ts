import type { ProfileRow } from "@/types/database";

export function canViewAnnouncements(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canManageAnnouncements(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}
