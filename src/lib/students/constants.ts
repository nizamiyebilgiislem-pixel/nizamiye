import type { StudentStatus } from "@/types/rbac";

export const studentStatusLabels: Record<StudentStatus, string> = {
  active: "Aktif",
  passive: "Pasif",
  graduated: "Mezun",
  left: "Ayrıldı",
};

export const archivedStudentStatuses: StudentStatus[] = ["passive", "graduated", "left"];
