import type { ProfileRow, LiveSessionRow } from "@/types/database";

const liveSessionStaffRoles = [
  "admin",
  "genel_mudur",
  "bolum_muduru",
  "hoca",
  "rehberlik",
  "destek_birim_muduru",
  "kutuphane_gorevlisi",
] as const;

const sessionCreatorRoles = liveSessionStaffRoles;

export function isLiveSessionStaff(profile: Pick<ProfileRow, "role" | "is_active">) {
  return profile.is_active && liveSessionStaffRoles.includes(profile.role as typeof liveSessionStaffRoles[number]);
}

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
  return isLiveSessionStaff(profile);
}

export function canViewMeeting(profile: ProfileRow, session: LiveSessionRow, participantIds: string[]) {
  if (!isLiveSessionStaff(profile)) return false;
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (session.created_by === profile.id) return true;
  if (session.is_all_staff) return true;
  if (participantIds.includes(profile.id)) return true;
  return false;
}
