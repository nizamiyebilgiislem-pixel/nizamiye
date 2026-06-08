import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DormitorySummaryGrid } from "@/components/dormitory/dormitory-summary-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { endDormitoryAssignmentAction } from "@/lib/dormitory/actions";
import { canManageDormitoryAssignments, canViewDormitoryModule } from "@/lib/dormitory/permissions";
import { getDormitoryAssignmentById } from "@/lib/dormitory/queries";
import { cn } from "@/lib/utils";

type DormitoryAssignmentDetailPageProps = {
  params: Promise<{ assignmentId: string }>;
};

export default async function DormitoryAssignmentDetailPage({ params }: DormitoryAssignmentDetailPageProps) {
  const { assignmentId } = await params;
  const { profile } = await requireAuth();
  if (!canViewDormitoryModule(profile)) {
    redirect("/veli");
  }

  const assignment = await getDormitoryAssignmentById(profile, assignmentId);
  if (!assignment) {
    notFound();
  }

  const canManage = canManageDormitoryAssignments(profile);

  async function submitAction(formData: FormData) {
    "use server";
    await endDormitoryAssignmentAction(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yatakhane" title="Yerleşim Detayı" description={assignment.student?.full_name ?? "Talebe yerleşimi"} />

      <DormitorySummaryGrid
        items={[
          { label: "Yatakhane", value: assignment.dormitory?.name ?? "-" },
          { label: "Kat", value: assignment.floor?.name ?? "-" },
          { label: "Oda", value: assignment.room?.name ?? "-" },
          { label: "Yatak", value: assignment.bed?.bed_no ?? "-" },
          { label: "Başlangıç", value: assignment.start_date },
          { label: "Durum", value: assignment.status === "active" ? "Aktif" : "Sonlandı" },
        ]}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Link href={`/talebeler/${assignment.student_id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Talebe Detayı
            </Link>
            {canManage ? (
              <form action={submitAction}>
                <input type="hidden" name="id" value={assignment.id} />
                <input type="hidden" name="end_date" value={new Date().toISOString().slice(0, 10)} />
                <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                  Yerleşimi Sonlandır
                </button>
              </form>
            ) : null}
          </div>
          {assignment.note ? <p className="mt-4 text-sm text-muted-foreground">{assignment.note}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
