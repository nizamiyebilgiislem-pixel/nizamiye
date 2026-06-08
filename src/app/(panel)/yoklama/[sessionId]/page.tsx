import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { AttendanceRecordEditor } from "@/components/attendance/attendance-record-editor";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { attendanceTypeDescriptions, attendanceTypeLabels } from "@/lib/attendance/constants";
import { canManageAttendance } from "@/lib/attendance/permissions";
import { getAttendanceSessionDetail } from "@/lib/attendance/queries";
import { cn } from "@/lib/utils";

type AttendanceSessionDetailPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ success?: string; duplicate?: string }>;
};

export default async function AttendanceSessionDetailPage({ params, searchParams }: AttendanceSessionDetailPageProps) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const detail = await getAttendanceSessionDetail(profile, sessionId);

  if (!detail) {
    notFound();
  }

  const canEdit = canManageAttendance(profile);

  if (!canEdit) {
    redirect("/yoklama?error=unauthorized");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Yoklama Detayı"
          title={attendanceTypeLabels[detail.session.attendance_type]}
          description={attendanceTypeDescriptions[detail.session.attendance_type]}
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/yoklama" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Yoklama
          </Link>
          <Link href={`/yoklama/${detail.session.id}/duzenle`} className={cn(buttonVariants())}>
            <Pencil className="size-4" aria-hidden="true" />
            Düzenle
          </Link>
        </div>
      </div>

      {query.success ? <Feedback type="success" text="Yoklama güncellendi." /> : null}
      {query.duplicate ? <Feedback type="info" text="Bu yoklama zaten mevcut olduğu için mevcut kayda yönlendirildiniz." /> : null}

      <AttendanceRecordEditor detail={detail} canEdit={false} />
    </div>
  );
}

function Feedback({ type, text }: { type: "success" | "info"; text: string }) {
  return (
    <Card>
      <CardContent className={cn("px-4 py-3 text-sm", type === "success" ? "text-[#093657]" : "text-muted-foreground")}>{text}</CardContent>
    </Card>
  );
}
