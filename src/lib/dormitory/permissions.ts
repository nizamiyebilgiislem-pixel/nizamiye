import type { ProfileRow } from "@/types/database";

export function canViewDormitoryModule(profile: ProfileRow) {
  return profile.role !== "veli";
}

export function canManageDormitories(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur";
}

export function canManageDormitoryStructure(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur" || profile.role === "bolum_muduru";
}

export function canManageDormitoryAssignments(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur" || profile.role === "bolum_muduru";
}

export function canViewDormitoryAssignments(profile: ProfileRow) {
  return profile.role === "admin" || profile.role === "genel_mudur" || profile.role === "bolum_muduru" || profile.role === "hoca";
}

export function canViewStudentDormitory(profile: ProfileRow) {
  return profile.role !== "veli" ? true : false;
}

export function canViewDormitoryReports(profile: ProfileRow) {
  return profile.role !== "veli";
}
