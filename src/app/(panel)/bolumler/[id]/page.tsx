import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { deleteDepartmentAction } from "@/lib/departments/actions";

import { ClassAccordionCard } from "@/components/classes/class-accordion-card";
import { DepartmentCourseManager } from "@/components/courses/department-course-manager";
import { DepartmentErrorMessage } from "@/components/departments/department-error-message";
import { DepartmentManagerCard } from "@/components/departments/department-manager-card";
import { ProgressMeter } from "@/components/departments/progress-meter";
import { PageHeader } from "@/components/layout/page-header";
import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { StudentMiniCard } from "@/components/students/student-mini-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAuth } from "@/lib/auth";
import { canViewDepartment } from "@/lib/classes/permissions";
import { DEPARTMENT_CAPACITY, getDepartmentAnalyticsById } from "@/lib/departments/analytics";
import { canManageDepartments } from "@/lib/departments/permissions";
import { cn } from "@/lib/utils";

type DepartmentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function DepartmentDetailPage({ params, searchParams }: DepartmentDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { profile } = await requireAuth();
  const department = await getDepartmentAnalyticsById(profile, id);

  if (!department) {
    notFound();
  }

  if (!canViewDepartment(profile, department.id)) {
    redirect("/bolumler?error=unauthorized");
  }

  const canEdit = canManageDepartments(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bölüm Yönetimi"
        title={department.name}
        description={department.description ?? "Bölüm açıklaması henüz girilmedi."}
        actions={canEdit ? <div className="flex gap-2"><Link href={`/bolumler/${department.id}/duzenle`} className={cn(buttonVariants())}><Pencil className="size-4" aria-hidden="true" />Düzenle</Link><form action={deleteDepartmentAction.bind(null, department.id) as unknown as (formData: FormData) => void}><FormSubmitButton variant="destructive" size="sm"><Trash2 className="mr-1.5 size-4" /> Sil</FormSubmitButton></form></div> : undefined}
      />

      <DepartmentErrorMessage error={query.error} />

      <div className="flex flex-wrap gap-2">
        <Link href={`/bolumler/${department.id}/pdf`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Bölüm Raporu PDF
        </Link>
        <Link href={`/raporlar/yoklama?departmentId=${department.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Bölüm Yoklama PDF
        </Link>
        <Link href={`/raporlar/donem-sonu?departmentId=${department.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Bölüm Başarı Raporu PDF
        </Link>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="bg-white">
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Bölüm Bilgi Kartı</CardTitle>
                <CardDescription>Doluluk, başarı ve aktif kayıt özeti.</CardDescription>
              </div>
              <Badge variant={department.is_active ? "default" : "outline"}>{department.is_active ? "Aktif" : "Pasif"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
            <Info label="Aktif sınıf" value={department.active_class_count} />
            <Info label="Aktif talebe" value={department.active_student_count} />
            <Info label="Hoca" value={department.teacher_count} />
            <Info label="Kapasite" value={DEPARTMENT_CAPACITY} />
            <div className="md:col-span-2">
              <ProgressMeter label={`${department.active_student_count}/120 doluluk`} value={department.occupancy_percent} />
            </div>
            <div className="md:col-span-2">
              <ProgressMeter label="Bölüm başarı ortalaması" value={department.success_average} muted="Henüz not verisi yok" />
            </div>
          </CardContent>
        </Card>

        <DepartmentManagerCard manager={department.department_manager} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeader
            eyebrow="Dersler"
            title="Bölüm Dersleri"
            description="Bölüme ait derslerin listesi ve yönetimi."
          />
        </div>
        <DepartmentCourseManager departmentId={department.id} profile={profile} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeader
            eyebrow="Sınıflar"
            title="Aktif Sınıflar"
            description="Bölümdeki sınıfların hoca, doluluk, başarı ve program durumu."
          />
          <Link href={`/siniflar?department=${department.id}`} className={cn(buttonVariants({ variant: "outline" }))}>
            Tüm Sınıflar
          </Link>
        </div>
        {department.classes.length > 0 ? (
          <div className="space-y-4">
            {department.classes.map((classRow) => (
              <ClassAccordionCard key={classRow.id} classRow={classRow} />
            ))}
          </div>
        ) : (
          <EmptyState title="Bu bölümde görüntülenecek sınıf bulunmuyor." />
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Son Eklenen Talebeler</CardTitle>
            <CardDescription>Bölümdeki en güncel aktif talebe kayıtları.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2">
            {department.latest_students.length > 0 ? (
              department.latest_students.map((student) => <StudentMiniCard key={student.id} student={student} />)
          ) : (
            <EmptyState title="Henüz aktif talebe kaydı yok." />
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Bölüm Hocaları</CardTitle>
            <CardDescription>Aktif hoca profilleri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {department.teachers.length > 0 ? (
              department.teachers.map((teacher) => <RichProfileCard key={teacher.id} profile={teacher} href={`/hocalar/${teacher.id}`} compact />)
            ) : (
              <EmptyState title="Bu bölümde aktif hoca bulunmuyor." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#093657]">{value}</p>
    </div>
  );
}


