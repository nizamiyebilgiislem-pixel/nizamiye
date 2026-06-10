import type { ProfileRow, TaskRow } from "@/types/database";

const ASSIGNABLE_ROLES = [
  "admin",
  "genel_mudur",
  "bolum_muduru",
  "hoca",
  "rehberlik",
  "kutuphane_gorevlisi",
  "destek_birim_muduru",
  "muhasebe",
] as const;

type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(role: string): role is AssignableRole {
  return ASSIGNABLE_ROLES.includes(role as AssignableRole);
}

export function canViewAllTasks(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru"].includes(profile.role);
}

export function canCreateTask(profile: ProfileRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (profile.role === "bolum_muduru") return true;
  return false;
}

export function canAssignToProfile(actor: ProfileRow, target: ProfileRow) {
  if (["admin", "genel_mudur"].includes(actor.role)) {
    return isAssignableRole(target.role) && target.is_active;
  }
  if (actor.role === "bolum_muduru") {
    return (
      isAssignableRole(target.role) &&
      target.is_active &&
      actor.department_id === target.department_id
    );
  }
  return false;
}

export function canEditTask(profile: ProfileRow, task: TaskRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (task.assigned_by === profile.id) return true;
  return false;
}

export function canUpdateTaskStatus(profile: ProfileRow, task: TaskRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (task.assigned_to === profile.id) return true;
  if (task.assigned_by === profile.id) return true;
  return false;
}

export function canCommentOnTask(profile: ProfileRow, task: TaskRow) {
  if (task.assigned_to === profile.id) return true;
  if (task.assigned_by === profile.id) return true;
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  return false;
}

export function canDeleteTask(profile: ProfileRow, task?: TaskRow) {
  if (["admin", "genel_mudur"].includes(profile.role)) return true;
  if (task && task.assigned_by === profile.id) return true;
  return false;
}
