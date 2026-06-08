import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { cn } from "@/lib/utils";
import type { StudentRow } from "@/types/database";

type StudentCompactCardProps = {
  student: Pick<StudentRow, "id" | "full_name" | "photo_url" | "status" | "school_class" | "guardian_phone">;
  href?: string;
  showGuardianPhone?: boolean;
  className?: string;
  readOnly?: boolean;
};

export function StudentCompactCard({
  student,
  href,
  showGuardianPhone = true,
  className,
}: StudentCompactCardProps) {
  const targetHref = href ?? `/talebeler/${student.id}`;

  return (
    <Link
      href={targetHref}
      className={cn("flex items-center gap-3 rounded-md border border-border bg-white p-3 shadow-sm transition-colors hover:bg-[#f4f8fc]", className)}
    >
      <StudentAvatar name={student.full_name} photoUrl={student.photo_url} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-[#093657]">{student.full_name}</p>
        {student.school_class ? <p className="truncate text-xs text-muted-foreground">Okul sınıfı: {student.school_class}</p> : null}
        {showGuardianPhone && student.guardian_phone ? <p className="truncate text-xs text-muted-foreground">Veli: {student.guardian_phone}</p> : null}
      </div>
      <div className="shrink-0">
        <StudentStatusBadge status={student.status} />
      </div>
    </Link>
  );
}
