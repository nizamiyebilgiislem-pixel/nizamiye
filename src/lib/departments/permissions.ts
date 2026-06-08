import type { ProfileRow } from "@/types/database";

export function canManageDepartments(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur";
}
