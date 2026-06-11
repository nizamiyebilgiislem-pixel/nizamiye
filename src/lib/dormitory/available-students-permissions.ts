import type { ProfileRow } from "@/types/database";

export type AvailableStudentsScope =
  | { allowed: false }
  | { allowed: true; kind: "all" }
  | { allowed: true; kind: "department"; departmentId: string };

export function getAvailableStudentsScope(profile: Pick<ProfileRow, "role" | "department_id"> | null): AvailableStudentsScope {
  if (!profile) return { allowed: false };

  if (profile.role === "admin" || profile.role === "genel_mudur") {
    return { allowed: true, kind: "all" };
  }

  if (profile.role === "bolum_muduru" && profile.department_id) {
    return { allowed: true, kind: "department", departmentId: profile.department_id };
  }

  return { allowed: false };
}
