import { StudentCompactCard } from "@/components/students/student-compact-card";
import type { StudentMiniAnalytics } from "@/lib/departments/analytics";

export function StudentMiniCard({ student }: { student: StudentMiniAnalytics }) {
  return <StudentCompactCard student={student} showGuardianPhone={false} />;
}
