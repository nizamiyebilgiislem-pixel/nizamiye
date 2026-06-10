import type { ProfileRow } from "@/types/database";
import { canViewAttendance } from "@/lib/attendance/permissions";
import { canViewDormitories } from "@/lib/dormitory/permissions";
import { canViewLibraryReports } from "@/lib/library/permissions";
import { canViewGuidanceReports } from "@/lib/guidance/permissions";
import { canViewAllTasks } from "@/lib/tasks/permissions";

export function canViewReportCenter(profile: ProfileRow) {
  return profile.role !== "veli";
}

export function canViewStudentReports(profile: ProfileRow) {
  return profile.role !== "veli";
}

export function canViewClassReports(profile: ProfileRow) {
  return profile.role !== "veli";
}

export function canViewDepartmentReports(profile: ProfileRow) {
  return profile.role !== "veli";
}

export function canViewGradeReports(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canViewAttendanceReports(profile: ProfileRow) {
  return canViewAttendance(profile);
}

export function canViewEvaluationReports(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role);
}

export function canViewInfirmaryReports(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "hoca", "destek_birim_muduru"].includes(profile.role);
}

export function canViewDormitoryReports(profile: ProfileRow) {
  return canViewDormitories(profile);
}

export { canViewLibraryReports, canViewGuidanceReports };

export function canViewTaskReports(profile: ProfileRow) {
  return canViewAllTasks(profile);
}

export function canViewRequestReports(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "rehberlik", "destek_birim_muduru"].includes(profile.role);
}

export function canViewDocumentReports(profile: ProfileRow) {
  return profile.role !== "veli";
}
