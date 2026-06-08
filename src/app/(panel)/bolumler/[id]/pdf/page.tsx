import { notFound, redirect } from "next/navigation";

import { PrintableReportShell } from "@/components/reports/printable-report-shell";
import { RichProfileCard } from "@/components/profiles/rich-profile-card";
import { StudentMiniCard } from "@/components/students/student-mini-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { canViewDepartment } from "@/lib/classes/permissions";
import { DEPARTMENT_CAPACITY, getDepartmentAnalyticsById } from "@/lib/departments/analytics";
import { logPdfGenerated } from "@/lib/reports/actions";

export default async function DepartmentPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireAuth();
  const department = await getDepartmentAnalyticsById(profile, id);

  if (!department) {
    notFound();
  }

  if (!canViewDepartment(profile, department.id)) {
    redirect("/raporlar?error=unauthorized");
  }

  await logPdfGenerated(profile, {
    reportType: "department_report",
    entityType: "department",
    entityId: department.id,
    title: `${department.name} Bölüm Raporu PDF`,
    description: `${department.name} için bölüm raporu oluşturuldu.`,
  });

  return (
    <PrintableReportShell
      title="Bölüm Raporu"
      subtitle="Doluluk, başarı, sınıf ve öğretmen özetleri."
      backHref={`/bolumler/${department.id}`}
      meta={
        <>
          <Badge variant="outline">Müdür: {department.department_manager?.full_name ?? "-"}</Badge>
          <Badge variant="outline">Doluluk: {formatAverage(department.occupancy_percent)} / {DEPARTMENT_CAPACITY}</Badge>
          <Badge variant="outline">Aktif talebe: {department.active_student_count}</Badge>
        </>
      }
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2">
            <Info label="Aktif sınıf" value={department.active_class_count} />
            <Info label="Hoca" value={department.teacher_count} />
            <Info label="Başarı ortalaması" value={formatAverage(department.success_average)} />
            <Info label="Kapasite" value={DEPARTMENT_CAPACITY} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <RichProfileCard profile={department.department_manager} title="Bölüm müdürü" href={department.department_manager ? `/hocalar/${department.department_manager.id}` : undefined} compact showStatus showAuth />
            <div className="grid gap-2 sm:grid-cols-2">
              {department.teachers.slice(0, 4).map((teacher) => (
                <RichProfileCard key={teacher.id} profile={teacher} href={`/hocalar/${teacher.id}`} compact className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent" />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-4 p-4">
          <h2 className="text-base font-semibold text-[#093657]">Sınıf Özeti</h2>
          <div className="space-y-3">
            {department.classes.map((classRow) => (
              <div key={classRow.id} className="rounded-md border border-border bg-[#f8fafc] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#093657]">{classRow.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {classRow.active_student_count} talebe · {classRow.active_course_count} ders · {classRow.has_schedule ? "Program var" : "Program yok"}
                    </p>
                  </div>
                  <Badge variant={classRow.is_active ? "default" : "outline"}>{classRow.is_active ? "Aktif" : "Pasif"}</Badge>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <RichProfileCard
                    profile={classRow.class_teacher}
                    href={classRow.class_teacher ? `/hocalar/${classRow.class_teacher.id}` : undefined}
                    compact
                    className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                  />
                  <span className="self-start text-sm font-medium text-[#093657]">{formatAverage(classRow.success_average)} başarı</span>
                </div>
                {classRow.students.length > 0 ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {classRow.students.slice(0, 3).map((student) => (
                      <StudentMiniCard key={student.id} student={student} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PrintableReportShell>
  );
}

function Info({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-[#f8fafc] p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#093657]">{value}</p>
    </div>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "Veri yok" : value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
