import type { ClassRow, ProfileRow, StudentRow } from "@/types/database";

export function canCreateStudent(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru"].includes(profile.role);
}

export function canViewArchive(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru"].includes(profile.role);
}

export function canReactivateArchivedStudent(profile: ProfileRow) {
  return ["admin", "genel_mudur"].includes(profile.role);
}

export function canViewStudent(profile: ProfileRow, courseClass: Pick<ClassRow, "department_id"> | null) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (profile.role === "bolum_muduru" || profile.role === "hoca") {
    return Boolean(profile.department_id && courseClass?.department_id === profile.department_id);
  }

  return false;
}

export function canEditStudent(
  profile: ProfileRow,
  student: Pick<StudentRow, "status">,
  courseClass: Pick<ClassRow, "department_id" | "class_teacher_id"> | null,
) {
  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return true;
  }

  if (student.status !== "active") {
    return false;
  }

  if (profile.role === "bolum_muduru") {
    return Boolean(profile.department_id && courseClass?.department_id === profile.department_id);
  }

  if (profile.role === "hoca") {
    return courseClass?.class_teacher_id === profile.id;
  }

  return false;
}
