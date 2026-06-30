import { hasModuleAssignment } from "@/lib/module-assignments/queries";
import type { ProfileRow } from "@/types/database";
import { isGlobalViewRole } from "@/types/rbac";

function isLibraryManager(profile: ProfileRow) {
  return ["admin", "genel_mudur", "kutuphane_gorevlisi"].includes(profile.role);
}

export async function canManageLibrary(profile: ProfileRow) {
  if (isLibraryManager(profile)) return true;
  return hasModuleAssignment(profile.id, "library");
}

export function canViewLibrary(profile: ProfileRow) {
  return isGlobalViewRole(profile.role) || ["kutuphane_gorevlisi", "bolum_muduru", "hoca", "destek_birim_muduru"].includes(profile.role);
}

export function canDeleteLibraryItems(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}

export async function canManageCategories(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export async function canManageBooks(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export async function canManageLoans(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export async function canManageDocuments(profile: ProfileRow) {
  return canManageLibrary(profile);
}

export function canViewLibraryReports(profile: ProfileRow) {
  return canViewLibrary(profile);
}
