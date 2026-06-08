import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { buttonVariants } from "@/components/ui/button";
import { canEditStudentEvaluations } from "@/lib/evaluations/permissions";
import type { EvaluationEntryStudent } from "@/lib/evaluations/queries";
import { cn } from "@/lib/utils";
import type { ClassRow, ProfileRow } from "@/types/database";

export function EvaluationEntryList({
  students,
  profile,
  selectedClass,
}: {
  students: EvaluationEntryStudent[];
  profile: ProfileRow;
  selectedClass: ClassRow | null;
}) {
  return (
    <div className="grid gap-3">
      {students.map((student) => {
        const editable = canEditStudentEvaluations(profile, student, selectedClass);
        return (
          <div key={student.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <StudentAvatar name={student.full_name} photoUrl={student.photo_url} previewable />
              <div>
                <p className="font-medium">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">{student.course_class?.name ?? "-"} · Son kanaat: {student.latest_evaluation ? formatDate(student.latest_evaluation.created_at) : "-"}</p>
                <p className="text-sm text-muted-foreground">{student.latest_evaluation?.general_opinion ?? "Kanaat özeti yok."}</p>
              </div>
            </div>
            {editable ? (
              <Link href={`/kanaat-sistemi/kanaat-girisi/${student.id}`} className={cn(buttonVariants())}>
                Kanaat Gir / Düzenle
              </Link>
            ) : (
              <Link href={`/talebeler/${student.id}`} className={cn(buttonVariants({ variant: "secondary" }))}>
                Görüntüle
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(value));
}
