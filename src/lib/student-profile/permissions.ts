import type { ClassRow, ProfileRow } from "@/types/database";

export function canManageStudentProfileEntries(profile: ProfileRow, courseClass: Pick<ClassRow, "department_id"> | null) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return Boolean(profile.department_id && courseClass?.department_id === profile.department_id);
  }

  return false;
}
