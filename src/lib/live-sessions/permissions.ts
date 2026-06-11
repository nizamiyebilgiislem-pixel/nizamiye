import type { ProfileRow, LiveSessionRow } from "@/types/database";

const sessionCreatorRoles = ["admin", "genel_mudur", "bolum_muduru", "hoca", "destek_birim_muduru"] as const;

export function canCreateSession(profile: ProfileRow) {
  return sessionCreatorRoles.includes(profile.role as typeof sessionCreatorRoles[number]);
}

export function canEditSession(profile: ProfileRow, session: LiveSessionRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (session.created_by === profile.id) return true;
  return false;
}

export function canCancelSession(profile: ProfileRow, session: LiveSessionRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (session.created_by === profile.id) return true;
  return false;
}

export function canDeleteSession(profile: ProfileRow, session: LiveSessionRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (session.created_by === profile.id) return true;
  return false;
}

export function canJoinSession(profile: ProfileRow) {
  return sessionCreatorRoles.includes(profile.role as typeof sessionCreatorRoles[number]);
}
