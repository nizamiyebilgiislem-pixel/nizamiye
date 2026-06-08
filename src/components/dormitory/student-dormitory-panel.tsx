import Link from "next/link";

import { StudentAvatar } from "@/components/students/student-avatar";
import { DormitoryAssignmentStatusBadge } from "@/components/dormitory/dormitory-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DormitoryAssignmentWithRelations } from "@/lib/dormitory/queries";

export function StudentDormitoryPanel({
  currentAssignment,
  history,
  canManage = false,
  studentId,
}: {
  currentAssignment: DormitoryAssignmentWithRelations | null;
  history: DormitoryAssignmentWithRelations[];
  canManage?: boolean;
  studentId: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#093657]">Yatakhane</h3>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Link href={`/yatakhane/yerlesim/yeni?studentId=${studentId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Yerleştir / Değiştir
              </Link>
            </div>
          ) : null}
        </div>

        {currentAssignment ? (
          <div className="rounded-md border border-border bg-[#f8fafc] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#093657]">{currentAssignment.dormitory?.name ?? "-"}</p>
                <p className="text-xs text-muted-foreground">
                  {currentAssignment.floor?.name ?? "-"} · {currentAssignment.room?.name ?? "-"} · {currentAssignment.bed?.bed_no ?? "-"}
                </p>
              </div>
              <DormitoryAssignmentStatusBadge status={currentAssignment.status} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Mini label="Başlangıç" value={currentAssignment.start_date} />
              <Mini label="Bitiş" value={currentAssignment.end_date ?? "-"} />
              <Mini label="Not" value={currentAssignment.note ?? "-"} />
              <Mini label="Atayan" value={currentAssignment.assigned_by_profile?.full_name ?? "-"} />
            </div>
            {canManage ? (
              <div className="mt-3">
                <Link href={`/yatakhane/yerlesim/${currentAssignment.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                  Yerleşimi Sonlandır
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aktif yatak yerleşimi yok.</p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#093657]">Geçmiş yerleşimler</p>
          {history.length > 0 ? (
            history.map((assignment) => (
              <div key={assignment.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={assignment.student?.full_name ?? "Talebe"} photoUrl={assignment.student?.photo_url ?? null} />
                    <div>
                      <p className="text-sm font-medium text-[#093657]">{assignment.dormitory?.name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.floor?.name ?? "-"} · {assignment.room?.name ?? "-"} · {assignment.bed?.bed_no ?? "-"}
                      </p>
                    </div>
                  </div>
                  <DormitoryAssignmentStatusBadge status={assignment.status} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Geçmiş yerleşim yok.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#093657]">{value}</p>
    </div>
  );
}
