import type { ProfileRole } from "@/types/rbac";

export class AcademicTermManagementPermissionError extends Error {
  constructor() {
    super("Dönem yönetimi yetkisi bulunmamaktadır.");
    this.name = "AcademicTermManagementPermissionError";
  }
}

export function canManageAcademicTerms(profile: { role: ProfileRole }) {
  return profile.role === "admin" || profile.role === "genel_mudur";
}

export function assertCanManageAcademicTerms(profile: { role: ProfileRole }) {
  if (!canManageAcademicTerms(profile)) {
    throw new AcademicTermManagementPermissionError();
  }
}
