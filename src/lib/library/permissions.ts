import type { ProfileRow } from "@/types/database";

export function canManageLibrary(profile: ProfileRow) {
  return ["admin", "genel_mudur", "kutuphane_gorevlisi"].includes(profile.role);
}

export function canViewLibrary(profile: ProfileRow) {
  return ["admin", "genel_mudur", "kutuphane_gorevlisi", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canDeleteLibraryItems(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}

export function canManageCategories(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export function canManageBooks(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export function canManageLoans(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export function canManageDocuments(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export function canViewLibraryReports(profile: ProfileRow) {
  return canViewLibrary(profile);
}
