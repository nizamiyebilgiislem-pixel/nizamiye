import Link from "next/link";
import type { ComponentType } from "react";
import { notFound, redirect } from "next/navigation";
import { BookOpen, CalendarDays, Pencil, UsersRound } from "lucide-react";

import { ClassCourseManager } from "@/components/classes/class-course-manager";
import { ClassErrorMessage } from "@/components/classes/class-error-message";
import { DepartmentManagerCard } from "@/components/departments/department-manager-card";
import { ProgressMeter } from "@/components/departments/progress-meter";
import { PageHeader } from "@/components/layout/page-header";
import { WeeklySchedulePreview } from "@/components/schedule/weekly-schedule-preview";
import { StudentCompactCard } from "@/components/students/student-compact-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canEditClass, canViewClass } from "@/lib/classes/permissions";
import { getClassAnalyticsById } from "@/lib/departments/analytics";
import { getEducationScheduleData, type EducationClassRow } from "@/lib/education/queries";
import { cn } from "@/lib/utils";

type ClassDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ClassDetailPage({ params, searchParams }: ClassDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const [classRow, scheduleData] = await Promise.all([getClassAnalyticsById(profile, id), getEducationScheduleData(profile, id)]);

  if (!classRow) {
    notFound();
  }

  if (!canViewClass(profile, classRow)) {
    redirect("/siniflar?error=unauthorized");
  }

  const scheduleClassRow: EducationClassRow = scheduleData?.classRow ?? {
    ...classRow,
    active_class_course_count: classRow.active_course_count,
    active_schedule_slot_count: scheduleData?.slots.length ?? 0,
    missing_teacher_count: classRow.courses.filter((course) => !course.teacher).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow={classRow.department?.name ?? "Sınıf"}
          title={classRow.name}
          description="Sınıfın hoca, doluluk, başarı, ders programı ve talebe yönetim özeti."
        />
        {canEditClass(profile, classRow) ? (
          <Link href={`/siniflar/${classRow.id}/duzenle`} className={cn(buttonVariants())}>
            <Pencil className="size-4" aria-hidden="true" />
            Düzenle
          </Link>
        ) : null}
      </div>

      <ClassErrorMessage error={query.error} />

      <div className="flex flex-wrap gap-2">
        <Link href={`/siniflar/${classRow.id}/pdf`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Sınıf Listesi PDF
        </Link>
        <Link href={`/siniflar/${classRow.id}/ders-programi-yazdir`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Ders Programı PDF
        </Link>
        <Link href={`/raporlar/yoklama?classId=${classRow.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Yoklama PDF
        </Link>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="bg-white">
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Sınıf Bilgi Kartı</CardTitle>
                <CardDescription>Aktif kayıtlar ve akademik durum.</CardDescription>
              </div>
              <Badge variant={classRow.is_active ? "default" : "outline"}>{classRow.is_active ? "Aktif" : "Pasif"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="Aktif talebe" value={classRow.active_student_count} icon={UsersRound} />
            <Stat label="Ders sayısı" value={classRow.active_course_count} icon={BookOpen} />
            <Stat label="Program" value={classRow.has_schedule ? "Var" : "Yok"} icon={CalendarDays} />
            <Stat label="Bölüm" value={classRow.department?.name ?? "-"} icon={BookOpen} />
            <div className="md:col-span-2">
              <ProgressMeter label="Sınıf doluluk oranı" value={classRow.occupancy_percent} />
            </div>
            <div className="md:col-span-2">
              <ProgressMeter label="Sınıf başarı ortalaması" value={classRow.success_average} muted="Henüz not verisi yok" />
            </div>
          </CardContent>
        </Card>

        <DepartmentManagerCard manager={classRow.class_teacher} title="Sınıf Hocası" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ClassCourseManager classId={classRow.id} profile={profile} />

        <WeeklySchedulePreview
          classRow={scheduleClassRow}
          slots={scheduleData?.slots ?? []}
          scheduleHref={`/egitim-planlama/ders-programi/${classRow.id}`}
          printHref={`/siniflar/${classRow.id}/ders-programi-yazdir`}
        />
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Sınıftaki Aktif Talebeler</CardTitle>
          <CardDescription>Profil kartlarıyla hızlı öğrenci görünümü.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {classRow.students.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {classRow.students.map((student) => (
                <StudentCompactCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Bu sınıfta aktif talebe bulunmuyor.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="size-4 text-[#093657]" aria-hidden />
      </div>
      <p className="mt-2 truncate text-xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}
