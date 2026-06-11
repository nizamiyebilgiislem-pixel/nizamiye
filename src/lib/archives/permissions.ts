import type { ProfileRow } from "@/types/database";

export function canManageArchives(profile: Pick<ProfileRow, "role">) {
  return profile.role === "admin" || profile.role === "genel_mudur";
}

export function assertCanManageArchives(profile: Pick<ProfileRow, "role">) {
  if (!canManageArchives(profile)) {
    throw new Error("Arşiv merkezine erişim yetkiniz yok.");
  }
}
