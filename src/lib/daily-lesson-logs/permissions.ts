import type { ProfileRow } from "@/types/database";

export function canCreateDailyLessonLog(profile: ProfileRow) {
  if (!profile.is_active) return false;
  return ["admin", "genel_mudur", "hoca", "bolum_muduru"].includes(profile.role);
}

export function canViewDailyLessonLog(profile: ProfileRow) {
  if (!profile.is_active) return false;
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (["bolum_muduru", "hoca"].includes(profile.role)) return true;
  return false;
}

export function canManageOwnDailyLessonLog(profile: ProfileRow, teacherId: string) {
  if (!profile.is_active) return false;
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (["hoca", "bolum_muduru"].includes(profile.role) && profile.id === teacherId) return true;
  return false;
}

export function canViewDepartmentDailyLessonLogs(profile: ProfileRow, departmentId: string | null) {
  if (!profile.is_active) return false;
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (profile.role === "bolum_muduru" && profile.department_id === departmentId) return true;
  if (profile.role === "hoca" && profile.department_id === departmentId) return true;
  return false;
}

export function canViewWeeklyReport(profile: ProfileRow) {
  if (!profile.is_active) return false;
  return ["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canViewMonthlyReport(profile: ProfileRow) {
  if (!profile.is_active) return false;
  return ["admin", "genel_mudur"].includes(profile.role);
}