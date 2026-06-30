import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AttendanceRecordEditor } from "@/components/attendance/attendance-record-editor";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canManageAttendance } from "@/lib/attendance/permissions";
import { getAttendanceSessionDetail } from "@/lib/attendance/queries";
import { cn } from "@/lib/utils";

type AttendanceSessionEditPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ success?: string; duplicate?: string }>;
};

export default async function AttendanceSessionEditPage({ params, searchParams }: AttendanceSessionEditPageProps) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const detail = await getAttendanceSessionDetail(profile, sessionId);

  if (!detail) {
    notFound();
  }

  if (!canManageAttendance(profile)) {
    redirect("/yoklama?error=unauthorized");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Yoklama Düzenle"
          title="Yoklama Kaydını Güncelle"
          description="Tarih, sınıf ve tür değişmez; yalnızca öğrenci durumları ve notlar düzenlenir."
        />
        <Link href={`/yoklama/${detail.session.id}`} className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Detaya Dön
        </Link>
      </div>

      <Card>
        <CardContent className="px-4 py-3 text-sm text-muted-foreground">
          Bu ekranda günlük ve namaz yoklamalarının öğrenci durumları ile notları güncellenir.
        </CardContent>
      </Card>

      {query.success ? (
        <Card>
          <CardContent className="px-4 py-3 text-sm text-[#093657]">
            Yoklama oluşturuldu. Talebeler aşağıda listelendi, doğrudan yoklama girebilirsiniz.
          </CardContent>
        </Card>
      ) : null}

      {query.duplicate ? (
        <Card>
          <CardContent className="px-4 py-3 text-sm text-muted-foreground">
            Aynı sınıf, tarih ve yoklama türü için mevcut oturum bulundu. Mevcut kayıt üzerinden devam edebilirsiniz.
          </CardContent>
        </Card>
      ) : null}

      <AttendanceRecordEditor detail={detail} canEdit />
    </div>
  );
}
