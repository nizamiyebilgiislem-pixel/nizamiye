import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { DormitoryAssignmentStatusBadge } from "@/components/dormitory/dormitory-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DormitoryBedWithRelations } from "@/lib/dormitory/queries";

export function DormitoryBedCard({
  bed,
  showActions = true,
}: {
  bed: DormitoryBedWithRelations;
  showActions?: boolean;
}) {
  const occupied = Boolean(bed.assignment && bed.assignment.status === "active");
  const variantClasses = occupied
    ? "border-[#093657]/20 bg-[#093657]/6"
    : bed.is_active
      ? "border-emerald-200 bg-emerald-50/50"
      : "border-slate-200 bg-slate-100";

  return (
    <Card className={cn("shadow-sm", variantClasses)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#093657]">{bed.bed_no}</p>
            {bed.note ? <p className="text-xs text-muted-foreground">{bed.note}</p> : null}
          </div>
          <DormitoryAssignmentStatusBadge status={bed.is_active ? (occupied ? "active" : "vacant") : "inactive"} />
        </div>

        {occupied && bed.assignment?.student ? (
          <div className="flex items-start gap-3">
              <StudentAvatar name={bed.assignment.student.full_name} photoUrl={bed.assignment.student.photo_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#093657]">{bed.assignment.student.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {bed.assignment.student.department?.name ?? "Bölüm yok"} · {bed.assignment.student.course_class?.name ?? "Sınıf yok"}
                </p>
                <p className="text-xs text-muted-foreground">Başlangıç: {bed.assignment.start_date}</p>
              </div>
            </div>
        ) : (
          <p className="text-sm text-muted-foreground">{bed.is_active ? "Boş yatak" : "Pasif yatak"}</p>
        )}

        {showActions && bed.is_active ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/yatakhane/yerlesim/yeni?bedId=${bed.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Talebe Yerleştir
            </Link>
            {occupied && bed.assignment ? (
              <Link href={`/yatakhane/yerlesim/${bed.assignment.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                Yerleşimi Sonlandır
              </Link>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
