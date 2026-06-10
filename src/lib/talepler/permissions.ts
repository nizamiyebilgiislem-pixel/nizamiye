import type { ProfileRow, TalepRow } from "@/types/database";
import type { UserRole } from "@/types/rbac";

const talepCreatorRoles: UserRole[] = [
  "admin", "genel_mudur", "bolum_muduru", "rehberlik", "destek_birim_muduru",
];

export function canViewTalepler(profile: ProfileRow) {
  return talepCreatorRoles.includes(profile.role as UserRole);
}

export function canCreateTalep(profile: ProfileRow) {
  return talepCreatorRoles.includes(profile.role as UserRole);
}

export function isHandlerForUnit(profile: ProfileRow, requestedUnit: string): boolean {
  if (profile.role === "destek_birim_muduru" && requestedUnit === "destek") return true;
  if (profile.role === "bolum_muduru" && requestedUnit === profile.department_id) return true;
  return false;
}

export function canManageTalepStatus(profile: ProfileRow, talep: TalepRow): boolean {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (profile.id === talep.assigned_to) return true;
  return isHandlerForUnit(profile, talep.requested_unit);
}

export function canViewTalep(profile: ProfileRow, talep: TalepRow): boolean {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (talep.requested_by === profile.id) return true;
  if (profile.role === "bolum_muduru" && profile.department_id && talep.requested_unit === profile.department_id) return true;
  if (profile.role === "destek_birim_muduru" && talep.requested_unit === "destek") return true;
  if (profile.role === "muhasebe" && talep.requested_unit === "muhasebe") return true;
  return false;
}

export function canEditTalep(profile: ProfileRow, talep: TalepRow): boolean {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (talep.requested_by === profile.id && talep.status === "bekliyor") return true;
  return false;
}
